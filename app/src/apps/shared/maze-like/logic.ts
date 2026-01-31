/**
 * Shared game logic for maze-like games.
 */

import type { Direction, MazeLevel, MazeState } from "./types";
import { DIR_ORDER, DIR_DELTAS } from "./constants";

export { DIR_ORDER, DIR_DELTAS };

/**
 * Turn left from current direction.
 */
export const turnLeft = (dir: Direction): Direction => {
  const index = DIR_ORDER.indexOf(dir);
  return DIR_ORDER[(index + 3) % DIR_ORDER.length];
};

/**
 * Turn right from current direction.
 */
export const turnRight = (dir: Direction): Direction => {
  const index = DIR_ORDER.indexOf(dir);
  return DIR_ORDER[(index + 1) % DIR_ORDER.length];
};

/**
 * Check if a position is blocked by a wall.
 */
export const isBlocked = (level: MazeLevel, x: number, y: number): boolean =>
  level.walls.some((wall) => wall.x === x && wall.y === y);

/**
 * Check if a position is within the grid bounds.
 */
export const inBounds = (level: MazeLevel, x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < level.gridW && y < level.gridH;

/**
 * Get delta for a direction.
 */
export const getDelta = (dir: Direction): { x: number; y: number } => DIR_DELTAS[dir];

/**
 * Get a level by ID from a list of levels.
 */
export const getLevel = (levels: MazeLevel[], levelId: number): MazeLevel =>
  levels.find((level) => level.id === levelId) ?? levels[0];

/**
 * Create initial state for a level.
 */
export const makeInitialState = (
  levels: MazeLevel[],
  levelId: number,
  completedLevels: number[] = []
): MazeState => {
  const level = getLevel(levels, levelId);
  return {
    levelId: level.id,
    player: { ...level.start },
    status: "idle",
    message: undefined,
    completedLevels,
    visitedCells: [{ x: level.start.x, y: level.start.y }]
  };
};

/**
 * Update status text based on state.
 */
export const getStatusText = (state: MazeState): string => {
  if (state.message) {
    return state.message;
  }
  switch (state.status) {
    case "running":
      return "Jugando...";
    case "win":
      return "¡Llegaste!";
    case "error":
      return "¡Choque!";
    default:
      return "Listo.";
  }
};

/**
 * Count blocks in workspace (excluding start and shadow blocks).
 */
export const countBlocks = (workspace: unknown): number => {
  const ws = workspace as { getAllBlocks?: () => Array<{ type: string; isShadow?: () => boolean }> };
  if (!ws?.getAllBlocks) return 0;

  const allBlocks = ws.getAllBlocks();
  let count = 0;

  for (const block of allBlocks) {
    // Excluir bloques de inicio
    if (block.type === "event_inicio" || block.type === "event_whenflagclicked") {
      continue;
    }
    // Excluir shadow blocks
    if (block.isShadow?.()) {
      continue;
    }
    // Excluir bloques math_
    if (block.type?.startsWith("math_")) {
      continue;
    }
    count += 1;
  }

  return count;
};

/**
 * Apply initial blocks from level to workspace.
 */
export const applyInitialBlocks = (
  Blockly: any,
  workspace: any,
  level: MazeLevel,
  blockType: "horizontal" | "vertical"
): void => {
  const xmlStr = blockType === "vertical" ? level.initialBlocksVertical : level.initialBlocks;
  if (!xmlStr || !xmlStr.trim()) return;

  const Xml = Blockly.Xml;
  if (!Xml?.textToDom || !Xml?.domToWorkspace) return;

  const startType = "event_inicio";
  let dom: Element;
  try {
    dom = Xml.textToDom(xmlStr.trim().startsWith("<") ? xmlStr : `<xml>${xmlStr}</xml>`);
  } catch {
    return;
  }

  const topBefore = new Set((workspace.getTopBlocks?.(true) ?? []).map((b: any) => b.id));
  const prevDisabled = (Blockly.Events as any)?.disabled;

  try {
    if ((Blockly.Events as any)?.disable) (Blockly.Events as any).disable();
    Xml.domToWorkspace(dom, workspace);
  } finally {
    if (!prevDisabled && (Blockly.Events as any)?.enable) (Blockly.Events as any).enable();
  }

  const topAfter = workspace.getTopBlocks?.(true) ?? [];
  const startBlock = topAfter.find((b: any) => b.type === startType);
  const added = topAfter.filter((b: any) => !topBefore.has(b.id));
  const first = added[0];

  if (startBlock?.nextConnection && first?.previousConnection) {
    try {
      startBlock.nextConnection.connect(first.previousConnection);
    } catch {
      /* ignore connection errors */
    }
  }
};
