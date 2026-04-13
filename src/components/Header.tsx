import { Link, useLocation } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { Menu, X, User, LogOut, Home, Compass, Clock, Map, BookOpen, Brain, PenTool, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const coreNav = [
  { label: "Home", path: "/" },
  { label: "Explore", path: "/explore" },
  { label: "Timeline", path: "/timeline" },
  { label: "Map", path: "/map" },
  { label: "Archive", path: "/archive" },
];

const personalNav = [
  { label: "History AI", path: "/history-ai" },
  { label: "Notes", path: "/studio" },
];

const moreNav = [
  { label: "Search", path: "/search" },
  { label: "Royals", path: "/royals" },
  { label: "Learn", path: "/learn" },
  { label: "Knowledge Graph", path: "/knowledge-graph" },
  { label: "Video Studio", path: "/video-studio" },
];

export function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, label }: { path: string; label: string }) => (
    <Link to={path}
      className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
        isActive(path)
          ? "bg-primary/12 text-primary"
          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
      }`}>
      {label}
    </Link>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/85 backdrop-blur-2xl">
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4">
        {/* Logo */}
        <Link to="/" className="group flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary/14 transition-colors duration-200 group-hover:bg-primary/22">
            <span className="font-display text-sm font-bold text-primary">U</span>
          </div>
          <span className="hidden text-[15px] font-semibold tracking-tight text-foreground lg:block">
            Universal History
          </span>
        </Link>

        {/* Desktop search */}
        <div className="mx-3 hidden max-w-[260px] flex-1 xl:block">
          <SearchBar />
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {coreNav.map((item) => <NavItem key={item.path} {...item} />)}
          
          <div className="mx-1 h-4 w-px bg-border/40" />
          
          {personalNav.map((item) => <NavItem key={item.path} {...item} />)}

          {/* More dropdown */}
          <div className="group relative">
            <button className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary/70 hover:text-foreground">
              More
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
            <div className="invisible absolute right-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-border/50 bg-popover p-1.5 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
              {moreNav.map((item) => (
                <Link key={item.path} to={item.path}
                  className={`block rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
                    isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Auth */}
        <div className="hidden items-center gap-1 lg:flex">
          {user ? (
            <>
              <Link to="/dashboard" className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary/70 hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/profile" className="rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-secondary/70 hover:text-foreground" title="Profile">
                <User className="h-4 w-4" />
              </Link>
              <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-secondary/70 hover:text-foreground" title="Sign Out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="rounded-[10px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-all duration-200 hover:opacity-90 active:scale-[0.98]">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground lg:hidden">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-border/25 bg-background/95 backdrop-blur-2xl lg:hidden" style={{ maxHeight: "85vh", overflowY: "auto" }}>
          <div className="container mx-auto px-4 py-4">
            <SearchBar />

            {/* Core */}
            <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Explore</p>
            <nav className="flex flex-col gap-0.5">
              {coreNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-150 ${
                    isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Personal */}
            <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Tools</p>
            <nav className="flex flex-col gap-0.5">
              {[...personalNav, ...moreNav].map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-150 ${
                    isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="my-3 border-t border-border/25" />

            {/* Auth */}
            {user ? (
              <nav className="flex flex-col gap-0.5">
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground">Dashboard</Link>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground">Profile</Link>
                <Link to="/settings" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground">Settings</Link>
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="rounded-lg px-3 py-3 text-left text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground">Sign Out</button>
              </nav>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium text-primary">Sign In / Sign Up</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
