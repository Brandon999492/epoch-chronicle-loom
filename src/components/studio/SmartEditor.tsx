import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, Palette, Underline } from "lucide-react";
import type { StudioNote } from "./studio-note-utils";

interface SmartEditorProps {
  content: StudioNote["html_content"];
  onChange: (html: string, text: string) => void;
  settings: StudioSettings;
  placeholder?: string;
}

export interface StudioSettings {
  fontSize: "small" | "medium" | "large";
  readingWidth: "narrow" | "medium" | "wide";
  theme: "light" | "warm" | "dark";
}

type ToolbarState = { x: number; y: number; placement: "above" | "below" };

const FONT_SIZE_MAP: Record<StudioSettings["fontSize"], string> = { small: "16px", medium: "18px", large: "20px" };
const WIDTH_MAP: Record<StudioSettings["readingWidth"], string> = { narrow: "560px", medium: "680px", wide: "820px" };

const COLOR_TOKENS = [
  { label: "Default", token: "--foreground" },
  { label: "Accent", token: "--primary" },
  { label: "Soft", token: "--muted-foreground" },
] as const;

export function SmartEditor({ content, onChange, settings, placeholder = "Start writing your note..." }: SmartEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [showColors, setShowColors] = useState(false);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML, editorRef.current.innerText);
  }, [onChange]);

  const resolveColor = useCallback((token: string) => {
    const scope = editorRef.current ?? document.documentElement;
    const raw = getComputedStyle(scope).getPropertyValue(token).trim();
    return raw ? `hsl(${raw})` : "#111";
  }, []);

  const updateToolbar = useCallback(() => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0 || sel.isCollapsed || !sel.toString().trim()) {
      setToolbar(null); setShowColors(false); return;
    }
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) { setToolbar(null); return; }
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) { setToolbar(null); return; }
    savedRangeRef.current = range.cloneRange();
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const tw = 220;
    const left = Math.min(vw - tw / 2 - 12, Math.max(tw / 2 + 12, rect.left + rect.width / 2));
    const above = rect.top > 80;
    setToolbar({ x: left, y: above ? rect.top - 12 : rect.bottom + 12, placement: above ? "above" : "below" });
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !savedRangeRef.current) return;
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
  }, []);

  const applyCmd = useCallback((cmd: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, value);
    emitChange();
    requestAnimationFrame(updateToolbar);
  }, [emitChange, restoreSelection, updateToolbar]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== content) el.innerHTML = content;
  }, [content]);

  useEffect(() => {
    const handler = () => requestAnimationFrame(updateToolbar);
    document.addEventListener("selectionchange", handler);
    document.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      document.removeEventListener("selectionchange", handler);
      document.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [updateToolbar]);

  return (
    <div className="relative min-h-full px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <div
        ref={editorRef}
        contentEditable
        spellCheck
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        onKeyUp={() => requestAnimationFrame(updateToolbar)}
        onMouseUp={() => requestAnimationFrame(updateToolbar)}
        onTouchEnd={() => requestAnimationFrame(updateToolbar)}
        style={{ fontSize: FONT_SIZE_MAP[settings.fontSize], maxWidth: WIDTH_MAP[settings.readingWidth] }}
        className={`studio-editor-surface mx-auto min-h-full w-full pb-24 outline-none text-foreground
          [&_p]:mb-5 [&_p]:leading-[2.1]
          [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6
          [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6
          [&_li]:leading-[1.95] [&_strong]:font-semibold
          [&_img]:my-8 [&_img]:h-auto [&_img]:w-full [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/70 [&_img]:object-cover
          [&_.note-embed]:relative [&_.note-embed]:my-6 [&_.note-embed]:w-full [&_.note-embed]:overflow-hidden [&_.note-embed]:rounded-2xl [&_.note-embed]:pb-[56.25%]
          [&_.note-embed_iframe]:absolute [&_.note-embed_iframe]:inset-0 [&_.note-embed_iframe]:h-full [&_.note-embed_iframe]:w-full [&_.note-embed_iframe]:border-0
          [&_.note-section-label]:mb-2 [&_.note-section-label]:text-[11px] [&_.note-section-label]:font-semibold [&_.note-section-label]:uppercase [&_.note-section-label]:tracking-[0.24em] [&_.note-section-label]:text-muted-foreground
          [&_.note-divider]:my-7 [&_.note-divider]:border-t [&_.note-divider]:border-border/30
          [&_.note-meta-grid]:grid [&_.note-meta-grid]:gap-4 sm:[&_note-meta-grid]:grid-cols-3
          [&_.note-meta-item_p]:mb-0
          [&_.note-placeholder]:text-muted-foreground/60
          [&_.note-thoughts]:italic
          selection:bg-primary/20`}
        aria-label="Note editor"
      />

      {toolbar && (
        <div
          className="fixed z-[70]"
          style={{ left: toolbar.x, top: toolbar.y, transform: toolbar.placement === "above" ? "translate(-50%, -100%)" : "translate(-50%, 0)" }}
        >
          <div
            className="rounded-2xl border border-border/80 bg-card/95 px-2 py-2 shadow-lg backdrop-blur"
            onMouseDown={(e) => e.preventDefault()}
            onPointerDown={(e) => e.preventDefault()}
          >
            <div className="flex items-center gap-1">
              <TBtn label="Bold" icon={Bold} onClick={() => applyCmd("bold")} />
              <TBtn label="Italic" icon={Italic} onClick={() => applyCmd("italic")} />
              <TBtn label="Underline" icon={Underline} onClick={() => applyCmd("underline")} />
              <TBtn label="Text color" icon={Palette} active={showColors} onClick={() => setShowColors((c) => !c)} />
            </div>
            {showColors && (
              <div className="mt-2 flex items-center gap-2 border-t border-border/70 pt-2">
                {COLOR_TOKENS.map((c) => {
                  const resolved = resolveColor(c.token);
                  return (
                    <button key={c.token} type="button" title={c.label}
                      onClick={() => { applyCmd("foreColor", resolved); setShowColors(false); }}
                      onMouseDown={(e) => e.preventDefault()} onPointerDown={(e) => e.preventDefault()}
                      className="h-10 w-10 rounded-full border border-border/70 transition-transform hover:scale-110"
                      style={{ backgroundColor: resolved }} />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TBtn({ label, icon: Icon, active, onClick }: { label: string; icon: typeof Bold; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      onMouseDown={(e) => e.preventDefault()} onPointerDown={(e) => e.preventDefault()}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${active ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary"}`}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
