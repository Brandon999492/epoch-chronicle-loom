import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { NoteCard } from "@/components/studio/NoteCard";
import { SmartEditor, type StudioSettings } from "@/components/studio/SmartEditor";
import { QuickCapture } from "@/components/studio/QuickCapture";
import { StudioSettingsPanel } from "@/components/studio/StudioSettings";
import { LearningTracker } from "@/components/studio/LearningTracker";
import { RelatedHistory } from "@/components/studio/RelatedHistory";
import { NotesTimeline } from "@/components/studio/NotesTimeline";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pin, Heart, Trash2, Filter, BookOpen, ArrowLeft, Loader2,
  Sparkles, Settings, MoreVertical, Clock, TrendingUp, List as ListIcon,
  Eye, EyeOff, Maximize2, Minimize2, X, HelpCircle, Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const CATEGORIES = [
  "Ice Age", "Space", "Serial Killers", "Ancient Egypt", "Ancient Greece",
  "Royal Family", "Dinosaurs", "Earth History", "Extinction Events", "American History",
];

const STRUCTURED_TEMPLATE_HTML = `
<h1>Untitled Note</h1>
<p><strong>Write a one-line headline…</strong></p>
<hr/>
<div class="section-label">Summary</div>
<p style="color:hsl(var(--muted-foreground))">Write what you learned…</p>
<hr/>
<div style="display:flex;gap:24px;flex-wrap:wrap;margin:16px 0">
  <div><span class="section-label">Year</span><p>—</p></div>
  <div><span class="section-label">Timeline Period</span><p>—</p></div>
  <div><span class="section-label">Category</span><p>—</p></div>
</div>
<hr/>
<div class="section-label">Key Points</div>
<ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul>
<hr/>
<div class="section-label">Detailed Notes</div>
<p style="color:hsl(var(--muted-foreground))">Write detailed notes here…</p>
<hr/>
<div class="section-label">My Thoughts</div>
<p style="color:hsl(var(--muted-foreground));font-style:italic">Add your thoughts…</p>
`.trim();

const colorThemes = ["default", "red", "blue", "green", "purple", "amber", "rose"];
const themeDot: Record<string, string> = { default: "bg-muted-foreground", red: "bg-red-400", blue: "bg-blue-400", green: "bg-green-400", purple: "bg-purple-400", amber: "bg-amber-400", rose: "bg-rose-400" };

type KNote = {
  id: string; user_id: string; title: string; content: string | null; html_content: string | null;
  category: string | null; tags: string[] | null; color_theme: string | null;
  linked_year: number | null; linked_era: string | null; linked_event_id: string | null;
  media_urls: string[] | null; word_count: number | null;
  is_pinned: boolean | null; is_favorite: boolean | null; is_public: boolean | null;
  created_at: string; updated_at: string;
};

const DEFAULT_SETTINGS: StudioSettings = { fontSize: "medium", readingWidth: "medium", editorMode: "simple", animations: true };

const KnowledgeStudioPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [notes, setNotes] = useState<KNote[]>([]);
  const [selected, setSelected] = useState<KNote | null>(null);
  const [title, setTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [plainContent, setPlainContent] = useState("");
  const [category, setCategory] = useState("general");
  const [colorTheme, setColorTheme] = useState("default");
  const [linkedYear, setLinkedYear] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  // New states
  const [sidebarTab, setSidebarTab] = useState<"notes" | "timeline" | "learning">("notes");
  const [focusMode, setFocusMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [relatedData, setRelatedData] = useState<{ events: any[]; figures: any[] } | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const [settings, setSettings] = useState<StudioSettings>(() => {
    try {
      const saved = localStorage.getItem("studio-settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const updateSettings = (s: StudioSettings) => {
    setSettings(s);
    localStorage.setItem("studio-settings", JSON.stringify(s));
  };

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("knowledge_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    if (data) setNotes(data as KNote[]);
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const createNote = async (quickTitle?: string, quickContent?: string, quickHtml?: string, structured?: any) => {
    if (!user) return;
    const noteTitle = quickTitle || "Untitled Note";
    const noteHtml = quickHtml || STRUCTURED_TEMPLATE_HTML;
    const noteContent = quickContent || "";
    const noteCategory = structured?.category || "general";
    const noteYear = structured?.year ? parseInt(structured.year) || null : null;
    const noteTags = structured?.tags || [];

    const { data, error } = await supabase
      .from("knowledge_notes")
      .insert({ user_id: user.id, title: noteTitle, content: noteContent, html_content: noteHtml, category: noteCategory, linked_year: noteYear, tags: noteTags })
      .select()
      .single();
    if (data) {
      setNotes((prev) => [data as KNote, ...prev]);
      selectNote(data as KNote);
      if (quickTitle) toast.success("Note created!");
      // Auto-populate related history from Magic Note
      if (structured?.related) setRelatedData(structured.related);
      // Auto-populate quiz from Magic Note
      if (structured?.quiz?.length) {
        setQuizData({ questions: structured.quiz });
        setQuizAnswers({});
        setShowQuizResults(false);
      }
    }
    if (error) toast.error("Failed to create note");
  };

  const selectNote = (n: KNote) => {
    setSelected(n); setTitle(n.title); setHtmlContent(n.html_content || n.content || "");
    setPlainContent(n.content || ""); setCategory(n.category || "general");
    setColorTheme(n.color_theme || "default"); setLinkedYear(n.linked_year?.toString() || "");
    setTagsInput((n.tags || []).join(", ")); setShowMeta(false); setShowMobileActions(false);
    setRelatedData(null); setQuizData(null); setQuizAnswers({}); setShowQuizResults(false);
  };

  const selectNoteById = (id: string) => {
    const n = notes.find(n => n.id === id);
    if (n) selectNote(n);
  };

  const generateForCurrent = async () => {
    if (!selected) return;
    const topic = title.trim() || plainContent.trim().slice(0, 200);
    if (!topic || topic === "Untitled Note") { toast.error("Enter a title or some text first"); return; }
    setGenerating(true);
    try {
      const isYt = topic.match(/(?:youtu\.be\/|v=)([^&?]+)/);
      const action = isYt ? "youtube_structured" : "generate_structured_note";
      const body = isYt ? { action, url: topic } : { action, text: topic };
      const { data, error } = await supabase.functions.invoke("knowledge-ai", { body });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const s = data.structured;
      if (!s) { toast.error("AI did not return data"); return; }

      const videoEmbed = data.videoId
        ? `<div style="position:relative;padding-bottom:56.25%;height:0;margin-top:32px;border-radius:12px;overflow:hidden"><iframe src="https://www.youtube.com/embed/${data.videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div>`
        : "";
      const html = buildStructuredHtml(s, videoEmbed);
      const plain = buildStructuredPlain(s);

      setTitle(s.title || title); setHtmlContent(html); setPlainContent(plain);
      if (s.category) setCategory(s.category);
      if (s.year) setLinkedYear(s.year);
      if (s.tags) setTagsInput((s.tags || []).join(", "));

      // Auto-set related history
      if (data.related) setRelatedData(data.related);

      toast.success("Note generated with AI!");
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    } finally { setGenerating(false); }
  };

  // Autosave
  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      const wc = plainContent.trim().split(/\s+/).filter(Boolean).length;
      const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
      await supabase.from("knowledge_notes").update({
        title, content: plainContent, html_content: htmlContent,
        category, color_theme: colorTheme,
        linked_year: linkedYear ? parseInt(linkedYear) : null,
        tags, word_count: wc,
      }).eq("id", selected.id);
      setSaving(false);
      fetchNotes();
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, htmlContent, plainContent, category, colorTheme, linkedYear, tagsInput]);

  const togglePin = async (n: KNote) => { await supabase.from("knowledge_notes").update({ is_pinned: !n.is_pinned }).eq("id", n.id); fetchNotes(); };
  const toggleFav = async (n: KNote) => { await supabase.from("knowledge_notes").update({ is_favorite: !n.is_favorite }).eq("id", n.id); fetchNotes(); };
  const deleteNote = async (n: KNote) => {
    await supabase.from("knowledge_notes").delete().eq("id", n.id);
    if (selected?.id === n.id) setSelected(null);
    fetchNotes(); toast.success("Note deleted");
  };

  const filtered = notes.filter((n) => {
    if (filterCat !== "all" && n.category !== filterCat) return false;
    if (searchQ && !n.title.toLowerCase().includes(searchQ.toLowerCase()) && !(n.tags || []).some(t => t.toLowerCase().includes(searchQ.toLowerCase()))) return false;
    return true;
  });

  const allCategories = ["all", ...new Set([...CATEGORIES, ...notes.map(n => n.category || "general").filter(c => c !== "general")])];
  const wordCount = plainContent.trim().split(/\s+/).filter(Boolean).length;

  const handleQuizAnswer = (qi: number, ai: number) => {
    setQuizAnswers(prev => ({ ...prev, [qi]: ai }));
  };

  if (authLoading) return null;

  // Focus mode: minimal UI
  if (focusMode && selected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
          <button onClick={() => setFocusMode(false)} className="p-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Minimize2 className="h-4 w-4" />
          </button>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold text-foreground bg-transparent border-none outline-none flex-1 text-center mx-4" />
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
            {saving && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            <button onClick={() => setReadingMode(!readingMode)} className="p-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
              {readingMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <SmartEditor content={htmlContent} onChange={(html, text) => { setHtmlContent(html); setPlainContent(text); }} settings={settings} focusMode readingMode={readingMode} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 flex h-screen">
        {/* Sidebar */}
        <div className={`w-full sm:w-80 border-r border-border/60 bg-card/50 flex flex-col shrink-0 ${selected ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-border/60">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Studio
              </h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Settings">
                  <Settings className="h-4 w-4" />
                </button>
                <button onClick={() => createNote()} className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="New note">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sidebar tabs */}
            <div className="flex gap-1 mb-3 bg-secondary/30 rounded-lg p-0.5">
              {([
                { key: "notes", icon: ListIcon, label: "Notes" },
                { key: "timeline", icon: Clock, label: "Timeline" },
                { key: "learning", icon: TrendingUp, label: "Learn" },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button key={key} onClick={() => setSidebarTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[11px] rounded-md font-medium transition-colors min-h-[36px]
                    ${sidebarTab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {sidebarTab === "notes" && (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search notes..."
                    className="w-full text-sm rounded-xl bg-secondary/50 border border-border/50 pl-8 pr-3 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[44px]" />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {allCategories.slice(0, 8).map((c) => (
                    <button key={c} onClick={() => setFilterCat(c)}
                      className={`px-2.5 py-1.5 text-[11px] rounded-full font-medium capitalize transition-colors min-h-[32px]
                        ${filterCat === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar content */}
          {sidebarTab === "notes" && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-hide">
                <AnimatePresence>
                  {filtered.map((n) => (
                    <NoteCard key={n.id} note={n} isSelected={selected?.id === n.id} onClick={() => selectNote(n)} />
                  ))}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <div className="text-center py-16">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Click + or use Quick Note to get started</p>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-border/60 text-[11px] text-muted-foreground/60 text-center">
                {notes.length} notes · {notes.reduce((s, n) => s + (n.word_count || 0), 0)} words
              </div>
            </>
          )}

          {sidebarTab === "timeline" && (
            <NotesTimeline notes={notes} onSelect={selectNoteById} filterCat={filterCat} />
          )}

          {sidebarTab === "learning" && (
            <div className="flex-1 overflow-y-auto">
              <LearningTracker notes={notes} />
            </div>
          )}
        </div>

        {/* Editor */}
        <div className={`flex-1 flex flex-col bg-background ${!selected && "hidden lg:flex"}`}>
          {selected ? (
            <>
              {/* Editor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-border/40 gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button onClick={() => setSelected(null)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title..."
                    className="text-xl sm:text-2xl font-bold text-foreground bg-transparent border-none outline-none flex-1 min-w-0 placeholder:text-muted-foreground/30" />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={generateForCurrent} disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 min-h-[44px]">
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Generate
                  </button>

                  {/* Focus & Reading mode toggles */}
                  <button onClick={() => setFocusMode(true)} className="p-2 rounded-md text-muted-foreground hover:text-foreground" title="Focus mode">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setReadingMode(!readingMode)} className={`p-2 rounded-md ${readingMode ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`} title="Reading mode">
                    {readingMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>

                  {isMobile ? (
                    <div className="relative">
                      <button onClick={() => setShowMobileActions(!showMobileActions)}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <AnimatePresence>
                        {showMobileActions && (
                          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                            className="absolute top-full right-0 mt-1 bg-card border border-border rounded-xl shadow-xl p-1 z-50 w-44">
                            <button onClick={() => { setShowMeta(!showMeta); setShowMobileActions(false); }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs rounded-md hover:bg-secondary min-h-[44px]">
                              <Filter className="h-3.5 w-3.5" /> Note Settings
                            </button>
                            <button onClick={() => { togglePin(selected); setShowMobileActions(false); }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs rounded-md hover:bg-secondary min-h-[44px]">
                              <Pin className="h-3.5 w-3.5" /> {selected.is_pinned ? "Unpin" : "Pin"}
                            </button>
                            <button onClick={() => { toggleFav(selected); setShowMobileActions(false); }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs rounded-md hover:bg-secondary min-h-[44px]">
                              <Heart className="h-3.5 w-3.5" /> {selected.is_favorite ? "Unfavorite" : "Favorite"}
                            </button>
                            <button onClick={() => { deleteNote(selected); setShowMobileActions(false); }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs rounded-md hover:bg-secondary text-destructive min-h-[44px]">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setShowMeta(!showMeta)} className={`p-2 rounded-md transition-colors ${showMeta ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Note settings">
                        <Filter className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => togglePin(selected)} className={`p-2 rounded-md ${selected.is_pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleFav(selected)} className={`p-2 rounded-md ${selected.is_favorite ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        <Heart className={`h-3.5 w-3.5 ${selected.is_favorite ? "fill-primary" : ""}`} />
                      </button>
                      <button onClick={() => deleteNote(selected)} className="p-2 rounded-md text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <div className="flex items-center gap-2 ml-1 text-[10px] text-muted-foreground/60">
                    <span>{wordCount}w</span>
                    {saving && <span className="text-primary flex items-center gap-1"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving</span>}
                  </div>
                </div>
              </div>

              {/* Metadata Panel */}
              <AnimatePresence>
                {showMeta && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-b border-border/40 bg-secondary/20 overflow-hidden">
                    <div className="p-4 sm:p-5 max-w-[720px] mx-auto flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-5 sm:items-end">
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1.5 block tracking-wider">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}
                          className="text-sm rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground min-h-[44px] w-full sm:w-auto">
                          <option value="general">General</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1.5 block tracking-wider">Year</label>
                        <input type="number" value={linkedYear} onChange={(e) => setLinkedYear(e.target.value)} placeholder="e.g. 1066"
                          className="text-sm rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground w-full sm:w-28 min-h-[44px]" />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1.5 block tracking-wider">Tags</label>
                        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="ww2, europe..."
                          className="text-sm rounded-lg bg-secondary border border-border px-3 py-2.5 text-foreground w-full min-h-[44px]" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1.5 block tracking-wider">Color</label>
                        <div className="flex gap-2">
                          {colorThemes.map(c => (
                            <button key={c} onClick={() => setColorTheme(c)}
                              className={`w-7 h-7 rounded-full ${themeDot[c]} ${colorTheme === c ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Editor */}
              <div className="flex-1 overflow-hidden relative flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <SmartEditor
                    content={htmlContent}
                    onChange={(html, text) => { setHtmlContent(html); setPlainContent(text); }}
                    settings={settings}
                    readingMode={readingMode}
                    onQuizGenerated={(q) => { setQuizData(q); setQuizAnswers({}); setShowQuizResults(false); }}
                    onTimelineExtracted={(t) => toast.success(`Extracted ${t?.events?.length || 0} timeline events`)}
                  />
                </div>

                {/* Quiz Panel */}
                <AnimatePresence>
                  {quizData?.questions && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border bg-card/50 overflow-y-auto max-h-[300px]">
                      <div className="max-w-[720px] mx-auto p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <HelpCircle className="h-3.5 w-3.5" /> Knowledge Quiz
                          </span>
                          <div className="flex items-center gap-2">
                            {!showQuizResults && Object.keys(quizAnswers).length === quizData.questions.length && (
                              <button onClick={() => setShowQuizResults(true)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground">Check Answers</button>
                            )}
                            <button onClick={() => setQuizData(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {quizData.questions.map((q: any, qi: number) => (
                            <div key={qi} className="space-y-2">
                              <p className="text-sm font-medium text-foreground">{qi + 1}. {q.question}</p>
                              <div className="grid gap-1.5">
                                {q.options?.map((opt: string, oi: number) => {
                                  const isSelected = quizAnswers[qi] === oi;
                                  const isCorrect = showQuizResults && oi === q.correct_index;
                                  const isWrong = showQuizResults && isSelected && oi !== q.correct_index;
                                  return (
                                    <button key={oi} onClick={() => !showQuizResults && handleQuizAnswer(qi, oi)}
                                      className={`text-left px-3 py-2 text-xs rounded-lg border transition-colors min-h-[40px]
                                        ${isCorrect ? "border-green-500/50 bg-green-500/10 text-green-400" :
                                          isWrong ? "border-destructive/50 bg-destructive/10 text-destructive" :
                                          isSelected ? "border-primary/50 bg-primary/10 text-primary" :
                                          "border-border/50 hover:bg-secondary/50 text-foreground"}`}>
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              {showQuizResults && quizAnswers[qi] !== q.correct_index && (
                                <p className="text-[11px] text-muted-foreground pl-2">{q.explanation}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        {showQuizResults && (
                          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                            <p className="text-sm font-semibold text-foreground">
                              Score: {quizData.questions.filter((_: any, i: number) => quizAnswers[i] === quizData.questions[i].correct_index).length} / {quizData.questions.length}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Related History */}
                <RelatedHistory noteTitle={title} noteContent={plainContent} preloaded={relatedData} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground mb-3">Knowledge Studio</p>
                <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                  Your AI-powered personal history learning system. Capture ideas, generate structured notes, and track your learning journey.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => createNote()} className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:opacity-90 transition-all shadow-lg min-h-[48px]">
                    <Plus className="h-4 w-4" /> New Note
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <QuickCapture onSave={(t, c, h, s) => createNote(t, c, h, s)} />

      <AnimatePresence>
        {showSettings && (
          <StudioSettingsPanel open={showSettings} onClose={() => setShowSettings(false)} settings={settings} onChange={updateSettings}
            focusMode={focusMode} onFocusMode={setFocusMode}
            readingMode={readingMode} onReadingMode={setReadingMode} />
        )}
      </AnimatePresence>
    </div>
  );
};

function buildStructuredHtml(s: any, videoEmbed: string): string {
  const kp = (s.key_points || []).map((p: string) => `<li>${p}</li>`).join("");
  const timeline = (s.timeline || []).map((t: any) =>
    `<li><strong>${t.year}</strong> — ${t.title}: ${t.description}</li>`
  ).join("");
  const figures = (s.figures || []).map((f: any) =>
    `<li><strong>${f.name}</strong> (${f.role}) — ${f.significance}</li>`
  ).join("");

  return `
<h1>${s.title || ""}</h1>
<p><strong>${s.headline || ""}</strong></p>
<hr/>
<div class="section-label">Summary</div>
<p>${s.summary || ""}</p>
<hr/>
<div style="display:flex;gap:24px;flex-wrap:wrap;margin:16px 0">
  <div><span class="section-label">Year</span><p>${s.year || "—"}</p></div>
  <div><span class="section-label">Timeline Period</span><p>${s.timeline_period || "—"}</p></div>
  <div><span class="section-label">Category</span><p>${s.category || "—"}</p></div>
</div>
<hr/>
<div class="section-label">Key Points</div>
<ul>${kp}</ul>
<hr/>
<div class="section-label">Detailed Notes</div>
<p>${(s.detailed_notes || "").replace(/\n/g, "</p><p>")}</p>
${timeline ? `<hr/><div class="section-label">Timeline</div><ul>${timeline}</ul>` : ""}
${figures ? `<hr/><div class="section-label">Key Figures</div><ul>${figures}</ul>` : ""}
<hr/>
<div class="section-label">My Thoughts</div>
<p style="color:hsl(var(--muted-foreground));font-style:italic">${s.thoughts || "Add your thoughts here…"}</p>
${videoEmbed}`.trim();
}

function buildStructuredPlain(s: any): string {
  const kp = (s.key_points || []).map((p: string, i: number) => `${i + 1}. ${p}`).join("\n");
  return `${s.title || ""}\n${s.headline || ""}\n\nSummary:\n${s.summary || ""}\n\nYear: ${s.year || ""}\nTimeline Period: ${s.timeline_period || ""}\nCategory: ${s.category || ""}\n\nKey Points:\n${kp}\n\nDetailed Notes:\n${s.detailed_notes || ""}\n\nMy Thoughts:\n${s.thoughts || ""}`;
}

export default KnowledgeStudioPage;
