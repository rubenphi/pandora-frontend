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
          <ion-button
            fill="solid"
            color="light"
            @click="downloadPNG"
            title="Descargar PNG"
          >
            <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
            PNG
          </ion-button>
          <ion-button
            fill="outline"
            color="light"
            @click="exportJSON"
            title="Exportar JSON"
          >
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
            <ion-item lines="none">
              <ion-label position="stacked">Nombre de Plantilla</ion-label>
              <ion-input
                v-model="config.name"
                placeholder="Ej: Encuesta 2026"
              ></ion-input>
            </ion-item>
          </div>

          <!-- Canvas size controls -->
          <div class="panel-card">
            <div class="panel-card-title">Tamaño del Lienzo</div>
            <div class="num-row">
              <div class="num-field">
                <label>Ancho (px)</label>
                <div class="num-input-row">
                  <ion-range
                    :value="canvasWidth"
                    :min="minCanvasDimensions.width"
                    :max="2000"
                    step="10"
                    @ionChange="onCanvasWidthChange(+$event.detail.value)"
                  ></ion-range>
                  <input
                    class="num-input-box"
                    type="number"
                    :value="canvasWidth"
                    :min="minCanvasDimensions.width"
                    :max="2000"
                    @change="onCanvasWidthChange(+$event.target.value)"
                  />
                </div>
              </div>
            </div>
            <div class="num-row">
              <div class="num-field">
                <label>Alto (px)</label>
                <div class="num-input-row">
                  <ion-range
                    :value="canvasHeight"
                    :min="minCanvasDimensions.height"
                    :max="3000"
                    step="10"
                    @ionChange="onCanvasHeightChange(+$event.detail.value)"
                  ></ion-range>
                  <input
                    class="num-input-box"
                    type="number"
                    :value="canvasHeight"
                    :min="minCanvasDimensions.height"
                    :max="3000"
                    @change="onCanvasHeightChange(+$event.target.value)"
                  />
                </div>
              </div>
            </div>
            <div class="canvas-size-hint">
              Actual: {{ canvasWidth }} × {{ canvasHeight }} px
            </div>
          </div>

          <!-- Sections list -->
          <div class="panel-card">
            <div class="panel-card-title-row">
              <span class="panel-card-title">Secciones</span>
              <ion-button
                size="small"
                color="success"
                fill="solid"
                @click="addNewSection"
              >
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
                <span class="section-list-name">{{
                  sec.title || sec.name
                }}</span>
                <span class="section-list-meta"
                  >{{ sectionTypeLabel(sec.type) }}
                  <span v-if="sec.type === 'code'"
                    >· {{ sec.digits }} dígitos</span
                  >
                  <span v-else>· {{ sec.rows }}×{{ sec.cols }}</span>
                </span>
              </div>
              <button
                class="section-delete-btn"
                @click.stop="removeSection(idx)"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
            <div
              v-if="config.sections.length === 0"
              class="empty-sections-hint"
            >
              Haz clic en "Añadir" para crear secciones
            </div>
          </div>

          <!-- Section properties -->
          <div class="panel-card" v-if="selectedSection">
            <div class="panel-card-title">
              Propiedades:
              <span class="accent-text">{{
                selectedSection.title || selectedSection.name
              }}</span>
            </div>

            <ion-item lines="full">
              <ion-label position="stacked"
                >Título visible en la hoja</ion-label
              >
              <ion-input
                v-model="selectedSection.title"
                @ionInput="drawPreview"
                placeholder="Título de la sección"
              ></ion-input>
            </ion-item>

            <ion-item lines="full">
              <ion-label position="stacked">Nombre interno (JSON)</ion-label>
              <ion-input
                v-model="selectedSection.name"
                @ionInput="drawPreview"
                placeholder="seccion1"
              ></ion-input>
            </ion-item>

            <ion-item lines="full">
              <ion-label position="stacked">Tipo</ion-label>
              <ion-select
                v-model="selectedSection.type"
                @ionChange="onSectionTypeChange"
                interface="action-sheet"
              >
                <ion-select-option value="code"
                  >Código de Identificación</ion-select-option
                >
                <ion-select-option value="question"
                  >Pregunta (única opción)</ion-select-option
                >
                <ion-select-option value="multiselect"
                  >Múltiple selección</ion-select-option
                >
              </ion-select>
            </ion-item>

            <!-- CODE section specific -->
            <template v-if="selectedSection.type === 'code'">
              <div class="props-group-title">Código Numérico</div>
              <div class="num-row">
                <div class="num-field">
                  <label>Dígitos</label>
                  <div class="num-input-row">
                    <ion-range
                      v-model="selectedSection.digits"
                      min="1"
                      max="12"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.digits"
                      min="1"
                      max="12"
                      @change="drawPreview"
                    />
                  </div>
                </div>
              </div>
              <div class="num-row">
                <div class="num-field">
                  <label>Tamaño celda escritura (px)</label>
                  <div class="num-input-row">
                    <ion-range
                      v-model="selectedSection.cellSize"
                      min="20"
                      max="70"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.cellSize"
                      min="20"
                      max="70"
                      @change="drawPreview"
                    />
                  </div>
                </div>
              </div>
              <div class="num-row">
                <div class="num-field">
                  <label>Separación columnas (px)</label>
                  <div class="num-input-row">
                    <ion-range
                      v-model="selectedSection.colSpacing"
                      min="24"
                      max="80"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.colSpacing"
                      min="24"
                      max="80"
                      @change="drawPreview"
                    />
                  </div>
                </div>
              </div>
              <div class="num-row">
                <div class="num-field">
                  <label>Separación filas burbujas (px)</label>
                  <div class="num-input-row">
                    <ion-range
                      v-model="selectedSection.rowSpacing"
                      min="16"
                      max="60"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.rowSpacing"
                      min="16"
                      max="60"
                      @change="drawPreview"
                    />
                  </div>
                </div>
              </div>
              <div class="num-row">
                <div class="num-field">
                  <label>Radio burbuja (px)</label>
                  <div class="num-input-row">
                    <ion-range
                      v-model="selectedSection.radius"
                      min="5"
                      max="18"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.radius"
                      min="5"
                      max="18"
                      @change="drawPreview"
                    />
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
                    <ion-range
                      v-model="selectedSection.rows"
                      min="1"
                      max="50"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.rows"
                      min="1"
                      max="50"
                      @change="drawPreview"
                    />
                  </div>
                </div>
                <div class="num-field">
                  <label>Columnas</label>
                  <div class="num-input-row">
                    <ion-range
                      v-model="selectedSection.cols"
                      min="1"
                      max="20"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.cols"
                      min="1"
                      max="20"
                      @change="drawPreview"
                    />
                  </div>
                </div>
              </div>

              <div class="num-row">
                <div class="num-field">
                  <label>Separación columnas (px)</label>
                  <div class="num-input-row">
                    <ion-range
                      v-model="selectedSection.colSpacing"
                      min="20"
                      max="100"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.colSpacing"
                      min="20"
                      max="100"
                      @change="drawPreview"
                    />
                  </div>
                </div>
              </div>

              <div class="num-row">
                <div class="num-field">
                  <label>Separación filas (px)</label>
                  <div class="num-input-row">
                    <ion-range
                      v-model="selectedSection.rowSpacing"
                      min="16"
                      max="80"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.rowSpacing"
                      min="16"
                      max="80"
                      @change="drawPreview"
                    />
                  </div>
                </div>
              </div>

              <div class="num-row">
                <div class="num-field">
                  <label>Radio burbuja (px)</label>
                  <div class="num-input-row">
                    <ion-range
                      v-model="selectedSection.radius"
                      min="5"
                      max="20"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.radius"
                      min="5"
                      max="20"
                      @change="drawPreview"
                    />
                  </div>
                </div>
              </div>

              <div class="props-group-title" v-if="selectedSection.type !== 'multiselect'">Etiquetas</div>
              <ion-item lines="full" v-if="selectedSection.type !== 'multiselect'">
                <ion-label>Preset de etiquetas</ion-label>
                <ion-select
                  v-model="selectedPreset"
                  @ionChange="applyLabelPreset"
                  interface="action-sheet"
                >
                  <ion-select-option value="numbers"
                    >1, 2, 3…</ion-select-option
                  >
                  <ion-select-option value="letters"
                    >A, B, C, D</ion-select-option
                  >
                  <ion-select-option value="likert"
                    >Escala Likert</ion-select-option
                  >
                  <ion-select-option value="yesno">Sí / No</ion-select-option>
                  <ion-select-option value="custom"
                    >Personalizado</ion-select-option
                  >
                </ion-select>
              </ion-item>

              <!-- Likert scale chips -->
              <div v-if="selectedPreset === 'likert' && selectedSection.type !== 'multiselect'" class="likert-chips-section">
                <div class="likert-chips-grid">
                  <button
                    v-for="(scale, key) in likertScales"
                    :key="key"
                    class="likert-chip"
                    @click="applyLikertScale(key)"
                  >
                    {{ scale.label }}
                  </button>
                </div>
              </div>

              <ion-item v-if="selectedPreset === 'custom' && selectedSection.type !== 'multiselect'" lines="full">
                <ion-label position="stacked"
                  >Etiquetas (separadas por comas)</ion-label
                >
                <ion-input
                  v-model="customLabelsInput"
                  placeholder="Opción 1, Opción 2..."
                  @ionInput="applyCustomLabels"
                ></ion-input>
              </ion-item>

              <ion-item lines="none" v-if="selectedSection.type !== 'multiselect'">
                <ion-label>Mostrar etiquetas en hoja</ion-label>
                <ion-toggle
                  v-model="selectedSection.showLabels"
                  @ionChange="drawPreview"
                ></ion-toggle>
              </ion-item>

              <ion-item
                lines="none"
                v-if="
                  selectedSection.showLabels &&
                  selectedSection.type !== 'multiselect'
                "
              >
                <ion-label position="stacked"
                  >Prefijo de fila (ej: Q, P)</ion-label
                >
                <ion-input
                  v-model="selectedSection.rowPrefix"
                  @ionInput="drawPreview"
                  placeholder="Q"
                ></ion-input>
              </ion-item>

              <!-- Multiselect: editable list of labels -->
              <template v-if="selectedSection.type === 'multiselect'">
                <div class="props-group-title">Etiquetas por celda</div>
                <div class="label-list-section">
                  <div
                    v-for="(tag, idx) in flatTags"
                    :key="'label-' + idx"
                    class="label-list-row"
                  >
                    <span class="label-list-pos">{{ idx + 1 }}</span>
                    <input
                      class="label-list-input"
                      :value="tag"
                      @input="setFlatTag(idx, $event.target.value)"
                      @blur="drawPreview"
                      :placeholder="'Etiqueta ' + (idx + 1)"
                    />
                  </div>
                  <div class="label-list-hint">
                    {{ flatTags.filter(t => t).length }} / {{ selectedSection.rows * selectedSection.cols }} etiquetas
                    — Se llenan de izq. a der. y arriba a abajo en la grilla
                  </div>
                </div>
              </template>
            </template>

            <div class="props-group-title">Posición en la hoja (%)</div>
            <div class="num-row two-col">
              <div class="num-field">
                <label>Posición X</label>
                <div class="num-input-row">
                  <ion-range
                    v-model="selectedSection.percentX"
                    min="0"
                    max="90"
                    step="0.5"
                    @ionChange="clampAndDraw"
                  ></ion-range>
                  <input
                    class="num-input-box"
                    type="number"
                    v-model.number="selectedSection.percentX"
                    min="0"
                    max="90"
                    step="0.5"
                    @change="clampAndDraw"
                  />
                </div>
              </div>
              <div class="num-field">
                <label>Posición Y</label>
                <div class="num-input-row">
                  <ion-range
                    v-model="selectedSection.percentY"
                    min="0"
                    max="90"
                    step="0.5"
                    @ionChange="clampAndDraw"
                  ></ion-range>
                  <input
                    class="num-input-box"
                    type="number"
                    v-model.number="selectedSection.percentY"
                    min="0"
                    max="90"
                    step="0.5"
                    @change="clampAndDraw"
                  />
                </div>
              </div>
              </div>

              <div class="num-row" v-if="selectedSection.type === 'question'">
                <div class="num-field">
                  <label>Grupos de columnas</label>
                  <div class="num-input-row">
                    <ion-range
                      v-model="selectedSection.columnGroups"
                      min="1"
                      max="6"
                      step="1"
                      @ionChange="drawPreview"
                    ></ion-range>
                    <input
                      class="num-input-box"
                      type="number"
                      v-model.number="selectedSection.columnGroups"
                      min="1"
                      max="6"
                      @change="drawPreview"
                    />
                  </div>
                </div>
              </div>

              <div class="num-row">
              <div class="num-field">
                <label>Tamaño sección (escala %)</label>
                <div class="num-input-row">
                  <ion-range
                    v-model="selectedSection.scale"
                    min="50"
                    max="200"
                    step="5"
                    @ionChange="applyScale"
                  ></ion-range>
                  <input
                    class="num-input-box"
                    type="number"
                    v-model.number="selectedSection.scale"
                    min="50"
                    max="200"
                    @change="applyScale"
                  />
                </div>
              </div>
            </div>

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
              <button class="zoom-btn zoom-fit" @click="fitZoom">
                Ajustar
              </button>
            </div>
            <div class="canvas-legend">
              <span class="reserved-sample"></span> Zona reservada
              <span class="drag-sample"></span> Arrastrable
            </div>
          </div>

          <div class="canvas-scroll-container" ref="scrollContainer">
            <div
              class="canvas-scaled-wrapper"
              :style="{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }"
            >
              <canvas
                ref="canvasRef"
                class="omr-canvas"
                :style="{
                  cursor: dragging
                    ? 'grabbing'
                    : hoverSectionIdx >= 0
                    ? 'grab'
                    : 'default',
                }"
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
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonRange,
} from "@ionic/vue";
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import {
  arrowBackOutline,
  downloadOutline,
  codeDownloadOutline,
  addOutline,
  trashOutline,
  moveOutline,
} from "ionicons/icons";
import {
  renderSheet,
  downloadCanvasAsPNG,
  exportTemplateJSON,
  getSectionBounds,
  getScannableBounds,
  CANVAS_PORTRAIT,
} from "@/components/functions/omr/omrSheetGenerator.js";

export default {
  name: "OmrTemplateEditor",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonRange,
  },
  setup() {
    const router = useRouter();
    const canvasRef = ref(null);
    const scrollContainer = ref(null);
    const selectedIndex = ref(-1);
    const selectedPreset = ref("likert");
    const customLabelsInput = ref("");
    const tagInputValue = ref("");
    const tagInputRef = ref(null);
    const zoom = ref(1);
    const canvasWidth = ref(CANVAS_PORTRAIT.width);
    const canvasHeight = ref(CANVAS_PORTRAIT.height);

    // Drag state
    const dragging = ref(false);
    const dragType = ref(null); // 'section'
    const hoverSectionIdx = ref(-1);
    const dragStartCanvasX = ref(0);
    const dragStartCanvasY = ref(0);
    const dragStartPercentX = ref(0);
    const dragStartPercentY = ref(0);

    const likertScales = {
      frecuencia: {
        label: "Frecuencia",
        options: ["Nunca", "Casi nunca", "Algunas veces", "Casi siempre", "Siempre"],
      },
      acuerdo: {
        label: "Acuerdo",
        options: ["Totalmente en desacuerdo", "En desacuerdo", "Ni de acuerdo ni en desacuerdo", "De acuerdo", "Totalmente de acuerdo"],
      },
      importancia: {
        label: "Importancia",
        options: ["Nada importante", "Poco importante", "Moderadamente importante", "Importante", "Muy importante"],
      },
      satisfaccion: {
        label: "Satisfacción",
        options: ["Muy insatisfecho", "Insatisfecho", "Ni satisfecho ni insatisfecho", "Satisfecho", "Muy satisfecho"],
      },
      calidad: {
        label: "Calidad",
        options: ["Muy mala", "Mala", "Regular", "Buena", "Excelente"],
      },
      dificultad: {
        label: "Dificultad",
        options: ["Muy difícil", "Difícil", "Ni fácil ni difícil", "Fácil", "Muy fácil"],
      },
      probabilidad: {
        label: "Probabilidad",
        options: ["Muy improbable", "Improbable", "Ni probable ni improbable", "Probable", "Muy probable"],
      },
      capacidad: {
        label: "Capacidad",
        options: ["Muy baja", "Baja", "Media", "Alta", "Muy alta"],
      },
      intensidad: {
        label: "Intensidad",
        options: ["Muy baja", "Baja", "Moderada", "Alta", "Muy alta"],
      },
      utilidad: {
        label: "Utilidad",
        options: ["Nada útil", "Poco útil", "Moderadamente útil", "Útil", "Muy útil"],
      },
      confianza: {
        label: "Confianza",
        options: ["Nada de confianza", "Poca confianza", "Confianza moderada", "Mucha confianza", "Total confianza"],
      },
      claridad: {
        label: "Claridad",
        options: ["Nada claro", "Poco claro", "Moderadamente claro", "Claro", "Muy claro"],
      },
    };

    const config = ref({
      name: "Nueva Plantilla OMR",
      sections: [
        {
          name: "codigo",
          title: "Código de Identificación",
          type: "code",
          digits: 6,
          cellSize: 36,
          colSpacing: 37,
          rowSpacing: 36,
          radius: 12,
          scale: 100,
          percentX: 10,
          percentY: 12,
        },
        {
          name: "seccion1",
          title: "Sección 1",
          type: "question",
          rows: 10,
          cols: 5,
          columnGroups: 1,
          colSpacing: 58,
          rowSpacing: 38,
          radius: 11,
          scale: 100,
          showLabels: true,
          rowPrefix: "Q",
          labelWidth: 55,
          labels: [
            "Nunca",
            "Rara vez",
            "Algunas veces",
            "Casi siempre",
            "Siempre",
          ],
          percentX: 10,
          percentY: 38,
        },
      ],
    });

    const selectedSection = computed(() => {
      if (
        selectedIndex.value >= 0 &&
        selectedIndex.value < config.value.sections.length
      ) {
        return config.value.sections[selectedIndex.value];
      }
      return null;
    });

    const dims = computed(() => ({
      width: canvasWidth.value,
      height: canvasHeight.value,
    }));

    const minCanvasDimensions = computed(() => {
      const w = canvasWidth.value;
      const h = canvasHeight.value;
      let maxRight = 0;
      let maxBottom = 0;
      for (const sec of config.value.sections) {
        const bounds = getSectionBounds(sec, { width: w, height: h });
        maxRight = Math.max(maxRight, bounds.x + bounds.width);
        maxBottom = Math.max(maxBottom, bounds.y + bounds.height);
      }
      return {
        width: Math.max(Math.ceil(maxRight + 120), 500),
        height: Math.max(Math.ceil(maxBottom + 120), 500),
      };
    });

    const autoMargins = computed(() => {
      const d = dims.value;
      return {
        left: d.width * 0.06,
        right: d.width * 0.06,
        top: d.height * 0.06,
        bottom: d.height * 0.06,
      };
    });

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
    

    const clampToScannableArea = () => {
      if (!selectedSection.value) return;
      const d = dims.value;
      const area = getScannableBounds(d.width, d.height, autoMargins.value);
      const secIdx = selectedIndex.value;

      // Clamp to scannable area
      const bounds = getSectionBounds(selectedSection.value, d);
      let dx = 0, dy = 0;
      if (bounds.x < area.x) dx = area.x - bounds.x;
      if (bounds.y < area.y) dy = area.y - bounds.y;
      if (bounds.x + bounds.width > area.x + area.width) dx = (area.x + area.width) - (bounds.x + bounds.width);
      if (bounds.y + bounds.height > area.y + area.height) dy = (area.y + area.height) - (bounds.y + bounds.height);
      if (dx !== 0 || dy !== 0) {
        selectedSection.value.percentX = parseFloat((selectedSection.value.percentX + (dx / d.width) * 100).toFixed(2));
        selectedSection.value.percentY = parseFloat((selectedSection.value.percentY + (dy / d.height) * 100).toFixed(2));
      }

      // Prevent overlap with other sections
      const myBounds = getSectionBounds(selectedSection.value, d);
      for (let i = 0; i < config.value.sections.length; i++) {
        if (i === secIdx) continue;
        const other = config.value.sections[i];
        const ob = getSectionBounds(other, d);
        const overlaps =
          myBounds.x < ob.x + ob.width &&
          myBounds.x + myBounds.width > ob.x &&
          myBounds.y < ob.y + ob.height &&
          myBounds.y + myBounds.height > ob.y;
        if (overlaps) {
          // Push down below the other section
          const pushDown = ob.y + ob.height - myBounds.y + 4;
          const newPercentY = selectedSection.value.percentY + (pushDown / d.height) * 100;
          // Check if still within scannable area
          const testBounds = { ...myBounds, y: myBounds.y + pushDown };
          if (testBounds.y + testBounds.height <= area.y + area.height) {
            selectedSection.value.percentY = parseFloat(newPercentY.toFixed(2));
          } else {
            // Push right of the other section
            const pushRight = ob.x + ob.width - myBounds.x + 4;
            const newPercentX = selectedSection.value.percentX + (pushRight / d.width) * 100;
            const testBoundsX = { ...myBounds, x: myBounds.x + pushRight };
            if (testBoundsX.x + testBoundsX.width <= area.x + area.width) {
              selectedSection.value.percentX = parseFloat(newPercentX.toFixed(2));
            }
          }
        }
      }
    };

    const clampAndDraw = () => {
      clampToScannableArea();
      drawPreview();
    };

    const onCanvasWidthChange = (newWidth) => {
      const oldWidth = canvasWidth.value;
      newWidth = Math.max(minCanvasDimensions.value.width, Math.min(2000, newWidth));
      if (Math.abs(newWidth - oldWidth) < 1) return;
      config.value.sections.forEach((sec) => {
        const absX = (sec.percentX / 100) * oldWidth;
        sec.percentX = parseFloat(((absX / newWidth) * 100).toFixed(2));
      });
      canvasWidth.value = newWidth;
      drawPreview();
    };

    const onCanvasHeightChange = (newHeight) => {
      const oldHeight = canvasHeight.value;
      newHeight = Math.max(minCanvasDimensions.value.height, Math.min(3000, newHeight));
      if (Math.abs(newHeight - oldHeight) < 1) return;
      config.value.sections.forEach((sec) => {
        const absY = (sec.percentY / 100) * oldHeight;
        sec.percentY = parseFloat(((absY / newHeight) * 100).toFixed(2));
      });
      canvasHeight.value = newHeight;
      drawPreview();
    };

    const drawPreview = async () => {
      await nextTick();
      if (canvasRef.value) {
        const opts = {
          isPreview: true,
          selectedSectionIndex: selectedIndex.value,
          dims: dims.value,
        };
        renderSheet(canvasRef.value, config.value, opts);
      }
    };

    const fitZoom = async () => {
      await nextTick();
      if (scrollContainer.value && canvasRef.value) {
        const containerW = scrollContainer.value.clientWidth - 32;
        const containerH = scrollContainer.value.clientHeight - 32;
        const d = dims.value;
        zoom.value = Math.max(
          0.1,
          Math.min(containerW / d.width, containerH / d.height, 1),
        );
      }
    };

    const adjustZoom = (delta) => {
      zoom.value = Math.max(0.1, Math.min(2, zoom.value + delta));
    };

    // ---- Canvas coordinate helpers ----
    const getCanvasPos = (evt, canvas) => {
      const rect = canvas.getBoundingClientRect();
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
        dragType.value = 'section';
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

      if (dragging.value) {
        if (dragType.value === 'section' && selectedSection.value) {
          const pos = getCanvasPos(evt, canvasRef.value);
          const d = dims.value;
          const dx = pos.x - dragStartCanvasX.value;
          const dy = pos.y - dragStartCanvasY.value;
          const newPX = Math.max(
            0,
            Math.min(95, dragStartPercentX.value + (dx / d.width) * 100),
          );
          const newPY = Math.max(
            0,
            Math.min(95, dragStartPercentY.value + (dy / d.height) * 100),
          );
          selectedSection.value.percentX = parseFloat(newPX.toFixed(2));
          selectedSection.value.percentY = parseFloat(newPY.toFixed(2));
          drawPreview();
        }
      } else {
        const pos = getCanvasPos(evt, canvasRef.value);
        hoverSectionIdx.value = hitTestSection(pos.x, pos.y);
      }
    };

    const onCanvasMouseUp = () => {
      if (dragging.value && dragType.value === 'section' && selectedSection.value) {
        clampToScannableArea();
        drawPreview();
      }
      dragging.value = false;
      dragType.value = null;
    };

    // ---- Touch events ----
    const onCanvasTouchStart = (evt) => {
      if (!canvasRef.value || !evt.touches[0]) return;
      const pos = getCanvasPos(evt.touches[0], canvasRef.value);

      const hitIdx = hitTestSection(pos.x, pos.y);
      if (hitIdx >= 0) {
        selectSection(hitIdx);
        dragging.value = true;
        dragType.value = 'section';
        dragStartCanvasX.value = pos.x;
        dragStartCanvasY.value = pos.y;
        const sec = config.value.sections[hitIdx];
        dragStartPercentX.value = sec.percentX;
        dragStartPercentY.value = sec.percentY;
      }
    };

    const onCanvasTouchMove = (evt) => {
      if (!dragging.value || !canvasRef.value || !evt.touches[0]) return;

      if (dragType.value === 'section' && selectedSection.value) {
        const pos = getCanvasPos(evt.touches[0], canvasRef.value);
        const d = dims.value;
        const dx = pos.x - dragStartCanvasX.value;
        const dy = pos.y - dragStartCanvasY.value;
        const newPX = Math.max(
          0,
          Math.min(95, dragStartPercentX.value + (dx / d.width) * 100),
        );
        const newPY = Math.max(
          0,
          Math.min(95, dragStartPercentY.value + (dy / d.height) * 100),
        );
        selectedSection.value.percentX = parseFloat(newPX.toFixed(2));
        selectedSection.value.percentY = parseFloat(newPY.toFixed(2));
        drawPreview();
      }
    };

    const onCanvasTouchEnd = () => {
      if (dragging.value && dragType.value === 'section' && selectedSection.value) {
        clampToScannableArea();
        drawPreview();
      }
      dragging.value = false;
      dragType.value = null;
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
        columnGroups: 1,
        colSpacing: 58,
        rowSpacing: 38,
        radius: 11,
        scale: 100,
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
        selectedSection.value.colSpacing =
          selectedSection.value.colSpacing || 48;
        selectedSection.value.rowSpacing =
          selectedSection.value.rowSpacing || 36;
        selectedSection.value.radius = selectedSection.value.radius || 10;
        delete selectedSection.value.rows;
        delete selectedSection.value.cols;
        delete selectedSection.value.labels;
        delete selectedSection.value.showLabels;
      } else if (selectedSection.value.type === "multiselect") {
        // Reset to multiselect defaults
        selectedSection.value.rows = selectedSection.value.rows || 4;
        selectedSection.value.cols = selectedSection.value.cols || 3;
        selectedSection.value.colSpacing =
          selectedSection.value.colSpacing || 58;
        selectedSection.value.rowSpacing =
          selectedSection.value.rowSpacing || 38;
        selectedSection.value.radius = selectedSection.value.radius || 11;
        selectedSection.value.scale = selectedSection.value.scale || 100;
        selectedSection.value.showLabels = true;
        const needsRebuild =
          !Array.isArray(selectedSection.value.labels) ||
          selectedSection.value.labels.length === 0 ||
          !Array.isArray(selectedSection.value.labels[0]);
        if (needsRebuild) {
          selectedSection.value.labels = [];
          for (let r = 0; r < selectedSection.value.rows; r++) {
            selectedSection.value.labels[r] = [];
            for (let c = 0; c < selectedSection.value.cols; c++) {
              selectedSection.value.labels[r][c] = "";
            }
          }
        }
      } else {
        // Restore question defaults
        selectedSection.value.rows = selectedSection.value.rows || 5;
        selectedSection.value.cols = selectedSection.value.cols || 4;
        selectedSection.value.columnGroups = selectedSection.value.columnGroups || 1;
        selectedSection.value.labels = selectedSection.value.labels || [
          "A",
          "B",
          "C",
          "D",
        ];
        selectedSection.value.scale = selectedSection.value.scale || 100;
        selectedSection.value.showLabels = true;
      }
      drawPreview();
    };

    const applyLabelPreset = () => {
      if (!selectedSection.value) return;
      const preset = selectedPreset.value;

      // For multiselect, fill each row with the same labels
      if (selectedSection.value.type === "multiselect") {
        if (preset === "numbers") {
          const n = selectedSection.value.cols;
          const row = Array.from({ length: n }, (_, i) => String(i + 1));
          selectedSection.value.labels = Array.from({ length: selectedSection.value.rows }, () => [...row]);
        } else if (preset === "letters") {
          const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
          const row = letters.slice(0, selectedSection.value.cols);
          selectedSection.value.labels = Array.from({ length: selectedSection.value.rows }, () => [...row]);
        } else if (preset === "yesno") {
          const row = ["Sí", "No"];
          selectedSection.value.cols = 2;
          selectedSection.value.labels = Array.from({ length: selectedSection.value.rows }, () => [...row]);
        } else if (preset === "likert") {
          // Likert scales are applied via chips, not directly here
          drawPreview();
          return;
        } else if (preset === "custom") {
          // Custom: clear labels for manual entry
          selectedSection.value.labels = [];
          for (let r = 0; r < selectedSection.value.rows; r++) {
            selectedSection.value.labels[r] = [];
            for (let c = 0; c < selectedSection.value.cols; c++) {
              selectedSection.value.labels[r][c] = "";
            }
          }
        }
        drawPreview();
        return;
      }

      // For question type
      if (preset === "numbers") {
        const n = selectedSection.value.cols;
        selectedSection.value.labels = Array.from({ length: n }, (_, i) =>
          String(i + 1),
        );
      } else if (preset === "letters") {
        const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
        selectedSection.value.labels = letters.slice(
          0,
          selectedSection.value.cols,
        );
      } else if (preset === "likert") {
        // Likert scales are applied via chips, not directly here
        drawPreview();
        return;
      } else if (preset === "yesno") {
        selectedSection.value.labels = ["Sí", "No"];
        selectedSection.value.cols = 2;
      }
      drawPreview();
    };

    const applyLikertScale = (key) => {
      if (!selectedSection.value) return;
      const scale = likertScales[key];
      if (!scale) return;

      if (selectedSection.value.type === "multiselect") {
        // Fill each row with the same Likert labels
        selectedSection.value.cols = scale.options.length;
        selectedSection.value.labels = Array.from(
          { length: selectedSection.value.rows },
          () => [...scale.options],
        );
      } else {
        selectedSection.value.labels = [...scale.options];
        selectedSection.value.cols = scale.options.length;
      }
      drawPreview();
    };

    const applyScale = () => {
      if (!selectedSection.value) return;
      const s = (selectedSection.value.scale || 100) / 100;

      if (selectedSection.value.type === "code") {
        // For code sections, scale colSpacing, rowSpacing, and radius proportionally
        selectedSection.value.colSpacing = Math.round(48 * s);
        selectedSection.value.rowSpacing = Math.round(36 * s);
        selectedSection.value.radius = Math.max(5, Math.round(10 * s));
      } else {
        // For question/multiselect sections, scale colSpacing, rowSpacing, and radius proportionally
        selectedSection.value.colSpacing = Math.round(58 * s);
        selectedSection.value.rowSpacing = Math.round(38 * s);
        selectedSection.value.radius = Math.max(5, Math.round(11 * s));
      }
      drawPreview();
    };

    const applyCustomLabels = () => {
      if (!selectedSection.value) return;
      // For multiselect, custom labels don't apply the same way
      if (selectedSection.value.type === "multiselect") {
        drawPreview();
        return;
      }
      const arr = customLabelsInput.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length > 0) {
        selectedSection.value.labels = arr;
        selectedSection.value.cols = arr.length;
      }
      drawPreview();
    };

    // Multiselect cell labels helpers
    const getMultiselectLabel = (row, col) => {
      if (!selectedSection.value) return "";
      if (!selectedSection.value.labels) return "";
      if (!Array.isArray(selectedSection.value.labels)) return "";
      if (!Array.isArray(selectedSection.value.labels[row])) return "";
      return selectedSection.value.labels[row][col] || "";
    };

    const setMultiselectLabel = (row, col, evt) => {
      if (!selectedSection.value) return;
      let labels = selectedSection.value.labels;
      if (
        !Array.isArray(labels) ||
        !Array.isArray(labels[0]) ||
        typeof labels[0] === "string"
      ) {
        labels = [];
        for (let r = 0; r < selectedSection.value.rows; r++) {
          labels[r] = [];
          for (let c = 0; c < selectedSection.value.cols; c++) {
            labels[r][c] = "";
          }
        }
      }
      const newLabels = labels.map((r, ri) =>
        ri === row
          ? r.map((v, ci) => (ci === col ? evt.target.value : v))
          : [...r],
      );
      selectedSection.value.labels = newLabels;
      drawPreview();
    };

    // Tag-based input for multiselect
    const flatTags = computed(() => {
      if (!selectedSection.value) return [];
      if (!selectedSection.value.labels) return [];
      if (!Array.isArray(selectedSection.value.labels)) return [];
      const tags = [];
      const rows = selectedSection.value.rows || 1;
      const cols = selectedSection.value.cols || 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = selectedSection.value.labels[r] && selectedSection.value.labels[r][c]
            ? selectedSection.value.labels[r][c]
            : "";
          tags.push(val);
        }
      }
      return tags;
    });

    const ensureLabels2D = () => {
      if (!selectedSection.value) return;
      const rows = selectedSection.value.rows || 1;
      const cols = selectedSection.value.cols || 1;
      let labels = selectedSection.value.labels;
      if (!Array.isArray(labels) || !Array.isArray(labels[0]) || typeof labels[0] === "string") {
        labels = [];
        for (let r = 0; r < rows; r++) {
          labels[r] = [];
          for (let c = 0; c < cols; c++) {
            labels[r][c] = "";
          }
        }
        selectedSection.value.labels = labels;
      }
      // Ensure correct dimensions
      while (selectedSection.value.labels.length < rows) {
        const newRow = [];
        for (let c = 0; c < cols; c++) newRow.push("");
        selectedSection.value.labels.push(newRow);
      }
      for (let r = 0; r < rows; r++) {
        while (selectedSection.value.labels[r].length < cols) {
          selectedSection.value.labels[r].push("");
        }
      }
    };

    const setFlatTag = (index, value) => {
      if (!selectedSection.value) return;
      ensureLabels2D();
      const cols = selectedSection.value.cols || 1;
      const r = Math.floor(index / cols);
      const c = index % cols;
      const newLabels = selectedSection.value.labels.map((row, ri) =>
        ri === r ? row.map((v, ci) => (ci === c ? value : v)) : [...row]
      );
      selectedSection.value.labels = newLabels;
    };

    const addTagFromInput = () => {
      const text = tagInputValue.value.trim();
      if (!text) return;
      // Split by comma in case user types multiple
      const parts = text.split(",").map(s => s.trim()).filter(Boolean);
      const maxTags = (selectedSection.value.rows || 1) * (selectedSection.value.cols || 1);

      for (let i = 0; i < parts.length; i++) {
        const emptyIdx = flatTags.value.findIndex(t => t === "");
        if (emptyIdx >= 0) {
          setFlatTag(emptyIdx, parts[i]);
        } else if (flatTags.value.length < maxTags) {
          setFlatTag(flatTags.value.length, parts[i]);
        } else {
          break; // Grid is full
        }
      }
      tagInputValue.value = "";
      drawPreview();
    };

    const removeTag = (index) => {
      if (!selectedSection.value) return;
      ensureLabels2D();
      // Clear the tag and shift all subsequent tags forward
      const tags = [...flatTags.value];
      tags.splice(index, 1);
      tags.push("");
      const rows = selectedSection.value.rows || 1;
      const cols = selectedSection.value.cols || 1;
      const newLabels = [];
      for (let r = 0; r < rows; r++) {
        newLabels[r] = [];
        for (let c = 0; c < cols; c++) {
          newLabels[r][c] = tags[r * cols + c] || "";
        }
      }
      selectedSection.value.labels = newLabels;
      drawPreview();
    };

    const onTagInputBackspace = () => {
      if (tagInputValue.value === "" && flatTags.value.length > 0) {
        const lastIdx = flatTags.value.findLastIndex(t => t !== "");
        if (lastIdx >= 0) removeTag(lastIdx);
      }
    };

    const addEmptyTag = () => {
      if (!selectedSection.value) return;
      ensureLabels2D();
      const rows = selectedSection.value.rows || 1;
      const cols = selectedSection.value.cols || 1;
      const maxTags = rows * cols;
      if (flatTags.value.length < maxTags) {
        setFlatTag(flatTags.value.length, "");
      }
      drawPreview();
    };

    // ---- Export ----
    const downloadPNG = () => {
      if (!canvasRef.value) return;
      const exportCanvas = document.createElement("canvas");
      renderSheet(exportCanvas, config.value, { isPreview: false, dims: dims.value });
      const safeName = (config.value.name || "plantilla_omr")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      downloadCanvasAsPNG(exportCanvas, `${safeName}.png`);
    };

    const exportJSON = () => {
      const jsonData = exportTemplateJSON(config.value, dims.value);
      const str = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([str], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (config.value.name || "plantilla_omr")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      link.download = `${safeName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    onMounted(async () => {
      await nextTick();
      await fitZoom();
      await drawPreview();
    });

    return {
      canvasRef,
      scrollContainer,
      config,
      selectedIndex,
      selectedSection,
      selectedPreset,
      customLabelsInput,
      tagInputValue,
      tagInputRef,
      flatTags,
      setFlatTag,
      addTagFromInput,
      removeTag,
      onTagInputBackspace,
      addEmptyTag,
      zoom,
      canvasWidth,
      canvasHeight,
      minCanvasDimensions,
      dragging,
      hoverSectionIdx,
      goBack,
      selectSection,
      sectionTypeLabel,
      drawPreview,
      clampAndDraw,
      fitZoom,
      adjustZoom,
      onCanvasWidthChange,
      onCanvasHeightChange,
      addNewSection,
      removeSection,
      onSectionTypeChange,
      applyLabelPreset,
      applyLikertScale,
      likertScales,
      applyScale,
      applyCustomLabels,
      getMultiselectLabel,
      setMultiselectLabel,
      downloadPNG,
      exportJSON,
      onCanvasMouseDown,
      onCanvasMouseMove,
      onCanvasMouseUp,
      onCanvasTouchStart,
      onCanvasTouchMove,
      onCanvasTouchEnd,
      arrowBackOutline,
      downloadOutline,
      codeDownloadOutline,
      addOutline,
      trashOutline,
      moveOutline,
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
.section-delete-btn:hover {
  background: #fee2e2;
}

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

.canvas-size-hint {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  padding: 4px 8px 0 8px;
}

/* Multiselect cell labels grid */
.multiselect-labels-grid {
  padding: 4px 8px;
}

.multiselect-row-labels {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.multiselect-cell-label {
  flex: 1;
}

.multiselect-cell-label ion-input {
  --padding-start: 6px;
  --padding-end: 6px;
  font-size: 12px;
}

/* Likert scale chips */
.likert-chips-section {
  padding: 4px 10px 8px 10px;
}

.likert-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.likert-chip {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.likert-chip:hover {
  background: #e0e7ff;
  border-color: #818cf8;
  color: #4338ca;
}

.likert-chip:active {
  background: #c7d2fe;
  transform: scale(0.97);
}

/* Tag-based input for multiselect */
.label-list-section {
  padding: 4px 10px 8px 10px;
  max-height: 260px;
  overflow-y: auto;
}

.label-list-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.label-list-pos {
  min-width: 22px;
  height: 22px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.label-list-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  font-size: 12px;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.15s;
}

.label-list-input:focus {
  border-color: var(--ion-color-primary);
  background: #ffffff;
}

.label-list-input::placeholder {
  color: #94a3b8;
}

.label-list-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
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
  padding: 16px;
  box-sizing: border-box;
  text-align: center;
}

.canvas-scaled-wrapper {
  display: inline-block;
  margin: 0 auto;
  transform-origin: top left;
}

.canvas-scaled-wrapper canvas {
  display: block;
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

.zoom-btn:hover {
  background: #e2e8f0;
}
.zoom-fit {
  width: auto;
  padding: 0 8px;
  font-size: 12px;
}
.zoom-value {
  font-size: 13px;
  color: #64748b;
  min-width: 38px;
  text-align: center;
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
