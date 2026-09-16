export type GameCategory = "memory" | "logic" | "attention" | "speed" | "spatial";

export type CognitiveDomain =
  | "memory"
  | "attention"
  | "processing_speed"
  | "executive_function"
  | "problem_solving"
  | "spatial_reasoning"
  | "cognitive_flexibility";

export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  maxLevel: number;
  estimatedMinutes: number;
  cognitiveDomains: CognitiveDomain[];
  icon: string; // emoji
}

export interface GameProgress {
  bestLevel: number;
  bestScore: number;
  lastPlayed?: string; // ISO date
}

export interface GameSessionSubmit {
  gameId: string;
  gameType: string;
  score: number;
  accuracy: number;
  durationSeconds: number;
  level: number;
  difficulty: string;
  metrics?: Record<string, unknown>;
}

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  memory: "Memory & Recall",
  logic: "Logic & Problem Solving",
  attention: "Attention & Focus",
  speed: "Speed & Reaction",
  spatial: "Spatial & Visual",
};

export const CATEGORY_COLORS: Record<GameCategory, string> = {
  memory: "bg-sun/20 text-sun border-sun/40",
  logic: "bg-fire/20 text-fire border-fire/40",
  attention: "bg-tea-confirm/20 text-tea-confirm border-tea-confirm/40",
  speed: "bg-cream/20 text-cream border-cream/40",
  spatial: "bg-sun/10 text-sun/80 border-sun/30",
};

export const DOMAIN_LABELS: Record<CognitiveDomain, string> = {
  memory: "Memory",
  attention: "Attention",
  processing_speed: "Processing Speed",
  executive_function: "Executive Function",
  problem_solving: "Problem Solving",
  spatial_reasoning: "Spatial Reasoning",
  cognitive_flexibility: "Cognitive Flexibility",
};
