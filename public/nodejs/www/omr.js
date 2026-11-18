import { initializeOmrState, setCv } from "./omr/omrState.js";
import { fetchTemplates } from "./omr/templateLoader.js";
import { startCamera } from "./omr/cameraHandler.js";
import { setupUI } from "./omr/uiSetup.js";
import { initOpenCV } from "./omr/imageProcessor.js";

// Global state placeholder

// Entry point called from HTML after OpenCV.js is loaded
window.onOpenCvReady = function () {
  setCv(window.cv); // Assign the cv object when ready
  document.getElementById("status").textContent = "OpenCV.js cargado.";
  main();
};

async function main() {
  try {
    const OMR_STATE = initializeOmrState();
    const templates = await fetchTemplates();
    OMR_STATE.circleTemplate = templates.circleTemplate;
    OMR_STATE.matrixTemplate = null; // Will be populated by parsing matrizCode.txt

    setupUI(OMR_STATE);
    await startCamera(OMR_STATE);
    initOpenCV(OMR_STATE);
  } catch (error) {
    console.error("Error en la inicialización:", error);
    document.getElementById("status").textContent = `Error: ${error.message}`;
  }
}
