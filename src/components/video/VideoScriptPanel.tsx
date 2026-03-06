import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clapperboard, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export interface VideoScene {
  sceneNumber: number;
  title: string;
  duration: number;
  narration: string;
  visualDescription: string;
  cameraDirection: string;
  musicMood: string;
  onScreenText?: string;
}

export interface VideoScript {
  title: string;
  synopsis: string;
  era: string;
  category: string;
  scenes: VideoScene[];
  totalDuration: number;
  suggestedMusic: string;
  historicalSources: string[];
}

interface VideoScriptPanelProps {
  onScriptGenerated: (script: VideoScript) => void;
}

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
  { value: "600", label: "10 minutes" },
  { value: "900", label: "15 minutes" },
  { value: "1800", label: "30 minutes (Documentary)" },
];

const ADVANCED_MODES = [
  { value: "standard", label: "Standard Script" },
  { value: "deep-analysis", label: "🔬 Deep Historical Analysis" },
  { value: "quick-summary", label: "⚡ Quick Summary" },
  { value: "battle-strategy", label: "🗡️ Battle Strategy Visualization" },
  { value: "map-evolution", label: "🗺️ Map Evolution" },
  { value: "royal-lineage", label: "👑 Royal Family Lineage Animation" },
];

export function VideoScriptPanel({ onScriptGenerated }: VideoScriptPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("documentary");
  const [duration, setDuration] = useState("60");
  const [advancedMode, setAdvancedMode] = useState("standard");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a historical topic");
      return;
    }

    setGenerating(true);
    setProgress(10);

    // Simulate progress while waiting for AI
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 8, 85));
    }, 500);

    try {
      const { data, error } = await supabase.functions.invoke("history-video-script", {
        body: {
          prompt: prompt.trim(),
          style,
          duration: parseInt(duration),
          advancedMode,
        },
      });

      clearInterval(progressInterval);
      setProgress(95);

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.script) {
        setProgress(100);
        onScriptGenerated(data.script);
        toast.success("Script generated successfully!");

        // Autosave draft to localStorage
        try {
          localStorage.setItem("video-draft-script", JSON.stringify(data.script));
        } catch { /* ignore */ }
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      toast.error("Failed to generate script. Please try again.");
    } finally {
      setGenerating(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clapperboard className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-semibold">Script Generator</h2>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Historical Topic</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. The Fall of Constantinople in 1453, the siege tactics, key figures, and aftermath..."
            className="min-h-[100px] text-sm bg-secondary/30 border-border/50"
            maxLength={5000}
          />
          <p className="text-[10px] text-muted-foreground text-right">{prompt.length}/5000</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px]">Video Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Target Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Mode */}
        <div className="space-y-1">
          <Label className="text-[10px]">Advanced Mode</Label>
          <Select value={advancedMode} onValueChange={setAdvancedMode}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADVANCED_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Progress bar */}
        {generating && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-[10px] text-muted-foreground text-center">
              {progress < 30 ? "Analyzing historical context..." :
               progress < 60 ? "Building scene structure..." :
               progress < 85 ? "Generating narration & visuals..." :
               "Finalizing script..."}
            </p>
          </div>
        )}

        <Button
          className="w-full gap-2"
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating Script...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate AI Script</>
          )}
        </Button>

        {advancedMode !== "standard" && (
          <Badge variant="secondary" className="text-[10px] w-full justify-center">
            {ADVANCED_MODES.find(m => m.value === advancedMode)?.label}
          </Badge>
        )}
      </div>
    </div>
  );
}
