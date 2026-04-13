import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type SiteTheme, type SiteFontSize, type SiteDensity, type SiteFontFamily, type SiteAccentColor } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Settings, Globe, Type, Bell, Palette, Rows3, SunMedium, MoonStar, SwatchBook, Upload, X, Sparkles, Image, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const THEME_OPTIONS: Array<{ label: string; value: SiteTheme; desc: string; icon: typeof SunMedium }> = [
  { label: "Light", value: "light", desc: "Clean and bright", icon: SunMedium },
  { label: "Warm", value: "warm", desc: "Soft beige, easy on eyes", icon: SwatchBook },
  { label: "Dark", value: "dark", desc: "Soft dark, focused", icon: MoonStar },
];

const FONT_OPTIONS: Array<{ label: string; value: SiteFontSize }> = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const DENSITY_OPTIONS: Array<{ label: string; value: SiteDensity }> = [
  { label: "Compact", value: "compact" },
  { label: "Default", value: "default" },
  { label: "Spacious", value: "spacious" },
];

const FONT_FAMILY_OPTIONS: Array<{ label: string; value: SiteFontFamily; preview: string }> = [
  { label: "Sans-serif", value: "default", preview: "Aa" },
  { label: "Serif", value: "serif", preview: "Aa" },
  { label: "Monospace", value: "mono", preview: "Aa" },
  { label: "Rounded", value: "rounded", preview: "Aa" },
];

const ACCENT_OPTIONS: Array<{ label: string; value: SiteAccentColor; color: string }> = [
  { label: "Blue", value: "blue", color: "hsl(220 70% 55%)" },
  { label: "Purple", value: "purple", color: "hsl(270 60% 55%)" },
  { label: "Amber", value: "amber", color: "hsl(38 92% 50%)" },
  { label: "Emerald", value: "emerald", color: "hsl(155 60% 45%)" },
  { label: "Rose", value: "rose", color: "hsl(345 70% 55%)" },
  { label: "Slate", value: "slate", color: "hsl(215 20% 55%)" },
];

const FONT_FAMILY_CSS: Record<SiteFontFamily, string> = {
  default: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
  rounded: "font-sans",
};

const SettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    theme, setTheme,
    fontSize: globalFontSize, setFontSize: setGlobalFontSize,
    density, setDensity,
    fontFamily, setFontFamily,
    accentColor, setAccentColor,
    wallpaperUrl, setWallpaperUrl,
  } = useTheme();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ font_size: globalFontSize, preferred_language: language }).eq("user_id", user.id);
    setSaving(false);
    toast.success("Settings saved!");
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setWallpaperUrl(url);
      toast.success("Wallpaper applied!");
    };
    reader.readAsDataURL(file);
  };

  const handleAiWallpaper = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please describe the wallpaper you want");
      return;
    }
    setGeneratingAi(true);
    try {
      const resp = await supabase.functions.invoke("generate-wallpaper", {
        body: { prompt: aiPrompt.trim() },
      });
      if (resp.error) throw resp.error;
      const data = resp.data;
      if (data?.imageUrl) {
        setWallpaperUrl(data.imageUrl);
        toast.success("AI wallpaper generated and applied!");
        setAiPrompt("");
      } else {
        throw new Error("No image returned");
      }
    } catch (err: any) {
      console.error("AI wallpaper error:", err);
      toast.error("Failed to generate wallpaper. Try again.");
    } finally {
      setGeneratingAi(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
              <Settings className="h-6 w-6 text-primary" /> Settings
            </h1>
            <p className="text-sm text-muted-foreground mb-8">Customize your experience. Changes apply instantly.</p>

            <div className="space-y-5">
              {/* Theme */}
              <SettingsCard icon={Palette} title="Theme">
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {THEME_OPTIONS.map(({ label, value, desc, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => setTheme(value)}
                      className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                        theme === value
                          ? "border-primary/30 bg-primary/8 shadow-sm"
                          : "border-border/50 hover:border-border hover:bg-secondary/40"
                      }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`rounded-lg p-1.5 ${theme === value ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{label}</p>
                          <p className="text-[11px] text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </SettingsCard>

              {/* Accent Color */}
              <SettingsCard icon={Palette} title="Accent Color">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ACCENT_OPTIONS.map((o) => (
                    <button key={o.value} type="button" onClick={() => setAccentColor(o.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 ${
                        accentColor === o.value
                          ? "border-primary/40 bg-primary/8 shadow-sm"
                          : "border-border/50 hover:border-border"
                      }`}>
                      <div className={`w-6 h-6 rounded-full transition-all ${
                        accentColor === o.value ? "ring-2 ring-offset-2 ring-offset-background" : ""
                      }`}
                        style={{
                          backgroundColor: o.color,
                          ...(accentColor === o.value ? { boxShadow: `0 0 0 2px var(--background), 0 0 0 4px ${o.color}` } : {}),
                        }} />
                      <span className="text-[10px] text-muted-foreground">{o.label}</span>
                    </button>
                  ))}
                </div>
              </SettingsCard>

              {/* Font Family */}
              <SettingsCard icon={Type} title="Font Style">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FONT_FAMILY_OPTIONS.map((o) => (
                    <button key={o.value} type="button" onClick={() => setFontFamily(o.value)}
                      className={`rounded-xl border px-3 py-3 text-center transition-all duration-200 ${
                        fontFamily === o.value
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                      }`}>
                      <span className={`text-lg block mb-1 ${FONT_FAMILY_CSS[o.value]}`}>{o.preview}</span>
                      <span className="text-[11px] font-medium">{o.label}</span>
                    </button>
                  ))}
                </div>
              </SettingsCard>

              {/* Font Size */}
              <SettingsCard icon={Type} title="Font Size">
                <div className="grid grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((o) => (
                    <OptionBtn key={o.value} active={globalFontSize === o.value} label={o.label} onClick={() => setGlobalFontSize(o.value)} />
                  ))}
                </div>
              </SettingsCard>

              {/* Density */}
              <SettingsCard icon={Rows3} title="Layout Density">
                <div className="grid grid-cols-3 gap-2">
                  {DENSITY_OPTIONS.map((o) => (
                    <OptionBtn key={o.value} active={density === o.value} label={o.label} onClick={() => setDensity(o.value)} />
                  ))}
                </div>
              </SettingsCard>

              {/* Wallpaper */}
              <SettingsCard icon={Image} title="Background Wallpaper">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                  className="hidden"
                />

                {/* Current wallpaper preview */}
                {wallpaperUrl && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border mb-3">
                    <img src={wallpaperUrl} alt="Current wallpaper" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setWallpaperUrl(null); toast.success("Wallpaper removed"); }}
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-1.5 backdrop-blur-sm transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border/50 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-all"
                  >
                    <Upload className="h-4 w-4" /> Upload Photo
                  </button>
                </div>

                {/* AI Wallpaper Generator */}
                <div className="border-t border-border/30 pt-3">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" /> Generate with AI
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Ancient Roman ruins at sunset..."
                      className="flex-1 h-10 rounded-xl border border-border/50 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/30 placeholder:text-muted-foreground/60"
                      onKeyDown={(e) => e.key === "Enter" && handleAiWallpaper()}
                      disabled={generatingAi}
                    />
                    <button
                      onClick={handleAiWallpaper}
                      disabled={generatingAi || !aiPrompt.trim()}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {generatingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {generatingAi ? "Generating…" : "Generate"}
                    </button>
                  </div>
                </div>
              </SettingsCard>

              {/* Language */}
              <SettingsCard icon={Globe} title="Language">
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="h-10 rounded-xl border border-border/50 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/30">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文</option>
                  <option value="ar">العربية</option>
                  <option value="ja">日本語</option>
                  <option value="pt">Português</option>
                  <option value="ru">Русский</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </SettingsCard>

              {/* Notifications */}
              <SettingsCard icon={Bell} title="Notifications">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary accent-[hsl(var(--primary))]" />
                  <span className="text-sm text-foreground">Enable desktop notifications</span>
                </label>
                <p className="mt-1.5 text-xs text-muted-foreground">Get notified about new discoveries and updates.</p>
              </SettingsCard>

              <button onClick={handleSave} disabled={saving}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

function SettingsCard({ icon: Icon, title, children }: { icon: typeof Palette; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-soft">
      <h3 className="mb-3.5 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}

function OptionBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
      }`}>
      {label}
    </button>
  );
}

export default SettingsPage;
