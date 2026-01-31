/**
 * Renderer for Artist (turtle graphics) games.
 */

import type { ArtistState, ArtistGameConfig, ArtistUI, Line, Point } from "./types";
import { getStatusText, degreesToRadians } from "./logic";

/**
 * Draw the entire canvas.
 */
export const drawArtistCanvas = (
  ui: ArtistUI,
  state: ArtistState,
  config: ArtistGameConfig
): void => {
  const { canvas, ctx, statusEl } = ui;
  const {
    canvasWidth,
    canvasHeight,
    backgroundColor,
    gridColor,
    showGrid,
    turtleColor,
    turtleSize
  } = config;

  // Set canvas size
  if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }

  // Clear canvas
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw grid if enabled
  if (showGrid && gridColor) {
    drawGrid(ctx, canvasWidth, canvasHeight, gridColor);
  }

  // Draw all lines
  for (const line of state.lines) {
    drawLine(ctx, line);
  }

  // Draw turtle
  drawTurtle(ctx, state.x, state.y, state.angle, turtleColor, turtleSize, state.penDown);

  // Update status
  statusEl.textContent = getStatusText(state);
};

/**
 * Draw grid lines.
 */
const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  spacing: number = 20
): void => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;

  // Vertical lines
  for (let x = spacing; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = spacing; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Center crosshair
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
};

/**
 * Draw a single line.
 */
const drawLine = (ctx: CanvasRenderingContext2D, line: Line): void => {
  ctx.strokeStyle = line.color;
  ctx.lineWidth = line.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(line.from.x, line.from.y);
  ctx.lineTo(line.to.x, line.to.y);
  ctx.stroke();
};

/**
 * Draw the turtle (triangle pointing in direction of movement).
 */
const drawTurtle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string,
  size: number,
  penDown: boolean
): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-degreesToRadians(angle)); // Negative because canvas Y is inverted

  // Draw turtle body (triangle)
  ctx.fillStyle = color;
  ctx.strokeStyle = penDown ? "#000" : "#999";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(size, 0); // Front point
  ctx.lineTo(-size * 0.6, -size * 0.6); // Back left
  ctx.lineTo(-size * 0.3, 0); // Back indent
  ctx.lineTo(-size * 0.6, size * 0.6); // Back right
  ctx.closePath();

  ctx.fill();
  ctx.stroke();

  // Draw pen indicator
  if (penDown) {
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(size * 0.3, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

/**
 * Animate a line being drawn.
 */
export const animateLineDrawing = (
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  width: number,
  duration: number,
  onProgress: (x: number, y: number) => void
): Promise<void> => {
  return new Promise((resolve) => {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Calculate current point
      const currentX = from.x + (to.x - from.x) * progress;
      const currentY = from.y + (to.y - from.y) * progress;

      // Draw partial line
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      onProgress(currentX, currentY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
};

/**
 * Create default config.
 */
export const createDefaultConfig = (): ArtistGameConfig => ({
  canvasWidth: 400,
  canvasHeight: 400,
  backgroundColor: "#FFFFFF",
  gridColor: "#E5E7EB",
  showGrid: true,
  turtleColor: "#4C97FF",
  turtleSize: 15,
  defaultPenColor: "#000000",
  defaultPenWidth: 3
});
