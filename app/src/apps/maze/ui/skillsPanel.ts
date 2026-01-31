/**
 * Skills panel UI component.
 */

let skillsPanel: HTMLElement | undefined = undefined;
let skillsPanelOverlay: HTMLElement | undefined = undefined;

export const createSkillsPanel = (): HTMLElement => {
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

export const createSkillsPanelOverlay = (): HTMLElement => {
  const overlay = document.createElement("div");
  overlay.className = "skills-panel-overlay";
  overlay.addEventListener("click", () => closeSkillsPanel());
  return overlay;
};

export const ensureSkillsPanel = (): { panel: HTMLElement; overlay: HTMLElement } => {
  if (!skillsPanel) {
    skillsPanel = createSkillsPanel();
    skillsPanelOverlay = createSkillsPanelOverlay();
    document.body.appendChild(skillsPanelOverlay);
    document.body.appendChild(skillsPanel);
  }
  return { panel: skillsPanel, overlay: skillsPanelOverlay! };
};

export const openSkillsPanel = (): void => {
  const panel = skillsPanel || (document.querySelector(".skills-panel") as HTMLElement);
  const overlay = skillsPanelOverlay || (document.querySelector(".skills-panel-overlay") as HTMLElement);
  if (panel && overlay) {
    panel.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

export const closeSkillsPanel = (): void => {
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

export const getSkillsPanel = (): HTMLElement | undefined => skillsPanel;
export const getSkillsPanelOverlay = (): HTMLElement | undefined => skillsPanelOverlay;
