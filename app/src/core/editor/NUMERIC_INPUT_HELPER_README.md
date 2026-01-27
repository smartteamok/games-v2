# 🔧 Helper para Actualizar Valores Numéricos en Blockly

## 📋 Descripción

Este helper resuelve el problema de que Blockly no re-renderiza visualmente cuando se actualizan valores numéricos en `input_value` con shadow blocks conectados.

**Problema resuelto:**
- ✅ Actualización programática de valores numéricos
- ✅ Re-renderizado visual correcto del bloque padre
- ✅ Funciona con shadow blocks y bloques reales conectados
- ✅ Solución general y escalable para futuros bloques

---

## 🚀 Uso Básico

### Importar el helper

```typescript
import { updateNumericInputValue } from "./core/editor/numericInputHelper";
```

### Actualizar un solo valor

```typescript
// Actualizar el valor de repeticiones en un bloque game_repeat
const block = workspace.getBlockById("block-id-123");
updateNumericInputValue(block, "TIMES", 5);

// Actualizar el tiempo de espera en un bloque game_wait
updateNumericInputValue(block, "MS", 1000);
```

### Actualizar múltiples valores

```typescript
import { updateMultipleNumericInputs } from "./core/editor/numericInputHelper";

// Actualizar múltiples inputs en un solo bloque
updateMultipleNumericInputs(block, {
  TIMES: 5,
  MS: 1000
});
```

---

## 📖 API Reference

### `updateNumericInputValue(block, inputName, value, options?)`

Actualiza el valor numérico de un input en un bloque y fuerza el re-render.

**Parámetros:**
- `block` (BlocklyBlock): El bloque que contiene el input
- `inputName` (string): Nombre del input (ej: "TIMES", "MS")
- `value` (number): Nuevo valor numérico
- `options` (UpdateOptions, opcional):
  - `forceRender?: boolean` - Si true, fuerza re-render incluso si el valor no cambió
  - `renderParent?: boolean` - Si true (default), también re-renderiza el bloque padre

**Retorna:** `boolean` - `true` si se actualizó correctamente, `false` si hubo error

**Ejemplo:**
```typescript
const success = updateNumericInputValue(block, "TIMES", 10, {
  forceRender: true,
  renderParent: true
});

if (!success) {
  console.warn("No se pudo actualizar el valor");
}
```

### `updateMultipleNumericInputs(block, updates, options?)`

Actualiza múltiples valores numéricos en un bloque a la vez.

**Parámetros:**
- `block` (BlocklyBlock): El bloque que contiene los inputs
- `updates` (Record<string, number>): Objeto con nombres de inputs y valores
- `options` (UpdateOptions, opcional): Mismas opciones que `updateNumericInputValue`

**Retorna:** `boolean` - `true` si todos se actualizaron correctamente

**Ejemplo:**
```typescript
updateMultipleNumericInputs(block, {
  TIMES: 5,
  MS: 500
});
```

---

## 🔍 Cómo Funciona

### 1. Encuentra el Input y el Bloque Conectado

```typescript
const input = block.getInput(inputName);
const argBlock = input.connection?.targetBlock();
```

### 2. Encuentra el Campo Numérico

El helper busca el campo numérico en este orden:
1. `argBlock.getField("NUM")` - Campo estándar de math_number
2. Escanea todos los campos del bloque buscando campos numéricos editables
3. Busca en `inputList` si existe

### 3. Actualiza el Valor

```typescript
field.setValue(String(value));
```

### 4. Fuerza el Re-render

Usa múltiples estrategias en orden:
1. `field.forceRerender()` si está disponible
2. `block.queueRender()` si está disponible (método preferido de Blockly)
3. **Fallback:** Invalidar `renderingMetrics_` y usar `render(true)`

El fallback es necesario porque Blockly puede saltarse re-renders si las métricas (ancho/alto) son "equivalentes", aunque el contenido visual haya cambiado.

---

## 🎯 Casos de Uso

### Caso 1: Actualizar desde un Panel/Inspector Externo

```typescript
function updateFromExternalPanel(workspace: any, blockId: string, value: number) {
  const block = workspace.getBlockById(blockId);
  if (!block) return;
  
  // Actualizar el valor y forzar re-render
  updateNumericInputValue(block, "TIMES", value, {
    forceRender: true,
    renderParent: true
  });
}
```

### Caso 2: Actualizar Múltiples Bloques

```typescript
function updateAllRepeatBlocks(workspace: any, newTimes: number) {
  const allBlocks = workspace.getTopBlocks(false);
  for (const block of allBlocks) {
    if (block.type === "game_repeat") {
      updateNumericInputValue(block, "TIMES", newTimes);
    }
  }
}
```

### Caso 3: Con Manejo de Errores

```typescript
function safeUpdate(block: any, inputName: string, value: number): boolean {
  try {
    return updateNumericInputValue(block, inputName, value);
  } catch (error) {
    console.error("Error updating numeric input:", error);
    return false;
  }
}
```

---

## 🐛 Debugging

Para habilitar logging de debugging, cambia el flag en `numericInputHelper.ts`:

```typescript
const DEBUG_RENDER = true; // Cambiar a true para ver logs
```

Esto mostrará información sobre:
- Valores anteriores y nuevos
- Si el valor cambió
- Si el bloque es shadow o real
- Errores durante la actualización

---

## ✅ Criterios de Aceptación

- ✅ Cambiar el valor numérico desde código debe actualizar inmediatamente el texto visible en el bloque
- ✅ Debe funcionar si el input tiene un shadow block conectado
- ✅ Debe funcionar si el usuario conectó un bloque numérico real
- ✅ No debe romper otras funcionalidades del editor
- ✅ Debe ser fácil agregar soporte a nuevos bloques: solo llamar al helper

---

## 📝 Notas de Implementación

### Por qué invalidar `renderingMetrics_`

Blockly usa `renderingMetrics_` para determinar si un bloque necesita re-renderizarse. Si las métricas (ancho, alto) son "equivalentes" a las anteriores, Blockly puede saltarse el re-render para optimizar.

Sin embargo, cuando cambias solo el valor de un shadow block:
- Las métricas del bloque padre pueden no cambiar (mismo ancho/alto)
- Pero el contenido visual SÍ cambió (el número en el óvalo)
- Por eso necesitamos invalidar las métricas y forzar re-render completo

### Por qué usar `render(true)`

- `render(false)` o `render()` - Solo re-renderiza si las métricas cambiaron
- `render(true)` - Fuerza re-render incluso si las métricas no cambiaron

### Por qué `requestAnimationFrame`

Usamos `requestAnimationFrame` para asegurar que:
1. El cambio de valor se complete primero
2. El re-render ocurra en el siguiente frame de animación
3. Se eviten múltiples re-renders innecesarios

---

## 🔗 Archivos Relacionados

- `numericInputHelper.ts` - Implementación del helper
- `numericInputHelper.example.ts` - Ejemplos de uso
- `workspace.ts` - Listener de eventos para cambios del usuario
- `BLOCKLY_SHADOW_BLOCK_RENDERING_DEBUG.md` - Análisis completo del problema

---

## 🚀 Próximos Pasos

Para agregar soporte a un nuevo bloque con input numérico:

1. Asegúrate de que el bloque tenga un `input_value` con shadow block en el toolbox XML
2. Cuando necesites actualizar el valor programáticamente, usa:

```typescript
updateNumericInputValue(block, "TU_INPUT_NAME", nuevoValor);
```

¡Eso es todo! El helper se encarga del resto.
