import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Globe, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const categories = ["general", "war", "science", "culture", "politics", "discovery", "assassination", "treaty", "religion", "geology", "evolution"];
const eraOptions = ["hadean", "archean", "proterozoic", "paleozoic", "mesozoic", "cenozoic", "ancient", "medieval", "early-modern", "modern", "contemporary"];

interface CustomEvent {
  id: string;
  title: string;
  year_label: string;
  description: string;
  category: string | null;
  era: string | null;
  image_url: string | null;
  video_url: string | null;
  is_public: boolean | null;
  created_at: string;
  updated_at: string;
}

const AddHistoryPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CustomEvent | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [yearLabel, setYearLabel] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [era, setEra] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
  }, [user, authLoading, navigate]);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("custom_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setEvents(data as CustomEvent[]);
  }, [user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const resetForm = () => {
    setTitle(""); setYearLabel(""); setDescription(""); setCategory("general");
    setEra(""); setImageUrl(""); setVideoUrl(""); setEditing(null); setShowForm(false);
  };

  const handleEdit = (ev: CustomEvent) => {
    setTitle(ev.title); setYearLabel(ev.year_label); setDescription(ev.description);
    setCategory(ev.category || "general"); setEra(ev.era || ""); setImageUrl(ev.image_url || "");
    setVideoUrl(ev.video_url || ""); setEditing(ev); setShowForm(true);
  };

  const isValidHttpsUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (imageUrl && !isValidHttpsUrl(imageUrl)) {
      toast.error("Image URL must start with https://");
      return;
    }
    if (videoUrl && !isValidHttpsUrl(videoUrl)) {
      toast.error("Video URL must start with https://");
      return;
    }

    const payload = {
      title, year_label: yearLabel, description, category,
      era: era || null, image_url: imageUrl || null, video_url: videoUrl || null,
      user_id: user.id,
    };
    if (editing) {
      const { error } = await supabase.from("custom_events").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Event updated!");
    } else {
      const { error } = await supabase.from("custom_events").insert(payload);
      if (error) { toast.error("Failed to add event"); return; }
      toast.success("Historical event added!");
    }
    resetForm();
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("custom_events").delete().eq("id", id);
    fetchEvents();
    toast.success("Event deleted");
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Add History</h1>
                <p className="text-muted-foreground text-sm mt-1">Create your own historical entries and research notes</p>
              </div>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> New Entry
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleSubmit}
                className="bg-card-gradient border border-border rounded-xl p-6 mb-8 space-y-4"
              >
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {editing ? "Edit Entry" : "New Historical Entry"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} required
                      placeholder="e.g. Battle of Thermopylae"
                      className="w-full rounded-lg bg-secondary/80 border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Year / Date *</label>
                    <input value={yearLabel} onChange={(e) => setYearLabel(e.target.value)} required
                      placeholder="e.g. 480 BCE"
                      className="w-full rounded-lg bg-secondary/80 border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Description *</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
                    placeholder="Describe this historical event in detail..."
                    className="w-full rounded-lg bg-secondary/80 border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none placeholder:text-muted-foreground" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg bg-secondary border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none capitalize">
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Era</label>
                    <select value={era} onChange={(e) => setEra(e.target.value)}
                      className="w-full rounded-lg bg-secondary border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none capitalize">
                      <option value="">Select era...</option>
                      {eraOptions.map((e) => <option key={e} value={e}>{e.replace("-", " ")}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Image URL (optional)</label>
                    <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..."
                      className="w-full rounded-lg bg-secondary/80 border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Video URL (optional)</label>
                    <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..."
                      className="w-full rounded-lg bg-secondary/80 border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90">
                    {editing ? "Update Entry" : "Add Entry"}
                  </button>
                  <button type="button" onClick={resetForm} className="rounded-lg bg-secondary text-secondary-foreground px-5 py-2.5 text-sm font-medium hover:bg-secondary/80">
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}

            {/* List */}
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="bg-card-gradient border border-border rounded-lg p-5 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary">{ev.year_label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{ev.category}</span>
                        {ev.era && <span className="text-xs text-muted-foreground capitalize">{ev.era.replace("-", " ")}</span>}
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{ev.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{ev.description}</p>
                      {ev.image_url && (
                        <img src={ev.image_url} alt={ev.title} className="mt-3 rounded-lg max-h-48 object-cover" />
                      )}
                      {ev.video_url && (
                        <a href={ev.video_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-primary hover:underline">
                          🎬 Watch video →
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => handleEdit(ev)} className="p-1.5 rounded text-muted-foreground hover:text-primary"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && !showForm && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">You haven't added any historical entries yet.</p>
                  <button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90">
                    <Plus className="h-4 w-4" /> Create Your First Entry
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AddHistoryPage;
