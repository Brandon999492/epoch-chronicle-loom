import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, BookOpen, Target, TrendingUp, Lightbulb, CalendarCheck, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LearningTrackerProps {
  notes: Array<{
    id: string;
    category: string | null;
    created_at: string;
    word_count: number | null;
    linked_year: number | null;
  }>;
}

const SUBJECT_COLORS: Record<string, string> = {
  "Ice Age": "bg-blue-400",
  "Space": "bg-indigo-400",
  "Ancient Egypt": "bg-amber-400",
  "Ancient Greece": "bg-emerald-400",
  "Royal Family": "bg-purple-400",
  "Dinosaurs": "bg-green-400",
  "WWII": "bg-red-400",
  "American History": "bg-rose-400",
  "Earth History": "bg-teal-400",
  "Serial Killers": "bg-orange-400",
};

export function LearningTracker({ notes }: LearningTrackerProps) {
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    try { return parseInt(localStorage.getItem("studio-weekly-goal") || "5"); } catch { return 5; }
  });
  const [editingGoal, setEditingGoal] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    const notesToday = notes.filter(n => n.created_at.slice(0, 10) === today).length;

    // Today's unique categories
    const todayCategories = new Set(
      notes.filter(n => n.created_at.slice(0, 10) === today).map(n => n.category || "general")
    );

    // Streak calculation
    let streak = 0;
    const dateSet = new Set(notes.map(n => n.created_at.slice(0, 10)));
    const d = new Date(now);
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      if (dateSet.has(ds)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }

    // Category counts
    const cats: Record<string, number> = {};
    notes.forEach(n => {
      const c = n.category || "general";
      cats[c] = (cats[c] || 0) + 1;
    });

    const sortedCats = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const maxCat = sortedCats[0]?.[1] || 1;

    // Weekly notes (current week Mon-Sun)
    const dayOfWeek = now.getDay() || 7; // 1=Mon..7=Sun
    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() - (dayOfWeek - 1));
    mondayDate.setHours(0, 0, 0, 0);
    const weeklyNotes = notes.filter(n => new Date(n.created_at) >= mondayDate).length;

    // Unique periods explored
    const periods = new Set(notes.filter(n => n.linked_year).map(n => {
      const y = n.linked_year!;
      if (y < -3000) return "Prehistoric";
      if (y < 500) return "Ancient";
      if (y < 1500) return "Medieval";
      if (y < 1800) return "Early Modern";
      if (y < 1950) return "Modern";
      return "Contemporary";
    }));

    const totalWords = notes.reduce((s, n) => s + (n.word_count || 0), 0);

    // Suggest next topic
    const allTopics = Object.keys(SUBJECT_COLORS);
    const leastStudied = allTopics.filter(t => !cats[t] || cats[t] < 2).slice(0, 2);

    return { notesToday, todayCategories: todayCategories.size, streak, sortedCats, maxCat, totalWords, totalNotes: notes.length, periods: periods.size, leastStudied, weeklyNotes };
  }, [notes]);

  const saveGoal = (g: number) => {
    const v = Math.max(1, Math.min(50, g));
    setWeeklyGoal(v);
    localStorage.setItem("studio-weekly-goal", v.toString());
    setEditingGoal(false);
  };

  const weeklyProgress = Math.min(100, (stats.weeklyNotes / weeklyGoal) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-5">
      {/* Daily Summary */}
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Today's Learning</p>
            <p className="text-[10px] text-muted-foreground">
              You learned {stats.todayCategories} topic{stats.todayCategories !== 1 ? "s" : ""} today — {stats.notesToday} note{stats.notesToday !== 1 ? "s" : ""} created
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame className={`h-4 w-4 ${stats.streak > 0 ? "text-orange-400" : "text-muted-foreground/30"}`} />
            <span className="text-sm font-bold text-foreground">{stats.streak}</span>
            <span className="text-[10px] text-muted-foreground">day streak</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="text-[10px] text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.totalNotes}</span> notes · <span className="font-semibold text-foreground">{stats.totalWords.toLocaleString()}</span> words
          </div>
        </div>
      </div>

      {/* Weekly Goal */}
      <div className="bg-secondary/20 rounded-2xl p-4 border border-border/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Weekly Goal</span>
          </div>
          <button onClick={() => setEditingGoal(!editingGoal)} className="text-[10px] text-primary hover:underline">
            {editingGoal ? "Done" : "Edit"}
          </button>
        </div>
        {editingGoal ? (
          <div className="flex items-center gap-2 mb-2">
            <input
              type="number" min={1} max={50} value={weeklyGoal}
              onChange={(e) => saveGoal(parseInt(e.target.value) || 5)}
              className="w-16 text-sm rounded-lg bg-secondary border border-border px-2 py-1.5 text-foreground text-center min-h-[36px]"
            />
            <span className="text-xs text-muted-foreground">notes per week</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{stats.weeklyNotes} / {weeklyGoal} notes</span>
              {stats.weeklyNotes >= weeklyGoal && (
                <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                  <Trophy className="h-3 w-3" /> Goal reached!
                </span>
              )}
            </div>
            <Progress value={weeklyProgress} className="h-2" />
          </>
        )}
      </div>

      {/* Subject Progress */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Subject Mastery</span>
        </div>
        <div className="space-y-2.5">
          {stats.sortedCats.slice(0, 6).map(([cat, count]) => (
            <div key={cat} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground capitalize">{cat}</span>
                <span className="text-[10px] text-muted-foreground">{count} note{count !== 1 ? "s" : ""}</span>
              </div>
              <Progress value={(count / stats.maxCat) * 100} className="h-1.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <BookOpen className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.periods}</p>
          <p className="text-[10px] text-muted-foreground">Eras Explored</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.sortedCats.length}</p>
          <p className="text-[10px] text-muted-foreground">Topics Covered</p>
        </div>
      </div>

      {/* Suggestions */}
      {stats.leastStudied.length > 0 && (
        <div className="bg-secondary/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-foreground">Next Topics to Learn</span>
          </div>
          <div className="space-y-1">
            {stats.leastStudied.map(topic => (
              <p key={topic} className="text-xs text-muted-foreground">
                → Try exploring <span className="text-primary font-medium">{topic}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
