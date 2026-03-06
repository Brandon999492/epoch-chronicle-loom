import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Bookmark, Trash2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { allEvents, categoryLabels } from "@/data/historicalData";
import type { Tables } from "@/integrations/supabase/types";

type BookmarkRow = Tables<"bookmarks">;

const BookmarksPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
  }, [user, authLoading, navigate]);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setBookmarks(data);
  }, [user]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const removeBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    fetchBookmarks();
    toast.success("Bookmark removed");
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
              <Bookmark className="h-7 w-7 text-primary" /> Bookmarks
            </h1>
            <p className="text-muted-foreground mb-8">Your saved historical events for quick reference</p>

            <div className="space-y-3">
              {bookmarks.map((bm) => {
                const event = allEvents.find((e) => e.id === bm.event_id);
                return (
                  <div key={bm.id} className="bg-card-gradient border border-border rounded-lg p-5 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <Link to={`/era/${bm.era_id}`} className="flex-1">
                        {event ? (
                          <>
                            <span className="text-xs font-medium text-primary">{event.yearLabel}</span>
                            <h3 className="font-display text-lg font-semibold text-foreground mt-0.5">{event.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                              {categoryLabels[event.category]}
                            </span>
                          </>
                        ) : (
                          <>
                            <h3 className="font-display text-lg font-semibold text-foreground">Bookmarked Event</h3>
                            <p className="text-xs text-muted-foreground">Era: {bm.era_id}</p>
                          </>
                        )}
                        {bm.note && <p className="text-xs text-primary mt-2 italic">Note: {bm.note}</p>}
                      </Link>
                      <button onClick={() => removeBookmark(bm.id)} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {bookmarks.length === 0 && (
                <div className="text-center py-12">
                  <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bookmarks yet. Bookmark events from era pages!</p>
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
