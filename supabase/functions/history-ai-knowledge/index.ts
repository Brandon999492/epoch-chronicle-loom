/**
 * History AI with Knowledge Integration (Phase 5)
 * Queries internal DB before responding, includes archive links,
 * and can generate draft entries for missing topics.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_MODES = ["standard", "timeline", "deep", "quick", "debate", "map"];
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 30000;

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Search the internal database for relevant context
 */
async function queryInternalDB(supabase: any, userMessage: string) {
  const searchTerms = userMessage.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 5);

  if (!searchTerms.length) return { events: [], figures: [], dynasties: [], periods: [] };

  const searchPattern = searchTerms.join(" | ");
  const likePattern = `%${searchTerms[0]}%`;

  const [eventsRes, figuresRes, dynastiesRes, periodsRes] = await Promise.all([
    supabase.from("historical_events")
      .select("id, title, year, year_label, category, description, slug")
      .or(searchTerms.map((t: string) => `title.ilike.%${t}%`).join(","))
      .limit(10),
    supabase.from("historical_figures")
      .select("id, name, title, birth_label, death_label, biography, slug, dynasty_id")
      .or(searchTerms.map((t: string) => `name.ilike.%${t}%`).join(","))
      .limit(10),
    supabase.from("dynasties")
      .select("id, name, start_label, end_label, description, slug")
      .or(searchTerms.map((t: string) => `name.ilike.%${t}%`).join(","))
      .limit(5),
    supabase.from("time_periods")
      .select("id, name, start_label, end_label, description, slug")
      .or(searchTerms.map((t: string) => `name.ilike.%${t}%`).join(","))
      .limit(5),
  ]);

  return {
    events: eventsRes.data || [],
    figures: figuresRes.data || [],
    dynasties: dynastiesRes.data || [],
    periods: periodsRes.data || [],
  };
}

/**
 * Get relationships for found figures
 */
async function getRelationships(supabase: any, figureIds: string[]) {
  if (!figureIds.length) return [];
  const { data } = await supabase
    .from("event_figures")
    .select("event_id, figure_id, role, event:historical_events(id, title, year_label)")
    .in("figure_id", figureIds)
    .limit(20);
  return data || [];
}

function formatDBContext(dbResults: any, relationships: any[]): string {
  const sections: string[] = [];

  if (dbResults.events.length) {
    sections.push("## Internal Archive — Events Found:\n" +
      dbResults.events.map((e: any) =>
        `- **${e.title}** (${e.year_label || "date unknown"}) [Category: ${e.category}] → Archive link: /event/${e.id}\n  ${e.description || ""}`
      ).join("\n"));
  }

  if (dbResults.figures.length) {
    sections.push("## Internal Archive — Historical Figures Found:\n" +
      dbResults.figures.map((f: any) =>
        `- **${f.name}** (${f.birth_label || "?"} – ${f.death_label || "?"}) ${f.title || ""} → Archive link: /figures/${f.id}\n  ${(f.biography || "").slice(0, 200)}`
      ).join("\n"));
  }

  if (dbResults.dynasties.length) {
    sections.push("## Internal Archive — Dynasties Found:\n" +
      dbResults.dynasties.map((d: any) =>
        `- **${d.name}** (${d.start_label || "?"} – ${d.end_label || "?"}) → Archive link: /dynasties/${d.id}\n  ${(d.description || "").slice(0, 150)}`
      ).join("\n"));
  }

  if (dbResults.periods.length) {
    sections.push("## Internal Archive — Time Periods:\n" +
      dbResults.periods.map((p: any) =>
        `- **${p.name}** (${p.start_label || "?"} – ${p.end_label || "?"})\n  ${(p.description || "").slice(0, 150)}`
      ).join("\n"));
  }

  if (relationships.length) {
    sections.push("## Relationships between figures and events:\n" +
      relationships.map((r: any) =>
        `- Figure linked to event "${r.event?.title}" (${r.event?.year_label || "?"}) as ${r.role || "participant"}`
      ).join("\n"));
  }

  if (!sections.length) {
    return "\n[No matching records found in internal archive. Use general historical knowledge but note this topic may need to be added to the archive.]";
  }

  return "\n" + sections.join("\n\n");
}

const SYSTEM_PROMPT_BASE = `You are the History Intelligence AI — the core intelligence engine of the Universal History Archive.

CRITICAL RULES:
1. ALWAYS check the INTERNAL ARCHIVE CONTEXT provided below before answering. If the archive has relevant data, reference it and include the archive links.
2. When referencing archive entries, use markdown links like [Event Title](/event/uuid) or [Figure Name](/figures/uuid).
3. If the archive has partial information, supplement with your knowledge but clearly distinguish archive data from general knowledge.
4. If a topic is NOT in the archive, still answer from your knowledge but add a note: "📝 This topic is not yet in the archive and could be added."
5. ONLY answer questions about history.
6. Use markdown formatting for clarity.
7. When information is uncertain, label it as "Disputed", "Estimated", or "Historically debated".
8. Provide trusted external source links when relevant.`;

const MODE_ADDITIONS: Record<string, string> = {
  standard: "",
  timeline: "\nPresent ALL information chronologically as a timeline with dates as headers.",
  deep: "\nProvide long, academic-style responses with historiographical context, primary source references, and scholarly debate.",
  quick: "\nProvide concise bullet-point answers. Maximum 5-8 bullet points.",
  debate: "\nPresent AT LEAST two competing historical interpretations or perspectives for every topic.",
  map: "\nEmphasize GEOGRAPHY and LOCATIONS. Provide coordinates, geographical significance, and use 📍 markers.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return errorResponse(401, "Unauthorized");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return errorResponse(401, "Unauthorized");

    const body = await req.json();
    const { messages, mode = "standard" } = body;

    if (!VALID_MODES.includes(mode)) return errorResponse(400, "Invalid mode.");
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return errorResponse(400, `Messages must be 1-${MAX_MESSAGES} items.`);
    }
    for (const msg of messages) {
      if (!msg || typeof msg.content !== "string" || !["user", "assistant"].includes(msg.role)) {
        return errorResponse(400, "Invalid message format.");
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return errorResponse(400, `Each message must be under ${MAX_MESSAGE_LENGTH} chars.`);
      }
    }

    // Use anon key for DB queries — all queried tables have public read RLS
    const readClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Query internal DB based on latest user message
    const latestUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
    const dbResults = await queryInternalDB(adminClient, latestUserMsg);
    const figureIds = dbResults.figures.map((f: any) => f.id);
    const relationships = await getRelationships(adminClient, figureIds);
    const dbContext = formatDBContext(dbResults, relationships);

    const systemPrompt = SYSTEM_PROMPT_BASE + MODE_ADDITIONS[mode] +
      "\n\n---\n\n# INTERNAL ARCHIVE CONTEXT\n" + dbContext;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return errorResponse(429, "Rate limit exceeded. Please wait and try again.");
      if (response.status === 402) return errorResponse(402, "AI usage credits exhausted.");
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return errorResponse(500, "AI service temporarily unavailable.");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("history-ai-knowledge error:", e);
    return errorResponse(500, "An unexpected error occurred.");
  }
});
