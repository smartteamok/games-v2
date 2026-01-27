/**
 * Helper para actualizar valores numéricos en inputs de bloques Blockly
 * y forzar el re-renderizado correcto del UI.
 * 
 * Problema resuelto:
 * - Blockly puede no re-renderizar visualmente cuando cambian valores en shadow blocks
 * - El sistema de render management puede saltarse re-renders si las métricas son "equivalentes"
 * - Necesitamos invalidar métricas y forzar re-render completo
 */

// Flag de debugging (cambiar a false en producción)
const DEBUG_RENDER = false;

type BlocklyBlock = {
  getInput?: (name: string) => any;
  getField?: (name: string) => any;
  getFields?: () => any[];
  inputList?: any[];
  renderingMetrics_?: any;
  rendered?: boolean;
  render?: (opt_quiet?: boolean) => void;
  queueRender?: () => void;
  getParent?: () => BlocklyBlock | null;
  isShadow?: () => boolean;
  id?: string;
  type?: string;
};

type BlocklyField = {
  setValue?: (value: string | number) => void;
  forceRerender?: () => void;
  getValue?: () => any;
  EDITABLE?: boolean;
};

type UpdateOptions = {
  /** Si true, fuerza re-render incluso si el valor no cambió */
  forceRender?: boolean;
  /** Si true, también re-renderiza el bloque padre */
  renderParent?: boolean;
};

/**
 * Encuentra el campo numérico en un bloque de argumento (shadow o real)
 */
function findNumericField(argBlock: BlocklyBlock | null | undefined): BlocklyField | null {
  if (!argBlock) {
    return null;
  }

  // Intentar primero getField('NUM') - campo estándar de math_number
  const numField = argBlock.getField?.("NUM");
  if (numField && typeof numField.setValue === "function") {
    return numField;
  }

  // Fallback: escanear todos los campos del bloque
  const fields = argBlock.getFields?.() || [];
  for (const field of fields) {
    // Buscar campos numéricos editables
    if (
      field &&
      typeof field.setValue === "function" &&
      (field.EDITABLE !== false || field.getValue)
    ) {
      // Verificar si es un campo numérico (tiene getValue que retorna número)
      const value = field.getValue?.();
      if (typeof value === "number" || !isNaN(Number(value))) {
        return field;
      }
    }
  }

  // Fallback adicional: buscar en inputList si existe
  if (argBlock.inputList) {
    for (const input of argBlock.inputList) {
      if (input.fieldRow) {
        for (const field of input.fieldRow) {
          if (
            field &&
            typeof field.setValue === "function" &&
            (field.EDITABLE !== false || field.getValue)
          ) {
            const value = field.getValue?.();
            if (typeof value === "number" || !isNaN(Number(value))) {
              return field;
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Fuerza el re-render de un bloque y opcionalmente su padre
 * Usa múltiples estrategias en orden de preferencia
 * 
 * Orden de estrategias:
 * 1. queueRender() si está disponible (método preferido de Blockly)
 * 2. Invalidar métricas y usar render(true) para forzar re-render completo
 * 
 * Esto asegura que Blockly no salte el re-render por "métricas equivalentes"
 */
function forceBlockAndParentRender(
  block: BlocklyBlock | null | undefined,
  parent: BlocklyBlock | null | undefined,
  options: UpdateOptions = {}
): void {
  if (!block || !block.rendered) {
    return;
  }

  const { renderParent = true } = options;

  // Estrategia 1: Usar queueRender si está disponible (método preferido de Blockly)
  // queueRender() es el método recomendado para solicitar re-renders de forma eficiente
  if (typeof block.queueRender === "function") {
    try {
      block.queueRender();
    } catch (error) {
      if (DEBUG_RENDER) {
        console.warn("queueRender failed, falling back:", error);
      }
    }
  }

  // Estrategia 2: Invalidar métricas y forzar re-render completo
  // Esto es necesario porque Blockly puede saltarse re-renders si las métricas
  // son "equivalentes" (mismo ancho/alto), aunque el contenido visual haya cambiado
  requestAnimationFrame(() => {
    try {
      // Invalidar métricas para forzar re-render completo
      // renderingMetrics_ es usado por Blockly para determinar si necesita re-renderizar
      if (block.renderingMetrics_ !== undefined) {
        block.renderingMetrics_ = null;
      }

      // Forzar re-render completo
      // true = re-render incluso si las métricas no cambiaron
      // false = solo re-renderizar si las métricas cambiaron (comportamiento por defecto)
      if (typeof block.render === "function") {
        block.render(true);
      }

      // También re-renderizar el padre si es necesario
      // Esto es importante porque el bloque padre muestra el valor del shadow block
      if (renderParent && parent && parent.rendered) {
        if (parent.renderingMetrics_ !== undefined) {
          parent.renderingMetrics_ = null;
        }
        if (typeof parent.render === "function") {
          parent.render(true);
        }
      }
    } catch (error) {
      if (DEBUG_RENDER) {
        console.warn("Error forcing render:", error);
      }
    }
  });
}

/**
 * Actualiza el valor numérico de un input en un bloque y fuerza el re-render
 * 
 * @param block - El bloque que contiene el input
 * @param inputName - Nombre del input (ej: "TIMES", "MS")
 * @param value - Nuevo valor numérico
 * @param options - Opciones adicionales
 * 
 * @returns true si se actualizó correctamente, false si hubo error
 * 
 * @example
 * ```typescript
 * // Actualizar valor de repeticiones
 * updateNumericInputValue(repeatBlock, "TIMES", 5);
 * 
 * // Actualizar tiempo de espera
 * updateNumericInputValue(waitBlock, "MS", 1000);
 * ```
 */
export function updateNumericInputValue(
  block: BlocklyBlock,
  inputName: string,
  value: number,
  options: UpdateOptions = {}
): boolean {
  if (!block || typeof inputName !== "string" || typeof value !== "number") {
    if (DEBUG_RENDER) {
      console.warn("Invalid parameters:", { block, inputName, value });
    }
    return false;
  }

  try {
    // 1. Obtener el input por nombre
    const input = block.getInput?.(inputName);
    if (!input) {
      if (DEBUG_RENDER) {
        console.warn(`Input "${inputName}" not found in block ${block.type || block.id}`);
      }
      return false;
    }

    // 2. Obtener el bloque conectado (shadow o real)
    const connection = input.connection;
    if (!connection) {
      if (DEBUG_RENDER) {
        console.warn(`Input "${inputName}" has no connection`);
      }
      return false;
    }

    const argBlock = connection.targetBlock?.() as BlocklyBlock | null;
    if (!argBlock) {
      if (DEBUG_RENDER) {
        console.warn(`No block connected to input "${inputName}"`);
      }
      return false;
    }

    // 3. Encontrar el campo numérico
    const field = findNumericField(argBlock);
    if (!field) {
      if (DEBUG_RENDER) {
        console.warn(`No numeric field found in block connected to input "${inputName}"`);
      }
      return false;
    }

    // 4. Obtener valor anterior para logging
    const oldValue = field.getValue?.();
    const valueChanged = oldValue !== value;

    // 5. Actualizar el valor
    if (field.setValue) {
      field.setValue(String(value));
    } else {
      if (DEBUG_RENDER) {
        console.warn("Field does not have setValue method");
      }
      return false;
    }

    // 6. Forzar re-render del campo si tiene método específico
    // Algunos campos tienen métodos específicos para forzar re-render
    if (typeof field.forceRerender === "function") {
      try {
        field.forceRerender();
      } catch (error) {
        if (DEBUG_RENDER) {
          console.warn("forceRerender failed:", error);
        }
      }
    }

    // 7. Forzar re-render del bloque argumento y del bloque padre
    // Esto es crítico: el bloque padre necesita re-renderizarse para mostrar el nuevo valor
    // argBlock es el shadow block, block es el bloque padre que contiene el input
    const blockParent = block.getParent?.() || null;
    forceBlockAndParentRender(argBlock, block, {
      renderParent: options.renderParent !== false,
      ...options
    });
    
    // También re-renderizar el padre del bloque si existe (para bloques anidados)
    if (options.renderParent !== false && blockParent && blockParent.rendered) {
      requestAnimationFrame(() => {
        if (blockParent.renderingMetrics_ !== undefined) {
          blockParent.renderingMetrics_ = null;
        }
        if (typeof blockParent.render === "function") {
          blockParent.render(true);
        }
      });
    }

    // 8. Debug logging
    if (DEBUG_RENDER) {
      console.debug("Numeric input updated:", {
        blockId: block.id,
        blockType: block.type,
        inputName,
        oldValue,
        newValue: value,
        valueChanged,
        isShadow: argBlock.isShadow?.() || false
      });
    }

    return true;
  } catch (error) {
    if (DEBUG_RENDER) {
      console.error("Error updating numeric input:", error, {
        blockId: block.id,
        blockType: block.type,
        inputName,
        value
      });
    }
    return false;
  }
}

/**
 * Versión simplificada que actualiza múltiples inputs a la vez
 */
export function updateMultipleNumericInputs(
  block: BlocklyBlock,
  updates: Record<string, number>,
  options: UpdateOptions = {}
): boolean {
  let allSuccess = true;
  for (const [inputName, value] of Object.entries(updates)) {
    const success = updateNumericInputValue(block, inputName, value, {
      ...options,
      renderParent: false // Solo renderizar padre una vez al final
    });
    if (!success) {
      allSuccess = false;
    }
  }

  // Re-renderizar el bloque padre una vez al final si es necesario
  if (allSuccess && options.renderParent !== false) {
    const blockParent = block.getParent?.();
    if (blockParent && blockParent.rendered) {
      requestAnimationFrame(() => {
        if (blockParent.renderingMetrics_ !== undefined) {
          blockParent.renderingMetrics_ = null;
        }
        if (blockParent.render) {
          blockParent.render(true);
        }
      });
    }
  }

  return allSuccess;
}
