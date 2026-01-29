/**
 * Router hash-based: #/ (landing) y #/game/:id (juego).
 */

export type Route =
  | { path: "landing" }
  | { path: "game"; gameId: string };

const HASH_PREFIX = "#";

function getHash(): string {
  const h = window.location.hash;
  if (h.startsWith(HASH_PREFIX)) return h.slice(HASH_PREFIX.length);
  return h || "/";
}

export function getRoute(): Route {
  const hash = getHash();
  const path = hash.replace(/^#?\//, "") || "/";
  if (path === "/") return { path: "landing" };
  const gameMatch = path.match(/^game\/([^/]+)/);
  if (gameMatch) return { path: "game", gameId: gameMatch[1] };
  return { path: "landing" };
}

export function navigateToLanding(): void {
  window.location.hash = "#/";
}

export function navigateToGame(gameId: string): void {
  window.location.hash = `#/game/${encodeURIComponent(gameId)}`;
}

export function onRouteChange(callback: (route: Route) => void): () => void {
  const handler = () => callback(getRoute());
  window.addEventListener("hashchange", handler);
  handler();
  return () => window.removeEventListener("hashchange", handler);
}
