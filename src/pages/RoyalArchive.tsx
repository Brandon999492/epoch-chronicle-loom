import { Header } from "@/components/Header";
import { royalHouses } from "@/data/royals";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Crown } from "lucide-react";
import { useState, useMemo } from "react";

const RoyalArchive = () => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return royalHouses;
    const q = query.toLowerCase();
    return royalHouses.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.members.some((m) => m.name.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <Crown className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-display font-bold text-foreground">British Royal Family Archive</h1>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              A comprehensive historical database of every British royal house, from the Anglo-Saxon kings to the modern House of Windsor.
            </p>

            <div className="relative max-w-md mb-10">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dynasties or royals..."
                className="w-full rounded-lg bg-secondary/80 border border-border px-12 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-body"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((house, i) => (
                <motion.div
                  key={house.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/royals/${house.id}`}
                    className="block bg-card-gradient border border-border rounded-xl p-6 hover:border-primary/40 transition-all group"
                  >
                    <div
                      className="w-10 h-10 rounded-full mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `hsl(${house.color} / 0.2)`, border: `1px solid hsl(${house.color} / 0.4)` }}
                    >
                      <Crown className="h-5 w-5" style={{ color: `hsl(${house.color})` }} />
                    </div>
                    <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {house.name}
                    </h2>
                    <p className="text-xs text-primary font-medium mt-1">{house.period}</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{house.description}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {house.members.length} {house.members.length === 1 ? "member" : "members"}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/royals/family-tree"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                <Crown className="h-4 w-4" />
                View Interactive Family Tree
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoyalArchive;
