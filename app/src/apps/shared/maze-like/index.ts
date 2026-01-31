/**
 * Shared maze-like game module.
 *
 * This module provides shared functionality for maze-like games,
 * including types, constants, logic, rendering, and adapters.
 */

// Types
export * from "./types";

// Constants
export * from "./constants";

// Logic
export {
  turnLeft,
  turnRight,
  isBlocked,
  inBounds,
  getDelta,
  getLevel,
  makeInitialState,
  getStatusText,
  countBlocks,
  applyInitialBlocks,
  DIR_ORDER,
  DIR_DELTAS
} from "./logic";

// Sprites
export {
  loadPlayerSprite,
  getPlayerSprite,
  getPlayerSpriteFrames,
  loadObstacleSprite,
  loadGoalSprite,
  getGoalSprite,
  getGoalSpriteFrames,
  loadBackgroundImage,
  preloadObstacleSprites,
  preloadBackgrounds,
  initSprites,
  createAnimationState,
  type SpriteAnimationState
} from "./sprites";

// Renderer
export {
  drawMaze,
  drawMazeSimple,
  type AnimationRenderState,
  type MazeRendererContext
} from "./renderer";

// Adapter
export {
  createMazeAdapter,
  createSimpleMazeAdapter,
  type MazeAdapterContext
} from "./adapter";

// Constraints
export { createMazeCheckConstraints as createMazeCheckConstraintsWithLevels } from "./constraints";
