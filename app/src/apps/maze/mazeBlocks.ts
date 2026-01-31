/**
 * Registro de bloques Blockly para el laberinto horizontal.
 */
import { GAME_COLOR, GAME_ICON_SIZE } from "./mazeTypes";

const BASE_URL = import.meta.env.BASE_URL;

const ICON_MOVE = `${BASE_URL}game-icons/move-right.svg`;
const ICON_BACK = `${BASE_URL}game-icons/move-left.svg`;
const ICON_TURN_LEFT = `${BASE_URL}game-icons/turn-left.svg`;
const ICON_TURN_RIGHT = `${BASE_URL}game-icons/turn-right.svg`;
const ICON_INICIO = `${BASE_URL}icons/play-green.svg`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerMazeLikeBlocks = (Blockly: any): void => {
  Blockly.Blocks["event_inicio"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_INICIO, GAME_ICON_SIZE, GAME_ICON_SIZE, ""));
      this.setPreviousStatement(null);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Inicio del programa");
      this.setColour("#FFAB19");
    }
  };

  Blockly.Blocks["game_move"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldImage(ICON_MOVE, GAME_ICON_SIZE, GAME_ICON_SIZE, "Mover")
      );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Mover hacia adelante");
      this.setColour(GAME_COLOR);
    }
  };

  Blockly.Blocks["game_back"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldImage(ICON_BACK, GAME_ICON_SIZE, GAME_ICON_SIZE, "Atrás")
      );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Mover hacia atrás");
      this.setColour(GAME_COLOR);
    }
  };

  Blockly.Blocks["game_turn_left"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldImage(ICON_TURN_LEFT, GAME_ICON_SIZE, GAME_ICON_SIZE, "Girar izquierda")
      );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Girar a la izquierda");
      this.setColour(GAME_COLOR);
    }
  };

  Blockly.Blocks["game_turn_right"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldImage(ICON_TURN_RIGHT, GAME_ICON_SIZE, GAME_ICON_SIZE, "Girar derecha")
      );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Girar a la derecha");
      this.setColour(GAME_COLOR);
    }
  };

  const pathToMedia = `${BASE_URL}vendor/scratch-blocks/media/`;

  Blockly.Blocks["game_repeat"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 %2 %3",
        args0: [
          { type: "input_statement", name: "SUBSTACK" },
          {
            type: "field_image",
            src: pathToMedia + "icons/control_repeat.svg",
            width: 40,
            height: 40,
            alt: "Repetir",
            flip_rtl: true
          },
          { type: "input_value", name: "TIMES", check: "Number" }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        category: Blockly.Categories?.control,
        colour: Blockly.Colours?.control?.primary ?? "#FFAB19",
        colourSecondary: Blockly.Colours?.control?.secondary,
        colourTertiary: Blockly.Colours?.control?.tertiary,
        colourQuaternary: Blockly.Colours?.control?.quaternary
      });
      this.setTooltip("Repetir varias veces");
    }
  };

  Blockly.Blocks["game_wait"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 %2",
        args0: [
          {
            type: "field_image",
            src: pathToMedia + "icons/control_wait.svg",
            width: 40,
            height: 40,
            alt: "Esperar"
          },
          { type: "input_value", name: "MS", check: "Number" }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        category: Blockly.Categories?.control,
        colour: Blockly.Colours?.control?.primary ?? "#FFAB19",
        colourSecondary: Blockly.Colours?.control?.secondary,
        colourTertiary: Blockly.Colours?.control?.tertiary,
        colourQuaternary: Blockly.Colours?.control?.quaternary
      });
      this.setTooltip("Esperar milisegundos");
    }
  };
};

export const MAZE_LIKE_TOOLBOX_XML = `
<xml>
  <block type="game_move"></block>
  <block type="game_back"></block>
  <block type="game_turn_left"></block>
  <block type="game_turn_right"></block>
  <block type="game_repeat">
    <value name="TIMES">
      <shadow type="math_whole_number"><field name="NUM">4</field></shadow>
    </value>
  </block>
  <block type="game_wait">
    <value name="MS">
      <shadow type="math_positive_number"><field name="NUM">500</field></shadow>
    </value>
  </block>
</xml>
`;
