import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  Quote, Check, RotateCcw, Loader2, X,
  ChevronDown, ChevronUp, AlignLeft, Sparkles, BookOpen, Maximize2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface SmartEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
  settings?: StudioSettings;
}

export interface StudioSettings {
  fontSize: "small" | "medium" | "large";
  readingWidth: "narrow" | "medium" | "wide";
  editorMode: "simple" | "advanced";
  animations: boolean;
}

const fontSizeMap = { small: "15px", medium: "17px", large: "20px" };
const widthMap = { narrow: "600px", medium: "720px", wide: "900px" };

export function SmartEditor({ content, onChange, settings }: SmartEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showAdvanced, setShowAdvanced] = useState(settings?.editorMode === "advanced");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ original: string; result: string; action: string; wasSelection: boolean } | null>(null);
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number } | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const fs = fontSizeMap[settings?.fontSize || "medium"];
  const mw = widthMap[settings?.readingWidth || "medium"];

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    syncContent();
  }, []);

  const syncContent = useCallback(() => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML, editorRef.current.innerText);
  }, [onChange]);

  // Inline selection popup
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) { setSelectionMenu(null); return; }
      if (!editorRef.current?.contains(sel.anchorNode)) { setSelectionMenu(null); return; }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current!.getBoundingClientRect();
      let x = rect.left + rect.width / 2 - editorRect.left;
      let y = rect.top - editorRect.top - 8;
      // Keep popup in viewport
      x = Math.max(100, Math.min(x, editorRect.width - 100));
      setSelectionMenu({ x, y });
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const inlineActions = [
    { action: "grammar", label: "Fix", icon: Check },
    { action: "simplify", label: "Simplify", icon: AlignLeft },
    { action: "expand", label: "Expand", icon: Maximize2 },
  ];

  const aiAction = async (action: string) => {
    const sel = window.getSelection();
    const selectedText = sel?.toString() || "";
    const text = selectedText || editorRef.current?.innerText || "";
    const wasSelection = !!selectedText.trim();

    if (!text.trim()) { toast.error("Select text or write something first"); return; }

    if (wasSelection && sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    } else {
      savedRangeRef.current = null;
    }

    setAiLoading(true);
    setSelectionMenu(null);
    try {
      const { data, error } = await supabase.functions.invoke("knowledge-ai", { body: { action, text: wasSelection ? selectedText : text } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setAiLoading(false); return; }
      setAiPreview({ original: wasSelection ? selectedText : text.slice(0, 300), result: data.result, action, wasSelection });
    } catch (e: any) {
      toast.error(e.message || "AI failed");
    } finally {
      setAiLoading(false);
    }
  };

  const acceptAiResult = () => {
    if (!aiPreview || !editorRef.current) return;
    if (aiPreview.wasSelection && savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
        document.execCommand("insertText", false, aiPreview.result);
      }
    } else {
      editorRef.current.innerHTML = aiPreview.result.replace(/\n/g, "<br/>");
    }
    syncContent();
    setAiPreview(null);
    savedRangeRef.current = null;
    toast.success("Changes applied!");
  };

  const rejectAiResult = () => {
    setAiPreview(null);
    savedRangeRef.current = null;
  };

  const ToolBtn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button onClick={onClick} title={title}
      className={`p-2 min-w-[44px] min-h-[44px] sm:p-1.5 sm:min-w-0 sm:min-h-0 rounded-md transition-colors flex items-center justify-center
        ${active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      {children}
    </button>
  );

  const editorClasses = `mx-auto px-5 sm:px-8 py-8 sm:py-10 outline-none min-h-[400px]
    leading-[2.1] text-foreground
    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-foreground [&_h1]:font-display
    [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-foreground [&_h2]:font-display
    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-primary
    [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-5
    [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-6
    [&_iframe]:rounded-xl [&_iframe]:my-6
    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-1
    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-1
    [&_li]:mb-1.5 [&_li]:leading-relaxed [&_p]:mb-4
    [&_a]:text-primary [&_a]:underline
    [&_hr]:border-border/30 [&_hr]:my-8
    [&_.section-label]:text-xs [&_.section-label]:uppercase [&_.section-label]:tracking-widest [&_.section-label]:text-primary/50 [&_.section-label]:font-semibold [&_.section-label]:mt-8 [&_.section-label]:mb-2`;

  return (
    <div className="flex flex-col h-full relative">
      {/* AI Preview Panel */}
      <AnimatePresence>
        {aiPreview && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border-b border-border/40 bg-secondary/20 p-4 sm:p-5">
            <div className="max-w-[720px] mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> AI Preview
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={rejectAiResult} className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors min-h-[44px] sm:min-h-0 sm:py-1.5">
                    <X className="h-3 w-3" /> Reject
                  </button>
                  <button onClick={acceptAiResult} className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors min-h-[44px] sm:min-h-0 sm:py-1.5">
                    <Check className="h-3 w-3" /> Accept
                  </button>
                </div>
              </div>
              <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground/60 font-medium mb-1">Before</p>
                  <div className="text-sm leading-relaxed text-muted-foreground bg-card rounded-lg p-3 border border-border/30 max-h-40 overflow-y-auto">
                    {aiPreview.original.slice(0, 300)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-primary/60 font-medium mb-1">After</p>
                  <div className="text-sm leading-relaxed text-foreground bg-card rounded-lg p-3 border border-primary/20 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {aiPreview.result}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formatting toolbar toggle */}
      <div className="flex items-center px-3 sm:px-5 py-1.5 border-b border-border/30">
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors rounded-md min-h-[36px]">
          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showAdvanced ? "Hide formatting" : "Formatting"}
        </button>
        <div className="flex-1" />
        <p className="text-[10px] text-muted-foreground/30">Start writing or use AI to generate a note from a topic or video.</p>
      </div>

      {/* Advanced Toolbar */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/30">
            <div className="flex items-center gap-0.5 flex-wrap px-3 sm:px-5 py-2">
              <ToolBtn onClick={() => exec("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("underline")} title="Underline"><Underline className="h-3.5 w-3.5" /></ToolBtn>
              <div className="w-px h-5 bg-border/30 mx-1" />
              <ToolBtn onClick={() => exec("formatBlock", "h1")} title="Heading 1"><Heading1 className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("formatBlock", "h2")} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></ToolBtn>
              <div className="w-px h-5 bg-border/30 mx-1" />
              <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet List"><List className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered List"><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => exec("formatBlock", "blockquote")} title="Quote"><Quote className="h-3.5 w-3.5" /></ToolBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          dangerouslySetInnerHTML={{ __html: content }}
          style={{ maxWidth: mw, fontSize: fs }}
          className={editorClasses}
          data-placeholder="Start writing your notes..."
        />

        {/* Inline selection AI popup */}
        <AnimatePresence>
          {selectionMenu && !aiLoading && !aiPreview && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute z-50 bg-card border border-border/50 rounded-xl shadow-lg px-1 py-1"
              style={{ left: selectionMenu.x, top: selectionMenu.y, transform: "translate(-50%, -100%)" }}
            >
              <div className="flex items-center gap-0.5">
                {inlineActions.map(({ action, label, icon: Icon }) => (
                  <button key={action} onClick={() => aiAction(action)}
                    className="flex items-center gap-1 px-2.5 py-2 sm:py-1.5 text-[11px] rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors whitespace-nowrap min-h-[44px] sm:min-h-0">
                    <Icon className="h-3 w-3" /> {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {aiLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="flex items-center gap-3 bg-card border border-border/40 rounded-xl px-5 py-3 shadow-lg">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-sm text-foreground">AI is thinking…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
