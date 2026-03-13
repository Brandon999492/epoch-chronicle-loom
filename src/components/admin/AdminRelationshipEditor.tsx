import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Link2, Plus, Trash2, Loader2 } from "lucide-react";

type RelationType = "event-figure" | "figure-dynasty" | "event-location" | "event-civilization";

export default function AdminRelationshipEditor() {
  const [relationType, setRelationType] = useState<RelationType>("event-figure");
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Search states
  const [sourceSearch, setSourceSearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const [sourceResults, setSourceResults] = useState<any[]>([]);
  const [targetResults, setTargetResults] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  const config: Record<RelationType, { sourceTable: string; targetTable: string; junction: string; sourceCol: string; targetCol: string; sourceLabel: string; targetLabel: string; hasRole: boolean }> = {
    "event-figure": { sourceTable: "historical_events", targetTable: "historical_figures", junction: "event_figures", sourceCol: "event_id", targetCol: "figure_id", sourceLabel: "Event", targetLabel: "Figure", hasRole: true },
    "figure-dynasty": { sourceTable: "historical_figures", targetTable: "dynasties", junction: "historical_figures", sourceCol: "id", targetCol: "dynasty_id", sourceLabel: "Figure", targetLabel: "Dynasty", hasRole: false },
    "event-location": { sourceTable: "historical_events", targetTable: "locations", junction: "historical_events", sourceCol: "id", targetCol: "location_id", sourceLabel: "Event", targetLabel: "Location", hasRole: false },
    "event-civilization": { sourceTable: "historical_events", targetTable: "civilizations", junction: "historical_events", sourceCol: "id", targetCol: "civilization_id", sourceLabel: "Event", targetLabel: "Civilization", hasRole: false },
  };

  const cfg = config[relationType];

  // Search source
  useEffect(() => {
    if (sourceSearch.length < 2) { setSourceResults([]); return; }
    const nameCol = cfg.sourceTable === "historical_events" ? "title" : "name";
    const timer = setTimeout(async () => {
      const { data } = await supabase.from(cfg.sourceTable as any).select("id, " + nameCol).ilike(nameCol, `%${sourceSearch}%`).limit(10);
      setSourceResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [sourceSearch, cfg.sourceTable]);

  // Search target
  useEffect(() => {
    if (targetSearch.length < 2) { setTargetResults([]); return; }
    const nameCol = cfg.targetTable === "historical_events" ? "title" : "name";
    const timer = setTimeout(async () => {
      const { data } = await supabase.from(cfg.targetTable as any).select("id, " + nameCol).ilike(nameCol, `%${targetSearch}%`).limit(10);
      setTargetResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [targetSearch, cfg.targetTable]);

  // Load existing links
  const loadLinks = async () => {
    if (relationType !== "event-figure") return;
    setLoading(true);
    const { data } = await supabase
      .from("event_figures")
      .select("id, role, event_id, figure_id")
      .limit(50)
      .order("event_id");
    setLinks(data || []);
    setLoading(false);
  };

  useEffect(() => { loadLinks(); }, [relationType]);

  const createLink = async () => {
    if (!selectedSource || !selectedTarget) {
      toast({ title: "Select both source and target", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      if (relationType === "event-figure") {
        const { error } = await supabase.from("event_figures").insert({
          event_id: selectedSource.id,
          figure_id: selectedTarget.id,
          role: role || null,
        });
        if (error) throw error;
      } else if (relationType === "figure-dynasty") {
        const { error } = await supabase.from("historical_figures").update({ dynasty_id: selectedTarget.id }).eq("id", selectedSource.id);
        if (error) throw error;
      } else if (relationType === "event-location") {
        const { error } = await supabase.from("historical_events").update({ location_id: selectedTarget.id }).eq("id", selectedSource.id);
        if (error) throw error;
      } else if (relationType === "event-civilization") {
        const { error } = await supabase.from("historical_events").update({ civilization_id: selectedTarget.id }).eq("id", selectedSource.id);
        if (error) throw error;
      }

      toast({ title: "Relationship created" });
      setSelectedSource(null);
      setSelectedTarget(null);
      setSourceSearch("");
      setTargetSearch("");
      setRole("");
      loadLinks();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("event_figures").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Link removed" });
      loadLinks();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={relationType} onValueChange={(v) => setRelationType(v as RelationType)}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event-figure">Event ↔ Figure</SelectItem>
            <SelectItem value="figure-dynasty">Figure → Dynasty</SelectItem>
            <SelectItem value="event-location">Event → Location</SelectItem>
            <SelectItem value="event-civilization">Event → Civilization</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" /> Create Relationship
          </CardTitle>
          <CardDescription>Search and link entities together</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{cfg.sourceLabel}</Label>
              <Input
                placeholder={`Search ${cfg.sourceLabel}...`}
                value={sourceSearch}
                onChange={(e) => { setSourceSearch(e.target.value); setSelectedSource(null); }}
              />
              {sourceResults.length > 0 && !selectedSource && (
                <div className="mt-1 border border-border rounded-md max-h-40 overflow-y-auto">
                  {sourceResults.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedSource(r); setSourceSearch(r.title || r.name); setSourceResults([]); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                    >
                      {r.title || r.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedSource && <Badge className="mt-1">{selectedSource.title || selectedSource.name}</Badge>}
            </div>
            <div>
              <Label>{cfg.targetLabel}</Label>
              <Input
                placeholder={`Search ${cfg.targetLabel}...`}
                value={targetSearch}
                onChange={(e) => { setTargetSearch(e.target.value); setSelectedTarget(null); }}
              />
              {targetResults.length > 0 && !selectedTarget && (
                <div className="mt-1 border border-border rounded-md max-h-40 overflow-y-auto">
                  {targetResults.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedTarget(r); setTargetSearch(r.title || r.name); setTargetResults([]); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                    >
                      {r.title || r.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedTarget && <Badge className="mt-1">{selectedTarget.title || selectedTarget.name}</Badge>}
            </div>
          </div>
          {cfg.hasRole && (
            <div>
              <Label>Role (optional)</Label>
              <Input placeholder="e.g. commander, witness, participant" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
          )}
          <Button onClick={createLink} disabled={saving || !selectedSource || !selectedTarget}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Create Link
          </Button>
        </CardContent>
      </Card>

      {relationType === "event-figure" && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm">Recent Event-Figure Links</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event ID</TableHead>
                    <TableHead>Figure ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs font-mono truncate max-w-[150px]">{l.event_id}</TableCell>
                      <TableCell className="text-xs font-mono truncate max-w-[150px]">{l.figure_id}</TableCell>
                      <TableCell>{l.role || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteLink(l.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
