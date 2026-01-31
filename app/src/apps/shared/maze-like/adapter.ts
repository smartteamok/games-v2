/**
 * Runtime adapter for maze-like games.
 */

import type { RuntimeAdapter } from "../../types";
import type { MazeLevel, MazeState } from "./types";
import { turnLeft, turnRight, isBlocked, inBounds, getLevel, makeInitialState, getDelta } from "./logic";
import { animateMoveAsync, animateTurnAsync } from "../../../apps/maze/animation";
import type { AnimationRenderState } from "./renderer";

export type MazeAdapterContext = {
  levels: MazeLevel[];
  animationState: { current: AnimationRenderState };
  onDraw: (state: MazeState) => void;
  onAnimationStateChange: (animState: AnimationRenderState) => void;
};

/**
 * Create a runtime adapter for a maze-like game.
 */
export function createMazeAdapter(ctx: MazeAdapterContext): RuntimeAdapter<MazeState> {
  const { levels, animationState, onDraw, onAnimationStateChange } = ctx;

  return {
    applyOp: async (op, state) => {
      const level = getLevel(levels, state.levelId);

      if (state.status === "win" || state.status === "error") {
        return state;
      }

      if (op.kind === "turn") {
        const newDir = op.direction === "left" ? turnLeft(state.player.dir) : turnRight(state.player.dir);
        const oldDir = state.player.dir;

        // Animate rotation
        await animateTurnAsync(oldDir, newDir, (_dir, progress) => {
          const newAnimState: AnimationRenderState = {
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

          // Validate before animating
          if (!inBounds(level, nextX, nextY) || isBlocked(level, nextX, nextY)) {
            state.status = "error";
            state.message = "¡Choque!";
            animationState.current = null;
            onAnimationStateChange(null);
            onDraw(state);
            throw new Error("CHOQUE");
          }

          // Animate movement
          await animateMoveAsync(
            state.player.x,
            state.player.y,
            nextX,
            nextY,
            (x, y) => {
              const newAnimState: AnimationRenderState = {
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

          // Check if won
          if (state.player.x === level.goal.x && state.player.y === level.goal.y) {
            const completedLevels = state.completedLevels ?? [];
            if (!completedLevels.includes(state.levelId)) {
              completedLevels.push(state.levelId);
              state.completedLevels = completedLevels;
            }

            const nextLevel = levels.find((l) => l.id === state.levelId + 1);
            state.status = "win";
            state.message = nextLevel
              ? `¡Llegaste! Avanzando al nivel ${nextLevel.id}...`
              : "¡Llegaste! ¡Completaste todos los niveles!";
            onDraw(state);
            throw new Error("WIN");
          }

          onDraw(state);
        }

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
      state.levelId = next.levelId;
      state.player = { ...next.player };
      state.status = next.status;
      state.message = next.message;
      state.completedLevels = completedLevels;
      state.visitedCells = next.visitedCells;
      onDraw(state);
      return state;
    }
  };
}

/**
 * Create a simplified adapter for games without complex animation state management.
 */
export function createSimpleMazeAdapter(
  levels: MazeLevel[],
  onDraw: (state: MazeState) => void
): RuntimeAdapter<MazeState> {
  const animationState = { current: null as AnimationRenderState };

  return createMazeAdapter({
    levels,
    animationState,
    onDraw,
    onAnimationStateChange: (anim) => {
      animationState.current = anim;
    }
  });
}
