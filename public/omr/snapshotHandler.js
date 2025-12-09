import { getCv } from "./omrState.js";
import {
  performPerspectiveCorrection,
  extractAndDrawResults,
  processingLoop,
} from "./imageProcessor.js";

export function handleCapture(OMR_STATE, markers) {
  const dataURL =
    OMR_STATE.lastProcessedDataURL ||
    OMR_STATE.lastCleanDataURL ||
    OMR_STATE.canvas.toDataURL("image/png");
  createSnapshotOverlay(OMR_STATE, dataURL, markers);
}

export function createSnapshotOverlay(OMR_STATE, dataURL, markers) {
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
    // Assuming processingLoop is accessible globally or passed
    processingLoop(OMR_STATE);
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

    if (hasAllCorners && typeof getCv() !== "undefined") {
      try {
        const { correctedCanvas, correctedMat, matrix } =
          performPerspectiveCorrection(OMR_STATE, snapCanvas, labelMap);
        if (correctedCanvas) {
          const corrWrap = document.createElement("div");
          corrWrap.style.marginTop = "8px";
          corrWrap.appendChild(correctedCanvas);
          canvasWrap.appendChild(corrWrap);

          const { finalResults } = extractAndDrawResults(
            OMR_STATE,
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
