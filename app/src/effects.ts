/**
 * Efectos visuales para el juego (win, error).
 */

export function triggerWinEffect(stageEl: HTMLElement): void {
  const canvas = stageEl.querySelector(".maze-canvas") as HTMLCanvasElement;
  if (!canvas) return;
  
  canvas.style.transition = "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
  canvas.style.transform = "scale(1.1)";
  
  setTimeout(() => {
    canvas.style.transform = "scale(1)";
    setTimeout(() => { 
      canvas.style.transition = ""; 
    }, 600);
  }, 600);
}

export function triggerErrorEffect(stageEl: HTMLElement): void {
  const canvas = stageEl.querySelector(".maze-canvas") as HTMLCanvasElement;
  if (!canvas) return;
  
  canvas.style.animation = "shake 0.5s ease-in-out";
  canvas.style.borderColor = "#EF4444";
  
  setTimeout(() => {
    canvas.style.animation = "";
    setTimeout(() => { 
      canvas.style.borderColor = ""; 
    }, 300);
  }, 500);
}

export type StatusVariant = "normal" | "win" | "error";

export function setStatus(text: string, variant: StatusVariant = "normal"): void {
  const update = (el: HTMLElement) => {
    el.textContent = text;
    el.classList.remove("status--win", "status--error");
    if (variant === "win") el.classList.add("status--win");
    else if (variant === "error") el.classList.add("status--error");
  };
  
  const mazeStatus = document.querySelector(".maze-status") as HTMLElement | null;
  if (mazeStatus) update(mazeStatus);
  
  const statusVertical = document.getElementById("status-vertical");
  if (statusVertical) update(statusVertical);
}
