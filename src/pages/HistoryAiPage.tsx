import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { useHistoryAi, type AiMode, type ChatMessage } from "@/hooks/useHistoryAi";
import { AiBookmarksPanel } from "@/components/ai/AiBookmarksPanel";
import { AiSettingsPanel, useAiSettings } from "@/components/ai/AiSettingsPanel";
import { AiImagePanel } from "@/components/ai/AiImagePanel";
import { AiMapEventBrowser } from "@/components/ai/AiMapEventBrowser";
import { AiSaveToArchive } from "@/components/ai/AiSaveToArchive";
import { eras, allEvents } from "@/data/historicalData";
import { royalHouses, allRoyals } from "@/data/royals";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Send, Square, Plus, History, Bookmark, BookmarkCheck, Trash2,
  Brain, Clock, BookOpen, Zap, Swords, Image as ImageIcon, Download,
  ChevronLeft, MessageSquare, Sparkles, FileDown, MapPin,
  BookMarked, PenLine, Heart, HeartOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const MODE_OPTIONS: { value: AiMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "standard", label: "Standard", icon: <Brain className="h-4 w-4" />, desc: "Balanced historical answers" },
  { value: "timeline", label: "Timeline", icon: <Clock className="h-4 w-4" />, desc: "Chronological arrangement" },
  { value: "deep", label: "Deep Analysis", icon: <BookOpen className="h-4 w-4" />, desc: "Academic-style detail" },
  { value: "quick", label: "Quick Summary", icon: <Zap className="h-4 w-4" />, desc: "Short bullet points" },
  { value: "debate", label: "Debate", icon: <Swords className="h-4 w-4" />, desc: "Multiple perspectives" },
  { value: "map", label: "Map", icon: <MapPin className="h-4 w-4" />, desc: "Geographic & location focus" },
];

const SUGGESTED_QUESTIONS = [
  "What caused the fall of the Roman Empire?",
  "Tell me about the Battle of Hastings in 1066",
  "Who was Cleopatra and why was she significant?",
  "Explain the causes of World War I",
  "What was the Renaissance and how did it change Europe?",
  "Describe the rise and fall of the Ottoman Empire",
];

const FONT_SIZE_MAP: Record<string, string> = { small: "text-xs", medium: "text-sm", large: "text-base" };

const THEME_STYLES: Record<string, { bg?: string; overlay?: string }> = {
  default: {},
  midnight: { bg: "bg-[#0a1628]", overlay: "bg-[#0a1628]/95" },
  sepia: { bg: "bg-[#f5f0e1]", overlay: "bg-[#f5f0e1]/95" },
  emerald: { bg: "bg-[#0d1f17]", overlay: "bg-[#0d1f17]/95" },
  crimson: { bg: "bg-[#1a0a0a]", overlay: "bg-[#1a0a0a]/95" },
  purple: { bg: "bg-[#120a1e]", overlay: "bg-[#120a1e]/95" },
  amber: { bg: "bg-[#1a1408]", overlay: "bg-[#1a1408]/95" },
};

/** Resolve AI-generated internal links to actual archive routes. */
function resolveAiLink(href: string, label: string): string {
  const lower = (s: string) => s.toLowerCase().replace(/[-_]/g, " ");
  const labelLower = lower(label);

  const eraMatch = eras.find(e => href.includes(e.id));
  if (eraMatch) return `/era/${eraMatch.id}`;

  const eventMatch = allEvents.find(e => href.includes(e.id));
  if (eventMatch) return `/event/${eventMatch.id}`;

  const houseMatch = royalHouses.find(h => href.includes(h.id));
  if (houseMatch) return `/royals/${houseMatch.id}`;

  const royalMatch = allRoyals.find(r => href.includes(r.id));
  if (royalMatch) {
    const house = royalHouses.find(h => h.members.some(m => m.id === royalMatch.id));
    if (house) return `/royals/${house.id}/${royalMatch.id}`;
  }

  const eraByName = eras.find(e => lower(e.name).includes(labelLower) || labelLower.includes(lower(e.name)));
  if (eraByName) return `/era/${eraByName.id}`;

  const eventByName = allEvents.find(e => lower(e.title).includes(labelLower) || labelLower.includes(lower(e.title)));
  if (eventByName) return `/event/${eventByName.id}`;

  const royalByName = allRoyals.find(r => lower(r.name).includes(labelLower) || labelLower.includes(lower(r.name)));
  if (royalByName) {
    const house = royalHouses.find(h => h.members.some(m => m.id === royalByName.id));
    if (house) return `/royals/${house.id}/${royalByName.id}`;
  }

  return `/search?q=${encodeURIComponent(label)}`;
}

interface Conversation {
  id: string;
  title: string;
  mode: string;
  created_at: string;
}

const HistoryAiPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { settings, update: updateSettings } = useAiSettings();

  const {
    messages, isLoading, conversationId, mode, setMode,
    sendMessage, stopGeneration, startNewConversation, loadConversation,
    generateImage, toggleBookmark, saveToJournal, saveImageToJournal,
    exportConversation,
  } = useHistoryAi(user?.id);

  useEffect(() => { setMode(settings.defaultMode); }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, title, mode, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
    fetchConversations();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    await supabase.from("ai_conversations").delete().eq("id", convId);
    if (conversationId === convId) startNewConversation();
    fetchConversations();
    toast.success("Conversation deleted");
  };

  const handleDownloadImage = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `history-ai-${Date.now()}.png`;
    a.click();
  };

  const handleSaveToFavorites = async (content: string) => {
    if (!user) return;
    const title = `AI Favorite — ${new Date().toLocaleDateString()}`;
    const { error } = await supabase.from("journals").insert({
      user_id: user.id,
      title,
      content,
      category: "ai-response",
      is_favorite: true,
    });
    if (error) {
      toast.error("Failed to save to favorites");
    } else {
      toast.success("Saved to favorites!");
    }
  };

  const handleMapEventSelect = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  if (authLoading) return null;

  const fontClass = FONT_SIZE_MAP[settings.fontSize] || "text-sm";
  const theme = THEME_STYLES[settings.colorTheme] || {};

  return (
    <div className={`min-h-screen flex flex-col relative ${theme.bg || "bg-background"}`}>
      {/* Custom wallpaper */}
      {settings.wallpaperUrl && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${settings.wallpaperUrl})` }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
      )}

      {/* Timeline-themed background */}
      {!settings.wallpaperUrl && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary" />
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2" style={{ top: `${5 + i * 5}%` }}>
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-display text-primary whitespace-nowrap">
                {2000 - i * 100} {i > 19 ? "BC" : "AD"}
              </span>
            </div>
          ))}
        </div>
      )}

      <Header />
      <div className="flex flex-1 pt-16 overflow-hidden relative z-10">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-72 border-r border-border bg-card flex flex-col shrink-0 z-30 absolute lg:relative h-[calc(100vh-4rem)]"
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-foreground">Chat History</h3>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="lg:hidden">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2">
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { startNewConversation(); setSidebarOpen(false); }}>
                  <Plus className="h-3.5 w-3.5" /> New Chat
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                        conversationId === conv.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                      onClick={() => { loadConversation(conv.id); setSidebarOpen(false); }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate flex-1">{conv.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
                  )}
                </div>
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="border-b border-border px-4 py-2 flex items-center gap-2 bg-card/80 backdrop-blur-sm">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} title="Chat History">
              <History className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5">
              {MODE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    mode === opt.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  title={opt.desc}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={exportConversation} title="Export chat">
                  <FileDown className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setBookmarksOpen(!bookmarksOpen)} title="Bookmarked answers">
                <BookMarked className="h-4 w-4" />
              </Button>
              <AiSettingsPanel settings={settings} onUpdate={updateSettings} />
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => { startNewConversation(); }}>
                <Plus className="h-3.5 w-3.5" /> New
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-12 pb-8">
                  <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-3xl font-display font-bold text-foreground mb-2">History Intelligence AI</h1>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Ask anything about world history. I'll provide detailed answers with sources, internal archive links, and multiple perspectives.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto mb-8">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(q); inputRef.current?.focus(); }}
                        className="text-left px-3 py-2.5 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all text-sm text-muted-foreground hover:text-foreground"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Enhanced Image Generation Panel */}
                  <div className="max-w-lg mx-auto mb-6">
                    <AiImagePanel
                      onGenerate={generateImage}
                      onDownload={handleDownloadImage}
                      onSaveToJournal={saveImageToJournal}
                    />
                  </div>

                  {/* Map Mode Event Browser */}
                  <div className="max-w-lg mx-auto">
                    <AiMapEventBrowser
                      onSelectEvent={handleMapEventSelect}
                      visible={mode === "map"}
                    />
                  </div>
                </motion.div>
              )}

              {/* Map event browser when in chat */}
              {messages.length > 0 && mode === "map" && (
                <div className="max-w-lg mx-auto mb-4">
                  <AiMapEventBrowser
                    onSelectEvent={handleMapEventSelect}
                    visible={true}
                  />
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5"
                      : "bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className={`prose prose-sm prose-invert max-w-none text-foreground [&_a]:text-primary [&_a]:underline [&_h1]:font-display [&_h2]:font-display [&_h3]:font-display ${fontClass}`}>
                        <ReactMarkdown
                          components={{
                            a: ({ href, children, ...props }) => {
                              if (href?.startsWith("/")) {
                                const resolvedHref = resolveAiLink(href, String(children ?? ""));
                                return <Link to={resolvedHref} className="text-primary underline hover:text-primary/80">{children}</Link>;
                              }
                              return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80" {...props}>{children} ↗</a>;
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.role === "assistant" && msg.id && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                        <button
                          onClick={() => toggleBookmark(msg.id!, msg.isBookmarked || false)}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title={msg.isBookmarked ? "Remove bookmark" : "Bookmark this answer"}
                        >
                          {msg.isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => saveToJournal(msg.content, msg.id)}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title="Save to journal"
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleSaveToFavorites(msg.content)}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title="Save to favorites"
                        >
                          <Heart className="h-3.5 w-3.5" />
                        </button>
                        {user && (
                          <AiSaveToArchive
                            userId={user.id}
                            content={msg.content}
                            suggestedTitle={messages.find(m => m.role === "user" && messages.indexOf(m) < i)?.content.slice(0, 60)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs font-semibold text-secondary-foreground">You</span>
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="border-t border-border px-4 py-3 bg-card/50 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any period in history..."
                className="min-h-[44px] max-h-32 resize-none bg-background border-border"
                rows={1}
              />
              {isLoading ? (
                <Button size="icon" variant="destructive" onClick={stopGeneration} className="shrink-0">
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              History Intelligence AI — Strictly historical knowledge. Answers may contain disputed or estimated information.
            </p>
          </div>
        </div>

        {/* Bookmarks panel */}
        {user && (
          <AiBookmarksPanel
            userId={user.id}
            open={bookmarksOpen}
            onClose={() => setBookmarksOpen(false)}
            onLoadConversation={(convId) => { loadConversation(convId); }}
          />
        )}
      </div>
    </div>
  );
};

export default HistoryAiPage;
