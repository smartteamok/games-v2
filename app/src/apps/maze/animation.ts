// Sistema de animación para movimiento suave del jugador

export type AnimatedPlayer = {
  x: number;
  y: number;
  dir: string;
  animating: boolean;
};

const ANIMATION_DURATION = 250; // ms por celda
const TURN_DURATION = 200; // ms para rotación

// Easing function (ease-out)
const easeOut = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

// Interpola entre dos valores
const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

// Anima el movimiento de una celda a otra
export const animateMove = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  onUpdate: (x: number, y: number) => void,
  onComplete: () => void
): (() => void) => {
  let startTime: number | null = null;
  let animationFrame: number | null = null;
  let cancelled = false;

  const animate = (currentTime: number) => {
    if (cancelled) return;

    if (startTime === null) {
      startTime = currentTime;
    }

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
    const eased = easeOut(progress);

    const currentX = lerp(fromX, toX, eased);
    const currentY = lerp(fromY, toY, eased);

    onUpdate(currentX, currentY);

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      onComplete();
    }
  };

  animationFrame = requestAnimationFrame(animate);

  return () => {
    cancelled = true;
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
    }
  };
};

// Anima la rotación
export const animateTurn = (
  _fromDir: string,
  toDir: string,
  onUpdate: (dir: string, progress: number) => void,
  onComplete: () => void
): (() => void) => {
  let startTime: number | null = null;
  let animationFrame: number | null = null;
  let cancelled = false;

  const animate = (currentTime: number) => {
    if (cancelled) return;

    if (startTime === null) {
      startTime = currentTime;
    }

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / TURN_DURATION, 1);
    const eased = easeOut(progress);

    onUpdate(toDir, eased);

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      onComplete();
    }
  };

  animationFrame = requestAnimationFrame(animate);

  return () => {
    cancelled = true;
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
    }
  };
};

// Promise wrapper para animación de movimiento
export const animateMoveAsync = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  onUpdate: (x: number, y: number) => void
): Promise<void> => {
  return new Promise((resolve) => {
    const cancel = animateMove(fromX, fromY, toX, toY, onUpdate, resolve);
    // Store cancel function if needed for cleanup
    (window as any).__lastMoveAnimation = cancel;
  });
};

// Promise wrapper para animación de rotación
export const animateTurnAsync = (
  fromDir: string,
  toDir: string,
  onUpdate: (dir: string, progress: number) => void
): Promise<void> => {
  return new Promise((resolve) => {
    const cancel = animateTurn(fromDir, toDir, onUpdate, resolve);
    (window as any).__lastTurnAnimation = cancel;
  });
};
