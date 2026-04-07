import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  Quote, Highlighter, Type, Palette, Image, Sparkles,
  Check, Wand2, BookOpen, Maximize2, RotateCcw, Loader2, X,
  ChevronDown, ChevronUp, AlignLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface SmartEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
}

const fontSizes = ["14px", "16px", "18px", "20px", "24px"];
const textColors = ["#e2e8f0", "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb923c"];
const highlightColors = ["transparent", "#fef08a40", "#bbf7d040", "#bfdbfe40", "#fecaca40", "#e9d5ff40"];

export function SmartEditor({ content, onChange }: SmartEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ original: string; result: string; action: string } | null>(null);

  // Floating AI menu on text selection
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number } | null>(null);

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    syncContent();
  }, []);

  const syncContent = useCallback(() => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML, editorRef.current.innerText);
  }, [onChange]);

  // Detect text selection for inline AI menu
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelectionMenu(null);
        return;
      }
      // Check selection is inside our editor
      if (!editorRef.current?.contains(sel.anchorNode)) {
        setSelectionMenu(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current!.getBoundingClientRect();
      setSelectionMenu({
        x: rect.left + rect.width / 2 - editorRect.left,
        y: rect.top - editorRect.top - 8,
      });
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const aiAction = async (action: string) => {
    const sel = window.getSelection();
    const text = sel?.toString() || editorRef.current?.innerText || "";
    if (!text.trim()) { toast.error("Select text or write something first"); return; }
    setAiLoading(true);
    setSelectionMenu(null);
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
    editorRef.current.innerText = aiPreview.result;
    syncContent();
    setAiPreview(null);
    toast.success("Changes applied!");
  };

  const rejectAiResult = () => {
    setAiPreview(null);
    toast.info("Changes discarded");
  };

  const ToolBtn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md transition-colors ${active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      {children}
    </button>
  );

  const aiActions = [
    { action: "grammar", label: "Fix Grammar", icon: Check },
    { action: "simplify", label: "Simplify", icon: AlignLeft },
    { action: "expand", label: "Expand", icon: Maximize2 },
    { action: "rewrite", label: "Rewrite", icon: RotateCcw },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* AI Preview Panel */}
      <AnimatePresence>
        {aiPreview && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-b border-border bg-secondary/30 p-5"
          >
            <div className="max-w-[720px] mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI {aiPreview.action} — Preview
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={rejectAiResult} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3 w-3" /> Reject
                  </button>
                  <button onClick={acceptAiResult} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors">
                    <Check className="h-3 w-3" /> Accept
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1.5">Before</p>
                  <div className="text-sm leading-relaxed text-muted-foreground bg-card rounded-lg p-3 border border-border max-h-40 overflow-y-auto">
                    {aiPreview.original.slice(0, 500)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-primary font-medium mb-1.5">After</p>
                  <div className="text-sm leading-relaxed text-foreground bg-card rounded-lg p-3 border border-primary/30 max-h-40 overflow-y-auto">
                    {aiPreview.result.slice(0, 500)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal Top Bar */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-border/50 bg-card/30">
        {/* Floating AI Assist pill */}
        <div className="relative group">
          <button
            disabled={aiLoading}
            onClick={() => aiAction("improve")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            title="AI Assist – improves your writing"
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI Assist
          </button>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Improves your writing
          </span>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded-md"
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
            className="overflow-hidden border-b border-border/50 bg-card/20"
          >
            <div className="flex items-center gap-0.5 flex-wrap px-5 py-2">
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
              <ToolBtn onClick={() => { const u = prompt("Image URL:"); if (u) exec("insertHTML", `<img src="${u}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`); }} title="Insert Image"><Image className="h-3.5 w-3.5" /></ToolBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Area — Apple Notes Style */}
      <div className="flex-1 overflow-y-auto relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          dangerouslySetInnerHTML={{ __html: content }}
          className="max-w-[720px] mx-auto px-6 py-8 outline-none min-h-[400px]
            text-[17px] leading-[2.0]
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-foreground
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-foreground
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-primary
            [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-5
            [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-5
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-1
            [&_li]:mb-1.5 [&_li]:leading-relaxed
            [&_p]:mb-4
            [&_a]:text-primary [&_a]:underline
            [&_hr]:border-border/50 [&_hr]:my-8
            [&_.section-label]:text-xs [&_.section-label]:uppercase [&_.section-label]:tracking-widest [&_.section-label]:text-primary/60 [&_.section-label]:font-semibold [&_.section-label]:mt-8 [&_.section-label]:mb-2
            empty:[&_div]:before:content-[attr(data-placeholder)] empty:[&_div]:before:text-muted-foreground/40"
          data-placeholder="Start writing your notes..."
        />

        {/* Floating Inline AI Menu on text selection */}
        <AnimatePresence>
          {selectionMenu && !aiLoading && !aiPreview && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute z-50 flex items-center gap-0.5 bg-card border border-border rounded-xl shadow-xl px-1.5 py-1"
              style={{ left: selectionMenu.x, top: selectionMenu.y, transform: "translate(-50%, -100%)" }}
            >
              {aiActions.map(({ action, label, icon: Icon }) => (
                <button
                  key={action}
                  onClick={() => aiAction(action)}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                  title={label}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {aiLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center z-40"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-3 shadow-lg"
            >
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-sm text-foreground">AI is thinking…</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
