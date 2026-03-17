import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import L from "leaflet";
import * as topojson from "topojson-client";
import { Header } from "@/components/Header";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar, Filter, X, ExternalLink, Globe, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
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

// Dynamic color generation for categories
const CATEGORY_COLORS: Record<string, string> = {
  war: "hsl(0, 62%, 50%)",
  science: "hsl(200, 70%, 50%)",
  politics: "hsl(220, 60%, 50%)",
  discovery: "hsl(140, 60%, 45%)",
  religion: "hsl(40, 70%, 55%)",
  culture: "hsl(320, 50%, 55%)",
  geology: "hsl(25, 60%, 45%)",
  evolution: "hsl(120, 50%, 40%)",
  mystery: "hsl(270, 70%, 45%)",
  ritual: "hsl(310, 60%, 50%)",
  assassination: "hsl(0, 70%, 40%)",
  treaty: "hsl(170, 50%, 50%)",
  "serial-killer": "hsl(350, 80%, 35%)",
  general: "hsl(230, 15%, 55%)",
};

function getCategoryColor(category: string | null): string {
  if (!category) return "hsl(32, 50%, 65%)";
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  // Generate deterministic color for unknown categories
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 50%)`;
}

function formatCategoryLabel(cat: string): string {
  return cat.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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
const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CategoryInfo {
  name: string;
  count: number;
}

function useCategories() {
  return useQuery<CategoryInfo[]>({
    queryKey: ["map-categories"],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/categories`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      });
      if (!resp.ok) throw new Error("Failed to fetch categories");
      return resp.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

function useMapEvents(filters: { categories?: string[]; year_from?: number; year_to?: number }) {
  return useQuery<MapEvent[]>({
    queryKey: ["map-events", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.categories && filters.categories.length > 0) params.set("categories", filters.categories.join(","));
      if (filters.year_from !== undefined) params.set("year_from", String(filters.year_from));
      if (filters.year_to !== undefined) params.set("year_to", String(filters.year_to));
      const resp = await fetch(`${API_BASE}/map-events?${params}`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      });
      if (!resp.ok) throw new Error("Failed to fetch map events");
      return resp.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useCountryGeoJSON() {
  return useQuery({
    queryKey: ["world-geojson"],
    queryFn: async () => {
      const resp = await fetch(TOPO_URL);
      const topo = await resp.json();
      return topojson.feature(topo, topo.objects.countries) as any;
    },
    staleTime: Infinity,
  });
}

function useCountryEvents(country: string | null) {
  return useQuery<MapEvent[]>({
    queryKey: ["country-events", country],
    queryFn: async () => {
      if (!country) return [];
      const resp = await fetch(`${API_BASE}/country-events?country=${encodeURIComponent(country)}`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      });
      if (!resp.ok) throw new Error("Failed to fetch country events");
      return resp.json();
    },
    enabled: !!country,
    staleTime: 5 * 60 * 1000,
  });
}

// Country name mapping from Natural Earth numeric IDs to country names
// We'll extract from properties instead
function getCountryName(feature: any): string {
  return feature.properties?.name || feature.properties?.NAME || "Unknown";
}

const MIN_YEAR = -3000;
const MAX_YEAR = 2025;

function yearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

export default function HistoryMapPage() {
  const { user } = useAuth();
  const [yearRange, setYearRange] = useState<[number, number]>([MIN_YEAR, MAX_YEAR]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [highlightedLayer, setHighlightedLayer] = useState<L.Layer | null>(null);

  const { data: categoryList } = useCategories();

  const { data: events, isLoading, refetch: refetchEvents } = useMapEvents({
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    year_from: yearRange[0],
    year_to: yearRange[1],
  });

  const { data: geoData } = useCountryGeoJSON();
  const { data: countryEvents, isLoading: countryEventsLoading } = useCountryEvents(selectedCountry);

  const filteredEvents = useMemo(() => events ?? [], [events]);

  // Check admin status
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("is_admin").then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in first"); return; }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geo-enrich`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: "{}",
        }
      );
      const result = await resp.json();
      if (!resp.ok) {
        toast.error(result.error || "Enrichment failed");
      } else {
        toast.success(`Enriched ${result.enriched} events with locations (${result.locations_created} new locations)`);
        refetchEvents();
      }
    } catch (e) {
      toast.error("Enrichment request failed");
    } finally {
      setEnriching(false);
    }
  };

  const onEachCountry = useCallback((feature: any, layer: L.Layer) => {
    const name = getCountryName(feature);
    (layer as any).bindTooltip(name, { sticky: true, className: "country-tooltip" });

    (layer as any).on({
      click: () => {
        // Reset previous highlight
        if (highlightedLayer) {
          (highlightedLayer as any).setStyle({ fillOpacity: 0.05, weight: 0.5 });
        }
        // Highlight clicked
        (layer as any).setStyle({ fillOpacity: 0.3, fillColor: "hsl(var(--primary))", weight: 2 });
        setHighlightedLayer(layer);
        setSelectedCountry(name);
      },
    });
  }, [highlightedLayer]);

  const countryStyle = useCallback(() => ({
    fillColor: "hsl(220, 15%, 50%)",
    fillOpacity: 0.05,
    color: "hsl(220, 15%, 40%)",
    weight: 0.5,
  }), []);

  const dismissCountryPanel = () => {
    if (highlightedLayer) {
      (highlightedLayer as any).setStyle({ fillOpacity: 0.05, weight: 0.5 });
      setHighlightedLayer(null);
    }
    setSelectedCountry(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      {/* Page description */}
      <div className="bg-card/80 border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            Explore historical events geographically across time using the interactive world history map.
          </p>
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* Controls overlay */}
        <div className="absolute top-4 left-4 z-[1000] pointer-events-none" style={{ maxWidth: selectedCountry ? "280px" : "320px" }}>
          <div className="pointer-events-auto bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 w-full shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm">History Map</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-7 w-7 p-0">
                {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
              </Button>
            </div>

            {showFilters && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Time Period</span>
                  </div>
                  <Slider min={MIN_YEAR} max={MAX_YEAR} step={50} value={yearRange} onValueChange={(v) => setYearRange(v as [number, number])} className="mb-1" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{yearLabel(yearRange[0])}</span>
                    <span>{yearLabel(yearRange[1])}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block mb-2">
                    Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    <Badge
                      variant={selectedCategories.length === 0 ? "default" : "outline"}
                      className="cursor-pointer text-[10px] px-2 py-0.5"
                      onClick={() => setSelectedCategories([])}
                    >
                      All
                    </Badge>
                    {(categoryList || []).map((cat) => {
                      const isSelected = selectedCategories.includes(cat.name);
                      const color = getCategoryColor(cat.name);
                      return (
                        <Badge
                          key={cat.name}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer text-[10px] px-2 py-0.5"
                          onClick={() => {
                            setSelectedCategories(prev =>
                              isSelected ? prev.filter(c => c !== cat.name) : [...prev, cat.name]
                            );
                          }}
                          style={isSelected ? { backgroundColor: color, borderColor: color } : {}}
                        >
                          {formatCategoryLabel(cat.name)} ({cat.count})
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {isLoading ? "Loading..." : `${filteredEvents.length} events on map`}
                  </span>
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={handleEnrich} disabled={enriching}>
                      {enriching ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      {enriching ? "Enriching…" : "Enrich Data"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Country events side panel */}
        {selectedCountry && (
          <div className="absolute top-4 right-4 z-[1000] w-80 max-h-[calc(100vh-140px)] bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{selectedCountry}</h3>
                <p className="text-[10px] text-muted-foreground">
                  {countryEventsLoading ? "Loading…" : `${countryEvents?.length || 0} historical events`}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={dismissCountryPanel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 px-4 py-2">
              {countryEventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : countryEvents && countryEvents.length > 0 ? (
                <div className="space-y-2">
                  {countryEvents.map((ev) => (
                    <Link
                      key={ev.id}
                      to={`/event/${ev.id}`}
                      className="block p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        {ev.image_url && (
                          <img src={ev.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" loading="lazy" />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{ev.title}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            {ev.year_label && <span className="text-[9px] text-muted-foreground">{ev.year_label}</span>}
                            {ev.category && (
                              <span
                                className="text-[9px] px-1 py-0.5 rounded-full text-white font-medium"
                                style={{ backgroundColor: getCategoryColor(ev.category) }}
                              >
                                {ev.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">No events found for this country yet.</p>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Map */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="w-full h-full absolute inset-0" />
          </div>
        ) : (
          <MapContainer center={[30, 10]} zoom={3} className="flex-1 w-full" style={{ minHeight: "calc(100vh - 110px)" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {geoData && (
              <GeoJSON data={geoData} style={countryStyle} onEachFeature={onEachCountry} />
            )}

            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              iconCreateFunction={(cluster: any) => {
                const count = cluster.getChildCount();
                let size = "small";
                let dim = 36;
                if (count >= 100) { size = "large"; dim = 52; }
                else if (count >= 10) { size = "medium"; dim = 44; }
                return L.divIcon({
                  html: `<div style="
                    background: hsl(var(--primary) / 0.85);
                    width: ${dim}px; height: ${dim}px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-weight: 700; font-size: ${count >= 100 ? 14 : 12}px;
                    border: 3px solid hsl(var(--primary));
                    box-shadow: 0 3px 12px rgba(0,0,0,0.4);
                  ">${count}</div>`,
                  className: `marker-cluster marker-cluster-${size}`,
                  iconSize: L.point(dim, dim),
                });
              }}
            >
              {filteredEvents.map((event) => (
                <Marker key={event.id} position={[event.location.latitude, event.location.longitude]} icon={createCategoryIcon(event.category)}>
                  <Popup className="history-map-popup" maxWidth={280} minWidth={220}>
                    <div className="p-1">
                      {event.image_url && (
                        <img src={event.image_url} alt={event.title} className="w-full h-28 object-cover rounded-md mb-2" loading="lazy" />
                      )}
                      <h3 className="font-bold text-sm text-gray-900 leading-tight mb-1">{event.title}</h3>
                      <div className="flex items-center gap-2 mb-1.5">
                        {event.year_label && <span className="text-[10px] text-gray-500">{event.year_label}</span>}
                        {event.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: getCategoryColor(event.category) }}>
                            {event.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 line-clamp-3 mb-2">{event.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">📍 {event.location.name}</span>
                        <Link to={`/event/${event.id}`} className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                          View <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        )}
      </div>
    </div>
  );
}
