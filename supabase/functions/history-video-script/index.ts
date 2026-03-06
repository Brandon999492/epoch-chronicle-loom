import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const ADVANCED_MODE_INSTRUCTIONS: Record<string, string> = {
  "standard": "",
  "deep-analysis": `\nADDITIONAL MODE: DEEP HISTORICAL ANALYSIS
- Provide extensive academic-level detail in narration
- Include historiographic debate references
- Add detailed citations and source analysis
- Mention primary vs secondary sources
- Include disputed interpretations where relevant`,
  "quick-summary": `\nADDITIONAL MODE: QUICK SUMMARY
- Keep narration concise and punchy
- Use bullet-point style key facts as on-screen text
- Maximum 4 scenes
- Focus on the most impactful moments only`,
  "battle-strategy": `\nADDITIONAL MODE: BATTLE STRATEGY VISUALIZATION
- Focus on troop movements and formations
- Include terrain analysis in visual descriptions
- Add strategy overlays and tactical annotations
- Include casualty estimates as on-screen text
- Use aerial/map-flyover camera directions extensively`,
  "map-evolution": `\nADDITIONAL MODE: MAP EVOLUTION
- Focus on territorial changes over time
- Visual descriptions should emphasize geographic boundaries
- Include coordinates and regional names
- Show expansion/contraction of territories per scene
- Camera direction should use map-flyover and aerial views`,
  "royal-lineage": `\nADDITIONAL MODE: ROYAL FAMILY LINEAGE ANIMATION
- Structure scenes around succession and family connections
- Include birth/death/reign dates prominently
- Visual descriptions should feature portrait transitions
- Highlight dynastic changes and branches
- Include marriage alliances and political implications`,
};

const SYSTEM_PROMPT = `You are a professional historical documentary scriptwriter and scene planner for the Universal History Archive's Video Studio.

When given a historical topic, you must produce a structured video script in JSON format with the following structure:
{
  "title": "Video title",
  "synopsis": "Brief 2-sentence overview",
  "era": "ancient|classical|medieval|early-modern|modern|contemporary",
  "category": "documentary|battle|timeline|biography|reconstruction",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene title",
      "duration": 10,
      "narration": "The narrator text for this scene...",
      "visualDescription": "Detailed description of what should be shown visually",
      "cameraDirection": "slow zoom|pan left|aerial view|static|tracking shot|map flyover",
      "musicMood": "dramatic|solemn|triumphant|mysterious|peaceful",
      "onScreenText": "Optional text overlay / citation"
    }
  ],
  "totalDuration": 60,
  "suggestedMusic": "Overall music style suggestion",
  "historicalSources": ["Source 1", "Source 2"]
}

RULES:
- Only create scripts about historical topics
- Be historically accurate; label disputed facts
- Each scene should be 5-15 seconds for short videos, up to 60 seconds for documentaries
- Include narration that is engaging and educational
- Visual descriptions should be detailed enough for AI image/video generation
- Always include at least 3 scenes
- For longer formats (5+ minutes), include up to 20 scenes
- Include on-screen citations for key facts
- Provide at least 3 historical sources
- All generated content is labeled "AI Historical Reconstruction"
- Respond ONLY with valid JSON, no other text`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    if (userError || !user) return errorResponse(401, "Unauthorized");

    const body = await req.json();
    const { prompt, style = "documentary", duration = 60, advancedMode = "standard" } = body;

    if (!prompt || typeof prompt !== "string" || prompt.length > 5000) {
      return errorResponse(400, "Invalid prompt (max 5000 chars).");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const modeInstructions = ADVANCED_MODE_INSTRUCTIONS[advancedMode] || "";
    const fullSystemPrompt = SYSTEM_PROMPT + modeInstructions;

    const userMessage = `Create a ${style} video script about: "${prompt}". Target duration: approximately ${duration} seconds. Break into appropriate scenes. ${advancedMode !== "standard" ? `Use ${advancedMode} mode.` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return errorResponse(429, "Rate limit exceeded. Please wait.");
      if (response.status === 402) return errorResponse(402, "AI credits exhausted.");
      console.error("AI gateway error:", response.status, await response.text());
      return errorResponse(500, "AI service temporarily unavailable.");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let script;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      script = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      script = null;
    }

    if (!script) {
      return errorResponse(500, "Failed to generate valid script. Please try again.");
    }

    return new Response(JSON.stringify({ script }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("history-video-script error:", e);
    return errorResponse(500, "An unexpected error occurred.");
  }
});
