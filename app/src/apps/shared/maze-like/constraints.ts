/**
 * Constraint checking for maze-like games.
 */

import type { ConstraintResult } from "../../types";
import type { MazeLevel, MazeState } from "./types";
import { getLevel } from "./logic";

/**
 * Create a constraint checker for a maze-like game.
 */
export function createMazeCheckConstraints(
  levels: MazeLevel[],
  repeatBlockType: string
) {
  return (workspace: unknown, state: MazeState): ConstraintResult => {
    const level = getLevel(levels, state.levelId);
    const constraints = level.constraints;

    if (!constraints) {
      return { ok: true };
    }

    const workspaceBlocks = (
      workspace as { getAllBlocks?: (ordered: boolean) => { type: string }[] }
    ).getAllBlocks?.(false) ?? [];

    const blockTypes = workspaceBlocks
      .map((block) => block.type)
      .filter(
        (type) =>
          !type.startsWith("dropdown_") &&
          !type.startsWith("math_") &&
          type !== "event_inicio" &&
          type !== "event_whenflagclicked"
      );

    if (constraints.maxBlocks !== undefined && blockTypes.length > constraints.maxBlocks) {
      return { ok: false, message: `Usá máximo ${constraints.maxBlocks} bloques.` };
    }

    if (constraints.mustUseRepeat) {
      const hasRepeat = blockTypes.some((type) => type === repeatBlockType);
      if (!hasRepeat) {
        return { ok: false, message: "Tenés que usar un bloque de repetir." };
      }
    }

    return { ok: true };
  };
}
