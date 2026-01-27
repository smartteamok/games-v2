# 📦 Especificaciones de Archivos de Animación

Este documento detalla todos los archivos de animación que necesitas crear o reemplazar.

---

## 🎭 Archivos del Personaje

### 1. `player-sprite.png`

**Ubicación:** `app/public/game-sprites/player-sprite.png`

**Tipo:** Sprite Sheet (imagen con múltiples frames)

**Formato:** PNG con canal alpha (transparencia)

**Dimensiones:**
- **Ancho:** 256px (recomendado) o múltiplo de 4
- **Alto:** 64px (recomendado) o 48px-96px
- **Frames:** 4 frames horizontales de 64px × 64px cada uno

**Estructura:**
```
┌─────────┬─────────┬─────────┬─────────┐
│ Frame N │ Frame E │ Frame S │ Frame W │
│ 64×64px │ 64×64px │ 64×64px │ 64×64px │
└─────────┴─────────┴─────────┴─────────┘
```

**Orden de frames (de izquierda a derecha):**
1. **Norte (N)** - Personaje mirando hacia arriba
2. **Este (E)** - Personaje mirando hacia la derecha  
3. **Sur (S)** - Personaje mirando hacia abajo
4. **Oeste (W)** - Personaje mirando hacia la izquierda

**Características técnicas:**
- ✅ Formato: PNG-24 con transparencia
- ✅ Color mode: RGB o Indexed Color
- ✅ Resolución: 72-96 DPI (no crítico para web)
- ✅ Tamaño de archivo: < 100KB (recomendado, optimizado)
- ✅ Estilo: Consistente (pixel art, vectorial, etc.)

**Ejemplo visual:**
```
[👤↑] [👤→] [👤↓] [👤←]
```

**Herramientas recomendadas:**
- [Aseprite](https://www.aseprite.org/) - Editor de pixel art
- [Piskel](https://www.piskelapp.com/) - Editor online gratuito
- [Photoshop](https://www.adobe.com/products/photoshop.html)
- [GIMP](https://www.gimp.org/) - Gratuito

**Guía de creación:**
1. Crea un canvas de 256px × 64px
2. Divide en 4 secciones de 64px × 64px
3. Dibuja el personaje en cada dirección
4. Exporta como PNG con transparencia
5. Optimiza con [TinyPNG](https://tinypng.com/)

---

### 2. `player-sprite-walking.png` (Opcional)

**Ubicación:** `app/public/game-sprites/player-sprite-walking.png`

**Tipo:** Sprite Sheet extendido con animación de caminar

**Formato:** PNG con canal alpha

**Dimensiones:**
- **Ancho:** 512px (8 frames) o 768px (12 frames)
- **Alto:** 64px
- **Frames:** 2-3 frames por dirección × 4 direcciones

**Estructura (2 frames por dirección):**
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ N1  │ N2  │ E1  │ E2  │ S1  │ S2  │ W1  │ W2  │
│64px │64px │64px │64px │64px │64px │64px │64px │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Estructura (3 frames por dirección):**
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ N1  │ N2  │ N3  │ E1  │ E2  │ E3  │ S1  │ S2  │ S3  │ W1  │ W2  │ W3  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Características:**
- Mismo estilo que `player-sprite.png`
- 2-3 frames de animación por dirección
- Animación de caminar (piernas alternando, balanceo, etc.)

**Nota:** Este archivo es opcional. Si no lo proporcionas, se usará `player-sprite.png` sin animación de caminar.

---

## 🎯 Archivos de Meta

### 3. `goal.png`

**Ubicación:** `app/public/game-icons/goal.png`

**Tipo:** Imagen estática de la meta/objetivo

**Formato:** PNG con canal alpha

**Dimensiones:**
- **Tamaño:** 64px × 64px (recomendado)
- **Alternativas:** 48px × 48px, 96px × 96px
- **Forma:** Cuadrada (recomendado) o circular

**Características técnicas:**
- ✅ Formato: PNG-24 con transparencia
- ✅ Tamaño de archivo: < 50KB (optimizado)
- ✅ Estilo: Vibrante, destacado, reconocible

**Ideas de diseño:**
- ⭐ Estrella dorada
- 🚩 Bandera de meta
- 💎 Cofre del tesoro
- 🏆 Trofeo
- ✨ Portal mágico
- 🎯 Diana/objetivo

**Recomendaciones:**
- Usa colores que contrasten con el fondo (verde, dorado, azul brillante)
- Añade un efecto de brillo o glow si es posible
- Mantén un estilo consistente con el personaje
- Debe ser claramente visible en una celda de 48px

---

## 📊 Tabla Resumen

| Archivo | Ubicación | Formato | Dimensiones | Frames | Requerido |
|---------|-----------|---------|-------------|--------|-----------|
| `player-sprite.png` | `app/public/game-sprites/` | PNG | 256×64px | 4 | ✅ Sí |
| `player-sprite-walking.png` | `app/public/game-sprites/` | PNG | 512×64px | 8 | ⚠️ Opcional |
| `goal.png` | `app/public/game-icons/` | PNG | 64×64px | 1 | ✅ Sí |

---

## 🎨 Guía de Estilo

### Paleta de Colores Recomendada

**Para el personaje:**
- Color principal: Azul (#4C97FF) o tu color preferido
- Color secundario: Blanco para outline
- Color de sombra: Gris oscuro (#1F2937)

**Para la meta:**
- Verde brillante: #10B981
- Dorado: #F59E0B
- Azul brillante: #3B82F6

### Estilo Visual

**Opciones:**
1. **Pixel Art** - Estilo retro, 8-bit/16-bit
2. **Vectorial** - Líneas limpias, colores planos
3. **Realista** - Sombras, gradientes, detalles
4. **Minimalista** - Formas simples, colores sólidos

**Recomendación:** Elige un estilo y manténlo consistente en todos los archivos.

---

## ✅ Checklist de Creación

### Para `player-sprite.png`:
- [ ] Canvas de 256px × 64px creado
- [ ] 4 frames dibujados (N, E, S, W)
- [ ] Personaje centrado en cada frame
- [ ] Transparencia aplicada
- [ ] Archivo exportado como PNG-24
- [ ] Archivo optimizado (< 100KB)
- [ ] Colocado en `app/public/game-sprites/`

### Para `goal.png`:
- [ ] Canvas de 64px × 64px creado
- [ ] Diseño de meta dibujado
- [ ] Colores vibrantes y contrastados
- [ ] Transparencia aplicada
- [ ] Archivo exportado como PNG-24
- [ ] Archivo optimizado (< 50KB)
- [ ] Colocado en `app/public/game-icons/`

---

## 🔧 Optimización

### Antes de usar los archivos:

1. **Comprime las imágenes:**
   - Usa [TinyPNG](https://tinypng.com/) o [ImageOptim](https://imageoptim.com/)
   - Reduce el tamaño sin perder calidad visual

2. **Verifica el formato:**
   - Asegúrate de que sean PNG con transparencia
   - No uses JPG (no soporta transparencia)

3. **Prueba el tamaño:**
   - Los archivos deben cargar rápido
   - Objetivo: < 100KB para sprites, < 50KB para iconos

---

## 📝 Notas Importantes

1. **Nombres de archivo:** Deben coincidir exactamente con los nombres especificados
2. **Ubicación:** Los archivos deben estar en las carpetas indicadas
3. **Formato:** Solo PNG con transparencia
4. **Dimensiones:** Respeta las dimensiones especificadas para mejor resultado
5. **Estilo:** Mantén consistencia visual entre todos los archivos

---

## 🚀 Próximos Pasos

1. ✅ Crea o descarga los archivos según estas especificaciones
2. ✅ Colócalos en las ubicaciones indicadas
3. ✅ Reemplaza los archivos placeholder si existen
4. ✅ Consulta `PERSONALIZATION_GUIDE.md` para implementación en código
5. ✅ Ejecuta `npm run build` y prueba con `npm run dev`

---

¿Necesitas más ayuda? Revisa `PERSONALIZATION_GUIDE.md` para ver cómo implementar estos archivos en el código.
