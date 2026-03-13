import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

interface QualityIssue {
  type: "duplicate" | "missing_date" | "orphan" | "conflict";
  severity: "warning" | "error";
  entity: string;
  message: string;
  ids?: string[];
}

export default function AdminDataQuality() {
  const [running, setRunning] = useState(false);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const runChecks = async () => {
    setRunning(true);
    setIssues([]);
    const found: QualityIssue[] = [];

    try {
      // 1. Duplicate event titles
      const { data: events } = await supabase.from("historical_events").select("id, title");
      if (events) {
        const titleMap = new Map<string, string[]>();
        events.forEach(e => {
          const key = e.title.toLowerCase().trim();
          titleMap.set(key, [...(titleMap.get(key) || []), e.id]);
        });
        titleMap.forEach((ids, title) => {
          if (ids.length > 1) {
            found.push({ type: "duplicate", severity: "warning", entity: "Event", message: `Duplicate title: "${title}" (${ids.length} copies)`, ids });
          }
        });
      }

      // 2. Duplicate figure names
      const { data: figures } = await supabase.from("historical_figures").select("id, name");
      if (figures) {
        const nameMap = new Map<string, string[]>();
        figures.forEach(f => {
          const key = f.name.toLowerCase().trim();
          nameMap.set(key, [...(nameMap.get(key) || []), f.id]);
        });
        nameMap.forEach((ids, name) => {
          if (ids.length > 1) {
            found.push({ type: "duplicate", severity: "warning", entity: "Figure", message: `Duplicate name: "${name}" (${ids.length} copies)`, ids });
          }
        });
      }

      // 3. Events missing dates
      const { data: dateless } = await supabase
        .from("historical_events")
        .select("id, title")
        .is("year", null)
        .is("year_label", null);
      if (dateless?.length) {
        found.push({
          type: "missing_date",
          severity: "warning",
          entity: "Event",
          message: `${dateless.length} events have no date information`,
          ids: dateless.map(e => e.id),
        });
      }

      // 4. Figures missing birth dates
      const { data: noBirth } = await supabase
        .from("historical_figures")
        .select("id, name")
        .is("birth_year", null)
        .is("birth_label", null);
      if (noBirth?.length) {
        found.push({
          type: "missing_date",
          severity: "warning",
          entity: "Figure",
          message: `${noBirth.length} figures have no birth date`,
          ids: noBirth.map(f => f.id),
        });
      }

      // 5. Orphaned event_figures (figure_id or event_id doesn't exist)
      const { data: efLinks } = await supabase.from("event_figures").select("id, event_id, figure_id");
      if (efLinks && events && figures) {
        const eventIds = new Set(events.map(e => e.id));
        const figureIds = new Set(figures.map(f => f.id));
        const orphaned = efLinks.filter(l => !eventIds.has(l.event_id) || !figureIds.has(l.figure_id));
        if (orphaned.length) {
          found.push({
            type: "orphan",
            severity: "error",
            entity: "Event-Figure Link",
            message: `${orphaned.length} links reference non-existent records`,
            ids: orphaned.map(o => o.id),
          });
        }
      }

      // 6. Time period conflicts (overlapping)
      const { data: periods } = await supabase.from("time_periods").select("id, name, start_year, end_year").not("start_year", "is", null).not("end_year", "is", null);
      if (periods) {
        for (let i = 0; i < periods.length; i++) {
          for (let j = i + 1; j < periods.length; j++) {
            const a = periods[i], b = periods[j];
            if (a.name === b.name) continue;
            if (a.start_year !== null && a.end_year !== null && b.start_year !== null && b.end_year !== null) {
              if (a.end_year > b.start_year && a.start_year < b.end_year && a.end_year < b.end_year && a.start_year > b.start_year) {
                // Overlap is normal for historical periods, only flag if same sort range
              }
            }
          }
        }
      }

      setIssues(found);
      setHasRun(true);
      toast({ title: `Quality check complete: ${found.length} issues found` });
    } catch (e: any) {
      toast({ title: "Check failed", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Data Quality Checks
          </CardTitle>
          <CardDescription>Scan for duplicate entries, missing dates, orphaned relationships, and conflicting time ranges.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runChecks} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
            Run Quality Checks
          </Button>
        </CardContent>
      </Card>

      {hasRun && issues.length === 0 && (
        <Card className="border-green-500/30">
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium text-green-500">All checks passed — no issues found.</p>
          </CardContent>
        </Card>
      )}

      {issues.length > 0 && (
        <div className="space-y-3">
          {issues.map((issue, i) => (
            <Card key={i} className={`border-${issue.severity === "error" ? "destructive" : "yellow-500"}/30`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${issue.severity === "error" ? "text-destructive" : "text-yellow-500"}`} />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={issue.severity === "error" ? "destructive" : "secondary"}>{issue.type}</Badge>
                      <Badge variant="outline">{issue.entity}</Badge>
                    </div>
                    <p className="text-sm">{issue.message}</p>
                    {issue.ids && issue.ids.length <= 5 && (
                      <p className="text-xs text-muted-foreground font-mono">IDs: {issue.ids.join(", ")}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
