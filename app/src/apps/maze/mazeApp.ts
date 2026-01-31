/**
 * Laberinto - Definición principal del juego.
 * 
 * Este archivo orquesta los módulos separados:
 * - mazeTypes: Tipos compartidos
 * - mazeLogic: Lógica del juego
 * - mazeBlocks: Bloques Blockly
 * - mazeUI: Componentes de UI
 * - mazeRenderer: Rendering del canvas
 * - mazeAdapter: RuntimeAdapter
 * - mazeSprites: Carga de sprites
 */
import type { AppDefinition, LevelInfo } from "../types";
import { levels } from "./levels";

// Re-exportar tipos
export type { MazeState, MazeUI, AnimationState, BlockType } from "./mazeTypes";
export { DIR_ORDER, DIR_DELTAS, GAME_COLOR } from "./mazeTypes";

// Re-exportar lógica
export { getLevel, makeInitialState, updateStatusText } from "./mazeLogic";

// Re-exportar bloques
export { registerMazeLikeBlocks, MAZE_LIKE_TOOLBOX_XML } from "./mazeBlocks";

// Re-exportar UI
export {
  ensureUI,
  updateProgressBar,
  updateStagePlayButton,
  toggleSkillsPanel,
  updateBlockLimitCounter,
  updateInstructions
} from "./mazeUI";

// Re-exportar renderer
export { drawMaze, setAnimationState } from "./mazeRenderer";

// Re-exportar adapter
export { adapter, createMazeCheckConstraints, applyInitialBlocks } from "./mazeAdapter";

// Importar lo necesario para la definición del app
import type { MazeState } from "./mazeTypes";
import { getLevel, makeInitialState } from "./mazeLogic";
import { registerMazeLikeBlocks, MAZE_LIKE_TOOLBOX_XML } from "./mazeBlocks";
import { ensureUI, updateProgressBar } from "./mazeUI";
import { drawMaze } from "./mazeRenderer";
import { adapter, createMazeCheckConstraints } from "./mazeAdapter";
import { DIR_ORDER } from "./mazeTypes";

const checkConstraints = createMazeCheckConstraints("game_repeat");

const levelInfos: LevelInfo[] = levels.map((l) => ({ id: l.id, title: l.title, blockLimit: l.blockLimit }));

export const mazeApp: AppDefinition<MazeState> = {
  id: "maze",
  title: "Laberinto",
  levels: levelInfos,
  toolboxXml: MAZE_LIKE_TOOLBOX_XML,
  registerBlocks: registerMazeLikeBlocks,
  createInitialState: () => makeInitialState(1, []),
  render: (rootEl, state, ctx) => {
    const level = getLevel(state.levelId);
    if (level.id !== state.levelId) {
      const completedLevels = state.completedLevels ?? [];
      ctx.updateState(makeInitialState(level.id, completedLevels));
      return;
    }
    ensureUI(rootEl, ctx);
    updateProgressBar(state);
    drawMaze(state);
  },
  adapter,
  compileOptions: {
    START_TYPES: ["event_inicio", "event_whenflagclicked"],
    MOVE_TYPES: ["game_move"],
    BACK_TYPES: ["game_back"],
    TURN_LEFT_TYPES: ["game_turn_left"],
    TURN_RIGHT_TYPES: ["game_turn_right"],
    REPEAT_TYPES: ["game_repeat"],
    WAIT_TYPES: ["game_wait"]
  },
  checkConstraints,
  serializeState: (state) => ({
    levelId: state.levelId,
    player: state.player,
    status: state.status,
    message: state.message,
    completedLevels: state.completedLevels ?? []
  }),
  deserializeState: (raw) => {
    if (!raw || typeof raw !== "object") {
      return makeInitialState(1, []);
    }
    const record = raw as Partial<MazeState>;
    const level = getLevel(record.levelId ?? 1);
    const completedLevels = Array.isArray(record.completedLevels) ? record.completedLevels : [];
    const state = makeInitialState(level.id, completedLevels);
    if (record.player && typeof record.player.x === "number" && typeof record.player.y === "number") {
      state.player.x = record.player.x;
      state.player.y = record.player.y;
      if (record.player.dir && DIR_ORDER.includes(record.player.dir)) {
        state.player.dir = record.player.dir;
      }
    }
    state.status = "idle";
    state.message = record.message;
    state.completedLevels = completedLevels;
    return state;
  }
};
