export interface RoyalProfile {
  id: string;
  name: string;
  regnalName?: string;
  titles: { title: string; from: string; to: string }[];
  house: string;
  successionPosition?: number;

  born: string;
  birthPlace: string;
  died: string;
  deathPlace: string;
  ageAtDeath?: number;
  causeOfDeath: string;
  causeOfDeathDisputed?: boolean;
  burialPlace: string;

  isMonarch: boolean;
  reignStart?: string;
  reignEnd?: string;
  reignLength?: string;
  coronationDate?: string;
  howGainedPower?: string;
  howReignEnded?: string;

  majorActions: string[];
  warsAndViolence: {
    description: string;
    estimatedDeaths?: string;
    disclaimer?: string;
  }[];

  reputationLifetime: string;
  reputationModern: string;
  nicknames: string[];
  controversies: string[];

  milestones: string[];
  achievements: string[];
  failures: string[];

  parentIds: string[];
  spouseIds: string[];
  childIds: string[];

  imageUrl: string;
  sourceLinks: { label: string; url: string }[];
  description: string;
}

export interface RoyalHouse {
  id: string;
  name: string;
  period: string;
  startYear: number;
  endYear: number;
  description: string;
  color: string;
  members: RoyalProfile[];
}
