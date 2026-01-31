/**
 * Rendering del laberinto en canvas.
 */
import type { MazeState, AnimationState } from "./mazeTypes";
import { GAME_COLOR, MIN_CELL, MAX_CELL, PADDING_RATIO } from "./mazeTypes";
import { getLevel, updateStatusText } from "./mazeLogic";
import { getUI, getMazeContainerSize, setDrawMazeFunc } from "./mazeUI";
import {
  loadPlayerSprite,
  loadObstacleSprite,
  loadGoalSprite,
  loadMazeBackgroundImage,
  getPlayerSpriteFrames,
  getGoalSpriteFrames,
  getWalkFrame,
  setWalkFrame,
  getLastWalkFrameTime,
  setLastWalkFrameTime,
  getIdleFrame,
  setIdleFrame,
  getLastIdleFrameTime,
  setLastIdleFrameTime,
  getObstacleFrame,
  setObstacleFrame,
  getLastObstacleFrameTime,
  setLastObstacleFrameTime,
  getGoalFrame,
  setGoalFrame,
  getLastGoalFrameTime,
  setLastGoalFrameTime,
  WALK_FRAME_INTERVAL_MS,
  IDLE_FRAME_INTERVAL_MS,
  OBSTACLE_FRAME_INTERVAL_MS,
  GOAL_FRAME_INTERVAL_MS
} from "./mazeSprites";

// Estado de animación temporal (compartido con el adapter)
let animationState: AnimationState = null;

export const getAnimationState = (): AnimationState => animationState;
export const setAnimationState = (state: AnimationState): void => { animationState = state; };

export const drawMaze = (state: MazeState): void => {
  const ui = getUI();
  if (!ui) return;
  
  const level = getLevel(state.levelId);
  const { w: mazeContainerW, h: mazeContainerH } = getMazeContainerSize();
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

  // Fondo
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

  // Celdas visitadas
  const visited = state.visitedCells ?? [];
  for (const cell of visited) {
    const cellX = PADDING + cell.x * CELL;
    const cellY = PADDING + cell.y * CELL;
    ctx.fillStyle = "rgba(76, 151, 255, 0.25)";
    ctx.fillRect(cellX + 1, cellY + 1, CELL - 2, CELL - 2);
  }

  // Grid
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

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();

  // Obstáculos animados
  if (now - getLastObstacleFrameTime() >= OBSTACLE_FRAME_INTERVAL_MS) {
    setObstacleFrame((getObstacleFrame() + 1) % 2);
    setLastObstacleFrameTime(now);
  }

  for (const wall of level.walls) {
    const wallCenterX = PADDING + wall.x * CELL + CELL / 2;
    const wallCenterY = PADDING + wall.y * CELL + CELL / 2;

    if (wall.type) {
      const obsSprite = loadObstacleSprite(wall.type);
      if (obsSprite && obsSprite.complete && obsSprite.naturalWidth > 0) {
        const ow = obsSprite.naturalWidth;
        const oh = obsSprite.naturalHeight;
        const hasAnim = ow >= oh * 1.8;
        const frames = hasAnim ? 2 : 1;
        const fw = ow / frames;
        const fh = oh;
        const frameIdx = hasAnim ? getObstacleFrame() : 0;
        const sx = frameIdx * fw;
        const drawSize = CELL * 0.9;
        const drawH = (fh / fw) * drawSize;
        ctx.drawImage(obsSprite, sx, 0, fw, fh, wallCenterX - drawSize / 2, wallCenterY - drawH / 2, drawSize, drawH);
        continue;
      }
    }

    // Fallback
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

  // Meta animada
  if (now - getLastGoalFrameTime() >= GOAL_FRAME_INTERVAL_MS) {
    setGoalFrame((getGoalFrame() + 1) % Math.max(1, getGoalSpriteFrames()));
    setLastGoalFrameTime(now);
  }

  const goalCenterX = PADDING + level.goal.x * CELL + CELL / 2;
  const goalCenterY = PADDING + level.goal.y * CELL + CELL / 2;
  const gSprite = loadGoalSprite();
  const useGoalSprite = gSprite && gSprite.complete && gSprite.naturalWidth > 0;

  if (useGoalSprite) {
    const gw = gSprite!.naturalWidth;
    const gh = gSprite!.naturalHeight;
    const gFrames = getGoalSpriteFrames();
    const gfw = gw / gFrames;
    const gfh = gh;
    const gFrameIdx = gFrames > 1 ? getGoalFrame() : 0;
    const gsx = gFrameIdx * gfw;
    const gDrawSize = CELL * 0.9;
    const gDrawH = (gfh / gfw) * gDrawSize;
    ctx.drawImage(gSprite!, gsx, 0, gfw, gfh, goalCenterX - gDrawSize / 2, goalCenterY - gDrawH / 2, gDrawSize, gDrawH);
  } else {
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

  // Jugador
  const playerX = animationState
    ? PADDING + animationState.playerX * CELL + CELL / 2
    : PADDING + state.player.x * CELL + CELL / 2;
  const playerY = animationState
    ? PADDING + animationState.playerY * CELL + CELL / 2
    : PADDING + state.player.y * CELL + CELL / 2;
  const playerDir = animationState ? animationState.playerDir : state.player.dir;
  const size = CELL * 0.6;

  // Frame de animación del jugador
  if (animationState) {
    if (now - getLastWalkFrameTime() >= WALK_FRAME_INTERVAL_MS) {
      setWalkFrame(getWalkFrame() + 1);
      setLastWalkFrameTime(now);
    }
  } else {
    if (now - getLastIdleFrameTime() >= IDLE_FRAME_INTERVAL_MS) {
      setIdleFrame((getIdleFrame() + 1) % 2);
      setLastIdleFrameTime(now);
    }
  }

  const sprite = loadPlayerSprite();
  const useSprite = sprite && sprite.complete && sprite.naturalWidth > 0;

  if (useSprite) {
    const w = sprite!.naturalWidth;
    const h = sprite!.naturalHeight;
    const n = getPlayerSpriteFrames();
    const fw = w / n;
    const fh = h;
    const dirIndex = playerDir === "N" ? 0 : playerDir === "E" ? 1 : playerDir === "S" ? 2 : 3;
    const framesPerDir = n / 4;
    const currentFrame = animationState ? getWalkFrame() : getIdleFrame();
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
    // Fallback: triángulo
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

// Registrar drawMaze en mazeUI para poder llamarlo desde resize observer
setDrawMazeFunc(drawMaze);
