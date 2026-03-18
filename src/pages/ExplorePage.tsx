import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Compass, Shuffle, Swords, FlaskConical, Crown, Landmark, BookOpen,
  Globe, Sparkles, Calendar, MapPin, Star, ArrowRight, Palette, Scale,
  Heart, Lightbulb, Flame, Ship, Atom, Music
} from "lucide-react";
import { useState } from "react";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-api`;
const headers = { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" };

const categoryMeta: Record<string, { icon: React.ReactNode; cssClass: string; description: string }> = {
  war: { icon: <Swords className="h-5 w-5" />, cssClass: "cat-war", description: "Battles, conflicts, and military campaigns" },
  science: { icon: <FlaskConical className="h-5 w-5" />, cssClass: "cat-science", description: "Discoveries, inventions, and breakthroughs" },
  monarchy: { icon: <Crown className="h-5 w-5" />, cssClass: "cat-monarchy", description: "Kings, queens, and royal dynasties" },
  politics: { icon: <Landmark className="h-5 w-5" />, cssClass: "cat-politics", description: "Governance, treaties, and revolutions" },
  culture: { icon: <Palette className="h-5 w-5" />, cssClass: "cat-culture", description: "Art, literature, and cultural movements" },
  religion: { icon: <BookOpen className="h-5 w-5" />, cssClass: "cat-religion", description: "Faith, philosophy, and spiritual movements" },
  exploration: { icon: <Ship className="h-5 w-5" />, cssClass: "cat-exploration", description: "Voyages, expeditions, and discoveries" },
  technology: { icon: <Atom className="h-5 w-5" />, cssClass: "cat-technology", description: "Engineering, computing, and innovation" },
  general: { icon: <Globe className="h-5 w-5" />, cssClass: "cat-general", description: "General historical events" },
  disaster: { icon: <Flame className="h-5 w-5" />, cssClass: "cat-disaster", description: "Natural disasters and catastrophes" },
  law: { icon: <Scale className="h-5 w-5" />, cssClass: "cat-law", description: "Legal milestones and justice" },
  medicine: { icon: <Heart className="h-5 w-5" />, cssClass: "cat-medicine", description: "Medical advances and health" },
  philosophy: { icon: <Lightbulb className="h-5 w-5" />, cssClass: "cat-philosophy", description: "Ideas that changed the world" },
  arts: { icon: <Music className="h-5 w-5" />, cssClass: "cat-arts", description: "Music, performance, and visual arts" },
};

function useCategories() {
  return useQuery({
    queryKey: ["explore-categories"],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/categories`, { headers });
      if (!resp.ok) return [];
      return resp.json() as Promise<{ name: string; count: number }[]>;
    },
    staleTime: 10 * 60 * 1000,
  });
}

function useTimePeriods() {
  return useQuery({
    queryKey: ["explore-periods"],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/timeline`, { headers });
      if (!resp.ok) return [];
      return resp.json();
    },
    staleTime: 30 * 60 * 1000,
  });
}

function useFeaturedEvents() {
  return useQuery({
    queryKey: ["explore-featured"],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/featured-events`, { headers });
      if (!resp.ok) return [];
      return resp.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useRandomEvent() {
  const [key, setKey] = useState(0);
  const query = useQuery({
    queryKey: ["random-event", key],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/random-event`, { headers });
      if (!resp.ok) return null;
      return resp.json();
    },
    staleTime: 0,
    enabled: key > 0,
  });
  return { ...query, discover: () => setKey((k) => k + 1) };
}

const ExplorePage = () => {
  const navigate = useNavigate();
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: periods, isLoading: periodLoading } = useTimePeriods();
  const { data: featured } = useFeaturedEvents();
  const { data: randomEvent, isLoading: randomLoading, discover } = useRandomEvent();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Compass className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Explore History
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse by category, era, or topic — or discover something unexpected.
            </p>
          </motion.div>

          {/* Random Discovery */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-16">
            <Card className="bg-gradient-to-br from-primary/5 via-card to-accent/5 border-primary/20">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="flex-1">
                    <h2 className="text-xl font-display font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Shuffle className="h-5 w-5 text-primary" /> Discover Something New
                    </h2>
                    {randomEvent ? (
                      <div className="mt-3">
                        <Link to={`/event/${randomEvent.id}`} className="text-lg font-medium text-primary hover:underline">
                          {randomEvent.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          {randomEvent.year_label && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{randomEvent.year_label}</span>}
                          {randomEvent.category && <Badge variant="outline" className="capitalize text-xs">{randomEvent.category}</Badge>}
                        </div>
                        {randomEvent.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{randomEvent.description}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click the button to discover a random historical event from our database.</p>
                    )}
                  </div>
                  <Button onClick={discover} disabled={randomLoading} className="shrink-0">
                    <Shuffle className="h-4 w-4 mr-2" />
                    {randomLoading ? "Loading..." : "Random Event"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Categories */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-16">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Browse by Category
            </h2>
            {catLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(categories || []).map((cat) => {
                  const meta = categoryMeta[cat.name] || categoryMeta.general;
                  return (
                    <Link
                      key={cat.name}
                      to={`/category/${cat.name}`}
                      className={`group card-premium p-5 bg-cat-${cat.name}/10 border-cat-${cat.name}`}
                    >
                      <div className={`mb-3 ${meta.cssClass}`}>{meta.icon}</div>
                      <h3 className="font-medium text-foreground capitalize group-hover:text-primary transition-colors">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{cat.count} events</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 hidden sm:block">{meta.description}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Eras */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-16">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Browse by Era
            </h2>
            {periodLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {(periods || []).filter((p: any) => !p.parent_period_id).map((period: any) => (
                  <Link
                    key={period.id}
                    to={`/era/${period.id}`}
                    className="card-premium flex items-center justify-between px-5 py-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Landmark className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{period.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {period.start_label || period.start_year} — {period.end_label || period.end_year || "Present"}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Featured Topics */}
          {featured && featured.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-16">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary fill-primary" /> Featured Moments
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.slice(0, 9).map((event: any) => (
                  <Link key={event.id} to={`/event/${event.id}`} className="card-premium overflow-hidden group block">
                    {event.image_url && (
                      <div className="overflow-hidden">
                        <img src={event.image_url} alt="" className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{event.title}</h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {event.year_label && <span className="text-xs text-muted-foreground">{event.year_label}</span>}
                        {event.category && <span className={`text-[10px] font-semibold uppercase tracking-wider cat-${event.category}`}>{event.category}</span>}
                      </div>
                      {event.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{event.description}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quick Links */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">Quick Navigation</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Interactive Map", path: "/map", icon: <MapPin className="h-5 w-5" /> },
                { label: "Full Timeline", path: "/timeline", icon: <Calendar className="h-5 w-5" /> },
                { label: "Knowledge Graph", path: "/knowledge-graph", icon: <Globe className="h-5 w-5" /> },
                { label: "British Royals", path: "/royals", icon: <Crown className="h-5 w-5" /> },
              ].map((link) => (
                <Link key={link.path} to={link.path} className="card-premium flex flex-col items-center gap-3 p-6 text-muted-foreground hover:text-primary group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    {link.icon}
                  </div>
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
