import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  Quote, Highlighter, Type, Palette, Image, Sparkles,
  Check, Wand2, BookOpen, Maximize2, RotateCcw, Loader2, X,
  ChevronDown, ChevronUp, AlignLeft, Mic, MicOff, Volume2, Square,
  MoreHorizontal, Minus, Plus, Brain, Clock, Users, HelpCircle,
  Lightbulb, FileText, Eye, EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface SmartEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
  settings?: StudioSettings;
  focusMode?: boolean;
  readingMode?: boolean;
  onQuizGenerated?: (quiz: any) => void;
  onTimelineExtracted?: (timeline: any) => void;
}

export interface StudioSettings {
  fontSize: "small" | "medium" | "large";
  readingWidth: "narrow" | "medium" | "wide";
  editorMode: "simple" | "advanced";
  animations: boolean;
}

const fontSizeMap = { small: "15px", medium: "17px", large: "20px" };
const widthMap = { narrow: "600px", medium: "720px", wide: "900px" };
const fontSizes = ["14px", "16px", "18px", "20px", "24px"];
const textColors = ["#e2e8f0", "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb923c"];
const highlightColors = ["transparent", "#fef08a40", "#bbf7d040", "#bfdbfe40", "#fecaca40", "#e9d5ff40"];

export function SmartEditor({ content, onChange, settings, focusMode, readingMode, onQuizGenerated, onTimelineExtracted }: SmartEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showAdvanced, setShowAdvanced] = useState(settings?.editorMode === "advanced");
  const [showFontSize, setShowFontSize] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ original: string; result: string; action: string; wasSelection: boolean } | null>(null);
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number } | null>(null);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const savedRangeRef = useRef<Range | null>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(1);
  const [documentaryMode, setDocumentaryMode] = useState(false);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

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

  // Selection detection
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
      if (isMobile) x = Math.max(120, Math.min(x, editorRect.width - 120));
      setSelectionMenu({ x, y });
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [isMobile]);

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
    setShowAiMenu(false);
    try {
      const { data, error } = await supabase.functions.invoke("knowledge-ai", { body: { action, text: wasSelection ? selectedText : text } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setAiLoading(false); return; }

      // Handle structured results (not preview-based)
      if (action === "extract_timeline") {
        onTimelineExtracted?.(data.result);
        toast.success("Timeline extracted!");
        setAiLoading(false);
        return;
      }
      if (action === "extract_figures") {
        const figs = data.result?.figures || [];
        const figText = figs.map((f: any) => `**${f.name}** — ${f.role}: ${f.significance}`).join("\n");
        setAiPreview({ original: text.slice(0, 200) + "…", result: figText, action: "Figures Found", wasSelection: false });
        setAiLoading(false);
        return;
      }
      if (action === "quiz") {
        onQuizGenerated?.(data.result);
        toast.success("Quiz generated!");
        setAiLoading(false);
        return;
      }
      if (action === "auto_tag") {
        toast.success(`Tags: ${(data.result?.tags || []).join(", ")}`);
        setAiLoading(false);
        return;
      }

      setAiPreview({ original: wasSelection ? selectedText : text, result: data.result, action, wasSelection });
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
    toast.info("Changes discarded");
  };

  // ─── Voice: Speech-to-Text ───
  const toggleRecording = () => {
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Speech recognition not supported in this browser"); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      }
      if (transcript && editorRef.current) {
        editorRef.current.focus();
        document.execCommand("insertText", false, transcript + " ");
        syncContent();
      }
    };
    recognition.onerror = () => { setIsRecording(false); toast.error("Speech recognition error"); };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  // ─── Voice: Text-to-Speech (with Documentary Mode + paragraph highlighting) ───
  const speakText = () => {
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); setActiveParagraphIndex(null); return; }
    const sel = window.getSelection();
    const text = sel?.toString().trim() || editorRef.current?.innerText || "";
    if (!text.trim()) { toast.error("Nothing to read"); return; }

    if (documentaryMode) {
      // Paragraph-by-paragraph with pauses and highlighting
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
      setIsSpeaking(true);
      let i = 0;
      const speakNext = () => {
        if (i >= paragraphs.length) { setIsSpeaking(false); setActiveParagraphIndex(null); return; }
        setActiveParagraphIndex(i);
        // Scroll highlighted paragraph into view
        if (editorRef.current) {
          const pElements = editorRef.current.querySelectorAll("p, li, h1, h2, h3, blockquote, div:not([style])");
          if (pElements[i]) {
            pElements[i].scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
        const utterance = new SpeechSynthesisUtterance(paragraphs[i]);
        utterance.rate = 0.75;
        utterance.pitch = 0.9;
        utterance.onend = () => {
          i++;
          setTimeout(speakNext, 1500);
        };
        utterance.onerror = () => { setIsSpeaking(false); setActiveParagraphIndex(null); };
        window.speechSynthesis.speak(utterance);
      };
      speakNext();
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechSpeed;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const ToolBtn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button onClick={onClick} title={title}
      className={`p-2 min-w-[44px] min-h-[44px] sm:p-1.5 sm:min-w-0 sm:min-h-0 rounded-md transition-colors flex items-center justify-center
        ${active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      {children}
    </button>
  );

  const aiWritingActions = [
    { action: "grammar", label: "Fix Grammar", icon: Check },
    { action: "simplify", label: "Simplify", icon: AlignLeft },
    { action: "expand", label: "Expand", icon: Maximize2 },
    { action: "summarize", label: "Summarize", icon: BookOpen },
    { action: "rewrite", label: "Rewrite", icon: RotateCcw },
  ];

  const aiLearningActions = [
    { action: "extract_timeline", label: "Extract Timeline", icon: Clock },
    { action: "extract_figures", label: "Find Figures", icon: Users },
    { action: "eli5", label: "Explain Like I'm 10", icon: Lightbulb },
    { action: "quiz", label: "Generate Quiz", icon: HelpCircle },
    { action: "auto_tag", label: "Auto-Tag", icon: FileText },
  ];

  if (focusMode) {
    return (
      <div className="flex-1 overflow-y-auto relative">
        <div
          ref={editorRef}
          contentEditable={!readingMode}
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          dangerouslySetInnerHTML={{ __html: content }}
          style={{ maxWidth: mw, fontSize: readingMode ? `calc(${fs} + 1px)` : fs }}
          className={`mx-auto px-4 sm:px-8 py-8 sm:py-12 outline-none min-h-[400px]
            leading-[2.0]
            ${readingMode ? "bg-amber-50/5" : ""}
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-foreground
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-foreground
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-primary
            [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-5
            [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-6 [&_img]:shadow-sm [&_img]:border [&_img]:border-border/30 [&_img]:mx-auto [&_img]:block
            [&_iframe]:rounded-xl [&_iframe]:my-6
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-1
            [&_li]:mb-1.5 [&_li]:leading-relaxed [&_p]:mb-5
            [&_a]:text-primary [&_a]:underline
            [&_hr]:border-border/50 [&_hr]:my-10
            [&_.section-label]:text-xs [&_.section-label]:uppercase [&_.section-label]:tracking-widest [&_.section-label]:text-primary/60 [&_.section-label]:font-semibold [&_.section-label]:mt-8 [&_.section-label]:mb-2`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* AI Preview Panel */}
      <AnimatePresence>
        {aiPreview && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border-b border-border bg-secondary/30 p-4 sm:p-5">
            <div className="max-w-[720px] mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI {aiPreview.action} — Preview
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
                  <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1.5">Before</p>
                  <div className="text-sm leading-relaxed text-muted-foreground bg-card rounded-lg p-3 border border-border max-h-40 overflow-y-auto">
                    {aiPreview.original}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-primary font-medium mb-1.5">After</p>
                  <div className="text-sm leading-relaxed text-foreground bg-card rounded-lg p-3 border border-primary/30 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {aiPreview.result}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      {!readingMode && (
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 border-b border-border/50 bg-card/30 flex-wrap">
          {/* AI Assist dropdown */}
          <div className="relative">
            <button disabled={aiLoading} onClick={() => setShowAiMenu(!showAiMenu)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0 sm:py-1.5">
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              AI Assist
            </button>
            <AnimatePresence>
              {showAiMenu && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl p-1 z-50 w-56">
                  <p className="px-2 py-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Writing</p>
                  {aiWritingActions.map(({ action, label, icon: Icon }) => (
                    <button key={action} onClick={() => aiAction(action)} disabled={aiLoading}
                      className="flex items-center gap-2 w-full px-2 py-2.5 sm:py-1.5 text-xs text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0">
                      <Icon className="h-3.5 w-3.5 text-primary" />{label}
                    </button>
                  ))}
                  <div className="border-t border-border/50 my-1" />
                  <p className="px-2 py-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Learning Tools</p>
                  {aiLearningActions.map(({ action, label, icon: Icon }) => (
                    <button key={action} onClick={() => aiAction(action)} disabled={aiLoading}
                      className="flex items-center gap-2 w-full px-2 py-2.5 sm:py-1.5 text-xs text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0">
                      <Icon className="h-3.5 w-3.5 text-amber-400" />{label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice buttons */}
          <ToolBtn onClick={toggleRecording} active={isRecording} title={isRecording ? "Stop recording" : "Voice input"}>
            {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </ToolBtn>
          {isRecording && (
            <span className="flex items-center gap-1 text-[10px] text-destructive font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-destructive" /> Recording
            </span>
          )}

          <div className="relative">
            <ToolBtn onClick={speakText} active={isSpeaking} title={isSpeaking ? "Stop reading" : "Read aloud"}>
              {isSpeaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </ToolBtn>
          </div>

          {isSpeaking && (
            <div className="flex items-center gap-1">
              <button onClick={() => setSpeechSpeed(Math.max(0.5, speechSpeed - 0.25))} className="p-1 text-muted-foreground hover:text-foreground"><Minus className="h-3 w-3" /></button>
              <span className="text-[10px] text-muted-foreground w-6 text-center">{speechSpeed}x</span>
              <button onClick={() => setSpeechSpeed(Math.min(2, speechSpeed + 0.25))} className="p-1 text-muted-foreground hover:text-foreground"><Plus className="h-3 w-3" /></button>
            </div>
          )}

          {/* Documentary mode toggle */}
          <ToolBtn onClick={() => { setDocumentaryMode(!documentaryMode); toast.info(documentaryMode ? "Normal voice mode" : "Documentary mode on"); }} active={documentaryMode} title="Documentary Mode">
            <Brain className="h-3.5 w-3.5" />
          </ToolBtn>

          <div className="flex-1" />

          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-2.5 py-2 sm:py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded-md min-h-[44px] sm:min-h-0">
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showAdvanced ? "Simple" : "Advanced"}
          </button>
        </div>
      )}

      {/* Advanced Toolbar */}
      <AnimatePresence>
        {showAdvanced && !readingMode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/50 bg-card/20">
            <div className="flex items-center gap-0.5 flex-wrap px-3 sm:px-5 py-2">
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
                  <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-1 z-50">
                    {fontSizes.map((s) => (
                      <button key={s} onClick={() => { exec("fontSize", "7"); const els = editorRef.current?.querySelectorAll('font[size="7"]'); els?.forEach(el => { (el as HTMLElement).removeAttribute("size"); (el as HTMLElement).style.fontSize = s; }); setShowFontSize(false); }}
                        className="block w-full text-left px-3 py-2 sm:py-1 text-xs hover:bg-secondary rounded min-h-[44px] sm:min-h-0" style={{ fontSize: s }}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
              {/* Text Color */}
              <div className="relative">
                <ToolBtn onClick={() => { setShowTextColor(!showTextColor); setShowFontSize(false); setShowHighlight(false); }} title="Text Color"><Palette className="h-3.5 w-3.5" /></ToolBtn>
                {showTextColor && (
                  <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-2 z-50 flex gap-1.5 flex-wrap">
                    {textColors.map((c) => (
                      <button key={c} onClick={() => { exec("foreColor", c); setShowTextColor(false); }}
                        className="w-8 h-8 sm:w-5 sm:h-5 rounded-full border border-border" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}
              </div>
              {/* Highlight */}
              <div className="relative">
                <ToolBtn onClick={() => { setShowHighlight(!showHighlight); setShowFontSize(false); setShowTextColor(false); }} title="Highlight"><Highlighter className="h-3.5 w-3.5" /></ToolBtn>
                {showHighlight && (
                  <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-2 z-50 flex gap-1.5 flex-wrap">
                    {highlightColors.map((c) => (
                      <button key={c} onClick={() => { exec("hiliteColor", c); setShowHighlight(false); }}
                        className="w-8 h-8 sm:w-5 sm:h-5 rounded-full border border-border" style={{ backgroundColor: c || "transparent" }} />
                    ))}
                  </div>
                )}
              </div>
              <div className="w-px h-5 bg-border mx-1" />
              <ToolBtn onClick={() => { const u = prompt("Image URL:"); if (u) exec("insertHTML", `<div style="text-align:center;margin:24px 0"><img src="${u}" style="max-width:100%;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15)" /></div>`); }} title="Insert Image"><Image className="h-3.5 w-3.5" /></ToolBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Paragraph highlight effect for documentary mode */}
        <ParagraphHighlighter editorRef={editorRef} activeIndex={activeParagraphIndex} />
        <div
          ref={editorRef}
          contentEditable={!readingMode}
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          dangerouslySetInnerHTML={{ __html: content }}
          style={{ maxWidth: mw, fontSize: readingMode ? `calc(${fs} + 1px)` : fs }}
          className={`mx-auto px-4 sm:px-6 py-6 sm:py-8 outline-none min-h-[400px]
            leading-[1.9]
            ${readingMode ? "bg-amber-50/5" : ""}
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-foreground
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-foreground
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-primary
            [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-5
            [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-6 [&_img]:shadow-sm [&_img]:border [&_img]:border-border/30 [&_img]:mx-auto [&_img]:block
            [&_iframe]:rounded-xl [&_iframe]:my-6
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-1
            [&_li]:mb-1.5 [&_li]:leading-relaxed [&_p]:mb-5
            [&_a]:text-primary [&_a]:underline
            [&_hr]:border-border/50 [&_hr]:my-10
            [&_.section-label]:text-xs [&_.section-label]:uppercase [&_.section-label]:tracking-widest [&_.section-label]:text-primary/60 [&_.section-label]:font-semibold [&_.section-label]:mt-8 [&_.section-label]:mb-2`}
          data-placeholder="Start writing your notes..."
        />

        {/* Floating Inline AI Menu */}
        <AnimatePresence>
          {selectionMenu && !aiLoading && !aiPreview && !readingMode && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute z-50 bg-card border border-border rounded-xl shadow-xl px-1 py-1"
              style={{ left: selectionMenu.x, top: selectionMenu.y, transform: "translate(-50%, -100%)" }}
            >
              {isMobile ? (
                <div className="flex flex-wrap gap-0.5 max-w-[280px]">
                  {aiWritingActions.map(({ action, label, icon: Icon }) => (
                    <button key={action} onClick={() => aiAction(action)}
                      className="flex items-center gap-1 px-2 py-2 text-[11px] rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors whitespace-nowrap min-h-[44px]">
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-0.5">
                  {aiWritingActions.map(({ action, label, icon: Icon }) => (
                    <button key={action} onClick={() => aiAction(action)}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors whitespace-nowrap">
                      <Icon className="h-3 w-3" /> {label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {aiLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center z-40">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-3 shadow-lg">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-sm text-foreground">AI is thinking…</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Highlights the active paragraph in documentary mode */
function ParagraphHighlighter({ editorRef, activeIndex }: { editorRef: React.RefObject<HTMLDivElement>; activeIndex: number | null }) {
  useEffect(() => {
    if (!editorRef.current) return;
    const els = editorRef.current.querySelectorAll("p, li, h1, h2, h3, blockquote");
    els.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      if (activeIndex !== null && i === activeIndex) {
        htmlEl.style.backgroundColor = "hsl(var(--primary) / 0.08)";
        htmlEl.style.borderRadius = "8px";
        htmlEl.style.transition = "background-color 0.3s ease";
        htmlEl.style.padding = "4px 8px";
        htmlEl.style.margin = "-4px -8px";
      } else {
        htmlEl.style.backgroundColor = "";
        htmlEl.style.borderRadius = "";
        htmlEl.style.padding = "";
        htmlEl.style.margin = "";
      }
    });
  }, [activeIndex, editorRef]);
  return null;
}
