import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronLeft, Plus, Sparkles, Loader2, Trash2, Search, FileText, Wand2,
  ArrowUpRight, Brain, ScrollText, RefreshCw, Undo2, Redo2, History, PlusCircle,
  X, Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  StructuredNoteView,
  type StructuredNote,
  type NoteHighlights,
} from "@/components/studio/StructuredNoteView";

type StoredNote = StructuredNote & {
  _videoId?: string | null;
  _versions?: VersionSnapshot[];
};

type VersionSnapshot = { note: StructuredNote; label: string; ts: number };

type SavedNote = {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  updated_at: string;
  structured_data: StoredNote | null;
};

type Stage =
  | "idle" | "ingesting" | "chunking" | "ranking" | "synthesizing"
  | "rendering" | "expanding" | "merging" | "done" | "error";

const STAGES: { key: Stage; label: string; pct: number }[] = [
  { key: "ingesting", label: "Ingesting content", pct: 10 },
  { key: "chunking", label: "Chunking semantically", pct: 25 },
  { key: "ranking", label: "Ranking key signal", pct: 50 },
  { key: "synthesizing", label: "Synthesizing the note", pct: 80 },
  { key: "rendering", label: "Rendering", pct: 95 },
];

type ExpandKind =
  | "more_detail" | "academic" | "beginner" | "context" | "related"
  | "scientific" | "historical" | "counter" | "timeline";

const EXPAND_OPTIONS: { key: ExpandKind; label: string }[] = [
  { key: "more_detail", label: "More Detail" },
  { key: "academic", label: "Academic Depth" },
  { key: "beginner", label: "Beginner Friendly" },
  { key: "context", label: "Add Context" },
  { key: "related", label: "Add Related Events" },
  { key: "scientific", label: "Add Scientific Detail" },
  { key: "historical", label: "Add Historical Analysis" },
  { key: "counter", label: "Add Counterarguments" },
  { key: "timeline", label: "Add Timeline Events" },
];

const NOTE_COLS = "id, title, content, category, updated_at, structured_data";
const PLACEHOLDER =
  "Paste an article, a transcript, a YouTube link, or your own raw thoughts.\n\nThe AI will read everything, find what matters, and turn it into a structured note.";

const MAX_VERSIONS = 12;

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripMeta(n: StoredNote | StructuredNote): StructuredNote {
  const { _videoId, _versions, ...rest } = n as StoredNote;
  return rest as StructuredNote;
}

function diffHighlights(prev: StructuredNote, next: StructuredNote): NoteHighlights {
  const prevInsights = new Set((prev.key_insights ?? []).map((s) => s));
  const prevSections = new Set((prev.sections ?? []).map((s) => s.heading));
  const prevTimeline = new Set((prev.timeline ?? []).map((t) => t.title));
  const prevFigures = new Set((prev.figures ?? []).map((f) => f.name));
  return {
    insights: new Set((next.key_insights ?? []).filter((s) => !prevInsights.has(s))),
    sections: new Set((next.sections ?? []).map((s) => s.heading).filter((h) => !prevSections.has(h))),
    timeline: new Set((next.timeline ?? []).map((t) => t.title).filter((t) => !prevTimeline.has(t))),
    figures: new Set((next.figures ?? []).map((f) => f.name).filter((n) => !prevFigures.has(n))),
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function KnowledgeStudioPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();

  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [activeNote, setActiveNote] = useState<SavedNote | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  // Versioning & evolution state
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [versionIdx, setVersionIdx] = useState(0);
  const [highlights, setHighlights] = useState<NoteHighlights | undefined>(undefined);

  // Evolution UI state
  const [expandOpen, setExpandOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addText, setAddText] = useState("");
  const [evolveBusy, setEvolveBusy] = useState<"expand" | "merge" | null>(null);

  const stageTimer = useRef<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const highlightTimer = useRef<number | null>(null);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [authLoading, user, navigate]);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("knowledge_notes")
      .select(NOTE_COLS)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) { toast.error("Could not load notes."); return; }
    setNotes((data as unknown as SavedNote[]) ?? []);
  }, [user]);

  useEffect(() => { void fetchNotes(); }, [fetchNotes]);

  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, window.innerHeight * 0.55)}px`;
  }, [input]);

  // Clear highlights after the animation has played
  useEffect(() => {
    if (!highlights) return;
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlights(undefined), 5000);
    return () => { if (highlightTimer.current) window.clearTimeout(highlightTimer.current); };
  }, [highlights]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      [n.title, n.content || "", n.category || ""].join(" ").toLowerCase().includes(q),
    );
  }, [notes, search]);

  const advanceStages = useCallback(() => {
    let i = 0;
    setStage(STAGES[0].key); setProgress(STAGES[0].pct);
    stageTimer.current = window.setInterval(() => {
      i = Math.min(i + 1, STAGES.length - 1);
      setStage(STAGES[i].key); setProgress(STAGES[i].pct);
      if (i >= STAGES.length - 1 && stageTimer.current) {
        window.clearInterval(stageTimer.current);
        stageTimer.current = null;
      }
    }, 1400);
  }, []);

  const stopStages = useCallback(() => {
    if (stageTimer.current) { window.clearInterval(stageTimer.current); stageTimer.current = null; }
  }, []);

  // ── Persist current evolved note state ──
  const persistNote = useCallback(
    async (saved: SavedNote, structured: StructuredNote, nextVersions: VersionSnapshot[], videoId: string | null) => {
      if (saved.id === "tmp") return;
      const payload: StoredNote = { ...structured, _videoId: videoId, _versions: nextVersions };
      const { error } = await supabase
        .from("knowledge_notes")
        .update({
          title: structured.title || saved.title,
          content: structured.summary || "",
          category: structured.category || saved.category,
          tags: structured.tags || [],
          word_count: (structured.summary || "").split(/\s+/).filter(Boolean).length,
          structured_data: payload as never,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", saved.id);
      if (error) toast.error("Save failed (changes kept locally).");
    },
    [],
  );

  // ── Generate (initial) ──
  const handleGenerate = useCallback(async () => {
    if (!user) { navigate("/auth"); return; }
    const text = input.trim();
    if (!text) { toast.error("Paste something first."); return; }

    advanceStages();
    try {
      const { data, error } = await supabase.functions.invoke("knowledge-synthesize", {
        body: { input: text, mode: "generate" },
      });
      if (error) throw error;
      if (!data?.structured) throw new Error(data?.error || "AI generation failed");

      const structured = data.structured as StructuredNote;
      const videoId = (data.videoId as string | null) ?? null;
      const v0: VersionSnapshot = { note: structured, label: "Initial Generation", ts: Date.now() };

      const { data: saved, error: saveErr } = await supabase
        .from("knowledge_notes")
        .insert({
          user_id: user.id,
          title: structured.title || "Untitled Note",
          content: structured.summary || "",
          html_content: "",
          category: structured.category || "General",
          tags: structured.tags || [],
          word_count: (structured.summary || "").split(/\s+/).filter(Boolean).length,
          structured_data: { ...structured, _videoId: videoId, _versions: [v0] } as never,
        } as never)
        .select(NOTE_COLS)
        .single();

      stopStages();
      setStage("done"); setProgress(100);

      const note: SavedNote = (saveErr || !saved)
        ? { id: "tmp", title: structured.title, content: structured.summary, category: structured.category || null,
            updated_at: new Date().toISOString(), structured_data: { ...structured, _videoId: videoId, _versions: [v0] } }
        : (saved as unknown as SavedNote);

      setActiveNote(note);
      setActiveVideoId(videoId);
      setVersions([v0]);
      setVersionIdx(0);
      setHighlights(undefined);
      if (!saveErr && saved) setNotes((prev) => [note, ...prev]);
      setInput("");
      toast.success("Structured note ready.");
    } catch (e) {
      stopStages();
      setStage("error");
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      window.setTimeout(() => setStage("idle"), 800);
    }
  }, [input, user, navigate, advanceStages, stopStages]);

  // ── Quick text actions (input area) ──
  const handleQuickAction = useCallback(async (mode: "improve" | "summarize" | "continue") => {
    const text = input.trim();
    if (!text) { toast.error("Write or paste something first."); return; }
    setStage("synthesizing");
    try {
      const { data, error } = await supabase.functions.invoke("knowledge-synthesize", {
        body: { input: text, mode },
      });
      if (error) throw error;
      if (!data?.result) throw new Error("No result");
      if (mode === "continue") setInput((cur) => `${cur}\n\n${data.result}`);
      else setInput(String(data.result));
      toast.success(mode === "improve" ? "Improved." : mode === "summarize" ? "Summarized." : "Extended.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setStage("idle");
    }
  }, [input]);

  // ── Apply a new evolved version (expand or merge) ──
  const applyEvolvedNote = useCallback(
    (newStructured: StructuredNote, label: string) => {
      if (!activeNote) return;
      const prev = versions[versionIdx]?.note ?? (activeNote.structured_data ? stripMeta(activeNote.structured_data) : newStructured);
      const snap: VersionSnapshot = { note: newStructured, label, ts: Date.now() };

      // Drop any redo-forward versions
      const head = versions.slice(0, versionIdx + 1);
      const nextVersions = [...head, snap].slice(-MAX_VERSIONS);
      const nextIdx = nextVersions.length - 1;

      setVersions(nextVersions);
      setVersionIdx(nextIdx);
      setHighlights(diffHighlights(prev, newStructured));

      const stored: StoredNote = { ...newStructured, _videoId: activeVideoId, _versions: nextVersions };
      const updated: SavedNote = {
        ...activeNote,
        title: newStructured.title || activeNote.title,
        content: newStructured.summary || activeNote.content,
        category: newStructured.category || activeNote.category,
        updated_at: new Date().toISOString(),
        structured_data: stored,
      };
      setActiveNote(updated);
      setNotes((prev2) => prev2.map((n) => (n.id === updated.id ? updated : n)));
      void persistNote(updated, newStructured, nextVersions, activeVideoId);
    },
    [activeNote, versions, versionIdx, activeVideoId, persistNote],
  );

  // ── Expand ──
  const handleExpand = useCallback(async (kind: ExpandKind) => {
    if (!activeNote?.structured_data || evolveBusy) return;
    setExpandOpen(false);
    setEvolveBusy("expand");
    setStage("expanding");
    try {
      const current = stripMeta(activeNote.structured_data);
      const { data, error } = await supabase.functions.invoke("knowledge-synthesize", {
        body: { mode: "expand", structured: current, expansionType: kind },
      });
      if (error) throw error;
      if (!data?.structured) throw new Error(data?.error || "Expansion failed");
      const label = EXPAND_OPTIONS.find((o) => o.key === kind)?.label ?? "Expanded";
      applyEvolvedNote(data.structured as StructuredNote, label);
      toast.success(`Expanded: ${label}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Expansion failed");
    } finally {
      setEvolveBusy(null);
      setStage("idle");
    }
  }, [activeNote, applyEvolvedNote, evolveBusy]);

  // ── Merge ──
  const handleMerge = useCallback(async () => {
    if (!activeNote?.structured_data || evolveBusy) return;
    const extra = addText.trim();
    if (!extra) { toast.error("Paste something to merge first."); return; }
    setEvolveBusy("merge");
    setStage("merging");
    try {
      const current = stripMeta(activeNote.structured_data);
      const { data, error } = await supabase.functions.invoke("knowledge-synthesize", {
        body: { mode: "merge", structured: current, additional: extra },
      });
      if (error) throw error;
      if (!data?.structured) throw new Error(data?.error || "Merge failed");
      applyEvolvedNote(data.structured as StructuredNote, "Merged new information");
      setAddText("");
      setAddOpen(false);
      toast.success("New information merged.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setEvolveBusy(null);
      setStage("idle");
    }
  }, [activeNote, addText, applyEvolvedNote, evolveBusy]);

  // ── Undo / Redo / Restore ──
  const jumpToVersion = useCallback(
    (idx: number, pushAsNew = false, customLabel?: string) => {
      if (!activeNote) return;
      if (idx < 0 || idx >= versions.length) return;
      const target = versions[idx].note;

      let nextVersions = versions;
      let nextIdx = idx;
      let prevNoteForDiff = versions[versionIdx]?.note;

      if (pushAsNew) {
        const snap: VersionSnapshot = { note: target, label: customLabel ?? `Restored ${versions[idx].label}`, ts: Date.now() };
        nextVersions = [...versions.slice(0, versionIdx + 1), snap].slice(-MAX_VERSIONS);
        nextIdx = nextVersions.length - 1;
      }

      setVersions(nextVersions);
      setVersionIdx(nextIdx);
      setHighlights(prevNoteForDiff ? diffHighlights(prevNoteForDiff, target) : undefined);

      const stored: StoredNote = { ...target, _videoId: activeVideoId, _versions: nextVersions };
      const updated: SavedNote = {
        ...activeNote,
        title: target.title || activeNote.title,
        content: target.summary || activeNote.content,
        category: target.category || activeNote.category,
        updated_at: new Date().toISOString(),
        structured_data: stored,
      };
      setActiveNote(updated);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      void persistNote(updated, target, nextVersions, activeVideoId);
    },
    [activeNote, versions, versionIdx, activeVideoId, persistNote],
  );

  const undo = useCallback(() => jumpToVersion(versionIdx - 1), [jumpToVersion, versionIdx]);
  const redo = useCallback(() => jumpToVersion(versionIdx + 1), [jumpToVersion, versionIdx]);

  // ── Note open / new ──
  const openNote = useCallback((n: SavedNote) => {
    setActiveNote(n);
    const sd = n.structured_data;
    setActiveVideoId(sd?._videoId ?? null);
    const baseVersions: VersionSnapshot[] =
      sd?._versions && sd._versions.length > 0
        ? sd._versions
        : sd
        ? [{ note: stripMeta(sd), label: "Initial Generation", ts: new Date(n.updated_at).getTime() }]
        : [];
    setVersions(baseVersions);
    setVersionIdx(Math.max(0, baseVersions.length - 1));
    setHighlights(undefined);
    setAddOpen(false); setAddText("");
    setExpandOpen(false); setVersionsOpen(false);
    if (isMobile) setShowSidebar(false);
  }, [isMobile]);

  const startNew = useCallback(() => {
    setActiveNote(null); setActiveVideoId(null); setInput("");
    setStage("idle"); setProgress(0);
    setVersions([]); setVersionIdx(0); setHighlights(undefined);
    setAddOpen(false); setAddText(""); setExpandOpen(false); setVersionsOpen(false);
    if (isMobile) setShowSidebar(false);
    setTimeout(() => taRef.current?.focus(), 50);
  }, [isMobile]);

  const deleteActive = useCallback(async () => {
    if (!activeNote || activeNote.id === "tmp") { startNew(); return; }
    if (!window.confirm("Delete this note?")) return;
    const { error } = await supabase.from("knowledge_notes").delete().eq("id", activeNote.id);
    if (error) { toast.error("Delete failed."); return; }
    setNotes((prev) => prev.filter((n) => n.id !== activeNote.id));
    startNew();
    toast.success("Deleted.");
  }, [activeNote, startNew]);

  const onDrop = useCallback(async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!/^text\/|\.(md|txt)$/i.test(file.type + file.name)) {
      toast.error("Only .txt and .md files supported.");
      return;
    }
    const text = await file.text();
    setInput((cur) => (cur ? `${cur}\n\n${text}` : text));
  }, []);

  const generating = stage !== "idle" && stage !== "done" && stage !== "error";
  const evolving = evolveBusy !== null;
  const canUndo = versionIdx > 0;
  const canRedo = versionIdx < versions.length - 1;

  if (authLoading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-background text-foreground md:flex-row">
      {/* Sidebar */}
      {(showSidebar || !isMobile) && (
        <aside className="flex min-h-0 shrink-0 flex-col border-b border-border/40 bg-secondary/20 backdrop-blur md:w-[280px] md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-5">
            <button onClick={() => navigate("/")} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Brain className="h-4 w-4 text-primary" /> Studio
            </div>
            <button onClick={startNew} className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.97]">
              <Plus className="h-4 w-4" /> New
            </button>
          </div>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <input
                placeholder="Search notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/50 bg-background/80 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/40"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
            {filteredNotes.length === 0 && (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground/60">No notes yet. Paste something to get started.</div>
            )}
            {filteredNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => openNote(n)}
                className={`block w-full rounded-xl px-3 py-2.5 text-left transition-colors ${activeNote?.id === n.id ? "bg-primary/10" : "hover:bg-secondary/60"}`}
              >
                <div className="line-clamp-1 text-[13px] font-medium text-foreground">{n.title}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                  {n.category && <span className="rounded bg-secondary/60 px-1.5 py-0.5">{n.category}</span>}
                  <span>{new Date(n.updated_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Main */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {isMobile && (
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-background/80 px-3 backdrop-blur">
            <button onClick={() => setShowSidebar((s) => !s)} className="rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-secondary">
              {showSidebar ? "Editor" : "Notes"}
            </button>
            <button onClick={startNew} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

        {!activeNote ? (
          /* INPUT / GENERATING STATE */
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="mx-auto w-full max-w-[720px] px-5 pb-32 pt-8 sm:pt-16">
              <div className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/60">
                <ScrollText className="h-3.5 w-3.5" /> New note
              </div>
              <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-foreground sm:text-[2.5rem]">
                What do you want to understand?
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Paste anything. The AI will rank what matters and turn it into a calm, structured note.
              </p>

              <div className="mt-8 rounded-3xl border border-border/50 bg-card/40 p-1 transition-colors focus-within:border-primary/40 focus-within:bg-card/60">
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  placeholder={PLACEHOLDER}
                  disabled={generating}
                  className="block min-h-[260px] w-full resize-none rounded-3xl bg-transparent px-6 py-5 text-[16px] leading-[1.7] text-foreground outline-none placeholder:whitespace-pre-line placeholder:text-muted-foreground/50 disabled:opacity-60"
                />
              </div>

              <div className="sticky bottom-0 z-10 -mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-t from-background via-background/95 to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <div className="flex flex-wrap gap-2">
                  <SecondaryBtn onClick={() => handleQuickAction("improve")} disabled={generating} icon={Wand2} label="Improve" />
                  <SecondaryBtn onClick={() => handleQuickAction("summarize")} disabled={generating} icon={FileText} label="Summarize" />
                  <SecondaryBtn onClick={() => handleQuickAction("continue")} disabled={generating} icon={ArrowUpRight} label="Continue" />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !input.trim()}
                  className="group relative flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Structured Note
                </button>
              </div>

              {generating && (
                <div className="mt-8 animate-[studio-fade-in_0.3s_ease-out_both] rounded-3xl border border-border/50 bg-card/60 p-6">
                  <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                  <ul className="space-y-2">
                    {STAGES.map((s) => {
                      const idx = STAGES.findIndex((x) => x.key === stage);
                      const sIdx = STAGES.findIndex((x) => x.key === s.key);
                      const done = sIdx < idx;
                      const active = sIdx === idx;
                      return (
                        <li key={s.key} className={`flex items-center gap-3 text-sm transition-opacity ${active || done ? "opacity-100" : "opacity-40"}`}>
                          {active ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            : done ? <span className="h-3.5 w-3.5 rounded-full bg-primary" />
                            : <span className="h-3.5 w-3.5 rounded-full border border-border" />}
                          <span className={active ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* RESULT STATE */
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
            {/* Toolbar */}
            <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-background/85 px-3 py-2 backdrop-blur-md sm:px-4">
              <button onClick={startNew} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Plus className="h-4 w-4" /> New
              </button>

              <div className="flex flex-wrap items-center gap-1">
                {/* Expand */}
                <div className="relative">
                  <button
                    onClick={() => { setExpandOpen((o) => !o); setVersionsOpen(false); }}
                    disabled={evolving}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
                    title="Expand note with AI"
                  >
                    {evolveBusy === "expand" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="hidden sm:inline">Expand</span>
                  </button>
                  {expandOpen && (
                    <Popover onClose={() => setExpandOpen(false)}>
                      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Expand options</div>
                      {EXPAND_OPTIONS.map((o) => (
                        <button
                          key={o.key}
                          onClick={() => handleExpand(o.key)}
                          className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                        >
                          {o.label}
                        </button>
                      ))}
                    </Popover>
                  )}
                </div>

                {/* Add more info */}
                <button
                  onClick={() => setAddOpen((o) => !o)}
                  disabled={evolving}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  title="Add more information"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Add info</span>
                </button>

                <div className="mx-1 h-5 w-px bg-border/60" />

                <button
                  onClick={undo}
                  disabled={!canUndo || evolving}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo || evolving}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </button>

                {/* Versions */}
                <div className="relative">
                  <button
                    onClick={() => { setVersionsOpen((o) => !o); setExpandOpen(false); }}
                    className="flex items-center gap-1.5 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    title="Version history"
                  >
                    <History className="h-4 w-4" />
                    <span className="text-[11px] font-medium">v{versionIdx + 1}</span>
                  </button>
                  {versionsOpen && (
                    <Popover onClose={() => setVersionsOpen(false)} wide>
                      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Version history</div>
                      <div className="max-h-[280px] overflow-y-auto">
                        {versions.map((v, i) => {
                          const isCurrent = i === versionIdx;
                          return (
                            <div key={v.ts + ":" + i} className={`flex items-start gap-2 px-3 py-2 ${isCurrent ? "bg-primary/10" : "hover:bg-secondary"}`}>
                              <div className="mt-0.5 text-[11px] font-semibold text-primary">v{i + 1}</div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm text-foreground">{v.label}</div>
                                <div className="text-[11px] text-muted-foreground/70">{new Date(v.ts).toLocaleString()}</div>
                              </div>
                              {isCurrent ? (
                                <span className="mt-1 text-[10px] uppercase tracking-wider text-primary">current</span>
                              ) : (
                                <button
                                  onClick={() => { jumpToVersion(i, true); setVersionsOpen(false); }}
                                  className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-background hover:text-foreground"
                                  title="Restore this version"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Popover>
                  )}
                </div>

                <div className="mx-1 h-5 w-px bg-border/60" />

                <button
                  onClick={() => { setInput(activeNote.structured_data?.summary || ""); setActiveNote(null); }}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title="Regenerate from summary"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={deleteActive}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Evolving status banner */}
            {evolving && (
              <div className="flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/[0.06] px-4 py-2 text-[13px] text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {evolveBusy === "expand" ? "Deepening note with new detail…" : "Merging new information…"}
              </div>
            )}

            {activeNote.structured_data ? (
              <StructuredNoteView
                note={stripMeta(activeNote.structured_data)}
                videoId={activeVideoId}
                highlights={highlights}
              />
            ) : (
              <div className="mx-auto w-full max-w-[720px] px-6 py-12">
                <h1 className="font-display text-3xl font-bold">{activeNote.title}</h1>
                <p className="mt-4 whitespace-pre-wrap leading-[1.85] text-foreground/85">{activeNote.content}</p>
              </div>
            )}

            {/* Add more information panel */}
            {activeNote.structured_data && (
              <div className="mx-auto w-full max-w-[720px] px-5 pb-24 sm:px-8">
                {!addOpen ? (
                  <button
                    onClick={() => setAddOpen(true)}
                    disabled={evolving}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-card/30 px-5 py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card/60 hover:text-foreground disabled:opacity-50"
                  >
                    <PlusCircle className="h-4 w-4" /> Add more information
                  </button>
                ) : (
                  <div className="animate-[studio-fade-in_0.25s_ease-out_both] rounded-3xl border border-border/60 bg-card/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <PlusCircle className="h-4 w-4 text-primary" /> Add more information
                      </div>
                      <button onClick={() => { setAddOpen(false); setAddText(""); }} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mb-3 text-[13px] text-muted-foreground">
                      Paste an article, transcript, link, or extra notes. The AI will intelligently merge it into the right sections.
                    </p>
                    <textarea
                      value={addText}
                      onChange={(e) => setAddText(e.target.value)}
                      placeholder="Paste new material to integrate…"
                      disabled={evolving}
                      className="block min-h-[140px] w-full resize-y rounded-2xl border border-border/50 bg-background/60 px-4 py-3 text-[15px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 disabled:opacity-60"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleMerge}
                        disabled={evolving || !addText.trim()}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        {evolveBusy === "merge" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Merge into note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SecondaryBtn({
  onClick, disabled, icon: Icon, label,
}: { onClick: () => void; disabled?: boolean; icon: typeof Sparkles; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-[13px] font-medium text-foreground/85 transition-colors hover:border-primary/30 hover:bg-secondary/60 disabled:opacity-50"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function Popover({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  // Click outside to close
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-studio-popover]")) onClose();
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [onClose]);
  return (
    <div
      data-studio-popover
      className={`absolute right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-border/60 bg-popover py-1 shadow-xl shadow-black/20 animate-[studio-fade-in_0.15s_ease-out_both] ${wide ? "w-[320px]" : "w-[220px]"}`}
    >
      {children}
    </div>
  );
}
