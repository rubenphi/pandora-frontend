export function setupUI(OMR_STATE) {
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

export function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
