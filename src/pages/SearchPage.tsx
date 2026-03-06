import { Header } from "@/components/Header";
import { useSearchParams, Link } from "react-router-dom";
import { allEvents, categoryLabels, type EventCategory } from "@/data/historicalData";
import { royalHouses } from "@/data/royals";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

const categories: EventCategory[] = ["war", "science", "culture", "politics", "discovery", "assassination", "treaty", "religion", "geology", "evolution"];

type SearchResult =
  | {
      kind: "event";
      id: string;
      title: string;
      description: string;
      yearLabel: string;
      badge: string;
      href: string;
    }
  | {
      kind: "royal-house" | "royal-profile";
      id: string;
      title: string;
      description: string;
      yearLabel: string;
      badge: string;
      href: string;
    };

const getPreview = (text: string, maxLength = 220) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "all">("all");

  const results = useMemo<SearchResult[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let filteredEvents = allEvents;
    if (normalizedQuery) {
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      filteredEvents = filteredEvents.filter((e) => {
        const haystack = `${e.title} ${e.description} ${e.yearLabel}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });
    }
    if (selectedCategory !== "all") {
      filteredEvents = filteredEvents.filter((e) => e.category === selectedCategory);
    }

    const eventResults: SearchResult[] = filteredEvents.map((event) => ({
      kind: "event",
      id: event.id,
      title: event.title,
      description: event.description,
      yearLabel: event.yearLabel,
      badge: categoryLabels[event.category],
      href: `/event/${event.id}`,
    }));

    if (!normalizedQuery || selectedCategory !== "all") {
      return eventResults;
    }

    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    const houseResults: SearchResult[] = royalHouses
      .filter((house) => {
        const haystack = `${house.name} ${house.description} ${house.period} british royal family monarchy dynasty crown`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .map((house) => ({
        kind: "royal-house",
        id: house.id,
        title: house.name,
        description: house.description,
        yearLabel: house.period,
        badge: "Royal House",
        href: `/royals/${house.id}`,
      }));

    const profileResults: SearchResult[] = royalHouses.flatMap((house) =>
      house.members
        .filter((member) => {
          const titles = member.titles.map((title) => title.title).join(" ");
          const haystack = `${member.name} ${member.regnalName ?? ""} ${member.house} ${member.description} ${titles} british royal family monarchy king queen`.toLowerCase();
          return terms.every((term) => haystack.includes(term));
        })
        .map((member) => ({
          kind: "royal-profile",
          id: member.id,
          title: member.regnalName ? `${member.name} (${member.regnalName})` : member.name,
          description: member.description,
          yearLabel: member.reignStart && member.reignEnd ? `${member.reignStart}–${member.reignEnd}` : member.born,
          badge: `Royal · ${house.name}`,
          href: `/royals/${house.id}/${member.id}`,
        }))
    );

    return [...eventResults, ...houseResults, ...profileResults];
  }, [query, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-display font-bold text-foreground mb-6">Search the Archive</h1>

            <div className="relative max-w-2xl mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, people, dates..."
                className="w-full rounded-lg bg-secondary/80 border border-border px-12 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-body"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mb-4">{results.length} results found</p>
            <div className="space-y-3">
              {results.map((result) => (
                <Link
                  key={`${result.kind}-${result.id}`}
                  to={result.href}
                  className="block bg-card-gradient border border-border rounded-lg p-5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs text-primary font-medium">{result.yearLabel}</span>
                      <h3 className="font-display text-lg font-semibold text-foreground mt-0.5">{result.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{getPreview(result.description)}</p>
                    </div>
                    <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                      {result.badge}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

