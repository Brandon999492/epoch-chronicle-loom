/**
 * Global Search API Service
 * Uses trigram similarity search across all historical entities.
 */

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-api`;

export interface SearchFilters {
  q: string;
  category?: string;
  year_from?: number;
  year_to?: number;
  location_id?: string;
  civilization_id?: string;
  period_id?: string;
  page?: number;
  limit?: number;
}

export interface SearchEventResult {
  id: string;
  title: string;
  slug: string | null;
  year: number | null;
  year_label: string | null;
  description: string | null;
  category: string | null;
  significance: number | null;
  image_url: string | null;
  tags: string[];
  location_name: string | null;
  time_period_name: string | null;
  civilization_name: string | null;
  relevance: number;
}

export interface SearchFigureResult {
  id: string;
  name: string;
  slug: string | null;
  birth_year: number | null;
  death_year: number | null;
  birth_label: string | null;
  death_label: string | null;
  title: string | null;
  biography: string | null;
  image_url: string | null;
  tags: string[];
  dynasty_name: string | null;
  birth_location_name: string | null;
  relevance: number;
}

export interface SearchDynastyResult {
  id: string;
  name: string;
  slug: string | null;
  start_year: number | null;
  end_year: number | null;
  start_label: string | null;
  end_label: string | null;
  description: string | null;
  coat_of_arms_url: string | null;
  civilization_name: string | null;
  relevance: number;
}

export interface SearchCivResult {
  id: string;
  name: string;
  slug: string | null;
  start_year: number | null;
  end_year: number | null;
  description: string | null;
  location_name: string | null;
  relevance: number;
}

export interface SearchLocResult {
  id: string;
  name: string;
  country: string | null;
  continent: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  relevance: number;
}

export interface GlobalSearchResults {
  events: SearchEventResult[];
  figures: SearchFigureResult[];
  dynasties: SearchDynastyResult[];
  civilizations: SearchCivResult[];
  locations: SearchLocResult[];
}

export interface GraphEventData {
  entity: any;
  figures: Array<{ figure: any; role: string | null }>;
  media: Array<{ media: any; display_order: number }>;
  related_events: any[];
}

export interface GraphFigureData {
  entity: any;
  events: Array<{ event: any; role: string | null }>;
  relationships: Array<{ related_figure: any; relationship_type: string }>;
  media: Array<{ media: any }>;
}

export interface GraphDynastyData {
  entity: any;
  figures: any[];
  events: any[];
}

async function apiFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}/${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const resp = await fetch(url.toString(), {
    headers: {
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `API error ${resp.status}`);
  }
  return resp.json();
}

export const searchApi = {
  search: (filters: SearchFilters) =>
    apiFetch<GlobalSearchResults>("search", filters as unknown as Record<string, string | number>),

  graph: {
    event: (id: string) => apiFetch<GraphEventData>(`graph/event/${id}`),
    figure: (id: string) => apiFetch<GraphFigureData>(`graph/figure/${id}`),
    dynasty: (id: string) => apiFetch<GraphDynastyData>(`graph/dynasty/${id}`),
  },
};
