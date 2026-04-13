import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type SiteTheme = "dark" | "light" | "warm";
export type SiteFontSize = "small" | "medium" | "large";
export type SiteDensity = "compact" | "default" | "spacious";

interface ThemeContextValue {
  theme: SiteTheme;
  setTheme: (t: SiteTheme) => void;
  fontSize: SiteFontSize;
  setFontSize: (f: SiteFontSize) => void;
  density: SiteDensity;
  setDensity: (d: SiteDensity) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "site-theme";
const FONT_KEY = "site-font-size";
const DENSITY_KEY = "site-density";

const FONT_SIZE_MAP: Record<SiteFontSize, string> = { small: "14px", medium: "15px", large: "16.5px" };
const DENSITY_MAP: Record<SiteDensity, string> = { compact: "1.55", default: "1.65", spacious: "1.8" };

function applyThemeClass(theme: SiteTheme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-warm", "dark");
  if (theme === "light") root.classList.add("theme-light");
  else if (theme === "warm") root.classList.add("theme-warm");
  // dark is default (no class needed — root vars are dark)
}

function applyFontSize(size: SiteFontSize) {
  document.documentElement.style.fontSize = FONT_SIZE_MAP[size];
}

function applyDensity(density: SiteDensity) {
  document.body.style.lineHeight = DENSITY_MAP[density];
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>(() => {
    try { return (localStorage.getItem(THEME_KEY) as SiteTheme) || "dark"; } catch { return "dark"; }
  });
  const [fontSize, setFontSizeState] = useState<SiteFontSize>(() => {
    try { return (localStorage.getItem(FONT_KEY) as SiteFontSize) || "medium"; } catch { return "medium"; }
  });
  const [density, setDensityState] = useState<SiteDensity>(() => {
    try { return (localStorage.getItem(DENSITY_KEY) as SiteDensity) || "default"; } catch { return "default"; }
  });

  useEffect(() => { applyThemeClass(theme); }, [theme]);
  useEffect(() => { applyFontSize(fontSize); }, [fontSize]);
  useEffect(() => { applyDensity(density); }, [density]);

  const setTheme = (t: SiteTheme) => { setThemeState(t); localStorage.setItem(THEME_KEY, t); };
  const setFontSize = (f: SiteFontSize) => { setFontSizeState(f); localStorage.setItem(FONT_KEY, f); };
  const setDensity = (d: SiteDensity) => { setDensityState(d); localStorage.setItem(DENSITY_KEY, d); };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize, density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
