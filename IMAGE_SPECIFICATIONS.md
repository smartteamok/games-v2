# Especificaciones de Imágenes - Game Blocks UX

## 📁 Estructura de Carpetas

```
public/
├── icons/              ← NUEVA CARPETA (crear)
│   ├── play.svg
│   ├── stop.svg
│   ├── save.svg
│   ├── load.svg
│   └── restart.svg     (opcional)
│
├── game-icons/         ← Ya existe
│   ├── move-right.svg
│   ├── move-left.svg
│   ├── turn-left.svg
│   └── turn-right.svg
│
└── sounds/             ← NUEVA CARPETA (opcional, crear)
    ├── click.mp3
    ├── success.mp3
    ├── error.mp3
    └── move.mp3        (opcional)
```

---

## 🎨 Iconos SVG para Toolbar

### Ubicación: `public/icons/`

Todos los iconos deben seguir estas especificaciones:
- **Formato:** SVG
- **ViewBox:** `0 0 20 20` o `0 0 24 24` (consistente)
- **Estilo:** Outline (stroke) o Filled, consistente entre todos
- **Color:** Usar `currentColor` para que se adapte al CSS
- **Optimización:** Sin metadatos innecesarios, paths simplificados

---

### 1. `public/icons/play.svg`
**Uso:** Botón Run/Play

**Especificaciones:**
- Triángulo apuntando a la derecha
- Color: Verde (#10B981) o usar `currentColor`
- Estilo: Filled (sólido) o outline con stroke-width 2
- Tamaño visual: ~16x16px dentro del viewBox 20x20

**Ejemplo de estructura:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <path d="M7 5l8 5-8 5V5z" fill="currentColor"/>
</svg>
```

**Variantes de color:**
- Normal: #10B981 (verde)
- Hover: #059669 (verde oscuro)
- Active: #047857 (verde más oscuro)
- Disabled: #9CA3AF (gris)

---

### 2. `public/icons/stop.svg`
**Uso:** Botón Stop

**Especificaciones:**
- Cuadrado sólido
- Color: Rojo (#EF4444) o usar `currentColor`
- Estilo: Filled (sólido)
- Tamaño visual: ~12x12px centrado en viewBox 20x20

**Ejemplo de estructura:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <rect x="6" y="6" width="8" height="8" fill="currentColor" rx="1"/>
</svg>
```

**Variantes de color:**
- Normal: #EF4444 (rojo)
- Hover: #DC2626 (rojo oscuro)
- Active: #B91C1C (rojo más oscuro)
- Disabled: #9CA3AF (gris)

---

### 3. `public/icons/save.svg`
**Uso:** Botón Save

**Especificaciones:**
- Disquete clásico o icono de guardar moderno
- Color: Azul (#4C97FF) o usar `currentColor`
- Estilo: Outline preferiblemente (stroke-width 2)
- Tamaño visual: ~16x16px

**Ejemplo de estructura (disquete):**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <path d="M6 2h8v4h4v10H2V6h4V2zm2 2v2h4V4H8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="4" y="8" width="12" height="8" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>
```

**Alternativa (flecha hacia abajo en caja):**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <path d="M4 6h12v8H4V6zm2 2v4h8V8H6z" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M8 12l2 2 2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
```

**Variantes de color:**
- Normal: #4C97FF (azul)
- Hover: #3B82F6 (azul oscuro)
- Active: #2563EB (azul más oscuro)
- Disabled: #9CA3AF (gris)

---

### 4. `public/icons/load.svg`
**Uso:** Botón Load

**Especificaciones:**
- Carpeta abierta o flecha hacia arriba
- Color: Azul (#4C97FF) o usar `currentColor`
- Estilo: Outline preferiblemente (stroke-width 2)
- Tamaño visual: ~16x16px

**Ejemplo de estructura (carpeta):**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <path d="M4 4h6l2 2h6v10H4V4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Alternativa (flecha hacia arriba):**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <path d="M10 4v12m-4-4l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Variantes de color:**
- Normal: #4C97FF (azul)
- Hover: #3B82F6 (azul oscuro)
- Active: #2563EB (azul más oscuro)
- Disabled: #9CA3AF (gris)

---

### 5. `public/icons/restart.svg` (Opcional)
**Uso:** Botón Reset/Restart (si se añade)

**Especificaciones:**
- Flecha circular (refresh)
- Color: Gris (#6B7280) o usar `currentColor`
- Estilo: Outline (stroke-width 2)
- Tamaño visual: ~16x16px

**Ejemplo de estructura:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <path d="M3 10a7 7 0 017-7v2a5 5 0 00-5 5H3zm14 0a7 7 0 01-7 7v-2a5 5 0 005-5h2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M6 6l2-2 2 2M14 14l-2 2-2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
```

---

## 🔊 Sonidos (Opcional)

### Ubicación: `public/sounds/`

**Formato:** MP3 (principal) + OGG (fallback para compatibilidad)
**Calidad:** 44.1kHz, 128kbps es suficiente
**Duración:** Cortos (50-300ms), excepto música de fondo

---

### 1. `public/sounds/click.mp3` + `.ogg`
**Uso:** Click en botones (opcional, toggle on/off)

**Especificaciones:**
- Duración: 50-100ms
- Tipo: Click suave, no agresivo
- Volumen: Medio-bajo (para no molestar)
- Frecuencia: ~800-1200Hz

**Fuentes sugeridas:**
- Freesound.org (búsqueda: "ui click", "button click")
- Zapsplat.com
- O generar con sintetizador (onda cuadrada corta)

---

### 2. `public/sounds/success.mp3` + `.ogg`
**Uso:** Cuando el jugador completa un nivel

**Especificaciones:**
- Duración: 200-500ms
- Tipo: Alegre, ascendente (arpegio mayor)
- Volumen: Medio
- Frecuencia: Escala ascendente (Do-Mi-Sol-Do)

**Fuentes sugeridas:**
- Freesound.org (búsqueda: "success", "achievement", "win")
- Zapsplat.com
- O generar con sintetizador (arpegio mayor)

---

### 3. `public/sounds/error.mp3` + `.ogg`
**Uso:** Cuando el jugador choca con una pared

**Especificaciones:**
- Duración: 100-200ms
- Tipo: Bajo, descendente (nota grave)
- Volumen: Medio-bajo
- Frecuencia: ~200-400Hz

**Fuentes sugeridas:**
- Freesound.org (búsqueda: "error", "buzz", "wrong")
- Zapsplat.com
- O generar con sintetizador (onda cuadrada baja)

---

### 4. `public/sounds/move.mp3` + `.ogg` (Opcional)
**Uso:** Sonido de movimiento del jugador (opcional, puede ser molesto si se repite mucho)

**Especificaciones:**
- Duración: 30-50ms
- Tipo: Click muy suave o "pop"
- Volumen: Bajo
- Frecuencia: ~400-600Hz

**Nota:** Este sonido puede ser molesto si se reproduce en cada movimiento. Considerar solo en el primer movimiento o desactivado por defecto.

---

## 🎨 Mejoras a Iconos Existentes

### `public/game-icons/*.svg`

Los iconos actuales pueden mejorarse para:
- Consistencia visual con los nuevos iconos de toolbar
- Mejor contraste y visibilidad
- Colores más vibrantes si es necesario

**Revisar:**
- `move-right.svg`
- `move-left.svg`
- `turn-left.svg`
- `turn-right.svg`

**Especificaciones sugeridas:**
- ViewBox consistente: `0 0 42 42` (ya tienen GAME_ICON_SIZE = 42)
- Colores: Usar `currentColor` o colores específicos del juego
- Estilo: Outline o filled, consistente

---

## 📐 Guía de Diseño Visual

### Paleta de Colores Sugerida

**Primarios:**
- Azul principal: `#4C97FF` (ya usado)
- Verde éxito: `#10B981`
- Rojo error: `#EF4444`
- Amarillo warning: `#F59E0B`

**Secundarios:**
- Gris claro: `#F3F4F6`
- Gris medio: `#9CA3AF`
- Gris oscuro: `#374151`
- Blanco: `#FFFFFF`

**Para el Maze:**
- Paredes: `#8B7355` (marrón/beige) con sombra
- Meta: `#10B981` (verde brillante) con glow
- Jugador: `#4C97FF` (azul) con outline blanco
- Fondo grid: `#FFFFFF` con líneas `#E5E7EB`

---

## ✅ Checklist de Preparación

### Iconos SVG
- [ ] Crear carpeta `public/icons/`
- [ ] Diseñar/obtener `play.svg`
- [ ] Diseñar/obtener `stop.svg`
- [ ] Diseñar/obtener `save.svg`
- [ ] Diseñar/obtener `load.svg`
- [ ] (Opcional) Diseñar/obtener `restart.svg`
- [ ] Verificar que todos usan `currentColor` o colores consistentes
- [ ] Optimizar SVGs (remover metadatos, simplificar paths)

### Sonidos (Opcional)
- [ ] Crear carpeta `public/sounds/`
- [ ] Obtener/generar `click.mp3` + `.ogg`
- [ ] Obtener/generar `success.mp3` + `.ogg`
- [ ] Obtener/generar `error.mp3` + `.ogg`
- [ ] (Opcional) Obtener/generar `move.mp3` + `.ogg`
- [ ] Verificar volumen y duración apropiados

### Iconos Existentes
- [ ] Revisar `public/game-icons/*.svg`
- [ ] Mejorar si es necesario para consistencia
- [ ] Verificar colores y visibilidad

---

## 📝 Notas Importantes

1. **Todos los iconos SVG deben usar `currentColor`** para que se adapten al CSS del tema
2. **Los sonidos deben ser opcionales** y tener un toggle on/off en la UI
3. **Optimizar archivos:** Comprimir SVGs y MP3s para mejor rendimiento
4. **Accesibilidad:** Asegurar buen contraste y tamaños mínimos (44x44px para touch)
5. **Licencias:** Verificar que los recursos (especialmente sonidos) tengan licencia apropiada (CC0, CC-BY, etc.)

---

## 🔗 Recursos Útiles

### Iconos SVG
- **Heroicons:** https://heroicons.com/ (MIT License)
- **Feather Icons:** https://feathericons.com/ (MIT License)
- **Material Icons:** https://fonts.google.com/icons (Apache 2.0)
- **Phosphor Icons:** https://phosphoricons.com/ (MIT License)

### Sonidos
- **Freesound.org:** https://freesound.org/ (varias licencias, filtrar por CC0)
- **Zapsplat:** https://www.zapsplat.com/ (requiere cuenta gratuita)
- **OpenGameArt:** https://opengameart.org/ (varias licencias)
- **Generadores online:** Buscar "online sound generator" o "tone generator"

### Herramientas
- **SVG Optimizer:** https://jakearchibald.github.io/svgomg/
- **Audio Editor:** Audacity (gratis) para editar sonidos
- **Color Picker:** https://coolors.co/ para paletas
