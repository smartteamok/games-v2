import type { BlockType } from "../apps/types";

/**
 * HTML del layout de juego. Para vertical: 3 columnas (bloques | canvas | maze).
 * Incluye botón Volver a la landing.
 */
export function getGameLayoutHtml(blockType?: BlockType): string {
  const isVertical = blockType === "vertical";
  const layoutClass = isVertical ? "layout layout-vertical" : "layout";

  if (isVertical) {
    return `
  <div class="${layoutClass}">
    <div class="toolbar">
      <div class="toolbar-left">
        <a href="#/" id="btnBack" class="toolbar-btn toolbar-btn-back" title="Volver al inicio">
          <span>← Volver</span>
        </a>
        <div class="toolbar-sep"></div>
        <label for="game-select" class="toolbar-label">Juego</label>
        <select id="game-select" class="game-select"></select>
      </div>
      <div class="toolbar-center">
        <div id="level-bar" class="toolbar-level-bar"></div>
      </div>
      <div class="toolbar-right">
        <button id="btnSkills" class="toolbar-btn toolbar-btn-skills" title="Ver habilidades">
          <span>Habilidades</span>
        </button>
      </div>
    </div>

    <div class="game-body-vertical">
      <div class="blockly-editor-column">
        <div class="blockly-wrapper-vertical">
          <div id="blocklyArea" class="blocklyArea"></div>
          <div id="blocklyDiv" class="blocklyDiv"></div>
        </div>
        <div class="controls-bar-vertical">
          <button id="stage-play-btn-vertical" class="stage-play-button-vertical" data-state="play" aria-label="Ejecutar programa">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg>
          </button>
          <div id="instructions" class="instructions instructions-vertical">
            <div class="instructions-content">
              <p class="instructions-placeholder">—</p>
            </div>
          </div>
          <div id="status-vertical" class="status-vertical">Listo</div>
        </div>
      </div>
      <div class="stage-column-vertical">
        <div id="game-stage" class="game-stage game-stage-vertical">
          <div id="stage" class="stage"></div>
          <!-- Navegación de niveles para móvil -->
          <div id="mobile-level-nav" class="mobile-level-nav">
            <button id="prev-level-btn" aria-label="Nivel anterior">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <span id="level-indicator" class="level-indicator">1 / 10</span>
            <button id="next-level-btn" aria-label="Siguiente nivel">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
  }

  return `
  <div class="${layoutClass}">
    <div class="toolbar">
      <div class="toolbar-left">
        <a href="#/" id="btnBack" class="toolbar-btn toolbar-btn-back" title="Volver al inicio">
          <span>← Volver</span>
        </a>
        <div class="toolbar-sep"></div>
        <label for="game-select" class="toolbar-label">Juego</label>
        <select id="game-select" class="game-select"></select>
      </div>
      <div class="toolbar-center">
        <div id="level-bar" class="toolbar-level-bar"></div>
      </div>
      <div class="toolbar-right">
        <button id="btnSkills" class="toolbar-btn toolbar-btn-skills" title="Ver habilidades">
          <span>Habilidades</span>
        </button>
      </div>
    </div>

    <div id="game-stage" class="game-stage">
      <div id="stage" class="stage"></div>
      <!-- Navegación de niveles para móvil -->
      <div id="mobile-level-nav" class="mobile-level-nav">
        <button id="prev-level-btn" aria-label="Nivel anterior">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <span id="level-indicator" class="level-indicator">1 / 10</span>
        <button id="next-level-btn" aria-label="Siguiente nivel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>

    <div class="editor-container">
      <!-- Contador de bloques flotante para móvil -->
      <div id="floating-block-counter" class="floating-block-counter">
        <div class="block-count-display">
          <svg class="block-count-icon" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M9 12h6M12 9v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span id="floating-block-count">0 / 10</span>
        </div>
      </div>
      <div id="instructions" class="instructions">
        <h3 class="instructions-title">Instrucciones disponibles</h3>
        <div class="instructions-content">
          <p class="instructions-placeholder">Las instrucciones se mostrarán aquí.</p>
        </div>
      </div>
      <div class="editor">
        <div id="blocklyArea" class="blocklyArea"></div>
        <div id="blocklyDiv" class="blocklyDiv"></div>
      </div>
    </div>
  </div>
  `;
}

/** Muestra mensaje "Próximamente" en stage y editor cuando el juego no está disponible. */
export function showComingSoon(root: HTMLElement): void {
  const stage = root.querySelector("#stage") as HTMLDivElement;
  const instructionsContent = root.querySelector(".instructions-content");
  const editor = root.querySelector(".editor");

  if (stage) {
    stage.innerHTML = `
      <div class="coming-soon-message">
        <p class="coming-soon-title">Próximamente</p>
        <p class="coming-soon-desc">Este juego estará disponible pronto.</p>
      </div>
    `;
  }
  if (instructionsContent) {
    instructionsContent.innerHTML = '<p class="instructions-placeholder">—</p>';
  }
  if (editor) {
    (editor as HTMLElement).innerHTML = `
      <div class="coming-soon-message" style="display: flex; align-items: center; justify-content: center; height: 100%;">
        <p style="color: var(--color-text-light);">Próximamente</p>
      </div>
    `;
  }
}
