import { useState, useRef, useEffect } from "react";
import { Plus, X, Sparkles, Loader2, Youtube, Lightbulb, Link2, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickCaptureProps {
  onSave: (title: string, content: string, htmlContent?: string, structured?: any) => void;
}

export function QuickCapture({ onSave }: QuickCaptureProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isYoutube = input.match(/youtu/);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleGenerate = async () => {
    if (!input.trim()) { toast.error("Enter a topic, idea, or YouTube link"); return; }
    setGenerating(true);
    try {
      const isYt = input.match(/(?:youtu\.be\/|v=)([^&?]+)/);
      const action = isYt ? "youtube_structured" : "generate_structured_note";
      const body = isYt
        ? { action, url: input }
        : { action, text: detailed ? `Provide an extremely detailed and comprehensive note about: ${input}` : input };

      const { data, error } = await supabase.functions.invoke("knowledge-ai", { body });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const s = data.structured;
      if (!s) { toast.error("AI did not return structured data"); return; }

      const videoEmbed = data.videoId
        ? `<div style="position:relative;padding-bottom:56.25%;height:0;margin-top:32px;border-radius:12px;overflow:hidden"><iframe src="https://www.youtube.com/embed/${data.videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div>`
        : "";

      const html = buildStructuredHtml(s, videoEmbed);
      const plain = buildStructuredPlain(s);

      onSave(s.title || "AI Note", plain, html, s);
      toast.success("Structured note generated!");
      reset();
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => { setInput(""); setOpen(false); setDetailed(false); };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-sm font-medium min-h-[48px]"
        title="Quick Note – capture ideas instantly">
        <Plus className="h-4 w-4" /> Quick Note
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-0 sm:p-4"
            onClick={(e) => e.target === e.currentTarget && reset()}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-6">

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Quick Capture</h3>
                    <p className="text-xs text-muted-foreground">Paste a link, enter a topic, or write an idea</p>
                  </div>
                </div>
                <button onClick={reset} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mb-3">
                {isYoutube ? (
                  <Youtube className="absolute left-3.5 top-3.5 h-4 w-4 text-primary" />
                ) : input.match(/^https?:\/\//) ? (
                  <Link2 className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lightbulb className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                )}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="YouTube link, topic, or quick idea…"
                  rows={2}
                  className="w-full text-[15px] rounded-xl bg-secondary/60 border border-border pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none min-h-[60px]"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                />
                {isYoutube && (
                  <span className="absolute right-3 top-3 text-[10px] text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">
                    YouTube detected
                  </span>
                )}
              </div>

              {/* Detailed toggle */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  AI generates a full structured note
                </p>
                <button onClick={() => setDetailed(!detailed)}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  {detailed ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                  Detailed
                </button>
              </div>

              <button onClick={handleGenerate} disabled={generating || !input.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[48px]">
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate Note with AI</>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function buildStructuredHtml(s: any, videoEmbed: string): string {
  const kp = (s.key_points || []).map((p: string) => `<li>${p}</li>`).join("");
  return `
<h1>${s.title || ""}</h1>
<p><strong>${s.headline || ""}</strong></p>
<hr/>
<div class="section-label">Summary</div>
<p>${s.summary || ""}</p>
<hr/>
<div style="display:flex;gap:24px;flex-wrap:wrap;margin:16px 0">
  <div><span class="section-label">Year</span><p>${s.year || "—"}</p></div>
  <div><span class="section-label">Timeline Period</span><p>${s.timeline_period || "—"}</p></div>
  <div><span class="section-label">Category</span><p>${s.category || "—"}</p></div>
</div>
<hr/>
<div class="section-label">Key Points</div>
<ul>${kp}</ul>
<hr/>
<div class="section-label">Detailed Notes</div>
<p>${(s.detailed_notes || "").replace(/\n/g, "</p><p>")}</p>
<hr/>
<div class="section-label">My Thoughts</div>
<p style="color:hsl(var(--muted-foreground));font-style:italic">${s.thoughts || "Add your thoughts here…"}</p>
${videoEmbed}`.trim();
}

function buildStructuredPlain(s: any): string {
  const kp = (s.key_points || []).map((p: string, i: number) => `${i + 1}. ${p}`).join("\n");
  return `${s.title || ""}\n${s.headline || ""}\n\nSummary:\n${s.summary || ""}\n\nYear: ${s.year || ""}\nTimeline Period: ${s.timeline_period || ""}\nCategory: ${s.category || ""}\n\nKey Points:\n${kp}\n\nDetailed Notes:\n${s.detailed_notes || ""}\n\nMy Thoughts:\n${s.thoughts || ""}`;
}
