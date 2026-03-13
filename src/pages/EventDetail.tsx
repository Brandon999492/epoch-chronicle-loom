import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Calendar, Tag, MapPin, Users, Globe, Landmark, Loader2 } from "lucide-react";
import { useEvent, useEventFigures, useEventMedia } from "@/hooks/useHistoryData";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, isError } = useEvent(eventId);
  const { data: figures } = useEventFigures(eventId);
  const { data: media } = useEventMedia(eventId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 pb-16 container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full rounded-xl mb-6" />
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/archive" className="hover:text-primary transition-colors">Archive</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{event.title}</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Hero image */}
            {event.image_url && (
              <div className="rounded-xl overflow-hidden mb-8 border border-border">
                <img src={event.image_url} alt={event.title} className="w-full max-h-96 object-cover" />
              </div>
            )}

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {event.category && (
                <Badge variant="secondary" className="capitalize">
                  <Tag className="h-3 w-3 mr-1" />
                  {event.category}
                </Badge>
              )}
              {event.year_label && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {event.year_label}
                  {event.end_year_label && ` – ${event.end_year_label}`}
                </span>
              )}
              {event.location && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location.name}
                </span>
              )}
              {event.civilization && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  {event.civilization.name}
                </span>
              )}
              {event.time_period && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Landmark className="h-3.5 w-3.5" />
                  {event.time_period.name}
                </span>
              )}
            </div>

            {/* Significance */}
            {event.significance && (
              <div className="flex items-center gap-1 mb-4">
                <span className="text-xs text-muted-foreground">Significance:</span>
                {Array.from({ length: event.significance }).map((_, i) => (
                  <span key={i} className="text-primary text-xs">★</span>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              {event.title}
            </h1>

            {/* Description */}
            <div className="max-w-none space-y-4">
              {(event.detailed_description || event.description || "")
                .split("\n\n")
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed text-base md:text-lg">
                    {paragraph}
                  </p>
                ))}
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </motion.div>

          {/* Related Figures */}
          {figures && figures.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-10"
            >
              <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Key Figures
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {figures.map((ef) => (
                  <Link
                    key={ef.figure.id}
                    to={`/knowledge-graph/figure/${ef.figure.id}`}
                    className="flex items-center gap-3 bg-card-gradient border border-border rounded-lg p-4 hover:border-primary/40 transition-all group"
                  >
                    {ef.figure.image_url ? (
                      <img src={ef.figure.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {ef.figure.name}
                      </p>
                      {ef.role && <p className="text-xs text-primary">{ef.role}</p>}
                      {ef.figure.title && <p className="text-xs text-muted-foreground truncate">{ef.figure.title}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Media */}
          {media && media.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-10"
            >
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">Media</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {media.map((em) => (
                  <div key={em.media.id} className="rounded-lg overflow-hidden border border-border">
                    <img
                      src={em.media.thumbnail_url || em.media.url}
                      alt={em.media.title || ""}
                      className="w-full aspect-video object-cover"
                    />
                    {em.media.title && (
                      <p className="text-xs text-muted-foreground p-2 truncate">{em.media.title}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Back nav */}
          <div className="mt-12 pt-8 border-t border-border">
            <Link
              to="/archive"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Archive
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
