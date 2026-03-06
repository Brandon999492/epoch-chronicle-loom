import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Film, Sparkles, Loader2, ImageIcon, Mic, FileVideo, PenLine } from "lucide-react";
import type { VideoScript, VideoScene } from "./VideoScriptPanel";
import type { GeneratedScene } from "./VideoPlayer";

export type PipelineStage = "idle" | "writing-script" | "generating-scenes" | "creating-visuals" | "recording-narration" | "ready";

const STAGE_LABELS: Record<PipelineStage, string> = {
  idle: "Ready",
  "writing-script": "Writing Script...",
  "generating-scenes": "Generating Scenes...",
  "creating-visuals": "Creating Visuals...",
  "recording-narration": "Preparing Narration...",
  ready: "Video Ready!",
};

const STAGE_ICONS: Record<PipelineStage, React.ReactNode> = {
  idle: <Film className="h-4 w-4" />,
  "writing-script": <PenLine className="h-4 w-4 animate-pulse" />,
  "generating-scenes": <Sparkles className="h-4 w-4 animate-pulse" />,
  "creating-visuals": <ImageIcon className="h-4 w-4 animate-pulse" />,
  "recording-narration": <Mic className="h-4 w-4 animate-pulse" />,
  ready: <FileVideo className="h-4 w-4 text-green-400" />,
};

const STYLE_OPTIONS = [
  { value: "documentary", label: "📽️ Documentary" },
  { value: "battle", label: "⚔️ Battle Reconstruction" },
  { value: "timeline", label: "📅 Timeline Animation" },
  { value: "biography", label: "👤 Historical Biography" },
  { value: "reconstruction", label: "🏛️ 3D Reconstruction" },
];

const DURATION_OPTIONS = [
  { value: "30", label: "30 seconds" },
  { value: "60", label: "1 minute" },
  { value: "120", label: "2 minutes" },
  { value: "180", label: "3 minutes" },
  { value: "300", label: "5 minutes" },
];

interface VideoGenerationPipelineProps {
  onVideoReady: (script: VideoScript, scenes: GeneratedScene[]) => void;
  onStageChange?: (stage: PipelineStage) => void;
}

export function VideoGenerationPipeline({ onVideoReady, onStageChange }: VideoGenerationPipelineProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("documentary");
  const [duration, setDuration] = useState("60");
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [progress, setProgress] = useState(0);
  const [currentDetail, setCurrentDetail] = useState("");

  const updateStage = (s: PipelineStage) => {
    setStage(s);
    onStageChange?.(s);
  };

  const generateVideo = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a historical topic");
      return;
    }

    try {
      // Stage 1: Write Script
      updateStage("writing-script");
      setProgress(5);
      setCurrentDetail("Analyzing historical context and writing script...");

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("You must be signed in.");
        updateStage("idle");
        return;
      }

      const scriptResp = await supabase.functions.invoke("history-video-script", {
        body: { prompt: prompt.trim(), style, duration: parseInt(duration), advancedMode: "standard" },
      });

      if (scriptResp.error || scriptResp.data?.error) {
        throw new Error(scriptResp.data?.error || "Script generation failed");
      }

      const script: VideoScript = scriptResp.data.script;
      if (!script?.scenes?.length) throw new Error("Invalid script generated");

      setProgress(25);
      setCurrentDetail(`Script ready: "${script.title}" — ${script.scenes.length} scenes`);

      // Stage 2: Generate Scenes (structure already done)
      updateStage("generating-scenes");
      setProgress(30);
      setCurrentDetail("Scene breakdown complete. Preparing visuals...");

      // Stage 3: Create Visuals — generate AI images for each scene
      updateStage("creating-visuals");
      const generatedScenes: GeneratedScene[] = [];
      const totalScenes = script.scenes.length;

      for (let i = 0; i < totalScenes; i++) {
        const scene = script.scenes[i];
        setCurrentDetail(`Generating image for Scene ${i + 1}: ${scene.title}...`);
        setProgress(35 + (i / totalScenes) * 45);

        let imageUrl: string | undefined;
        try {
          const imgResp = await supabase.functions.invoke("video-scene-image", {
            body: {
              visualDescription: scene.visualDescription,
              sceneTitle: scene.title,
              era: script.era,
              style: script.category,
            },
          });

          if (imgResp.data?.imageUrl) {
            imageUrl = imgResp.data.imageUrl;
          }
        } catch (imgErr) {
          console.warn(`Failed to generate image for scene ${i + 1}:`, imgErr);
          // Continue without image
        }

        generatedScenes.push({
          sceneNumber: scene.sceneNumber,
          title: scene.title,
          duration: scene.duration,
          narration: scene.narration,
          visualDescription: scene.visualDescription,
          onScreenText: scene.onScreenText,
          imageUrl,
        });
      }

      // Stage 4: Prepare narration (browser TTS — just flag ready)
      updateStage("recording-narration");
      setProgress(85);
      setCurrentDetail("Narration engine ready (Browser TTS)");

      // Small delay for UX
      await new Promise(r => setTimeout(r, 500));

      // Done
      setProgress(100);
      setCurrentDetail("Video ready for playback!");
      updateStage("ready");

      onVideoReady(script, generatedScenes);

      // Autosave draft
      try {
        localStorage.setItem("video-draft-script", JSON.stringify(script));
      } catch { /* ignore */ }

      toast.success("Historical video generated successfully!");
    } catch (err: any) {
      console.error("Pipeline error:", err);
      toast.error(err.message || "Video generation failed. Please try again.");
      updateStage("idle");
      setProgress(0);
      setCurrentDetail("");
    }
  }, [prompt, style, duration, onVideoReady]);

  const isGenerating = stage !== "idle" && stage !== "ready";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Film className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-semibold">AI Video Generator</h2>
        <Badge variant="secondary" className="text-[10px]">Full Pipeline</Badge>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Historical Topic</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. The Battle of Hastings 1066 — the Norman conquest, key figures like William the Conqueror and Harold Godwinson, and its lasting impact..."
            className="min-h-[100px] text-sm bg-secondary/30 border-border/50"
            maxLength={5000}
            disabled={isGenerating}
          />
          <p className="text-[10px] text-muted-foreground text-right">{prompt.length}/5000</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px]">Video Style</Label>
            <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Target Duration</Label>
            <Select value={duration} onValueChange={setDuration} disabled={isGenerating}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress stages */}
        {stage !== "idle" && (
          <div className="space-y-2 p-3 rounded-lg bg-secondary/20 border border-border/30">
            <div className="flex items-center gap-2">
              {STAGE_ICONS[stage]}
              <span className="text-sm font-medium">{STAGE_LABELS[stage]}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-[10px] text-muted-foreground">{currentDetail}</p>

            {/* Stage indicators */}
            <div className="flex gap-1 mt-1">
              {(["writing-script", "generating-scenes", "creating-visuals", "recording-narration", "ready"] as PipelineStage[]).map((s) => {
                const stageOrder = ["writing-script", "generating-scenes", "creating-visuals", "recording-narration", "ready"];
                const currentOrder = stageOrder.indexOf(stage);
                const thisOrder = stageOrder.indexOf(s);
                const isDone = thisOrder < currentOrder || stage === "ready";
                const isCurrent = s === stage;
                return (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      isDone ? "bg-green-500" : isCurrent ? "bg-primary animate-pulse" : "bg-muted"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        <Button
          className="w-full gap-2 h-11 text-sm font-semibold"
          onClick={generateVideo}
          disabled={isGenerating || !prompt.trim()}
          size="lg"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating Video...</>
          ) : (
            <><Film className="h-4 w-4" /> Generate Historical Video</>
          )}
        </Button>
      </div>
    </div>
  );
}
