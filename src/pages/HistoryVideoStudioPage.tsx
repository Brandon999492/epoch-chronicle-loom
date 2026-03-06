import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { VideoScript } from "@/components/video/VideoScriptPanel";
import { VideoSceneBuilder } from "@/components/video/VideoSceneBuilder";
import { VideoSettingsPanel, type VideoSettings } from "@/components/video/VideoSettingsPanel";
import { VideoGallery } from "@/components/video/VideoGallery";
import { VideoGenerationPipeline, type PipelineStage } from "@/components/video/VideoGenerationPipeline";
import { VideoPlayer, type GeneratedScene, type VideoPlayerHandle } from "@/components/video/VideoPlayer";
import { VideoExporter } from "@/components/video/VideoExporter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Save, Download, Archive, Clapperboard, Film, Sparkles,
  PenLine, BookmarkPlus, RefreshCw
} from "lucide-react";

const DEFAULT_SETTINGS: VideoSettings = {
  resolution: "1080p",
  frameRate: "24",
  cinematicStyle: "documentary",
  cameraEffect: "auto",
  includeSubtitles: true,
  includeNarration: true,
  includeMusic: true,
};

export default function HistoryVideoStudioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [script, setScript] = useState<VideoScript | null>(null);
  const [generatedScenes, setGeneratedScenes] = useState<GeneratedScene[]>([]);
  const [settings, setSettings] = useState<VideoSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const playerRef = useRef<VideoPlayerHandle>(null);

  // Load autosaved draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem("video-draft-script");
      if (draft && !script) {
        const parsed = JSON.parse(draft);
        if (parsed?.title && parsed?.scenes) setScript(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <Clapperboard className="h-16 w-16 text-primary/30 mx-auto" />
            <h1 className="text-2xl font-display font-bold">History Video AI Studio</h1>
            <p className="text-muted-foreground">Sign in to create AI-powered historical videos</p>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleVideoReady = (newScript: VideoScript, scenes: GeneratedScene[]) => {
    setScript(newScript);
    setGeneratedScenes(scenes);
  };

  const handleSaveProject = async () => {
    if (!script) return;
    setSaving(true);
    const { error } = await supabase.from("user_videos").insert({
      user_id: user.id,
      title: script.title,
      prompt: script.synopsis,
      script: JSON.stringify(script),
      scenes: script.scenes as any,
      style: script.category,
      duration_seconds: script.totalDuration,
      resolution: settings.resolution,
      status: generatedScenes.length > 0 ? "completed" : "draft",
      era: script.era,
      category: script.category,
    });
    if (error) toast.error("Failed to save project");
    else toast.success("Project saved to your gallery!");
    setSaving(false);
  };

  const handleExportScript = () => {
    if (!script) return;
    const blob = new Blob([JSON.stringify(script, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.title.replace(/\s+/g, "-").toLowerCase()}-script.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Script exported");
  };

  const handleSaveToJournal = async () => {
    if (!script) return;
    const content = `# ${script.title}\n\n**Synopsis:** ${script.synopsis}\n\n**Era:** ${script.era}\n**Category:** ${script.category}\n**Duration:** ${script.totalDuration}s\n\n---\n\n${script.scenes.map(s =>
      `### Scene ${s.sceneNumber}: ${s.title}\n\n**Narration:** ${s.narration}\n\n**Visuals:** ${s.visualDescription}\n\n**Camera:** ${s.cameraDirection} | **Music:** ${s.musicMood}${s.onScreenText ? `\n\n**On-screen:** "${s.onScreenText}"` : ""}`
    ).join("\n\n---\n\n")}\n\n---\n\n**Sources:** ${script.historicalSources?.join(", ") || "N/A"}\n\n*🏷️ AI Historical Reconstruction*`;

    const { error } = await supabase.from("journals").insert({
      user_id: user.id,
      title: `Video Script — ${script.title}`,
      content,
      category: "ai-response",
      word_count: content.split(/\s+/).length,
    });
    if (error) toast.error("Failed to save to journal");
    else toast.success("Script saved to journal!");
  };

  const handleAutoArchive = async () => {
    if (!script) return;
    const description = `${script.synopsis}\n\n${script.scenes.map(s => s.narration).join("\n\n")}\n\n*AI Historical Reconstruction*`;
    const { error } = await supabase.from("custom_events").insert({
      user_id: user.id,
      title: script.title,
      description,
      year_label: "AI Generated",
      era: script.era,
      category: script.category === "battle" ? "battle" : script.category === "biography" ? "biography" : "general",
      is_public: false,
    });
    if (error) toast.error("Failed to add to archive");
    else toast.success("Added to your personal archive!");
  };

  const handleLoadProject = async (id: string) => {
    const { data, error } = await supabase
      .from("user_videos")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) { toast.error("Failed to load project"); return; }
    try {
      const parsed = typeof data.script === "string" ? JSON.parse(data.script) : data.script;
      if (parsed?.title && parsed?.scenes) {
        setScript(parsed);
        setGeneratedScenes([]); // Loaded projects won't have cached images
        if (data.resolution) setSettings(prev => ({ ...prev, resolution: data.resolution! }));
        toast.success(`Loaded: ${data.title}`);
      } else {
        toast.error("Project script data is invalid");
      }
    } catch { toast.error("Failed to parse project data"); }
  };

  const handleRegenerate = () => {
    setScript(null);
    setGeneratedScenes([]);
    setPipelineStage("idle");
  };

  const hasVideo = generatedScenes.length > 0;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Cinematic timeline background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute left-[15%] top-0 bottom-0 w-px bg-primary" />
        <div className="absolute right-[15%] top-0 bottom-0 w-px bg-primary" />
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="absolute left-[15%] flex items-center gap-2" style={{ top: `${7 + i * 6.5}%` }}>
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <div className="w-8 h-px bg-primary/50" />
          </div>
        ))}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      <Header />
      <div className="pt-20 pb-10 relative z-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Clapperboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                History Video AI Studio
                <Badge variant="secondary" className="text-[10px]">AI Video Engine</Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter a historical topic → AI generates a complete video with visuals, narration & subtitles
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Pipeline + Gallery */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4"
              >
                <VideoGenerationPipeline
                  onVideoReady={handleVideoReady}
                  onStageChange={setPipelineStage}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4"
              >
                <VideoGallery userId={user.id} onSelectProject={handleLoadProject} />
              </motion.div>
            </div>

            {/* Center: Video Player / Scene Builder */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 min-h-[500px]"
              >
                {hasVideo ? (
                  <div className="space-y-4">
                    <VideoPlayer
                      ref={playerRef}
                      scenes={generatedScenes}
                      title={script?.title || "Historical Video"}
                      includeSubtitles={settings.includeSubtitles}
                      includeNarration={settings.includeNarration}
                    />

                    {/* Export */}
                    <VideoExporter
                      scenes={generatedScenes}
                      title={script?.title || "historical-video"}
                      includeSubtitles={settings.includeSubtitles}
                    />

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                      <Button size="sm" className="gap-1.5 flex-1" onClick={handleSaveProject} disabled={saving}>
                        <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Project"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportScript}>
                        <Download className="h-3.5 w-3.5" /> Script
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSaveToJournal}>
                        <PenLine className="h-3.5 w-3.5" /> Journal
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAutoArchive}>
                        <Archive className="h-3.5 w-3.5" /> Archive
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={handleRegenerate}>
                        <RefreshCw className="h-3.5 w-3.5" /> New Video
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center italic">
                      🏷️ AI Historical Reconstruction
                    </p>
                  </div>
                ) : script ? (
                  <>
                    <VideoSceneBuilder script={script} onUpdateScript={setScript} />
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/30">
                      <Button size="sm" className="gap-1.5 flex-1" onClick={handleSaveProject} disabled={saving}>
                        <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Project"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportScript}>
                        <Download className="h-3.5 w-3.5" /> Export
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSaveToJournal}>
                        <PenLine className="h-3.5 w-3.5" /> Journal
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAutoArchive}>
                        <Archive className="h-3.5 w-3.5" /> Archive
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center italic">
                      🏷️ AI Historical Reconstruction
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <Film className="h-16 w-16 text-muted-foreground/20 mb-4" />
                    <h3 className="text-lg font-display font-semibold text-muted-foreground">No Video Yet</h3>
                    <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">
                      Enter a historical topic and click <strong>Generate Historical Video</strong> to create a complete AI video
                    </p>
                    <div className="flex items-center gap-1 mt-4 text-primary/60">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs">Full AI Pipeline: Script → Images → Narration → Video</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right: Settings */}
            <div className="lg:col-span-3 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4"
              >
                <VideoSettingsPanel settings={settings} onUpdateSettings={setSettings} />
              </motion.div>

              {script && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4"
                >
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                    <Archive className="h-4 w-4 text-primary" /> Archive & Integration
                  </h3>
                  <p className="text-[10px] text-muted-foreground mb-3">
                    This video is linked to the <strong>{script.era}</strong> era.
                    Save it to your personal archive or journal for cross-referencing.
                  </p>
                  <div className="space-y-1.5">
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs justify-start" onClick={handleAutoArchive}>
                      <BookmarkPlus className="h-3.5 w-3.5" /> Auto-create archive entry
                    </Button>
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs justify-start" onClick={handleSaveToJournal}>
                      <PenLine className="h-3.5 w-3.5" /> Save script to journal
                    </Button>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4"
              >
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" /> How It Works
                </h3>
                <ul className="text-[10px] text-muted-foreground space-y-1">
                  <li>1. Enter a historical topic</li>
                  <li>2. AI writes the script & scene breakdown</li>
                  <li>3. AI generates visuals for each scene</li>
                  <li>4. Browser TTS provides narration</li>
                  <li>5. Preview with Ken Burns animations</li>
                  <li>6. Export as downloadable video</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-4"
              >
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                  <Film className="h-4 w-4 text-primary" /> AI Engine Info
                </h3>
                <div className="text-[10px] text-muted-foreground space-y-2">
                  <div>
                    <span className="font-medium text-foreground/80">Scripts:</span>{" "}
                    Google Gemini (gemini-3-flash-preview)
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">Visuals:</span>{" "}
                    Gemini Flash Image (gemini-2.5-flash-image)
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">Narration:</span>{" "}
                    Browser TTS (no API needed)
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">Rendering:</span>{" "}
                    Canvas + MediaRecorder (in-browser)
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
