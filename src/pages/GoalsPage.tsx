import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Plus, Check, Target, Flame, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Goal = Tables<"goals">;

const GoalsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
  }, [user, authLoading, navigate]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setGoals(data);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;
    const { error } = await supabase
      .from("goals")
      .insert({ user_id: user.id, title: newTitle.trim(), description: newDesc.trim() || null });
    if (error) { toast.error("Failed to add goal"); return; }
    setNewTitle("");
    setNewDesc("");
    fetchGoals();
    toast.success("Goal added!");
  };

  const toggleGoal = async (g: Goal) => {
    await supabase
      .from("goals")
      .update({
        is_completed: !g.is_completed,
        completed_at: !g.is_completed ? new Date().toISOString() : null,
      })
      .eq("id", g.id);
    fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    fetchGoals();
  };

  const completedCount = goals.filter((g) => g.is_completed).length;
  const totalCount = goals.length;

  // Calculate streak (consecutive days with completed goals)
  const completedDates = goals
    .filter((g) => g.completed_at)
    .map((g) => new Date(g.completed_at!).toDateString());
  const uniqueDates = [...new Set(completedDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (uniqueDates[i] === expected.toDateString()) {
      streak++;
    } else break;
  }

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Learning Goals</h1>
            <p className="text-muted-foreground mb-8">Track your daily learning and build a study streak</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-card-gradient border border-border rounded-lg p-5 text-center">
                <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total Goals</p>
              </div>
              <div className="bg-card-gradient border border-border rounded-lg p-5 text-center">
                <Check className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="bg-card-gradient border border-border rounded-lg p-5 text-center">
                <Flame className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="mb-8">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round((completedCount / totalCount) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Add goal form */}
            <form onSubmit={addGoal} className="bg-card-gradient border border-border rounded-lg p-5 mb-6">
              <h3 className="font-display text-sm font-semibold text-foreground mb-3">Add New Goal</h3>
              <div className="space-y-3">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What do you want to learn today?"
                  required
                  className="w-full rounded-lg bg-secondary/80 border border-border px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded-lg bg-secondary/80 border border-border px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Add Goal
                </button>
              </div>
            </form>

            {/* Goals list */}
            <div className="space-y-3">
              {goals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-3 bg-card-gradient border border-border rounded-lg p-4 transition-all ${
                    goal.is_completed ? "opacity-60" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleGoal(goal)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      goal.is_completed
                        ? "bg-primary border-primary"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {goal.is_completed && <Check className="h-3 w-3 text-primary-foreground" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium text-foreground ${goal.is_completed ? "line-through" : ""}`}>
                      {goal.title}
                    </p>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(goal.created_at).toLocaleDateString()}
                      {goal.completed_at && ` · Completed ${new Date(goal.completed_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
              {goals.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No goals yet. Add your first learning goal above!</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
