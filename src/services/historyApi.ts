/**
 * History API Service Layer
 * Central typed client for all history data operations.
 * Communicates through the history-api edge function.
 */

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-api`;

// ===== Types =====

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Location {
  id: string;
  name: string;
  alternate_names: string[];
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  country: string | null;
  continent: string | null;
  description: string | null;
}

export interface TimePeriod {
  id: string;
  name: string;
  slug: string | null;
  start_year: number | null;
  end_year: number | null;
  start_label: string | null;
  end_label: string | null;
  description: string | null;
  parent_period_id: string | null;
  sort_order: number;
}

export interface Civilization {
  id: string;
  name: string;
  slug: string | null;
  start_year: number | null;
  end_year: number | null;
  start_label: string | null;
  end_label: string | null;
  description: string | null;
  location?: Location | null;
}

export interface Dynasty {
  id: string;
  name: string;
  slug: string | null;
  start_year: number | null;
  end_year: number | null;
  start_label: string | null;
  end_label: string | null;
  description: string | null;
  coat_of_arms_url: string | null;
  civilization?: Civilization | null;
  location?: Location | null;
}

export interface HistoricalFigure {
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
  dynasty?: Dynasty | null;
  birth_location?: Location | null;
  death_location?: Location | null;
}

export interface HistoricalEvent {
  id: string;
  title: string;
  slug: string | null;
  year: number | null;
  year_label: string | null;
  exact_date: string | null;
  end_year: number | null;
  end_year_label: string | null;
  description: string | null;
  detailed_description: string | null;
  category: string;
  significance: number;
  image_url: string | null;
  tags: string[];
  location?: Location | null;
  time_period?: TimePeriod | null;
  civilization?: Civilization | null;
}

export interface MediaAsset {
  id: string;
  url: string;
  thumbnail_url: string | null;
  media_type: string;
  title: string | null;
  description: string | null;
  source: string | null;
  source_url: string | null;
  license: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface SearchResults {
  events: Pick<HistoricalEvent, "id" | "title" | "year_label" | "category" | "image_url">[];
  figures: Pick<HistoricalFigure, "id" | "name" | "title" | "birth_label" | "death_label" | "image_url">[];
  dynasties: Pick<Dynasty, "id" | "name" | "start_label" | "end_label">[];
}

export interface EventFilters {
  q?: string;
  category?: string;
  year_from?: number;
  year_to?: number;
  period_id?: string;
  location_id?: string;
  page?: number;
  limit?: number;
}

export interface FigureFilters {
  q?: string;
  dynasty_id?: string;
  page?: number;
  limit?: number;
}

// ===== Fetch Helper =====

async function apiFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}/${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `API error ${resp.status}`);
  }
  return resp.json();
}

// ===== API Methods =====

export const historyApi = {
  // Events
  events: {
    list: (filters?: EventFilters) =>
      apiFetch<PaginatedResponse<HistoricalEvent>>("events", filters as Record<string, string | number>),
    get: (id: string) => apiFetch<HistoricalEvent>(`events/${id}`),
    getFigures: (id: string) => apiFetch<Array<{ figure: HistoricalFigure; role: string }>>(`events/${id}/figures`),
    getMedia: (id: string) => apiFetch<Array<{ media: MediaAsset; display_order: number }>>(`events/${id}/media`),
  },

  // Figures
  figures: {
    list: (filters?: FigureFilters) =>
      apiFetch<PaginatedResponse<HistoricalFigure>>("figures", filters as Record<string, string | number>),
    get: (id: string) => apiFetch<HistoricalFigure>(`figures/${id}`),
    getEvents: (id: string) => apiFetch<Array<{ event: HistoricalEvent; role: string }>>(`figures/${id}/events`),
    getRelationships: (id: string) =>
      apiFetch<Array<{ related_figure: HistoricalFigure; relationship_type: string }>>(`figures/${id}/relationships`),
  },

  // Dynasties
  dynasties: {
    list: (filters?: { q?: string; page?: number; limit?: number }) =>
      apiFetch<PaginatedResponse<Dynasty>>("dynasties", filters as Record<string, string | number>),
    get: (id: string) => apiFetch<Dynasty>(`dynasties/${id}`),
  },

  // Timeline
  timeline: {
    list: () => apiFetch<TimePeriod[]>("timeline"),
  },

  // Civilizations
  civilizations: {
    list: (filters?: { page?: number; limit?: number }) =>
      apiFetch<PaginatedResponse<Civilization>>("civilizations", filters as Record<string, string | number>),
    get: (id: string) => apiFetch<Civilization>(`civilizations/${id}`),
  },

  // Locations
  locations: {
    list: (filters?: { q?: string; page?: number; limit?: number }) =>
      apiFetch<PaginatedResponse<Location>>("locations", filters as Record<string, string | number>),
    get: (id: string) => apiFetch<Location>(`locations/${id}`),
  },

  // Media
  media: {
    list: (filters?: { type?: string; q?: string; page?: number; limit?: number }) =>
      apiFetch<PaginatedResponse<MediaAsset>>("media", filters as Record<string, string | number>),
    get: (id: string) => apiFetch<MediaAsset>(`media/${id}`),
  },

  // Cross-entity search
  search: (q: string) => apiFetch<SearchResults>("search", { q }),
};
