# 🎨 Plan de Rediseño de Interfaz - Game Blocks

## 📋 Objetivo
Transformar la interfaz actual para que coincida con el diseño de la imagen de referencia, creando una experiencia más pulida y profesional similar a juegos educativos modernos.

---

## 🏗️ FASE 1: Estructura HTML y Layout Principal

### 1.1 Header/Navigation Bar (Barra Superior)
**Estado actual:** Toolbar simple con selector de juego y botón Run

**Nuevo diseño:**
```
[Logo + "Juegos"] [Botón "Volver"] [Título del Juego] [Indicadores de Nivel 1-2-3] [Botón "Información"]
```

**Tareas:**
- [ ] Crear estructura HTML del header en `main.ts`
- [ ] Agregar logo (placeholder por ahora, se reemplazará después)
- [ ] Botón "Volver" (por ahora placeholder, funcionalidad después)
- [ ] Mostrar título del juego actual dinámicamente
- [ ] Indicadores circulares de niveles (1, 2, 3) con navegación
- [ ] Botón "Información" con icono
- [ ] Estilos CSS para el header (fondo, espaciado, tipografía)

**Archivos a modificar:**
- `app/src/main.ts` - Estructura HTML
- `app/src/style.css` - Estilos del header

**Especificaciones:**
- Header fijo en la parte superior
- Altura: ~60-70px
- Fondo: blanco o color claro
- Logo a la izquierda
- Botones con bordes y hover states

---

### 1.2 Panel Lateral de Información
**Estado actual:** No existe

**Nuevo diseño:**
Panel lateral que se desliza desde la derecha cuando se hace clic en "Información"

**Contenido del panel:**
- Imagen del juego (grande, destacada)
- Título del juego
- Descripción (texto largo)
- Edad recomendada (badge/etiqueta)
- Competencias (lista de bullet points)
- Conceptos abordados (lista de bullet points)

**Tareas:**
- [ ] Crear componente de panel lateral (slide-in desde la derecha)
- [ ] Agregar overlay oscuro cuando el panel está abierto
- [ ] Botón de cerrar (X) en el panel
- [ ] Estructura HTML del contenido del panel
- [ ] Estilos CSS para animación de slide-in/out
- [ ] Lógica para abrir/cerrar el panel desde `main.ts`
- [ ] Integrar datos del juego (necesitará extender `AppDefinition`)

**Archivos a crear:**
- `app/src/components/InfoPanel.ts` (opcional, o en `main.ts`)

**Archivos a modificar:**
- `app/src/main.ts` - Lógica de apertura/cierre
- `app/src/style.css` - Estilos del panel
- `app/src/apps/types.ts` - Extender `AppDefinition` con metadata del juego

**Especificaciones:**
- Ancho del panel: ~400px
- Animación: slide desde la derecha, 300ms ease-out
- Overlay: rgba(0, 0, 0, 0.5)
- Z-index alto para estar sobre todo

---

### 1.3 Área de Juego (Stage) Rediseñada
**Estado actual:** Canvas simple con fondo blanco/gris

**Nuevo diseño:**
- Fondo con patrón/purple gradient (como en la imagen)
- Canvas del juego centrado
- Botón de play grande y circular superpuesto (inicialmente a la izquierda)

**Tareas:**
- [ ] Modificar estructura HTML del stage
- [ ] Agregar fondo con patrón/gradiente púrpura
- [ ] Posicionar canvas del juego centrado
- [ ] Crear botón de play grande y circular
- [ ] Estilos CSS para el nuevo layout del stage

**Archivos a modificar:**
- `app/src/apps/maze/mazeApp.ts` - Función `ensureUI`
- `app/src/style.css` - Estilos del stage

**Especificaciones:**
- Fondo: gradiente púrpura claro con patrón sutil
- Botón play: círculo grande (~80-100px), sombra, posicionado a la izquierda
- Canvas: centrado, con espacio alrededor

---

## 🎮 FASE 2: Botón de Play/Restart Dinámico

### 2.1 Lógica del Botón Play/Restart
**Estado actual:** Botón Run en toolbar que siempre dice "Run"

**Nuevo comportamiento:**
1. **Estado inicial:** Botón Play (triángulo blanco en círculo púrpura)
2. **Después de ejecutar:** Si el juego no terminó (no ganó, no perdió), cambia a Restart
3. **Al hacer clic en Restart:** Vuelve a posición inicial, luego vuelve a Play
4. **Si el juego terminó (win/error):** Mantiene estado final, no cambia a Restart

**Tareas:**
- [ ] Crear componente de botón play/restart grande
- [ ] Estados del botón: `play`, `restart`, `disabled`
- [ ] Lógica para cambiar estado según resultado de ejecución
- [ ] Función para resetear a posición inicial
- [ ] Integrar con el runtime controller
- [ ] Animaciones de transición entre estados

**Archivos a modificar:**
- `app/src/main.ts` - Lógica de cambio de estado del botón
- `app/src/apps/maze/mazeApp.ts` - Función de reset
- `app/src/style.css` - Estilos y animaciones del botón

**Especificaciones:**
- Botón circular grande (~80-100px de diámetro)
- Sombra sutil
- Icono de play (triángulo) o restart (flecha circular)
- Animación suave al cambiar de estado
- Posicionado sobre el área de juego (z-index alto)

---

## 📊 FASE 3: Indicador de Límite de Bloques

### 3.1 Bloque "SIN LÍMITE" / Límite de Bloques
**Estado actual:** No existe

**Nuevo diseño:**
Bloque amarillo circular grande en la esquina inferior izquierda del área de programación

**Comportamiento:**
- Si el nivel NO tiene límite: muestra "SIN LÍMITE"
- Si el nivel SÍ tiene límite: muestra "X bloques" (donde X es el límite)
- Debe actualizarse cuando cambia el nivel

**Tareas:**
- [ ] Crear componente de bloque de límite
- [ ] Agregar propiedad `blockLimit?: number` a `LevelInfo`
- [ ] Lógica para mostrar "SIN LÍMITE" o el número
- [ ] Estilos CSS para el bloque amarillo
- [ ] Posicionamiento fijo en esquina inferior izquierda del editor
- [ ] Actualizar cuando cambia el nivel

**Archivos a modificar:**
- `app/src/apps/types.ts` - Extender `LevelInfo` con `blockLimit?`
- `app/src/apps/maze/levels.ts` - Agregar límites a niveles (opcional)
- `app/src/main.ts` - Crear y actualizar el componente
- `app/src/style.css` - Estilos del bloque

**Especificaciones:**
- Bloque circular amarillo grande
- Texto blanco, bold
- Posición: fixed, bottom-left del área de editor
- Tamaño: ~120-150px de diámetro

---

## 🎨 FASE 4: Obstáculos Animados

### 4.1 Sistema de Obstáculos con Imágenes
**Estado actual:** Obstáculos dibujados con formas simples (rectángulos marrones)

**Nuevo diseño:**
Obstáculos como imágenes (árboles, arbustos, bellotas) que pueden tener animaciones

**Tareas:**
- [ ] Crear sistema de tipos de obstáculos (tree, bush, acorn, etc.)
- [ ] Cargar imágenes de obstáculos desde assets
- [ ] Renderizar imágenes en lugar de formas simples
- [ ] Sistema de animaciones para obstáculos (opcional, para algunos tipos)
- [ ] Actualizar `MazeLevel` para incluir tipos de obstáculos

**Archivos a crear:**
- `app/public/game-assets/obstacles/` - Carpeta con imágenes
  - `tree.svg` o `tree.png`
  - `bush.svg` o `bush.png`
  - `acorn.svg` o `acorn.png`

**Archivos a modificar:**
- `app/src/apps/maze/mazeApp.ts` - Función de renderizado
- `app/src/apps/maze/levels.ts` - Agregar tipos a obstáculos

**Especificaciones:**
- Imágenes: SVG preferiblemente (escalables)
- Tamaño: ~48x48px (mismo que CELL)
- Animaciones: opcionales, usando CSS animations o canvas animations
- Tipos: tree (verde con tronco marrón), bush (verde), acorn (marrón)

---

## 🎭 FASE 5: Personaje Animado con Vistas

### 5.1 Sistema de Vistas del Personaje
**Estado actual:** Personaje dibujado como triángulo simple

**Nuevo diseño:**
Personaje con diferentes vistas según dirección:
- **Vista cenital** (top-down): cuando se mueve verticalmente (N/S)
- **Vista lateral** (side-view): cuando se mueve horizontalmente (E/W)
- **Animación de colisión**: cuando choca contra un obstáculo

**Tareas:**
- [ ] Crear sprites/imágenes del personaje:
  - Vista cenital (arriba/abajo)
  - Vista lateral (izquierda/derecha)
- [ ] Sistema de detección de dirección para cambiar vista
- [ ] Animación de movimiento (walking animation)
- [ ] Animación de colisión (shake/bounce cuando choca)
- [ ] Integrar con el sistema de animación existente

**Archivos a crear:**
- `app/public/game-assets/character/` - Carpeta con sprites
  - `character-top.svg` (vista cenital)
  - `character-side.svg` (vista lateral)
  - O spritesheet con frames de animación

**Archivos a modificar:**
- `app/src/apps/maze/mazeApp.ts` - Función de renderizado del personaje
- `app/src/apps/maze/animation.ts` - Agregar animaciones de colisión

**Especificaciones:**
- Sprites: SVG o PNG con transparencia
- Tamaño: ~48x48px
- Animación de caminar: 2-4 frames por dirección
- Animación de colisión: shake horizontal rápido (200-300ms)

---

## 🎯 FASE 6: Navegación de Niveles

### 6.1 Indicadores de Nivel Interactivos
**Estado actual:** Barra de progreso con niveles clickeables

**Nuevo diseño:**
Indicadores circulares en el header (1, 2, 3) con:
- Nivel actual resaltado (borde verde)
- Flechas izquierda/derecha para navegar
- Click en círculo para cambiar de nivel

**Tareas:**
- [ ] Mover indicadores de nivel al header
- [ ] Diseño circular con número
- [ ] Estado activo (borde verde, fondo destacado)
- [ ] Flechas de navegación
- [ ] Lógica para cambiar de nivel al hacer clic
- [ ] Integrar con el sistema de niveles existente

**Archivos a modificar:**
- `app/src/main.ts` - Estructura HTML y lógica
- `app/src/style.css` - Estilos de indicadores
- `app/src/apps/maze/mazeApp.ts` - Función de cambio de nivel

**Especificaciones:**
- Círculos: ~40-50px de diámetro
- Nivel activo: borde verde de 3-4px
- Flechas: iconos SVG, clickeables
- Espaciado: 8-12px entre elementos

---

## 🎨 FASE 7: Ajustes de Distribución de Espacios

### 7.1 Layout Responsive y Proporciones
**Estado actual:** Stage fijo de 360px, editor flexible

**Nuevo diseño:**
- Header fijo en la parte superior
- Área de juego más grande y centrada
- Editor de bloques en la parte inferior (más espacio vertical)
- Mejor uso del espacio disponible

**Tareas:**
- [ ] Revisar y ajustar proporciones del layout
- [ ] Asegurar que el canvas del juego tenga buen tamaño
- [ ] Optimizar espacio vertical para bloques
- [ ] Ajustar breakpoints si es necesario (responsive)

**Archivos a modificar:**
- `app/src/style.css` - Layout principal
- `app/src/main.ts` - Estructura HTML si es necesario

**Especificaciones:**
- Header: ~60-70px fijo
- Área de juego: ~50-60% del espacio vertical restante
- Editor: ~40-50% del espacio vertical restante
- Mínimo: mantener usabilidad en pantallas pequeñas

---

## 📝 FASE 8: Controles de Sonido/Música

### 8.1 Botones de Sonido y Música
**Estado actual:** No existen

**Nuevo diseño:**
Botones circulares pequeños en la esquina superior derecha:
- Botón de música (nota musical, tachada si está mute)
- Botón de sonido (altavoz, tachado si está mute)

**Tareas:**
- [ ] Crear botones de control de audio
- [ ] Sistema de estado (on/off) para música y sonido
- [ ] Iconos SVG para cada estado
- [ ] Persistencia del estado (localStorage)
- [ ] Integración con sistema de audio (si se agrega después)

**Archivos a crear:**
- `app/public/icons/music-on.svg`
- `app/public/icons/music-off.svg`
- `app/public/icons/sound-on.svg`
- `app/public/icons/sound-off.svg`

**Archivos a modificar:**
- `app/src/main.ts` - Botones y lógica
- `app/src/style.css` - Estilos

**Especificaciones:**
- Botones: círculos pequeños (~32-40px)
- Color: amarillo (#F59E0B o similar)
- Posición: fixed, top-right
- Espaciado vertical entre botones

---

## 🗂️ Orden de Implementación Recomendado

### Sprint 1: Estructura Base
1. FASE 1.1 - Header/Navigation Bar
2. FASE 1.3 - Área de Juego Rediseñada (fondo, layout)
3. FASE 7 - Ajustes de Distribución de Espacios

### Sprint 2: Componentes Principales
4. FASE 2 - Botón Play/Restart Dinámico
5. FASE 3 - Indicador de Límite de Bloques
6. FASE 6 - Navegación de Niveles

### Sprint 3: Contenido y Detalles
7. FASE 1.2 - Panel Lateral de Información
8. FASE 8 - Controles de Sonido/Música

### Sprint 4: Assets y Animaciones
9. FASE 4 - Obstáculos Animados
10. FASE 5 - Personaje Animado con Vistas

---

## 📦 Archivos y Carpetas a Crear

```
app/
├── public/
│   ├── icons/
│   │   ├── logo.svg (o logo.png)
│   │   ├── back.svg (flecha hacia atrás)
│   │   ├── info.svg (icono de información)
│   │   ├── play-large.svg (triángulo play grande)
│   │   ├── restart.svg (flecha circular)
│   │   ├── music-on.svg
│   │   ├── music-off.svg
│   │   ├── sound-on.svg
│   │   └── sound-off.svg
│   └── game-assets/
│       ├── obstacles/
│       │   ├── tree.svg
│       │   ├── bush.svg
│       │   └── acorn.svg
│       └── character/
│           ├── character-top.svg (vista cenital)
│           └── character-side.svg (vista lateral)
└── src/
    └── components/ (opcional)
        └── InfoPanel.ts
```

---

## 🔧 Cambios en Tipos TypeScript

### Extender `AppDefinition`:
```typescript
export type AppDefinition<AppState> = {
  // ... campos existentes
  metadata?: {
    title: string;
    description: string;
    recommendedAge: string; // ej: "6-10 años"
    competencies: string[]; // ej: ["Pensamiento lógico", "Resolución de problemas"]
    concepts: string[]; // ej: ["Secuencias", "Bucles", "Condicionales"]
    imageUrl?: string; // URL de imagen del juego para el panel de info
  };
};
```

### Extender `LevelInfo`:
```typescript
export type LevelInfo = {
  // ... campos existentes
  blockLimit?: number; // Si no está definido, es "SIN LÍMITE"
};
```

---

## ✅ Criterios de Aceptación

### Header:
- [ ] Logo y "Juegos" visible a la izquierda
- [ ] Botón "Volver" funcional (placeholder por ahora)
- [ ] Título del juego se actualiza dinámicamente
- [ ] Indicadores de nivel funcionan y muestran nivel activo
- [ ] Botón "Información" abre el panel lateral

### Panel de Información:
- [ ] Se desliza desde la derecha al hacer clic
- [ ] Muestra todos los campos requeridos
- [ ] Se cierra con botón X o clic en overlay
- [ ] Animación suave

### Botón Play/Restart:
- [ ] Cambia a Restart después de ejecutar (si no terminó)
- [ ] Restart vuelve a posición inicial
- [ ] Vuelve a Play después de restart
- [ ] No cambia a Restart si el juego terminó (win/error)

### Límite de Bloques:
- [ ] Muestra "SIN LÍMITE" cuando no hay límite
- [ ] Muestra número cuando hay límite
- [ ] Se actualiza al cambiar de nivel

### Obstáculos:
- [ ] Se renderizan como imágenes
- [ ] Diferentes tipos visibles (árbol, arbusto, bellota)
- [ ] Animaciones opcionales funcionan

### Personaje:
- [ ] Vista cenital cuando se mueve N/S
- [ ] Vista lateral cuando se mueve E/W
- [ ] Animación de colisión cuando choca

---

## 📝 Notas Adicionales

- **Botón "Volver"**: Por ahora será un placeholder. La funcionalidad de home/landing se implementará después según indicaste.
- **Assets**: Las imágenes pueden ser placeholders inicialmente (SVG simples) y reemplazarse después con assets finales.
- **Animaciones**: Empezar con animaciones simples (CSS transitions) y luego mejorar con animaciones más complejas si es necesario.
- **Responsive**: Considerar diseño responsive, pero priorizar desktop/tablet primero.

---

## 🚀 Próximos Pasos

Una vez aprobado este plan, comenzar con **Sprint 1** implementando la estructura base del header y el área de juego rediseñada.
