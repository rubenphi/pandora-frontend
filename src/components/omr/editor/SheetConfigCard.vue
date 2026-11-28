<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div>
    <!-- Sheet config -->
    <div class="panel-card">
      <div class="panel-card-title">Hoja y Modo de Diseño</div>
      <ion-item lines="none">
        <ion-label position="stacked">Nombre de Plantilla</ion-label>
        <ion-input
          v-model="config.name"
          placeholder="Ej: Encuesta 2026"
        ></ion-input>
      </ion-item>

      <ion-item lines="none" class="preset-selector-item ion-margin-top">
        <ion-label position="stacked">Cargar Modelo Oficial Base</ion-label>
        <ion-select
          placeholder="Seleccionar plantilla predefinida..."
          interface="action-sheet"
          :value="selectedPreset"
          @ionChange="onPresetSelect($event.detail.value)"
        >
          <ion-select-option value="parent"
            >Encuesta a Padres de Familia (18 preg.)</ion-select-option
          >
          <ion-select-option value="student"
            >Encuesta a Estudiantes (20 preg.)</ion-select-option
          >
        </ion-select>
      </ion-item>

      <div class="mode-select-wrap ion-margin-top">
        <label class="mode-select-label">Modo de Exportación y Vista</label>
        <div class="mode-toggle-group">
          <button
            type="button"
            :class="[
              'mode-btn',
              {
                'mode-btn--active':
                  !config.renderMode || config.renderMode === 'full',
              },
            ]"
            @click="setRenderMode('full')"
          >
            Hoja Completa
          </button>
          <button
            type="button"
            :class="[
              'mode-btn',
              { 'mode-btn--active': config.renderMode === 'bubbles_only' },
            ]"
            @click="setRenderMode('bubbles_only')"
          >
            Solo Burbujas y Marcadores
          </button>
        </div>
        <p class="mode-hint" v-if="config.renderMode === 'bubbles_only'">
          <strong>Modo Grilla Externa:</strong> Oculta enunciados y textos para
          que puedas exportar el PNG/PDF y montar tu propio diseño (logos,
          encabezados y preguntas abiertas) en Canva, Photoshop o Word.
        </p>
      </div>
    </div>

    <!-- Fondo de Diseño Externo (Canva, Illustrator, Photoshop, Word) -->
    <div class="panel-card">
      <div class="panel-card-title">Fondo de Diseño Externo</div>
      <p class="panel-card-desc">
        Diseña el encabezado, logos y textos en Canva o Illustrator. Al subir el
        PDF o imagen, Pandora alinea la hoja, borra duplicados y sobrepone la
        grilla de escaneo OMR calibrada.
      </p>

      <div class="bg-design-actions ion-margin-top">
        <input
          ref="bgFileInput"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          style="display: none"
          @change="onFileSelected"
        />

        <button
          type="button"
          class="qz-btn-action qz-btn-action--primary w-full"
          @click="openFilePicker"
          :disabled="isProcessingBg"
        >
          <ion-icon :icon="cloudUploadOutline"></ion-icon>
          <span>{{
            isProcessingBg
              ? "Procesando archivo..."
              : "Subir diseño (PDF o Imagen)"
          }}</span>
        </button>

        <!-- Barra de progreso visual prominente durante la carga y calibración -->
        <div v-if="isProcessingBg" class="bg-processing-box ion-margin-top">
          <div class="bg-processing-header">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <span class="bg-processing-label"
              >Procesando y analizando hoja...</span
            >
          </div>
          <ion-progress-bar
            type="indeterminate"
            color="primary"
          ></ion-progress-bar>
        </div>

        <button
          type="button"
          class="qz-btn-action qz-btn-action--ghost w-full ion-margin-top"
          @click="$emit('download-design-guide')"
          title="Descargar PDF limpio con marcadores y área segura para abrir en Canva o Illustrator"
        >
          <ion-icon :icon="downloadOutline"></ion-icon>
          <span>Descargar Plantilla Guía (PDF)</span>
        </button>
      </div>

      <!-- Estado del fondo cargado -->
      <div v-if="config.backgroundImage" class="bg-status-card ion-margin-top">
        <div class="bg-status-header">
          <span
            :class="[
              'bg-status-badge',
              config.bgMarkersFound === false ? 'bg-status-badge--warning' : '',
            ]"
          >
            <ion-icon
              :icon="
                config.bgMarkersFound === false
                  ? alertCircleOutline
                  : checkmarkCircle
              "
            ></ion-icon>
            {{
              config.bgMarkersFound === false
                ? "Disposición modificada (revisa marcadores)"
                : "Fondo activo y calibrado"
            }}
          </span>
          <button
            type="button"
            class="bg-remove-btn"
            @click="$emit('remove-background')"
            title="Quitar fondo personalizado"
          >
            Quitar fondo
          </button>
        </div>
        <p class="bg-status-text" v-if="bgStatusMessage">
          {{ bgStatusMessage }}
        </p>
        <div class="bg-download-row ion-margin-top">
          <button
            type="button"
            class="qz-btn-action qz-btn-action--primary w-full"
            @click="$emit('download-background')"
            title="Descargar una copia de tu diseño de fondo"
          >
            <ion-icon :icon="downloadOutline"></ion-icon>
            <span>Descargar Mi Diseño de Fondo</span>
          </button>
        </div>
      </div>
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
              @ionChange="$emit('update:canvasWidth', +$event.detail.value)"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              :value="canvasWidth"
              :min="minCanvasDimensions.width"
              :max="2000"
              @change="$emit('update:canvasWidth', +$event.target.value)"
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
              @ionChange="$emit('update:canvasHeight', +$event.detail.value)"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              :value="canvasHeight"
              :min="minCanvasDimensions.height"
              :max="3000"
              @change="$emit('update:canvasHeight', +$event.target.value)"
            />
          </div>
        </div>
      </div>
      <div class="canvas-size-hint">
        Actual: {{ canvasWidth }} × {{ canvasHeight }} px
      </div>
      <div class="num-row">
        <div class="num-field">
          <label>Tamaño marcadores (px)</label>
          <div class="num-input-row">
            <ion-range
              v-model="config.markerSize"
              min="20"
              max="80"
              step="1"
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="config.markerSize"
              min="20"
              max="80"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
      </div>

      <!-- Margen superior e inferior de marcadores OMR -->
      <div class="num-row" v-if="config.margins">
        <div class="num-field">
          <label>Espacio Superior para Encabezado (px)</label>
          <div class="num-input-row">
            <ion-range
              v-model="config.margins.top"
              min="60"
              max="700"
              step="10"
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="config.margins.top"
              min="60"
              max="700"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
      </div>
      <div class="num-row" v-if="config.margins">
        <div class="num-field">
          <label>Espacio Inferior para Preguntas Abiertas (px)</label>
          <div class="num-input-row">
            <ion-range
              v-model="config.margins.bottom"
              min="60"
              max="700"
              step="10"
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="config.margins.bottom"
              min="60"
              max="700"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable vue/no-mutating-props */
import { ref } from "vue";
import {
  IonItem,
  IonLabel,
  IonInput,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonProgressBar,
  IonSpinner,
  alertController,
} from "@ionic/vue";
import {
  cloudUploadOutline,
  downloadOutline,
  checkmarkCircle,
  alertCircleOutline,
} from "ionicons/icons";

export default {
  name: "SheetConfigCard",
  components: {
    IonItem,
    IonLabel,
    IonInput,
    IonRange,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonProgressBar,
    IonSpinner,
  },
  props: {
    config: {
      type: Object,
      required: true,
    },
    canvasWidth: {
      type: Number,
      required: true,
    },
    canvasHeight: {
      type: Number,
      required: true,
    },
    minCanvasDimensions: {
      type: Object,
      default: () => ({ width: 500, height: 500 }),
    },
    isProcessingBg: {
      type: Boolean,
      default: false,
    },
    bgStatusMessage: {
      type: String,
      default: "",
    },
  },
  emits: [
    "update:canvasWidth",
    "update:canvasHeight",
    "draw-preview",
    "apply-preset",
    "upload-background",
    "remove-background",
    "download-background",
    "download-design-guide",
  ],
  setup(props, { emit }) {
    const selectedPreset = ref("");
    const bgFileInput = ref(null);

    const openFilePicker = () => {
      if (bgFileInput.value) bgFileInput.value.click();
    };

    const onFileSelected = (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) {
        emit("upload-background", file);
        event.target.value = "";
      }
    };

    const setRenderMode = (mode) => {
      props.config.renderMode = mode;
      emit("draw-preview");
    };

    const onPresetSelect = async (presetKey) => {
      if (!presetKey) return;
      const isStudent = presetKey === "student";
      const modelName = isStudent
        ? "Encuesta a Estudiantes (Decreto Ley 1278 - 20 preguntas)"
        : "Encuesta a Padres de Familia (Decreto Ley 1278 - 18 preguntas)";

      const alert = await alertController.create({
        header: "Cargar Modelo Oficial",
        message: `¿Deseas reemplazar el diseño actual con la plantilla oficial "${modelName}"?`,
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
            handler: () => {
              selectedPreset.value = "";
            },
          },
          {
            text: "Cargar",
            handler: () => {
              emit("apply-preset", presetKey);
              selectedPreset.value = "";
            },
          },
        ],
      });
      await alert.present();
    };

    return {
      selectedPreset,
      setRenderMode,
      onPresetSelect,
      bgFileInput,
      openFilePicker,
      onFileSelected,
      cloudUploadOutline,
      downloadOutline,
      checkmarkCircle,
      alertCircleOutline,
    };
  },
};
</script>

<style scoped>
.panel-card-desc {
  font-size: 11.5px;
  color: #64748b;
  margin: 0 0 10px 0;
  padding: 0 6px;
  line-height: 1.45;
}

.w-full {
  width: 100%;
}

.bg-processing-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 12px;
}

.bg-processing-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.bg-processing-label {
  font-size: 12px;
  font-weight: 600;
  color: #15803d;
}

.bg-status-card {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 8px;
  padding: 10px 12px;
  margin: 10px 6px 0 6px;
}

.bg-status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bg-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #059669;
}

.bg-status-badge--warning {
  color: #d97706;
}

.bg-remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.bg-remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.bg-status-text {
  font-size: 11px;
  color: #047857;
  margin: 6px 0 0 0;
  line-height: 1.4;
}
.panel-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 10px 6px 12px 6px;
  margin-bottom: 10px;
}

.panel-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 6px 8px 6px;
}

.mode-select-wrap {
  padding: 0 8px;
}

.mode-select-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.mode-toggle-group {
  display: flex;
  background: #e2e8f0;
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
}

.mode-btn {
  flex: 1;
  padding: 7px 6px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-btn--active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mode-hint {
  font-size: 11px;
  color: #0369a1;
  background: #e0f2fe;
  padding: 6px 8px;
  border-radius: 6px;
  margin-top: 6px;
  line-height: 1.35;
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

.canvas-size-hint {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  padding: 4px 8px 0 8px;
}

@media (prefers-color-scheme: dark) {
  .panel-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
}

:global(body.dark) .panel-card,
:global(html.dark) .panel-card,
:global(.dark) .panel-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  color: #f7f7fd;
}

:global(body.dark) .panel-card-title,
:global(html.dark) .panel-card-title,
:global(.dark) .panel-card-title {
  color: #f7f7fd;
}

:global(body.dark) .mode-select-label,
:global(html.dark) .mode-select-label,
:global(.dark) .mode-select-label,
:global(body.dark) .num-field label,
:global(html.dark) .num-field label,
:global(.dark) .num-field label {
  color: #9e9bb8;
}

:global(body.dark) .num-input-box,
:global(html.dark) .num-input-box,
:global(.dark) .num-input-box {
  background: #231d42;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .mode-toggle-group,
:global(html.dark) .mode-toggle-group,
:global(.dark) .mode-toggle-group {
  background: #231d42;
}

:global(body.dark) .mode-btn,
:global(html.dark) .mode-btn,
:global(.dark) .mode-btn {
  color: #9e9bb8;
}

:global(body.dark) .mode-btn--active,
:global(html.dark) .mode-btn--active,
:global(.dark) .mode-btn--active {
  background: #2f2759;
  color: #c0b7ff;
}

:global(body.dark) .mode-hint,
:global(html.dark) .mode-hint,
:global(.dark) .mode-hint {
  background: #172554;
  color: #93c5fd;
}
</style>
