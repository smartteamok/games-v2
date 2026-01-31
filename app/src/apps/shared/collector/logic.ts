/**
 * Game logic for Collector/Harvester games.
 * Extends maze-like logic with collection mechanics.
 */

import type {
  CollectorState,
  CollectorLevel,
  CollectibleItem,
  FarmCell,
  CollectorCondition
} from "./types";
import {
  turnLeft as mazeTurnLeft,
  turnRight as mazeTurnRight,
  isBlocked as mazeIsBlocked,
  inBounds as mazeInBounds,
  getDelta,
  DIR_ORDER
} from "../maze-like/logic";

export { DIR_ORDER, getDelta };

// Re-export maze helpers
export const turnLeft = mazeTurnLeft;
export const turnRight = mazeTurnRight;
export const isBlocked = mazeIsBlocked;
export const inBounds = mazeInBounds;

/**
 * Get level by ID.
 */
export const getLevel = (levels: CollectorLevel[], levelId: number): CollectorLevel =>
  levels.find((l) => l.id === levelId) ?? levels[0];

/**
 * Create initial state for a level.
 */
export const makeInitialState = (
  levels: CollectorLevel[],
  levelId: number,
  completedLevels: number[] = []
): CollectorState => {
  const level = getLevel(levels, levelId);
  return {
    levelId: level.id,
    player: { ...level.start },
    status: "idle",
    message: undefined,
    completedLevels,
    visitedCells: [{ x: level.start.x, y: level.start.y }],
    inventory: { ...(level.initialInventory ?? {}) },
    items: level.items.map((item) => ({ ...item, collected: false })),
    farmCells: level.farmCells?.map((cell) => ({ ...cell }))
  };
};

/**
 * Get item at position.
 */
export const getItemAt = (
  items: CollectibleItem[],
  x: number,
  y: number
): CollectibleItem | undefined =>
  items.find((item) => item.x === x && item.y === y && !item.collected && item.quantity > 0);

/**
 * Get farm cell at position.
 */
export const getFarmCellAt = (
  farmCells: FarmCell[] | undefined,
  x: number,
  y: number
): FarmCell | undefined =>
  farmCells?.find((cell) => cell.x === x && cell.y === y);

/**
 * Collect item at current position.
 */
export const collectItem = (state: CollectorState): { collected: boolean; item?: CollectibleItem } => {
  const { player, items, inventory } = state;
  const item = getItemAt(items, player.x, player.y);

  if (!item || item.quantity <= 0) {
    return { collected: false };
  }

  // Decrease item quantity
  item.quantity -= 1;
  if (item.quantity <= 0) {
    item.collected = true;
  }

  // Add to inventory
  inventory[item.type] = (inventory[item.type] ?? 0) + 1;

  return { collected: true, item };
};

/**
 * Plant at current position (farmer variant).
 */
export const plantSeed = (state: CollectorState): boolean => {
  const { player, farmCells } = state;
  if (!farmCells) return false;

  const cell = getFarmCellAt(farmCells, player.x, player.y);
  if (!cell || cell.state !== "empty") return false;

  cell.state = "planted";
  cell.needsWater = true;
  return true;
};

/**
 * Water plant at current position.
 */
export const waterPlant = (state: CollectorState): boolean => {
  const { player, farmCells } = state;
  if (!farmCells) return false;

  const cell = getFarmCellAt(farmCells, player.x, player.y);
  if (!cell || !cell.needsWater) return false;

  cell.needsWater = false;
  if (cell.state === "planted") {
    cell.state = "growing";
  } else if (cell.state === "growing") {
    cell.state = "ready";
  }
  return true;
};

/**
 * Harvest at current position.
 */
export const harvestPlant = (state: CollectorState): boolean => {
  const { player, farmCells, inventory } = state;
  if (!farmCells) return false;

  const cell = getFarmCellAt(farmCells, player.x, player.y);
  if (!cell || cell.state !== "ready") return false;

  cell.state = "harvested";
  inventory["harvest"] = (inventory["harvest"] ?? 0) + 1;
  return true;
};

/**
 * Check if all targets are met.
 */
export const checkTargetsMet = (
  inventory: Record<string, number>,
  targets: Record<string, number> | undefined
): boolean => {
  if (!targets) return true;

  for (const [type, required] of Object.entries(targets)) {
    if ((inventory[type] ?? 0) < required) {
      return false;
    }
  }
  return true;
};

/**
 * Check if all items are collected.
 */
export const checkAllItemsCollected = (items: CollectibleItem[]): boolean =>
  items.every((item) => item.collected || item.quantity <= 0);

/**
 * Evaluate a condition.
 */
export const evaluateCondition = (
  condition: CollectorCondition,
  state: CollectorState,
  level: CollectorLevel
): boolean => {
  const { player, items, farmCells } = state;

  switch (condition.type) {
    case "hasItem":
      return getItemAt(items, player.x, player.y) !== undefined;

    case "hasItemType":
      const item = getItemAt(items, player.x, player.y);
      return item !== undefined && item.type === condition.itemType;

    case "inventoryFull":
      // Could implement max inventory logic
      return false;

    case "atGoal":
      return player.x === level.goal.x && player.y === level.goal.y;

    case "pathAhead": {
      const delta = getDelta(player.dir);
      const nextX = player.x + delta.x;
      const nextY = player.y + delta.y;
      return inBounds(level, nextX, nextY) && !isBlocked(level, nextX, nextY);
    }

    case "pathLeft": {
      const leftDir = turnLeft(player.dir);
      const delta = getDelta(leftDir);
      const nextX = player.x + delta.x;
      const nextY = player.y + delta.y;
      return inBounds(level, nextX, nextY) && !isBlocked(level, nextX, nextY);
    }

    case "pathRight": {
      const rightDir = turnRight(player.dir);
      const delta = getDelta(rightDir);
      const nextX = player.x + delta.x;
      const nextY = player.y + delta.y;
      return inBounds(level, nextX, nextY) && !isBlocked(level, nextX, nextY);
    }

    case "hasHole": {
      const cell = getFarmCellAt(farmCells, player.x, player.y);
      return cell?.state === "empty";
    }

    case "hasPlant": {
      const cell = getFarmCellAt(farmCells, player.x, player.y);
      return cell !== undefined && cell.state !== "empty" && cell.state !== "harvested";
    }

    case "needsWater": {
      const cell = getFarmCellAt(farmCells, player.x, player.y);
      return cell?.needsWater === true;
    }

    case "isReady": {
      const cell = getFarmCellAt(farmCells, player.x, player.y);
      return cell?.state === "ready";
    }

    default:
      return false;
  }
};

/**
 * Get status text.
 */
export const getStatusText = (state: CollectorState): string => {
  if (state.message) return state.message;
  switch (state.status) {
    case "running":
      return "Recolectando...";
    case "win":
      return "¡Completado!";
    case "error":
      return "¡Choque!";
    default:
      return "Listo.";
  }
};

/**
 * Format inventory for display.
 */
export const formatInventory = (inventory: Record<string, number>): string => {
  const entries = Object.entries(inventory).filter(([_, count]) => count > 0);
  if (entries.length === 0) return "Vacío";
  return entries.map(([type, count]) => `${type}: ${count}`).join(", ");
};
