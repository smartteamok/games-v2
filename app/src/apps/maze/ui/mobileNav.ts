/**
 * Mobile navigation UI components for game levels.
 */

import type { LevelInfo } from "../../types";

export interface MobileNavElements {
  prevBtn: HTMLButtonElement | null;
  nextBtn: HTMLButtonElement | null;
  indicator: HTMLElement | null;
  floatingCounter: HTMLElement | null;
}

/**
 * Gets the mobile navigation elements from the DOM.
 */
export function getMobileNavElements(): MobileNavElements {
  return {
    prevBtn: document.getElementById("prev-level-btn") as HTMLButtonElement | null,
    nextBtn: document.getElementById("next-level-btn") as HTMLButtonElement | null,
    indicator: document.getElementById("level-indicator"),
    floatingCounter: document.getElementById("floating-block-count")
  };
}

/**
 * Updates the mobile level indicator and button states.
 */
export function updateMobileLevelNav(
  currentLevelId: number,
  totalLevels: number,
  completedLevels: number[],
  onLevelChange: (levelId: number) => void
): void {
  const { prevBtn, nextBtn, indicator } = getMobileNavElements();

  if (indicator) {
    indicator.textContent = `${currentLevelId} / ${totalLevels}`;
  }

  if (prevBtn) {
    const canGoPrev = currentLevelId > 1;
    prevBtn.disabled = !canGoPrev;
    
    // Remove old listener and add new one
    const newPrevBtn = prevBtn.cloneNode(true) as HTMLButtonElement;
    newPrevBtn.disabled = !canGoPrev;
    newPrevBtn.addEventListener("click", () => {
      if (currentLevelId > 1) {
        onLevelChange(currentLevelId - 1);
      }
    });
    prevBtn.parentNode?.replaceChild(newPrevBtn, prevBtn);
  }

  if (nextBtn) {
    // Can go next if current level is completed or next level is unlocked
    const canGoNext = currentLevelId < totalLevels && 
      (completedLevels.includes(currentLevelId) || completedLevels.includes(currentLevelId - 1) || currentLevelId === 1);
    nextBtn.disabled = !canGoNext;
    
    // Remove old listener and add new one
    const newNextBtn = nextBtn.cloneNode(true) as HTMLButtonElement;
    newNextBtn.disabled = !canGoNext;
    newNextBtn.addEventListener("click", () => {
      if (canGoNext) {
        onLevelChange(currentLevelId + 1);
      }
    });
    nextBtn.parentNode?.replaceChild(newNextBtn, nextBtn);
  }
}

/**
 * Updates the floating block counter for mobile view.
 */
export function updateFloatingBlockCounter(
  workspace: unknown,
  blockLimit: number | undefined
): void {
  const elements = getMobileNavElements();
  const counterEl = elements.floatingCounter;
  
  if (!counterEl) return;
  
  const ws = workspace as {
    getAllBlocks?: (ordered: boolean) => { type: string }[];
  };
  
  const allBlocks = ws.getAllBlocks?.(false) ?? [];
  
  // Count only relevant blocks (not system blocks)
  const relevantBlocks = allBlocks.filter(
    (block) =>
      !block.type.startsWith("dropdown_") &&
      !block.type.startsWith("math_") &&
      block.type !== "event_inicio" &&
      block.type !== "event_whenflagclicked"
  );
  
  const count = relevantBlocks.length;
  
  if (blockLimit !== undefined && blockLimit > 0) {
    counterEl.textContent = `${count} / ${blockLimit}`;
    
    const display = counterEl.parentElement;
    if (display) {
      if (count > blockLimit) {
        display.classList.add("exceeded");
      } else {
        display.classList.remove("exceeded");
      }
    }
  } else {
    counterEl.textContent = `${count}`;
    counterEl.parentElement?.classList.remove("exceeded");
  }
}

/**
 * Initializes mobile navigation with proper event listeners.
 */
export function initMobileNav(
  levels: LevelInfo[],
  getCurrentLevelId: () => number,
  getCompletedLevels: () => number[],
  onLevelChange: (levelId: number) => void
): void {
  const update = () => {
    const currentLevelId = getCurrentLevelId();
    const completedLevels = getCompletedLevels();
    updateMobileLevelNav(
      currentLevelId,
      levels.length,
      completedLevels,
      onLevelChange
    );
  };
  
  // Initial update
  update();
}
