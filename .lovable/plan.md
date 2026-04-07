Refine and upgrade the Knowledge Studio into a polished, Apple Notes–style, AI-powered personal learning system with strong usability, clarity, and mobile-first design.

This is not just a text editor — it must feel like a structured learning tool.

----------------------------------

CORE IMPROVEMENTS

----------------------------------

1. MOBILE-FIRST RESPONSIVENESS

• Fix all layout issues on iPhone screens

• Stack editor header elements vertically

• Move overflow buttons into dropdown menus

• Ensure all UI elements have minimum 44px tap targets

• Prevent any overlapping text or hidden elements

• Fix color picker and dropdowns using z-50 and viewport detection

----------------------------------

2. STRUCTURED NOTE SYSTEM (NOT WORD-LIKE)

• Replace free-form editing with structured sections:

  - Title

  - Headline

  - Summary

  - Year

  - Timeline Period

  - Category

  - Key Points

  - Detailed Notes

  - My Thoughts

• Each section should behave like a separate editable block (Notion-style)

• Add placeholders inside each section

• Add subtle dividers between sections

• Prevent the editor from feeling like one large text wall

----------------------------------

3. AI ASSISTANT (CONTROLLED & TRANSPARENT)

AI must NEVER auto-run blindly.

Always show a clear action menu with:

• Fix Grammar

• Simplify

• Expand

• Summarize

• Rewrite (Formal / Casual / Academic)

• Extract Key Points

• Convert to Timeline

• Generate Full Structured Note

• Show preview BEFORE applying changes

• Allow Accept / Reject

• If text is selected → only modify selection

• If no selection → modify entire document

----------------------------------

4. YOUTUBE AI UPGRADE

When a YouTube link is added:

Automatically:

• Extract topic

• Generate structured summary

• Create key bullet points

• Detect timeline references (years/events)

• Suggest category

Then:

• Fill structured note sections

• Embed video cleanly in a styled container

• Link to relevant historical events if possible

----------------------------------

5. VOICE SYSTEM (FREE + FUTURE READY)

Speech-to-Text:

• Use Web Speech API

• Real-time transcription into editor

• Insert text at cursor

• Show recording indicator

Text-to-Speech:

• Use speechSynthesis API

• Play selected text or full note

• Voice selector dropdown

• Speed control (0.5x–2x)

• Stop button

• Prepare system for future premium AI voice upgrade

----------------------------------

6. STUDIO SETTINGS PANEL

Create slide-out settings panel with:

• Font size (Small / Medium / Large)

• Reading width (600px / 720px / 900px)

• Editor mode default (Simple / Advanced)

• Animation toggle

• Focus mode toggle (hide UI distractions)

Save in localStorage per user

----------------------------------

7. MEDIA HANDLING FIX

• Images must be contained, centered, and styled

• Videos must use responsive aspect-ratio containers

• Prevent media from breaking layout

• Add spacing around media

----------------------------------

8. QUICK CAPTURE IMPROVEMENT

• Replace input with auto-resizing textarea

• Add "Generate Detailed Note" toggle

• Allow longer input

• Output fully structured notes (not plain text)

----------------------------------

9. UI/UX POLISH (APPLE NOTES STYLE)

• Softer background colors

• More whitespace

• Smooth animations (fade, slide)

• Clean typography

• Minimal UI clutter

• Focus on readability and calm design

----------------------------------

10. LEARNING EXPERIENCE LAYER

Add:

• Daily learning tracker

• Weekly goals

• Subject progress tracking

• “You learned today” summary

• Streak system

----------------------------------

DO NOT break existing database or API structure.

All improvements must integrate with current Knowledge Studio system.