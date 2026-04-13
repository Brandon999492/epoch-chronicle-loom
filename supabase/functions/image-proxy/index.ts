import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "*",
};

async function fetchSummaryImage(title: string) {
  const apiRes = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { "User-Agent": "EpochAtlas/1.0 (educational project)" } },
  );

  if (!apiRes.ok) return null;
  const data = await apiRes.json();
  return data.thumbnail?.source || data.originalimage?.source || null;
}

async function searchWikipediaTitle(query: string) {
  const searchRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1`,
    { headers: { "User-Agent": "EpochAtlas/1.0 (educational project)" } },
  );

  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  return searchData?.query?.search?.[0]?.title || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const imageUrl = url.searchParams.get("url");
  const wikiTitle = url.searchParams.get("wiki");

  let targetUrl = imageUrl;

  if (wikiTitle && !imageUrl) {
    try {
      targetUrl = await fetchSummaryImage(wikiTitle);

      if (!targetUrl) {
        const bestMatch = await searchWikipediaTitle(wikiTitle);
        if (bestMatch) targetUrl = await fetchSummaryImage(bestMatch);
      }

      if (!targetUrl) {
        return new Response("No image found for this article", {
          status: 404,
          headers: { ...corsHeaders, "Cache-Control": "public, max-age=3600" },
        });
      }
    } catch {
      return new Response("Wikipedia API error", {
        status: 502,
        headers: corsHeaders,
      });
    }
  }

  if (!targetUrl) {
    return new Response("Missing url or wiki parameter", {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const parsed = new URL(targetUrl);
    const h = parsed.hostname;
    const isAllowed =
      h === "wikimedia.org" || h.endsWith(".wikimedia.org") ||
      h === "wikipedia.org" || h.endsWith(".wikipedia.org");

    if (!isAllowed) {
      return new Response("Only wikimedia/wikipedia URLs allowed", {
        status: 403,
        headers: corsHeaders,
      });
    }
  } catch {
    return new Response("Invalid URL", {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { "User-Agent": "EpochAtlas/1.0 (educational project)" },
    });

    if (!response.ok) {
      return new Response(`Upstream error: ${response.status}`, {
        status: 502,
        headers: corsHeaders,
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const data = new Uint8Array(await response.arrayBuffer());

    return new Response(data, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return new Response(`Fetch failed: ${e instanceof Error ? e.message : "Unknown error"}`, {
      status: 502,
      headers: corsHeaders,
    });
  }
});
