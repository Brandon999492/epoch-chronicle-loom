import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type EntityType = "historical_events" | "historical_figures" | "dynasties" | "civilizations" | "locations" | "time_periods" | "media_assets";

interface ColumnConfig {
  key: string;
  label: string;
  editable?: boolean;
  type?: "text" | "number" | "textarea" | "select";
  options?: string[];
}

const ENTITY_COLUMNS: Record<EntityType, ColumnConfig[]> = {
  historical_events: [
    { key: "title", label: "Title", editable: true },
    { key: "year_label", label: "Date", editable: true },
    { key: "year", label: "Year", editable: true, type: "number" },
    { key: "category", label: "Category", editable: true, type: "select", options: ["war","battle","politics","science","discovery","religion","monarchy","revolution","cultural","economic","disaster","exploration","legal","technology","philosophy","art","architecture","general","geology","evolution","mystery"] },
    { key: "significance", label: "Significance", editable: true, type: "number" },
    { key: "description", label: "Description", editable: true, type: "textarea" },
    { key: "detailed_description", label: "Detailed Desc.", editable: true, type: "textarea" },
    { key: "image_url", label: "Image URL", editable: true },
    { key: "tags", label: "Tags", editable: true },
  ],
  historical_figures: [
    { key: "name", label: "Name", editable: true },
    { key: "title", label: "Title/Role", editable: true },
    { key: "birth_label", label: "Born", editable: true },
    { key: "death_label", label: "Died", editable: true },
    { key: "birth_year", label: "Birth Year", editable: true, type: "number" },
    { key: "death_year", label: "Death Year", editable: true, type: "number" },
    { key: "biography", label: "Biography", editable: true, type: "textarea" },
    { key: "image_url", label: "Image URL", editable: true },
    { key: "tags", label: "Tags", editable: true },
  ],
  dynasties: [
    { key: "name", label: "Name", editable: true },
    { key: "start_label", label: "Start", editable: true },
    { key: "end_label", label: "End", editable: true },
    { key: "start_year", label: "Start Year", editable: true, type: "number" },
    { key: "end_year", label: "End Year", editable: true, type: "number" },
    { key: "description", label: "Description", editable: true, type: "textarea" },
    { key: "coat_of_arms_url", label: "Coat of Arms URL", editable: true },
  ],
  civilizations: [
    { key: "name", label: "Name", editable: true },
    { key: "start_label", label: "Start", editable: true },
    { key: "end_label", label: "End", editable: true },
    { key: "start_year", label: "Start Year", editable: true, type: "number" },
    { key: "end_year", label: "End Year", editable: true, type: "number" },
    { key: "description", label: "Description", editable: true, type: "textarea" },
  ],
  locations: [
    { key: "name", label: "Name", editable: true },
    { key: "country", label: "Country", editable: true },
    { key: "continent", label: "Continent", editable: true },
    { key: "region", label: "Region", editable: true },
    { key: "latitude", label: "Latitude", editable: true, type: "number" },
    { key: "longitude", label: "Longitude", editable: true, type: "number" },
    { key: "description", label: "Description", editable: true, type: "textarea" },
  ],
  time_periods: [
    { key: "name", label: "Name", editable: true },
    { key: "start_label", label: "Start", editable: true },
    { key: "end_label", label: "End", editable: true },
    { key: "start_year", label: "Start Year", editable: true, type: "number" },
    { key: "end_year", label: "End Year", editable: true, type: "number" },
    { key: "sort_order", label: "Sort Order", editable: true, type: "number" },
    { key: "description", label: "Description", editable: true, type: "textarea" },
  ],
  media_assets: [
    { key: "title", label: "Title", editable: true },
    { key: "url", label: "URL", editable: true },
    { key: "media_type", label: "Type", editable: true, type: "select", options: ["image","video","audio","document"] },
    { key: "source", label: "Source", editable: true },
    { key: "description", label: "Description", editable: true, type: "textarea" },
    { key: "tags", label: "Tags", editable: true },
  ],
};

const DISPLAY_COLS: Record<EntityType, string[]> = {
  historical_events: ["title", "year_label", "category", "significance"],
  historical_figures: ["name", "title", "birth_label", "death_label"],
  dynasties: ["name", "start_label", "end_label"],
  civilizations: ["name", "start_label", "end_label"],
  locations: ["name", "country", "continent"],
  time_periods: ["name", "start_label", "end_label", "sort_order"],
  media_assets: ["title", "media_type", "source"],
};

const ENTITY_LABELS: Record<EntityType, string> = {
  historical_events: "Historical Events",
  historical_figures: "Historical Figures",
  dynasties: "Dynasties",
  civilizations: "Civilizations",
  locations: "Locations",
  time_periods: "Time Periods",
  media_assets: "Media Assets",
};

interface AdminDataTableProps {
  entityType: EntityType;
}

export default function AdminDataTable({ entityType }: AdminDataTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const limit = 20;

  const columns = ENTITY_COLUMNS[entityType];
  const displayCols = DISPLAY_COLS[entityType];

  const fetchData = useCallback(async () => {
    setLoading(true);
    const nameCol = entityType === "historical_events" ? "title" : entityType === "historical_figures" ? "name" : "name";

    let query = supabase.from(entityType).select("*", { count: "exact" });

    if (search) {
      query = query.ilike(nameCol, `%${search}%`);
    }

    const { data: rows, count, error } = await query
      .range(page * limit, (page + 1) * limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading data", description: error.message, variant: "destructive" });
    } else {
      setData(rows || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [entityType, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(0); }, [entityType, search]);

  const openCreate = () => {
    const item: any = {};
    columns.forEach(c => { item[c.key] = c.type === "number" ? null : ""; });
    setEditItem(item);
    setIsNew(true);
    setEditOpen(true);
  };

  const openEdit = (row: any) => {
    setEditItem({ ...row });
    setIsNew(false);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);

    const payload: any = {};
    columns.forEach(c => {
      let val = editItem[c.key];
      if (c.key === "tags" && typeof val === "string") {
        val = val.split(",").map((t: string) => t.trim()).filter(Boolean);
      }
      if (c.type === "number" && val !== null && val !== "") {
        val = Number(val);
      }
      payload[c.key] = val === "" ? null : val;
    });

    if (entityType === "historical_events" && !payload.title) {
      toast({ title: "Title is required", variant: "destructive" });
      setSaving(false);
      return;
    }

    let error;
    if (isNew) {
      if (entityType === "historical_events") {
        payload.slug = payload.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
      }
      const res = await supabase.from(entityType).insert(payload);
      error = res.error;
    } else {
      const res = await supabase.from(entityType).update(payload).eq("id", editItem.id);
      error = res.error;
    }

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isNew ? "Record created" : "Record updated" });
      setEditOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    const { error } = await supabase.from(entityType).delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Record deleted" });
      fetchData();
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${ENTITY_LABELS[entityType]}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{total} records</Badge>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No records found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {displayCols.map(col => {
                    const cfg = columns.find(c => c.key === col);
                    return <TableHead key={col}>{cfg?.label || col}</TableHead>;
                  })}
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(row => (
                  <TableRow key={row.id}>
                    {displayCols.map(col => (
                      <TableCell key={col} className="max-w-[200px] truncate">
                        {Array.isArray(row[col]) ? row[col].join(", ") : String(row[col] ?? "—")}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Create" : "Edit"} {ENTITY_LABELS[entityType].slice(0, -1)}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.filter(c => c.editable).map(col => (
                <div key={col.key} className={col.type === "textarea" ? "md:col-span-2" : ""}>
                  <Label className="text-xs font-medium mb-1 block">{col.label}</Label>
                  {col.type === "textarea" ? (
                    <Textarea
                      value={Array.isArray(editItem[col.key]) ? editItem[col.key].join(", ") : editItem[col.key] || ""}
                      onChange={(e) => setEditItem({ ...editItem, [col.key]: e.target.value })}
                      rows={3}
                    />
                  ) : col.type === "select" ? (
                    <Select
                      value={editItem[col.key] || ""}
                      onValueChange={(v) => setEditItem({ ...editItem, [col.key]: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {col.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={col.type === "number" ? "number" : "text"}
                      value={editItem[col.key] ?? ""}
                      onChange={(e) => setEditItem({ ...editItem, [col.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isNew ? "Create" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
