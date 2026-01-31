/**
 * Controlador del juego: inicialización, ejecución, manejo de estado.
 */
import { createWorkspace, destroyWorkspace } from "./core/editor/workspace";
import { compileWorkspaceToAst } from "./core/compiler/compile";
import { validateProgram } from "./core/compiler/validate";
import { runProgram, type RuntimeController } from "./core/runtime/runtime";
import { apps, getAppById } from "./apps/registry";
import type { AppDefinition, AppRenderContext } from "./apps/types";
import { highlightBlock, clearBlockHighlight } from "./core/editor/blockHighlight";
import {
  toggleSkillsPanel,
  updateStagePlayButton,
  updateBlockLimitCounter
} from "./apps/maze/mazeUI";
import { getLevel } from "./apps/maze/mazeLogic";
import { applyInitialBlocks } from "./apps/maze/mazeAdapter";
import { navigateToGame } from "./router";
import { showComingSoon } from "./pages/gameView";
import { getBlockly } from "./blocklyLoader";
import { setStatus, triggerWinEffect, triggerErrorEffect } from "./effects";

const BASE_URL = import.meta.env.BASE_URL;
const LAST_GAME_KEY = "game-blocks-last-game";

// Estado del juego
let workspace: unknown = null;
let currentApp: AppDefinition<unknown> | null = null;
let appState: unknown = null;
let runtimeController: RuntimeController | null = null;

function getWorkspaceOpts(app: AppDefinition<unknown>) {
  const blockType = app.blockType ?? "horizontal";
  return {
    horizontalLayout: blockType === "horizontal",
    toolboxPosition: (blockType === "vertical" ? "start" : "end") as "start" | "end",
    mediaPath: `${BASE_URL}vendor/scratch-blocks/media/`,
    trashcan: true,
    scrollbars: true,
    fixedStartBlock: { type: "event_inicio", x: 40, y: 30 }
  };
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

export function teardownGameView(): void {
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

export function initGameView(gameId: string, appRoot: HTMLElement): void {
  const Blockly = getBlockly();
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

  currentApp = app;
  app.registerBlocks(Blockly);

  workspace = createWorkspace(Blockly, blocklyDiv, app.toolboxXml, getWorkspaceOpts(app));
  appState = app.createInitialState();

  const level = getLevel(1);
  const blockType = (app as { blockType?: "horizontal" | "vertical" })?.blockType ?? "horizontal";
  applyInitialBlocks(Blockly, workspace, level, blockType);
  setStatus(`${app.title} listo`);

  // Poblar selector de juegos
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
      const prevLevelId = getLevelIdFromState(appState);
      const nextLevelId = getLevelIdFromState(nextState);
      if (prevLevelId !== nextLevelId && workspace && nextLevelId !== undefined) {
        (workspace as { clear?: () => void }).clear?.();
        const level = getLevel(nextLevelId);
        const blockType = (currentApp as { blockType?: "horizontal" | "vertical" })?.blockType ?? "horizontal";
        applyInitialBlocks(Blockly, workspace, level, blockType);
        appState = nextState;
        if (currentApp) currentApp.render(stageEl, appState, buildContext());
        refreshBlockLimit();
        setStatus(`Nivel ${nextLevelId} listo`, "normal");
        return;
      }
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

  // Event listener para botones de play/restart
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
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
