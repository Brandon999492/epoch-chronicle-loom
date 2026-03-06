import { getOnThisDay, categoryLabels, type HistoricalEvent } from "@/data/historicalData";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { fixWikimediaUrl } from "@/lib/imageUtils";

export function OnThisDay() {
  const events = getOnThisDay();
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-8"
        >
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            On This Day — {dateStr}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {events.map((event, i) => (
            <OnThisDayCard key={event.id} event={event} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OnThisDayCard({ event, index }: { event: HistoricalEvent; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link
        to={`/event/${event.id}`}
        className="block bg-card-gradient border border-border rounded-lg p-5 hover:border-primary/40 transition-all duration-300 hover:shadow-card h-full"
      >
        {event.imageUrl && (
          <img src={fixWikimediaUrl(event.imageUrl, event.sourceLinks)} alt={event.title} className="w-full h-32 object-cover rounded-md mb-3" loading="lazy" referrerPolicy="no-referrer" />
        )}
        <span className="text-xs font-medium text-primary mb-1 block">{event.yearLabel}</span>
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">{event.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
        <span className="inline-block mt-3 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
          {categoryLabels[event.category]}
        </span>
      </Link>
    </motion.div>
  );
}
