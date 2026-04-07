Apple Notes-Style Knowledge Studio Refactor (AI-First, Structured, and User-Friendly)

Refactor the Knowledge Studio into a clean, Apple Notes–inspired system with structured AI-generated notes, clear workflows, and excellent readability.

---

1. Structured Note System (CRITICAL UPGRADE)

When creating a new note:

• Automatically insert a structured template:

Title:

Headline:

Summary:

Year:

Timeline Period:

Subject Category:

Key Points:

Detailed Notes:

My Thoughts:

• Store this BOTH:

  - visually in html_content

  - AND as structured JSON inside a metadata field (or embedded JSON block)

Example JSON:

{

  "title": "",

  "headline": "",

  "summary": "",

  "year": "",

  "timeline": "",

  "category": "",

  "key_points": [],

  "notes": "",

  "thoughts": ""

}

This ensures future filtering, timeline linking, and search works correctly.

---

2. Default User Flow (VERY IMPORTANT)

Define a clear workflow:

When user clicks:

• "+ Quick Note" OR "+"

→ open modal:

User chooses:

• Paste YouTube link

• Enter topic

• Write quick idea

Then:

• Click "Generate with AI"

→ AI generates FULL structured note instantly

→ opens in editor ready to refine

No blank pages by default.

---

3. Apple Notes–Style UI (STRICT RULES)

Apply these exact readability constraints:

• max-width: 720px (centered)

• font-size: 18px base

• line-height: 1.8–2.0

• paragraph spacing: 16–24px

• section spacing: 32–48px

Design:

• soft dark background with slight warm tint  

• minimal toolbar hidden by default  

• clean typography (no clutter)  

• section dividers between each template section  

---

4. SmartEditor Behavior

Default mode:

• NO toolbar visible  

• clean writing area only  

Add:

• “Advanced Mode” toggle → reveals full editor  

• floating “AI Assist” pill button  

• text selection → inline AI menu  

---

5. AI System (FULLY CONTROLLED)

All AI actions must:

• show loading state (spinner or shimmer)  

• NEVER fail silently  

• show error message if failure  

• return preview before applying  

AI actions:

• Fix Grammar  

• Simplify  

• Expand  

• Rewrite  

Preview panel must show:

• before vs after  

• Accept / Reject buttons  

---

6. Generate Note with AI (CORE FEATURE)

Add new action:

generate_structured_note

Input:

• topic OR pasted text OR YouTube URL  

Output (STRICT JSON):

{

  title,

  headline,

  summary,

  year,

  timeline,

  category,

  key_points[],

  detailed_notes,

  thoughts

}

System must:

• parse response

• inject into correct template sections

• update editor instantly

---

7. YouTube AI (STRICT FORMAT)

Add youtube_structured action.

Must return:

• title  

• summary (clear, simple)  

• 5–10 key points  

• estimated year / period  

• category  

• optional timestamps  

DO NOT just embed video.

Flow:

Paste link →

AI processes →

Structured note auto-filled →

Video embed placed at bottom

---

8. Categories System

Predefined categories:

• Ice Age  

• Space  

• Serial Killers  

• Ancient Egypt  

• Ancient Greece  

• Royal Family  

• Dinosaurs  

• Earth History  

• Extinction Events  

• American History  

+ allow custom categories

---

9. Quick Capture (PRIMARY FEATURE)

Floating FAB button:

“+ Quick Note”

Popup:

• paste link / topic  

• click "AI Expand"  

• generates FULL structured note  

This should be the main entry point.

---

10. Visual Polish

• larger note cards  

• softer shadows  

• more whitespace  

• readable preview text (2 lines max)  

• category pills with color coding  

---

11. Tooltips & Guidance

Every key button must explain itself:

• AI Assist → “Improve or rewrite your text”  

• Add Source → “Paste YouTube or link”  

• Generate → “Create full structured note using AI”  

---

Goal:

Transform the Knowledge Studio into a simple, beautiful, AI-powered note system where users:

• capture information instantly  

• generate structured notes automatically  

• refine instead of writing from scratch  

• enjoy using it daily