import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { NoteCard } from "@/components/studio/NoteCard";
import { SmartEditor } from "@/components/studio/SmartEditor";
import { QuickCapture } from "@/components/studio/QuickCapture";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pin, Heart, Trash2, Filter, BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const colorThemes = ["default", "red", "blue", "green", "purple", "amber", "rose"];
const themeDot: Record<string, string> = { default: "bg-muted-foreground", red: "bg-red-400", blue: "bg-blue-400", green: "bg-green-400", purple: "bg-purple-400", amber: "bg-amber-400", rose: "bg-rose-400" };
const defaultCategories = ["general", "research", "notes", "essay", "review", "timeline"];

type KNote = {
  id: string; user_id: string; title: string; content: string | null; html_content: string | null;
  category: string | null; tags: string[] | null; color_theme: string | null;
  linked_year: number | null; linked_era: string | null; linked_event_id: string | null;
  media_urls: string[] | null; word_count: number | null;
  is_pinned: boolean | null; is_favorite: boolean | null; is_public: boolean | null;
  created_at: string; updated_at: string;
};

const KnowledgeStudioPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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

  const createNote = async (quickTitle?: string, quickContent?: string, quickHtml?: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("knowledge_notes")
      .insert({
        user_id: user.id,
        title: quickTitle || "Untitled Note",
        content: quickContent || "",
        html_content: quickHtml || quickContent ? `<p>${quickContent}</p>` : "",
      })
      .select()
      .single();
    if (data) {
      setNotes((prev) => [data as KNote, ...prev]);
      if (!quickTitle) selectNote(data as KNote);
      else {
        selectNote(data as KNote);
        toast.success("Note created!");
      }
    }
    if (error) toast.error("Failed to create note");
  };

  const selectNote = (n: KNote) => {
    setSelected(n);
    setTitle(n.title);
    setHtmlContent(n.html_content || n.content || "");
    setPlainContent(n.content || "");
    setCategory(n.category || "general");
    setColorTheme(n.color_theme || "default");
    setLinkedYear(n.linked_year?.toString() || "");
    setTagsInput((n.tags || []).join(", "));
    setShowMeta(false);
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
    fetchNotes();
    toast.success("Note deleted");
  };

  const filtered = notes.filter((n) => {
    if (filterCat !== "all" && n.category !== filterCat) return false;
    if (searchQ && !n.title.toLowerCase().includes(searchQ.toLowerCase()) && !(n.tags || []).some(t => t.toLowerCase().includes(searchQ.toLowerCase()))) return false;
    return true;
  });

  const allCategories = ["all", ...new Set([...defaultCategories, ...notes.map(n => n.category || "general")])];
  const wordCount = plainContent.trim().split(/\s+/).filter(Boolean).length;

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 flex h-screen">
        {/* Sidebar */}
        <div className={`w-80 border-r border-border bg-card flex flex-col shrink-0 ${selected ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Studio
              </h2>
              <div className="flex items-center gap-1">
                <QuickCapture onSave={(t, c, h) => createNote(t, c, h)} />
                <button onClick={() => createNote()} className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search notes..."
                className="w-full text-xs rounded-lg bg-secondary/80 border border-border pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {allCategories.slice(0, 6).map((c) => (
                <button key={c} onClick={() => setFilterCat(c)}
                  className={`px-2 py-1 text-[10px] rounded-md font-medium capitalize transition-colors ${filterCat === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            <AnimatePresence>
              {filtered.map((n) => (
                <NoteCard key={n.id} note={n} isSelected={selected?.id === n.id} onClick={() => selectNote(n)} />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No notes yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create one to get started</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
            {notes.length} notes · {notes.reduce((s, n) => s + (n.word_count || 0), 0)} words total
          </div>
        </div>

        {/* Editor */}
        <div className={`flex-1 flex flex-col ${!selected && "hidden lg:flex"}`}>
          {selected ? (
            <>
              {/* Editor Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/50 gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => setSelected(null)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title..."
                    className="text-xl font-bold text-foreground bg-transparent border-none outline-none flex-1 min-w-0" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setShowMeta(!showMeta)} className={`p-1.5 rounded-md transition-colors ${showMeta ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Settings">
                    <Filter className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => togglePin(selected)} className={`p-1.5 rounded-md ${selected.is_pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => toggleFav(selected)} className={`p-1.5 rounded-md ${selected.is_favorite ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <Heart className={`h-3.5 w-3.5 ${selected.is_favorite ? "fill-primary" : ""}`} />
                  </button>
                  <button onClick={() => deleteNote(selected)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-2 ml-2 text-[10px] text-muted-foreground">
                    <span>{wordCount}w</span>
                    {saving && <span className="text-primary flex items-center gap-1"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving</span>}
                  </div>
                </div>
              </div>

              {/* Metadata Panel */}
              <AnimatePresence>
                {showMeta && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-b border-border bg-secondary/30 overflow-hidden">
                    <div className="p-4 flex flex-wrap gap-4 items-end">
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1 block">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}
                          className="text-xs rounded-md bg-secondary border border-border px-2 py-1.5 text-foreground">
                          {defaultCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1 block">Year</label>
                        <input type="number" value={linkedYear} onChange={(e) => setLinkedYear(e.target.value)} placeholder="e.g. 1066"
                          className="text-xs rounded-md bg-secondary border border-border px-2 py-1.5 text-foreground w-24" />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1 block">Tags (comma-separated)</label>
                        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="ww2, europe..."
                          className="text-xs rounded-md bg-secondary border border-border px-2 py-1.5 text-foreground w-full" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium uppercase mb-1 block">Color</label>
                        <div className="flex gap-1">
                          {colorThemes.map(c => (
                            <button key={c} onClick={() => setColorTheme(c)}
                              className={`w-5 h-5 rounded-full ${themeDot[c]} ${colorTheme === c ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Smart Editor */}
              <div className="flex-1 overflow-hidden relative">
                <SmartEditor content={htmlContent} onChange={(html, text) => { setHtmlContent(html); setPlainContent(text); }} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xl font-bold text-foreground mb-2">Knowledge Studio</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  Your AI-powered research workspace. Create notes, extract insights from YouTube, and let AI enhance your writing.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => createNote()} className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all">
                    <Plus className="h-4 w-4" /> New Note
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeStudioPage;
