import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, CheckCircle2, StickyNote, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface EventActionsProps {
  eventId: string;
  eventTitle?: string;
  category?: string;
  eraId?: string;
}

export function EventActions({ eventId, eventTitle, category, eraId }: EventActionsProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLearned, setIsLearned] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<{ id: string; content: string }[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchState = useCallback(async () => {
    if (!user) return;
    const [bm, le, nt] = await Promise.all([
      supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("event_id", eventId).maybeSingle(),
      supabase.from("learned_events").select("id").eq("user_id", user.id).eq("event_id", eventId).maybeSingle(),
      supabase.from("event_notes").select("id, content").eq("user_id", user.id).eq("event_id", eventId).order("created_at", { ascending: false }),
    ]);
    setIsBookmarked(!!bm.data);
    setIsLearned(!!le.data);
    if (nt.data) setNotes(nt.data);
  }, [user, eventId]);

  useEffect(() => { fetchState(); }, [fetchState]);

  // Track recently viewed
  useEffect(() => {
    if (!user || !eventId) return;
    supabase.from("recently_viewed").upsert(
      { user_id: user.id, event_id: eventId, event_title: eventTitle || eventId, category: category || null, viewed_at: new Date().toISOString() },
      { onConflict: "user_id,event_id" }
    ).then();
  }, [user, eventId, eventTitle, category]);

  if (!user) return null;

  const toggleBookmark = async () => {
    if (isBookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("event_id", eventId);
      setIsBookmarked(false);
      toast.success("Bookmark removed");
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, event_id: eventId, era_id: eraId || "unknown" });
      setIsBookmarked(true);
      toast.success("Event bookmarked!");
    }
  };

  const toggleLearned = async () => {
    if (isLearned) {
      await supabase.from("learned_events").delete().eq("user_id", user.id).eq("event_id", eventId);
      setIsLearned(false);
      toast.success("Unmarked as learned");
    } else {
      await supabase.from("learned_events").insert({ user_id: user.id, event_id: eventId, event_title: eventTitle || eventId, category: category || null });
      setIsLearned(true);
      toast.success("Marked as learned! 🎓");
    }
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    const { data } = await supabase.from("event_notes").insert({ user_id: user.id, event_id: eventId, content: newNote.trim() }).select("id, content").single();
    setSaving(false);
    if (data) {
      setNotes([data, ...notes]);
      setNewNote("");
      toast.success("Note saved!");
    }
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from("event_notes").delete().eq("id", noteId);
    setNotes(notes.filter(n => n.id !== noteId));
    toast.success("Note deleted");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="mt-8 border-t border-border pt-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button onClick={toggleBookmark}
          className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border transition-all ${
            isBookmarked ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
          }`}>
          <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
          {isBookmarked ? "Bookmarked" : "Bookmark"}
        </button>

        <button onClick={toggleLearned}
          className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border transition-all ${
            isLearned ? "bg-green-500/10 border-green-500/30 text-green-600" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-green-500/20"
          }`}>
          <CheckCircle2 className={`h-4 w-4 ${isLearned ? "fill-green-500 text-white" : ""}`} />
          {isLearned ? "Learned ✓" : "Mark as Learned"}
        </button>

        <button onClick={() => setShowNotes(!showNotes)}
          className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border transition-all ${
            showNotes ? "bg-accent/50 border-accent text-foreground" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-accent/30"
          }`}>
          <StickyNote className="h-4 w-4" />
          Notes {notes.length > 0 && `(${notes.length})`}
        </button>
      </div>

      {/* Notes Section */}
      <AnimatePresence>
        {showNotes && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="card-premium p-5 space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write your notes about this event..."
                  className="bg-secondary/50 border-border min-h-[80px] text-sm"
                />
                <button onClick={saveNote} disabled={saving || !newNote.trim()}
                  className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Note
                </button>
              </div>

              {notes.length > 0 && (
                <div className="space-y-3 border-t border-border pt-4">
                  {notes.map((note) => (
                    <div key={note.id} className="flex items-start gap-3 bg-secondary/30 rounded-lg p-3">
                      <StickyNote className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground flex-1 whitespace-pre-wrap">{note.content}</p>
                      <button onClick={() => deleteNote(note.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
