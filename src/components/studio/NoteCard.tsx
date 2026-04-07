import { Pin, Heart, Calendar, Tag } from "lucide-react";
import { motion } from "framer-motion";

const categoryColors: Record<string, string> = {
  "Ice Age": "bg-blue-500/15 text-blue-400",
  "Space": "bg-violet-500/15 text-violet-400",
  "Serial Killers": "bg-red-500/15 text-red-400",
  "Ancient Egypt": "bg-amber-500/15 text-amber-400",
  "Ancient Greece": "bg-emerald-500/15 text-emerald-400",
  "Royal Family": "bg-purple-500/15 text-purple-400",
  "Dinosaurs": "bg-green-500/15 text-green-400",
  "Earth History": "bg-teal-500/15 text-teal-400",
  "Extinction Events": "bg-orange-500/15 text-orange-400",
  "American History": "bg-sky-500/15 text-sky-400",
  general: "bg-muted text-muted-foreground",
};

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string | null;
    category: string | null;
    tags: string[] | null;
    color_theme: string | null;
    linked_year: number | null;
    word_count: number | null;
    is_pinned: boolean | null;
    is_favorite: boolean | null;
    updated_at: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

export function NoteCard({ note, isSelected, onClick }: NoteCardProps) {
  const preview = (note.content || "").replace(/[#*_\->/\\]/g, "").slice(0, 120);
  const cat = note.category || "general";
  const catStyle = categoryColors[cat] || categoryColors.general;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]
        ${isSelected
          ? "border-primary/40 bg-primary/5 shadow-lg ring-1 ring-primary/20"
          : "border-border/60 bg-card hover:border-primary/20 hover:bg-card/80"
        }`}
    >
      <div className="flex items-start justify-between mb-2.5">
        <h3 className="font-semibold text-[15px] sm:text-base text-foreground truncate flex-1 leading-snug">{note.title}</h3>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {note.is_pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
          {note.is_favorite && <Heart className="h-3.5 w-3.5 text-primary fill-primary" />}
        </div>
      </div>

      {preview && (
        <p className="text-[13px] sm:text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{preview}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {cat !== "general" && (
          <span className={`text-[10px] sm:text-[11px] px-2 py-1 rounded-full font-medium ${catStyle}`}>
            {cat}
          </span>
        )}
        {note.linked_year && (
          <span className="text-[10px] sm:text-[11px] px-1.5 py-1 rounded-full bg-secondary text-muted-foreground flex items-center gap-0.5">
            <Calendar className="h-2.5 w-2.5" />{note.linked_year}
          </span>
        )}
        {(note.tags || []).slice(0, 2).map((t) => (
          <span key={t} className="text-[10px] sm:text-[11px] px-1.5 py-1 rounded-full bg-secondary text-muted-foreground flex items-center gap-0.5">
            <Tag className="h-2.5 w-2.5" />{t}
          </span>
        ))}
        <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 ml-auto">{note.word_count || 0}w</span>
      </div>
    </motion.div>
  );
}
