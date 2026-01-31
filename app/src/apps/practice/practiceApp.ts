/**
 * Practice game - uses shared maze-like module.
 * A simpler maze with different levels and purple theme.
 */

import type { AppDefinition, AppRenderContext, LevelInfo } from "../types";
import { MAZE_LIKE_TOOLBOX_XML, registerMazeLikeBlocks } from "../maze/mazeApp";
import { practiceLevels } from "./levels";
import {
  type MazeState,
  type MazeUI,
  type MazeGameConfig,
  type AnimationRenderState,
  makeInitialState,
  getLevel,
  drawMazeSimple,
  createSimpleMazeAdapter
} from "../shared/maze-like";

const GAME_COLOR = "#9B59B6";

const gameConfig: MazeGameConfig = {
  gameColor: GAME_COLOR,
  useSprites: false,
  wallColor: "#7C3AED",
  gridColor: "#E9D5FF"
};

// UI state
let ui: MazeUI | null = null;
let animationState: AnimationRenderState = null;

const ensureUI = (rootEl: HTMLElement, ctx: AppRenderContext<MazeState>): MazeUI => {
  if (ui && ui.rootEl === rootEl && rootEl.contains(ui.container)) {
    return ui;
  }
  rootEl.innerHTML = "";

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
  if (!canvasCtx) throw new Error("No se pudo crear el canvas.");

  const statusEl = document.createElement("div");
  statusEl.className = "maze-status";

  container.appendChild(canvas);
  container.appendChild(statusEl);
  rootEl.appendChild(container);

  (rootEl as any).__renderContext = ctx;

  ui = { rootEl, container, progressBar, canvas, ctx: canvasCtx, statusEl };
  updateProgressBar(ctx.getState?.() as MazeState | undefined);
  return ui;
};

const updateProgressBar = (state?: MazeState): void => {
  if (!ui) return;

  const currentLevelId = state?.levelId ?? 1;
  const completedLevels = state?.completedLevels ?? [];

  ui.progressBar.innerHTML = "";

  for (const level of practiceLevels) {
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
        const nextState = makeInitialState(practiceLevels, level.id, completedLevels);
        ctx.updateState(nextState);
        ctx.setStatus(`Nivel ${level.id} listo`);
      }
    });

    ui.progressBar.appendChild(levelBtn);
  }
};

const drawMaze = (state: MazeState): void => {
  if (!ui) return;

  drawMazeSimple(
    {
      canvas: ui.canvas,
      ctx: ui.ctx,
      statusEl: ui.statusEl,
      containerWidth: 0,
      containerHeight: 0
    },
    state,
    practiceLevels,
    gameConfig,
    animationState
  );
};

// Create adapter using shared module
const adapter = createSimpleMazeAdapter(practiceLevels, drawMaze);

// Wrap adapter to manage animation state
const wrappedAdapter = {
  ...adapter,
  applyOp: async (op: any, state: MazeState) => {
    return adapter.applyOp(op, state);
  },
  reset: (state: MazeState) => {
    animationState = null;
    return adapter.reset(state);
  }
};

const levelInfos: LevelInfo[] = practiceLevels.map((l) => ({ id: l.id, title: l.title }));

export const practiceApp: AppDefinition<MazeState> = {
  id: "practice",
  title: "Práctica",
  levels: levelInfos,
  toolboxXml: MAZE_LIKE_TOOLBOX_XML,
  registerBlocks: registerMazeLikeBlocks,
  createInitialState: () => makeInitialState(practiceLevels, 1, []),
  render: (rootEl, state, ctx) => {
    const level = getLevel(practiceLevels, state.levelId);
    if (level.id !== state.levelId) {
      const completedLevels = state.completedLevels ?? [];
      ctx.updateState(makeInitialState(practiceLevels, level.id, completedLevels));
      return;
    }
    ensureUI(rootEl, ctx);
    updateProgressBar(state);
    drawMaze(state);
  },
  adapter: wrappedAdapter,
  compileOptions: {
    START_TYPES: ["event_inicio", "event_whenflagclicked"],
    MOVE_TYPES: ["game_move"],
    BACK_TYPES: ["game_back"],
    TURN_LEFT_TYPES: ["game_turn_left"],
    TURN_RIGHT_TYPES: ["game_turn_right"],
    REPEAT_TYPES: ["game_repeat"],
    WAIT_TYPES: ["game_wait"]
  },
  serializeState: (state) => ({
    levelId: state.levelId,
    player: state.player,
    status: state.status,
    message: state.message,
    completedLevels: state.completedLevels ?? []
  }),
  deserializeState: (raw) => {
    if (!raw || typeof raw !== "object") return makeInitialState(practiceLevels, 1, []);
    const record = raw as Partial<MazeState>;
    const level = getLevel(practiceLevels, record.levelId ?? 1);
    const completedLevels = Array.isArray(record.completedLevels) ? record.completedLevels : [];
    const state = makeInitialState(practiceLevels, level.id, completedLevels);
    const DIR_ORDER = ["N", "E", "S", "W"];
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
