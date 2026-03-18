import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users, ArrowLeft, Tag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-api`;
const headers = { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" };

function useCategoryEvents(category: string, page: number) {
  return useQuery({
    queryKey: ["category-events", category, page],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/events?category=${category}&page=${page}&limit=24`, { headers });
      if (!resp.ok) throw new Error("Failed to fetch");
      return resp.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useCategoryFigures(category: string) {
  return useQuery({
    queryKey: ["category-figures", category],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/events?category=${category}&limit=10`, { headers });
      if (!resp.ok) return [];
      const eventsData = await resp.json();
      const eventIds = (eventsData.data || []).slice(0, 10).map((e: any) => e.id);
      const figurePromises = eventIds.map((id: string) =>
        fetch(`${API_BASE}/events/${id}/figures`, { headers }).then(r => r.ok ? r.json() : [])
      );
      const allFigures = (await Promise.all(figurePromises)).flat();
      const seen = new Set<string>();
      return allFigures.filter((f: any) => {
        if (!f?.figure?.id || seen.has(f.figure.id)) return false;
        seen.add(f.figure.id);
        return true;
      }).slice(0, 12);
    },
    staleTime: 10 * 60 * 1000,
  });
}

const CategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCategoryEvents(categoryId || "", page);
  const { data: figures } = useCategoryFigures(categoryId || "");

  const events = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 24);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/explore" className="hover:text-primary transition-colors">Explore</Link>
            <span>/</span>
            <span className="text-foreground capitalize">{categoryId}</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2 capitalize flex items-center gap-3">
              <Tag className="h-7 w-7 text-primary" /> {categoryId}
            </h1>
            <p className="text-muted-foreground mb-8">{total} historical events in this category</p>
          </motion.div>

          {/* Key Figures */}
          {figures && figures.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Key Figures
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {figures.map((ef: any) => (
                  <Link key={ef.figure.id} to={`/knowledge-graph/figure/${ef.figure.id}`} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shrink-0 hover:border-primary/40 transition-all">
                    {ef.figure.image_url ? (
                      <img src={ef.figure.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Users className="h-3.5 w-3.5 text-muted-foreground" /></div>
                    )}
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">{ef.figure.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Events Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event: any) => (
                  <motion.div key={event.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Link to={`/event/${event.id}`} className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all block h-full">
                      {event.image_url && (
                        <img src={event.image_url} alt="" className="w-full h-32 object-cover" />
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm">{event.title}</h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {event.year_label && <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{event.year_label}</span>}
                          {event.location?.name && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location.name}</span>}
                        </div>
                        {event.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{event.description}</p>}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}

          {/* Back */}
          <div className="mt-10">
            <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Explore
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
