const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Routes image URLs through our edge function proxy.
 * Uses the wiki article title from sourceLinks when possible (most reliable),
 * or proxies Wikimedia URLs directly.
 */
export function fixWikimediaUrl(url: string | undefined, sourceLinks?: { label: string; url: string }[]): string | undefined {
  if (!url) return url;

  if (url.includes("wikimedia.org") || url.includes("wikipedia.org")) {
    const wikiLink = sourceLinks?.find((l) => l.url.includes("en.wikipedia.org/wiki/"));
    if (wikiLink) {
      const match = wikiLink.url.match(/\/wiki\/([^#?]+)/);
      if (match) {
        return `${SUPABASE_URL}/functions/v1/image-proxy?wiki=${encodeURIComponent(match[1])}`;
      }
    }
    return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
}

export function wikiImageUrl(title: string): string {
  return `${SUPABASE_URL}/functions/v1/image-proxy?wiki=${encodeURIComponent(title)}`;
}

export function proxyImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return fixWikimediaUrl(url);
}

export function historyImageUrl(url: string | null | undefined, fallbackTitle?: string, sourceLinks?: { label: string; url: string }[]): string | undefined {
  return proxyImageUrl(url) || (fallbackTitle ? wikiImageUrl(fallbackTitle) : undefined);
}
