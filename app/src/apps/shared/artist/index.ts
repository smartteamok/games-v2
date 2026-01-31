/**
 * Shared Artist (turtle graphics) module.
 */

// Types
export * from "./types";

// Logic
export {
  degreesToRadians,
  normalizeAngle,
  calculateEndPoint,
  getLevel,
  makeInitialState,
  moveForward,
  moveBackward,
  turnLeft,
  turnRight,
  penUp,
  penDown,
  setColor,
  setWidth,
  getStatusText,
  validateDrawing
} from "./logic";

// Renderer
export {
  drawArtistCanvas,
  animateLineDrawing,
  createDefaultConfig
} from "./renderer";

// Adapter
export {
  createArtistAdapter,
  createArtistCheckConstraints,
  type ArtistAdapterContext
} from "./adapter";
