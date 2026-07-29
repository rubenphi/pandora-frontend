/**
 * omrSheetGenerator.js
 * High-resolution canvas renderer and generator for printable OMR sheets.
 */

// Canvas dimensions for high-resolution rendering (A4 aspect ratio at ~150dpi)
export const CANVAS_PORTRAIT = { width: 1240, height: 1754 };
export const CANVAS_LANDSCAPE = { width: 1754, height: 1240 };

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
 */
export function getAnchorPositions(width, height) {
  const marginX = width * ANCHOR_MARGIN_RATIO_X;
  const marginY = height * ANCHOR_MARGIN_RATIO_Y;
  return {
    TL: { x: marginX, y: HEADER_HEIGHT + marginY },
    TR: { x: width - marginX, y: HEADER_HEIGHT + marginY },
    BL: { x: marginX, y: height - marginY },
    BR: { x: width - marginX, y: height - marginY },
  };
}

/**
 * Returns the reserved zone rectangles that sections cannot overlap
 */
export function getReservedZones(width, height) {
  const anchors = getAnchorPositions(width, height);
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
    const bubbleSpacing = sec.colSpacing || 36;
    const totalWidth = cols * cellSize + cols * 4; // cells with small gap
    const writingRowH = cellSize + 8;
    const bubbleMatrixH = 10 * (bubbleSpacing * 0.85);
    const totalHeight = writingRowH + bubbleMatrixH + 30;
    return { x: startX, y: startY, width: totalWidth, height: totalHeight };
  }

  const labelsXOffset = sec.showLabels ? sec.labelWidth || 60 : 0;
  const cols = sec.cols || 1;
  const rows = sec.rows || 1;
  const colSpacing = sec.colSpacing || 40;
  const rowSpacing = sec.rowSpacing || 32;
  const titleH = sec.title ? 22 : 0;
  const colHeaderH = sec.showLabels ? 26 : 0;

  const totalWidth = labelsXOffset + (cols - 1) * colSpacing + (sec.radius || 12) * 2 + 10;
  const totalHeight = titleH + colHeaderH + (rows - 1) * rowSpacing + (sec.radius || 12) * 2 + 10;

  return { x: startX, y: startY, width: totalWidth, height: totalHeight };
}

/**
 * Renders the entire OMR sheet onto a canvas
 */
export function renderSheet(canvas, config, options = {}) {
  const { isPreview = false, selectedSectionIndex = -1 } = options;
  const { orientation = "portrait", sections = [] } = config;

  const dims = orientation === "landscape" ? CANVAS_LANDSCAPE : CANVAS_PORTRAIT;
  canvas.width = dims.width;
  canvas.height = dims.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dims.width, dims.height);

  // 1. Top Orientation Header
  ctx.save();
  ctx.fillStyle = "#111111";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("▲  PARTE SUPERIOR / ARRIBA  ▲", dims.width / 2, 40);
  ctx.strokeStyle = "#bbbbbb";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(50, 55);
  ctx.lineTo(dims.width - 50, 55);
  ctx.stroke();
  ctx.restore();

  // 2. Concentric Anchor Markers
  const anchors = getAnchorPositions(dims.width, dims.height);
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
    getReservedZones(dims.width, dims.height).forEach((z) => {
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeRect(z.x, z.y, z.w, z.h);
    });
    ctx.restore();
  }

  // 4. Render each section
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
  const cellSize = sec.cellSize || 36;  // writing square size
  const colSpacing = sec.colSpacing || (cellSize + 4);
  const bubbleRowSpacing = sec.rowSpacing || 30;
  const bubbleRadius = sec.radius || 10;

  const digitLabels = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

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

  // Bubble matrix starts below the handwriting row
  const matrixStartY = startY + cellSize + 14;

  // Digit column header labels (0-9) on the left side
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
  const cols = sec.cols || 4;
  const radius = sec.radius || 11;
  const colSpacing = sec.colSpacing || 42;
  const rowSpacing = sec.rowSpacing || 32;
  const labelsXOffset = sec.showLabels ? (sec.labelWidth || 60) : 0;

  ctx.save();

  // Section title
  if (sec.title) {
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(sec.title, startX, startY - 6);
  }

  // Column header labels
  if (sec.showLabels && sec.labels && sec.labels.length > 0) {
    ctx.fillStyle = "#475569";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    for (let c = 0; c < cols; c++) {
      const label = sec.labels[c] || String(c + 1);
      const cx = startX + labelsXOffset + c * colSpacing;
      // Wrap long labels
      const maxW = colSpacing - 4;
      drawWrappedText(ctx, String(label), cx, startY + 10, maxW, 14);
    }
  }

  // Grid of bubbles
  const gridStartY = startY + (sec.showLabels ? 28 : 8);

  for (let r = 0; r < rows; r++) {
    const cy = gridStartY + r * rowSpacing;

    // Row label
    if (sec.showLabels) {
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "right";
      const rowLabel = sec.rowPrefix ? `${sec.rowPrefix}${r + 1}` : `Q${r + 1}`;
      ctx.fillText(rowLabel, startX + labelsXOffset - 8, cy + 4);
    }

    // Bubbles
    for (let c = 0; c < cols; c++) {
      const cx = startX + labelsXOffset + c * colSpacing;
      drawDottedBubble(ctx, cx, cy, radius);
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
  const { orientation, name, sections } = config;
  const dims = orientation === "landscape" ? CANVAS_LANDSCAPE : CANVAS_PORTRAIT;

  const formattedSections = sections.map((sec, i) => {
    const startX = (sec.percentX / 100) * dims.width;
    const startY = (sec.percentY / 100) * dims.height;

    if (sec.type === "code") {
      const digits = sec.digits || 6;
      const cellSize = sec.cellSize || 36;
      const colSpacing = sec.colSpacing || (cellSize + 4);
      const bubbleRowSpacing = sec.rowSpacing || 30;
      const matrixStartY = startY + cellSize + 14;
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
        labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      };
    }

    const labelsXOffset = sec.showLabels ? (sec.labelWidth || 60) : 0;
    const gridStartY = startY + (sec.showLabels ? 28 : 8);
    const endX = startX + labelsXOffset + (sec.cols - 1) * sec.colSpacing;
    const endY = gridStartY + (sec.rows - 1) * sec.rowSpacing;

    return {
      type: sec.type || "question",
      name: sec.name || `seccion${i + 1}`,
      rows: sec.rows,
      cols: sec.cols,
      circles: {
        CTL: { percent_x: parseFloat(((startX + labelsXOffset) / dims.width * 100).toFixed(2)), percent_y: parseFloat((gridStartY / dims.height * 100).toFixed(2)) },
        CTR: { percent_x: parseFloat((endX / dims.width * 100).toFixed(2)), percent_y: parseFloat((gridStartY / dims.height * 100).toFixed(2)) },
        CBL: { percent_x: parseFloat(((startX + labelsXOffset) / dims.width * 100).toFixed(2)), percent_y: parseFloat((endY / dims.height * 100).toFixed(2)) },
        CBR: { percent_x: parseFloat((endX / dims.width * 100).toFixed(2)), percent_y: parseFloat((endY / dims.height * 100).toFixed(2)) },
      },
      radius: sec.radius,
      labels: sec.labels || [],
    };
  });

  return {
    template_name: name || "Plantilla OMR Personalizada",
    orientation: orientation,
    sections: formattedSections,
  };
}
