import { useParams, Link } from "react-router-dom";
import { allEvents, categoryLabels, eras } from "@/data/historicalData";
import { categoryColors } from "@/data/types";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Calendar, Tag, MapPin } from "lucide-react";
import ImageSlideshow from "@/components/ImageSlideshow";

const EventDetail = () => {
  const { eventId } = useParams();
  const event = allEvents.find((e) => e.id === eventId);

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 text-center">
          <h1 className="text-2xl font-display text-foreground">Event not found</h1>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const era = eras.find((e) => e.id === event.era);
  const categoryColor = categoryColors[event.category];

  // Build images array: combine primary imageUrl + any additional images
  const allImages: { url: string; caption?: string }[] = [];
  if (event.imageUrl) {
    allImages.push({ url: event.imageUrl, caption: event.title });
  }
  if (event.images) {
    event.images.forEach(img => {
      if (!allImages.some(a => a.url === img.url)) {
        allImages.push(img);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/archive" className="hover:text-primary transition-colors">Archive</Link>
            <span>/</span>
            {era && (
              <>
                <Link to={`/era/${era.id}`} className="hover:text-primary transition-colors">{era.name}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground truncate max-w-[200px]">{event.title}</span>
          </div>

          {/* Event Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Image Slideshow */}
            {allImages.length > 0 && (
              <ImageSlideshow
                images={allImages}
                sourceLinks={event.sourceLinks}
                alt={event.title}
                className="mb-8"
              />
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-white"
                style={{ backgroundColor: `hsl(${categoryColor})` }}
              >
                <Tag className="h-3 w-3" />
                {categoryLabels[event.category]}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {event.yearLabel}
              </span>
              {era && (
                <Link
                  to={`/era/${era.id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {era.name}
                </Link>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              {event.title}
            </h1>

            <div className="max-w-none space-y-4">
              {event.description.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>

          {/* Source Links */}
          {event.sourceLinks && event.sourceLinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10"
            >
              <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                Learn More
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.sourceLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-card-gradient border border-border rounded-lg p-4 hover:border-primary/40 transition-all group"
                  >
                    <ExternalLink className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {link.label}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Back nav */}
          <div className="mt-12 pt-8 border-t border-border">
            <Link
              to={era ? `/era/${era.id}` : "/archive"}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {era ? era.name : "Archive"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
