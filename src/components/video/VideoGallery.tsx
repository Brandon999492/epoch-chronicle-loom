import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Film, Star, Pin, Trash2, Clock, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";

interface VideoProject {
  id: string;
  title: string;
  prompt: string | null;
  style: string;
  status: string;
  era: string | null;
  category: string | null;
  duration_seconds: number;
  is_favorite: boolean;
  is_pinned: boolean;
  created_at: string;
}

interface VideoGalleryProps {
  userId: string;
  onSelectProject: (id: string) => void;
}

export function VideoGallery({ userId, onSelectProject }: VideoGalleryProps) {
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_videos")
      .select("id, title, prompt, style, status, era, category, duration_seconds, is_favorite, is_pinned, created_at")
      .eq("user_id", userId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) setVideos(data);
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, [userId]);

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase.from("user_videos").update({ is_favorite: !current }).eq("id", id);
    setVideos((v) => v.map((p) => (p.id === id ? { ...p, is_favorite: !current } : p)));
  };

  const togglePin = async (id: string, current: boolean) => {
    await supabase.from("user_videos").update({ is_pinned: !current }).eq("id", id);
    setVideos((v) => v.map((p) => (p.id === id ? { ...p, is_pinned: !current } : p)));
  };

  const deleteVideo = async (id: string) => {
    const { error } = await supabase.from("user_videos").delete().eq("id", id);
    if (!error) {
      setVideos((v) => v.filter((p) => p.id !== id));
      toast.success("Video deleted");
    }
  };

  const saveToJournal = async (v: VideoProject) => {
    const content = `# ${v.title}\n\n**Style:** ${v.style}\n**Era:** ${v.era || "N/A"}\n**Duration:** ${v.duration_seconds}s\n\n${v.prompt || ""}\n\n*🏷️ AI Historical Reconstruction*`;
    const { error } = await supabase.from("journals").insert({
      user_id: userId,
      title: `Video Project — ${v.title}`,
      content,
      category: "ai-response",
      word_count: content.split(/\s+/).length,
    });
    if (error) {
      toast.error("Failed to save to journal");
    } else {
      toast.success("Saved to journal!");
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-500/20 text-yellow-400",
    generating: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8">
        <Film className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No video projects yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Generate your first historical script above</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Film className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-semibold">My Historical Videos</h2>
        <Badge variant="outline" className="text-[10px]">{videos.length}</Badge>
      </div>

      <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
        {videos.map((v) => (
          <div
            key={v.id}
            className="flex items-start gap-2 p-2.5 rounded-lg border border-border/30 bg-card/50 hover:bg-secondary/30 transition-colors cursor-pointer group"
            onClick={() => onSelectProject(v.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {v.is_pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                <p className="text-sm font-medium truncate">{v.title}</p>
              </div>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{v.prompt}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusColors[v.status] || ""}`}>
                  {v.status}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" /> {v.duration_seconds}s
                </span>
                {v.era && <Badge variant="outline" className="text-[9px] h-4">{v.era}</Badge>}
              </div>
            </div>

            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(v.id, v.is_favorite); }}
                className="p-1 hover:text-yellow-400 transition-colors" title="Favorite">
                <Star className={`h-3 w-3 ${v.is_favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); togglePin(v.id, v.is_pinned); }}
                className="p-1 hover:text-primary transition-colors" title="Pin">
                <Pin className={`h-3 w-3 ${v.is_pinned ? "fill-primary text-primary" : ""}`} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); saveToJournal(v); }}
                className="p-1 hover:text-primary transition-colors" title="Save to journal">
                <PenLine className="h-3 w-3" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); deleteVideo(v.id); }}
                className="p-1 hover:text-destructive transition-colors" title="Delete">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
