/**
 * Types for Sequence/Pattern games.
 * Games focused on pattern recognition and sequence completion.
 */

export type SequenceStatus = "idle" | "running" | "complete" | "error";

/** A single element in a pattern */
export type PatternElement = {
  id: string;
  type: string;      // "color", "shape", "number", "icon"
  value: string;     // The actual value (e.g., "red", "circle", "5")
  displayValue?: string; // Optional display override
};

/** A pattern to complete or recognize */
export type Pattern = {
  elements: PatternElement[];
  missingIndices?: number[];  // Which elements are hidden/need to be filled
  repeatCount?: number;       // For repeating patterns
};

export type SequenceLevel = {
  id: number;
  title: string;
  instructions: string;
  // The pattern to work with
  pattern: Pattern;
  // Available elements to choose from
  availableElements?: PatternElement[];
  // Solution (for validation)
  solution?: PatternElement[];
  // Constraints
  blockLimit?: number;
  constraints?: {
    maxBlocks?: number;
    mustUseRepeat?: boolean;
    timeLimit?: number;
  };
};

export type SequenceState = {
  levelId: number;
  // Current state of the sequence
  sequence: PatternElement[];
  // User's answers/placements
  answers: Map<number, PatternElement>;
  // Cursor position (for block-based interaction)
  cursorIndex: number;
  // Game status
  status: SequenceStatus;
  message?: string;
  completedLevels?: number[];
  // For animated sequences
  highlightIndex?: number;
};

export type SequenceUI = {
  rootEl: HTMLElement;
  container: HTMLElement;
  sequenceEl: HTMLElement;
  statusEl: HTMLDivElement;
  optionsEl?: HTMLElement;
};

export type SequenceGameConfig = {
  elementSize: number;
  gap: number;
  colors: Record<string, string>;
  shapes: Record<string, string>;  // shape type -> SVG path or emoji
  animationSpeed: number;
};
