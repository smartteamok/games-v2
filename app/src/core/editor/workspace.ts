type BlocklyLike = {
  inject: (mount: HTMLElement, options: Record<string, unknown>) => unknown;
  Events?: { UI?: string };
};

export type WorkspaceOptions = {
  horizontalLayout?: boolean;
  toolboxPosition?: "start" | "end";
  mediaPath?: string;
  trashcan?: boolean;
  scrollbars?: boolean;
  fixedStartBlock?: { type: string; x: number; y: number };
};

type WorkspaceLike = {
  newBlock: (type: string) => any;
  getTopBlocks: (ordered: boolean) => any[];
  addChangeListener: (cb: (event?: { type?: string }) => void) => void;
  dispose?: () => void;
};

const ensureFixedStartBlock = (
  workspace: WorkspaceLike,
  fixed: { type: string; x: number; y: number }
): void => {
  const topBlocks = workspace.getTopBlocks(true);
  const startBlocks = topBlocks.filter((block) => block.type === fixed.type);
  let primary = startBlocks[0];

  if (!primary) {
    primary = workspace.newBlock(fixed.type);
    primary.initSvg?.();
    primary.render?.();
  }

  const pos = primary.getRelativeToSurfaceXY?.();
  if (pos && (pos.x !== fixed.x || pos.y !== fixed.y)) {
    primary.moveBy?.(fixed.x - pos.x, fixed.y - pos.y);
  } else if (!pos) {
    primary.moveBy?.(fixed.x, fixed.y);
  }

  primary.setDeletable?.(false);
  primary.setMovable?.(false);
  primary.setEditable?.(false);

  if (startBlocks.length > 1) {
    for (const extra of startBlocks.slice(1)) {
      extra.dispose?.(false);
    }
  }
};

// Creates a Blockly workspace with the shared horizontal defaults.
export const createWorkspace = (
  Blockly: BlocklyLike,
  mountEl: HTMLElement,
  toolboxXml: string,
  opts: WorkspaceOptions = {}
): unknown => {
  const BASE_URL = import.meta.env.BASE_URL;
  const workspace = Blockly.inject(mountEl, {
    toolbox: toolboxXml,
    horizontalLayout: opts.horizontalLayout ?? true,
    toolboxPosition: opts.toolboxPosition ?? "end",
    media: opts.mediaPath ?? `${BASE_URL}vendor/scratch-blocks/media/`,
    trashcan: opts.trashcan ?? true,
    scrollbars: opts.scrollbars ?? true
  }) as WorkspaceLike;

  /**
   * Fuerza re-render completo de un bloque y todos sus ancestros
   * Estrategia agresiva: invalida métricas y re-renderiza toda la cadena de bloques
   */
  const forceCompleteRender = (block: any): void => {
    if (!block || !block.rendered) {
      return;
    }

    // Invalidar métricas del bloque actual
    if (block.renderingMetrics_ !== undefined) {
      block.renderingMetrics_ = null;
    }

    // Re-renderizar el bloque actual
    if (typeof block.render === "function") {
      block.render(true); // true = forzar re-render completo
    }

    // Re-renderizar todos los ancestros (bloques padre, abuelo, etc.)
    let currentParent = block.getParent?.();
    while (currentParent && currentParent.rendered) {
      // Invalidar métricas del padre
      if (currentParent.renderingMetrics_ !== undefined) {
        currentParent.renderingMetrics_ = null;
      }
      // Re-renderizar el padre
      if (typeof currentParent.render === "function") {
        currentParent.render(true);
      }
      // Subir al siguiente nivel
      currentParent = currentParent.getParent?.();
    }
  };

  // Listener para detectar cambios en shadow blocks y forzar re-render completo
  // Esto maneja el caso cuando el usuario edita valores directamente en el workspace
  const forceBlockRender = (event?: any) => {
    // Ignorar solo eventos UI puros (movimientos)
    if (event?.type && Blockly.Events?.UI && event.type === Blockly.Events.UI) {
      return;
    }

    try {
      if (event?.blockId) {
        const block = (workspace as { getBlockById?: (id: string) => any }).getBlockById?.(event.blockId);
        if (block) {
          // Usar requestAnimationFrame para asegurar que se ejecute después de que Blockly procese el evento
          requestAnimationFrame(() => {
            try {
              // Si es un shadow block, forzar re-render completo del padre y ancestros
              if (block.isShadow?.()) {
                const parent = block.getParent?.();
                if (parent) {
                  // Re-renderizar el shadow block primero
                  forceCompleteRender(block);
                  // Luego re-renderizar el padre y todos sus ancestros
                  forceCompleteRender(parent);
                } else {
                  // Si no tiene padre, solo re-renderizar el bloque mismo
                  forceCompleteRender(block);
                }
              } else {
                // Para bloques normales, también forzar re-render completo con ancestros
                forceCompleteRender(block);
              }
            } catch (error) {
              // Ignorar errores silenciosamente
            }
          });
        }
      }
    } catch (error) {
      // Ignorar errores silenciosamente
    }
  };

  workspace.addChangeListener(forceBlockRender);

  if (opts.fixedStartBlock) {
    let ensuring = false;
    const ensure = (event?: { type?: string }) => {
      if (ensuring) {
        return;
      }
      if (event?.type && Blockly.Events?.UI && event.type === Blockly.Events.UI) {
        return;
      }
      ensuring = true;
      try {
        ensureFixedStartBlock(workspace, opts.fixedStartBlock!);
      } finally {
        ensuring = false;
      }
    };
    ensure();
    workspace.addChangeListener(ensure);
  }

  return workspace;
};

/** Disposes a Blockly workspace and clears the mount element for re-inject. */
export const destroyWorkspace = (
  workspace: unknown,
  mountEl: HTMLElement
): void => {
  const ws = workspace as WorkspaceLike;
  if (ws?.dispose) {
    ws.dispose();
  }
  mountEl.innerHTML = "";
};
