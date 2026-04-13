import { htmlToPlainText, normalizeCategory } from "./studio-note-utils";

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string | null;
    html_content: string | null;
    category: string | null;
    updated_at: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

const SECTION_LABELS = new Set([
  "headline", "summary", "year", "timeline", "category", "key points", "notes", "my thoughts",
]);

export function NoteCard({ note, isSelected, onClick }: NoteCardProps) {
  const preview = buildPreview(note.content, note.html_content);
  const category = normalizeCategory(note.category);
  const updatedLabel = formatUpdated(note.updated_at);

  return (
    <button type="button" onClick={onClick} aria-pressed={isSelected}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors min-h-[120px] ${
        isSelected
          ? "border-primary/35 bg-primary/10"
          : "border-border/70 bg-card/90 hover:border-primary/20 hover:bg-card"
      }`}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="truncate text-[1rem] font-semibold text-foreground">{note.title || "Untitled Note"}</p>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{preview}</p>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">{category}</span>
          <span>{updatedLabel}</span>
        </div>
      </div>
    </button>
  );
}

function buildPreview(content: string | null, htmlContent: string | null): string {
  const source = (content || htmlToPlainText(htmlContent || "")).replace(/\r/g, "");
  const cleaned = source.split(/\n+/).map((l) => l.trim())
    .filter((l) => l && !SECTION_LABELS.has(l.replace(/:$/, "").toLowerCase()))
    .join(" ").replace(/[•\-]+\s*/g, "").replace(/\s{2,}/g, " ").trim();
  return cleaned || "Start writing your note here.";
}

function formatUpdated(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(d);
}
