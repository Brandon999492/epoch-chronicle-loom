import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteTheme = "dark" | "light" | "warm";
export type SiteFontSize = "small" | "medium" | "large";
export type SiteDensity = "compact" | "default" | "spacious";
export type SiteFontFamily = "default" | "serif" | "mono" | "rounded";
export type SiteAccentColor = "blue" | "purple" | "amber" | "emerald" | "rose" | "slate";

interface ThemeContextValue {
  theme: SiteTheme;
  setTheme: (t: SiteTheme) => void;
  fontSize: SiteFontSize;
  setFontSize: (f: SiteFontSize) => void;
  density: SiteDensity;
  setDensity: (d: SiteDensity) => void;
  fontFamily: SiteFontFamily;
  setFontFamily: (f: SiteFontFamily) => void;
  accentColor: SiteAccentColor;
  setAccentColor: (c: SiteAccentColor) => void;
  wallpaperUrl: string | null;
  setWallpaperUrl: (url: string | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "site-theme";
const FONT_KEY = "site-font-size";
const DENSITY_KEY = "site-density";
const FONT_FAMILY_KEY = "site-font-family";
const ACCENT_KEY = "site-accent-color";
const WALLPAPER_KEY = "site-wallpaper";

const FONT_SIZE_MAP: Record<SiteFontSize, string> = { small: "14px", medium: "15px", large: "16.5px" };
const DENSITY_MAP: Record<SiteDensity, string> = { compact: "1.55", default: "1.65", spacious: "1.8" };
const FONT_FAMILY_MAP: Record<SiteFontFamily, string> = {
  default: "'Inter', 'Segoe UI', system-ui, sans-serif",
  serif: "'Georgia', 'Times New Roman', serif",
  mono: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  rounded: "'Nunito', 'Quicksand', system-ui, sans-serif",
};
const ACCENT_MAP: Record<SiteAccentColor, string> = {
  blue: "220 70% 55%",
  purple: "270 60% 55%",
  amber: "38 92% 50%",
  emerald: "155 60% 45%",
  rose: "345 70% 55%",
  slate: "215 20% 55%",
};

const THEME_VALUES = new Set<SiteTheme>(["dark", "light", "warm"]);
const FONT_SIZE_VALUES = new Set<SiteFontSize>(["small", "medium", "large"]);
const DENSITY_VALUES = new Set<SiteDensity>(["compact", "default", "spacious"]);
const FONT_FAMILY_VALUES = new Set<SiteFontFamily>(["default", "serif", "mono", "rounded"]);
const ACCENT_VALUES = new Set<SiteAccentColor>(["blue", "purple", "amber", "emerald", "rose", "slate"]);

function applyThemeClass(theme: SiteTheme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-warm", "dark", "has-wallpaper");
  if (theme === "light") root.classList.add("theme-light");
  else if (theme === "warm") root.classList.add("theme-warm");
}

function applyFontSize(size: SiteFontSize) {
  document.documentElement.style.fontSize = FONT_SIZE_MAP[size];
}

function applyDensity(density: SiteDensity) {
  document.body.style.lineHeight = DENSITY_MAP[density];
}

function applyFontFamily(family: SiteFontFamily) {
  document.body.style.fontFamily = FONT_FAMILY_MAP[family];
}

function applyAccentColor(color: SiteAccentColor) {
  document.documentElement.style.setProperty("--primary", ACCENT_MAP[color]);
}

function applyWallpaper(url: string | null) {
  const el = document.getElementById("site-wallpaper");
  const root = document.documentElement;
  if (url) root.classList.add("has-wallpaper");
  else root.classList.remove("has-wallpaper");

  if (!el) return;
  if (url) {
    el.style.backgroundImage = `url(${url})`;
    el.style.display = "block";
  } else {
    el.style.backgroundImage = "";
    el.style.display = "none";
  }
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeSet(key: string, val: string | null) {
  try {
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, val);
  } catch {
    // ignore quota errors
  }
}

function userKey(base: string, userId: string | null) {
  return userId ? `${base}:${userId}` : base;
}

function getScopedValue(base: string, userId: string | null) {
  return safeGet(userKey(base, userId)) ?? safeGet(base);
}

function asValid<T extends string>(value: string | null, validValues: Set<T>, fallback: T): T {
  return value && validValues.has(value as T) ? (value as T) : fallback;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [storageUserId, setStorageUserId] = useState<string | null>(null);
  const [theme, setThemeState] = useState<SiteTheme>(() => asValid(safeGet(THEME_KEY), THEME_VALUES, "dark"));
  const [fontSize, setFontSizeState] = useState<SiteFontSize>(() => asValid(safeGet(FONT_KEY), FONT_SIZE_VALUES, "medium"));
  const [density, setDensityState] = useState<SiteDensity>(() => asValid(safeGet(DENSITY_KEY), DENSITY_VALUES, "default"));
  const [fontFamily, setFontFamilyState] = useState<SiteFontFamily>(() => asValid(safeGet(FONT_FAMILY_KEY), FONT_FAMILY_VALUES, "default"));
  const [accentColor, setAccentColorState] = useState<SiteAccentColor>(() => asValid(safeGet(ACCENT_KEY), ACCENT_VALUES, "blue"));
  const [wallpaperUrl, setWallpaperUrlState] = useState<string | null>(() => safeGet(WALLPAPER_KEY));

  useEffect(() => { applyThemeClass(theme); }, [theme]);
  useEffect(() => { applyFontSize(fontSize); }, [fontSize]);
  useEffect(() => { applyDensity(density); }, [density]);
  useEffect(() => { applyFontFamily(fontFamily); }, [fontFamily]);
  useEffect(() => { applyAccentColor(accentColor); }, [accentColor]);
  useEffect(() => { applyWallpaper(wallpaperUrl); }, [wallpaperUrl]);

  useEffect(() => {
    let active = true;

    const loadForUser = (userId: string | null) => {
      if (!active) return;
      setStorageUserId(userId);
      setThemeState(asValid(getScopedValue(THEME_KEY, userId), THEME_VALUES, "dark"));
      setFontSizeState(asValid(getScopedValue(FONT_KEY, userId), FONT_SIZE_VALUES, "medium"));
      setDensityState(asValid(getScopedValue(DENSITY_KEY, userId), DENSITY_VALUES, "default"));
      setFontFamilyState(asValid(getScopedValue(FONT_FAMILY_KEY, userId), FONT_FAMILY_VALUES, "default"));
      setAccentColorState(asValid(getScopedValue(ACCENT_KEY, userId), ACCENT_VALUES, "blue"));
      setWallpaperUrlState(getScopedValue(WALLPAPER_KEY, userId));
    };

    supabase.auth.getUser().then(({ data }) => {
      loadForUser(data.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadForUser(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const persist = (key: string, value: string | null) => {
    safeSet(key, value);
    if (storageUserId) safeSet(userKey(key, storageUserId), value);
  };

  const setTheme = (t: SiteTheme) => { setThemeState(t); persist(THEME_KEY, t); };
  const setFontSize = (f: SiteFontSize) => { setFontSizeState(f); persist(FONT_KEY, f); };
  const setDensity = (d: SiteDensity) => { setDensityState(d); persist(DENSITY_KEY, d); };
  const setFontFamily = (f: SiteFontFamily) => { setFontFamilyState(f); persist(FONT_FAMILY_KEY, f); };
  const setAccentColor = (c: SiteAccentColor) => { setAccentColorState(c); persist(ACCENT_KEY, c); };
  const setWallpaperUrl = (url: string | null) => {
    setWallpaperUrlState(url);
    persist(WALLPAPER_KEY, url);
  };

  return (
    <ThemeContext.Provider value={{
      theme, setTheme,
      fontSize, setFontSize,
      density, setDensity,
      fontFamily, setFontFamily,
      accentColor, setAccentColor,
      wallpaperUrl, setWallpaperUrl,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
