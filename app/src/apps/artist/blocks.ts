/**
 * Artist block definitions for horizontal layout.
 * Turtle graphics blocks: move, turn, pen up/down, color.
 */

const BASE_URL = import.meta.env.BASE_URL;

const ARTIST_COLOR = "#9966FF"; // Purple for artist
const ARTIST_ICON_SIZE = 42;

const ICON_MOVE = `${BASE_URL}game-icons/artist-move.svg`;
const ICON_TURN_LEFT = `${BASE_URL}game-icons/artist-turn-left.svg`;
const ICON_TURN_RIGHT = `${BASE_URL}game-icons/artist-turn-right.svg`;
const ICON_PEN_UP = `${BASE_URL}game-icons/artist-pen-up.svg`;
const ICON_PEN_DOWN = `${BASE_URL}game-icons/artist-pen-down.svg`;
const ICON_INICIO = `${BASE_URL}icons/play-green.svg`;

/**
 * Register horizontal artist blocks with Blockly.
 */
export const registerArtistBlocks = (Blockly: any): void => {
  // Start block (same as maze)
  if (!Blockly.Blocks["event_inicio"]) {
    Blockly.Blocks["event_inicio"] = {
      init: function () {
        this.appendDummyInput()
          .appendField(new Blockly.FieldImage(ICON_INICIO, ARTIST_ICON_SIZE, ARTIST_ICON_SIZE, ""));
        this.setPreviousStatement(null);
        this.setNextStatement(true);
        this.setInputsInline(true);
        this.setTooltip("Inicio del programa");
        this.setColour("#FFAB19");
      }
    };
  }

  // Move forward block with distance input
  Blockly.Blocks["artist_move"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_MOVE, ARTIST_ICON_SIZE, ARTIST_ICON_SIZE, "Avanzar"));
      this.appendValueInput("DISTANCE").setCheck("Number");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Mover hacia adelante (en píxeles)");
      this.setColour(ARTIST_COLOR);
    }
  };

  // Simple move forward (fixed distance for beginners)
  Blockly.Blocks["artist_move_simple"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_MOVE, ARTIST_ICON_SIZE, ARTIST_ICON_SIZE, "Avanzar"));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Avanzar 50 píxeles");
      this.setColour(ARTIST_COLOR);
    }
  };

  // Turn left with angle input
  Blockly.Blocks["artist_turn_left"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_TURN_LEFT, ARTIST_ICON_SIZE, ARTIST_ICON_SIZE, "Girar izquierda"));
      this.appendValueInput("ANGLE").setCheck("Number");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Girar a la izquierda (en grados)");
      this.setColour(ARTIST_COLOR);
    }
  };

  // Turn right with angle input
  Blockly.Blocks["artist_turn_right"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_TURN_RIGHT, ARTIST_ICON_SIZE, ARTIST_ICON_SIZE, "Girar derecha"));
      this.appendValueInput("ANGLE").setCheck("Number");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Girar a la derecha (en grados)");
      this.setColour(ARTIST_COLOR);
    }
  };

  // Simple turn left (90 degrees for beginners)
  Blockly.Blocks["artist_turn_left_90"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_TURN_LEFT, ARTIST_ICON_SIZE, ARTIST_ICON_SIZE, "Girar izquierda 90°"));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Girar 90° a la izquierda");
      this.setColour(ARTIST_COLOR);
    }
  };

  // Simple turn right (90 degrees for beginners)
  Blockly.Blocks["artist_turn_right_90"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_TURN_RIGHT, ARTIST_ICON_SIZE, ARTIST_ICON_SIZE, "Girar derecha 90°"));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Girar 90° a la derecha");
      this.setColour(ARTIST_COLOR);
    }
  };

  // Pen up
  Blockly.Blocks["artist_pen_up"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_PEN_UP, ARTIST_ICON_SIZE, ARTIST_ICON_SIZE, "Subir lápiz"));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Subir el lápiz (dejar de dibujar)");
      this.setColour(ARTIST_COLOR);
    }
  };

  // Pen down
  Blockly.Blocks["artist_pen_down"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(ICON_PEN_DOWN, ARTIST_ICON_SIZE, ARTIST_ICON_SIZE, "Bajar lápiz"));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Bajar el lápiz (empezar a dibujar)");
      this.setColour(ARTIST_COLOR);
    }
  };

  // Set color dropdown
  Blockly.Blocks["artist_set_color"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Color:")
        .appendField(new Blockly.FieldDropdown([
          ["Negro", "#000000"],
          ["Rojo", "#FF0000"],
          ["Verde", "#00AA00"],
          ["Azul", "#0000FF"],
          ["Amarillo", "#FFD700"],
          ["Naranja", "#FF8C00"],
          ["Violeta", "#9400D3"],
          ["Rosa", "#FF69B4"],
          ["Celeste", "#00BFFF"],
          ["Marrón", "#8B4513"]
        ]), "COLOR");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Cambiar el color del lápiz");
      this.setColour(ARTIST_COLOR);
    }
  };

  // Set width dropdown
  Blockly.Blocks["artist_set_width"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Grosor:")
        .appendField(new Blockly.FieldDropdown([
          ["Fino (1)", "1"],
          ["Normal (3)", "3"],
          ["Medio (5)", "5"],
          ["Grueso (8)", "8"],
          ["Muy grueso (12)", "12"]
        ]), "WIDTH");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setTooltip("Cambiar el grosor del lápiz");
      this.setColour(ARTIST_COLOR);
    }
  };

  const pathToMedia = `${BASE_URL}vendor/scratch-blocks/media/`;

  // Repeat block (same structure as maze)
  if (!Blockly.Blocks["artist_repeat"]) {
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
  }
};

/**
 * Toolbox XML for horizontal artist blocks.
 */
export const ARTIST_TOOLBOX_XML = `
<xml>
  <block type="artist_move_simple"></block>
  <block type="artist_move">
    <value name="DISTANCE">
      <shadow type="math_whole_number"><field name="NUM">50</field></shadow>
    </value>
  </block>
  <block type="artist_turn_right">
    <value name="ANGLE">
      <shadow type="math_whole_number"><field name="NUM">90</field></shadow>
    </value>
  </block>
  <block type="artist_turn_left">
    <value name="ANGLE">
      <shadow type="math_whole_number"><field name="NUM">90</field></shadow>
    </value>
  </block>
  <block type="artist_turn_right_90"></block>
  <block type="artist_turn_left_90"></block>
  <block type="artist_pen_up"></block>
  <block type="artist_pen_down"></block>
  <block type="artist_set_color"></block>
  <block type="artist_set_width"></block>
  <block type="artist_repeat">
    <value name="TIMES">
      <shadow type="math_whole_number"><field name="NUM">4</field></shadow>
    </value>
  </block>
</xml>
`;

/**
 * Compile options for horizontal artist blocks.
 */
export const ARTIST_COMPILE_OPTIONS = {
  START_TYPES: ["event_inicio", "event_whenflagclicked"],
  MOVE_TYPES: ["artist_move", "artist_move_simple"],
  TURN_LEFT_TYPES: ["artist_turn_left", "artist_turn_left_90"],
  TURN_RIGHT_TYPES: ["artist_turn_right", "artist_turn_right_90"],
  REPEAT_TYPES: ["artist_repeat"],
  PEN_UP_TYPES: ["artist_pen_up"],
  PEN_DOWN_TYPES: ["artist_pen_down"],
  COLOR_TYPES: ["artist_set_color"],
  WIDTH_TYPES: ["artist_set_width"],
  // Map simple blocks to default values
  SIMPLE_MOVE_DISTANCE: 50,
  SIMPLE_TURN_ANGLE: 90
};
