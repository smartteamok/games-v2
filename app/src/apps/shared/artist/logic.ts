/**
 * Game logic for Artist (turtle graphics) games.
 */

import type { ArtistState, ArtistLevel, Line, Point } from "./types";

/**
 * Convert degrees to radians.
 */
export const degreesToRadians = (degrees: number): number =>
  (degrees * Math.PI) / 180;

/**
 * Normalize angle to 0-360 range.
 */
export const normalizeAngle = (angle: number): number => {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
};

/**
 * Calculate end point given start, angle, and distance.
 */
export const calculateEndPoint = (
  startX: number,
  startY: number,
  angle: number,
  distance: number
): Point => {
  const radians = degreesToRadians(angle);
  return {
    x: startX + Math.cos(radians) * distance,
    y: startY - Math.sin(radians) * distance // Y is inverted in canvas
  };
};

/**
 * Get level by ID.
 */
export const getLevel = (levels: ArtistLevel[], levelId: number): ArtistLevel =>
  levels.find((l) => l.id === levelId) ?? levels[0];

/**
 * Create initial state for a level.
 */
export const makeInitialState = (
  levels: ArtistLevel[],
  levelId: number,
  completedLevels: number[] = []
): ArtistState => {
  const level = getLevel(levels, levelId);
  return {
    levelId: level.id,
    x: level.startX,
    y: level.startY,
    angle: level.startAngle,
    penDown: true,
    penColor: "#000000",
    penWidth: 3,
    lines: [],
    status: "idle",
    message: undefined,
    completedLevels
  };
};

/**
 * Move the turtle forward, drawing a line if pen is down.
 */
export const moveForward = (
  state: ArtistState,
  distance: number
): { state: ArtistState; line?: Line } => {
  const endPoint = calculateEndPoint(state.x, state.y, state.angle, distance);
  
  let line: Line | undefined;
  if (state.penDown) {
    line = {
      from: { x: state.x, y: state.y },
      to: endPoint,
      color: state.penColor,
      width: state.penWidth
    };
    state.lines = [...state.lines, line];
  }
  
  state.x = endPoint.x;
  state.y = endPoint.y;
  
  return { state, line };
};

/**
 * Move the turtle backward.
 */
export const moveBackward = (
  state: ArtistState,
  distance: number
): { state: ArtistState; line?: Line } => {
  return moveForward(state, -distance);
};

/**
 * Turn the turtle left (counterclockwise).
 */
export const turnLeft = (state: ArtistState, degrees: number): ArtistState => {
  state.angle = normalizeAngle(state.angle + degrees);
  return state;
};

/**
 * Turn the turtle right (clockwise).
 */
export const turnRight = (state: ArtistState, degrees: number): ArtistState => {
  state.angle = normalizeAngle(state.angle - degrees);
  return state;
};

/**
 * Set pen up (stop drawing).
 */
export const penUp = (state: ArtistState): ArtistState => {
  state.penDown = false;
  return state;
};

/**
 * Set pen down (start drawing).
 */
export const penDown = (state: ArtistState): ArtistState => {
  state.penDown = true;
  return state;
};

/**
 * Set pen color.
 */
export const setColor = (state: ArtistState, color: string): ArtistState => {
  state.penColor = color;
  return state;
};

/**
 * Set pen width.
 */
export const setWidth = (state: ArtistState, width: number): ArtistState => {
  state.penWidth = Math.max(1, width);
  return state;
};

/**
 * Get status text.
 */
export const getStatusText = (state: ArtistState): string => {
  if (state.message) return state.message;
  switch (state.status) {
    case "running":
      return "Dibujando...";
    case "complete":
      return "¡Completado!";
    case "error":
      return "Error";
    default:
      return "Listo.";
  }
};

/**
 * Compare drawn lines with target (simple validation).
 */
export const validateDrawing = (
  drawnLines: Line[],
  targetLines: Line[],
  tolerance: number = 10
): boolean => {
  if (drawnLines.length !== targetLines.length) return false;
  
  // Simple check: compare line endpoints with tolerance
  for (let i = 0; i < targetLines.length; i++) {
    const drawn = drawnLines[i];
    const target = targetLines[i];
    
    const fromDist = Math.hypot(drawn.from.x - target.from.x, drawn.from.y - target.from.y);
    const toDist = Math.hypot(drawn.to.x - target.to.x, drawn.to.y - target.to.y);
    
    if (fromDist > tolerance || toDist > tolerance) {
      return false;
    }
  }
  
  return true;
};
