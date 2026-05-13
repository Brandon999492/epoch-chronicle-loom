import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronLeft, Plus, Sparkles, Loader2, Trash2, Search, FileText, Wand2,
  ArrowUpRight, Brain, ScrollText, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { StructuredNoteView, type StructuredNote } from "@/components/studio/StructuredNoteView";

type SavedNote = {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  updated_at: string;
  structured_data: StructuredNote | null;
};

type Stage = "idle" | "ingesting" | "chunking" | "ranking" | "synthesizing" | "rendering" | "done" | "error";

const STAGES: { key: Stage; label: string; pct: number }[] = [
  { key: "ingesting", label: "Ingesting content", pct: 10 },
  { key: "chunking", label: "Chunking semantically", pct: 25 },
  { key: "ranking", label: "Ranking key signal", pct: 50 },
  { key: "synthesizing", label: "Synthesizing the note", pct: 80 },
  { key: "rendering", label: "Rendering", pct: 95 },
];

const NOTE_COLS = "id, title, content, category, updated_at, structured_data";
const PLACEHOLDER =
  "Paste an article, a transcript, a YouTube link, or your own raw thoughts.\n\nThe AI will read everything, find what matters, and turn it into a structured note.";

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
  const stageTimer = useRef<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-grow textarea
  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, window.innerHeight * 0.55)}px`;
  }, [input]);

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

      // Persist
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
          structured_data: { ...structured, _videoId: videoId },
        } as never)
        .select(NOTE_COLS)
        .single();

      stopStages();
      setStage("done"); setProgress(100);

      if (saveErr || !saved) {
        toast.error("Saved locally only — DB save failed.");
        setActiveNote({
          id: "tmp", title: structured.title, content: structured.summary,
          category: structured.category || null, updated_at: new Date().toISOString(),
          structured_data: structured,
        });
        setActiveVideoId(videoId);
        return;
      }

      const savedNote = saved as unknown as SavedNote;
      setActiveNote(savedNote);
      setActiveVideoId(videoId);
      setNotes((prev) => [savedNote, ...prev]);
      setInput("");
      toast.success("Structured note ready.");
    } catch (e) {
      stopStages();
      setStage("error");
      const msg = e instanceof Error ? e.message : "Generation failed";
      toast.error(msg);
    } finally {
      window.setTimeout(() => setStage("idle"), 800);
    }
  }, [input, user, navigate, advanceStages, stopStages]);

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

  const openNote = useCallback((n: SavedNote) => {
    setActiveNote(n);
    const sd = n.structured_data as (StructuredNote & { _videoId?: string | null }) | null;
    setActiveVideoId(sd?._videoId ?? null);
    if (isMobile) setShowSidebar(false);
  }, [isMobile]);

  const startNew = useCallback(() => {
    setActiveNote(null); setActiveVideoId(null); setInput("");
    setStage("idle"); setProgress(0);
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

  if (authLoading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-background text-foreground md:flex-row">
      {/* Sidebar */}
      {(showSidebar || !isMobile) && (
        <aside className="flex min-h-0 shrink-0 flex-col border-b border-border/40 bg-secondary/20 backdrop-blur md:w-[280px] md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-5">
            <button
              onClick={() => navigate("/")}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Brain className="h-4 w-4 text-primary" />
              Studio
            </div>
            <button
              onClick={startNew}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.97]"
            >
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
              <div className="px-3 py-8 text-center text-xs text-muted-foreground/60">
                No notes yet. Paste something to get started.
              </div>
            )}
            {filteredNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => openNote(n)}
                className={`block w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
                  activeNote?.id === n.id ? "bg-primary/10" : "hover:bg-secondary/60"
                }`}
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
        {/* Mobile top bar */}
        {isMobile && (
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-background/80 px-3 backdrop-blur">
            <button
              onClick={() => setShowSidebar((s) => !s)}
              className="rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
            >
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

              {/* Actions */}
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

              {/* Generating overlay */}
              {generating && (
                <div className="mt-8 animate-[studio-fade-in_0.3s_ease-out_both] rounded-3xl border border-border/50 bg-card/60 p-6">
                  <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <ul className="space-y-2">
                    {STAGES.map((s) => {
                      const idx = STAGES.findIndex((x) => x.key === stage);
                      const sIdx = STAGES.findIndex((x) => x.key === s.key);
                      const done = sIdx < idx;
                      const active = sIdx === idx;
                      return (
                        <li key={s.key} className={`flex items-center gap-3 text-sm transition-opacity ${active || done ? "opacity-100" : "opacity-40"}`}>
                          {active ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          ) : done ? (
                            <span className="h-3.5 w-3.5 rounded-full bg-primary" />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full border border-border" />
                          )}
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
            <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border/40 bg-background/85 px-4 py-2.5 backdrop-blur-md">
              <button
                onClick={startNew}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Plus className="h-4 w-4" /> New note
              </button>
              <div className="flex items-center gap-1">
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
            {activeNote.structured_data ? (
              <StructuredNoteView note={activeNote.structured_data} videoId={activeVideoId} />
            ) : (
              <div className="mx-auto w-full max-w-[720px] px-6 py-12">
                <h1 className="font-display text-3xl font-bold">{activeNote.title}</h1>
                <p className="mt-4 whitespace-pre-wrap leading-[1.85] text-foreground/85">{activeNote.content}</p>
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
