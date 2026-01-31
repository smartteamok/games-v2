/**
 * Catálogo de los 20 juegos para la landing.
 * Juegos 1–10: bloques horizontales. Juegos 11–20: bloques verticales.
 *
 * Tipos de juegos:
 * - maze-like: Laberintos y navegación
 * - artist: Turtle graphics / dibujo
 * - collector: Recolección de items
 * - sequence: Patrones y secuencias
 * - sprite: Programación de sprites
 */

import type { BlockType } from "../apps/types";

export type GameType = "maze-like" | "artist" | "collector" | "sequence" | "sprite" | "mixed";

export type GameCatalogEntry = {
  id: string;
  title: string;
  description: string;
  blockType: BlockType;
  gameType: GameType;
  /** Ej: "Bloques horizontales", "Bloques verticales" */
  programmingType: string;
  /** Cantidad de niveles */
  levelsCount: number;
  /** Ruta relativa a la imagen de la card (public/landing/) */
  imageUrl: string;
  /** Si true, el juego aún no está disponible */
  comingSoon: boolean;
  /** Habilidades que enseña */
  skills?: string[];
};

const BASE_URL = import.meta.env.BASE_URL;

export const GAME_CATALOG: GameCatalogEntry[] = [
  // ============ HORIZONTALES (1-10) ============

  // 1. Maze - Implementado ✅
  {
    id: "maze",
    title: "Laberinto",
    description: "Llevá al personaje hasta la meta programando movimientos y giros.",
    blockType: "horizontal",
    gameType: "maze-like",
    programmingType: "Bloques horizontales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/maze.svg`,
    comingSoon: false,
    skills: ["Secuenciación", "Bucles", "Planificación"]
  },

  // 2. Practice - Implementado ✅
  {
    id: "practice",
    title: "Práctica",
    description: "Practicá movimientos básicos en laberintos simples.",
    blockType: "horizontal",
    gameType: "maze-like",
    programmingType: "Bloques horizontales",
    levelsCount: 4,
    imageUrl: `${BASE_URL}landing/practice.svg`,
    comingSoon: false,
    skills: ["Secuenciación básica"]
  },

  // 3. Collector - Módulo listo, juego pendiente
  {
    id: "collector",
    title: "Recolector",
    description: "Recolectá todos los items mientras navegás el laberinto.",
    blockType: "horizontal",
    gameType: "collector",
    programmingType: "Bloques horizontales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Bucles while", "Condicionales", "Conteo"]
  },

  // 4. Farmer
  {
    id: "farmer",
    title: "Granjero",
    description: "Plantá, regá y cosechá en tu granja virtual.",
    blockType: "horizontal",
    gameType: "collector",
    programmingType: "Bloques horizontales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Secuencias", "Bucles", "Condicionales"]
  },

  // 5. Artist - Módulo listo, juego pendiente
  {
    id: "artist",
    title: "Artista",
    description: "Dibujá formas geométricas programando una tortuga.",
    blockType: "horizontal",
    gameType: "artist",
    programmingType: "Bloques horizontales",
    levelsCount: 10,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Geometría", "Bucles", "Ángulos"]
  },

  // 6. Shapes
  {
    id: "shapes",
    title: "Formas",
    description: "Creá figuras complejas combinando formas simples.",
    blockType: "horizontal",
    gameType: "artist",
    programmingType: "Bloques horizontales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Descomposición", "Abstracción"]
  },

  // 7. Sequence - Módulo listo, juego pendiente
  {
    id: "sequence",
    title: "Secuencias",
    description: "Completá patrones y reconocé secuencias.",
    blockType: "horizontal",
    gameType: "sequence",
    programmingType: "Bloques horizontales",
    levelsCount: 10,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Reconocimiento de patrones", "Abstracción"]
  },

  // 8. Patterns
  {
    id: "patterns",
    title: "Patrones",
    description: "Descubrí la regla y continuá el patrón.",
    blockType: "horizontal",
    gameType: "sequence",
    programmingType: "Bloques horizontales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Generalización", "Pensamiento lógico"]
  },

  // 9. Maze Advanced
  {
    id: "maze-advanced",
    title: "Laberinto Avanzado",
    description: "Desafíos de laberinto con obstáculos móviles.",
    blockType: "horizontal",
    gameType: "maze-like",
    programmingType: "Bloques horizontales",
    levelsCount: 10,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Bucles anidados", "Condicionales", "Debugging"]
  },

  // 10. Challenge
  {
    id: "challenge",
    title: "Desafío",
    description: "Desafíos mixtos que combinan todas las habilidades.",
    blockType: "horizontal",
    gameType: "mixed",
    programmingType: "Bloques horizontales",
    levelsCount: 10,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Todas las anteriores"]
  },

  // ============ VERTICALES (11-20) ============

  // 11. Maze Vertical - Implementado ✅
  {
    id: "maze-vertical",
    title: "Laberinto",
    description: "El laberinto clásico con bloques estilo Scratch.",
    blockType: "vertical",
    gameType: "maze-like",
    programmingType: "Bloques verticales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/maze.svg`,
    comingSoon: false,
    skills: ["Secuenciación", "Bucles"]
  },

  // 12. Collector Vertical
  {
    id: "collector-v",
    title: "Recolector",
    description: "Recolectá items con bloques verticales.",
    blockType: "vertical",
    gameType: "collector",
    programmingType: "Bloques verticales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Bucles while", "Condicionales"]
  },

  // 13. Artist Vertical
  {
    id: "artist-v",
    title: "Artista",
    description: "Turtle graphics con bloques estilo Scratch.",
    blockType: "vertical",
    gameType: "artist",
    programmingType: "Bloques verticales",
    levelsCount: 10,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Geometría", "Bucles", "Funciones"]
  },

  // 14. Sprite Lab
  {
    id: "sprite-lab",
    title: "Sprite Lab",
    description: "Programá el comportamiento de personajes.",
    blockType: "vertical",
    gameType: "sprite",
    programmingType: "Bloques verticales",
    levelsCount: 10,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Eventos", "Paralelismo", "Interacción"]
  },

  // 15. Animation
  {
    id: "animation",
    title: "Animación",
    description: "Creá animaciones con múltiples sprites.",
    blockType: "vertical",
    gameType: "sprite",
    programmingType: "Bloques verticales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Timing", "Secuencias", "Creatividad"]
  },

  // 16. Dance
  {
    id: "dance",
    title: "Baile",
    description: "Coreografiá movimientos sincronizados con música.",
    blockType: "vertical",
    gameType: "sprite",
    programmingType: "Bloques verticales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Sincronización", "Eventos", "Creatividad"]
  },

  // 17. Music
  {
    id: "music",
    title: "Música",
    description: "Componé melodías y ritmos con bloques.",
    blockType: "vertical",
    gameType: "mixed",
    programmingType: "Bloques verticales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Patrones", "Bucles", "Creatividad"]
  },

  // 18. Story
  {
    id: "story",
    title: "Historia",
    description: "Creá historias interactivas con personajes.",
    blockType: "vertical",
    gameType: "sprite",
    programmingType: "Bloques verticales",
    levelsCount: 6,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Narrativa", "Eventos", "Secuencias"]
  },

  // 19. Game Maker
  {
    id: "game-maker",
    title: "Creador de Juegos",
    description: "Diseñá tu propio juego simple.",
    blockType: "vertical",
    gameType: "sprite",
    programmingType: "Bloques verticales",
    levelsCount: 5,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Diseño", "Lógica", "Variables"]
  },

  // 20. Free Play
  {
    id: "free-play",
    title: "Juego Libre",
    description: "Creá lo que quieras con todos los bloques.",
    blockType: "vertical",
    gameType: "mixed",
    programmingType: "Bloques verticales",
    levelsCount: 0,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true,
    skills: ["Creatividad", "Exploración"]
  }
];

export const getGameFromCatalog = (id: string): GameCatalogEntry | undefined =>
  GAME_CATALOG.find((g) => g.id === id);

export const getGamesByType = (gameType: GameType): GameCatalogEntry[] =>
  GAME_CATALOG.filter((g) => g.gameType === gameType);

export const getGamesByBlockType = (blockType: BlockType): GameCatalogEntry[] =>
  GAME_CATALOG.filter((g) => g.blockType === blockType);

export const getAvailableGames = (): GameCatalogEntry[] =>
  GAME_CATALOG.filter((g) => !g.comingSoon);

export const getComingSoonGames = (): GameCatalogEntry[] =>
  GAME_CATALOG.filter((g) => g.comingSoon);
