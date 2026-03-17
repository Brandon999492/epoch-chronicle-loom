import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const BATCH_SIZE = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

  // Use service role to write to locations/events
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is admin
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { data: isAdmin } = await anonClient.rpc("is_admin");
  if (!isAdmin) return json({ error: "Admin access required" }, 403);

  try {
    // Get events without location_id, limited per invocation to avoid timeout
    const batchLimit = 100; // Process up to 100 events per invocation
    const { data: events, error: evErr } = await supabase
      .from("historical_events")
      .select("id, title, description, year_label, category")
      .is("location_id", null)
      .limit(batchLimit);

    if (evErr) return json({ error: evErr.message }, 500);
    if (!events || events.length === 0) return json({ message: "All events already have locations", enriched: 0, remaining: 0 });

    let totalEnriched = 0;
    const locationCache = new Map<string, string>(); // name -> id

    // Process in batches
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);

      const prompt = `For each historical event below, infer the most likely geographic location where it took place. Return a JSON array with one object per event, in the same order.

Each object must have:
- "event_id": the id provided
- "location_name": specific place name (city, region, or country)
- "latitude": number (decimal degrees)
- "longitude": number (decimal degrees)  
- "country": modern country name
- "continent": one of Africa, Asia, Europe, North America, South America, Oceania, Antarctica

If you cannot determine a location, set location_name to null.

Events:
${batch.map((e, idx) => `${idx + 1}. id="${e.id}" title="${e.title}" year="${e.year_label || ''}" category="${e.category || ''}" description="${(e.description || '').slice(0, 150)}"`).join("\n")}

Return ONLY the JSON array, no markdown fences.`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a historical geography expert. Return only valid JSON arrays." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!aiResp.ok) {
        const status = aiResp.status;
        if (status === 429) return json({ error: "Rate limited, try again later", enriched: totalEnriched }, 429);
        if (status === 402) return json({ error: "Payment required for AI", enriched: totalEnriched }, 402);
        console.error("AI error:", status, await aiResp.text());
        continue; // skip batch
      }

      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      
      let locations: any[];
      try {
        // Strip markdown fences if present
        const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        locations = JSON.parse(cleaned);
      } catch {
        console.error("Failed to parse AI response for batch", i, content.slice(0, 200));
        continue;
      }

      for (const loc of locations) {
        if (!loc.location_name || !loc.latitude || !loc.longitude || !loc.event_id) continue;

        const normalizedName = loc.location_name.trim();
        let locationId = locationCache.get(normalizedName);

        if (!locationId) {
          // Check if location already exists
          const { data: existing } = await supabase
            .from("locations")
            .select("id")
            .ilike("name", normalizedName)
            .maybeSingle();

          if (existing) {
            locationId = existing.id;
          } else {
            // Insert new location
            const { data: newLoc, error: locErr } = await supabase
              .from("locations")
              .insert({
                name: normalizedName,
                latitude: loc.latitude,
                longitude: loc.longitude,
                country: loc.country || null,
                continent: loc.continent || null,
              })
              .select("id")
              .single();

            if (locErr) {
              console.error("Location insert error:", locErr.message, normalizedName);
              continue;
            }
            locationId = newLoc.id;
          }
          locationCache.set(normalizedName, locationId);
        }

        // Update event with location_id
        const { error: upErr } = await supabase
          .from("historical_events")
          .update({ location_id: locationId })
          .eq("id", loc.event_id);

        if (upErr) {
          console.error("Event update error:", upErr.message, loc.event_id);
        } else {
          totalEnriched++;
        }
      }
    }

    // Count remaining
    const { count: remaining } = await supabase
      .from("historical_events")
      .select("id", { count: "exact", head: true })
      .is("location_id", null);

    return json({
      message: `Enrichment complete`,
      enriched: totalEnriched,
      total_processed: events.length,
      locations_created: locationCache.size,
      remaining: (remaining || 0) - totalEnriched,
    });
  } catch (e) {
    console.error("Geo-enrich error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
