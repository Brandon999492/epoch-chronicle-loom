import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AiMode = "standard" | "timeline" | "deep" | "quick" | "debate" | "map";

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  isBookmarked?: boolean;
  tags?: string[];
  createdAt?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-ai-knowledge`;
const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-ai-image`;

export function useHistoryAi(userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mode, setMode] = useState<AiMode>("standard");
  const abortRef = useRef<AbortController | null>(null);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const loadConversation = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        isBookmarked: m.is_bookmarked ?? false,
        tags: (m as any).tags ?? [],
        createdAt: m.created_at,
      })));
      setConversationId(convId);
    }
  }, []);

  const saveMessage = useCallback(async (convId: string, role: "user" | "assistant", content: string) => {
    if (!userId) return;
    const { data } = await supabase
      .from("ai_messages")
      .insert({ conversation_id: convId, user_id: userId, role, content, mode })
      .select("id")
      .single();
    return data?.id;
  }, [userId, mode]);

  const sendMessage = useCallback(async (input: string) => {
    if (!userId || !input.trim()) return;
    setIsLoading(true);

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);

    let convId = conversationId;
    if (!convId) {
      const title = input.trim().slice(0, 80) || "New Conversation";
      const { data } = await supabase
        .from("ai_conversations")
        .insert({ user_id: userId, title, mode })
        .select("id")
        .single();
      if (data) {
        convId = data.id;
        setConversationId(data.id);
      }
    }

    if (convId) await saveMessage(convId, "user", input.trim());

    const allMsgs = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("You must be signed in to use the AI.");
        setIsLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: allMsgs, mode }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${resp.status})`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      const upsertAssistant = (nextChunk: string) => {
        assistantSoFar += nextChunk;
        const current = assistantSoFar;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: current } : m));
          }
          return [...prev, { role: "assistant", content: current }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      if (convId && assistantSoFar) {
        const msgId = await saveMessage(convId, "assistant", assistantSoFar);
        if (msgId) {
          setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, id: msgId } : m));
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error("AI error:", e);
      toast.error(e.message || "Failed to get AI response");
      setMessages(prev => prev.filter(m => !(m.role === "assistant" && m.content === "")));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [userId, messages, conversationId, mode, saveMessage]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const generateImage = useCallback(async (prompt: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("You must be signed in to generate images.");
        return null;
      }

      const resp = await fetch(IMAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Image generation failed");
      }
      const data = await resp.json();
      return data.imageUrl || null;
    } catch (e: any) {
      toast.error(e.message || "Image generation failed");
      return null;
    }
  }, []);

  const toggleBookmark = useCallback(async (messageId: string, current: boolean) => {
    await supabase.from("ai_messages").update({ is_bookmarked: !current }).eq("id", messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isBookmarked: !current } : m));
    toast.success(!current ? "Bookmarked" : "Bookmark removed");
  }, []);

  const saveToJournal = useCallback(async (content: string, messageId?: string) => {
    if (!userId) return;
    const title = `AI Response — ${new Date().toLocaleDateString()}`;
    const wordCount = content.split(/\s+/).length;
    const { error } = await supabase.from("journals").insert({
      user_id: userId,
      title,
      content,
      category: "ai-response",
      linked_event_id: messageId || null,
      word_count: wordCount,
    });
    if (error) {
      toast.error("Failed to save to journal");
    } else {
      toast.success("Saved to journal");
    }
  }, [userId]);

  const saveImageToJournal = useCallback(async (imageUrl: string, prompt: string) => {
    if (!userId) return;
    const content = `![AI Historical Reconstruction](${imageUrl})\n\n**Prompt:** ${prompt}\n\n*AI Historical Reconstruction*`;
    const { error } = await supabase.from("journals").insert({
      user_id: userId,
      title: `AI Image — ${prompt.slice(0, 50)}`,
      content,
      category: "ai-response",
    });
    if (error) {
      toast.error("Failed to save image to journal");
    } else {
      toast.success("Image saved to journal");
    }
  }, [userId]);

  const exportConversation = useCallback(() => {
    if (messages.length === 0) {
      toast.error("No messages to export");
      return;
    }
    const lines = messages.map(m => {
      const label = m.role === "user" ? "You" : "History Intelligence AI";
      return `## ${label}\n\n${m.content}\n`;
    });
    const md = `# History Intelligence AI — Chat Export\n\nExported: ${new Date().toLocaleString()}\nMode: ${mode}\n\n---\n\n${lines.join("\n---\n\n")}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `history-ai-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported");
  }, [messages, mode]);

  const updateMessageTags = useCallback(async (messageId: string, tags: string[]) => {
    await supabase.from("ai_messages").update({ tags } as any).eq("id", messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, tags } : m));
    toast.success("Tags updated");
  }, []);

  return {
    messages, isLoading, conversationId, mode, setMode,
    sendMessage, stopGeneration, startNewConversation, loadConversation,
    generateImage, toggleBookmark, saveToJournal, saveImageToJournal,
    exportConversation, updateMessageTags,
  };
}
