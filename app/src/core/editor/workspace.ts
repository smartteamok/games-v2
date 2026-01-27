type BlocklyLike = {
  inject: (mount: HTMLElement, options: Record<string, unknown>) => unknown;
  Events?: { 
    UI?: string;
    CHANGE?: string;
  };
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
  addChangeListener: (cb: (event?: { type?: string; element?: string; blockId?: string; name?: string }) => void) => void;
  dispose?: () => void;
  clear?: () => void;
  getBlockById?: (id: string) => any;
  isDragging?: () => boolean;
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

  // Estrategia 1: Event Listener específico para cambios en campos numéricos de shadow blocks
  // Escucha solo cambios de tipo "field" y filtra por shadow blocks conectados a inputs numéricos
  const refreshTimeouts = new WeakMap<any, ReturnType<typeof setTimeout>>();
  const REFRESH_DEBOUNCE_MS = 200;

  const refreshWorkspaceDebounced = (ws: any, BlocklyInstance: BlocklyLike) => {
    // Verificar que no hay interacciones activas
    if (ws?.isDragging?.()) {
      return;
    }

    // Limpiar timeout anterior si existe
    const existingTimeout = refreshTimeouts.get(ws);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Crear nuevo timeout para hacer refresh
    const timeout = setTimeout(() => {
      try {
        // Verificar una última vez que no hay interacciones activas
        if (ws?.isDragging?.()) {
          return;
        }

        // Guardar estado actual del workspace
        const xml = BlocklyInstance.Xml?.workspaceToDom(ws);
        if (!xml) return;

        const xmlText = BlocklyInstance.Xml?.domToText(xml);
        if (!xmlText) return;

        // Limpiar workspace
        ws.clear?.();

        // Restaurar desde XML (esto fuerza un re-render completo)
        const dom = BlocklyInstance.Xml?.textToDom(xmlText);
        if (dom) {
          BlocklyInstance.Xml?.domToWorkspace(dom, ws);
        }
      } catch (error) {
        console.error("Error en refreshWorkspace:", error);
      } finally {
        refreshTimeouts.delete(ws);
      }
    }, REFRESH_DEBOUNCE_MS);

    refreshTimeouts.set(ws, timeout);
  };

  // Listener para detectar cambios en campos numéricos de shadow blocks
  workspace.addChangeListener((event?: { 
    type?: string; 
    element?: string; 
    blockId?: string; 
    name?: string;
    oldValue?: any;
    newValue?: any;
  }) => {
    // Solo procesar eventos CHANGE de tipo "field" (cambios en campos)
    if (!event || event.type !== Blockly.Events?.CHANGE || event.element !== "field") {
      return;
    }

    // Obtener el bloque donde ocurrió el cambio
    const block = workspace.getBlockById?.(event.blockId || "");
    if (!block) return;

    // Verificar que es un shadow block
    if (!block.isShadow?.()) return;

    // Verificar que el campo cambiado es numérico
    const field = block.getField?.(event.name || "");
    if (!field || field.constructor?.name !== "FieldNumber") return;

    // Verificar que el valor realmente cambió
    if (event.oldValue === event.newValue) return;

    // Verificar que el shadow block está conectado a un input de un bloque relevante
    const parent = block.getParent?.();
    if (!parent) return;

    // Tipos de bloques que tienen inputs numéricos que necesitan refresh
    const relevantTypes = ["game_repeat", "game_wait"];
    if (!relevantTypes.includes(parent.type)) return;

    // Verificar que no hay interacciones activas
    if (workspace.isDragging?.()) return;

    // Hacer refresh del workspace con debounce
    refreshWorkspaceDebounced(workspace, Blockly);
  });

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
