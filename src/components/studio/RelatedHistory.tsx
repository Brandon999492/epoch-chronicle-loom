import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, ChevronDown, ChevronUp, User, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface RelatedHistoryProps {
  noteTitle: string;
  noteContent: string;
  preloaded?: { events: any[]; figures: any[] } | null;
}

export function RelatedHistory({ noteTitle, noteContent, preloaded }: RelatedHistoryProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(!!preloaded);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>(preloaded?.events || []);
  const [figures, setFigures] = useState<any[]>(preloaded?.figures || []);

  useEffect(() => {
    if (preloaded) {
      setEvents(preloaded.events || []);
      setFigures(preloaded.figures || []);
      setExpanded(true);
    }
  }, [preloaded]);

  const fetchRelated = useCallback(async () => {
    if (events.length > 0 || figures.length > 0) { setExpanded(!expanded); return; }
    const keywords = noteTitle.replace(/[^\w\s]/g, "").trim();
    if (!keywords || keywords === "Untitled Note") return;

    setLoading(true);
    setExpanded(true);
    try {
      const { data } = await supabase.functions.invoke("knowledge-ai", {
        body: { action: "find_related", text: keywords },
      });
      if (data?.result) {
        setEvents(data.result.events || []);
        setFigures(data.result.figures || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [noteTitle, events.length, figures.length, expanded]);

  const hasContent = events.length > 0 || figures.length > 0;

  return (
    <div className="border-t border-border/40">
      <button
        onClick={fetchRelated}
        className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-secondary/30 transition-colors min-h-[44px]"
      >
        <span className="flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5 text-primary" />
          Related History
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        </span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {!hasContent && !loading && (
                <p className="text-xs text-muted-foreground/60 text-center py-3">
                  No related events found. Try generating a note first.
                </p>
              )}

              {events.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium mb-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Events
                  </p>
                  <div className="space-y-1.5">
                    {events.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => navigate(`/event/${e.slug || e.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors group"
                      >
                        <p className="text-xs font-medium text-foreground group-hover:text-primary truncate">{e.title}</p>
                        <p className="text-[10px] text-muted-foreground">{e.year_label || e.year || ""} · {e.category || ""}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {figures.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium mb-2 flex items-center gap-1">
                    <User className="h-3 w-3" /> Figures
                  </p>
                  <div className="space-y-1.5">
                    {figures.map((f) => (
                      <div key={f.id} className="px-3 py-2 rounded-lg bg-secondary/30">
                        <p className="text-xs font-medium text-foreground">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground">{f.title || ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
