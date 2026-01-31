/**
 * Shared AST types for block programs.
 * Supports multiple game types: maze, artist, collector, sprite, etc.
 */

// ============ Basic Operations ============

export type StartOp = {
  kind: "start";
  blockId: string;
};

export type MoveOp = {
  kind: "move";
  steps: number;
  blockId: string;
};

export type TurnOp = {
  kind: "turn";
  direction: "left" | "right";
  degrees?: number; // For artist games (default 90)
  blockId: string;
};

export type RepeatOp = {
  kind: "repeat";
  times: number;
  body: Op[];
  blockId: string;
};

export type WaitOp = {
  kind: "wait";
  ms: number;
  blockId: string;
};

// ============ Artist / Drawing Operations ============

export type PenOp = {
  kind: "pen";
  down: boolean;
  blockId: string;
};

export type ColorOp = {
  kind: "color";
  value: string;
  blockId: string;
};

export type WidthOp = {
  kind: "width";
  value: number;
  blockId: string;
};

export type DrawOp = {
  kind: "draw";
  shape: "line" | "circle" | "rectangle";
  params?: Record<string, number>;
  blockId: string;
};

// ============ Collector / Harvester Operations ============

export type CollectOp = {
  kind: "collect";
  blockId: string;
};

export type PlantOp = {
  kind: "plant";
  blockId: string;
};

export type WaterOp = {
  kind: "water";
  blockId: string;
};

export type HarvestOp = {
  kind: "harvest";
  blockId: string;
};

// ============ Conditional Operations ============

export type IfOp = {
  kind: "if";
  condition: ConditionType;
  body: Op[];
  elseBody?: Op[];
  blockId: string;
};

export type WhileOp = {
  kind: "while";
  condition: ConditionType;
  body: Op[];
  blockId: string;
};

export type ConditionType =
  | { type: "hasItem" }           // Collector: hay item para recolectar
  | { type: "atGoal" }            // Maze: está en la meta
  | { type: "pathAhead" }         // Maze: hay camino adelante
  | { type: "pathLeft" }          // Maze: hay camino a la izquierda
  | { type: "pathRight" }         // Maze: hay camino a la derecha
  | { type: "hasPlant" }          // Farmer: hay planta
  | { type: "needsWater" }        // Farmer: planta necesita agua
  | { type: "hasHole" }           // Farmer: hay hueco para plantar
  | { type: "custom"; value: string }; // Para extensibilidad

// ============ Sprite Operations (for future) ============

export type SayOp = {
  kind: "say";
  message: string;
  duration?: number;
  blockId: string;
};

export type GotoOp = {
  kind: "goto";
  x: number;
  y: number;
  blockId: string;
};

export type CostumeOp = {
  kind: "costume";
  name: string;
  blockId: string;
};

export type SoundOp = {
  kind: "sound";
  name: string;
  blockId: string;
};

// ============ Music Operations (for future) ============

export type NoteOp = {
  kind: "note";
  pitch: string;  // "C4", "D4", etc.
  duration: number; // beats
  blockId: string;
};

export type RestOp = {
  kind: "rest";
  duration: number;
  blockId: string;
};

export type TempoOp = {
  kind: "tempo";
  bpm: number;
  blockId: string;
};

export type InstrumentOp = {
  kind: "instrument";
  name: string;
  blockId: string;
};

// ============ Union Type ============

export type Op =
  // Basic
  | StartOp
  | MoveOp
  | TurnOp
  | RepeatOp
  | WaitOp
  // Artist
  | PenOp
  | ColorOp
  | WidthOp
  | DrawOp
  // Collector/Farmer
  | CollectOp
  | PlantOp
  | WaterOp
  | HarvestOp
  // Conditionals
  | IfOp
  | WhileOp
  // Sprite
  | SayOp
  | GotoOp
  | CostumeOp
  | SoundOp
  // Music
  | NoteOp
  | RestOp
  | TempoOp
  | InstrumentOp;

export type Program = {
  ops: Op[];
};

// ============ Type Guards ============

export const isMovementOp = (op: Op): op is MoveOp | TurnOp =>
  op.kind === "move" || op.kind === "turn";

export const isDrawingOp = (op: Op): op is PenOp | ColorOp | WidthOp | DrawOp =>
  op.kind === "pen" || op.kind === "color" || op.kind === "width" || op.kind === "draw";

export const isCollectorOp = (op: Op): op is CollectOp | PlantOp | WaterOp | HarvestOp =>
  op.kind === "collect" || op.kind === "plant" || op.kind === "water" || op.kind === "harvest";

export const isConditionalOp = (op: Op): op is IfOp | WhileOp =>
  op.kind === "if" || op.kind === "while";

export const isSpriteOp = (op: Op): op is SayOp | GotoOp | CostumeOp | SoundOp =>
  op.kind === "say" || op.kind === "goto" || op.kind === "costume" || op.kind === "sound";

export const isMusicOp = (op: Op): op is NoteOp | RestOp | TempoOp | InstrumentOp =>
  op.kind === "note" || op.kind === "rest" || op.kind === "tempo" || op.kind === "instrument";
