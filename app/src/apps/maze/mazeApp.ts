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

type MazeState = {
  levelId: number;
  player: { x: number; y: number; dir: Direction };
  status: MazeStatus;
  message?: string;
  completedLevels?: number[]; // IDs de niveles completados
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
const CELL = 48;
const PADDING = 12;

const BASE_URL = import.meta.env.BASE_URL;

const ICON_MOVE = `${BASE_URL}game-icons/move-right.svg`;
const ICON_BACK = `${BASE_URL}game-icons/move-left.svg`;
const ICON_TURN_LEFT = `${BASE_URL}game-icons/turn-left.svg`;
const ICON_TURN_RIGHT = `${BASE_URL}game-icons/turn-right.svg`;

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

const getLevel = (levelId: number): MazeLevel =>
  levels.find((level) => level.id === levelId) ?? levels[0];

const makeInitialState = (levelId: number, completedLevels: number[] = []): MazeState => {
  const level = getLevel(levelId);
  return {
    levelId: level.id,
    player: { ...level.start },
    status: "idle",
    message: undefined,
    completedLevels
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

const ensureUI = (rootEl: HTMLElement, ctx: AppRenderContext<MazeState>): MazeUI => {
  if (ui && ui.rootEl === rootEl && rootEl.contains(ui.container)) {
    return ui;
  }
  rootEl.innerHTML = "";

  const container = document.createElement("div");
  container.className = "maze-stage";

  // Barra de progreso de niveles
  const progressBar = document.createElement("div");
  progressBar.className = "maze-progress-bar";
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-label", "Niveles del juego");

  const canvas = document.createElement("canvas");
  canvas.className = "maze-canvas";
  const canvasCtx = canvas.getContext("2d");
  if (!canvasCtx) {
    throw new Error("No se pudo crear el canvas del laberinto.");
  }

  const statusEl = document.createElement("div");
  statusEl.className = "maze-status";

  // Botón Play/Restart grande
  const stagePlayButton = createStagePlayButton();

  container.appendChild(progressBar);
  container.appendChild(canvas);
  rootEl.appendChild(container);
  rootEl.appendChild(stagePlayButton);
  
  // Crear contenedor para el status a la derecha del maze
  const statusContainer = document.createElement("div");
  statusContainer.className = "maze-status-container";
  statusContainer.appendChild(statusEl);
  rootEl.appendChild(statusContainer);

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
  
  // Actualizar status en su nuevo contenedor
  if (statusEl) {
    statusEl.textContent = updateStatusText(ctx.getState?.() as MazeState | undefined);
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
  const button = document.querySelector(".stage-play-button") as HTMLButtonElement;
  if (button) {
    updateStagePlayButtonState(button, state);
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

// Exportar función para abrir el panel desde main.ts
export const toggleSkillsPanel = (): void => {
  const panel = document.querySelector(".skills-panel") as HTMLElement;
  if (panel?.classList.contains("open")) {
    closeSkillsPanel();
  } else {
    openSkillsPanel();
  }
};

const updateProgressBar = (state?: MazeState): void => {
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

const drawMaze = (state: MazeState): void => {
  if (!ui) {
    return;
  }
  const level = getLevel(state.levelId);
  const width = level.gridW * CELL + PADDING * 2;
  const height = level.gridH * CELL + PADDING * 2;
  if (ui.canvas.width !== width || ui.canvas.height !== height) {
    ui.canvas.width = width;
    ui.canvas.height = height;
  }

  const ctx = ui.ctx;
  ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);

  // Fondo con gradiente sutil
  const bgGradient = ctx.createLinearGradient(0, 0, ui.canvas.width, ui.canvas.height);
  bgGradient.addColorStop(0, "#FFFFFF");
  bgGradient.addColorStop(1, "#FAFAFA");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);

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

  // Paredes con efecto 3D (marrón/beige con sombra)
  for (const wall of level.walls) {
    const wallX = PADDING + wall.x * CELL + 4;
    const wallY = PADDING + wall.y * CELL + 4;
    const wallSize = CELL - 8;

    // Sombra
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(wallX + 2, wallY + 2, wallSize, wallSize);

    // Pared principal
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(wallX, wallY, wallSize, wallSize);

    // Highlight superior
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(wallX, wallY, wallSize, wallSize * 0.2);
  }

  // Meta con glow (verde brillante)
  const goalX = PADDING + level.goal.x * CELL + CELL / 2;
  const goalY = PADDING + level.goal.y * CELL + CELL / 2;
  const goalRadius = CELL * 0.25;

  // Glow exterior
  const glowGradient = ctx.createRadialGradient(goalX, goalY, 0, goalX, goalY, goalRadius * 2);
  glowGradient.addColorStop(0, "rgba(16, 185, 129, 0.3)");
  glowGradient.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(goalX, goalY, goalRadius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Meta principal
  ctx.fillStyle = "#10B981";
  ctx.beginPath();
  ctx.arc(goalX, goalY, goalRadius, 0, Math.PI * 2);
  ctx.fill();

  // Highlight en la meta
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.beginPath();
  ctx.arc(goalX - goalRadius * 0.3, goalY - goalRadius * 0.3, goalRadius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Jugador con outline blanco
  // Usar estado de animación si existe, sino usar estado real
  const playerX = animationState
    ? PADDING + animationState.playerX * CELL + CELL / 2
    : PADDING + state.player.x * CELL + CELL / 2;
  const playerY = animationState
    ? PADDING + animationState.playerY * CELL + CELL / 2
    : PADDING + state.player.y * CELL + CELL / 2;
  const playerDir = animationState ? animationState.playerDir : state.player.dir;
  const size = CELL * 0.28;

  // Outline blanco
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

  // Jugador principal
  ctx.fillStyle = GAME_COLOR;
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
  ctx.fill();

  ui.statusEl.textContent = updateStatusText(state);
};

export const registerMazeLikeBlocks = (Blockly: any) => {
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

const adapter: RuntimeAdapter<MazeState> = {
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
    animationState = null; // Limpiar animación
    const completedLevels = state.completedLevels ?? [];
    const next = makeInitialState(state.levelId, completedLevels);
    state.levelId = next.levelId;
    state.player = { ...next.player };
    state.status = next.status;
    state.message = next.message;
    state.completedLevels = completedLevels;
    drawMaze(state);
    return state;
  }
};

const checkConstraints = (workspace: unknown, state: MazeState): ConstraintResult => {
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
        type !== "event_whenflagclicked"
    );
  if (constraints.maxBlocks !== undefined && blockTypes.length > constraints.maxBlocks) {
    return { ok: false, message: `Usá máximo ${constraints.maxBlocks} bloques.` };
  }
  if (constraints.mustUseRepeat) {
    const hasRepeat = blockTypes.some((type) => type === "game_repeat");
    if (!hasRepeat) {
      return { ok: false, message: "Tenés que usar un bloque de repetir." };
    }
  }
  return { ok: true };
};

const levelInfos: LevelInfo[] = levels.map((l) => ({ id: l.id, title: l.title }));

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
    START_TYPES: ["event_whenflagclicked"],
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
