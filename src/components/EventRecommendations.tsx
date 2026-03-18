import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Sparkles, Calendar } from "lucide-react";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-api`;
const headers = { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" };

interface Props {
  eventId: string;
  tags?: string[];
  category?: string;
  timePeriodId?: string | null;
}

export function EventRecommendations({ eventId, tags, category, timePeriodId }: Props) {
  const { data: recommendations } = useQuery({
    queryKey: ["event-recommendations", eventId],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/recommendations?event_id=${eventId}`, { headers });
      if (!resp.ok) return [];
      return resp.json();
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!eventId,
  });

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-12">
      <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" /> You May Also Be Interested In
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recommendations.slice(0, 6).map((event: any) => (
          <Link key={event.id} to={`/event/${event.id}`} className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-all group">
            {event.image_url && (
              <img src={event.image_url} alt="" className="w-full h-28 object-cover" />
            )}
            <div className="p-3">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{event.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {event.year_label && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Calendar className="h-3 w-3" />{event.year_label}</span>}
                {event.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{event.category}</Badge>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
