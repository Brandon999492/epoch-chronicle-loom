import { Header } from "@/components/Header";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/services/searchApi";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Users, Scroll, Landmark, Globe, MapPin, Image as ImageIcon,
  Network, ChevronRight, Calendar, Swords, Crown, Heart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const relationshipIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("parent") || t.includes("child") || t.includes("sibling") || t.includes("family")) return Crown;
  if (t.includes("rival") || t.includes("enemy") || t.includes("opponent")) return Swords;
  if (t.includes("ally") || t.includes("spouse") || t.includes("married")) return Heart;
  return Users;
};

// ===== Event Graph View =====
const EventGraphView = ({ id }: { id: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["graph-event", id],
    queryFn: () => searchApi.graph.event(id),
  });

  if (isLoading) return <GraphSkeleton />;
  if (error || !data) return <p className="text-destructive text-center py-10">Failed to load event data.</p>;

  const event = data.entity;

  return (
    <div className="space-y-8">
      {/* Entity Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card-gradient border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          {event.image_url && (
            <img src={event.image_url} alt="" className="w-20 h-20 rounded-lg object-cover hidden sm:block" />
          )}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline"><Scroll className="h-3 w-3 mr-1" />Event</Badge>
              {event.category && <Badge variant="secondary" className="capitalize">{event.category}</Badge>}
              {event.year_label && <span className="text-sm text-primary font-medium">{event.year_label}</span>}
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">{event.title}</h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">{event.description}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              {event.location?.name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location.name}</span>}
              {event.time_period?.name && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.time_period.name}</span>}
              {event.civilization?.name && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{event.civilization.name}</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Connected Figures */}
      {data.figures.length > 0 && (
        <GraphSection title="Key Figures" icon={Users} count={data.figures.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.figures.map((ef: any) => (
              <Link
                key={ef.figure?.id}
                to={`/knowledge-graph/figure/${ef.figure?.id}`}
                className="bg-secondary/40 border border-border rounded-lg p-4 hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  {ef.figure?.image_url ? (
                    <img src={ef.figure.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{ef.figure?.name}</p>
                    {ef.role && <p className="text-xs text-primary">{ef.role}</p>}
                    {ef.figure?.title && <p className="text-xs text-muted-foreground">{ef.figure.title}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </GraphSection>
      )}

      {/* Related Events */}
      {data.related_events.length > 0 && (
        <GraphSection title="Related Events" icon={Scroll} count={data.related_events.length}>
          <div className="space-y-2">
            {data.related_events.map((re: any) => (
              <Link
                key={re.id}
                to={`/knowledge-graph/event/${re.id}`}
                className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-all group"
              >
                <Scroll className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{re.title}</p>
                  {re.year_label && <p className="text-xs text-muted-foreground">{re.year_label}</p>}
                </div>
                {re.category && <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{re.category}</Badge>}
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </GraphSection>
      )}

      {/* Media */}
      {data.media.length > 0 && (
        <GraphSection title="Media" icon={ImageIcon} count={data.media.length}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.media.map((em: any) => (
              <div key={em.media?.id} className="rounded-lg overflow-hidden border border-border">
                <img src={em.media?.thumbnail_url || em.media?.url} alt={em.media?.title || ""} className="w-full aspect-video object-cover" />
                {em.media?.title && <p className="text-xs text-muted-foreground p-2 truncate">{em.media.title}</p>}
              </div>
            ))}
          </div>
        </GraphSection>
      )}
    </div>
  );
};

// ===== Figure Graph View =====
const FigureGraphView = ({ id }: { id: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["graph-figure", id],
    queryFn: () => searchApi.graph.figure(id),
  });

  if (isLoading) return <GraphSkeleton />;
  if (error || !data) return <p className="text-destructive text-center py-10">Failed to load figure data.</p>;

  const figure = data.entity;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card-gradient border border-border rounded-xl p-6">
        <div className="flex items-start gap-5">
          {figure.image_url ? (
            <img src={figure.image_url} alt="" className="w-24 h-24 rounded-full object-cover hidden sm:block border-2 border-primary/30" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center hidden sm:flex border-2 border-border">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline"><Users className="h-3 w-3 mr-1" />Historical Figure</Badge>
              {figure.dynasty?.name && <Badge variant="secondary">{figure.dynasty.name}</Badge>}
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">{figure.name}</h2>
            {figure.title && <p className="text-primary font-medium mt-0.5">{figure.title}</p>}
            {figure.biography && <p className="text-muted-foreground mt-2 leading-relaxed line-clamp-4">{figure.biography}</p>}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              {figure.birth_label && <span>Born: {figure.birth_label}</span>}
              {figure.death_label && <span>Died: {figure.death_label}</span>}
              {figure.birth_location?.name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{figure.birth_location.name}</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Relationships */}
      {data.relationships.length > 0 && (
        <GraphSection title="Connections" icon={Network} count={data.relationships.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.relationships.map((rel: any, i: number) => {
              const RelIcon = relationshipIcon(rel.relationship_type);
              return (
                <Link
                  key={i}
                  to={`/knowledge-graph/figure/${rel.related_figure?.id}`}
                  className="flex items-center gap-3 bg-secondary/40 border border-border rounded-lg p-4 hover:border-primary/40 transition-all group"
                >
                  {rel.related_figure?.image_url ? (
                    <img src={rel.related_figure.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <RelIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{rel.related_figure?.name}</p>
                    <p className="text-xs text-primary capitalize">{rel.relationship_type}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </GraphSection>
      )}

      {/* Events */}
      {data.events.length > 0 && (
        <GraphSection title="Connected Events" icon={Scroll} count={data.events.length}>
          <div className="space-y-2">
            {data.events.map((ef: any, i: number) => (
              <Link
                key={i}
                to={`/knowledge-graph/event/${ef.event?.id}`}
                className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-all group"
              >
                <Scroll className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{ef.event?.title}</p>
                  {ef.event?.year_label && <p className="text-xs text-muted-foreground">{ef.event.year_label}</p>}
                </div>
                {ef.role && <Badge variant="secondary" className="text-[10px] shrink-0">{ef.role}</Badge>}
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </GraphSection>
      )}
    </div>
  );
};

// ===== Dynasty Graph View =====
const DynastyGraphView = ({ id }: { id: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["graph-dynasty", id],
    queryFn: () => searchApi.graph.dynasty(id),
  });

  if (isLoading) return <GraphSkeleton />;
  if (error || !data) return <p className="text-destructive text-center py-10">Failed to load dynasty data.</p>;

  const dynasty = data.entity;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card-gradient border border-border rounded-xl p-6">
        <div className="flex items-start gap-5">
          {dynasty.coat_of_arms_url && (
            <img src={dynasty.coat_of_arms_url} alt="" className="w-20 h-20 rounded-lg object-contain hidden sm:block" />
          )}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline"><Landmark className="h-3 w-3 mr-1" />Dynasty</Badge>
              {dynasty.start_label && dynasty.end_label && (
                <span className="text-sm text-primary">{dynasty.start_label} – {dynasty.end_label}</span>
              )}
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">{dynasty.name}</h2>
            {dynasty.description && <p className="text-muted-foreground mt-2 leading-relaxed">{dynasty.description}</p>}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              {dynasty.civilization?.name && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{dynasty.civilization.name}</span>}
              {dynasty.location?.name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{dynasty.location.name}</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Figures */}
      {data.figures.length > 0 && (
        <GraphSection title="Members" icon={Users} count={data.figures.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.figures.map((fig: any) => (
              <Link
                key={fig.id}
                to={`/knowledge-graph/figure/${fig.id}`}
                className="flex items-center gap-3 bg-secondary/40 border border-border rounded-lg p-4 hover:border-primary/40 transition-all group"
              >
                {fig.image_url ? (
                  <img src={fig.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{fig.name}</p>
                  {fig.title && <p className="text-xs text-muted-foreground truncate">{fig.title}</p>}
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    {fig.birth_label && <span>{fig.birth_label}</span>}
                    {fig.death_label && <span>– {fig.death_label}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </GraphSection>
      )}

      {/* Events */}
      {data.events.length > 0 && (
        <GraphSection title="Key Events" icon={Scroll} count={data.events.length}>
          <div className="space-y-2">
            {data.events.map((event: any) => (
              <Link
                key={event.id}
                to={`/knowledge-graph/event/${event.id}`}
                className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-all group"
              >
                <Scroll className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{event.title}</p>
                  {event.year_label && <p className="text-xs text-muted-foreground">{event.year_label}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </GraphSection>
      )}
    </div>
  );
};

// ===== Shared Components =====
const GraphSection = ({ title, icon: Icon, count, children }: { title: string; icon: React.ElementType; count: number; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-display font-semibold text-foreground">{title}</h3>
      <Badge variant="secondary" className="text-xs">{count}</Badge>
    </div>
    {children}
  </motion.div>
);

const GraphSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-40 w-full rounded-xl" />
    <Skeleton className="h-6 w-48" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
    </div>
  </div>
);

// ===== Knowledge Graph Landing =====
const KnowledgeGraphLanding = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "events" | "figures" | "dynasties">("all");

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["kg-search", searchQuery],
    queryFn: () => searchApi.search({ q: searchQuery }),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 2 * 60 * 1000,
  });

  const hasResults = searchResults && (
    searchResults.events?.length > 0 ||
    searchResults.figures?.length > 0 ||
    searchResults.dynasties?.length > 0
  );

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center max-w-2xl mx-auto">
          <Network className="h-16 w-16 text-primary mx-auto mb-4 opacity-60" />
          <h2 className="text-3xl font-display font-bold text-foreground mb-3">Historical Knowledge Graph</h2>
          <p className="text-muted-foreground mb-6">
            Explore how events, people, dynasties, and civilizations connect across history.
            Search for any entity to begin exploring its connections.
          </p>
          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Search for an event, person, or dynasty…"
              className="w-full rounded-xl bg-secondary/80 border border-border px-5 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </motion.div>

      {/* Inline Search Results */}
      {searchQuery.trim().length >= 2 && (
        <div className="max-w-3xl mx-auto">
          {searchLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          )}
          {!searchLoading && !hasResults && (
            <p className="text-center text-muted-foreground py-8">No results found for "{searchQuery}"</p>
          )}
          {!searchLoading && hasResults && (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="events">Events ({searchResults.events?.length || 0})</TabsTrigger>
                  <TabsTrigger value="figures">Figures ({searchResults.figures?.length || 0})</TabsTrigger>
                  <TabsTrigger value="dynasties">Dynasties ({searchResults.dynasties?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-2">
                  {searchResults.events?.slice(0, 5).map((e: any) => (
                    <Link key={e.id} to={`/knowledge-graph/event/${e.id}`} className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-all group">
                      <Scroll className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{e.title}</p>
                        {e.year_label && <p className="text-xs text-muted-foreground">{e.year_label}</p>}
                      </div>
                      {e.category && <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{e.category}</Badge>}
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                  {searchResults.figures?.slice(0, 5).map((f: any) => (
                    <Link key={f.id} to={`/knowledge-graph/figure/${f.id}`} className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-all group">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{f.name}</p>
                        {f.title && <p className="text-xs text-muted-foreground">{f.title}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                  {searchResults.dynasties?.slice(0, 5).map((d: any) => (
                    <Link key={d.id} to={`/knowledge-graph/dynasty/${d.id}`} className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-all group">
                      <Landmark className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{d.name}</p>
                        {d.start_label && <p className="text-xs text-muted-foreground">{d.start_label} – {d.end_label}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </TabsContent>

                <TabsContent value="events" className="space-y-2">
                  {searchResults.events?.map((e: any) => (
                    <Link key={e.id} to={`/knowledge-graph/event/${e.id}`} className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-all group">
                      <Scroll className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{e.title}</p>
                        {e.year_label && <p className="text-xs text-muted-foreground">{e.year_label}</p>}
                      </div>
                      {e.category && <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{e.category}</Badge>}
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </TabsContent>

                <TabsContent value="figures" className="space-y-2">
                  {searchResults.figures?.map((f: any) => (
                    <Link key={f.id} to={`/knowledge-graph/figure/${f.id}`} className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-all group">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{f.name}</p>
                        {f.title && <p className="text-xs text-muted-foreground">{f.title}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </TabsContent>

                <TabsContent value="dynasties" className="space-y-2">
                  {searchResults.dynasties?.map((d: any) => (
                    <Link key={d.id} to={`/knowledge-graph/dynasty/${d.id}`} className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-all group">
                      <Landmark className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{d.name}</p>
                        {d.start_label && <p className="text-xs text-muted-foreground">{d.start_label} – {d.end_label}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}

      {/* Category Cards - only show when not searching */}
      {searchQuery.trim().length < 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: Scroll, title: "Events", desc: "Battles, treaties, discoveries, and pivotal moments", path: "/search?q=battle" },
            { icon: Users, title: "Figures", desc: "Kings, scientists, explorers, and revolutionaries", path: "/search?q=king" },
            { icon: Landmark, title: "Dynasties", desc: "Royal houses, empires, and ruling families", path: "/search?q=dynasty" },
          ].map(({ icon: Icon, title, desc, path }) => (
            <Link key={title} to={path} className="bg-card-gradient border border-border rounded-xl p-5 text-center hover:border-primary/40 transition-all group cursor-pointer">
              <Icon className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== Main Page =====
const KnowledgeGraphPage = () => {
  const { entityType, entityId } = useParams<{ entityType?: string; entityId?: string }>();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {entityType && entityId && (
            <Link to="/knowledge-graph" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Knowledge Graph
            </Link>
          )}

          {!entityType || !entityId ? (
            <KnowledgeGraphLanding />
          ) : entityType === "event" ? (
            <EventGraphView id={entityId} />
          ) : entityType === "figure" ? (
            <FigureGraphView id={entityId} />
          ) : entityType === "dynasty" ? (
            <DynastyGraphView id={entityId} />
          ) : (
            <p className="text-center text-muted-foreground py-20">Unknown entity type.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphPage;
