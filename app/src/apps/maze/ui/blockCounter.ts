/**
 * Block limit counter UI component.
 */

import { countBlocks } from "../../shared/maze-like";
import type { MazeLevel } from "../../shared/maze-like";

/**
 * Update the block limit counter display.
 */
export const updateBlockLimitCounter = (
  workspace: unknown,
  level: MazeLevel
): void => {
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

/**
 * Enable or disable toolbox blocks based on block limit.
 */
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
