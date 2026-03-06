import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark, Search, X, Tag, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface BookmarkedMessage {
  id: string;
  content: string;
  created_at: string;
  conversation_id: string;
  tags: string[];
}

interface AiBookmarksPanelProps {
  userId: string;
  open: boolean;
  onClose: () => void;
  onLoadConversation: (convId: string) => void;
}

export function AiBookmarksPanel({ userId, open, onClose, onLoadConversation }: AiBookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkedMessage[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const fetchBookmarks = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("ai_messages")
      .select("id, content, created_at, conversation_id")
      .eq("user_id", userId)
      .eq("is_bookmarked", true)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) {
      setBookmarks(data.map(d => ({ ...d, tags: (d as any).tags ?? [] })));
    }
  }, [userId]);

  useEffect(() => {
    if (open) fetchBookmarks();
  }, [open, fetchBookmarks]);

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags || [])));

  const filtered = bookmarks.filter(b => {
    const matchSearch = !search || b.content.toLowerCase().includes(search.toLowerCase());
    const matchTag = !tagFilter || (b.tags || []).includes(tagFilter);
    return matchSearch && matchTag;
  });

  const handleAddTag = async (msgId: string) => {
    if (!tagInput.trim()) return;
    const bk = bookmarks.find(b => b.id === msgId);
    const newTags = [...new Set([...(bk?.tags || []), tagInput.trim()])];
    await supabase.from("ai_messages").update({ tags: newTags } as any).eq("id", msgId);
    setBookmarks(prev => prev.map(b => b.id === msgId ? { ...b, tags: newTags } : b));
    setTagInput("");
  };

  const handleRemoveTag = async (msgId: string, tag: string) => {
    const bk = bookmarks.find(b => b.id === msgId);
    const newTags = (bk?.tags || []).filter(t => t !== tag);
    await supabase.from("ai_messages").update({ tags: newTags } as any).eq("id", msgId);
    setBookmarks(prev => prev.map(b => b.id === msgId ? { ...b, tags: newTags } : b));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="w-80 border-l border-border bg-card flex flex-col shrink-0 z-30 absolute right-0 lg:relative h-[calc(100vh-4rem)]"
        >
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" /> Bookmarked Answers
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search bookmarks..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={tagFilter === null ? "default" : "outline"}
                  className="cursor-pointer text-[10px]"
                  onClick={() => setTagFilter(null)}
                >
                  All
                </Badge>
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={tagFilter === tag ? "default" : "outline"}
                    className="cursor-pointer text-[10px]"
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filtered.map(bk => (
                <div key={bk.id} className="border border-border rounded-lg p-2.5 bg-background/50 space-y-1.5">
                  <p className="text-xs text-muted-foreground line-clamp-4">{bk.content.slice(0, 300)}</p>
                  <div className="flex flex-wrap gap-1">
                    {(bk.tags || []).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] gap-0.5">
                        {tag}
                        <button onClick={() => handleRemoveTag(bk.id, tag)} className="ml-0.5 hover:text-destructive">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {editingTags === bk.id ? (
                      <form onSubmit={e => { e.preventDefault(); handleAddTag(bk.id); }} className="flex gap-1 flex-1">
                        <Input
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          placeholder="Add tag..."
                          className="h-6 text-[10px] flex-1"
                        />
                        <Button type="submit" size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]">Add</Button>
                        <Button type="button" size="sm" variant="ghost" className="h-6 px-1" onClick={() => { setEditingTags(null); setTagInput(""); }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </form>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1" onClick={() => setEditingTags(bk.id)}>
                          <Tag className="h-3 w-3" /> Tag
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1"
                          onClick={() => { onLoadConversation(bk.conversation_id); onClose(); }}
                        >
                          <MessageSquare className="h-3 w-3" /> View
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{new Date(bk.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No bookmarked answers yet</p>
              )}
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
