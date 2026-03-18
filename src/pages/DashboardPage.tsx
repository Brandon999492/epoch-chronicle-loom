import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Clock, Bookmark, Brain, MessageSquare, Target,
  ChevronRight, CheckCircle2, TrendingUp, Flame
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const DashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [learnedEvents, setLearnedEvents] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
  }, [user, authLoading, navigate]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [rv, bm, le, gl, cv, wk] = await Promise.all([
      supabase.from("recently_viewed").select("*").eq("user_id", user.id).order("viewed_at", { ascending: false }).limit(8),
      supabase.from("bookmarks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6),
      supabase.from("learned_events").select("*").eq("user_id", user.id).order("learned_at", { ascending: false }).limit(10),
      supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("ai_conversations").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
      supabase.from("learned_events").select("id", { count: "exact" }).eq("user_id", user.id).gte("learned_at", weekAgo),
    ]);

    if (rv.data) setRecentlyViewed(rv.data);
    if (bm.data) setBookmarks(bm.data);
    if (le.data) setLearnedEvents(le.data);
    if (gl.data) setGoals(gl.data);
    if (cv.data) setConversations(cv.data);
    setWeeklyCount(wk.count || 0);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (authLoading) return null;

  const completedGoals = goals.filter(g => g.is_completed).length;
  const totalGoals = goals.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
              <LayoutDashboard className="h-7 w-7 text-primary" /> Dashboard
            </h1>
            <p className="text-muted-foreground mb-8">Your personal history learning hub</p>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { icon: CheckCircle2, label: "Events Learned", value: learnedEvents.length, color: "text-green-500" },
                { icon: Flame, label: "This Week", value: weeklyCount, color: "text-orange-500" },
                { icon: Bookmark, label: "Bookmarks", value: bookmarks.length, color: "text-primary" },
                { icon: Target, label: "Goals Done", value: `${completedGoals}/${totalGoals}`, color: "text-violet-500" },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="card-premium p-5 text-center">
                  <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recently Viewed */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Recently Viewed
                  </h2>
                </div>
                {recentlyViewed.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recentlyViewed.map((rv) => (
                      <Link key={rv.id} to={`/event/${rv.event_id}`} className="card-premium p-4 group">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{rv.event_title || rv.event_id}</p>
                        {rv.category && <span className="text-xs text-muted-foreground capitalize mt-1 block">{rv.category}</span>}
                        <span className="text-[10px] text-muted-foreground mt-1 block">{new Date(rv.viewed_at).toLocaleDateString()}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="card-premium p-8 text-center">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Start exploring events to see your history here</p>
                  </div>
                )}
              </motion.div>

              {/* Learning Progress */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" /> Learning Progress
                </h2>
                <div className="card-premium p-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Weekly Goal</span>
                      <span className="text-foreground font-medium">{weeklyCount}/5 events</span>
                    </div>
                    <Progress value={Math.min(weeklyCount / 5 * 100, 100)} className="h-2" />
                  </div>
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">Recently Learned</p>
                    {learnedEvents.slice(0, 4).map((le) => (
                      <Link key={le.id} to={`/event/${le.event_id}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                        <span className="truncate">{le.event_title || le.event_id}</span>
                      </Link>
                    ))}
                    {learnedEvents.length === 0 && <p className="text-xs text-muted-foreground">No events learned yet</p>}
                  </div>
                </div>
              </motion.div>

              {/* Bookmarks */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-primary" /> Bookmarks
                  </h2>
                  <Link to="/bookmarks" className="text-xs text-primary hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></Link>
                </div>
                <div className="card-premium p-4 space-y-2">
                  {bookmarks.slice(0, 5).map((bm) => (
                    <Link key={bm.id} to={`/event/${bm.event_id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1">
                      <Bookmark className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{bm.event_id}</span>
                    </Link>
                  ))}
                  {bookmarks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No bookmarks yet</p>}
                </div>
              </motion.div>

              {/* AI Conversations */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> AI Conversations
                  </h2>
                  <Link to="/history-ai" className="text-xs text-primary hover:underline flex items-center gap-1">Open AI <ChevronRight className="h-3 w-3" /></Link>
                </div>
                <div className="card-premium p-4 space-y-2">
                  {conversations.slice(0, 5).map((cv) => (
                    <Link key={cv.id} to="/history-ai" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1">
                      <Brain className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{cv.title}</span>
                    </Link>
                  ))}
                  {conversations.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>}
                </div>
              </motion.div>

              {/* Goals */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Learning Goals
                  </h2>
                  <Link to="/goals" className="text-xs text-primary hover:underline flex items-center gap-1">Manage <ChevronRight className="h-3 w-3" /></Link>
                </div>
                <div className="card-premium p-4 space-y-2">
                  {goals.slice(0, 5).map((g) => (
                    <div key={g.id} className="flex items-center gap-2 text-sm py-1">
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${g.is_completed ? "text-green-500" : "text-muted-foreground"}`} />
                      <span className={`truncate ${g.is_completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{g.title}</span>
                    </div>
                  ))}
                  {goals.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No goals set</p>}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
