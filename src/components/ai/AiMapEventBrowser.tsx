import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, ChevronDown, ChevronUp, Globe, Calendar } from "lucide-react";
import { eras, allEvents } from "@/data/historicalData";
import { motion, AnimatePresence } from "framer-motion";

interface AiMapEventBrowserProps {
  onSelectEvent: (question: string) => void;
  visible: boolean;
}

const MAP_CATEGORIES = [
  { value: "all", label: "All Events" },
  { value: "battles", label: "Battles & Wars" },
  { value: "empires", label: "Empires & Kingdoms" },
  { value: "exploration", label: "Exploration & Discovery" },
  { value: "politics", label: "Political Events" },
  { value: "culture", label: "Culture & Religion" },
];

export function AiMapEventBrowser({ onSelectEvent, visible }: AiMapEventBrowserProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const events = useMemo(() => {
    let filtered = allEvents;

    if (selectedEra) {
      filtered = filtered.filter(e => {
        const era = eras.find(er => er.events.some(ev => ev.id === e.id));
        return era?.id === selectedEra;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.yearLabel?.toLowerCase().includes(q)
      );
    }

    return filtered.slice(0, 100);
  }, [search, selectedEra]);

  if (!visible) return null;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
      >
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> Map Mode — Event Browser
        </h3>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search events..."
                  className="pl-8 h-9 text-sm"
                />
              </div>

              {/* Era filter */}
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={selectedEra === null ? "default" : "outline"}
                  className="cursor-pointer text-[10px]"
                  onClick={() => setSelectedEra(null)}
                >
                  All Eras
                </Badge>
                {eras.map(era => (
                  <Badge
                    key={era.id}
                    variant={selectedEra === era.id ? "default" : "outline"}
                    className="cursor-pointer text-[10px]"
                    onClick={() => setSelectedEra(selectedEra === era.id ? null : era.id)}
                  >
                    {era.name}
                  </Badge>
                ))}
              </div>

              {/* Event list - scrollable wheel */}
              <ScrollArea className="h-48">
                <div ref={scrollRef} className="space-y-1">
                  {events.map(event => (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(`Tell me about the geographic location and significance of: ${event.title}. Where exactly did this happen? Provide coordinates and nearby landmarks.`)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent/50 transition-colors border border-transparent hover:border-border group"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{event.yearLabel}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {events.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">No events found</p>
                  )}
                </div>
              </ScrollArea>

              <p className="text-[10px] text-muted-foreground text-center">
                Click any event to explore its geographic details
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
