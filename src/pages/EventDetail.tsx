import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Tag, MapPin, Users, Globe, Landmark, Star, BookOpen, Zap, History, Image, ExternalLink, ChevronRight } from "lucide-react";
import { useEvent, useEventFigures, useEventMedia } from "@/hooks/useHistoryData";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { allEvents, categoryLabels, eras } from "@/data/historicalData";
import { categoryColors } from "@/data/types";
import ImageSlideshow from "@/components/ImageSlideshow";
import { EventRecommendations } from "@/components/EventRecommendations";
import { EventActions } from "@/components/EventActions";

const isLegacyStaticId = (s: string) => /^[a-z]{1,6}\d{1,3}$/i.test(s);
const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-api`;

const catClass = (cat: string) => `cat-${cat}`;
const bgCatClass = (cat: string) => `bg-cat-${cat}/10`;
const borderCatClass = (cat: string) => `border-cat-${cat}`;

function useRelatedEvents(eventId: string | undefined) {
  return useQuery({
    queryKey: ["related-events", eventId],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/graph/event/${eventId}`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      });
      if (!resp.ok) return { related_events: [] };
      const data = await resp.json();
      return { related_events: data.related_events || [] };
    },
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000,
  });
}

function parseDescription(text: string): { section: string; content: string }[] {
  const paragraphs = text.split("\n\n").filter(Boolean);
  if (paragraphs.length <= 1) return [{ section: "Overview", content: text }];
  if (paragraphs.length === 2) {
    return [
      { section: "Background", content: paragraphs[0] },
      { section: "Details & Significance", content: paragraphs[1] },
    ];
  }
  const sections: { section: string; content: string }[] = [];
  const sectionNames = ["Background", "Event Details", "Consequences & Legacy"];
  const chunkSize = Math.ceil(paragraphs.length / 3);
  for (let i = 0; i < 3; i++) {
    const chunk = paragraphs.slice(i * chunkSize, (i + 1) * chunkSize).join("\n\n");
    if (chunk) sections.push({ section: sectionNames[i] || "Details", content: chunk });
  }
  return sections;
}

const sectionIcons: Record<string, React.ReactNode> = {
  "Overview": <BookOpen className="h-4 w-4" />,
  "Background": <History className="h-4 w-4" />,
  "Event Details": <Zap className="h-4 w-4" />,
  "Details & Significance": <Zap className="h-4 w-4" />,
  "Consequences & Legacy": <Star className="h-4 w-4" />,
};

/* ======= Premium Loading Skeleton ======= */
const EventSkeleton = () => (
  <div className="pt-24 pb-16 container mx-auto px-4 max-w-5xl">
    <Skeleton className="h-4 w-48 mb-8 skeleton-shimmer" />
    <Skeleton className="h-80 w-full rounded-2xl mb-8 skeleton-shimmer" />
    <div className="flex gap-3 mb-4">
      <Skeleton className="h-7 w-20 rounded-full skeleton-shimmer" />
      <Skeleton className="h-7 w-28 rounded-full skeleton-shimmer" />
      <Skeleton className="h-7 w-24 rounded-full skeleton-shimmer" />
    </div>
    <Skeleton className="h-10 w-3/4 mb-6 skeleton-shimmer" />
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
      <div className="space-y-4">
        <Skeleton className="h-5 w-full skeleton-shimmer" />
        <Skeleton className="h-5 w-full skeleton-shimmer" />
        <Skeleton className="h-5 w-4/5 skeleton-shimmer" />
        <Skeleton className="h-5 w-full skeleton-shimmer" />
        <Skeleton className="h-5 w-3/4 skeleton-shimmer" />
      </div>
      <div className="hidden lg:block space-y-3">
        <Skeleton className="h-32 rounded-xl skeleton-shimmer" />
        <Skeleton className="h-24 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  </div>
);

/* ======= Sticky Sidebar for Event ======= */
const EventSidebar = ({ event, figures, sections }: { event: any; figures: any; sections: { section: string }[] }) => (
  <aside className="hidden lg:block sticky-sidebar scrollbar-thin space-y-5">
    {/* Quick Facts Card */}
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-primary" /> Quick Facts
      </h3>
      <dl className="space-y-3 text-sm">
        {event.year_label && (
          <div className="flex items-start gap-2">
            <dt className="text-muted-foreground shrink-0"><Calendar className="h-3.5 w-3.5 mt-0.5" /></dt>
            <dd className="text-foreground font-medium">
              {event.year_label}{event.end_year_label && ` – ${event.end_year_label}`}
            </dd>
          </div>
        )}
        {event.location && (
          <div className="flex items-start gap-2">
            <dt className="text-muted-foreground shrink-0"><MapPin className="h-3.5 w-3.5 mt-0.5" /></dt>
            <dd className="text-foreground">{event.location.name}</dd>
          </div>
        )}
        {event.civilization && (
          <div className="flex items-start gap-2">
            <dt className="text-muted-foreground shrink-0"><Globe className="h-3.5 w-3.5 mt-0.5" /></dt>
            <dd className="text-foreground">{event.civilization.name}</dd>
          </div>
        )}
        {event.time_period && (
          <div className="flex items-start gap-2">
            <dt className="text-muted-foreground shrink-0"><Landmark className="h-3.5 w-3.5 mt-0.5" /></dt>
            <dd>
              <Link to={`/era/${event.time_period.id}`} className="text-primary hover:underline text-sm">
                {event.time_period.name}
              </Link>
            </dd>
          </div>
        )}
        {event.significance && (
          <div className="flex items-start gap-2">
            <dt className="text-muted-foreground shrink-0"><Star className="h-3.5 w-3.5 mt-0.5" /></dt>
            <dd className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(event.significance, 10) }).map((_, i) => (
                <Star key={i} className="h-3 w-3 text-primary fill-primary" />
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>

    {/* Section Navigation */}
    {sections.length > 1 && (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Sections</h3>
        <nav className="space-y-1">
          {sections.map((s, i) => (
            <a
              key={i}
              href={`#section-${i}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1.5 px-2 rounded-md hover:bg-primary/5"
            >
              <ChevronRight className="h-3 w-3" />
              {s.section}
            </a>
          ))}
        </nav>
      </div>
    )}

    {/* Key Figures (sidebar) */}
    {figures && figures.length > 0 && (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-primary" /> Key Figures
        </h3>
        <div className="space-y-2">
          {figures.slice(0, 5).map((ef: any) => (
            <Link key={ef.figure.id} to={`/knowledge-graph/figure/${ef.figure.id}`} className="flex items-center gap-2.5 py-1.5 group">
              {ef.figure.image_url ? (
                <img src={ef.figure.image_url} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-border group-hover:ring-primary/40 transition-all" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Users className="h-3.5 w-3.5 text-muted-foreground" /></div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">{ef.figure.name}</p>
                {ef.role && <p className="text-[10px] text-primary/80">{ef.role}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    )}

    {/* Category & Tags */}
    {event.category && (
      <Link to={`/category/${event.category}`} className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl border transition-all hover:scale-[1.02] ${bgCatClass(event.category)} ${borderCatClass(event.category)} ${catClass(event.category)}`}>
        <Tag className="h-3.5 w-3.5" />
        <span className="capitalize">{event.category}</span>
        <ChevronRight className="h-3.5 w-3.5 ml-auto" />
      </Link>
    )}
  </aside>
);

/* ======= DB Event Detail (Premium) ======= */
const DbEventDetail = ({ eventId }: { eventId: string }) => {
  const { data: event, isLoading, isError } = useEvent(eventId);
  const { data: figures } = useEventFigures(eventId);
  const { data: media } = useEventMedia(eventId);
  const { data: relatedData } = useRelatedEvents(eventId);

  if (isLoading) return <EventSkeleton />;

  if (isError || !event) {
    return (
      <div className="pt-24 text-center">
        <h1 className="text-2xl font-display text-foreground">Event not found</h1>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">← Back to Home</Link>
      </div>
    );
  }

  const fullText = event.detailed_description || event.description || "";
  const sections = parseDescription(fullText);
  const relatedEvents = relatedData?.related_events || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pt-20 pb-20"
    >
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/archive" className="hover:text-primary transition-colors">Archive</Link>
          {event.time_period && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/era/${event.time_period.id}`} className="hover:text-primary transition-colors">{event.time_period.name}</Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">{event.title}</span>
        </motion.div>

        {/* Hero Image - Full Width */}
        <AnimatePresence>
          {event.image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl overflow-hidden mb-10 border border-border relative shadow-dramatic"
            >
              <img src={event.image_url} alt={event.title} className="w-full max-h-[420px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              {event.significance && event.significance >= 8 && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground shadow-glow">
                    <Star className="h-3 w-3 mr-1 fill-current" />Major Event
                  </Badge>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category & Meta Badges */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-wrap items-center gap-2.5 mb-5">
          {event.category && (
            <Link to={`/category/${event.category}`} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-105 ${bgCatClass(event.category)} ${borderCatClass(event.category)} border ${catClass(event.category)}`}>
              <Tag className="h-3 w-3" />
              <span className="capitalize">{event.category}</span>
            </Link>
          )}
          {event.year_label && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
              <Calendar className="h-3.5 w-3.5" />{event.year_label}{event.end_year_label && ` – ${event.end_year_label}`}
            </span>
          )}
          {event.location && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
              <MapPin className="h-3.5 w-3.5" />{event.location.name}
            </span>
          )}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-10 leading-tight"
        >
          {event.title}
        </motion.h1>

        {/* Main Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          {/* Main Content Column */}
          <div>
            {/* Structured content sections */}
            <div className="space-y-10">
              {sections.map((s, i) => (
                <motion.section
                  key={i}
                  id={`section-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                >
                  {sections.length > 1 && (
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {sectionIcons[s.section] || <BookOpen className="h-4 w-4" />}
                      </div>
                      <h2 className="text-xl font-display font-semibold text-foreground">{s.section}</h2>
                    </div>
                  )}
                  <div className="space-y-4 pl-0 md:pl-5 border-l-0 md:border-l-2 border-primary/15">
                    {s.content.split("\n\n").filter(Boolean).map((p, j) => (
                      <p key={j} className="prose-history md:pl-5">{p}</p>
                    ))}
                  </div>
                </motion.section>
              ))}
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-border/50">
                <span className="text-xs text-muted-foreground mr-1 self-center">Tags:</span>
                {event.tags.map((tag: string) => (
                  <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}>
                    <Badge variant="outline" className="text-xs hover:bg-primary/10 hover:border-primary/30 cursor-pointer transition-all">{tag}</Badge>
                  </Link>
                ))}
              </motion.div>
            )}

            {/* Key Figures (mobile — hidden on lg) */}
            {figures && figures.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-12 lg:hidden">
                <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />Key Figures
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {figures.map((ef: any) => (
                    <Link key={ef.figure.id} to={`/knowledge-graph/figure/${ef.figure.id}`} className="card-premium flex items-center gap-3 p-4 group">
                      {ef.figure.image_url ? (
                        <img src={ef.figure.image_url} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/40 transition-all" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><Users className="h-5 w-5 text-muted-foreground" /></div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{ef.figure.name}</p>
                        {ef.role && <p className="text-xs text-primary font-medium">{ef.role}</p>}
                        {ef.figure.title && <p className="text-xs text-muted-foreground truncate">{ef.figure.title}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Media Gallery */}
            {media && media.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-12">
                <h2 className="text-xl font-display font-semibold text-foreground mb-5 flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />Media Gallery
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {media.map((em: any) => (
                    <div key={em.media.id} className="card-premium overflow-hidden group">
                      <div className="overflow-hidden">
                        <img
                          src={em.media.thumbnail_url || em.media.url}
                          alt={em.media.title || ""}
                          className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      {em.media.title && (
                        <div className="p-3">
                          <p className="text-sm font-medium text-foreground">{em.media.title}</p>
                          {em.media.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{em.media.description}</p>}
                          {em.media.source && <p className="text-[10px] text-muted-foreground mt-1.5 italic">Source: {em.media.source}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Related Events */}
            {relatedEvents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-14">
                <h2 className="text-xl font-display font-semibold text-foreground mb-5 flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />Related Events
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedEvents.slice(0, 6).map((re: any, i: number) => (
                    <motion.div key={re.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                      <Link to={`/event/${re.id}`} className="card-premium overflow-hidden group block">
                        {re.image_url && (
                          <div className="overflow-hidden">
                            <img src={re.image_url} alt="" className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        )}
                        <div className="p-4">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{re.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {re.year_label && <span className="text-xs text-muted-foreground">{re.year_label}</span>}
                            {re.category && (
                              <span className={`text-[10px] font-medium capitalize ${catClass(re.category)}`}>{re.category}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* User Actions: Bookmark, Learn, Notes */}
            <EventActions
              eventId={eventId}
              eventTitle={event.title}
              category={event.category}
              eraId={event.time_period?.id}
            />

            {/* Recommendations */}
            <EventRecommendations
              eventId={eventId}
              tags={event.tags}
              category={event.category}
              timePeriodId={event.time_period?.id}
            />

            {/* Bottom Navigation */}
            <div className="mt-14 pt-8 border-t border-border flex items-center justify-between">
              <Link to="/archive" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />Back to Archive
              </Link>
              {event.time_period && (
                <Link to={`/era/${event.time_period.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                  View {event.time_period.name}
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <EventSidebar event={event} figures={figures} sections={sections} />
        </div>
      </div>
    </motion.div>
  );
};

/** Static-data event detail (legacy IDs) */
const StaticEventDetail = ({ eventId }: { eventId: string }) => {
  const event = allEvents.find((e) => e.id === eventId);

  if (!event) {
    return (
      <div className="pt-24 text-center">
        <h1 className="text-2xl font-display text-foreground">Event not found</h1>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">← Back to Home</Link>
      </div>
    );
  }

  const era = eras.find((e) => e.id === event.era);
  const categoryColor = categoryColors[event.category];

  const allImages: { url: string; caption?: string }[] = [];
  if (event.imageUrl) allImages.push({ url: event.imageUrl, caption: event.title });
  if (event.images) {
    event.images.forEach(img => {
      if (!allImages.some(a => a.url === img.url)) allImages.push(img);
    });
  }

  const sections = parseDescription(event.description);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/archive" className="hover:text-primary transition-colors">Archive</Link>
          {era && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/era/${era.id}`} className="hover:text-primary transition-colors">{era.name}</Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">{event.title}</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {allImages.length > 0 && (
            <ImageSlideshow images={allImages} sourceLinks={event.sourceLinks} alt={event.title} className="mb-8 rounded-2xl overflow-hidden shadow-dramatic" />
          )}

          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: `hsl(${categoryColor})` }}>
              <Tag className="h-3 w-3" />{categoryLabels[event.category]}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
              <Calendar className="h-3.5 w-3.5" />{event.yearLabel}
            </span>
            {era && (
              <Link to={`/era/${era.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full hover:text-primary transition-colors">
                <Landmark className="h-3.5 w-3.5" />{era.name}
              </Link>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-10 leading-tight">{event.title}</h1>

          <div className="space-y-10">
            {sections.map((s, i) => (
              <motion.section key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                {sections.length > 1 && (
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {sectionIcons[s.section] || <BookOpen className="h-4 w-4" />}
                    </div>
                    <h2 className="text-xl font-display font-semibold text-foreground">{s.section}</h2>
                  </div>
                )}
                <div className="space-y-4 pl-0 md:pl-5 border-l-0 md:border-l-2 border-primary/15">
                  {s.content.split("\n\n").filter(Boolean).map((p, j) => (
                    <p key={j} className="prose-history md:pl-5">{p}</p>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        </motion.div>

        {event.sourceLinks && event.sourceLinks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-12">
            <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />Learn More
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.sourceLinks.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="card-premium flex items-center gap-3 p-4 group">
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{link.label}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mt-14 pt-8 border-t border-border">
          <Link to={era ? `/era/${era.id}` : "/archive"} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />Back to {era ? era.name : "Archive"}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 text-center">
          <h1 className="text-2xl font-display text-foreground">Event not found</h1>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const useDatabase = !isLegacyStaticId(eventId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {useDatabase ? <DbEventDetail eventId={eventId} /> : <StaticEventDetail eventId={eventId} />}
    </div>
  );
};

export default EventDetail;
