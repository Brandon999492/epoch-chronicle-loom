import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, text, url } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const aiHeaders = { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" };

    // YouTube AI extraction
    if (action === "youtube_extract") {
      if (!url) {
        return new Response(JSON.stringify({ error: "URL is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const match = url.match(/(?:youtu\.be\/|v=)([^&?]+)/);
      const videoId = match ? match[1] : null;

      const prompt = `You are given a YouTube video URL: ${url}
${videoId ? `Video ID: ${videoId}` : ""}

Based on the URL and video ID, provide a comprehensive analysis in exactly this format:

## Summary
Write a 2-3 sentence summary of what this video likely covers based on the URL context.

## Key Points
- Point 1
- Point 2
- Point 3
- Point 4
- Point 5

## Important Takeaways
1. First key takeaway
2. Second key takeaway
3. Third key takeaway

## My Notes
[Space for personal notes]

Be informative and educational. If you can identify the video topic from the URL, provide relevant historical/educational context.`;

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a knowledge extraction assistant. Analyze YouTube videos and extract structured educational content. Always provide useful, educational summaries even from limited URL information." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!resp.ok) {
        const status = resp.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error: ${status}`);
      }

      const data = await resp.json();
      const result = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ result, videoId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI expand from quick capture
    if (action === "expand_note") {
      if (!text?.trim()) {
        return new Response(JSON.stringify({ error: "Text is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a knowledge assistant. Take a brief note or idea and expand it into a well-structured, educational note with sections: Summary, Key Points, and Details. Use markdown formatting." },
            { role: "user", content: `Expand this note into a comprehensive, well-structured document:\n\n${text}` },
          ],
        }),
      });

      if (!resp.ok) {
        const status = resp.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error: ${status}`);
      }

      const data = await resp.json();
      const result = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Standard text AI actions
    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: "Select text or write something first" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompts: Record<string, string> = {
      grammar: "Fix all grammar, spelling, and punctuation errors. Return ONLY the corrected text, no explanations.",
      improve: "Improve this text for clarity, readability, and flow. Keep the meaning. Return ONLY the improved text.",
      summarize: "Summarize this text in a concise paragraph. Return ONLY the summary.",
      expand: "Expand on the ideas in this text with more detail and context. Return ONLY the expanded text.",
      rewrite: "Rewrite this text in a more engaging, polished style. Return ONLY the rewritten text.",
    };

    const systemPrompt = prompts[action];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!resp.ok) {
      const status = resp.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await resp.json();
    const result = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("knowledge-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
