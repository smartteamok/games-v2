/**
 * Maze game - the main horizontal maze game.
 */

import type {
  AppDefinition,
  AppRenderContext,
  ConstraintResult,
  LevelInfo,
  RuntimeAdapter
} from "../types";
import { levels } from "./levels";
import type { MazeLevel } from "./levels";
import { animateMoveAsync, animateTurnAsync } from "./animation";
import { registerMazeLikeBlocks, MAZE_LIKE_TOOLBOX_XML, MAZE_COMPILE_OPTIONS } from "./blocks";
import {
  ensureSkillsPanel,
  toggleSkillsPanel as togglePanel,
  createStagePlayButton,
  updateStagePlayButton as updateButton,
  updateBlockLimitCounter as updateCounter,
  updateMobileLevelNav
} from "./ui";
import {
  type MazeState,
  type MazeUI,
  type MazeGameConfig,
  type AnimationRenderState,
  type SpriteAnimationState,
  makeInitialState as sharedMakeInitialState,
  getLevel as sharedGetLevel,
  getStatusText,
  turnLeft,
  turnRight,
  isBlocked,
  inBounds,
  getDelta,
  applyInitialBlocks as sharedApplyInitialBlocks,
  initSprites,
  loadPlayerSprite,
  createAnimationState,
  drawMaze as sharedDrawMaze,
  DIR_ORDER
} from "../shared/maze-like";

// Re-exports for backward compatibility
export { registerMazeLikeBlocks, MAZE_LIKE_TOOLBOX_XML } from "./blocks";
export type { MazeState } from "../shared/maze-like";
export type BlockType = "horizontal" | "vertical";

const GAME_COLOR = "#4C97FF";

const gameConfig: MazeGameConfig = {
  gameColor: GAME_COLOR,
  useSprites: true
};

// UI and animation state
let ui: MazeUI | null = null;
let animationState: AnimationRenderState = null;
let spriteAnimState: SpriteAnimationState = createAnimationState();
let mazeContainerW = 0;
let mazeContainerH = 0;
let resizeObserver: ResizeObserver | null = null;

// Initialize sprites on module load
initSprites(levels);

// Wrapper functions for backward compatibility
export const getLevel = (levelId: number): MazeLevel =>
  sharedGetLevel(levels, levelId);

export const makeInitialState = (levelId: number, completedLevels: number[] = []): MazeState =>
  sharedMakeInitialState(levels, levelId, completedLevels);

export const applyInitialBlocks = (
  Blockly: any,
  workspace: any,
  level: MazeLevel,
  blockType: BlockType
): void => sharedApplyInitialBlocks(Blockly, workspace, level, blockType);

export const ensureUI = (rootEl: HTMLElement, ctx: AppRenderContext<MazeState>): MazeUI => {
  if (ui && ui.rootEl === rootEl && rootEl.contains(ui.container)) {
    return ui;
  }
  rootEl.innerHTML = "";

  const isVertical = document.querySelector(".layout-vertical") !== null;

  const container = document.createElement("div");
  container.className = "maze-stage";

  const progressBar = document.createElement("div");
  progressBar.className = "maze-progress-bar";
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-label", "Niveles del juego");

  const levelBarContainer = document.getElementById("level-bar");
  if (levelBarContainer) {
    levelBarContainer.innerHTML = "";
    levelBarContainer.appendChild(progressBar);
  }

  const canvas = document.createElement("canvas");
  canvas.className = "maze-canvas";
  const canvasCtx = canvas.getContext("2d");
  if (!canvasCtx) {
    throw new Error("No se pudo crear el canvas del laberinto.");
  }

  let statusEl: HTMLDivElement;
  let stagePlayButton: HTMLButtonElement | undefined;

  if (isVertical) {
    statusEl = document.getElementById("status-vertical") as HTMLDivElement;
    if (!statusEl) {
      statusEl = document.createElement("div");
      statusEl.className = "status-vertical";
      statusEl.id = "status-vertical";
    }
    stagePlayButton = document.getElementById("stage-play-btn-vertical") as HTMLButtonElement;
  } else {
    statusEl = document.createElement("div");
    statusEl.className = "maze-status";
    stagePlayButton = createStagePlayButton();
    rootEl.appendChild(stagePlayButton);

    const statusContainer = document.createElement("div");
    statusContainer.className = "maze-status-container";
    statusContainer.appendChild(statusEl);
    rootEl.appendChild(statusContainer);
  }

  container.appendChild(canvas);
  rootEl.appendChild(container);

  // Ensure skills panel exists
  const { panel: skillsPanel, overlay: skillsPanelOverlay } = ensureSkillsPanel();

  (rootEl as any).__renderContext = ctx;

  const mazeUI: MazeUI = {
    rootEl,
    container,
    progressBar,
    canvas,
    ctx: canvasCtx,
    statusEl,
    skillsPanel,
    skillsPanelOverlay,
    stagePlayButton
  };
  ui = mazeUI;
  updateProgressBar(ctx.getState?.() as MazeState | undefined);

  const gameStage = document.getElementById("game-stage");
  const scheduleRedraw = () => {
    if (!ui?.container || !document.contains(ui.container)) return;
    const state = (rootEl as any).__renderContext?.getState?.() as MazeState | undefined;
    if (state) drawMaze(state);
  };

  if (gameStage) {
    mazeContainerW = gameStage.clientWidth || gameStage.offsetWidth;
    mazeContainerH = gameStage.clientHeight || gameStage.offsetHeight;
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => {
      if (!gameStage) return;
      mazeContainerW = gameStage.clientWidth || gameStage.offsetWidth;
      mazeContainerH = gameStage.clientHeight || gameStage.offsetHeight;
      scheduleRedraw();
    });
    resizeObserver.observe(gameStage);
  }

  loadPlayerSprite(() => scheduleRedraw());

  if (statusEl) {
    const state = ctx.getState?.() as MazeState | undefined;
    statusEl.textContent = state ? getStatusText(state) : "Listo.";
  }

  return mazeUI;
};

// Re-export UI functions for backward compatibility
export const toggleSkillsPanel = togglePanel;
export const updateStagePlayButton = updateButton;

export const updateBlockLimitCounter = (workspace: unknown, levelId: number): void => {
  const level = getLevel(levelId);
  updateCounter(workspace, level);
};

export const updateInstructions = (): void => {
  // Maintained for compatibility
};

export const updateProgressBar = (state?: MazeState): void => {
  if (!ui) return;

  const currentLevelId = state?.levelId ?? 1;
  const completedLevels = state?.completedLevels ?? [];

  ui.progressBar.innerHTML = "";

  for (const level of levels) {
    const levelBtn = document.createElement("button");
    levelBtn.className = "maze-progress-level";
    levelBtn.type = "button";
    levelBtn.setAttribute("data-level-id", String(level.id));

    const isCompleted = completedLevels.includes(level.id);
    const isCurrent = level.id === currentLevelId;
    const isLocked = level.id > 1 && !completedLevels.includes(level.id - 1);

    if (isCompleted) {
      levelBtn.classList.add("maze-progress-level--completed");
      levelBtn.innerHTML = `<span class="maze-progress-level-icon">✓</span><span class="maze-progress-level-number">${level.id}</span>`;
      levelBtn.setAttribute("title", `${level.id}. ${level.title} - Completado`);
    } else if (isCurrent) {
      levelBtn.classList.add("maze-progress-level--current");
      levelBtn.innerHTML = `<span class="maze-progress-level-number">${level.id}</span>`;
      levelBtn.setAttribute("title", `${level.id}. ${level.title} - Actual`);
    } else if (isLocked) {
      levelBtn.classList.add("maze-progress-level--locked");
      levelBtn.innerHTML = `<span class="maze-progress-level-icon">🔒</span>`;
      levelBtn.disabled = true;
      levelBtn.setAttribute("title", "Nivel bloqueado");
    } else {
      levelBtn.innerHTML = `<span class="maze-progress-level-number">${level.id}</span>`;
      levelBtn.setAttribute("title", `${level.id}. ${level.title}`);
    }

    levelBtn.addEventListener("click", () => {
      if (levelBtn.disabled) return;
      const ctx = (ui?.rootEl as any).__renderContext as AppRenderContext<MazeState> | undefined;
      if (ctx) {
        const nextState = makeInitialState(level.id, completedLevels);
        ctx.updateState(nextState);
        ctx.setStatus(`Nivel ${level.id} listo`);
      }
    });

    ui.progressBar.appendChild(levelBtn);
  }

  // Update mobile level navigation
  updateMobileLevelNav(
    currentLevelId,
    levels.length,
    completedLevels,
    (levelId: number) => {
      const ctx = (ui?.rootEl as any).__renderContext as AppRenderContext<MazeState> | undefined;
      if (ctx) {
        const nextState = makeInitialState(levelId, completedLevels);
        ctx.updateState(nextState);
        ctx.setStatus(`Nivel ${levelId} listo`);
      }
    }
  );
};

export const drawMaze = (state: MazeState): void => {
  if (!ui) return;

  sharedDrawMaze(
    {
      canvas: ui.canvas,
      ctx: ui.ctx,
      statusEl: ui.statusEl,
      containerWidth: mazeContainerW,
      containerHeight: mazeContainerH
    },
    state,
    levels,
    gameConfig,
    animationState,
    spriteAnimState
  );
};

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
        animationState = {
          playerX: state.player.x,
          playerY: state.player.y,
          playerDir: progress < 0.5 ? oldDir : newDir,
          dirProgress: progress
        };
        drawMaze(state);
      });

      state.player.dir = newDir;
      animationState = null;
      drawMaze(state);
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
          animationState = null;
          drawMaze(state);
          throw new Error("CHOQUE");
        }

        await animateMoveAsync(
          state.player.x,
          state.player.y,
          nextX,
          nextY,
          (x, y) => {
            animationState = {
              playerX: x,
              playerY: y,
              playerDir: state.player.dir,
              dirProgress: 1
            };
            drawMaze(state);
          }
        );

        state.player.x = nextX;
        state.player.y = nextY;
        animationState = null;

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
          state.message = nextLevel
            ? `¡Llegaste! Avanzando al nivel ${nextLevel.id}...`
            : "¡Llegaste! ¡Completaste todos los niveles!";
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
    animationState = null;
    spriteAnimState = createAnimationState();
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

const checkConstraints = createMazeCheckConstraints("game_repeat");

const levelInfos: LevelInfo[] = levels.map((l) => ({
  id: l.id,
  title: l.title,
  blockLimit: l.blockLimit
}));

export const mazeApp: AppDefinition<MazeState> = {
  id: "maze",
  title: "Laberinto",
  levels: levelInfos,
  toolboxXml: MAZE_LIKE_TOOLBOX_XML,
  registerBlocks: registerMazeLikeBlocks,
  createInitialState: () => makeInitialState(1, []),
  render: (rootEl, state, ctx) => {
    const level = getLevel(state.levelId);
    if (level.id !== state.levelId) {
      const completedLevels = state.completedLevels ?? [];
      ctx.updateState(makeInitialState(level.id, completedLevels));
      return;
    }
    ensureUI(rootEl, ctx);
    updateProgressBar(state);
    drawMaze(state);
  },
  adapter,
  compileOptions: MAZE_COMPILE_OPTIONS,
  checkConstraints,
  getLevel,
  applyInitialBlocks: (Blockly, workspace, level, blockType) =>
    applyInitialBlocks(Blockly, workspace, level as MazeLevel, blockType),
  serializeState: (state) => ({
    levelId: state.levelId,
    player: state.player,
    status: state.status,
    message: state.message,
    completedLevels: state.completedLevels ?? []
  }),
  deserializeState: (raw) => {
    if (!raw || typeof raw !== "object") {
      return makeInitialState(1, []);
    }
    const record = raw as Partial<MazeState>;
    const level = getLevel(record.levelId ?? 1);
    const completedLevels = Array.isArray(record.completedLevels) ? record.completedLevels : [];
    const state = makeInitialState(level.id, completedLevels);
    if (record.player && typeof record.player.x === "number" && typeof record.player.y === "number") {
      state.player.x = record.player.x;
      state.player.y = record.player.y;
      if (record.player.dir && DIR_ORDER.includes(record.player.dir)) {
        state.player.dir = record.player.dir;
      }
    }
    state.status = "idle";
    state.message = record.message;
    state.completedLevels = completedLevels;
    return state;
  }
};
