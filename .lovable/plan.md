Upgrade the Knowledge Studio into a fully AI-driven Personal History Learning System focused on ease of use, automation, and daily learning.

This system must prioritize user workflow over developer structure.

----------------------------------

1. SMART NOTE CREATION (CORE FEATURE)

----------------------------------

This is the primary workflow and must be the focus.

When user clicks "+ Quick Note":

Show simple input:

• Paste YouTube link

• Enter topic

• Write quick idea

Then:

→ ONE BUTTON: "Generate Full Note"

System must:

• automatically call AI

• generate COMPLETE structured note

• fill ALL sections:

  - Title

  - Headline

  - Summary

  - Year

  - Timeline

  - Category

  - Key Points

  - Detailed Notes

  - My Thoughts

User should NOT need to manually run multiple AI tools.

----------------------------------

2. AI AUTOMATION FIRST (NOT TOOL-BASED)

----------------------------------

Instead of forcing users to click many AI actions:

• Automatically run:

  - extract timeline

  - detect figures

  - detect events

  - generate tags

  - suggest category

After note generation.

AI tools menu remains available for refinement only.

----------------------------------

3. YOUTUBE AUTO-INTELLIGENCE (CRITICAL)

----------------------------------

When a YouTube link is detected:

System must automatically:

• extract video topic

• generate structured summary

• extract key points

• detect historical references

• assign category

• link to related events

This must happen WITHOUT requiring extra clicks.

----------------------------------

4. RELATED HISTORY (KEEP BUT IMPROVE)

----------------------------------

Keep Related History panel but:

• auto-load instantly after note generation

• highlight strongest matches

• show:

  - related events

  - related figures

  - related time periods

Make it feel like "connections", not search results.

----------------------------------

5. TIMELINE SYSTEM (KEEP)

----------------------------------

Keep timeline view but improve:

• allow dragging notes on timeline

• group notes by era

• show visual clusters (e.g. WWII, Ancient Egypt)

----------------------------------

6. LEARNING SYSTEM (MAKE IT ENGAGING)

----------------------------------

Upgrade from simple stats to:

• Daily learning summary ("You learned X topics today")

• Streak system (days active)

• Subject mastery bars (Ice Age, Space, etc.)

• Weekly goal tracking

• "Next topic to learn" suggestions

----------------------------------

7. AI VOICE SYSTEM (KEEP + IMPROVE)

----------------------------------

Keep current system but:

Add:

• "Documentary Mode" (already planned)

• paragraph highlighting while speaking

• pause/resume controls

Prepare system for future premium voices.

----------------------------------

8. SIMPLICITY OVER COMPLEXITY

----------------------------------

Reduce visible complexity:

• hide advanced tools by default

• show only:

  - Generate Note

  - AI Assist

  - Add Source

Everything else is secondary.

----------------------------------

9. MOBILE-FIRST PRIORITY

----------------------------------

Ensure:

• all features work perfectly on iPhone

• no overlapping UI

• easy one-hand use

• quick note creation is instant

----------------------------------

Goal:

Create a system where the user can:

• watch a video  

• press one button  

• instantly get a structured history note  

• see related events  

• track learning progress  

This must feel fast, simple, and powerful

&nbsp;

# Knowledge Studio → AI-Powered Personal History Learning System

## Overview

Expand the Knowledge Studio with advanced AI learning actions, database auto-linking, a notes timeline view, learning progress tracking, documentary voice mode, and focus/reading modes — all built on top of the existing system.

---

## 1. Advanced AI Learning Actions

**Files: `supabase/functions/knowledge-ai/index.ts`, `SmartEditor.tsx**`

Add new actions to the edge function and the AI menu:

- `extract_timeline` — returns chronological list of events from note content
- `extract_figures` — identifies historical figures mentioned
- `extract_events` — identifies key historical events
- `eli5` — "Explain Like I'm 10" rewrite
- `quiz` — generates 5 quiz questions from content
- `suggest_related` — queries the database for related events/figures

The SmartEditor AI menu gets a second section "Learning Tools" with these new actions. Quiz results render inline in a styled panel below the editor with interactive answer reveals.

For `suggest_related`, the edge function will query `historical_events` and `historical_figures` tables using keyword matching from the note content.

## 2. Auto-Link to History Database (Related History Panel)

**Files: `KnowledgeStudioPage.tsx`, `supabase/functions/knowledge-ai/index.ts**`

Add a collapsible "Related History" sidebar panel (right side on desktop, bottom sheet on mobile):

- When a note is saved/opened, extract keywords from title + content
- Call a new `find_related` action in the edge function that:
  - Takes keywords and searches `historical_events` (title ILIKE) and `historical_figures` (name ILIKE) via Supabase client inside the edge function
  - Returns top 5 events + top 3 figures with IDs and slugs
- Display as clickable cards linking to `/event/:id` and figure pages
- Auto-refresh when note content changes significantly (debounced)

## 3. Visual Timeline for Notes

**Files: `KnowledgeStudioPage.tsx` (new "Timeline" tab in sidebar)**

Add a toggle in the sidebar header to switch between "List" and "Timeline" views:

- Timeline view shows notes plotted vertically by `linked_year`
- Each note appears as a dot/card on the timeline axis
- Filter by category/subject using existing filter chips
- Notes without a year are grouped in an "Undated" section at bottom
- Uses existing note data — no new DB queries needed

## 4. Smart YouTube Analysis Upgrade

**File: `supabase/functions/knowledge-ai/index.ts**`

The existing `youtube_structured` action already extracts structured data. Enhance it:

- Add `related_events` and `mentioned_figures` fields to the tool schema
- After AI extraction, run a quick DB search for those entities and return matches
- Auto-fill the Related History panel when a YouTube note is generated

## 5. Learning System (Progress & Streaks)

**Files: `KnowledgeStudioPage.tsx` (new `LearningTracker` component)**

Add a "Learning" panel accessible from the sidebar:

- **Daily tracker**: Count notes created today (query `knowledge_notes` by `created_at`)
- **Streak**: Count consecutive days with at least 1 note created
- **Subject progress bars**: Count notes per category, show as progress bars
- **Stats**: Total notes, unique categories covered, time periods explored (from `linked_year`)
- **"Continue Learning"**: Show categories with fewest notes as suggestions

All data derived from existing `knowledge_notes` table — no new tables needed. Stats computed client-side from the already-fetched notes array.

## 6. Smart Organization (Auto-tagging)

**Files: `KnowledgeStudioPage.tsx`, `supabase/functions/knowledge-ai/index.ts**`

Add an `auto_tag` action to the edge function:

- Takes note content, returns suggested tags and category
- Called automatically after AI generation or manually via a "Smart Tag" button
- Updates the note's tags and category fields

## 7. Documentary Mode (Voice Upgrade)

**File: `SmartEditor.tsx**`

Upgrade TTS with a "Documentary Mode" toggle:

- Slower rate (0.75x), deeper voice selection preference
- Reads paragraph-by-paragraph with pauses between sections
- Uses `speechSynthesis` — splits content by paragraphs, queues utterances with 1.5s gaps
- Visual indicator shows which paragraph is being read

## 8. Focus Mode & Reading Mode

**Files: `KnowledgeStudioPage.tsx`, `SmartEditor.tsx**`

- **Focus Mode**: Toggle that hides sidebar + header + all toolbars. Only the note content remains centered on screen with a minimal close button.
- **Reading Mode**: Toggle that makes editor non-editable, hides all editing UI, increases font size slightly, and applies a warmer background tint.
- Both accessible from the editor header and Studio Settings panel.

---

## Technical Details

**Files to create:**

- `src/components/studio/LearningTracker.tsx` — progress panel
- `src/components/studio/RelatedHistory.tsx` — related events/figures panel
- `src/components/studio/NotesTimeline.tsx` — timeline view

**Files to modify:**

- `src/pages/KnowledgeStudioPage.tsx` — integrate new panels, timeline view, focus/reading modes
- `src/components/studio/SmartEditor.tsx` — expanded AI menu, documentary mode, reading mode
- `src/components/studio/StudioSettings.tsx` — add focus mode toggle
- `supabase/functions/knowledge-ai/index.ts` — add `extract_timeline`, `extract_figures`, `eli5`, `quiz`, `auto_tag`, `find_related` actions

**Database:** No schema changes needed. All features use existing `knowledge_notes` and public `historical_events`/`historical_figures` tables.

**Edge function additions:** New actions use the existing `callAI` helper with tool-calling for structured output. `find_related` creates a Supabase client inside the edge function to query the DB.