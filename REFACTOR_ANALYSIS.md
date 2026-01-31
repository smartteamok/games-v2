# Análisis de Refactoring — Game Blocks

## Resumen Ejecutivo

El proyecto tiene una base sólida pero presenta **deuda técnica significativa** que dificultará escalar a 20 juegos. Los problemas principales son:

1. **Duplicación masiva de código** (~80% de `practiceApp.ts` es copia de `mazeApp.ts`)
2. **Archivo "god object"** (`mazeApp.ts` con 1315 líneas mezclando concerns)
3. **Estado global mutable** disperso sin encapsulación
4. **Inconsistencias arquitectónicas** (algunos juegos reutilizan, otros no)

---

## 🔴 Problemas Críticos (Alta Prioridad)

### 1. Duplicación Masiva: `practiceApp.ts` vs `mazeApp.ts`

**Archivo:** `app/src/apps/practice/practiceApp.ts` (481 líneas)

El archivo `practiceApp.ts` **duplica casi todo** de `mazeApp.ts`:

| Componente Duplicado | Líneas |
|---------------------|--------|
| Tipos (`MazeState`, `MazeUI`) | ~30 |
| Constantes (`DIR_ORDER`, `DIR_DELTAS`) | ~15 |
| Helpers (`turnLeft`, `turnRight`, `isBlocked`, `inBounds`) | ~20 |
| `ensureUI()` | ~40 |
| `updateProgressBar()` | ~50 |
| `drawMaze()` | ~140 |
| `adapter` completo | ~100 |
| `serialize/deserialize` | ~35 |

**Impacto:** Cualquier bug fix o mejora debe hacerse en 2+ lugares. Con 20 juegos, esto sería inmanejable.

**Solución propuesta:**
```
apps/
├── shared/
│   └── maze-like/
│       ├── types.ts        # MazeState, MazeUI, Direction
│       ├── constants.ts    # DIR_ORDER, DIR_DELTAS
│       ├── logic.ts        # turnLeft, turnRight, isBlocked, inBounds
│       ├── renderer.ts     # drawMaze, ensureUI
│       ├── adapter.ts      # RuntimeAdapter genérico
│       └── factory.ts      # createMazeLikeApp(config)
├── maze/
│   ├── mazeApp.ts          # Usa factory con config específico
│   └── levels.ts
├── practice/
│   ├── practiceApp.ts      # Usa factory con config específico
│   └── levels.ts
```

---

### 2. `mazeApp.ts` — Archivo Monolítico (1315 líneas)

**Archivo:** `app/src/apps/maze/mazeApp.ts`

Este archivo mezcla demasiadas responsabilidades:

| Responsabilidad | Líneas Aprox |
|-----------------|--------------|
| Tipos y constantes | 70 |
| Carga de sprites (player, obstacles, goal, backgrounds) | 200 |
| Lógica de juego (movement, collision) | 100 |
| UI/DOM (ensureUI, skills panel, play button) | 200 |
| Rendering (drawMaze) | 250 |
| Definición de bloques (registerMazeLikeBlocks) | 130 |
| RuntimeAdapter | 120 |
| Progress bar y block limit counter | 150 |
| Serialización | 50 |
| AppDefinition | 60 |

**Solución propuesta — División en módulos:**

```
apps/maze/
├── index.ts              # Export de mazeApp
├── mazeApp.ts            # Solo AppDefinition (~100 líneas)
├── levels.ts             # Sin cambios
├── blocks.ts             # registerMazeLikeBlocks, toolbox XML
├── config.ts             # Constantes, colores, tamaños
├── state.ts              # MazeState, makeInitialState
├── logic.ts              # Movement, collision, direction helpers
├── sprites/
│   ├── loader.ts         # loadPlayerSprite, loadObstacleSprite, loadGoalSprite
│   ├── preloader.ts      # preloadObstacleSprites, preloadMazeBackgrounds
│   └── types.ts          # AnimationState
├── ui/
│   ├── ensureUI.ts       # Crear UI del maze
│   ├── progressBar.ts    # updateProgressBar
│   ├── blockCounter.ts   # updateBlockLimitCounter
│   ├── skillsPanel.ts    # createSkillsPanel, toggle, close
│   └── playButton.ts     # createStagePlayButton, updateState
├── renderer.ts           # drawMaze
├── adapter.ts            # RuntimeAdapter
└── constraints.ts        # checkConstraints
```

---

### 3. Estado Global Mutable No Encapsulado

**Archivo:** `app/src/apps/maze/mazeApp.ts` (líneas 65-100)

```typescript
// Variables globales problemáticas:
let ui: MazeUI | null = null;
let animationState: AnimationState = null;
let skillsPanel: HTMLElement | undefined = undefined;
let skillsPanelOverlay: HTMLElement | undefined = undefined;
let mazeContainerW = 0;
let mazeContainerH = 0;
let resizeObserver: ResizeObserver | null = null;
let playerSprite: HTMLImageElement | null = null;
let playerSpriteFrames = 4;
let walkFrame = 0;
let lastWalkFrameTime = 0;
// ... y más
```

**Problemas:**
- Difícil de testear
- Race conditions potenciales
- Imposible tener múltiples instancias
- Memory leaks si no se limpian

**Solución propuesta — Encapsular en clase o contexto:**

```typescript
// Opción 1: Clase
class MazeRenderer {
  private ui: MazeUI | null = null;
  private animationState: AnimationState = null;
  // ...
  
  constructor(private config: MazeConfig) {}
  
  render(state: MazeState) { ... }
  destroy() { ... }
}

// Opción 2: Factory con closure
function createMazeRenderer(config: MazeConfig) {
  let ui: MazeUI | null = null;
  let animationState: AnimationState = null;
  
  return {
    render: (state: MazeState) => { ... },
    destroy: () => { ... }
  };
}
```

---

## 🟠 Problemas Importantes (Media Prioridad)

### 4. `main.ts` con Demasiadas Responsabilidades (419 líneas)

**Archivo:** `app/src/apps/main.ts`

Actualmente maneja:
- Routing
- Carga de scripts Blockly
- Estado del juego (`workspace`, `currentApp`, `appState`, `runtimeController`)
- Inicialización de vista de juego
- Event listeners globales
- Efectos visuales (win/error)
- Lógica de avance de nivel

**Solución propuesta:**

```
src/
├── main.ts                    # Solo bootstrap (~50 líneas)
├── router.ts                  # Sin cambios
├── game/
│   ├── GameController.ts      # Estado y lógica del juego
│   ├── BlocklyLoader.ts       # Carga lazy de scripts
│   ├── GameEffects.ts         # triggerWinEffect, triggerErrorEffect
│   └── LevelManager.ts        # advanceToNextLevel, refreshBlockLimit
```

---

### 5. Definición de `BlockType` Duplicada

El tipo `BlockType` está definido en **4 archivos diferentes**:

| Archivo | Definición |
|---------|------------|
| `apps/types.ts` | `export type BlockType = "horizontal" \| "vertical"` |
| `pages/gameView.ts` | `export type BlockType = "horizontal" \| "vertical"` |
| `pages/catalog.ts` | `export type BlockType = "horizontal" \| "vertical"` |
| `apps/maze/mazeApp.ts` | `export type BlockType = "horizontal" \| "vertical"` |

**Solución:** Definir en un solo lugar (`apps/types.ts`) y re-exportar donde se necesite.

---

### 6. CSS Monolítico (1116 líneas)

**Archivo:** `app/src/style.css`

Un solo archivo con todos los estilos dificulta:
- Mantenimiento
- Encontrar estilos específicos
- Evitar conflictos de nombres

**Solución propuesta:**

```
src/styles/
├── index.css           # Imports
├── variables.css       # CSS custom properties
├── base.css            # Reset, typography
├── layout.css          # Layout horizontal/vertical
├── toolbar.css         # Toolbar styles
├── game-stage.css      # Stage area
├── editor.css          # Blockly area
├── landing.css         # Landing page
├── components/
│   ├── buttons.css
│   ├── cards.css
│   ├── progress-bar.css
│   └── skills-panel.css
```

---

## 🟡 Mejoras Recomendadas (Baja Prioridad)

### 7. Falta Factory para Juegos Maze-Like

Actualmente hay 3 juegos "maze-like" (`maze`, `maze-vertical`, `practice`) con mucha duplicación.

**Solución — Factory Pattern:**

```typescript
// apps/shared/maze-like/factory.ts
export function createMazeLikeApp(config: MazeLikeConfig): AppDefinition<MazeState> {
  const { 
    id, 
    title, 
    blockType,
    levels,
    toolboxXml,
    registerBlocks,
    gameColor,
    checkConstraints
  } = config;

  return {
    id,
    title,
    blockType,
    levels: levels.map(l => ({ id: l.id, title: l.title, blockLimit: l.blockLimit })),
    toolboxXml,
    registerBlocks,
    createInitialState: () => makeInitialState(1, []),
    render: (rootEl, state, ctx) => {
      const renderer = getOrCreateRenderer(id, gameColor);
      renderer.render(rootEl, state, ctx, levels);
    },
    adapter: createMazeAdapter(levels),
    compileOptions: getCompileOptions(blockType),
    checkConstraints,
    serializeState: serializeMazeState,
    deserializeState: deserializeMazeState
  };
}
```

Uso:
```typescript
// apps/maze/mazeApp.ts
export const mazeApp = createMazeLikeApp({
  id: "maze",
  title: "Laberinto",
  blockType: "horizontal",
  levels: mazeLevels,
  toolboxXml: MAZE_TOOLBOX_XML,
  registerBlocks: registerMazeBlocks,
  gameColor: "#4C97FF"
});

// apps/practice/practiceApp.ts
export const practiceApp = createMazeLikeApp({
  id: "practice",
  title: "Práctica",
  blockType: "horizontal",
  levels: practiceLevels,
  toolboxXml: MAZE_TOOLBOX_XML,
  registerBlocks: registerMazeBlocks,
  gameColor: "#9B59B6"
});
```

---

### 8. Sprite Loading Debería Ser un Módulo Independiente

El código de carga de sprites está mezclado con la lógica del juego.

**Solución:**

```typescript
// core/sprites/SpriteLoader.ts
export class SpriteLoader {
  private cache = new Map<string, HTMLImageElement>();
  
  async load(src: string): Promise<HTMLImageElement> {
    if (this.cache.has(src)) return this.cache.get(src)!;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }
  
  preload(sources: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(sources.map(src => this.load(src)));
  }
}

// core/sprites/AnimatedSprite.ts
export class AnimatedSprite {
  constructor(
    private image: HTMLImageElement,
    private frameCount: number,
    private frameDuration: number
  ) {}
  
  getFrame(time: number): { sx: number, sy: number, sw: number, sh: number } {
    // ...
  }
}
```

---

### 9. Registry de Apps Debería Ser Más Dinámico

**Archivo actual:** `apps/registry.ts`

```typescript
import { mazeApp } from "./maze/mazeApp";
import { mazeVerticalApp } from "./maze-vertical/mazeVerticalApp";
import { practiceApp } from "./practice/practiceApp";

export const apps: AppDefinition<unknown>[] = [
  mazeApp,
  mazeVerticalApp,
  practiceApp
] as AppDefinition<unknown>[];
```

**Problema:** Hay que importar manualmente cada juego.

**Solución — Auto-registro:**

```typescript
// apps/registry.ts
const appRegistry = new Map<string, AppDefinition<unknown>>();

export function registerApp(app: AppDefinition<unknown>) {
  appRegistry.set(app.id, app);
}

export function getAppById(id: string) {
  return appRegistry.get(id);
}

export function getAllApps() {
  return Array.from(appRegistry.values());
}

// apps/maze/index.ts
import { mazeApp } from "./mazeApp";
import { registerApp } from "../registry";

registerApp(mazeApp);
export { mazeApp };
```

---

## 📋 Plan de Refactoring Sugerido

### Fase 1: Eliminar Duplicación (Crítico)
1. Crear `apps/shared/maze-like/` con código compartido
2. Refactorizar `practiceApp.ts` para usar código compartido
3. Verificar que `maze`, `maze-vertical` y `practice` funcionen igual

### Fase 2: Dividir `mazeApp.ts`
1. Extraer sprites a módulo separado
2. Extraer UI components (skills panel, play button, progress bar)
3. Extraer renderer
4. Extraer adapter

### Fase 3: Limpiar Estado Global
1. Encapsular estado en clases o factories
2. Implementar cleanup apropiado

### Fase 4: Reorganizar `main.ts`
1. Extraer GameController
2. Extraer BlocklyLoader
3. Extraer efectos visuales

### Fase 5: Consolidar Tipos y Estilos
1. Unificar definición de `BlockType`
2. Dividir CSS en módulos

---

## 📊 Métricas Actuales vs Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Líneas en `mazeApp.ts` | 1315 | <300 |
| % código duplicado `practiceApp` | ~80% | 0% |
| Archivos >500 líneas | 3 | 0 |
| Variables globales en maze | ~15 | 0 |
| Definiciones duplicadas de `BlockType` | 4 | 1 |

---

## Conclusión

El refactoring más urgente es **eliminar la duplicación entre `practiceApp.ts` y `mazeApp.ts`** siguiendo el patrón que ya se usó con `mazeVerticalApp.ts`. Esto reducirá significativamente la deuda técnica y facilitará agregar los 17 juegos restantes.

La división de `mazeApp.ts` en módulos más pequeños es el segundo paso más importante para mantener el código manejable a largo plazo.
