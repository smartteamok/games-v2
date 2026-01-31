import type { CompileOptions } from "../core/compiler/compile";
import type { RuntimeAdapter as CoreRuntimeAdapter } from "../core/runtime/runtime";

export type RuntimeAdapter<AppState> = CoreRuntimeAdapter<AppState>;

export type AppRenderContext<AppState> = {
  getWorkspace: () => unknown;
  setStatus: (text: string) => void;
  updateState: (nextState: AppState) => void;
  getState: () => AppState;
};

export type ConstraintResult = { ok: true } | { ok: false; message: string };

/** Level metadata for games that have multiple levels (e.g. maze). */
export type LevelInfo = { id: number; title: string; blockLimit?: number };

/** Block type - horizontal (icon strip) or vertical (Scratch-style). */
export type BlockType = "horizontal" | "vertical";

export type AppDefinition<AppState> = {
  id: string;
  title: string;
  /** Horizontal (icon strip) or vertical (Scratch-style). Default "horizontal". */
  blockType?: BlockType;
  /** Optional: levels for this game. Used by UI (e.g. level selector in stage). */
  levels?: LevelInfo[];
  toolboxXml: string;
  registerBlocks: (Blockly: unknown) => void;
  createInitialState: () => AppState;
  render: (rootEl: HTMLElement, state: AppState, ctx: AppRenderContext<AppState>) => void;
  adapter: RuntimeAdapter<AppState>;
  compileOptions: CompileOptions;
  checkConstraints?: (workspace: unknown, state: AppState) => ConstraintResult;
  /** Optional: resolve the full level config by id. */
  getLevel?: (levelId: number) => {
    id: number;
    blockLimit?: number;
    initialBlocks?: string;
    initialBlocksVertical?: string;
  };
  /** Optional: apply initial blocks for the given level. */
  applyInitialBlocks?: (
    Blockly: unknown,
    workspace: unknown,
    level: unknown,
    blockType: BlockType
  ) => void;
  serializeState?: (state: AppState) => unknown;
  deserializeState?: (raw: unknown) => AppState;
};
