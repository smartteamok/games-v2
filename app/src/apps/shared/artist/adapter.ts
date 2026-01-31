/**
 * Runtime adapter for Artist (turtle graphics) games.
 */

import type { RuntimeAdapter } from "../../types";
import type { ArtistState, ArtistLevel } from "./types";
import {
  moveForward,
  turnLeft,
  turnRight,
  penUp,
  penDown,
  setColor,
  setWidth,
  makeInitialState,
  validateDrawing,
  getLevel
} from "./logic";

const MOVE_ANIMATION_MS = 200;

export type ArtistAdapterContext = {
  levels: ArtistLevel[];
  onDraw: (state: ArtistState) => void;
  onLineDrawn?: (fromX: number, fromY: number, toX: number, toY: number) => void;
};

/**
 * Create a runtime adapter for an artist game.
 */
export const createArtistAdapter = (ctx: ArtistAdapterContext): RuntimeAdapter<ArtistState> => {
  const { levels, onDraw, onLineDrawn } = ctx;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  return {
    applyOp: async (op, state) => {
      if (state.status === "complete" || state.status === "error") {
        return state;
      }

      switch (op.kind) {
        case "move": {
          const distance = op.steps * 10; // Convert steps to pixels
          const { line } = moveForward(state, distance);
          if (line && onLineDrawn) {
            onLineDrawn(line.from.x, line.from.y, line.to.x, line.to.y);
          }
          onDraw(state);
          await sleep(MOVE_ANIMATION_MS);
          break;
        }

        case "turn": {
          const degrees = op.degrees ?? 90;
          if (op.direction === "left") {
            turnLeft(state, degrees);
          } else {
            turnRight(state, degrees);
          }
          onDraw(state);
          await sleep(50);
          break;
        }

        case "pen": {
          if (op.down) {
            penDown(state);
          } else {
            penUp(state);
          }
          onDraw(state);
          break;
        }

        case "color": {
          setColor(state, op.value);
          onDraw(state);
          break;
        }

        case "width": {
          setWidth(state, op.value);
          onDraw(state);
          break;
        }

        case "wait": {
          await sleep(op.ms);
          break;
        }

        default:
          // Ignore unsupported operations
          break;
      }

      return state;
    },

    reset: (state) => {
      const completedLevels = state.completedLevels ?? [];
      const newState = makeInitialState(levels, state.levelId, completedLevels);
      Object.assign(state, newState);
      onDraw(state);
      return state;
    }
  };
};

/**
 * Check if drawing matches target.
 */
export const createArtistCheckConstraints = (levels: ArtistLevel[]) => (
  workspace: unknown,
  state: ArtistState
): { ok: true } | { ok: false; message: string } => {
  const level = getLevel(levels, state.levelId);
  const constraints = level.constraints;

  if (!constraints) {
    return { ok: true };
  }

  // Check block count
  if (constraints.maxBlocks !== undefined) {
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

    if (blockTypes.length > constraints.maxBlocks) {
      return { ok: false, message: `Usá máximo ${constraints.maxBlocks} bloques.` };
    }
  }

  // Check target shape if defined
  if (level.targetLines && level.targetLines.length > 0) {
    if (!validateDrawing(state.lines, level.targetLines)) {
      return { ok: false, message: "El dibujo no coincide con el objetivo." };
    }
  }

  return { ok: true };
};
