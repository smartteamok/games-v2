/**
 * Types for Artist (turtle graphics) games.
 */

export type Point = {
  x: number;
  y: number;
};

export type Line = {
  from: Point;
  to: Point;
  color: string;
  width: number;
};

export type ArtistStatus = "idle" | "running" | "complete" | "error";

export type ArtistState = {
  levelId: number;
  // Turtle position and orientation
  x: number;
  y: number;
  angle: number; // degrees, 0 = right, 90 = up
  // Pen state
  penDown: boolean;
  penColor: string;
  penWidth: number;
  // Drawing history
  lines: Line[];
  // Game status
  status: ArtistStatus;
  message?: string;
  completedLevels?: number[];
};

export type ArtistLevel = {
  id: number;
  title: string;
  instructions: string;
  // Canvas size
  width: number;
  height: number;
  // Starting position
  startX: number;
  startY: number;
  startAngle: number;
  // Target shape (for validation)
  targetLines?: Line[];
  targetImage?: string;
  // Constraints
  blockLimit?: number;
  constraints?: {
    maxBlocks?: number;
    mustUseRepeat?: boolean;
    requiredShape?: string;
  };
  // Initial blocks
  initialBlocks?: string;
  initialBlocksVertical?: string;
};

export type ArtistGameConfig = {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  gridColor?: string;
  showGrid?: boolean;
  turtleColor: string;
  turtleSize: number;
  defaultPenColor: string;
  defaultPenWidth: number;
};

export type ArtistUI = {
  rootEl: HTMLElement;
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  statusEl: HTMLDivElement;
  progressBar?: HTMLElement;
};
