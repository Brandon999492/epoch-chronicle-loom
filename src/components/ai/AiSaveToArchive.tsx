import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Archive, Plus } from "lucide-react";
import { toast } from "sonner";

interface AiSaveToArchiveProps {
  userId: string;
  content: string;
  suggestedTitle?: string;
}

const ERA_OPTIONS = [
  { value: "ancient", label: "Ancient History" },
  { value: "classical", label: "Classical Era" },
  { value: "medieval", label: "Medieval Period" },
  { value: "early-modern", label: "Early Modern Era" },
  { value: "modern", label: "Modern Era" },
  { value: "contemporary", label: "Contemporary" },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "battle", label: "Battle / War" },
  { value: "political", label: "Political Event" },
  { value: "cultural", label: "Cultural Movement" },
  { value: "scientific", label: "Scientific Discovery" },
  { value: "religious", label: "Religious Event" },
  { value: "biography", label: "Historical Figure" },
];

export function AiSaveToArchive({ userId, content, suggestedTitle }: AiSaveToArchiveProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(suggestedTitle || "");
  const [yearLabel, setYearLabel] = useState("");
  const [era, setEra] = useState("general");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !yearLabel.trim()) {
      toast.error("Title and year are required");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("custom_events").insert({
      user_id: userId,
      title: title.trim(),
      description: content,
      year_label: yearLabel.trim(),
      era,
      category,
      is_public: false,
    });

    if (error) {
      toast.error("Failed to save to archive");
    } else {
      toast.success("Saved to your personal archive!");
      setOpen(false);
      setTitle("");
      setYearLabel("");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1 text-muted-foreground hover:text-primary transition-colors"
          title="Save to archive"
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" /> Save to Personal Archive
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Event Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. The Battle of Hastings"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Year / Date</Label>
            <Input
              value={yearLabel}
              onChange={e => setYearLabel(e.target.value)}
              placeholder="e.g. 1066 AD"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Era</Label>
              <Select value={era} onValueChange={setEra}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ERA_OPTIONS.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-md p-2 max-h-32 overflow-y-auto">
            <p className="text-[10px] text-muted-foreground mb-1">Content preview:</p>
            <p className="text-xs text-foreground line-clamp-6">{content.slice(0, 500)}</p>
          </div>

          <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
            <Plus className="h-4 w-4" /> {saving ? "Saving..." : "Add to Archive"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
