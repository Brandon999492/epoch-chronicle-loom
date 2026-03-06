import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, FileVideo } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedScene } from "./VideoPlayer";

interface VideoExporterProps {
  scenes: GeneratedScene[];
  title: string;
  includeSubtitles: boolean;
}

export function VideoExporter({ scenes, title, includeSubtitles }: VideoExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportVideo = useCallback(async () => {
    if (scenes.length === 0) return;
    setExporting(true);
    setProgress(0);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d")!;

      // Load all images first
      const loadedImages = new Map<number, HTMLImageElement>();
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        if (scene.imageUrl) {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Continue even if image fails
              img.src = scene.imageUrl!;
            });
            if (img.complete && img.naturalWidth > 0) {
              loadedImages.set(i, img);
            }
          } catch { /* continue */ }
        }
      }

      setProgress(10);

      // Set up MediaRecorder
      const stream = canvas.captureStream(24);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 4000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const totalDuration = scenes.reduce((a, s) => a + s.duration, 0);
      const fps = 24;
      const totalFrames = totalDuration * fps;
      let frameCount = 0;

      recorder.start(100); // Collect data every 100ms

      // Render frames
      const renderFrame = (): Promise<void> => {
        return new Promise((resolve) => {
          const currentTime = frameCount / fps;
          const w = canvas.width;
          const h = canvas.height;

          // Find current scene
          let accum = 0;
          let sceneIdx = 0;
          let sceneElapsed = 0;
          for (let i = 0; i < scenes.length; i++) {
            if (currentTime < accum + scenes[i].duration) {
              sceneIdx = i;
              sceneElapsed = currentTime - accum;
              break;
            }
            accum += scenes[i].duration;
            if (i === scenes.length - 1) {
              sceneIdx = i;
              sceneElapsed = scenes[i].duration;
            }
          }

          const scene = scenes[sceneIdx];
          const sceneProgress = Math.min(sceneElapsed / scene.duration, 1);

          // Background
          ctx.fillStyle = "#0a0a0a";
          ctx.fillRect(0, 0, w, h);

          // Image with Ken Burns
          const img = loadedImages.get(sceneIdx);
          if (img) {
            const scale = 1 + sceneProgress * 0.08;
            const panX = sceneProgress * 30 * (sceneIdx % 2 === 0 ? 1 : -1);
            const panY = sceneProgress * 15;

            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.scale(scale, scale);
            ctx.translate(-w / 2 + panX, -h / 2 + panY);

            const imgAspect = img.width / img.height;
            const canvasAspect = w / h;
            let dw = w, dh = h, dx = 0, dy = 0;
            if (imgAspect > canvasAspect) { dh = h; dw = h * imgAspect; dx = (w - dw) / 2; }
            else { dw = w; dh = w / imgAspect; dy = (h - dh) / 2; }
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();

            if (sceneElapsed < 0.5) {
              ctx.fillStyle = `rgba(10, 10, 10, ${1 - sceneElapsed * 2})`;
              ctx.fillRect(0, 0, w, h);
            }
          } else {
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(0, 0, w, h);
          }

          // Bottom gradient
          const grad = ctx.createLinearGradient(0, h * 0.55, 0, h);
          grad.addColorStop(0, "rgba(0,0,0,0)");
          grad.addColorStop(0.5, "rgba(0,0,0,0.5)");
          grad.addColorStop(1, "rgba(0,0,0,0.85)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, h * 0.55, w, h * 0.45);

          // Scene label
          ctx.fillStyle = "rgba(200, 170, 100, 0.9)";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`Scene ${scene.sceneNumber} — ${scene.title}`, 30, 40);

          // AI label
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText("AI Historical Reconstruction", w - 30, 35);

          // Subtitles
          if (includeSubtitles && scene.narration) {
            ctx.textAlign = "center";
            ctx.font = "18px sans-serif";
            const maxWidth = w - 100;
            const words = scene.narration.split(" ");
            const lines: string[] = [];
            let currentLine = "";
            for (const word of words) {
              const test = currentLine + (currentLine ? " " : "") + word;
              if (ctx.measureText(test).width > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = test;
              }
            }
            if (currentLine) lines.push(currentLine);

            const visibleLines = 3;
            const startLine = Math.min(
              Math.floor(sceneProgress * Math.max(lines.length - visibleLines + 1, 1)),
              Math.max(lines.length - visibleLines, 0)
            );
            const displayLines = lines.slice(startLine, startLine + visibleLines);

            const lineHeight = 24;
            const textY = h - 40 - (displayLines.length - 1) * lineHeight;
            const bgW = Math.min(maxWidth + 40, w - 60);
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect((w - bgW) / 2, textY - 20, bgW, displayLines.length * lineHeight + 16);

            ctx.fillStyle = "#ffffff";
            displayLines.forEach((line, i) => {
              ctx.fillText(line, w / 2, textY + i * lineHeight);
            });
          }

          // Progress bar
          ctx.fillStyle = "rgba(255,255,255,0.1)";
          ctx.fillRect(0, h - 4, w, 4);
          ctx.fillStyle = "rgba(200, 170, 100, 0.8)";
          ctx.fillRect(0, h - 4, w * (currentTime / totalDuration), 4);

          frameCount++;
          setProgress(10 + (frameCount / totalFrames) * 85);

          if (frameCount >= totalFrames) {
            resolve();
          } else {
            // Use requestAnimationFrame for smoother rendering, with a small delay
            setTimeout(() => resolve(), 1);
          }
        });
      };

      // Render all frames
      while (frameCount < totalFrames) {
        await renderFrame();
      }

      // Stop recording
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      setProgress(98);

      // Create download
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-historical-video.webm`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      toast.success("Video exported successfully!");
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Failed to export video. Please try again.");
    } finally {
      setTimeout(() => {
        setExporting(false);
        setProgress(0);
      }, 1000);
    }
  }, [scenes, title, includeSubtitles]);

  return (
    <div className="space-y-2">
      {exporting && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-[10px] text-muted-foreground text-center">
            {progress < 10 ? "Loading images..." :
             progress < 95 ? `Rendering frames... ${Math.round(progress)}%` :
             "Finalizing..."}
          </p>
        </div>
      )}
      <Button
        className="w-full gap-2"
        variant="outline"
        onClick={exportVideo}
        disabled={exporting || scenes.length === 0}
      >
        {exporting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Rendering Video...</>
        ) : (
          <><Download className="h-4 w-4" /> Export Video (WebM)</>
        )}
      </Button>
      <p className="text-[9px] text-muted-foreground text-center">
        Renders at 1280×720 @ 24fps using Canvas + MediaRecorder
      </p>
    </div>
  );
}
