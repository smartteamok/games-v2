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
  // Refresh inmediato al presionar Enter, o automático después de 1.5s sin cambios
  const pendingRefreshFields = new WeakMap<any, Set<string>>(); // Track campos pendientes de refresh
  const enterKeyListeners = new WeakMap<any, (e: KeyboardEvent) => void>(); // Track listeners de Enter por workspace
  const refreshTimeouts = new WeakMap<any, ReturnType<typeof setTimeout>>(); // Timers de debounce por workspace
  const REFRESH_DEBOUNCE_MS = 1500; // 1.5 segundos sin cambios antes de refresh automático

  const refreshWorkspace = (ws: any, BlocklyInstance: BlocklyLike, cancelDebounce: boolean = false) => {
    // Cancelar timer de debounce si existe
    if (cancelDebounce) {
      const existingTimeout = refreshTimeouts.get(ws);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        refreshTimeouts.delete(ws);
      }
    }

    // Verificar que no hay interacciones activas
    if (ws?.isDragging?.()) {
      return;
    }

    try {
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

      // Limpiar campos pendientes
      const pendingFields = pendingRefreshFields.get(ws);
      if (pendingFields) {
        pendingFields.clear();
      }
    } catch (error) {
      // Silenciar errores de refresh
    }
  };

  const scheduleDebouncedRefresh = (ws: any, BlocklyInstance: BlocklyLike) => {
    // Cancelar timeout anterior si existe
    const existingTimeout = refreshTimeouts.get(ws);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Crear nuevo timeout
    const timeout = setTimeout(() => {
      // Verificar una última vez que no hay interacciones activas
      if (ws?.isDragging?.()) {
        return;
      }

      // Verificar que hay campos pendientes
      const pendingFields = pendingRefreshFields.get(ws);
      if (!pendingFields || pendingFields.size === 0) {
        return;
      }

      // Hacer refresh
      refreshWorkspace(ws, BlocklyInstance);
      refreshTimeouts.delete(ws);
    }, REFRESH_DEBOUNCE_MS);

    refreshTimeouts.set(ws, timeout);
  };

  // Configurar listener de Enter para detectar cuando el usuario presiona Enter en el editor
  const setupEnterKeyListener = (ws: any, BlocklyInstance: BlocklyLike) => {
    // Verificar si ya hay un listener configurado
    if (enterKeyListeners.has(ws)) {
      return;
    }

    // Función que detecta Enter y hace refresh
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo procesar si es Enter (keyCode 13 o key === "Enter")
      if (e.keyCode !== 13 && e.key !== "Enter") {
        return;
      }

      // Verificar que hay campos pendientes de refresh
      const pendingFields = pendingRefreshFields.get(ws);
      if (!pendingFields || pendingFields.size === 0) {
        return;
      }

      // Verificar que el evento viene del editor de Blockly (WidgetDiv)
      // Blockly usa WidgetDiv para mostrar editores de campos
      const target = e.target as HTMLElement;
      if (!target || !target.closest?.(".blocklyWidgetDiv")) {
        return;
      }

      // Hacer refresh inmediato y cancelar cualquier debounce pendiente
      refreshWorkspace(ws, BlocklyInstance, true);
    };

    // Agregar listener al document para capturar todos los eventos de teclado
    document.addEventListener("keydown", handleKeyDown);
    enterKeyListeners.set(ws, handleKeyDown);

    // Limpiar listener cuando se destruye el workspace
    const originalDispose = ws.dispose;
    if (originalDispose) {
      ws.dispose = function() {
        document.removeEventListener("keydown", handleKeyDown);
        enterKeyListeners.delete(ws);
        // Limpiar timer de debounce si existe
        const timeout = refreshTimeouts.get(ws);
        if (timeout) {
          clearTimeout(timeout);
          refreshTimeouts.delete(ws);
        }
        originalDispose.call(this);
      };
    }
  };

  // Configurar listener de Enter para este workspace
  setupEnterKeyListener(workspace, Blockly);

  // Listener para detectar cambios en campos numéricos de shadow blocks
  workspace.addChangeListener((event?: { 
    type?: string; 
    element?: string; 
    blockId?: string; 
    name?: string;
    oldValue?: any;
    newValue?: any;
  }) => {
    if (!event) return;

    // Solo procesar eventos CHANGE de tipo "field" (cambios en campos)
    if (event.type !== Blockly.Events?.CHANGE || event.element !== "field") {
      return;
    }

    // Obtener el bloque donde ocurrió el cambio
    const block = workspace.getBlockById?.(event.blockId || "");
    if (!block || !block.isShadow?.()) {
      return;
    }

    // Verificar que el nombre del campo es típico de campos numéricos
    const numericFieldNames = ["NUM", "N", "VALUE", "MS", "SECS", "TIMES", "DURATION", "STEPS"];
    if (!event.name || !numericFieldNames.includes(event.name)) {
      return;
    }

    // Verificar que el valor realmente cambió
    if (event.oldValue === event.newValue) {
      return;
    }

    // Verificar que el shadow block está conectado a un input de un bloque relevante
    const parent = block.getParent?.();
    if (!parent) return;

    const relevantTypes = ["game_repeat", "game_wait"];
    if (!relevantTypes.includes(parent.type)) {
      return;
    }

    // Verificar que no hay interacciones activas
    if (workspace.isDragging?.()) {
      return;
    }

    // Marcar este campo como pendiente de refresh
    // El refresh se ejecutará cuando:
    // 1. El usuario presione Enter (inmediato, detectado por el listener de teclado)
    // 2. Pase 1.5 segundos sin cambios (automático, usando debounce)
    let pendingFields = pendingRefreshFields.get(workspace);
    if (!pendingFields) {
      pendingFields = new Set();
      pendingRefreshFields.set(workspace, pendingFields);
    }
    const fieldKey = `${event.blockId}:${event.name}`;
    pendingFields.add(fieldKey);

    // Programar refresh con debounce (se reseteará si hay más cambios)
    scheduleDebouncedRefresh(workspace, Blockly);
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

  // Configurar listeners para actualizar límite de bloques en tiempo real
  if (workspace && typeof workspace.addChangeListener === "function") {
    const blockLimitUpdateHandler = (event: any) => {
      // Solo actualizar en eventos de creación/eliminación de bloques
      if (event && (event.type === "create" || event.type === "delete" || event.type === "move")) {
        // Disparar evento personalizado para que main.ts actualice el contador
        window.dispatchEvent(new CustomEvent("blockly-workspace-changed"));
      }
    };
    
    workspace.addChangeListener(blockLimitUpdateHandler);
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
