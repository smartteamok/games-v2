/**
 * Maze renderer - handles drawing the maze on canvas.
 */

import type { MazeLevel, MazeState, MazeGameConfig } from "./types";
import {
  MIN_CELL,
  MAX_CELL,
  PADDING_RATIO,
  DEFAULT_CELL_SIZE,
  DEFAULT_PADDING,
  WALK_FRAME_INTERVAL_MS,
  IDLE_FRAME_INTERVAL_MS,
  OBSTACLE_FRAME_INTERVAL_MS,
  GOAL_FRAME_INTERVAL_MS,
  GOAL_COLOR
} from "./constants";
import { getStatusText, getLevel } from "./logic";
import {
  getPlayerSprite,
  getPlayerSpriteFrames,
  loadObstacleSprite,
  getGoalSprite,
  getGoalSpriteFrames,
  loadBackgroundImage,
  type SpriteAnimationState
} from "./sprites";

export type AnimationRenderState = {
  playerX: number;
  playerY: number;
  playerDir: string;
  dirProgress: number;
} | null;

export type MazeRendererContext = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  statusEl: HTMLDivElement;
  containerWidth: number;
  containerHeight: number;
};

/**
 * Draw the maze to canvas.
 */
export function drawMaze(
  rendererCtx: MazeRendererContext,
  state: MazeState,
  levels: MazeLevel[],
  config: MazeGameConfig,
  animationState: AnimationRenderState,
  spriteAnimState: SpriteAnimationState
): void {
  const { canvas, ctx, statusEl, containerWidth, containerHeight } = rendererCtx;
  const level = getLevel(levels, state.levelId);
  const { gameColor, useSprites = true, wallColor = "#8B7355", gridColor = "#E5E7EB" } = config;

  // Calculate cell size
  const W = containerWidth > 0 ? containerWidth : level.gridW * DEFAULT_CELL_SIZE + DEFAULT_PADDING * 2;
  const H = containerHeight > 0 ? containerHeight : level.gridH * DEFAULT_CELL_SIZE + DEFAULT_PADDING * 2;
  const pad = Math.max(8, Math.min(W, H) * 0.04);
  const cellByW = (W - pad * 2) / level.gridW;
  const cellByH = (H - pad * 2) / level.gridH;
  const rawCell = Math.floor(Math.min(cellByW, cellByH));
  const CELL = rawCell > 0 ? Math.min(MAX_CELL, rawCell) : MIN_CELL;
  const PADDING = Math.max(6, Math.round(CELL * PADDING_RATIO));
  const width = level.gridW * CELL + PADDING * 2;
  const height = level.gridH * CELL + PADDING * 2;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cw = canvas.width;
  const ch = canvas.height;

  // Draw background
  let usedBgImage = false;
  if (level.backgroundImage && useSprites) {
    const bgImg = loadBackgroundImage(level.backgroundImage);
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

  // Draw visited cells
  const visited = state.visitedCells ?? [];
  for (const cell of visited) {
    const cellX = PADDING + cell.x * CELL;
    const cellY = PADDING + cell.y * CELL;
    ctx.fillStyle = "rgba(76, 151, 255, 0.25)";
    ctx.fillRect(cellX + 1, cellY + 1, CELL - 2, CELL - 2);
  }

  // Draw grid
  ctx.strokeStyle = gridColor;
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

  // Update obstacle animation frame
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - spriteAnimState.lastObstacleFrameTime >= OBSTACLE_FRAME_INTERVAL_MS) {
    spriteAnimState.obstacleFrame = (spriteAnimState.obstacleFrame + 1) % 2;
    spriteAnimState.lastObstacleFrameTime = now;
  }

  // Draw obstacles
  for (const wall of level.walls) {
    const wallCenterX = PADDING + wall.x * CELL + CELL / 2;
    const wallCenterY = PADDING + wall.y * CELL + CELL / 2;

    if (wall.type && useSprites) {
      const obsSprite = loadObstacleSprite(wall.type);
      if (obsSprite && obsSprite.complete && obsSprite.naturalWidth > 0) {
        const ow = obsSprite.naturalWidth;
        const oh = obsSprite.naturalHeight;
        const hasAnim = ow >= oh * 1.8;
        const frames = hasAnim ? 2 : 1;
        const fw = ow / frames;
        const fh = oh;
        const frameIdx = hasAnim ? spriteAnimState.obstacleFrame : 0;
        const sx = frameIdx * fw;
        const drawSize = CELL * 0.9;
        const drawH = (fh / fw) * drawSize;
        ctx.drawImage(obsSprite, sx, 0, fw, fh, wallCenterX - drawSize / 2, wallCenterY - drawH / 2, drawSize, drawH);
        continue;
      }
    }

    // Fallback: draw default wall
    const wallX = PADDING + wall.x * CELL + 4;
    const wallY = PADDING + wall.y * CELL + 4;
    const wallSize = CELL - 8;
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(wallX + 2, wallY + 2, wallSize, wallSize);
    ctx.fillStyle = wallColor;
    ctx.fillRect(wallX, wallY, wallSize, wallSize);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(wallX, wallY, wallSize, wallSize * 0.2);
  }

  // Update goal animation frame
  if (now - spriteAnimState.lastGoalFrameTime >= GOAL_FRAME_INTERVAL_MS) {
    spriteAnimState.goalFrame = (spriteAnimState.goalFrame + 1) % Math.max(1, getGoalSpriteFrames());
    spriteAnimState.lastGoalFrameTime = now;
  }

  // Draw goal
  const goalCenterX = PADDING + level.goal.x * CELL + CELL / 2;
  const goalCenterY = PADDING + level.goal.y * CELL + CELL / 2;
  const gSprite = useSprites ? getGoalSprite() : null;
  const useGoalSprite = gSprite && gSprite.complete && gSprite.naturalWidth > 0;

  if (useGoalSprite) {
    const gw = gSprite!.naturalWidth;
    const gh = gSprite!.naturalHeight;
    const gFrames = getGoalSpriteFrames();
    const gfw = gw / gFrames;
    const gfh = gh;
    const gFrameIdx = gFrames > 1 ? spriteAnimState.goalFrame : 0;
    const gsx = gFrameIdx * gfw;
    const gDrawSize = CELL * 0.9;
    const gDrawH = (gfh / gfw) * gDrawSize;
    ctx.drawImage(gSprite!, gsx, 0, gfw, gfh, goalCenterX - gDrawSize / 2, goalCenterY - gDrawH / 2, gDrawSize, gDrawH);
  } else {
    // Fallback: draw goal circle
    const goalRadius = CELL * 0.25;
    const glowGradient = ctx.createRadialGradient(goalCenterX, goalCenterY, 0, goalCenterX, goalCenterY, goalRadius * 2);
    glowGradient.addColorStop(0, "rgba(16, 185, 129, 0.3)");
    glowGradient.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(goalCenterX, goalCenterY, goalRadius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = GOAL_COLOR;
    ctx.beginPath();
    ctx.arc(goalCenterX, goalCenterY, goalRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(goalCenterX - goalRadius * 0.3, goalCenterY - goalRadius * 0.3, goalRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Get player position (animated or actual)
  const playerX = animationState
    ? PADDING + animationState.playerX * CELL + CELL / 2
    : PADDING + state.player.x * CELL + CELL / 2;
  const playerY = animationState
    ? PADDING + animationState.playerY * CELL + CELL / 2
    : PADDING + state.player.y * CELL + CELL / 2;
  const playerDir = animationState ? animationState.playerDir : state.player.dir;
  const size = CELL * 0.6;

  // Update walk/idle animation frame
  if (animationState) {
    if (now - spriteAnimState.lastWalkFrameTime >= WALK_FRAME_INTERVAL_MS) {
      spriteAnimState.walkFrame += 1;
      spriteAnimState.lastWalkFrameTime = now;
    }
  } else {
    if (now - spriteAnimState.lastIdleFrameTime >= IDLE_FRAME_INTERVAL_MS) {
      spriteAnimState.idleFrame = (spriteAnimState.idleFrame + 1) % 2;
      spriteAnimState.lastIdleFrameTime = now;
    }
  }

  // Draw player
  const sprite = useSprites ? getPlayerSprite() : null;
  const useSpritePlayer = sprite && sprite.complete && sprite.naturalWidth > 0;

  if (useSpritePlayer) {
    const w = sprite!.naturalWidth;
    const h = sprite!.naturalHeight;
    const n = getPlayerSpriteFrames();
    const fw = w / n;
    const fh = h;
    const dirIndex = playerDir === "N" ? 0 : playerDir === "E" ? 1 : playerDir === "S" ? 2 : 3;
    const framesPerDir = n / 4;
    const currentFrame = animationState ? spriteAnimState.walkFrame : spriteAnimState.idleFrame;
    const animFrame = framesPerDir > 1 ? (currentFrame % Math.floor(framesPerDir)) : 0;
    const frameIndex = Math.min(dirIndex * Math.floor(framesPerDir) + animFrame, n - 1);
    const sx = frameIndex * fw;
    const drawW = CELL * 1.2;
    const drawH = (fh / fw) * drawW;
    ctx.drawImage(sprite!, sx, 0, fw, fh, playerX - drawW / 2, playerY - drawH / 2, drawW, drawH);
  } else {
    // Fallback: draw triangle player
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
    ctx.fillStyle = gameColor;
    ctx.fill();
  }

  // Update status text
  statusEl.textContent = getStatusText(state);
}

/**
 * Simplified draw function for games that don't use sprites.
 */
export function drawMazeSimple(
  rendererCtx: MazeRendererContext,
  state: MazeState,
  levels: MazeLevel[],
  config: MazeGameConfig,
  animationState: AnimationRenderState
): void {
  const { canvas, ctx, statusEl } = rendererCtx;
  const level = getLevel(levels, state.levelId);
  const { gameColor, wallColor = "#7C3AED", gridColor = "#E9D5FF" } = config;

  const CELL = DEFAULT_CELL_SIZE;
  const PADDING = DEFAULT_PADDING;
  const width = level.gridW * CELL + PADDING * 2;
  const height = level.gridH * CELL + PADDING * 2;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGradient.addColorStop(0, "#FFFFFF");
  bgGradient.addColorStop(1, "#FAF5FF");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = gridColor;
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

  // Walls
  for (const wall of level.walls) {
    const wallX = PADDING + wall.x * CELL + 4;
    const wallY = PADDING + wall.y * CELL + 4;
    const wallSize = CELL - 8;
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(wallX + 2, wallY + 2, wallSize, wallSize);
    ctx.fillStyle = wallColor;
    ctx.fillRect(wallX, wallY, wallSize, wallSize);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(wallX, wallY, wallSize, wallSize * 0.2);
  }

  // Goal
  const goalX = PADDING + level.goal.x * CELL + CELL / 2;
  const goalY = PADDING + level.goal.y * CELL + CELL / 2;
  const goalRadius = CELL * 0.25;
  const glowGradient = ctx.createRadialGradient(goalX, goalY, 0, goalX, goalY, goalRadius * 2);
  glowGradient.addColorStop(0, "rgba(16, 185, 129, 0.3)");
  glowGradient.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(goalX, goalY, goalRadius * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GOAL_COLOR;
  ctx.beginPath();
  ctx.arc(goalX, goalY, goalRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.beginPath();
  ctx.arc(goalX - goalRadius * 0.3, goalY - goalRadius * 0.3, goalRadius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Player
  const playerX = animationState
    ? PADDING + animationState.playerX * CELL + CELL / 2
    : PADDING + state.player.x * CELL + CELL / 2;
  const playerY = animationState
    ? PADDING + animationState.playerY * CELL + CELL / 2
    : PADDING + state.player.y * CELL + CELL / 2;
  const playerDir = animationState ? animationState.playerDir : state.player.dir;
  const size = CELL * 0.28;

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
  ctx.fillStyle = gameColor;
  ctx.fill();

  // Status
  statusEl.textContent = getStatusText(state);
}
