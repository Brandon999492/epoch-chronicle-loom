// Multi-stage AI knowledge synthesis pipeline.
// Stages: ingest → chunk → rank → synthesize.
// Returns a structured note JSON optimized for the StructuredNoteView renderer.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const FAST_MODEL = "google/gemini-2.5-flash";
const PRO_MODEL = "google/gemini-2.5-pro";

type Json = Record<string, unknown>;

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function detectKind(input: string): "youtube" | "url" | "transcript" | "article" | "freeform" {
  const t = input.trim();
  if (/(?:youtube\.com\/watch\?v=|youtu\.be\/)/i.test(t)) return "youtube";
  if (/^https?:\/\//i.test(t) && t.split(/\s+/).length < 3) return "url";
  // Transcripts often have timestamps like 00:01 or speaker labels
  if (/\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(t) && t.length > 800) return "transcript";
  if (t.length > 1500 && /\n\n/.test(t)) return "article";
  return "freeform";
}

function youtubeId(input: string): string | null {
  const m = input.match(/(?:youtu\.be\/|v=)([^&?\s]+)/);
  return m ? m[1] : null;
}

// Semantic-ish chunking: split on blank lines / headings, then merge into ~target-char windows.
function chunkContent(text: string, targetChars = 6000): string[] {
  const t = text.trim();
  if (t.length <= targetChars) return [t];
  const blocks = t.split(/\n{2,}|(?=\n#{1,6}\s)/g).map((b) => b.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = "";
  for (const b of blocks) {
    if (cur.length + b.length + 2 > targetChars && cur) {
      chunks.push(cur);
      cur = b;
    } else {
      cur = cur ? `${cur}\n\n${b}` : b;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

async function callAi(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  tool?: { name: string; parameters: Json };
}) {
  const body: Json = {
    model: opts.model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  if (opts.tool) {
    body.tools = [{
      type: "function",
      function: { name: opts.tool.name, description: "Return structured output.", parameters: opts.tool.parameters },
    }];
    body.tool_choice = { type: "function", function: { name: opts.tool.name } };
  }
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const status = resp.status;
    const txt = await resp.text().catch(() => "");
    throw new Error(`AI ${status}: ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  if (opts.tool) {
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) throw new Error("No structured response");
    return JSON.parse(tc.function.arguments);
  }
  return data.choices?.[0]?.message?.content ?? "";
}

const RANK_SCHEMA = {
  type: "object",
  properties: {
    chunk_topic: { type: "string", description: "One-line topic this chunk covers" },
    key_concepts: { type: "array", items: { type: "string" }, description: "Up to 8 most important concepts/claims/arguments" },
    entities: { type: "array", items: { type: "string" }, description: "Named entities: people, places, organizations" },
    dates: { type: "array", items: { type: "string" }, description: "Dates or time references with brief context" },
    importance_score: { type: "number", description: "0-10 how content-rich this chunk is" },
  },
  required: ["chunk_topic", "key_concepts", "entities", "dates", "importance_score"],
  additionalProperties: false,
} as Json;

const SYNTH_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Concise, intelligent title (max 90 chars)" },
    subtitle: { type: "string", description: "One-sentence subtitle that frames the note" },
    summary: { type: "string", description: "3-5 sentence executive summary" },
    category: { type: "string", description: "Single category label" },
    tags: { type: "array", items: { type: "string" }, description: "5-10 short tags" },
    key_insights: { type: "array", items: { type: "string" }, description: "5-8 high-signal insights, each one sentence" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          body: { type: "string", description: "Markdown-light prose, 1-3 paragraphs" },
          type: { type: "string", enum: ["text", "insight", "quote"] },
        },
        required: ["heading", "body", "type"],
        additionalProperties: false,
      },
      description: "3-7 structured sections covering the material",
    },
    timeline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          year: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["year", "title", "description"],
        additionalProperties: false,
      },
      description: "Chronological events if applicable (can be empty)",
    },
    figures: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          significance: { type: "string" },
        },
        required: ["name", "role", "significance"],
        additionalProperties: false,
      },
      description: "Key figures (can be empty)",
    },
    related_topics: { type: "array", items: { type: "string" }, description: "3-6 related topics for further exploration" },
  },
  required: ["title", "subtitle", "summary", "category", "tags", "key_insights", "sections", "timeline", "figures", "related_topics"],
  additionalProperties: false,
} as Json;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const body = await req.json();
    const { input, mode = "generate", structured: existing, expansionType, additional } = body ?? {};
    const raw = String(input ?? "").trim();

    // ── Quick modes (no full pipeline) ──
    if (mode === "improve" || mode === "summarize" || mode === "continue") {
      if (!raw) return json({ error: "Input is required" }, 400);
      const sys =
        mode === "improve"
          ? "You are an expert editor. Improve the text for clarity, grammar, flow, and concision. Preserve meaning. Return only the improved text, no preamble."
          : mode === "summarize"
          ? "Summarize the text in 3-5 calm, readable sentences. Lead with the most important point."
          : "Continue the user's writing in the same voice and tone. Add 1-2 paragraphs that naturally extend the ideas. Return only the continuation.";
      const out = await callAi({ apiKey, model: FAST_MODEL, system: sys, user: raw });
      return json({ result: String(out).trim() });
    }

    // ── EXPAND: deepen an existing structured note in place ──
    if (mode === "expand") {
      if (!existing) return json({ error: "Existing note required" }, 400);
      const directive = expansionInstruction(String(expansionType ?? "more_detail"));
      const expandSystem = [
        "You are a senior research editor evolving an existing structured knowledge note into a deeper v2.",
        "CRITICAL RULES:",
        "- Preserve every existing section heading, insight, timeline entry, and figure. Do NOT delete or rename them.",
        "- Deepen existing section bodies with additional nuance, context, and supporting detail (1-3 extra paragraphs each where useful).",
        "- You may ADD new sections, insights, timeline events, or figures where they meaningfully extend the note.",
        "- Keep the same voice, tone, category, and overall structure. No filler.",
        directive,
      ].join("\n");
      const expandUser = `Existing structured note (JSON):\n${JSON.stringify(existing).slice(0, 60_000)}\n\nReturn the FULL evolved note as structured JSON.`;
      const out = await callAi({
        apiKey, model: PRO_MODEL, system: expandSystem, user: expandUser,
        tool: { name: "compose_structured_note", parameters: SYNTH_SCHEMA },
      });
      return json({ structured: out });
    }

    // ── MERGE: integrate new material into existing note ──
    if (mode === "merge") {
      if (!existing) return json({ error: "Existing note required" }, 400);
      const extra = String(additional ?? "").trim();
      if (!extra) return json({ error: "Additional content required" }, 400);
      const mergeSystem = [
        "You are a senior research editor merging NEW MATERIAL into an existing structured knowledge note.",
        "CRITICAL RULES:",
        "- Preserve all existing sections, insights, timeline, and figures. Do not rename or remove them.",
        "- For each piece of the new material, identify the MOST RELEVANT existing section and weave the new information into that section's body.",
        "- Only create a NEW section if the new material genuinely does not fit any existing section.",
        "- Add new key insights, timeline events, or figures where supported by the new material.",
        "- The result must feel seamless — a reader should not be able to tell which parts were added later.",
        "- Maintain the original voice, tone, and category.",
      ].join("\n");
      const mergeUser =
        `EXISTING NOTE (JSON):\n${JSON.stringify(existing).slice(0, 50_000)}\n\n` +
        `NEW MATERIAL TO INTEGRATE:\n${extra.slice(0, 80_000)}\n\n` +
        `Return the FULL merged note as structured JSON.`;
      const out = await callAi({
        apiKey, model: PRO_MODEL, system: mergeSystem, user: mergeUser,
        tool: { name: "compose_structured_note", parameters: SYNTH_SCHEMA },
      });
      return json({ structured: out });
    }

    // ── generate (default): full multi-stage synthesis ──
    if (!raw) return json({ error: "Input is required" }, 400);
    if (raw.length > 200_000) return json({ error: "Input too large (max ~200k chars)" }, 400);

    // ── Full multi-stage synthesis ──
    const kind = detectKind(raw);
    const ytId = kind === "youtube" ? youtubeId(raw) : null;

    // For URLs/YouTube we don't fetch transcripts here — pass the link as topic context.
    const corpus = kind === "youtube" || kind === "url"
      ? `Source link: ${raw}\n\nGenerate the note based on what this resource is about, your knowledge of it, and reasonable inference.`
      : raw;

    const chunks = chunkContent(corpus);
    let outline = "";

    if (chunks.length > 1) {
      // STAGE: rank — extract per-chunk signal in parallel
      const ranked = await Promise.all(chunks.map(async (chunk, i) => {
        try {
          const r = await callAi({
            apiKey, model: FAST_MODEL,
            system: "You extract the highest-signal information from a chunk of text. Be precise. Skip filler.",
            user: `Chunk ${i + 1} of ${chunks.length}:\n\n${chunk}`,
            tool: { name: "rank_chunk", parameters: RANK_SCHEMA },
          });
          return r;
        } catch {
          return null;
        }
      }));

      const valid = ranked.filter(Boolean) as Array<{
        chunk_topic: string;
        key_concepts: string[];
        entities: string[];
        dates: string[];
        importance_score: number;
      }>;
      valid.sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));

      const seenConcepts = new Set<string>();
      const seenEntities = new Set<string>();
      const seenDates = new Set<string>();
      const dedupe = (arr: string[], seen: Set<string>) => arr.filter((x) => {
        const k = x.toLowerCase().trim();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      const outlineLines: string[] = [];
      for (const r of valid) {
        outlineLines.push(`### ${r.chunk_topic} (importance ${r.importance_score})`);
        const c = dedupe(r.key_concepts || [], seenConcepts);
        const e = dedupe(r.entities || [], seenEntities);
        const d = dedupe(r.dates || [], seenDates);
        if (c.length) outlineLines.push(`Concepts: ${c.join("; ")}`);
        if (e.length) outlineLines.push(`Entities: ${e.join("; ")}`);
        if (d.length) outlineLines.push(`Dates: ${d.join("; ")}`);
        outlineLines.push("");
      }
      outline = outlineLines.join("\n");
    }

    // STAGE: synthesize
    const synthSystem = [
      "You are a senior research editor producing a structured knowledge note.",
      "Be factual, calm, and curated — like a great Wikipedia editor crossed with a Notion AI Page.",
      "Prioritize clarity over completeness. Avoid filler. Avoid generic platitudes.",
      "Lead each section with the most important idea. Vary sentence length.",
      "If timeline or figures don't apply, return empty arrays.",
    ].join(" ");

    const synthUser = outline
      ? `Source content (long, ${chunks.length} chunks). Use the ranked outline below as the spine of your note; pull supporting detail from the source as needed.\n\n=== RANKED OUTLINE ===\n${outline}\n\n=== ORIGINAL SOURCE (for verification) ===\n${corpus.slice(0, 40_000)}`
      : `Source content:\n\n${corpus}`;

    const structured = await callAi({
      apiKey, model: PRO_MODEL,
      system: synthSystem,
      user: synthUser,
      tool: { name: "compose_structured_note", parameters: SYNTH_SCHEMA },
    });

    return json({ structured, videoId: ytId, kind });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("knowledge-synthesize error:", msg);
    return json({ error: msg }, 500);
  }
});
