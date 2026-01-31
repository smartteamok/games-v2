import type { Direction, MazeLevel, Obstacle } from "../shared/maze-like";

export type { Direction, MazeLevel, Obstacle };

export const levels: MazeLevel[] = [
  {
    id: 1,
    title: "Recta",
    gridW: 5,
    gridH: 5,
    walls: [],
    start: { x: 0, y: 2, dir: "E" },
    goal: { x: 4, y: 2 }
  },
  {
    id: 2,
    title: "Un giro",
    gridW: 5,
    gridH: 5,
    walls: [],
    start: { x: 0, y: 4, dir: "E" },
    goal: { x: 4, y: 0 }
  },
  {
    id: 3,
    title: "Dos giros",
    gridW: 5,
    gridH: 5,
    walls: [
      { x: 2, y: 0, type: "rock" },
      { x: 2, y: 1, type: "tree" },
      { x: 2, y: 2, type: "rock" }
    ],
    start: { x: 0, y: 0, dir: "E" },
    goal: { x: 4, y: 4 }
  },
  {
    id: 4,
    title: "Repetir",
    gridW: 5,
    gridH: 5,
    walls: [],
    start: { x: 0, y: 2, dir: "E" },
    goal: { x: 4, y: 2 },
    constraints: { maxBlocks: 8, mustUseRepeat: true },
    blockLimit: 8
  },
  {
    id: 5,
    title: "Muro central",
    gridW: 6,
    gridH: 6,
    walls: [
      { x: 2, y: 0, type: "tree" },
      { x: 2, y: 1, type: "rock" },
      { x: 2, y: 2, type: "tree" },
      { x: 2, y: 4, type: "rock" },
      { x: 2, y: 5, type: "tree" },
      { x: 4, y: 1, type: "rock" },
      { x: 4, y: 2, type: "tree" }
    ],
    start: { x: 0, y: 5, dir: "N" },
    goal: { x: 5, y: 0 }
  },
  {
    id: 6,
    title: "Puente",
    gridW: 6,
    gridH: 6,
    walls: [
      { x: 0, y: 3, type: "rock" },
      { x: 1, y: 3, type: "rock" },
      { x: 2, y: 3, type: "rock" },
      { x: 3, y: 3, type: "rock" },
      { x: 4, y: 3, type: "rock" }
    ],
    start: { x: 1, y: 5, dir: "N" },
    goal: { x: 5, y: 0 },
    constraints: { mustUseRepeat: true }
  },
  {
    id: 7,
    title: "Pasillo",
    gridW: 6,
    gridH: 6,
    walls: [
      { x: 3, y: 1, type: "tree" },
      { x: 3, y: 2, type: "tree" },
      { x: 3, y: 3, type: "tree" },
      { x: 3, y: 5, type: "tree" },
      { x: 1, y: 4, type: "rock" },
      { x: 2, y: 4, type: "rock" }
    ],
    start: { x: 5, y: 5, dir: "W" },
    goal: { x: 0, y: 0 }
  },
  {
    id: 8,
    title: "Zigzag",
    gridW: 6,
    gridH: 6,
    walls: [
      { x: 1, y: 1, type: "tree" },
      { x: 2, y: 1, type: "rock" },
      { x: 3, y: 1, type: "tree" },
      { x: 4, y: 1, type: "rock" },
      { x: 1, y: 3, type: "rock" },
      { x: 2, y: 3, type: "tree" },
      { x: 3, y: 3, type: "rock" },
      { x: 4, y: 3, type: "tree" },
      { x: 1, y: 5, type: "tree" },
      { x: 2, y: 5, type: "rock" },
      { x: 3, y: 5, type: "tree" },
      { x: 4, y: 5, type: "rock" }
    ],
    start: { x: 0, y: 0, dir: "E" },
    goal: { x: 5, y: 4 },
    constraints: { maxBlocks: 14 },
    blockLimit: 14
  }
];
