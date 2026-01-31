# Tipos de Juegos para Pensamiento Computacional

## Investigación: Plataformas de Referencia

Basado en análisis de las principales plataformas educativas:
- **Code.org** (Hour of Code, CS Fundamentals)
- **Scratch** (MIT Media Lab)
- **Blockly Games** (Google)
- **Tynker**
- **CodeCombat**

---

## Categorías de Juegos Identificadas

### 1. 🧩 Laberinto / Maze (YA IMPLEMENTADO)
**Concepto:** Navegar un personaje desde un punto A hasta un punto B evitando obstáculos.

**Habilidades que enseña:**
- Secuenciación básica
- Bucles (repetir N veces)
- Planificación

**Variantes:**
- Maze básico ✅
- Maze con obstáculos animados
- Maze con múltiples caminos

**Juegos en la plataforma:**
- `maze` - Laberinto horizontal ✅
- `maze-vertical` - Laberinto vertical ✅
- `practice` - Práctica ✅

---

### 2. 🎨 Artista / Turtle Graphics (YA IMPLEMENTADO)
**Concepto:** Controlar un "lápiz" o "tortuga" para dibujar formas geométricas.

**Habilidades que enseña:**
- Geometría (ángulos, formas)
- Bucles para patrones repetitivos
- Descomposición (formas complejas = formas simples)
- Abstracción (funciones para dibujar formas)

**Operaciones:**
- Avanzar X píxeles
- Girar X grados
- Subir/bajar lápiz
- Cambiar color
- Cambiar grosor

**Bloques:**
```
[Avanzar 100 píxeles]
[Girar ↻ 90 grados]
[Girar ↺ 90 grados]
[Subir lápiz]
[Bajar lápiz]
[Color: rojo]
[Grosor: 3]
[Repetir 4 veces] { ... }
```

**Niveles típicos:**
1. Dibujar una línea
2. Dibujar un cuadrado
3. Dibujar un triángulo
4. Dibujar una escalera
5. Dibujar una estrella
6. Dibujar un polígono de N lados
7. Dibujar patrones con bucles anidados
8. Arte libre

---

### 3. 🌾 Recolector / Harvester / Collector
**Concepto:** Similar a maze pero con mecánica de recolección (néctar, frutas, gemas).

**Habilidades que enseña:**
- Bucles while (mientras haya item, recolectar)
- Condicionales (si hay item, recolectar)
- Conteo y variables

**Operaciones adicionales:**
- Recolectar item
- Verificar si hay item
- Contar items

**Bloques:**
```
[Avanzar]
[Girar ↻]
[Girar ↺]
[Recolectar]
[Mientras haya néctar] { [Recolectar] }
[Si hay néctar] { [Recolectar] }
[Repetir 3 veces] { ... }
```

**Variantes:**
- **Abeja (Bee):** Recolectar néctar de flores
- **Granjero (Farmer):** Cosechar cultivos
- **Minero:** Recolectar gemas/minerales

---

### 4. 🌱 Sembrador / Planter / Farmer
**Concepto:** Plantar semillas, regar plantas, cosechar.

**Habilidades que enseña:**
- Secuencias de múltiples pasos
- Bucles while con condiciones
- Condicionales anidados

**Operaciones:**
- Plantar
- Regar
- Cosechar
- Verificar si hay hueco/planta/fruto

**Bloques:**
```
[Avanzar]
[Plantar semilla]
[Regar]
[Cosechar]
[Si hay hueco] { [Plantar] }
[Mientras haya planta seca] { [Regar] }
```

---

### 5. 🔢 Secuencias / Patterns
**Concepto:** Completar patrones, ordenar secuencias, reconocer repeticiones.

**Habilidades que enseña:**
- Reconocimiento de patrones
- Pensamiento abstracto
- Generalización

**Mecánicas:**
- Arrastrar bloques para completar una secuencia
- Identificar el patrón que falta
- Crear el bucle que genera un patrón

**Niveles:**
1. Completar secuencia simple (A, B, A, B, ?)
2. Identificar patrón (1, 2, 4, 8, ?)
3. Construir bucle para patrón repetitivo
4. Patrones 2D (grillas)

---

### 6. 🎮 Sprite Lab / Animación
**Concepto:** Programar comportamientos de sprites (personajes), similar a Scratch simplificado.

**Habilidades que enseña:**
- Eventos (al hacer clic, al presionar tecla)
- Paralelismo (múltiples sprites)
- Interacción entre objetos

**Operaciones:**
- Mover sprite
- Cambiar disfraz/animación
- Decir/pensar (bocadillos)
- Reproducir sonido
- Detectar colisiones

**Bloques:**
```
[Al hacer clic en bandera verde]
[Al presionar tecla espacio]
[Mover 10 pasos]
[Ir a x: 0 y: 0]
[Decir "Hola" por 2 segundos]
[Cambiar disfraz a "feliz"]
[Si toca borde] { [Rebotar] }
```

---

### 7. 💃 Baile / Dance Party
**Concepto:** Coreografiar movimientos de personajes sincronizados con música.

**Habilidades que enseña:**
- Secuenciación temporal
- Eventos y sincronización
- Creatividad

**Operaciones:**
- Movimientos de baile predefinidos
- Cambiar pose
- Sincronizar con beat

---

### 8. 🎵 Música / Composer
**Concepto:** Crear melodías y ritmos usando bloques.

**Habilidades que enseña:**
- Secuenciación
- Bucles para patrones musicales
- Creatividad

**Operaciones:**
- Tocar nota (Do, Re, Mi...)
- Tocar acorde
- Silencio
- Cambiar instrumento
- Cambiar tempo

---

## Plan de 20 Juegos

### Horizontales (1-10) - Bloques con iconos
| # | ID | Nombre | Tipo | Estado |
|---|-----|--------|------|--------|
| 1 | maze | Laberinto | maze-like | ✅ |
| 2 | practice | Práctica | maze-like | ✅ |
| 3 | collector | Recolector | collector | 🔜 |
| 4 | farmer | Granjero | farmer | 🔜 |
| 5 | artist | Artista | artist | ✅ |
| 6 | shapes | Formas | artist | 🔜 |
| 7 | sequence | Secuencias | sequence | 🔜 |
| 8 | patterns | Patrones | sequence | 🔜 |
| 9 | maze-advanced | Laberinto Avanzado | maze-like | 🔜 |
| 10 | challenge | Desafío | mixed | 🔜 |

### Verticales (11-20) - Bloques estilo Scratch
| # | ID | Nombre | Tipo | Estado |
|---|-----|--------|------|--------|
| 11 | maze-vertical | Laberinto | maze-like | ✅ |
| 12 | collector-v | Recolector | collector | 🔜 |
| 13 | artist-v | Artista | artist | 🔜 |
| 14 | sprite-lab | Sprite Lab | sprite | 🔜 |
| 15 | animation | Animación | sprite | 🔜 |
| 16 | dance | Baile | dance | 🔜 |
| 17 | music | Música | music | 🔜 |
| 18 | story | Historia | sprite | 🔜 |
| 19 | game-maker | Creador de Juegos | sprite | 🔜 |
| 20 | free-play | Juego Libre | mixed | 🔜 |

---

## Estructura de Módulos Compartidos

```
apps/shared/
├── maze-like/       # ✅ Laberintos (maze, practice)
├── artist/          # 🔜 Turtle graphics (artist, shapes)
├── collector/       # 🔜 Recolección (collector, farmer)
├── sequence/        # 🔜 Patrones (sequence, patterns)
├── sprite/          # 🔜 Sprites (sprite-lab, animation, story)
├── dance/           # 🔜 Baile (dance)
└── music/           # 🔜 Música (music)
```

---

## Prioridad de Implementación

### Fase 1 (Más impacto educativo)
1. **Artist** - Muy popular, enseña geometría y bucles
2. **Collector** - Extensión natural de maze, agrega condicionales

### Fase 2 (Variedad)
3. **Sequence** - Diferente mecánica, pensamiento abstracto
4. **Sprite** - Base para múltiples juegos creativos

### Fase 3 (Creatividad)
5. **Dance** - Atractivo para estudiantes
6. **Music** - Conexión arte-programación
