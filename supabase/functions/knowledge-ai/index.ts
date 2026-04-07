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

    const callAI = async (systemPrompt: string, userPrompt: string, tools?: any[], toolChoice?: any) => {
      const body: any = {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      };
      if (tools) { body.tools = tools; body.tool_choice = toolChoice; }

      const resp = await fetch(AI_URL, { method: "POST", headers: aiHeaders, body: JSON.stringify(body) });
      if (!resp.ok) {
        const status = resp.status;
        if (status === 429) return { error: "Rate limited, try again shortly.", status: 429 };
        if (status === 402) return { error: "AI credits exhausted.", status: 402 };
        throw new Error(`AI gateway error: ${status}`);
      }
      return await resp.json();
    };

    // ─── Generate Structured Note ───
    if (action === "generate_structured_note") {
      const input = text?.trim() || url?.trim();
      if (!input) {
        return new Response(JSON.stringify({ error: "Provide a topic, text, or URL" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isYoutube = input.match(/(?:youtu\.be\/|v=)([^&?]+)/);
      const userPrompt = isYoutube
        ? `Analyze this YouTube video URL and generate a structured knowledge note: ${input}`
        : `Generate a structured knowledge note about: ${input}`;

      const tools = [{
        type: "function",
        function: {
          name: "create_structured_note",
          description: "Create a structured knowledge note with all required fields filled in.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Clear, concise title" },
              headline: { type: "string", description: "One-line engaging headline" },
              summary: { type: "string", description: "2-3 sentence summary" },
              year: { type: "string", description: "Relevant year or date range, e.g. '1969' or '65 million years ago'" },
              timeline_period: { type: "string", description: "Historical period, e.g. 'Modern Era', 'Mesozoic', 'Ancient'" },
              category: { type: "string", description: "Best matching category from: Ice Age, Space, Serial Killers, Ancient Egypt, Ancient Greece, Royal Family, Dinosaurs, Earth History, Extinction Events, American History, or a custom one" },
              key_points: { type: "array", items: { type: "string" }, description: "5-8 key points or facts" },
              detailed_notes: { type: "string", description: "Detailed educational content, 3-5 paragraphs" },
              thoughts: { type: "string", description: "Suggested reflection questions or areas for further study" },
            },
            required: ["title", "headline", "summary", "year", "timeline_period", "category", "key_points", "detailed_notes", "thoughts"],
            additionalProperties: false,
          },
        },
      }];

      const data = await callAI(
        "You are a knowledge research assistant. Generate comprehensive, educational structured notes. Be factual, clear, and engaging. Always fill every field thoroughly.",
        userPrompt,
        tools,
        { type: "function", function: { name: "create_structured_note" } }
      );

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error }), {
          status: data.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("AI did not return structured data");

      let structured;
      try { structured = JSON.parse(toolCall.function.arguments); } catch { throw new Error("Failed to parse AI response"); }

      const videoId = isYoutube ? isYoutube[1] : null;
      return new Response(JSON.stringify({ structured, videoId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── YouTube Structured Extraction ───
    if (action === "youtube_structured") {
      if (!url) {
        return new Response(JSON.stringify({ error: "URL is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const match = url.match(/(?:youtu\.be\/|v=)([^&?]+)/);
      const videoId = match ? match[1] : null;

      const tools = [{
        type: "function",
        function: {
          name: "extract_youtube_note",
          description: "Extract structured knowledge from a YouTube video.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              headline: { type: "string" },
              summary: { type: "string" },
              year: { type: "string" },
              timeline_period: { type: "string" },
              category: { type: "string" },
              key_points: { type: "array", items: { type: "string" } },
              detailed_notes: { type: "string" },
              thoughts: { type: "string" },
            },
            required: ["title", "headline", "summary", "year", "timeline_period", "category", "key_points", "detailed_notes", "thoughts"],
            additionalProperties: false,
          },
        },
      }];

      const data = await callAI(
        "You are a knowledge extraction assistant. Analyze YouTube videos and extract structured educational content. Be thorough and educational.",
        `Analyze this YouTube video and extract structured knowledge:\nURL: ${url}\n${videoId ? `Video ID: ${videoId}` : ""}\n\nProvide comprehensive educational content based on what this video likely covers.`,
        tools,
        { type: "function", function: { name: "extract_youtube_note" } }
      );

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error }), {
          status: data.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("AI did not return structured data");

      let structured;
      try { structured = JSON.parse(toolCall.function.arguments); } catch { throw new Error("Failed to parse AI response"); }

      return new Response(JSON.stringify({ structured, videoId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Legacy YouTube extract (keep for backward compat) ───
    if (action === "youtube_extract") {
      if (!url) {
        return new Response(JSON.stringify({ error: "URL is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const match = url.match(/(?:youtu\.be\/|v=)([^&?]+)/);
      const videoId = match ? match[1] : null;

      const data = await callAI(
        "You are a knowledge extraction assistant. Analyze YouTube videos and extract structured educational content.",
        `Analyze this YouTube video URL: ${url}\n${videoId ? `Video ID: ${videoId}` : ""}\n\nProvide:\n## Summary\n## Key Points\n## Important Takeaways\n## My Notes`,
      );

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error }), {
          status: data.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ result, videoId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Expand Note ───
    if (action === "expand_note") {
      if (!text?.trim()) {
        return new Response(JSON.stringify({ error: "Text is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await callAI(
        "You are a knowledge assistant. Take a brief note or idea and expand it into a well-structured, educational note with sections: Summary, Key Points, and Details. Use markdown formatting.",
        `Expand this note into a comprehensive, well-structured document:\n\n${text}`,
      );

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error }), {
          status: data.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Standard Text AI Actions ───
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
      simplify: "Simplify this text to make it easier to understand. Use shorter sentences and simpler words. Return ONLY the simplified text.",
    };

    const systemPrompt = prompts[action];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await callAI(systemPrompt, text);

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error }), {
        status: data.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
