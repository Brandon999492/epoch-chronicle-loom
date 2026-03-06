import { Header } from "@/components/Header";
import { royalHouses, allRoyals } from "@/data/royals";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, ArrowLeft } from "lucide-react";
import { useState } from "react";

const RoyalFamilyTree = () => {
  const [selectedHouse, setSelectedHouse] = useState<string>("all");

  const houses = selectedHouse === "all" ? royalHouses : royalHouses.filter((h) => h.id === selectedHouse);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/royals" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Royal Archive
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Royal Family Tree</h1>
            <p className="text-muted-foreground mb-6">Visual succession timeline across all British royal houses.</p>

            {/* House filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setSelectedHouse("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedHouse === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}
              >
                All Houses
              </button>
              {royalHouses.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHouse(h.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedHouse === h.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}
                >
                  {h.name.replace("House of ", "").replace("Anglo-Saxon Kings", "Anglo-Saxon")}
                </button>
              ))}
            </div>

            {/* Timeline Tree */}
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 timeline-line" />

              <div className="space-y-8">
                {houses.map((house) => (
                  <div key={house.id}>
                    {/* House header */}
                    <div className="relative flex items-center gap-4 mb-4 ml-0">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center z-10 shrink-0"
                        style={{ backgroundColor: `hsl(${house.color} / 0.2)`, border: `2px solid hsl(${house.color})` }}
                      >
                        <Crown className="h-5 w-5" style={{ color: `hsl(${house.color})` }} />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-bold text-foreground">{house.name}</h2>
                        <p className="text-xs text-muted-foreground">{house.period}</p>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="ml-14 space-y-2">
                      {house.members.filter((m) => m.isMonarch).map((royal) => (
                        <Link
                          key={royal.id}
                          to={`/royals/${house.id}/${royal.id}`}
                          className="flex items-center gap-3 bg-card-gradient border border-border rounded-lg p-3 hover:border-primary/40 transition-all group"
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${house.color})` }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {royal.name}
                              </span>
                              {royal.nicknames[0] && (
                                <span className="text-xs text-accent italic hidden sm:inline">"{royal.nicknames[0]}"</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {royal.reignStart} – {royal.reignEnd || "Present"}
                              {royal.reignLength && ` (${royal.reignLength})`}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground hidden md:block max-w-xs truncate">{royal.causeOfDeath}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoyalFamilyTree;
