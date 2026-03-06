import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_MODES = ["standard", "timeline", "deep", "quick", "debate", "map"];
const VALID_ROLES = ["user", "assistant"];
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 30000;

const SYSTEM_PROMPTS: Record<string, string> = {
  standard: `You are the History Intelligence AI — the core intelligence engine of the Universal History Archive. You are a world-class historian with encyclopedic knowledge of all time periods, civilizations, wars, political movements, religions, scientific discoveries, cultural shifts, monarchies, empires, assassinations, and more.

RULES:
- ONLY answer questions about history. If asked about non-historical topics, politely redirect to history.
- Provide dates, locations, key figures, causes, and consequences.
- When information is uncertain, label it as "Disputed", "Estimated", or "Historically debated".
- Present multiple perspectives when relevant.
- Use markdown formatting for clarity (headers, bold, lists).
- When mentioning historical events, figures, or eras that exist in the archive, wrap them in internal links using this format: [Name](/era/era-id) or [Name](/event/event-id) or [Name](/royals/house-id/royal-id).
- Provide trusted external source links when relevant (Wikipedia, Britannica, museum sites, academic sources).
- Keep a neutral, academic tone.
- Always be thorough but accessible.`,

  timeline: `You are the History Intelligence AI in Timeline Mode. Arrange ALL information chronologically. Present events as a timeline with clear dates. Use markdown formatting with dates as headers. Follow all standard history rules. Only discuss history.`,

  deep: `You are the History Intelligence AI in Deep Analysis Mode. Provide long, academic-style responses with extensive detail, historiographical context, primary source references, and scholarly debate. Cite historians and their interpretations. Follow all standard history rules. Only discuss history.`,

  quick: `You are the History Intelligence AI in Quick Summary Mode. Provide concise, bullet-point answers. Maximum 5-8 bullet points. Be direct and factual. Follow all standard history rules. Only discuss history.`,

  debate: `You are the History Intelligence AI in Debate Mode. For every topic, present AT LEAST two competing historical interpretations or perspectives. Label each perspective clearly. Explain the evidence for each side. Follow all standard history rules. Only discuss history.`,

  map: `You are the History Intelligence AI in Map Mode. For every historical topic, emphasize GEOGRAPHY and LOCATIONS. For each event or figure discussed:
- State the exact location (city, region, country)
- Provide approximate coordinates (latitude, longitude) when possible
- Describe the geographical significance of the location
- Mention nearby landmarks or geographical features relevant to the event
- When discussing wars or movements, trace the geographical path/route
- Use markdown tables for listing multiple locations with coordinates
- Format location data clearly with 📍 markers
Follow all standard history rules. Only discuss history.`,
};

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth: verify user JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "Unauthorized");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return errorResponse(401, "Unauthorized");
    }

    // --- Input validation ---
    const body = await req.json();
    const { messages, mode = "standard" } = body;

    if (!VALID_MODES.includes(mode)) {
      return errorResponse(400, "Invalid mode.");
    }

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return errorResponse(400, `Messages must be an array of 1-${MAX_MESSAGES} items.`);
    }

    for (const msg of messages) {
      if (!msg || typeof msg.content !== "string" || !VALID_ROLES.includes(msg.role)) {
        return errorResponse(400, "Invalid message format.");
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return errorResponse(400, `Each message must be under ${MAX_MESSAGE_LENGTH} characters.`);
      }
    }

    // --- Call AI gateway ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[mode];

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
      if (response.status === 429) return errorResponse(429, "Rate limit exceeded. Please wait a moment and try again.");
      if (response.status === 402) return errorResponse(402, "AI usage credits exhausted.");
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return errorResponse(500, "AI service temporarily unavailable.");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("history-ai error:", e);
    return errorResponse(500, "An unexpected error occurred.");
  }
});
