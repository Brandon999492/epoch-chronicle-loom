import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, Download, PenLine, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const IMAGE_STYLES = [
  { value: "realistic", label: "Photorealistic" },
  { value: "painting", label: "Oil Painting" },
  { value: "sketch", label: "Pencil Sketch" },
  { value: "watercolor", label: "Watercolor" },
  { value: "3d", label: "3D Render" },
  { value: "map", label: "Historical Map" },
  { value: "portrait", label: "Portrait" },
  { value: "battle", label: "Battle Scene" },
  { value: "architecture", label: "Architecture" },
  { value: "manuscript", label: "Medieval Manuscript" },
];

const IMAGE_ERAS = [
  { value: "any", label: "Any era" },
  { value: "ancient", label: "Ancient (3000 BC - 500 AD)" },
  { value: "medieval", label: "Medieval (500 - 1500)" },
  { value: "renaissance", label: "Renaissance (1400 - 1600)" },
  { value: "early-modern", label: "Early Modern (1500 - 1800)" },
  { value: "modern", label: "Modern (1800 - present)" },
];

interface AiImagePanelProps {
  onGenerate: (prompt: string) => Promise<string | null>;
  onDownload: (url: string) => void;
  onSaveToJournal: (url: string, prompt: string) => void;
}

export function AiImagePanel({ onGenerate, onDownload, onSaveToJournal }: AiImagePanelProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [era, setEra] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt: string }[]>([]);
  const [expanded, setExpanded] = useState(true);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);

    const styleLabel = IMAGE_STYLES.find(s => s.value === style)?.label || "";
    const eraLabel = IMAGE_ERAS.find(e => e.value === era)?.label || "";
    const fullPrompt = `${prompt.trim()}${eraLabel ? `, ${eraLabel} period` : ""}${styleLabel ? `, ${styleLabel} style` : ""}`;

    const url = await onGenerate(fullPrompt);
    if (url) {
      setGeneratedImages(prev => [{ url, prompt: fullPrompt }, ...prev]);
    }
    setGenerating(false);
  };

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
      >
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" /> AI Historical Image Studio
        </h3>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Describe your historical scene</Label>
                <Input
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="e.g. The signing of the Magna Carta, 1215..."
                  className="text-sm"
                  onKeyDown={e => { if (e.key === "Enter") handleGenerate(); }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Art Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_STYLES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Historical Era</Label>
                  <Select value={era} onValueChange={setEra}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_ERAS.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
              >
                {generating ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Generate Image
                  </>
                )}
              </Button>

              {/* Generated images gallery */}
              {generatedImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{generatedImages.length} image{generatedImages.length > 1 ? "s" : ""} generated</Label>
                  <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                      {generatedImages.map((img, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                          <img src={img.url} alt="AI Historical Reconstruction" className="w-full" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-[10px] text-white/80 line-clamp-1">{img.prompt}</p>
                            <p className="text-[9px] text-white/50">AI Historical Reconstruction</p>
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7"
                              onClick={() => onDownload(img.url)}
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7"
                              onClick={() => onSaveToJournal(img.url, img.prompt)}
                              title="Save to journal"
                            >
                              <PenLine className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
