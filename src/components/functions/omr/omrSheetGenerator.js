import { jsPDF } from "jspdf";

/**
 * omrSheetGenerator.js
 * High-resolution canvas renderer and generator for printable OMR sheets.
 */

// Canvas dimensions for high-resolution rendering (A4 aspect ratio at ~150dpi)
export const CANVAS_PORTRAIT = { width: 1240, height: 1754 };

// Fixed reserved zones margin ratio
const ANCHOR_MARGIN_RATIO_X = 0.06;
const ANCHOR_MARGIN_RATIO_Y = 0.06;
const HEADER_HEIGHT = 60;
export const MARKER_SIZE = 54;

/**
 * Draws the 4 concentric square anchor markers required by imageProcessor.js findAndLabelMarkers
 */
export function drawConcentricSquareMarker(
  ctx,
  cx,
  cy,
  outerSize = MARKER_SIZE,
) {
  const midSize = Math.round(outerSize * 0.65);
  const innerSize = Math.round(outerSize * 0.36);

  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.fillRect(cx - outerSize / 2, cy - outerSize / 2, outerSize, outerSize);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - midSize / 2, cy - midSize / 2, midSize, midSize);

  ctx.fillStyle = "#000000";
  ctx.fillRect(cx - innerSize / 2, cy - innerSize / 2, innerSize, innerSize);
  ctx.restore();
}

/**
 * Returns anchor pixel positions based on canvas dimensions
 * @param {number} width
 * @param {number} height
 * @param {object} margins - optional { top, bottom, left, right } in pixels
 */
export function getAnchorPositions(width, height, margins) {
  const defaultMarginX = width * ANCHOR_MARGIN_RATIO_X;
  const defaultMarginY = height * ANCHOR_MARGIN_RATIO_Y;
  const left = margins?.left !== undefined ? margins.left : defaultMarginX;
  const right = margins?.right !== undefined ? margins.right : defaultMarginX;
  const top =
    margins?.top !== undefined ? margins.top : HEADER_HEIGHT + defaultMarginY;
  const bottom =
    margins?.bottom !== undefined ? margins.bottom : defaultMarginY;
  return {
    TL: { x: left, y: top },
    TR: { x: width - right, y: top },
    BL: { x: left, y: height - bottom },
    BR: { x: width - right, y: height - bottom },
  };
}

/**
 * Returns the scannable area: the rectangle INSIDE the 4 corner markers.
 * Sections placed here will be correctly detected by the OMR scanner.
 * @param {number} width
 * @param {number} height
 * @param {object} margins - optional { top, bottom, left, right } in pixels
 * @param {number} markerSize - size of the corner markers in pixels
 */
export function getScannableBounds(
  width,
  height,
  margins,
  markerSize = MARKER_SIZE,
) {
  const anchors = getAnchorPositions(width, height, margins);
  const half = markerSize / 2;
  return {
    x: anchors.TL.x + half,
    y: anchors.TL.y + half,
    width: anchors.TR.x - anchors.TL.x - markerSize,
    height: anchors.BL.y - anchors.TL.y - markerSize,
  };
}

/**
 * Returns the reserved zone rectangles that sections cannot overlap
 * @param {number} width
 * @param {number} height
 * @param {object} margins - optional { top, bottom, left, right } in pixels
 */
export function getReservedZones(
  width,
  height,
  margins,
  markerSize = MARKER_SIZE,
) {
  const anchors = getAnchorPositions(width, height, margins);
  const half = markerSize / 2 + 18;
  return [
    // Header strip
    { x: 0, y: 0, w: width, h: HEADER_HEIGHT + 10 },
    // Corner anchor zones
    {
      x: anchors.TL.x - half,
      y: anchors.TL.y - half,
      w: half * 2,
      h: half * 2,
    },
    {
      x: anchors.TR.x - half,
      y: anchors.TR.y - half,
      w: half * 2,
      h: half * 2,
    },
    {
      x: anchors.BL.x - half,
      y: anchors.BL.y - half,
      w: half * 2,
      h: half * 2,
    },
    {
      x: anchors.BR.x - half,
      y: anchors.BR.y - half,
      w: half * 2,
      h: half * 2,
    },
  ];
}

/**
 * Draws a dotted OMR bubble (unfilled with spaced dashes along border so OpenCV thresholding ignores it)
 */
export function drawDottedBubble(ctx, cx, cy, radius, strokeColor = "#333333") {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

/**
 * Calculates the pixel bounds of a section, given its config and canvas dims.
 * Returns { x, y, width, height } - the bounding box used for hit-testing and selection.
 */
export function getSectionBounds(sec, dims) {
  const startX = (sec.percentX / 100) * dims.width;
  const startY = (sec.percentY / 100) * dims.height;

  if (sec.type === "instruction") {
    const width = sec.widthPx || Math.round(dims.width * 0.85);
    const height = sec.heightPx || 90;
    return { x: startX, y: startY, width, height };
  }

  if (sec.type === "code") {
    const cols = sec.digits || 6;
    const cellSize = sec.cellSize || 36;
    const colSpacing = sec.colSpacing || cellSize + 20;
    const bubbleRowSpacing = sec.rowSpacing || 38;
    const totalWidth = (cols - 1) * colSpacing + cellSize;
    const matrixStartY = startY + cellSize + 32;
    const totalHeight = matrixStartY - startY + 10 * bubbleRowSpacing + 10;
    return { x: startX, y: startY, width: totalWidth, height: totalHeight };
  }

  const labelsXOffset = sec.showLabels ? sec.labelWidth || 60 : 0;
  const cols = sec.cols || 1;
  const rows = sec.rows || 1;
  const colSpacing = sec.colSpacing || 40;
  const rowSpacing = sec.rowSpacing || 32;
  const radius = sec.radius || 12;

  if (sec.type === "multiselect") {
    // Si tiene título, el texto inicia en el margen de preguntas (9.0% del ancho)
    const titleMarginX = dims.width * 0.09;
    const titleTopOffset = sec.title ? 28 : 8; // espacio superior para el título
    const boxX = sec.title ? Math.min(startX, titleMarginX) : startX;

    // Calcular centros y extremos de burbujas
    const colWidth = Math.max(radius * 2, colSpacing);
    const lastColCenterX =
      startX + labelsXOffset + (cols - 1) * colWidth + colWidth / 2;

    // Límite derecho del área segura (scannable bounds)
    const rightMargin =
      dims.margins?.right !== undefined
        ? dims.margins.right
        : dims.width * ANCHOR_MARGIN_RATIO_X;
    const ms = dims.markerSize || MARKER_SIZE;
    const maxSafeRight = dims.width - rightMargin - ms / 2;

    const rawBoxRight = lastColCenterX + radius + 2;
    const boxRight = Math.min(rawBoxRight, maxSafeRight - 4);
    const totalW = Math.max(boxRight - boxX, 100);

    const boxY = startY - titleTopOffset;
    const totalHeight = titleTopOffset + (rows - 1) * rowSpacing + radius + 8;

    return { x: boxX, y: boxY, width: totalW, height: totalHeight };
  }

  // Question type: column width based on colSpacing, labels wrap within
  const padX = 6;
  const lineHeight = 14;
  const headerPadding = 12;
  const columnGroups = sec.columnGroups || 1;
  const groupGap = 50;

  // Single group width
  const groupWidth = cols * colSpacing;
  const totalW =
    labelsXOffset + columnGroups * groupWidth + (columnGroups - 1) * groupGap;

  // Approximate max header lines
  let maxHeaderLines = 1;
  for (let c = 0; c < cols; c++) {
    const label =
      sec.labels && sec.labels[c] ? String(sec.labels[c]) : String(c + 1);
    const colW = Math.max(radius * 2, colSpacing);
    const maxLabelW = label.length * 7;
    const availW = colW - padX;
    const approxLines = Math.max(1, Math.ceil(maxLabelW / availW));
    if (approxLines > maxHeaderLines) maxHeaderLines = approxLines;
  }

  const colHeaderH = sec.showLabels
    ? maxHeaderLines * lineHeight + headerPadding
    : 12;
  const rowsPerGroup = Math.ceil(rows / columnGroups);

  const titleOffset = sec.title ? 18 : 0;
  const boxY = startY - titleOffset;
  const totalHeight =
    titleOffset +
    colHeaderH +
    (rowsPerGroup - 1) * rowSpacing +
    radius * 2 +
    10;

  return { x: startX, y: boxY, width: totalW, height: totalHeight };
}

/**
 * Renders the entire OMR sheet onto a canvas
 */
export function renderSheet(canvas, config, options = {}) {
  const {
    isPreview = false,
    selectedSectionIndex = -1,
    dims: canvasDims,
    markerSize: markerSizeOpt,
    renderMode: optRenderMode,
  } = options;
  const { sections = [] } = config;
  const markerSize = markerSizeOpt || config.markerSize || MARKER_SIZE;
  const renderMode = optRenderMode || config.renderMode || "full";
  const isBubblesOnly = renderMode === "bubbles_only";

  const canvasWidth = canvasDims?.width || CANVAS_PORTRAIT.width;
  const canvasHeight = canvasDims?.height || CANVAS_PORTRAIT.height;

  const margins = {
    left:
      config.margins?.left !== undefined
        ? config.margins.left
        : canvasWidth * ANCHOR_MARGIN_RATIO_X,
    right:
      config.margins?.right !== undefined
        ? config.margins.right
        : canvasWidth * ANCHOR_MARGIN_RATIO_X,
    top:
      config.margins?.top !== undefined
        ? config.margins.top
        : HEADER_HEIGHT + canvasHeight * ANCHOR_MARGIN_RATIO_Y,
    bottom:
      config.margins?.bottom !== undefined
        ? config.margins.bottom
        : canvasHeight * ANCHOR_MARGIN_RATIO_Y,
  };

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Fondo personalizado externo (subido desde Canva, Illustrator, etc.)
  if (
    config.backgroundImageElement &&
    config.backgroundImageElement.complete &&
    config.backgroundImageElement.naturalWidth !== 0
  ) {
    ctx.drawImage(
      config.backgroundImageElement,
      0,
      0,
      canvasWidth,
      canvasHeight
    );
  }

  // 1. Top Orientation Header (solo si no es modo limpio para edición externa y no hay fondo personalizado)
  if (!isBubblesOnly && !config.backgroundImage) {
    ctx.save();
    ctx.fillStyle = "#111111";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("▲  PARTE SUPERIOR / ARRIBA  ▲", canvasWidth / 2, 40);
    ctx.strokeStyle = "#bbbbbb";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(50, 55);
    ctx.lineTo(canvasWidth - 50, 55);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Concentric Anchor Markers
  const anchors = getAnchorPositions(canvasWidth, canvasHeight, margins);
  drawConcentricSquareMarker(ctx, anchors.TL.x, anchors.TL.y, markerSize);
  drawConcentricSquareMarker(ctx, anchors.TR.x, anchors.TR.y, markerSize);
  drawConcentricSquareMarker(ctx, anchors.BL.x, anchors.BL.y, markerSize);
  drawConcentricSquareMarker(ctx, anchors.BR.x, anchors.BR.y, markerSize);

  // 3. Preview reserved zone overlays
  if (isPreview) {
    ctx.save();
    ctx.fillStyle = "rgba(239, 68, 68, 0.07)";
    ctx.strokeStyle = "rgba(239, 68, 68, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    getReservedZones(canvasWidth, canvasHeight, margins, markerSize).forEach(
      (z) => {
        ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.strokeRect(z.x, z.y, z.w, z.h);
      },
    );
    ctx.restore();

    // Scannable area border (red dashed rectangle inside the 4 markers)
    const area = getScannableBounds(
      canvasWidth,
      canvasHeight,
      margins,
      markerSize,
    );
    ctx.save();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(area.x, area.y, area.width, area.height);
    ctx.restore();
  }

  // 4. Render each section
  const dims = {
    width: canvasWidth,
    height: canvasHeight,
    margins,
    markerSize,
  };
  sections.forEach((sec, idx) => {
    renderSection(ctx, sec, dims, {
      isSelected: isPreview && selectedSectionIndex === idx,
      isBubblesOnly,
    });
  });
}

/**
 * Renders an individual section
 */
function renderSection(ctx, sec, dims, options = {}) {
  const { isSelected = false, isBubblesOnly = false } = options;
  const bounds = getSectionBounds(sec, dims);

  ctx.save();

  // Selection highlight
  if (isSelected) {
    ctx.fillStyle = "rgba(37, 99, 235, 0.06)";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);

    let hlX = bounds.x - 6;
    let hlY = bounds.y - 6;
    let hlW = bounds.width + 12;
    let hlH = bounds.height + 12;

    const rightMargin =
      dims.margins?.right !== undefined
        ? dims.margins.right
        : dims.width * ANCHOR_MARGIN_RATIO_X;
    const leftMargin =
      dims.margins?.left !== undefined
        ? dims.margins.left
        : dims.width * ANCHOR_MARGIN_RATIO_X;
    const ms = dims.markerSize || MARKER_SIZE;
    const maxSafeRight = dims.width - rightMargin - ms / 2;
    const minSafeLeft = leftMargin + ms / 2;

    // Asegurar que el recuadro azul no sobrepase el área segura roja
    if (hlX + hlW > maxSafeRight - 2) {
      hlW = Math.max(10, maxSafeRight - 2 - hlX);
    }
    if (hlX < minSafeLeft + 2) {
      const diff = minSafeLeft + 2 - hlX;
      hlX = minSafeLeft + 2;
      hlW = Math.max(10, hlW - diff);
    }

    ctx.fillRect(hlX, hlY, hlW, hlH);
    ctx.strokeRect(hlX, hlY, hlW, hlH);
    ctx.setLineDash([]);
  }

  ctx.restore();

  if (sec.type === "code") {
    renderCodeSection(ctx, sec, dims, options);
  } else if (sec.type === "instruction") {
    if (!isBubblesOnly) {
      renderInstructionSection(ctx, sec, dims);
    }
  } else {
    renderQuestionSection(ctx, sec, dims, options);
  }
}

/**
 * Renders the special code/identification section:
 * - 1 row of handwriting squares (one per digit)
 * - 10 rows of bubbles (0-9) aligned below each square
 */
function renderCodeSection(ctx, sec, dims) {
  const startX = (sec.percentX / 100) * dims.width;
  const startY = (sec.percentY / 100) * dims.height;

  const digits = sec.digits || 6;
  const cellSize = sec.cellSize || 36;
  const colSpacing = sec.colSpacing || cellSize + 20;
  const bubbleRowSpacing = sec.rowSpacing || 38;
  const bubbleRadius = sec.radius || 10;

  const digitLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  ctx.save();

  // Section title
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(sec.title || "Código de Identificación", startX, startY - 6);

  // --- Row 1: Handwriting squares ---
  for (let d = 0; d < digits; d++) {
    const cx = startX + d * colSpacing;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(cx, startY, cellSize, cellSize);
  }

  // Bubble matrix starts below the handwriting row (more space)
  const matrixStartY = startY + cellSize + 32;

  // Digit column header labels (1-9,0) on the left side
  for (let row = 0; row < 10; row++) {
    const by = matrixStartY + row * bubbleRowSpacing;

    // Row digit label (left side)
    ctx.fillStyle = "#475569";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(digitLabels[row], startX - 6, by + 4);

    // Bubbles: one per digit column, aligned with writing square above
    for (let d = 0; d < digits; d++) {
      // Center bubble under the writing square
      const bx = startX + d * colSpacing + cellSize / 2;
      drawDottedBubble(ctx, bx, by, bubbleRadius);
    }
  }

  // Tick marks connecting each writing cell to its bubble column (subtle guide lines)
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 0.8;
  ctx.setLineDash([2, 3]);
  for (let d = 0; d < digits; d++) {
    const bx = startX + d * colSpacing + cellSize / 2;
    ctx.beginPath();
    ctx.moveTo(bx, startY + cellSize);
    ctx.lineTo(bx, matrixStartY - 6);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders an instruction / free-text block on the sheet
 */
function renderInstructionSection(ctx, sec, dims) {
  const startX = (sec.percentX / 100) * dims.width;
  const startY = (sec.percentY / 100) * dims.height;
  const width = sec.widthPx || Math.round(dims.width * 0.85);
  const height = sec.heightPx || 90;

  ctx.save();
  // Card background
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  ctx.fillRect(startX, startY, width, height);
  ctx.strokeRect(startX, startY, width, height);

  // Title
  let textY = startY + 18;
  if (sec.title) {
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(sec.title, startX + 12, textY);
    textY += 16;
  }

  // Content
  if (sec.content) {
    ctx.fillStyle = "#334155";
    ctx.font = `${sec.fontSize || 11}px sans-serif`;
    ctx.textAlign = "left";
    drawWrappedText(ctx, sec.content, startX + 12, textY, width - 24, 15);
  }

  ctx.restore();
}

/**
 * Renders a question or multiselect section
 */
function renderQuestionSection(ctx, sec, dims, options = {}) {
  const { isBubblesOnly = false } = options;
  const startX = (sec.percentX / 100) * dims.width;
  const startY = (sec.percentY / 100) * dims.height;

  const rows = sec.rows || 1;
  const cols = sec.cols || 1;
  const radius = sec.radius || 11;
  const colSpacing = sec.colSpacing || 42;
  const rowSpacing = sec.rowSpacing || 32;
  const isQuestionnaire = sec.layoutMode === "questionnaire";
  const defaultLabelWidth = isQuestionnaire ? 280 : 60;
  const labelsXOffset = sec.showLabels
    ? sec.labelWidth || defaultLabelWidth
    : 0;

  ctx.save();

  if (sec.type === "multiselect") {
    // ---- MULTISELECT: colSpacing as column width, labels wrap ----
    const lineHeight = 11;
    const padX = 6;

    ctx.font = "10px sans-serif";

    // Column width = colSpacing (same as question type)
    const colWidths = [];
    for (let c = 0; c < cols; c++) {
      colWidths[c] = Math.max(radius * 2, colSpacing);
    }

    // Calculate column center X positions
    const colCentersX = [];
    let curX = startX + labelsXOffset;
    for (let c = 0; c < cols; c++) {
      colCentersX[c] = curX + colWidths[c] / 2;
      curX += colWidths[c];
    }

    // Section title
    if (sec.title && !isBubblesOnly) {
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 13.5px sans-serif";
      ctx.textAlign = "left";
      const titleStartX = dims.width * 0.09; // Alineado con el margen izquierdo de las preguntas
      ctx.fillText(sec.title, titleStartX, startY - 18);
    }

    const gridStartY = startY;

    for (let r = 0; r < rows; r++) {
      const cy = gridStartY + r * rowSpacing;

      for (let c = 0; c < cols; c++) {
        const cx = colCentersX[c];
        const cellLabel = sec.labels && sec.labels[r] && sec.labels[r][c];

        // Label rendered to the left of the bubble
        if (cellLabel && !isBubblesOnly) {
          ctx.fillStyle = "#1e293b";
          ctx.font = "10.5px sans-serif";
          ctx.textAlign = "right";
          const maxW = colWidths[c] - radius * 2 - padX;
          drawWrappedText(
            ctx,
            String(cellLabel),
            cx - radius - 6,
            cy - 2,
            maxW,
            lineHeight,
          );
        }

        drawDottedBubble(ctx, cx, cy, radius);
      }
    }
  } else {
    // ---- QUESTION: column headers + row labels + bubble grid ----
    const padX = 6;
    const columnGroups = sec.columnGroups || 1;
    const groupGap = 50;

    ctx.font = "12px sans-serif";

    // Column width is based on colSpacing (bubble-to-bubble distance)
    const colWidths = [];
    for (let c = 0; c < cols; c++) {
      const minW = radius * 2;
      colWidths[c] = Math.max(minW, colSpacing);
    }

    // Single group width (one set of columns)
    const groupWidth = cols * colSpacing;

    // Section title
    if (sec.title && !isBubblesOnly) {
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(sec.title, startX, startY - 8);
    }

    // Calculate max header lines across all groups
    let maxHeaderLines = 1;
    if (sec.showLabels && sec.labels && sec.labels.length > 0) {
      ctx.font = "12px sans-serif";
      for (let c = 0; c < cols; c++) {
        const label = sec.labels[c] || String(c + 1);
        const maxW = colWidths[c] - padX;
        const lines = measureWrappedLines(ctx, String(label), maxW);
        if (lines > maxHeaderLines) maxHeaderLines = lines;
      }
    }

    const lineHeight = 14;
    const headerPadding = 12;
    const headerGap = sec.showLabels
      ? maxHeaderLines * lineHeight + headerPadding
      : 12;
    const gridStartY = startY + headerGap;

    // Rows per group
    const rowsPerGroup = Math.ceil(rows / columnGroups);

    for (let g = 0; g < columnGroups; g++) {
      const groupStartX = startX + labelsXOffset + g * (groupWidth + groupGap);

      // Column centers for this group
      const colCentersX = [];
      let curX = groupStartX;
      for (let c = 0; c < cols; c++) {
        colCentersX[c] = curX + colWidths[c] / 2;
        curX += colWidths[c];
      }

      // Column headers for this group
      if (
        sec.showLabels &&
        sec.labels &&
        sec.labels.length > 0 &&
        !isBubblesOnly
      ) {
        ctx.fillStyle = "#334155";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        for (let c = 0; c < cols; c++) {
          const label = sec.labels[c] || String(c + 1);
          const cx = colCentersX[c];
          const maxW = colWidths[c] - padX;
          drawWrappedText(ctx, String(label), cx, startY + 6, maxW, 14);
        }
      }

      // Rows for this group
      const groupStartRow = g * rowsPerGroup;
      const groupEndRow = Math.min(groupStartRow + rowsPerGroup, rows);

      for (let r = groupStartRow; r < groupEndRow; r++) {
        const localRow = r - groupStartRow;
        const cy = gridStartY + localRow * rowSpacing;
        const qNum = (sec.rowStart || 1) + r;

        // Row label or Questionnaire prompt
        if (sec.showLabels && !isBubblesOnly) {
          ctx.fillStyle = "#1e293b";
          if (
            isQuestionnaire &&
            sec.questionPrompts &&
            sec.questionPrompts[r]
          ) {
            ctx.font = "11.5px sans-serif";
            ctx.textAlign = "left";
            const prompt = `${
              sec.rowPrefix ? sec.rowPrefix + qNum + ". " : qNum + ". "
            }${sec.questionPrompts[r]}`;
            const maxW = (sec.labelWidth || defaultLabelWidth) - 20;
            drawWrappedText(ctx, prompt, startX, cy - 4, maxW, 14);

            // Línea divisoria horizontal sutil entre preguntas
            ctx.save();
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startX, cy + rowSpacing / 2 - 2);
            ctx.lineTo(groupStartX + groupWidth + 15, cy + rowSpacing / 2 - 2);
            ctx.stroke();
            ctx.restore();
          } else {
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "right";
            const rowLabel = sec.rowPrefix
              ? `${sec.rowPrefix}${qNum}`
              : `Q${qNum}`;
            const labelOffset = radius + 10;
            ctx.fillText(rowLabel, groupStartX - labelOffset, cy + 4);
          }
        }

        // Bubbles
        for (let c = 0; c < cols; c++) {
          const cx = colCentersX[c];
          drawDottedBubble(ctx, cx, cy, radius);
        }
      }
    }
  }

  ctx.restore();
}

/**
 * Simple word-wrap text helper for column headers
 */
function drawWrappedText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let lineY = y;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), cx, lineY);
      line = words[i] + " ";
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), cx, lineY);
}

/**
 * Counts how many lines a label will wrap to within maxWidth
 */
function measureWrappedLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  let line = "";
  let lines = 1;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      lines++;
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  return lines;
}

/**
 * Triggers browser download of canvas as PNG file
 */
export function downloadCanvasAsPNG(canvas, filename = "plantilla_omr.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers browser download of canvas as a standardized A4 PDF document
 */
export function downloadCanvasAsPDF(canvas, filename = "plantilla_omr.pdf") {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
  pdf.save(filename);
}

/**
 * Renderiza la plantilla base/guía para diseño externo (Canva, Illustrator, Photoshop, Word).
 * Contiene los marcadores de calibración de esquina y las guías del área segura,
 * pero SIN ninguna burbuja OMR para que el diseñador monte su diseño limpio.
 */
export function renderDesignGuideSheet(canvas, config, options = {}) {
  const canvasWidth =
    options.canvasWidth || config.canvasWidth || CANVAS_PORTRAIT.width;
  const canvasHeight =
    options.canvasHeight || config.canvasHeight || CANVAS_PORTRAIT.height;
  const markerSize = config.markerSize || MARKER_SIZE;
  const margins = {
    left:
      config.margins?.left !== undefined
        ? config.margins.left
        : canvasWidth * ANCHOR_MARGIN_RATIO_X,
    right:
      config.margins?.right !== undefined
        ? config.margins.right
        : canvasWidth * ANCHOR_MARGIN_RATIO_X,
    top:
      config.margins?.top !== undefined
        ? config.margins.top
        : HEADER_HEIGHT + canvasHeight * ANCHOR_MARGIN_RATIO_Y,
    bottom:
      config.margins?.bottom !== undefined
        ? config.margins.bottom
        : canvasHeight * ANCHOR_MARGIN_RATIO_Y,
  };

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Fondo blanco puro
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 1. Marcadores de esquina concéntricos obligatorios
  const anchors = getAnchorPositions(canvasWidth, canvasHeight, margins);
  drawConcentricSquareMarker(ctx, anchors.TL.x, anchors.TL.y, markerSize);
  drawConcentricSquareMarker(ctx, anchors.TR.x, anchors.TR.y, markerSize);
  drawConcentricSquareMarker(ctx, anchors.BL.x, anchors.BL.y, markerSize);
  drawConcentricSquareMarker(ctx, anchors.BR.x, anchors.BR.y, markerSize);

  // 2. Guía sutil del área de contenido
  const area = getScannableBounds(canvasWidth, canvasHeight, margins, markerSize);
  ctx.save();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(area.x, area.y, area.width, area.height);
  ctx.restore();

  // 3. Indicaciones para el diseñador
  ctx.save();
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "▲ ZONA SUPERIOR: Logos, membretes, título institucional y datos generales ▲",
    canvasWidth / 2,
    45
  );
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px sans-serif";
  ctx.fillText(
    "ÁREA SEGURA DE PREGUNTAS (Respeta los marcadores de las 4 esquinas sin moverlos)",
    canvasWidth / 2,
    area.y + 24
  );
  ctx.restore();
}

/**
 * Descarga la plantilla guía para diseño en formato PDF
 */
export function downloadDesignGuidePDF(config, filename = "plantilla_guia_diseno.pdf") {
  const canvas = document.createElement("canvas");
  renderDesignGuideSheet(canvas, config);
  downloadCanvasAsPDF(canvas, filename);
}

/**
 * Descarga la plantilla guía para diseño en formato PNG
 */
export function downloadDesignGuidePNG(config, filename = "plantilla_guia_diseno.png") {
  const canvas = document.createElement("canvas");
  renderDesignGuideSheet(canvas, config);
  downloadCanvasAsPNG(canvas, filename);
}

/**
 * Generates JSON template schema for the OMR scanner
 */
export function exportTemplateJSON(config, canvasDims) {
  const { name, sections, markerSize, margins: cfgMargins } = config;
  const dims = canvasDims || CANVAS_PORTRAIT;
  const margins = {
    left:
      cfgMargins?.left !== undefined
        ? cfgMargins.left
        : dims.width * ANCHOR_MARGIN_RATIO_X,
    right:
      cfgMargins?.right !== undefined
        ? cfgMargins.right
        : dims.width * ANCHOR_MARGIN_RATIO_X,
    top:
      cfgMargins?.top !== undefined
        ? cfgMargins.top
        : HEADER_HEIGHT + dims.height * ANCHOR_MARGIN_RATIO_Y,
    bottom:
      cfgMargins?.bottom !== undefined
        ? cfgMargins.bottom
        : dims.height * ANCHOR_MARGIN_RATIO_Y,
  };

  const anchors = getAnchorPositions(dims.width, dims.height, margins);
  const spanX = Math.max(anchors.TR.x - anchors.TL.x, 1);
  const spanY = Math.max(anchors.BL.y - anchors.TL.y, 1);

  // Funciones de mapeo a coordenadas relativas al marco de los marcadores OMR
  const toPctX = (px) =>
    parseFloat((((px - anchors.TL.x) / spanX) * 100).toFixed(2));
  const toPctY = (py) =>
    parseFloat((((py - anchors.TL.y) / spanY) * 100).toFixed(2));

  const formattedSections = sections.map((sec, i) => {
    const startX = (sec.percentX / 100) * dims.width;
    const startY = (sec.percentY / 100) * dims.height;

    if (sec.type === "instruction") {
      return {
        type: "instruction",
        name: sec.name || `instruccion${i + 1}`,
        title: sec.title || "",
        content: sec.content || "",
        circles: null,
      };
    }

    if (sec.type === "code") {
      const digits = sec.digits || 6;
      const cellSize = sec.cellSize || 36;
      const colSpacing = sec.colSpacing || cellSize + 20;
      const bubbleRowSpacing = sec.rowSpacing || 38;
      const matrixStartY = startY + cellSize + 32;
      const firstBx = startX + cellSize / 2;
      const lastBx = startX + (digits - 1) * colSpacing + cellSize / 2;
      const firstBy = matrixStartY;
      const lastBy = matrixStartY + 9 * bubbleRowSpacing;

      return {
        type: "code",
        name: sec.name || "codigo",
        rows: 10,
        cols: digits,
        digits: digits,
        circles: {
          CTL: { percent_x: toPctX(firstBx), percent_y: toPctY(firstBy) },
          CTR: { percent_x: toPctX(lastBx), percent_y: toPctY(firstBy) },
          CBL: { percent_x: toPctX(firstBx), percent_y: toPctY(lastBy) },
          CBR: { percent_x: toPctX(lastBx), percent_y: toPctY(lastBy) },
        },
        radius: sec.radius || 10,
        labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      };
    }

    const isQuestionnaire = sec.layoutMode === "questionnaire";
    const defaultLabelWidth = isQuestionnaire ? 280 : 60;
    const labelsXOffset = sec.showLabels
      ? sec.labelWidth || defaultLabelWidth
      : 0;
    const radius = sec.radius || 11;
    const colSpacing = sec.colSpacing || 40;
    const rowSpacing = sec.rowSpacing || 32;

    if (sec.type === "multiselect") {
      // Column width = colSpacing (same as rendering)
      const colWidths = [];
      for (let c = 0; c < sec.cols; c++) {
        colWidths[c] = Math.max(radius * 2, colSpacing);
      }
      const colCentersX = [];
      let curX = startX + labelsXOffset;
      for (let c = 0; c < sec.cols; c++) {
        colCentersX[c] = curX + colWidths[c] / 2;
        curX += colWidths[c];
      }

      const lastRowIdx = Math.max(0, sec.rows - 1);
      const gridStartY = startY;
      const firstRowCy = gridStartY;
      const lastRowCy = gridStartY + lastRowIdx * rowSpacing;
      const firstBx = colCentersX[0];
      const lastBx = colCentersX[sec.cols - 1];

      return {
        type: sec.type || "question",
        name: sec.name || `seccion${i + 1}`,
        rows: sec.rows,
        cols: sec.cols,
        circles: {
          CTL: { percent_x: toPctX(firstBx), percent_y: toPctY(firstRowCy) },
          CTR: { percent_x: toPctX(lastBx), percent_y: toPctY(firstRowCy) },
          CBL: { percent_x: toPctX(firstBx), percent_y: toPctY(lastRowCy) },
          CBR: { percent_x: toPctX(lastBx), percent_y: toPctY(lastRowCy) },
        },
        radius: sec.radius,
        chartType: sec.chartType || "radar",
        labels: sec.labels || [],
      };
    }

    // Question type (default): column width based on colSpacing, labels wrap within
    const padX = 6;
    const lineHeight = 14;
    const headerPadding = 12;
    const columnGroups = sec.columnGroups || 1;
    const groupGap = 50;

    // Calculate dynamic header height (labels wrap within colSpacing width)
    const colWidths = [];
    let maxHeaderLines = 1;
    for (let c = 0; c < sec.cols; c++) {
      const colW = Math.max(radius * 2, sec.colSpacing || 40);
      colWidths[c] = colW;
      const label =
        sec.labels && sec.labels[c] ? String(sec.labels[c]) : String(c + 1);
      const maxLabelW = label.length * 7;
      const availW = colW - padX;
      const approxLines = Math.max(1, Math.ceil(maxLabelW / availW));
      if (approxLines > maxHeaderLines) maxHeaderLines = approxLines;
    }
    const colHeaderH = sec.showLabels
      ? maxHeaderLines * lineHeight + headerPadding
      : 12;
    const rowsPerGroup = Math.ceil(sec.rows / columnGroups);
    const gridStartY = startY + colHeaderH;

    // First group column centers
    const firstGroupStartX = startX + labelsXOffset;
    const firstBubbleCenterX = firstGroupStartX + colWidths[0] / 2;
    const groupWidth = sec.cols * (sec.colSpacing || 40);

    // Last group last bubble center
    const lastGroupIdx = columnGroups - 1;
    const lastGroupStartX =
      startX + labelsXOffset + lastGroupIdx * (groupWidth + groupGap);
    let curLastX = lastGroupStartX;
    for (let c = 0; c < sec.cols - 1; c++) {
      curLastX += colWidths[c];
    }
    const lastBubbleCenterX = curLastX + colWidths[sec.cols - 1] / 2;

    const firstBubbleCenterY = gridStartY;
    const lastBubbleCenterY = gridStartY + (rowsPerGroup - 1) * sec.rowSpacing;

    return {
      type: sec.type || "question",
      layoutMode: sec.layoutMode || "compact",
      name: sec.name || `seccion${i + 1}`,
      rows: sec.rows,
      cols: sec.cols,
      columnGroups: columnGroups,
      rowStart: sec.rowStart || 1,
      circles: {
        CTL: {
          percent_x: toPctX(firstBubbleCenterX),
          percent_y: toPctY(firstBubbleCenterY),
        },
        CTR: {
          percent_x: toPctX(lastBubbleCenterX),
          percent_y: toPctY(firstBubbleCenterY),
        },
        CBL: {
          percent_x: toPctX(firstBubbleCenterX),
          percent_y: toPctY(lastBubbleCenterY),
        },
        CBR: {
          percent_x: toPctX(lastBubbleCenterX),
          percent_y: toPctY(lastBubbleCenterY),
        },
      },
      radius: sec.radius,
      chartType: sec.chartType || "stacked_bar",
      labels: sec.labels || [],
      questionPrompts: sec.questionPrompts || [],
    };
  });

  return {
    template_name: name || "Plantilla OMR Personalizada",
    marker_size: markerSize || MARKER_SIZE,
    margins: margins,
    sections: formattedSections,
  };
}
