import { useParams, Link } from "react-router-dom";
import { eras, categoryLabels } from "@/data/historicalData";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import ImageSlideshow from "@/components/ImageSlideshow";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const EraDetail = () => {
  const { eraId } = useParams();
  const era = eras.find((e) => e.id === eraId);
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const fetchBookmarks = useCallback(async () => {
    if (!user || !era) return;
    const { data } = await supabase
      .from("bookmarks")
      .select("event_id")
      .eq("user_id", user.id)
      .eq("era_id", era.id);
    if (data) setBookmarkedIds(new Set(data.map((b) => b.event_id)));
  }, [user, era]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const toggleBookmark = async (eventId: string) => {
    if (!user) { toast.error("Sign in to bookmark events"); return; }
    if (!era) return;
    if (bookmarkedIds.has(eventId)) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("event_id", eventId);
      setBookmarkedIds((prev) => { const n = new Set(prev); n.delete(eventId); return n; });
      toast.success("Bookmark removed");
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, event_id: eventId, era_id: era.id });
      setBookmarkedIds((prev) => new Set(prev).add(eventId));
      toast.success("Event bookmarked!");
    }
  };

  if (!era) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 text-center">
          <h1 className="text-2xl font-display text-foreground">Era not found</h1>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const eraIndex = eras.findIndex((e) => e.id === eraId);
  const prevEra = eraIndex > 0 ? eras[eraIndex - 1] : null;
  const nextEra = eraIndex < eras.length - 1 ? eras[eraIndex + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/timeline" className="hover:text-primary transition-colors">Timeline</Link>
            <span>/</span>
            <Link to="/archive" className="hover:text-primary transition-colors">Archive</Link>
            <span>/</span>
            <span className="text-foreground">{era.name}</span>
          </div>

          {/* Era Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${era.color})` }} />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{era.period}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">{era.name}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">{era.description}</p>
          </motion.div>

          {/* Events */}
          <div className="space-y-4 mb-16">
            <h2 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Key Events
            </h2>

            <div className="relative ml-4 border-l-2 border-border pl-8 space-y-6">
              {era.events.map((event, i) => {
                // Build images for compact view
                const eventImages: { url: string; caption?: string }[] = [];
                if (event.imageUrl) eventImages.push({ url: event.imageUrl, caption: event.title });
                if (event.images) {
                  event.images.forEach(img => {
                    if (!eventImages.some(a => a.url === img.url)) eventImages.push(img);
                  });
                }

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="relative"
                  >
                    <div
                      className="absolute -left-[2.35rem] top-1 w-3 h-3 rounded-full border-2 border-background"
                      style={{ backgroundColor: `hsl(${era.color})` }}
                    />

                    <Link
                      to={`/event/${event.id}`}
                      className="block bg-card-gradient border border-border rounded-lg p-5 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {eventImages.length > 0 && (
                            <ImageSlideshow
                              images={eventImages}
                              sourceLinks={event.sourceLinks}
                              alt={event.title}
                              compact
                              className="mb-3"
                            />
                          )}
                          <span className="text-xs font-medium text-primary">{event.yearLabel}</span>
                          <h3 className="text-lg font-display font-semibold text-foreground mt-1 mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{event.description}</p>
                          <span className="inline-block mt-3 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                            {categoryLabels[event.category]}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); toggleBookmark(event.id); }}
                          className={`p-2 rounded-md shrink-0 ml-3 transition-colors ${
                            bookmarkedIds.has(event.id)
                              ? "text-primary"
                              : "text-muted-foreground hover:text-primary"
                          }`}
                          title={bookmarkedIds.has(event.id) ? "Remove bookmark" : "Bookmark this event"}
                        >
                          {bookmarkedIds.has(event.id) ? (
                            <BookmarkCheck className="h-5 w-5" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center border-t border-border pt-8">
            {prevEra ? (
              <Link to={`/era/${prevEra.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" /><span>{prevEra.name}</span>
              </Link>
            ) : <div />}
            {nextEra ? (
              <Link to={`/era/${nextEra.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <span>{nextEra.name}</span><ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EraDetail;
