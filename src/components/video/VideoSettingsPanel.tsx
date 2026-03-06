import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings2 } from "lucide-react";

export interface VideoSettings {
  resolution: string;
  frameRate: string;
  cinematicStyle: string;
  cameraEffect: string;
  includeSubtitles: boolean;
  includeNarration: boolean;
  includeMusic: boolean;
}

interface VideoSettingsPanelProps {
  settings: VideoSettings;
  onUpdateSettings: (settings: VideoSettings) => void;
}

const RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p HD" },
  { value: "1080p", label: "1080p Full HD" },
  { value: "4k", label: "4K Ultra HD" },
];

const FRAME_RATE_OPTIONS = [
  { value: "24", label: "24 fps (Cinema)" },
  { value: "30", label: "30 fps (Standard)" },
  { value: "60", label: "60 fps (Smooth)" },
];

const CINEMATIC_STYLES = [
  { value: "documentary", label: "📽️ Documentary" },
  { value: "cinematic-drama", label: "🎬 Cinematic Drama" },
  { value: "educational", label: "📚 Educational" },
  { value: "historical-realism", label: "🏛️ Historical Realism" },
];

const CAMERA_EFFECTS = [
  { value: "auto", label: "Auto (AI-directed)" },
  { value: "slow-zoom", label: "Slow Zoom" },
  { value: "panning", label: "Panning" },
  { value: "aerial", label: "Aerial View" },
  { value: "map-flyover", label: "Map Flyover" },
  { value: "static", label: "Static" },
];

export function VideoSettingsPanel({ settings, onUpdateSettings }: VideoSettingsPanelProps) {
  const update = (key: keyof VideoSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-semibold">Video Settings</h2>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-[10px]">Resolution</Label>
          <Select value={settings.resolution} onValueChange={(v) => update("resolution", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RESOLUTION_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px]">Frame Rate</Label>
          <Select value={settings.frameRate} onValueChange={(v) => update("frameRate", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FRAME_RATE_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px]">Cinematic Style</Label>
          <Select value={settings.cinematicStyle} onValueChange={(v) => update("cinematicStyle", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CINEMATIC_STYLES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px]">Camera Effect</Label>
          <Select value={settings.cameraEffect} onValueChange={(v) => update("cameraEffect", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CAMERA_EFFECTS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Subtitles</Label>
            <Switch checked={settings.includeSubtitles} onCheckedChange={(v) => update("includeSubtitles", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">AI Narration</Label>
            <Switch checked={settings.includeNarration} onCheckedChange={(v) => update("includeNarration", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Background Music</Label>
            <Switch checked={settings.includeMusic} onCheckedChange={(v) => update("includeMusic", v)} />
          </div>
        </div>
      </div>
    </div>
  );
}
