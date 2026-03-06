import { angloSaxonHouse } from "./angloSaxon";
import { normanHouse } from "./norman";
import { plantagenetHouse } from "./plantagenet";
import { lancasterHouse } from "./lancaster";
import { yorkHouse } from "./york";
import { tudorHouse } from "./tudor";
import { stuartHouse } from "./stuart";
import { hanoverHouse } from "./hanover";
import { saxeCoburgWindsorHouse } from "./saxeCoburgWindsor";
import type { RoyalHouse, RoyalProfile } from "./types";

export const royalHouses: RoyalHouse[] = [
  angloSaxonHouse,
  normanHouse,
  plantagenetHouse,
  lancasterHouse,
  yorkHouse,
  tudorHouse,
  stuartHouse,
  hanoverHouse,
  saxeCoburgWindsorHouse,
];

export const allRoyals: RoyalProfile[] = royalHouses.flatMap((h) => h.members);

export function getRoyalById(id: string): RoyalProfile | undefined {
  return allRoyals.find((r) => r.id === id);
}

export function getHouseById(id: string): RoyalHouse | undefined {
  return royalHouses.find((h) => h.id === id);
}

export type { RoyalHouse, RoyalProfile };
