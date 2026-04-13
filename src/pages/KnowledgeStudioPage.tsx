import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Brain, Loader2, Plus, Search, Settings2, Sparkles, Trash2, Wand2 } from "lucide-react";
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

  const saveLabel = saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Error" : "";

  return (
      <div className={`${themeClass} bg-background text-foreground`}>
        <main className="flex h-[100svh] min-w-0 flex-col md:flex-row">

          {(!isMobile || mobilePane === "list") && (
            <aside className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-border/70 bg-background/95 md:w-[320px] md:flex-none md:border-b-0 md:border-r">
              <div className="shrink-0 border-b border-border/70 px-4 pb-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Knowledge Studio</p>
                    <h1 className="mt-1 text-2xl font-semibold text-foreground">Notes</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowSettings(true)} aria-label="Settings"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-colors hover:text-foreground">
                      <Settings2 className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={createNote}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                      <Plus className="h-4 w-4" /> New Note
                    </button>
                  </div>
                </div>

                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/40" />
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {filterCats.map((cat) => (
                    <button key={cat} type="button" onClick={() => setActiveCat(cat)}
                      className={`min-h-[36px] shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        activeCat === cat ? "border-primary/35 bg-primary/10 text-primary" : "border-border/70 text-muted-foreground hover:text-foreground"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 [scrollbar-gutter:stable]"
                onScroll={() => { if (listRef.current) sessionStorage.setItem(SCROLL_KEY, String(listRef.current.scrollTop)); }}>
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <p className="text-sm">No notes yet.</p>
                    <button type="button" onClick={createNote} className="mt-3 text-sm font-medium text-primary hover:underline">Create your first note</button>
                  </div>
                )}
                {filtered.map((n) => <NoteCard key={n.id} note={toStudioNote(n)} isSelected={n.id === selectedId} onClick={() => openNote(n)} />)}
              </div>
            </aside>
          )}

          {(!isMobile || mobilePane === "editor") && (
            <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
              {selected ? (
                <>
                  <div className="shrink-0 border-b border-border/70 px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isMobile && (
                        <button type="button" onClick={() => { setMobilePane("list"); setSelectedId(null); }}
                          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                      )}
                      <input type="text" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder="Title or paste YouTube link…"
                        className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none" />
                      {saveLabel && <span className="shrink-0 text-xs text-muted-foreground">{saveLabel}</span>}
                      <button type="button" onClick={deleteNote} aria-label="Delete note"
                        className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground/60">Start writing or use AI to generate a note from a topic or video.</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <AiBtn icon={Sparkles} label="Improve" tooltip="Fix grammar and improve clarity" loading={aiAction === "improve"} disabled={!!aiAction} onClick={() => runAi("improve")} />
                      <AiBtn icon={Brain} label="Generate" tooltip="Create a structured note from topic or video" loading={aiAction === "generate"} disabled={!!aiAction} onClick={() => runAi("generate")} />
                      <AiBtn icon={Wand2} label="Magic" tooltip="Full auto — structured note from short topic or video" loading={aiAction === "magic"} disabled={!!aiAction} primary onClick={() => runAi("magic")} />

                      <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}
                        className="h-9 rounded-xl border border-border/70 bg-background px-3 text-xs text-foreground outline-none md:ml-auto">
                        {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
                    <SmartEditor content={draftHtml} onChange={(html, text) => { setDraftHtml(html); setDraftText(text); }} settings={settings} />
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                  <p className="text-lg font-medium">Select a note or create one</p>
                  <button type="button" onClick={createNote}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
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

function AiBtn({ icon: Icon, label, tooltip, loading, disabled, primary, onClick }: {
  icon: typeof Sparkles; label: string; tooltip: string; loading: boolean; disabled: boolean; primary?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" title={tooltip} disabled={disabled} onClick={onClick}
      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
        primary
          ? "border-primary bg-primary text-primary-foreground hover:opacity-90"
          : "border-border/70 bg-card text-foreground hover:border-primary/30"
      }`}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
