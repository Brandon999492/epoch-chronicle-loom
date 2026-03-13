import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Save } from "lucide-react";

const CATEGORIES = [
  "war", "battle", "politics", "science", "discovery", "religion", "monarchy",
  "revolution", "cultural", "economic", "disaster", "exploration", "technology",
  "philosophy", "geology", "evolution", "mystery", "general",
];

export default function AdminAiGenerator() {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("general");
  const [timePeriod, setTimePeriod] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const INGEST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-ingest`;
      const resp = await fetch(`${INGEST_URL}/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          topic: `${topic}${timePeriod ? ` (time period: ${timePeriod})` : ""}${category !== "general" ? ` (category: ${category})` : ""}`,
        }),
      });

      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      setResult(data.generated || data);
      toast({ title: "AI generation complete" });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const saveToDrafts = async () => {
    if (!result) return;
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const title = result.events?.[0]?.title || result.title || topic;

      const { error } = await supabase.from("draft_entries").insert({
        entity_type: "event",
        status: "pending",
        title,
        generated_data: result,
        topic,
        category,
        created_by: session.user.id,
      });

      if (error) throw error;
      toast({ title: "Saved to review queue" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Historical Entry Generator
          </CardTitle>
          <CardDescription>Generate structured historical entries using AI. Results go to the review queue before publishing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Topic</Label>
            <Input
              placeholder="e.g. The Bronze Age Collapse, The Silk Road, Fall of Constantinople"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Approximate Time Period</Label>
              <Input
                placeholder="e.g. 1200 BCE, 15th century, Medieval"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generate Entry
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Generated Result</span>
              <Button size="sm" onClick={saveToDrafts} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save to Review Queue
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-secondary/50 rounded-md p-4 text-xs font-mono overflow-auto max-h-96 text-foreground">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
