import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Plus, Pin, Heart, Trash2, Search, Tag, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Journal = Tables<"journals">;

const JournalPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selected, setSelected] = useState<Journal | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [filter, setFilter] = useState<"all" | "favorites" | "pinned">("all");
  const [searchQ, setSearchQ] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
  }, [user, authLoading, navigate]);

  const fetchJournals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("journals")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    if (data) setJournals(data);
  }, [user]);

  useEffect(() => { fetchJournals(); }, [fetchJournals]);

  const createNew = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("journals")
      .insert({ user_id: user.id, title: "Untitled Entry", content: "" })
      .select()
      .single();
    if (data) {
      setJournals((prev) => [data, ...prev]);
      selectJournal(data);
    }
    if (error) toast.error("Failed to create journal");
  };

  const selectJournal = (j: Journal) => {
    setSelected(j);
    setTitle(j.title);
    setContent(j.content || "");
    setCategory(j.category || "general");
  };

  // Autosave with debounce
  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      await supabase
        .from("journals")
        .update({ title, content, category, word_count: wordCount })
        .eq("id", selected.id);
      setSaving(false);
      fetchJournals();
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, content, category]);

  const togglePin = async (j: Journal) => {
    await supabase.from("journals").update({ is_pinned: !j.is_pinned }).eq("id", j.id);
    fetchJournals();
  };

  const toggleFavorite = async (j: Journal) => {
    await supabase.from("journals").update({ is_favorite: !j.is_favorite }).eq("id", j.id);
    fetchJournals();
  };

  const deleteJournal = async (j: Journal) => {
    await supabase.from("journals").delete().eq("id", j.id);
    if (selected?.id === j.id) { setSelected(null); setTitle(""); setContent(""); }
    fetchJournals();
    toast.success("Journal deleted");
  };

  const filtered = journals.filter((j) => {
    if (filter === "favorites" && !j.is_favorite) return false;
    if (filter === "pinned" && !j.is_pinned) return false;
    if (searchQ && !j.title.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 flex h-screen">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-card flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Journal
              </h2>
              <button onClick={createNew} className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search journals..."
                className="w-full text-xs rounded-md bg-secondary/80 border border-border pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "favorites", "pinned"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
                    filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {filtered.map((j) => (
              <div
                key={j.id}
                onClick={() => selectJournal(j)}
                className={`p-3 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors ${
                  selected?.id === j.id ? "bg-secondary/70" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{j.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {j.word_count || 0} words · {new Date(j.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {j.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                    {j.is_favorite && <Heart className="h-3 w-3 text-primary fill-primary" />}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No journals yet</p>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {selected ? (
            <>
              <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-xs rounded-md bg-secondary border border-border px-2 py-1 text-foreground focus:outline-none"
                  >
                    {["general", "research", "reflection", "notes", "summary"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button onClick={() => togglePin(selected)} className={`p-1 rounded ${selected.is_pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <Pin className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleFavorite(selected)} className={`p-1 rounded ${selected.is_favorite ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <Heart className={`h-4 w-4 ${selected.is_favorite ? "fill-primary" : ""}`} />
                  </button>
                  <button onClick={() => deleteJournal(selected)} className="p-1 rounded text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{wordCount} words</span>
                  {saving && <span className="text-primary">Saving...</span>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entry title..."
                  className="w-full text-2xl font-display font-bold text-foreground bg-transparent border-none outline-none mb-4 placeholder:text-muted-foreground"
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your thoughts, research, or reflections..."
                  className="w-full flex-1 min-h-[60vh] text-foreground bg-transparent border-none outline-none resize-none font-body text-sm leading-relaxed placeholder:text-muted-foreground"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-display text-foreground mb-2">Select or create a journal</p>
                <p className="text-sm text-muted-foreground">Your personal history research notes and reflections</p>
                <button onClick={createNew} className="mt-4 flex items-center gap-2 mx-auto rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90">
                  <Plus className="h-4 w-4" /> New Journal Entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalPage;
