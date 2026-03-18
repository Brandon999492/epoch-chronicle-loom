import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Tag, MapPin, Users, Globe, Landmark, Star, BookOpen, Zap, History, Image } from "lucide-react";
import { useEvent, useEventFigures, useEventMedia } from "@/hooks/useHistoryData";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { allEvents, categoryLabels, eras } from "@/data/historicalData";
import { categoryColors } from "@/data/types";
import ImageSlideshow from "@/components/ImageSlideshow";

const isLegacyStaticId = (s: string) => /^[a-z]{1,6}\d{1,3}$/i.test(s);

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-api`;

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

/** Parse description into structured sections */
function parseDescription(text: string): { section: string; content: string }[] {
  const paragraphs = text.split("\n\n").filter(Boolean);
  if (paragraphs.length <= 1) {
    return [{ section: "Overview", content: text }];
  }
  if (paragraphs.length === 2) {
    return [
      { section: "Background", content: paragraphs[0] },
      { section: "Details & Significance", content: paragraphs[1] },
    ];
  }
  // 3+ paragraphs: split into logical sections
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
  "Overview": <BookOpen className="h-4 w-4 text-primary" />,
  "Background": <History className="h-4 w-4 text-primary" />,
  "Event Details": <Zap className="h-4 w-4 text-primary" />,
  "Details & Significance": <Zap className="h-4 w-4 text-primary" />,
  "Consequences & Legacy": <Star className="h-4 w-4 text-primary" />,
};

const DbEventDetail = ({ eventId }: { eventId: string }) => {
  const { data: event, isLoading, isError } = useEvent(eventId);
  const { data: figures } = useEventFigures(eventId);
  const { data: media } = useEventMedia(eventId);
  const { data: relatedData } = useRelatedEvents(eventId);

  if (isLoading) {
    return (
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl mb-6" />
        <Skeleton className="h-6 w-48 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

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
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/archive" className="hover:text-primary transition-colors">Archive</Link>
          <span>/</span>
          {event.time_period && (
            <>
              <Link to={`/era/${event.time_period.id}`} className="hover:text-primary transition-colors">{event.time_period.name}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{event.title}</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Hero Image */}
          {event.image_url && (
            <div className="rounded-xl overflow-hidden mb-8 border border-border relative">
              <img src={event.image_url} alt={event.title} className="w-full max-h-96 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>
          )}

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {event.category && (
              <Badge variant="secondary" className="capitalize">
                <Tag className="h-3 w-3 mr-1" />{event.category}
              </Badge>
            )}
            {event.year_label && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />{event.year_label}{event.end_year_label && ` – ${event.end_year_label}`}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />{event.location.name}
              </span>
            )}
            {event.civilization && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />{event.civilization.name}
              </span>
            )}
            {event.time_period && (
              <Link to={`/era/${event.time_period.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Landmark className="h-3.5 w-3.5" />{event.time_period.name}
              </Link>
            )}
          </div>

          {/* Significance stars */}
          {event.significance && (
            <div className="flex items-center gap-1 mb-4">
              <span className="text-xs text-muted-foreground mr-1">Significance:</span>
              {Array.from({ length: Math.min(event.significance, 10) }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 text-primary fill-primary" />
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">{event.title}</h1>

          {/* Structured content sections */}
          <div className="space-y-8">
            {sections.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              >
                {sections.length > 1 && (
                  <div className="flex items-center gap-2 mb-3">
                    {sectionIcons[s.section] || <BookOpen className="h-4 w-4 text-primary" />}
                    <h2 className="text-lg font-display font-semibold text-foreground">{s.section}</h2>
                  </div>
                )}
                <div className="space-y-3 pl-0 md:pl-6 border-l-0 md:border-l-2 border-primary/20">
                  {s.content.split("\n\n").filter(Boolean).map((p, j) => (
                    <p key={j} className="text-muted-foreground leading-relaxed text-base md:text-lg md:pl-4">{p}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {event.tags.map((tag) => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}>
                  <Badge variant="outline" className="text-xs hover:bg-primary/10 cursor-pointer">{tag}</Badge>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Key Figures */}
        {figures && figures.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="mt-12">
            <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />Key Figures
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {figures.map((ef) => (
                <Link key={ef.figure.id} to={`/knowledge-graph/figure/${ef.figure.id}`} className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-all group">
                  {ef.figure.image_url ? (
                    <img src={ef.figure.image_url} alt="" className="w-12 h-12 rounded-full object-cover" />
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} className="mt-12">
            <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />Media Gallery
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {media.map((em) => (
                <div key={em.media.id} className="rounded-lg overflow-hidden border border-border bg-card hover:border-primary/30 transition-all">
                  <img src={em.media.thumbnail_url || em.media.url} alt={em.media.title || ""} className="w-full aspect-video object-cover" />
                  {em.media.title && (
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground truncate">{em.media.title}</p>
                      {em.media.description && <p className="text-[10px] text-muted-foreground truncate">{em.media.description}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="mt-12">
            <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />Related Events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedEvents.slice(0, 6).map((re: any) => (
                <Link key={re.id} to={`/event/${re.id}`} className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-all group">
                  {re.image_url && (
                    <img src={re.image_url} alt="" className="w-full h-28 object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{re.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {re.year_label && <span className="text-[10px] text-muted-foreground">{re.year_label}</span>}
                      {re.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{re.category}</Badge>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
          <Link to="/archive" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />Back to Archive
          </Link>
          {event.time_period && (
            <Link to={`/era/${event.time_period.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              View {event.time_period.name} →
            </Link>
          )}
        </div>
      </div>
    </div>
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
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/archive" className="hover:text-primary transition-colors">Archive</Link>
          <span>/</span>
          {era && (
            <>
              <Link to={`/era/${era.id}`} className="hover:text-primary transition-colors">{era.name}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{event.title}</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {allImages.length > 0 && (
            <ImageSlideshow images={allImages} sourceLinks={event.sourceLinks} alt={event.title} className="mb-8" />
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: `hsl(${categoryColor})` }}>
              <Tag className="h-3 w-3" />{categoryLabels[event.category]}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />{event.yearLabel}
            </span>
            {era && (
              <Link to={`/era/${era.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                <MapPin className="h-3.5 w-3.5" />{era.name}
              </Link>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">{event.title}</h1>

          <div className="space-y-8">
            {sections.map((s, i) => (
              <div key={i}>
                {sections.length > 1 && (
                  <div className="flex items-center gap-2 mb-3">
                    {sectionIcons[s.section] || <BookOpen className="h-4 w-4 text-primary" />}
                    <h2 className="text-lg font-display font-semibold text-foreground">{s.section}</h2>
                  </div>
                )}
                <div className="space-y-3 pl-0 md:pl-6 border-l-0 md:border-l-2 border-primary/20">
                  {s.content.split("\n\n").filter(Boolean).map((p, j) => (
                    <p key={j} className="text-muted-foreground leading-relaxed text-base md:text-lg md:pl-4">{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {event.sourceLinks && event.sourceLinks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-10">
            <h2 className="text-xl font-display font-semibold text-foreground mb-4">Learn More</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.sourceLinks.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-all group">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{link.label}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mt-12 pt-8 border-t border-border">
          <Link to={era ? `/era/${era.id}` : "/archive"} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />Back to {era ? era.name : "Archive"}
          </Link>
        </div>
      </div>
    </div>
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
