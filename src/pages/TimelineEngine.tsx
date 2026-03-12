import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { historyApi, type HistoricalEvent, type TimePeriod } from "@/services/historyApi";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Search, Filter, ZoomIn, ZoomOut, Calendar, Globe, Swords, Crown, Microscope, BookOpen } from "lucide-react";

// ===== Zoom Levels =====
type ZoomLevel = "geological" | "era" | "century" | "decade" | "year";

const ZOOM_LEVELS: { key: ZoomLevel; label: string }[] = [
  { key: "geological", label: "Geological" },
  { key: "era", label: "Era" },
  { key: "century", label: "Century" },
  { key: "decade", label: "Decade" },
  { key: "year", label: "Year" },
];

const CATEGORY_ICONS: Record<string, typeof Swords> = {
  war: Swords, battle: Swords, monarchy: Crown,
  science: Microscope, discovery: Microscope,
  politics: BookOpen, general: Calendar,
};

const CATEGORY_OPTIONS = [
  "all", "war", "battle", "politics", "science", "discovery",
  "monarchy", "revolution", "religion", "exploration",
  "disaster", "technology", "cultural", "economic", "legal", "general",
];

// ===== Geological ranges for zoom =====
function getZoomRange(zoom: ZoomLevel, offset: number): { from: number; to: number; label: string } {
  const now = 2026;
  switch (zoom) {
    case "geological": {
      const ranges = [
        { from: -4600000000, to: -541000000, label: "Precambrian (4.6B – 541M years ago)" },
        { from: -541000000, to: -252000000, label: "Paleozoic (541M – 252M years ago)" },
        { from: -252000000, to: -66000000, label: "Mesozoic (252M – 66M years ago)" },
        { from: -66000000, to: -2600000, label: "Cenozoic (66M – 2.6M years ago)" },
        { from: -2600000, to: now, label: "Quaternary (2.6M years ago – Present)" },
      ];
      const idx = Math.max(0, Math.min(offset, ranges.length - 1));
      return ranges[idx];
    }
    case "era": {
      const eraStart = -3000 + offset * 500;
      return { from: eraStart, to: eraStart + 500, label: `${Math.abs(eraStart)} ${eraStart < 0 ? "BCE" : "CE"} – ${Math.abs(eraStart + 500)} ${eraStart + 500 < 0 ? "BCE" : "CE"}` };
    }
    case "century": {
      const centuryStart = offset * 100;
      const label = centuryStart < 0
        ? `${Math.abs(centuryStart)}–${Math.abs(centuryStart + 100)} BCE`
        : `${centuryStart}–${centuryStart + 100} CE`;
      return { from: centuryStart, to: centuryStart + 100, label };
    }
    case "decade": {
      const decadeStart = offset * 10;
      return { from: decadeStart, to: decadeStart + 10, label: `${decadeStart}s` };
    }
    case "year": {
      return { from: offset, to: offset, label: `Year ${Math.abs(offset)} ${offset < 0 ? "BCE" : "CE"}` };
    }
  }
}

function getDefaultOffset(zoom: ZoomLevel): number {
  switch (zoom) {
    case "geological": return 4;
    case "era": return 8; // ~1000 CE
    case "century": return 20; // 2000s
    case "decade": return 200; // 2000s
    case "year": return 2026;
  }
}

// ===== Component =====

export default function TimelineEngine() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [zoom, setZoom] = useState<ZoomLevel>((searchParams.get("zoom") as ZoomLevel) || "century");
  const [offset, setOffset] = useState(() => {
    const o = searchParams.get("offset");
    return o ? parseInt(o) : getDefaultOffset((searchParams.get("zoom") as ZoomLevel) || "century");
  });
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const range = useMemo(() => getZoomRange(zoom, offset), [zoom, offset]);

  // Update URL
  useEffect(() => {
    setSearchParams({ zoom, offset: String(offset), ...(category !== "all" ? { category } : {}) }, { replace: true });
  }, [zoom, offset, category]);

  // Fetch events for current range
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["timeline-events", range.from, range.to, category, searchQuery],
    queryFn: () => historyApi.events.list({
      year_from: range.from,
      year_to: range.to,
      category: category !== "all" ? category : undefined,
      q: searchQuery || undefined,
      limit: 100,
    }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch time periods for era context
  const { data: periods } = useQuery({
    queryKey: ["timeline-periods"],
    queryFn: () => historyApi.timeline.list(),
    staleTime: 30 * 60 * 1000,
  });

  const events = eventsData?.data || [];
  const totalEvents = eventsData?.total || 0;

  // Cluster events by sub-range for visual grouping
  const clustered = useMemo(() => {
    if (!events.length) return [];
    const clusters: Map<string, HistoricalEvent[]> = new Map();
    for (const evt of events) {
      const y = evt.year ?? 0;
      let key: string;
      switch (zoom) {
        case "geological": key = String(Math.floor(y / 100000000) * 100000000); break;
        case "era": key = String(Math.floor(y / 50) * 50); break;
        case "century": key = String(Math.floor(y / 10) * 10); break;
        case "decade": key = String(y); break;
        case "year": key = evt.exact_date || String(y); break;
      }
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key)!.push(evt);
    }
    return Array.from(clusters.entries())
      .sort(([a], [b]) => Number(a) - Number(b));
  }, [events, zoom]);

  const navigate = useCallback((dir: -1 | 1) => {
    setOffset(o => o + dir);
  }, []);

  const changeZoom = useCallback((newZoom: ZoomLevel) => {
    setZoom(newZoom);
    setOffset(getDefaultOffset(newZoom));
  }, []);

  const zoomIn = useCallback(() => {
    const idx = ZOOM_LEVELS.findIndex(z => z.key === zoom);
    if (idx < ZOOM_LEVELS.length - 1) {
      const newZoom = ZOOM_LEVELS[idx + 1].key;
      // Try to keep roughly the same time position
      const midpoint = Math.floor((range.from + range.to) / 2);
      setZoom(newZoom);
      switch (newZoom) {
        case "era": setOffset(Math.floor((midpoint + 3000) / 500)); break;
        case "century": setOffset(Math.floor(midpoint / 100)); break;
        case "decade": setOffset(Math.floor(midpoint / 10)); break;
        case "year": setOffset(midpoint); break;
        default: setOffset(getDefaultOffset(newZoom));
      }
    }
  }, [zoom, range]);

  const zoomOut = useCallback(() => {
    const idx = ZOOM_LEVELS.findIndex(z => z.key === zoom);
    if (idx > 0) {
      const newZoom = ZOOM_LEVELS[idx - 1].key;
      setZoom(newZoom);
      setOffset(getDefaultOffset(newZoom));
    }
  }, [zoom]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Interactive Timeline
            </h1>
            <p className="text-muted-foreground">
              Explore history from the Big Bang to today
            </p>
          </motion.div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={zoomOut} disabled={zoom === "geological"}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Select value={zoom} onValueChange={(v) => changeZoom(v as ZoomLevel)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZOOM_LEVELS.map(z => (
                    <SelectItem key={z.key} value={z.key}>{z.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={zoomIn} disabled={zoom === "year"}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground min-w-[200px] text-center">
                {range.label}
              </span>
              <Button variant="outline" size="icon" onClick={() => navigate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-1" /> Filters
            </Button>
          </div>

          {/* Filter bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="flex flex-col sm:flex-row gap-3 p-4 bg-card border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(c => (
                        <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Event count */}
          <div className="text-sm text-muted-foreground mb-4">
            {isLoading ? "Loading..." : `${totalEvents} event${totalEvents !== 1 ? "s" : ""} in this range`}
          </div>

          {/* Timeline visualization */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-border" />

            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 ml-12 md:ml-0">
                    <Skeleton className="h-32 w-full max-w-md rounded-lg" />
                  </div>
                ))}
              </div>
            ) : clustered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No events found in this range</p>
                <p className="text-sm mt-1">Try adjusting the zoom level or navigating to a different period</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clustered.map(([clusterKey, clusterEvents], ci) => (
                  <div key={clusterKey}>
                    {/* Cluster label */}
                    <div className="flex items-center gap-3 mb-2 ml-12 md:ml-0 md:justify-center">
                      <div className="h-px flex-1 bg-border/50 hidden md:block" />
                      <span className="text-xs font-mono text-muted-foreground bg-background px-2">
                        {clusterKey}
                      </span>
                      <div className="h-px flex-1 bg-border/50 hidden md:block" />
                    </div>

                    {clusterEvents.map((evt, ei) => {
                      const isLeft = (ci + ei) % 2 === 0;
                      const Icon = CATEGORY_ICONS[evt.category] || Calendar;
                      return (
                        <motion.div
                          key={evt.id}
                          initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(ei * 0.05, 0.5) }}
                          className={`relative flex items-start md:items-center gap-4 py-2 ${
                            isLeft ? "md:flex-row" : "md:flex-row-reverse"
                          }`}
                        >
                          {/* Content */}
                          <div className={`flex-1 ml-12 md:ml-0 ${isLeft ? "md:pr-8 md:text-right" : "md:pl-8"}`}>
                            <Link
                              to={`/event/${evt.id}`}
                              className="block group"
                            >
                              <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
                                <div className="flex items-center gap-2 mb-1" style={{ justifyContent: isLeft ? "flex-end" : "flex-start" }}>
                                  <Badge variant="secondary" className="text-xs">
                                    <Icon className="h-3 w-3 mr-1" />
                                    {evt.category}
                                  </Badge>
                                  {evt.year_label && (
                                    <span className="text-xs text-muted-foreground">{evt.year_label}</span>
                                  )}
                                </div>
                                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {evt.title}
                                </h3>
                                {evt.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{evt.description}</p>
                                )}
                                {evt.location && (
                                  <span className="text-xs text-muted-foreground mt-1 inline-block">
                                    📍 {(evt.location as any).name}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </div>

                          {/* Center dot */}
                          <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 w-5 h-5 rounded-full bg-primary border-2 border-background z-10 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                          </div>

                          {/* Spacer */}
                          <div className="hidden md:block flex-1" />
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Period context bar */}
          {periods && periods.length > 0 && zoom !== "geological" && (
            <div className="mt-12">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Historical Periods</h3>
              <div className="flex flex-wrap gap-2">
                {periods
                  .filter(p => !p.parent_period_id)
                  .slice(0, 12)
                  .map(p => (
                    <Button
                      key={p.id}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        if (p.start_year != null) {
                          setZoom("century");
                          setOffset(Math.floor(p.start_year / 100));
                        }
                      }}
                    >
                      {p.name}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
