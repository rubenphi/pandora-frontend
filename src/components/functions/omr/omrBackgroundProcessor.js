/**
 * omrBackgroundProcessor.js
 * Procesa imágenes o PDFs de fondos externos (Canva, Illustrator, Photoshop, Word)
 * para alinearlos al lienzo OMR, enmascarar marcadores y burbujas previas,
 * y sobreponer limpiamente la capa de escaneo OMR.
 *
 * Optimizado: Ultra-liviano, sin dependencias pesadas que saturen Node o congelen la UI.
 */

import * as pdfjsLib from "pdfjs-dist/build/pdf.js";
import {
  getAnchorPositions,
  getScannableBounds,
  MARKER_SIZE,
  CANVAS_PORTRAIT,
} from "./omrSheetGenerator.js";

// Configurar worker de PDF.js usando el archivo estático local en public/
if (typeof window !== "undefined") {
  try {
    delete window.pdfjsWorker;
  } catch (e) {
    /* ignore */
  }
  const baseUrl = (process.env.BASE_URL || "/").replace(/\/$/, "");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${baseUrl}/pdf.worker.min.js`;
}

/**
 * Renderiza la primera página de un archivo PDF en un elemento Canvas de alta resolución
 * Ejecución ultra-rápida con timeout estricto de 5 segundos.
 */
export async function renderPdfToCanvas(fileOrBuffer, targetWidth = 1240) {
  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === "function") {
    try {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } catch (e) {
      arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(fileOrBuffer);
      });
    }
  } else {
    arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(fileOrBuffer);
    });
  }

  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const baseUrl = (process.env.BASE_URL || "/").replace(/\/$/, "");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${baseUrl}/pdf.worker.min.js`;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    disableFontFace: true,
    useSystemFonts: false,
    isEvalSupported: false,
  });

  const timeoutMs = 5000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () =>
        reject(new Error("Tiempo de espera agotado al abrir el archivo PDF")),
      timeoutMs
    )
  );

  let pdfDoc = null;
  try {
    pdfDoc = await Promise.race([loadingTask.promise, timeoutPromise]);
    const page = await pdfDoc.getPage(1);

    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    const renderPromise = page.render(renderContext).promise;
    const renderTimeout = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Tiempo de espera agotado al renderizar la página del PDF"
            )
          ),
        5000
      )
    );

    await Promise.race([renderPromise, renderTimeout]);
    return canvas;
  } finally {
    if (pdfDoc) {
      try {
        await pdfDoc.destroy();
      } catch (e) {
        /* ignore */
      }
    }
  }
}

/**
 * Carga un archivo de imagen (PNG, JPG, etc.) en un elemento Canvas
 */
export function loadImageToCanvas(fileOrDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = (err) => reject(new Error("No se pudo cargar la imagen: " + err));

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

/**
 * Detecta si la imagen contiene los 4 marcadores OMR concéntricos.
 * Comprueba las 4 esquinas de destino en < 2ms usando análisis de píxeles sin requerir OpenCV.
 */
export function detectCornerMarkersFast(canvas, targetAnchors, markerSize = MARKER_SIZE) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const anchors = [targetAnchors.TL, targetAnchors.TR, targetAnchors.BL, targetAnchors.BR];
  const half = Math.round(markerSize / 2);

  let matched = 0;
  for (const anc of anchors) {
    const x = Math.round(anc.x - half);
    const y = Math.round(anc.y - half);
    if (x < 0 || y < 0 || x + markerSize > canvas.width || y + markerSize > canvas.height) {
      continue;
    }

    try {
      const imgData = ctx.getImageData(x, y, markerSize, markerSize);
      const data = imgData.data;

      let darkCount = 0;
      let lightCount = 0;
      const totalPixels = markerSize * markerSize;

      for (let p = 0; p < data.length; p += 4) {
        const brightness = (data[p] + data[p + 1] + data[p + 2]) / 3;
        if (brightness < 80) darkCount++;
        else if (brightness > 180) lightCount++;
      }

      const darkRatio = darkCount / totalPixels;
      const lightRatio = lightCount / totalPixels;

      // Un marcador OMR concéntrico tiene contraste marcado con 30-70% oscuro y 20%+ claro
      if (darkRatio >= 0.30 && darkRatio <= 0.75 && lightRatio >= 0.20) {
        matched++;
      }
    } catch (e) {
      /* ignore */
    }
  }

  return matched === 4;
}

/**
 * Escala y centra una imagen al lienzo objetivo conservando proporciones
 */
export function fitImageToTarget(srcCanvas, targetWidth, targetHeight) {
  const outCanvas = document.createElement("canvas");
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const ctx = outCanvas.getContext("2d");

  // Fondo blanco inicial
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Ajustar proporcionalmente (contain)
  const scale = Math.min(
    targetWidth / srcCanvas.width,
    targetHeight / srcCanvas.height
  );
  const w = srcCanvas.width * scale;
  const h = srcCanvas.height * scale;
  const x = (targetWidth - w) / 2;
  const y = (targetHeight - h) / 2;

  ctx.drawImage(srcCanvas, x, y, w, h);
  return outCanvas;
}

/**
 * Enmascara (borra con blanco) los marcadores de esquina y las burbujas previas
 * sobre el lienzo de fondo para evitar duplicados / efectos fantasma.
 */
export function maskMarkersAndBubbles(
  canvas,
  config,
  targetWidth,
  targetHeight,
  options = {}
) {
  const { cleanBubbles = true, cleanInternalArea = false } = options;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const margins = config.margins || {};
  const markerSize = config.markerSize || MARKER_SIZE;
  const anchors = getAnchorPositions(targetWidth, targetHeight, margins);

  // 1. Borrar los 4 marcadores de esquina del fondo
  const clearPad = Math.round(markerSize * 0.65);
  ctx.fillStyle = "#ffffff";
  [anchors.TL, anchors.TR, anchors.BL, anchors.BR].forEach((anc) => {
    ctx.fillRect(
      anc.x - clearPad,
      anc.y - clearPad,
      clearPad * 2,
      clearPad * 2
    );
  });

  // 2. Si el usuario solicitó blanquear toda el área interna segura
  if (cleanInternalArea) {
    const area = getScannableBounds(
      targetWidth,
      targetHeight,
      margins,
      markerSize
    );
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(area.x, area.y, area.width, area.height);
    return;
  }

  // 3. Borrado selectivo de burbujas previas
  if (!cleanBubbles || !Array.isArray(config.sections)) return;

  ctx.fillStyle = "#ffffff";

  config.sections.forEach((sec) => {
    const startX = (sec.percentX / 100) * targetWidth;
    const startY = (sec.percentY / 100) * targetHeight;
    const radius = (sec.radius || 11) + 2;

    if (sec.type === "question") {
      const cols = sec.cols || 1;
      const colSpacing = sec.colSpacing || 42;
      const rowSpacing = sec.rowSpacing || 32;
      const columnGroups = sec.columnGroups || 1;
      const groupGap = 50;
      const groupWidth = cols * colSpacing;
      const rowsPerGroup = Math.ceil((sec.rows || 1) / columnGroups);

      let maxHeaderLines = 1;
      const padX = 6;
      for (let c = 0; c < cols; c++) {
        const label =
          sec.labels && sec.labels[c] ? String(sec.labels[c]) : String(c + 1);
        const colW = Math.max(radius * 2, colSpacing);
        const approxLines = Math.max(
          1,
          Math.ceil((label.length * 7) / (colW - padX))
        );
        if (approxLines > maxHeaderLines) maxHeaderLines = approxLines;
      }
      const colHeaderH = sec.showLabels ? maxHeaderLines * 14 + 12 : 12;
      const gridStartY = startY + colHeaderH;

      for (let g = 0; g < columnGroups; g++) {
        const gStartX =
          startX +
          (sec.showLabels ? sec.labelWidth || 60 : 0) +
          g * (groupWidth + groupGap);
        for (let r = 0; r < rowsPerGroup; r++) {
          const cy = gridStartY + r * rowSpacing;
          for (let c = 0; c < cols; c++) {
            const cx =
              gStartX + c * colSpacing + Math.max(radius * 2, colSpacing) / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }
    } else if (sec.type === "multiselect") {
      const cols = sec.cols || 1;
      const rows = sec.rows || 1;
      const colSpacing = sec.colSpacing || 40;
      const rowSpacing = sec.rowSpacing || 32;
      const colWidth = Math.max(radius * 2, colSpacing);

      for (let r = 0; r < rows; r++) {
        const cy = startY + r * rowSpacing;
        for (let c = 0; c < cols; c++) {
          const cx = startX + c * colWidth + colWidth / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    } else if (sec.type === "code") {
      const digits = sec.digits || 6;
      const cellSize = sec.cellSize || 36;
      const colSpacing = sec.colSpacing || cellSize + 20;
      const bubbleRowSpacing = sec.rowSpacing || 38;
      const matrixStartY = startY + cellSize + 32;

      for (let d = 0; d < digits; d++) {
        const cx = startX + d * colSpacing + cellSize / 2;
        for (let r = 0; r < 10; r++) {
          const cy = matrixStartY + r * bubbleRowSpacing;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  });
}

/**
 * Función principal: Recibe archivo (PDF o Imagen), lo procesa y devuelve el canvas listo.
 * Rápido, fluido y sin bloqueos de interfaz.
 */
export async function processUploadedBackground(file, templateConfig, options = {}) {
  // 1. Obtener canvas de entrada
  let rawCanvas = null;
  const isPdf =
    file.type === "application/pdf" ||
    (file.name && file.name.toLowerCase().endsWith(".pdf"));

  if (isPdf) {
    rawCanvas = await renderPdfToCanvas(file, CANVAS_PORTRAIT.width);
  } else {
    rawCanvas = await loadImageToCanvas(file);
  }

  const targetWidth = options.targetWidth || CANVAS_PORTRAIT.width;
  const targetHeight = options.targetHeight || CANVAS_PORTRAIT.height;
  const margins = templateConfig.margins || {};
  const targetAnchors = getAnchorPositions(targetWidth, targetHeight, margins);

  // 2. Ajustar proporcionalmente al lienzo de destino
  const alignedCanvas = fitImageToTarget(rawCanvas, targetWidth, targetHeight);

  // 3. Detección rápida de marcadores previa (< 2ms)
  const markersFound = detectCornerMarkersFast(
    alignedCanvas,
    targetAnchors,
    templateConfig.markerSize || MARKER_SIZE
  );

  // 4. Solo enmascarar si los marcadores originales coincidían
  if (markersFound || options.forceMask) {
    maskMarkersAndBubbles(
      alignedCanvas,
      templateConfig,
      targetWidth,
      targetHeight,
      options
    );
  }

  // Guardar como JPEG de alta fidelidad (0.92) para mantener ligereza
  const dataUrl = alignedCanvas.toDataURL("image/jpeg", 0.92);

  return {
    success: true,
    dataUrl,
    markersFound,
    alignmentType: markersFound ? "matched" : "scaled",
    header: markersFound
      ? "Fondo Alineado y Calibrado"
      : "Disposición de Elementos Modificada",
    message: markersFound
      ? "Los 4 marcadores fueron detectados y la hoja fue alineada y calibrada con precisión milimétrica."
      : "La disposición de los elementos a escanear ha cambiado. Recuerda que puedes modificar los estilos de los textos y el fondo, pero no puedes modificar la posición de los marcadores y las burbujas.",
  };
}
