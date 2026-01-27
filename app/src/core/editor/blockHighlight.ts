// Utilidades para highlight de bloques durante ejecución

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const highlightBlock = (Blockly: any, workspace: unknown, blockId: string): void => {
  try {
    const block = (workspace as { getBlockById?: (id: string) => any }).getBlockById?.(blockId);
    if (!block) return;

    const svgGroup = block.svgGroup_;
    if (!svgGroup) return;

    // Añadir clase CSS para highlight
    svgGroup.classList.add("blockly-highlight-active");

    // Aplicar glow usando SVG filter o CSS
    const blockFrame = block.blockFrameElement_;
    if (blockFrame) {
      blockFrame.setAttribute("filter", "url(#blocklyGlowFilter)");
    }

    // Scroll para mantener visible
    scrollBlockIntoView(Blockly, workspace, block);
  } catch (error) {
    console.warn("Error highlighting block:", error);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const clearBlockHighlight = (workspace: unknown, blockId?: string): void => {
  try {
    if (blockId) {
      const block = (workspace as { getBlockById?: (id: string) => any }).getBlockById?.(blockId);
      if (block?.svgGroup_) {
        block.svgGroup_.classList.remove("blockly-highlight-active");
        if (block.blockFrameElement_) {
          block.blockFrameElement_.removeAttribute("filter");
        }
      }
    } else {
      // Limpiar todos los highlights
      const allBlocks = (workspace as { getAllBlocks?: (ordered: boolean) => any[] }).getAllBlocks?.(false) ?? [];
      for (const block of allBlocks) {
        if (block.svgGroup_) {
          block.svgGroup_.classList.remove("blockly-highlight-active");
          if (block.blockFrameElement_) {
            block.blockFrameElement_.removeAttribute("filter");
          }
        }
      }
    }
  } catch (error) {
    console.warn("Error clearing block highlight:", error);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const scrollBlockIntoView = (_Blockly: any, workspace: unknown, block: any): void => {
  try {
    const svgGroup = block.svgGroup_;
    if (!svgGroup) return;

    const svg = (workspace as { getParentSvg?: () => SVGElement }).getParentSvg?.();
    if (!svg) return;

    const blockRect = svgGroup.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    // Calcular si el bloque está fuera de la vista
    const blockCenterX = blockRect.left + blockRect.width / 2 - svgRect.left;
    const blockCenterY = blockRect.top + blockRect.height / 2 - svgRect.top;

    const svgElement = svg as SVGSVGElement;
    const viewBox = svgElement.viewBox?.baseVal;
    const viewWidth = viewBox?.width || svgRect.width;
    const viewHeight = viewBox?.height || svgRect.height;

    // Scroll suave si está fuera de vista
    if (blockCenterX < 0 || blockCenterX > viewWidth || blockCenterY < 0 || blockCenterY > viewHeight) {
      const metrics = (workspace as { getMetrics?: () => { viewLeft: number; viewTop: number } }).getMetrics?.();
      if (metrics) {
        const blockXY = block.getRelativeToSurfaceXY?.();
        if (blockXY) {
          const newX = blockXY.x - viewWidth / 2;
          const newY = blockXY.y - viewHeight / 2;
          (workspace as { scroll?: (x: number, y: number) => void }).scroll?.(newX, newY);
        }
      }
    }
  } catch (error) {
    // Ignorar errores de scroll
  }
};
