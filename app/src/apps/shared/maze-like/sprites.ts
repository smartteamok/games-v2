/**
 * Sprite loading and management for maze-like games.
 */

const BASE_URL = import.meta.env.BASE_URL;

// Sprite caches
const obstacleSprites: Map<string, HTMLImageElement> = new Map();
const backgroundImages: Map<string, HTMLImageElement> = new Map();

let playerSprite: HTMLImageElement | null = null;
let playerSpriteFrames = 4;
let spriteLoadCallback: (() => void) | null = null;

let goalSprite: HTMLImageElement | null = null;
let goalSpriteFrames = 1;

// Animation frame state
export type SpriteAnimationState = {
  walkFrame: number;
  lastWalkFrameTime: number;
  idleFrame: number;
  lastIdleFrameTime: number;
  obstacleFrame: number;
  lastObstacleFrameTime: number;
  goalFrame: number;
  lastGoalFrameTime: number;
};

export const createAnimationState = (): SpriteAnimationState => ({
  walkFrame: 0,
  lastWalkFrameTime: 0,
  idleFrame: 0,
  lastIdleFrameTime: 0,
  obstacleFrame: 0,
  lastObstacleFrameTime: 0,
  goalFrame: 0,
  lastGoalFrameTime: 0
});

/**
 * Load the player sprite image.
 */
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

export const getPlayerSprite = (): HTMLImageElement | null => playerSprite;
export const getPlayerSpriteFrames = (): number => playerSpriteFrames;

/**
 * Load an obstacle sprite.
 */
export const loadObstacleSprite = (type: string): HTMLImageElement | null => {
  if (obstacleSprites.has(type)) return obstacleSprites.get(type) ?? null;
  const img = new Image();
  img.src = `${BASE_URL}game-sprites/obstacles/${type}.png`;
  obstacleSprites.set(type, img);
  return img;
};

/**
 * Load the goal sprite.
 */
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

export const getGoalSprite = (): HTMLImageElement | null => goalSprite;
export const getGoalSpriteFrames = (): number => goalSpriteFrames;

/**
 * Load a background image.
 */
export const loadBackgroundImage = (filename: string): HTMLImageElement | null => {
  if (backgroundImages.has(filename)) return backgroundImages.get(filename) ?? null;
  const img = new Image();
  img.src = `${BASE_URL}game-sprites/backgrounds/${filename}`;
  backgroundImages.set(filename, img);
  return img;
};

/**
 * Preload obstacle sprites used in levels.
 */
export const preloadObstacleSprites = (levels: Array<{ walls: Array<{ type?: string }> }>): void => {
  const types = new Set<string>();
  for (const level of levels) {
    for (const w of level.walls) {
      if (w.type) types.add(w.type);
    }
  }
  for (const t of types) loadObstacleSprite(t);
};

/**
 * Preload background images for levels that define them.
 */
export const preloadBackgrounds = (levels: Array<{ backgroundImage?: string }>): void => {
  for (const level of levels) {
    if (level.backgroundImage) loadBackgroundImage(level.backgroundImage);
  }
};

/**
 * Initialize sprites - call on app startup.
 */
export const initSprites = (levels: Array<{ walls: Array<{ type?: string }>; backgroundImage?: string }>): void => {
  loadPlayerSprite();
  loadGoalSprite();
  preloadObstacleSprites(levels);
  preloadBackgrounds(levels);
};
