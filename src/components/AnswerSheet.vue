<template>
  <div class="answer-sheet" :style="{ transform: `scale(${scale})` }">
    <div class="image-wrapper" :id="`imageWrapper-${student.id}`">
      <img
        src="/hoja50.jpg"
        alt="Hoja OMR"
        class="base-image"
        @load="initializeSheet"
      />
      <div :id="`text-layer-${student.id}`" class="text-layer"></div>
      <div :id="`digit-layer-${student.id}`" class="digit-layer"></div>
      <div :id="`grid-overlay-${student.id}`" class="grid-overlay"></div>
    </div>
  </div>
</template>

<script>
import { onBeforeUnmount } from "vue";

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
    scale: {
      type: Number,
      default: 0.1044,
    },
  },
  setup(props) {
    const digitLayerId = `digit-layer-${props.student.id}`;
    const textLayerId = `text-layer-${props.student.id}`;
    const gridOverlayId = `grid-overlay-${props.student.id}`;

    const AREA_LEFT = 560;
    const AREA_TOP = 930;
    const AREA_WIDTH = 825;
    const AREA_HEIGHT = 918;
    const COLS = 9;
    const ROWS = 10;

    const createGridOverlay = () => {
      const overlay = document.getElementById(gridOverlayId);
      if (!overlay) return null;

      overlay.style.cssText = `
        position: absolute;
        left: ${AREA_LEFT}px;
        top: ${AREA_TOP}px;
        width: ${AREA_WIDTH}px;
        height: ${AREA_HEIGHT}px;
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        grid-template-rows: repeat(10, 1fr);
        gap: 20px;
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
          cell.classList.add("filled");
        } else {
          cell.style.background = "transparent";
          cell.classList.remove("filled");
        }
      });
    };

    const putText = (str, x1, y1, x2, y2) => {
      const textLayer = document.getElementById(textLayerId);
      if (!textLayer) return;

      const width = x2 - x1;
      const height = y2 - y1;

      const div = document.createElement("div");
      div.className = "text-box";
      div.style.cssText = `
        position: absolute;
        left: ${x1}px;
        top: ${y1}px;
        width: ${width}px;
        height: ${height}px;
        font-size: ${Math.floor(height * 0.8)}px;
        line-height: ${height}px;
        background: transparent;
        border: none;
        color: black;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: clip;
        font-family: Arial, sans-serif;
      `;
      div.textContent = str;

      textLayer.appendChild(div);
    };

    const putDigits = (str, x1, y1, x2, y2) => {
      const layer = document.getElementById(digitLayerId);
      if (!layer) return;

      const width = x2 - x1;
      const height = y2 - y1;
      const n = str.length;
      const cellWidth = width / n;

      for (let i = 0; i < n; i++) {
        const div = document.createElement("div");
        div.className = "digit-box";
        div.style.cssText = `
          position: absolute;
          left: ${x1 + i * cellWidth}px;
          top: ${y1}px;
          width: ${cellWidth}px;
          height: ${height}px;
          font-size: ${Math.floor(height * 0.8)}px;
          line-height: ${height}px;
          background: transparent;
          border: none;
          color: black;
          text-align: center;
          overflow: hidden;
          white-space: nowrap;
          font-family: Arial, sans-serif;
        `;
        div.textContent = str[i];

        layer.appendChild(div);
      }
    };

    const numberToMatrix = (input) => {
      let str = String(input).replace(/\D/g, "");

      if (str.length > 9) {
        str = str.slice(-9);
      } else if (str.length < 9) {
        str = str.padStart(9, "0");
      }

      const matrix = Array.from({ length: 10 }, () => Array(9).fill(0));

      for (let col = 0; col < 9; col++) {
        const digit = parseInt(str[col], 10);
        if (!isNaN(digit)) {
          matrix[digit][col] = 1;
        }
      }

      return { adjusted: str, matrix };
    };

    const initializeSheet = () => {
      setTimeout(() => {
        const overlay = createGridOverlay();

        if (!overlay) {
          return;
        }

        const student = props.student;
        const textLayer = document.getElementById(textLayerId);
        const digitLayer = document.getElementById(digitLayerId);

        if (textLayer) textLayer.innerHTML = "";
        if (digitLayer) digitLayer.innerHTML = "";

        if (student.name && student.lastName) {
          putText(`${student.lastName} ${student.name}`, 666, 145, 3579, 281);
        }

        if (props.courseName) {
          putText(props.courseName, 1696, 448, 3579, 566);
        }

        if (student.code) {
          putDigits(student.code, 465, 826, 1386, 904);
          const { matrix } = numberToMatrix(student.code);
          setMatrix(overlay, matrix);
        }
      }, 150);
    };

    onBeforeUnmount(() => {
      const textLayer = document.getElementById(textLayerId);
      const digitLayer = document.getElementById(digitLayerId);
      const overlay = document.getElementById(gridOverlayId);

      if (textLayer) textLayer.innerHTML = "";
      if (digitLayer) digitLayer.innerHTML = "";
      if (overlay) overlay.innerHTML = "";
    });

    return {
      initializeSheet,
    };
  },
};
</script>

<style scoped>
.answer-sheet {
  display: inline-block;
  transform-origin: top left;
}

.image-wrapper {
  position: relative;
  width: 3907px;
  height: 3954px;
  user-select: none;
}

.image-wrapper img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.text-layer,
.digit-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.grid-overlay {
  pointer-events: none;
}

.grid-cell.filled {
  background: black !important;
}
</style>
