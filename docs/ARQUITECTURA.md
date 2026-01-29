# Arquitectura Game Blocks — 20 juegos (10 horizontal + 10 vertical)

## 1. Visión general

- **Landing** (`/`): lista los 20 juegos (orden configurable). Cada juego: imagen, nombre, datos descriptivos (tipo de programación, etc.). Navegación a `/game/{id}`.
- **Juegos 1–10**: bloques **horizontales** (Scratch-blocks horizontal). Layout en **filas**: toolbar → stage → editor (3 franjas).
- **Juegos 11–20**: bloques **verticales** con look Scratch (render Zelos), icono pequeño + texto, traducibles. Layout en **columnas**: Bloques | Canvas de programación | Espacio del juego (3 columnas).
- **Bloques**: dos conjuntos separados (horizontal vs vertical). Misma función puede existir en ambos; instrucciones verticales se muestran/ocultan por juego o nivel.
- **i18n**: todo traducible (UI, juegos, niveles, bloques). Idiomas: ES, EN, PT. Detección automática + selector.
- **Assets**: por juego en `public/game-sprites/{game-id}/`.
- **Persistencia**: guardar tipo de workspace (horizontal/vertical) con el proyecto; recordar juego reciente.

---

## 2. Rutas y páginas

| Ruta | Contenido |
|------|------------|
| `/` | Landing: grid/lista de 20 juegos. Cada card: imagen, nombre, descripción, tipo de programación. Click → `/game/{id}`. |
| `/game/:id` | App del juego: toolbar unificada + layout según tipo (filas si horizontal, columnas si vertical). |

- **Routing**: SPA con router (ej. Vue Router, React Router, o custom con History API). Una sola entrada `index.html`; el router decide si mostrar landing o game.

---

## 3. Layouts

### 3.1 Horizontal (juegos 1–10)

- **3 franjas (filas)**:
  1. Toolbar (juego, niveles, habilidades, etc.)
  2. Stage (maze/canvas del juego)
  3. Editor (instrucciones + área de bloques)
- Misma estructura que la actual.

### 3.2 Vertical (juegos 11–20)

- **3 columnas**:
  1. **Columna izquierda**: toolbox de bloques (Blockly vertical).
  2. **Columna centro**: canvas de programación (workspace Blockly).
  3. **Columna derecha**: espacio del juego (maze, puzzle, etc.).
- Toolbar unificada arriba (misma para todos los juegos).

---

## 4. Sistema de bloques

### 4.1 Dos variantes Blockly

| Aspecto | Horizontal (1–10) | Vertical (11–20) |
|---------|-------------------|------------------|
| Scripts | `blockly_compressed_horizontal.js` + `blocks_compressed_horizontal.js` | Blockly estándar vertical (Scratch/Zelos) |
| Look | Scratch-blocks horizontal | Scratch (Zelos), icono + texto |
| Toolbox | Iconos (o icono+texto) | Icono pequeño + texto (i18n) |
| Conjunto | Set horizontal único | Set vertical único |
| Visibilidad | Por juego/nivel | Por juego/nivel (mostrar/ocultar bloques) |

- **Conjuntos separados**: tipos de bloques distintos (ej. `game_move` vs `move_forward`). No compartir IDs entre horizontal y vertical para evitar colisiones.
- **Compiler**: mismo **AST** interno (ops: move, turn, repeat, wait, etc.). Cada conjunto tiene su **mapeo** de tipo de bloque → op. Así un solo runtime y misma lógica de juego.
- **Runtime**: mismo **RuntimeAdapter** por tipo de juego (maze-like, puzzle, etc.). El adapter no depende del tipo de bloques, sino del estado del juego.

### 4.2 Carga de Blockly

- **Lazy loading por tipo**:
  - Al entrar en `/` no se carga ningún Blockly.
  - Al entrar en `/game/:id`:
    - Si el juego es horizontal → cargar scripts horizontal + crear workspace horizontal.
    - Si el juego es vertical → cargar scripts vertical (Zelos) + crear workspace vertical.
  - Al cambiar de juego con **mismo tipo** (horizontal→horizontal): reutilizar mismo script; destruir workspace anterior y crear uno nuevo con toolbox del nuevo juego.
  - Al cambiar de juego con **tipo distinto** (horizontal→vertical): cargar el otro script si aún no está cargado, destruir workspace anterior, crear el nuevo. **Estado del programa se resetea** (no migrar bloques entre horizontal y vertical).

- Ventajas: menor carga inicial en landing, menos riesgo de conflictos entre los dos Blockly.

---

## 5. Configuración (global y por juego)

- **Global** (`core/config/`): temas, colores base, rutas de vendor, idioma por defecto, constantes de UI (toolbar, etc.).
- **Por juego** (`apps/<game>/config.ts`):
  - `blockType: 'horizontal' | 'vertical'`
  - `assets`: rutas relativas a `game-sprites/{game-id}/`
  - `toolboxXml` (o equivalente)
  - `blockIds`: lista de tipos de bloque para este juego/nivel (para mostrar/ocultar).
  - Límites, niveles, etc.
- Sirve para: no hardcodear assets ni layouts, soportar 20 juegos sin tocar core, y permitir niveles con distintos conjuntos de bloques.

---

## 6. Estructura de carpetas propuesta

```
app/
├── public/
│   ├── game-sprites/
│   │   ├── maze/
│   │   ├── practice/
│   │   └── {game-id}/           # Un folder por juego
│   ├── vendor/
│   │   ├── scratch-blocks-h/    # Horizontal (actual)
│   │   └── scratch-blocks-v/    # Vertical (Zelos)
│   └── ...
│
├── src/
│   ├── core/
│   │   ├── runtime/             # Sin cambios de concepto
│   │   ├── compiler/            # Un compilador, mapeos por block set (horizontal / vertical)
│   │   ├── editor/
│   │   │   ├── workspace-h.ts   # Crear workspace horizontal
│   │   │   ├── workspace-v.ts   # Crear workspace vertical
│   │   │   └── ...
│   │   ├── i18n/
│   │   ├── assets/              # Loader por juego
│   │   ├── config/              # Global + helpers
│   │   └── ui/                  # Toolbar, stage button, etc. unificados
│   │
│   ├── apps/
│   │   ├── shared/              # Utilidades compartidas
│   │   ├── maze/
│   │   ├── practice/
│   │   └── {game-3} ... {game-20}/
│   │
│   ├── pages/
│   │   ├── landing/             # Vista landing (lista de juegos)
│   │   └── game/                # Vista game (toolbar + layout + stage + editor)
│   │
│   ├── router.ts                # / y /game/:id
│   └── main.ts                  # Bootstrap, i18n, carga de scripts
│
└── ...
```

Cada juego en `apps/<game>/`:
- `gameApp.ts` (o `index.ts`): definición del juego (id, título, blockType, niveles, adapter, render, etc.).
- `levels.ts` (si aplica).
- `config.ts`: assets, toolbox, blockIds por nivel.
- `adapter.ts`: runtime.
- `renderer.ts` / UI del stage si es específica.
- `i18n.ts`: claves de traducción del juego y bloques.

---

## 7. Internacionalización (i18n)

- **Alcance**: UI, nombres de juegos, niveles, mensajes, **y textos de bloques** (como Scratch).
- **Idiomas**: ES, EN, PT. Detección automática (navegador) + selector en la app.
- **Implementación**:
  - Core: `core/i18n/` con `locale`, `t(key)`, `setLocale`, y ficheros por idioma.
  - Bloques: Blockly con mensajes traducibles (msg/es.js, msg/en.js, etc.) y/o claves que se resuelven con `t()`.
- Traducciones de bloques en `apps/<game>/i18n.ts` (o en locale files referenciando `game.<id>.blocks.*`).

---

## 8. Persistencia y estado

- **Guardado de proyecto**: incluir `gameId` y `blockType: 'horizontal' | 'vertical'`. No migrar proyectos entre tipos.
- **Juego reciente**: guardar en `localStorage` (ej. `lastGameId`). En landing o en toolbar, opcionalmente destacar o abrir último juego.
- **Nivel reciente**: se puede guardar por juego (ej. `lastLevelByGame[id]`) para reanudar en el mismo nivel.

---

## 9. Decisiones técnicas (resumen)

| Tema | Decisión |
|------|----------|
| Compiler | Un solo AST; dos mapeos bloque→op (horizontal y vertical). Mismo runtime. |
| Runtime | Mismo patrón RuntimeAdapter; no depende del tipo de bloques. |
| Carga Blockly | Lazy por tipo al entrar en un juego horizontal o vertical. |
| Cambio horizontal↔vertical | Destruir workspace, (opcionalmente) cargar otro script, resetear programa. |
| Toolbox vertical | Posición: izquierda en layout de 3 columnas (toolboxPosition start). |
| Config | Global + por juego (assets, blockType, toolbox, blockIds, niveles). |

---

## 10. Plan de implementación (fases)

### Fase 0: Preparación (sin tocar comportamiento actual)
- Documentar arquitectura (este doc).
- Definir estructura de carpetas y rutas (`/`, `/game/:id`).
- Decidir stack de routing (e.g. History API + componente Landing + Game).

### Fase 1: Landing y routing
- Implementar router: `/` → Landing, `/game/:id` → Game.
- Landing: lista de juegos desde un registro (array o config); cada juego con id, nombre, imagen, descripción, tipo de programación.
- Navegación a `/game/{id}` sin cargar Blockly en landing.

### Fase 2: Separar layout horizontal y preparar layout vertical
- Mantener layout actual como “layout horizontal” (3 filas).
- Introducir “layout vertical” (3 columnas: bloques | editor | stage).
- Según `game.blockType`, montar uno u otro layout en la vista Game.
- Toolbar unificada para ambos.

### Fase 3: Blockly vertical y lazy loading
- Integrar Blockly estándar (Zelos) para vertical.
- Lazy load: cargar scripts horizontal o vertical solo al abrir un juego de ese tipo.
- Crear workspace vertical con toolbox a la izquierda, mismo concepto de `createWorkspace` pero con opciones verticales.

### Fase 4: Compiler y bloques verticales
- Definir set de bloques verticales (tipos, textos, iconos) y su registro.
- Mapeo bloque vertical → mismo AST que horizontal donde aplique.
- Un solo compilador con dos “frontends” (horizontal / vertical) que producen el mismo AST.

### Fase 5: Config y assets por juego
- `core/config` global.
- Por juego: `config.ts` con `blockType`, `assets` (rutas a `game-sprites/{id}/`), toolbox, blockIds.
- Cargar assets por juego desde config.

### Fase 6: i18n
- Core i18n (ES, EN, PT), detección + selector.
- Traducir UI, juegos, niveles.
- Integrar traducción de bloques (Blockly msg o claves propias).

### Fase 7: Persistencia
- Guardar en proyecto: `gameId`, `blockType`.
- Último juego (y opcionalmente último nivel por juego) en localStorage.

### Fase 8: Refactor y escalabilidad
- Extraer UI genérica (stage button, block counter, skills panel).
- Reducir acoplamiento entre juegos y core.
- Dejar listo para agregar más juegos solo con config + adapter + niveles.

---

## 11. Preguntas abiertas (opcional)

1. **Orden de los 20 juegos**: ¿tenés ya la lista (id, nombre, horizontal/vertical) para ordenar la landing?
2. **Nombres de juegos**: ¿los 20 ya están definidos o solo maze/practice por ahora?
3. **Blockly Zelos**: ¿tenés ya el build/script del Blockly vertical con look Scratch (Zelos) o hay que elegir/armar uno?
4. **Imágenes de la landing**: ¿mismo tamaño/ratio para todas las cards (ej. 16:9) o flexible?

Con esto la arquitectura queda alineada con: 10 juegos horizontales, 10 verticales, landing única, layouts distintos, bloques y compiler unificados en concepto, i18n completo y persistencia con tipo de workspace y juego reciente.
