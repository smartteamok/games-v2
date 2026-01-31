/**
 * Types for Collector/Harvester games.
 * Extension of maze-like games with collection mechanics.
 */

import type { Direction, MazeLevel } from "../maze-like/types";

export type { Direction };

export type CollectorStatus = "idle" | "running" | "win" | "error";

/** Item that can be collected */
export type CollectibleItem = {
  x: number;
  y: number;
  type: string;  // "nectar", "gem", "fruit", etc.
  quantity: number;
  collected?: boolean;
};

/** Cell that can be planted/watered */
export type FarmCell = {
  x: number;
  y: number;
  state: "empty" | "planted" | "growing" | "ready" | "harvested";
  needsWater?: boolean;
};

export type CollectorLevel = MazeLevel & {
  /** Items to collect */
  items: CollectibleItem[];
  /** Target collection count per type */
  targets?: Record<string, number>;
  /** Farm cells (for farmer variant) */
  farmCells?: FarmCell[];
  /** Initial inventory */
  initialInventory?: Record<string, number>;
};

export type CollectorState = {
  levelId: number;
  player: { x: number; y: number; dir: Direction };
  status: CollectorStatus;
  message?: string;
  completedLevels?: number[];
  visitedCells?: Array<{ x: number; y: number }>;
  // Collection state
  inventory: Record<string, number>;  // Collected items by type
  items: CollectibleItem[];           // Remaining items on grid
  farmCells?: FarmCell[];             // Farm cell states
};

export type CollectorUI = {
  rootEl: HTMLElement;
  container: HTMLElement;
  progressBar: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  statusEl: HTMLDivElement;
  inventoryEl?: HTMLDivElement;
};

export type CollectorGameConfig = {
  gameColor: string;
  itemSprites?: Record<string, string>; // type -> sprite URL
  playerSprite?: string;
  showInventory?: boolean;
};

/** Conditions for while/if blocks */
export type CollectorCondition =
  | { type: "hasItem" }      // There's an item at current position
  | { type: "hasItemType"; itemType: string }
  | { type: "inventoryFull" }
  | { type: "atGoal" }
  | { type: "pathAhead" }
  | { type: "pathLeft" }
  | { type: "pathRight" }
  // Farmer-specific
  | { type: "hasHole" }
  | { type: "hasPlant" }
  | { type: "needsWater" }
  | { type: "isReady" };
