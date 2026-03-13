
-- Create a comprehensive search function using trigram similarity
-- pg_trgm is already enabled in the extensions schema

CREATE OR REPLACE FUNCTION public.global_search(
  search_query TEXT,
  filter_category TEXT DEFAULT NULL,
  filter_year_from BIGINT DEFAULT NULL,
  filter_year_to BIGINT DEFAULT NULL,
  filter_location_id UUID DEFAULT NULL,
  filter_civilization_id UUID DEFAULT NULL,
  filter_period_id UUID DEFAULT NULL,
  result_limit INT DEFAULT 20,
  result_offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result JSON;
  normalized_query TEXT;
BEGIN
  normalized_query := lower(trim(search_query));
  
  IF normalized_query = '' OR normalized_query IS NULL THEN
    RETURN '{"events":[],"figures":[],"dynasties":[],"civilizations":[],"locations":[],"total_events":0,"total_figures":0,"total_dynasties":0,"total_civilizations":0,"total_locations":0}'::JSON;
  END IF;

  SELECT json_build_object(
    'events', (
      SELECT COALESCE(json_agg(row_to_json(e)), '[]'::JSON)
      FROM (
        SELECT 
          he.id, he.title, he.slug, he.year, he.year_label, he.end_year, he.end_year_label,
          he.description, he.category, he.significance, he.image_url, he.tags,
          l.name AS location_name,
          tp.name AS time_period_name,
          c.name AS civilization_name,
          extensions.similarity(lower(he.title), normalized_query) AS title_score,
          CASE 
            WHEN lower(he.title) = normalized_query THEN 1.0
            WHEN lower(he.title) LIKE normalized_query || '%' THEN 0.9
            WHEN lower(he.title) LIKE '%' || normalized_query || '%' THEN 0.7
            ELSE extensions.similarity(lower(he.title), normalized_query) + 
                 extensions.similarity(lower(COALESCE(he.description, '')), normalized_query) * 0.3
          END AS relevance
        FROM historical_events he
        LEFT JOIN locations l ON he.location_id = l.id
        LEFT JOIN time_periods tp ON he.time_period_id = tp.id
        LEFT JOIN civilizations c ON he.civilization_id = c.id
        WHERE (
          lower(he.title) LIKE '%' || normalized_query || '%'
          OR extensions.similarity(lower(he.title), normalized_query) > 0.1
          OR lower(COALESCE(he.description, '')) LIKE '%' || normalized_query || '%'
          OR normalized_query = ANY(SELECT lower(unnest(he.tags)))
        )
        AND (filter_category IS NULL OR he.category = filter_category)
        AND (filter_year_from IS NULL OR he.year >= filter_year_from)
        AND (filter_year_to IS NULL OR he.year <= filter_year_to)
        AND (filter_location_id IS NULL OR he.location_id = filter_location_id)
        AND (filter_civilization_id IS NULL OR he.civilization_id = filter_civilization_id)
        AND (filter_period_id IS NULL OR he.time_period_id = filter_period_id)
        ORDER BY relevance DESC, he.significance DESC NULLS LAST
        LIMIT result_limit OFFSET result_offset
      ) e
    ),
    'figures', (
      SELECT COALESCE(json_agg(row_to_json(f)), '[]'::JSON)
      FROM (
        SELECT 
          hf.id, hf.name, hf.slug, hf.birth_year, hf.death_year,
          hf.birth_label, hf.death_label, hf.title, hf.biography, hf.image_url, hf.tags,
          d.name AS dynasty_name,
          bl.name AS birth_location_name,
          CASE 
            WHEN lower(hf.name) = normalized_query THEN 1.0
            WHEN lower(hf.name) LIKE normalized_query || '%' THEN 0.9
            WHEN lower(hf.name) LIKE '%' || normalized_query || '%' THEN 0.7
            ELSE extensions.similarity(lower(hf.name), normalized_query) + 
                 extensions.similarity(lower(COALESCE(hf.title, '')), normalized_query) * 0.3
          END AS relevance
        FROM historical_figures hf
        LEFT JOIN dynasties d ON hf.dynasty_id = d.id
        LEFT JOIN locations bl ON hf.birth_location_id = bl.id
        WHERE (
          lower(hf.name) LIKE '%' || normalized_query || '%'
          OR extensions.similarity(lower(hf.name), normalized_query) > 0.1
          OR lower(COALESCE(hf.title, '')) LIKE '%' || normalized_query || '%'
          OR lower(COALESCE(hf.biography, '')) LIKE '%' || normalized_query || '%'
        )
        ORDER BY relevance DESC
        LIMIT result_limit OFFSET result_offset
      ) f
    ),
    'dynasties', (
      SELECT COALESCE(json_agg(row_to_json(d)), '[]'::JSON)
      FROM (
        SELECT 
          dy.id, dy.name, dy.slug, dy.start_year, dy.end_year,
          dy.start_label, dy.end_label, dy.description, dy.coat_of_arms_url,
          c.name AS civilization_name,
          CASE 
            WHEN lower(dy.name) = normalized_query THEN 1.0
            WHEN lower(dy.name) LIKE '%' || normalized_query || '%' THEN 0.7
            ELSE extensions.similarity(lower(dy.name), normalized_query)
          END AS relevance
        FROM dynasties dy
        LEFT JOIN civilizations c ON dy.civilization_id = c.id
        WHERE (
          lower(dy.name) LIKE '%' || normalized_query || '%'
          OR extensions.similarity(lower(dy.name), normalized_query) > 0.1
          OR lower(COALESCE(dy.description, '')) LIKE '%' || normalized_query || '%'
        )
        ORDER BY relevance DESC
        LIMIT result_limit OFFSET result_offset
      ) d
    ),
    'civilizations', (
      SELECT COALESCE(json_agg(row_to_json(cv)), '[]'::JSON)
      FROM (
        SELECT 
          ci.id, ci.name, ci.slug, ci.start_year, ci.end_year,
          ci.start_label, ci.end_label, ci.description,
          l.name AS location_name,
          CASE 
            WHEN lower(ci.name) = normalized_query THEN 1.0
            WHEN lower(ci.name) LIKE '%' || normalized_query || '%' THEN 0.7
            ELSE extensions.similarity(lower(ci.name), normalized_query)
          END AS relevance
        FROM civilizations ci
        LEFT JOIN locations l ON ci.location_id = l.id
        WHERE (
          lower(ci.name) LIKE '%' || normalized_query || '%'
          OR extensions.similarity(lower(ci.name), normalized_query) > 0.1
          OR lower(COALESCE(ci.description, '')) LIKE '%' || normalized_query || '%'
        )
        ORDER BY relevance DESC
        LIMIT result_limit OFFSET result_offset
      ) cv
    ),
    'locations', (
      SELECT COALESCE(json_agg(row_to_json(lc)), '[]'::JSON)
      FROM (
        SELECT 
          lo.id, lo.name, lo.country, lo.continent, lo.region, lo.description,
          lo.latitude, lo.longitude,
          CASE 
            WHEN lower(lo.name) = normalized_query THEN 1.0
            WHEN lower(lo.name) LIKE '%' || normalized_query || '%' THEN 0.7
            ELSE extensions.similarity(lower(lo.name), normalized_query)
          END AS relevance
        FROM locations lo
        WHERE (
          lower(lo.name) LIKE '%' || normalized_query || '%'
          OR extensions.similarity(lower(lo.name), normalized_query) > 0.1
          OR lower(COALESCE(lo.country, '')) LIKE '%' || normalized_query || '%'
          OR lower(COALESCE(lo.continent, '')) LIKE '%' || normalized_query || '%'
        )
        ORDER BY relevance DESC
        LIMIT result_limit OFFSET result_offset
      ) lc
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
