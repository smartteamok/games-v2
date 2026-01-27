import { defineConfig } from 'vite';

// Configuración para GitHub Pages
// Si tu repo está en username.github.io/repo-name, usa '/repo-name/'
// Si tu repo está en username.github.io (raíz), usa '/'
const REPO_NAME = 'games-v2'; // Cambia esto por el nombre de tu repositorio

export default defineConfig({
  base: process.env.NODE_ENV === 'production' 
    ? `/${REPO_NAME}/` 
    : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true
  }
});
