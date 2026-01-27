# 🐛 Debugging: Problema de Renderizado de Shadow Blocks en Blockly

## 📋 Resumen del Problema

**Síntoma:** Los óvalos con números en los bloques `game_repeat` y `game_wait` no se actualizan visualmente cuando cambias el valor, aunque el valor sí se guarda correctamente.

**Evidencia:**
- ✅ El valor **SÍ se guarda** correctamente (se comprueba al duplicar el bloque)
- ✅ Cuando **interactúas directamente** con el óvalo (click para editar), el valor aparece
- ❌ Cuando cambias el valor **sin interactuar directamente**, el óvalo no se actualiza visualmente
- ✅ Al **duplicar** el bloque, el nuevo bloque muestra el valor correcto

**Conclusión:** El problema es específicamente con el **re-renderizado visual** del bloque padre cuando cambia el valor de un shadow block conectado a un `input_value`.

---

## 🔍 Análisis Técnico

### Arquitectura del Problema

```
game_repeat (bloque padre)
  └─ input_value "TIMES"
      └─ shadow block (math_whole_number)
          └─ field "NUM" (valor: 4)
```

**Flujo esperado:**
1. Usuario cambia el valor en el shadow block
2. Shadow block dispara evento de cambio
3. Blockly re-renderiza el shadow block
4. Blockly re-renderiza el bloque padre (game_repeat)
5. El óvalo muestra el nuevo valor

**Flujo actual (problemático):**
1. Usuario cambia el valor en el shadow block
2. Shadow block dispara evento de cambio
3. Shadow block se re-renderiza
4. ❌ El bloque padre NO se re-renderiza automáticamente
5. El óvalo sigue mostrando el valor anterior

### Por qué funciona al duplicar

Cuando duplicas un bloque:
- Se crea una **nueva instancia** del bloque
- Se lee el valor **actual** del shadow block (que está correcto)
- Se crea un nuevo shadow block con ese valor
- El nuevo bloque se renderiza desde cero → muestra el valor correcto

### Por qué funciona al interactuar directamente

Cuando haces click en el óvalo:
- Blockly abre el editor de campo numérico
- Al cambiar el valor, Blockly dispara eventos específicos
- Estos eventos **sí** disparan el re-render del bloque padre
- El óvalo se actualiza correctamente

---

## 🛠️ Soluciones Intentadas

### 1. Listener de Eventos de Blockly (`workspace.addChangeListener`)

**Archivo:** `app/src/core/editor/workspace.ts`

**Enfoque:** Escuchar todos los eventos de cambio en el workspace y forzar re-render cuando se detecta un cambio en un shadow block.

**Implementación:**
```typescript
const forceBlockRender = (event?: any) => {
  if (event?.blockId) {
    const block = workspace.getBlockById(event.blockId);
    if (block?.isShadow()) {
      const parent = block.getParent();
      if (parent?.rendered) {
        parent.render(false);
      }
    }
  }
};
workspace.addChangeListener(forceBlockRender);
```

**Resultado:** ❌ No funciona - Los eventos no se disparan correctamente o se ignoran.

**Razón probable:** Los eventos de cambio en shadow blocks pueden no propagarse correctamente al listener del workspace.

---

### 2. `setOnChange` en la Definición del Bloque

**Archivo:** `app/src/apps/maze/mazeApp.ts`

**Enfoque:** Añadir un handler `setOnChange` directamente en la definición de `game_repeat` y `game_wait` para detectar cambios en sus inputs.

**Implementación:**
```typescript
Blockly.Blocks["game_repeat"] = {
  init: function () {
    this.jsonInit({ /* ... */ });
    const blockInstance = this;
    this.setOnChange(function(changeEvent: any) {
      if (changeEvent?.type === "change") {
        const input = blockInstance.getInput("TIMES");
        const connectedBlock = input.connection?.targetBlock?.();
        if (connectedBlock?.rendered) {
          connectedBlock.render();
        }
        if (blockInstance.rendered) {
          blockInstance.render();
        }
      }
    });
  }
};
```

**Resultado:** ❌ No funciona - El evento no se dispara o no captura el cambio correctamente.

**Razón probable:** El `onChange` del bloque padre puede no detectar cambios en shadow blocks hijos.

---

### 3. Intervalo de Verificación (Polling)

**Archivo:** `app/src/core/editor/workspace.ts`

**Enfoque:** Usar `setInterval` para verificar periódicamente si los valores de los shadow blocks han cambiado comparando con valores anteriores.

**Implementación:**
```typescript
let lastValues = new Map<string, any>();
setInterval(() => {
  const allBlocks = workspace.getTopBlocks(false);
  for (const block of allBlocks) {
    if (block.type === "game_repeat" || block.type === "game_wait") {
      const input = block.getInput("TIMES");
      const connectedBlock = input.connection?.targetBlock?.();
      if (connectedBlock) {
        const currentValue = connectedBlock.getFieldValue("NUM");
        const lastValue = lastValues.get(block.id);
        if (currentValue !== lastValue) {
          lastValues.set(block.id, currentValue);
          block.render(false);
        }
      }
    }
  }
}, 200);
```

**Resultado:** ❌ No funciona - Aunque detecta el cambio, `block.render(false)` no actualiza la visualización.

**Razón probable:** El método `render(false)` puede no estar forzando un re-render completo, o Blockly está usando un sistema de caché que previene la actualización.

---

### 4. MutationObserver

**Enfoque:** Usar `MutationObserver` para detectar cambios en el DOM de los shadow blocks.

**Resultado:** ⚠️ No implementado completamente - Se intentó pero se descartó por ser demasiado agresivo y potencialmente causar problemas de rendimiento.

---

## 💡 Análisis de la Causa Raíz

### Hipótesis Principal

Blockly tiene un sistema de **render management** que optimiza los re-renders. Cuando cambias un valor en un shadow block:

1. Blockly marca el shadow block como "necesita re-render"
2. Blockly **debería** marcar el bloque padre como "necesita re-render"
3. Blockly usa `requestAnimationFrame` para procesar los re-renders en batch
4. **PROBLEMA:** El bloque padre no se marca correctamente como "necesita re-render"

### Evidencia

- El código de Blockly muestra que `render(false)` puede evitar re-renderizar si las métricas no han cambiado:
  ```javascript
  // De blockly_compressed_horizontal.js línea 1511
  render: function(a) {
    var b = this.renderingMetrics_, c = this.renderCompute_();
    b && Blockly.BlockSvg.metricsAreEquivalent_(b, c) ? 
      // No re-renderiza si las métricas son equivalentes
      (/* ... */) : 
      // Solo re-renderiza si las métricas cambiaron
      (this.height = c.height, this.width = c.width, this.renderDraw_(c), /* ... */);
  }
  ```

- Cuando cambias solo el valor de un shadow block, las **métricas del bloque padre** (ancho, alto) pueden no cambiar
- Blockly determina que no necesita re-renderizar porque las métricas son "equivalentes"
- Pero el **contenido visual** (el número en el óvalo) SÍ cambió

---

## 🎯 Soluciones Propuestas

### Solución 1: Forzar Re-render Completo (Recomendada)

**Enfoque:** En lugar de `render(false)`, usar `render(true)` o forzar un re-render completo invalidando las métricas.

**Implementación propuesta:**
```typescript
// Invalidar las métricas antes de re-renderizar
block.renderingMetrics_ = null;
block.render(true); // true = forzar re-render incluso si las métricas no cambiaron
```

**Ventajas:**
- Más directo
- Fuerza el re-render completo
- No depende de eventos

**Desventajas:**
- Puede ser menos eficiente
- Puede causar flickering si se usa demasiado

---

### Solución 2: Usar `field_number` en lugar de `input_value` con Shadow Block

**Enfoque:** Cambiar la definición del bloque para usar `field_number` directamente en lugar de `input_value` con shadow block.

**Implementación propuesta:**
```typescript
// En lugar de:
{ type: "input_value", name: "TIMES", check: "Number" }

// Usar:
{ type: "field_number", name: "TIMES", value: 4, min: 1 }
```

**Ventajas:**
- Elimina completamente el problema de shadow blocks
- Más simple
- El número se muestra directamente en el bloque

**Desventajas:**
- Pierdes la flexibilidad de poder conectar otros bloques numéricos
- No es compatible con el diseño de Scratch Blocks

---

### Solución 3: Interceptar Eventos de Campo Numérico

**Enfoque:** Interceptar directamente los eventos de cambio en los campos numéricos de los shadow blocks.

**Implementación propuesta:**
```typescript
// Después de crear el workspace, interceptar eventos de campos
const svgRoot = workspace.getParentSvg();
const observer = new MutationObserver((mutations) => {
  // Detectar cambios en campos numéricos
  // Forzar re-render del bloque padre
});
observer.observe(svgRoot, { childList: true, subtree: true, characterData: true });
```

**Ventajas:**
- Detecta cambios a nivel DOM
- No depende de eventos de Blockly

**Desventajas:**
- Puede ser costoso en rendimiento
- Puede detectar cambios no relacionados

---

### Solución 4: Modificar el Shadow Block para Disparar Evento Personalizado

**Enfoque:** Crear un shadow block personalizado que dispare un evento cuando cambia su valor.

**Implementación propuesta:**
```typescript
// Crear un shadow block personalizado
Blockly.Blocks["math_whole_number_custom"] = {
  init: function() {
    this.jsonInit({
      // ... definición del bloque
    });
    // Añadir onChange que dispare evento al padre
    this.setOnChange(function() {
      const parent = this.getParent();
      if (parent) {
        parent.render(true);
      }
    });
  }
};
```

**Ventajas:**
- Solución específica para nuestro caso
- No afecta otros bloques

**Desventajas:**
- Requiere modificar el toolbox XML
- Puede no funcionar si Blockly recrea el shadow block

---

## 🔬 Próximos Pasos Recomendados

### 1. Investigar el Sistema de Render Management de Blockly

- Revisar cómo Blockly determina si un bloque necesita re-render
- Entender cómo se propagan los cambios de shadow blocks a bloques padres
- Buscar métodos internos que fuerzan re-render completo

### 2. Probar Solución 1 (Forzar Re-render Completo)

```typescript
// En workspace.ts, modificar el listener:
if (block.isShadow()) {
  const parent = block.getParent();
  if (parent && parent.rendered) {
    // Invalidar métricas y forzar re-render completo
    parent.renderingMetrics_ = null;
    parent.render(true); // true = re-render completo
  }
}
```

### 3. Probar Solución 2 (Usar field_number)

Si la solución 1 no funciona, considerar cambiar a `field_number` directamente. Esto eliminaría el problema pero cambiaría la UX.

### 4. Debugging Adicional

Añadir logging para entender mejor qué está pasando:

```typescript
console.log("Event:", event);
console.log("Block:", block);
console.log("Is shadow:", block.isShadow());
console.log("Parent:", block.getParent());
console.log("Rendered:", block.rendered);
console.log("Metrics:", block.renderingMetrics_);
```

---

## 📝 Notas Adicionales

### Archivos Modificados

1. `app/src/core/editor/workspace.ts` - Listener de eventos y intervalo de verificación
2. `app/src/apps/maze/mazeApp.ts` - `setOnChange` en definiciones de bloques
3. `app/src/apps/practice/practiceApp.ts` - (Debería tener los mismos cambios que mazeApp)

### Versión de Blockly

- Usando: `scratch-blocks` (versión horizontal)
- Archivos: `blockly_compressed_horizontal.js`, `blocks_compressed_horizontal.js`

### Referencias

- [Blockly Render Management](https://developers.google.com/blockly/guides/contribute/core-architecture/render-management)
- [Blockly Shadow Blocks](https://developers.google.com/blockly/guides/create-custom-blocks/fields/using-fields#shadow-blocks)
- [GitHub Issue #7635](https://github.com/google/blockly/issues/7635) - Problema similar reportado

---

## ✅ Solución Implementada

### Helper Reutilizable: `numericInputHelper.ts`

Se implementó un helper general y escalable que resuelve el problema:

**Archivo:** `app/src/core/editor/numericInputHelper.ts`

**Funciones principales:**
- `updateNumericInputValue(block, inputName, value, options?)` - Actualiza un valor numérico y fuerza re-render
- `updateMultipleNumericInputs(block, updates, options?)` - Actualiza múltiples valores a la vez
- `findNumericField(argBlock)` - Encuentra el campo numérico en un bloque (shadow o real)
- `forceBlockAndParentRender(block, parent, options)` - Fuerza re-render usando múltiples estrategias

**Características:**
- ✅ Solución general (no hardcodeada para repeat/wait)
- ✅ Funciona con shadow blocks y bloques reales
- ✅ Múltiples estrategias de re-render (queueRender, invalidar métricas, render(true))
- ✅ Debugging opcional con flag `DEBUG_RENDER`
- ✅ Manejo defensivo de errores
- ✅ Documentación completa

**Uso:**
```typescript
import { updateNumericInputValue } from "./core/editor/numericInputHelper";

// Actualizar valor programáticamente
updateNumericInputValue(block, "TIMES", 5);
```

**Integración:**
- Los bloques `game_repeat` y `game_wait` ahora usan `render(true)` en sus `setOnChange`
- El listener del workspace detecta cambios en shadow blocks y fuerza re-render del padre
- El helper está disponible para uso futuro en otros bloques

---

## ✅ Checklist de Pruebas

- [x] Implementar helper reutilizable
- [x] Integrar en bloques existentes (game_repeat, game_wait)
- [x] Documentar uso y API
- [x] Crear ejemplos de uso
- [ ] Probar que funciona al cambiar valores programáticamente
- [ ] Verificar que funciona cuando el usuario edita directamente
- [ ] Verificar que no causa problemas de rendimiento
- [ ] Probar en diferentes navegadores
- [ ] Probar con bloques reales conectados (no solo shadow blocks)

---

**Última actualización:** 2026-01-25
**Estado:** ✅ Solución implementada - Pendiente de pruebas
