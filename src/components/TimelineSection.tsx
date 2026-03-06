import { eras, type HistoricalEra } from "@/data/historicalData";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function TimelineSection() {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Journey Through Time
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore 4.6 billion years of history — from Earth's fiery birth to the digital age
          </p>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 timeline-line hidden md:block" />

          <div className="space-y-6 md:space-y-0">
            {eras.map((era, index) => (
              <TimelineEraCard key={era.id} era={era} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineEraCard({ era, index }: { era: HistoricalEra; index: number }) {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`md:flex items-center md:py-6 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
    >
      <div className={`md:w-1/2 ${isLeft ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
        <Link
          to={`/era/${era.id}`}
          className="block group"
        >
          <div className="bg-card-gradient border border-border rounded-lg p-6 shadow-card hover:border-primary/40 transition-all duration-300 group-hover:shadow-dramatic">
            <div className="flex items-center gap-3 mb-2" style={{ justifyContent: isLeft ? "flex-end" : "flex-start" }}>
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: `hsl(${era.color})` }}
              />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {era.period}
              </span>
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
              {era.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {era.description}
            </p>
            <div className="mt-3 text-xs text-primary font-medium">
              {era.events.length} key events →
            </div>
          </div>
        </Link>
      </div>

      {/* Center dot */}
      <div className="hidden md:flex items-center justify-center w-0 relative">
        <div
          className="w-4 h-4 rounded-full border-2 border-background z-10"
          style={{ backgroundColor: `hsl(${era.color})` }}
        />
      </div>

      <div className="md:w-1/2" />
    </motion.div>
  );
}
