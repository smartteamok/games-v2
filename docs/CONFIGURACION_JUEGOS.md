# Configuración de los juegos

Este documento describe dónde y cómo se configuran **obstáculos**, **límite de bloques**, **instrucciones iniciales** y **bloques iniciales** por nivel. La fuente de verdad es el código en `app/src/apps/maze/levels.ts`.

---

## Dónde se configura

**Archivo:** `app/src/apps/maze/levels.ts`

Cada nivel es un objeto `MazeLevel` con `id`, `title`, `gridW`, `gridH`, `walls`, `start`, `goal` y opciones adicionales.

---

## Obstáculos

Se definen en el array **`walls`** de cada nivel. Cada obstáculo tiene:

- **`x`**, **`y`**: posición en la grilla (0-based).
- **`type`** (opcional): tipo de sprite. Sin `type` se usa el dibujo por defecto.

**Tipos usados:** `"rock"`, `"tree"`, etc. Los sprites se cargan desde:

- `public/game-sprites/obstacles/{type}.png`

**Ejemplo:**

```ts
walls: [
  { x: 2, y: 0, type: "rock" },
  { x: 2, y: 1, type: "tree" },
  { x: 2, y: 2, type: "rock" }
]
```

---

## Límite de bloques

- **`blockLimit`**: límite de bloques mostrado en la UI (contador “instrucciones disponibles”) y para bloquear la paleta al superarlo.
- **`constraints.maxBlocks`**: usado por la validación al ejecutar (mensaje “Usá máximo N bloques”).
- **`constraints.mustUseRepeat`**: si es `true`, el nivel exige usar al menos un bloque “repetir”.

**Ejemplo:**

```ts
blockLimit: 8,
constraints: { maxBlocks: 8, mustUseRepeat: true }
```

Por defecto no hay límite; si no se define `blockLimit` ni `constraints.maxBlocks`, el nivel se considera “sin límite”.

---

## Instrucciones iniciales

- **`instructions`**: texto libre por nivel (ej. “Llegá a la meta usando solo 8 bloques”).
- Opcional. Por ahora se define en el nivel para documentación y uso futuro en la UI.

**Ejemplo:**

```ts
instructions: "Llegá a la meta usando solo 8 bloques."
```

---

## Bloques iniciales por nivel

Por defecto **todos los niveles empiezan vacíos** (solo el bloque de inicio). Se puede prellenar el workspace con bloques mediante:

- **`initialBlocks`**: Blockly XML para **bloques horizontales** (Laberinto, Práctica). Tipos `game_*`.
- **`initialBlocksVertical`**: Blockly XML para **bloques verticales** (Laberinto vertical). Tipos `v_game_*`.

Formato: cadena XML (con o sin `<xml>...</xml>`). Los bloques se añaden al cargar el nivel y se conectan al bloque de inicio.

**Ejemplo horizontal** (`initialBlocks`):

```ts
initialBlocks: `<xml><block type="game_move"/><block type="game_move"/></xml>`
```

**Ejemplo vertical** (`initialBlocksVertical`):

```ts
initialBlocksVertical: `<xml><block type="v_game_move"/><block type="v_game_turn_right"/></xml>`
```

Si no se define, el nivel arranca sin bloques previos.

---

## Imagen de fondo del canvas

- **`backgroundImage`**: nombre de archivo (ej. `"level1.png"`) en `public/game-sprites/backgrounds/`.
- Opcional. Sin definirlo se usa el fondo por defecto (gradiente blanco/gris).

---

## Resumen de opciones por nivel

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `walls` | `Obstacle[]` | Obstáculos; `type` → sprite en `obstacles/{type}.png` |
| `blockLimit` | `number?` | Límite de bloques (UI y bloqueo de paleta) |
| `constraints.maxBlocks` | `number?` | Límite validado al ejecutar |
| `constraints.mustUseRepeat` | `boolean?` | Obliga a usar “repetir” |
| `instructions` | `string?` | Instrucciones iniciales del nivel |
| `initialBlocks` | `string?` | XML bloques iniciales (horizontal) |
| `initialBlocksVertical` | `string?` | XML bloques iniciales (vertical) |
| `backgroundImage` | `string?` | Imagen en `game-sprites/backgrounds/` |

---

## Relación con el README

Este documento amplía la [documentación del proyecto](../README.md#-documentación). Para arrancar el proyecto, scripts y despliegue, ver el [README](../README.md).
