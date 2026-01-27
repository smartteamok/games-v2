/**
 * Ejemplos de uso del helper updateNumericInputValue
 * 
 * Este archivo muestra cómo usar el helper para actualizar valores numéricos
 * en bloques Blockly de forma programática.
 */

import { updateNumericInputValue, updateMultipleNumericInputs } from "./numericInputHelper";

// Ejemplo 1: Actualizar un solo valor
export function exampleUpdateRepeatTimes(block: any, newTimes: number): void {
  // Actualizar el valor de repeticiones en un bloque game_repeat
  const success = updateNumericInputValue(block, "TIMES", newTimes);
  
  if (!success) {
    console.warn("No se pudo actualizar el valor de TIMES");
  }
}

// Ejemplo 2: Actualizar tiempo de espera
export function exampleUpdateWaitTime(block: any, milliseconds: number): void {
  // Actualizar el valor de tiempo de espera en un bloque game_wait
  updateNumericInputValue(block, "MS", milliseconds);
}

// Ejemplo 3: Actualizar múltiples valores a la vez
export function exampleUpdateMultipleValues(block: any): void {
  // Actualizar múltiples inputs numéricos en un solo bloque
  updateMultipleNumericInputs(block, {
    TIMES: 5,
    MS: 1000
  });
}

// Ejemplo 4: Desde un control externo (inspector/panel)
export function exampleFromExternalUI(
  workspace: any,
  blockId: string,
  inputName: string,
  newValue: number
): void {
  // Obtener el bloque desde el workspace
  const block = workspace.getBlockById(blockId);
  if (!block) {
    console.error(`Block ${blockId} not found`);
    return;
  }

  // Actualizar el valor usando el helper
  updateNumericInputValue(block, inputName, newValue, {
    forceRender: true, // Forzar re-render incluso si el valor no cambió
    renderParent: true // También re-renderizar el bloque padre
  });
}

// Ejemplo 5: Con manejo de errores
export function exampleWithErrorHandling(block: any, value: number): boolean {
  try {
    return updateNumericInputValue(block, "TIMES", value);
  } catch (error) {
    console.error("Error updating numeric input:", error);
    return false;
  }
}
