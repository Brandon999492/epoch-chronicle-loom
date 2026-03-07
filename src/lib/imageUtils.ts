const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Routes image URLs through our edge function proxy.
 * Uses the wiki article title from sourceLinks when possible (most reliable),
 * or proxies Wikimedia URLs directly.
 */
export function fixWikimediaUrl(url: string | undefined, sourceLinks?: { label: string; url: string }[]): string | undefined {
  if (!url) return url;

  // If it's a wikimedia/wikipedia URL, always proxy it
  if (url.includes("wikimedia.org") || url.includes("wikipedia.org")) {
    // Try to get Wikipedia article title from source links for reliable lookup
    const wikiLink = sourceLinks?.find(l => l.url.includes("en.wikipedia.org/wiki/"));
    if (wikiLink) {
      const match = wikiLink.url.match(/\/wiki\/([^#?]+)/);
      if (match) {
        return `${SUPABASE_URL}/functions/v1/image-proxy?wiki=${encodeURIComponent(match[1])}`;
      }
    }
    // Fallback: proxy the URL directly
    return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
}

/**
 * Generates a Wikipedia API image proxy URL from a wiki article title.
 */
export function wikiImageUrl(title: string): string {
  return `${SUPABASE_URL}/functions/v1/image-proxy?wiki=${encodeURIComponent(title)}`;
}
