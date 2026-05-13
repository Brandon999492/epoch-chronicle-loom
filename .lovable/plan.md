# Studio Rebuild — AI-First Knowledge System

This plan rebuilds the `/studio` experience around large raw-input ingestion + a multi-stage AI pipeline, and tightens global theming/navigation. Scope is intentionally bounded — I'll confirm before expanding into quizzes, PDF upload, slash commands, or full site-wide nav rebuilds.

## 1. New Studio page (`src/pages/KnowledgeStudioPage.tsx`)

Replace current layout with a 3-state single-purpose screen:

- **Empty/Input state**: one large Apple-Notes-style textarea (auto-grow), placeholder "Paste an article, transcript, YouTube link, or your own notes…". No title field, no metadata, no template scaffolding. Drag-and-drop `.txt`/`.md` files supported.
- **Generating state**: animated stage indicator showing the 5 pipeline stages (Ingesting → Chunking → Ranking → Synthesizing → Rendering) with subtle spring transitions.
- **Result state**: rendered structured note (see §3) with sidebar list of past notes (collapsible, hidden on mobile by default).

Primary action: **✨ Generate Structured Note**. Secondary inline actions: Improve Writing, Summarize, Continue Writing (call same edge function with mode flag).

Sidebar/notes list: minimal — title, date, category pill. No dashboard widgets.

## 2. Multi-stage AI pipeline (edge function)

New edge function `supabase/functions/knowledge-synthesize/index.ts` (or refactor existing `knowledge-ai`). Uses Lovable AI Gateway with `google/gemini-2.5-pro` for synthesis and `google/gemini-2.5-flash` for cheap classification/ranking.

Pipeline:
1. **Ingest**: detect type (article / transcript / youtube link / freeform / historical). For YouTube, fetch transcript via existing logic if available, else treat URL as topic.
2. **Chunk**: semantic chunking by paragraph + heading boundaries; merge into ~2k token windows preserving structure. Skip if input < 4k tokens.
3. **Rank**: per-chunk call to flash model returning JSON `{ key_concepts, entities, dates, importance_score }`. Aggregate + dedupe.
4. **Synthesize**: single pro-model call with the ranked outline as context, producing strict JSON: `{ title, subtitle, summary, sections:[{heading, body, type:"text|timeline|quote|insight"}], key_insights[], timeline[], figures[], tags[], category, related_topics[] }`.
5. **Persist**: save to `knowledge_notes` (existing table — `html_content` gets the rendered HTML, `content` gets plain text, structured JSON stored in a new column).

Streaming progress events sent back via SSE so the UI can advance the stage indicator.

## 3. Structured note renderer

New component `src/components/studio/StructuredNoteView.tsx`:

- Hero: title + subtitle + category chip + tag row.
- Summary card (soft tinted background).
- Collapsible sections with smooth height animation.
- Timeline rendered as vertical card stack with date markers.
- Key insights as highlighted callout blocks.
- Figures as compact avatar+name+role rows.
- Quote blocks with left accent border.
- Generous spacing, max-width 720px, 1.7 line-height.

Editor remains available via "Edit raw" toggle (uses existing `SmartEditor`).

## 4. Theming additions

Extend `ThemeContext` with two new modes: **Midnight** (deep navy `222 35% 8%`) and **Sepia** (`38 30% 92%`). Update `index.css` token blocks for both. Keep existing accent-color picker. Soften current Dark to navy-tinted (not pure black). Add subtle gradient on `body::before` for depth (already partially present).

## 5. Global nav polish (light pass only)

`Header.tsx`: keep current structure; add subtle hover gradient on nav items, smoother active-state pill (motion fade), and slightly increase touch targets on mobile. **Not** rebuilding the entire navigation IA.

## 6. Mobile fixes

- Studio editor: `100dvh` height, `env(safe-area-inset-bottom)` padding, sticky generate button above keyboard.
- Header mobile menu: ensure dropdowns don't overflow viewport.

## 7. Database

Add one column to `knowledge_notes`: `structured_data jsonb` (nullable) for the pipeline output. Migration via supabase tool.

## Out of scope (will confirm separately if you want them next)
- Quiz system rebuild
- PDF upload / OCR
- Slash commands & markdown shortcuts
- Full site-wide navigation IA redesign (only polish here)
- Persistent scroll/selection across hard reloads beyond what react-router already provides

## Technical notes
- Edge function uses streaming `text/event-stream` with stage events `{stage, progress}`; client `EventSource`-style reader via `fetch` + ReadableStream.
- Strict JSON output enforced via `Output.object` (Zod schema) on synthesis call.
- All AI calls server-side; no `LOVABLE_API_KEY` exposure.
- Existing `SmartEditor` reused for "Edit raw" mode — no rewrite.
- New tokens added to `index.css` only; component code uses semantic classes.

Approve and I'll implement in this order: migration → edge function → renderer → page rewrite → theming → mobile/nav polish.
