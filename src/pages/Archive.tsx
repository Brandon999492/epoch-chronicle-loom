import { Header } from "@/components/Header";
import { eras } from "@/data/historicalData";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Archive = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-4xl font-display font-bold text-foreground mb-3">History Archive</h1>
            <p className="text-muted-foreground max-w-2xl">
              Browse every era of Earth's history. Select an era to explore its key events, discoveries, and pivotal moments.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {eras.map((era, i) => (
              <motion.div
                key={era.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/era/${era.id}`}
                  className="block bg-card-gradient border border-border rounded-lg p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-card h-full group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${era.color})` }} />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{era.period}</span>
                  </div>
                  <h2 className="text-xl font-display font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                    {era.name}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{era.description}</p>
                  <span className="text-xs text-primary font-medium">{era.events.length} events →</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;
