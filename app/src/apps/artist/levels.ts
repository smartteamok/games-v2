/**
 * Levels for the Artist (turtle graphics) game.
 */

import type { ArtistLevel, Line } from "../shared/artist/types";
import { calculateEndPoint, normalizeAngle } from "../shared/artist/logic";

type Step = {
  move?: number;
  turn?: number;
  pen?: boolean;
  color?: string;
  width?: number;
};

const DEFAULT_COLOR = "#000000";
const DEFAULT_WIDTH = 3;
const CANVAS_W = 400;
const CANVAS_H = 400;

const buildTargetLines = (
  startX: number,
  startY: number,
  startAngle: number,
  steps: Step[]
): Line[] => {
  let x = startX;
  let y = startY;
  let angle = startAngle;
  let penDown = true;
  let penColor = DEFAULT_COLOR;
  let penWidth = DEFAULT_WIDTH;
  const lines: Line[] = [];

  for (const step of steps) {
    if (typeof step.pen === "boolean") {
      penDown = step.pen;
      continue;
    }
    if (typeof step.color === "string") {
      penColor = step.color;
      continue;
    }
    if (typeof step.width === "number") {
      penWidth = step.width;
      continue;
    }
    if (typeof step.turn === "number") {
      angle = normalizeAngle(angle + step.turn);
      continue;
    }
    if (typeof step.move === "number") {
      const end = calculateEndPoint(x, y, angle, step.move);
      if (penDown) {
        lines.push({
          from: { x, y },
          to: end,
          color: penColor,
          width: penWidth
        });
      }
      x = end.x;
      y = end.y;
    }
  }

  return lines;
};

export const levels: ArtistLevel[] = [
  {
    id: 1,
    title: "Linea recta",
    instructions: "Dibuja una linea de 100 px.",
    width: CANVAS_W,
    height: CANVAS_H,
    startX: 140,
    startY: 200,
    startAngle: 0,
    targetLines: buildTargetLines(140, 200, 0, [{ move: 100 }]),
    blockLimit: 4,
    constraints: { maxBlocks: 4 }
  },
  {
    id: 2,
    title: "Cuadrado",
    instructions: "Dibuja un cuadrado usando giros de 90 grados.",
    width: CANVAS_W,
    height: CANVAS_H,
    startX: 150,
    startY: 150,
    startAngle: 0,
    targetLines: buildTargetLines(150, 150, 0, [
      { move: 80 },
      { turn: -90 },
      { move: 80 },
      { turn: -90 },
      { move: 80 },
      { turn: -90 },
      { move: 80 }
    ]),
    blockLimit: 8,
    constraints: { maxBlocks: 8 }
  },
  {
    id: 3,
    title: "Triangulo",
    instructions: "Dibuja un triangulo equilatero con giros de 120 grados.",
    width: CANVAS_W,
    height: CANVAS_H,
    startX: 140,
    startY: 240,
    startAngle: 0,
    targetLines: buildTargetLines(140, 240, 0, [
      { move: 90 },
      { turn: -120 },
      { move: 90 },
      { turn: -120 },
      { move: 90 }
    ]),
    blockLimit: 9,
    constraints: { maxBlocks: 9 }
  },
  {
    id: 4,
    title: "Dos lineas",
    instructions: "Dibuja dos lineas paralelas usando lapiz arriba y abajo.",
    width: CANVAS_W,
    height: CANVAS_H,
    startX: 100,
    startY: 160,
    startAngle: 0,
    targetLines: buildTargetLines(100, 160, 0, [
      { move: 120 },
      { pen: false },
      { turn: -90 },
      { move: 40 },
      { turn: 90 },
      { pen: true },
      { move: 120 }
    ]),
    blockLimit: 10,
    constraints: { maxBlocks: 10 }
  }
];
