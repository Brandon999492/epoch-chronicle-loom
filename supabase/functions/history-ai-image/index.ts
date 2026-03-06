import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PROMPT_LENGTH = 1000;

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
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return errorResponse(400, "Prompt is required.");
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return errorResponse(400, `Prompt must be under ${MAX_PROMPT_LENGTH} characters.`);
    }

    // --- Call AI gateway ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const historyPrompt = `Historical reconstruction: ${prompt.trim()}. Highly detailed, historically accurate, photorealistic style, dramatic lighting. Label: AI Historical Reconstruction.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: historyPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return errorResponse(429, "Rate limit exceeded.");
      if (response.status === 402) return errorResponse(402, "AI credits exhausted.");
      const t = await response.text();
      console.error("Image gen error:", response.status, t);
      return errorResponse(500, "Image generation failed.");
    }

    const data = await response.json();
    console.log("AI image response structure:", JSON.stringify(data).slice(0, 500));
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const text = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      console.error("No image in AI response. Full response:", JSON.stringify(data).slice(0, 1000));
      return errorResponse(500, "The AI model did not return an image. Please try again with a different prompt.");
    }

    return new Response(JSON.stringify({ imageUrl, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("history-ai-image error:", e);
    return errorResponse(500, "An unexpected error occurred.");
  }
});
