import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const url = new URL(req.url);
  const imageUrl = url.searchParams.get("url");
  const wikiTitle = url.searchParams.get("wiki");

  let targetUrl = imageUrl;

  // If wiki title provided, fetch the image URL from Wikipedia API
  if (wikiTitle && !imageUrl) {
    try {
      const apiRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
        { headers: { "User-Agent": "EpochAtlas/1.0 (educational project)" } }
      );
      if (apiRes.ok) {
        const data = await apiRes.json();
        targetUrl = data.thumbnail?.source || data.originalimage?.source;
      }
      if (!targetUrl) {
        return new Response("No image found for this article", { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
      }
    } catch {
      return new Response("Wikipedia API error", { status: 502, headers: { "Access-Control-Allow-Origin": "*" } });
    }
  }

  if (!targetUrl) {
    return new Response("Missing url or wiki parameter", { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  // Only allow wikimedia/wikipedia domains
  try {
    const parsed = new URL(targetUrl);
    const h = parsed.hostname;
    const isAllowed =
      h === "wikimedia.org" || h.endsWith(".wikimedia.org") ||
      h === "wikipedia.org" || h.endsWith(".wikipedia.org");
    if (!isAllowed) {
      return new Response("Only wikimedia/wikipedia URLs allowed", { status: 403, headers: { "Access-Control-Allow-Origin": "*" } });
    }
  } catch {
    return new Response("Invalid URL", { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "EpochAtlas/1.0 (educational project)",
      },
    });

    if (!response.ok) {
      return new Response(`Upstream error: ${response.status}`, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const data = new Uint8Array(await response.arrayBuffer());

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(`Fetch failed: ${e.message}`, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});
