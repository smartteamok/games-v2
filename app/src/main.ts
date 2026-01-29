// src/main.ts
import "./style.css";
import { createWorkspace, destroyWorkspace } from "./core/editor/workspace";
import { loadXmlTextIntoWorkspace } from "./core/editor/serialization";
import { compileWorkspaceToAst } from "./core/compiler/compile";
import { validateProgram } from "./core/compiler/validate";
import { runProgram, type RuntimeController } from "./core/runtime/runtime";
import { loadProject } from "./core/storage/projectStore";
import { apps, getAppById } from "./apps/registry";
import type { AppDefinition, AppRenderContext } from "./apps/types";
import { highlightBlock, clearBlockHighlight } from "./core/editor/blockHighlight";
import { toggleSkillsPanel, updateStagePlayButton, updateBlockLimitCounter } from "./apps/maze/mazeApp";
import { getRoute, onRouteChange, navigateToGame } from "./router";
import { mountLanding } from "./pages/landing";
import { getGameLayoutHtml, showComingSoon } from "./pages/gameView";

const BASE_URL = import.meta.env.BASE_URL;
const LAST_GAME_KEY = "game-blocks-last-game";
const BLOCKLY_BUNDLE_ATTR = "data-blockly-bundle";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

// Estado del juego (solo válido cuando la vista de juego está montada con un app playable)
let workspace: unknown = null;
let currentApp: AppDefinition<unknown> | null = null;
let appState: unknown = null;
let runtimeController: RuntimeController | null = null;

/** Tipo de Blockly actualmente cargado (horizontal o vertical). */
let loadedBlockType: "horizontal" | "vertical" | null = null;

const SCRIPTS_BY_TYPE = {
  horizontal: [
    "vendor/scratch-blocks/blockly_compressed_horizontal.js",
    "vendor/scratch-blocks/blocks_compressed.js",
    "vendor/scratch-blocks/blocks_compressed_horizontal.js",
    "vendor/scratch-blocks/msg/js/en.js"
  ],
  vertical: [
    "vendor/scratch-blocks/blockly_compressed_vertical.js",
    "vendor/scratch-blocks/blocks_compressed.js",
    "vendor/scratch-blocks/blocks_compressed_vertical.js",
    "vendor/scratch-blocks/msg/js/en.js"
  ]
} as const;

/**
 * Carga el bundle de Blockly (horizontal o vertical). Si ya está cargado el mismo tipo, resuelve de inmediato.
 * Si se pide otro tipo, reemplaza los scripts y recarga en secuencia.
 */
function loadBlocklyScripts(blockType: "horizontal" | "vertical"): Promise<void> {
  const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  if (loadedBlockType === blockType) {
    return Promise.resolve();
  }
  document.querySelectorAll(`script[${BLOCKLY_BUNDLE_ATTR}]`).forEach((el) => el.remove());
  loadedBlockType = null;
  (window as any).Blockly = undefined;

  const paths = SCRIPTS_BY_TYPE[blockType];
  function loadOne(index: number): Promise<void> {
    if (index >= paths.length) {
      loadedBlockType = blockType;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.setAttribute(BLOCKLY_BUNDLE_ATTR, blockType);
      script.src = base + paths[index];
      script.onload = () => loadOne(index + 1).then(resolve, reject);
      script.onerror = () => reject(new Error(`Error cargando Blockly: ${paths[index]}`));
      document.body.appendChild(script);
    });
  }
  return loadOne(0);
}

function getWorkspaceOpts(app: AppDefinition<unknown>) {
  const blockType = app.blockType ?? "horizontal";
  return {
    horizontalLayout: blockType === "horizontal",
    toolboxPosition: (blockType === "vertical" ? "start" : "end") as "start" | "end",
    mediaPath: `${BASE_URL}vendor/scratch-blocks/media/`,
    trashcan: true,
    scrollbars: true,
    fixedStartBlock: { type: "event_whenflagclicked", x: 40, y: 30 }
  };
}

function teardownGameView(): void {
  window.removeEventListener("blockly-workspace-changed", refreshBlockLimit);
  const blocklyDiv = document.getElementById("blocklyDiv");
  if (workspace && blocklyDiv) {
    destroyWorkspace(workspace, blocklyDiv);
  }
  workspace = null;
  currentApp = null;
  appState = null;
  runtimeController = null;
  const levelBar = document.getElementById("level-bar");
  if (levelBar) levelBar.innerHTML = "";
}

type StatusVariant = "normal" | "win" | "error";

function setStatus(text: string, variant: StatusVariant = "normal"): void {
  const update = (el: HTMLElement) => {
    el.textContent = text;
    el.classList.remove("status--win", "status--error");
    if (variant === "win") el.classList.add("status--win");
    else if (variant === "error") el.classList.add("status--error");
  };
  const mazeStatus = document.querySelector(".maze-status") as HTMLElement | null;
  if (mazeStatus) update(mazeStatus);
  const statusVertical = document.getElementById("status-vertical");
  if (statusVertical) update(statusVertical);
}

function getLevelIdFromState(state: unknown): number | undefined {
  if (typeof state === "object" && state !== null) {
    const s = state as { levelId?: number };
    return s.levelId;
  }
  return undefined;
}

function refreshBlockLimit(): void {
  const levelId = getLevelIdFromState(appState);
  if (levelId !== undefined && workspace) {
    updateBlockLimitCounter(workspace, levelId);
  }
}

function updateButtonStates(isRunning: boolean): void {
  updateStagePlayButton(isRunning ? "disabled" : "play");
}

function initGameView(gameId: string): void {
  const Blockly = (window as any).Blockly;
  if (!Blockly) {
    throw new Error("Blockly no está cargado. Revisá index.html y la carpeta public/vendor.");
  }

  const app = getAppById(gameId);
  if (!app) {
    showComingSoon(appRoot);
    return;
  }

  try {
    localStorage.setItem(LAST_GAME_KEY, gameId);
  } catch (_) {}

  const stageEl = document.getElementById("stage") as HTMLDivElement;
  const blocklyDiv = document.getElementById("blocklyDiv") as HTMLDivElement;
  const gameSelect = document.getElementById("game-select") as HTMLSelectElement;

  apps.forEach((a) => a.registerBlocks(Blockly));

  currentApp = app;
  workspace = createWorkspace(Blockly, blocklyDiv, app.toolboxXml, getWorkspaceOpts(app));
  appState = app.createInitialState();

  const project = loadProject(app.id);
  if (project && project.appId === app.id) {
    loadXmlTextIntoWorkspace(Blockly, workspace as { clear?: () => void }, project.workspaceXml);
    appState = app.deserializeState
      ? app.deserializeState(project.appState)
      : (project.appState as unknown);
    setStatus(`Cargado ${app.title} ✅`);
  } else {
    setStatus(`${app.title} listo`);
  }

  gameSelect.innerHTML = "";
  apps.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.title;
    if (a.levels?.length) opt.textContent += ` (${a.levels.length} niveles)`;
    gameSelect.appendChild(opt);
  });
  gameSelect.value = app.id;
  gameSelect.addEventListener("change", () => {
    navigateToGame(gameSelect.value);
  });

  const buildContext = (): AppRenderContext<unknown> => ({
    getWorkspace: () => workspace,
    setStatus,
    updateState: (nextState) => {
      appState = nextState;
      if (currentApp) currentApp.render(stageEl, appState, buildContext());
      refreshBlockLimit();
    },
    getState: () => appState
  });

  currentApp.render(stageEl, appState, buildContext());
  updateButtonStates(false);
  setTimeout(() => {
    updateStagePlayButton("play");
    refreshBlockLimit();
  }, 100);

  window.addEventListener("blockly-workspace-changed", refreshBlockLimit);

  document.getElementById("btnSkills")!.addEventListener("click", () => {
    toggleSkillsPanel();
  });

  function runProgramFromEditor(): void {
    if (!currentApp || !workspace) return;
    try {
      const program = compileWorkspaceToAst(
        Blockly,
        workspace as { getTopBlocks: (ordered: boolean) => { type: string; id: string }[] },
        currentApp.compileOptions
      );
      validateProgram(program);

      if (currentApp.checkConstraints) {
        const constraint = currentApp.checkConstraints(workspace, appState);
        if (!constraint.ok) {
          if (typeof appState === "object" && appState) {
            (appState as { status?: string }).status = "error";
            (appState as { message?: string }).message = constraint.message;
          }
          currentApp.render(stageEl, appState, buildContext());
          setStatus(constraint.message, "error");
          updateStagePlayButton("restart");
          return;
        }
      }

      runtimeController?.stop();
      appState = currentApp.adapter.reset(appState);
      if (typeof appState === "object" && appState) {
        (appState as { status?: string }).status = "running";
        (appState as { message?: string }).message = "Jugando...";
      }
      currentApp.render(stageEl, appState, buildContext());
      updateButtonStates(true);
      clearBlockHighlight(workspace);
      runtimeController = runProgram(
        program,
        currentApp.adapter,
        {
          onStep: (blockId) => {
            clearBlockHighlight(workspace);
            highlightBlock(Blockly, workspace, blockId);
          },
          onStatus: (text) => {
            if (text !== "Finalizado.") setStatus(text);
          },
          onDone: () => {
            clearBlockHighlight(workspace);
            updateButtonStates(false);
            if (currentApp) currentApp.render(stageEl, appState, buildContext());
            setStatus("Finalizado ✅");
            if (typeof appState === "object" && appState) {
              const statusValue = (appState as { status?: string }).status;
              if (statusValue !== "win" && statusValue !== "error") {
                updateStagePlayButton("restart");
              }
            }
          },
          onError: (error) => {
            clearBlockHighlight(workspace);
            updateButtonStates(false);
            const message = error instanceof Error ? error.message : String(error);
            if (typeof appState === "object" && appState) {
              const statusValue = (appState as { status?: string }).status;
              const stateMessage = (appState as { message?: string }).message;
              if (statusValue === "win") {
                triggerWinEffect(stageEl);
                if (currentApp) currentApp.render(stageEl, appState, buildContext());
                setStatus(stateMessage ?? "Ganaste ✅", "win");
                updateStagePlayButton("play");
                advanceToNextLevelIfWin();
                return;
              }
              if (statusValue === "error") {
                triggerErrorEffect(stageEl);
                if (currentApp) currentApp.render(stageEl, appState, buildContext());
                setStatus(stateMessage ?? `Error: ${message}`, "error");
                updateStagePlayButton("restart");
                return;
              }
            }
            setStatus(`Error: ${message}`, "error");
            updateStagePlayButton("restart");
          }
        },
        { initialState: appState }
      );
      setStatus("Ejecutando...");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error: ${message}`, "error");
      updateStagePlayButton("restart");
    }
  }

  function advanceToNextLevelIfWin(): void {
    if (!currentApp || typeof appState !== "object" || !appState) return;
    const state = appState as { levelId?: number; completedLevels?: number[] };
    const currentLevelId = state.levelId ?? 1;
    const completedLevels = state.completedLevels ?? [];
    const nextLevel = currentApp.levels?.find((l) => l.id === currentLevelId + 1);
    if (nextLevel) {
      setTimeout(() => {
        if (currentApp?.deserializeState) {
          appState = currentApp.deserializeState({
            levelId: nextLevel.id,
            completedLevels,
            status: "idle",
            message: undefined
          });
        } else {
          const nextState = currentApp!.createInitialState();
          if (typeof nextState === "object" && nextState) {
            (nextState as { levelId?: number }).levelId = nextLevel.id;
            (nextState as { completedLevels?: number[] }).completedLevels = completedLevels;
            (nextState as { status?: string }).status = "idle";
          }
          appState = nextState;
        }
        currentApp!.render(stageEl, appState, buildContext());
        setStatus(`Nivel ${nextLevel.id} listo`);
      }, 2000);
    }
  }

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    // Detectar botón horizontal o vertical
    const stageButton = (target.closest(".stage-play-button") || target.closest(".stage-play-button-vertical")) as HTMLButtonElement;
    if (!stageButton || stageButton.disabled) return;
    const state = stageButton.getAttribute("data-state");
    if (state === "restart") {
      runtimeController?.stop();
      if (currentApp) appState = currentApp.adapter.reset(appState);
      if (typeof appState === "object" && appState) {
        (appState as { status?: string }).status = "idle";
        (appState as { message?: string }).message = undefined;
      }
      if (currentApp) currentApp.render(stageEl, appState, buildContext());
      setStatus("Listo", "normal");
      updateStagePlayButton("play");
      refreshBlockLimit();
    } else {
      runProgramFromEditor();
    }
  });
}

function triggerWinEffect(stageEl: HTMLElement): void {
  const canvas = stageEl.querySelector(".maze-canvas") as HTMLCanvasElement;
  if (!canvas) return;
  canvas.style.transition = "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
  canvas.style.transform = "scale(1.1)";
  setTimeout(() => {
    canvas.style.transform = "scale(1)";
    setTimeout(() => { canvas.style.transition = ""; }, 600);
  }, 600);
}

function triggerErrorEffect(stageEl: HTMLElement): void {
  const canvas = stageEl.querySelector(".maze-canvas") as HTMLCanvasElement;
  if (!canvas) return;
  canvas.style.animation = "shake 0.5s ease-in-out";
  canvas.style.borderColor = "#EF4444";
  setTimeout(() => {
    canvas.style.animation = "";
    setTimeout(() => { canvas.style.borderColor = ""; }, 300);
  }, 500);
}

function render(route: ReturnType<typeof getRoute>): void {
  teardownGameView();

  if (route.path === "landing") {
    mountLanding(appRoot);
    return;
  }

  const app = getAppById(route.gameId);
  appRoot.innerHTML = getGameLayoutHtml(app?.blockType);
  if (app) {
    loadBlocklyScripts(app.blockType ?? "horizontal").then(
      () => initGameView(route.gameId),
      (err) => {
        console.error(err);
        setStatus("Error al cargar Blockly", "error");
      }
    );
  } else {
    showComingSoon(appRoot);
  }
}

// Arranque: usar hash por defecto para landing si no hay hash
if (!window.location.hash || window.location.hash === "#") {
  window.location.hash = "#/";
}

onRouteChange(render);
