import { useState, useRef, useCallback } from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  Quote, Highlighter, Type, Palette, Image, Youtube, Sparkles,
  Check, Wand2, BookOpen, Maximize2, RotateCcw, Loader2, X,
  ChevronDown, ChevronUp, Link2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface SmartEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
  onSourceAdd?: (url: string) => void;
}

const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px"];
const textColors = ["#e2e8f0", "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#f472b6"];
const highlightColors = ["transparent", "#fef08a40", "#bbf7d040", "#bfdbfe40", "#fecaca40", "#e9d5ff40"];

export function SmartEditor({ content, onChange, onSourceAdd }: SmartEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ original: string; result: string; action: string } | null>(null);
  const [showSourceInput, setShowSourceInput] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceLoading, setSourceLoading] = useState(false);

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    syncContent();
  }, []);

  const syncContent = useCallback(() => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML, editorRef.current.innerText);
  }, [onChange]);

  const closeAllDropdowns = () => {
    setShowFontSize(false);
    setShowTextColor(false);
    setShowHighlight(false);
  };

  // AI actions with preview
  const aiAction = async (action: string) => {
    const sel = window.getSelection();
    const text = sel?.toString() || editorRef.current?.innerText || "";
    if (!text.trim()) { toast.error("Select text or write something first"); return; }
    setAiLoading(true);
    setShowAi(false);
    try {
      const { data, error } = await supabase.functions.invoke("knowledge-ai", { body: { action, text } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setAiLoading(false); return; }
      setAiPreview({ original: text, result: data.result, action });
    } catch (e: any) {
      toast.error(e.message || "AI failed");
    } finally {
      setAiLoading(false);
    }
  };

  const acceptAiResult = () => {
    if (!aiPreview || !editorRef.current) return;
    // Replace entire content with AI result
    editorRef.current.innerText = aiPreview.result;
    syncContent();
    setAiPreview(null);
    toast.success("Changes applied!");
  };

  const rejectAiResult = () => {
    setAiPreview(null);
    toast.info("Changes discarded");
  };

  // YouTube / Source handling
  const handleAddSource = async () => {
    if (!sourceUrl.trim()) return;
    const ytMatch = sourceUrl.match(/(?:youtu\.be\/|v=)([^&?]+)/);

    if (ytMatch) {
      setSourceLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("knowledge-ai", {
          body: { action: "youtube_extract", url: sourceUrl }
        });
        if (error) throw error;
        if (data?.error) { toast.error(data.error); return; }

        // Insert structured content
        const videoId = data.videoId || ytMatch[1];
        const embedHtml = `
<div style="margin:16px 0;padding:16px;border-radius:12px;border:1px solid hsl(var(--border));background:hsl(var(--secondary)/0.3)">
<div style="position:relative;padding-bottom:56.25%;height:0;margin-bottom:12px;border-radius:8px;overflow:hidden">
<iframe src="https://www.youtube.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe>
</div>
<div style="font-size:14px;line-height:1.7;color:hsl(var(--foreground))">${data.result.replace(/\n/g, '<br/>')}</div>
</div>`;

        if (editorRef.current) {
          editorRef.current.innerHTML += embedHtml;
          syncContent();
        }
        toast.success("YouTube content extracted with AI!");
      } catch (e: any) {
        toast.error(e.message || "Failed to process YouTube link");
      } finally {
        setSourceLoading(false);
        setSourceUrl("");
        setShowSourceInput(false);
      }
    } else {
      // Just add as a link reference
      if (editorRef.current) {
        editorRef.current.innerHTML += `<p><a href="${sourceUrl}" target="_blank" style="color:hsl(var(--primary));text-decoration:underline">${sourceUrl}</a></p>`;
        syncContent();
      }
      setSourceUrl("");
      setShowSourceInput(false);
      toast.success("Source added");
    }
    onSourceAdd?.(sourceUrl);
  };

  const ToolBtn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md transition-colors ${active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* AI Preview Overlay */}
      <AnimatePresence>
        {aiPreview && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-b border-border bg-secondary/50 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI {aiPreview.action} — Preview
              </span>
              <div className="flex items-center gap-2">
                <button onClick={rejectAiResult} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3 w-3" /> Discard
                </button>
                <button onClick={acceptAiResult} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors">
                  <Check className="h-3 w-3" /> Accept
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto text-sm leading-relaxed text-foreground bg-card rounded-lg p-3 border border-border">
              {aiPreview.result}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simple Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card/50 sticky top-0 z-10">
        {/* Core actions always visible */}
        <div className="relative">
          <button
            onClick={() => setShowSourceInput(!showSourceInput)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Link2 className="h-3.5 w-3.5" /> Add Source
          </button>
          <AnimatePresence>
            {showSourceInput && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl p-3 z-30 w-80"
              >
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-2">Paste YouTube link or URL</p>
                <div className="flex gap-2">
                  <input
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 text-xs rounded-lg bg-secondary border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleAddSource()}
                  />
                  <button
                    onClick={handleAddSource}
                    disabled={sourceLoading || !sourceUrl.trim()}
                    className="px-3 py-2 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {sourceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
                  </button>
                </div>
                {sourceUrl.match(/youtu/) && (
                  <p className="text-[10px] text-primary mt-1.5 flex items-center gap-1">
                    <Youtube className="h-3 w-3" /> YouTube detected — AI will extract key points
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Assist */}
        <div className="relative">
          <button
            onClick={() => { setShowAi(!showAi); closeAllDropdowns(); }}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI Assist
          </button>
          <AnimatePresence>
            {showAi && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl p-1.5 z-30 w-52"
              >
                <p className="px-2 py-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AI Writing Assistant</p>
                {[
                  { action: "improve", label: "Improve Writing", icon: Wand2, desc: "Enhance clarity & flow" },
                  { action: "grammar", label: "Fix Grammar", icon: Check, desc: "Correct errors" },
                  { action: "summarize", label: "Summarize", icon: BookOpen, desc: "Create a summary" },
                  { action: "expand", label: "Expand Ideas", icon: Maximize2, desc: "Add more detail" },
                  { action: "rewrite", label: "Rewrite", icon: RotateCcw, desc: "Fresh perspective" },
                ].map(({ action, label, icon: Icon, desc }) => (
                  <button key={action} onClick={() => aiAction(action)} disabled={aiLoading}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left hover:bg-secondary rounded-lg transition-colors disabled:opacity-50 group">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />

        {/* Advanced Editor toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors rounded-md"
        >
          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showAdvanced ? "Simple" : "Advanced"}
        </button>
      </div>

      {/* Advanced Formatting Toolbar */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-card/30"
          >
            <div className="flex items-center gap-0.5 flex-wrap px-4 py-2">
              <ToolBtn onClick={() => exec("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("underline")} title="Underline"><Underline className="h-3.5 w-3.5" /></ToolBtn>
              <div className="w-px h-5 bg-border mx-1" />
              <ToolBtn onClick={() => exec("formatBlock", "h1")} title="Heading 1"><Heading1 className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("formatBlock", "h2")} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></ToolBtn>
              <div className="w-px h-5 bg-border mx-1" />
              <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet List"><List className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered List"><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("formatBlock", "blockquote")} title="Quote"><Quote className="h-3.5 w-3.5" /></ToolBtn>
              <div className="w-px h-5 bg-border mx-1" />

              {/* Font Size */}
              <div className="relative">
                <ToolBtn onClick={() => { setShowFontSize(!showFontSize); setShowTextColor(false); setShowHighlight(false); }} title="Font Size"><Type className="h-3.5 w-3.5" /></ToolBtn>
                {showFontSize && (
                  <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-1 z-20">
                    {fontSizes.map((s) => (
                      <button key={s} onClick={() => { exec("fontSize", "7"); const els = editorRef.current?.querySelectorAll('font[size="7"]'); els?.forEach(el => { (el as HTMLElement).removeAttribute("size"); (el as HTMLElement).style.fontSize = s; }); setShowFontSize(false); }}
                        className="block w-full text-left px-3 py-1 text-xs hover:bg-secondary rounded" style={{ fontSize: s }}>{s}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Color */}
              <div className="relative">
                <ToolBtn onClick={() => { setShowTextColor(!showTextColor); setShowFontSize(false); setShowHighlight(false); }} title="Text Color"><Palette className="h-3.5 w-3.5" /></ToolBtn>
                {showTextColor && (
                  <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-2 z-20 flex gap-1">
                    {textColors.map((c) => (
                      <button key={c} onClick={() => { exec("foreColor", c); setShowTextColor(false); }}
                        className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Highlight */}
              <div className="relative">
                <ToolBtn onClick={() => { setShowHighlight(!showHighlight); setShowFontSize(false); setShowTextColor(false); }} title="Highlight"><Highlighter className="h-3.5 w-3.5" /></ToolBtn>
                {showHighlight && (
                  <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-2 z-20 flex gap-1">
                    {highlightColors.map((c) => (
                      <button key={c} onClick={() => { exec("hiliteColor", c); setShowHighlight(false); }}
                        className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: c || "transparent" }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-5 bg-border mx-1" />
              <ToolBtn onClick={() => { const url = prompt("Image URL:"); if (url) exec("insertHTML", `<img src="${url}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`); }} title="Insert Image"><Image className="h-3.5 w-3.5" /></ToolBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncContent}
        onBlur={syncContent}
        dangerouslySetInnerHTML={{ __html: content }}
        className="flex-1 overflow-y-auto px-6 py-8 outline-none text-base leading-[1.8] min-h-[300px] [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4 [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:mb-1 [&_p]:mb-3 [&_a]:text-primary [&_a]:underline"
        data-placeholder="Start writing your notes..."
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {(aiLoading || sourceLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/50 flex items-center justify-center z-40 pointer-events-none"
          >
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-foreground">{sourceLoading ? "Extracting content with AI..." : "AI is thinking..."}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
