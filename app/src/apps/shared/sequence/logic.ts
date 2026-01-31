/**
 * Game logic for Sequence/Pattern games.
 */

import type { SequenceState, SequenceLevel, PatternElement, Pattern } from "./types";

/**
 * Get level by ID.
 */
export const getLevel = (levels: SequenceLevel[], levelId: number): SequenceLevel =>
  levels.find((l) => l.id === levelId) ?? levels[0];

/**
 * Create initial state for a level.
 */
export const makeInitialState = (
  levels: SequenceLevel[],
  levelId: number,
  completedLevels: number[] = []
): SequenceState => {
  const level = getLevel(levels, levelId);
  return {
    levelId: level.id,
    sequence: [...level.pattern.elements],
    answers: new Map(),
    cursorIndex: 0,
    status: "idle",
    message: undefined,
    completedLevels,
    highlightIndex: undefined
  };
};

/**
 * Generate a repeating pattern.
 */
export const generateRepeatingPattern = (
  basePattern: PatternElement[],
  repeatCount: number
): PatternElement[] => {
  const result: PatternElement[] = [];
  for (let i = 0; i < repeatCount; i++) {
    for (const element of basePattern) {
      result.push({
        ...element,
        id: `${element.id}_${i}`
      });
    }
  }
  return result;
};

/**
 * Find the pattern in a sequence (for pattern recognition).
 */
export const detectPattern = (sequence: PatternElement[]): Pattern | null => {
  if (sequence.length < 2) return null;

  // Try pattern lengths from 1 to half the sequence
  for (let len = 1; len <= sequence.length / 2; len++) {
    let isPattern = true;
    for (let i = len; i < sequence.length; i++) {
      if (sequence[i].value !== sequence[i % len].value) {
        isPattern = false;
        break;
      }
    }
    if (isPattern) {
      return {
        elements: sequence.slice(0, len),
        repeatCount: Math.ceil(sequence.length / len)
      };
    }
  }

  return null;
};

/**
 * Check if user's answers are correct.
 */
export const validateAnswers = (
  state: SequenceState,
  level: SequenceLevel
): boolean => {
  const { pattern, solution } = level;
  const { answers } = state;

  if (!pattern.missingIndices || pattern.missingIndices.length === 0) {
    return true;
  }

  for (const index of pattern.missingIndices) {
    const answer = answers.get(index);
    const expected = solution ? solution[index] : pattern.elements[index];

    if (!answer || answer.value !== expected.value) {
      return false;
    }
  }

  return true;
};

/**
 * Place an element at a position.
 */
export const placeElement = (
  state: SequenceState,
  index: number,
  element: PatternElement
): boolean => {
  state.answers.set(index, element);
  return true;
};

/**
 * Remove element from a position.
 */
export const removeElement = (state: SequenceState, index: number): boolean => {
  return state.answers.delete(index);
};

/**
 * Move cursor in the sequence.
 */
export const moveCursor = (state: SequenceState, direction: 1 | -1): void => {
  const newIndex = state.cursorIndex + direction;
  if (newIndex >= 0 && newIndex < state.sequence.length) {
    state.cursorIndex = newIndex;
  }
};

/**
 * Get status text.
 */
export const getStatusText = (state: SequenceState): string => {
  if (state.message) return state.message;
  switch (state.status) {
    case "running":
      return "Completá la secuencia...";
    case "complete":
      return "¡Correcto!";
    case "error":
      return "Incorrecto, intentá de nuevo.";
    default:
      return "Listo.";
  }
};

/**
 * Create common pattern elements.
 */
export const createColorElements = (colors: string[]): PatternElement[] =>
  colors.map((color, i) => ({
    id: `color_${i}`,
    type: "color",
    value: color
  }));

export const createShapeElements = (shapes: string[]): PatternElement[] =>
  shapes.map((shape, i) => ({
    id: `shape_${i}`,
    type: "shape",
    value: shape
  }));

export const createNumberElements = (numbers: number[]): PatternElement[] =>
  numbers.map((num, i) => ({
    id: `num_${i}`,
    type: "number",
    value: String(num)
  }));
