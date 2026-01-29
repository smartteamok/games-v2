/**
 * Catálogo de los 20 juegos para la landing.
 * Juegos 1–10: bloques horizontales. Juegos 11–20: bloques verticales.
 * Solo maze y practice están implementados; el resto son placeholders "Próximamente".
 */

export type BlockType = "horizontal" | "vertical";

export type GameCatalogEntry = {
  id: string;
  title: string;
  description: string;
  blockType: BlockType;
  /** Ej: "Bloques horizontales", "Bloques verticales" */
  programmingType: string;
  /** Cantidad de niveles (placeholder si comingSoon) */
  levelsCount: number;
  /** Ruta relativa a la imagen de la card (public/landing/) */
  imageUrl: string;
  /** Si true, el juego aún no está disponible */
  comingSoon: boolean;
};

const BASE_URL = import.meta.env.BASE_URL;

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: "maze",
    title: "Laberinto",
    description: "Llevá al personaje hasta la meta programando movimientos y giros.",
    blockType: "horizontal",
    programmingType: "Bloques horizontales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/maze.svg`,
    comingSoon: false
  },
  {
    id: "practice",
    title: "Práctica",
    description: "Practicá los mismos bloques en un laberinto alternativo.",
    blockType: "horizontal",
    programmingType: "Bloques horizontales",
    levelsCount: 8,
    imageUrl: `${BASE_URL}landing/practice.svg`,
    comingSoon: false
  },
  // Juegos 3–10: horizontales, próximamente
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `game-${i + 3}`,
    title: `Juego ${i + 3}`,
    description: "Descripción del juego próximamente.",
    blockType: "horizontal" as BlockType,
    programmingType: "Bloques horizontales",
    levelsCount: 0,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true
  })),
  // Juegos 11–20: verticales, próximamente
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `game-${i + 11}`,
    title: `Juego ${i + 11}`,
    description: "Descripción del juego próximamente.",
    blockType: "vertical" as BlockType,
    programmingType: "Bloques verticales",
    levelsCount: 0,
    imageUrl: `${BASE_URL}landing/placeholder.svg`,
    comingSoon: true
  }))
];

export const getGameFromCatalog = (id: string): GameCatalogEntry | undefined =>
  GAME_CATALOG.find((g) => g.id === id);
