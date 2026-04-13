import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Brain, ChevronLeft, Loader2, Plus, Search, Settings2, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { NoteCard } from "@/components/studio/NoteCard";
import { SmartEditor, type StudioSettings } from "@/components/studio/SmartEditor";
import { StudioSettingsPanel } from "@/components/studio/StudioSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  buildStructuredBodyHtml, buildStructuredBodyPlainText, createNoteBodyHtml,
  createNoteBodyPlainText, DEFAULT_CATEGORY, DEFAULT_NOTE_TITLE, extractMediaMarkup,
  htmlToPlainText, isYouTubeUrl, MAGIC_INPUT_LIMIT, normalizeCategory, normalizeStoredHtml,
  plainTextToEditorHtml, STUDIO_CATEGORIES, toStudioNote, type StudioNote, type StudioStructuredNote,
} from "@/components/studio/studio-note-utils";

type KNote = StudioNote & {
  user_id: string;
  content: string | null;
  created_at: string;
  word_count: number | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type MobilePane = "list" | "editor";
type AiAction = "improve" | "generate" | "magic";

const SETTINGS_KEY = "knowledge-studio-settings-v3";
const SELECTED_KEY = "knowledge-studio-selected-note";
const SCROLL_KEY = "knowledge-studio-list-scroll";
const NOTE_COLS = "id, user_id, title, content, html_content, category, created_at, updated_at, word_count";

const DEFAULT_SETTINGS: StudioSettings = { fontSize: "medium", readingWidth: "medium", theme: "warm" };

function countWords(text: string) { return text.trim().split(/\s+/).filter(Boolean).length; }

export default function KnowledgeStudioPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const listRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  const [notes, setNotes] = useState<KNote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState(DEFAULT_NOTE_TITLE);
  const [draftHtml, setDraftHtml] = useState(createNoteBodyHtml());
  const [draftText, setDraftText] = useState(createNoteBodyPlainText());
  const [draftCategory, setDraftCategory] = useState(DEFAULT_CATEGORY);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [showSettings, setShowSettings] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [aiAction, setAiAction] = useState<AiAction | null>(null);
  const [mobilePane, setMobilePane] = useState<MobilePane>("list");
  const [settings, setSettings] = useState<StudioSettings>(() => {
    try { const s = localStorage.getItem(SETTINGS_KEY); return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS; }
    catch { return DEFAULT_SETTINGS; }
  });

  const selected = useMemo(() => notes.find((n) => n.id === selectedId) ?? null, [notes, selectedId]);

  const allCategories = useMemo(() => {
    const set = new Set([DEFAULT_CATEGORY, ...STUDIO_CATEGORIES.map(normalizeCategory), ...notes.map((n) => normalizeCategory(n.category)), normalizeCategory(draftCategory)]);
    return Array.from(set).sort((a, b) => a === DEFAULT_CATEGORY ? -1 : b === DEFAULT_CATEGORY ? 1 : a.localeCompare(b));
  }, [draftCategory, notes]);

  const filterCats = useMemo(() => ["All", ...allCategories], [allCategories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      if (activeCat !== "All" && normalizeCategory(n.category) !== activeCat) return false;
      if (!q) return true;
      return [n.title, n.content || "", normalizeCategory(n.category)].join(" ").toLowerCase().includes(q);
    });
  }, [activeCat, notes, search]);

  const themeClass = settings.theme === "light" ? "studio-theme-light" : settings.theme === "dark" ? "studio-theme-dark" : "studio-theme-warm";

  const loadDraft = useCallback((note: KNote) => {
    const html = normalizeStoredHtml(note.html_content);
    setDraftTitle(note.title || DEFAULT_NOTE_TITLE);
    setDraftHtml(html);
    setDraftText((note.content || htmlToPlainText(html)).trim());
    setDraftCategory(normalizeCategory(note.category));
    setSaveState("idle");
  }, []);

  const updateSettings = useCallback((next: StudioSettings) => {
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("knowledge_notes").select(NOTE_COLS).eq("user_id", user.id).order("updated_at", { ascending: false });
    if (error) { toast.error("Could not load notes."); return; }
    setNotes((data as KNote[] | null) ?? []);
  }, [user]);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [authLoading, navigate, user]);
  useEffect(() => { if (user) void fetchNotes(); }, [fetchNotes, user]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) requestAnimationFrame(() => { node.scrollTop = Number(saved); });
  }, [filtered.length, mobilePane]);

  useEffect(() => {
    if (!notes.length) { if (!isMobile) setSelectedId(null); return; }
    if (selectedId && notes.some((n) => n.id === selectedId)) return;
    if (!restoredRef.current) {
      restoredRef.current = true;
      const stored = localStorage.getItem(SELECTED_KEY);
      if (stored && notes.some((n) => n.id === stored)) { setSelectedId(stored); if (!isMobile) setMobilePane("editor"); return; }
    }
    if (!isMobile) { setSelectedId(notes[0].id); setMobilePane("editor"); }
  }, [isMobile, notes, selectedId]);

  useEffect(() => { if (selectedId) localStorage.setItem(SELECTED_KEY, selectedId); else localStorage.removeItem(SELECTED_KEY); }, [selectedId]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (selected) loadDraft(selected); }, [selected?.id]);
  useEffect(() => { if (!isMobile && selectedId) setMobilePane("editor"); if (isMobile && !selectedId) setMobilePane("list"); }, [isMobile, selectedId]);

  useEffect(() => {
    if (!selected) return;
    const snap = JSON.stringify({ t: draftTitle.trim() || DEFAULT_NOTE_TITLE, h: draftHtml.trim(), x: draftText.trim(), c: normalizeCategory(draftCategory) });
    const curHtml = normalizeStoredHtml(selected.html_content);
    const curSnap = JSON.stringify({ t: (selected.title || DEFAULT_NOTE_TITLE).trim(), h: curHtml.trim(), x: (selected.content || htmlToPlainText(curHtml)).trim(), c: normalizeCategory(selected.category) });
    if (snap === curSnap) return;

    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      const payload = { title: draftTitle.trim() || DEFAULT_NOTE_TITLE, html_content: draftHtml, content: draftText, category: normalizeCategory(draftCategory), word_count: countWords(draftText) };
      const { data, error } = await supabase.from("knowledge_notes").update(payload).eq("id", selected.id).select(NOTE_COLS).single();
      if (error || !data) { setSaveState("error"); toast.error("Auto-save failed."); return; }
      setNotes((cur) => cur.map((n) => (n.id === selected.id ? (data as KNote) : n)));
      setSaveState("saved");
      window.setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1200);
    }, 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftCategory, draftHtml, draftText, draftTitle, selected?.id]);

  const openNote = useCallback((note: KNote) => { setSelectedId(note.id); if (isMobile) setMobilePane("editor"); }, [isMobile]);

  const createNote = useCallback(async () => {
    if (!user) return;
    const html = createNoteBodyHtml(); const text = createNoteBodyPlainText();
    const { data, error } = await supabase.from("knowledge_notes").insert({ user_id: user.id, title: DEFAULT_NOTE_TITLE, content: text, html_content: html, category: DEFAULT_CATEGORY, word_count: countWords(text) }).select(NOTE_COLS).single();
    if (error || !data) { toast.error("Could not create note."); return; }
    const n = data as KNote; setNotes((c) => [n, ...c]); setSelectedId(n.id); loadDraft(n); setMobilePane("editor");
  }, [loadDraft, user]);

  const deleteNote = useCallback(async () => {
    if (!selected || !window.confirm("Delete this note?")) return;
    const { error } = await supabase.from("knowledge_notes").delete().eq("id", selected.id);
    if (error) { toast.error("Could not delete note."); return; }
    const remaining = notes.filter((n) => n.id !== selected.id);
    setNotes(remaining); setSelectedId(isMobile ? null : remaining[0]?.id ?? null);
    if (isMobile) setMobilePane("list"); toast.success("Note deleted.");
  }, [isMobile, notes, selected]);

  const runAi = useCallback(async (mode: AiAction) => {
    if (!selected) return;

    if (mode === "improve") {
      const body = draftText.trim();
      if (!body) { toast.error("Write something first."); return; }
      setAiAction("improve");
      try {
        const { data, error } = await supabase.functions.invoke("knowledge-ai", { body: { action: "grammar", text: body } });
        if (error) throw error;
        if (!data?.result) throw new Error("Could not improve note.");
        const { videoId, imageMarkup } = extractMediaMarkup(draftHtml);
        const improved = String(data.result).trim();
        setDraftHtml(`${plainTextToEditorHtml(improved, videoId)}${imageMarkup}`.trim());
        setDraftText(improved); setSaveState("idle"); toast.success("Note improved.");
      } catch (e: any) { toast.error(e.message || "AI improve failed."); }
      finally { setAiAction(null); }
      return;
    }

    const source = draftTitle.trim();
    if (!source || source.toLowerCase() === DEFAULT_NOTE_TITLE.toLowerCase()) {
      toast.error("Type a topic or paste a YouTube link in the title first."); return;
    }
    if (mode === "magic" && !isYouTubeUrl(source) && source.length > MAGIC_INPUT_LIMIT) {
      toast.error(`Magic works best with a short topic under ${MAGIC_INPUT_LIMIT} characters.`); return;
    }

    setAiAction(mode);
    try {
      const isVideo = isYouTubeUrl(source);
      const reqBody = mode === "magic"
        ? { action: "magic_note", text: source, url: isVideo ? source : undefined, detailed: false }
        : isVideo
          ? { action: "youtube_structured", url: source }
          : { action: "generate_structured_note", text: source };
      const { data, error } = await supabase.functions.invoke("knowledge-ai", { body: reqBody });
      if (error) throw error;
      if (data?.error || !data?.structured) throw new Error(data?.error || "AI generation failed.");
      const s = data.structured as StudioStructuredNote;
      setDraftTitle(s.title?.trim() || draftTitle.trim() || DEFAULT_NOTE_TITLE);
      setDraftCategory(normalizeCategory(s.category || draftCategory));
      setDraftHtml(buildStructuredBodyHtml(s, data.videoId ?? null));
      setDraftText(buildStructuredBodyPlainText(s));
      setSaveState("idle");
      toast.success(mode === "magic" ? "Magic note ready." : "Structured note created.");
    } catch (e: any) { toast.error(e.message || "AI generation failed."); }
    finally { setAiAction(null); }
  }, [draftCategory, draftHtml, draftText, draftTitle, selected]);

  if (authLoading) return <div className="min-h-screen bg-background" />;

  const saveLabel = saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : saveState === "error" ? "Error" : "";

  return (
    <div className={`${themeClass} bg-background text-foreground transition-colors duration-300`}>
      <main className="flex h-[100svh] min-w-0 flex-col md:flex-row">

        {/* ── SIDEBAR ── */}
        {(!isMobile || mobilePane === "list") && (
          <aside className="studio-animate-fade flex min-h-0 min-w-0 flex-1 flex-col border-b border-border/50 bg-background md:w-[300px] md:flex-none md:border-b-0 md:border-r">
            {/* Header */}
            <div className="shrink-0 px-5 pb-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button type="button" onClick={() => navigate("/")} aria-label="Back to home"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-lg font-semibold text-foreground font-body">Notes</h1>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setShowSettings(true)} aria-label="Settings"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <Settings2 className="h-[18px] w-[18px]" />
                  </button>
                  <button type="button" onClick={createNote}
                    className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.97]">
                    <Plus className="h-4 w-4" /> New
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border/60 bg-secondary/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/30 focus:bg-background" />
              </div>

              {/* Categories */}
              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {filterCats.map((cat) => (
                  <button key={cat} type="button" onClick={() => setActiveCat(cat)}
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${
                      activeCat === cat
                        ? "bg-primary/12 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes list */}
            <div ref={listRef} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4 [scrollbar-gutter:stable]"
              onScroll={() => { if (listRef.current) sessionStorage.setItem(SCROLL_KEY, String(listRef.current.scrollTop)); }}>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-sm text-muted-foreground/70">No notes yet</p>
                  <button type="button" onClick={createNote}
                    className="mt-3 text-sm font-medium text-primary transition-opacity hover:opacity-70">
                    Create your first note
                  </button>
                </div>
              )}
              {filtered.map((n, i) => (
                <div key={n.id} className="studio-animate-fade" style={{ animationDelay: `${Math.min(i * 30, 150)}ms` }}>
                  <NoteCard note={toStudioNote(n)} isSelected={n.id === selectedId} onClick={() => openNote(n)} />
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* ── EDITOR ── */}
        {(!isMobile || mobilePane === "editor") && (
          <section className="studio-animate-fade flex min-h-0 min-w-0 flex-1 flex-col bg-background">
            {selected ? (
              <>
                {/* Editor toolbar */}
                <div className="shrink-0 border-b border-border/40 px-4 py-3 md:px-6">
                  <div className="flex items-center gap-2">
                    {isMobile && (
                      <button type="button" onClick={() => { setMobilePane("list"); setSelectedId(null); }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}
                    <input type="text" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="Title or YouTube link…"
                      className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground/40 outline-none" />
                    {saveLabel && (
                      <span className={`shrink-0 text-xs transition-opacity duration-300 ${saveState === "saved" ? "text-green-600/70" : "text-muted-foreground/60"}`}>
                        {saveLabel}
                      </span>
                    )}
                    <button type="button" onClick={deleteNote} aria-label="Delete note"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground/50 transition-colors hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* AI + category row */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <AiBtn icon={Sparkles} label="Improve" loading={aiAction === "improve"} disabled={!!aiAction} onClick={() => runAi("improve")} />
                    <AiBtn icon={Brain} label="Generate" loading={aiAction === "generate"} disabled={!!aiAction} onClick={() => runAi("generate")} />
                    <AiBtn icon={Wand2} label="Magic" loading={aiAction === "magic"} disabled={!!aiAction} primary onClick={() => runAi("magic")} />

                    <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}
                      className="ml-auto h-8 rounded-lg border border-border/50 bg-transparent px-2.5 text-xs text-muted-foreground outline-none transition-colors hover:text-foreground">
                      {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Editor body */}
                <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
                  <SmartEditor content={draftHtml} onChange={(html, text) => { setDraftHtml(html); setDraftText(text); }} settings={settings} />
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center studio-animate-fade">
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground/80">Select a note or create a new one</p>
                  <p className="text-sm text-muted-foreground/60">Your notes are saved automatically</p>
                </div>
                <button type="button" onClick={createNote}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.97]">
                  <Plus className="h-4 w-4" /> New Note
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <StudioSettingsPanel open={showSettings} onClose={() => setShowSettings(false)} settings={settings} onChange={updateSettings} />
    </div>
  );
}

/* ── Small AI action button ── */
function AiBtn({ icon: Icon, label, loading, disabled, primary, onClick }: {
  icon: typeof Sparkles; label: string; loading: boolean; disabled: boolean; primary?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-all duration-200 disabled:opacity-40 active:scale-[0.97] ${
        primary
          ? "border-primary/30 bg-primary text-primary-foreground hover:opacity-90"
          : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
      }`}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
