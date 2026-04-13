import { Link, useLocation } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { Menu, X, User, LogOut, Home, Compass, Clock, Map, BookOpen, Brain, PenTool } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Explore", path: "/explore", icon: Compass },
  { label: "Timeline", path: "/timeline", icon: Clock },
  { label: "Map", path: "/map", icon: Map },
  { label: "Archive", path: "/archive", icon: BookOpen },
  { label: "Royals", path: "/royals", icon: BookOpen },
  { label: "History AI", path: "/history-ai", icon: Brain },
  { label: "Studio", path: "/studio", icon: PenTool },
];

const secondaryItems = [
  { label: "Search", path: "/search" },
  { label: "Learn", path: "/learn" },
  { label: "Knowledge Graph", path: "/knowledge-graph" },
  { label: "Video Studio", path: "/video-studio" },
];

export function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link to="/" className="group flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 transition-colors group-hover:bg-primary/25">
            <span className="font-display text-sm font-bold text-primary">U</span>
          </div>
          <span className="hidden text-base font-semibold tracking-tight text-foreground lg:block">
            Universal History
          </span>
        </Link>

        {/* Desktop search */}
        <div className="mx-4 hidden max-w-xs flex-1 xl:block">
          <SearchBar />
        </div>

        {/* Desktop nav — primary items only */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}>
                {item.label}
              </Link>
            );
          })}

          {/* More dropdown for secondary items */}
          <div className="group relative">
            <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground">
              More
            </button>
            <div className="invisible absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-border/60 bg-popover p-1.5 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
              {secondaryItems.map((item) => (
                <Link key={item.path} to={item.path}
                  className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    location.pathname === item.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Auth buttons */}
        <div className="hidden items-center gap-1 lg:flex">
          {user ? (
            <>
              <Link to="/dashboard" className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/profile" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground" title="Profile">
                <User className="h-4 w-4" />
              </Link>
              <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground" title="Sign Out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground lg:hidden">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-border/30 bg-background/95 backdrop-blur-xl lg:hidden" style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <div className="container mx-auto px-4 py-4">
            <SearchBar />
            <nav className="mt-4 flex flex-col gap-0.5">
              {[...navItems, ...secondaryItems].map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    location.pathname === item.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}>
                  {item.label}
                </Link>
              ))}
              <div className="my-2 border-t border-border/30" />
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground">Dashboard</Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground">Profile</Link>
                  <Link to="/settings" onClick={() => setMobileOpen(false)} className="rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground">Settings</Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="rounded-lg px-4 py-3 text-left text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground">Sign Out</button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-primary">Sign In / Sign Up</Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
