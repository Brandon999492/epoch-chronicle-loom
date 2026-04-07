import { useState } from "react";
import { Zap, X, Sparkles, Loader2, Link2, Youtube } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickCaptureProps {
  onSave: (title: string, content: string, htmlContent?: string) => void;
}

export function QuickCapture({ onSave }: QuickCaptureProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [expanding, setExpanding] = useState(false);

  const handleSave = () => {
    if (!title.trim() && !content.trim() && !sourceUrl.trim()) return;
    const finalTitle = title.trim() || "Quick Note";
    onSave(finalTitle, content.trim());
    reset();
  };

  const handleExpandWithAi = async () => {
    const text = content.trim() || title.trim();
    if (!text) { toast.error("Write something to expand"); return; }
    setExpanding(true);
    try {
      const { data, error } = await supabase.functions.invoke("knowledge-ai", {
        body: { action: "expand_note", text }
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const finalTitle = title.trim() || "AI Expanded Note";
      onSave(finalTitle, data.result, `<div>${data.result.replace(/\n/g, '<br/>')}</div>`);
      toast.success("Note expanded with AI!");
      reset();
    } catch (e: any) {
      toast.error(e.message || "AI expansion failed");
    } finally {
      setExpanding(false);
    }
  };

  const handleYoutubeExtract = async () => {
    if (!sourceUrl.trim()) return;
    const ytMatch = sourceUrl.match(/(?:youtu\.be\/|v=)([^&?]+)/);
    if (!ytMatch) { toast.error("Not a valid YouTube URL"); return; }
    setExpanding(true);
    try {
      const { data, error } = await supabase.functions.invoke("knowledge-ai", {
        body: { action: "youtube_extract", url: sourceUrl }
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const videoId = data.videoId || ytMatch[1];
      const htmlContent = `<div style="position:relative;padding-bottom:56.25%;height:0;margin-bottom:16px;border-radius:8px;overflow:hidden"><iframe src="https://www.youtube.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div><div>${data.result.replace(/\n/g, '<br/>')}</div>`;
      onSave(title.trim() || "YouTube Notes", data.result, htmlContent);
      toast.success("YouTube content extracted!");
      reset();
    } catch (e: any) {
      toast.error(e.message || "Failed to extract YouTube content");
    } finally {
      setExpanding(false);
    }
  };

  const reset = () => {
    setTitle("");
    setContent("");
    setSourceUrl("");
    setOpen(false);
  };

  const isYoutube = sourceUrl.match(/youtu/);

  return (
    <>
      <button onClick={() => setOpen(true)} title="Quick Capture"
        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
        <Zap className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && reset()}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Quick Capture</h3>
                    <p className="text-[11px] text-muted-foreground">Jot it down now, expand later</p>
                  </div>
                </div>
                <button onClick={reset} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)..."
                className="w-full text-sm rounded-xl bg-secondary border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30" autoFocus />

              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your quick thought, idea, or notes..."
                className="w-full text-sm rounded-xl bg-secondary border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-none" />

              {/* Source URL */}
              <div className="relative mb-4">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Paste YouTube or article link..."
                  className="w-full text-xs rounded-xl bg-secondary border border-border pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                {isYoutube && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-primary">
                    <Youtube className="h-3 w-3" /> YouTube detected
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={handleSave} disabled={!title.trim() && !content.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 disabled:opacity-50 transition-all">
                  Save Note
                </button>
                {isYoutube ? (
                  <button onClick={handleYoutubeExtract} disabled={expanding}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {expanding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                    Extract with AI
                  </button>
                ) : (
                  <button onClick={handleExpandWithAi} disabled={expanding || (!title.trim() && !content.trim())}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {expanding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Expand with AI
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
