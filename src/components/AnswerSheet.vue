<template>
  <div class="answer-sheet" ref="answerSheetRef">
    <div
      class="image-wrapper"
      :style="{
        transform: `scale(${internalScale})`,
        transformOrigin: 'top left',
      }"
    >
      <img
        src="/hoja50.jpg"
        alt="Hoja OMR"
        class="base-image"
        @load="initializeSheet"
      />
      <div ref="textLayerRef" class="text-layer"></div>
      <div ref="digitLayerRef" class="digit-layer"></div>
      <div ref="gridOverlayRef" class="grid-overlay"></div>
    </div>
  </div>
</template>

<script>
import { onBeforeUnmount, ref, onMounted, watch, nextTick } from "vue";

export default {
  props: {
    student: {
      type: Object,
      required: true,
    },
    courseName: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const textLayerRef = ref(null);
    const digitLayerRef = ref(null);
    const gridOverlayRef = ref(null);
    const answerSheetRef = ref(null); // Add ref for the root element
    const internalScale = ref(1.1); // Default to 1, will be calculated

    // --- Configuración de Dimensiones y Posicionamiento ---
    // Nuevas dimensiones de la imagen (en píxeles).
    const newImageWidth = 3313;
    const newImageHeight = 4919;

    // Dimensiones originales de la imagen de referencia (en píxeles).
    // Usadas como base para calcular las posiciones relativas en porcentaje.
    const originalImageWidth = 3313;
    const originalImageHeight = 4919; // Changed from 3520 to 4919

    // --- Variables de Posicionamiento (basadas en el layout original) ---
    // Estas variables usan porcentajes para posicionar los elementos.
    // Se basan en las coordenadas de píxeles del diseño original para mantener la consistencia.
    // La altura original (3520px) se usa como referencia para las posiciones verticales.

    // Posición y tamaño del nombre del estudiante
    const nameTopPercent = (110 / originalImageHeight) * 100;
    const nameLeftPercent = (600 / originalImageWidth) * 100;
    const nameWidthPercent = (2934 / originalImageWidth) * 100;
    const nameHeightPercent = (114 / originalImageHeight) * 100;
    const nameFontSizePx = 16;

    // Posición y tamaño del nombre del curso
    const courseTopPercent = (330 / originalImageHeight) * 100;
    const courseLeftPercent = (600 / originalImageWidth) * 100;
    const courseWidthPercent = (1883 / originalImageWidth) * 100;
    const courseHeightPercent = (161 / originalImageHeight) * 100;
    const courseFontSizePx = 16;

    // Posición de los dígitos del código del estudiante
    const digitsTopPercent = (1200 / originalImageHeight) * 100;
    const digitsLeftPercent = (670 / originalImageWidth) * 100;
    const digitsWidthPercent = (1309 / originalImageWidth) * 100; // Corrected value
    const digitsHeightPercent = (95 / originalImageHeight) * 100;
    // const digitsFontSizePx = 16; // Removed as it will be controlled by CSS

    // Posición y tamaño de la matriz de burbujas
    const matrixTopPercent = (1360 / originalImageHeight) * 100;
    const matrixLeftPercent = (671 / originalImageWidth) * 100;
    const matrixWidthPercent = (1303 / originalImageWidth) * 100;
    const matrixHeightPercent = (1320 / originalImageHeight) * 100;
    const matrixGapPx = 1.3;

    const COLS = 10; // Updated from 9 to 10
    const ROWS = 10;

    const calculateInternalScale = () => {
      if (answerSheetRef.value) {
        const containerWidth = answerSheetRef.value.offsetWidth;
        // Calculate scale based on the desired width relative to the original image width
        // We want the newImageWidth (3313px) to fit within the containerWidth
        internalScale.value = containerWidth / newImageWidth;
      }
    };

    onMounted(() => {
      nextTick(() => {
        // Ensure DOM is updated before calculating scale
        initializeSheet();
        calculateInternalScale();
      });
      window.addEventListener("resize", calculateInternalScale);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("resize", calculateInternalScale);
    });

    watch(
      [() => props.student, () => props.courseName],
      () => {
        nextTick(() => {
          // Ensure DOM is updated before re-initializing and calculating scale
          initializeSheet();
          calculateInternalScale();
        });
      },
      { deep: true }
    );

    const createGridOverlay = () => {
      const overlay = gridOverlayRef.value;
      if (!overlay) return null;

      overlay.style.cssText = `
        position: absolute;
        left: ${matrixLeftPercent}%;
        top: ${matrixTopPercent}%;
        width: ${matrixWidthPercent}%;
        height: ${matrixHeightPercent}%;
        display: grid;
        grid-template-columns: repeat(${COLS}, 1fr);
        grid-template-rows: repeat(${ROWS}, 1fr);
        gap: ${matrixGapPx}px;
        z-index: 50;
        pointer-events: none;
      `;

      overlay.innerHTML = "";

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = document.createElement("div");
          cell.className = "grid-cell";
          cell.dataset.row = r;
          cell.dataset.col = c;

          cell.style.cssText = `
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            background: transparent;
            border: 0px solid rgba(0, 0, 0, 0.08);
          `;

          overlay.appendChild(cell);
        }
      }

      return overlay;
    };

    const setMatrix = (overlay, matrix) => {
      if (!overlay) return;
      const cells = overlay.querySelectorAll(".grid-cell");
      if (!Array.isArray(matrix) || matrix.length !== ROWS) {
        return;
      }

      cells.forEach((cell) => {
        const r = parseInt(cell.dataset.row, 10);
        const c = parseInt(cell.dataset.col, 10);
        const val = matrix[r] && matrix[r][c] ? matrix[r][c] : 0;

        if (val === 1 || val === true) {
          cell.style.background = "black";
          cell.style.borderRadius = "50%";
          cell.classList.add("filled");
        } else {
          cell.style.background = "transparent";
          cell.style.borderRadius = "0";
          cell.classList.remove("filled");
        }
      });
    };

    const putText = (
      str,
      topPercent,
      leftPercent,
      widthPercent,
      heightPercent
    ) => {
      const textLayer = textLayerRef.value;
      if (!textLayer) return;

      const div = document.createElement("div");
      div.className = "text-box student-name-text"; // Add class here
      div.style.cssText = `
        position: absolute;
        left: ${leftPercent}%;
        top: ${topPercent}%;
        width: ${widthPercent}%;
        height: ${heightPercent}%;
        /* font-size is now controlled by CSS class */
        line-height: 1; /* Adjusted to 1 for consistency with generatePrintHTML */
        background: transparent;
        border: none;
        color: black;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: clip;
        font-family: Arial, sans-serif;
        display: flex; /* Added for consistency with generatePrintHTML */
        align-items: center; /* Added for consistency with generatePrintHTML */
      `;
      div.textContent = str;

      textLayer.appendChild(div);
    };

    const putDigits = (
      str,
      topPercent,
      leftPercent,
      widthPercent,
      heightPercent
    ) => {
      const layer = digitLayerRef.value;
      if (!layer) return;

      const codeToDisplay = String(str);
      const digitWidthPercent = 100 / codeToDisplay.length;

      const containerDiv = document.createElement("div");
      containerDiv.style.cssText = `
        position: absolute;
        left: ${leftPercent}%;
        top: ${topPercent}%;
        width: ${widthPercent}%;
        height: ${heightPercent}%;
        display: flex; /* Added for consistency with generatePrintHTML */
      `;

      for (let i = 0; i < codeToDisplay.length; i++) {
        const div = document.createElement("div");
        div.className = "digit-box student-code-digit-text"; // Add class here
        div.style.cssText = `
          position: absolute; /* Changed to absolute for individual positioning within containerDiv */
          left: ${i * digitWidthPercent}%;
          top: 0;
          width: ${digitWidthPercent}%;
          height: 100%;
          /* font-size is now controlled by CSS class */
          line-height: 1; /* Adjusted to 1 for consistency with generatePrintHTML */
          background: transparent;
          border: none;
          color: black;
          text-align: center;
          overflow: hidden;
          white-space: nowrap;
          font-family: Arial, sans-serif;
          display: flex; /* Added for consistency with generatePrintHTML */
          align-items: center; /* Added for consistency with generatePrintHTML */
          justify-content: center; /* Added for consistency with generatePrintHTML */
        `;
        div.textContent = codeToDisplay[i];

        containerDiv.appendChild(div);
      }
      layer.appendChild(containerDiv);
    };

    const numberToMatrix = (input) => {
      let str = String(input).replace(/\D/g, "");

      // Ensure formattedCode is 10 digits for a 10-column matrix
      str = str.padStart(COLS, "0").slice(0, COLS);

      const matrix = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

      for (let col = 0; col < COLS; col++) {
        const digit = parseInt(str[col], 10);
        if (!isNaN(digit)) {
          // Mapeo de dígitos a filas:
          // Dígito 1-9 -> Fila 1-9 (índice 0-8)
          // Dígito 0 -> Fila 10 (índice 9)
          const rowIndex = digit === 0 ? 9 : digit - 1;
          if (rowIndex >= 0 && rowIndex < ROWS) {
            matrix[rowIndex][col] = 1;
          }
        }
      }

      return { adjusted: str, matrix };
    };

    const initializeSheet = () => {
      const overlay = createGridOverlay();

      if (!overlay) {
        return;
      }

      const student = props.student;
      const textLayer = textLayerRef.value;
      const digitLayer = digitLayerRef.value;

      if (textLayer) textLayer.innerHTML = "";
      if (digitLayer) digitLayer.innerHTML = "";

      if (student.name && student.lastName) {
        putText(
          `${student.lastName} ${student.name}`,
          nameTopPercent,
          nameLeftPercent,
          nameWidthPercent,
          nameHeightPercent,
          nameFontSizePx // Use the prop for name font size
        );
      }

      if (props.courseName) {
        putText(
          props.courseName,
          courseTopPercent,
          courseLeftPercent,
          courseWidthPercent,
          courseHeightPercent,
          courseFontSizePx
        );
      }

      if (student.code) {
        putDigits(
          student.code,
          digitsTopPercent,
          digitsLeftPercent,
          digitsWidthPercent,
          digitsHeightPercent
        );
        const { matrix } = numberToMatrix(student.code);
        setMatrix(overlay, matrix);
      }
    };

    onBeforeUnmount(() => {
      const textLayer = textLayerRef.value;
      const digitLayer = digitLayerRef.value;
      const overlay = gridOverlayRef.value;

      if (textLayer) textLayer.innerHTML = "";
      if (digitLayer) digitLayer.innerHTML = "";
      if (overlay) overlay.innerHTML = "";
    });

    return {
      initializeSheet,
      textLayerRef,
      digitLayerRef,
      gridOverlayRef,
      newImageWidth, // Expose for template if needed, though CSS handles it
      newImageHeight, // Expose for template if needed, though CSS handles it
      internalScale,
    };
  },
};
</script>
