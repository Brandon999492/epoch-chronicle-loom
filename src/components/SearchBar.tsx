import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search events, people, dates…"
        className="h-9 w-full rounded-lg border border-border/50 bg-secondary/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-primary/30 focus:bg-secondary/60"
      />
    </form>
  );
}
