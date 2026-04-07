import { useState } from "react";
import { Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickCaptureProps {
  onSave: (title: string, content: string) => void;
}

export function QuickCapture({ onSave }: QuickCaptureProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim(), content.trim());
    setTitle("");
    setContent("");
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} title="Quick Capture"
        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
        <Zap className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-semibold text-foreground">Quick Capture</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quick title..."
                className="w-full text-sm rounded-lg bg-secondary border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:ring-1 focus:ring-primary/50" autoFocus />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Jot down your thought..."
                className="w-full text-sm rounded-lg bg-secondary border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground mb-4 focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[100px] resize-none" />
              <button onClick={handleSave} disabled={!title.trim()}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                Save Note
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
