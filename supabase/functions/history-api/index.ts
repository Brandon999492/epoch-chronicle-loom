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

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const pathParts = url.pathname.replace(/^\/history-api\/?/, "").split("/").filter(Boolean);
  const resource = pathParts[0] || "";
  const resourceId = pathParts[1] || null;
  const subResource = pathParts[2] || null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  // Query params for pagination/filtering
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = (page - 1) * limit;
  const search = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || "";
  const yearFrom = url.searchParams.get("year_from") || "";
  const yearTo = url.searchParams.get("year_to") || "";
  const periodId = url.searchParams.get("period_id") || "";
  const dynastyId = url.searchParams.get("dynasty_id") || "";
  const locationId = url.searchParams.get("location_id") || "";

  try {
    // ===== EVENTS =====
    if (resource === "events") {
      if (resourceId && subResource === "figures") {
        const { data } = await supabase
          .from("event_figures")
          .select("*, figure:historical_figures(*)")
          .eq("event_id", resourceId);
        return json(data);
      }
      if (resourceId && subResource === "media") {
        const { data } = await supabase
          .from("event_media")
          .select("*, media:media_assets(*)")
          .eq("event_id", resourceId)
          .order("display_order");
        return json(data);
      }
      if (resourceId) {
        // Try by UUID first, then fall back to slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId);
        const column = isUuid ? "id" : "slug";
        const { data, error: e } = await supabase
          .from("historical_events")
          .select("*, location:locations(*), time_period:time_periods(*), civilization:civilizations(*)")
          .eq(column, resourceId)
          .maybeSingle();
        if (e || !data) return err("Event not found", 404);
        return json(data);
      }

      // List events with filters
      let query = supabase
        .from("historical_events")
        .select("*, location:locations(id,name), time_period:time_periods(id,name)", { count: "exact" });

      if (search) query = query.ilike("title", `%${search}%`);
      if (category) query = query.eq("category", category);
      if (yearFrom) query = query.gte("year", parseInt(yearFrom));
      if (yearTo) query = query.lte("year", parseInt(yearTo));
      if (periodId) query = query.eq("time_period_id", periodId);
      if (locationId) query = query.eq("location_id", locationId);

      const { data, count, error: e } = await query
        .order("year", { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (e) { console.error("DB error:", e.message); return err("An error occurred processing your request.", 500); }
      return json({ data, total: count, page, limit });
    }

    // ===== FIGURES =====
    if (resource === "figures") {
      if (resourceId && subResource === "events") {
        const { data } = await supabase
          .from("event_figures")
          .select("*, event:historical_events(*)")
          .eq("figure_id", resourceId);
        return json(data);
      }
      if (resourceId && subResource === "relationships") {
        const { data } = await supabase
          .from("figure_relationships")
          .select("*, related_figure:historical_figures!figure_relationships_related_figure_id_fkey(*)")
          .eq("figure_id", resourceId);
        return json(data);
      }
      if (resourceId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId);
        const column = isUuid ? "id" : "slug";
        const { data, error: e } = await supabase
          .from("historical_figures")
          .select("*, dynasty:dynasties(*), birth_location:locations!historical_figures_birth_location_id_fkey(*), death_location:locations!historical_figures_death_location_id_fkey(*)")
          .eq(column, resourceId)
          .maybeSingle();
        if (e || !data) return err("Figure not found", 404);
        return json(data);
      }

      let query = supabase
        .from("historical_figures")
        .select("*, dynasty:dynasties(id,name)", { count: "exact" });

      if (search) query = query.ilike("name", `%${search}%`);
      if (dynastyId) query = query.eq("dynasty_id", dynastyId);

      const { data, count, error: e } = await query
        .order("birth_year", { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (e) { console.error("DB error:", e.message); return err("An error occurred processing your request.", 500); }
      return json({ data, total: count, page, limit });
    }

    // ===== DYNASTIES =====
    if (resource === "dynasties") {
      if (resourceId) {
        const { data, error: e } = await supabase
          .from("dynasties")
          .select("*, civilization:civilizations(*), location:locations(*)")
          .eq("id", resourceId)
          .single();
        if (e) return err("Dynasty not found", 404);
        return json(data);
      }

      let query = supabase.from("dynasties").select("*, civilization:civilizations(id,name)", { count: "exact" });
      if (search) query = query.ilike("name", `%${search}%`);

      const { data, count, error: e } = await query
        .order("start_year", { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (e) { console.error("DB error:", e.message); return err("An error occurred processing your request.", 500); }
      return json({ data, total: count, page, limit });
    }

    // ===== TIMELINE =====
    if (resource === "timeline") {
      const { data, error: e } = await supabase
        .from("time_periods")
        .select("*")
        .order("sort_order")
        .order("start_year", { ascending: true, nullsFirst: false });
      if (e) { console.error("DB error:", e.message); return err("An error occurred processing your request.", 500); }
      return json(data);
    }

    // ===== CIVILIZATIONS =====
    if (resource === "civilizations") {
      if (resourceId) {
        const { data, error: e } = await supabase
          .from("civilizations")
          .select("*, location:locations(*)")
          .eq("id", resourceId)
          .single();
        if (e) return err("Civilization not found", 404);
        return json(data);
      }
      const { data, error: e } = await supabase
        .from("civilizations")
        .select("*", { count: "exact" })
        .order("start_year", { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);
      if (e) { console.error("DB error:", e.message); return err("An error occurred processing your request.", 500); }
      return json(data);
    }

    // ===== LOCATIONS =====
    if (resource === "locations") {
      if (resourceId) {
        const { data, error: e } = await supabase.from("locations").select("*").eq("id", resourceId).single();
        if (e) return err("Location not found", 404);
        return json(data);
      }
      let query = supabase.from("locations").select("*", { count: "exact" });
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, count, error: e } = await query.order("name").range(offset, offset + limit - 1);
      if (e) { console.error("DB error:", e.message); return err("An error occurred processing your request.", 500); }
      return json({ data, total: count, page, limit });
    }

    // ===== MEDIA =====
    if (resource === "media") {
      if (resourceId) {
        const { data, error: e } = await supabase.from("media_assets").select("*").eq("id", resourceId).single();
        if (e) return err("Media not found", 404);
        return json(data);
      }
      let query = supabase.from("media_assets").select("*", { count: "exact" });
      const mediaType = url.searchParams.get("type");
      if (mediaType) query = query.eq("media_type", mediaType);
      if (search) query = query.ilike("title", `%${search}%`);
      const { data, count, error: e } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      if (e) { console.error("DB error:", e.message); return err("An error occurred processing your request.", 500); }
      return json({ data, total: count, page, limit });
    }

    // ===== SEARCH (cross-entity with trigram similarity) =====
    if (resource === "search") {
      if (!search) return err("Query parameter 'q' is required");

      const searchLimit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
      const searchOffset = (page - 1) * searchLimit;
      const civId = url.searchParams.get("civilization_id") || null;

      const { data: searchData, error: searchErr } = await supabase.rpc("global_search", {
        search_query: search,
        filter_category: category || null,
        filter_year_from: yearFrom ? parseInt(yearFrom) : null,
        filter_year_to: yearTo ? parseInt(yearTo) : null,
        filter_location_id: locationId || null,
        filter_civilization_id: civId,
        filter_period_id: periodId || null,
        result_limit: searchLimit,
        result_offset: searchOffset,
      });

      if (searchErr) {
        console.error("Search error:", searchErr.message);
        return err("An error occurred processing your search.", 500);
      }

      return json(searchData);
    }

    // ===== KNOWLEDGE GRAPH (entity connections) =====
    if (resource === "graph") {
      const entityType = pathParts[1] || "";
      const entityId = pathParts[2] || "";

      if (!entityType || !entityId) return err("Usage: graph/{entity_type}/{entity_id}");

      if (entityType === "event") {
        const [eventRes, figuresRes, mediaRes] = await Promise.all([
          supabase.from("historical_events")
            .select("*, location:locations(*), time_period:time_periods(*), civilization:civilizations(*)")
            .eq("id", entityId).single(),
          supabase.from("event_figures")
            .select("*, figure:historical_figures(id, name, slug, title, image_url, birth_label, death_label)")
            .eq("event_id", entityId),
          supabase.from("event_media")
            .select("*, media:media_assets(id, url, thumbnail_url, media_type, title, description)")
            .eq("event_id", entityId).order("display_order"),
        ]);
        if (eventRes.error) return err("Event not found", 404);

        // Find related events (same location, period, or civilization)
        let relatedQuery = supabase.from("historical_events")
          .select("id, title, slug, year_label, category, image_url")
          .neq("id", entityId).limit(10);
        
        if (eventRes.data.location_id) relatedQuery = relatedQuery.or(`location_id.eq.${eventRes.data.location_id},civilization_id.eq.${eventRes.data.civilization_id || '00000000-0000-0000-0000-000000000000'},time_period_id.eq.${eventRes.data.time_period_id || '00000000-0000-0000-0000-000000000000'}`);
        const { data: relatedEvents } = await relatedQuery;

        return json({
          entity: eventRes.data,
          figures: figuresRes.data || [],
          media: mediaRes.data || [],
          related_events: relatedEvents || [],
        });
      }

      if (entityType === "figure") {
        const [figureRes, eventsRes, relsRes, mediaRes] = await Promise.all([
          supabase.from("historical_figures")
            .select("*, dynasty:dynasties(*, civilization:civilizations(id,name)), birth_location:locations!historical_figures_birth_location_id_fkey(*), death_location:locations!historical_figures_death_location_id_fkey(*)")
            .eq("id", entityId).single(),
          supabase.from("event_figures")
            .select("role, event:historical_events(id, title, slug, year_label, category, image_url)")
            .eq("figure_id", entityId),
          supabase.from("figure_relationships")
            .select("relationship_type, related_figure:historical_figures!figure_relationships_related_figure_id_fkey(id, name, slug, title, image_url)")
            .eq("figure_id", entityId),
          supabase.from("figure_media")
            .select("*, media:media_assets(id, url, thumbnail_url, media_type, title)")
            .eq("figure_id", entityId).order("display_order"),
        ]);
        if (figureRes.error) return err("Figure not found", 404);

        return json({
          entity: figureRes.data,
          events: eventsRes.data || [],
          relationships: relsRes.data || [],
          media: mediaRes.data || [],
        });
      }

      if (entityType === "dynasty") {
        const [dynastyRes, figuresRes] = await Promise.all([
          supabase.from("dynasties")
            .select("*, civilization:civilizations(*), location:locations(*)")
            .eq("id", entityId).single(),
          supabase.from("historical_figures")
            .select("id, name, slug, title, image_url, birth_label, death_label")
            .eq("dynasty_id", entityId)
            .order("birth_year", { ascending: true, nullsFirst: false }),
        ]);
        if (dynastyRes.error) return err("Dynasty not found", 404);

        // Find events linked to figures in this dynasty
        const figureIds = (figuresRes.data || []).map((f: any) => f.id);
        let dynastyEvents: any[] = [];
        if (figureIds.length > 0) {
          const { data: eventLinks } = await supabase
            .from("event_figures")
            .select("event:historical_events(id, title, slug, year_label, category)")
            .in("figure_id", figureIds.slice(0, 50));
          dynastyEvents = (eventLinks || []).map((el: any) => el.event).filter(Boolean);
          // Deduplicate
          const seen = new Set<string>();
          dynastyEvents = dynastyEvents.filter((e: any) => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
          });
        }

        return json({
          entity: dynastyRes.data,
          figures: figuresRes.data || [],
          events: dynastyEvents,
        });
      }

      return err("Unknown entity type. Available: event, figure, dynasty");
    }

    // ===== MAP EVENTS (events with location coordinates) =====
    if (resource === "map-events") {
      const country = url.searchParams.get("country") || "";
      
      let query = supabase
        .from("historical_events")
        .select("id, title, slug, year, year_label, end_year, end_year_label, category, significance, image_url, description, location:locations!inner(id, name, latitude, longitude, country, continent)")
        .not("locations.latitude", "is", null)
        .not("locations.longitude", "is", null);

      if (search) query = query.ilike("title", `%${search}%`);
      if (category) query = query.eq("category", category);
      if (yearFrom) query = query.gte("year", parseInt(yearFrom));
      if (yearTo) query = query.lte("year", parseInt(yearTo));
      if (country) query = query.eq("locations.country", country);

      // Fetch all matching events (paginate to avoid 1000-row limit)
      let allData: any[] = [];
      let rangeFrom = 0;
      const batchSize = 1000;
      while (true) {
        const { data: batch, error: e } = await query
          .order("year", { ascending: true, nullsFirst: false })
          .range(rangeFrom, rangeFrom + batchSize - 1);
        if (e) { console.error("DB error:", e.message); return err("An error occurred processing your request.", 500); }
        if (!batch || batch.length === 0) break;
        allData = allData.concat(batch);
        if (batch.length < batchSize) break;
        rangeFrom += batchSize;
      }
      return json(allData);
    }

    // ===== COUNTRY EVENTS (events for a specific country) =====
    if (resource === "country-events") {
      const country = url.searchParams.get("country") || "";
      if (!country) return err("Query parameter 'country' is required");

      const { data, error: e } = await supabase
        .from("historical_events")
        .select("id, title, slug, year, year_label, category, significance, image_url, description, location:locations!inner(id, name, country)")
        .ilike("locations.country", country)
        .order("year", { ascending: true, nullsFirst: false })
        .limit(100);

      if (e) { console.error("DB error:", e.message); return err("An error occurred processing your request.", 500); }
      return json(data);
    }

    return err("Unknown resource. Available: events, figures, dynasties, timeline, civilizations, locations, media, search, graph, map-events, country-events", 404);

  } catch (e) {
    console.error("API error:", e);
    return err("Internal server error", 500);
  }
});
