/**
 * Carga dinámica de scripts Blockly (horizontal o vertical).
 */

const BASE_URL = import.meta.env.BASE_URL;
const BLOCKLY_BUNDLE_ATTR = "data-blockly-bundle";

export type BlockType = "horizontal" | "vertical";

const SCRIPTS_BY_TYPE = {
  horizontal: [
    "vendor/scratch-blocks/blockly_compressed_horizontal.js",
    "vendor/scratch-blocks/blocks_compressed.js",
    "vendor/scratch-blocks/blocks_compressed_horizontal.js",
    "vendor/scratch-blocks/msg/js/en.js"
  ],
  vertical: [
    "vendor/scratch-blocks/blockly_compressed_vertical.js",
    "vendor/scratch-blocks/blocks_compressed.js",
    "vendor/scratch-blocks/blocks_compressed_vertical.js",
    "vendor/scratch-blocks/msg/js/en.js"
  ]
} as const;

let loadedBlockType: BlockType | null = null;

/**
 * Carga el bundle de Blockly (horizontal o vertical).
 * Si ya está cargado el mismo tipo, resuelve de inmediato.
 * Si se pide otro tipo, reemplaza los scripts y recarga en secuencia.
 */
export function loadBlocklyScripts(blockType: BlockType): Promise<void> {
  const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  
  if (loadedBlockType === blockType) {
    return Promise.resolve();
  }
  
  // Eliminar scripts anteriores
  document.querySelectorAll(`script[${BLOCKLY_BUNDLE_ATTR}]`).forEach((el) => el.remove());
  loadedBlockType = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Blockly = undefined;

  const paths = SCRIPTS_BY_TYPE[blockType];
  
  function loadOne(index: number): Promise<void> {
    if (index >= paths.length) {
      loadedBlockType = blockType;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.setAttribute(BLOCKLY_BUNDLE_ATTR, blockType);
      script.src = base + paths[index];
      script.onload = () => loadOne(index + 1).then(resolve, reject);
      script.onerror = () => reject(new Error(`Error cargando Blockly: ${paths[index]}`));
      document.body.appendChild(script);
    });
  }
  
  return loadOne(0);
}

export function getLoadedBlockType(): BlockType | null {
  return loadedBlockType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBlockly(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).Blockly;
}
