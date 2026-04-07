import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface NotesTimelineProps {
  notes: Array<{
    id: string;
    title: string;
    category: string | null;
    linked_year: number | null;
    created_at: string;
    color_theme: string | null;
  }>;
  onSelect: (id: string) => void;
  filterCat: string;
}

const eraLabel = (y: number) => {
  if (y < -3000) return "Prehistoric";
  if (y < 500) return "Ancient";
  if (y < 1500) return "Medieval";
  if (y < 1800) return "Early Modern";
  if (y < 1950) return "Modern";
  return "Contemporary";
};

export function NotesTimeline({ notes, onSelect, filterCat }: NotesTimelineProps) {
  const { grouped, undated } = useMemo(() => {
    const filtered = notes.filter(n => filterCat === "all" || n.category === filterCat);
    const dated = filtered.filter(n => n.linked_year != null).sort((a, b) => (a.linked_year! - b.linked_year!));
    const undated = filtered.filter(n => n.linked_year == null);

    const groups: Record<string, typeof dated> = {};
    dated.forEach(n => {
      const era = eraLabel(n.linked_year!);
      if (!groups[era]) groups[era] = [];
      groups[era].push(n);
    });

    return { grouped: groups, undated };
  }, [notes, filterCat]);

  const eras = Object.keys(grouped);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {eras.length === 0 && undated.length === 0 && (
        <div className="text-center py-16">
          <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No notes with dates</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">Add a year to your notes to see them on the timeline</p>
        </div>
      )}

      <div className="relative">
        {/* Vertical line */}
        {eras.length > 0 && (
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />
        )}

        {eras.map((era) => (
          <div key={era} className="mb-6">
            <div className="flex items-center gap-3 mb-3 relative">
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-background z-10 ml-[10px]" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{era}</span>
            </div>
            <div className="ml-10 space-y-2">
              {grouped[era].map((n, i) => (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelect(n.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-card/50 border border-border/30 hover:bg-card hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-primary/60 shrink-0">{n.linked_year}</span>
                    <span className="text-xs font-medium text-foreground group-hover:text-primary truncate">{n.title}</span>
                  </div>
                  {n.category && n.category !== "general" && (
                    <span className="text-[9px] text-muted-foreground/60 ml-12 capitalize">{n.category}</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}

        {undated.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3 ml-2">
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Undated</span>
            </div>
            <div className="ml-4 space-y-1.5">
              {undated.map(n => (
                <button key={n.id} onClick={() => onSelect(n.id)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <span className="text-xs text-muted-foreground">{n.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
