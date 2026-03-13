import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { eras } from "@/data/historicalData";
import { featuredFigures } from "@/data/figures";
import { CheckCircle, AlertCircle, Loader2, Database, Upload } from "lucide-react";

interface StepResult {
  status: "idle" | "running" | "done" | "error";
  inserted: number;
  skipped: number;
  errors: string[];
}

const INGEST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-ingest`;

async function ingestBatch(action: string, items: any[], token: string): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const resp = await fetch(`${INGEST_URL}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default function SeedDataPage() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [log, setLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const updateResult = useCallback((key: string, update: Partial<StepResult>) => {
    setResults((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...update } as StepResult,
    }));
  }, []);

  const runSeed = async () => {
    if (running) return;
    setRunning(true);
    setLog([]);
    setResults({});
    setProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        addLog("ERROR: Not authenticated. Please log in first.");
        setRunning(false);
        return;
      }
      const token = session.access_token;

      // ===== STEP 1: Time Periods from Eras =====
      setCurrentStep("Time Periods");
      setProgress(5);
      const timePeriods = eras.map((era, i) => ({
        name: era.name,
        start_year: era.startYear,
        end_year: era.endYear,
        start_label: era.period.split("–")[0]?.trim() || era.period.split("—")[0]?.trim() || null,
        end_label: era.period.split("–")[1]?.trim() || era.period.split("—")[1]?.trim() || null,
        description: era.description,
        sort_order: i,
      }));

      updateResult("timePeriods", { status: "running", inserted: 0, skipped: 0, errors: [] });
      addLog(`Seeding ${timePeriods.length} time periods...`);

      try {
        const tpResult = await ingestBatch("time-periods", timePeriods, token);
        updateResult("timePeriods", { status: "done", ...tpResult });
        addLog(`Time periods: ${tpResult.inserted} inserted, ${tpResult.skipped} skipped`);
      } catch (e: any) {
        updateResult("timePeriods", { status: "error", inserted: 0, skipped: 0, errors: [e.message] });
        addLog(`ERROR (time periods): ${e.message}`);
      }

      // ===== STEP 2: Historical Figures =====
      setCurrentStep("Historical Figures");
      setProgress(20);
      const figures = featuredFigures.map((f) => {
        const parseBirthYear = (born: string): number | null => {
          const m = born.match(/(\d+)/);
          if (!m) return null;
          const y = parseInt(m[1]);
          return born.toLowerCase().includes("bce") ? -y : y;
        };
        return {
          name: f.name,
          birth_year: parseBirthYear(f.born),
          death_year: parseBirthYear(f.died),
          birth_label: f.born,
          death_label: f.died,
          title: f.role,
          biography: f.description,
          tags: [f.era],
        };
      });

      updateResult("figures", { status: "running", inserted: 0, skipped: 0, errors: [] });
      addLog(`Seeding ${figures.length} historical figures...`);

      try {
        const fResult = await ingestBatch("figures", figures, token);
        updateResult("figures", { status: "done", ...fResult });
        addLog(`Figures: ${fResult.inserted} inserted, ${fResult.skipped} skipped`);
      } catch (e: any) {
        updateResult("figures", { status: "error", inserted: 0, skipped: 0, errors: [e.message] });
        addLog(`ERROR (figures): ${e.message}`);
      }

      // ===== STEP 3: Historical Events (in batches) =====
      setCurrentStep("Historical Events");
      setProgress(35);

      const allEvents = eras.flatMap((era) =>
        era.events.map((evt) => ({
          title: evt.title,
          year: evt.year,
          year_label: evt.yearLabel,
          description: evt.description,
          category: evt.category,
          image_url: evt.imageUrl || null,
          time_period_name: era.name,
          significance: 5,
        }))
      );

      updateResult("events", { status: "running", inserted: 0, skipped: 0, errors: [] });
      addLog(`Seeding ${allEvents.length} historical events in batches...`);

      const eventChunks = chunkArray(allEvents, 10);
      let totalInserted = 0, totalSkipped = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < eventChunks.length; i++) {
        const pct = 35 + Math.round((i / eventChunks.length) * 55);
        setProgress(pct);
        setCurrentStep(`Historical Events (batch ${i + 1}/${eventChunks.length})`);

        try {
          const result = await ingestBatch("events", eventChunks[i], token);
          totalInserted += result.inserted;
          totalSkipped += result.skipped;
          if (result.errors?.length) allErrors.push(...result.errors);
          addLog(`Batch ${i + 1}: ${result.inserted} inserted, ${result.skipped} skipped`);
        } catch (e: any) {
          allErrors.push(`Batch ${i + 1}: ${e.message}`);
          addLog(`ERROR batch ${i + 1}: ${e.message}`);
        }
      }

      updateResult("events", {
        status: allErrors.length > 0 && totalInserted === 0 ? "error" : "done",
        inserted: totalInserted,
        skipped: totalSkipped,
        errors: allErrors,
      });
      addLog(`Events total: ${totalInserted} inserted, ${totalSkipped} skipped, ${allErrors.length} errors`);

      setProgress(100);
      setCurrentStep("Complete");
      addLog("✅ Seed process complete!");
    } catch (e: any) {
      addLog(`FATAL ERROR: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Please log in as an admin to use this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-display font-bold text-foreground">
            Seed Historical Database
          </h1>
        </div>

        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Data Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>{eras.length}</strong> time periods/eras</p>
            <p><strong>{eras.reduce((sum, era) => sum + era.events.length, 0)}</strong> historical events</p>
            <p><strong>{featuredFigures.length}</strong> historical figures</p>
            <p className="text-xs mt-3">
              This will ingest all frontend static data into the database. Duplicates are automatically skipped.
              You must be an admin to run this.
            </p>
          </CardContent>
        </Card>

        <Button
          onClick={runSeed}
          disabled={running}
          size="lg"
          className="w-full mb-6"
        >
          {running ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Seeding... {currentStep}
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Start Database Seed
            </>
          )}
        </Button>

        {running && (
          <div className="mb-6">
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1 text-center">{progress}%</p>
          </div>
        )}

        {Object.keys(results).length > 0 && (
          <div className="space-y-3 mb-6">
            {Object.entries(results).map(([key, r]) => (
              <Card key={key} className="border-border/50">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {r.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {r.status === "done" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {r.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                    <span className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{r.inserted} inserted</Badge>
                    <Badge variant="outline">{r.skipped} skipped</Badge>
                    {r.errors.length > 0 && (
                      <Badge variant="destructive">{r.errors.length} errors</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {log.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ingestion Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/50 rounded-md p-3 max-h-64 overflow-y-auto font-mono text-xs space-y-0.5">
                {log.map((line, i) => (
                  <div key={i} className={line.includes("ERROR") ? "text-destructive" : "text-muted-foreground"}>
                    {line}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
