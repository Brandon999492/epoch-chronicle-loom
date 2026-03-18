import { useParams, Link } from "react-router-dom";
import { eras, categoryLabels } from "@/data/historicalData";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Bookmark, BookmarkCheck, Users, Globe, MapPin, Calendar, Landmark } from "lucide-react";
import ImageSlideshow from "@/components/ImageSlideshow";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-api`;

interface EraEvent {
  id: string;
  title: string;
  year_label: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  significance: number | null;
  location: { name: string } | null;
}

interface EraFigure {
  id: string;
  name: string;
  title: string | null;
  image_url: string | null;
  birth_label: string | null;
  death_label: string | null;
}

function useTimePeriods() {
  return useQuery({
    queryKey: ["time-periods-list"],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/timeline`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      });
      if (!resp.ok) return [];
      return resp.json();
    },
    staleTime: 30 * 60 * 1000,
  });
}

function useEraEvents(periodId: string | undefined) {
  return useQuery<{ data: EraEvent[]; total: number }>({
    queryKey: ["era-events", periodId],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/events?period_id=${periodId}&limit=100`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      });
      if (!resp.ok) return { data: [], total: 0 };
      return resp.json();
    },
    enabled: !!periodId,
    staleTime: 5 * 60 * 1000,
  });
}

function useEraFigures(periodId: string | undefined) {
  return useQuery<EraFigure[]>({
    queryKey: ["era-figures", periodId],
    queryFn: async () => {
      // Get events for this period, then find linked figures
      const resp = await fetch(`${API_BASE}/events?period_id=${periodId}&limit=50`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      });
      if (!resp.ok) return [];
      const { data: events } = await resp.json();
      if (!events || events.length === 0) return [];

      // Fetch figures for first few events
      const figureMap = new Map<string, EraFigure>();
      const eventIds = events.slice(0, 20).map((e: any) => e.id);
      for (const eid of eventIds.slice(0, 8)) {
        try {
          const fResp = await fetch(`${API_BASE}/events/${eid}/figures`, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
          });
          if (fResp.ok) {
            const figs = await fResp.json();
            for (const f of figs || []) {
              if (f.figure && !figureMap.has(f.figure.id)) {
                figureMap.set(f.figure.id, f.figure);
              }
            }
          }
        } catch {}
      }
      return Array.from(figureMap.values()).slice(0, 12);
    },
    enabled: !!periodId,
    staleTime: 10 * 60 * 1000,
  });
}

/** DB-backed era detail page */
const DbEraDetail = ({ period }: { period: any }) => {
  const { data: eventsData, isLoading: eventsLoading } = useEraEvents(period.id);
  const { data: figures } = useEraFigures(period.id);
  const { data: allPeriods } = useTimePeriods();

  const events = eventsData?.data || [];
  const totalEvents = eventsData?.total || 0;

  // Find prev/next periods
  const periods = allPeriods || [];
  const idx = periods.findIndex((p: any) => p.id === period.id);
  const prevPeriod = idx > 0 ? periods[idx - 1] : null;
  const nextPeriod = idx < periods.length - 1 ? periods[idx + 1] : null;

  return (
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/timeline" className="hover:text-primary transition-colors">Timeline</Link>
          <span>/</span>
          <span className="text-foreground">{period.name}</span>
        </div>

        {/* Era Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Landmark className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time Period</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">{period.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {period.start_label && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />{period.start_label}{period.end_label && ` – ${period.end_label}`}
              </span>
            )}
            <span className="text-primary font-medium">{totalEvents} events</span>
          </div>
          {period.description && (
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">{period.description}</p>
          )}
        </motion.div>

        {/* Key Figures */}
        {figures && figures.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-12">
            <h2 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />Key Figures of This Era
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {figures.map((fig) => (
                <Link key={fig.id} to={`/knowledge-graph/figure/${fig.id}`} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 hover:border-primary/40 transition-all group">
                  {fig.image_url ? (
                    <img src={fig.image_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0"><Users className="h-4 w-4 text-muted-foreground" /></div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{fig.name}</p>
                    {fig.title && <p className="text-[10px] text-muted-foreground truncate">{fig.title}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Events */}
        <div className="mb-16">
          <h2 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />Key Events
          </h2>

          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No events found for this time period.</p>
          ) : (
            <div className="relative ml-4 border-l-2 border-border pl-8 space-y-4">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 1) }}
                  className="relative"
                >
                  <div className="absolute -left-[2.35rem] top-1 w-3 h-3 rounded-full border-2 border-background bg-primary" />

                  <Link
                    to={`/event/${event.id}`}
                    className="block bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex gap-4">
                      {event.image_url && (
                        <img src={event.image_url} alt="" className="w-20 h-16 rounded object-cover shrink-0 hidden sm:block" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {event.year_label && <span className="text-xs font-medium text-primary">{event.year_label}</span>}
                          {event.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{event.category}</Badge>}
                        </div>
                        <h3 className="text-base font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mt-1">{event.description}</p>
                        )}
                        {event.location && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
                            <MapPin className="h-2.5 w-2.5" />{event.location.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {totalEvents > 100 && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Showing 100 of {totalEvents} events. <Link to={`/archive?period=${period.id}`} className="text-primary hover:underline">View all →</Link>
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center border-t border-border pt-8">
          {prevPeriod ? (
            <Link to={`/era/${prevPeriod.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /><span>{prevPeriod.name}</span>
            </Link>
          ) : <div />}
          {nextPeriod ? (
            <Link to={`/era/${nextPeriod.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <span>{nextPeriod.name}</span><ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
};

/** Legacy static era detail */
const StaticEraDetail = ({ eraId }: { eraId: string }) => {
  const era = eras.find((e) => e.id === eraId);
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const fetchBookmarks = useCallback(async () => {
    if (!user || !era) return;
    const { data } = await supabase
      .from("bookmarks")
      .select("event_id")
      .eq("user_id", user.id)
      .eq("era_id", era.id);
    if (data) setBookmarkedIds(new Set(data.map((b) => b.event_id)));
  }, [user, era]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const toggleBookmark = async (eventId: string) => {
    if (!user) { toast.error("Sign in to bookmark events"); return; }
    if (!era) return;
    if (bookmarkedIds.has(eventId)) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("event_id", eventId);
      setBookmarkedIds((prev) => { const n = new Set(prev); n.delete(eventId); return n; });
      toast.success("Bookmark removed");
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, event_id: eventId, era_id: era.id });
      setBookmarkedIds((prev) => new Set(prev).add(eventId));
      toast.success("Event bookmarked!");
    }
  };

  if (!era) return null;

  const eraIndex = eras.findIndex((e) => e.id === eraId);
  const prevEra = eraIndex > 0 ? eras[eraIndex - 1] : null;
  const nextEra = eraIndex < eras.length - 1 ? eras[eraIndex + 1] : null;

  return (
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/timeline" className="hover:text-primary transition-colors">Timeline</Link>
          <span>/</span>
          <Link to="/archive" className="hover:text-primary transition-colors">Archive</Link>
          <span>/</span>
          <span className="text-foreground">{era.name}</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${era.color})` }} />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{era.period}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">{era.name}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">{era.description}</p>
        </motion.div>

        <div className="space-y-4 mb-16">
          <h2 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />Key Events
          </h2>

          <div className="relative ml-4 border-l-2 border-border pl-8 space-y-6">
            {era.events.map((event, i) => {
              const eventImages: { url: string; caption?: string }[] = [];
              if (event.imageUrl) eventImages.push({ url: event.imageUrl, caption: event.title });
              if (event.images) {
                event.images.forEach(img => {
                  if (!eventImages.some(a => a.url === img.url)) eventImages.push(img);
                });
              }

              return (
                <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }} className="relative">
                  <div className="absolute -left-[2.35rem] top-1 w-3 h-3 rounded-full border-2 border-background" style={{ backgroundColor: `hsl(${era.color})` }} />
                  <Link to={`/event/${event.id}`} className="block bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {eventImages.length > 0 && (
                          <ImageSlideshow images={eventImages} sourceLinks={event.sourceLinks} alt={event.title} compact className="mb-3" />
                        )}
                        <span className="text-xs font-medium text-primary">{event.yearLabel}</span>
                        <h3 className="text-lg font-display font-semibold text-foreground mt-1 mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{event.description}</p>
                        <span className="inline-block mt-3 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                          {categoryLabels[event.category]}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); toggleBookmark(event.id); }}
                        className={`p-2 rounded-md shrink-0 ml-3 transition-colors ${bookmarkedIds.has(event.id) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        title={bookmarkedIds.has(event.id) ? "Remove bookmark" : "Bookmark this event"}
                      >
                        {bookmarkedIds.has(event.id) ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                      </button>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-border pt-8">
          {prevEra ? (
            <Link to={`/era/${prevEra.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /><span>{prevEra.name}</span>
            </Link>
          ) : <div />}
          {nextEra ? (
            <Link to={`/era/${nextEra.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <span>{nextEra.name}</span><ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
};

const EraDetail = () => {
  const { eraId } = useParams();
  const { data: timePeriods, isLoading } = useTimePeriods();

  // Check if it's a UUID (database time period) or legacy static era ID
  const isUuid = eraId && /^[0-9a-f]{8}-/i.test(eraId);
  const dbPeriod = isUuid && timePeriods ? timePeriods.find((p: any) => p.id === eraId) : null;
  const isLegacy = !isUuid && eras.some(e => e.id === eraId);

  if (isLoading && isUuid) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 container mx-auto px-4">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!isLegacy && !dbPeriod) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 text-center">
          <h1 className="text-2xl font-display text-foreground">Era not found</h1>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {dbPeriod ? <DbEraDetail period={dbPeriod} /> : <StaticEraDetail eraId={eraId!} />}
    </div>
  );
};

export default EraDetail;
