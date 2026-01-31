/**
 * Stage play/restart button UI component.
 */

export type PlayButtonState = "play" | "restart" | "disabled";

const PLAY_SVG = `
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
  </svg>
`;

const RESTART_SVG = `
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12H4C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z" fill="currentColor"/>
  </svg>
`;

const DISABLED_SVG = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
  </svg>
`;

const PLAY_SVG_VERTICAL = `<svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg>`;
const RESTART_SVG_VERTICAL = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12H4C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z" fill="currentColor"/></svg>`;
const DISABLED_SVG_VERTICAL = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>`;

export const createStagePlayButton = (): HTMLButtonElement => {
  const button = document.createElement("button");
  button.className = "stage-play-button";
  button.setAttribute("aria-label", "Ejecutar programa");
  button.setAttribute("data-state", "play");
  updatePlayButtonState(button, "play");
  return button;
};

export const updatePlayButtonState = (button: HTMLButtonElement, state: PlayButtonState): void => {
  button.setAttribute("data-state", state);
  button.disabled = state === "disabled";

  if (state === "play") {
    button.innerHTML = PLAY_SVG;
    button.setAttribute("aria-label", "Ejecutar programa");
  } else if (state === "restart") {
    button.innerHTML = RESTART_SVG;
    button.setAttribute("aria-label", "Reiniciar y ejecutar");
  } else {
    button.innerHTML = DISABLED_SVG;
    button.setAttribute("aria-label", "Ejecutando...");
  }
};

export const updateVerticalPlayButtonState = (button: HTMLButtonElement, state: PlayButtonState): void => {
  button.setAttribute("data-state", state);
  button.disabled = state === "disabled";

  if (state === "play") {
    button.innerHTML = PLAY_SVG_VERTICAL;
    button.setAttribute("aria-label", "Ejecutar programa");
  } else if (state === "restart") {
    button.innerHTML = RESTART_SVG_VERTICAL;
    button.setAttribute("aria-label", "Reiniciar y ejecutar");
  } else {
    button.innerHTML = DISABLED_SVG_VERTICAL;
    button.setAttribute("aria-label", "Ejecutando...");
  }
};

/**
 * Update both horizontal and vertical play buttons.
 */
export const updateStagePlayButton = (state: PlayButtonState): void => {
  const buttonH = document.querySelector(".stage-play-button") as HTMLButtonElement;
  if (buttonH) updatePlayButtonState(buttonH, state);

  const buttonV = document.getElementById("stage-play-btn-vertical") as HTMLButtonElement;
  if (buttonV) updateVerticalPlayButtonState(buttonV, state);
};
