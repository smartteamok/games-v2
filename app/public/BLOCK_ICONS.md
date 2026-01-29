# Iconos de bloques (paleta de programar)

Las **fuentes de imágenes de los bloques son distintas** para bloques horizontales y verticales.

---

## Bloques horizontales (Laberinto, Práctica)

**Rutas base:**

| Uso | Carpeta | Ejemplo |
|-----|---------|---------|
| Mover, Atrás, Girar | `public/game-icons/` | `move-right.svg`, `move-left.svg`, `turn-left.svg`, `turn-right.svg` |
| Inicio | Bloque por defecto de Scratch (`event_whenflagclicked`), sin ícono custom |
| Repetir, Esperar | `public/vendor/scratch-blocks/media/icons/` | `control_repeat.svg`, `control_wait.svg` |

**Dónde se cargan:** `app/src/apps/maze/mazeApp.ts`  
- Constantes `ICON_MOVE`, `ICON_BACK`, `ICON_TURN_LEFT`, `ICON_TURN_RIGHT` → `BASE_URL + "game-icons/..."`  
- `pathToMedia` para `game_repeat` y `game_wait` → `vendor/scratch-blocks/media/`

---

## Bloques verticales (Laberinto vertical)

**Rutas base:**

| Uso | Carpeta | Ejemplo |
|-----|---------|---------|
| Inicio, Mover, Atrás, Girar | `public/game-icons-vertical/` | `play-green.svg`, `move-right.svg`, `move-left.svg`, `turn-left.svg`, `turn-right.svg` |
| Repetir, Esperar | `public/vendor/scratch-blocks/media/icons/` | `control_repeat.svg`, `control_wait.svg` |

**Dónde se cargan:** `app/src/apps/maze-vertical/mazeVerticalApp.ts`  
- `pathToIconsVertical` → `BASE_URL + "game-icons-vertical/"`  
- `pathToMedia` → `vendor/scratch-blocks/media/` (repeat, wait)

---

## Resumen

- **Horizontales:** `game-icons/` para Mover/Atrás/Girar; inicio = bloque bandera de Scratch.
- **Verticales:** `game-icons-vertical/` (incluye `play-green.svg` para el bloque "Inicio" con play verde).

Podés usar iconos distintos en cada carpeta para diferenciar horizontal y vertical.
