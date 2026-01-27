// src/main.ts
import "./style.css";
import { createWorkspace, destroyWorkspace } from "./core/editor/workspace";
import { loadXmlTextIntoWorkspace, workspaceToXmlText } from "./core/editor/serialization";
import { compileWorkspaceToAst } from "./core/compiler/compile";
import { validateProgram } from "./core/compiler/validate";
import { runProgram, type RuntimeController } from "./core/runtime/runtime";
import { loadProject, saveProject } from "./core/storage/projectStore";
import { apps, getDefaultApp, getAppById } from "./apps/registry";
import type { AppDefinition, AppRenderContext } from "./apps/types";
import { highlightBlock, clearBlockHighlight } from "./core/editor/blockHighlight";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="layout">
    <div class="toolbar">
      <label for="game-select" class="toolbar-label">Juego</label>
      <select id="game-select" class="game-select"></select>
      <div class="toolbar-sep"></div>
      <button id="btnRun" class="toolbar-btn toolbar-btn-run" title="Ejecutar programa">
        <img src="/icons/play.svg" alt="Run" class="btn-icon" />
        <span>Run</span>
      </button>
      <button id="btnStop" class="toolbar-btn toolbar-btn-stop" title="Detener ejecución" disabled>
        <img src="/icons/stop.svg" alt="Stop" class="btn-icon" />
        <span>Stop</span>
      </button>
      <button id="btnSave" class="toolbar-btn toolbar-btn-save" title="Guardar proyecto">
        <img src="/icons/save.svg" alt="Save" class="btn-icon" />
        <span>Save</span>
      </button>
      <button id="btnLoad" class="toolbar-btn toolbar-btn-load" title="Cargar proyecto">
        <img src="/icons/load.svg" alt="Load" class="btn-icon" />
        <span>Load</span>
      </button>
      <span id="status" class="status"></span>
    </div>

    <div class="main">
      <div id="stage" class="stage"></div>
      <div class="editor">
        <div id="blocklyArea" class="blocklyArea"></div>
        <div id="blocklyDiv" class="blocklyDiv"></div>
      </div>
    </div>
  </div>
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Blockly = (window as any).Blockly;
if (!Blockly) {
  throw new Error("Blockly no está cargado. Revisá index.html y la carpeta public/vendor.");
}

// Registrar bloques de todos los juegos (mismo set para maze-like)
apps.forEach((a) => a.registerBlocks(Blockly));

const stageEl = document.getElementById("stage") as HTMLDivElement;
const blocklyDiv = document.getElementById("blocklyDiv") as HTMLDivElement;
const gameSelect = document.getElementById("game-select") as HTMLSelectElement;
const statusEl = document.getElementById("status") as HTMLSpanElement;

const setStatus = (text: string) => {
  statusEl.textContent = text;
};

const WORKSPACE_OPTS = {
  horizontalLayout: true,
  toolboxPosition: "end" as const,
  mediaPath: "/vendor/scratch-blocks/media/",
  trashcan: true,
  scrollbars: true,
  fixedStartBlock: { type: "event_whenflagclicked", x: 40, y: 30 }
};

// Populate game selector
apps.forEach((app) => {
  const opt = document.createElement("option");
  opt.value = app.id;
  opt.textContent = app.title;
  if (app.levels?.length) {
    opt.textContent += ` (${app.levels.length} niveles)`;
  }
  gameSelect.appendChild(opt);
});

let currentApp: AppDefinition<unknown> = getDefaultApp();
let workspace: unknown = createWorkspace(
  Blockly,
  blocklyDiv,
  currentApp.toolboxXml,
  WORKSPACE_OPTS
);
let appState: unknown = currentApp.createInitialState();
let runtimeController: RuntimeController | null = null;

const btnRun = document.getElementById("btnRun") as HTMLButtonElement;
const btnStop = document.getElementById("btnStop") as HTMLButtonElement;

const updateButtonStates = (isRunning: boolean) => {
  btnRun.disabled = isRunning;
  btnStop.disabled = !isRunning;
};

gameSelect.value = currentApp.id;
setStatus("Editor listo ✅");
updateButtonStates(false);

const buildContext = (): AppRenderContext<unknown> => ({
  getWorkspace: () => workspace,
  setStatus,
  updateState: (nextState) => {
    appState = nextState;
    currentApp.render(stageEl, appState, buildContext());
  },
  getState: () => appState
});

currentApp.render(stageEl, appState, buildContext());

function switchGame(appId: string): void {
  const next = getAppById(appId);
  if (!next || next.id === currentApp.id) return;

  runtimeController?.stop();
  destroyWorkspace(workspace, blocklyDiv);
  currentApp = next;
  workspace = createWorkspace(
    Blockly,
    blocklyDiv,
    currentApp.toolboxXml,
    WORKSPACE_OPTS
  );
  appState = currentApp.createInitialState();

  const project = loadProject(currentApp.id);
  if (project && project.appId === currentApp.id) {
    loadXmlTextIntoWorkspace(Blockly, workspace as { clear?: () => void }, project.workspaceXml);
    appState = currentApp.deserializeState
      ? currentApp.deserializeState(project.appState)
      : (project.appState as unknown);
    setStatus(`Cargado ${currentApp.title} ✅`);
  } else {
    setStatus(`${currentApp.title} listo`);
  }

  gameSelect.value = currentApp.id;
  currentApp.render(stageEl, appState, buildContext());
}

gameSelect.addEventListener("change", () => {
  switchGame(gameSelect.value);
});

document.getElementById("btnSave")!.addEventListener("click", () => {
  const workspaceXml = workspaceToXmlText(Blockly, workspace);
  const appStateRaw = currentApp.serializeState
    ? currentApp.serializeState(appState)
    : appState;
  saveProject({
    schemaVersion: 1,
    appId: currentApp.id,
    workspaceXml,
    appState: appStateRaw
  });
  setStatus("Guardado ✅");
});

document.getElementById("btnLoad")!.addEventListener("click", () => {
  const project = loadProject(currentApp.id);
  if (!project) {
    setStatus("No hay nada guardado para este juego");
    return;
  }
  if (project.appId !== currentApp.id) {
    setStatus(`Proyecto de otro juego: ${project.appId}`);
    return;
  }
  loadXmlTextIntoWorkspace(Blockly, workspace as { clear?: () => void }, project.workspaceXml);
  appState = currentApp.deserializeState
    ? currentApp.deserializeState(project.appState)
    : (project.appState as unknown);
  currentApp.render(stageEl, appState, buildContext());
  setStatus("Cargado ✅");
});

document.getElementById("btnRun")!.addEventListener("click", () => {
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
          (appState as { status?: string; message?: string }).status = "error";
          (appState as { message?: string }).message = constraint.message;
        }
        currentApp.render(stageEl, appState, buildContext());
        setStatus(constraint.message);
        return;
      }
    }

    runtimeController?.stop();
    appState = currentApp.adapter.reset(appState);
    if (typeof appState === "object" && appState) {
      (appState as { status?: string; message?: string }).status = "running";
      (appState as { message?: string }).message = "Jugando...";
    }
    currentApp.render(stageEl, appState, buildContext());
    updateButtonStates(true);
    clearBlockHighlight(workspace); // Limpiar highlights previos
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
          currentApp.render(stageEl, appState, buildContext());
          setStatus("Finalizado ✅");
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
              currentApp.render(stageEl, appState, buildContext());
              setStatus(stateMessage ?? "Ganaste ✅");

              // Avanzar automáticamente al siguiente nivel después de 2 segundos
              if (typeof appState === "object" && appState) {
                const state = appState as { levelId?: number; completedLevels?: number[] };
                const currentLevelId = state.levelId ?? 1;
                const completedLevels = state.completedLevels ?? [];

                // Buscar siguiente nivel
                const appLevels = currentApp.levels ?? [];
                const nextLevel = appLevels.find((l) => l.id === currentLevelId + 1);

                if (nextLevel) {
                  setTimeout(() => {
                    // Usar deserializeState si está disponible para mantener la estructura correcta
                    if (currentApp.deserializeState) {
                      const nextState = currentApp.deserializeState({
                        levelId: nextLevel.id,
                        completedLevels,
                        status: "idle",
                        message: undefined
                      });
                      appState = nextState;
                    } else {
                      // Fallback: crear estado manualmente
                      const nextState = currentApp.createInitialState();
                      if (typeof nextState === "object" && nextState) {
                        (nextState as { levelId?: number; completedLevels?: number[] }).levelId = nextLevel.id;
                        (nextState as { completedLevels?: number[] }).completedLevels = completedLevels;
                        (nextState as { status?: string }).status = "idle";
                        (nextState as { message?: string }).message = undefined;
                      }
                      appState = nextState;
                    }
                    currentApp.render(stageEl, appState, buildContext());
                    setStatus(`Nivel ${nextLevel.id} listo`);
                  }, 2000);
                }
              }

              return;
            }
            if (statusValue === "error") {
              triggerErrorEffect(stageEl);
              currentApp.render(stageEl, appState, buildContext());
              setStatus(stateMessage ?? `Error: ${message}`);
              return;
            }
          }
          setStatus(`Error: ${message}`);
        }
      },
      { initialState: appState }
    );
    setStatus("Ejecutando...");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Error: ${message}`);
  }
});

btnStop.addEventListener("click", () => {
  runtimeController?.stop();
  clearBlockHighlight(workspace);
  updateButtonStates(false);
  if (typeof appState === "object" && appState) {
    (appState as { status?: string; message?: string }).status = "idle";
    (appState as { message?: string }).message = "Detenido";
  }
  currentApp.render(stageEl, appState, buildContext());
  setStatus("Detenido.");
});

// Efectos visuales
function triggerWinEffect(stageEl: HTMLElement): void {
  const canvas = stageEl.querySelector(".maze-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  // Animación de zoom en la meta (más pronunciada)
  canvas.style.transition = "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
  canvas.style.transform = "scale(1.1)";
  setTimeout(() => {
    canvas.style.transform = "scale(1)";
    setTimeout(() => {
      canvas.style.transition = "";
    }, 600);
  }, 600);

  // Confetti overlay
  createConfettiOverlay(canvas);

  // Mensaje de éxito grande (temporal)
  showSuccessMessage(stageEl);
}

function triggerErrorEffect(stageEl: HTMLElement): void {
  const canvas = stageEl.querySelector(".maze-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  // Shake animation
  canvas.style.animation = "shake 0.5s ease-in-out";
  canvas.style.borderColor = "#EF4444";
  setTimeout(() => {
    canvas.style.animation = "";
    setTimeout(() => {
      canvas.style.borderColor = "";
    }, 300);
  }, 500);
}

function createConfettiOverlay(canvas: HTMLCanvasElement): void {
  // Usar posición relativa al contenedor del stage
  const container = canvas.closest(".maze-stage");
  if (!container) return;

  const overlay = document.createElement("div");
  overlay.className = "confetti-overlay";
  overlay.style.position = "absolute";
  overlay.style.left = `${canvas.offsetLeft}px`;
  overlay.style.top = `${canvas.offsetTop}px`;
  overlay.style.width = `${canvas.width}px`;
  overlay.style.height = `${canvas.height}px`;
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "1000";
  overlay.style.overflow = "hidden";
  overlay.style.borderRadius = "12px";

  container.appendChild(overlay);

  const confettiCanvas = document.createElement("canvas");
  confettiCanvas.width = canvas.width;
  confettiCanvas.height = canvas.height;
  overlay.appendChild(confettiCanvas);

  const ctx = confettiCanvas.getContext("2d");
  if (!ctx) {
    overlay.remove();
    return;
  }

  const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number }> = [];
  const colors = ["#FBBF24", "#F59E0B", "#D97706", "#FCD34D", "#FDE047"];

  // Crear partículas desde el centro
  const centerX = confettiCanvas.width / 2;
  const centerY = confettiCanvas.height / 2;

  for (let i = 0; i < 30; i += 1) {
    particles.push({
      x: centerX,
      y: centerY,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 5 + 3
    });
  }

  let frame = 0;
  const maxFrames = 60;

  const animate = () => {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4; // gravedad
      p.vx *= 0.98; // fricción

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (p.y > confettiCanvas.height || frame > maxFrames) {
        particles.splice(i, 1);
      }
    }

    frame += 1;
    if (particles.length > 0 && frame < maxFrames * 2) {
      requestAnimationFrame(animate);
    } else {
      overlay.remove();
    }
  };

  requestAnimationFrame(animate);
}

function showSuccessMessage(stageEl: HTMLElement): void {
  const message = document.createElement("div");
  message.className = "success-message";
  message.textContent = "¡Llegaste! 🎉";
  stageEl.appendChild(message);

  setTimeout(() => {
    message.style.opacity = "0";
    message.style.transform = "scale(0.8)";
    setTimeout(() => {
      message.remove();
    }, 500);
  }, 2000);
}
