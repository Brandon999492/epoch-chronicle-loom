import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface GeneratedScene {
  sceneNumber: number;
  title: string;
  duration: number;
  narration: string;
  visualDescription: string;
  onScreenText?: string;
  imageUrl?: string;
}

export interface VideoPlayerHandle {
  getCanvas: () => HTMLCanvasElement | null;
  isPlaying: () => boolean;
  play: () => void;
  pause: () => void;
}

interface VideoPlayerProps {
  scenes: GeneratedScene[];
  title: string;
  includeSubtitles?: boolean;
  includeNarration?: boolean;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ scenes, title, includeSubtitles = true, includeNarration = true }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [sceneProgress, setSceneProgress] = useState(0);
    const [muted, setMuted] = useState(false);
    const animFrameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const loadedImagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const narrationStartedRef = useRef<Set<number>>(new Set());

    const totalDuration = scenes.reduce((a, s) => a + s.duration, 0);
    const currentScene = scenes[currentSceneIndex];

    // Preload images
    useEffect(() => {
      scenes.forEach((scene, i) => {
        if (scene.imageUrl && !loadedImagesRef.current.has(i)) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = scene.imageUrl;
          img.onload = () => loadedImagesRef.current.set(i, img);
        }
      });
    }, [scenes]);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      isPlaying: () => playing,
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
    }));

    const speakNarration = useCallback((text: string) => {
      if (!includeNarration || muted) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      utter.pitch = 1;
      utter.volume = 1;
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) 
        || voices.find(v => v.lang.startsWith("en"));
      if (preferred) utter.voice = preferred;
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    }, [includeNarration, muted]);

    const drawFrame = useCallback((timestamp: number) => {
      if (!canvasRef.current || scenes.length === 0) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      const canvas = canvasRef.current;
      const w = canvas.width;
      const h = canvas.height;

      if (startTimeRef.current === 0) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;

      // Calculate which scene we're in
      let accum = 0;
      let sceneIdx = 0;
      let sceneElapsed = 0;
      for (let i = 0; i < scenes.length; i++) {
        if (elapsed < accum + scenes[i].duration) {
          sceneIdx = i;
          sceneElapsed = elapsed - accum;
          break;
        }
        accum += scenes[i].duration;
        if (i === scenes.length - 1) {
          sceneIdx = i;
          sceneElapsed = scenes[i].duration;
        }
      }

      if (sceneIdx !== currentSceneIndex) {
        setCurrentSceneIndex(sceneIdx);
      }
      const scene = scenes[sceneIdx];
      const progress = Math.min(sceneElapsed / scene.duration, 1);
      setSceneProgress(progress * 100);

      // Trigger narration for new scenes
      if (!narrationStartedRef.current.has(sceneIdx)) {
        narrationStartedRef.current.add(sceneIdx);
        speakNarration(scene.narration);
      }

      // Draw background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);

      // Draw scene image with Ken Burns effect
      const img = loadedImagesRef.current.get(sceneIdx);
      if (img) {
        const scale = 1 + progress * 0.08; // Slow zoom
        const panX = progress * 30 * (sceneIdx % 2 === 0 ? 1 : -1);
        const panY = progress * 15 * (sceneIdx % 3 === 0 ? 1 : -1);

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        ctx.translate(-w / 2 + panX, -h / 2 + panY);

        const imgAspect = img.width / img.height;
        const canvasAspect = w / h;
        let drawW = w, drawH = h, drawX = 0, drawY = 0;
        if (imgAspect > canvasAspect) {
          drawH = h;
          drawW = h * imgAspect;
          drawX = (w - drawW) / 2;
        } else {
          drawW = w;
          drawH = w / imgAspect;
          drawY = (h - drawH) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Fade in effect for scene transitions
        if (sceneElapsed < 0.5) {
          ctx.fillStyle = `rgba(10, 10, 10, ${1 - sceneElapsed * 2})`;
          ctx.fillRect(0, 0, w, h);
        }
      } else {
        // No image — draw placeholder
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ffffff30";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(scene.title, w / 2, h / 2);
      }

      // Draw dark gradient overlay at bottom for text
      const grad = ctx.createLinearGradient(0, h * 0.55, 0, h);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.5, "rgba(0,0,0,0.5)");
      grad.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, h * 0.55, w, h * 0.45);

      // Scene badge top-left
      ctx.fillStyle = "rgba(200, 170, 100, 0.9)";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Scene ${scene.sceneNumber} — ${scene.title}`, 20, 30);

      // AI label top-right
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("AI Historical Reconstruction", w - 20, 25);

      // Subtitles
      if (includeSubtitles && scene.narration) {
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        const maxWidth = w - 80;
        const words = scene.narration.split(" ");
        const lines: string[] = [];
        let currentLine = "";
        ctx.font = "16px sans-serif";
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

        // Show a sliding window of lines based on progress
        const totalLines = lines.length;
        const visibleLines = 3;
        const startLine = Math.min(
          Math.floor(progress * Math.max(totalLines - visibleLines + 1, 1)),
          Math.max(totalLines - visibleLines, 0)
        );
        const displayLines = lines.slice(startLine, startLine + visibleLines);

        const lineHeight = 22;
        const textY = h - 30 - (displayLines.length - 1) * lineHeight;

        // Subtitle background
        const bgY = textY - 18;
        const bgH = displayLines.length * lineHeight + 12;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        const bgW = Math.min(maxWidth + 30, w - 40);
        ctx.fillRect((w - bgW) / 2, bgY, bgW, bgH);

        ctx.fillStyle = "#ffffff";
        ctx.font = "16px sans-serif";
        displayLines.forEach((line, i) => {
          ctx.fillText(line, w / 2, textY + i * lineHeight);
        });
      }

      // On-screen text overlay
      if (scene.onScreenText && progress > 0.2 && progress < 0.8) {
        const alpha = progress < 0.3 ? (progress - 0.2) * 10 : progress > 0.7 ? (0.8 - progress) * 10 : 1;
        ctx.fillStyle = `rgba(200, 170, 100, ${alpha * 0.9})`;
        ctx.font = "italic 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`"${scene.onScreenText}"`, w / 2, h * 0.5);
      }

      // Scene progress bar at the very bottom
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(0, h - 4, w, 4);
      ctx.fillStyle = "rgba(200, 170, 100, 0.8)";
      ctx.fillRect(0, h - 4, w * progress, 4);

      // Check if video ended
      if (elapsed >= totalDuration) {
        setPlaying(false);
        startTimeRef.current = 0;
        narrationStartedRef.current.clear();
        window.speechSynthesis.cancel();
        return;
      }

      animFrameRef.current = requestAnimationFrame(drawFrame);
    }, [scenes, currentSceneIndex, includeSubtitles, speakNarration, totalDuration]);

    useEffect(() => {
      if (playing) {
        if (startTimeRef.current === 0) {
          narrationStartedRef.current.clear();
        }
        animFrameRef.current = requestAnimationFrame(drawFrame);
      } else {
        cancelAnimationFrame(animFrameRef.current);
        window.speechSynthesis.cancel();
      }
      return () => {
        cancelAnimationFrame(animFrameRef.current);
      };
    }, [playing, drawFrame]);

    // Draw initial frame
    useEffect(() => {
      if (!playing && canvasRef.current && scenes.length > 0) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = loadedImagesRef.current.get(0);
        if (img) {
          const imgAspect = img.width / img.height;
          const canvasAspect = canvas.width / canvas.height;
          let dw = canvas.width, dh = canvas.height, dx = 0, dy = 0;
          if (imgAspect > canvasAspect) { dh = canvas.height; dw = canvas.height * imgAspect; dx = (canvas.width - dw) / 2; }
          else { dw = canvas.width; dh = canvas.width / imgAspect; dy = (canvas.height - dh) / 2; }
          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = "rgba(200,170,100,0.8)";
        ctx.font = "14px sans-serif";
        ctx.fillText("Press Play to start", canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "10px sans-serif";
        ctx.fillText("AI Historical Reconstruction", canvas.width / 2, canvas.height / 2 + 45);
      }
    }, [scenes, playing, title]);

    const jumpToScene = (idx: number) => {
      if (idx < 0 || idx >= scenes.length) return;
      const accum = scenes.slice(0, idx).reduce((a, s) => a + s.duration, 0);
      startTimeRef.current = performance.now() - accum * 1000;
      narrationStartedRef.current.clear();
      for (let i = 0; i < idx; i++) narrationStartedRef.current.add(i);
      setCurrentSceneIndex(idx);
      window.speechSynthesis.cancel();
    };

    const togglePlay = () => {
      if (!playing) {
        startTimeRef.current = 0;
        narrationStartedRef.current.clear();
      }
      setPlaying(!playing);
    };

    const overallProgress = (() => {
      const beforeCurrent = scenes.slice(0, currentSceneIndex).reduce((a, s) => a + s.duration, 0);
      const currentContrib = (sceneProgress / 100) * (currentScene?.duration || 0);
      return totalDuration > 0 ? ((beforeCurrent + currentContrib) / totalDuration) * 100 : 0;
    })();

    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden border border-border/50 bg-black">
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className="w-full h-auto"
            style={{ aspectRatio: "16/9" }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => jumpToScene(currentSceneIndex - 1)} disabled={currentSceneIndex === 0}>
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-8 w-8 p-0" onClick={togglePlay}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => jumpToScene(currentSceneIndex + 1)} disabled={currentSceneIndex >= scenes.length - 1}>
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setMuted(!muted)}>
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>
          <div className="flex-1">
            <Progress value={overallProgress} className="h-1.5" />
          </div>
          <Badge variant="outline" className="text-[9px] shrink-0">
            {currentSceneIndex + 1}/{scenes.length}
          </Badge>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
