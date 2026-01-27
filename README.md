# 🎮 Game Blocks

Un juego educativo de programación visual usando bloques estilo Scratch, donde los niños aprenden a programar resolviendo laberintos.

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ 
- npm

### Instalación y Ejecución Local

```bash
# Instalar dependencias
cd app
npm install

# Copiar archivos vendor (Blockly)
npm run copy:vendor

# Iniciar servidor de desarrollo
npm run dev
```

Abre tu navegador en `http://localhost:5173`

## 📦 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo con hot-reload
- `npm run build` - Compilar para producción
- `npm run preview` - Previsualizar versión compilada
- `npm run copy:vendor` - Copiar archivos vendor de Blockly

## 🌐 Desplegar en GitHub Pages

Ver [TESTING_GUIDE.md](./TESTING_GUIDE.md) para instrucciones completas.

**Resumen rápido:**
1. El workflow `.github/workflows/deploy.yml` está configurado
2. Habilita GitHub Pages en Settings → Pages → Source: "GitHub Actions"
3. Haz push a `main` y se desplegará automáticamente

## 📚 Documentación

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Cómo probar y desplegar
- [PERSONALIZATION_GUIDE.md](./PERSONALIZATION_GUIDE.md) - Guía de personalización
- [ANIMATION_FILES_SPEC.md](./ANIMATION_FILES_SPEC.md) - Especificaciones de archivos de animación
- [BLOCKLY_SHADOW_BLOCK_RENDERING_DEBUG.md](./BLOCKLY_SHADOW_BLOCK_RENDERING_DEBUG.md) - Debugging de renderizado

## 🎯 Características

- ✅ Programación visual con bloques estilo Scratch
- ✅ Múltiples juegos (Laberinto, Práctica)
- ✅ Múltiples niveles por juego
- ✅ Barra de progreso interactiva
- ✅ Avance automático de niveles
- ✅ Animaciones suaves
- ✅ Feedback visual (highlight de bloques, efectos de éxito/error)
- ✅ Guardado/carga de proyectos

## 🛠️ Tecnologías

- **Vite** - Build tool
- **TypeScript** - Lenguaje
- **Scratch Blocks** - Librería de bloques visuales
- **Canvas API** - Renderizado del juego

## 📝 Licencia

[Especificar licencia]
