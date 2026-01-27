# 🧪 Guía de Testing - Game Blocks

Esta guía explica cómo probar el juego localmente y desplegarlo en GitHub Pages.

---

## 🚀 Testing Local

### Requisitos Previos

- **Node.js** versión 18 o superior
- **npm** (viene con Node.js)

### Pasos para Probar Localmente

1. **Instalar dependencias:**
   ```bash
   cd app
   npm install
   ```

2. **Copiar archivos vendor (Blockly):**
   ```bash
   npm run copy:vendor
   ```
   Este comando copia los archivos necesarios de Blockly desde `node_modules` a `public/vendor/`.

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   
   Esto iniciará un servidor de desarrollo (normalmente en `http://localhost:5173`).

4. **Abrir en el navegador:**
   - Abre tu navegador
   - Ve a la URL que muestra el terminal (ej: `http://localhost:5173`)
   - ¡El juego debería estar funcionando!

### Comandos Disponibles

- `npm run dev` - Inicia servidor de desarrollo con hot-reload
- `npm run build` - Compila el proyecto para producción
- `npm run preview` - Previsualiza la versión compilada localmente
- `npm run copy:vendor` - Copia archivos vendor de Blockly

---

## 🌐 Desplegar en GitHub Pages

### Opción 1: GitHub Actions (Recomendado)

Esta opción despliega automáticamente cada vez que haces push a la rama `main`.

#### Paso 1: Crear el workflow

Crea el archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: app/package-lock.json

      - name: Install dependencies
        working-directory: ./app
        run: npm ci

      - name: Copy vendor files
        working-directory: ./app
        run: npm run copy:vendor

      - name: Build
        working-directory: ./app
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './app/dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### Paso 2: Habilitar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. En "Source", selecciona "GitHub Actions"
4. Guarda los cambios

#### Paso 3: Hacer Push

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment"
git push origin main
```

Después de unos minutos, tu juego estará disponible en:
`https://TU_USUARIO.github.io/game-blocks/`

---

### Opción 2: Deploy Manual

Si prefieres desplegar manualmente:

#### Paso 1: Compilar el proyecto

```bash
cd app
npm install
npm run copy:vendor
npm run build
```

Esto crea la carpeta `app/dist/` con los archivos compilados.

#### Paso 2: Configurar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. En "Source", selecciona "Deploy from a branch"
4. Selecciona la rama `gh-pages` y carpeta `/ (root)`
5. Guarda

#### Paso 3: Crear rama gh-pages y subir dist

```bash
# Desde la raíz del proyecto
cd app
npm run build

# Crear rama gh-pages y copiar dist
git checkout --orphan gh-pages
git reset --hard
git rm -rf .
cp -r dist/* .
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages --force
```

**Nota:** Necesitarás ajustar las rutas en `index.html` si usas esta opción, ya que GitHub Pages sirve desde la raíz.

---

## 🔧 Configuración de Vite para GitHub Pages

Si tu repositorio no está en la raíz de GitHub Pages (ej: `username.github.io/repo-name`), necesitas configurar el `base` en Vite.

### Crear/Actualizar `app/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' 
    ? '/game-blocks/'  // Cambia esto por el nombre de tu repo
    : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
```

Si tu repo está en la raíz (`username.github.io`), usa `base: '/'`.

---

## 📝 Checklist de Testing

### Testing Local

- [ ] `npm install` ejecuta sin errores
- [ ] `npm run copy:vendor` copia los archivos correctamente
- [ ] `npm run dev` inicia el servidor
- [ ] El juego carga en el navegador
- [ ] Los bloques se muestran correctamente
- [ ] Puedes arrastrar y soltar bloques
- [ ] Puedes ejecutar programas
- [ ] Los valores numéricos se actualizan visualmente
- [ ] La barra de progreso funciona
- [ ] El avance automático de niveles funciona

### Testing en Producción (GitHub Pages)

- [ ] El sitio se despliega correctamente
- [ ] Todas las rutas funcionan (no hay 404)
- [ ] Los assets se cargan correctamente
- [ ] El juego funciona en diferentes navegadores
- [ ] El juego funciona en móviles/tablets

---

## 🐛 Troubleshooting

### Problema: "Cannot find module" o errores de importación

**Solución:**
```bash
cd app
rm -rf node_modules package-lock.json
npm install
npm run copy:vendor
```

### Problema: Los bloques no se muestran

**Solución:**
- Verifica que `npm run copy:vendor` se ejecutó correctamente
- Verifica que los archivos existen en `app/public/vendor/scratch-blocks/`
- Abre la consola del navegador (F12) y revisa errores

### Problema: GitHub Pages muestra página en blanco

**Solución:**
- Verifica que el `base` en `vite.config.ts` coincide con el nombre de tu repo
- Verifica que los archivos en `dist/` tienen las rutas correctas
- Revisa la consola del navegador para errores 404

### Problema: Los assets no cargan en GitHub Pages

**Solución:**
- Asegúrate de que todas las rutas en el código usan rutas relativas
- Verifica que `vite.config.ts` tiene el `base` correcto
- Revisa que los archivos están en `public/` (no en `src/`)

---

## 📚 Recursos Adicionales

- [Documentación de Vite](https://vitejs.dev/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 🎯 URLs de Ejemplo

Después de desplegar, tu juego estará disponible en:

- **Si el repo es `username/game-blocks`:**
  `https://username.github.io/game-blocks/`

- **Si el repo es `username/username.github.io` (raíz):**
  `https://username.github.io/`

---

¿Necesitas ayuda con algo específico? ¡Déjame saber!
