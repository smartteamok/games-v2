/**
 * Maze game - the main horizontal maze game.
 * Uses shared maze-like module for core functionality.
 */

import type {
  AppDefinition,
  AppRenderContext,
  ConstraintResult,
  LevelInfo,
  RuntimeAdapter
} from "../types";
import { levels } from "./levels";
import type { MazeLevel } from "./levels";
import { animateMoveAsync, animateTurnAsync } from "./animation";
import {
  type MazeState,
  type MazeUI,
  type MazeGameConfig,
  type AnimationRenderState,
  type SpriteAnimationState,
  makeInitialState as sharedMakeInitialState,
  getLevel as sharedGetLevel,
  getStatusText,
  turnLeft,
  turnRight,
  isBlocked,
  inBounds,
  getDelta,
  countBlocks,
  applyInitialBlocks as sharedApplyInitialBlocks,
  initSprites,
  loadPlayerSprite,
  createAnimationState,
  drawMaze as sharedDrawMaze,
  DIR_ORDER
} from "../shared/maze-like";

// Re-export for backward compatibility
export type { MazeState } from "../shared/maze-like";
export type BlockType = "horizontal" | "vertical";

const GAME_COLOR = "#4C97FF";
const GAME_ICON_SIZE = 42;

const BASE_URL = import.meta.env.BASE_URL;

/** Iconos de bloques horizontales */
const ICON_MOVE = `${BASE_URL}game-icons/move-right.svg`;
const ICON_BACK = `${BASE_URL}game-icons/move-left.svg`;
const ICON_TURN_LEFT = `${BASE_URL}game-icons/turn-left.svg`;
const ICON_TURN_RIGHT = `${BASE_URL}game-icons/turn-right.svg`;
const ICON_INICIO = `${BASE_URL}icons/play-green.svg`;

const gameConfig: MazeGameConfig = {
  gameColor: GAME_COLOR,
  useSprites: true
};

// UI and animation state
let ui: MazeUI | null = null;
let animationState: AnimationRenderState = null;
let spriteAnimState: SpriteAnimationState = createAnimationState();
let skillsPanel: HTMLElement | undefined = undefined;
let skillsPanelOverlay: HTMLElement | undefined = undefined;

let mazeContainerW = 0;
let mazeContainerH = 0;
let resizeObserver: ResizeObserver | null = null;

// Initialize sprites on module load
initSprites(levels);

// Wrapper functions for backward compatibility
export const getLevel = (levelId: number): MazeLevel =>
  sharedGetLevel(levels, levelId);

export const makeInitialState = (levelId: number, completedLevels: number[] = []): MazeState =>
  sharedMakeInitialState(levels, levelId, completedLevels);

export const applyInitialBlocks = (
  Blockly: any,
  workspace: any,
  level: MazeLevel,
  blockType: BlockType
): void => sharedApplyInitialBlocks(Blockly, workspace, level, blockType);

export const ensureUI = (rootEl: HTMLElement, ctx: AppRenderContext<MazeState>): MazeUI => {
  if (ui && ui.rootEl === rootEl && rootEl.contains(ui.container)) {
    return ui;
  }
  rootEl.innerHTML = "";

  const isVertical = document.querySelector(".layout-vertical") !== null;

  const container = document.createElement("div");
  container.className = "maze-stage";

  const progressBar = document.createElement("div");
  progressBar.className = "maze-progress-bar";
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-label", "Niveles del juego");

  const levelBarContainer = document.getElementById("level-bar");
  if (levelBarContainer) {
    levelBarContainer.innerHTML = "";
    levelBarContainer.appendChild(progressBar);
  }

  const canvas = document.createElement("canvas");
  canvas.className = "maze-canvas";
  const canvasCtx = canvas.getContext("2d");
  if (!canvasCtx) {
    throw new Error("No se pudo crear el canvas del laberinto.");
  }

  let statusEl: HTMLDivElement;
  let stagePlayButton: HTMLButtonElement | undefined;

  if (isVertical) {
    statusEl = document.getElementById("status-vertical") as HTMLDivElement;
    if (!statusEl) {
      statusEl = document.createElement("div");
      statusEl.className = "status-vertical";
      statusEl.id = "status-vertical";
    }
    stagePlayButton = document.getElementById("stage-play-btn-vertical") as HTMLButtonElement;
  } else {
    statusEl = document.createElement("div");
    statusEl.className = "maze-status";
    stagePlayButton = createStagePlayButton();
    rootEl.appendChild(stagePlayButton);

    const statusContainer = document.createElement("div");
    statusContainer.className = "maze-status-container";
    statusContainer.appendChild(statusEl);
    rootEl.appendChild(statusContainer);
  }

  container.appendChild(canvas);
  rootEl.appendChild(container);

  // Create skills panel once
  if (!skillsPanel) {
    skillsPanel = createSkillsPanel();
    skillsPanelOverlay = createSkillsPanelOverlay();
    document.body.appendChild(skillsPanelOverlay);
    document.body.appendChild(skillsPanel);
  }

  (rootEl as any).__renderContext = ctx;

  const mazeUI: MazeUI = {
    rootEl,
    container,
    progressBar,
    canvas,
    ctx: canvasCtx,
    statusEl,
    skillsPanel,
    skillsPanelOverlay,
    stagePlayButton
  };
  ui = mazeUI;
  updateProgressBar(ctx.getState?.() as MazeState | undefined);

  const gameStage = document.getElementById("game-stage");
  const scheduleRedraw = () => {
    if (!ui?.container || !document.contains(ui.container)) return;
    const state = (rootEl as any).__renderContext?.getState?.() as MazeState | undefined;
    if (state) drawMaze(state);
  };

  if (gameStage) {
    mazeContainerW = gameStage.clientWidth || gameStage.offsetWidth;
    mazeContainerH = gameStage.clientHeight || gameStage.offsetHeight;
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => {
      if (!gameStage) return;
      mazeContainerW = gameStage.clientWidth || gameStage.offsetWidth;
      mazeContainerH = gameStage.clientHeight || gameStage.offsetHeight;
      scheduleRedraw();
    });
    resizeObserver.observe(gameStage);
  }

  loadPlayerSprite(() => scheduleRedraw());

  if (statusEl) {
    const state = ctx.getState?.() as MazeState | undefined;
    statusEl.textContent = state ? getStatusText(state) : "Listo.";
  }

  return mazeUI;
};

const createSkillsPanel = (): HTMLElement => {
  const panel = document.createElement("div");
  panel.className = "skills-panel";

  const header = document.createElement("div");
  header.className = "skills-panel-header";

  const title = document.createElement("h2");
  title.className = "skills-panel-title";
  title.textContent = "Habilidades";

  const closeBtn = document.createElement("button");
  closeBtn.className = "skills-panel-close";
  closeBtn.innerHTML = "×";
  closeBtn.setAttribute("aria-label", "Cerrar panel");
  closeBtn.addEventListener("click", () => closeSkillsPanel());

  header.appendChild(title);
  header.appendChild(closeBtn);

  const content = document.createElement("div");
  content.className = "skills-panel-content";
  content.innerHTML = "<p class='skills-placeholder'>Las habilidades se mostrarán aquí.</p>";

  panel.appendChild(header);
  panel.appendChild(content);

  return panel;
};

const createSkillsPanelOverlay = (): HTMLElement => {
  const overlay = document.createElement("div");
  overlay.className = "skills-panel-overlay";
  overlay.addEventListener("click", () => closeSkillsPanel());
  return overlay;
};

const createStagePlayButton = (): HTMLButtonElement => {
  const button = document.createElement("button");
  button.className = "stage-play-button";
  button.setAttribute("aria-label", "Ejecutar programa");
  button.setAttribute("data-state", "play");
  updateStagePlayButtonState(button, "play");
  return button;
};

const updateStagePlayButtonState = (button: HTMLButtonElement, state: "play" | "restart" | "disabled"): void => {
  button.setAttribute("data-state", state);
  button.disabled = state === "disabled";

  if (state === "play") {
    button.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
      </svg>
    `;
    button.setAttribute("aria-label", "Ejecutar programa");
  } else if (state === "restart") {
    button.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12H4C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z" fill="currentColor"/>
      </svg>
    `;
    button.setAttribute("aria-label", "Reiniciar y ejecutar");
  } else {
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
      </svg>
    `;
    button.setAttribute("aria-label", "Ejecutando...");
  }
};

export const updateStagePlayButton = (state: "play" | "restart" | "disabled"): void => {
  const buttonH = document.querySelector(".stage-play-button") as HTMLButtonElement;
  if (buttonH) updateStagePlayButtonState(buttonH, state);

  const buttonV = document.getElementById("stage-play-btn-vertical") as HTMLButtonElement;
  if (buttonV) updateVerticalPlayButtonState(buttonV, state);
};

const updateVerticalPlayButtonState = (button: HTMLButtonElement, state: "play" | "restart" | "disabled"): void => {
  button.setAttribute("data-state", state);
  button.disabled = state === "disabled";
  if (state === "play") {
    button.innerHTML = `<svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg>`;
    button.setAttribute("aria-label", "Ejecutar programa");
  } else if (state === "restart") {
    button.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12H4C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z" fill="currentColor"/></svg>`;
    button.setAttribute("aria-label", "Reiniciar y ejecutar");
  } else {
    button.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>`;
    button.setAttribute("aria-label", "Ejecutando...");
  }
};

export const updateBlockLimitCounter = (workspace: unknown, levelId: number): void => {
  const level = getLevel(levelId);
  const blockLimit = level.blockLimit;
  const instructionsEl = document.querySelector(".instructions");

  if (!instructionsEl) return;

  const instructionsContent = instructionsEl.querySelector(".instructions-content");
  if (!instructionsContent) return;

  if (blockLimit === undefined) {
    instructionsContent.innerHTML = `
      <div class="block-limit-counter">
        <div class="block-limit-number">∞</div>
        <div class="block-limit-label">sin límite</div>
      </div>
    `;
    updateToolboxBlocks(workspace, true);
    return;
  }

  const currentCount = countBlocks(workspace);
  const remaining = blockLimit - currentCount;
  const exceeded = remaining < 0;

  if (exceeded) {
    instructionsContent.innerHTML = `
      <div class="block-limit-counter block-limit-exceeded">
        <span class="block-limit-exceeded-msg">¡Cantidad de bloques superada!</span>
      </div>
    `;
  } else {
    instructionsContent.innerHTML = `
      <div class="block-limit-counter">
        <div class="block-limit-number">${remaining}</div>
        <div class="block-limit-label">${remaining === 1 ? "instrucción disponible" : "instrucciones disponibles"}</div>
      </div>
    `;
  }

  updateToolboxBlocks(workspace, !exceeded);
};

const updateToolboxBlocks = (workspace: any, enabled: boolean): void => {
  if (!workspace) return;

  const toolbox = workspace.getToolbox?.();
  if (!toolbox) return;

  const toolboxItems = toolbox.getToolboxItems?.();
  if (!toolboxItems) return;

  for (const item of toolboxItems) {
    if (!item) continue;

    if (typeof item.setDisabled === "function") {
      item.setDisabled(!enabled);
    }

    const element = item.getDiv?.();
    if (element) {
      if (enabled) {
        element.classList.remove("blocklyDisabled");
        element.style.opacity = "1";
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
      } else {
        element.classList.add("blocklyDisabled");
        element.style.opacity = "0.4";
        element.style.pointerEvents = "none";
        element.style.cursor = "not-allowed";
      }
    }
  }

  const flyout = toolbox.getFlyout?.();
  if (flyout) {
    const flyoutElement = flyout.getWorkspace?.()?.getParentSvg?.()?.parentElement;
    if (flyoutElement) {
      flyoutElement.style.pointerEvents = enabled ? "auto" : "none";
    }
  }
};

export const updateInstructions = (): void => {
  // Maintained for compatibility
};

const openSkillsPanel = (): void => {
  const panel = skillsPanel || (document.querySelector(".skills-panel") as HTMLElement);
  const overlay = skillsPanelOverlay || (document.querySelector(".skills-panel-overlay") as HTMLElement);
  if (panel && overlay) {
    panel.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

const closeSkillsPanel = (): void => {
  const panel = skillsPanel || (document.querySelector(".skills-panel") as HTMLElement);
  const overlay = skillsPanelOverlay || (document.querySelector(".skills-panel-overlay") as HTMLElement);
  if (panel && overlay) {
    panel.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
};

export const toggleSkillsPanel = (): void => {
  const panel = document.querySelector(".skills-panel") as HTMLElement;
  if (panel?.classList.contains("open")) {
    closeSkillsPanel();
  } else {
    openSkillsPanel();
  }
};

export const updateProgressBar = (state?: MazeState): void => {
  if (!ui) return;

  const currentLevelId = state?.levelId ?? 1;
  const completedLevels = state?.completedLevels ?? [];

  ui.progressBar.innerHTML = "";

  for (const level of levels) {
    const levelBtn = document.createElement("button");
    levelBtn.className = "maze-progress-level";
    levelBtn.type = "button";
    levelBtn.setAttribute("data-level-id", String(level.id));

    const isCompleted = completedLevels.includes(level.id);
    const isCurrent = level.id === currentLevelId;
    const isLocked = level.id > 1 && !completedLevels.includes(level.id - 1);

    if (isCompleted) {
      levelBtn.classList.add("maze-progress-level--completed");
      levelBtn.innerHTML = `<span class="maze-progress-level-icon">✓</span><span class="maze-progress-level-number">${level.id}</span>`;
      levelBtn.setAttribute("title", `${level.id}. ${level.title} - Completado`);
    } else if (isCurrent) {
      levelBtn.classList.add("maze-progress-level--current");
      levelBtn.innerHTML = `<span class="maze-progress-level-number">${level.id}</span>`;
      levelBtn.setAttribute("title", `${level.id}. ${level.title} - Actual`);
    } else if (isLocked) {
      levelBtn.classList.add("maze-progress-level--locked");
      levelBtn.innerHTML = `<span class="maze-progress-level-icon">🔒</span>`;
      levelBtn.disabled = true;
      levelBtn.setAttribute("title", "Nivel bloqueado");
    } else {
      levelBtn.innerHTML = `<span class="maze-progress-level-number">${level.id}</span>`;
      levelBtn.setAttribute("title", `${level.id}. ${level.title}`);
    }

    levelBtn.addEventListener("click", () => {
      if (levelBtn.disabled) return;
      const ctx = (ui?.rootEl as any).__renderContext as AppRenderContext<MazeState> | undefined;
      if (ctx) {
        const nextState = makeInitialState(level.id, completedLevels);
        ctx.updateState(nextState);
        ctx.setStatus(`Nivel ${level.id} listo`);
      }
    });

    ui.progressBar.appendChild(levelBtn);
  }
};

export const drawMaze = (state: MazeState): void => {
  if (!ui) return;

  sharedDrawMaze(
    {
      canvas: ui.canvas,
      ctx: ui.ctx,
      statusEl: ui.statusEl,
      containerWidth: mazeContainerW,
      containerHeight: mazeContainerH
    },
    state,
    levels,
    gameConfig,
    animationState,
    spriteAnimState
  );
};

export const registerMazeLikeBlocks = (Blockly: any) => {
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

export const adapter: RuntimeAdapter<MazeState> = {
  applyOp: async (op, state) => {
    const level = getLevel(state.levelId);
    if (state.status === "win" || state.status === "error") {
      return state;
    }

    if (op.kind === "turn") {
      const newDir = op.direction === "left" ? turnLeft(state.player.dir) : turnRight(state.player.dir);
      const oldDir = state.player.dir;

      await animateTurnAsync(oldDir, newDir, (_dir, progress) => {
        animationState = {
          playerX: state.player.x,
          playerY: state.player.y,
          playerDir: progress < 0.5 ? oldDir : newDir,
          dirProgress: progress
        };
        drawMaze(state);
      });

      state.player.dir = newDir;
      animationState = null;
      drawMaze(state);
      return state;
    }

    if (op.kind === "move") {
      const delta = getDelta(state.player.dir);
      const steps = Math.abs(op.steps);
      const sign = op.steps >= 0 ? 1 : -1;

      for (let i = 0; i < steps; i += 1) {
        const nextX = state.player.x + delta.x * sign;
        const nextY = state.player.y + delta.y * sign;

        if (!inBounds(level, nextX, nextY) || isBlocked(level, nextX, nextY)) {
          state.status = "error";
          state.message = "¡Choque!";
          animationState = null;
          drawMaze(state);
          throw new Error("CHOQUE");
        }

        await animateMoveAsync(
          state.player.x,
          state.player.y,
          nextX,
          nextY,
          (x, y) => {
            animationState = {
              playerX: x,
              playerY: y,
              playerDir: state.player.dir,
              dirProgress: 1
            };
            drawMaze(state);
          }
        );

        state.player.x = nextX;
        state.player.y = nextY;
        animationState = null;

        if (!state.visitedCells) state.visitedCells = [];
        if (!state.visitedCells.some((c) => c.x === nextX && c.y === nextY)) {
          state.visitedCells.push({ x: nextX, y: nextY });
        }

        if (state.player.x === level.goal.x && state.player.y === level.goal.y) {
          const completedLevels = state.completedLevels ?? [];
          if (!completedLevels.includes(state.levelId)) {
            completedLevels.push(state.levelId);
            state.completedLevels = completedLevels;
          }

          const nextLevel = levels.find((l) => l.id === state.levelId + 1);
          state.status = "win";
          state.message = nextLevel ? `¡Llegaste! Avanzando al nivel ${nextLevel.id}...` : "¡Llegaste! ¡Completaste todos los niveles!";
          drawMaze(state);
          throw new Error("WIN");
        }

        drawMaze(state);
      }

      return state;
    }

    if (op.kind === "wait") {
      return state;
    }

    return state;
  },
  reset: (state) => {
    animationState = null;
    spriteAnimState = createAnimationState();
    const completedLevels = state.completedLevels ?? [];
    const next = makeInitialState(state.levelId, completedLevels);
    state.levelId = next.levelId;
    state.player = { ...next.player };
    state.status = next.status;
    state.message = next.message;
    state.completedLevels = completedLevels;
    state.visitedCells = next.visitedCells;
    drawMaze(state);
    return state;
  }
};

export const createMazeCheckConstraints = (repeatBlockType: string) => (
  workspace: unknown,
  state: MazeState
): ConstraintResult => {
  const level = getLevel(state.levelId);
  const constraints = level.constraints;
  if (!constraints) {
    return { ok: true };
  }
  const workspaceBlocks = (workspace as { getAllBlocks?: (ordered: boolean) => { type: string }[] })
    .getAllBlocks?.(false) ?? [];
  const blockTypes = workspaceBlocks
    .map((block) => block.type)
    .filter(
      (type) =>
        !type.startsWith("dropdown_") &&
        !type.startsWith("math_") &&
        type !== "event_inicio" &&
        type !== "event_whenflagclicked"
    );
  if (constraints.maxBlocks !== undefined && blockTypes.length > constraints.maxBlocks) {
    return { ok: false, message: `Usá máximo ${constraints.maxBlocks} bloques.` };
  }
  if (constraints.mustUseRepeat) {
    const hasRepeat = blockTypes.some((type) => type === repeatBlockType);
    if (!hasRepeat) {
      return { ok: false, message: "Tenés que usar un bloque de repetir." };
    }
  }
  return { ok: true };
};

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
