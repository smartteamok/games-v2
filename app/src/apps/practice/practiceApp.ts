/**
 * Práctica - Reutiliza toda la lógica del laberinto pero con niveles diferentes.
 * 
 * Refactorizado para eliminar duplicación: ahora importa toda la funcionalidad
 * del maze y solo proporciona sus propios niveles.
 */
import type { AppDefinition, LevelInfo } from "../types";
import type { MazeState } from "../maze/mazeTypes";
import { DIR_ORDER } from "../maze/mazeTypes";
import { registerMazeLikeBlocks, MAZE_LIKE_TOOLBOX_XML } from "../maze/mazeBlocks";
import { ensureUI, updateProgressBar } from "../maze/mazeUI";
import { drawMaze } from "../maze/mazeRenderer";
import { adapter } from "../maze/mazeAdapter";
import { practiceLevels } from "./levels";

// Funciones locales que usan practiceLevels en lugar de levels
const getLevel = (levelId: number) =>
  practiceLevels.find((level) => level.id === levelId) ?? practiceLevels[0];

const makeInitialState = (levelId: number, completedLevels: number[] = []): MazeState => {
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

const levelInfos: LevelInfo[] = practiceLevels.map((l) => ({ id: l.id, title: l.title }));

export const practiceApp: AppDefinition<MazeState> = {
  id: "practice",
  title: "Práctica",
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
    // Usar practiceLevels para la barra de progreso
    updateProgressBar(state, practiceLevels);
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
  serializeState: (state) => ({
    levelId: state.levelId,
    player: state.player,
    status: state.status,
    message: state.message,
    completedLevels: state.completedLevels ?? []
  }),
  deserializeState: (raw) => {
    if (!raw || typeof raw !== "object") return makeInitialState(1, []);
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
