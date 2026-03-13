import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, Loader2, Clock, Pencil } from "lucide-react";

const INGEST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-ingest`;

export default function AdminReviewQueue() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editData, setEditData] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("draft_entries")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading drafts", description: error.message, variant: "destructive" });
    } else {
      setDrafts(data || []);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const openView = (item: any) => {
    setViewItem(item);
    setEditData(JSON.stringify(item.generated_data, null, 2));
    setViewOpen(true);
  };

  const updateStatus = async (id: string, status: "approved" | "rejected", publishData?: any) => {
    setProcessing(id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // If approving, ingest the data into the actual tables
      if (status === "approved" && publishData) {
        const genData = publishData;

        // Try to ingest events
        if (genData.events?.length) {
          const resp = await fetch(`${INGEST_URL}/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ items: genData.events }),
          });
          if (!resp.ok) {
            const e = await resp.json().catch(() => ({}));
            throw new Error(e.error || "Failed to ingest events");
          }
        }

        // Try to ingest figures
        if (genData.figures?.length) {
          const resp = await fetch(`${INGEST_URL}/figures`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ items: genData.figures }),
          });
          if (!resp.ok) {
            const e = await resp.json().catch(() => ({}));
            throw new Error(e.error || "Failed to ingest figures");
          }
        }

        // Single event object
        if (genData.title && !genData.events) {
          const resp = await fetch(`${INGEST_URL}/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ items: [genData] }),
          });
          if (!resp.ok) {
            const e = await resp.json().catch(() => ({}));
            throw new Error(e.error || "Failed to ingest entry");
          }
        }
      }

      const { error } = await supabase
        .from("draft_entries")
        .update({
          status,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: status === "approved" ? "Entry approved and published" : "Entry rejected" });
      setViewOpen(false);
      fetchDrafts();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const saveEdits = async () => {
    if (!viewItem) return;
    try {
      const parsed = JSON.parse(editData);
      const { error } = await supabase
        .from("draft_entries")
        .update({ generated_data: parsed, updated_at: new Date().toISOString() })
        .eq("id", viewItem.id);
      if (error) throw error;
      toast({ title: "Edits saved" });
      setViewItem({ ...viewItem, generated_data: parsed });
      fetchDrafts();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const statusColors = { pending: "secondary", approved: "default", rejected: "destructive" } as const;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map(s => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
            className="capitalize"
          >
            {s === "pending" && <Clock className="h-4 w-4 mr-1" />}
            {s === "approved" && <CheckCircle className="h-4 w-4 mr-1" />}
            {s === "rejected" && <XCircle className="h-4 w-4 mr-1" />}
            {s}
          </Button>
        ))}
        <Badge variant="outline" className="ml-auto">{drafts.length} entries</Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : drafts.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center text-muted-foreground">No {filter} entries.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {drafts.map(draft => (
            <Card key={draft.id} className="border-border/50">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{draft.title}</span>
                    <Badge variant={statusColors[draft.status as keyof typeof statusColors]}>{draft.status}</Badge>
                    {draft.category && <Badge variant="outline" className="text-xs">{draft.category}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {draft.topic && `Topic: ${draft.topic} • `}
                    Created: {new Date(draft.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openView(draft)}>
                    <Eye className="h-4 w-4 mr-1" /> Review
                  </Button>
                  {draft.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(draft.id, "approved", draft.generated_data)}
                        disabled={!!processing}
                      >
                        {processing === draft.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateStatus(draft.id, "rejected")}
                        disabled={!!processing}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review: {viewItem?.title}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editData}
            onChange={(e) => setEditData(e.target.value)}
            rows={20}
            className="font-mono text-xs"
          />
          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={saveEdits}>
              <Pencil className="h-4 w-4 mr-1" /> Save Edits
            </Button>
            {viewItem?.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(editData);
                      updateStatus(viewItem.id, "approved", parsed);
                    } catch {
                      toast({ title: "Invalid JSON", variant: "destructive" });
                    }
                  }}
                  disabled={!!processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Approve & Publish
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => updateStatus(viewItem.id, "rejected")}
                  disabled={!!processing}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
