# 🎨 Archivos de Animación - Especificaciones

Este directorio contiene los archivos de animación para el personaje del juego.

---

## 📁 Archivos Requeridos

### 1. `player-sprite.png` - Sprite Sheet del Personaje

**Ubicación:** `/app/public/game-sprites/player-sprite.png`

**Descripción:** Sprite sheet con frames del personaje caminando en las 4 direcciones.

**Características:**
- **Formato:** PNG con transparencia (alpha channel)
- **Dimensiones:** 
  - Ancho total: Múltiplo de 4 (ej: 192px, 256px, 320px)
  - Alto: 48px - 96px (recomendado: 64px)
  - Cada frame: Ancho total / 4
- **Estructura:** 4 frames horizontales, uno por dirección
  ```
  [Frame N] [Frame E] [Frame S] [Frame W]
  ```
- **Orden de frames (de izquierda a derecha):**
  1. Norte (N) - Personaje mirando hacia arriba
  2. Este (E) - Personaje mirando hacia la derecha
  3. Sur (S) - Personaje mirando hacia abajo
  4. Oeste (W) - Personaje mirando hacia la izquierda

**Ejemplo de dimensiones:**
- 256px × 64px = 4 frames de 64px × 64px cada uno
- 192px × 48px = 4 frames de 48px × 48px cada uno

**Recomendaciones:**
- Usa colores vibrantes y contrastados
- Asegúrate de que el personaje esté centrado en cada frame
- Mantén un estilo consistente (pixel art, vectorial, etc.)
- Optimiza el archivo (comprime con TinyPNG u otra herramienta)

**Herramientas recomendadas:**
- [Aseprite](https://www.aseprite.org/) - Para pixel art
- [Piskel](https://www.piskelapp.com/) - Editor online gratuito
- [Photoshop](https://www.adobe.com/products/photoshop.html) - Editor profesional
- [GIMP](https://www.gimp.org/) - Editor gratuito

---

### 2. `player-sprite-walking.png` (Opcional) - Sprite con Animación de Caminar

**Ubicación:** `/app/public/game-sprites/player-sprite-walking.png`

**Descripción:** Sprite sheet extendido con múltiples frames de animación de caminar por cada dirección.

**Características:**
- **Formato:** PNG con transparencia
- **Dimensiones:**
  - Ancho total: Múltiplo de 8 o 12 (ej: 384px, 512px)
  - Alto: 64px - 96px
  - Cada frame: Ancho total / (4 direcciones × frames por dirección)
- **Estructura:** 4 direcciones × N frames de animación
  ```
  [N1] [N2] [E1] [E2] [S1] [S2] [W1] [W2]
  ```
  O con 3 frames por dirección:
  ```
  [N1] [N2] [N3] [E1] [E2] [E3] [S1] [S2] [S3] [W1] [W2] [W3]
  ```

**Recomendaciones:**
- 2-3 frames por dirección es suficiente para una animación fluida
- Usa el mismo estilo que `player-sprite.png`
- Mantén el mismo tamaño de frame que el sprite básico

---

## 🎯 Archivos de Meta

### 3. `goal.png` - Imagen de Meta

**Ubicación:** `/app/public/game-icons/goal.png`

**Descripción:** Imagen de la meta/objetivo del juego.

**Características:**
- **Formato:** PNG con transparencia
- **Dimensiones:** 
  - Cuadrada: 48px × 48px, 64px × 64px, o 96px × 96px
  - Recomendado: 64px × 64px
- **Estilo:** 
  - Puede ser una estrella, bandera, cofre, portal, etc.
  - Colores vibrantes (verde, dorado, etc.)
  - Debe destacar visualmente

**Recomendaciones:**
- Usa colores que contrasten con el fondo
- Añade un efecto de brillo o glow si es posible
- Mantén un estilo consistente con el personaje

---

## 📋 Resumen de Archivos

| Archivo | Ubicación | Formato | Dimensiones | Descripción |
|---------|-----------|---------|-------------|-------------|
| `player-sprite.png` | `/app/public/game-sprites/` | PNG | 256×64px (4 frames) | Sprite básico del personaje |
| `player-sprite-walking.png` | `/app/public/game-sprites/` | PNG | 384×64px (8 frames) | Sprite con animación (opcional) |
| `goal.png` | `/app/public/game-icons/` | PNG | 64×64px | Imagen de meta |

---

## 🚀 Cómo Usar

1. **Crea o descarga** los archivos según las especificaciones
2. **Colócalos** en las ubicaciones indicadas
3. **Reemplaza** los archivos placeholder si existen
4. **Ejecuta** `npm run build` para compilar
5. **Prueba** con `npm run dev`

---

## 💡 Consejos de Diseño

### Para el Personaje:
- **Estilo consistente:** Elige un estilo (pixel art, vectorial, realista) y manténlo
- **Colores:** Usa una paleta limitada (3-5 colores principales)
- **Tamaño:** El personaje debe ser claramente visible en una celda de 48px
- **Direcciones:** Asegúrate de que cada dirección sea claramente distinguible

### Para la Meta:
- **Contraste:** Debe destacar del fondo y las paredes
- **Forma reconocible:** Usa formas simples y reconocibles (estrella, bandera, etc.)
- **Color:** Verde o dorado funcionan bien para "objetivo completado"

---

## 🔧 Troubleshooting

**Problema:** El sprite no se muestra
- **Solución:** Verifica que el archivo esté en la ubicación correcta y que el formato sea PNG

**Problema:** El sprite se ve pixelado
- **Solución:** Aumenta la resolución del sprite (ej: 128px × 128px por frame)

**Problema:** El sprite no está centrado
- **Solución:** Asegúrate de que el personaje esté centrado en cada frame del sprite sheet

---

¿Necesitas ayuda? Consulta `PERSONALIZATION_GUIDE.md` para más detalles sobre cómo implementar estos sprites en el código.
