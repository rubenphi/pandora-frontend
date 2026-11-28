import { ref, nextTick } from "vue";
import { getSectionBounds } from "@/components/functions/omr/omrSheetGenerator.js";

/**
 * Composable que gestiona el zoom centrado en el puntero (rueda de mouse o pellizco),
 * paneo libre con arrastre y manipulación interactiva de secciones OMR.
 */
export function useCanvasInteraction({
  config,
  dims,
  selectedSection,
  selectedIndex,
  selectSection,
  drawPreview,
  clampToScannableArea,
}) {
  const canvasRef = ref(null);
  const scrollContainer = ref(null);
  const zoom = ref(1);

  // Drag & Pan state
  const dragging = ref(false);
  const isPanning = ref(false);
  const dragType = ref(null); // 'section' | 'pan'
  const hoverSectionIdx = ref(-1);

  // Section drag variables
  const dragStartCanvasX = ref(0);
  const dragStartCanvasY = ref(0);
  const dragStartPercentX = ref(0);
  const dragStartPercentY = ref(0);

  // Pan variables
  let panStartClientX = 0;
  let panStartClientY = 0;
  let panStartScrollLeft = 0;
  let panStartScrollTop = 0;

  // Pinch-to-zoom variables
  let isPinching = false;
  let initialPinchDist = 0;
  let initialPinchZoom = 1;

  /**
   * Realiza un zoom escalando hacia un punto focal específico en coordenadas de pantalla (clientX, clientY).
   * Mantiene el punto de la hoja exactamente bajo el cursor o centro del pellizco.
   */
  const zoomAtPoint = async (newZoom, focalX, focalY) => {
    if (!scrollContainer.value || !canvasRef.value) {
      zoom.value = newZoom;
      return;
    }

    const container = scrollContainer.value;
    const canvas = canvasRef.value;

    const rectBefore = canvas.getBoundingClientRect();
    const oldZ = zoom.value;
    if (oldZ <= 0) {
      zoom.value = newZoom;
      return;
    }

    // Punto en coordenadas del contenido de la canvas (espacio no escalado)
    const contentX = (focalX - rectBefore.left) / oldZ;
    const contentY = (focalY - rectBefore.top) / oldZ;

    zoom.value = newZoom;
    await nextTick();

    // Medir la nueva posición física del lienzo tras aplicar el zoom
    const rectAfter = canvas.getBoundingClientRect();
    const currentX = rectAfter.left + contentX * newZoom;
    const currentY = rectAfter.top + contentY * newZoom;

    // Compensar el desplazamiento para fijar el punto bajo el cursor/pellizco
    const diffX = currentX - focalX;
    const diffY = currentY - focalY;

    container.scrollLeft += diffX;
    container.scrollTop += diffY;
  };

  /**
   * Ajusta el zoom para que la hoja quepa completa en el contenedor visible
   */
  const fitZoom = async () => {
    await nextTick();
    if (scrollContainer.value && canvasRef.value) {
      const containerW = scrollContainer.value.clientWidth - 32;
      const containerH = scrollContainer.value.clientHeight - 32;
      const d = dims.value;
      const targetZoom = Math.max(
        0.1,
        Math.min(containerW / d.width, containerH / d.height, 1)
      );
      zoom.value = parseFloat(targetZoom.toFixed(3));
      await nextTick();
      if (scrollContainer.value.scrollWidth > scrollContainer.value.clientWidth) {
        scrollContainer.value.scrollLeft =
          (scrollContainer.value.scrollWidth - scrollContainer.value.clientWidth) / 2;
      }
      scrollContainer.value.scrollTop = 0;
    }
  };

  /**
   * Ajusta el zoom mediante botones (+ / -), focalizándose en el centro de la pantalla
   */
  const adjustZoom = async (delta) => {
    const nextZoom = Math.max(0.1, Math.min(3.0, zoom.value + delta));
    if (!scrollContainer.value) {
      zoom.value = nextZoom;
      return;
    }
    const rect = scrollContainer.value.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    await zoomAtPoint(nextZoom, centerX, centerY);
  };

  /**
   * Evento de rueda de ratón (Mouse Wheel) para zoom focalizado en la posición del puntero
   */
  const onWheel = async (evt) => {
    if (evt.cancelable) {
      evt.preventDefault();
    }
    if (!scrollContainer.value || !canvasRef.value) return;

    // Rueda arriba (deltaY < 0) = Acercar (+), Rueda abajo (deltaY > 0) = Alejar (-)
    const delta = -evt.deltaY;
    const factor = delta > 0 ? 1.09 : 0.91;
    const targetZoom = Math.max(0.1, Math.min(3.0, zoom.value * factor));

    if (Math.abs(targetZoom - zoom.value) < 0.001) return;

    await zoomAtPoint(targetZoom, evt.clientX, evt.clientY);
  };

  const getCanvasPos = (evt, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  };

  const hitTestSection = (canvasX, canvasY) => {
    const d = dims.value;
    for (let i = config.value.sections.length - 1; i >= 0; i--) {
      const sec = config.value.sections[i];
      const bounds = getSectionBounds(sec, d);
      if (
        canvasX >= bounds.x - 10 &&
        canvasX <= bounds.x + bounds.width + 10 &&
        canvasY >= bounds.y - 20 &&
        canvasY <= bounds.y + bounds.height + 10
      ) {
        return i;
      }
    }
    return -1;
  };

  // ---- Mouse events ----
  const onCanvasMouseDown = (evt) => {
    if (!canvasRef.value) return;
    const pos = getCanvasPos(evt, canvasRef.value);

    const hitIdx = hitTestSection(pos.x, pos.y);
    if (hitIdx >= 0) {
      selectSection(hitIdx);
      dragging.value = true;
      dragType.value = "section";
      dragStartCanvasX.value = pos.x;
      dragStartCanvasY.value = pos.y;
      const sec = config.value.sections[hitIdx];
      dragStartPercentX.value = sec.percentX;
      dragStartPercentY.value = sec.percentY;
    } else {
      selectedIndex.value = -1;
      drawPreview();

      // Paneo con arrastre de ratón en espacio libre
      if (scrollContainer.value) {
        dragType.value = "pan";
        isPanning.value = true;
        panStartClientX = evt.clientX;
        panStartClientY = evt.clientY;
        panStartScrollLeft = scrollContainer.value.scrollLeft;
        panStartScrollTop = scrollContainer.value.scrollTop;
      }
    }
  };

  const onCanvasMouseMove = (evt) => {
    if (!canvasRef.value) return;

    if (dragType.value === "pan" && isPanning.value && scrollContainer.value) {
      const dx = evt.clientX - panStartClientX;
      const dy = evt.clientY - panStartClientY;
      scrollContainer.value.scrollLeft = panStartScrollLeft - dx;
      scrollContainer.value.scrollTop = panStartScrollTop - dy;
      return;
    }

    if (dragging.value) {
      if (dragType.value === "section" && selectedSection.value) {
        const pos = getCanvasPos(evt, canvasRef.value);
        const d = dims.value;
        const dx = pos.x - dragStartCanvasX.value;
        const dy = pos.y - dragStartCanvasY.value;
        const newPX = Math.max(
          0,
          Math.min(95, dragStartPercentX.value + (dx / d.width) * 100)
        );
        const newPY = Math.max(
          0,
          Math.min(95, dragStartPercentY.value + (dy / d.height) * 100)
        );
        selectedSection.value.percentX = parseFloat(newPX.toFixed(2));
        selectedSection.value.percentY = parseFloat(newPY.toFixed(2));
        drawPreview();
      }
    } else {
      const pos = getCanvasPos(evt, canvasRef.value);
      hoverSectionIdx.value = hitTestSection(pos.x, pos.y);
    }
  };

  const onCanvasMouseUp = () => {
    if (dragType.value === "pan") {
      dragType.value = null;
      isPanning.value = false;
      return;
    }

    if (
      dragging.value &&
      dragType.value === "section" &&
      selectedSection.value
    ) {
      clampToScannableArea();
      drawPreview();
    }
    dragging.value = false;
    dragType.value = null;
    isPanning.value = false;
  };

  // ---- Touch events (Pinch to Zoom & Touch Pan) ----
  const onCanvasTouchStart = (evt) => {
    if (!canvasRef.value) return;

    // 1. Gesto de dos dedos: Pellizco (Pinch-to-zoom)
    if (evt.touches.length === 2) {
      isPinching = true;
      dragging.value = false;
      dragType.value = null;
      isPanning.value = false;

      const t1 = evt.touches[0];
      const t2 = evt.touches[1];
      initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialPinchZoom = zoom.value;
      return;
    }

    // 2. Gesto de un solo dedo
    if (evt.touches.length === 1) {
      const touch = evt.touches[0];
      const pos = getCanvasPos(touch, canvasRef.value);
      const hitIdx = hitTestSection(pos.x, pos.y);

      if (hitIdx >= 0) {
        selectSection(hitIdx);
        dragging.value = true;
        dragType.value = "section";
        dragStartCanvasX.value = pos.x;
        dragStartCanvasY.value = pos.y;
        const sec = config.value.sections[hitIdx];
        dragStartPercentX.value = sec.percentX;
        dragStartPercentY.value = sec.percentY;
      } else {
        // Paneo táctil con 1 dedo sobre el lienzo o contenedor
        selectedIndex.value = -1;
        drawPreview();

        if (scrollContainer.value) {
          dragType.value = "pan";
          isPanning.value = true;
          panStartClientX = touch.clientX;
          panStartClientY = touch.clientY;
          panStartScrollLeft = scrollContainer.value.scrollLeft;
          panStartScrollTop = scrollContainer.value.scrollTop;
        }
      }
    }
  };

  const onCanvasTouchMove = async (evt) => {
    if (!canvasRef.value) return;

    // Pellizco activo con 2 dedos
    if (evt.touches.length === 2 && isPinching) {
      const t1 = evt.touches[0];
      const t2 = evt.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const focalX = (t1.clientX + t2.clientX) / 2;
      const focalY = (t1.clientY + t2.clientY) / 2;

      if (initialPinchDist > 0) {
        const scale = currentDist / initialPinchDist;
        const targetZoom = Math.max(0.1, Math.min(3.0, initialPinchZoom * scale));
        await zoomAtPoint(targetZoom, focalX, focalY);
      }
      return;
    }

    // Paneo con 1 dedo
    if (dragType.value === "pan" && scrollContainer.value && evt.touches[0]) {
      const touch = evt.touches[0];
      const dx = touch.clientX - panStartClientX;
      const dy = touch.clientY - panStartClientY;
      scrollContainer.value.scrollLeft = panStartScrollLeft - dx;
      scrollContainer.value.scrollTop = panStartScrollTop - dy;
      return;
    }

    // Arrastre de sección con 1 dedo
    if (dragType.value === "section" && selectedSection.value && evt.touches[0]) {
      const touch = evt.touches[0];
      const pos = getCanvasPos(touch, canvasRef.value);
      const d = dims.value;
      const dx = pos.x - dragStartCanvasX.value;
      const dy = pos.y - dragStartCanvasY.value;
      const newPX = Math.max(
        0,
        Math.min(95, dragStartPercentX.value + (dx / d.width) * 100)
      );
      const newPY = Math.max(
        0,
        Math.min(95, dragStartPercentY.value + (dy / d.height) * 100)
      );
      selectedSection.value.percentX = parseFloat(newPX.toFixed(2));
      selectedSection.value.percentY = parseFloat(newPY.toFixed(2));
      drawPreview();
    }
  };

  const onCanvasTouchEnd = (evt) => {
    if (evt.touches.length < 2) {
      isPinching = false;
    }
    if (evt.touches.length === 0) {
      if (dragType.value === "pan") {
        dragType.value = null;
        isPanning.value = false;
        return;
      }
      if (
        dragging.value &&
        dragType.value === "section" &&
        selectedSection.value
      ) {
        clampToScannableArea();
        drawPreview();
      }
      dragging.value = false;
      dragType.value = null;
      isPanning.value = false;
    }
  };

  return {
    canvasRef,
    scrollContainer,
    zoom,
    dragging,
    isPanning,
    hoverSectionIdx,
    fitZoom,
    adjustZoom,
    zoomAtPoint,
    onWheel,
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
    onCanvasTouchStart,
    onCanvasTouchMove,
    onCanvasTouchEnd,
  };
}
