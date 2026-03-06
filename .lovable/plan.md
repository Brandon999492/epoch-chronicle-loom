

## Plan: Complete History Intelligence AI System

### Audit — What exists vs what's missing

**Already working:** Streaming chat, 5 modes, conversation persistence, chat history sidebar, delete conversations, bookmark toggle on messages, image generation + download, internal/external linking in markdown, auth-gated, dark/light mode.

**Missing from the master prompt:**

| # | Feature | Status |
|---|---------|--------|
| 1 | Bookmarked answers panel (view all bookmarked AI messages) | Missing |
| 2 | Save AI response to journal | Missing |
| 3 | Export chat logs | Missing |
| 4 | Map Mode (6th AI mode) | Missing |
| 5 | AI settings panel on the page | Missing |
| 6 | Timeline-themed immersive background | Missing — plain bg |
| 7 | Save generated images to journal/bookmarks | Missing — only download |
| 8 | Search inside bookmarked AI answers | Missing |
| 9 | Tagging on bookmarked AI answers | Missing |

### Implementation

#### 1. Bookmarked Answers Panel
Add a toggleable right-side panel on the AI page showing all bookmarked `ai_messages` for the user. Include search-within-bookmarks and a tag display. Clicking a bookmarked answer loads its conversation.

#### 2. Save to Journal Button
Add a "Save to Journal" button on each assistant message (alongside the bookmark button). On click, create a new journal entry with the AI response content, linked to the conversation. Uses existing `journals` table — set `category: "ai-response"` and `linked_event_id` to the message ID.

#### 3. Export Chat Logs
Add an export button in the top bar or sidebar. Generates a `.txt` or `.md` file of the current conversation and triggers a browser download.

#### 4. Map Mode
Add a 6th mode `"map"` to the `AiMode` type and `MODE_OPTIONS` array. Update the edge function's `SYSTEM_PROMPTS` to include a Map Mode prompt that instructs the AI to describe event locations geographically, mention coordinates, and format location data clearly. (Full interactive map rendering is outside scope — the AI will describe locations textually with geographic context.)

#### 5. AI Settings Panel
Add a collapsible settings panel accessible from a gear icon in the top bar. Settings: default AI mode selection, toggle autosave, font size for responses. Store preferences in `localStorage` (or profile table if preferred).

#### 6. Timeline-Themed Background
Add a subtle timeline-themed CSS background to the AI page — a vertical timeline line with faded date markers, or a gradient with historical texture. Purely cosmetic CSS/SVG enhancement.

#### 7. Save Generated Images to Journal
Add a "Save to Journal" button on generated images (next to Download). Creates a journal entry with the image embedded as content.

#### 8. Search & Tags on Bookmarked Messages
Add a `tags` text array column to `ai_messages` table via migration. In the bookmarks panel, allow users to add/remove tags and filter/search bookmarked messages.

### Files to create/modify

- `supabase/functions/history-ai/index.ts` — add Map Mode system prompt
- `src/hooks/useHistoryAi.ts` — add `exportConversation`, `saveToJournal`, update `AiMode` type with `"map"`
- `src/pages/HistoryAiPage.tsx` — add bookmarks panel, settings panel, save-to-journal buttons, export button, timeline background, map mode in mode bar
- `supabase/migrations/` — add `tags` column to `ai_messages`

### Database migration
```sql
ALTER TABLE public.ai_messages ADD COLUMN tags text[] DEFAULT '{}';
```

### Estimated scope
~6 focused changes across 3-4 files plus 1 migration. No new pages needed — all features integrate into the existing AI page.

