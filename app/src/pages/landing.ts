/**
 * Vista landing: grid de 3 tarjetas por fila con imagen, texto y metadata.
 */

import { GAME_CATALOG, type GameCatalogEntry } from "./catalog";
import { navigateToGame } from "../router";

const CARD_CLASS = "landing-card";
const CARD_IMAGE_CLASS = "landing-card-image";
const CARD_TITLE_CLASS = "landing-card-title";
const CARD_DESC_CLASS = "landing-card-desc";
const CARD_META_CLASS = "landing-card-meta";
const CARD_BADGE_CLASS = "landing-card-badge";

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderCard(game: GameCatalogEntry): string {
  const badge = game.comingSoon
    ? `<span class="${CARD_BADGE_CLASS}">Próximamente</span>`
    : "";
  const levelsText =
    game.levelsCount > 0 ? `${game.levelsCount} niveles` : "—";
  return `
    <article class="${CARD_CLASS}" data-game-id="${escapeHtml(game.id)}">
      <div class="${CARD_IMAGE_CLASS}">
        <img src="${escapeHtml(game.imageUrl)}" alt="" loading="lazy" />
        ${badge}
      </div>
      <h2 class="${CARD_TITLE_CLASS}">${escapeHtml(game.title)}</h2>
      <p class="${CARD_DESC_CLASS}">${escapeHtml(game.description)}</p>
      <div class="${CARD_META_CLASS}">
        <span>${escapeHtml(game.programmingType)}</span>
        <span> · </span>
        <span>${levelsText}</span>
      </div>
    </article>
  `;
}

export function renderLanding(): string {
  const cards = GAME_CATALOG.map(renderCard).join("");
  return `
    <div class="landing">
      <header class="landing-header">
        <h1 class="landing-title">Game Blocks</h1>
        <p class="landing-subtitle">Elegí un juego para empezar a programar</p>
      </header>
      <div class="landing-grid">
        ${cards}
      </div>
    </div>
  `;
}

export function mountLanding(root: HTMLElement): void {
  root.innerHTML = renderLanding();
  root.querySelectorAll(`.${CARD_CLASS}`).forEach((el) => {
    const card = el as HTMLElement;
    const gameId = card.getAttribute("data-game-id");
    if (!gameId) return;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.addEventListener("click", () => navigateToGame(gameId));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigateToGame(gameId);
      }
    });
  });
}
