/**
 * React Query hooks for the History API.
 * Use these in components to fetch data with caching, pagination, and loading states.
 */

import { useQuery } from "@tanstack/react-query";
import { historyApi, type EventFilters, type FigureFilters } from "@/services/historyApi";

// ===== Events =====
export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: ["history-events", filters],
    queryFn: () => historyApi.events.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ["history-event", id],
    queryFn: () => historyApi.events.get(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useEventFigures(eventId: string | undefined) {
  return useQuery({
    queryKey: ["history-event-figures", eventId],
    queryFn: () => historyApi.events.getFigures(eventId!),
    enabled: !!eventId,
  });
}

export function useEventMedia(eventId: string | undefined) {
  return useQuery({
    queryKey: ["history-event-media", eventId],
    queryFn: () => historyApi.events.getMedia(eventId!),
    enabled: !!eventId,
  });
}

// ===== Figures =====
export function useFigures(filters?: FigureFilters) {
  return useQuery({
    queryKey: ["history-figures", filters],
    queryFn: () => historyApi.figures.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFigure(id: string | undefined) {
  return useQuery({
    queryKey: ["history-figure", id],
    queryFn: () => historyApi.figures.get(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useFigureRelationships(figureId: string | undefined) {
  return useQuery({
    queryKey: ["history-figure-relationships", figureId],
    queryFn: () => historyApi.figures.getRelationships(figureId!),
    enabled: !!figureId,
  });
}

// ===== Dynasties =====
export function useDynasties(filters?: { q?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["history-dynasties", filters],
    queryFn: () => historyApi.dynasties.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDynasty(id: string | undefined) {
  return useQuery({
    queryKey: ["history-dynasty", id],
    queryFn: () => historyApi.dynasties.get(id!),
    enabled: !!id,
  });
}

// ===== Timeline =====
export function useTimeline() {
  return useQuery({
    queryKey: ["history-timeline"],
    queryFn: () => historyApi.timeline.list(),
    staleTime: 30 * 60 * 1000,
  });
}

// ===== Civilizations =====
export function useCivilizations(filters?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["history-civilizations", filters],
    queryFn: () => historyApi.civilizations.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

// ===== Locations =====
export function useLocations(filters?: { q?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["history-locations", filters],
    queryFn: () => historyApi.locations.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

// ===== Media =====
export function useMediaAssets(filters?: { type?: string; q?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["history-media", filters],
    queryFn: () => historyApi.media.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

// ===== Search =====
export function useHistorySearch(query: string) {
  return useQuery({
    queryKey: ["history-search", query],
    queryFn: () => historyApi.search(query),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}
