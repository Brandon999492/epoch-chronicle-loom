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
  name: "search_history",
  title: "Search historical events",
  description: "Search the archive's historical events by title or description substring.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Text to search for in event title/description."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 15)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await sb(ctx)
      .from("historical_events")
      .select("id,slug,title,year,year_label,category,description,significance")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("significance", { ascending: false, nullsFirst: false })
      .limit(limit ?? 15);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { events: data ?? [] },
    };
  },
});
