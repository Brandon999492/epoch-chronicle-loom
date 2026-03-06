export interface HistoricalEra {
  id: string;
  name: string;
  period: string;
  startYear: number;
  endYear: number;
  description: string;
  color: string;
  events: HistoricalEvent[];
}

export interface HistoricalEvent {
  id: string;
  title: string;
  year: number;
  yearLabel: string;
  description: string;
  category: EventCategory;
  era: string;
  imageUrl?: string;
  sourceLinks?: { label: string; url: string }[];
}

export interface HistoricalFigure {
  id: string;
  name: string;
  born: string;
  died: string;
  role: string;
  description: string;
  era: string;
}

export type EventCategory =
  | "war"
  | "science"
  | "culture"
  | "politics"
  | "discovery"
  | "assassination"
  | "treaty"
  | "religion"
  | "geology"
  | "evolution"
  | "mystery"
  | "ritual"
  | "serial-killer";

export const categoryLabels: Record<EventCategory, string> = {
  war: "War & Conflict",
  science: "Science & Technology",
  culture: "Culture & Arts",
  politics: "Politics & Government",
  discovery: "Discovery & Exploration",
  assassination: "Assassination",
  treaty: "Treaty & Diplomacy",
  religion: "Religion & Philosophy",
  geology: "Geology & Earth Science",
  evolution: "Evolution & Biology",
  mystery: "Mystery & Lost Civilizations",
  ritual: "Rituals & Sacred Practices",
  "serial-killer": "Serial Killers & True Crime",
};

export const categoryColors: Record<EventCategory, string> = {
  war: "0 62% 50%",
  science: "200 70% 50%",
  culture: "280 60% 55%",
  politics: "32 50% 65%",
  discovery: "150 60% 45%",
  assassination: "0 70% 40%",
  treaty: "170 50% 50%",
  religion: "45 80% 55%",
  geology: "25 60% 45%",
  evolution: "120 50% 40%",
  mystery: "270 70% 45%",
  ritual: "310 60% 50%",
  "serial-killer": "350 80% 35%",
};
