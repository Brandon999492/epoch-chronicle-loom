export type StudioStructuredNote = {
  title?: string | null;
  headline?: string | null;
  summary?: string | null;
  year?: string | number | null;
  timeline_period?: string | null;
  category?: string | null;
  key_points?: string[] | null;
  detailed_notes?: string | null;
  thoughts?: string | null;
  timeline?: Array<{ year?: string | number | null; title?: string | null; description?: string | null }> | null;
};

type NoteSections = {
  headline: string;
  summary: string;
  year: string;
  timeline: string;
  category: string;
  keyPoints: string[];
  notes: string;
  thoughts: string;
};

const SECTION_PATTERN = /^(Headline|Summary|Year|Timeline|Category|Key Points|Notes|My Thoughts):\s*(.*)$/i;

export const STUDIO_CATEGORIES = [
  "General", "Ancient Egypt", "Ancient Greece", "American History", "Dinosaurs",
  "Earth History", "Extinction Events", "Ice Age", "Royal Family", "Serial Killers", "Space",
] as const;

export const DEFAULT_NOTE_TITLE = "Untitled Note";
export const DEFAULT_CATEGORY = "General";
export const MAGIC_INPUT_LIMIT = 240;

export function isYouTubeUrl(value: string): boolean {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/i.test(value.trim());
}

export function normalizeCategory(value?: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_CATEGORY;
  const exact = STUDIO_CATEGORIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  return trimmed.split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export function createNoteBodyHtml(): string {
  return buildNoteBodyHtmlFromSections({
    headline: "Write a short headline for this note.",
    summary: "Capture the key idea in a few calm, readable sentences.",
    year: "—", timeline: "—", category: DEFAULT_CATEGORY,
    keyPoints: ["Capture the first important detail here."],
    notes: "Write your notes here.",
    thoughts: "Add your own reflection or takeaway.",
  });
}

export function createNoteBodyPlainText(): string {
  return [
    "Headline:", "Write a short headline for this note.", "",
    "Summary:", "Capture the key idea in a few calm, readable sentences.", "",
    "Year:", "—", "", "Timeline:", "—", "", "Category:", DEFAULT_CATEGORY, "",
    "Key Points:", "- Capture the first important detail here.", "",
    "Notes:", "Write your notes here.", "",
    "My Thoughts:", "Add your own reflection or takeaway.",
  ].join("\n");
}

export function buildStructuredBodyHtml(s: StudioStructuredNote, videoId?: string | null): string {
  return buildNoteBodyHtmlFromSections(sectionsFromStructured(s), videoId ?? null);
}

export function buildStructuredBodyPlainText(s: StudioStructuredNote): string {
  return buildPlainTextFromSections(sectionsFromStructured(s));
}

export function plainTextToEditorHtml(text: string, videoId?: string | null): string {
  if (!text.trim()) return createNoteBodyHtml();
  const parsed = parseStructuredPlainText(text);
  if (parsed.matched >= 4) return buildNoteBodyHtmlFromSections(parsed.sections, videoId ?? null);
  const paragraphs = text.replace(/\r/g, "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
    .map((b) => `<p>${esc(b).replace(/\n/g, "<br/>")}</p>`).join("");
  return `${paragraphs}${videoId ? buildVideoSection(videoId) : ""}`.trim();
}

export function htmlToPlainText(html: string): string {
  return decodeHtml(
    html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n").replace(/<\/li>/gi, "\n").replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/p>/gi, "\n\n").replace(/<\/div>/gi, "\n").replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<hr\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
  ).trim();
}

export function normalizeStoredHtml(html?: string | null): string {
  const src = (html || "").trim();
  if (!src) return createNoteBodyHtml();
  const normalized = src.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/i, "").replace(/^\s*<hr\s*\/?>/i, "").trim();
  return normalized || createNoteBodyHtml();
}

export function extractMediaMarkup(html: string): { videoId: string | null; imageMarkup: string } {
  let videoId: string | null = null;
  const iframeMatch = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (iframeMatch) videoId = iframeMatch[1];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const imgs = Array.from(doc.querySelectorAll("img")).map((el) => el.outerHTML);
  return { videoId, imageMarkup: imgs.join("") };
}

/* ── internal ── */

function sectionsFromStructured(s: StudioStructuredNote): NoteSections {
  return {
    headline: clean(s.headline), summary: clean(s.summary), year: clean(s.year),
    timeline: deriveTimeline(s), category: normalizeCategory(s.category),
    keyPoints: normKP(s.key_points), notes: clean(s.detailed_notes), thoughts: clean(s.thoughts),
  };
}

function parseStructuredPlainText(text: string) {
  const lines = text.replace(/\r/g, "").split("\n");
  const buckets: Record<keyof NoteSections, string[]> = {
    headline: [], summary: [], year: [], timeline: [], category: [], keyPoints: [], notes: [], thoughts: [],
  };
  const seen = new Set<string>();
  let cur: keyof NoteSections | null = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const m = line.match(SECTION_PATTERN);
    if (m) { cur = labelKey(m[1]); seen.add(cur); if (m[2]) buckets[cur].push(m[2]); continue; }
    if (cur) buckets[cur].push(line);
  }
  return {
    matched: seen.size,
    sections: {
      headline: clean(buckets.headline.join("\n")), summary: clean(buckets.summary.join("\n")),
      year: clean(buckets.year.join("\n")), timeline: clean(buckets.timeline.join("\n")),
      category: normalizeCategory(buckets.category.join("\n")),
      keyPoints: normKP(buckets.keyPoints), notes: clean(buckets.notes.join("\n")),
      thoughts: clean(buckets.thoughts.join("\n")),
    } as NoteSections,
  };
}

function labelKey(label: string): keyof NoteSections {
  const l = label.toLowerCase();
  if (l === "headline") return "headline"; if (l === "summary") return "summary";
  if (l === "year") return "year"; if (l === "timeline") return "timeline";
  if (l === "category") return "category"; if (l === "key points") return "keyPoints";
  if (l === "notes") return "notes"; return "thoughts";
}

function buildNoteBodyHtmlFromSections(s: NoteSections, videoId?: string | null): string {
  const kp = s.keyPoints.length ? s.keyPoints : ["Capture the first important detail here."];
  return `
<section><div class="note-section-label">Headline</div>${renderP(s.headline, "Write a short headline for this note.")}</section>
<div class="note-divider"></div>
<section><div class="note-section-label">Summary</div>${renderP(s.summary, "Capture the key idea in a few calm, readable sentences.")}</section>
<div class="note-divider"></div>
<div class="note-meta-grid">
  ${metaVal("Year", s.year || "—", !s.year)}
  ${metaVal("Timeline", s.timeline || "—", !s.timeline)}
  ${metaVal("Category", s.category || DEFAULT_CATEGORY, !s.category)}
</div>
<div class="note-divider"></div>
<section><div class="note-section-label">Key Points</div><ul>${kp.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></section>
<div class="note-divider"></div>
<section><div class="note-section-label">Notes</div>${renderP(s.notes, "Write your notes here.")}</section>
<div class="note-divider"></div>
<section><div class="note-section-label">My Thoughts</div>${renderP(s.thoughts, "Add your own reflection or takeaway.", "note-thoughts")}</section>
${videoId ? buildVideoSection(videoId) : ""}`.trim();
}

function buildPlainTextFromSections(s: NoteSections): string {
  const kp = s.keyPoints.length ? s.keyPoints : ["Capture the first important detail here."];
  return [
    "Headline:", s.headline || "—", "", "Summary:", s.summary || "—", "",
    "Year:", s.year || "—", "", "Timeline:", s.timeline || "—", "",
    "Category:", s.category || DEFAULT_CATEGORY, "",
    "Key Points:", ...kp.map((p) => `- ${p}`), "",
    "Notes:", s.notes || "—", "", "My Thoughts:", s.thoughts || "—",
  ].join("\n");
}

function metaVal(label: string, value: string, muted = false) {
  return `<div class="note-meta-item"><div class="note-section-label">${label}</div><p class="${muted ? "note-placeholder" : ""}">${esc(value)}</p></div>`;
}

function renderP(value: string, placeholder: string, cls = "") {
  const paras = clean(value).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return `<p class="note-placeholder ${cls}">${esc(placeholder)}</p>`;
  return paras.map((p) => `<p class="${cls}">${esc(p).replace(/\n/g, "<br/>")}</p>`).join("");
}

function buildVideoSection(videoId: string) {
  return `<div class="note-divider"></div><section><div class="note-section-label">Video</div><div class="note-embed"><iframe src="https://www.youtube.com/embed/${esc(videoId)}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div></section>`;
}

function normKP(value?: string[] | string | null): string[] {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\n+/) : [];
  return Array.from(new Set(list.map((i) => i.replace(/^[\-•\d.\s]+/, "").trim()).filter((i) => i.length > 2))).slice(0, 6);
}

function deriveTimeline(s: StudioStructuredNote): string {
  const explicit = clean(s.timeline_period);
  if (explicit) return explicit;
  if (!s.timeline?.length) return "";
  const first = s.timeline[0]?.year; const last = s.timeline[s.timeline.length - 1]?.year;
  if (first && last && first !== last) return `${first} → ${last}`;
  return clean(first || last);
}

function clean(v?: string | number | null): string { return String(v ?? "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim(); }
function esc(v: string) { return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function decodeHtml(v: string) { return v.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
