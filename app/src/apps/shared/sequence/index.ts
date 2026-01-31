/**
 * Shared Sequence/Pattern module.
 */

// Types
export * from "./types";

// Logic
export {
  getLevel,
  makeInitialState,
  generateRepeatingPattern,
  detectPattern,
  validateAnswers,
  placeElement,
  removeElement,
  moveCursor,
  getStatusText,
  createColorElements,
  createShapeElements,
  createNumberElements
} from "./logic";
