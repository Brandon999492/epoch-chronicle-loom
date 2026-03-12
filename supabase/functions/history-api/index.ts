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
        const { data, error: e } = await supabase
          .from("historical_events")
          .select("*, location:locations(*), time_period:time_periods(*), civilization:civilizations(*)")
          .eq("id", resourceId)
          .single();
        if (e) return err("Event not found", 404);
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
        const { data, error: e } = await supabase
          .from("historical_figures")
          .select("*, dynasty:dynasties(*), birth_location:locations!historical_figures_birth_location_id_fkey(*), death_location:locations!historical_figures_death_location_id_fkey(*)")
          .eq("id", resourceId)
          .single();
        if (e) return err("Figure not found", 404);
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

      if (e) return err(e.message);
      return json({ data, total: count, page, limit });
    }

    // ===== TIMELINE =====
    if (resource === "timeline") {
      const { data, error: e } = await supabase
        .from("time_periods")
        .select("*")
        .order("sort_order")
        .order("start_year", { ascending: true, nullsFirst: false });
      if (e) return err(e.message);
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
      if (e) return err(e.message);
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
      if (e) return err(e.message);
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
      if (e) return err(e.message);
      return json({ data, total: count, page, limit });
    }

    // ===== SEARCH (cross-entity) =====
    if (resource === "search") {
      if (!search) return err("Query parameter 'q' is required");

      const [eventsRes, figuresRes, dynastiesRes] = await Promise.all([
        supabase.from("historical_events").select("id, title, year_label, category, image_url").ilike("title", `%${search}%`).limit(10),
        supabase.from("historical_figures").select("id, name, title, birth_label, death_label, image_url").ilike("name", `%${search}%`).limit(10),
        supabase.from("dynasties").select("id, name, start_label, end_label").ilike("name", `%${search}%`).limit(10),
      ]);

      return json({
        events: eventsRes.data || [],
        figures: figuresRes.data || [],
        dynasties: dynastiesRes.data || [],
      });
    }

    return err("Unknown resource. Available: events, figures, dynasties, timeline, civilizations, locations, media, search", 404);

  } catch (e) {
    console.error("API error:", e);
    return err("Internal server error", 500);
  }
});
