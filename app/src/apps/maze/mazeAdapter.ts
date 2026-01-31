/**
 * RuntimeAdapter para el laberinto.
 */
import type { RuntimeAdapter, ConstraintResult } from "../types";
import { levels, type MazeLevel } from "./levels";
import type { MazeState } from "./mazeTypes";
import { DIR_DELTAS } from "./mazeTypes";
import { getLevel, makeInitialState, turnLeft, turnRight, isBlocked, inBounds } from "./mazeLogic";
import { drawMaze, setAnimationState } from "./mazeRenderer";
import { resetAnimationFrames } from "./mazeSprites";
import { animateMoveAsync, animateTurnAsync } from "./animation";

export const adapter: RuntimeAdapter<MazeState> = {
  applyOp: async (op, state) => {
    const level = getLevel(state.levelId);
    if (state.status === "win" || state.status === "error") {
      return state;
    }

    if (op.kind === "turn") {
      const newDir = op.direction === "left" ? turnLeft(state.player.dir) : turnRight(state.player.dir);
      const oldDir = state.player.dir;

      await animateTurnAsync(oldDir, newDir, (_dir, progress) => {
        setAnimationState({
          playerX: state.player.x,
          playerY: state.player.y,
          playerDir: progress < 0.5 ? oldDir : newDir,
          dirProgress: progress
        });
        drawMaze(state);
      });

      state.player.dir = newDir;
      setAnimationState(null);
      drawMaze(state);
      return state;
    }

    if (op.kind === "move") {
      const delta = DIR_DELTAS[state.player.dir];
      const steps = Math.abs(op.steps);
      const sign = op.steps >= 0 ? 1 : -1;

      for (let i = 0; i < steps; i += 1) {
        const nextX = state.player.x + delta.x * sign;
        const nextY = state.player.y + delta.y * sign;

        if (!inBounds(level, nextX, nextY) || isBlocked(level, nextX, nextY)) {
          state.status = "error";
          state.message = "¡Choque!";
          setAnimationState(null);
          drawMaze(state);
          throw new Error("CHOQUE");
        }

        await animateMoveAsync(
          state.player.x,
          state.player.y,
          nextX,
          nextY,
          (x, y) => {
            setAnimationState({
              playerX: x,
              playerY: y,
              playerDir: state.player.dir,
              dirProgress: 1
            });
            drawMaze(state);
          }
        );

        state.player.x = nextX;
        state.player.y = nextY;
        setAnimationState(null);

        if (!state.visitedCells) state.visitedCells = [];
        if (!state.visitedCells.some((c) => c.x === nextX && c.y === nextY)) {
          state.visitedCells.push({ x: nextX, y: nextY });
        }

        if (state.player.x === level.goal.x && state.player.y === level.goal.y) {
          const completedLevels = state.completedLevels ?? [];
          if (!completedLevels.includes(state.levelId)) {
            completedLevels.push(state.levelId);
            state.completedLevels = completedLevels;
          }

          const nextLevel = levels.find((l) => l.id === state.levelId + 1);
          state.status = "win";
          state.message = nextLevel ? `¡Llegaste! Avanzando al nivel ${nextLevel.id}...` : "¡Llegaste! ¡Completaste todos los niveles!";
          drawMaze(state);
          throw new Error("WIN");
        }

        drawMaze(state);
      }

      return state;
    }

    if (op.kind === "wait") {
      return state;
    }

    return state;
  },
  reset: (state) => {
    setAnimationState(null);
    resetAnimationFrames();
    const completedLevels = state.completedLevels ?? [];
    const next = makeInitialState(state.levelId, completedLevels);
    state.levelId = next.levelId;
    state.player = { ...next.player };
    state.status = next.status;
    state.message = next.message;
    state.completedLevels = completedLevels;
    state.visitedCells = next.visitedCells;
    drawMaze(state);
    return state;
  }
};

/** Factory para checkConstraints del laberinto */
export const createMazeCheckConstraints = (repeatBlockType: string) => (
  workspace: unknown,
  state: MazeState
): ConstraintResult => {
  const level = getLevel(state.levelId);
  const constraints = level.constraints;
  if (!constraints) {
    return { ok: true };
  }
  const workspaceBlocks = (workspace as { getAllBlocks?: (ordered: boolean) => { type: string }[] })
    .getAllBlocks?.(false) ?? [];
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

/**
 * Aplica bloques iniciales del nivel al workspace.
 */
export const applyInitialBlocks = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Blockly: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topBefore = new Set((workspace.getTopBlocks?.(true) ?? []).map((b: any) => b.id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevDisabled = (Blockly.Events as any)?.disabled;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((Blockly.Events as any)?.disable) (Blockly.Events as any).disable();
    Xml.domToWorkspace(dom, workspace);
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!prevDisabled && (Blockly.Events as any)?.enable) (Blockly.Events as any).enable();
  }
  const topAfter = workspace.getTopBlocks?.(true) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startBlock = topAfter.find((b: any) => b.type === startType);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
