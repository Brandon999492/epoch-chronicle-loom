import { Columns3, MoonStar, SunMedium, SwatchBook, Type, X } from "lucide-react";
import { useEffect } from "react";
import type { StudioSettings } from "./SmartEditor";

interface StudioSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: StudioSettings;
  onChange: (settings: StudioSettings) => void;
}

const FONT_OPTIONS: Array<{ label: string; value: StudioSettings["fontSize"] }> = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const WIDTH_OPTIONS: Array<{ label: string; value: StudioSettings["readingWidth"] }> = [
  { label: "Compact", value: "narrow" },
  { label: "Standard", value: "medium" },
  { label: "Wide", value: "wide" },
];

const THEME_OPTIONS: Array<{ label: string; value: StudioSettings["theme"]; desc: string; icon: typeof SunMedium }> = [
  { label: "Light", value: "light", desc: "Bright and paper-clean", icon: SunMedium },
  { label: "Warm", value: "warm", desc: "Soft, calm, Apple Notes style", icon: SwatchBook },
  { label: "Dark", value: "dark", desc: "Low-light, high focus", icon: MoonStar },
];

export function StudioSettingsPanel({ open, onClose, settings, onChange }: StudioSettingsProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const update = (partial: Partial<StudioSettings>) => onChange({ ...settings, ...partial });

  return (
    <>
      <button type="button" aria-label="Close settings" onClick={onClose}
        className="fixed inset-0 z-[75] bg-foreground/10 backdrop-blur-[2px]" />

      <aside role="dialog" aria-modal="true" aria-label="Studio settings"
        className="fixed inset-x-4 bottom-4 z-[80] max-h-[85vh] overflow-y-auto rounded-3xl border border-border/80 bg-card p-5 shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:w-[380px] md:max-h-none md:rounded-none md:border-y-0 md:border-r-0 md:border-l">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Studio</p>
            <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
            <p className="max-w-[28ch] text-sm leading-6 text-muted-foreground">Theme, font size, and width update instantly.</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 space-y-7">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><SwatchBook className="h-4 w-4 text-primary" /> Theme</div>
            <div className="grid gap-3">
              {THEME_OPTIONS.map(({ label, value, desc, icon: Icon }) => (
                <button key={value} type="button" onClick={() => update({ theme: value })}
                  className={`rounded-2xl border p-4 text-left transition-colors min-h-[68px] ${settings.theme === value ? "border-primary/35 bg-primary/10" : "border-border/70 bg-background hover:border-primary/20"}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-secondary p-2 text-secondary-foreground"><Icon className="h-4 w-4" /></div>
                    <div><p className="text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p></div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Type className="h-4 w-4 text-primary" /> Font size</div>
            <div className="grid grid-cols-3 gap-2">
              {FONT_OPTIONS.map((o) => <OptBtn key={o.value} active={settings.fontSize === o.value} label={o.label} onClick={() => update({ fontSize: o.value })} />)}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Columns3 className="h-4 w-4 text-primary" /> Reading width</div>
            <div className="grid grid-cols-3 gap-2">
              {WIDTH_OPTIONS.map((o) => <OptBtn key={o.value} active={settings.readingWidth === o.value} label={o.label} onClick={() => update({ readingWidth: o.value })} />)}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

function OptBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-2xl border px-3 py-3 text-sm font-medium transition-colors min-h-[52px] ${
        active ? "border-primary/35 bg-primary/10 text-primary" : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
      }`}>
      {label}
    </button>
  );
}
