export const DIMENSIONS = {
  D1: { id: "D1", name: "Cognitive Knowledge" },
  D2: { id: "D2", name: "Behavioral Engagement" },
  D3: { id: "D3", name: "Strategic Behavior & Agency" },
  D4: { id: "D4", name: "Social & Collaborative" },
  D5: { id: "D5", name: "Affective & SEL" },
  D6: { id: "D6", name: "Temporal & Longitudinal" },
} as const;

export const ROLES = {
  ATTACKER: "attacker",
  HEALER: "healer",
  BUILDER: "builder",
} as const;

export const SUBJECTS = {
  MATH: "math",
  SCIENCE: "science",
  GENERAL: "general",
} as const;
