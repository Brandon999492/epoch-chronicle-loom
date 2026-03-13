import { Header } from "@/components/Header";
import { TimelineSection } from "@/components/TimelineSection";
import { OnThisDay } from "@/components/OnThisDay";
import { FeaturedFigures } from "@/components/FeaturedFigures";
import { ExternalResources } from "@/components/ExternalResources";
import { TrendingTopics, FeaturedEventsCarousel } from "@/components/TrendingAndCarousel";
import { SearchBar } from "@/components/SearchBar";
import { motion } from "framer-motion";
import { ArrowDown, Globe } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const quickTags = [
  { label: "Ancient World", era: "ancient" },
  { label: "Medieval", era: "medieval" },
  { label: "British Royals", link: "/royals" },
  { label: "World Wars", search: "World War" },
  { label: "Space Age", search: "Moon" },
  { label: "Dinosaurs", era: "mesozoic" },
  { label: "Assassinations", search: "Assassination" },
  { label: "Scientific Breakthroughs", search: "Theory" },
];

const Index = () => {
  const navigate = useNavigate();

  const handleTag = (tag: typeof quickTags[0]) => {
    if ((tag as any).link) {
      navigate((tag as any).link);
    } else if (tag.era) {
      navigate(`/era/${tag.era}`);
    } else if (tag.search) {
      navigate(`/search?q=${encodeURIComponent(tag.search)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Historical montage spanning ancient ruins to modern cities" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-hero-gradient opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              <span className="text-foreground">Explore the </span>
              <span className="text-gold-gradient">Complete Story</span>
              <br />
              <span className="text-foreground">of Our World</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              From Earth's formation 4.6 billion years ago to today — discover every era, event, and figure that shaped human civilization.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex justify-center mb-12">
            <SearchBar />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }} className="flex flex-wrap justify-center gap-2">
            {quickTags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => handleTag(tag)}
                className="px-3 py-1.5 rounded-full bg-secondary/60 border border-border text-xs text-secondary-foreground hover:bg-primary/10 hover:border-primary/30 cursor-pointer transition-all"
              >
                {tag.label}
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ArrowDown className="h-5 w-5 text-muted-foreground animate-bounce" />
        </motion.div>
      </section>

      {/* Featured Events Carousel */}
      <FeaturedEventsCarousel />

      {/* On This Day */}
      <OnThisDay />

      {/* Trending Topics */}
      <TrendingTopics />

      {/* Timeline */}
      <TimelineSection />

      {/* History Map Preview */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Globe className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Explore History by Location
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Discover historical events around the world with the interactive map. Filter by era, category, and time period to see how history unfolded across the globe.
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/map">Open History Map</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Figures */}
      <FeaturedFigures />

      {/* External Resources & News */}
      <ExternalResources />

      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="font-display text-lg text-foreground mb-2">Universal History Archive</p>
          <p className="text-sm text-muted-foreground">
            Documenting the complete story of our world — from Earth's formation to today.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
