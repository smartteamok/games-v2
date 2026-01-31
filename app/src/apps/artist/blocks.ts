/**
 * Artist block definitions for horizontal layout.
 */

const BASE_URL = import.meta.env.BASE_URL;

const GAME_COLOR = "#F472B6";
const PEN_COLOR = "#10B981";

const ICON_INICIO = `${BASE_URL}icons/play-green.svg`;

/**
 * Register horizontal artist blocks with Blockly.
 */
export const registerArtistBlocks = (Blockly: any): void => {
  Blockly.Blocks["event_inicio"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_INICIO, 42, 42, ""));
      this.setPreviousStatement(null);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Inicio del programa");
      this.setColour("#FFAB19");
    }
  };

  Blockly.Blocks["artist_move"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Avanzar")
        .appendField(new Blockly.FieldNumber(100, 1), "STEPS");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Mover hacia adelante");
      this.setColour(GAME_COLOR);
    }
  };

  Blockly.Blocks["artist_back"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Retroceder")
        .appendField(new Blockly.FieldNumber(100, 1), "STEPS");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Mover hacia atras");
      this.setColour(GAME_COLOR);
    }
  };

  Blockly.Blocks["artist_turn_left"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Girar izquierda")
        .appendField(new Blockly.FieldNumber(90, 1), "DEGREES");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Girar a la izquierda");
      this.setColour(GAME_COLOR);
    }
  };

  Blockly.Blocks["artist_turn_right"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Girar derecha")
        .appendField(new Blockly.FieldNumber(90, 1), "DEGREES");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Girar a la derecha");
      this.setColour(GAME_COLOR);
    }
  };

  Blockly.Blocks["artist_pen_down"] = {
    init: function () {
      this.appendDummyInput().appendField("Lapiz abajo");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Bajar el lapiz para dibujar");
      this.setColour(PEN_COLOR);
    }
  };

  Blockly.Blocks["artist_pen_up"] = {
    init: function () {
      this.appendDummyInput().appendField("Lapiz arriba");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Subir el lapiz para moverse sin dibujar");
      this.setColour(PEN_COLOR);
    }
  };

  Blockly.Blocks["artist_set_color"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Color")
        .appendField(new Blockly.FieldColour("#000000"), "COLOR");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Cambiar color del lapiz");
      this.setColour(PEN_COLOR);
    }
  };

  Blockly.Blocks["artist_set_width"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Grosor")
        .appendField(new Blockly.FieldNumber(3, 1, 20), "WIDTH");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Cambiar grosor del lapiz");
      this.setColour(PEN_COLOR);
    }
  };

  const pathToMedia = `${BASE_URL}vendor/scratch-blocks/media/`;

  Blockly.Blocks["artist_repeat"] = {
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

  Blockly.Blocks["artist_wait"] = {
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

/**
 * Toolbox XML for horizontal artist blocks.
 */
export const ARTIST_TOOLBOX_XML = `
<xml>
  <block type="artist_move"></block>
  <block type="artist_back"></block>
  <block type="artist_turn_left"></block>
  <block type="artist_turn_right"></block>
  <block type="artist_pen_down"></block>
  <block type="artist_pen_up"></block>
  <block type="artist_set_color"></block>
  <block type="artist_set_width"></block>
  <block type="artist_repeat">
    <value name="TIMES">
      <shadow type="math_whole_number"><field name="NUM">4</field></shadow>
    </value>
  </block>
  <block type="artist_wait">
    <value name="MS">
      <shadow type="math_positive_number"><field name="NUM">500</field></shadow>
    </value>
  </block>
</xml>
`;

/**
 * Compile options for artist blocks.
 */
export const ARTIST_COMPILE_OPTIONS = {
  START_TYPES: ["event_inicio", "event_whenflagclicked"],
  MOVE_TYPES: ["artist_move"],
  BACK_TYPES: ["artist_back"],
  TURN_LEFT_TYPES: ["artist_turn_left"],
  TURN_RIGHT_TYPES: ["artist_turn_right"],
  REPEAT_TYPES: ["artist_repeat"],
  WAIT_TYPES: ["artist_wait"],
  PEN_UP_TYPES: ["artist_pen_up"],
  PEN_DOWN_TYPES: ["artist_pen_down"],
  COLOR_TYPES: ["artist_set_color"],
  WIDTH_TYPES: ["artist_set_width"]
};
