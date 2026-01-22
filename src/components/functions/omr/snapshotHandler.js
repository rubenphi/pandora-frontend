import { getCv } from "./omrState.js";
import { restartProcessing } from "./imageProcessor.js";
import { 
  performPerspectiveCorrectionWithCurvature, 
  extractAndDrawResultsWithCurvature 
} from "./perspectiveCorrection.js";

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
    restartProcessing(OMR_STATE);
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

  // Agregar indicador de corrección de curvatura
  const curveIndicator = document.createElement("div");
  curveIndicator.className = "curve-indicator";
  curveIndicator.style.marginTop = "8px";
  curveIndicator.style.padding = "8px";
  curveIndicator.style.borderRadius = "4px";
  curveIndicator.style.fontSize = "12px";

  info.appendChild(canvasWrap);
  info.appendChild(list);
  info.appendChild(curveIndicator);
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
        // Usar el nuevo sistema de corrección con curvatura
        const { correctedCanvas, correctedMat, matrix, curvatureDetected } =
          performPerspectiveCorrectionWithCurvature(OMR_STATE, snapCanvas, labelMap);
        
        // Actualizar indicador visual
        if (curvatureDetected) {
          curveIndicator.textContent = "✓ Corrección de curvatura aplicada";
          curveIndicator.style.backgroundColor = "rgba(64, 224, 208, 0.2)";
          curveIndicator.style.color = "rgb(64, 224, 208)";
        } else {
          curveIndicator.textContent = "○ Corrección estándar aplicada";
          curveIndicator.style.backgroundColor = "rgba(128, 128, 128, 0.2)";
          curveIndicator.style.color = "rgb(180, 180, 180)";
        }
        
        if (correctedCanvas) {
          const corrWrap = document.createElement("div");
          corrWrap.style.marginTop = "8px";
          corrWrap.appendChild(correctedCanvas);
          canvasWrap.appendChild(corrWrap);

          // Usar el método mejorado de extracción de resultados
          const { finalResults } = extractAndDrawResultsWithCurvature(
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
          
          // Agregar botón para copiar resultados
          const copyBtn = document.createElement("button");
          copyBtn.textContent = "Copiar JSON";
          copyBtn.style.marginTop = "8px";
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(JSON.stringify(finalResults, null, 2));
            copyBtn.textContent = "✓ Copiado";
            setTimeout(() => copyBtn.textContent = "Copiar JSON", 2000);
          };
          resultWrap.appendChild(copyBtn);
          
          corrWrap.appendChild(resultWrap);
        }
        
        // Limpiar recursos de OpenCV
        correctedMat.delete();
        matrix.delete();
        
      } catch (err) {
        console.error("Error en el procesamiento de la perspectiva:", err);
        
        // Mostrar error en el indicador
        curveIndicator.textContent = `✗ Error: ${err.message}`;
        curveIndicator.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
        curveIndicator.style.color = "rgb(255, 100, 100)";
      }
    } else if (!hasAllCorners) {
      curveIndicator.textContent = "✗ Faltan esquinas para corrección";
      curveIndicator.style.backgroundColor = "rgba(255, 165, 0, 0.2)";
      curveIndicator.style.color = "rgb(255, 165, 0)";
    }
  };
  img.src = dataURL;
}