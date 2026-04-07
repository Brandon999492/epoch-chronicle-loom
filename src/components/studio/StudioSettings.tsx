import { X, Type, Columns, Monitor, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { StudioSettings } from "./SmartEditor";

interface StudioSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: StudioSettings;
  onChange: (settings: StudioSettings) => void;
}

export function StudioSettingsPanel({ open, onClose, settings, onChange }: StudioSettingsProps) {
  if (!open) return null;

  const update = (partial: Partial<StudioSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const Option = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick}
      className={`px-3 py-2 text-xs rounded-lg font-medium transition-all min-h-[44px]
        ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
      {label}
    </button>
  );

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      className="fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-card border-l border-border z-50 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Studio Settings</h3>
        <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary min-h-[44px] min-w-[44px] flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Font Size */}
        <div>
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5" /> Font Size
          </label>
          <div className="flex gap-2">
            <Option label="Small" active={settings.fontSize === "small"} onClick={() => update({ fontSize: "small" })} />
            <Option label="Medium" active={settings.fontSize === "medium"} onClick={() => update({ fontSize: "medium" })} />
            <Option label="Large" active={settings.fontSize === "large"} onClick={() => update({ fontSize: "large" })} />
          </div>
        </div>

        {/* Reading Width */}
        <div>
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <Columns className="h-3.5 w-3.5" /> Reading Width
          </label>
          <div className="flex gap-2">
            <Option label="Narrow" active={settings.readingWidth === "narrow"} onClick={() => update({ readingWidth: "narrow" })} />
            <Option label="Medium" active={settings.readingWidth === "medium"} onClick={() => update({ readingWidth: "medium" })} />
            <Option label="Wide" active={settings.readingWidth === "wide"} onClick={() => update({ readingWidth: "wide" })} />
          </div>
        </div>

        {/* Editor Mode */}
        <div>
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5" /> Default Editor Mode
          </label>
          <div className="flex gap-2">
            <Option label="Simple" active={settings.editorMode === "simple"} onClick={() => update({ editorMode: "simple" })} />
            <Option label="Advanced" active={settings.editorMode === "advanced"} onClick={() => update({ editorMode: "advanced" })} />
          </div>
        </div>

        {/* Animations */}
        <div>
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Animations
          </label>
          <div className="flex gap-2">
            <Option label="On" active={settings.animations} onClick={() => update({ animations: true })} />
            <Option label="Off" active={!settings.animations} onClick={() => update({ animations: false })} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
