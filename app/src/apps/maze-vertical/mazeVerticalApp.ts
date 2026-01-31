/**
 * Laberinto con bloques verticales (estilo Scratch). Misma lógica que maze; solo cambian
 * los bloques y el toolbox; reutiliza ensureUI, drawMaze, adapter y niveles del maze horizontal.
 */
import type { AppDefinition, LevelInfo } from "../types";
import { levels } from "../maze/levels";
import {
  ensureUI,
  drawMaze,
  updateProgressBar,
  getLevel,
  makeInitialState,
  adapter,
  createMazeCheckConstraints
} from "../maze/mazeApp";
import type { MazeState } from "../shared/maze-like";

const GAME_COLOR = "#4C97FF";
const BASE_URL = import.meta.env.BASE_URL;
const pathToMedia = `${BASE_URL}vendor/scratch-blocks/media/`;
const pathToIconsVertical = `${BASE_URL}game-icons-vertical/`;

export const registerVerticalMazeBlocks = (Blockly: any): void => {
  Blockly.Blocks["event_inicio"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 Inicio",
        args0: [
          { type: "field_image", src: pathToIconsVertical + "play-green.svg", width: 24, height: 24, alt: "Inicio" }
        ],
        colour: "#EECE1C",
        tooltip: "Inicio del programa"
      });
      this.setPreviousStatement(null);
      this.setNextStatement(true);
    }
  };

  Blockly.Blocks["v_game_move"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 Mover",
        args0: [
          { type: "field_image", src: pathToIconsVertical + "move-right.svg", width: 24, height: 24, alt: "Mover" }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: GAME_COLOR,
        tooltip: "Mover hacia adelante"
      });
    }
  };

  Blockly.Blocks["v_game_back"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 Atrás",
        args0: [
          { type: "field_image", src: pathToIconsVertical + "move-left.svg", width: 24, height: 24, alt: "Atrás" }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: GAME_COLOR,
        tooltip: "Mover hacia atrás"
      });
    }
  };

  Blockly.Blocks["v_game_turn_left"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 Girar izquierda",
        args0: [
          { type: "field_image", src: pathToIconsVertical + "turn-left.svg", width: 24, height: 24, alt: "Girar izquierda" }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: GAME_COLOR,
        tooltip: "Girar a la izquierda"
      });
    }
  };

  Blockly.Blocks["v_game_turn_right"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 Girar derecha",
        args0: [
          { type: "field_image", src: pathToIconsVertical + "turn-right.svg", width: 24, height: 24, alt: "Girar derecha" }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: GAME_COLOR,
        tooltip: "Girar a la derecha"
      });
    }
  };

  Blockly.Blocks["v_game_repeat"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 repetir %2 veces",
        args0: [
          {
            type: "field_image",
            src: pathToMedia + "icons/control_repeat.svg",
            width: 24,
            height: 24,
            alt: "Repetir"
          },
          { type: "input_value", name: "TIMES", check: "Number" }
        ],
        message1: "%1",
        args1: [{ type: "input_statement", name: "SUBSTACK" }],
        previousStatement: null,
        nextStatement: null,
        colour: "#FFAB19",
        tooltip: "Repetir varias veces"
      });
    }
  };

  Blockly.Blocks["v_game_wait"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 esperar %2 ms",
        args0: [
          {
            type: "field_image",
            src: pathToMedia + "icons/control_wait.svg",
            width: 24,
            height: 24,
            alt: "Esperar"
          },
          { type: "input_value", name: "MS", check: "Number" }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: "#FFAB19",
        tooltip: "Esperar milisegundos"
      });
    }
  };
};

const MAZE_VERTICAL_TOOLBOX_XML = `
<xml>
  <block type="v_game_move"></block>
  <block type="v_game_back"></block>
  <block type="v_game_turn_left"></block>
  <block type="v_game_turn_right"></block>
  <block type="v_game_repeat">
    <value name="TIMES">
      <shadow type="math_whole_number"><field name="NUM">4</field></shadow>
    </value>
  </block>
  <block type="v_game_wait">
    <value name="MS">
      <shadow type="math_positive_number"><field name="NUM">500</field></shadow>
    </value>
  </block>
</xml>
`;

const levelInfos: LevelInfo[] = levels.map((l) => ({ id: l.id, title: l.title, blockLimit: l.blockLimit }));
const checkConstraints = createMazeCheckConstraints("v_game_repeat");

export const mazeVerticalApp: AppDefinition<MazeState> = {
  id: "maze-vertical",
  title: "Laberinto (vertical)",
  blockType: "vertical",
  levels: levelInfos,
  toolboxXml: MAZE_VERTICAL_TOOLBOX_XML,
  registerBlocks: registerVerticalMazeBlocks,
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
    MOVE_TYPES: ["v_game_move"],
    BACK_TYPES: ["v_game_back"],
    TURN_LEFT_TYPES: ["v_game_turn_left"],
    TURN_RIGHT_TYPES: ["v_game_turn_right"],
    REPEAT_TYPES: ["v_game_repeat"],
    WAIT_TYPES: ["v_game_wait"]
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
    if (!raw || typeof raw !== "object") return makeInitialState(1, []);
    const record = raw as Partial<MazeState>;
    const level = getLevel(record.levelId ?? 1);
    const completedLevels = Array.isArray(record.completedLevels) ? record.completedLevels : [];
    const state = makeInitialState(level.id, completedLevels);
    const DIR_ORDER = ["N", "E", "S", "W"];
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
