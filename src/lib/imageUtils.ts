const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Routes Wikimedia image URLs through our edge function proxy.
 * Converts broken direct URLs to proxy calls using the wiki article title
 * extracted from the sourceLinks, or proxies the URL directly.
 */
export function fixWikimediaUrl(url: string | undefined, sourceLinks?: { label: string; url: string }[]): string | undefined {
  if (!url) return url;

  // If it's a wikimedia URL, try to extract a wiki title from sourceLinks for reliable lookup
  if (url.includes("wikimedia.org") || url.includes("wikipedia.org")) {
    // Try to get Wikipedia article title from source links
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
