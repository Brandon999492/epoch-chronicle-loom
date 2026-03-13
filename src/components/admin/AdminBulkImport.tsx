import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Upload, FileJson, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const INGEST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-ingest`;

const ENTITY_OPTIONS = [
  { value: "events", label: "Historical Events" },
  { value: "figures", label: "Historical Figures" },
  { value: "dynasties", label: "Dynasties" },
  { value: "civilizations", label: "Civilizations" },
  { value: "locations", label: "Locations" },
  { value: "time-periods", label: "Time Periods" },
  { value: "relationships", label: "Figure Relationships" },
];

function parseCSV(text: string): any[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = values[i] || null; });
    return obj;
  });
}

export default function AdminBulkImport() {
  const { user } = useAuth();
  const [entityType, setEntityType] = useState("events");
  const [jsonInput, setJsonInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doImport = async (items: any[]) => {
    if (!items.length) {
      toast({ title: "No items to import", variant: "destructive" });
      return;
    }
    setImporting(true);
    setProgress(10);
    setResults(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast({ title: "Not authenticated", variant: "destructive" });
      setImporting(false);
      return;
    }

    try {
      const batchSize = 20;
      let totalInserted = 0, totalSkipped = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        setProgress(10 + Math.round((i / items.length) * 85));

        const resp = await fetch(`${INGEST_URL}/${entityType}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ items: batch }),
        });

        if (!resp.ok) {
          const e = await resp.json().catch(() => ({}));
          allErrors.push(e.error || `HTTP ${resp.status}`);
          continue;
        }

        const result = await resp.json();
        totalInserted += result.inserted || 0;
        totalSkipped += result.skipped || 0;
        if (result.errors?.length) allErrors.push(...result.errors);
      }

      setProgress(100);
      setResults({ inserted: totalInserted, skipped: totalSkipped, errors: allErrors });
      toast({ title: `Import complete: ${totalInserted} inserted, ${totalSkipped} skipped` });
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      doImport(items);
    } catch {
      toast({ title: "Invalid JSON", variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (file.name.endsWith(".csv")) {
        doImport(parseCSV(text));
      } else {
        try {
          const parsed = JSON.parse(text);
          doImport(Array.isArray(parsed) ? parsed : [parsed]);
        } catch {
          toast({ title: "Invalid file format", variant: "destructive" });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" /> JSON Import
            </CardTitle>
            <CardDescription>Paste a JSON array of records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder={`[\n  { "title": "Battle of Hastings", "year": 1066, "category": "battle" }\n]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
            <Button onClick={handleJsonImport} disabled={importing || !jsonInput.trim()}>
              {importing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Import JSON
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" /> File Upload
            </CardTitle>
            <CardDescription>Upload a JSON or CSV file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input ref={fileRef} type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden" />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload JSON or CSV</p>
              <p className="text-xs text-muted-foreground mt-1">Fields are automatically mapped to the database schema</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {importing && (
        <div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-center">{progress}% complete</p>
        </div>
      )}

      {results && (
        <Card className="border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              {results.errors.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <div className="flex gap-2">
                <Badge variant="secondary">{results.inserted} inserted</Badge>
                <Badge variant="outline">{results.skipped} skipped</Badge>
                {results.errors.length > 0 && (
                  <Badge variant="destructive">{results.errors.length} errors</Badge>
                )}
              </div>
            </div>
            {results.errors.length > 0 && (
              <div className="mt-3 text-xs text-destructive space-y-1 max-h-32 overflow-y-auto">
                {results.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
