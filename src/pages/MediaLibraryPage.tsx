import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { historyApi, type MediaAsset } from "@/services/historyApi";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon, Film, Music, FileText, Upload, Search, Filter,
  Grid3X3, List, X, ChevronDown, ExternalLink, Download, ZoomIn, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type ViewMode = "grid" | "list";
type MediaFilter = "" | "image" | "video" | "audio" | "document";

const mediaTypeIcon = (type: string) => {
  if (type.includes("video")) return Film;
  if (type.includes("audio")) return Music;
  if (type.includes("document") || type.includes("text")) return FileText;
  return ImageIcon;
};

const MediaLibraryPage = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaFilter>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [activeTab, setActiveTab] = useState<"public" | "my">("public");

  const limit = viewMode === "grid" ? 24 : 20;

  // Public media library
  const { data: publicMedia, isLoading: publicLoading } = useQuery({
    queryKey: ["media-library", "public", query, typeFilter, page, limit],
    queryFn: () => historyApi.media.list({ q: query || undefined, type: typeFilter || undefined, page, limit }),
    staleTime: 30_000,
  });

  // User's uploaded media
  const { data: userMedia, isLoading: userLoading } = useQuery({
    queryKey: ["media-library", "user", user?.id],
    queryFn: async () => {
      if (!user) return { data: [], total: 0, page: 1, limit: 100 };
      const { data } = await supabase
        .from("media_assets")
        .select("*")
        .eq("uploaded_by", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return { data: data || [], total: data?.length || 0, page: 1, limit: 100 };
    },
    enabled: !!user,
    staleTime: 15_000,
  });

  const currentData = activeTab === "public" ? publicMedia : userMedia;
  const isLoading = activeTab === "public" ? publicLoading : userLoading;

  const totalPages = currentData ? Math.ceil((currentData.total || 0) / limit) : 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Media Library</h1>
            <p className="text-muted-foreground">
              Browse historical images, AI-generated artwork, and multimedia attached to events and figures.
            </p>
          </motion.div>

          {/* Tabs: Public vs My Media */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "public" | "my"); setPage(1); }} className="mb-6">
            <TabsList>
              <TabsTrigger value="public">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                Public Library
              </TabsTrigger>
              {user && (
                <TabsTrigger value="my">
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  My Media
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search media…"
                className="w-full rounded-lg bg-secondary/80 border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex gap-1">
              {([
                { value: "" as MediaFilter, label: "All" },
                { value: "image" as MediaFilter, label: "Images" },
                { value: "video" as MediaFilter, label: "Videos" },
              ]).map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setTypeFilter(f.value); setPage(1); }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    typeFilter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1 ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Media Grid/List */}
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3" : "space-y-2"}>
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className={viewMode === "grid" ? "aspect-square rounded-lg" : "h-16 rounded-lg"} />
              ))}
            </div>
          ) : !currentData?.data?.length ? (
            <div className="text-center py-20">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {activeTab === "my" ? "You haven't uploaded any media yet." : "No media found."}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3"
            >
              {currentData.data.map((media: any) => {
                const Icon = mediaTypeIcon(media.media_type);
                return (
                  <motion.div
                    key={media.id}
                    whileHover={{ scale: 1.02 }}
                    className="group relative rounded-lg overflow-hidden border border-border bg-card cursor-pointer"
                    onClick={() => setSelectedMedia(media)}
                  >
                    {media.media_type === "image" || media.thumbnail_url ? (
                      <img
                        src={media.thumbnail_url || media.url}
                        alt={media.title || ""}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        <Icon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs font-medium truncate">{media.title || "Untitled"}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant="secondary" className="text-[9px] bg-white/20 text-white border-0 capitalize">
                            {media.media_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <button className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="space-y-2">
              {currentData.data.map((media: any) => {
                const Icon = mediaTypeIcon(media.media_type);
                return (
                  <div
                    key={media.id}
                    className="flex items-center gap-4 bg-card-gradient border border-border rounded-lg p-3 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => setSelectedMedia(media)}
                  >
                    {media.thumbnail_url || media.media_type === "image" ? (
                      <img src={media.thumbnail_url || media.url} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{media.title || "Untitled"}</p>
                      {media.description && <p className="text-xs text-muted-foreground truncate">{media.description}</p>}
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{media.media_type}</Badge>
                    {media.source && <span className="text-xs text-muted-foreground hidden md:block">{media.source}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {activeTab === "public" && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}

          {/* Media Detail Dialog */}
          <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
            <DialogContent className="max-w-3xl">
              {selectedMedia && (
                <div className="space-y-4">
                  {selectedMedia.media_type === "image" ? (
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.title || ""}
                      className="w-full max-h-[60vh] object-contain rounded-lg bg-black/5"
                    />
                  ) : selectedMedia.media_type === "video" ? (
                    <video src={selectedMedia.url} controls className="w-full max-h-[60vh] rounded-lg" />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-display font-bold text-foreground">{selectedMedia.title || "Untitled"}</h3>
                    {selectedMedia.description && (
                      <p className="text-muted-foreground mt-1">{selectedMedia.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary" className="capitalize">{selectedMedia.media_type}</Badge>
                      {selectedMedia.source && <Badge variant="outline">{selectedMedia.source}</Badge>}
                      {selectedMedia.license && <Badge variant="outline">{selectedMedia.license}</Badge>}
                      {selectedMedia.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      {selectedMedia.source_url && (
                        <a href={selectedMedia.source_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Source
                          </Button>
                        </a>
                      )}
                      <a href={selectedMedia.url} target="_blank" rel="noopener noreferrer" download>
                        <Button variant="outline" size="sm">
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Download
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};


export default MediaLibraryPage;
