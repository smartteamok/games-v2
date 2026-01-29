/**
 * HTML del layout de juego (toolbar + stage + editor).
 * Incluye botón Volver a la landing.
 */

export function getGameLayoutHtml(): string {
  return `
  <div class="layout">
    <div class="toolbar">
      <a href="#/" id="btnBack" class="toolbar-btn toolbar-btn-back" title="Volver al inicio">
        <span>← Volver</span>
      </a>
      <div class="toolbar-sep"></div>
      <label for="game-select" class="toolbar-label">Juego</label>
      <select id="game-select" class="game-select"></select>
      <div class="toolbar-sep"></div>
      <div id="level-bar" class="toolbar-level-bar"></div>
      <div class="toolbar-spacer"></div>
      <button id="btnSkills" class="toolbar-btn toolbar-btn-skills" title="Ver habilidades">
        <span>Habilidades</span>
      </button>
    </div>

    <div id="game-stage" class="game-stage">
      <div id="stage" class="stage"></div>
    </div>

    <div class="editor-container">
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
