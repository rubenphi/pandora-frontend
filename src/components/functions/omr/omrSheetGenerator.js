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
const MARKER_SIZE = 40;

/**
 * Draws the 4 concentric square anchor markers required by imageProcessor.js findAndLabelMarkers
 */
export function drawConcentricSquareMarker(ctx, cx, cy, outerSize = MARKER_SIZE) {
  const midSize = Math.round(outerSize * 0.65);
  const innerSize = Math.round(outerSize * 0.35);

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
  const left = margins?.left ?? defaultMarginX;
  const right = margins?.right ?? defaultMarginX;
  const top = margins?.top ?? defaultMarginY;
  const bottom = margins?.bottom ?? defaultMarginY;
  return {
    TL: { x: left, y: HEADER_HEIGHT + top },
    TR: { x: width - right, y: HEADER_HEIGHT + top },
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
 */
export function getScannableBounds(width, height, margins) {
  const anchors = getAnchorPositions(width, height, margins);
  const half = MARKER_SIZE / 2;
  return {
    x: anchors.TL.x + half,
    y: anchors.TL.y + half,
    width: anchors.TR.x - anchors.TL.x - MARKER_SIZE,
    height: anchors.BL.y - anchors.TL.y - MARKER_SIZE,
  };
}

/**
 * Returns the reserved zone rectangles that sections cannot overlap
 * @param {number} width
 * @param {number} height
 * @param {object} margins - optional { top, bottom, left, right } in pixels
 */
export function getReservedZones(width, height, margins) {
  const anchors = getAnchorPositions(width, height, margins);
  const half = MARKER_SIZE / 2 + 18;
  return [
    // Header strip
    { x: 0, y: 0, w: width, h: HEADER_HEIGHT + 10 },
    // Corner anchor zones
    { x: anchors.TL.x - half, y: anchors.TL.y - half, w: half * 2, h: half * 2 },
    { x: anchors.TR.x - half, y: anchors.TR.y - half, w: half * 2, h: half * 2 },
    { x: anchors.BL.x - half, y: anchors.BL.y - half, w: half * 2, h: half * 2 },
    { x: anchors.BR.x - half, y: anchors.BR.y - half, w: half * 2, h: half * 2 },
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

  if (sec.type === "code") {
    const cols = sec.digits || 6;
    const cellSize = sec.cellSize || 36;
    const colSpacing = sec.colSpacing || (cellSize + 20);
    const bubbleRowSpacing = sec.rowSpacing || 38;
    const totalWidth = (cols - 1) * colSpacing + cellSize;
    const matrixStartY = startY + cellSize + 32;
    const totalHeight = (matrixStartY - startY) + 10 * bubbleRowSpacing + 10;
    return { x: startX, y: startY, width: totalWidth, height: totalHeight };
  }

  const labelsXOffset = sec.showLabels ? sec.labelWidth || 60 : 0;
  const cols = sec.cols || 1;
  const rows = sec.rows || 1;
  const colSpacing = sec.colSpacing || 40;
  const rowSpacing = sec.rowSpacing || 32;
  const radius = sec.radius || 12;

  if (sec.type === "multiselect") {
    const titleH = sec.title ? 24 : 0;
    const lineHeight = 11;
    const labelGap = 6;
    const padX = 6;

    // Column width = colSpacing
    let totalW = labelsXOffset;
    for (let c = 0; c < cols; c++) {
      const colW = Math.max(radius * 2, colSpacing);
      totalW += colW;
    }

    // Find tallest row by approximate label height
    let maxRowLabelLines = 1;
    for (let r = 0; r < rows; r++) {
      let rowLines = 1;
      for (let c = 0; c < cols; c++) {
        const label = sec.labels && sec.labels[r] && sec.labels[r][c];
        if (label) {
          const maxLabelW = String(label).length * 6;
          const availW = colSpacing - padX;
          const approxLines = Math.max(1, Math.ceil(maxLabelW / availW));
          if (approxLines > rowLines) rowLines = approxLines;
        }
      }
      if (rowLines > maxRowLabelLines) maxRowLabelLines = rowLines;
    }

    const tallestLabelH = maxRowLabelLines * lineHeight;
    const totalHeight = titleH + (rows - 1) * rowSpacing + tallestLabelH + labelGap + radius * 2 + 10;
    return { x: startX, y: startY, width: totalW, height: totalHeight };
  }

  // Question type: column width based on colSpacing, labels wrap within
  const titleH = sec.title ? 22 : 0;
  const padX = 6;
  const lineHeight = 14;
  const headerPadding = 12;
  const columnGroups = sec.columnGroups || 1;
  const groupGap = 50;

  // Single group width
  const groupWidth = cols * colSpacing;
  const totalW = labelsXOffset + columnGroups * groupWidth + (columnGroups - 1) * groupGap;

  // Approximate max header lines
  let maxHeaderLines = 1;
  for (let c = 0; c < cols; c++) {
    const label = sec.labels && sec.labels[c] ? String(sec.labels[c]) : String(c + 1);
    const colW = Math.max(radius * 2, colSpacing);
    const maxLabelW = label.length * 7;
    const availW = colW - padX;
    const approxLines = Math.max(1, Math.ceil(maxLabelW / availW));
    if (approxLines > maxHeaderLines) maxHeaderLines = approxLines;
  }

  const colHeaderH = sec.showLabels ? maxHeaderLines * lineHeight + headerPadding : 12;
  const rowsPerGroup = Math.ceil(rows / columnGroups);

  const totalHeight = titleH + colHeaderH + (rowsPerGroup - 1) * rowSpacing + radius * 2 + 10;

  return { x: startX, y: startY, width: totalW, height: totalHeight };
}

/**
 * Renders the entire OMR sheet onto a canvas
 */
export function renderSheet(canvas, config, options = {}) {
  const { isPreview = false, selectedSectionIndex = -1, margins: marginsOverride } = options;
  const { sections = [] } = config;
  const margins = marginsOverride || config.margins;

  // Dynamic canvas size based on margins
  const base = CANVAS_PORTRAIT;
  const defaultMarginX = base.width * ANCHOR_MARGIN_RATIO_X;
  const defaultMarginY = base.height * ANCHOR_MARGIN_RATIO_Y;

  const extraLeft = Math.max(0, margins.left - defaultMarginX);
  const extraRight = Math.max(0, margins.right - defaultMarginX);
  const extraTop = Math.max(0, margins.top - defaultMarginY);
  const extraBottom = Math.max(0, margins.bottom - defaultMarginY);

  const shrinkLeft = Math.max(0, defaultMarginX - margins.left);
  const shrinkRight = Math.max(0, defaultMarginX - margins.right);
  const shrinkTop = Math.max(0, defaultMarginY - margins.top);
  const shrinkBottom = Math.max(0, defaultMarginY - margins.bottom);

  const canvasWidth = Math.max(100, base.width + extraLeft + extraRight - shrinkLeft - shrinkRight);
  const canvasHeight = Math.max(100, base.height + extraTop + extraBottom - shrinkTop - shrinkBottom);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 1. Top Orientation Header
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

  // 2. Concentric Anchor Markers
  const anchors = getAnchorPositions(canvasWidth, canvasHeight, margins);
  drawConcentricSquareMarker(ctx, anchors.TL.x, anchors.TL.y);
  drawConcentricSquareMarker(ctx, anchors.TR.x, anchors.TR.y);
  drawConcentricSquareMarker(ctx, anchors.BL.x, anchors.BL.y);
  drawConcentricSquareMarker(ctx, anchors.BR.x, anchors.BR.y);

  // 3. Preview reserved zone overlays
  if (isPreview) {
    ctx.save();
    ctx.fillStyle = "rgba(239, 68, 68, 0.07)";
    ctx.strokeStyle = "rgba(239, 68, 68, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    getReservedZones(canvasWidth, canvasHeight, margins).forEach((z) => {
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeRect(z.x, z.y, z.w, z.h);
    });
    ctx.restore();

    // Scannable area border (red dashed rectangle inside the 4 markers)
    const area = getScannableBounds(canvasWidth, canvasHeight, margins);
    ctx.save();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(area.x, area.y, area.width, area.height);
    ctx.restore();
  }

  // 4. Render each section
  const dims = { width: canvasWidth, height: canvasHeight };
  sections.forEach((sec, idx) => {
    renderSection(ctx, sec, dims, {
      isSelected: isPreview && selectedSectionIndex === idx,
    });
  });
}

/**
 * Renders an individual section
 */
function renderSection(ctx, sec, dims, options = {}) {
  const { isSelected = false } = options;
  const bounds = getSectionBounds(sec, dims);

  ctx.save();

  // Selection highlight
  if (isSelected) {
    ctx.fillStyle = "rgba(37, 99, 235, 0.06)";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.fillRect(bounds.x - 6, bounds.y - 6, bounds.width + 12, bounds.height + 12);
    ctx.strokeRect(bounds.x - 6, bounds.y - 6, bounds.width + 12, bounds.height + 12);
    ctx.setLineDash([]);
  }

  ctx.restore();

  if (sec.type === "code") {
    renderCodeSection(ctx, sec, dims);
  } else {
    renderQuestionSection(ctx, sec, dims);
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
  const colSpacing = sec.colSpacing || (cellSize + 20);
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
 * Renders a question or multiselect section
 */
function renderQuestionSection(ctx, sec, dims) {
  const startX = (sec.percentX / 100) * dims.width;
  const startY = (sec.percentY / 100) * dims.height;

  const rows = sec.rows || 1;
  const cols = sec.cols || 1;
  const radius = sec.radius || 11;
  const colSpacing = sec.colSpacing || 42;
  const rowSpacing = sec.rowSpacing || 32;
  const labelsXOffset = sec.showLabels ? (sec.labelWidth || 60) : 0;

  ctx.save();

  if (sec.type === "multiselect") {
    // ---- MULTISELECT: colSpacing as column width, labels wrap ----
    const lineHeight = 11;
    const labelGap = 6;
    const titleH = sec.title ? 24 : 0;
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
    if (sec.title) {
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(sec.title, startX, startY + 14);
    }

    const gridStartY = startY + titleH;

    for (let r = 0; r < rows; r++) {
      const rowTopY = gridStartY + r * rowSpacing;

      // Calculate max wrapped lines for THIS row only
      let rowMaxLines = 1;
      for (let c = 0; c < cols; c++) {
        const cellLabel = sec.labels && sec.labels[r] && sec.labels[r][c];
        if (cellLabel) {
          const maxW = colWidths[c] - padX;
          const lines = measureWrappedLines(ctx, String(cellLabel), maxW);
          if (lines > rowMaxLines) rowMaxLines = lines;
        }
      }
      const rowLabelH = rowMaxLines * lineHeight;
      const cy = rowTopY + rowLabelH + labelGap + radius;

      for (let c = 0; c < cols; c++) {
        const cx = colCentersX[c];
        const cellLabel = sec.labels && sec.labels[r] && sec.labels[r][c];

        // Label wraps within column width
        if (cellLabel) {
          ctx.fillStyle = "#1e293b";
          ctx.font = "10px sans-serif";
          ctx.textAlign = "center";
          const maxW = colWidths[c] - padX;
          drawWrappedText(ctx, String(cellLabel), cx, rowTopY, maxW, lineHeight);
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
    if (sec.title) {
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(sec.title, startX, startY - 6);
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
    const headerGap = sec.showLabels ? maxHeaderLines * lineHeight + headerPadding : 12;
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
      if (sec.showLabels && sec.labels && sec.labels.length > 0) {
        ctx.fillStyle = "#475569";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        for (let c = 0; c < cols; c++) {
          const label = sec.labels[c] || String(c + 1);
          const cx = colCentersX[c];
          const maxW = colWidths[c] - padX;
          drawWrappedText(ctx, String(label), cx, startY + 10, maxW, 14);
        }
      }

      // Rows for this group
      const groupStartRow = g * rowsPerGroup;
      const groupEndRow = Math.min(groupStartRow + rowsPerGroup, rows);

      for (let r = groupStartRow; r < groupEndRow; r++) {
        const localRow = r - groupStartRow;
        const cy = gridStartY + localRow * rowSpacing;

        // Row label
        if (sec.showLabels) {
          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "right";
          const rowLabel = sec.rowPrefix ? `${sec.rowPrefix}${r + 1}` : `Q${r + 1}`;
          const labelOffset = radius + 10;
          ctx.fillText(rowLabel, groupStartX - labelOffset, cy + 4);
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
 * Generates JSON template schema for the OMR scanner
 */
export function exportTemplateJSON(config) {
  const { name, sections, margins } = config;
  const dims = CANVAS_PORTRAIT;

  const formattedSections = sections.map((sec, i) => {
    const startX = (sec.percentX / 100) * dims.width;
    const startY = (sec.percentY / 100) * dims.height;

    if (sec.type === "code") {
      const digits = sec.digits || 6;
      const cellSize = sec.cellSize || 36;
      const colSpacing = sec.colSpacing || (cellSize + 20);
      const bubbleRowSpacing = sec.rowSpacing || 38;
      const matrixStartY = startY + cellSize + 32;
      const endX = startX + (digits - 1) * colSpacing + cellSize;
      const endY = matrixStartY + 9 * bubbleRowSpacing;

      return {
        type: "code",
        name: sec.name || "codigo",
        rows: 10,
        cols: digits,
        digits: digits,
        circles: {
          CTL: { percent_x: parseFloat((startX / dims.width * 100).toFixed(2)), percent_y: parseFloat((matrixStartY / dims.height * 100).toFixed(2)) },
          CTR: { percent_x: parseFloat((endX / dims.width * 100).toFixed(2)), percent_y: parseFloat((matrixStartY / dims.height * 100).toFixed(2)) },
          CBL: { percent_x: parseFloat((startX / dims.width * 100).toFixed(2)), percent_y: parseFloat((endY / dims.height * 100).toFixed(2)) },
          CBR: { percent_x: parseFloat((endX / dims.width * 100).toFixed(2)), percent_y: parseFloat((endY / dims.height * 100).toFixed(2)) },
        },
        radius: sec.radius || 10,
        labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      };
    }

  const labelsXOffset = sec.showLabels ? (sec.labelWidth || 60) : 0;
  const radius = sec.radius || 11;
  const colSpacing = sec.colSpacing || 40;
  const rowSpacing = sec.rowSpacing || 32;

  if (sec.type === "multiselect") {
    const lineHeight = 11;
    const labelGap = 6;
    const padX = 6;

    const titleH = sec.title ? 24 : 0;

    // Column width = colSpacing (same as rendering)
    const colCentersX = [];
    let curX = startX + labelsXOffset;
    for (let c = 0; c < sec.cols; c++) {
      const colW = Math.max(radius * 2, colSpacing);
      colCentersX[c] = curX + colW / 2;
      curX += colW;
    }

    // Calculate max wrapped lines per row for endY
    let maxRowLabelLines = 1;
    for (let r = 0; r < sec.rows; r++) {
      let rowLines = 1;
      for (let c = 0; c < sec.cols; c++) {
        const label = sec.labels && sec.labels[r] && sec.labels[r][c];
        if (label) {
          const maxLabelW = String(label).length * 6;
          const availW = colSpacing - padX;
          const approxLines = Math.max(1, Math.ceil(maxLabelW / availW));
          if (approxLines > rowLines) rowLines = approxLines;
        }
      }
      if (rowLines > maxRowLabelLines) maxRowLabelLines = rowLines;
    }

    const tallestLabelH = maxRowLabelLines * lineHeight;
    const gridStartY = startY + titleH;
    const endX = colCentersX[sec.cols - 1];
    const endY = gridStartY + (sec.rows - 1) * rowSpacing + tallestLabelH + labelGap + radius * 2 + 10;

    return {
      type: sec.type || "question",
      name: sec.name || `seccion${i + 1}`,
      rows: sec.rows,
      cols: sec.cols,
      circles: {
        CTL: { percent_x: parseFloat((colCentersX[0] / dims.width * 100).toFixed(2)), percent_y: parseFloat((gridStartY / dims.height * 100).toFixed(2)) },
        CTR: { percent_x: parseFloat((endX / dims.width * 100).toFixed(2)), percent_y: parseFloat((gridStartY / dims.height * 100).toFixed(2)) },
        CBL: { percent_x: parseFloat((colCentersX[0] / dims.width * 100).toFixed(2)), percent_y: parseFloat((endY / dims.height * 100).toFixed(2)) },
        CBR: { percent_x: parseFloat((endX / dims.width * 100).toFixed(2)), percent_y: parseFloat((endY / dims.height * 100).toFixed(2)) },
      },
      radius: sec.radius,
      labels: sec.labels || [],
    };
  }

  // Question type (default): column width based on colSpacing, labels wrap within
  const padX = 6;
  const lineHeight = 14;
  const headerPadding = 12;
  const columnGroups = sec.columnGroups || 1;
  const groupGap = 50;
  const groupWidth = sec.cols * (sec.colSpacing || 40);

  // Calculate dynamic header height (labels wrap within colSpacing width)
  let maxHeaderLines = 1;
  for (let c = 0; c < sec.cols; c++) {
    const label = sec.labels && sec.labels[c] ? String(sec.labels[c]) : String(c + 1);
    const maxLabelW = label.length * 7;
    const colW = Math.max(radius * 2, sec.colSpacing || 40);
    const availW = colW - padX;
    const approxLines = Math.max(1, Math.ceil(maxLabelW / availW));
    if (approxLines > maxHeaderLines) maxHeaderLines = approxLines;
  }
  const colHeaderH = sec.showLabels ? maxHeaderLines * lineHeight + headerPadding : 12;
  const rowsPerGroup = Math.ceil(sec.rows / columnGroups);
  const gridStartY = startY + colHeaderH;

  // Total width spans all column groups
  const totalWidth = labelsXOffset + columnGroups * groupWidth + (columnGroups - 1) * groupGap;
  const endX = startX + totalWidth;
  const endY = gridStartY + (rowsPerGroup - 1) * sec.rowSpacing;

  return {
    type: sec.type || "question",
    name: sec.name || `seccion${i + 1}`,
    rows: sec.rows,
    cols: sec.cols,
    columnGroups: columnGroups,
    circles: {
      CTL: { percent_x: parseFloat((startX / dims.width * 100).toFixed(2)), percent_y: parseFloat((gridStartY / dims.height * 100).toFixed(2)) },
      CTR: { percent_x: parseFloat((endX / dims.width * 100).toFixed(2)), percent_y: parseFloat((gridStartY / dims.height * 100).toFixed(2)) },
      CBL: { percent_x: parseFloat((startX / dims.width * 100).toFixed(2)), percent_y: parseFloat((endY / dims.height * 100).toFixed(2)) },
      CBR: { percent_x: parseFloat((endX / dims.width * 100).toFixed(2)), percent_y: parseFloat((endY / dims.height * 100).toFixed(2)) },
    },
    radius: sec.radius,
    labels: sec.labels || [],
  };
  });

  return {
    template_name: name || "Plantilla OMR Personalizada",
    margins: margins || { top: 75, bottom: 75, left: 75, right: 75 },
    sections: formattedSections,
  };
}
