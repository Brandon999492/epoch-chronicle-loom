import { Link, useLocation } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { Menu, X, User, LogOut, Compass } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Explore", path: "/explore" },
  { label: "Timeline", path: "/timeline" },
  { label: "Archive", path: "/archive" },
  { label: "Map", path: "/map" },
  { label: "Search", path: "/search" },
  { label: "Knowledge Graph", path: "/knowledge-graph" },
  { label: "Royals", path: "/royals" },
  { label: "History AI", path: "/history-ai" },
  { label: "Video Studio", path: "/video-studio" },
];

export function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-glass border-b border-border/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
            <span className="font-display text-primary text-sm font-bold">U</span>
          </div>
          <span className="font-display text-lg font-semibold text-foreground hidden lg:block tracking-tight">
            Universal History Archive
          </span>
        </Link>

        <div className="hidden xl:block flex-1 max-w-sm mx-4">
          <SearchBar />
        </div>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? "text-primary bg-primary/10 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-1">
          {user ? (
            <>
              <Link to="/profile" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all" title="Profile">
                <User className="h-4 w-4" />
              </Link>
              <Link to="/settings" className="px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all">
                Settings
              </Link>
              <button onClick={signOut} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all" title="Sign Out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shadow-sm hover:shadow-glow">
              Sign In
            </Link>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border/30 bg-glass max-h-[80vh] overflow-y-auto animate-fade-in">
          <div className="container mx-auto px-4 py-4">
            <SearchBar />
            <nav className="flex flex-col gap-1 mt-4">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}>
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-border/30 my-2" />
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40">Profile</Link>
                  <Link to="/settings" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40">Settings</Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 text-left">Sign Out</button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-primary">Sign In / Sign Up</Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
