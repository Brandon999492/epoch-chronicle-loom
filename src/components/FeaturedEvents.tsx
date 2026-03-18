import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) return null;

  // Rotate: pick based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const startIdx = dayOfYear % Math.max(1, events.length - 5);
  const displayed = events.slice(startIdx, startIdx + 6).length >= 3
    ? events.slice(startIdx, startIdx + 6)
    : events.slice(0, 6);

  return (
    <section className="py-16 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
            <span className="text-xs font-medium text-primary">Featured</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Defining Moments in History
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            The most significant events that shaped civilizations and changed the course of human history.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link
                to={`/event/${event.id}`}
                className="block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg group h-full"
              >
                {event.image_url ? (
                  <div className="relative h-40 overflow-hidden">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    {event.significance && event.significance >= 8 && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary/90 text-primary-foreground text-[10px]">
                          <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />Major
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Star className="h-8 w-8 text-primary/30" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
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
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{event.description}</p>
                  )}
                  {event.category && (
                    <Badge variant="outline" className="text-[10px] mt-3 capitalize">{event.category}</Badge>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/archive" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            Explore All Events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
