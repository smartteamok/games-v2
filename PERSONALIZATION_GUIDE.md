# 🎨 Guía de Personalización

Esta guía te ayudará a personalizar diferentes aspectos del juego: personajes, metas, mensajes de feedback y más.

---

## 📍 Tabla de Contenidos

1. [Personaje Personalizado Animado](#personaje-personalizado-animado)
2. [Imagen de Meta Personalizada](#imagen-de-meta-personalizada)
3. [Mensajes de Feedback](#mensajes-de-feedback)
4. [Colores y Temas](#colores-y-temas)

---

## 🎭 Personaje Personalizado Animado

### Ubicación de Archivos

Los personajes se dibujan en el canvas usando código JavaScript. Para personalizar el personaje, necesitas modificar la función `drawMaze` en:

- **Laberinto**: `app/src/apps/maze/mazeApp.ts` (línea ~220-280)
- **Práctica**: `app/src/apps/practice/practiceApp.ts` (línea ~220-280)

### Opción 1: Usar Imagen Sprite (Recomendado)

Para un personaje animado que camine, puedes usar un sprite sheet (imagen con múltiples frames).

#### Paso 1: Preparar el Sprite Sheet

1. Crea una imagen con múltiples frames del personaje caminando
2. Formato recomendado: PNG con transparencia
3. Organiza los frames horizontalmente (ej: 4 frames para 4 direcciones)
4. Guarda en: `app/public/game-sprites/player-sprite.png`

**Ejemplo de estructura:**
```
[Frame N] [Frame E] [Frame S] [Frame W]
```

#### Paso 2: Modificar el Código

En `mazeApp.ts` o `practiceApp.ts`, busca la sección donde se dibuja el jugador:

```typescript
// Jugador con outline blanco
const playerX = animationState
  ? PADDING + animationState.playerX * CELL + CELL / 2
  : PADDING + state.player.x * CELL + CELL / 2;
const playerY = animationState
  ? PADDING + animationState.playerY * CELL + CELL / 2
  : PADDING + state.player.y * CELL + CELL / 2;
const playerDir = animationState ? animationState.playerDir : state.player.dir;
```

**Reemplaza con:**

```typescript
// Cargar sprite sheet (hacerlo una vez, fuera de drawMaze)
let playerSprite: HTMLImageElement | null = null;
const loadPlayerSprite = () => {
  if (!playerSprite) {
    playerSprite = new Image();
    playerSprite.src = "/game-sprites/player-sprite.png";
  }
  return playerSprite;
};

// En drawMaze, reemplazar el dibujo del triángulo con:
const sprite = loadPlayerSprite();
if (sprite.complete) {
  const frameWidth = sprite.width / 4; // 4 direcciones
  const frameIndex = playerDir === "N" ? 0 : playerDir === "E" ? 1 : playerDir === "S" ? 2 : 3;
  const sx = frameIndex * frameWidth;
  
  // Calcular si está animando para usar frame alternativo
  const isAnimating = animationState !== null;
  const frameOffset = isAnimating ? 0 : 0; // Ajustar según tu sprite
  
  ctx.drawImage(
    sprite,
    sx, 0, frameWidth, sprite.height, // Source rectangle
    playerX - CELL * 0.2, playerY - CELL * 0.2, // Destination position
    CELL * 0.4, CELL * 0.4 // Destination size
  );
} else {
  // Fallback: dibujar triángulo mientras carga
  // ... código original del triángulo ...
}
```

### Opción 2: Animación con Canvas (Sin Imágenes)

Para animar el personaje sin imágenes, puedes modificar el dibujo del triángulo:

```typescript
// Añadir variable global para frame de animación
let animationFrame = 0;

// En drawMaze, antes de dibujar el jugador:
if (animationState) {
  animationFrame = (animationFrame + 1) % 4; // 4 frames de animación
}

// Modificar el tamaño del triángulo según el frame
const size = CELL * 0.28;
const bounce = animationState ? Math.sin(animationFrame * 0.5) * 2 : 0;
const animatedSize = size + bounce;

// Usar animatedSize en lugar de size al dibujar
```

### Opción 3: SVG Animado

1. Crea un SVG animado con `<animate>` o CSS animations
2. Guarda en: `app/public/game-sprites/player-animated.svg`
3. Usa `drawImage` con el SVG (similar a sprite sheet)

**Ejemplo SVG:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="#4C97FF">
    <animate attributeName="cy" values="24;22;24" dur="0.5s" repeatCount="indefinite"/>
  </circle>
</svg>
```

---

## 🎯 Imagen de Meta Personalizada

### Ubicación

La meta se dibuja en la función `drawMaze`. Busca la sección "Meta con glow":

- **Laberinto**: `app/src/apps/maze/mazeApp.ts` (línea ~230-250)
- **Práctica**: `app/src/apps/practice/practiceApp.ts` (línea ~195-220)

### Paso 1: Preparar la Imagen

1. Crea una imagen para la meta (PNG con transparencia recomendado)
2. Tamaño recomendado: 48x48px o múltiplo
3. Guarda en: `app/public/game-icons/goal.png` (o el nombre que prefieras)

### Paso 2: Modificar el Código

**Busca esta sección:**
```typescript
// Meta con glow (verde brillante)
const goalX = PADDING + level.goal.x * CELL + CELL / 2;
const goalY = PADDING + level.goal.y * CELL + CELL / 2;
const goalRadius = CELL * 0.25;

// Glow exterior
const glowGradient = ctx.createRadialGradient(goalX, goalY, 0, goalX, goalY, goalRadius * 2);
// ... resto del código ...
```

**Reemplaza con:**
```typescript
// Meta con imagen personalizada
const goalX = PADDING + level.goal.x * CELL + CELL / 2;
const goalY = PADDING + level.goal.y * CELL + CELL / 2;
const goalSize = CELL * 0.5;

// Cargar imagen (hacerlo una vez, fuera de drawMaze)
let goalImage: HTMLImageElement | null = null;
const loadGoalImage = () => {
  if (!goalImage) {
    goalImage = new Image();
    goalImage.src = "/game-icons/goal.png";
  }
  return goalImage;
};

// Dibujar glow (opcional, mantener si quieres)
const glowGradient = ctx.createRadialGradient(goalX, goalY, 0, goalX, goalY, goalSize);
glowGradient.addColorStop(0, "rgba(16, 185, 129, 0.3)");
glowGradient.addColorStop(1, "rgba(16, 185, 129, 0)");
ctx.fillStyle = glowGradient;
ctx.beginPath();
ctx.arc(goalX, goalY, goalSize, 0, Math.PI * 2);
ctx.fill();

// Dibujar imagen de meta
const img = loadGoalImage();
if (img.complete) {
  ctx.drawImage(
    img,
    goalX - goalSize / 2,
    goalY - goalSize / 2,
    goalSize,
    goalSize
  );
} else {
  // Fallback: dibujar círculo mientras carga
  ctx.fillStyle = "#10B981";
  ctx.beginPath();
  ctx.arc(goalX, goalY, goalSize / 2, 0, Math.PI * 2);
  ctx.fill();
}
```

### Opción: Meta Animada

Para una meta que pulse o rote:

```typescript
// Añadir variable global para animación
let goalAnimationFrame = 0;

// En drawMaze, antes de dibujar la meta:
goalAnimationFrame += 0.1;
const pulseScale = 1 + Math.sin(goalAnimationFrame) * 0.1;

// Al dibujar la imagen:
const animatedSize = goalSize * pulseScale;
ctx.drawImage(
  img,
  goalX - animatedSize / 2,
  goalY - animatedSize / 2,
  animatedSize,
  animatedSize
);
```

---

## 💬 Mensajes de Feedback

### Ubicación de Mensajes

Los mensajes de feedback se definen en varios lugares:

1. **Mensajes de estado del juego**: `app/src/apps/maze/mazeApp.ts` (función `updateStatusText`)
2. **Mensajes de éxito/error**: `app/src/main.ts` (función `triggerWinEffect`, `triggerErrorEffect`)
3. **Mensajes de nivel**: `app/src/apps/maze/mazeApp.ts` (función `updateStatusText`)

### Personalizar Mensajes de Estado

**En `mazeApp.ts` o `practiceApp.ts`, busca:**
```typescript
const updateStatusText = (state: MazeState): string => {
  switch (state.status) {
    case "running":
      return "Jugando...";
    case "win":
      return state.message ?? "¡Llegaste!";
    case "error":
      return state.message ?? "Error";
    default:
      return "Listo.";
  }
};
```

**Personaliza los mensajes:**
```typescript
const updateStatusText = (state: MazeState): string => {
  switch (state.status) {
    case "running":
      return "🚀 ¡Ejecutando tu programa!";
    case "win":
      return state.message ?? "🎉 ¡Excelente! ¡Llegaste a la meta!";
    case "error":
      return state.message ?? "❌ ¡Ups! Algo salió mal";
    default:
      return "✨ ¡Listo para jugar!";
  }
};
```

### Personalizar Mensajes de Éxito/Error

**En `main.ts`, busca:**
```typescript
function triggerWinEffect(stageEl: HTMLElement): void {
  // ...
  showSuccessMessage(stageEl);
}

function showSuccessMessage(stageEl: HTMLElement): void {
  const message = document.createElement("div");
  message.className = "success-message";
  message.textContent = "¡Llegaste! 🎉";
  // ...
}
```

**Personaliza:**
```typescript
function showSuccessMessage(stageEl: HTMLElement): void {
  const message = document.createElement("div");
  message.className = "success-message";
  message.textContent = "¡Increíble! 🏆"; // Tu mensaje personalizado
  // ...
}
```

### Mensajes por Nivel

Para mensajes específicos por nivel, modifica el adapter en `mazeApp.ts`:

```typescript
// En el adapter, cuando se gana:
if (state.player.x === level.goal.x && state.player.y === level.goal.y) {
  // Mensaje personalizado según el nivel
  const levelMessages: Record<number, string> = {
    1: "¡Primer nivel completado! 🌟",
    2: "¡Siguiente nivel desbloqueado! 🎯",
    3: "¡Estás mejorando! 💪",
    // ... más mensajes
  };
  
  state.message = levelMessages[state.levelId] ?? "¡Llegaste!";
  // ...
}
```

### Mensajes de Error Personalizados

**En el adapter, cuando hay choque:**
```typescript
if (!inBounds(level, nextX, nextY) || isBlocked(level, nextX, nextY)) {
  const errorMessages = [
    "¡Cuidado! Hay una pared ahí 🧱",
    "¡Ups! No puedes pasar por ahí 🚫",
    "¡Intenta otro camino! 🗺️"
  ];
  const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
  
  state.status = "error";
  state.message = randomMessage;
  // ...
}
```

---

## 🎨 Colores y Temas

### Cambiar Color del Personaje

**En `mazeApp.ts` o `practiceApp.ts`:**
```typescript
const GAME_COLOR = "#4C97FF"; // Cambia este color
```

**Ejemplos:**
- Rojo: `"#EF4444"`
- Verde: `"#10B981"`
- Naranja: `"#F59E0B"`
- Rosa: `"#EC4899"`

### Cambiar Color de la Meta

**En la función `drawMaze`, busca:**
```typescript
ctx.fillStyle = "#10B981"; // Verde
```

**Cambia a tu color preferido:**
```typescript
ctx.fillStyle = "#F59E0B"; // Naranja/dorado
```

### Cambiar Color de las Paredes

**En la función `drawMaze`, busca:**
```typescript
ctx.fillStyle = "#8B7355"; // Marrón/beige
```

**Personaliza:**
```typescript
ctx.fillStyle = "#6366F1"; // Índigo
```

### Tema Completo

Para cambiar todo el tema de un juego, modifica todas las constantes de color al inicio del archivo:

```typescript
// Tema personalizado
const GAME_COLOR = "#EC4899"; // Rosa
const WALL_COLOR = "#1F2937"; // Gris oscuro
const GOAL_COLOR = "#F59E0B"; // Dorado
const BG_GRADIENT_START = "#FDF2F8"; // Rosa claro
const BG_GRADIENT_END = "#FFFFFF"; // Blanco
```

---

## 📝 Resumen de Archivos a Modificar

| Personalización | Archivo | Función/Sección |
|----------------|---------|-----------------|
| Personaje | `mazeApp.ts` / `practiceApp.ts` | `drawMaze()` - Sección jugador |
| Meta | `mazeApp.ts` / `practiceApp.ts` | `drawMaze()` - Sección meta |
| Mensajes estado | `mazeApp.ts` / `practiceApp.ts` | `updateStatusText()` |
| Mensajes éxito | `main.ts` | `showSuccessMessage()` |
| Colores | `mazeApp.ts` / `practiceApp.ts` | Constantes `GAME_COLOR`, etc. |

---

## 🚀 Próximos Pasos

1. Prepara tus imágenes (sprite sheet, meta, etc.)
2. Colócalas en `app/public/game-sprites/` o `app/public/game-icons/`
3. Modifica el código según esta guía
4. Ejecuta `npm run build` para compilar
5. Prueba los cambios con `npm run dev`

---

## 💡 Consejos

- **Sprites**: Usa herramientas como [Aseprite](https://www.aseprite.org/) o [Piskel](https://www.piskelapp.com/) para crear sprites
- **Optimización**: Comprime imágenes PNG antes de usarlas (usa [TinyPNG](https://tinypng.com/))
- **Animaciones**: Para animaciones más complejas, considera usar librerías como [Phaser](https://phaser.io/) o [PixiJS](https://pixijs.com/)
- **Testing**: Prueba en diferentes tamaños de pantalla para asegurar que todo se ve bien

---

¿Necesitas ayuda con algo específico? ¡Déjame saber!
