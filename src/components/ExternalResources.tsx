import { motion } from "framer-motion";
import { ExternalLink, Newspaper } from "lucide-react";

const resources = [
  { name: "Smithsonian National Museum of American History", url: "https://americanhistory.si.edu", desc: "Explore America's heritage through collections and exhibits.", type: "museum" },
  { name: "The British Museum", url: "https://www.britishmuseum.org", desc: "Two million years of human history and culture.", type: "museum" },
  { name: "World History Encyclopedia", url: "https://www.worldhistory.org", desc: "Free, reliable history articles reviewed by scholars.", type: "encyclopedia" },
  { name: "National Geographic History", url: "https://www.nationalgeographic.com/history", desc: "Stories and discoveries from across the ages.", type: "magazine" },
  { name: "Khan Academy – World History", url: "https://www.khanacademy.org/humanities/world-history", desc: "Free courses covering world history from origins to present.", type: "education" },
  { name: "History.com", url: "https://www.history.com", desc: "Articles, videos, and timelines on historical events.", type: "news" },
];

const newsLinks = [
  { name: "BBC History", url: "https://www.bbc.co.uk/history", desc: "In-depth articles and programmes from BBC's history department." },
  { name: "The Guardian – History", url: "https://www.theguardian.com/books/history", desc: "Historical reviews, longform features, and book coverage." },
  { name: "History Today", url: "https://www.historytoday.com", desc: "Award-winning monthly history magazine since 1951." },
  { name: "Smithsonian Magazine – History", url: "https://www.smithsonianmag.com/history/", desc: "Fascinating stories from one of the world's greatest museums." },
  { name: "Ancient Origins", url: "https://www.ancient-origins.net", desc: "Reconstructing the story of humanity's past through ancient discoveries." },
  { name: "Atlas Obscura", url: "https://www.atlasobscura.com", desc: "The definitive guide to the world's hidden wonders and curious places." },
  { name: "Archaeology Magazine", url: "https://www.archaeology.org", desc: "Publication of the Archaeological Institute of America." },
  { name: "LiveScience – History", url: "https://www.livescience.com/history", desc: "Latest discoveries and findings in historical research." },
  { name: "Past Horizons", url: "https://www.pasthorizonspr.com", desc: "Online magazine covering archaeology and heritage worldwide." },
];

export function ExternalResources() {
  return (
    <section className="py-16 bg-secondary/20">
      <div className="container mx-auto px-4">
        {/* Research Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Research Resources
          </h2>
          <p className="text-muted-foreground">Trusted sources for further research and exploration</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {resources.map((r, i) => (
            <motion.a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 bg-card-gradient border border-border rounded-lg p-5 hover:border-primary/30 transition-all group"
            >
              <ExternalLink className="h-4 w-4 text-primary mt-1 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{r.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{r.type}</span>
              </div>
            </motion.a>
          ))}
        </div>

        {/* History News Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Newspaper className="h-6 w-6 text-primary" />
            History News & Publications
          </h2>
          <p className="text-muted-foreground">Stay up to date with the latest historical discoveries and articles</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newsLinks.map((r, i) => (
            <motion.a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 bg-card-gradient border border-border rounded-lg p-5 hover:border-primary/30 transition-all group"
            >
              <Newspaper className="h-4 w-4 text-primary mt-1 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{r.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
