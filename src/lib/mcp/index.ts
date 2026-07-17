import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listNotes from "./tools/list-notes";
import getNote from "./tools/get-note";
import createNote from "./tools/create-note";
import searchHistory from "./tools/search-history";
import listBookmarks from "./tools/list-bookmarks";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "epoch-chronicle-mcp",
  title: "Epoch Chronicle",
  version: "0.1.0",
  instructions:
    "Access the signed-in user's Universal History Archive. Use `search_history` to query historical events, `list_notes`/`get_note`/`create_note` for the user's Studio knowledge notes, and `list_bookmarks` for saved events.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchHistory, listNotes, getNote, createNote, listBookmarks],
});
