import { useState } from "react";
import type { VideoScript, VideoScene } from "./VideoScriptPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Film, Clock, Camera, Music, Type, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";

interface VideoSceneBuilderProps {
  script: VideoScript;
  onUpdateScript: (script: VideoScript) => void;
}

export function VideoSceneBuilder({ script, onUpdateScript }: VideoSceneBuilderProps) {
  const [expandedScene, setExpandedScene] = useState<number | null>(0);
  const [editingScene, setEditingScene] = useState<number | null>(null);

  const updateScene = (index: number, updates: Partial<VideoScene>) => {
    const newScenes = [...script.scenes];
    newScenes[index] = { ...newScenes[index], ...updates };
    onUpdateScript({ ...script, scenes: newScenes });
  };

  const deleteScene = (index: number) => {
    const newScenes = script.scenes.filter((_, i) => i !== index).map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    onUpdateScript({ ...script, scenes: newScenes, totalDuration: newScenes.reduce((a, s) => a + s.duration, 0) });
  };

  const cameraIcons: Record<string, string> = {
    "slow zoom": "🔍",
    "pan left": "⬅️",
    "pan right": "➡️",
    "aerial view": "🦅",
    "static": "📷",
    "tracking shot": "🎯",
  };

  const musicIcons: Record<string, string> = {
    dramatic: "🎭",
    solemn: "🕯️",
    triumphant: "🏆",
    mysterious: "🌙",
    peaceful: "🕊️",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-semibold">Scene Builder</h2>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {script.scenes.length} scenes · {script.totalDuration}s
        </Badge>
      </div>

      <div className="bg-secondary/20 rounded-lg p-3 border border-border/30">
        <h3 className="font-semibold text-sm">{script.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{script.synopsis}</p>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="text-[10px]">{script.era}</Badge>
          <Badge variant="secondary" className="text-[10px]">{script.category}</Badge>
          {script.suggestedMusic && (
            <Badge variant="outline" className="text-[10px]">🎵 {script.suggestedMusic}</Badge>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {script.scenes.map((scene, i) => (
          <div key={i} className="border border-border/40 rounded-lg overflow-hidden bg-card/50">
            <button
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors text-left"
              onClick={() => setExpandedScene(expandedScene === i ? null : i)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {String(scene.sceneNumber).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium truncate">{scene.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {scene.duration}s
                </span>
                {expandedScene === i ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
            </button>

            {expandedScene === i && (
              <div className="px-3 pb-3 space-y-2 border-t border-border/20 pt-2">
                {editingScene === i ? (
                  <div className="space-y-2">
                    <Input
                      value={scene.title}
                      onChange={(e) => updateScene(i, { title: e.target.value })}
                      className="text-xs h-8"
                      placeholder="Scene title"
                    />
                    <Textarea
                      value={scene.narration}
                      onChange={(e) => updateScene(i, { narration: e.target.value })}
                      className="text-xs min-h-[60px]"
                      placeholder="Narration text"
                    />
                    <Textarea
                      value={scene.visualDescription}
                      onChange={(e) => updateScene(i, { visualDescription: e.target.value })}
                      className="text-xs min-h-[40px]"
                      placeholder="Visual description"
                    />
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditingScene(null)}>
                      Done Editing
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Narration</p>
                      <p className="text-xs leading-relaxed">{scene.narration}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Visual</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{scene.visualDescription}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] flex items-center gap-1">
                        <Camera className="h-3 w-3" /> {cameraIcons[scene.cameraDirection] || "📷"} {scene.cameraDirection}
                      </span>
                      <span className="text-[10px] flex items-center gap-1">
                        <Music className="h-3 w-3" /> {musicIcons[scene.musicMood] || "🎵"} {scene.musicMood}
                      </span>
                      {scene.onScreenText && (
                        <span className="text-[10px] flex items-center gap-1">
                          <Type className="h-3 w-3" /> "{scene.onScreenText}"
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditingScene(i)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={() => deleteScene(i)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {script.historicalSources?.length > 0 && (
        <div className="bg-muted/30 rounded-md p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sources</p>
          <ul className="text-[10px] text-muted-foreground space-y-0.5">
            {script.historicalSources.map((src, i) => (
              <li key={i}>• {src}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
