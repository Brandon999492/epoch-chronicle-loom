import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings2, Upload, X, Palette } from "lucide-react";
import { type AiMode } from "@/hooks/useHistoryAi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface AiSettings {
  defaultMode: AiMode;
  autosave: boolean;
  fontSize: "small" | "medium" | "large";
  colorTheme: string;
  wallpaperUrl: string | null;
}

const COLOR_THEMES = [
  { value: "default", label: "Default", bg: "bg-background", accent: "hsl(var(--primary))" },
  { value: "midnight", label: "Midnight Blue", bg: "bg-[#0a1628]", accent: "#3b82f6" },
  { value: "sepia", label: "Sepia Parchment", bg: "bg-[#f5f0e1]", accent: "#92400e" },
  { value: "emerald", label: "Emerald Forest", bg: "bg-[#0d1f17]", accent: "#10b981" },
  { value: "crimson", label: "Royal Crimson", bg: "bg-[#1a0a0a]", accent: "#dc2626" },
  { value: "purple", label: "Imperial Purple", bg: "bg-[#120a1e]", accent: "#a855f7" },
  { value: "amber", label: "Ancient Gold", bg: "bg-[#1a1408]", accent: "#f59e0b" },
];

const DEFAULTS: AiSettings = {
  defaultMode: "standard",
  autosave: true,
  fontSize: "medium",
  colorTheme: "default",
  wallpaperUrl: null,
};

function loadSettings(): AiSettings {
  try {
    const raw = localStorage.getItem("ai-settings");
    const wallpaper = localStorage.getItem("ai-wallpaper");
    const settings = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    return { ...settings, wallpaperUrl: wallpaper || null };
  } catch { return DEFAULTS; }
}

function saveSettings(s: AiSettings) {
  try {
    // Save without wallpaper to avoid quota issues (wallpaper is large base64)
    const { wallpaperUrl, ...rest } = s;
    localStorage.setItem("ai-settings", JSON.stringify(rest));
    if (wallpaperUrl) {
      localStorage.setItem("ai-wallpaper", wallpaperUrl);
    } else {
      localStorage.removeItem("ai-wallpaper");
    }
  } catch {
    // Quota exceeded - try saving without wallpaper
    try {
      const { wallpaperUrl, ...rest } = s;
      localStorage.setItem("ai-settings", JSON.stringify(rest));
      localStorage.removeItem("ai-wallpaper");
    } catch { /* ignore */ }
  }
}

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(loadSettings);
  const update = (partial: Partial<AiSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  };
  return { settings, update };
}

interface AiSettingsPanelProps {
  settings: AiSettings;
  onUpdate: (partial: Partial<AiSettings>) => void;
}

export function AiSettingsPanel({ settings, onUpdate }: AiSettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      onUpdate({ wallpaperUrl: url });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="AI Settings">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4" align="end" sideOffset={8}>
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" /> AI Settings
        </h3>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Default Mode</Label>
            <Select value={settings.defaultMode} onValueChange={(v) => onUpdate({ defaultMode: v as AiMode })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="deep">Deep Analysis</SelectItem>
                <SelectItem value="quick">Quick Summary</SelectItem>
                <SelectItem value="debate">Debate</SelectItem>
                <SelectItem value="map">Map</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Autosave conversations</Label>
            <Switch checked={settings.autosave} onCheckedChange={(v) => onUpdate({ autosave: v })} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Response Font Size</Label>
            <Select value={settings.fontSize} onValueChange={(v) => onUpdate({ fontSize: v as any })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Theme */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Palette className="h-3 w-3" /> Color Theme</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_THEMES.map(theme => (
                <button
                  key={theme.value}
                  onClick={() => onUpdate({ colorTheme: theme.value })}
                  className={`relative h-8 rounded-md border-2 transition-all ${
                    settings.colorTheme === theme.value ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
                  }`}
                  style={{ backgroundColor: theme.accent }}
                  title={theme.label}
                >
                  {settings.colorTheme === theme.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">{COLOR_THEMES.find(t => t.value === settings.colorTheme)?.label}</p>
          </div>

          {/* Custom Wallpaper */}
          <div className="space-y-1.5">
            <Label className="text-xs">Custom Wallpaper</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleWallpaperUpload}
              className="hidden"
            />
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3" /> Upload Image
              </Button>
              {settings.wallpaperUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => onUpdate({ wallpaperUrl: null })}
                >
                  <X className="h-3 w-3" /> Remove
                </Button>
              )}
            </div>
            {settings.wallpaperUrl && (
              <div className="relative w-full h-16 rounded-md overflow-hidden border border-border">
                <img src={settings.wallpaperUrl} alt="Wallpaper" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
