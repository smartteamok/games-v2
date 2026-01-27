type BlocklyLike = {
  inject: (mount: HTMLElement, options: Record<string, unknown>) => unknown;
  Events?: { UI?: string };
  Xml?: {
    workspaceToDom: (workspace: unknown) => Element;
    domToText: (xml: Element) => string;
    textToDom: (text: string) => Element;
    domToWorkspace: (xml: Element, workspace: unknown) => void;
  };
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
  clear?: () => void;
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
  
  // Interceptar setValue de FieldNumber para hacer save/load automático
  // Estrategia: cuando cambia un número, hacer save/load del workspace para forzar re-render completo
  // Usamos debounce para evitar hacerlo demasiado frecuentemente
  // Map para rastrear timeouts por workspace (permite múltiples workspaces)
  const workspaceRefreshTimeouts = new Map<any, number>();
  const REFRESH_DELAY = 150; // ms de delay antes de hacer refresh
  
  const refreshWorkspace = (ws: WorkspaceLike) => {
    if (!Blockly.Xml) return;
    
    try {
      // Guardar el estado actual del workspace
      const xml = Blockly.Xml.workspaceToDom(ws);
      const xmlText = Blockly.Xml.domToText(xml);
      
      // Limpiar y recargar para forzar re-render completo
      ws.clear?.();
      const xmlDom = Blockly.Xml.textToDom(xmlText);
      Blockly.Xml.domToWorkspace(xmlDom, ws);
      
      // Limpiar el timeout del Map después de ejecutar
      workspaceRefreshTimeouts.delete(ws);
    } catch (error) {
      // Ignorar errores silenciosamente
      workspaceRefreshTimeouts.delete(ws);
    }
  };
  
  // Interceptar setValue solo una vez (a nivel global)
  if (!(Blockly as any).__fieldNumberSetValueIntercepted) {
    const originalSetValue = (Blockly as any).FieldNumber?.prototype?.setValue;
    if (originalSetValue && typeof originalSetValue === "function") {
      (Blockly as any).FieldNumber.prototype.setValue = function(newValue: any) {
        // Llamar al método original
        const result = originalSetValue.call(this, newValue);
        
        // Verificar si el bloque está en un workspace válido
        const sourceBlock = this.sourceBlock_;
        if (sourceBlock) {
          const ws = sourceBlock.workspace;
          if (ws && Blockly.Xml) {
            // Cancelar timeout anterior para este workspace si existe
            const existingTimeout = workspaceRefreshTimeouts.get(ws);
            if (existingTimeout !== undefined) {
              clearTimeout(existingTimeout);
            }
            
            // Programar refresh con debounce
            const timeoutId = window.setTimeout(() => {
              refreshWorkspace(ws as WorkspaceLike);
            }, REFRESH_DELAY);
            
            workspaceRefreshTimeouts.set(ws, timeoutId);
          }
        }
        
        return result;
      };
      
      // Marcar como interceptado para evitar múltiples interceptaciones
      (Blockly as any).__fieldNumberSetValueIntercepted = true;
    }
  }
  
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
