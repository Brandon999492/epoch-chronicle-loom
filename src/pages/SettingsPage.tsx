import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Settings, Globe, Type, Bell, Moon, Sun, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState("medium");
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) {
      supabase.from("profiles").select("font_size, preferred_language").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setFontSize(data.font_size || "medium");
            setLanguage(data.preferred_language || "en");
          }
        });
    }
    // Check if dark mode class is present
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ font_size: fontSize, preferred_language: language }).eq("user_id", user.id);
    setSaving(false);
    toast.success("Settings saved!");
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold text-foreground mb-8 flex items-center gap-3">
              <Settings className="h-7 w-7 text-primary" /> Settings
            </h1>

            <div className="space-y-6">
              {/* Display Mode */}
              <div className="bg-card-gradient border border-border rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Palette className="h-5 w-5 text-primary" /> Display Mode
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setDarkMode(true); document.documentElement.classList.add("dark"); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      darkMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                    }`}
                  >
                    <Moon className="h-4 w-4" /> Dark
                  </button>
                  <button
                    onClick={() => { setDarkMode(false); document.documentElement.classList.remove("dark"); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      !darkMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                    }`}
                  >
                    <Sun className="h-4 w-4" /> Light
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div className="bg-card-gradient border border-border rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Type className="h-5 w-5 text-primary" /> Font Size
                </h3>
                <div className="flex gap-2">
                  {["small", "medium", "large"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        fontSize === size
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="bg-card-gradient border border-border rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Globe className="h-5 w-5 text-primary" /> Preferred Language
                </h3>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-lg bg-secondary border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
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
              </div>

              {/* Notifications */}
              <div className="bg-card-gradient border border-border rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-primary" /> Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-[hsl(var(--primary))]"
                    />
                    <span className="text-sm text-foreground">Enable desktop notifications</span>
                  </label>
                  <p className="text-xs text-muted-foreground">Get notified about new historical discoveries and research updates.</p>
                </div>
              </div>

              {/* Timeline Display */}
              <div className="bg-card-gradient border border-border rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  Timeline Display
                </h3>
                <p className="text-sm text-muted-foreground">
                  Timeline preferences are automatically saved. Use the archive page to switch between eras, or the timeline page for the full chronological view.
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
