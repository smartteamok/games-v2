import type {
  AppDefinition,
  AppRenderContext,
  ConstraintResult,
  LevelInfo,
  RuntimeAdapter
} from "../types";
import { levels, type Direction, type MazeLevel } from "./levels";
import { animateMoveAsync, animateTurnAsync } from "./animation";

type MazeStatus = "idle" | "running" | "win" | "error";

export type MazeState = {
  levelId: number;
  player: { x: number; y: number; dir: Direction };
  status: MazeStatus;
  message?: string;
  completedLevels?: number[];
  visitedCells?: Array<{ x: number; y: number }>; // Celdas por las que pasó el sprite
};

type MazeUI = {
  rootEl: HTMLElement;
  container: HTMLElement;
  progressBar: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  statusEl: HTMLDivElement;
  skillsPanel?: HTMLElement;
  skillsPanelOverlay?: HTMLElement;
  stagePlayButton?: HTMLButtonElement;
};

// Estado de animación temporal
type AnimationState = {
  playerX: number;
  playerY: number;
  playerDir: string;
  dirProgress: number; // 0-1 para rotación intermedia
} | null;

const GAME_COLOR = "#4C97FF";
const GAME_ICON_SIZE = 42;
const MIN_CELL = 12;
const MAX_CELL = 128;
const PADDING_RATIO = 0.25;

const BASE_URL = import.meta.env.BASE_URL;

/** Iconos de bloques horizontales; carpeta distinta a verticales. Ver app/public/BLOCK_ICONS.md */
const ICON_MOVE = `${BASE_URL}game-icons/move-right.svg`;
const ICON_BACK = `${BASE_URL}game-icons/move-left.svg`;
const ICON_TURN_LEFT = `${BASE_URL}game-icons/turn-left.svg`;
const ICON_TURN_RIGHT = `${BASE_URL}game-icons/turn-right.svg`;
const ICON_INICIO = `${BASE_URL}icons/play-green.svg`;

const DIR_ORDER: Direction[] = ["N", "E", "S", "W"];
const DIR_DELTAS: Record<Direction, { x: number; y: number }> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 }
};

let ui: MazeUI | null = null;
let animationState: AnimationState = null;
let skillsPanel: HTMLElement | undefined = undefined;
let skillsPanelOverlay: HTMLElement | undefined = undefined;

let mazeContainerW = 0;
let mazeContainerH = 0;
let resizeObserver: ResizeObserver | null = null;

// Sprite del personaje: se intenta cargar player-sprite.png o player-sprite-walking.png
let playerSprite: HTMLImageElement | null = null;
let playerSpriteFrames = 4;
let walkFrame = 0;
let lastWalkFrameTime = 0;

/** Milisegundos entre cada avance del frame de caminata/idle. Aumentar = animación más lenta. */
const WALK_FRAME_INTERVAL_MS = 120;
const IDLE_FRAME_INTERVAL_MS = 400; // Animación idle más lenta

let idleFrame = 0;
let lastIdleFrameTime = 0;

let spriteLoadCallback: (() => void) | null = null;

// Sprites de obstáculos: caché por tipo. Cada sprite tiene 2 frames horizontales.
const obstacleSprites: Map<string, HTMLImageElement> = new Map();
let obstacleFrame = 0;
let lastObstacleFrameTime = 0;
const OBSTACLE_FRAME_INTERVAL_MS = 500;

// Sprite de la meta
let goalSprite: HTMLImageElement | null = null;
let goalSpriteFrames = 1;
let goalFrame = 0;
let lastGoalFrameTime = 0;
const GOAL_FRAME_INTERVAL_MS = 400;

const loadPlayerSprite = (onLoaded?: () => void): HTMLImageElement | null => {
  if (onLoaded) {
    spriteLoadCallback = onLoaded;
    if (playerSprite?.complete && playerSprite.naturalWidth > 0) {
      const cb = spriteLoadCallback;
      spriteLoadCallback = null;
      cb();
    }
  }
  if (playerSprite) return playerSprite;
  playerSprite = new Image();
  const basicSrc = `${BASE_URL}game-sprites/player-sprite.png`;
  const walkingSrc = `${BASE_URL}game-sprites/player-sprite-walking.png`;

  const detectFrames = () => {
    if (!playerSprite) return;
    const w = playerSprite.naturalWidth;
    const h = playerSprite.naturalHeight;
    if (w < 1 || h < 1) return;
    const f8 = w / 8;
    if (f8 > 0 && Math.abs(f8 - h) <= 4) playerSpriteFrames = 8;
    else playerSpriteFrames = 4;
  };

  const runLoadCallback = () => {
    detectFrames();
    if (spriteLoadCallback) {
      const cb = spriteLoadCallback;
      spriteLoadCallback = null;
      cb();
    }
  };

  playerSprite.onload = runLoadCallback;
  playerSprite.onerror = () => {
    if (!playerSprite) return;
    playerSprite.onerror = null;
    playerSprite.src = walkingSrc;
  };
  playerSprite.src = basicSrc;
  if (playerSprite.complete && playerSprite.naturalWidth > 0) runLoadCallback();
  return playerSprite;
};

loadPlayerSprite();

/** Carga sprite de obstáculo. Ruta: public/game-sprites/obstacles/{type}.png (2 frames horizontales) */
const loadObstacleSprite = (type: string): HTMLImageElement | null => {
  if (obstacleSprites.has(type)) return obstacleSprites.get(type) ?? null;
  const img = new Image();
  img.src = `${BASE_URL}game-sprites/obstacles/${type}.png`;
  obstacleSprites.set(type, img);
  return img;
};

/** Carga sprite de la meta. Ruta: public/game-sprites/goal.png (1 o 2 frames horizontales) */
const loadGoalSprite = (): HTMLImageElement | null => {
  if (goalSprite) return goalSprite;
  goalSprite = new Image();
  goalSprite.onload = () => {
    if (!goalSprite) return;
    const w = goalSprite.naturalWidth;
    const h = goalSprite.naturalHeight;
    if (w >= h * 1.8) goalSpriteFrames = 2;
    else goalSpriteFrames = 1;
  };
  goalSprite.src = `${BASE_URL}game-sprites/goal.png`;
  return goalSprite;
};

loadGoalSprite();

/** Imágenes de fondo del maze. Ruta: public/game-sprites/backgrounds/{filename} */
const mazeBackgroundImages: Map<string, HTMLImageElement> = new Map();

const loadMazeBackgroundImage = (filename: string): HTMLImageElement | null => {
  if (mazeBackgroundImages.has(filename)) return mazeBackgroundImages.get(filename) ?? null;
  const img = new Image();
  img.src = `${BASE_URL}game-sprites/backgrounds/${filename}`;
  mazeBackgroundImages.set(filename, img);
  return img;
};

/** Precarga sprites de obstáculos usados en los niveles para que estén listos al inicio. */
const preloadObstacleSprites = (): void => {
  const types = new Set<string>();
  for (const level of levels) {
    for (const w of level.walls) {
      if (w.type) types.add(w.type);
    }
  }
  for (const t of types) loadObstacleSprite(t);
};
preloadObstacleSprites();

/** Precarga imágenes de fondo de niveles que las definan. */
const preloadMazeBackgrounds = (): void => {
  for (const level of levels) {
    if (level.backgroundImage) loadMazeBackgroundImage(level.backgroundImage);
  }
};
preloadMazeBackgrounds();

export const getLevel = (levelId: number): MazeLevel =>
  levels.find((level) => level.id === levelId) ?? levels[0];

export const makeInitialState = (levelId: number, completedLevels: number[] = []): MazeState => {
  const level = getLevel(levelId);
  return {
    levelId: level.id,
    player: { ...level.start },
    status: "idle",
    message: undefined,
    completedLevels,
    visitedCells: [{ x: level.start.x, y: level.start.y }]
  };
};

const turnLeft = (dir: Direction): Direction => {
  const index = DIR_ORDER.indexOf(dir);
  return DIR_ORDER[(index + 3) % DIR_ORDER.length];
};

const turnRight = (dir: Direction): Direction => {
  const index = DIR_ORDER.indexOf(dir);
  return DIR_ORDER[(index + 1) % DIR_ORDER.length];
};

const isBlocked = (level: MazeLevel, x: number, y: number): boolean =>
  level.walls.some((wall) => wall.x === x && wall.y === y);

const inBounds = (level: MazeLevel, x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < level.gridW && y < level.gridH;

const updateStatusText = (state: MazeState): string => {
  if (state.message) {
    return state.message;
  }
  switch (state.status) {
    case "running":
      return "Jugando...";
    case "win":
      return "¡Llegaste!";
    case "error":
      return "¡Choque!";
    default:
      return "Listo.";
  }
};

export const ensureUI = (rootEl: HTMLElement, ctx: AppRenderContext<MazeState>): MazeUI => {
  if (ui && ui.rootEl === rootEl && rootEl.contains(ui.container)) {
    return ui;
  }
  rootEl.innerHTML = "";

  // Detectar si estamos en layout vertical
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
    // En vertical, el play button y status ya existen en el HTML
    statusEl = document.getElementById("status-vertical") as HTMLDivElement;
    if (!statusEl) {
      statusEl = document.createElement("div");
      statusEl.className = "status-vertical";
      statusEl.id = "status-vertical";
    }
    stagePlayButton = document.getElementById("stage-play-btn-vertical") as HTMLButtonElement;
  } else {
    // En horizontal, crear play button y status
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

  // Crear panel lateral de skills solo una vez
  if (!skillsPanel) {
    skillsPanel = createSkillsPanel();
    skillsPanelOverlay = createSkillsPanelOverlay();
    document.body.appendChild(skillsPanelOverlay);
    document.body.appendChild(skillsPanel);
  }

  // Guardar contexto en rootEl para acceso desde updateProgressBar
  (rootEl as any).__renderContext = ctx;

  const mazeUI: MazeUI = { rootEl, container, progressBar, canvas, ctx: canvasCtx, statusEl, skillsPanel, skillsPanelOverlay, stagePlayButton };
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

  // Actualizar status
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

// Exportar función para actualizar el estado del botón desde main.ts
export const updateStagePlayButton = (state: "play" | "restart" | "disabled"): void => {
  // Botón horizontal (layout horizontal)
  const buttonH = document.querySelector(".stage-play-button") as HTMLButtonElement;
  if (buttonH) {
    updateStagePlayButtonState(buttonH, state);
  }
  // Botón vertical (layout vertical)
  const buttonV = document.getElementById("stage-play-btn-vertical") as HTMLButtonElement;
  if (buttonV) {
    updateVerticalPlayButtonState(buttonV, state);
  }
};

const updateVerticalPlayButtonState = (button: HTMLButtonElement, state: "play" | "restart" | "disabled"): void => {
  button.setAttribute("data-state", state);
  button.disabled = state === "disabled";
  if (state === "play") {
    button.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg>`;
    button.setAttribute("aria-label", "Ejecutar programa");
  } else if (state === "restart") {
    button.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12H4C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z" fill="currentColor"/></svg>`;
    button.setAttribute("aria-label", "Reiniciar y ejecutar");
  } else {
    button.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>`;
    button.setAttribute("aria-label", "Ejecutando...");
  }
};

// Función para contar bloques en el workspace (excluyendo el bloque inicial y shadow blocks)
const countBlocks = (workspace: any): number => {
  if (!workspace || !workspace.getTopBlocks) return 0;
  
  const allBlocks = workspace.getAllBlocks();
  let count = 0;
  
  for (const block of allBlocks) {
    // Excluir bloques de inicio (event_inicio o event_whenflagclicked por proyectos guardados)
    if (block.type === "event_inicio" || block.type === "event_whenflagclicked") {
      continue;
    }
    // Excluir shadow blocks (bloques de input numérico que vienen con otros bloques)
    if (block.isShadow?.()) {
      continue;
    }
    // Excluir bloques de tipo math_ (inputs numéricos)
    if (block.type?.startsWith("math_")) {
      continue;
    }
    count += 1;
  }
  
  return count;
};

// Función para actualizar el contador de instrucciones disponibles
export const updateBlockLimitCounter = (workspace: unknown, levelId: number): void => {
  const level = getLevel(levelId);
  const blockLimit = level.blockLimit;
  const instructionsEl = document.querySelector(".instructions");
  
  if (!instructionsEl) return;
  
  const instructionsContent = instructionsEl.querySelector(".instructions-content");
  if (!instructionsContent) return;
  
  // Si no hay límite, mostrar "sin límite"
  if (blockLimit === undefined) {
    instructionsContent.innerHTML = `
      <div class="block-limit-counter">
        <div class="block-limit-number">∞</div>
        <div class="block-limit-label">sin límite</div>
      </div>
    `;
    // Asegurar que los bloques estén habilitados cuando no hay límite
    updateToolboxBlocks(workspace, true);
    return;
  }
  
  const currentCount = countBlocks(workspace);
  const remaining = blockLimit - currentCount;
  const exceeded = remaining < 0;

  if (exceeded) {
    instructionsContent.innerHTML = `
      <div class="block-limit-counter block-limit-exceeded">
        <span class="block-limit-exclaim">¡</span>
        <span class="block-limit-exceeded-msg">Cantidad de bloques superada</span>
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

// Función para deshabilitar/habilitar bloques del toolbox
const updateToolboxBlocks = (workspace: any, enabled: boolean): void => {
  if (!workspace) return;
  
  // Obtener el toolbox del workspace
  const toolbox = workspace.getToolbox?.();
  if (!toolbox) return;
  
  // Obtener todos los items del toolbox
  const toolboxItems = toolbox.getToolboxItems?.();
  if (!toolboxItems) return;
  
  // Deshabilitar/habilitar cada item del toolbox
  for (const item of toolboxItems) {
    if (!item) continue;
    
    // Intentar usar el método setDisabled si existe
    if (typeof item.setDisabled === "function") {
      item.setDisabled(!enabled);
    }
    
    // También deshabilitar el elemento DOM directamente
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
  
  // También deshabilitar el flyout si existe
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

// Función para actualizar las instrucciones disponibles (mantener compatibilidad)
export const updateInstructions = (): void => {
  // Esta función ahora se maneja con updateBlockLimitCounter
  // Se mantiene para compatibilidad pero no hace nada
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

// Exportar función para abrir el panel desde main.ts
export const toggleSkillsPanel = (): void => {
  const panel = document.querySelector(".skills-panel") as HTMLElement;
  if (panel?.classList.contains("open")) {
    closeSkillsPanel();
  } else {
    openSkillsPanel();
  }
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
    // Un nivel está bloqueado si no es el primero y el anterior no está completado
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
      // Guardar el contexto en el rootEl para acceso posterior
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

export const drawMaze = (state: MazeState): void => {
  if (!ui) return;
  const level = getLevel(state.levelId);
  const W = mazeContainerW > 0 ? mazeContainerW : level.gridW * 48 + 24;
  const H = mazeContainerH > 0 ? mazeContainerH : level.gridH * 48 + 24;
  const pad = Math.max(8, Math.min(W, H) * 0.04);
  const cellByW = (W - pad * 2) / level.gridW;
  const cellByH = (H - pad * 2) / level.gridH;
  const rawCell = Math.floor(Math.min(cellByW, cellByH));
  const CELL = rawCell > 0 ? Math.min(MAX_CELL, rawCell) : MIN_CELL;
  const PADDING = Math.max(6, Math.round(CELL * PADDING_RATIO));
  const width = level.gridW * CELL + PADDING * 2;
  const height = level.gridH * CELL + PADDING * 2;
  if (ui.canvas.width !== width || ui.canvas.height !== height) {
    ui.canvas.width = width;
    ui.canvas.height = height;
  }

  const ctx = ui.ctx;
  ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);

  const cw = ui.canvas.width;
  const ch = ui.canvas.height;

  let usedBgImage = false;
  if (level.backgroundImage) {
    const bgImg = loadMazeBackgroundImage(level.backgroundImage);
    if (bgImg?.complete && bgImg.naturalWidth > 0) {
      const iw = bgImg.naturalWidth;
      const ih = bgImg.naturalHeight;
      const r = Math.max(cw / iw, ch / ih);
      const sw = iw * r;
      const sh = ih * r;
      const sx = (sw - cw) / 2;
      const sy = (sh - ch) / 2;
      ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, cw, ch);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(0, 0, cw, ch);
      usedBgImage = true;
    }
  }
  if (!usedBgImage) {
    const bgGradient = ctx.createLinearGradient(0, 0, cw, ch);
    bgGradient.addColorStop(0, "#FFFFFF");
    bgGradient.addColorStop(1, "#FAFAFA");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, cw, ch);
  }

  // Dibujar celdas visitadas con color más fuerte (camino recorrido)
  const visited = state.visitedCells ?? [];
  for (const cell of visited) {
    const cellX = PADDING + cell.x * CELL;
    const cellY = PADDING + cell.y * CELL;
    ctx.fillStyle = "rgba(76, 151, 255, 0.25)"; // Azul suave
    ctx.fillRect(cellX + 1, cellY + 1, CELL - 2, CELL - 2);
  }

  // Grid más sutil
  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth = 1;
  for (let x = 0; x <= level.gridW; x += 1) {
    const xPos = PADDING + x * CELL;
    ctx.beginPath();
    ctx.moveTo(xPos, PADDING);
    ctx.lineTo(xPos, PADDING + level.gridH * CELL);
    ctx.stroke();
  }
  for (let y = 0; y <= level.gridH; y += 1) {
    const yPos = PADDING + y * CELL;
    ctx.beginPath();
    ctx.moveTo(PADDING, yPos);
    ctx.lineTo(PADDING + level.gridW * CELL, yPos);
    ctx.stroke();
  }

  // Actualizar frame de obstáculos animados
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastObstacleFrameTime >= OBSTACLE_FRAME_INTERVAL_MS) {
    obstacleFrame = (obstacleFrame + 1) % 2;
    lastObstacleFrameTime = now;
  }

  // Obstáculos: si tienen type, usar sprite; sino dibujo por defecto
  for (const wall of level.walls) {
    const wallCenterX = PADDING + wall.x * CELL + CELL / 2;
    const wallCenterY = PADDING + wall.y * CELL + CELL / 2;

    if (wall.type) {
      const obsSprite = loadObstacleSprite(wall.type);
      if (obsSprite && obsSprite.complete && obsSprite.naturalWidth > 0) {
        const ow = obsSprite.naturalWidth;
        const oh = obsSprite.naturalHeight;
        const hasAnim = ow >= oh * 1.8; // 2 frames si ancho >= 2x alto
        const frames = hasAnim ? 2 : 1;
        const fw = ow / frames;
        const fh = oh;
        const frameIdx = hasAnim ? obstacleFrame : 0;
        const sx = frameIdx * fw;
        const drawSize = CELL * 0.9;
        const drawH = (fh / fw) * drawSize;
        ctx.drawImage(obsSprite, sx, 0, fw, fh, wallCenterX - drawSize / 2, wallCenterY - drawH / 2, drawSize, drawH);
        continue;
      }
    }

    // Fallback: dibujo por defecto (marrón con sombra)
    const wallX = PADDING + wall.x * CELL + 4;
    const wallY = PADDING + wall.y * CELL + 4;
    const wallSize = CELL - 8;
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(wallX + 2, wallY + 2, wallSize, wallSize);
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(wallX, wallY, wallSize, wallSize);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(wallX, wallY, wallSize, wallSize * 0.2);
  }

  // Actualizar frame de meta animada
  if (now - lastGoalFrameTime >= GOAL_FRAME_INTERVAL_MS) {
    goalFrame = (goalFrame + 1) % Math.max(1, goalSpriteFrames);
    lastGoalFrameTime = now;
  }

  // Meta: usar sprite si está disponible
  const goalCenterX = PADDING + level.goal.x * CELL + CELL / 2;
  const goalCenterY = PADDING + level.goal.y * CELL + CELL / 2;
  const gSprite = loadGoalSprite();
  const useGoalSprite = gSprite && gSprite.complete && gSprite.naturalWidth > 0;

  if (useGoalSprite) {
    const gw = gSprite!.naturalWidth;
    const gh = gSprite!.naturalHeight;
    const gFrames = goalSpriteFrames;
    const gfw = gw / gFrames;
    const gfh = gh;
    const gFrameIdx = gFrames > 1 ? goalFrame : 0;
    const gsx = gFrameIdx * gfw;
    const gDrawSize = CELL * 0.9;
    const gDrawH = (gfh / gfw) * gDrawSize;
    ctx.drawImage(gSprite!, gsx, 0, gfw, gfh, goalCenterX - gDrawSize / 2, goalCenterY - gDrawH / 2, gDrawSize, gDrawH);
  } else {
    // Fallback: círculo verde con glow
    const goalRadius = CELL * 0.25;
    const glowGradient = ctx.createRadialGradient(goalCenterX, goalCenterY, 0, goalCenterX, goalCenterY, goalRadius * 2);
    glowGradient.addColorStop(0, "rgba(16, 185, 129, 0.3)");
    glowGradient.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(goalCenterX, goalCenterY, goalRadius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.arc(goalCenterX, goalCenterY, goalRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(goalCenterX - goalRadius * 0.3, goalCenterY - goalRadius * 0.3, goalRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Usar estado de animación si existe, sino estado real
  const playerX = animationState
    ? PADDING + animationState.playerX * CELL + CELL / 2
    : PADDING + state.player.x * CELL + CELL / 2;
  const playerY = animationState
    ? PADDING + animationState.playerY * CELL + CELL / 2
    : PADDING + state.player.y * CELL + CELL / 2;
  const playerDir = animationState ? animationState.playerDir : state.player.dir;
  const size = CELL * 0.6;

  // Avanzar frame: walkFrame si está en movimiento, idleFrame si está quieto
  if (animationState) {
    if (now - lastWalkFrameTime >= WALK_FRAME_INTERVAL_MS) {
      walkFrame += 1;
      lastWalkFrameTime = now;
    }
  } else {
    // Animación idle (2 frames, más lenta)
    if (now - lastIdleFrameTime >= IDLE_FRAME_INTERVAL_MS) {
      idleFrame = (idleFrame + 1) % 2;
      lastIdleFrameTime = now;
    }
  }

  const sprite = loadPlayerSprite();
  const useSprite = sprite && sprite.complete && sprite.naturalWidth > 0;

  if (useSprite) {
    const w = sprite!.naturalWidth;
    const h = sprite!.naturalHeight;
    const n = playerSpriteFrames;
    const fw = w / n;
    const fh = h;
    const dirIndex = playerDir === "N" ? 0 : playerDir === "E" ? 1 : playerDir === "S" ? 2 : 3;
    const framesPerDir = n / 4;
    // Usar walkFrame si se mueve, idleFrame si está quieto
    const currentFrame = animationState ? walkFrame : idleFrame;
    const animFrame = framesPerDir > 1 ? (currentFrame % Math.floor(framesPerDir)) : 0;
    const frameIndex = Math.min(dirIndex * Math.floor(framesPerDir) + animFrame, n - 1);
    const sx = frameIndex * fw;
    const drawW = CELL * 1.2;
    const drawH = (fh / fw) * drawW;
    ctx.drawImage(
      sprite!,
      sx,
      0,
      fw,
      fh,
      playerX - drawW / 2,
      playerY - drawH / 2,
      drawW,
      drawH
    );
  } else {
    // Fallback: triángulo con outline blanco
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (playerDir === "N") {
      ctx.moveTo(playerX, playerY - size);
      ctx.lineTo(playerX - size, playerY + size);
      ctx.lineTo(playerX + size, playerY + size);
    } else if (playerDir === "S") {
      ctx.moveTo(playerX, playerY + size);
      ctx.lineTo(playerX - size, playerY - size);
      ctx.lineTo(playerX + size, playerY - size);
    } else if (playerDir === "E") {
      ctx.moveTo(playerX + size, playerY);
      ctx.lineTo(playerX - size, playerY - size);
      ctx.lineTo(playerX - size, playerY + size);
    } else {
      ctx.moveTo(playerX - size, playerY);
      ctx.lineTo(playerX + size, playerY - size);
      ctx.lineTo(playerX + size, playerY + size);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = GAME_COLOR;
    ctx.fill();
  }

  ui.statusEl.textContent = updateStatusText(state);
};

export const registerMazeLikeBlocks = (Blockly: any) => {
  Blockly.Blocks["event_inicio"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_INICIO, GAME_ICON_SIZE, GAME_ICON_SIZE, "Inicio"))
        .appendField("Inicio");
      this.setPreviousStatement(null);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Inicio del programa");
      this.setColour("#4CBF56");
    }
  };

  Blockly.Blocks["game_move"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldImage(ICON_MOVE, GAME_ICON_SIZE, GAME_ICON_SIZE, "Mover")
      );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Mover hacia adelante");
      this.setColour(GAME_COLOR);
    }
  };

  Blockly.Blocks["game_back"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldImage(ICON_BACK, GAME_ICON_SIZE, GAME_ICON_SIZE, "Atrás")
      );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Mover hacia atrás");
      this.setColour(GAME_COLOR);
    }
  };

  Blockly.Blocks["game_turn_left"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldImage(ICON_TURN_LEFT, GAME_ICON_SIZE, GAME_ICON_SIZE, "Girar izquierda")
      );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Girar a la izquierda");
      this.setColour(GAME_COLOR);
    }
  };

  Blockly.Blocks["game_turn_right"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldImage(ICON_TURN_RIGHT, GAME_ICON_SIZE, GAME_ICON_SIZE, "Girar derecha")
      );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Girar a la derecha");
      this.setColour(GAME_COLOR);
    }
  };

  const pathToMedia = `${BASE_URL}vendor/scratch-blocks/media/`;

  Blockly.Blocks["game_repeat"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 %2 %3",
        args0: [
          { type: "input_statement", name: "SUBSTACK" },
          {
            type: "field_image",
            src: pathToMedia + "icons/control_repeat.svg",
            width: 40,
            height: 40,
            alt: "Repetir",
            flip_rtl: true
          },
          { type: "input_value", name: "TIMES", check: "Number" }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        category: Blockly.Categories?.control,
        colour: Blockly.Colours?.control?.primary ?? "#FFAB19",
        colourSecondary: Blockly.Colours?.control?.secondary,
        colourTertiary: Blockly.Colours?.control?.tertiary,
        colourQuaternary: Blockly.Colours?.control?.quaternary
      });
      this.setTooltip("Repetir varias veces");
    }
  };

  Blockly.Blocks["game_wait"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 %2",
        args0: [
          {
            type: "field_image",
            src: pathToMedia + "icons/control_wait.svg",
            width: 40,
            height: 40,
            alt: "Esperar"
          },
          { type: "input_value", name: "MS", check: "Number" }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        category: Blockly.Categories?.control,
        colour: Blockly.Colours?.control?.primary ?? "#FFAB19",
        colourSecondary: Blockly.Colours?.control?.secondary,
        colourTertiary: Blockly.Colours?.control?.tertiary,
        colourQuaternary: Blockly.Colours?.control?.quaternary
      });
      this.setTooltip("Esperar milisegundos");
    }
  };
};

export const MAZE_LIKE_TOOLBOX_XML = `
<xml>
  <block type="game_move"></block>
  <block type="game_back"></block>
  <block type="game_turn_left"></block>
  <block type="game_turn_right"></block>
  <block type="game_repeat">
    <value name="TIMES">
      <shadow type="math_whole_number"><field name="NUM">4</field></shadow>
    </value>
  </block>
  <block type="game_wait">
    <value name="MS">
      <shadow type="math_positive_number"><field name="NUM">500</field></shadow>
    </value>
  </block>
</xml>
`;

export const adapter: RuntimeAdapter<MazeState> = {
  applyOp: async (op, state) => {
    const level = getLevel(state.levelId);
    if (state.status === "win" || state.status === "error") {
      return state;
    }

    if (op.kind === "turn") {
      const newDir = op.direction === "left" ? turnLeft(state.player.dir) : turnRight(state.player.dir);
      const oldDir = state.player.dir;

      // Animar rotación
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
      const delta = DIR_DELTAS[state.player.dir];
      const steps = Math.abs(op.steps);
      const sign = op.steps >= 0 ? 1 : -1;

      for (let i = 0; i < steps; i += 1) {
        const nextX = state.player.x + delta.x * sign;
        const nextY = state.player.y + delta.y * sign;

        // Validar antes de animar
        if (!inBounds(level, nextX, nextY) || isBlocked(level, nextX, nextY)) {
          state.status = "error";
          state.message = "¡Choque!";
          animationState = null;
          drawMaze(state);
          throw new Error("CHOQUE");
        }

        // Animar movimiento
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

        // Registrar celda visitada
        if (!state.visitedCells) state.visitedCells = [];
        if (!state.visitedCells.some((c) => c.x === nextX && c.y === nextY)) {
          state.visitedCells.push({ x: nextX, y: nextY });
        }

        // Verificar si ganó
        if (state.player.x === level.goal.x && state.player.y === level.goal.y) {
          // Marcar nivel como completado
          const completedLevels = state.completedLevels ?? [];
          if (!completedLevels.includes(state.levelId)) {
            completedLevels.push(state.levelId);
            state.completedLevels = completedLevels;
          }

          // Verificar si hay siguiente nivel
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
    animationState = null;
    walkFrame = 0;
    idleFrame = 0;
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

/** Factory para checkConstraints del laberinto; permite usar otro tipo de bloque "repetir" (ej. v_game_repeat). */
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

const levelInfos: LevelInfo[] = levels.map((l) => ({ id: l.id, title: l.title, blockLimit: l.blockLimit }));

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
  compileOptions: {
    START_TYPES: ["event_inicio", "event_whenflagclicked"],
    MOVE_TYPES: ["game_move"],
    BACK_TYPES: ["game_back"],
    TURN_LEFT_TYPES: ["game_turn_left"],
    TURN_RIGHT_TYPES: ["game_turn_right"],
    REPEAT_TYPES: ["game_repeat"],
    WAIT_TYPES: ["game_wait"]
  },
  checkConstraints,
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
