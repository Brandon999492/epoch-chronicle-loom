import { allEvents, type HistoricalEvent } from "@/data/historicalData";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";

// Curated trending topics
const trendingTopics = [
  { label: "Ancient Egypt", search: "Pyramid" },
  { label: "Roman Empire", search: "Roman" },
  { label: "World War II", search: "World War II" },
  { label: "Moon Landing", search: "Moon" },
  { label: "Renaissance", search: "Renaissance" },
  { label: "Evolution", search: "Evolution" },
  { label: "Black Death", search: "Black Death" },
  { label: "Industrial Revolution", search: "Industrial" },
];

export function TrendingTopics() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-6"
        >
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
            Trending Topics
          </h2>
        </motion.div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {trendingTopics.map((topic, i) => (
            <motion.div
              key={topic.label}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/search?q=${encodeURIComponent(topic.search)}`}
                className="block whitespace-nowrap px-5 py-3 rounded-full bg-card-gradient border border-border text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                {topic.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedEventsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Pick a curated set of major events
  const featured = allEvents.filter((e) =>
    ["e19", "e24", "e31", "e37", "e44", "e47", "e49", "e50"].includes(e.id)
  );

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
            Featured Events
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Pivotal moments that changed the course of history</p>
        </motion.div>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {featured.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="shrink-0 w-72"
            >
              <Link
                to={`/era/${event.era}`}
                className="block bg-card-gradient border border-border rounded-xl p-5 h-full hover:border-primary/40 hover:shadow-card transition-all group"
              >
                <span className="text-xs font-medium text-primary">{event.yearLabel}</span>
                <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors mt-1 mb-2">
                  {event.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
