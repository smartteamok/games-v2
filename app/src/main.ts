/**
 * Punto de entrada principal de la aplicación.
 * 
 * Este archivo se encarga del bootstrap y routing.
 * La lógica del juego está en módulos separados:
 * - blocklyLoader: Carga dinámica de Blockly
 * - gameController: Inicialización y ejecución del juego
 * - effects: Efectos visuales
 */
import "./style.css";
import { getAppById } from "./apps/registry";
import { getRoute, onRouteChange } from "./router";
import { mountLanding } from "./pages/landing";
import { getGameLayoutHtml, showComingSoon } from "./pages/gameView";
import { loadBlocklyScripts } from "./blocklyLoader";
import { teardownGameView, initGameView } from "./gameController";
import { setStatus } from "./effects";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

function render(route: ReturnType<typeof getRoute>): void {
  teardownGameView();

  if (route.path === "landing") {
    mountLanding(appRoot);
    return;
  }

  const app = getAppById(route.gameId);
  appRoot.innerHTML = getGameLayoutHtml(app?.blockType);
  
  if (app) {
    loadBlocklyScripts(app.blockType ?? "horizontal").then(
      () => initGameView(route.gameId, appRoot),
      (err) => {
        console.error(err);
        setStatus("Error al cargar Blockly", "error");
      }
    );
  } else {
    showComingSoon(appRoot);
  }
}

// Arranque: usar hash por defecto para landing si no hay hash
if (!window.location.hash || window.location.hash === "#") {
  window.location.hash = "#/";
}

onRouteChange(render);
