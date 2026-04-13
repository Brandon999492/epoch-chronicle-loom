import { htmlToPlainText, normalizeCategory, type StudioNote } from "./studio-note-utils";

interface NoteCardProps {
  note: StudioNote;
  isSelected: boolean;
  onClick: () => void;
}

export function NoteCard({ note, isSelected, onClick }: NoteCardProps) {
  const preview = buildPreview(note.html_content);
  const category = normalizeCategory(note.category);
  const updatedLabel = formatUpdated(note.updated_at);

  return (
    <button type="button" onClick={onClick} aria-pressed={isSelected}
      className={`group w-full rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
        isSelected
          ? "border-primary/30 bg-primary/8 shadow-sm"
          : "border-transparent bg-transparent hover:bg-card/80"
      }`}>
      <p className="truncate text-[15px] font-semibold text-foreground leading-snug">
        {note.title || "Untitled Note"}
      </p>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {preview}
      </p>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/70">
        <span className="rounded-full bg-secondary/80 px-2 py-0.5 font-medium text-secondary-foreground/80">
          {category}
        </span>
        <span className="ml-auto">{updatedLabel}</span>
      </div>
    </button>
  );
}

function buildPreview(htmlContent: StudioNote["html_content"]): string {
  const LABELS = new Set(["headline", "summary", "year", "timeline", "category", "key points", "notes", "my thoughts"]);
  const source = htmlToPlainText(htmlContent).replace(/\r/g, "");
  const cleaned = source.split(/\n+/).map((l) => l.trim())
    .filter((l) => l && !LABELS.has(l.replace(/:$/, "").toLowerCase()))
    .join(" ").replace(/[•\-]+\s*/g, "").replace(/\s{2,}/g, " ").trim();
  return cleaned || "Start writing…";
}

function formatUpdated(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(d);
}
