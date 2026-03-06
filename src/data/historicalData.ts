// Re-export all types and data from split modules
export type { HistoricalEra, HistoricalEvent, HistoricalFigure, EventCategory } from "./types";
export { categoryLabels, categoryColors } from "./types";
export { featuredFigures } from "./figures";

import { geologicalEras } from "./geologicalEras";
import { ancientMedievalEras } from "./ancientMedievalEras";
import { earlyModernEras } from "./earlyModernEra";
import { modernEras } from "./modernEra";
import { contemporaryEras } from "./contemporaryEra";
import { ancientMysteriesEras } from "./ancientMysteries";
import { serialKillerEras } from "./serialKillers";
import type { HistoricalEvent } from "./types";

export const eras = [
  ...geologicalEras,
  ...ancientMedievalEras,
  ...earlyModernEras,
  ...modernEras,
  ...contemporaryEras,
  ...ancientMysteriesEras,
  ...serialKillerEras,
];

export const allEvents: HistoricalEvent[] = eras.flatMap(era => era.events);

export function getOnThisDay(): HistoricalEvent[] {
  const today = new Date();
  const month = today.getMonth();
  const day = today.getDate();
  const hash = (month * 31 + day) % allEvents.length;
  const result: HistoricalEvent[] = [];
  for (let i = 0; i < Math.min(4, allEvents.length); i++) {
    result.push(allEvents[(hash + i * 7) % allEvents.length]);
  }
  return result;
}
