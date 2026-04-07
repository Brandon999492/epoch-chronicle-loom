import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, ChevronRight, ChevronLeft, Trophy, Brain,
  Landmark, Castle, Swords, Crown, FlaskConical, Ship,
  CheckCircle2, XCircle, Send, Loader2, Sparkles, RotateCcw,
  GraduationCap, Target, Flame,
} from "lucide-react";

const TUTOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-tutor`;

const iconMap: Record<string, React.ReactNode> = {
  landmark: <Landmark className="h-6 w-6" />,
  castle: <Castle className="h-6 w-6" />,
  swords: <Swords className="h-6 w-6" />,
  crown: <Crown className="h-6 w-6" />,
  "flask-conical": <FlaskConical className="h-6 w-6" />,
  ship: <Ship className="h-6 w-6" />,
  book: <BookOpen className="h-6 w-6" />,
};

const difficultyColor: Record<string, string> = {
  beginner: "bg-green-500/15 text-green-400 border-green-500/30",
  intermediate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/15 text-red-400 border-red-500/30",
};

interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  lesson_count: number;
  difficulty: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

type View = "paths" | "lesson" | "quiz";

export default function LearnPage() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("paths");

  // Lesson state
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [lessonContent, setLessonContent] = useState("");
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Ask question state
  const [askInput, setAskInput] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [askLoading, setAskLoading] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // Progress stats
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [totalQuizScore, setTotalQuizScore] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  const lessonTitles = [
    "Origins & Early Developments",
    "Key Turning Points & Conflicts",
    "Important Figures & Contributions",
    "Cultural & Societal Impact",
    "Legacy & Modern Connections",
  ];

  useEffect(() => {
    loadPaths();
    if (user) loadProgress();
  }, [user]);

  async function loadPaths() {
    const { data } = await supabase.from("learning_paths").select("*").order("created_at");
    if (data) setPaths(data as any);
    setLoading(false);
  }

  async function loadProgress() {
    if (!user) return;
    const { data: lessons } = await supabase
      .from("user_lesson_progress")
      .select("path_id, lesson_index, status")
      .eq("user_id", user.id)
      .eq("status", "completed");
    if (lessons) {
      const set = new Set(lessons.map((l: any) => `${l.path_id}-${l.lesson_index}`));
      setCompletedLessons(set);
    }

    const { data: quizzes } = await supabase
      .from("quiz_results")
      .select("score")
      .eq("user_id", user.id);
    if (quizzes) setTotalQuizScore(quizzes.reduce((s: number, q: any) => s + q.score, 0));

    // Calculate streak
    const { data: recentActivity } = await supabase
      .from("user_lesson_progress")
      .select("completed_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(30);
    if (recentActivity) {
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        if (recentActivity.some((a: any) => a.completed_at?.startsWith(dayStr))) {
          streak++;
        } else if (i > 0) break;
      }
      setStreakDays(streak);
    }
  }

  async function getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  const startLesson = useCallback(async (path: LearningPath, index: number) => {
    if (!user) { toast.error("Sign in to start learning"); return; }
    setActivePath(path);
    setLessonIndex(index);
    setLessonTitle(lessonTitles[index]);
    setLessonContent("");
    setAskAnswer("");
    setAskInput("");
    setView("lesson");
    setLessonLoading(true);

    // Check if lesson already exists
    const { data: existing } = await supabase
      .from("user_lesson_progress")
      .select("lesson_content")
      .eq("user_id", user.id)
      .eq("path_id", path.id)
      .eq("lesson_index", index)
      .maybeSingle();

    if (existing?.lesson_content) {
      setLessonContent(existing.lesson_content);
      setLessonLoading(false);
      return;
    }

    // Generate via AI streaming
    const token = await getAuthToken();
    if (!token) { toast.error("Please sign in"); setLessonLoading(false); return; }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(TUTOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "generate_lesson",
          pathTitle: path.title,
          pathDescription: path.description,
          lessonIndex: index,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content;
            if (c) { full += c; setLessonContent(full); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }

      // Save to DB
      await supabase.from("user_lesson_progress").insert({
        user_id: user.id,
        path_id: path.id,
        lesson_index: index,
        lesson_title: lessonTitles[index],
        lesson_content: full,
        status: "in_progress",
      });
    } catch (e: any) {
      if (e.name !== "AbortError") toast.error(e.message || "Failed to generate lesson");
    } finally {
      setLessonLoading(false);
      abortRef.current = null;
    }
  }, [user]);

  async function markComplete() {
    if (!user || !activePath) return;
    await supabase
      .from("user_lesson_progress")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("path_id", activePath.id)
      .eq("lesson_index", lessonIndex);
    setCompletedLessons(prev => new Set([...prev, `${activePath.id}-${lessonIndex}`]));
    toast.success("Lesson marked as complete!");
  }

  async function startQuiz() {
    if (!user || !lessonContent) return;
    setQuizLoading(true);
    setView("quiz");
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizDone(false);

    const token = await getAuthToken();
    try {
      const resp = await fetch(TUTOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "generate_quiz", lessonContent }),
      });
      if (!resp.ok) throw new Error("Quiz generation failed");
      const data = await resp.json();
      setQuestions(data.questions || []);
    } catch (e: any) {
      toast.error(e.message);
      setView("lesson");
    } finally {
      setQuizLoading(false);
    }
  }

  function selectAnswer(idx: number) {
    if (showResult) return;
    setSelectedAnswer(idx);
    setShowResult(true);
    if (idx === questions[currentQ].correctIndex) setScore(s => s + 1);
  }

  async function nextQuestion() {
    if (currentQ + 1 >= questions.length) {
      setQuizDone(true);
      // Save quiz result
      if (user && activePath) {
        await supabase.from("quiz_results").insert({
          user_id: user.id,
          path_id: activePath.id,
          lesson_index: lessonIndex,
          score: score + (selectedAnswer === questions[currentQ].correctIndex ? 0 : 0), // score already updated
          total_questions: questions.length,
        });
        setTotalQuizScore(prev => prev + score);
      }
      return;
    }
    setCurrentQ(c => c + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  }

  async function askQuestion() {
    if (!askInput.trim() || !lessonContent) return;
    setAskLoading(true);
    setAskAnswer("");

    const token = await getAuthToken();
    try {
      const resp = await fetch(TUTOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "ask_question", lessonContent, question: askInput }),
      });
      if (!resp.ok) throw new Error("Failed to get answer");

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content;
            if (c) { full += c; setAskAnswer(full); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAskLoading(false);
    }
  }

  const pathProgress = (pathId: string) => {
    let done = 0;
    for (let i = 0; i < 5; i++) if (completedLessons.has(`${pathId}-${i}`)) done++;
    return done;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 pb-16 container mx-auto px-4 text-center">
          <GraduationCap className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="font-display text-3xl font-bold mb-4">AI History Tutor</h1>
          <p className="text-muted-foreground mb-6">Sign in to access guided history lessons and quizzes.</p>
          <Link to="/auth">
            <Button size="lg">Sign In to Start Learning</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16 container mx-auto px-4 max-w-6xl">

        {/* ===== PATHS VIEW ===== */}
        {view === "paths" && (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="card-premium p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/15"><GraduationCap className="h-5 w-5 text-primary" /></div>
                <div><p className="text-xs text-muted-foreground">Lessons Done</p><p className="font-display text-xl font-bold">{completedLessons.size}</p></div>
              </div>
              <div className="card-premium p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/15"><Trophy className="h-5 w-5 text-amber-400" /></div>
                <div><p className="text-xs text-muted-foreground">Quiz Score</p><p className="font-display text-xl font-bold">{totalQuizScore}</p></div>
              </div>
              <div className="card-premium p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/15"><Flame className="h-5 w-5 text-orange-400" /></div>
                <div><p className="text-xs text-muted-foreground">Streak</p><p className="font-display text-xl font-bold">{streakDays}d</p></div>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold mb-2">AI History Tutor</h1>
              <p className="text-muted-foreground">Choose a learning path and master history step by step.</p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paths.map(path => {
                  const done = pathProgress(path.id);
                  return (
                    <div key={path.id} className="card-premium p-5 flex flex-col gap-3 group">
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                          {iconMap[path.icon] || <BookOpen className="h-6 w-6" />}
                        </div>
                        <Badge className={`text-[10px] ${difficultyColor[path.difficulty] || ""}`}>
                          {path.difficulty}
                        </Badge>
                      </div>
                      <h3 className="font-display text-lg font-semibold">{path.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{path.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{done}/5 lessons</span>
                          <span>{Math.round((done / 5) * 100)}%</span>
                        </div>
                        <Progress value={(done / 5) * 100} className="h-1.5" />
                      </div>
                      <Button
                        onClick={() => startLesson(path, Math.min(done, 4))}
                        className="w-full mt-1"
                        variant={done > 0 ? "outline" : "default"}
                      >
                        {done === 0 ? "Start Learning" : done >= 5 ? "Review" : "Continue"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== LESSON VIEW ===== */}
        {view === "lesson" && activePath && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setView("paths")}>
                <ChevronLeft className="h-4 w-4 mr-1" /> All Paths
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium">{activePath.title}</span>
            </div>

            {/* Lesson stepper */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
              {lessonTitles.map((t, i) => {
                const done = completedLessons.has(`${activePath.id}-${i}`);
                const active = i === lessonIndex;
                return (
                  <button
                    key={i}
                    onClick={() => startLesson(activePath, i)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      active ? "bg-primary text-primary-foreground" :
                      done ? "bg-green-500/15 text-green-400" :
                      "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {done && !active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="font-bold">{i + 1}</span>}
                    <span className="hidden sm:inline">{t}</span>
                  </button>
                );
              })}
            </div>

            {/* Lesson content */}
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="card-premium p-6 md:p-8">
                {lessonLoading && !lessonContent ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Generating your lesson...</span>
                    </div>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display">
                    <ReactMarkdown>{lessonContent}</ReactMarkdown>
                    {lessonLoading && <Loader2 className="h-4 w-4 animate-spin text-primary inline-block ml-1" />}
                  </article>
                )}

                {lessonContent && !lessonLoading && (
                  <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border/30">
                    {!completedLessons.has(`${activePath.id}-${lessonIndex}`) && (
                      <Button onClick={markComplete} variant="outline" className="gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Mark Complete
                      </Button>
                    )}
                    <Button onClick={startQuiz} className="gap-2">
                      <Brain className="h-4 w-4" /> Take Quiz
                    </Button>
                    {lessonIndex < 4 && (
                      <Button variant="ghost" onClick={() => startLesson(activePath, lessonIndex + 1)} className="gap-1 ml-auto">
                        Next Lesson <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar: Ask AI */}
              <div className="space-y-4">
                <div className="card-premium p-4">
                  <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Ask Your Tutor
                  </h3>
                  <Textarea
                    value={askInput}
                    onChange={e => setAskInput(e.target.value)}
                    placeholder="Ask a question about this lesson..."
                    className="text-sm min-h-[80px] mb-2"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askQuestion(); } }}
                  />
                  <Button size="sm" onClick={askQuestion} disabled={askLoading || !askInput.trim()} className="w-full gap-2">
                    {askLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Ask
                  </Button>
                  {askAnswer && (
                    <div className="mt-3 pt-3 border-t border-border/30 prose prose-sm dark:prose-invert max-w-none text-sm">
                      <ReactMarkdown>{askAnswer}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Quick links */}
                <div className="card-premium p-4">
                  <h3 className="font-display text-sm font-semibold mb-3">Explore Related</h3>
                  <div className="flex flex-col gap-1.5">
                    <Link to="/timeline" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Target className="h-3 w-3" /> View on Timeline
                    </Link>
                    <Link to="/map" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Target className="h-3 w-3" /> Explore on Map
                    </Link>
                    <Link to="/archive" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Target className="h-3 w-3" /> Browse Archive
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== QUIZ VIEW ===== */}
        {view === "quiz" && activePath && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setView("lesson")}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Lesson
              </Button>
            </div>

            <div className="max-w-2xl mx-auto">
              {quizLoading ? (
                <div className="card-premium p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Generating quiz questions...</p>
                </div>
              ) : quizDone ? (
                <div className="card-premium p-8 text-center">
                  <Trophy className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                  <h2 className="font-display text-2xl font-bold mb-2">Quiz Complete!</h2>
                  <p className="text-muted-foreground mb-1">
                    You scored <span className="text-primary font-bold">{score}</span> out of <span className="font-bold">{questions.length}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {score === questions.length ? "Perfect score! 🎉" :
                     score >= questions.length * 0.6 ? "Great job! Keep learning." :
                     "Keep studying — you'll get there!"}
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => setView("lesson")} className="gap-2">
                      <RotateCcw className="h-4 w-4" /> Review Lesson
                    </Button>
                    {lessonIndex < 4 && (
                      <Button onClick={() => startLesson(activePath, lessonIndex + 1)} className="gap-2">
                        Next Lesson <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => setView("paths")}>All Paths</Button>
                  </div>
                </div>
              ) : questions.length > 0 ? (
                <div className="card-premium p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <Badge variant="outline" className="text-xs">
                      Question {currentQ + 1} / {questions.length}
                    </Badge>
                    <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                      Score: {score}
                    </Badge>
                  </div>
                  <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1 mb-6" />

                  <h3 className="font-display text-lg font-semibold mb-5">{questions[currentQ].question}</h3>

                  <div className="space-y-2.5">
                    {questions[currentQ].options.map((opt, i) => {
                      const isCorrect = i === questions[currentQ].correctIndex;
                      const isSelected = i === selectedAnswer;
                      return (
                        <button
                          key={i}
                          onClick={() => selectAnswer(i)}
                          disabled={showResult}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                            showResult
                              ? isCorrect
                                ? "border-green-500 bg-green-500/10 text-green-400"
                                : isSelected
                                  ? "border-red-500 bg-red-500/10 text-red-400"
                                  : "border-border/30 text-muted-foreground opacity-50"
                              : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                              showResult && isCorrect ? "border-green-500 bg-green-500 text-white" :
                              showResult && isSelected ? "border-red-500 bg-red-500 text-white" :
                              "border-border/50"
                            }`}>
                              {showResult && isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                               showResult && isSelected ? <XCircle className="h-3.5 w-3.5" /> :
                               String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {showResult && (
                    <div className="mt-5 p-4 rounded-xl bg-secondary/30 border border-border/30">
                      <p className="text-sm text-muted-foreground">{questions[currentQ].explanation}</p>
                    </div>
                  )}

                  {showResult && (
                    <Button onClick={nextQuestion} className="w-full mt-5">
                      {currentQ + 1 >= questions.length ? "See Results" : "Next Question"}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="card-premium p-8 text-center">
                  <p className="text-muted-foreground">No questions generated. Try again.</p>
                  <Button onClick={() => setView("lesson")} className="mt-4">Back to Lesson</Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
