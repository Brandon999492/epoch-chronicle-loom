import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Bookmark, Trash2, FolderPlus, Folder, ChevronRight, X } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { allEvents, categoryLabels } from "@/data/historicalData";

const BookmarksPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [bm, fl] = await Promise.all([
      supabase.from("bookmarks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookmark_folders").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    ]);
    if (bm.data) setBookmarks(bm.data);
    if (fl.data) setFolders(fl.data);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const removeBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    fetchData();
    toast.success("Bookmark removed");
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    await supabase.from("bookmark_folders").insert({ user_id: user.id, name: newFolderName.trim() });
    setNewFolderName("");
    setShowFolderInput(false);
    fetchData();
    toast.success("Folder created!");
  };

  const deleteFolder = async (folderId: string) => {
    await supabase.from("bookmark_folders").delete().eq("id", folderId);
    if (activeFolder === folderId) setActiveFolder(null);
    fetchData();
    toast.success("Folder deleted");
  };

  const moveToFolder = async (bookmarkId: string, folderId: string | null) => {
    await supabase.from("bookmarks").update({ folder_id: folderId }).eq("id", bookmarkId);
    fetchData();
    toast.success(folderId ? "Moved to folder" : "Removed from folder");
  };

  const filteredBookmarks = activeFolder
    ? bookmarks.filter(bm => bm.folder_id === activeFolder)
    : bookmarks;

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
              <Bookmark className="h-7 w-7 text-primary" /> Bookmarks
            </h1>
            <p className="text-muted-foreground mb-8">Your saved historical events organized by folders</p>

            {/* Folders Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <button onClick={() => setActiveFolder(null)}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${!activeFolder ? "bg-primary/10 text-primary border border-primary/30" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
                All ({bookmarks.length})
              </button>
              {folders.map(f => (
                <div key={f.id} className="relative group">
                  <button onClick={() => setActiveFolder(f.id)}
                    className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${activeFolder === f.id ? "bg-primary/10 text-primary border border-primary/30" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
                    <Folder className="h-3.5 w-3.5" />
                    {f.name} ({bookmarks.filter(bm => bm.folder_id === f.id).length})
                  </button>
                  <button onClick={() => deleteFolder(f.id)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {showFolderInput ? (
                <div className="flex items-center gap-2">
                  <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === "Enter" && createFolder()}
                    className="px-3 py-1.5 rounded-lg bg-secondary/80 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-36" placeholder="Folder name" autoFocus />
                  <button onClick={createFolder} className="text-xs text-primary font-medium hover:underline">Add</button>
                  <button onClick={() => setShowFolderInput(false)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setShowFolderInput(true)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-primary/30 transition-all">
                  <FolderPlus className="h-3.5 w-3.5" /> New Folder
                </button>
              )}
            </div>

            {/* Bookmarks List */}
            <div className="space-y-3">
              {filteredBookmarks.map((bm) => {
                const event = allEvents.find((e) => e.id === bm.event_id);
                return (
                  <div key={bm.id} className="card-premium p-5">
                    <div className="flex items-start justify-between gap-4">
                      <Link to={`/event/${bm.event_id}`} className="flex-1">
                        {event ? (
                          <>
                            <span className="text-xs font-medium text-primary">{event.yearLabel}</span>
                            <h3 className="font-display text-lg font-semibold text-foreground mt-0.5">{event.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                              {categoryLabels[event.category]}
                            </span>
                          </>
                        ) : (
                          <>
                            <h3 className="font-display text-lg font-semibold text-foreground">{bm.event_id}</h3>
                            <p className="text-xs text-muted-foreground">Era: {bm.era_id}</p>
                          </>
                        )}
                        {bm.note && <p className="text-xs text-primary mt-2 italic">Note: {bm.note}</p>}
                      </Link>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {folders.length > 0 && (
                          <select value={bm.folder_id || ""} onChange={e => moveToFolder(bm.id, e.target.value || null)}
                            className="text-xs bg-secondary/80 border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                            <option value="">No folder</option>
                            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        )}
                        <button onClick={() => removeBookmark(bm.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredBookmarks.length === 0 && (
                <div className="text-center py-12">
                  <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{activeFolder ? "No bookmarks in this folder" : "No bookmarks yet. Bookmark events from event pages!"}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BookmarksPage;
