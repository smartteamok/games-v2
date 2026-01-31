/**
 * Componentes de UI para el laberinto: skills panel, play button, block limit counter.
 */
import type { AppRenderContext } from "../types";
import { levels, type MazeLevel } from "./levels";
import type { MazeState, MazeUI } from "./mazeTypes";
import { getLevel, makeInitialState, updateStatusText } from "./mazeLogic";
import { loadPlayerSprite } from "./mazeSprites";

// Estado global de UI
let ui: MazeUI | null = null;
let skillsPanel: HTMLElement | undefined = undefined;
let skillsPanelOverlay: HTMLElement | undefined = undefined;
let mazeContainerW = 0;
let mazeContainerH = 0;
let resizeObserver: ResizeObserver | null = null;

// Getter/setter para UI
export const getUI = (): MazeUI | null => ui;
export const setUI = (newUI: MazeUI | null): void => { ui = newUI; };
export const getMazeContainerSize = (): { w: number; h: number } => ({ w: mazeContainerW, h: mazeContainerH });

// Función de draw que se inyecta desde mazeRenderer
let drawMazeFunc: ((state: MazeState) => void) | null = null;
export const setDrawMazeFunc = (fn: (state: MazeState) => void): void => { drawMazeFunc = fn; };

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

  if (!skillsPanel) {
    skillsPanel = createSkillsPanel();
    skillsPanelOverlay = createSkillsPanelOverlay();
    document.body.appendChild(skillsPanelOverlay);
    document.body.appendChild(skillsPanel);
  }

  (rootEl as any).__renderContext = ctx;

  const mazeUI: MazeUI = { rootEl, container, progressBar, canvas, ctx: canvasCtx, statusEl, skillsPanel, skillsPanelOverlay, stagePlayButton };
  ui = mazeUI;
  updateProgressBar(ctx.getState?.() as MazeState | undefined);

  const gameStage = document.getElementById("game-stage");
  const scheduleRedraw = () => {
    if (!ui?.container || !document.contains(ui.container)) return;
    const state = (rootEl as any).__renderContext?.getState?.() as MazeState | undefined;
    if (state && drawMazeFunc) drawMazeFunc(state);
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
    statusEl.textContent = state ? updateStatusText(state) : "Listo.";
  }
  
  return mazeUI;
};

const createSkillsPanel = (): HTMLElement => {
  const panel = document.createElement("div");
  panel.className = "skills-panel";
  
  const header = document.createElement("div");
  header.className = "skills-panel-header";
  
  const title = document.createElement("h2");
  title.className = "skills-panel-title";
  title.textContent = "Habilidades";
  
  const closeBtn = document.createElement("button");
  closeBtn.className = "skills-panel-close";
  closeBtn.innerHTML = "×";
  closeBtn.setAttribute("aria-label", "Cerrar panel");
  closeBtn.addEventListener("click", () => closeSkillsPanel());
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  const content = document.createElement("div");
  content.className = "skills-panel-content";
  content.innerHTML = "<p class='skills-placeholder'>Las habilidades se mostrarán aquí.</p>";
  
  panel.appendChild(header);
  panel.appendChild(content);
  
  return panel;
};

const createSkillsPanelOverlay = (): HTMLElement => {
  const overlay = document.createElement("div");
  overlay.className = "skills-panel-overlay";
  overlay.addEventListener("click", () => closeSkillsPanel());
  return overlay;
};

const createStagePlayButton = (): HTMLButtonElement => {
  const button = document.createElement("button");
  button.className = "stage-play-button";
  button.setAttribute("aria-label", "Ejecutar programa");
  button.setAttribute("data-state", "play");
  updateStagePlayButtonState(button, "play");
  return button;
};

const updateStagePlayButtonState = (button: HTMLButtonElement, state: "play" | "restart" | "disabled"): void => {
  button.setAttribute("data-state", state);
  button.disabled = state === "disabled";
  
  if (state === "play") {
    button.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
      </svg>
    `;
    button.setAttribute("aria-label", "Ejecutar programa");
  } else if (state === "restart") {
    button.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12H4C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z" fill="currentColor"/>
      </svg>
    `;
    button.setAttribute("aria-label", "Reiniciar y ejecutar");
  } else {
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
      </svg>
    `;
    button.setAttribute("aria-label", "Ejecutando...");
  }
};

const updateVerticalPlayButtonState = (button: HTMLButtonElement, state: "play" | "restart" | "disabled"): void => {
  button.setAttribute("data-state", state);
  button.disabled = state === "disabled";
  if (state === "play") {
    button.innerHTML = `<svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg>`;
    button.setAttribute("aria-label", "Ejecutar programa");
  } else if (state === "restart") {
    button.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12H4C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z" fill="currentColor"/></svg>`;
    button.setAttribute("aria-label", "Reiniciar y ejecutar");
  } else {
    button.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>`;
    button.setAttribute("aria-label", "Ejecutando...");
  }
};

export const updateStagePlayButton = (state: "play" | "restart" | "disabled"): void => {
  const buttonH = document.querySelector(".stage-play-button") as HTMLButtonElement;
  if (buttonH) {
    updateStagePlayButtonState(buttonH, state);
  }
  const buttonV = document.getElementById("stage-play-btn-vertical") as HTMLButtonElement;
  if (buttonV) {
    updateVerticalPlayButtonState(buttonV, state);
  }
};

const openSkillsPanel = (): void => {
  const panel = skillsPanel || (document.querySelector(".skills-panel") as HTMLElement);
  const overlay = skillsPanelOverlay || (document.querySelector(".skills-panel-overlay") as HTMLElement);
  if (panel && overlay) {
    panel.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

const closeSkillsPanel = (): void => {
  const panel = skillsPanel || (document.querySelector(".skills-panel") as HTMLElement);
  const overlay = skillsPanelOverlay || (document.querySelector(".skills-panel-overlay") as HTMLElement);
  if (panel && overlay) {
    panel.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
};

export const toggleSkillsPanel = (): void => {
  const panel = document.querySelector(".skills-panel") as HTMLElement;
  if (panel?.classList.contains("open")) {
    closeSkillsPanel();
  } else {
    openSkillsPanel();
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countBlocks = (workspace: any): number => {
  if (!workspace || !workspace.getTopBlocks) return 0;
  
  const allBlocks = workspace.getAllBlocks();
  let count = 0;
  
  for (const block of allBlocks) {
    if (block.type === "event_inicio" || block.type === "event_whenflagclicked") {
      continue;
    }
    if (block.isShadow?.()) {
      continue;
    }
    if (block.type?.startsWith("math_")) {
      continue;
    }
    count += 1;
  }
  
  return count;
};

export const updateBlockLimitCounter = (workspace: unknown, levelId: number): void => {
  const level = getLevel(levelId);
  const blockLimit = level.blockLimit;
  const instructionsEl = document.querySelector(".instructions");
  
  if (!instructionsEl) return;
  
  const instructionsContent = instructionsEl.querySelector(".instructions-content");
  if (!instructionsContent) return;
  
  if (blockLimit === undefined) {
    instructionsContent.innerHTML = `
      <div class="block-limit-counter">
        <div class="block-limit-number">∞</div>
        <div class="block-limit-label">sin límite</div>
      </div>
    `;
    updateToolboxBlocks(workspace, true);
    return;
  }
  
  const currentCount = countBlocks(workspace);
  const remaining = blockLimit - currentCount;
  const exceeded = remaining < 0;

  if (exceeded) {
    instructionsContent.innerHTML = `
      <div class="block-limit-counter block-limit-exceeded">
        <span class="block-limit-exceeded-msg">¡Cantidad de bloques superada!</span>
      </div>
    `;
  } else {
    instructionsContent.innerHTML = `
      <div class="block-limit-counter">
        <div class="block-limit-number">${remaining}</div>
        <div class="block-limit-label">${remaining === 1 ? "instrucción disponible" : "instrucciones disponibles"}</div>
      </div>
    `;
  }

  updateToolboxBlocks(workspace, !exceeded);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateToolboxBlocks = (workspace: any, enabled: boolean): void => {
  if (!workspace) return;
  
  const toolbox = workspace.getToolbox?.();
  if (!toolbox) return;
  
  const toolboxItems = toolbox.getToolboxItems?.();
  if (!toolboxItems) return;
  
  for (const item of toolboxItems) {
    if (!item) continue;
    
    if (typeof item.setDisabled === "function") {
      item.setDisabled(!enabled);
    }
    
    const element = item.getDiv?.();
    if (element) {
      if (enabled) {
        element.classList.remove("blocklyDisabled");
        element.style.opacity = "1";
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
      } else {
        element.classList.add("blocklyDisabled");
        element.style.opacity = "0.4";
        element.style.pointerEvents = "none";
        element.style.cursor = "not-allowed";
      }
    }
  }
  
  const flyout = toolbox.getFlyout?.();
  if (flyout) {
    const flyoutElement = flyout.getWorkspace?.()?.getParentSvg?.()?.parentElement;
    if (flyoutElement) {
      if (enabled) {
        flyoutElement.style.pointerEvents = "auto";
      } else {
        flyoutElement.style.pointerEvents = "none";
      }
    }
  }
};

export const updateInstructions = (): void => {
  // Mantener compatibilidad
};

export const updateProgressBar = (state?: MazeState, levelsList: MazeLevel[] = levels): void => {
  if (!ui) return;

  const currentLevelId = state?.levelId ?? 1;
  const completedLevels = state?.completedLevels ?? [];

  ui.progressBar.innerHTML = "";

  for (const level of levelsList) {
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
};
