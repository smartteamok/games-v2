/**
 * Helper para obtener el BASE_URL de Vite
 * Necesario para compatibilidad con GitHub Pages cuando el repo está en un subdirectorio
 */
export const BASE_URL = import.meta.env.BASE_URL;

/**
 * Construye una ruta relativa al BASE_URL
 * @param path - Ruta relativa (ej: "icons/play.svg")
 * @returns Ruta completa con BASE_URL (ej: "/game-blocks/icons/play.svg" en producción)
 */
export function getAssetPath(path: string): string {
  // Asegurar que BASE_URL termine con / y path no empiece con /
  const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
