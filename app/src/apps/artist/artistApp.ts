/**
 * Artist game - turtle graphics with drawing objectives.
 */

import type {
  AppDefinition,
  AppRenderContext,
  ConstraintResult,
  LevelInfo
} from "../types";
import { levels } from "./levels";
import type { ArtistLevel, ArtistState, ArtistUI } from "../shared/artist";
import {
  createArtistAdapter,
  createDefaultConfig,
  drawArtistCanvas,
  getLevel,
  makeInitialState,
  validateDrawing
} from "../shared/artist";
import { countBlocks, applyInitialBlocks as applyInitialBlocksShared } from "../shared/maze-like";
import { ensureSkillsPanel, createStagePlayButton, updateMobileLevelNav } from "../maze/ui";
import { ARTIST_COMPILE_OPTIONS, ARTIST_TOOLBOX_XML, registerArtistBlocks } from "./blocks";

const gameConfig = createDefaultConfig();

let ui: ArtistUI | null = null;

const getArtistLevel = (levelId: number): ArtistLevel => getLevel(levels, levelId);

const ensureUI = (rootEl: HTMLElement, ctx: AppRenderContext<ArtistState>): ArtistUI => {
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
    statusEl.className = "maze-status";
    const stagePlayButton = createStagePlayButton();
    rootEl.appendChild(stagePlayButton);

    const statusContainer = document.createElement("div");
    statusContainer.className = "maze-status-container";
    statusContainer.appendChild(statusEl);
    rootEl.appendChild(statusContainer);
  }

  container.appendChild(canvas);
  rootEl.appendChild(container);

  ensureSkillsPanel();

  (rootEl as any).__renderContext = ctx;

  ui = {
    rootEl,
    container,
    canvas,
    ctx: canvasCtx,
    statusEl,
    progressBar
  };

  updateProgressBar(ctx.getState?.() as ArtistState | undefined);
  return ui;
};

const updateProgressBar = (state?: ArtistState): void => {
  if (!ui?.progressBar) return;
  const progressBar = ui.progressBar;

  const currentLevelId = state?.levelId ?? 1;
  const completedLevels = state?.completedLevels ?? [];

  progressBar.innerHTML = "";

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
      const ctx = (ui?.rootEl as any).__renderContext as AppRenderContext<ArtistState> | undefined;
      if (ctx) {
        const nextState = makeInitialState(levels, level.id, completedLevels);
        ctx.updateState(nextState);
        ctx.setStatus(`Nivel ${level.id} listo`);
      }
    });

    progressBar.appendChild(levelBtn);
  }

  updateMobileLevelNav(
    currentLevelId,
    levels.length,
    completedLevels,
    (levelId: number) => {
      const ctx = (ui?.rootEl as any).__renderContext as AppRenderContext<ArtistState> | undefined;
      if (ctx) {
        const nextState = makeInitialState(levels, levelId, completedLevels);
        ctx.updateState(nextState);
        ctx.setStatus(`Nivel ${levelId} listo`);
      }
    }
  );
};

const drawArtist = (state: ArtistState): void => {
  if (!ui) return;

  const level = getArtistLevel(state.levelId);
  const config = {
    ...gameConfig,
    canvasWidth: level.width,
    canvasHeight: level.height
  };

  drawArtistCanvas(ui, state, config);
};

const markCompleteIfMatches = (state: ArtistState): void => {
  if (state.status === "complete") return;
  const level = getArtistLevel(state.levelId);
  if (!level.targetLines || level.targetLines.length === 0) return;

  if (!validateDrawing(state.lines, level.targetLines)) {
    return;
  }

  const completedLevels = state.completedLevels ?? [];
  if (!completedLevels.includes(level.id)) {
    completedLevels.push(level.id);
    state.completedLevels = completedLevels;
  }

  const nextLevel = levels.find((l) => l.id === level.id + 1);
  state.status = "complete";
  state.message = nextLevel
    ? `Dibujo listo. Avanzando al nivel ${nextLevel.id}...`
    : "Dibujo listo. Completaste todos los niveles.";

  drawArtist(state);
  throw new Error("WIN");
};

const adapterBase = createArtistAdapter({
  levels,
  onDraw: drawArtist
});

const adapter = {
  applyOp: async (op: any, state: ArtistState) => {
    const next = await adapterBase.applyOp(op, state);
    markCompleteIfMatches(next);
    return next;
  },
  reset: (state: ArtistState) => adapterBase.reset(state)
};

const checkConstraints = (workspace: unknown, state: ArtistState): ConstraintResult => {
  const level = getArtistLevel(state.levelId);
  const maxBlocks = level.constraints?.maxBlocks ?? level.blockLimit;
  if (maxBlocks === undefined) {
    return { ok: true };
  }

  const total = countBlocks(workspace);
  if (total > maxBlocks) {
    return { ok: false, message: `Usa maximo ${maxBlocks} bloques.` };
  }

  return { ok: true };
};

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
  createInitialState: () => makeInitialState(levels, 1, []),
  render: (rootEl, state, ctx) => {
    const level = getArtistLevel(state.levelId);
    if (level.id !== state.levelId) {
      const completedLevels = state.completedLevels ?? [];
      ctx.updateState(makeInitialState(levels, level.id, completedLevels));
      return;
    }
    ensureUI(rootEl, ctx);
    updateProgressBar(state);
    drawArtist(state);
  },
  adapter,
  compileOptions: ARTIST_COMPILE_OPTIONS,
  checkConstraints,
  getLevel: getArtistLevel,
  applyInitialBlocks: (Blockly, workspace, level, blockType) =>
    applyInitialBlocksShared(Blockly, workspace, level as any, blockType),
  serializeState: (state) => ({
    levelId: state.levelId,
    completedLevels: state.completedLevels ?? []
  }),
  deserializeState: (raw) => {
    if (!raw || typeof raw !== "object") {
      return makeInitialState(levels, 1, []);
    }
    const record = raw as Partial<ArtistState>;
    const level = getArtistLevel(record.levelId ?? 1);
    const completedLevels = Array.isArray(record.completedLevels) ? record.completedLevels : [];
    const state = makeInitialState(levels, level.id, completedLevels);
    state.completedLevels = completedLevels;
    return state;
  }
};
