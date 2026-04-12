import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { NoteCard } from "@/components/studio/NoteCard";
import { SmartEditor, type StudioSettings } from "@/components/studio/SmartEditor";
import { StudioSettingsPanel } from "@/components/studio/StudioSettings";
import { AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pin, Heart, Trash2, Filter, BookOpen, ArrowLeft, Loader2,
  Sparkles, Settings, MoreVertical, Brain
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
  const [linkedYear, setLinkedYear] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

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

  const createNote = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("knowledge_notes")
      .insert({ user_id: user.id, title: "Untitled Note", content: "", html_content: STRUCTURED_TEMPLATE_HTML, category: "general" })
      .select()
      .single();
    if (data) {
      setNotes((prev) => [data as KNote, ...prev]);
      selectNote(data as KNote);
    }
    if (error) toast.error("Failed to create note");
  };

  const selectNote = (n: KNote) => {
    setSelected(n); setTitle(n.title); setHtmlContent(n.html_content || n.content || "");
    setPlainContent(n.content || ""); setCategory(n.category || "general");
    setLinkedYear(n.linked_year?.toString() || "");
    setTagsInput((n.tags || []).join(", ")); setShowMeta(false); setShowMobileActions(false);
  };

  // AI: Generate structured note from title/topic
  const generateForCurrent = async () => {
    if (!selected) return;
    const topic = title.trim() || plainContent.trim().slice(0, 200);
    if (!topic || topic === "Untitled Note") { toast.error("Enter a title or topic first"); return; }
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
      toast.success("Note generated!");
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    } finally { setGenerating(false); }
  };

  // AI: Improve note (grammar + clarity)
  const improveNote = async () => {
    if (!selected || !plainContent.trim()) { toast.error("Write something first"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("knowledge-ai", { body: { action: "grammar", text: plainContent } });
      if (error) throw error;
      if (data?.result) {
        setHtmlContent(data.result.replace(/\n/g, "<br/>"));
        setPlainContent(data.result);
        toast.success("Note improved!");
      }
    } catch (e: any) {
      toast.error(e.message || "AI failed");
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
        category,
        linked_year: linkedYear ? parseInt(linkedYear) : null,
        tags, word_count: wc,
      }).eq("id", selected.id);
      setSaving(false);
      fetchNotes();
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, htmlContent, plainContent, category, linkedYear, tagsInput]);

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

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 flex h-screen">
        {/* Sidebar — notes list */}
        <div className={`w-full lg:w-80 border-r border-border/40 bg-background flex flex-col shrink-0 ${selected ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-border/40">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Notes
              </h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Settings">
                  <Settings className="h-4 w-4" />
                </button>
                <button onClick={createNote} className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="New note">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search notes..."
                className="w-full text-sm rounded-xl bg-secondary/40 border border-border/30 pl-8 pr-3 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[44px]" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {allCategories.slice(0, 6).map((c) => (
                <button key={c} onClick={() => setFilterCat(c)}
                  className={`px-2.5 py-1.5 text-[11px] rounded-full font-medium capitalize transition-colors min-h-[32px]
                    ${filterCat === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            {filtered.map((n) => (
              <NoteCard key={n.id} note={n} isSelected={selected?.id === n.id} onClick={() => selectNote(n)} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground/60">No notes yet</p>
                <button onClick={createNote} className="mt-3 text-xs text-primary hover:underline">+ Create your first note</button>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border/30 text-[11px] text-muted-foreground/50 text-center">
            {notes.length} notes
          </div>
        </div>

        {/* Editor area */}
        <div className={`flex-1 flex flex-col bg-background ${!selected && "hidden lg:flex"}`}>
          {selected ? (
            <>
              {/* Editor header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-border/30 gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button onClick={() => setSelected(null)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title..."
                    className="text-xl sm:text-2xl font-bold text-foreground bg-transparent border-none outline-none flex-1 min-w-0 placeholder:text-muted-foreground/30 font-display" />
                </div>
                <div className="flex items-center gap-1 shrink-0 flex-wrap">
                  {/* Two simple AI buttons */}
                  <button onClick={improveNote} disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-secondary/60 text-foreground hover:bg-secondary transition-colors disabled:opacity-50 min-h-[44px]"
                    title="Fix and refine your writing">
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
                    Improve
                  </button>
                  <button onClick={generateForCurrent} disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 min-h-[44px]"
                    title="Create a structured note from a topic or video">
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                    Generate
                  </button>

                  {isMobile ? (
                    <div className="relative">
                      <button onClick={() => setShowMobileActions(!showMobileActions)}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {showMobileActions && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowMobileActions(false)} />
                          <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-xl shadow-xl p-1 z-50 w-44">
                            <button onClick={() => { setShowMeta(!showMeta); setShowMobileActions(false); }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs rounded-md hover:bg-secondary min-h-[44px]">
                              <Filter className="h-3.5 w-3.5" /> Note Details
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
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setShowMeta(!showMeta)} className={`p-2 rounded-md transition-colors ${showMeta ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Note details">
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
                  <div className="flex items-center gap-2 ml-1 text-[10px] text-muted-foreground/50">
                    <span>{wordCount}w</span>
                    {saving && <span className="text-primary flex items-center gap-1"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving</span>}
                  </div>
                </div>
              </div>

              {/* Metadata Panel */}
              {showMeta && (
                <div className="border-b border-border/30 bg-secondary/10">
                  <div className="p-4 sm:p-5 max-w-[720px] mx-auto flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-5 sm:items-end">
                    <div className="w-full sm:w-auto">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1.5 block tracking-wider">Category</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)}
                        className="text-sm rounded-lg bg-secondary border border-border/50 px-3 py-2.5 text-foreground min-h-[44px] w-full sm:w-auto">
                        <option value="general">General</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1.5 block tracking-wider">Year</label>
                      <input type="number" value={linkedYear} onChange={(e) => setLinkedYear(e.target.value)} placeholder="e.g. 1066"
                        className="text-sm rounded-lg bg-secondary border border-border/50 px-3 py-2.5 text-foreground w-full sm:w-28 min-h-[44px]" />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1.5 block tracking-wider">Tags</label>
                      <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="ww2, europe..."
                        className="text-sm rounded-lg bg-secondary border border-border/50 px-3 py-2.5 text-foreground w-full min-h-[44px]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <SmartEditor
                  content={htmlContent}
                  onChange={(html, text) => { setHtmlContent(html); setPlainContent(text); }}
                  settings={settings}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <BookOpen className="h-8 w-8 text-primary/60" />
                </div>
                <p className="text-xl font-semibold text-foreground mb-2 font-display">Knowledge Studio</p>
                <p className="text-sm text-muted-foreground/60 mb-6 max-w-sm mx-auto">
                  Select a note or create a new one to start learning.
                </p>
                <button onClick={createNote} className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:opacity-90 transition-all min-h-[48px]">
                  <Plus className="h-4 w-4" /> New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <StudioSettingsPanel open={showSettings} onClose={() => setShowSettings(false)} settings={settings} onChange={updateSettings} />
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
