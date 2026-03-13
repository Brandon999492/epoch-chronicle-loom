import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Header from "@/components/Header";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Filter, X, ExternalLink } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapEvent {
  id: string;
  title: string;
  slug: string | null;
  year: number | null;
  year_label: string | null;
  end_year: number | null;
  end_year_label: string | null;
  category: string | null;
  significance: number | null;
  image_url: string | null;
  description: string | null;
  location: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    country: string | null;
    continent: string | null;
  };
}

const CATEGORIES = [
  { value: "war", label: "War", color: "hsl(0, 62%, 50%)" },
  { value: "science", label: "Science", color: "hsl(200, 70%, 50%)" },
  { value: "monarchy", label: "Monarchy", color: "hsl(280, 60%, 55%)" },
  { value: "discovery", label: "Discovery", color: "hsl(140, 60%, 45%)" },
  { value: "religion", label: "Religion", color: "hsl(40, 70%, 55%)" },
  { value: "politics", label: "Politics", color: "hsl(220, 60%, 50%)" },
  { value: "culture", label: "Culture", color: "hsl(320, 50%, 55%)" },
  { value: "disaster", label: "Disaster", color: "hsl(25, 80%, 50%)" },
  { value: "general", label: "General", color: "hsl(230, 15%, 55%)" },
];

function getCategoryColor(category: string | null): string {
  return CATEGORIES.find((c) => c.value === category)?.color ?? "hsl(32, 50%, 65%)";
}

function createCategoryIcon(category: string | null) {
  const color = getCategoryColor(category);
  return L.divIcon({
    className: "custom-map-marker",
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-api`;

function useMapEvents(filters: { category?: string; year_from?: number; year_to?: number }) {
  return useQuery<MapEvent[]>({
    queryKey: ["map-events", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      if (filters.year_from !== undefined) params.set("year_from", String(filters.year_from));
      if (filters.year_to !== undefined) params.set("year_to", String(filters.year_to));
      const resp = await fetch(`${API_BASE}/map-events?${params}`, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
      });
      if (!resp.ok) throw new Error("Failed to fetch map events");
      return resp.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Year range constants
const MIN_YEAR = -3000;
const MAX_YEAR = 2025;

function yearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

export default function HistoryMapPage() {
  const [yearRange, setYearRange] = useState<[number, number]>([MIN_YEAR, MAX_YEAR]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(true);

  const { data: events, isLoading } = useMapEvents({
    category: selectedCategory,
    year_from: yearRange[0],
    year_to: yearRange[1],
  });

  const filteredEvents = useMemo(() => events ?? [], [events]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col relative">
        {/* Controls overlay */}
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
          <div className="flex items-start gap-3">
            {/* Filter panel */}
            <div className="pointer-events-auto bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 max-w-sm w-full shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-foreground text-sm">History Map</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-7 w-7 p-0"
                >
                  {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                </Button>
              </div>

              {showFilters && (
                <div className="space-y-4">
                  {/* Timeline slider */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Time Period</span>
                    </div>
                    <Slider
                      min={MIN_YEAR}
                      max={MAX_YEAR}
                      step={50}
                      value={yearRange}
                      onValueChange={(v) => setYearRange(v as [number, number])}
                      className="mb-1"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{yearLabel(yearRange[0])}</span>
                      <span>{yearLabel(yearRange[1])}</span>
                    </div>
                  </div>

                  {/* Category filters */}
                  <div>
                    <span className="text-xs text-muted-foreground block mb-2">Category</span>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant={!selectedCategory ? "default" : "outline"}
                        className="cursor-pointer text-[10px] px-2 py-0.5"
                        onClick={() => setSelectedCategory(undefined)}
                      >
                        All
                      </Badge>
                      {CATEGORIES.map((cat) => (
                        <Badge
                          key={cat.value}
                          variant={selectedCategory === cat.value ? "default" : "outline"}
                          className="cursor-pointer text-[10px] px-2 py-0.5"
                          onClick={() =>
                            setSelectedCategory(selectedCategory === cat.value ? undefined : cat.value)
                          }
                          style={
                            selectedCategory === cat.value
                              ? { backgroundColor: cat.color, borderColor: cat.color }
                              : {}
                          }
                        >
                          {cat.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Event count */}
                  <div className="text-[10px] text-muted-foreground">
                    {isLoading ? "Loading..." : `${filteredEvents.length} events on map`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="w-full h-full absolute inset-0" />
          </div>
        ) : (
          <MapContainer
            center={[30, 10]}
            zoom={3}
            className="flex-1 w-full"
            style={{ minHeight: "calc(100vh - 64px)" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {filteredEvents.map((event) => (
              <Marker
                key={event.id}
                position={[event.location.latitude, event.location.longitude]}
                icon={createCategoryIcon(event.category)}
              >
                <Popup className="history-map-popup" maxWidth={280} minWidth={220}>
                  <div className="p-1">
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-28 object-cover rounded-md mb-2"
                        loading="lazy"
                      />
                    )}
                    <h3 className="font-bold text-sm text-gray-900 leading-tight mb-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-1.5">
                      {event.year_label && (
                        <span className="text-[10px] text-gray-500">{event.year_label}</span>
                      )}
                      {event.category && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                          style={{ backgroundColor: getCategoryColor(event.category) }}
                        >
                          {event.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 line-clamp-3 mb-2">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        📍 {event.location.name}
                      </span>
                      <Link
                        to={`/event/${event.id}`}
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        View <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
