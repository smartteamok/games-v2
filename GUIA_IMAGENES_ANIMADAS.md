# 🎨 Guía: Cómo Cargar Imágenes Animadas

## 📋 Resumen Rápido

Para imágenes animadas en el juego, usa **Sprite Sheets en formato PNG** con transparencia.

---

## 🎭 Sprite Sheet del Personaje

### Formato y Ubicación

**Archivo:** `app/public/game-sprites/player-sprite.png`

**Formato:** PNG con transparencia (canal alpha)

**Estructura:** Sprite sheet horizontal con 4 frames (uno por dirección)

### Dimensiones Recomendadas

```
Ancho total: 256px (o múltiplo de 4)
Alto: 64px (o 48px-96px)
Cada frame: 64px × 64px
```

### Estructura del Sprite Sheet

```
┌─────────┬─────────┬─────────┬─────────┐
│ Frame N │ Frame E │ Frame S │ Frame W │
│ 64×64px │ 64×64px │ 64×64px │ 64×64px │
└─────────┴─────────┴─────────┴─────────┘
```

**Orden de frames (de izquierda a derecha):**
1. **Norte (N)** - Personaje mirando hacia arriba ↑
2. **Este (E)** - Personaje mirando hacia la derecha →
3. **Sur (S)** - Personaje mirando hacia abajo ↓
4. **Oeste (W)** - Personaje mirando hacia la izquierda ←

### Ejemplo Visual

```
[👤↑] [👤→] [👤↓] [👤←]
```

---

## 🎬 Sprite Sheet con Animación de Caminar (Opcional)

Si quieres animación de caminar más fluida:

**Archivo:** `app/public/game-sprites/player-sprite-walking.png`

**Estructura:** 2-3 frames por dirección

**Ejemplo con 2 frames por dirección (8 frames total):**
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ N1  │ N2  │ E1  │ E2  │ S1  │ S2  │ W1  │ W2  │
│64px │64px │64px │64px │64px │64px │64px │64px │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Dimensiones:** 512px × 64px (8 frames de 64px cada uno)

---

## 🎯 Imagen de Meta

**Archivo:** `app/public/game-icons/goal.png`

**Formato:** PNG con transparencia

**Dimensiones:** 64px × 64px (recomendado)

**Características:**
- Imagen estática (no necesita animación)
- Colores vibrantes (verde, dorado, etc.)
- Debe destacar visualmente

---

## 📝 Pasos para Cargar las Imágenes

### 1. Crear o Obtener las Imágenes

**Herramientas recomendadas:**
- [Aseprite](https://www.aseprite.org/) - Para pixel art
- [Piskel](https://www.piskelapp.com/) - Editor online gratuito
- [Photoshop](https://www.adobe.com/products/photoshop.html)
- [GIMP](https://www.gimp.org/) - Gratuito

### 2. Preparar el Sprite Sheet

1. Crea un canvas del tamaño especificado (ej: 256px × 64px)
2. Divide en secciones iguales (4 frames de 64px cada uno)
3. Dibuja el personaje en cada dirección
4. Asegúrate de que el personaje esté centrado en cada frame
5. Exporta como PNG con transparencia

### 3. Optimizar las Imágenes

**Antes de usar:**
- Comprime con [TinyPNG](https://tinypng.com/) o [ImageOptim](https://imageoptim.com/)
- Objetivo: < 100KB para sprites, < 50KB para iconos
- Mantén la calidad visual

### 4. Colocar los Archivos

```
app/public/
├── game-sprites/
│   └── player-sprite.png          ← Sprite sheet básico
│   └── player-sprite-walking.png  ← Sprite con animación (opcional)
└── game-icons/
    └── goal.png                    ← Imagen de meta
```

### 5. El Código las Cargará Automáticamente

El código ya está preparado para cargar las imágenes desde estas ubicaciones. Solo necesitas:

1. Colocar los archivos en las carpetas indicadas
2. Asegurarte de que los nombres coincidan exactamente
3. El juego las cargará automáticamente cuando se ejecute

---

## ✅ Checklist

### Para `player-sprite.png`:
- [ ] Canvas de 256px × 64px (o múltiplo de 4)
- [ ] 4 frames dibujados (N, E, S, W)
- [ ] Personaje centrado en cada frame
- [ ] Transparencia aplicada (PNG con alpha)
- [ ] Archivo optimizado (< 100KB)
- [ ] Colocado en `app/public/game-sprites/player-sprite.png`

### Para `goal.png`:
- [ ] Canvas de 64px × 64px
- [ ] Diseño de meta dibujado
- [ ] Colores vibrantes y contrastados
- [ ] Transparencia aplicada
- [ ] Archivo optimizado (< 50KB)
- [ ] Colocado en `app/public/game-icons/goal.png`

---

## 🎨 Consejos de Diseño

### Estilo Consistente
- Elige un estilo (pixel art, vectorial, minimalista) y manténlo
- Usa una paleta de colores limitada (3-5 colores principales)

### Para el Personaje
- Debe ser claramente visible en una celda de 48px
- Cada dirección debe ser distinguible
- Mantén el mismo tamaño en todos los frames

### Para la Meta
- Usa colores que contrasten con el fondo
- Formas simples y reconocibles funcionan mejor
- Verde o dorado son buenas opciones

---

## 🔧 Troubleshooting

**Problema:** La imagen no se muestra
- ✅ Verifica que el archivo esté en la ubicación correcta
- ✅ Verifica que el nombre del archivo sea exacto
- ✅ Asegúrate de que sea PNG con transparencia

**Problema:** La imagen se ve pixelada
- ✅ Aumenta la resolución del sprite (ej: 128px × 128px por frame)

**Problema:** El personaje no está centrado
- ✅ Asegúrate de que el personaje esté centrado en cada frame del sprite sheet

**Problema:** La animación no funciona
- ✅ Verifica que el sprite sheet tenga la estructura correcta (4 frames horizontales)
- ✅ Verifica que el orden de frames sea: N, E, S, W

---

## 📚 Referencias

- `ANIMATION_FILES_SPEC.md` - Especificaciones detalladas
- `PERSONALIZATION_GUIDE.md` - Cómo implementar en el código
- `app/public/game-sprites/README.md` - Información adicional

---

## 💡 Notas Importantes

1. **Formato:** Solo PNG con transparencia (no uses JPG)
2. **Nombres:** Los nombres de archivo deben coincidir exactamente
3. **Ubicación:** Los archivos deben estar en las carpetas `public/`
4. **Dimensiones:** Respeta las dimensiones recomendadas para mejor resultado
5. **Optimización:** Comprime las imágenes antes de usarlas
