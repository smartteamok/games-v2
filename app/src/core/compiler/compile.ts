import type { Op, Program } from "./ast";

export type CompileOptions = {
  START_TYPES: string[];
  MOVE_TYPES: string[];
  BACK_TYPES?: string[];
  TURN_LEFT_TYPES: string[];
  TURN_RIGHT_TYPES: string[];
  REPEAT_TYPES: string[];
  WAIT_TYPES: string[];
  PEN_UP_TYPES?: string[];
  PEN_DOWN_TYPES?: string[];
  COLOR_TYPES?: string[];
  WIDTH_TYPES?: string[];
};

type BlockLike = {
  id: string;
  type: string;
  getNextBlock?: () => BlockLike | null;
  nextConnection?: { targetBlock?: () => BlockLike | null };
  getInputTargetBlock?: (name: string) => BlockLike | null;
  getFieldValue?: (name: string) => string | number | null | undefined;
};

const getNextBlock = (block: BlockLike | null | undefined): BlockLike | null | undefined => {
  if (!block) return undefined;
  const fromConnection = block.nextConnection?.targetBlock?.();
  if (fromConnection != null && typeof fromConnection === "object" && fromConnection.id != null)
    return fromConnection as BlockLike;
  const next = block.getNextBlock?.();
  if (next != null && typeof next === "object" && next.id != null) return next;
  return undefined;
};

const FALLBACK_NUMBER_KEYS = ["NUM", "N", "VALUE", "TIMES", "DURATION", "STEPS", "SECS", "MS"];

const tryReadNumber = (block: BlockLike | null | undefined, keys: string[]): number | null => {
  if (!block?.getFieldValue) {
    return null;
  }
  for (const key of keys) {
    const raw = block.getFieldValue(key);
    if (raw !== null && raw !== undefined && raw !== "") {
      const value = Number(raw);
      if (!Number.isNaN(value)) {
        return value;
      }
    }
  }
  return null;
};

const readNumberField = (block: BlockLike, keys: string[], fallback: number): number => {
  const direct = tryReadNumber(block, keys);
  if (direct !== null) {
    return direct;
  }
  for (const key of keys) {
    const target = block.getInputTargetBlock?.(key);
    const fromTarget = tryReadNumber(target, FALLBACK_NUMBER_KEYS);
    if (fromTarget !== null) {
      return fromTarget;
    }
  }
  return fallback;
};

const readStringField = (block: BlockLike, keys: string[], fallback: string): string => {
  if (!block.getFieldValue) {
    return fallback;
  }
  for (const key of keys) {
    const raw = block.getFieldValue(key);
    if (raw !== null && raw !== undefined && raw !== "") {
      return String(raw);
    }
  }
  return fallback;
};

// Compiles a horizontal workspace into a simple AST for the selected app.
export const compileWorkspaceToAst = (
  Blockly: unknown,
  workspace: { getTopBlocks: (ordered: boolean) => BlockLike[] },
  opts: CompileOptions
): Program => {
  void Blockly;

  const startTypes = new Set(opts.START_TYPES);
  const moveTypes = new Set(opts.MOVE_TYPES);
  const backTypes = new Set(opts.BACK_TYPES ?? []);
  const turnLeftTypes = new Set(opts.TURN_LEFT_TYPES);
  const turnRightTypes = new Set(opts.TURN_RIGHT_TYPES);
  const repeatTypes = new Set(opts.REPEAT_TYPES);
  const waitTypes = new Set(opts.WAIT_TYPES);
  const penUpTypes = new Set(opts.PEN_UP_TYPES ?? []);
  const penDownTypes = new Set(opts.PEN_DOWN_TYPES ?? []);
  const colorTypes = new Set(opts.COLOR_TYPES ?? []);
  const widthTypes = new Set(opts.WIDTH_TYPES ?? []);

  const topBlocks = workspace.getTopBlocks(true);
  const startBlock = topBlocks.find((block) => startTypes.has(block.type));
  if (!startBlock) {
    throw new Error("Falta bloque start.");
  }

  const MAX_CHAIN = 500;
  const compileChain = (first: BlockLike): Op[] => {
    const ops: Op[] = [];
    let current: BlockLike | null | undefined = first;
    let n = 0;
    while (current && n < MAX_CHAIN) {
      n += 1;
      if (!current.id || !current.type) break;
      ops.push(compileBlock(current));
      current = getNextBlock(current);
    }
    return ops;
  };

  const compileBlock = (block: BlockLike): Op => {
    const { type } = block;
    if (startTypes.has(type)) {
      return { kind: "start", blockId: block.id };
    }
    if (moveTypes.has(type)) {
      const steps = readNumberField(block, ["STEPS", "NUM", "N"], 1);
      return { kind: "move", steps, blockId: block.id };
    }
    if (backTypes.has(type)) {
      const steps = readNumberField(block, ["STEPS", "NUM", "N"], 1);
      return { kind: "move", steps: -Math.abs(steps), blockId: block.id };
    }
    if (turnLeftTypes.has(type)) {
      const degrees = readNumberField(block, ["DEGREES", "DEG", "ANGLE", "NUM"], 90);
      return { kind: "turn", direction: "left", degrees, blockId: block.id };
    }
    if (turnRightTypes.has(type)) {
      const degrees = readNumberField(block, ["DEGREES", "DEG", "ANGLE", "NUM"], 90);
      return { kind: "turn", direction: "right", degrees, blockId: block.id };
    }
    if (penUpTypes.has(type)) {
      return { kind: "pen", down: false, blockId: block.id };
    }
    if (penDownTypes.has(type)) {
      return { kind: "pen", down: true, blockId: block.id };
    }
    if (colorTypes.has(type)) {
      const value = readStringField(block, ["COLOR", "VALUE", "NAME"], "#000000");
      return { kind: "color", value, blockId: block.id };
    }
    if (widthTypes.has(type)) {
      const value = readNumberField(block, ["WIDTH", "NUM", "N"], 3);
      return { kind: "width", value, blockId: block.id };
    }
    if (waitTypes.has(type)) {
      const msRaw = readNumberField(block, ["MS"], Number.NaN);
      const secsRaw = readNumberField(block, ["SECS"], Number.NaN);
      let ms = msRaw;
      if (Number.isNaN(ms) && !Number.isNaN(secsRaw)) {
        ms = secsRaw * 1000;
      }
      if (Number.isNaN(ms)) {
        ms = readNumberField(block, ["NUM", "N", "DURATION"], 500);
      }
      return { kind: "wait", ms, blockId: block.id };
    }
    if (repeatTypes.has(type)) {
      const times = readNumberField(block, ["TIMES", "NUM", "N"], 2);
      const bodyStart =
        block.getInputTargetBlock?.("SUBSTACK") || block.getInputTargetBlock?.("DO");
      const body = bodyStart ? compileChain(bodyStart) : [];
      return { kind: "repeat", times, body, blockId: block.id };
    }
    throw new Error(`Bloque no soportado aún: ${type}`);
  };

  return { ops: compileChain(startBlock) };
};
