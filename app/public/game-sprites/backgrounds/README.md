# Imágenes de fondo del maze

Colocá aquí las imágenes de fondo del canvas del laberinto (por nivel).

**Ruta base:** `public/game-sprites/backgrounds/`

**Uso en niveles:** En `app/src/apps/maze/levels.ts`, añadí `backgroundImage` al nivel:

```ts
{
  id: 1,
  title: "Recta",
  // ...
  backgroundImage: "level1.png"  // → public/game-sprites/backgrounds/level1.png
}
```

**Formato:** PNG o JPG. Se dibuja en modo "cover" (cubre todo el canvas) y se aplica un overlay blanco semitransparente para que el grid y los obstáculos sigan leyendo bien.
