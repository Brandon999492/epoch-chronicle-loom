

# Plan: Geographic Enrichment + Interactive Country Exploration

## Current State
- 381 historical events exist, but **0 locations** in the `locations` table and **0 events** have `location_id` set
- The `map-events` API uses an `!inner` join on locations, so it returns 0 results
- Events have no inherent coordinate data — enrichment must infer locations from event titles/descriptions

## Approach

### 1. Create a `geo-enrich` Edge Function
A new edge function that:
- Reads all `historical_events` that have no `location_id`
- Uses **Lovable AI** (Gemini Flash) to batch-infer location data from each event's title + description — returns `{ name, latitude, longitude, country, continent }` for each event
- Creates entries in the `locations` table (deduplicating by name)
- Updates `historical_events.location_id` to link to the created locations
- Returns a summary of how many events were enriched
- Protected by auth (admin only)
- Processes in batches of ~20 events per AI call to stay efficient

### 2. Update the `map-events` API
- Change the query to use a `LEFT JOIN` instead of `!inner` join
- Return events where `locations.latitude IS NOT NULL`
- Increase limit from 500 to 1000 to show more events
- Add `country` filter parameter for the country exploration feature

### 3. Add a `country-events` API endpoint
- New endpoint in `history-api`: `GET /country-events?country=France`
- Queries `historical_events` joined with `locations` where `locations.country = ?`
- Returns events for the clicked country

### 4. Frontend: Country GeoJSON Layer + Side Panel
In `HistoryMapPage.tsx`:
- Fetch world country boundaries GeoJSON from a public CDN (natural earth low-res ~200KB)
- Add a `GeoJSON` layer with transparent fill, subtle borders
- On country click: highlight the polygon, extract country name, fetch events via `country-events` API
- Show a slide-in side panel listing events for that country with links to `/event/{id}`
- Add a close button to dismiss the panel and deselect the country

### 5. Admin Trigger on Map Page
- Add a small admin-only "Enrich Data" button on the map page
- Calls the `geo-enrich` edge function
- Shows progress/results via toast notifications

## Technical Details

**Edge function: `supabase/functions/geo-enrich/index.ts`**
- Uses `SUPABASE_SERVICE_ROLE_KEY` to write to locations/events tables
- Uses Lovable AI endpoint for geocoding inference
- Batch processes: selects 20 events, asks AI for locations, upserts, repeats

**GeoJSON source**: `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` (TopoJSON) converted client-side, or use `https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson` (direct GeoJSON)

**Files to create/modify**:
- `supabase/functions/geo-enrich/index.ts` — new edge function
- `supabase/functions/history-api/index.ts` — update map-events query + add country-events endpoint
- `src/pages/HistoryMapPage.tsx` — add GeoJSON layer, country click handler, side panel
- `supabase/config.toml` — add geo-enrich function config

