// Global state placeholder
let OMR_STATE = {};
let cv; // Define cv in the module scope

// Entry point called from HTML after OpenCV.js is loaded
window.onOpenCvReady = function () {
  cv = window.cv; // Assign the cv object when ready
  document.getElementById("status").textContent = "OpenCV.js cargado.";
  main();
};

async function main() {
  try {
    const templates = await fetchTemplates();
    OMR_STATE.circleTemplate = templates.circleTemplate;
    OMR_STATE.matrixTemplate = null; // Will be populated by parsing matrizCode.txt

    setupUI();
    await startCamera();
    initOpenCV();
  } catch (error) {
    console.error("Error en la inicialización:", error);
    document.getElementById("status").textContent = `Error: ${error.message}`;
  }
}

async function fetchTemplates() {
  try {
    const response = await fetch("omr_templates.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (e) {
    console.error(
      "No se pudieron cargar las plantillas desde omr_templates.json",
      e
    );
    return { circleTemplate: [] }; // Fallback to empty template
  }
}

function setupUI() {
  const contrastInput = document.getElementById("contrast");
  try {
    const stored = localStorage.getItem("omrContrast");
    if (stored !== null) contrastInput.value = stored;
  } catch (e) {
    console.warn("No se pudo leer el contraste de localStorage.");
  }

  OMR_STATE.contrastValue = parseFloat(contrastInput.value) / 100.0;

  contrastInput.oninput = () => {
    OMR_STATE.contrastValue = parseFloat(contrastInput.value) / 100.0;
    try {
      localStorage.setItem("omrContrast", contrastInput.value);
    } catch (e) {
      console.warn("No se pudo guardar el contraste en localStorage.");
    }
  };

  contrastInput.addEventListener(
    "touchmove",
    (e) => {
      e.stopPropagation();
      e.preventDefault();
    },
    { passive: false }
  );
}

function startCamera() {
  return new Promise((resolve, reject) => {
    const video = document.getElementById("video");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          OMR_STATE.video = video;
          resolve();
        };
      })
      .catch((err) => {
        console.error("Error al acceder a la cámara: ", err);
        reject(err);
      });
  });
}

function initOpenCV() {
  const video = OMR_STATE.video;
  const canvas = document.getElementById("canvasOutput");
  const ctx = canvas.getContext("2d");

  const width = video.videoWidth;
  const height = video.videoHeight;
  canvas.width = width;
  canvas.height = height;

  // Initialize state object for the processing loop
  OMR_STATE = {
    ...OMR_STATE,
    canvas,
    ctx,
    width,
    height,
    captured: false,
    src: new cv.Mat(height, width, cv.CV_8UC4),
    gray: new cv.Mat(height, width, cv.CV_8UC1),
    bw: new cv.Mat(height, width, cv.CV_8UC1),
    clahe: new cv.CLAHE(2.0, new cv.Size(8, 8)),
    lastCleanDataURL: null,
    lastProcessedDataURL: null,
    // Offscreen canvases
    cleanCanvas: createCanvas(width, height),
    procCanvas: createCanvas(width, height),
  };

  fetchMatrixCode(); // Asynchronously fetch and parse the matrix code

  processingLoop(); // Start the main loop
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function processingLoop() {
  if (OMR_STATE.captured) {
    return; // Stop the loop if an image has been captured
  }

  const {
    video,
    ctx,
    width,
    height,
    src,
    gray,
    bw,
    clahe,
    contrastValue,
    cleanCanvas,
    procCanvas,
  } = OMR_STATE;

  // 1. Draw video to canvas and capture clean frame
  ctx.drawImage(video, 0, 0, width, height);
  try {
    cleanCanvas.getContext("2d").drawImage(video, 0, 0, width, height);
    OMR_STATE.lastCleanDataURL = cleanCanvas.toDataURL("image/png");
  } catch (e) {
    /* ignore */
  }

  // 2. Image Processing
  let imageData = ctx.getImageData(0, 0, width, height);
  src.data.set(imageData.data);
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.convertScaleAbs(gray, gray, contrastValue, 0);
  cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);
  clahe.apply(gray, gray);
  cv.threshold(gray, bw, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

  // 3. Find Markers
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(
    bw,
    contours,
    hierarchy,
    cv.RETR_TREE,
    cv.CHAIN_APPROX_SIMPLE
  );

  let dst = new cv.Mat();
  cv.cvtColor(bw, dst, cv.COLOR_GRAY2RGBA);

  // Capture processed frame
  try {
    cv.imshow(procCanvas, dst);
    OMR_STATE.lastProcessedDataURL = procCanvas.toDataURL("image/png");
  } catch (e) {
    /* ignore */
  }

  const markers = findAndLabelMarkers(contours, hierarchy, width, height);

  // 4. Draw Overlays
  drawMarkerOverlays(dst, markers, contours, hierarchy);
  cv.putText(
    dst,
    `Marcadores: ${markers.length}`,
    new cv.Point(10, 30),
    cv.FONT_HERSHEY_SIMPLEX,
    1.0,
    new cv.Scalar(0, 255, 0, 255),
    2
  );
  cv.imshow("canvasOutput", dst);

  // 5. Draw Code Matrix and Handle Capture
  if (markers.length >= 6) {
    const allMarkersPresent = ["TL", "TM", "TR", "BL", "BM", "BR"].every(
      (label) => markers.some((m) => m.label === label)
    );
    if (allMarkersPresent) {
      drawCodeMatrix(ctx, markers);
      OMR_STATE.captured = true;
      handleCapture(markers);
    }
  }

  // 6. Cleanup and next frame
  dst.delete();
  contours.delete();
  hierarchy.delete();

  requestAnimationFrame(processingLoop);
}

function findAndLabelMarkers(contours, hierarchy, width, height) {
  let normalMarkers = [];
  const hierArr = hierarchy.data32S;
  const minArea = Math.max(100, width * height * 0.0005);

  for (let i = 0; i < contours.size(); ++i) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);
    if (area < minArea) {
      cnt.delete();
      continue;
    }

    let approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);

    if (approx.rows === 4 && cv.isContourConvex(approx)) {
      let childIdx = hierArr[i * 4 + 2];
      if (childIdx !== -1) {
        let childCnt = contours.get(childIdx);
        let childArea = cv.contourArea(childCnt);
        if (
          childArea > 0 &&
          childArea / area > 0.01 &&
          childArea / area < 0.9
        ) {
          let cApprox = new cv.Mat();
          cv.approxPolyDP(
            childCnt,
            cApprox,
            0.02 * cv.arcLength(childCnt, true),
            true
          );
          if (cApprox.rows === 4 && cv.isContourConvex(cApprox)) {
            let m = cv.moments(childCnt);
            let cx =
              m.m00 !== 0
                ? m.m10 / m.m00
                : cv.boundingRect(childCnt).x +
                  cv.boundingRect(childCnt).width / 2;
            let cy =
              m.m00 !== 0
                ? m.m01 / m.m00
                : cv.boundingRect(childCnt).y +
                  cv.boundingRect(childCnt).height / 2;

            normalMarkers.push({
              outerIdx: i,
              innerIdx: childIdx,
              cx: cx,
              cy: cy,
              label: assignLabelToMarker(cx, cy, width, height),
            });
          }
          cApprox.delete();
        }
        childCnt.delete();
      }
    }
    approx.delete();
    cnt.delete();
  }

  return deduplicateMarkers(normalMarkers, width, height);
}

function assignLabelToMarker(cx, cy, width, height) {
  const topLabels = ["TL", "TM", "TR"];
  const bottomLabels = ["BL", "BM", "BR"];
  const expectedPositions = [];
  for (let i = 0; i < 3; i++)
    expectedPositions.push({
      label: topLabels[i],
      x: ((i + 0.5) * width) / 3,
      y: height * 0.25,
    });
  for (let i = 0; i < 3; i++)
    expectedPositions.push({
      label: bottomLabels[i],
      x: ((i + 0.5) * width) / 3,
      y: height * 0.75,
    });

  let best = null;
  let bestDist = Infinity;
  for (const ep of expectedPositions) {
    const d = Math.hypot(ep.x - cx, ep.y - cy);
    if (d < bestDist) {
      bestDist = d;
      best = ep;
    }
  }

  const acceptTh = Math.max(20, Math.min(width, height) / 6);
  if (best && bestDist <= acceptTh) {
    return best.label;
  }
  // Fallback
  const yLabel = cy < height / 2 ? "T" : "B";
  const xLabel = cx < width / 3 ? "L" : cx < (2 * width) / 3 ? "M" : "R";
  return yLabel + xLabel;
}

function deduplicateMarkers(markers, width, height) {
  const uniqueMarkers = [];
  const labels = ["TL", "TM", "TR", "BL", "BM", "BR"];
  const expectedPositions = [];
  for (let i = 0; i < 3; i++)
    expectedPositions.push({
      label: labels[i],
      x: ((i + 0.5) * width) / 3,
      y: height * 0.25,
    });
  for (let i = 3; i < 6; i++)
    expectedPositions.push({
      label: labels[i],
      x: ((i - 3 + 0.5) * width) / 3,
      y: height * 0.75,
    });

  for (const ep of expectedPositions) {
    const candidates = markers.filter((m) => m.label === ep.label);
    if (candidates.length === 0) continue;

    let best = candidates[0];
    let bestD = Math.hypot(best.cx - ep.x, best.cy - ep.y);
    for (let i = 1; i < candidates.length; i++) {
      const d = Math.hypot(candidates[i].cx - ep.x, candidates[i].cy - ep.y);
      if (d < bestD) {
        best = candidates[i];
        bestD = d;
      }
    }
    uniqueMarkers.push(best);
  }
  return uniqueMarkers;
}

function drawMarkerOverlays(dst, markers, contours, hierarchy) {
  for (const marker of markers) {
    cv.drawContours(
      dst,
      contours,
      marker.outerIdx,
      new cv.Scalar(0, 255, 0, 255),
      2,
      cv.LINE_8,
      hierarchy,
      0
    );
    cv.drawContours(
      dst,
      contours,
      marker.innerIdx,
      new cv.Scalar(0, 128, 255, 255),
      2,
      cv.LINE_8
    );
    cv.putText(
      dst,
      marker.label,
      new cv.Point(Math.round(marker.cx) - 12, Math.round(marker.cy) - 12),
      cv.FONT_HERSHEY_SIMPLEX,
      0.7,
      new cv.Scalar(255, 255, 255, 255),
      2
    );
  }
}

function drawCodeMatrix(ctx, markers) {
  const labelMap = {};
  markers.forEach((m) => {
    labelMap[m.label] = { x: m.cx, y: m.cy };
  });

  let TL = labelMap["TL"],
    TR = labelMap["TR"],
    BL = labelMap["BL"],
    BR = labelMap["BR"];

  // Use corner weights if available
  if (OMR_STATE.matrixTemplate && OMR_STATE.matrixTemplate.cornerWeights) {
    const detectedOrder = ["TL", "TM", "TR", "BL", "BM", "BR"].map(
      (l) => labelMap[l]
    );
    const cw = OMR_STATE.matrixTemplate.cornerWeights;

    const applyWeights = (w) => {
      let x = 0,
        y = 0;
      for (let i = 0; i < 6; i++) {
        const m = detectedOrder[i];
        if (m) {
          x += (w[i] || 0) * m.x;
          y += (w[i] || 0) * m.y;
        }
      }
      return { x, y };
    };

    if (cw.CTL) TL = applyWeights(cw.CTL);
    if (cw.CTR) TR = applyWeights(cw.CTR);
    if (cw.CBL) BL = applyWeights(cw.CBL);
    if (cw.CBR) BR = applyWeights(cw.CBR);
  }

  ctx.save();
  // Draw polygon for region
  ctx.strokeStyle = "rgba(255,255,0,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(TL.x, TL.y);
  ctx.lineTo(TR.x, TR.y);
  ctx.lineTo(BR.x, BR.y);
  ctx.lineTo(BL.x, BL.y);
  ctx.closePath();
  ctx.stroke();

  // Draw grid points from circle template
  for (const matrixDef of OMR_STATE.circleTemplate) {
    const { circles, rows, cols, type } = matrixDef;
    if (!circles) continue;

    const mc = {}; // Matrix corners in image coords
    for (const key of ["CTL", "CTR", "CBL", "CBR"]) {
      const pct = circles[key];
      if (!pct) continue;
      const u = (pct.percent_x || 0) / 100.0;
      const v = (pct.percent_y || 0) / 100.0;
      mc[key] = {
        x:
          (1 - u) * (1 - v) * TL.x +
          u * (1 - v) * TR.x +
          (1 - u) * v * BL.x +
          u * v * BR.x,
        y:
          (1 - u) * (1 - v) * TL.y +
          u * (1 - v) * TR.y +
          (1 - u) * v * BL.y +
          u * v * BR.y,
      };
    }

    if (!(mc.CTL && mc.CTR && mc.CBL && mc.CBR)) continue;

    for (let r = 0; r < rows; r++) {
      const v = rows === 1 ? 0 : r / (rows - 1);
      for (let c = 0; c < cols; c++) {
        const u = cols === 1 ? 0 : c / (cols - 1);
        const x =
          (1 - u) * (1 - v) * mc.CTL.x +
          u * (1 - v) * mc.CTR.x +
          (1 - u) * v * mc.CBL.x +
          u * v * mc.CBR.x;
        const y =
          (1 - u) * (1 - v) * mc.CTL.y +
          u * (1 - v) * mc.CTR.y +
          (1 - u) * v * mc.CBL.y +
          u * v * mc.CBR.y;

        ctx.beginPath();
        ctx.fillStyle =
          type === "numeric" ? "rgba(0,255,128,0.95)" : "rgba(255,200,0,0.95)";
        ctx.arc(Math.round(x), Math.round(y), 3 * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function handleCapture(markers) {
  const dataURL =
    OMR_STATE.lastProcessedDataURL ||
    OMR_STATE.lastCleanDataURL ||
    OMR_STATE.canvas.toDataURL("image/png");
  createSnapshotOverlay(dataURL, markers);
}

function createSnapshotOverlay(dataURL, markers) {
  const existing = document.getElementById("omrSnapshotOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "omrSnapshotOverlay";

  const panel = document.createElement("div");
  panel.className = "snapshot-panel";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Cerrar y continuar";
  closeBtn.onclick = () => {
    overlay.remove();
    OMR_STATE.captured = false;
    processingLoop();
  };

  const info = document.createElement("div");
  info.className = "snapshot-info";

  const canvasWrap = document.createElement("div");
  canvasWrap.className = "snapshot-canvas-wrapper";
  const snapCanvas = document.createElement("canvas");
  canvasWrap.appendChild(snapCanvas);

  const list = document.createElement("div");
  list.className = "snapshot-list";
  const title = document.createElement("div");
  title.className = "snapshot-list-title";
  title.textContent = "Snapshot - Coordenadas (px)";
  const ul = document.createElement("ul");
  list.appendChild(title);
  list.appendChild(ul);

  info.appendChild(canvasWrap);
  info.appendChild(list);
  panel.appendChild(closeBtn);
  panel.appendChild(info);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const img = new Image();
  img.onload = () => {
    snapCanvas.width = img.width;
    snapCanvas.height = img.height;
    const sctx = snapCanvas.getContext("2d");
    sctx.drawImage(img, 0, 0);

    const labelMap = {};
    markers.forEach((n) => {
      labelMap[n.label] = { x: n.cx, y: n.cy };
      const li = document.createElement("li");
      li.textContent = `${n.label}: ${Math.round(n.cx)}, ${Math.round(n.cy)}`;
      ul.appendChild(li);
    });

    const required = ["TL", "TR", "BL", "BR"];
    const hasAllCorners = required.every((l) => !!labelMap[l]);

    if (hasAllCorners && typeof cv !== "undefined") {
      try {
        const { correctedCanvas, correctedMat, matrix } =
          performPerspectiveCorrection(snapCanvas, labelMap);
        if (correctedCanvas) {
          const corrWrap = document.createElement("div");
          corrWrap.style.marginTop = "8px";
          corrWrap.appendChild(correctedCanvas);
          canvasWrap.appendChild(corrWrap);

          const { finalResults } = extractAndDrawResults(
            correctedCanvas,
            correctedMat,
            matrix,
            labelMap
          );

          const resultWrap = document.createElement("div");
          resultWrap.className = "snapshot-result-wrapper";
          const resultTitle = document.createElement("div");
          resultTitle.className = "snapshot-result-title";
          resultTitle.textContent = "Resultados:";
          resultWrap.appendChild(resultTitle);
          const resultValue = document.createElement("div");
          resultValue.className = "snapshot-result-value";
          resultValue.textContent = JSON.stringify(finalResults, null, 2);
          resultWrap.appendChild(resultValue);
          corrWrap.appendChild(resultWrap);
        }
        correctedMat.delete();
        matrix.delete();
      } catch (err) {
        console.error("Error en el procesamiento de la perspectiva:", err);
      }
    }
  };
  img.src = dataURL;
}

function performPerspectiveCorrection(snapCanvas, labelMap) {
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

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    labelMap["TL"].x,
    labelMap["TL"].y,
    labelMap["TR"].x,
    labelMap["TR"].y,
    labelMap["BL"].x,
    labelMap["BL"].y,
    labelMap["BR"].x,
    labelMap["BR"].y,
  ]);
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    dstWScaled,
    0,
    0,
    dstHScaled,
    dstWScaled,
    dstHScaled,
  ]);

  let srcMat = cv.imread(snapCanvas);
  let M = cv.getPerspectiveTransform(srcTri, dstTri);
  let dstMat = new cv.Mat();
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

  const correctedCanvas = createCanvas(dstWScaled, dstHScaled);
  cv.imshow(correctedCanvas, dstMat);

  srcTri.delete();
  dstTri.delete();
  srcMat.delete();

  return { correctedCanvas: correctedCanvas, correctedMat: dstMat, matrix: M };
}

function extractAndDrawResults(
  correctedCanvas,
  correctedMat,
  matrix,
  labelMap
) {
  const { circleTemplate } = OMR_STATE;
  if (!Array.isArray(circleTemplate) || circleTemplate.length === 0) {
    return { finalResults: [] };
  }

  const cctx = correctedCanvas.getContext("2d");
  const finalResults = [];

  const gray = new cv.Mat();
  cv.cvtColor(correctedMat, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);

  for (const matrixDef of circleTemplate) {
    const { circles, rows, cols, type } = matrixDef;
    if (!circles) continue;

    const circlesSrc = {};
    for (const k of ["CTL", "CTR", "CBL", "CBR"]) {
      const pct = circles[k];
      if (!pct) continue;
      const u = (pct.percent_x || 0) / 100.0;
      const v = (pct.percent_y || 0) / 100.0;
      circlesSrc[k] = {
        x:
          (1 - u) * (1 - v) * labelMap["TL"].x +
          u * (1 - v) * labelMap["TR"].x +
          (1 - u) * v * labelMap["BL"].x +
          u * v * labelMap["BR"].x,
        y:
          (1 - u) * (1 - v) * labelMap["TL"].y +
          u * (1 - v) * labelMap["TR"].y +
          (1 - u) * v * labelMap["BL"].y +
          u * v * labelMap["BR"].y,
      };
    }

    if (!(circlesSrc.CTL && circlesSrc.CTR && circlesSrc.CBL && circlesSrc.CBR))
      continue;

    const srcPtsArr = [];
    for (let r = 0; r < rows; r++) {
      const v = rows === 1 ? 0 : r / (rows - 1);
      for (let c = 0; c < cols; c++) {
        const u = cols === 1 ? 0 : c / (cols - 1);
        srcPtsArr.push(
          (1 - u) * (1 - v) * circlesSrc.CTL.x +
            u * (1 - v) * circlesSrc.CTR.x +
            (1 - u) * v * circlesSrc.CBL.x +
            u * v * circlesSrc.CBR.x,
          (1 - u) * (1 - v) * circlesSrc.CTL.y +
            u * (1 - v) * circlesSrc.CTR.y +
            (1 - u) * v * circlesSrc.CBL.y +
            u * v * circlesSrc.CBR.y
        );
      }
    }

    const srcPts = cv.matFromArray(rows * cols, 1, cv.CV_32FC2, srcPtsArr);
    const dstPts = new cv.Mat();
    cv.perspectiveTransform(srcPts, dstPts, matrix);

    const darkThresh = 100;
    const requiredFraction = 0.5;
    const displayRadius = 5;
    const localRadius = displayRadius;

    const detectedPoints = [];
    const fractions = [];
    const dstData = dstPts.data32F;

    for (let i = 0; i < dstData.length; i += 2) {
      const dx = Math.round(dstData[i]);
      const dy = Math.round(dstData[i + 1]);
      if (
        dx < 0 ||
        dy < 0 ||
        dx >= correctedCanvas.width ||
        dy >= correctedCanvas.height
      ) {
        detectedPoints.push(false);
        fractions.push(0);
        continue;
      }

      let darkCount = 0,
        totalCount = 0;
      const r2 = localRadius * localRadius;
      const xmin = Math.max(0, dx - localRadius),
        xmax = Math.min(correctedCanvas.width - 1, dx + localRadius);
      const ymin = Math.max(0, dy - localRadius),
        ymax = Math.min(correctedCanvas.height - 1, dy + localRadius);

      for (let yy = ymin; yy <= ymax; yy++) {
        const rowPtr = gray.ucharPtr(yy);
        for (let xx = xmin; xx <= xmax; xx++) {
          if ((xx - dx) ** 2 + (yy - dy) ** 2 > r2) continue;
          totalCount++;
          if (rowPtr[xx] <= darkThresh) darkCount++;
        }
      }
      const frac = totalCount > 0 ? darkCount / totalCount : 0;
      detectedPoints.push(frac >= requiredFraction);
      fractions.push(frac);
    }

    cctx.fillStyle =
      type === "numeric"
        ? "rgba(0, 255, 128, 0.95)"
        : "rgba(255, 200, 0, 0.95)";
    for (let i = 0; i < dstData.length; i += 2) {
      const gx = Math.round(dstData[i]),
        gy = Math.round(dstData[i + 1]);
      if (
        gx < 0 ||
        gy < 0 ||
        gx >= correctedCanvas.width ||
        gy >= correctedCanvas.height
      )
        continue;
      cctx.beginPath();
      cctx.arc(gx, gy, displayRadius, 0, Math.PI * 2);
      cctx.fill();
    }

    if (type === "numeric") {
      const codeDigits = [];
      for (let c = 0; c < cols; c++) {
        let bestRow = -1,
          bestFrac = -1;
        for (let r = 0; r < rows; r++) {
          const i = r * cols + c;
          if (detectedPoints[i] && fractions[i] > bestFrac) {
            bestFrac = fractions[i];
            bestRow = r;
          }
        }
        codeDigits.push(
          bestRow !== -1 && bestRow !== rows - 1 ? bestRow + 1 : 0
        );
      }
      finalResults.push({
        typeOrigin: "numeric",
        contentType: "number",
        content: codeDigits.join(""),
      });
    } else if (type === "question") {
      const answers = [];
      for (let r = 0; r < rows; r++) {
        let bestCol = -1,
          bestFrac = -1;
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (detectedPoints[i] && fractions[i] > bestFrac) {
            bestFrac = fractions[i];
            bestCol = c;
          }
        }
        answers.push({
          question: r + 1,
          answer:
            bestCol !== -1
              ? String.fromCharCode("a".charCodeAt(0) + bestCol)
              : "",
        });
      }
      finalResults.push({
        typeOrigin: "question",
        contentType: "array",
        content: answers,
      });
    }

    cctx.fillStyle = "rgba(255,0,0,0.95)";
    for (let i = 0; i < detectedPoints.length; i++) {
      if (detectedPoints[i]) {
        const px = Math.round(dstPts.data32F[i * 2]);
        const py = Math.round(dstPts.data32F[i * 2 + 1]);
        cctx.beginPath();
        cctx.arc(px, py, displayRadius, 0, Math.PI * 2);
        cctx.fill();
      }
    }

    srcPts.delete();
    dstPts.delete();
  }

  gray.delete();
  return { finalResults };
}

function fetchMatrixCode() {
    fetch("matrizCode.txt")
        .then(r => r.text())
        .then(txt => {
            try {
                const matrixTemplate = parseMatrixCode(txt);
                if (matrixTemplate) {
                    OMR_STATE.matrixTemplate = matrixTemplate;
                    console.log("matrixTemplate cargado: ", OMR_STATE.matrixTemplate);
                }
            } catch (err) {
                console.warn("No se pudo parsear matrizCode.txt", err);
            }
        })
        .catch(() => console.warn("No se encontró o no se pudo cargar matrizCode.txt"));
}

function parseMatrixCode(txt) {
    // 1. Parse viewBox or width/height to get dimensions
    let vbMatch = txt.match(/viewBox\s*=\s*"([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)"/i);
    let vw = 1, vh = 1;
    if (vbMatch) {
        vw = parseFloat(vbMatch[3]);
        vh = parseFloat(vbMatch[4]);
    } else {
        let wMatch = txt.match(/width\s*=\s*"([\d.]+)mm"/i);
        let hMatch = txt.match(/height\s*=\s*"([\d.]+)mm"/i);
        if (wMatch && hMatch) {
            vw = parseFloat(wMatch[1]);
            vh = parseFloat(hMatch[1]);
        }
    }

    // 2. Parse ellipses to get points
    const points = [];
    const ellRe = /<ellipse[^>]*cx\s*=\s*"([\d.-]+)"[^>]*cy\s*=\s*"([\d.-]+)"/gi;
    let m;
    while ((m = ellRe.exec(txt))) {
        const cx = parseFloat(m[1]);
        const cy = parseFloat(m[2]);
        points.push({ u: cx / vw, v: cy / vh, cx, cy });
    }
    if (points.length === 0) return null;

    // 3. Parse marker groups
    const groupRe = /<g[^>]*transform\s*=\s*"translate\(([\d.-]+)\s*,\s*([\d.-]+)\)"[^>]*>([\s\S]*?)<\/g>/gi;
    const rectRe = /<rect[^>]*x\s*=\s*"([\d.-]+)"[^>]*y\s*=\s*"([\d.-]+)"[^>]*width\s*=\s*"([\d.-]+)"[^>]*height\s*=\s*"([\d.-]+)"/i;
    const markerGroups = [];
    while ((m = groupRe.exec(txt))) {
        const gx = parseFloat(m[1]);
        const gy = parseFloat(m[2]);
        const r = rectRe.exec(m[3]);
        if (r) {
            const rw = parseFloat(r[3]), rh = parseFloat(r[4]);
            markerGroups.push({ cx: gx + parseFloat(r[1]) + rw / 2, cy: gy + parseFloat(r[2]) + rh / 2 });
        }
    }

    // 4. Sort and assign template markers
    let templateMarkers = null;
    if (markerGroups.length >= 6) {
        const sortedByY = markerGroups.slice().sort((a, b) => a.cy - b.cy);
        const top = sortedByY.slice(0, 3).sort((a, b) => a.cx - b.cx);
        const bottom = sortedByY.slice(-3).sort((a, b) => a.cx - b.cx);
        templateMarkers = [...top, ...bottom];
    }

    return {
        vw, vh, points, templateMarkers,
        umin: Math.min(...points.map(p => p.u)),
        umax: Math.max(...points.map(p => p.u)),
        vmin: Math.min(...points.map(p => p.v)),
        vmax: Math.max(...points.map(p => p.v)),
        cornerWeights: null // This feature is disabled for robustness.
    };
}
