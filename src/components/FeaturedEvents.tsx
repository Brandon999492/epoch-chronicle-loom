import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Calendar, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { historyImageUrl } from "@/lib/imageUtils";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-api`;

interface FeaturedEvent {
  id: string;
  title: string;
  slug: string | null;
  year_label: string | null;
  category: string | null;
  significance: number | null;
  image_url: string | null;
  description: string | null;
  location: { name: string } | null;
  time_period: { name: string } | null;
}

function useFeaturedEvents() {
  return useQuery<FeaturedEvent[]>({
    queryKey: ["featured-events"],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/featured-events`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      });
      if (!resp.ok) return [];
      return resp.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function FeaturedEvents() {
  const { data: events, isLoading } = useFeaturedEvents();

  if (isLoading) {
    return (
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mx-auto mb-10 skeleton-shimmer" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-2xl skeleton-shimmer" />)}
          </div>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) return null;

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const startIdx = dayOfYear % Math.max(1, events.length - 5);
  const displayed = events.slice(startIdx, startIdx + 6).length >= 3
    ? events.slice(startIdx, startIdx + 6)
    : events.slice(0, 6);

  return (
    <section className="py-20 border-t border-border/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-float" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">Featured</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Defining Moments in History
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
            The most significant events that shaped civilizations and changed the course of human history.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link
                to={`/event/${event.id}`}
                className="card-premium block overflow-hidden h-full group"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={historyImageUrl(event.image_url, event.title) ?? ""}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  {event.significance && event.significance >= 8 && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-primary/90 text-primary-foreground text-[10px] shadow-glow">
                        <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />Major
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2.5 text-base">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    {event.year_label && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{event.year_label}
                      </span>
                    )}
                    {event.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{event.location.name}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{event.description}</p>
                  )}
                  {event.category && (
                    <span className={`inline-block mt-3 text-[10px] font-semibold uppercase tracking-wider cat-${event.category}`}>
                      {event.category}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group">
            Explore All Events
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
