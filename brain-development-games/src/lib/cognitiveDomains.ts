import type { CognitiveDomain } from '../types/analytics'

/**
 * Maps every existing game id (from gameRegistry.ts) to one or more
 * standardized cognitive domains. Purely additive — does not touch
 * gameRegistry.ts or any game component.
 */
export const GAME_DOMAIN_MAP: Record<string, CognitiveDomain[]> = {
  'water-jugs': ['problem_solving', 'executive_function'],
  'tower-of-hanoi': ['problem_solving', 'executive_function', 'spatial_reasoning'],
  'ball-sort': ['problem_solving', 'executive_function'],
  'n-back': ['memory', 'attention', 'executive_function'],
  'logic-puzzles': ['problem_solving', 'executive_function'],
  'stroop': ['attention', 'cognitive_flexibility', 'processing_speed'],
  'mental-rotation': ['spatial_reasoning'],
  'schulte-table': ['attention', 'processing_speed'],
  'maze': ['spatial_reasoning', 'problem_solving'],
  'pattern-matrix': ['memory', 'spatial_reasoning'],
  'quick-math': ['processing_speed', 'executive_function'],
  'word-scramble': ['problem_solving', 'cognitive_flexibility'],
  'simon-says': ['memory', 'attention'],
  'card-matching': ['memory', 'attention'],
  'reaction-time': ['processing_speed', 'attention'],
  'number-sequence': ['memory', 'problem_solving'],
  'dual-task': ['executive_function', 'attention', 'cognitive_flexibility'],
  'visual-search': ['attention', 'processing_speed'],
  'anagram-solver': ['problem_solving', 'cognitive_flexibility'],
  'trail-making': ['processing_speed', 'cognitive_flexibility', 'executive_function'],
  'working-memory-grid': ['memory', 'executive_function'],
  'delayed-recall': ['memory']
}

export const DOMAIN_LABELS: Record<CognitiveDomain, string> = {
  memory: 'Memory',
  attention: 'Attention',
  processing_speed: 'Processing Speed',
  executive_function: 'Executive Function',
  problem_solving: 'Problem Solving',
  spatial_reasoning: 'Spatial Reasoning',
  cognitive_flexibility: 'Cognitive Flexibility'
}

export const ALL_DOMAINS: CognitiveDomain[] = [
  'memory',
  'attention',
  'processing_speed',
  'executive_function',
  'problem_solving',
  'spatial_reasoning',
  'cognitive_flexibility'
]

export function getDomainsForGame(gameId: string): CognitiveDomain[] {
  return GAME_DOMAIN_MAP[gameId] ?? []
}
