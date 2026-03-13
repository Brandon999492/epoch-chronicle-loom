import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Image, Upload, Search, Loader2, Pencil, Trash2, ExternalLink } from "lucide-react";

export default function AdminMediaManager() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editItem, setEditItem] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const limit = 20;

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("media_assets").select("*", { count: "exact" });
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    if (typeFilter !== "all") query = query.eq("media_type", typeFilter);

    const { data, count, error } = await query
      .range(page * limit, (page + 1) * limit - 1)
      .order("created_at", { ascending: false });

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setAssets(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [search, typeFilter, page]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

      const mediaType = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "image";

      const { error: insertError } = await supabase.from("media_assets").insert({
        url: publicUrl,
        media_type: mediaType,
        title: file.name.replace(/\.[^.]+$/, ""),
        tags: [],
      });
      if (insertError) throw insertError;

      toast({ title: "File uploaded and added to media library" });
      fetchAssets();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    const tags = typeof editItem.tags === "string"
      ? editItem.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : editItem.tags;

    const { error } = await supabase.from("media_assets").update({
      title: editItem.title,
      description: editItem.description,
      source: editItem.source,
      source_url: editItem.source_url,
      media_type: editItem.media_type,
      tags,
    }).eq("id", editItem.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Asset updated" });
      setEditOpen(false);
      fetchAssets();
    }
    setSaving(false);
  };

  const deleteAsset = async (id: string) => {
    if (!confirm("Delete this media asset?")) return;
    const { error } = await supabase.from("media_assets").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Asset deleted" });
      fetchAssets();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search media..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
        <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" onChange={handleUpload} className="hidden" />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
          Upload
        </Button>
        <Badge variant="secondary">{total} assets</Badge>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : assets.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No media assets found.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map(asset => (
            <Card key={asset.id} className="border-border/50 overflow-hidden group">
              <div className="aspect-square bg-secondary/50 relative">
                {asset.media_type === "image" ? (
                  <img src={asset.thumbnail_url || asset.url} alt={asset.title || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => { setEditItem({ ...asset, tags: Array.isArray(asset.tags) ? asset.tags.join(", ") : "" }); setEditOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => window.open(asset.url, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => deleteAsset(asset.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{asset.title || "Untitled"}</p>
                <Badge variant="outline" className="text-[10px] mt-1">{asset.media_type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {Math.ceil(total / limit) > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {page + 1} / {Math.ceil(total / limit)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit) - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Media Asset</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={editItem.title || ""} onChange={(e) => setEditItem({ ...editItem, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={editItem.description || ""} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Source</Label><Input value={editItem.source || ""} onChange={(e) => setEditItem({ ...editItem, source: e.target.value })} /></div>
                <div><Label>Source URL</Label><Input value={editItem.source_url || ""} onChange={(e) => setEditItem({ ...editItem, source_url: e.target.value })} /></div>
              </div>
              <div><Label>Tags (comma separated)</Label><Input value={editItem.tags || ""} onChange={(e) => setEditItem({ ...editItem, tags: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
