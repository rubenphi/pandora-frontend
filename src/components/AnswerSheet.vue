<template>
  <div class="answer-sheet-container">
    <!-- Contenedor visible: Muestra la imagen generada -->
    <div class="preview-container" v-if="generatedImageSrc">
      <img
        :src="generatedImageSrc"
        alt="Vista previa hoja de respuesta"
        class="generated-preview"
      />
    </div>
    <div v-else class="loading-state">Generando vista previa...</div>

    <!-- Contenedor oculto: Fuente fija para html2canvas -->
    <div class="hidden-source-wrapper">
      <div
        class="image-wrapper"
        ref="sourceElementRef"
        :style="{
          width: newImageWidth + 'px',
          height: newImageHeight + 'px',
          position: 'relative',
          overflow: 'hidden',
        }"
      >
        <img
          src="/hoja50.jpg"
          alt="Hoja OMR"
          class="base-image"
          @load="onImageLoad"
          style="width: 100%; height: 100%; display: block"
        />
        <div ref="textLayerRef" class="text-layer"></div>
        <div ref="digitLayerRef" class="digit-layer"></div>
        <div ref="gridOverlayRef" class="grid-overlay"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { onBeforeUnmount, ref, watch, nextTick } from "vue";
import html2canvas from "html2canvas";

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
    const sourceElementRef = ref(null);

    // Nueva variable para la imagen generada
    const generatedImageSrc = ref(null);
    const isImageLoaded = ref(false);

    // --- Configuración de Dimensiones y Posicionamiento ---
    const newImageWidth = 3313;
    const newImageHeight = 4919;

    const originalImageWidth = 3313;
    const originalImageHeight = 4919;

    // --- Variables de Posicionamiento ---
    const nameTopPercent = (110 / originalImageHeight) * 100;
    const nameLeftPercent = (600 / originalImageWidth) * 100;
    const nameWidthPercent = (2934 / originalImageWidth) * 100;
    const nameHeightPercent = (114 / originalImageHeight) * 100;
    const nameFontSizePx = 120; // Aumentado para resolución completa

    const courseTopPercent = (330 / originalImageHeight) * 100;
    const courseLeftPercent = (600 / originalImageWidth) * 100;
    const courseWidthPercent = (1883 / originalImageWidth) * 100;
    const courseHeightPercent = (161 / originalImageHeight) * 100;
    const courseFontSizePx = 120; // Aumentado para resolución completa

    const digitsTopPercent = (1200 / originalImageHeight) * 100;
    const digitsLeftPercent = (670 / originalImageWidth) * 100;
    const digitsWidthPercent = (1309 / originalImageWidth) * 100;
    const digitsHeightPercent = (100 / originalImageHeight) * 100;

    const matrixTopPercent = (1360 / originalImageHeight) * 100;
    const matrixLeftPercent = (671 / originalImageWidth) * 100;
    const matrixWidthPercent = (1303 / originalImageWidth) * 100;
    const matrixHeightPercent = (1320 / originalImageHeight) * 100;
    const matrixGapPx = 20; // Ajustado para resolución completa

    const COLS = 10;
    const ROWS = 10;

    const onImageLoad = () => {
      isImageLoaded.value = true;
      tryGenerate();
    };

    const tryGenerate = () => {
      if (isImageLoaded.value) {
        initializeSheet();
        // Esperamos un tick para que el DOM se actualice con los datos
        nextTick(() => {
          // Un pequeño delay extra asegura que todo esté renderizado
          setTimeout(() => {
            generateImage();
          }, 100);
        });
      }
    };

    watch(
      [() => props.student, () => props.courseName],
      () => {
        generatedImageSrc.value = null; // Resetear imagen mientras carga
        nextTick(() => {
          tryGenerate();
        });
      },
      { deep: true, immediate: true }
    );

    const generateImage = async () => {
      if (!sourceElementRef.value) return;

      try {
        const canvas = await html2canvas(sourceElementRef.value, {
          useCORS: true,
          scale: 1, // Escala 1 porque ya trabajamos con dimensiones completas
          width: newImageWidth,
          height: newImageHeight,
          windowWidth: newImageWidth,
          windowHeight: newImageHeight,
          backgroundColor: null,
          logging: false, // Evitar logs en consola (#1)
        });
        generatedImageSrc.value = canvas.toDataURL("image/png");
      } catch (error) {
        console.error("Error generating answer sheet image:", error);
      }
    };

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
          cell.className = "grid-cell-fixed"; // Clase específica
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
      // Usamos la nueva clase específica
      const cells = overlay.querySelectorAll(".grid-cell-fixed");
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
        } else {
          cell.style.background = "transparent";
          cell.style.borderRadius = "0";
        }
      });
    };

    const putText = (
      str,
      topPercent,
      leftPercent,
      widthPercent,
      heightPercent,
      fontSize
    ) => {
      const textLayer = textLayerRef.value;
      if (!textLayer) return;

      const div = document.createElement("div");
      // No usamos clases de CSS globales para evitar interferencias responsivas
      // Estilos inline estrictos para la generación
      div.style.cssText = `
        position: absolute;
        left: ${leftPercent}%;
        top: ${topPercent}%;
        width: ${widthPercent}%;
        height: ${heightPercent}%;
        font-size: ${fontSize}px;
        line-height: 1;
        background: transparent;
        border: none;
        color: black;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: clip;
        font-family: Arial, sans-serif;
        display: flex;
        align-items: center;
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
        display: flex;
      `;

      for (let i = 0; i < codeToDisplay.length; i++) {
        const div = document.createElement("div");
        // Estilos inline fijos
        div.style.cssText = `
          position: absolute;
          left: ${i * digitWidthPercent}%;
          top: 0;
          width: ${digitWidthPercent}%;
          height: 100%;
          font-size: 140px; 
          line-height: 1;
          background: transparent;
          border: none;
          color: black;
          text-align: center;
          overflow: hidden;
          white-space: nowrap;
          font-family: Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
        `;
        div.textContent = codeToDisplay[i];

        containerDiv.appendChild(div);
      }
      layer.appendChild(containerDiv);
    };

    const numberToMatrix = (input) => {
      let str = String(input).replace(/\D/g, "");
      // Aseguramos 10 dígitos para la grilla
      str = str.padStart(COLS, "0").slice(0, COLS);

      const matrix = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

      for (let col = 0; col < COLS; col++) {
        const digit = parseInt(str[col], 10);
        if (!isNaN(digit)) {
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
      if (!overlay) return;

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
          nameFontSizePx
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
        // Normalizamos a 10 dígitos para visualización y matriz
        const paddedCode = String(student.code).replace(/\D/g, "").padStart(COLS, "0").slice(0, COLS);
        
        putDigits(
          paddedCode,
          digitsTopPercent,
          digitsLeftPercent,
          digitsWidthPercent,
          digitsHeightPercent
        );
        const { matrix } = numberToMatrix(paddedCode);
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
      textLayerRef,
      digitLayerRef,
      gridOverlayRef,
      sourceElementRef,
      newImageWidth,
      newImageHeight,
      onImageLoad,
      generatedImageSrc,
    };
  },
};
</script>

<style scoped>
.answer-sheet-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  position: relative;
}

.preview-container {
  width: 100%;
  max-width: 500px; /* Ajusta según el modal */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.generated-preview {
  width: 100%;
  height: auto;
  display: block;
}

/* Ocultar la fuente "real" fuera de la pantalla pero mantenerla renderizada */
.hidden-source-wrapper {
  position: fixed;
  left: -10000px;
  top: -10000px;
  visibility: visible; /* html2canvas necesita visibilidad */
}

.loading-state {
  padding: 20px;
  text-align: center;
  font-weight: bold;
  color: #666;
}
</style>
