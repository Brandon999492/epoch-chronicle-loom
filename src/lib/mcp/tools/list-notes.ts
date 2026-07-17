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
  name: "list_notes",
  title: "List knowledge notes",
  description: "List the signed-in user's knowledge notes from the Studio, most recently updated first.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("How many notes to return (default 20)."),
    search: z.string().optional().describe("Optional case-insensitive substring to match against title."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, search }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = sb(ctx)
      .from("knowledge_notes")
      .select("id,title,category,tags,updated_at,is_pinned,is_favorite,word_count")
      .eq("user_id", ctx.getUserId())
      .order("updated_at", { ascending: false })
      .limit(limit ?? 20);
    if (search) q = q.ilike("title", `%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { notes: data ?? [] },
    };
  },
});
