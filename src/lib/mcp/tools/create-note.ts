import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_note",
  title: "Create knowledge note",
  description: "Create a new knowledge note in the signed-in user's Studio with raw text content.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Note title."),
    content: z.string().trim().min(1).describe("Raw note content (markdown or plain text)."),
    category: z.string().optional().describe("Optional category label."),
    tags: z.array(z.string()).optional().describe("Optional list of tags."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, content, category, tags }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await sb(ctx)
      .from("knowledge_notes")
      .insert({
        user_id: ctx.getUserId(),
        title,
        content,
        category: category ?? null,
        tags: tags ?? [],
        word_count: content.split(/\s+/).filter(Boolean).length,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created note ${data.id}` }],
      structuredContent: { note: data },
    };
  },
});
