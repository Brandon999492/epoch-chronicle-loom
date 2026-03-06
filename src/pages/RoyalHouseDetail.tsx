import { Header } from "@/components/Header";
import { useParams, Link } from "react-router-dom";
import { getHouseById } from "@/data/royals";
import { fixWikimediaUrl } from "@/lib/imageUtils";
import { motion } from "framer-motion";
import { Crown, ArrowLeft } from "lucide-react";
import { useState, useMemo } from "react";

const sortOptions = [
  { value: "chronological", label: "Chronological" },
  { value: "reign", label: "Reign Length" },
  { value: "death", label: "Cause of Death" },
];

const RoyalHouseDetail = () => {
  const { houseId } = useParams<{ houseId: string }>();
  const house = getHouseById(houseId || "");
  const [sort, setSort] = useState("chronological");
  const [filter, setFilter] = useState("all");

  const members = useMemo(() => {
    if (!house) return [];
    let list = [...house.members];
    if (filter === "monarchs") list = list.filter((m) => m.isMonarch);
    if (filter === "executed") list = list.filter((m) => m.causeOfDeath.toLowerCase().includes("execut") || m.causeOfDeath.toLowerCase().includes("murder") || m.causeOfDeath.toLowerCase().includes("killed"));
    if (filter === "child") list = list.filter((m) => (m.ageAtDeath ?? 100) < 18 || m.reignStart?.includes("age"));

    if (sort === "reign") {
      list.sort((a, b) => {
        const getYears = (r: string | undefined) => {
          if (!r) return 0;
          const match = r.match(/(\d+)\s*year/);
          return match ? parseInt(match[1]) : 0;
        };
        return getYears(b.reignLength) - getYears(a.reignLength);
      });
    }
    return list;
  }, [house, sort, filter]);

  if (!house) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 pb-16 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-display text-foreground">House not found</h1>
          <Link to="/royals" className="text-primary mt-4 inline-block">← Back to Royal Archive</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/royals" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Royal Archive
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `hsl(${house.color} / 0.2)`, border: `1px solid hsl(${house.color} / 0.4)` }}
              >
                <Crown className="h-5 w-5" style={{ color: `hsl(${house.color})` }} />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">{house.name}</h1>
                <p className="text-sm text-primary">{house.period}</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-8 max-w-3xl">{house.description}</p>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 mb-8">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {["all", "monarchs", "executed", "child"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}
                >
                  {f === "all" ? "All" : f === "monarchs" ? "Monarchs Only" : f === "executed" ? "Violent Deaths" : "Child Monarchs"}
                </button>
              ))}
            </div>

            {/* Member Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((royal, i) => (
                <motion.div key={royal.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link
                    to={`/royals/${houseId}/${royal.id}`}
                    className="flex gap-4 bg-card-gradient border border-border rounded-xl p-4 hover:border-primary/40 transition-all group"
                  >
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                      <img
                        src={fixWikimediaUrl(royal.imageUrl, royal.sourceLinks)}
                        alt={royal.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {royal.name}
                      </h3>
                      {royal.reignStart && (
                        <p className="text-xs text-primary mt-0.5">{royal.reignStart} – {royal.reignEnd || "Present"}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{royal.description}</p>
                      {royal.nicknames.length > 0 && (
                        <p className="text-xs text-accent mt-1 italic">"{royal.nicknames[0]}"</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoyalHouseDetail;
