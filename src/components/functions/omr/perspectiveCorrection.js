import { getCv } from "./omrState.js";
import { createCanvas } from "./uiSetup.js";

// Este archivo reemplaza las funciones de perspectiva en imageProcessor.js
// Exporta versiones mejoradas con corrección de curvatura

/**
 * Realiza corrección de perspectiva con compensación de curvatura
 * usando una malla de transformación adaptativa
 */
export function performPerspectiveCorrectionWithCurvature(OMR_STATE, snapCanvas, labelMap) {
  const cv = getCv();
  
  // Calcular dimensiones del destino
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const topW = dist(labelMap["TL"], labelMap["TR"]);
  const botW = dist(labelMap["BL"], labelMap["BR"]);
  const leftH = dist(labelMap["TL"], labelMap["BL"]);
  const rightH = dist(labelMap["TR"], labelMap["BR"]);
  const dstW = Math.max(1, Math.round((topW + botW) / 2));
  const dstH = Math.max(1, Math.round((leftH + rightH) / 2));
  const scale = 2;
  const dstWScaled = Math.max(1, Math.round(dstW * scale));
  const dstHScaled = Math.max(1, Math.round(dstH * scale));

  // Leer imagen fuente
  let srcMat = cv.imread(snapCanvas);
  
  // Crear matriz de destino
  let dstMat = new cv.Mat(dstHScaled, dstWScaled, srcMat.type());
  
  // Usar malla de corrección si hay curvatura detectable
  const curvatureDetected = detectCurvature(labelMap, OMR_STATE);
  
  if (curvatureDetected) {
    // Corrección con malla adaptativa para curvatura
    applyGridBasedCorrection(srcMat, dstMat, labelMap, dstWScaled, dstHScaled, OMR_STATE);
  } else {
    // Corrección de perspectiva estándar
    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      labelMap["TL"].x, labelMap["TL"].y,
      labelMap["TR"].x, labelMap["TR"].y,
      labelMap["BL"].x, labelMap["BL"].y,
      labelMap["BR"].x, labelMap["BR"].y,
    ]);
    const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      dstWScaled, 0,
      0, dstHScaled,
      dstWScaled, dstHScaled,
    ]);
    
    let M = cv.getPerspectiveTransform(srcTri, dstTri);
    let dsize = new cv.Size(dstWScaled, dstHScaled);
    cv.warpPerspective(
      srcMat,
      dstMat,
      M,
      dsize,
      cv.INTER_CUBIC,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    );
    
    srcTri.delete();
    dstTri.delete();
    M.delete();
  }

  const correctedCanvas = createCanvas(dstWScaled, dstHScaled);
  cv.imshow(correctedCanvas, dstMat);

  srcMat.delete();

  // Retornar matriz de transformación estimada para compatibilidad
  const M = estimateTransformMatrix(labelMap, dstWScaled, dstHScaled);
  
  return { 
    correctedCanvas: correctedCanvas, 
    correctedMat: dstMat, 
    matrix: M,
    curvatureDetected: curvatureDetected
  };
}

/**
 * Detecta si hay curvatura significativa en la página
 */
function detectCurvature(labelMap, OMR_STATE) {
  const { circleTemplate } = OMR_STATE;
  if (!circleTemplate || circleTemplate.length === 0) return false;
  
  // Si hay plantilla de círculos, usar detección basada en puntos intermedios
  // Por ahora, activar corrección de curvatura si se detectan distorsiones
  const TL = labelMap["TL"];
  const TR = labelMap["TR"];
  const BL = labelMap["BL"];
  const BR = labelMap["BR"];
  
  // Calcular desviación de rectángulo perfecto
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const top = dist(TL, TR);
  const bottom = dist(BL, BR);
  const left = dist(TL, BL);
  const right = dist(TR, BR);
  
  const widthRatio = Math.max(top, bottom) / Math.min(top, bottom);
  const heightRatio = Math.max(left, right) / Math.min(left, right);
  
  // Si hay diferencia significativa, hay curvatura
  return widthRatio > 1.1 || heightRatio > 1.1;
}

/**
 * Aplica corrección basada en malla para compensar curvatura
 */
function applyGridBasedCorrection(srcMat, dstMat, labelMap, dstW, dstH, OMR_STATE) {

  const gridSize = 10; // Dividir en cuadrícula de 10x10
  
  // Crear puntos de control adicionales interpolando los bordes
  const controlPoints = generateControlPoints(labelMap, gridSize, OMR_STATE);
  
  // Aplicar transformación por secciones
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const srcQuad = [
        controlPoints[i][j],
        controlPoints[i][j + 1],
        controlPoints[i + 1][j],
        controlPoints[i + 1][j + 1]
      ];
      
      const dstQuad = [
        { x: (j / gridSize) * dstW, y: (i / gridSize) * dstH },
        { x: ((j + 1) / gridSize) * dstW, y: (i / gridSize) * dstH },
        { x: (j / gridSize) * dstW, y: ((i + 1) / gridSize) * dstH },
        { x: ((j + 1) / gridSize) * dstW, y: ((i + 1) / gridSize) * dstH }
      ];
      
      // Transformar este cuadrante
      transformQuadrant(srcMat, dstMat, srcQuad, dstQuad);
    }
  }
}

/**
 * Genera puntos de control interpolados para la malla
 */
function generateControlPoints(labelMap, gridSize) {
  const TL = labelMap["TL"];
  const TR = labelMap["TR"];
  const BL = labelMap["BL"];
  const BR = labelMap["BR"];
  
  const points = [];
  
  // Generar malla de puntos con interpolación bilineal y ajuste de curvatura
  for (let i = 0; i <= gridSize; i++) {
    points[i] = [];
    const v = i / gridSize;
    
    for (let j = 0; j <= gridSize; j++) {
      const u = j / gridSize;
      
      // Interpolación bilineal base
      let x = (1 - u) * (1 - v) * TL.x + u * (1 - v) * TR.x +
              (1 - u) * v * BL.x + u * v * BR.x;
      let y = (1 - u) * (1 - v) * TL.y + u * (1 - v) * TR.y +
              (1 - u) * v * BL.y + u * v * BR.y;
      
      // Aplicar corrección de curvatura (efecto de arco)
      // Detectar si los bordes están curvados
      const curvatureFactor = estimateCurvatureAt(u, v, labelMap);
      
      x += curvatureFactor.x;
      y += curvatureFactor.y;
      
      points[i][j] = { x, y };
    }
  }
  
  return points;
}

/**
 * Estima la curvatura en un punto dado
 */
function estimateCurvatureAt(u, v, labelMap) {
  // Modelo simple: la curvatura es más pronunciada en el centro
  const centerU = Math.abs(u - 0.5);
  const centerV = Math.abs(v - 0.5);
  
  // Factor de curvatura (0 en bordes, máximo en centro)
  const curvature = (0.5 - centerU) * (0.5 - centerV) * 4;
  
  // Calcular dirección de curvatura basada en la geometría detectada
  const TL = labelMap["TL"];
  const TR = labelMap["TR"];
  const BL = labelMap["BL"];
  const BR = labelMap["BR"];
  
  // Punto esperado vs punto real para detectar dirección de curvatura
  const expectedMidX = (TL.x + TR.x + BL.x + BR.x) / 4;
  const expectedMidY = (TL.y + TR.y + BL.y + BR.y) / 4;
  
  // Ajuste proporcional a la curvatura detectada
  const adjustmentStrength = 0.02; // 2% de ajuste máximo
  
  return {
    x: curvature * adjustmentStrength * (expectedMidX - ((TL.x + BR.x) / 2)),
    y: curvature * adjustmentStrength * (expectedMidY - ((TL.y + BR.y) / 2))
  };
}

/**
 * Transforma un cuadrante de la imagen
 */
function transformQuadrant(srcMat, dstMat, srcQuad, dstQuad) {
  const cv = getCv();
  
  // Crear máscara para este cuadrante
  const mask = new cv.Mat(dstMat.rows, dstMat.cols, cv.CV_8UC1, new cv.Scalar(0));
  
  // Definir región de destino
  const dstPoints = dstQuad.map(p => new cv.Point(Math.round(p.x), Math.round(p.y)));
  const dstContour = cv.matFromArray(4, 1, cv.CV_32SC2, 
    dstPoints.flatMap(p => [p.x, p.y])
  );
  
  // Llenar máscara
  const contours = new cv.MatVector();
  contours.push_back(dstContour);
  cv.fillPoly(mask, contours, new cv.Scalar(255));
  
  // Calcular transformación de perspectiva para este cuadrante
  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2,
    srcQuad.flatMap(p => [p.x, p.y])
  );
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2,
    dstQuad.flatMap(p => [p.x, p.y])
  );
  
  try {
    const M = cv.getPerspectiveTransform(srcTri, dstTri);
    const tempMat = new cv.Mat();
    
    cv.warpPerspective(
      srcMat,
      tempMat,
      M,
      new cv.Size(dstMat.cols, dstMat.rows),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    );
    
    // Copiar solo la región enmascarada
    tempMat.copyTo(dstMat, mask);
    
    M.delete();
    tempMat.delete();
  } catch (e) {
    console.warn("Error transformando cuadrante:", e);
  }
  
  srcTri.delete();
  dstTri.delete();
  dstContour.delete();
  contours.delete();
  mask.delete();
}

/**
 * Estima una matriz de transformación para compatibilidad
 */
function estimateTransformMatrix(labelMap, dstW, dstH) {
  const cv = getCv();
  
  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    labelMap["TL"].x, labelMap["TL"].y,
    labelMap["TR"].x, labelMap["TR"].y,
    labelMap["BL"].x, labelMap["BL"].y,
    labelMap["BR"].x, labelMap["BR"].y,
  ]);
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    dstW, 0,
    0, dstH,
    dstW, dstH,
  ]);
  
  const M = cv.getPerspectiveTransform(srcTri, dstTri);
  
  srcTri.delete();
  dstTri.delete();
  
  return M;
}

/**
 * Versión mejorada de extractAndDrawResults que usa el canvas corregido
 */
export function extractAndDrawResultsWithCurvature(
  OMR_STATE,
  correctedCanvas,
  correctedMat,

) {
  const { circleTemplate } = OMR_STATE;
  if (!Array.isArray(circleTemplate) || circleTemplate.length === 0) {
    return { finalResults: [] };
  }

  const cctx = correctedCanvas.getContext("2d");
  const finalResults = [];
  const cv = getCv();

  const gray = new cv.Mat();
  cv.cvtColor(correctedMat, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);

  // El resto del procesamiento es igual, pero ahora trabaja sobre
  // una imagen mejor corregida
  for (const matrixDef of circleTemplate) {
    const { circles, rows, cols, type } = matrixDef;
    if (!circles) continue;

    // Calcular posiciones en el canvas corregido
    const mc = calculateMatrixCornersInCorrected(
      circles, 
      correctedCanvas.width, 
      correctedCanvas.height
    );

    if (!(mc.CTL && mc.CTR && mc.CBL && mc.CBR)) continue;

    // Generar puntos de la cuadrícula con mejor precisión
    const gridPoints = generateGridPoints(mc, rows, cols);
    
    // Detectar burbujas marcadas
    const detections = detectMarkedBubbles(
      gray, 
      gridPoints, 
      matrixDef.radius,
      correctedCanvas.width,
      correctedCanvas.height
    );

    // Dibujar visualización
    drawDetectionResults(cctx, gridPoints, detections, matrixDef.radius, type);

    // Procesar resultados según tipo
    const result = processDetectionResults(detections, rows, cols, type);
    if (result) finalResults.push(result);
  }

  gray.delete();
  return { finalResults };
}

function calculateMatrixCornersInCorrected(circles, width, height) {
  const mc = {};
  for (const key of ["CTL", "CTR", "CBL", "CBR"]) {
    const pct = circles[key];
    if (!pct) continue;
    const u = (pct.percent_x || 0) / 100.0;
    const v = (pct.percent_y || 0) / 100.0;
    mc[key] = {
      x: u * width,
      y: v * height
    };
  }
  return mc;
}

function generateGridPoints(mc, rows, cols) {
  const points = [];
  for (let r = 0; r < rows; r++) {
    const v = rows === 1 ? 0 : r / (rows - 1);
    for (let c = 0; c < cols; c++) {
      const u = cols === 1 ? 0 : c / (cols - 1);
      points.push({
        x: (1 - u) * (1 - v) * mc.CTL.x + u * (1 - v) * mc.CTR.x +
           (1 - u) * v * mc.CBL.x + u * v * mc.CBR.x,
        y: (1 - u) * (1 - v) * mc.CTL.y + u * (1 - v) * mc.CTR.y +
           (1 - u) * v * mc.CBL.y + u * v * mc.CBR.y,
        row: r,
        col: c
      });
    }
  }
  return points;
}

function detectMarkedBubbles(gray, points, radius, width, height) {
  const darkThresh = 100;
  const requiredFraction = 0.5;
  const detections = [];

  for (const point of points) {
    const dx = Math.round(point.x);
    const dy = Math.round(point.y);
    
    if (dx < 0 || dy < 0 || dx >= width || dy >= height) {
      detections.push({ marked: false, fraction: 0, ...point });
      continue;
    }

    let darkCount = 0, totalCount = 0;
    const r2 = radius * radius;
    const xmin = Math.max(0, dx - radius);
    const xmax = Math.min(width - 1, dx + radius);
    const ymin = Math.max(0, dy - radius);
    const ymax = Math.min(height - 1, dy + radius);

    for (let yy = ymin; yy <= ymax; yy++) {
      const rowPtr = gray.ucharPtr(yy);
      for (let xx = xmin; xx <= xmax; xx++) {
        if ((xx - dx) ** 2 + (yy - dy) ** 2 > r2) continue;
        totalCount++;
        if (rowPtr[xx] <= darkThresh) darkCount++;
      }
    }
    
    const fraction = totalCount > 0 ? darkCount / totalCount : 0;
    detections.push({
      marked: fraction >= requiredFraction,
      fraction,
      ...point
    });
  }

  return detections;
}

function drawDetectionResults(ctx, points, detections, radius, type) {
  // Dibujar todas las burbujas
  ctx.fillStyle = type === "numeric" 
    ? "rgba(64, 224, 208, 0.95)" 
    : "rgba(64, 224, 208, 0.95)";
  
  for (const point of points) {
    ctx.beginPath();
    ctx.arc(Math.round(point.x), Math.round(point.y), radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dibujar burbujas marcadas con color gradiente
  for (let i = 0; i < detections.length; i++) {
    if (detections[i].marked) {
      const { x, y, fraction } = detections[i];
      const red = Math.round(240 + fraction * (128 - 240));
      const green = Math.round(240 + fraction * (0 - 240));
      const blue = Math.round(240 + fraction * (128 - 240));

      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.95)`;
      ctx.beginPath();
      ctx.arc(Math.round(x), Math.round(y), radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function processDetectionResults(detections, rows, cols, type) {
  if (type === "numeric") {
    const codeDigits = [];
    for (let c = 0; c < cols; c++) {
      let bestRow = -1, bestFrac = -1;
      for (let r = 0; r < rows; r++) {
        const det = detections.find(d => d.row === r && d.col === c);
        if (det && det.marked && det.fraction > bestFrac) {
          bestFrac = det.fraction;
          bestRow = r;
        }
      }
      codeDigits.push(bestRow !== -1 && bestRow !== rows - 1 ? bestRow + 1 : 0);
    }
    return {
      typeOrigin: "numeric",
      contentType: "number",
      content: codeDigits.join("")
    };
  } else if (type === "question") {
    const answers = [];
    for (let r = 0; r < rows; r++) {
      let bestCol = -1, bestFrac = -1;
      for (let c = 0; c < cols; c++) {
        const det = detections.find(d => d.row === r && d.col === c);
        if (det && det.marked && det.fraction > bestFrac) {
          bestFrac = det.fraction;
          bestCol = c;
        }
      }
      answers.push({
        question: r + 1,
        answer: bestCol !== -1 ? String.fromCharCode("a".charCodeAt(0) + bestCol) : ""
      });
    }
    return {
      typeOrigin: "question",
      contentType: "array",
      content: answers
    };
  }
  return null;
}