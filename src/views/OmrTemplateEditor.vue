<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Editor de Plantillas OMR</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="solid" color="light" @click="downloadPNG" title="Descargar PNG">
            <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
            PNG
          </ion-button>
          <ion-button fill="outline" color="light" @click="exportJSON" title="Exportar JSON">
            <ion-icon :icon="codeDownloadOutline" slot="start"></ion-icon>
            JSON
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="editor-layout">
        <!-- ===== LEFT PANEL ===== -->
        <div class="left-panel">

          <!-- Sheet config -->
          <div class="panel-card">
            <div class="panel-card-title">Hoja</div>
            <ion-item lines="full">
              <ion-label>Orientación</ion-label>
              <ion-select v-model="config.orientation" @ionChange="drawPreview" interface="action-sheet">
                <ion-select-option value="portrait">Vertical (Portrait)</ion-select-option>
                <ion-select-option value="landscape">Horizontal (Landscape)</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Nombre de Plantilla</ion-label>
              <ion-input v-model="config.name" placeholder="Ej: Encuesta 2026"></ion-input>
            </ion-item>
          </div>

          <!-- Sections list -->
          <div class="panel-card">
            <div class="panel-card-title-row">
              <span class="panel-card-title">Secciones</span>
              <ion-button size="small" color="success" fill="solid" @click="addNewSection">
                <ion-icon :icon="addOutline" slot="start"></ion-icon>
                Añadir
              </ion-button>
            </div>
            <div
              v-for="(sec, idx) in config.sections"
              :key="idx"
              class="section-list-item"
              :class="{ 'section-list-item--active': selectedIndex === idx }"
              @click="selectSection(idx)"
            >
              <div class="section-list-info">
                <span class="section-list-name">{{ sec.title || sec.name }}</span>
                <span class="section-list-meta">{{ sectionTypeLabel(sec.type) }}
                  <span v-if="sec.type === 'code'">· {{ sec.digits }} dígitos</span>
                  <span v-else>· {{ sec.rows }}×{{ sec.cols }}</span>
                </span>
              </div>
              <button class="section-delete-btn" @click.stop="removeSection(idx)" title="Eliminar">✕</button>
            </div>
            <div v-if="config.sections.length === 0" class="empty-sections-hint">
              Haz clic en "Añadir" para crear secciones
            </div>
          </div>

          <!-- Section properties -->
          <div class="panel-card" v-if="selectedSection">
            <div class="panel-card-title">
              Propiedades: <span class="accent-text">{{ selectedSection.title || selectedSection.name }}</span>
            </div>

            <ion-item lines="full">
              <ion-label position="stacked">Título visible en la hoja</ion-label>
              <ion-input v-model="selectedSection.title" @ionInput="drawPreview" placeholder="Título de la sección"></ion-input>
            </ion-item>

            <ion-item lines="full">
              <ion-label position="stacked">Nombre interno (JSON)</ion-label>
              <ion-input v-model="selectedSection.name" @ionInput="drawPreview" placeholder="seccion1"></ion-input>
            </ion-item>

            <ion-item lines="full">
              <ion-label>Tipo</ion-label>
              <ion-select v-model="selectedSection.type" @ionChange="onSectionTypeChange" interface="action-sheet">
                <ion-select-option value="code">Código de Identificación</ion-select-option>
                <ion-select-option value="question">Pregunta (única opción)</ion-select-option>
                <ion-select-option value="multiselect">Múltiple selección</ion-select-option>
              </ion-select>
            </ion-item>

            <!-- CODE section specific -->
            <template v-if="selectedSection.type === 'code'">
              <div class="props-group-title">Código Numérico</div>
              <div class="num-row">
                <div class="num-field">
                  <label>Dígitos</label>
                  <div class="num-input-row">
                    <ion-range v-model="selectedSection.digits" min="1" max="12" step="1" @ionChange="drawPreview"></ion-range>
                    <input class="num-input-box" type="number" v-model.number="selectedSection.digits" min="1" max="12" @change="drawPreview" />
                  </div>
                </div>
              </div>
              <div class="num-row">
                <div class="num-field">
                  <label>Tamaño celda escritura (px)</label>
                  <div class="num-input-row">
                    <ion-range v-model="selectedSection.cellSize" min="20" max="70" step="1" @ionChange="drawPreview"></ion-range>
                    <input class="num-input-box" type="number" v-model.number="selectedSection.cellSize" min="20" max="70" @change="drawPreview" />
                  </div>
                </div>
              </div>
              <div class="num-row">
                <div class="num-field">
                  <label>Separación columnas (px)</label>
                  <div class="num-input-row">
                    <ion-range v-model="selectedSection.colSpacing" min="24" max="80" step="1" @ionChange="drawPreview"></ion-range>
                    <input class="num-input-box" type="number" v-model.number="selectedSection.colSpacing" min="24" max="80" @change="drawPreview" />
                  </div>
                </div>
              </div>
              <div class="num-row">
                <div class="num-field">
                  <label>Separación filas burbujas (px)</label>
                  <div class="num-input-row">
                    <ion-range v-model="selectedSection.rowSpacing" min="16" max="60" step="1" @ionChange="drawPreview"></ion-range>
                    <input class="num-input-box" type="number" v-model.number="selectedSection.rowSpacing" min="16" max="60" @change="drawPreview" />
                  </div>
                </div>
              </div>
              <div class="num-row">
                <div class="num-field">
                  <label>Radio burbuja (px)</label>
                  <div class="num-input-row">
                    <ion-range v-model="selectedSection.radius" min="5" max="18" step="1" @ionChange="drawPreview"></ion-range>
                    <input class="num-input-box" type="number" v-model.number="selectedSection.radius" min="5" max="18" @change="drawPreview" />
                  </div>
                </div>
              </div>
            </template>

            <!-- QUESTION / MULTISELECT properties -->
            <template v-else>
              <div class="props-group-title">Dimensiones</div>
              <div class="num-row two-col">
                <div class="num-field">
                  <label>Filas</label>
                  <div class="num-input-row">
                    <ion-range v-model="selectedSection.rows" min="1" max="50" step="1" @ionChange="drawPreview"></ion-range>
                    <input class="num-input-box" type="number" v-model.number="selectedSection.rows" min="1" max="50" @change="drawPreview" />
                  </div>
                </div>
                <div class="num-field">
                  <label>Columnas</label>
                  <div class="num-input-row">
                    <ion-range v-model="selectedSection.cols" min="1" max="20" step="1" @ionChange="drawPreview"></ion-range>
                    <input class="num-input-box" type="number" v-model.number="selectedSection.cols" min="1" max="20" @change="drawPreview" />
                  </div>
                </div>
              </div>

              <div class="num-row">
                <div class="num-field">
                  <label>Separación columnas (px)</label>
                  <div class="num-input-row">
                    <ion-range v-model="selectedSection.colSpacing" min="20" max="100" step="1" @ionChange="drawPreview"></ion-range>
                    <input class="num-input-box" type="number" v-model.number="selectedSection.colSpacing" min="20" max="100" @change="drawPreview" />
                  </div>
                </div>
              </div>

              <div class="num-row">
                <div class="num-field">
                  <label>Separación filas (px)</label>
                  <div class="num-input-row">
                    <ion-range v-model="selectedSection.rowSpacing" min="16" max="80" step="1" @ionChange="drawPreview"></ion-range>
                    <input class="num-input-box" type="number" v-model.number="selectedSection.rowSpacing" min="16" max="80" @change="drawPreview" />
                  </div>
                </div>
              </div>

              <div class="num-row">
                <div class="num-field">
                  <label>Radio burbuja (px)</label>
                  <div class="num-input-row">
                    <ion-range v-model="selectedSection.radius" min="5" max="20" step="1" @ionChange="drawPreview"></ion-range>
                    <input class="num-input-box" type="number" v-model.number="selectedSection.radius" min="5" max="20" @change="drawPreview" />
                  </div>
                </div>
              </div>

              <div class="props-group-title">Etiquetas</div>
              <ion-item lines="full">
                <ion-label>Preset de etiquetas</ion-label>
                <ion-select v-model="selectedPreset" @ionChange="applyLabelPreset" interface="action-sheet">
                  <ion-select-option value="numbers">1, 2, 3…</ion-select-option>
                  <ion-select-option value="letters">A, B, C, D</ion-select-option>
                  <ion-select-option value="likert">Nunca / Algunas veces / Casi siempre / Siempre</ion-select-option>
                  <ion-select-option value="yesno">Sí / No</ion-select-option>
                  <ion-select-option value="custom">Personalizado</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item v-if="selectedPreset === 'custom'" lines="full">
                <ion-label position="stacked">Etiquetas (separadas por comas)</ion-label>
                <ion-input v-model="customLabelsInput" placeholder="Opción 1, Opción 2..." @ionInput="applyCustomLabels"></ion-input>
              </ion-item>

              <ion-item lines="none">
                <ion-label>Mostrar etiquetas en hoja</ion-label>
                <ion-toggle v-model="selectedSection.showLabels" @ionChange="drawPreview"></ion-toggle>
              </ion-item>

              <ion-item lines="none" v-if="selectedSection.showLabels">
                <ion-label position="stacked">Prefijo de fila (ej: Q, P)</ion-label>
                <ion-input v-model="selectedSection.rowPrefix" @ionInput="drawPreview" placeholder="Q"></ion-input>
              </ion-item>
            </template>

            <div class="drag-hint-box">
              <ion-icon :icon="moveOutline"></ion-icon>
              Arrastra la sección directamente en el lienzo para posicionarla
            </div>
          </div>
        </div>

        <!-- ===== RIGHT: CANVAS ===== -->
        <div class="canvas-area">
          <div class="canvas-toolbar">
            <span class="canvas-label">Vista previa de la hoja imprimible</span>
            <div class="canvas-zoom-row">
              <button class="zoom-btn" @click="adjustZoom(-0.05)">−</button>
              <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
              <button class="zoom-btn" @click="adjustZoom(0.05)">+</button>
              <button class="zoom-btn zoom-fit" @click="fitZoom">Ajustar</button>
            </div>
            <div class="canvas-legend">
              <span class="reserved-sample"></span> Zona reservada
              <span class="drag-sample"></span> Arrastrable
            </div>
          </div>

          <div class="canvas-scroll-container" ref="scrollContainer">
            <div class="canvas-scaled-wrapper" :style="{ transform: `scale(${zoom})`, transformOrigin: 'top left' }">
              <canvas
                ref="canvasRef"
                class="omr-canvas"
                :style="{ cursor: dragging ? 'grabbing' : (hoverSectionIdx >= 0 ? 'grab' : 'default') }"
                @mousedown="onCanvasMouseDown"
                @mousemove="onCanvasMouseMove"
                @mouseup="onCanvasMouseUp"
                @mouseleave="onCanvasMouseUp"
                @touchstart.prevent="onCanvasTouchStart"
                @touchmove.prevent="onCanvasTouchMove"
                @touchend.prevent="onCanvasTouchEnd"
              ></canvas>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonItem, IonLabel,
  IonInput, IonSelect, IonSelectOption, IonToggle, IonRange,
} from "@ionic/vue";
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import {
  arrowBackOutline, downloadOutline, codeDownloadOutline,
  addOutline, trashOutline, moveOutline,
} from "ionicons/icons";
import {
  renderSheet,
  downloadCanvasAsPNG,
  exportTemplateJSON,
  getSectionBounds,
  CANVAS_PORTRAIT,
  CANVAS_LANDSCAPE,
} from "@/components/functions/omr/omrSheetGenerator.js";

export default {
  name: "OmrTemplateEditor",
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon, IonItem, IonLabel,
    IonInput, IonSelect, IonSelectOption, IonToggle, IonRange,
  },
  setup() {
    const router = useRouter();
    const canvasRef = ref(null);
    const scrollContainer = ref(null);
    const selectedIndex = ref(-1);
    const selectedPreset = ref("likert");
    const customLabelsInput = ref("");
    const zoom = ref(0.5);

    // Drag state
    const dragging = ref(false);
    const hoverSectionIdx = ref(-1);
    const dragStartCanvasX = ref(0);
    const dragStartCanvasY = ref(0);
    const dragStartPercentX = ref(0);
    const dragStartPercentY = ref(0);

    const config = ref({
      name: "Nueva Plantilla OMR",
      orientation: "portrait",
      sections: [
        {
          name: "codigo",
          title: "Código de Identificación",
          type: "code",
          digits: 6,
          cellSize: 36,
          colSpacing: 40,
          rowSpacing: 28,
          radius: 10,
          percentX: 10,
          percentY: 8,
        },
        {
          name: "seccion1",
          title: "Sección 1",
          type: "question",
          rows: 10,
          cols: 4,
          colSpacing: 50,
          rowSpacing: 32,
          radius: 11,
          showLabels: true,
          rowPrefix: "Q",
          labelWidth: 55,
          labels: ["Nunca", "Algunas veces", "Casi siempre", "Siempre"],
          percentX: 10,
          percentY: 38,
        },
      ],
    });

    const selectedSection = computed(() => {
      if (selectedIndex.value >= 0 && selectedIndex.value < config.value.sections.length) {
        return config.value.sections[selectedIndex.value];
      }
      return null;
    });

    const dims = computed(() =>
      config.value.orientation === "landscape" ? CANVAS_LANDSCAPE : CANVAS_PORTRAIT
    );

    const goBack = () => router.back();

    const selectSection = (idx) => {
      selectedIndex.value = idx;
      drawPreview();
    };

    const sectionTypeLabel = (type) => {
      if (type === "code") return "Código";
      if (type === "multiselect") return "Múltiple";
      return "Pregunta";
    };

    // ---- Canvas Rendering ----
    const drawPreview = async () => {
      await nextTick();
      if (canvasRef.value) {
        renderSheet(canvasRef.value, config.value, {
          isPreview: true,
          selectedSectionIndex: selectedIndex.value,
        });
      }
    };

    const fitZoom = async () => {
      await nextTick();
      if (scrollContainer.value && canvasRef.value) {
        const containerW = scrollContainer.value.clientWidth - 40;
        const containerH = scrollContainer.value.clientHeight - 40;
        const d = dims.value;
        zoom.value = Math.min(containerW / d.width, containerH / d.height, 1);
      }
    };

    const adjustZoom = (delta) => {
      zoom.value = Math.max(0.1, Math.min(2, zoom.value + delta));
    };

    // ---- Canvas coordinate helpers ----
    const getCanvasPos = (evt, canvas) => {
      const rect = canvas.getBoundingClientRect();
      // Account for CSS zoom scaling
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY,
      };
    };

    const hitTestSection = (canvasX, canvasY) => {
      const d = dims.value;
      for (let i = config.value.sections.length - 1; i >= 0; i--) {
        const sec = config.value.sections[i];
        const bounds = getSectionBounds(sec, d);
        if (
          canvasX >= bounds.x - 10 &&
          canvasX <= bounds.x + bounds.width + 10 &&
          canvasY >= bounds.y - 20 &&
          canvasY <= bounds.y + bounds.height + 10
        ) {
          return i;
        }
      }
      return -1;
    };

    // ---- Mouse events ----
    const onCanvasMouseDown = (evt) => {
      if (!canvasRef.value) return;
      const pos = getCanvasPos(evt, canvasRef.value);
      const hitIdx = hitTestSection(pos.x, pos.y);
      if (hitIdx >= 0) {
        selectSection(hitIdx);
        dragging.value = true;
        dragStartCanvasX.value = pos.x;
        dragStartCanvasY.value = pos.y;
        const sec = config.value.sections[hitIdx];
        dragStartPercentX.value = sec.percentX;
        dragStartPercentY.value = sec.percentY;
      } else {
        selectedIndex.value = -1;
        drawPreview();
      }
    };

    const onCanvasMouseMove = (evt) => {
      if (!canvasRef.value) return;
      const pos = getCanvasPos(evt, canvasRef.value);

      if (dragging.value && selectedSection.value) {
        const d = dims.value;
        const dx = pos.x - dragStartCanvasX.value;
        const dy = pos.y - dragStartCanvasY.value;
        const newPX = Math.max(0, Math.min(95, dragStartPercentX.value + (dx / d.width) * 100));
        const newPY = Math.max(0, Math.min(95, dragStartPercentY.value + (dy / d.height) * 100));
        selectedSection.value.percentX = parseFloat(newPX.toFixed(2));
        selectedSection.value.percentY = parseFloat(newPY.toFixed(2));
        drawPreview();
      } else {
        hoverSectionIdx.value = hitTestSection(pos.x, pos.y);
      }
    };

    const onCanvasMouseUp = () => {
      dragging.value = false;
    };

    // ---- Touch events ----
    const onCanvasTouchStart = (evt) => {
      if (!canvasRef.value || !evt.touches[0]) return;
      const pos = getCanvasPos(evt.touches[0], canvasRef.value);
      const hitIdx = hitTestSection(pos.x, pos.y);
      if (hitIdx >= 0) {
        selectSection(hitIdx);
        dragging.value = true;
        dragStartCanvasX.value = pos.x;
        dragStartCanvasY.value = pos.y;
        const sec = config.value.sections[hitIdx];
        dragStartPercentX.value = sec.percentX;
        dragStartPercentY.value = sec.percentY;
      }
    };

    const onCanvasTouchMove = (evt) => {
      if (!dragging.value || !canvasRef.value || !evt.touches[0]) return;
      const pos = getCanvasPos(evt.touches[0], canvasRef.value);
      const d = dims.value;
      const dx = pos.x - dragStartCanvasX.value;
      const dy = pos.y - dragStartCanvasY.value;
      const newPX = Math.max(0, Math.min(95, dragStartPercentX.value + (dx / d.width) * 100));
      const newPY = Math.max(0, Math.min(95, dragStartPercentY.value + (dy / d.height) * 100));
      if (selectedSection.value) {
        selectedSection.value.percentX = parseFloat(newPX.toFixed(2));
        selectedSection.value.percentY = parseFloat(newPY.toFixed(2));
        drawPreview();
      }
    };

    const onCanvasTouchEnd = () => {
      dragging.value = false;
    };

    // ---- Section management ----
    const addNewSection = () => {
      const idx = config.value.sections.length;
      config.value.sections.push({
        name: `seccion${idx + 1}`,
        title: `Sección ${idx + 1}`,
        type: "question",
        rows: 5,
        cols: 4,
        colSpacing: 50,
        rowSpacing: 32,
        radius: 11,
        showLabels: true,
        rowPrefix: "Q",
        labelWidth: 55,
        labels: ["A", "B", "C", "D"],
        percentX: 10,
        percentY: Math.min(90, 38 + idx * 20),
      });
      selectedIndex.value = config.value.sections.length - 1;
      drawPreview();
    };

    const removeSection = (idx) => {
      config.value.sections.splice(idx, 1);
      if (selectedIndex.value >= config.value.sections.length) {
        selectedIndex.value = config.value.sections.length - 1;
      }
      drawPreview();
    };

    const onSectionTypeChange = () => {
      if (!selectedSection.value) return;
      if (selectedSection.value.type === "code") {
        // Reset to code defaults
        selectedSection.value.digits = selectedSection.value.digits || 6;
        selectedSection.value.cellSize = selectedSection.value.cellSize || 36;
        selectedSection.value.colSpacing = selectedSection.value.colSpacing || 40;
        selectedSection.value.rowSpacing = selectedSection.value.rowSpacing || 28;
        selectedSection.value.radius = selectedSection.value.radius || 10;
        delete selectedSection.value.rows;
        delete selectedSection.value.cols;
        delete selectedSection.value.labels;
        delete selectedSection.value.showLabels;
      } else {
        // Restore question defaults
        selectedSection.value.rows = selectedSection.value.rows || 5;
        selectedSection.value.cols = selectedSection.value.cols || 4;
        selectedSection.value.labels = selectedSection.value.labels || ["A", "B", "C", "D"];
        selectedSection.value.showLabels = true;
      }
      drawPreview();
    };

    const applyLabelPreset = () => {
      if (!selectedSection.value) return;
      const preset = selectedPreset.value;
      if (preset === "numbers") {
        const n = selectedSection.value.cols;
        selectedSection.value.labels = Array.from({ length: n }, (_, i) => String(i + 1));
      } else if (preset === "letters") {
        const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
        selectedSection.value.labels = letters.slice(0, selectedSection.value.cols);
      } else if (preset === "likert") {
        selectedSection.value.labels = ["Nunca", "Algunas veces", "Casi siempre", "Siempre"];
        selectedSection.value.cols = 4;
      } else if (preset === "yesno") {
        selectedSection.value.labels = ["Sí", "No"];
        selectedSection.value.cols = 2;
      }
      drawPreview();
    };

    const applyCustomLabels = () => {
      if (!selectedSection.value) return;
      const arr = customLabelsInput.value.split(",").map(s => s.trim()).filter(Boolean);
      if (arr.length > 0) {
        selectedSection.value.labels = arr;
        selectedSection.value.cols = arr.length;
      }
      drawPreview();
    };

    // ---- Export ----
    const downloadPNG = () => {
      if (!canvasRef.value) return;
      const exportCanvas = document.createElement("canvas");
      renderSheet(exportCanvas, config.value, { isPreview: false });
      const safeName = (config.value.name || "plantilla_omr").toLowerCase().replace(/[^a-z0-9]/g, "_");
      downloadCanvasAsPNG(exportCanvas, `${safeName}.png`);
    };

    const exportJSON = () => {
      const jsonData = exportTemplateJSON(config.value);
      const str = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([str], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (config.value.name || "plantilla_omr").toLowerCase().replace(/[^a-z0-9]/g, "_");
      link.download = `${safeName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    onMounted(async () => {
      await fitZoom();
      await drawPreview();
    });

    return {
      canvasRef, scrollContainer,
      config, selectedIndex, selectedSection,
      selectedPreset, customLabelsInput,
      zoom, dragging, hoverSectionIdx,
      goBack, selectSection, sectionTypeLabel,
      drawPreview, fitZoom, adjustZoom,
      addNewSection, removeSection, onSectionTypeChange,
      applyLabelPreset, applyCustomLabels,
      downloadPNG, exportJSON,
      onCanvasMouseDown, onCanvasMouseMove, onCanvasMouseUp,
      onCanvasTouchStart, onCanvasTouchMove, onCanvasTouchEnd,
      arrowBackOutline, downloadOutline, codeDownloadOutline,
      addOutline, trashOutline, moveOutline,
    };
  },
};
</script>

<style scoped>
/* ---- Layout ---- */
.editor-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.left-panel {
  width: 320px;
  min-width: 280px;
  max-width: 360px;
  overflow-y: auto;
  background: var(--ion-color-light);
  border-right: 1px solid #e2e8f0;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #e8ecf0;
}

/* ---- Panel cards ---- */
.panel-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 10px 6px 12px 6px;
}

.panel-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 6px 8px 6px;
}

.panel-card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 6px 8px 6px;
}

.accent-text {
  color: var(--ion-color-primary);
  font-weight: 600;
}

/* ---- Section list ---- */
.section-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s;
  margin: 2px 0;
}

.section-list-item:hover {
  background: #f1f5f9;
}

.section-list-item--active {
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  border-left: 3px solid var(--ion-color-primary);
}

.section-list-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-list-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.section-list-meta {
  font-size: 11px;
  color: #64748b;
}

.section-delete-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: background 0.1s;
}
.section-delete-btn:hover { background: #fee2e2; }

.empty-sections-hint {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  padding: 16px 0;
}

/* ---- Numeric controls ---- */
.props-group-title {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 12px 10px 4px 10px;
}

.num-row {
  padding: 2px 8px;
}

.num-field label {
  font-size: 12px;
  color: #475569;
  display: block;
  margin-bottom: 2px;
}

.num-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.num-input-row ion-range {
  flex: 1;
  --padding-start: 0;
  --padding-end: 0;
}

.num-input-box {
  width: 54px;
  text-align: center;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 3px 4px;
  font-size: 13px;
  color: #1e293b;
  background: #f8fafc;
}

.drag-hint-box {
  margin: 12px 8px 4px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 7px;
  padding: 8px 10px;
}

/* ---- Canvas area ---- */
.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.canvas-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  flex: 1;
}

.canvas-zoom-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  width: 28px;
  height: 28px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.zoom-btn:hover { background: #e2e8f0; }
.zoom-fit { width: auto; padding: 0 8px; font-size: 12px; }
.zoom-value { font-size: 13px; color: #64748b; min-width: 38px; text-align: center; }

.canvas-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #94a3b8;
}

.reserved-sample {
  display: inline-block;
  width: 12px;
  height: 12px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px dashed rgba(239, 68, 68, 0.5);
  border-radius: 2px;
}

.drag-sample {
  display: inline-block;
  width: 12px;
  height: 12px;
  background: rgba(37, 99, 235, 0.15);
  border: 1.5px solid #2563eb;
  border-radius: 2px;
  margin-left: 8px;
}

.canvas-scroll-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
}

.canvas-scaled-wrapper {
  display: inline-block;
  transform-origin: top left;
}

.omr-canvas {
  display: block;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  border-radius: 2px;
  background: #ffffff;
}

/* Mobile: stack layout */
@media (max-width: 768px) {
  .editor-layout {
    flex-direction: column;
  }
  .left-panel {
    width: 100%;
    max-width: 100%;
    max-height: 45vh;
  }
}
</style>
