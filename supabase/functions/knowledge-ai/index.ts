import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, text, url, detailed } = await req.json();
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

    const jsonResp = (d: any, status = 200) =>
      new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const handleAiError = (data: any) => {
      if (data.error) return jsonResp({ error: data.error }, data.status || 500);
      return null;
    };

    const parseToolCall = (data: any) => {
      const tc = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!tc) throw new Error("AI did not return structured data");
      try { return JSON.parse(tc.function.arguments); } catch { throw new Error("Failed to parse AI response"); }
    };

    // ─── Magic Note (Full Automation) ───
    if (action === "magic_note") {
      const input = text?.trim() || url?.trim();
      if (!input) return jsonResp({ error: "Provide a topic, text, or URL" }, 400);

      const isYoutube = input.match(/(?:youtu\.be\/|v=)([^&?]+)/);
      const detailLevel = detailed ? "extremely comprehensive and in-depth (8-10 paragraphs for detailed notes, 8-12 key points, 6-8 timeline events)" : "comprehensive (4-6 paragraphs for detailed notes, 5-10 key points)";
      const userPrompt = isYoutube
        ? `Analyze this YouTube video URL and generate an ${detailLevel}, structured knowledge note. Include all historical context, timeline, figures, events, and quiz questions: ${input}`
        : `Generate an ${detailLevel}, structured knowledge note about: ${input}. Include all historical context, timeline, figures, events, and quiz questions.`;

      const tools = [{
        type: "function",
        function: {
          name: "create_magic_note",
          description: "Create a comprehensive structured knowledge note with all fields, timeline, figures, events, and quiz.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Clear, concise title" },
              headline: { type: "string", description: "One-line engaging headline" },
              summary: { type: "string", description: "2-3 sentence summary" },
              year: { type: "string", description: "Relevant year or date range" },
              timeline_period: { type: "string", description: "Historical period" },
              category: { type: "string", description: "Category: Ice Age, Space, Serial Killers, Ancient Egypt, Ancient Greece, Royal Family, Dinosaurs, Earth History, Extinction Events, American History, or custom" },
              key_points: { type: "array", items: { type: "string" }, description: "5-10 key points" },
              detailed_notes: { type: "string", description: "Detailed educational content, 4-6 paragraphs" },
              thoughts: { type: "string", description: "Reflection questions or areas for further study" },
              tags: { type: "array", items: { type: "string" }, description: "5-10 relevant tags" },
              mentioned_figures: { type: "array", items: { type: "string" }, description: "Historical figures mentioned" },
              mentioned_events: { type: "array", items: { type: "string" }, description: "Historical events referenced" },
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
                description: "Chronological timeline of events mentioned",
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
                description: "Key historical figures with roles",
              },
              quiz: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    correct_index: { type: "number" },
                    explanation: { type: "string" },
                  },
                  required: ["question", "options", "correct_index", "explanation"],
                  additionalProperties: false,
                },
                description: "5 multiple-choice quiz questions",
              },
            },
            required: ["title", "headline", "summary", "year", "timeline_period", "category", "key_points", "detailed_notes", "thoughts", "tags", "mentioned_figures", "mentioned_events", "timeline", "figures", "quiz"],
            additionalProperties: false,
          },
        },
      }];

      const data = await callAI(
        "You are an expert history knowledge assistant. Generate the most comprehensive, educational structured note possible. Fill EVERY field thoroughly. Include a detailed timeline of events, identify all key figures with their roles, and create 5 challenging quiz questions. Be factual, detailed, and engaging.",
        userPrompt, tools,
        { type: "function", function: { name: "create_magic_note" } }
      );

      const err = handleAiError(data);
      if (err) return err;

      const structured = parseToolCall(data);
      const videoId = isYoutube ? isYoutube[1] : null;

      let related = null;
      try {
        related = await findRelatedHistory(structured.mentioned_figures || [], structured.mentioned_events || [], structured.title);
      } catch (e) { console.error("find_related error:", e); }

      return jsonResp({ structured, videoId, related });
    }

    // ─── Generate Structured Note ───
    if (action === "generate_structured_note") {
      const input = text?.trim() || url?.trim();
      if (!input) return jsonResp({ error: "Provide a topic, text, or URL" }, 400);

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
              year: { type: "string", description: "Relevant year or date range" },
              timeline_period: { type: "string", description: "Historical period" },
              category: { type: "string", description: "Category from: Ice Age, Space, Serial Killers, Ancient Egypt, Ancient Greece, Royal Family, Dinosaurs, Earth History, Extinction Events, American History, or custom" },
              key_points: { type: "array", items: { type: "string" }, description: "5-8 key points" },
              detailed_notes: { type: "string", description: "Detailed educational content, 3-5 paragraphs" },
              thoughts: { type: "string", description: "Reflection questions or areas for further study" },
              tags: { type: "array", items: { type: "string" }, description: "5-10 relevant tags for categorization" },
              mentioned_figures: { type: "array", items: { type: "string" }, description: "Names of historical figures mentioned" },
              mentioned_events: { type: "array", items: { type: "string" }, description: "Names of historical events referenced" },
            },
            required: ["title", "headline", "summary", "year", "timeline_period", "category", "key_points", "detailed_notes", "thoughts", "tags", "mentioned_figures", "mentioned_events"],
            additionalProperties: false,
          },
        },
      }];

      const data = await callAI(
        "You are a knowledge research assistant. Generate comprehensive, educational structured notes. Be factual, clear, and engaging. Always fill every field thoroughly. Include relevant tags, figures, and events.",
        userPrompt, tools,
        { type: "function", function: { name: "create_structured_note" } }
      );

      const err = handleAiError(data);
      if (err) return err;

      const structured = parseToolCall(data);
      const videoId = isYoutube ? isYoutube[1] : null;

      // Auto-find related history from DB
      let related = null;
      try {
        related = await findRelatedHistory(structured.mentioned_figures || [], structured.mentioned_events || [], structured.title);
      } catch (e) { console.error("find_related error:", e); }

      return jsonResp({ structured, videoId, related });
    }

    // ─── YouTube Structured Extraction ───
    if (action === "youtube_structured") {
      if (!url) return jsonResp({ error: "URL is required" }, 400);
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
              title: { type: "string" }, headline: { type: "string" }, summary: { type: "string" },
              year: { type: "string" }, timeline_period: { type: "string" }, category: { type: "string" },
              key_points: { type: "array", items: { type: "string" } },
              detailed_notes: { type: "string" }, thoughts: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              mentioned_figures: { type: "array", items: { type: "string" } },
              mentioned_events: { type: "array", items: { type: "string" } },
            },
            required: ["title", "headline", "summary", "year", "timeline_period", "category", "key_points", "detailed_notes", "thoughts", "tags", "mentioned_figures", "mentioned_events"],
            additionalProperties: false,
          },
        },
      }];

      const data = await callAI(
        "You are a knowledge extraction assistant. Analyze YouTube videos and extract structured educational content. Be thorough and educational. Include all relevant tags, figures, and events mentioned.",
        `Analyze this YouTube video and extract structured knowledge:\nURL: ${url}\n${videoId ? `Video ID: ${videoId}` : ""}\n\nProvide comprehensive educational content based on what this video likely covers.`,
        tools, { type: "function", function: { name: "extract_youtube_note" } }
      );

      const err = handleAiError(data);
      if (err) return err;

      const structured = parseToolCall(data);

      let related = null;
      try {
        related = await findRelatedHistory(structured.mentioned_figures || [], structured.mentioned_events || [], structured.title);
      } catch (e) { console.error("find_related error:", e); }

      return jsonResp({ structured, videoId, related });
    }

    // ─── Extract Timeline ───
    if (action === "extract_timeline") {
      if (!text?.trim()) return jsonResp({ error: "Text is required" }, 400);
      const tools = [{
        type: "function",
        function: {
          name: "extract_timeline",
          description: "Extract chronological events from text.",
          parameters: {
            type: "object",
            properties: {
              events: {
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
              },
            },
            required: ["events"],
            additionalProperties: false,
          },
        },
      }];

      const data = await callAI(
        "You are a history timeline extraction expert. Extract all chronological events mentioned in the text and sort them by date.",
        `Extract a chronological timeline from:\n\n${text}`,
        tools, { type: "function", function: { name: "extract_timeline" } }
      );
      const err = handleAiError(data);
      if (err) return err;
      return jsonResp({ result: parseToolCall(data) });
    }

    // ─── Extract Figures ───
    if (action === "extract_figures") {
      if (!text?.trim()) return jsonResp({ error: "Text is required" }, 400);
      const tools = [{
        type: "function",
        function: {
          name: "extract_figures",
          description: "Identify historical figures from text.",
          parameters: {
            type: "object",
            properties: {
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
              },
            },
            required: ["figures"],
            additionalProperties: false,
          },
        },
      }];

      const data = await callAI(
        "You are a history expert. Identify all historical figures mentioned or implied in the text.",
        `Identify all historical figures in:\n\n${text}`,
        tools, { type: "function", function: { name: "extract_figures" } }
      );
      const err = handleAiError(data);
      if (err) return err;
      return jsonResp({ result: parseToolCall(data) });
    }

    // ─── ELI5 ───
    if (action === "eli5") {
      if (!text?.trim()) return jsonResp({ error: "Text is required" }, 400);
      const data = await callAI(
        "You are a teacher who explains complex history to a 10-year-old. Use simple words, fun analogies, and short sentences. Make it engaging and easy to understand.",
        `Explain this like I'm 10 years old:\n\n${text}`,
      );
      const err = handleAiError(data);
      if (err) return err;
      return jsonResp({ result: data.choices?.[0]?.message?.content || "" });
    }

    // ─── Quiz ───
    if (action === "quiz") {
      if (!text?.trim()) return jsonResp({ error: "Text is required" }, 400);
      const tools = [{
        type: "function",
        function: {
          name: "generate_quiz",
          description: "Generate quiz questions from educational content.",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    correct_index: { type: "number" },
                    explanation: { type: "string" },
                  },
                  required: ["question", "options", "correct_index", "explanation"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      }];

      const data = await callAI(
        "You are an educational quiz creator. Generate 5 multiple-choice questions based on the content. Each question should have 4 options with exactly one correct answer.",
        `Create 5 quiz questions from:\n\n${text}`,
        tools, { type: "function", function: { name: "generate_quiz" } }
      );
      const err = handleAiError(data);
      if (err) return err;
      return jsonResp({ result: parseToolCall(data) });
    }

    // ─── Auto Tag ───
    if (action === "auto_tag") {
      if (!text?.trim()) return jsonResp({ error: "Text is required" }, 400);
      const tools = [{
        type: "function",
        function: {
          name: "auto_tag",
          description: "Generate tags and suggest category for content.",
          parameters: {
            type: "object",
            properties: {
              tags: { type: "array", items: { type: "string" }, description: "5-10 relevant tags" },
              category: { type: "string", description: "Best matching category" },
              suggested_year: { type: "string", description: "Most relevant year if detectable" },
            },
            required: ["tags", "category"],
            additionalProperties: false,
          },
        },
      }];

      const data = await callAI(
        "You are a content categorization expert for historical knowledge. Suggest tags and the best category from: Ice Age, Space, Serial Killers, Ancient Egypt, Ancient Greece, Royal Family, Dinosaurs, Earth History, Extinction Events, American History, or general.",
        `Categorize and tag this content:\n\n${text}`,
        tools, { type: "function", function: { name: "auto_tag" } }
      );
      const err = handleAiError(data);
      if (err) return err;
      return jsonResp({ result: parseToolCall(data) });
    }

    // ─── Find Related (DB search) ───
    if (action === "find_related") {
      const keywords = text?.trim();
      if (!keywords) return jsonResp({ error: "Keywords required" }, 400);

      const result = await findRelatedHistory([], [], keywords);
      return jsonResp({ result });
    }

    // ─── Legacy YouTube extract ───
    if (action === "youtube_extract") {
      if (!url) return jsonResp({ error: "URL is required" }, 400);
      const match = url.match(/(?:youtu\.be\/|v=)([^&?]+)/);
      const videoId = match ? match[1] : null;
      const data = await callAI(
        "You are a knowledge extraction assistant. Analyze YouTube videos and extract structured educational content.",
        `Analyze this YouTube video URL: ${url}\n${videoId ? `Video ID: ${videoId}` : ""}\n\nProvide:\n## Summary\n## Key Points\n## Important Takeaways\n## My Notes`,
      );
      const err = handleAiError(data);
      if (err) return err;
      return jsonResp({ result: data.choices?.[0]?.message?.content || "", videoId });
    }

    // ─── Expand Note ───
    if (action === "expand_note") {
      if (!text?.trim()) return jsonResp({ error: "Text is required" }, 400);
      const data = await callAI(
        "You are a knowledge assistant. Take a brief note or idea and expand it into a well-structured, educational note with sections: Summary, Key Points, and Details. Use markdown formatting.",
        `Expand this note into a comprehensive, well-structured document:\n\n${text}`,
      );
      const err = handleAiError(data);
      if (err) return err;
      return jsonResp({ result: data.choices?.[0]?.message?.content || "" });
    }

    // ─── Standard Text AI Actions ───
    if (!text?.trim()) return jsonResp({ error: "Select text or write something first" }, 400);

    const prompts: Record<string, string> = {
      grammar: "Fix all grammar, spelling, and punctuation errors. Return ONLY the corrected text, no explanations.",
      improve: "Improve this text for clarity, readability, and flow. Keep the meaning. Return ONLY the improved text.",
      summarize: "Summarize this text in a concise paragraph. Return ONLY the summary.",
      expand: "Expand on the ideas in this text with more detail and context. Return ONLY the expanded text.",
      rewrite: "Rewrite this text in a more engaging, polished style. Return ONLY the rewritten text.",
      simplify: "Simplify this text to make it easier to understand. Use shorter sentences and simpler words. Return ONLY the simplified text.",
    };

    const systemPrompt = prompts[action];
    if (!systemPrompt) return jsonResp({ error: "Invalid action" }, 400);

    const data = await callAI(systemPrompt, text);
    const err = handleAiError(data);
    if (err) return err;

    return jsonResp({ result: data.choices?.[0]?.message?.content || "" });
  } catch (e) {
    console.error("knowledge-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Helper: Find related history from DB ───
async function findRelatedHistory(figures: string[], events: string[], keywords: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) return null;

  const sb = createClient(supabaseUrl, supabaseKey);

  // Extract search terms from keywords
  const terms = keywords.split(/[\s,]+/).filter(w => w.length > 3).slice(0, 5);
  const searchTerms = [...new Set([...figures.slice(0, 3), ...events.slice(0, 3), ...terms])].slice(0, 6);

  const relatedEvents: any[] = [];
  const relatedFigures: any[] = [];

  for (const term of searchTerms) {
    if (!term || term.length < 3) continue;

    const { data: evts } = await sb
      .from("historical_events")
      .select("id, title, slug, year, year_label, category, description")
      .ilike("title", `%${term}%`)
      .limit(3);

    if (evts) relatedEvents.push(...evts);

    const { data: figs } = await sb
      .from("historical_figures")
      .select("id, name, slug, title, birth_year, death_year, image_url")
      .ilike("name", `%${term}%`)
      .limit(2);

    if (figs) relatedFigures.push(...figs);
  }

  // Deduplicate
  const seenE = new Set<string>();
  const uniqueEvents = relatedEvents.filter(e => { if (seenE.has(e.id)) return false; seenE.add(e.id); return true; }).slice(0, 5);
  const seenF = new Set<string>();
  const uniqueFigures = relatedFigures.filter(f => { if (seenF.has(f.id)) return false; seenF.add(f.id); return true; }).slice(0, 3);

  return { events: uniqueEvents, figures: uniqueFigures };
}
