/**
 * Carga y manejo de sprites para el laberinto.
 */
import { levels } from "./levels";

const BASE_URL = import.meta.env.BASE_URL;

// Sprite del personaje
let playerSprite: HTMLImageElement | null = null;
let playerSpriteFrames = 4;
let spriteLoadCallback: (() => void) | null = null;

// Frame de animación del personaje
let walkFrame = 0;
let lastWalkFrameTime = 0;
let idleFrame = 0;
let lastIdleFrameTime = 0;

export const WALK_FRAME_INTERVAL_MS = 120;
export const IDLE_FRAME_INTERVAL_MS = 400;

// Sprites de obstáculos
const obstacleSprites: Map<string, HTMLImageElement> = new Map();
let obstacleFrame = 0;
let lastObstacleFrameTime = 0;
export const OBSTACLE_FRAME_INTERVAL_MS = 500;

// Sprite de la meta
let goalSprite: HTMLImageElement | null = null;
let goalSpriteFrames = 1;
let goalFrame = 0;
let lastGoalFrameTime = 0;
export const GOAL_FRAME_INTERVAL_MS = 400;

// Imágenes de fondo
const mazeBackgroundImages: Map<string, HTMLImageElement> = new Map();

export const loadPlayerSprite = (onLoaded?: () => void): HTMLImageElement | null => {
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

export const getPlayerSpriteFrames = (): number => playerSpriteFrames;

export const loadObstacleSprite = (type: string): HTMLImageElement | null => {
  if (obstacleSprites.has(type)) return obstacleSprites.get(type) ?? null;
  const img = new Image();
  img.src = `${BASE_URL}game-sprites/obstacles/${type}.png`;
  obstacleSprites.set(type, img);
  return img;
};

export const loadGoalSprite = (): HTMLImageElement | null => {
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

export const getGoalSpriteFrames = (): number => goalSpriteFrames;

export const loadMazeBackgroundImage = (filename: string): HTMLImageElement | null => {
  if (mazeBackgroundImages.has(filename)) return mazeBackgroundImages.get(filename) ?? null;
  const img = new Image();
  img.src = `${BASE_URL}game-sprites/backgrounds/${filename}`;
  mazeBackgroundImages.set(filename, img);
  return img;
};

/** Precarga sprites de obstáculos usados en los niveles. */
export const preloadObstacleSprites = (): void => {
  const types = new Set<string>();
  for (const level of levels) {
    for (const w of level.walls) {
      if (w.type) types.add(w.type);
    }
  }
  for (const t of types) loadObstacleSprite(t);
};

/** Precarga imágenes de fondo de niveles. */
export const preloadMazeBackgrounds = (): void => {
  for (const level of levels) {
    if (level.backgroundImage) loadMazeBackgroundImage(level.backgroundImage);
  }
};

// Frame state getters/setters
export const getWalkFrame = (): number => walkFrame;
export const setWalkFrame = (v: number): void => { walkFrame = v; };
export const getLastWalkFrameTime = (): number => lastWalkFrameTime;
export const setLastWalkFrameTime = (v: number): void => { lastWalkFrameTime = v; };

export const getIdleFrame = (): number => idleFrame;
export const setIdleFrame = (v: number): void => { idleFrame = v; };
export const getLastIdleFrameTime = (): number => lastIdleFrameTime;
export const setLastIdleFrameTime = (v: number): void => { lastIdleFrameTime = v; };

export const getObstacleFrame = (): number => obstacleFrame;
export const setObstacleFrame = (v: number): void => { obstacleFrame = v; };
export const getLastObstacleFrameTime = (): number => lastObstacleFrameTime;
export const setLastObstacleFrameTime = (v: number): void => { lastObstacleFrameTime = v; };

export const getGoalFrame = (): number => goalFrame;
export const setGoalFrame = (v: number): void => { goalFrame = v; };
export const getLastGoalFrameTime = (): number => lastGoalFrameTime;
export const setLastGoalFrameTime = (v: number): void => { lastGoalFrameTime = v; };

export const resetAnimationFrames = (): void => {
  walkFrame = 0;
  idleFrame = 0;
};

// Inicializar sprites al cargar el módulo
loadPlayerSprite();
loadGoalSprite();
preloadObstacleSprites();
preloadMazeBackgrounds();
