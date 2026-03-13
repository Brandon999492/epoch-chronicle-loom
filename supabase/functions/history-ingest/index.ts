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

// ===== Validation helpers =====

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const VALID_CATEGORIES = [
  "war", "battle", "politics", "science", "discovery", "religion", "monarchy",
  "revolution", "cultural", "economic", "disaster", "exploration", "legal",
  "technology", "philosophy", "art", "architecture", "general",
  "culture", "geology", "evolution", "mystery", "ritual", "serial-killer",
  "treaty", "assassination",
];

function inferCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  const keywords: Record<string, string[]> = {
    war: ["war", "battle", "siege", "invasion", "military", "army", "naval"],
    battle: ["battle of", "skirmish"],
    politics: ["election", "parliament", "congress", "treaty", "political", "diplomacy"],
    science: ["discovery", "theory", "experiment", "scientific", "physics", "chemistry", "biology"],
    monarchy: ["king", "queen", "prince", "princess", "coronation", "throne", "dynasty", "reign"],
    revolution: ["revolution", "revolt", "uprising", "rebellion", "coup"],
    religion: ["church", "pope", "crusade", "religious", "temple", "mosque", "cathedral"],
    exploration: ["expedition", "explorer", "voyage", "discovered", "coloniz"],
    disaster: ["earthquake", "plague", "famine", "flood", "eruption", "fire"],
    technology: ["invention", "patent", "engine", "telegraph", "computer", "railway"],
    cultural: ["art", "music", "literature", "festival", "olympics"],
    economic: ["trade", "economy", "market", "currency", "bank"],
    legal: ["law", "constitution", "charter", "act of", "amendment"],
  };
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(w => text.includes(w))) return cat;
  }
  return "general";
}

function inferTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const tagMap: Record<string, string[]> = {
    "medieval": ["medieval", "middle ages", "feudal"],
    "ancient": ["ancient", "classical", "antiquity"],
    "modern": ["modern", "contemporary", "20th century", "21st century"],
    "europe": ["europe", "european", "england", "france", "germany", "italy", "spain"],
    "asia": ["asia", "china", "japan", "india", "persia", "ottoman"],
    "americas": ["america", "united states", "mexico", "aztec", "maya", "inca"],
    "africa": ["africa", "egypt", "ethiopia", "mali"],
    "maritime": ["naval", "ship", "fleet", "sea", "ocean", "voyage"],
    "conflict": ["war", "battle", "siege", "conflict", "invasion"],
    "notable-death": ["assassination", "execution", "death of", "murder"],
  };
  const tags: string[] = [];
  for (const [tag, words] of Object.entries(tagMap)) {
    if (words.some(w => text.includes(w))) tags.push(tag);
  }
  return tags;
}

// ===== Main handler =====

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return err("Unauthorized", 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return err("Unauthorized", 401);

  // Admin role check — only admins can ingest data
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: roleRow } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return err("Forbidden: admin role required", 403);

  // Use service role client for writes
  const adminClient = serviceClient;

  const url = new URL(req.url);
  const action = url.pathname.replace(/^\/history-ingest\/?/, "").split("/").filter(Boolean)[0] || "";

  try {
    const body = await req.json();

    // ===== INGEST LOCATIONS =====
    if (action === "locations") {
      const items: any[] = Array.isArray(body) ? body : body.items || [];
      if (!items.length) return err("No locations provided");

      const results = { inserted: 0, skipped: 0, errors: [] as string[] };
      for (const item of items) {
        if (!item.name) { results.errors.push("Missing name"); continue; }
        // Dedup check
        const { data: existing } = await adminClient
          .from("locations").select("id").ilike("name", item.name).limit(1);
        if (existing?.length) { results.skipped++; continue; }

        const { error: insertErr } = await adminClient.from("locations").insert({
          name: item.name,
          alternate_names: item.alternate_names || [],
          latitude: item.latitude ?? null,
          longitude: item.longitude ?? null,
          region: item.region ?? null,
          country: item.country ?? null,
          continent: item.continent ?? null,
          description: item.description ?? null,
        });
        if (insertErr) results.errors.push(`${item.name}: ${insertErr.message}`);
        else results.inserted++;
      }
      return json(results);
    }

    // ===== INGEST CIVILIZATIONS =====
    if (action === "civilizations") {
      const items: any[] = Array.isArray(body) ? body : body.items || [];
      if (!items.length) return err("No civilizations provided");

      const results = { inserted: 0, skipped: 0, errors: [] as string[] };
      for (const item of items) {
        if (!item.name) { results.errors.push("Missing name"); continue; }
        const { data: existing } = await adminClient
          .from("civilizations").select("id").ilike("name", item.name).limit(1);
        if (existing?.length) { results.skipped++; continue; }

        // Resolve location
        let locationId = null;
        if (item.location_name) {
          const { data: loc } = await adminClient
            .from("locations").select("id").ilike("name", item.location_name).limit(1);
          locationId = loc?.[0]?.id ?? null;
        }

        const { error: insertErr } = await adminClient.from("civilizations").insert({
          name: item.name, slug: slugify(item.name),
          start_year: item.start_year ?? null, end_year: item.end_year ?? null,
          start_label: item.start_label ?? null, end_label: item.end_label ?? null,
          description: item.description ?? null, location_id: locationId,
        });
        if (insertErr) results.errors.push(`${item.name}: ${insertErr.message}`);
        else results.inserted++;
      }
      return json(results);
    }

    // ===== INGEST DYNASTIES =====
    if (action === "dynasties") {
      const items: any[] = Array.isArray(body) ? body : body.items || [];
      if (!items.length) return err("No dynasties provided");

      const results = { inserted: 0, skipped: 0, errors: [] as string[] };
      for (const item of items) {
        if (!item.name) { results.errors.push("Missing name"); continue; }
        const { data: existing } = await adminClient
          .from("dynasties").select("id").ilike("name", item.name).limit(1);
        if (existing?.length) { results.skipped++; continue; }

        let civId = null;
        if (item.civilization_name) {
          const { data: civ } = await adminClient
            .from("civilizations").select("id").ilike("name", item.civilization_name).limit(1);
          civId = civ?.[0]?.id ?? null;
        }
        let locId = null;
        if (item.location_name) {
          const { data: loc } = await adminClient
            .from("locations").select("id").ilike("name", item.location_name).limit(1);
          locId = loc?.[0]?.id ?? null;
        }

        const { error: insertErr } = await adminClient.from("dynasties").insert({
          name: item.name, slug: slugify(item.name),
          start_year: item.start_year ?? null, end_year: item.end_year ?? null,
          start_label: item.start_label ?? null, end_label: item.end_label ?? null,
          description: item.description ?? null,
          civilization_id: civId, location_id: locId,
          coat_of_arms_url: item.coat_of_arms_url ?? null,
        });
        if (insertErr) results.errors.push(`${item.name}: ${insertErr.message}`);
        else results.inserted++;
      }
      return json(results);
    }

    // ===== INGEST TIME PERIODS =====
    if (action === "time-periods") {
      const items: any[] = Array.isArray(body) ? body : body.items || [];
      if (!items.length) return err("No time periods provided");

      const results = { inserted: 0, skipped: 0, errors: [] as string[] };
      for (const item of items) {
        if (!item.name) { results.errors.push("Missing name"); continue; }
        const { data: existing } = await adminClient
          .from("time_periods").select("id").ilike("name", item.name).limit(1);
        if (existing?.length) { results.skipped++; continue; }

        let parentId = null;
        if (item.parent_name) {
          const { data: parent } = await adminClient
            .from("time_periods").select("id").ilike("name", item.parent_name).limit(1);
          parentId = parent?.[0]?.id ?? null;
        }

        const { error: insertErr } = await adminClient.from("time_periods").insert({
          name: item.name, slug: slugify(item.name),
          start_year: item.start_year ?? null, end_year: item.end_year ?? null,
          start_label: item.start_label ?? null, end_label: item.end_label ?? null,
          description: item.description ?? null,
          parent_period_id: parentId, sort_order: item.sort_order ?? 0,
        });
        if (insertErr) results.errors.push(`${item.name}: ${insertErr.message}`);
        else results.inserted++;
      }
      return json(results);
    }

    // ===== INGEST FIGURES =====
    if (action === "figures") {
      const items: any[] = Array.isArray(body) ? body : body.items || [];
      if (!items.length) return err("No figures provided");

      const results = { inserted: 0, skipped: 0, errors: [] as string[] };
      for (const item of items) {
        if (!item.name) { results.errors.push("Missing name"); continue; }
        const { data: existing } = await adminClient
          .from("historical_figures").select("id").ilike("name", item.name).limit(1);
        if (existing?.length) { results.skipped++; continue; }

        let dynastyId = null;
        if (item.dynasty_name) {
          const { data: dyn } = await adminClient
            .from("dynasties").select("id").ilike("name", item.dynasty_name).limit(1);
          dynastyId = dyn?.[0]?.id ?? null;
        }
        let birthLocId = null, deathLocId = null;
        if (item.birth_location_name) {
          const { data: loc } = await adminClient
            .from("locations").select("id").ilike("name", item.birth_location_name).limit(1);
          birthLocId = loc?.[0]?.id ?? null;
        }
        if (item.death_location_name) {
          const { data: loc } = await adminClient
            .from("locations").select("id").ilike("name", item.death_location_name).limit(1);
          deathLocId = loc?.[0]?.id ?? null;
        }

        const tags = item.tags || inferTags(item.name, item.biography || item.title || "");

        const { error: insertErr } = await adminClient.from("historical_figures").insert({
          name: item.name, slug: slugify(item.name),
          birth_year: item.birth_year ?? null, death_year: item.death_year ?? null,
          birth_label: item.birth_label ?? null, death_label: item.death_label ?? null,
          title: item.title ?? null, biography: item.biography ?? null,
          image_url: item.image_url ?? null, tags,
          dynasty_id: dynastyId, birth_location_id: birthLocId, death_location_id: deathLocId,
        });
        if (insertErr) results.errors.push(`${item.name}: ${insertErr.message}`);
        else results.inserted++;
      }
      return json(results);
    }

    // ===== INGEST EVENTS =====
    if (action === "events") {
      const items: any[] = Array.isArray(body) ? body : body.items || [];
      if (!items.length) return err("No events provided");

      const results = { inserted: 0, skipped: 0, linked_figures: 0, errors: [] as string[] };
      for (const item of items) {
        if (!item.title) { results.errors.push("Missing title"); continue; }

        // Dedup: same title + same year
        let dedupQuery = adminClient.from("historical_events").select("id").ilike("title", item.title);
        if (item.year != null) dedupQuery = dedupQuery.eq("year", item.year);
        const { data: existing } = await dedupQuery.limit(1);
        if (existing?.length) { results.skipped++; continue; }

        // Resolve relations by name
        let locationId = null, periodId = null, civId = null;
        if (item.location_name) {
          const { data: loc } = await adminClient
            .from("locations").select("id").ilike("name", item.location_name).limit(1);
          locationId = loc?.[0]?.id ?? null;
        }
        if (item.time_period_name) {
          const { data: tp } = await adminClient
            .from("time_periods").select("id").ilike("name", item.time_period_name).limit(1);
          periodId = tp?.[0]?.id ?? null;
        }
        if (item.civilization_name) {
          const { data: civ } = await adminClient
            .from("civilizations").select("id").ilike("name", item.civilization_name).limit(1);
          civId = civ?.[0]?.id ?? null;
        }

        const category = item.category && VALID_CATEGORIES.includes(item.category)
          ? item.category
          : inferCategory(item.title, item.description || "");
        const tags = item.tags || inferTags(item.title, item.description || "");

        const { data: inserted, error: insertErr } = await adminClient
          .from("historical_events").insert({
            title: item.title, slug: slugify(item.title),
            year: item.year ?? null, year_label: item.year_label ?? null,
            exact_date: item.exact_date ?? null,
            end_year: item.end_year ?? null, end_year_label: item.end_year_label ?? null,
            description: item.description ?? null,
            detailed_description: item.detailed_description ?? null,
            category, significance: item.significance ?? 5,
            image_url: item.image_url ?? null, tags,
            location_id: locationId, time_period_id: periodId, civilization_id: civId,
          }).select("id").single();

        if (insertErr) { results.errors.push(`${item.title}: ${insertErr.message}`); continue; }
        results.inserted++;

        // Link figures by name
        if (inserted && Array.isArray(item.figure_names)) {
          for (const fn of item.figure_names) {
            const figName = typeof fn === "string" ? fn : fn.name;
            const role = typeof fn === "string" ? null : fn.role;
            const { data: fig } = await adminClient
              .from("historical_figures").select("id").ilike("name", figName).limit(1);
            if (fig?.[0]) {
              await adminClient.from("event_figures").insert({
                event_id: inserted.id, figure_id: fig[0].id, role,
              });
              results.linked_figures++;
            }
          }
        }
      }
      return json(results);
    }

    // ===== INGEST RELATIONSHIPS =====
    if (action === "relationships") {
      const items: any[] = Array.isArray(body) ? body : body.items || [];
      if (!items.length) return err("No relationships provided");

      const results = { inserted: 0, skipped: 0, errors: [] as string[] };
      for (const item of items) {
        if (!item.figure_name || !item.related_figure_name || !item.relationship_type) {
          results.errors.push("Missing required fields"); continue;
        }
        const { data: f1 } = await adminClient
          .from("historical_figures").select("id").ilike("name", item.figure_name).limit(1);
        const { data: f2 } = await adminClient
          .from("historical_figures").select("id").ilike("name", item.related_figure_name).limit(1);
        if (!f1?.[0] || !f2?.[0]) { results.errors.push(`Figures not found: ${item.figure_name} / ${item.related_figure_name}`); continue; }

        // Dedup
        const { data: existing } = await adminClient
          .from("figure_relationships").select("id")
          .eq("figure_id", f1[0].id).eq("related_figure_id", f2[0].id).limit(1);
        if (existing?.length) { results.skipped++; continue; }

        const { error: insertErr } = await adminClient.from("figure_relationships").insert({
          figure_id: f1[0].id, related_figure_id: f2[0].id,
          relationship_type: item.relationship_type,
        });
        if (insertErr) results.errors.push(insertErr.message);
        else results.inserted++;
      }
      return json(results);
    }

    // ===== AI-ASSISTED ENTRY CREATION =====
    if (action === "ai-generate") {
      const { topic } = body;
      if (!topic) return err("Topic required");

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) return err("AI not configured", 500);

      const systemPrompt = `You are a historical data generator. Given a topic, generate a structured JSON object that can be ingested into a history database. Return ONLY valid JSON (no markdown, no code fences).

The JSON must have this structure:
{
  "events": [{ "title": "", "year": null, "year_label": "", "description": "", "detailed_description": "", "category": "", "significance": 5, "location_name": "", "time_period_name": "", "civilization_name": "", "figure_names": [{"name": "", "role": ""}] }],
  "figures": [{ "name": "", "birth_year": null, "death_year": null, "birth_label": "", "death_label": "", "title": "", "biography": "", "dynasty_name": "", "birth_location_name": "", "death_location_name": "" }],
  "locations": [{ "name": "", "latitude": null, "longitude": null, "country": "", "continent": "", "description": "" }],
  "dynasties": [{ "name": "", "start_year": null, "end_year": null, "start_label": "", "end_label": "", "description": "", "civilization_name": "" }]
}

Only include entities that are historically accurate. Mark uncertain dates with labels like "c. 1066" or "~500 BCE".`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate historical database entries for: ${topic}` },
          ],
        }),
      });

      if (!aiResp.ok) return err("AI generation failed", 500);
      const aiData = await aiResp.json();
      const raw = aiData.choices?.[0]?.message?.content || "";

      try {
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const generated = JSON.parse(cleaned);
        return json({ status: "draft", generated, message: "Draft entries generated. Review and submit via the individual ingest endpoints." });
      } catch {
        return json({ status: "error", raw, message: "AI returned non-JSON. Raw content included for review." });
      }
    }

    return err("Unknown action. Available: locations, civilizations, dynasties, time-periods, figures, events, relationships, ai-generate", 404);
  } catch (e) {
    console.error("Ingest error:", e);
    return err("Internal server error", 500);
  }
});
