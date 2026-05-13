import { useState } from "react";
import { ChevronDown, Sparkles, Clock, Users, Tag, Compass } from "lucide-react";

export type StructuredNote = {
  title: string;
  subtitle?: string;
  summary: string;
  category?: string;
  tags?: string[];
  key_insights?: string[];
  sections?: Array<{ heading: string; body: string; type?: "text" | "insight" | "quote" }>;
  timeline?: Array<{ year: string; title: string; description: string }>;
  figures?: Array<{ name: string; role: string; significance: string }>;
  related_topics?: string[];
};

interface Props {
  note: StructuredNote;
  videoId?: string | null;
}

export function StructuredNoteView({ note, videoId }: Props) {
  return (
    <article className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      {/* Hero */}
      <header className="mb-10 animate-[studio-fade-in_0.4s_ease-out_both]">
        {note.category && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {note.category}
          </div>
        )}
        <h1 className="font-display text-[2.25rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-[2.75rem]">
          {note.title}
        </h1>
        {note.subtitle && (
          <p className="mt-3 text-lg leading-snug text-muted-foreground">
            {note.subtitle}
          </p>
        )}
        {note.tags && note.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {note.tags.map((t) => (
              <span key={t} className="rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Summary card */}
      <SectionFade delay={0.05}>
        <div className="mb-10 rounded-2xl border border-border/50 bg-secondary/30 p-6 leading-[1.75] text-foreground/90">
          {note.summary}
        </div>
      </SectionFade>

      {/* YouTube embed */}
      {videoId && (
        <SectionFade delay={0.08}>
          <div className="mb-10 overflow-hidden rounded-2xl border border-border/50">
            <div className="relative w-full pb-[56.25%]">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="Source video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </SectionFade>
      )}

      {/* Key insights */}
      {note.key_insights && note.key_insights.length > 0 && (
        <SectionFade delay={0.1}>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Key insights
          </h2>
          <ul className="mb-12 space-y-2.5">
            {note.key_insights.map((ins, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border-l-2 border-primary/60 bg-primary/[0.04] py-2.5 pl-4 pr-3 leading-[1.7] text-foreground/90"
              >
                <span>{ins}</span>
              </li>
            ))}
          </ul>
        </SectionFade>
      )}

      {/* Sections */}
      {note.sections && note.sections.length > 0 && (
        <div className="mb-12 space-y-4">
          {note.sections.map((s, i) => (
            <SectionFade key={i} delay={0.12 + i * 0.04}>
              <CollapsibleSection heading={s.heading} type={s.type}>
                {renderBody(s.body)}
              </CollapsibleSection>
            </SectionFade>
          ))}
        </div>
      )}

      {/* Timeline */}
      {note.timeline && note.timeline.length > 0 && (
        <SectionFade delay={0.18}>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" /> Timeline
          </h2>
          <ol className="relative mb-12 space-y-4 border-l border-border/50 pl-6">
            {note.timeline.map((t, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[29px] top-2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <div className="rounded-xl border border-border/40 bg-card/50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">{t.year}</div>
                  <div className="mt-1 font-medium text-foreground">{t.title}</div>
                  <p className="mt-1.5 text-sm leading-[1.7] text-muted-foreground">{t.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionFade>
      )}

      {/* Figures */}
      {note.figures && note.figures.length > 0 && (
        <SectionFade delay={0.22}>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <Users className="h-4 w-4 text-primary" /> Key figures
          </h2>
          <div className="mb-12 grid gap-3 sm:grid-cols-2">
            {note.figures.map((f, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-4">
                <div className="font-medium text-foreground">{f.name}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground/70">{f.role}</div>
                <p className="mt-2 text-sm leading-[1.65] text-foreground/80">{f.significance}</p>
              </div>
            ))}
          </div>
        </SectionFade>
      )}

      {/* Related topics */}
      {note.related_topics && note.related_topics.length > 0 && (
        <SectionFade delay={0.26}>
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <Compass className="h-4 w-4 text-primary" /> Explore further
          </h2>
          <div className="flex flex-wrap gap-2">
            {note.related_topics.map((t) => (
              <span key={t} className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-sm text-foreground/85">
                {t}
              </span>
            ))}
          </div>
        </SectionFade>
      )}
    </article>
  );
}

function SectionFade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div style={{ animation: `studio-fade-in 0.45s ease-out ${delay}s both` }}>
      {children}
    </div>
  );
}

function CollapsibleSection({
  heading, type = "text", children,
}: { heading: string; type?: "text" | "insight" | "quote"; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const accent =
    type === "quote"
      ? "border-l-4 border-primary/60 bg-secondary/30 italic"
      : type === "insight"
      ? "border-l-2 border-primary bg-primary/[0.04]"
      : "border border-border/40 bg-card/40";

  return (
    <section className={`overflow-hidden rounded-2xl ${accent}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.02]"
      >
        <h3 className="font-display text-[1.15rem] font-semibold text-foreground">{heading}</h3>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 text-[15px] leading-[1.85] text-foreground/85">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function renderBody(body: string) {
  // Split paragraphs on blank lines; render simple bullet/numbered lines.
  const blocks = body.split(/\n{2,}/g).map((b) => b.trim()).filter(Boolean);
  return blocks.map((b, i) => {
    const lines = b.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const isList = lines.every((l) => /^[-*•]\s+/.test(l)) && lines.length > 1;
    const isNum = lines.every((l) => /^\d+[.)]\s+/.test(l)) && lines.length > 1;
    if (isList) {
      return (
        <ul key={i} className="my-3 list-disc space-y-1.5 pl-5">
          {lines.map((l, j) => <li key={j}>{l.replace(/^[-*•]\s+/, "")}</li>)}
        </ul>
      );
    }
    if (isNum) {
      return (
        <ol key={i} className="my-3 list-decimal space-y-1.5 pl-5">
          {lines.map((l, j) => <li key={j}>{l.replace(/^\d+[.)]\s+/, "")}</li>)}
        </ol>
      );
    }
    return <p key={i} className="my-3 first:mt-0">{b}</p>;
  });
}
