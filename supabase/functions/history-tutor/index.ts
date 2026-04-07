import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, pathTitle, pathDescription, lessonIndex, lessonContent, question } = await req.json();

    if (action === "generate_lesson") {
      const systemPrompt = `You are a world-class history tutor. Generate a structured history lesson in markdown format.

The lesson should include:
1. **Introduction** - Brief overview of the topic
2. **Historical Context** - What was happening at the time
3. **Key Events** - The most important events (with approximate dates)
4. **Important Figures** - Key people involved with brief descriptions
5. **Timeline Overview** - Chronological summary
6. **Significance** - Why this matters in world history
7. **Did You Know?** - 2-3 fascinating facts

Keep the tone engaging and educational. Use markdown headers, bold text, and bullet points.
Each lesson should be approximately 600-800 words.`;

      const userPrompt = `Generate lesson ${lessonIndex + 1} for the learning path: "${pathTitle}".
Path description: ${pathDescription}
This is lesson ${lessonIndex + 1} of 5. Each lesson should cover a different aspect or time period within the topic.
Lesson 1: Origins and early developments
Lesson 2: Key turning points and conflicts
Lesson 3: Important figures and their contributions
Lesson 4: Cultural and societal impact
Lesson 5: Legacy and modern connections

Generate the content for lesson ${lessonIndex + 1}.`;

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          stream: true,
        }),
      });

      if (!resp.ok) {
        const status = resp.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error ${status}`);
      }

      return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    if (action === "generate_quiz") {
      const systemPrompt = `You are a history quiz master. Based on the lesson content provided, generate exactly 5 multiple-choice questions.

Return ONLY a valid JSON array (no markdown, no code fences) with this structure:
[
  {
    "question": "What year did X happen?",
    "options": ["1066", "1215", "1485", "1603"],
    "correctIndex": 0,
    "explanation": "Brief explanation of the correct answer."
  }
]

Make questions that test understanding, not just memorization. Include a mix of difficulty levels.`;

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate a quiz based on this lesson:\n\n${lessonContent}` },
          ],
        }),
      });

      if (!resp.ok) {
        const status = resp.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error ${status}`);
      }

      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content || "[]";
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      let questions;
      try { questions = JSON.parse(cleaned); } catch { questions = []; }

      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "ask_question") {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a helpful history tutor. Answer the student's question based on the lesson content. Keep answers concise (2-4 paragraphs max). Use markdown formatting." },
            { role: "user", content: `Lesson context:\n${lessonContent}\n\nStudent question: ${question}` },
          ],
          stream: true,
        }),
      });

      if (!resp.ok) {
        const status = resp.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error ${status}`);
      }

      return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Tutor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
