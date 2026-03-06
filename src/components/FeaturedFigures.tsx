import { featuredFigures } from "@/data/historicalData";
import { motion } from "framer-motion";
import { User } from "lucide-react";

export function FeaturedFigures() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Featured Historical Figures
          </h2>
          <p className="text-muted-foreground">Leaders, thinkers, and visionaries who shaped our world</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredFigures.map((figure, i) => (
            <motion.div
              key={figure.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-card-gradient border border-border rounded-lg p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-card"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{figure.name}</h3>
                  <p className="text-xs text-primary font-medium mb-1">{figure.role}</p>
                  <p className="text-xs text-muted-foreground mb-2">{figure.born} – {figure.died}</p>
                  <p className="text-sm text-muted-foreground">{figure.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
