/**
 * Shared constants for maze-like games.
 */

import type { Direction } from "./types";

export const DIR_ORDER: Direction[] = ["N", "E", "S", "W"];

export const DIR_DELTAS: Record<Direction, { x: number; y: number }> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 }
};

// Canvas rendering constants
export const MIN_CELL = 12;
export const MAX_CELL = 128;
export const PADDING_RATIO = 0.25;
export const DEFAULT_CELL_SIZE = 48;
export const DEFAULT_PADDING = 12;

// Icon sizes
export const GAME_ICON_SIZE = 42;
export const GAME_ICON_SIZE_VERTICAL = 24;

// Animation timing
export const WALK_FRAME_INTERVAL_MS = 120;
export const IDLE_FRAME_INTERVAL_MS = 400;
export const OBSTACLE_FRAME_INTERVAL_MS = 500;
export const GOAL_FRAME_INTERVAL_MS = 400;

// Default colors
export const DEFAULT_GAME_COLOR = "#4C97FF";
export const DEFAULT_WALL_COLOR = "#8B7355";
export const DEFAULT_GRID_COLOR = "#E5E7EB";
export const GOAL_COLOR = "#10B981";
