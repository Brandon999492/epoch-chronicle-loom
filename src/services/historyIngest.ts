/**
 * History Ingestion Service
 * Client for the history-ingest edge function.
 */

const INGEST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history-ingest`;

interface IngestResult {
  inserted: number;
  skipped: number;
  errors: string[];
  linked_figures?: number;
}

interface AiGenerateResult {
  status: "draft" | "error";
  generated?: any;
  raw?: string;
  message: string;
}

async function ingestFetch<T>(action: string, items: any[], token: string): Promise<T> {
  const resp = await fetch(`${INGEST_URL}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Ingest failed (${resp.status})`);
  }
  return resp.json();
}

export const historyIngest = {
  locations: (items: any[], token: string) =>
    ingestFetch<IngestResult>("locations", items, token),

  civilizations: (items: any[], token: string) =>
    ingestFetch<IngestResult>("civilizations", items, token),

  dynasties: (items: any[], token: string) =>
    ingestFetch<IngestResult>("dynasties", items, token),

  timePeriods: (items: any[], token: string) =>
    ingestFetch<IngestResult>("time-periods", items, token),

  figures: (items: any[], token: string) =>
    ingestFetch<IngestResult>("figures", items, token),

  events: (items: any[], token: string) =>
    ingestFetch<IngestResult>("events", items, token),

  relationships: (items: any[], token: string) =>
    ingestFetch<IngestResult>("relationships", items, token),

  aiGenerate: async (topic: string, token: string): Promise<AiGenerateResult> => {
    const resp = await fetch(`${INGEST_URL}/ai-generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `AI generation failed (${resp.status})`);
    }
    return resp.json();
  },
};
