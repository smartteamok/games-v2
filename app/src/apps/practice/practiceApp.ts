import type {
  AppDefinition,
  AppRenderContext,
  LevelInfo,
  RuntimeAdapter
} from "../types";
import { MAZE_LIKE_TOOLBOX_XML, registerMazeLikeBlocks } from "../maze/mazeApp";
import type { Direction, MazeLevel } from "../maze/levels";
import { practiceLevels } from "./levels";
import { animateMoveAsync, animateTurnAsync } from "../maze/animation";

type MazeStatus = "idle" | "running" | "win" | "error";

type MazeState = {
  levelId: number;
  player: { x: number; y: number; dir: Direction };
  status: MazeStatus;
  message?: string;
  completedLevels?: number[];
};

type MazeUI = {
  rootEl: HTMLElement;
  container: HTMLElement;
  progressBar: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  statusEl: HTMLDivElement;
};

const GAME_COLOR = "#9B59B6";
const CELL = 48;
const PADDING = 12;

const DIR_ORDER: Direction[] = ["N", "E", "S", "W"];
const DIR_DELTAS: Record<Direction, { x: number; y: number }> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 }
};

let ui: MazeUI | null = null;
let animationState: { playerX: number; playerY: number; playerDir: string; dirProgress: number } | null = null;

const getLevel = (levelId: number): MazeLevel =>
  practiceLevels.find((level) => level.id === levelId) ?? practiceLevels[0];

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
  if (state.message) return state.message;
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
  if (!canvasCtx) throw new Error("No se pudo crear el canvas.");

  const statusEl = document.createElement("div");
  statusEl.className = "maze-status";

  container.appendChild(progressBar);
  container.appendChild(canvas);
  container.appendChild(statusEl);
  rootEl.appendChild(container);

  // Guardar contexto en rootEl para acceso desde updateProgressBar
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
        const nextState = makeInitialState(level.id, completedLevels);
        ctx.updateState(nextState);
        ctx.setStatus(`Nivel ${level.id} listo`);
      }
    });

    ui.progressBar.appendChild(levelBtn);
  }
};

const drawMaze = (state: MazeState): void => {
  if (!ui) return;
  const level = getLevel(state.levelId);
  const width = level.gridW * CELL + PADDING * 2;
  const height = level.gridH * CELL + PADDING * 2;
  if (ui.canvas.width !== width || ui.canvas.height !== height) {
    ui.canvas.width = width;
    ui.canvas.height = height;
  }

  const ctx = ui.ctx;
  ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);

  // Fondo con gradiente sutil (tema violeta)
  const bgGradient = ctx.createLinearGradient(0, 0, ui.canvas.width, ui.canvas.height);
  bgGradient.addColorStop(0, "#FFFFFF");
  bgGradient.addColorStop(1, "#FAF5FF");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);

  // Grid más sutil
  ctx.strokeStyle = "#E9D5FF";
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

  // Paredes con efecto 3D (violeta con sombra)
  for (const wall of level.walls) {
    const wallX = PADDING + wall.x * CELL + 4;
    const wallY = PADDING + wall.y * CELL + 4;
    const wallSize = CELL - 8;

    // Sombra
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(wallX + 2, wallY + 2, wallSize, wallSize);

    // Pared principal (violeta)
    ctx.fillStyle = "#7C3AED";
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

const adapter: RuntimeAdapter<MazeState> = {
  applyOp: async (op, state) => {
    const level = getLevel(state.levelId);
    if (state.status === "win" || state.status === "error") return state;

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
      const delta = DIR_DELTAS[state.player.dir];
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

        if (state.player.x === level.goal.x && state.player.y === level.goal.y) {
          // Marcar nivel como completado
          const completedLevels = state.completedLevels ?? [];
          if (!completedLevels.includes(state.levelId)) {
            completedLevels.push(state.levelId);
            state.completedLevels = completedLevels;
          }

          // Verificar si hay siguiente nivel
          const nextLevel = practiceLevels.find((l) => l.id === state.levelId + 1);
          state.status = "win";
          state.message = nextLevel ? `¡Llegaste! Avanzando al nivel ${nextLevel.id}...` : "¡Llegaste! ¡Completaste todos los niveles!";
          drawMaze(state);
          throw new Error("WIN");
        }

        drawMaze(state);
      }

      return state;
    }

    if (op.kind === "wait") return state;
    return state;
  },
  reset: (state) => {
    animationState = null;
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

const levelInfos: LevelInfo[] = practiceLevels.map((l) => ({ id: l.id, title: l.title }));

export const practiceApp: AppDefinition<MazeState> = {
  id: "practice",
  title: "Práctica",
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
  serializeState: (state) => ({
    levelId: state.levelId,
    player: state.player,
    status: state.status,
    message: state.message,
    completedLevels: state.completedLevels ?? []
  }),
  deserializeState: (raw) => {
    if (!raw || typeof raw !== "object") return makeInitialState(1, []);
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
