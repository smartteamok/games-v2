import { defineConfig } from 'vite';

export default defineConfig({
  // En Vercel, tu sitio vive en la raíz, así que usamos '/'
  base: '/', 
  
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