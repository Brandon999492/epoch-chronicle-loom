import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fixWikimediaUrl } from "@/lib/imageUtils";

interface ImageSlideshowProps {
  images: { url: string; caption?: string }[];
  sourceLinks?: { label: string; url: string }[];
  alt: string;
  className?: string;
  compact?: boolean;
}

const ImageSlideshow = ({ images, sourceLinks, alt, className = "", compact = false }: ImageSlideshowProps) => {
  const [current, setCurrent] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());

  const workingImages = images.filter((_, i) => !failedIndexes.has(i));

  const handleError = useCallback((index: number) => {
    setFailedIndexes(prev => new Set(prev).add(index));
  }, []);

  if (workingImages.length === 0) return null;

  const safeIndex = current >= workingImages.length ? 0 : current;
  const img = workingImages[safeIndex];
  const originalIndex = images.indexOf(img);

  const prev = () => setCurrent((safeIndex - 1 + workingImages.length) % workingImages.length);
  const next = () => setCurrent((safeIndex + 1) % workingImages.length);

  if (compact) {
    return (
      <div className={`relative overflow-hidden rounded-md ${className}`}>
        <img
          src={fixWikimediaUrl(img.url, sourceLinks)}
          alt={img.caption || alt}
          className="w-full h-40 object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => handleError(originalIndex)}
        />
        {workingImages.length > 1 && (
          <div className="absolute bottom-1 right-1 bg-background/70 text-foreground text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            {safeIndex + 1}/{workingImages.length}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border ${className}`}>
      <div className="relative bg-secondary/30">
        <img
          src={fixWikimediaUrl(img.url, sourceLinks)}
          alt={img.caption || alt}
          className="w-full max-h-[500px] object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => handleError(originalIndex)}
        />

        {workingImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 backdrop-blur-sm transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 backdrop-blur-sm transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {(img.caption || workingImages.length > 1) && (
        <div className="flex items-center justify-between px-4 py-2 bg-card/80 border-t border-border">
          <p className="text-xs text-muted-foreground truncate flex-1">
            {img.caption || alt}
          </p>
          {workingImages.length > 1 && (
            <div className="flex items-center gap-1.5 ml-3 shrink-0">
              {workingImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === safeIndex ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageSlideshow;
