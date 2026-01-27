# 🔄 Estrategias para Refresh de Campos Numéricos con Save/Load

## 📋 Objetivo

Implementar un sistema que detecte cambios **específicamente** en campos numéricos de shadow blocks conectados a inputs de bloques (como `game_repeat`, `game_wait`), y ejecute un **save/load del workspace** solo cuando ocurra ese cambio, sin interrumpir otras interacciones del usuario.

---

## 🎯 Estrategias de Detección

### **Estrategia 1: Event Listener Específico para `Blockly.Events.Change` de tipo "field"**

**Concepto:** Escuchar eventos `CHANGE` en el workspace y filtrar solo aquellos que:
- Son de tipo `Blockly.Events.CHANGE`
- Tienen `element === "field"` (cambio en un campo)
- El campo cambiado está en un shadow block
- El shadow block está conectado a un input numérico de un bloque relevante

**Ventajas:**
- ✅ Muy específico: solo se activa cuando cambia un campo
- ✅ Acceso a información detallada: `event.name`, `event.oldValue`, `event.newValue`, `event.blockId`
- ✅ No interfiere con otros eventos (drag, move, etc.)

**Desventajas:**
- ⚠️ Requiere verificar el contexto del bloque (shadow block, input conectado)
- ⚠️ Puede dispararse durante edición activa (mientras el usuario escribe)

**Implementación sugerida:**
```typescript
workspace.addChangeListener((event: any) => {
  // Verificar que es un evento CHANGE de tipo "field"
  if (event?.type !== Blockly.Events.CHANGE || event?.element !== "field") {
    return;
  }
  
  // Obtener el bloque donde ocurrió el cambio
  const block = workspace.getBlockById?.(event.blockId);
  if (!block) return;
  
  // Verificar que es un shadow block
  if (!block.isShadow?.()) return;
  
  // Verificar que el campo cambiado es numérico
  const field = block.getField?.(event.name);
  if (!field || field.constructor?.name !== "FieldNumber") return;
  
  // Verificar que el shadow block está conectado a un input relevante
  const parent = block.getParent?.();
  if (!parent) return;
  
  // Verificar que el parent es un bloque que nos interesa (game_repeat, game_wait, etc.)
  const relevantTypes = ["game_repeat", "game_wait"];
  if (!relevantTypes.includes(parent.type)) return;
  
  // Verificar que no hay interacciones activas
  if (workspace.isDragging?.()) return;
  
  // Hacer refresh con debounce
  refreshWorkspaceDebounced(workspace);
});
```

---

### **Estrategia 2: Interceptar `FieldNumber.prototype.setValue` con Contexto**

**Concepto:** Interceptar el método `setValue` de `FieldNumber`, pero solo hacer refresh cuando:
- El campo está en un shadow block
- El shadow block está conectado a un input de un bloque relevante
- No hay interacciones activas (drag, click en editor)

**Ventajas:**
- ✅ Captura el cambio en el momento exacto
- ✅ Puede prevenir el refresh si detecta interacciones activas

**Desventajas:**
- ⚠️ Más invasivo: modifica el comportamiento global de Blockly
- ⚠️ Requiere manejar edge cases (cuando Blockly llama internamente a `setValue`)

**Implementación sugerida:**
```typescript
const originalSetValue = Blockly.FieldNumber.prototype.setValue;
Blockly.FieldNumber.prototype.setValue = function(newValue: string | number) {
  const result = originalSetValue.call(this, newValue);
  
  // Verificar contexto antes de hacer refresh
  const sourceBlock = this.sourceBlock_;
  if (!sourceBlock) return result;
  
  // Solo procesar si es shadow block
  if (!sourceBlock.isShadow?.()) return result;
  
  // Verificar parent relevante
  const parent = sourceBlock.getParent?.();
  if (!parent) return result;
  
  const relevantTypes = ["game_repeat", "game_wait"];
  if (!relevantTypes.includes(parent.type)) return result;
  
  // Verificar que no hay interacciones activas
  const workspace = sourceBlock.workspace;
  if (workspace?.isDragging?.()) return result;
  
  // Verificar que el valor realmente cambió
  if (String(this.getValue?.()) === String(newValue)) return result;
  
  // Hacer refresh con debounce
  refreshWorkspaceDebounced(workspace);
  
  return result;
};
```

---

### **Estrategia 3: Event Listener con Verificación de Blur/Finish Editing**

**Concepto:** Escuchar eventos `CHANGE`, pero hacer refresh solo cuando:
- El usuario **termina** de editar (evento `UI` de tipo `field_finish_editing` o similar)
- O después de un debounce largo (500-800ms) que indica que el usuario terminó de escribir

**Ventajas:**
- ✅ No interrumpe la edición activa
- ✅ Más natural: espera a que el usuario termine de escribir

**Desventajas:**
- ⚠️ Puede haber un delay visible antes del refresh
- ⚠️ Requiere identificar correctamente el evento de "fin de edición"

**Implementación sugerida:**
```typescript
let editingTimeout: ReturnType<typeof setTimeout> | null = null;

workspace.addChangeListener((event: any) => {
  // Detectar inicio de edición
  if (event?.type === Blockly.Events.UI && event?.element === "field") {
    // Limpiar timeout anterior
    if (editingTimeout) {
      clearTimeout(editingTimeout);
    }
    return;
  }
  
  // Detectar cambio en campo numérico de shadow block
  if (event?.type === Blockly.Events.CHANGE && event?.element === "field") {
    const block = workspace.getBlockById?.(event.blockId);
    if (!block?.isShadow?.()) return;
    
    const field = block.getField?.(event.name);
    if (field?.constructor?.name !== "FieldNumber") return;
    
    // Limpiar timeout anterior
    if (editingTimeout) {
      clearTimeout(editingTimeout);
    }
    
    // Esperar a que el usuario termine de editar (debounce largo)
    editingTimeout = setTimeout(() => {
      const parent = block.getParent?.();
      if (parent && ["game_repeat", "game_wait"].includes(parent.type)) {
        if (!workspace.isDragging?.()) {
          refreshWorkspace(workspace);
        }
      }
      editingTimeout = null;
    }, 600); // 600ms de debounce
  }
});
```

---

### **Estrategia 4: Combinación: Event Listener + Verificación de Valor Real**

**Concepto:** Escuchar eventos `CHANGE`, pero hacer refresh solo cuando:
- El valor realmente cambió (comparar `oldValue` vs `newValue`)
- El cambio ocurrió en un shadow block numérico relevante
- No hay interacciones activas
- Usar debounce corto (150-200ms) para agrupar cambios rápidos

**Ventajas:**
- ✅ Balance entre responsividad y estabilidad
- ✅ Evita refreshes innecesarios cuando el valor no cambió realmente
- ✅ Debounce corto agrupa cambios rápidos del usuario

**Desventajas:**
- ⚠️ Puede haber múltiples refreshes si el usuario cambia valores rápidamente

**Implementación sugerida:**
```typescript
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
const REFRESH_DEBOUNCE_MS = 200;

function refreshWorkspaceDebounced(workspace: any) {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  refreshTimeout = setTimeout(() => {
    if (!workspace.isDragging?.()) {
      refreshWorkspace(workspace);
    }
    refreshTimeout = null;
  }, REFRESH_DEBOUNCE_MS);
}

workspace.addChangeListener((event: any) => {
  // Solo procesar eventos CHANGE de tipo "field"
  if (event?.type !== Blockly.Events.CHANGE || event?.element !== "field") {
    return;
  }
  
  // Verificar que el valor realmente cambió
  if (event.oldValue === event.newValue) return;
  
  // Obtener bloque y verificar contexto
  const block = workspace.getBlockById?.(event.blockId);
  if (!block?.isShadow?.()) return;
  
  const field = block.getField?.(event.name);
  if (field?.constructor?.name !== "FieldNumber") return;
  
  const parent = block.getParent?.();
  if (!parent) return;
  
  const relevantTypes = ["game_repeat", "game_wait"];
  if (!relevantTypes.includes(parent.type)) return;
  
  // Verificar que no hay interacciones activas
  if (workspace.isDragging?.()) return;
  
  // Hacer refresh con debounce
  refreshWorkspaceDebounced(workspace);
});
```

---

### **Estrategia 5: Save/Load Solo en Shadow Blocks Específicos**

**Concepto:** En lugar de interceptar a nivel global, agregar lógica específica en los `setOnChange` de los bloques `game_repeat` y `game_wait`, pero usando save/load en lugar de re-render agresivo.

**Ventajas:**
- ✅ Muy específico: solo afecta los bloques que necesitan el fix
- ✅ No modifica comportamiento global de Blockly
- ✅ Fácil de mantener y entender

**Desventajas:**
- ⚠️ Requiere modificar cada bloque que necesite el fix
- ⚠️ No es escalable automáticamente para nuevos bloques

**Implementación sugerida:**
```typescript
// En mazeApp.ts, dentro de game_repeat.init:
this.setOnChange(function(changeEvent: any) {
  // Verificar que es un cambio en el input TIMES
  if (changeEvent?.element !== "field") return;
  
  const input = this.getInput("TIMES");
  if (!input) return;
  
  const connectedBlock = input.connection?.targetBlock?.();
  if (!connectedBlock?.isShadow?.()) return;
  
  // Verificar que el cambio ocurrió en el shadow block conectado
  if (changeEvent.blockId !== connectedBlock.id) return;
  
  // Verificar que no hay interacciones activas
  if (this.workspace.isDragging?.()) return;
  
  // Hacer refresh con debounce
  refreshWorkspaceDebounced(this.workspace);
});
```

---

## 🔧 Función Helper de Refresh (Save/Load)

**Implementación base:**
```typescript
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
const REFRESH_DEBOUNCE_MS = 200;

function refreshWorkspace(workspace: any, Blockly: BlocklyLike) {
  try {
    // Guardar estado actual
    const xml = Blockly.Xml?.workspaceToDom(workspace);
    const xmlText = Blockly.Xml?.domToText(xml);
    
    // Limpiar workspace
    workspace.clear?.();
    
    // Restaurar desde XML
    const dom = Blockly.Xml?.textToDom(xmlText);
    Blockly.Xml?.domToWorkspace(dom, workspace);
  } catch (error) {
    console.error("Error en refreshWorkspace:", error);
  }
}

function refreshWorkspaceDebounced(workspace: any, Blockly: BlocklyLike) {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  refreshTimeout = setTimeout(() => {
    // Verificar una última vez que no hay interacciones activas
    if (!workspace.isDragging?.()) {
      refreshWorkspace(workspace, Blockly);
    }
    refreshTimeout = null;
  }, REFRESH_DEBOUNCE_MS);
}
```

---

## 📊 Comparación de Estrategias

| Estrategia | Especificidad | Invasividad | Escalabilidad | Complejidad | Recomendación |
|------------|---------------|-------------|---------------|-------------|---------------|
| **1. Event Listener Específico** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ **Recomendada** |
| **2. Interceptar setValue** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ Funcional pero invasiva |
| **3. Blur/Finish Editing** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Buena para UX |
| **4. Combinación + Verificación** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ **Más robusta** |
| **5. setOnChange Específico** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐ | ⚠️ No escalable |

---

## 🎯 Recomendación Final

**Estrategia Recomendada: Estrategia 4 (Combinación + Verificación)**

**Razones:**
1. ✅ **Específica**: Solo detecta cambios en campos numéricos de shadow blocks relevantes
2. ✅ **Robusta**: Verifica valor real, contexto, y estado de interacciones
3. ✅ **Escalable**: Funciona automáticamente para nuevos bloques con inputs numéricos
4. ✅ **No invasiva**: No modifica comportamiento global de Blockly
5. ✅ **Eficiente**: Debounce corto agrupa cambios rápidos

**Implementación sugerida:**
- Agregar el listener en `workspace.ts` dentro de `createWorkspace`
- Usar la función helper `refreshWorkspaceDebounced` con debounce de 200ms
- Verificar siempre `isDragging()` antes de hacer refresh
- Filtrar por tipos de bloques relevantes (configurable)

---

## 🚀 Próximos Pasos

1. Implementar **Estrategia 4** en `workspace.ts`
2. Probar con `game_repeat` y `game_wait`
3. Verificar que drag-and-drop y click para editar siguen funcionando
4. Ajustar debounce si es necesario (150-300ms)
5. Extender a otros bloques si es necesario
