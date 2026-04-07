import { useState, useRef, useCallback } from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  Quote, Highlighter, Type, Palette, Image, Youtube, Sparkles,
  Check, Wand2, BookOpen, Maximize2, RotateCcw, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RichEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
}

const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px"];
const textColors = ["#e2e8f0", "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#f472b6"];
const highlightColors = ["transparent", "#fef08a40", "#bbf7d040", "#bfdbfe40", "#fecaca40", "#e9d5ff40"];

export function RichEditor({ content, onChange }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    syncContent();
  }, []);

  const syncContent = useCallback(() => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML, editorRef.current.innerText);
  }, [onChange]);

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) exec("insertHTML", `<img src="${url}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
  };

  const insertYoutube = () => {
    const url = prompt("Enter YouTube URL:");
    if (!url) return;
    const match = url.match(/(?:youtu\.be\/|v=)([^&]+)/);
    if (match) {
      exec("insertHTML", `<div style="position:relative;padding-bottom:56.25%;height:0;margin:8px 0;"><iframe src="https://www.youtube.com/embed/${match[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:8px;" allowfullscreen></iframe></div>`);
    } else {
      toast.error("Invalid YouTube URL");
    }
  };

  const aiAction = async (action: string) => {
    const sel = window.getSelection();
    const text = sel?.toString() || editorRef.current?.innerText || "";
    if (!text.trim()) { toast.error("Select text or write something first"); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("knowledge-ai", { body: { action, text } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (sel && sel.toString()) {
        exec("insertText", data.result);
      } else if (editorRef.current) {
        editorRef.current.innerText = data.result;
        syncContent();
      }
      toast.success(`AI ${action} complete`);
    } catch (e: any) {
      toast.error(e.message || "AI failed");
    } finally {
      setAiLoading(false);
      setShowAi(false);
    }
  };

  const ToolBtn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md transition-colors ${active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-4 py-2 border-b border-border bg-card/50 sticky top-0 z-10">
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
        <ToolBtn onClick={insertImage} title="Insert Image"><Image className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={insertYoutube} title="Embed YouTube"><Youtube className="h-3.5 w-3.5" /></ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />
        {/* AI Assistant */}
        <div className="relative">
          <ToolBtn onClick={() => { setShowAi(!showAi); setShowFontSize(false); setShowTextColor(false); setShowHighlight(false); }} active={showAi} title="AI Assistant">
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          </ToolBtn>
          {showAi && (
            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-xl p-1 z-20 w-48">
              <p className="px-2 py-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AI Writing Assistant</p>
              {[
                { action: "grammar", label: "Fix Grammar", icon: Check },
                { action: "improve", label: "Improve Clarity", icon: Wand2 },
                { action: "summarize", label: "Summarize", icon: BookOpen },
                { action: "expand", label: "Expand Ideas", icon: Maximize2 },
                { action: "rewrite", label: "Rewrite", icon: RotateCcw },
              ].map(({ action, label, icon: Icon }) => (
                <button key={action} onClick={() => aiAction(action)} disabled={aiLoading}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50">
                  <Icon className="h-3.5 w-3.5 text-primary" />{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncContent}
        onBlur={syncContent}
        dangerouslySetInnerHTML={{ __html: content }}
        className="flex-1 overflow-y-auto p-6 outline-none prose-history text-sm leading-relaxed min-h-[300px] [&_h1]:text-xl [&_h1]:font-display [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-display [&_h2]:font-semibold [&_h2]:mb-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_img]:rounded-lg [&_img]:max-w-full [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        data-placeholder="Start writing..."
      />
    </div>
  );
}
