/**
 * Artist game - turtle graphics drawing game.
 */

import type {
  AppDefinition,
  AppRenderContext,
  ConstraintResult,
  LevelInfo,
  RuntimeAdapter
} from "../types";
import { levels } from "./levels";
import type { ArtistLevel } from "./levels";
import { registerArtistBlocks, ARTIST_TOOLBOX_XML, ARTIST_COMPILE_OPTIONS } from "./blocks";
import {
  type ArtistState,
  type ArtistUI,
  type ArtistGameConfig,
  makeInitialState as sharedMakeInitialState,
  getLevel as sharedGetLevel,
  getStatusText,
  moveForward,
  turnLeft,
  turnRight,
  penUp,
  penDown,
  setColor,
  setWidth
} from "../shared/artist";
import { drawArtistCanvas, createDefaultConfig } from "../shared/artist/renderer";

// Re-exports
export { registerArtistBlocks, ARTIST_TOOLBOX_XML } from "./blocks";
export type { ArtistState } from "../shared/artist";
export type BlockType = "horizontal" | "vertical";

const ARTIST_COLOR = "#9966FF";
const ANIMATION_DELAY = 150;

const gameConfig: ArtistGameConfig = {
  ...createDefaultConfig(),
  turtleColor: ARTIST_COLOR
};

// UI state
let ui: ArtistUI | null = null;
let resizeObserver: ResizeObserver | null = null;

// Wrapper functions
export const getLevel = (levelId: number): ArtistLevel =>
  sharedGetLevel(levels, levelId);

export const makeInitialState = (levelId: number, completedLevels: number[] = []): ArtistState =>
  sharedMakeInitialState(levels, levelId, completedLevels);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ensureUI = (rootEl: HTMLElement, ctx: AppRenderContext<ArtistState>): ArtistUI => {
  if (ui && ui.rootEl === rootEl && rootEl.contains(ui.container)) {
    return ui;
  }
  rootEl.innerHTML = "";

  const isVertical = document.querySelector(".layout-vertical") !== null;

  const container = document.createElement("div");
  container.className = "artist-stage";

  const progressBar = document.createElement("div");
  progressBar.className = "artist-progress-bar";
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-label", "Niveles del juego");

  const levelBarContainer = document.getElementById("level-bar");
  if (levelBarContainer) {
    levelBarContainer.innerHTML = "";
    levelBarContainer.appendChild(progressBar);
  }

  const canvas = document.createElement("canvas");
  canvas.className = "artist-canvas";
  canvas.width = gameConfig.canvasWidth;
  canvas.height = gameConfig.canvasHeight;
  const canvasCtx = canvas.getContext("2d");
  if (!canvasCtx) {
    throw new Error("No se pudo crear el canvas del artista.");
  }

  let statusEl: HTMLDivElement;

  if (isVertical) {
    statusEl = document.getElementById("status-vertical") as HTMLDivElement;
    if (!statusEl) {
      statusEl = document.createElement("div");
      statusEl.className = "status-vertical";
      statusEl.id = "status-vertical";
    }
  } else {
    statusEl = document.createElement("div");
    statusEl.className = "artist-status";
    
    const statusContainer = document.createElement("div");
    statusContainer.className = "artist-status-container";
    statusContainer.appendChild(statusEl);
    rootEl.appendChild(statusContainer);
  }

  container.appendChild(canvas);
  rootEl.appendChild(container);

  (rootEl as any).__renderContext = ctx;

  const artistUI: ArtistUI = {
    rootEl,
    container,
    canvas,
    ctx: canvasCtx,
    statusEl,
    progressBar
  };
  ui = artistUI;

  updateProgressBar(ctx.getState?.() as ArtistState | undefined);

  // Resize observer for canvas scaling
  const gameStage = document.getElementById("game-stage");
  if (gameStage) {
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => {
      const state = (rootEl as any).__renderContext?.getState?.() as ArtistState | undefined;
      if (state && ui) {
        drawArtist(state);
      }
    });
    resizeObserver.observe(gameStage);
  }

  if (statusEl) {
    const state = ctx.getState?.() as ArtistState | undefined;
    statusEl.textContent = state ? getStatusText(state) : "Listo para dibujar.";
  }

  return artistUI;
};

export const updateProgressBar = (state?: ArtistState): void => {
  if (!ui || !ui.progressBar) return;

  const currentLevelId = state?.levelId ?? 1;
  const completedLevels = state?.completedLevels ?? [];

  ui.progressBar.innerHTML = "";

  for (const level of levels) {
    const levelBtn = document.createElement("button");
    levelBtn.className = "artist-progress-level";
    levelBtn.type = "button";
    levelBtn.setAttribute("data-level-id", String(level.id));

    const isCompleted = completedLevels.includes(level.id);
    const isCurrent = level.id === currentLevelId;
    const isLocked = level.id > 1 && !completedLevels.includes(level.id - 1);

    if (isCompleted) {
      levelBtn.classList.add("artist-progress-level--completed");
      levelBtn.innerHTML = `<span class="artist-progress-level-icon">✓</span><span class="artist-progress-level-number">${level.id}</span>`;
      levelBtn.setAttribute("title", `${level.id}. ${level.title} - Completado`);
    } else if (isCurrent) {
      levelBtn.classList.add("artist-progress-level--current");
      levelBtn.innerHTML = `<span class="artist-progress-level-number">${level.id}</span>`;
      levelBtn.setAttribute("title", `${level.id}. ${level.title} - Actual`);
    } else if (isLocked) {
      levelBtn.classList.add("artist-progress-level--locked");
      levelBtn.innerHTML = `<span class="artist-progress-level-icon">🔒</span>`;
      levelBtn.disabled = true;
      levelBtn.setAttribute("title", "Nivel bloqueado");
    } else {
      levelBtn.innerHTML = `<span class="artist-progress-level-number">${level.id}</span>`;
      levelBtn.setAttribute("title", `${level.id}. ${level.title}`);
    }

    levelBtn.addEventListener("click", () => {
      if (levelBtn.disabled) return;
      const ctx = (ui?.rootEl as any).__renderContext as AppRenderContext<ArtistState> | undefined;
      if (ctx) {
        const nextState = makeInitialState(level.id, completedLevels);
        ctx.updateState(nextState);
        ctx.setStatus(`Nivel ${level.id}: ${level.title}`);
      }
    });

    ui.progressBar!.appendChild(levelBtn);
  }
};

export const drawArtist = (state: ArtistState): void => {
  if (!ui) return;
  drawArtistCanvas(ui, state, gameConfig);
};

export const adapter: RuntimeAdapter<ArtistState> = {
  applyOp: async (op, state) => {
    if (state.status === "complete" || state.status === "error") {
      return state;
    }

    switch (op.kind) {
      case "move": {
        // Convert steps to pixels (10 pixels per step)
        const distance = op.steps * 10;
        moveForward(state, distance);
        drawArtist(state);
        await sleep(ANIMATION_DELAY);
        break;
      }

      case "turn": {
        const degrees = op.degrees ?? 90;
        if (op.direction === "left") {
          turnLeft(state, degrees);
        } else {
          turnRight(state, degrees);
        }
        drawArtist(state);
        await sleep(50);
        break;
      }

      case "pen": {
        if (op.down) {
          penDown(state);
        } else {
          penUp(state);
        }
        drawArtist(state);
        break;
      }

      case "color": {
        setColor(state, op.value);
        drawArtist(state);
        break;
      }

      case "width": {
        setWidth(state, op.value);
        drawArtist(state);
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
    const newState = makeInitialState(state.levelId, completedLevels);
    Object.assign(state, newState);
    drawArtist(state);
    return state;
  }
};

export const createArtistCheckConstraints = (repeatBlockType: string) => (
  workspace: unknown,
  state: ArtistState
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

const checkConstraints = createArtistCheckConstraints("artist_repeat");

const levelInfos: LevelInfo[] = levels.map((l) => ({
  id: l.id,
  title: l.title,
  blockLimit: l.blockLimit
}));

export const artistApp: AppDefinition<ArtistState> = {
  id: "artist",
  title: "Artista",
  levels: levelInfos,
  toolboxXml: ARTIST_TOOLBOX_XML,
  registerBlocks: registerArtistBlocks,
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
    drawArtist(state);
  },
  adapter,
  compileOptions: ARTIST_COMPILE_OPTIONS,
  checkConstraints,
  serializeState: (state) => ({
    levelId: state.levelId,
    x: state.x,
    y: state.y,
    angle: state.angle,
    penDown: state.penDown,
    penColor: state.penColor,
    penWidth: state.penWidth,
    lines: state.lines,
    status: state.status,
    message: state.message,
    completedLevels: state.completedLevels ?? []
  }),
  deserializeState: (raw) => {
    if (!raw || typeof raw !== "object") {
      return makeInitialState(1, []);
    }
    const record = raw as Partial<ArtistState>;
    const level = getLevel(record.levelId ?? 1);
    const completedLevels = Array.isArray(record.completedLevels) ? record.completedLevels : [];
    const state = makeInitialState(level.id, completedLevels);
    state.status = "idle";
    state.message = record.message;
    return state;
  }
};
