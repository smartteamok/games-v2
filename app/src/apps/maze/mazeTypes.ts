/**
 * Tipos compartidos para el juego de laberinto.
 */
import type { Direction } from "./levels";

export type MazeStatus = "idle" | "running" | "win" | "error";

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

export type AnimationState = {
  playerX: number;
  playerY: number;
  playerDir: string;
  dirProgress: number;
} | null;

export type BlockType = "horizontal" | "vertical";

// Constantes compartidas
export const GAME_COLOR = "#4C97FF";
export const GAME_ICON_SIZE = 42;
export const MIN_CELL = 12;
export const MAX_CELL = 128;
export const PADDING_RATIO = 0.25;

export const DIR_ORDER: Direction[] = ["N", "E", "S", "W"];
export const DIR_DELTAS: Record<Direction, { x: number; y: number }> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 }
};
