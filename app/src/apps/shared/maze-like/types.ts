/**
 * Shared types for maze-like games.
 */

export type Direction = "N" | "E" | "S" | "W";

export type MazeStatus = "idle" | "running" | "win" | "error";

/** Obstáculo en el maze. type define qué sprite usar (ej: "rock", "tree", "box"). */
export type Obstacle = {
  x: number;
  y: number;
  type?: string;
};

export type MazeLevel = {
  id: number;
  title: string;
  gridW: number;
  gridH: number;
  walls: Array<Obstacle>;
  start: { x: number; y: number; dir: Direction };
  goal: { x: number; y: number };
  constraints?: { maxBlocks?: number; mustUseRepeat?: boolean };
  blockLimit?: number;
  /** Imagen de fondo del canvas. Ruta relativa a public/game-sprites/backgrounds/ */
  backgroundImage?: string;
  /** Instrucciones iniciales para el nivel */
  instructions?: string;
  /** Bloques iniciales (Blockly XML) para horizontal */
  initialBlocks?: string;
  /** Bloques iniciales (Blockly XML) para vertical */
  initialBlocksVertical?: string;
};

export type MazeState = {
  levelId: number;
  player: { x: number; y: number; dir: Direction };
  status: MazeStatus;
  message?: string;
  completedLevels?: number[];
  visitedCells?: Array<{ x: number; y: number }>;
};

export type MazeUI = {
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

/** Configuración visual para un juego maze-like */
export type MazeGameConfig = {
  gameColor: string;
  /** Usar sprites animados (player, obstacles, goal) */
  useSprites?: boolean;
  /** Color de las paredes cuando no hay sprites */
  wallColor?: string;
  /** Color del fondo del grid */
  gridColor?: string;
};

/** Configuración completa para crear un juego maze-like */
export type MazeLikeAppConfig = {
  id: string;
  title: string;
  blockType: "horizontal" | "vertical";
  levels: MazeLevel[];
  toolboxXml: string;
  registerBlocks: (Blockly: unknown) => void;
  compileOptions: {
    START_TYPES: string[];
    MOVE_TYPES: string[];
    BACK_TYPES?: string[];
    TURN_LEFT_TYPES: string[];
    TURN_RIGHT_TYPES: string[];
    REPEAT_TYPES: string[];
    WAIT_TYPES: string[];
  };
  gameConfig: MazeGameConfig;
  /** Tipo de bloque repeat para checkConstraints */
  repeatBlockType?: string;
};
