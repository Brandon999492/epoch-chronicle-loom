import { Link, useLocation } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { Menu, X, User, LogOut, Bookmark, PenSquare } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Timeline", path: "/timeline" },
  { label: "Archive", path: "/archive" },
  { label: "Search", path: "/search" },
  { label: "Knowledge Graph", path: "/knowledge-graph" },
  { label: "Media", path: "/media-library" },
  { label: "British Royals", path: "/royals" },
  { label: "History AI", path: "/history-ai" },
  { label: "Video Studio", path: "/video-studio" },
  { label: "Journal", path: "/journal" },
];

export function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <span className="font-display text-primary text-sm font-bold">U</span>
          </div>
          <span className="font-display text-lg font-semibold text-foreground hidden lg:block">
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
              className={`px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                location.pathname === item.path
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-1">
          {user ? (
            <>
              <Link to="/profile" className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" title="Profile">
                <User className="h-4 w-4" />
              </Link>
              <Link to="/settings" className="px-2.5 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                Settings
              </Link>
              <button onClick={signOut} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" title="Sign Out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              Sign In
            </Link>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
          <div className="container mx-auto px-4 py-3">
            <SearchBar />
            <nav className="flex flex-col gap-1 mt-3">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-border my-2" />
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground">Profile</Link>
                  <Link to="/settings" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground">Settings</Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground text-left">Sign Out</button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-primary">Sign In / Sign Up</Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
