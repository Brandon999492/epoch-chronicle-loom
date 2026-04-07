import { Pin, Heart, Calendar, Tag } from "lucide-react";
import { motion } from "framer-motion";

const themeColors: Record<string, string> = {
  default: "border-border",
  red: "border-red-400/50",
  blue: "border-blue-400/50",
  green: "border-green-400/50",
  purple: "border-purple-400/50",
  amber: "border-amber-400/50",
  rose: "border-rose-400/50",
};

const themeBg: Record<string, string> = {
  default: "",
  red: "bg-red-500/5",
  blue: "bg-blue-500/5",
  green: "bg-green-500/5",
  purple: "bg-purple-500/5",
  amber: "bg-amber-500/5",
  rose: "bg-rose-500/5",
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
  const theme = note.color_theme || "default";
  const preview = (note.content || "").slice(0, 120);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${themeColors[theme] || themeColors.default} ${themeBg[theme] || ""} ${isSelected ? "ring-2 ring-primary shadow-lg" : "hover:border-primary/30"}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-display font-semibold text-sm text-foreground truncate flex-1">{note.title}</h3>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {note.is_pinned && <Pin className="h-3 w-3 text-primary" />}
          {note.is_favorite && <Heart className="h-3 w-3 text-primary fill-primary" />}
        </div>
      </div>
      {preview && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{preview}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {note.category && note.category !== "general" && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize">{note.category}</span>
        )}
        {note.linked_year && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground flex items-center gap-0.5">
            <Calendar className="h-2.5 w-2.5" />{note.linked_year}
          </span>
        )}
        {(note.tags || []).slice(0, 2).map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground flex items-center gap-0.5">
            <Tag className="h-2.5 w-2.5" />{t}
          </span>
        ))}
        <span className="text-[10px] text-muted-foreground ml-auto">{note.word_count || 0}w</span>
      </div>
    </motion.div>
  );
}
