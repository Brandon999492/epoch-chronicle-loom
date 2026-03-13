import { Header } from "@/components/Header";
import { useSearchParams, Link } from "react-router-dom";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchApi, type SearchFilters, type GlobalSearchResults } from "@/services/searchApi";
import { historyApi } from "@/services/historyApi";
import { Search, Filter, Calendar, MapPin, Globe, Landmark, Users, Scroll, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  "war", "battle", "politics", "science", "discovery", "religion", "monarchy",
  "revolution", "cultural", "economic", "disaster", "exploration", "legal",
  "technology", "philosophy", "art", "architecture", "general",
];

type ResultTab = "all" | "events" | "figures" | "dynasties" | "civilizations" | "locations";

const tabConfig: { key: ResultTab; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All", icon: Search },
  { key: "events", label: "Events", icon: Scroll },
  { key: "figures", label: "Figures", icon: Users },
  { key: "dynasties", label: "Dynasties", icon: Landmark },
  { key: "civilizations", label: "Civilizations", icon: Globe },
  { key: "locations", label: "Locations", icon: MapPin },
];

const getPreview = (text: string | null, maxLength = 180) => {
  if (!text) return "";
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<ResultTab>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    debounceRef[0] = setTimeout(() => {
      setDebouncedQuery(value);
      if (value) {
        setSearchParams({ q: value }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 400);
  }, [setSearchParams, debounceRef]);

  const filters: SearchFilters = {
    q: debouncedQuery,
    category: category || undefined,
    year_from: yearFrom ? parseInt(yearFrom) : undefined,
    year_to: yearTo ? parseInt(yearTo) : undefined,
    limit: 30,
  };

  const { data: results, isLoading, error } = useQuery({
    queryKey: ["global-search", filters],
    queryFn: () => searchApi.search(filters),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  // Load filter options
  const { data: timePeriods } = useQuery({
    queryKey: ["search-periods"],
    queryFn: () => historyApi.timeline.list(),
    staleTime: 600_000,
  });

  const totalResults = results
    ? (results.events?.length || 0) + (results.figures?.length || 0) +
      (results.dynasties?.length || 0) + (results.civilizations?.length || 0) +
      (results.locations?.length || 0)
    : 0;

  const hasActiveFilters = !!category || !!yearFrom || !!yearTo;

  const clearFilters = () => {
    setCategory("");
    setYearFrom("");
    setYearTo("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Search the Archive
            </h1>
            <p className="text-muted-foreground mb-6">
              Search across millions of historical events, figures, dynasties, civilizations, and locations.
            </p>

            {/* Search Input */}
            <div className="relative max-w-3xl mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder='Try "battles in 1066", "kings executed", "scientific discoveries"…'
                className="w-full rounded-xl bg-secondary/80 border border-border px-12 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-body text-base"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => handleQueryChange("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={hasActiveFilters ? "border-primary text-primary" : ""}
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">Active</Badge>
                )}
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground">
                  Clear all filters
                </button>
              )}
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Category */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground"
                        >
                          <option value="">All categories</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Year range */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Year From
                        </label>
                        <input
                          type="number"
                          value={yearFrom}
                          onChange={(e) => setYearFrom(e.target.value)}
                          placeholder="e.g. -3000"
                          className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Year To
                        </label>
                        <input
                          type="number"
                          value={yearTo}
                          onChange={(e) => setYearTo(e.target.value)}
                          placeholder="e.g. 2024"
                          className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
              {tabConfig.map(({ key, label, icon: Icon }) => {
                const count = key === "all" ? totalResults : (results?.[key as keyof GlobalSearchResults]?.length || 0);
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      activeTab === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    {debouncedQuery.length >= 2 && (
                      <span className="opacity-70">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Results */}
          {debouncedQuery.length < 2 ? (
            <div className="text-center py-20">
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Enter at least 2 characters to search the historical database.</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive">Search failed. Please try again.</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No results found for "{debouncedQuery}". Try different keywords or adjust filters.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">{totalResults} results found</p>

              {/* Events */}
              {(activeTab === "all" || activeTab === "events") && results?.events?.map((event) => (
                <Link
                  key={`event-${event.id}`}
                  to={`/event/${event.slug || event.id}`}
                  className="block bg-card-gradient border border-border rounded-lg p-5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {event.image_url && (
                      <img src={event.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 hidden sm:block" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          <Scroll className="h-2.5 w-2.5 mr-1" />
                          Event
                        </Badge>
                        {event.category && (
                          <Badge variant="secondary" className="text-[10px] capitalize">{event.category}</Badge>
                        )}
                        {event.year_label && (
                          <span className="text-xs text-primary">{event.year_label}</span>
                        )}
                      </div>
                      <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{getPreview(event.description)}</p>
                      {(event.location_name || event.civilization_name) && (
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          {event.location_name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location_name}</span>}
                          {event.civilization_name && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{event.civilization_name}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {/* Figures */}
              {(activeTab === "all" || activeTab === "figures") && results?.figures?.map((figure) => (
                <Link
                  key={`figure-${figure.id}`}
                  to={`/knowledge-graph/figure/${figure.id}`}
                  className="block bg-card-gradient border border-border rounded-lg p-5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {figure.image_url && (
                      <img src={figure.image_url} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 hidden sm:block" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          <Users className="h-2.5 w-2.5 mr-1" />
                          Figure
                        </Badge>
                        {figure.dynasty_name && (
                          <Badge variant="secondary" className="text-[10px]">{figure.dynasty_name}</Badge>
                        )}
                      </div>
                      <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {figure.name}
                      </h3>
                      {figure.title && <p className="text-xs text-primary mt-0.5">{figure.title}</p>}
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{getPreview(figure.biography)}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {figure.birth_label && <span>Born: {figure.birth_label}</span>}
                        {figure.death_label && <span>Died: {figure.death_label}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Dynasties */}
              {(activeTab === "all" || activeTab === "dynasties") && results?.dynasties?.map((dynasty) => (
                <Link
                  key={`dynasty-${dynasty.id}`}
                  to={`/knowledge-graph/dynasty/${dynasty.id}`}
                  className="block bg-card-gradient border border-border rounded-lg p-5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {dynasty.coat_of_arms_url && (
                      <img src={dynasty.coat_of_arms_url} alt="" className="w-14 h-14 rounded-lg object-contain shrink-0 hidden sm:block" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">
                          <Landmark className="h-2.5 w-2.5 mr-1" />
                          Dynasty
                        </Badge>
                        {dynasty.start_label && dynasty.end_label && (
                          <span className="text-xs text-primary">{dynasty.start_label} – {dynasty.end_label}</span>
                        )}
                      </div>
                      <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {dynasty.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{getPreview(dynasty.description)}</p>
                      {dynasty.civilization_name && (
                        <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Globe className="h-3 w-3" />{dynasty.civilization_name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {/* Civilizations */}
              {(activeTab === "all" || activeTab === "civilizations") && results?.civilizations?.map((civ) => (
                <div
                  key={`civ-${civ.id}`}
                  className="bg-card-gradient border border-border rounded-lg p-5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">
                      <Globe className="h-2.5 w-2.5 mr-1" />
                      Civilization
                    </Badge>
                  </div>
                  <h3 className="font-display text-base font-semibold text-foreground">{civ.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{getPreview(civ.description)}</p>
                  {civ.location_name && (
                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{civ.location_name}
                    </span>
                  )}
                </div>
              ))}

              {/* Locations */}
              {(activeTab === "all" || activeTab === "locations") && results?.locations?.map((loc) => (
                <div
                  key={`loc-${loc.id}`}
                  className="bg-card-gradient border border-border rounded-lg p-5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">
                      <MapPin className="h-2.5 w-2.5 mr-1" />
                      Location
                    </Badge>
                    {loc.country && <span className="text-xs text-muted-foreground">{loc.country}</span>}
                    {loc.continent && <span className="text-xs text-muted-foreground">· {loc.continent}</span>}
                  </div>
                  <h3 className="font-display text-base font-semibold text-foreground">{loc.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{getPreview(loc.description)}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
