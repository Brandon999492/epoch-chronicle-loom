import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type SiteTheme, type SiteFontSize, type SiteDensity } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Settings, Globe, Type, Bell, Palette, Rows3, SunMedium, MoonStar, SwatchBook } from "lucide-react";
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

const SettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme, fontSize: globalFontSize, setFontSize: setGlobalFontSize, density, setDensity } = useTheme();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) {
      supabase.from("profiles").select("font_size, preferred_language").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setLanguage(data.preferred_language || "en");
          }
        });
    }
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ font_size: globalFontSize, preferred_language: language }).eq("user_id", user.id);
    setSaving(false);
    toast.success("Settings saved!");
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
