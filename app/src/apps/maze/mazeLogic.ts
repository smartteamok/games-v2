/**
 * Lógica del juego de laberinto: movimiento, colisiones, estado.
 */
import { levels, type Direction, type MazeLevel } from "./levels";
import { DIR_ORDER, type MazeState } from "./mazeTypes";

export const getLevel = (levelId: number): MazeLevel =>
  levels.find((level) => level.id === levelId) ?? levels[0];

export const makeInitialState = (levelId: number, completedLevels: number[] = []): MazeState => {
  const level = getLevel(levelId);
  return {
    levelId: level.id,
    player: { ...level.start },
    status: "idle",
    message: undefined,
    completedLevels,
    visitedCells: [{ x: level.start.x, y: level.start.y }]
  };
};

export const turnLeft = (dir: Direction): Direction => {
  const index = DIR_ORDER.indexOf(dir);
  return DIR_ORDER[(index + 3) % DIR_ORDER.length];
};

export const turnRight = (dir: Direction): Direction => {
  const index = DIR_ORDER.indexOf(dir);
  return DIR_ORDER[(index + 1) % DIR_ORDER.length];
};

export const isBlocked = (level: MazeLevel, x: number, y: number): boolean =>
  level.walls.some((wall) => wall.x === x && wall.y === y);

export const inBounds = (level: MazeLevel, x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < level.gridW && y < level.gridH;

export const updateStatusText = (state: MazeState): string => {
  if (state.message) {
    return state.message;
  }
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
