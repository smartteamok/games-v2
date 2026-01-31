/**
 * Runtime adapter for Collector/Harvester games.
 */

import type { RuntimeAdapter } from "../../types";
import type { CollectorState, CollectorLevel } from "./types";
import {
  getLevel,
  makeInitialState,
  turnLeft,
  turnRight,
  isBlocked,
  inBounds,
  getDelta,
  collectItem,
  plantSeed,
  waterPlant,
  harvestPlant,
  checkTargetsMet,
  checkAllItemsCollected
} from "./logic";
import { animateMoveAsync, animateTurnAsync } from "../../maze/animation";

export type CollectorAdapterContext = {
  levels: CollectorLevel[];
  animationState: { current: any };
  onDraw: (state: CollectorState) => void;
  onAnimationStateChange: (animState: any) => void;
  onCollect?: (itemType: string) => void;
};

/**
 * Create a runtime adapter for a collector game.
 */
export const createCollectorAdapter = (
  ctx: CollectorAdapterContext
): RuntimeAdapter<CollectorState> => {
  const { levels, animationState, onDraw, onAnimationStateChange, onCollect } = ctx;

  return {
    applyOp: async (op, state) => {
      const level = getLevel(levels, state.levelId);

      if (state.status === "win" || state.status === "error") {
        return state;
      }

      // Movement operations (same as maze)
      if (op.kind === "turn") {
        const newDir = op.direction === "left"
          ? turnLeft(state.player.dir)
          : turnRight(state.player.dir);
        const oldDir = state.player.dir;

        await animateTurnAsync(oldDir, newDir, (_dir, progress) => {
          const newAnimState = {
            playerX: state.player.x,
            playerY: state.player.y,
            playerDir: progress < 0.5 ? oldDir : newDir,
            dirProgress: progress
          };
          animationState.current = newAnimState;
          onAnimationStateChange(newAnimState);
          onDraw(state);
        });

        state.player.dir = newDir;
        animationState.current = null;
        onAnimationStateChange(null);
        onDraw(state);
        return state;
      }

      if (op.kind === "move") {
        const delta = getDelta(state.player.dir);
        const steps = Math.abs(op.steps);
        const sign = op.steps >= 0 ? 1 : -1;

        for (let i = 0; i < steps; i += 1) {
          const nextX = state.player.x + delta.x * sign;
          const nextY = state.player.y + delta.y * sign;

          if (!inBounds(level, nextX, nextY) || isBlocked(level, nextX, nextY)) {
            state.status = "error";
            state.message = "¡Choque!";
            animationState.current = null;
            onAnimationStateChange(null);
            onDraw(state);
            throw new Error("CHOQUE");
          }

          await animateMoveAsync(
            state.player.x,
            state.player.y,
            nextX,
            nextY,
            (x, y) => {
              const newAnimState = {
                playerX: x,
                playerY: y,
                playerDir: state.player.dir,
                dirProgress: 1
              };
              animationState.current = newAnimState;
              onAnimationStateChange(newAnimState);
              onDraw(state);
            }
          );

          state.player.x = nextX;
          state.player.y = nextY;
          animationState.current = null;
          onAnimationStateChange(null);

          // Track visited cell
          if (!state.visitedCells) state.visitedCells = [];
          if (!state.visitedCells.some((c) => c.x === nextX && c.y === nextY)) {
            state.visitedCells.push({ x: nextX, y: nextY });
          }

          onDraw(state);
        }

        return state;
      }

      // Collection operations
      if (op.kind === "collect") {
        const { collected, item } = collectItem(state);
        if (collected && item && onCollect) {
          onCollect(item.type);
        }
        onDraw(state);

        // Check win condition
        if (level.targets) {
          if (checkTargetsMet(state.inventory, level.targets)) {
            // Still need to reach goal
            if (state.player.x === level.goal.x && state.player.y === level.goal.y) {
              state.status = "win";
              state.message = "¡Recolectaste todo!";
              onDraw(state);
              throw new Error("WIN");
            }
          }
        } else if (checkAllItemsCollected(state.items)) {
          if (state.player.x === level.goal.x && state.player.y === level.goal.y) {
            state.status = "win";
            state.message = "¡Recolectaste todo!";
            onDraw(state);
            throw new Error("WIN");
          }
        }

        return state;
      }

      // Farmer operations
      if (op.kind === "plant") {
        plantSeed(state);
        onDraw(state);
        return state;
      }

      if (op.kind === "water") {
        waterPlant(state);
        onDraw(state);
        return state;
      }

      if (op.kind === "harvest") {
        harvestPlant(state);
        onDraw(state);
        return state;
      }

      if (op.kind === "wait") {
        return state;
      }

      return state;
    },

    reset: (state) => {
      animationState.current = null;
      onAnimationStateChange(null);
      const completedLevels = state.completedLevels ?? [];
      const next = makeInitialState(levels, state.levelId, completedLevels);
      Object.assign(state, next);
      onDraw(state);
      return state;
    }
  };
};
