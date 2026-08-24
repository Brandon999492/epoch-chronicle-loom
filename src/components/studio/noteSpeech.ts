import type { StructuredNote } from "@/components/studio/StructuredNoteView";

export type SpeechChunk = {
  /** Text actually spoken */
  text: string;
  /** Extra silence (ms) after this chunk — used for section pauses */
  pauseAfter: number;
  /** Section label for progress display */
  section: string;
  /** Heading chunks get slightly slower, lower delivery */
  kind: "heading" | "body";
};

const MAX_CHARS = 220;

function clean(raw: string): string {
  return raw
    // strip html/editor markup
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    // markdown image / link markup
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // urls
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/www\.\S+/gi, " ")
    // entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "and")
    .replace(/&lt;/g, " ")
    .replace(/&gt;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // leftover markdown emphasis / bullets
    .replace(/^[\s]*[-*•]\s+/gm, "")
    .replace(/[*_`#]{1,3}/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Split a long paragraph into speakable sentence-sized chunks. */
function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?…]+[.!?…]+["')\]]*|\S+$/g) ?? [text];
  const out: string[] = [];
  let buf = "";
  for (const raw of parts) {
    const s = raw.trim();
    if (!s) continue;
    if (s.length > MAX_CHARS) {
      if (buf) { out.push(buf); buf = ""; }
      // hard-split very long sentences on commas / clause breaks
      let rest = s;
      while (rest.length > MAX_CHARS) {
        const window = rest.slice(0, MAX_CHARS);
        const cut = Math.max(window.lastIndexOf(", "), window.lastIndexOf("; "), window.lastIndexOf(" — "), window.lastIndexOf(" "));
        const at = cut > 40 ? cut + 1 : MAX_CHARS;
        out.push(rest.slice(0, at).trim());
        rest = rest.slice(at).trim();
      }
      if (rest) out.push(rest);
      continue;
    }
    if ((buf + " " + s).trim().length > MAX_CHARS) {
      if (buf) out.push(buf);
      buf = s;
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
  }
  if (buf) out.push(buf);
  return out;
}

function pushSection(
  chunks: SpeechChunk[],
  heading: string | null,
  body: string,
  section: string,
  storyteller: boolean,
) {
  const cleaned = clean(body);
  if (!cleaned) return;
  if (heading) {
    chunks.push({
      text: clean(heading).replace(/[:.]+$/, ""),
      pauseAfter: storyteller ? 650 : 300,
      section,
      kind: "heading",
    });
  }
  const paragraphs = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  paragraphs.forEach((p, pi) => {
    const sentences = splitSentences(p);
    sentences.forEach((s, si) => {
      const last = si === sentences.length - 1;
      chunks.push({
        text: s,
        pauseAfter: last
          ? (pi === paragraphs.length - 1 ? (storyteller ? 750 : 350) : storyteller ? 480 : 220)
          : storyteller ? 130 : 0,
        section,
        kind: "body",
      });
    });
  });
}

/**
 * Convert the complete structured note into an ordered queue of speakable
 * chunks. Every section of the note is included — never only what is visible.
 */
export function buildNoteSpeech(note: StructuredNote, storyteller: boolean): SpeechChunk[] {
  const chunks: SpeechChunk[] = [];

  if (note.title) pushSection(chunks, null, note.title, "Title", storyteller);
  if (note.subtitle) pushSection(chunks, null, note.subtitle, "Title", storyteller);
  if (note.category) pushSection(chunks, null, `Subject: ${note.category}.`, "Subject", storyteller);
  if (note.summary) pushSection(chunks, "Summary.", note.summary, "Summary", storyteller);

  if (note.key_insights?.length) {
    pushSection(chunks, "Key points.", "", "Key points", storyteller);
    note.key_insights.forEach((ins, i) => {
      pushSection(chunks, null, `${i + 1}. ${ins}`, "Key points", storyteller);
    });
  }

  note.sections?.forEach((s) => {
    pushSection(chunks, `${s.heading}.`, s.body, s.heading, storyteller);
  });

  if (note.timeline?.length) {
    pushSection(chunks, "Timeline.", "", "Timeline", storyteller);
    note.timeline.forEach((t) => {
      pushSection(chunks, null, `${t.year}. ${t.title}. ${t.description}`, "Timeline", storyteller);
    });
  }

  if (note.figures?.length) {
    pushSection(chunks, "Key figures.", "", "Key figures", storyteller);
    note.figures.forEach((f) => {
      pushSection(chunks, null, `${f.name}, ${f.role}. ${f.significance}`, "Key figures", storyteller);
    });
  }

  if (note.related_topics?.length) {
    pushSection(chunks, "Explore further.", note.related_topics.join(". "), "Explore further", storyteller);
  }

  return chunks.filter((c) => c.text.trim().length > 0);
}

/** Friendly label for a browser voice. */
export function voiceLabel(v: SpeechSynthesisVoice): string {
  const name = v.name.replace(/^(Microsoft|Google|Apple)\s+/i, "").replace(/\s*\(.*?\)\s*$/, "").trim();
  return name || v.name;
}

const QUALITY_HINTS = [
  "premium", "enhanced", "neural", "natural", "siri", "eloquence",
  "ava", "jenny", "aria", "serena", "daniel", "samantha", "moira", "karen", "tessa",
];

/** Rank voices so the most expressive/high-quality device voice wins. */
export function rankVoice(v: SpeechSynthesisVoice): number {
  const n = `${v.name} ${v.voiceURI}`.toLowerCase();
  let score = 0;
  if (/^en/i.test(v.lang)) score += 40;
  if (/^en[-_]gb/i.test(v.lang)) score += 6;
  if (v.localService) score += 4;
  QUALITY_HINTS.forEach((h, i) => {
    if (n.includes(h)) score += 30 - i;
  });
  if (n.includes("compact")) score -= 25;
  if (n.includes("novelty") || n.includes("whisper") || n.includes("bells")) score -= 60;
  return score;
}

export function pickStorytellerVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  return [...voices].sort((a, b) => rankVoice(b) - rankVoice(a))[0];
}
