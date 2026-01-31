/**
 * Levels for the Artist (turtle graphics) game.
 * Progressive difficulty teaching geometry, loops, and functions.
 */

import type { ArtistLevel } from "../shared/artist/types";

export const levels: ArtistLevel[] = [
  // Level 1: Draw a simple line
  {
    id: 1,
    title: "Línea simple",
    instructions: "Dibujá una línea hacia adelante.",
    width: 400,
    height: 400,
    startX: 100,
    startY: 200,
    startAngle: 0, // Facing right
    blockLimit: 2,
    constraints: {
      maxBlocks: 2
    }
  },

  // Level 2: Draw two connected lines (L shape)
  {
    id: 2,
    title: "Forma L",
    instructions: "Dibujá una L: avanzá, girá a la derecha, y avanzá de nuevo.",
    width: 400,
    height: 400,
    startX: 100,
    startY: 100,
    startAngle: 0, // Facing right
    blockLimit: 4,
    constraints: {
      maxBlocks: 4
    }
  },

  // Level 3: Draw a square (manual)
  {
    id: 3,
    title: "Cuadrado manual",
    instructions: "Dibujá un cuadrado usando 4 avanzar y 4 girar.",
    width: 400,
    height: 400,
    startX: 150,
    startY: 250,
    startAngle: 0,
    blockLimit: 10,
    constraints: {
      maxBlocks: 10
    }
  },

  // Level 4: Square with repeat
  {
    id: 4,
    title: "Cuadrado con repetir",
    instructions: "Dibujá un cuadrado usando el bloque 'repetir 4 veces'.",
    width: 400,
    height: 400,
    startX: 150,
    startY: 250,
    startAngle: 0,
    blockLimit: 4,
    constraints: {
      maxBlocks: 4,
      mustUseRepeat: true
    }
  },

  // Level 5: Triangle
  {
    id: 5,
    title: "Triángulo",
    instructions: "Dibujá un triángulo equilátero (girá 120 grados).",
    width: 400,
    height: 400,
    startX: 100,
    startY: 300,
    startAngle: 0,
    blockLimit: 4,
    constraints: {
      maxBlocks: 4,
      mustUseRepeat: true
    }
  },

  // Level 6: Staircase
  {
    id: 6,
    title: "Escalera",
    instructions: "Dibujá una escalera de 4 escalones.",
    width: 400,
    height: 400,
    startX: 50,
    startY: 350,
    startAngle: 0,
    blockLimit: 8,
    constraints: {
      maxBlocks: 8,
      mustUseRepeat: true
    }
  },

  // Level 7: Pentagon
  {
    id: 7,
    title: "Pentágono",
    instructions: "Dibujá un pentágono (5 lados, girá 72 grados).",
    width: 400,
    height: 400,
    startX: 150,
    startY: 300,
    startAngle: 0,
    blockLimit: 4,
    constraints: {
      maxBlocks: 4,
      mustUseRepeat: true
    }
  },

  // Level 8: Hexagon
  {
    id: 8,
    title: "Hexágono",
    instructions: "Dibujá un hexágono (6 lados, girá 60 grados).",
    width: 400,
    height: 400,
    startX: 120,
    startY: 280,
    startAngle: 0,
    blockLimit: 4,
    constraints: {
      maxBlocks: 4,
      mustUseRepeat: true
    }
  },

  // Level 9: Star
  {
    id: 9,
    title: "Estrella",
    instructions: "Dibujá una estrella de 5 puntas (girá 144 grados).",
    width: 400,
    height: 400,
    startX: 150,
    startY: 150,
    startAngle: -90, // Pointing up
    blockLimit: 4,
    constraints: {
      maxBlocks: 4,
      mustUseRepeat: true
    }
  },

  // Level 10: Free drawing
  {
    id: 10,
    title: "Dibujo libre",
    instructions: "¡Dibujá lo que quieras! Usá colores y formas.",
    width: 400,
    height: 400,
    startX: 200,
    startY: 200,
    startAngle: 0
    // No constraints - free play
  }
];

export type { ArtistLevel };
