import type { GameMetadata } from "../types/game.types";

export const GAME_REGISTRY: GameMetadata[] = [
  {
    id: "water-jugs",
    name: "Water Jugs",
    description:
      "Solve logic puzzles by measuring exact amounts using different sized jugs. Improves problem-solving and planning.",
    category: "logic",
    maxLevel: 10,
    estimatedMinutes: 5,
    cognitiveDomains: ["problem_solving", "executive_function"],
    icon: "🪣",
  },
  {
    id: "tower-of-hanoi",
    name: "Tower of Hanoi",
    description:
      "Move disks between pegs following specific rules. Classic recursive thinking and strategic planning exercise.",
    category: "logic",
    maxLevel: 10,
    estimatedMinutes: 5,
    cognitiveDomains: ["problem_solving", "executive_function", "spatial_reasoning"],
    icon: "🗼",
  },
  {
    id: "ball-sort",
    name: "Ball Sort Puzzle",
    description:
      "Sort colored balls into tubes so each tube contains only one color. Develops logical thinking and planning.",
    category: "logic",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["problem_solving", "executive_function"],
    icon: "🎱",
  },
  {
    id: "n-back",
    name: "N-Back",
    description:
      "Remember and match items from N steps back in a sequence. Scientifically proven to enhance working memory.",
    category: "memory",
    maxLevel: 10,
    estimatedMinutes: 5,
    cognitiveDomains: ["memory", "attention", "executive_function"],
    icon: "🧠",
  },
  {
    id: "logic-puzzles",
    name: "Logic Puzzles",
    description:
      "Solve challenging logic and math puzzles requiring step-by-step reasoning. Develops analytical thinking.",
    category: "logic",
    maxLevel: 10,
    estimatedMinutes: 6,
    cognitiveDomains: ["problem_solving", "executive_function"],
    icon: "🧩",
  },
  {
    id: "stroop",
    name: "Stroop Test",
    description:
      "Name the color of words while ignoring their meaning. Trains cognitive control and selective attention.",
    category: "attention",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["attention", "cognitive_flexibility", "processing_speed"],
    icon: "🎨",
  },
  {
    id: "mental-rotation",
    name: "Mental Rotation",
    description:
      "Identify if rotated shapes match the original. Develops spatial reasoning and visualization abilities.",
    category: "spatial",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["spatial_reasoning"],
    icon: "🔄",
  },
  {
    id: "schulte-table",
    name: "Schulte Table",
    description:
      "Find numbers in sequence as fast as possible. Improves peripheral vision, focus, and reading speed.",
    category: "attention",
    maxLevel: 10,
    estimatedMinutes: 3,
    cognitiveDomains: ["attention", "processing_speed"],
    icon: "🔢",
  },
  {
    id: "maze",
    name: "Pathway Maze",
    description:
      "Navigate through increasingly complex mazes. Enhances spatial planning and strategic thinking.",
    category: "spatial",
    maxLevel: 10,
    estimatedMinutes: 5,
    cognitiveDomains: ["spatial_reasoning", "problem_solving"],
    icon: "🌀",
  },
  {
    id: "pattern-matrix",
    name: "Pattern Matrix",
    description:
      "Memorize and recreate visual patterns on a grid. Strengthens visual memory and pattern recognition.",
    category: "memory",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["memory", "spatial_reasoning"],
    icon: "⬜",
  },
  {
    id: "quick-math",
    name: "Quick Math",
    description:
      "Solve arithmetic problems under time pressure. Boosts mental calculation speed and numerical fluency.",
    category: "speed",
    maxLevel: 10,
    estimatedMinutes: 3,
    cognitiveDomains: ["processing_speed", "executive_function"],
    icon: "➕",
  },
  {
    id: "word-scramble",
    name: "Word Scramble",
    description:
      "Unscramble letters to form valid words. Enhances vocabulary, spelling, and verbal reasoning.",
    category: "logic",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["problem_solving", "cognitive_flexibility"],
    icon: "📝",
  },
  {
    id: "simon-says",
    name: "Simon Says",
    description:
      "Remember and repeat increasingly long color sequences. Classic memory game improving sequential recall.",
    category: "memory",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["memory", "attention"],
    icon: "🔵",
  },
  {
    id: "card-matching",
    name: "Card Matching",
    description:
      "Find matching pairs in a grid of face-down cards. Concentration game training visual memory and attention.",
    category: "memory",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["memory", "attention"],
    icon: "🃏",
  },
  {
    id: "reaction-time",
    name: "Reaction Time",
    description:
      "Click as fast as possible when the screen changes color. Measures and improves reflexes and response speed.",
    category: "speed",
    maxLevel: 10,
    estimatedMinutes: 3,
    cognitiveDomains: ["processing_speed", "attention"],
    icon: "⚡",
  },
  {
    id: "number-sequence",
    name: "Number Sequence",
    description:
      "Identify patterns and predict the next number in sequences. Develops logical reasoning and pattern recognition.",
    category: "logic",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["memory", "problem_solving"],
    icon: "🔟",
  },
  {
    id: "dual-task",
    name: "Dual Task Challenge",
    description:
      "Count shapes while solving math problems simultaneously. Tests divided attention and multitasking abilities.",
    category: "attention",
    maxLevel: 10,
    estimatedMinutes: 5,
    cognitiveDomains: ["executive_function", "attention", "cognitive_flexibility"],
    icon: "⚖️",
  },
  {
    id: "visual-search",
    name: "Visual Search",
    description:
      "Find target shapes among distractors as quickly as possible. Improves visual scanning and selective attention.",
    category: "attention",
    maxLevel: 10,
    estimatedMinutes: 3,
    cognitiveDomains: ["attention", "processing_speed"],
    icon: "🔍",
  },
  {
    id: "anagram-solver",
    name: "Anagram Solver",
    description:
      "Rearrange letters to form words before time runs out. Enhances linguistic flexibility and problem-solving speed.",
    category: "speed",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["problem_solving", "cognitive_flexibility"],
    icon: "🔤",
  },
  {
    id: "trail-making",
    name: "Trail Making",
    description:
      "Connect numbers and letters in alternating sequence. Tests cognitive flexibility and task-switching ability.",
    category: "attention",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["processing_speed", "cognitive_flexibility", "executive_function"],
    icon: "🗺️",
  },
  {
    id: "working-memory-grid",
    name: "Working Memory Grid",
    description:
      "Remember positions of highlighted cells on a grid. Trains spatial working memory and visual retention.",
    category: "memory",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["memory", "executive_function"],
    icon: "🟦",
  },
  {
    id: "delayed-recall",
    name: "Delayed Recall",
    description:
      "Study a word list, do a brief distractor task, then recall the words. One of the most sensitive memory tests.",
    category: "memory",
    maxLevel: 10,
    estimatedMinutes: 6,
    cognitiveDomains: ["memory"],
    icon: "💭",
  },
  {
    id: "daily-routine-recall",
    name: "Daily Routine Recall",
    description:
      "Arrange daily activities into their correct chronological order from morning to night. Strengthens episodic sequencing and executive planning.",
    category: "memory",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["memory", "executive_function"],
    icon: "🌅",
  },
  {
    id: "cultural-object-recognition",
    name: "Cultural Object Recognition",
    description:
      "Recognize, identify, and recall traditional Northeast Indian heritage symbols and artifacts. Enhances semantic recall and cultural connection.",
    category: "memory",
    maxLevel: 10,
    estimatedMinutes: 4,
    cognitiveDomains: ["memory", "attention"],
    icon: "🏮",
  },
];

export const getGameById = (id: string): GameMetadata | undefined =>
  GAME_REGISTRY.find((g) => g.id === id);

export const getGamesByCategory = (category: string): GameMetadata[] =>
  GAME_REGISTRY.filter((g) => g.category === category);

export const GAME_MAP = new Map(GAME_REGISTRY.map((g) => [g.id, g]));

export const ALL_CATEGORIES = Array.from(
  new Set(GAME_REGISTRY.map((g) => g.category)),
) as GameMetadata["category"][];
