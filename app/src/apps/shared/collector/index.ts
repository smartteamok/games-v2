/**
 * Shared Collector/Harvester module.
 */

// Types
export * from "./types";

// Logic
export {
  DIR_ORDER,
  getDelta,
  turnLeft,
  turnRight,
  isBlocked,
  inBounds,
  getLevel,
  makeInitialState,
  getItemAt,
  getFarmCellAt,
  collectItem,
  plantSeed,
  waterPlant,
  harvestPlant,
  checkTargetsMet,
  checkAllItemsCollected,
  evaluateCondition,
  getStatusText,
  formatInventory
} from "./logic";

// Adapter
export {
  createCollectorAdapter,
  type CollectorAdapterContext
} from "./adapter";
