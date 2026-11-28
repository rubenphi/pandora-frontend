<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="panel-card" v-if="selectedSection">
    <div class="panel-card-title">
      Propiedades:
      <span class="accent-text">{{ selectedSection.title || selectedSection.name }}</span>
    </div>

    <ion-item lines="full">
      <ion-label position="stacked">Título visible en la hoja</ion-label>
      <ion-input
        v-model="selectedSection.title"
        @ionInput="$emit('draw-preview')"
        placeholder="Título de la sección"
      ></ion-input>
    </ion-item>

    <ion-item lines="full">
      <ion-label position="stacked">Nombre interno (JSON)</ion-label>
      <ion-input
        v-model="selectedSection.name"
        @ionInput="$emit('draw-preview')"
        placeholder="seccion1"
      ></ion-input>
    </ion-item>

    <ion-item lines="full">
      <ion-label position="stacked">Tipo de elemento</ion-label>
      <ion-select
        v-model="selectedSection.type"
        @ionChange="$emit('section-type-change')"
        interface="action-sheet"
      >
        <ion-select-option value="question">Pregunta (única opción / Likert)</ion-select-option>
        <ion-select-option value="code">Código de Identificación</ion-select-option>
        <ion-select-option value="multiselect">Múltiple selección</ion-select-option>
        <ion-select-option value="instruction">Cuadro de Texto / Instrucciones</ion-select-option>
      </ion-select>
    </ion-item>

    <!-- ===== INSTRUCTION SECTION SPECIFIC ===== -->
    <template v-if="selectedSection.type === 'instruction'">
      <div class="props-group-title">Texto del Recuadro</div>
      <ion-item lines="full">
        <ion-label position="stacked">Instrucciones o contenido</ion-label>
        <ion-textarea
          v-model="selectedSection.content"
          :auto-grow="true"
          rows="3"
          @ionInput="$emit('draw-preview')"
          placeholder="Escriba las instrucciones para el encuestado..."
        ></ion-textarea>
      </ion-item>

      <div class="num-row">
        <div class="num-field">
          <label>Tamaño de letra (px)</label>
          <div class="num-input-row">
            <ion-range
              v-model="selectedSection.fontSize"
              min="8"
              max="20"
              step="1"
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.fontSize"
              min="8"
              max="20"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
      </div>

      <div class="num-row">
        <div class="num-field">
          <label>Ancho recuadro (px)</label>
          <div class="num-input-row">
            <ion-range
              v-model="selectedSection.widthPx"
              min="200"
              max="1150"
              step="20"
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.widthPx"
              min="200"
              max="1150"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
      </div>

      <div class="num-row">
        <div class="num-field">
          <label>Alto recuadro (px)</label>
          <div class="num-input-row">
            <ion-range
              v-model="selectedSection.heightPx"
              min="40"
              max="400"
              step="10"
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.heightPx"
              min="40"
              max="400"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- ===== CODE SECTION SPECIFIC ===== -->
    <template v-else-if="selectedSection.type === 'code'">
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
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.digits"
              min="1"
              max="12"
              @change="$emit('draw-preview')"
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
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.cellSize"
              min="20"
              max="70"
              @change="$emit('draw-preview')"
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
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.colSpacing"
              min="24"
              max="80"
              @change="$emit('draw-preview')"
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
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.rowSpacing"
              min="16"
              max="60"
              @change="$emit('draw-preview')"
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
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.radius"
              min="5"
              max="18"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- ===== QUESTION / MULTISELECT PROPERTIES ===== -->
    <template v-else>
      <!-- Modalidad para preguntas -->
      <div class="props-group-title" v-if="selectedSection.type === 'question'">Modalidad de Presentación</div>
      <div class="mode-toggle-group" v-if="selectedSection.type === 'question'">
        <button 
          class="mode-btn" 
          :class="{ 'mode-btn--active': !selectedSection.layoutMode || selectedSection.layoutMode === 'compact' }"
          @click="setLayoutMode('compact')"
        >
          Hoja Compacta (OMR)
        </button>
        <button 
          class="mode-btn" 
          :class="{ 'mode-btn--active': selectedSection.layoutMode === 'questionnaire' }"
          @click="setLayoutMode('questionnaire')"
        >
          Cuestionario Completo
        </button>
      </div>

      <!-- Banners de advertencia e información -->
      <div v-if="selectedSection.type === 'question'">
        <div v-if="!selectedSection.layoutMode || selectedSection.layoutMode === 'compact'" class="mode-info-banner compact-banner">
          <div class="banner-title">
            <ion-icon :icon="informationCircleOutline"></ion-icon>
            Modo Hoja Compacta (Fácil de escanear)
          </div>
          <div class="banner-body">
            <strong>Óptimo para OMR:</strong> Burbujas agrupadas limpiamente, escaneo rápido y alta tolerancia. Caben hasta 40-50 preguntas por hoja. Requiere cuadernillo de preguntas por separado.
          </div>
        </div>

        <div v-else class="mode-info-banner questionnaire-banner">
          <div class="banner-title">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            Modo Cuestionario con Enunciados
          </div>
          <div class="banner-body">
            <strong>Más intuitivo:</strong> El encuestado lee y marca en la misma hoja. <em>Aviso:</em> Caben menos preguntas (aprox. 10 a 14 por hoja) y requiere cuidar la iluminación y no marcar sobre los textos al escanear.
          </div>
        </div>
      </div>

      <!-- Gráfico para Reporte PDF -->
      <div class="props-group-title">Gráfico en Reporte PDF</div>
      <ion-item lines="full" class="chart-type-item">
        <ion-label position="stacked">Tipo de Gráfica</ion-label>
        <ion-select
          v-model="selectedSection.chartType"
          interface="action-sheet"
          placeholder="Barras Apiladas (100%)"
        >
          <ion-select-option value="stacked_bar">Barras Horizontales Apiladas (100%)</ion-select-option>
          <ion-select-option value="pie">Circular / Torta (1 pregunta o Sí/No)</ion-select-option>
          <ion-select-option value="radar">Radial / Telaraña</ion-select-option>
          <ion-select-option value="table">Solo Tabla de Frecuencias</ion-select-option>
        </ion-select>
      </ion-item>

      <div class="props-group-title">Dimensiones</div>
      <div class="num-row two-col">
        <div class="num-field">
          <label>Filas (Preguntas)</label>
          <div class="num-input-row">
            <ion-range
              v-model="selectedSection.rows"
              min="1"
              max="50"
              step="1"
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.rows"
              min="1"
              max="50"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
        <div class="num-field">
          <label>Columnas (Opciones)</label>
          <div class="num-input-row">
            <ion-range
              v-model="selectedSection.cols"
              min="1"
              max="20"
              step="1"
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.cols"
              min="1"
              max="20"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
      </div>

      <!-- Ancho del texto de la pregunta (si es cuestionario) -->
      <div class="num-row" v-if="selectedSection.type === 'question' && selectedSection.layoutMode === 'questionnaire'">
        <div class="num-field">
          <label>Espacio para texto de pregunta (px)</label>
          <div class="num-input-row">
            <ion-range
              v-model="selectedSection.labelWidth"
              min="180"
              max="850"
              step="10"
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.labelWidth"
              min="180"
              max="850"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
      </div>

      <!-- Número inicial de pregunta (ej: 15 si continúa de otra sección) -->
      <div class="num-row" v-if="selectedSection.type === 'question'">
        <div class="num-field">
          <label>Número inicial de pregunta (continuación)</label>
          <div class="num-input-row">
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.rowStart"
              min="1"
              max="200"
              @change="$emit('draw-preview')"
              placeholder="1"
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
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.colSpacing"
              min="20"
              max="100"
              @change="$emit('draw-preview')"
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
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.rowSpacing"
              min="16"
              max="80"
              @change="$emit('draw-preview')"
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
              @ionChange="$emit('draw-preview')"
            ></ion-range>
            <input
              class="num-input-box"
              type="number"
              v-model.number="selectedSection.radius"
              min="5"
              max="20"
              @change="$emit('draw-preview')"
            />
          </div>
        </div>
      </div>

      <div class="props-group-title" v-if="selectedSection.type !== 'multiselect'">Etiquetas de opciones</div>
      <ion-item lines="full" v-if="selectedSection.type !== 'multiselect'">
        <ion-label>Preset de etiquetas</ion-label>
        <ion-select
          v-model="selectedPreset"
          @ionChange="applyLabelPreset"
          interface="action-sheet"
        >
          <ion-select-option value="numbers">1, 2, 3…</ion-select-option>
          <ion-select-option value="letters">A, B, C, D</ion-select-option>
          <ion-select-option value="likert">Escala Likert</ion-select-option>
          <ion-select-option value="yesno">Sí / No</ion-select-option>
          <ion-select-option value="custom">Personalizado</ion-select-option>
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
        <ion-label position="stacked">Etiquetas (separadas por comas)</ion-label>
        <ion-input
          v-model="customLabelsInput"
          placeholder="Opción 1, Opción 2..."
          @ionInput="applyCustomLabels"
        ></ion-input>
      </ion-item>

      <ion-item lines="none" v-if="selectedSection.type !== 'multiselect'">
        <ion-label>Mostrar encabezados en hoja</ion-label>
        <ion-toggle
          v-model="selectedSection.showLabels"
          @ionChange="$emit('draw-preview')"
        ></ion-toggle>
      </ion-item>

      <ion-item
        lines="none"
        v-if="selectedSection.showLabels && selectedSection.type !== 'multiselect'"
      >
        <ion-label position="stacked">Prefijo numérico (ej: Q, P o vacío)</ion-label>
        <ion-input
          v-model="selectedSection.rowPrefix"
          @ionInput="$emit('draw-preview')"
          placeholder="Q"
        ></ion-input>
      </ion-item>

      <!-- Questionnaire: editable list of prompts -->
      <template v-if="selectedSection.type === 'question' && selectedSection.layoutMode === 'questionnaire'">
        <div class="props-group-title">Enunciados de cada pregunta</div>
        <div class="prompts-list-section">
          <div
            v-for="r in (selectedSection.rows || 1)"
            :key="'prompt-' + r"
            class="prompt-row"
          >
            <span class="prompt-pos">{{ (selectedSection.rowPrefix || '') + ((selectedSection.rowStart || 1) + r - 1) }}</span>
            <input
              class="prompt-input"
              :value="getPrompt(r - 1)"
              @input="setPrompt(r - 1, $event.target.value)"
              :placeholder="'Enunciado de la pregunta ' + ((selectedSection.rowStart || 1) + r - 1)"
            />
          </div>
        </div>
      </template>

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
              @blur="$emit('draw-preview')"
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
            @ionChange="$emit('clamp-and-draw')"
          ></ion-range>
          <input
            class="num-input-box"
            type="number"
            v-model.number="selectedSection.percentX"
            min="0"
            max="90"
            step="0.5"
            @change="$emit('clamp-and-draw')"
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
            @ionChange="$emit('clamp-and-draw')"
          ></ion-range>
          <input
            class="num-input-box"
            type="number"
            v-model.number="selectedSection.percentY"
            min="0"
            max="90"
            step="0.5"
            @change="$emit('clamp-and-draw')"
          />
        </div>
      </div>
    </div>

    <div class="num-row" v-if="selectedSection.type === 'question' && (!selectedSection.layoutMode || selectedSection.layoutMode === 'compact')">
      <div class="num-field">
        <label>Grupos de columnas</label>
        <div class="num-input-row">
          <ion-range
            v-model="selectedSection.columnGroups"
            min="1"
            max="6"
            step="1"
            @ionChange="$emit('draw-preview')"
          ></ion-range>
          <input
            class="num-input-box"
            type="number"
            v-model.number="selectedSection.columnGroups"
            min="1"
            max="6"
            @change="$emit('draw-preview')"
          />
        </div>
      </div>
    </div>

    <div class="num-row" v-if="selectedSection.type !== 'instruction'">
      <div class="num-field">
        <label>Tamaño sección (escala %)</label>
        <div class="num-input-row">
          <ion-range
            v-model="selectedSection.scale"
            min="50"
            max="200"
            step="5"
            @ionChange="$emit('apply-scale')"
          ></ion-range>
          <input
            class="num-input-box"
            type="number"
            v-model.number="selectedSection.scale"
            min="50"
            max="200"
            @change="$emit('apply-scale')"
          />
        </div>
      </div>
    </div>

    <div class="drag-hint-box">
      <ion-icon :icon="moveOutline"></ion-icon>
      Arrastra la sección directamente en el lienzo para posicionarla
    </div>
  </div>
</template>

<script>
/* eslint-disable vue/no-mutating-props */
import { ref, computed } from "vue";
import {
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonRange,
  IonIcon,
} from "@ionic/vue";
import {
  moveOutline,
  informationCircleOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { LIKERT_SCALES } from "./constants.js";

export default {
  name: "SectionPropertiesCard",
  components: {
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonRange,
    IonIcon,
  },
  props: {
    selectedSection: {
      type: Object,
      default: null,
    },
  },
  emits: [
    "draw-preview",
    "clamp-and-draw",
    "section-type-change",
    "apply-scale",
  ],
  setup(props, { emit }) {
    const selectedPreset = ref("likert");
    const customLabelsInput = ref("");
    const likertScales = LIKERT_SCALES;

    const setLayoutMode = (mode) => {
      if (!props.selectedSection) return;
      props.selectedSection.layoutMode = mode;
      if (mode === "questionnaire") {
        props.selectedSection.labelWidth = props.selectedSection.labelWidth || 280;
        props.selectedSection.columnGroups = 1; // 1 columna principal para textos largos
        if (!Array.isArray(props.selectedSection.questionPrompts)) {
          props.selectedSection.questionPrompts = [];
        }
      } else {
        props.selectedSection.labelWidth = props.selectedSection.labelWidth || 55;
      }
      emit("draw-preview");
    };

    const getPrompt = (idx) => {
      if (!props.selectedSection?.questionPrompts) return "";
      return props.selectedSection.questionPrompts[idx] || "";
    };

    const setPrompt = (idx, text) => {
      if (!props.selectedSection) return;
      if (!Array.isArray(props.selectedSection.questionPrompts)) {
        props.selectedSection.questionPrompts = [];
      }
      while (props.selectedSection.questionPrompts.length <= idx) {
        props.selectedSection.questionPrompts.push("");
      }
      props.selectedSection.questionPrompts[idx] = text;
      emit("draw-preview");
    };

    const applyLabelPreset = () => {
      if (!props.selectedSection) return;
      const preset = selectedPreset.value;

      if (props.selectedSection.type === "multiselect") {
        if (preset === "numbers") {
          const n = props.selectedSection.cols;
          const row = Array.from({ length: n }, (_, i) => String(i + 1));
          props.selectedSection.labels = Array.from(
            { length: props.selectedSection.rows },
            () => [...row]
          );
        } else if (preset === "letters") {
          const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
          const row = letters.slice(0, props.selectedSection.cols);
          props.selectedSection.labels = Array.from(
            { length: props.selectedSection.rows },
            () => [...row]
          );
        } else if (preset === "yesno") {
          const row = ["Sí", "No"];
          props.selectedSection.cols = 2;
          props.selectedSection.labels = Array.from(
            { length: props.selectedSection.rows },
            () => [...row]
          );
        } else if (preset === "likert") {
          emit("draw-preview");
          return;
        } else if (preset === "custom") {
          props.selectedSection.labels = [];
          for (let r = 0; r < props.selectedSection.rows; r++) {
            props.selectedSection.labels[r] = [];
            for (let c = 0; c < props.selectedSection.cols; c++) {
              props.selectedSection.labels[r][c] = "";
            }
          }
        }
        emit("draw-preview");
        return;
      }

      // For question type
      if (preset === "numbers") {
        const n = props.selectedSection.cols;
        props.selectedSection.labels = Array.from({ length: n }, (_, i) =>
          String(i + 1)
        );
      } else if (preset === "letters") {
        const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
        props.selectedSection.labels = letters.slice(
          0,
          props.selectedSection.cols
        );
      } else if (preset === "likert") {
        emit("draw-preview");
        return;
      } else if (preset === "yesno") {
        props.selectedSection.labels = ["Sí", "No"];
        props.selectedSection.cols = 2;
      }
      emit("draw-preview");
    };

    const applyLikertScale = (key) => {
      if (!props.selectedSection) return;
      const scale = likertScales[key];
      if (!scale) return;

      if (props.selectedSection.type === "multiselect") {
        props.selectedSection.cols = scale.options.length;
        props.selectedSection.labels = Array.from(
          { length: props.selectedSection.rows },
          () => [...scale.options]
        );
      } else {
        props.selectedSection.labels = [...scale.options];
        props.selectedSection.cols = scale.options.length;
      }
      emit("draw-preview");
    };

    const applyCustomLabels = () => {
      if (!props.selectedSection || props.selectedSection.type === "multiselect") {
        emit("draw-preview");
        return;
      }
      const arr = customLabelsInput.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length > 0) {
        props.selectedSection.labels = arr;
        props.selectedSection.cols = arr.length;
      }
      emit("draw-preview");
    };

    const flatTags = computed(() => {
      if (!props.selectedSection?.labels) return [];
      if (!Array.isArray(props.selectedSection.labels)) return [];
      const tags = [];
      const rows = props.selectedSection.rows || 1;
      const cols = props.selectedSection.cols || 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val =
            props.selectedSection.labels[r] &&
            props.selectedSection.labels[r][c]
              ? props.selectedSection.labels[r][c]
              : "";
          tags.push(val);
        }
      }
      return tags;
    });

    const ensureLabels2D = () => {
      if (!props.selectedSection) return;
      const rows = props.selectedSection.rows || 1;
      const cols = props.selectedSection.cols || 1;
      let labels = props.selectedSection.labels;
      if (
        !Array.isArray(labels) ||
        !Array.isArray(labels[0]) ||
        typeof labels[0] === "string"
      ) {
        labels = [];
        for (let r = 0; r < rows; r++) {
          labels[r] = [];
          for (let c = 0; c < cols; c++) {
            labels[r][c] = "";
          }
        }
        props.selectedSection.labels = labels;
      }
      while (props.selectedSection.labels.length < rows) {
        const newRow = [];
        for (let c = 0; c < cols; c++) newRow.push("");
        props.selectedSection.labels.push(newRow);
      }
      for (let r = 0; r < rows; r++) {
        while (props.selectedSection.labels[r].length < cols) {
          props.selectedSection.labels[r].push("");
        }
      }
    };

    const setFlatTag = (index, value) => {
      if (!props.selectedSection) return;
      ensureLabels2D();
      const cols = props.selectedSection.cols || 1;
      const r = Math.floor(index / cols);
      const c = index % cols;
      const newLabels = props.selectedSection.labels.map((row, ri) =>
        ri === r ? row.map((v, ci) => (ci === c ? value : v)) : [...row]
      );
      props.selectedSection.labels = newLabels;
    };

    return {
      moveOutline,
      informationCircleOutline,
      alertCircleOutline,
      selectedPreset,
      customLabelsInput,
      likertScales,
      setLayoutMode,
      getPrompt,
      setPrompt,
      applyLabelPreset,
      applyLikertScale,
      applyCustomLabels,
      flatTags,
      setFlatTag,
    };
  },
};
</script>

<style scoped>
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

.accent-text {
  color: var(--ion-color-primary);
  font-weight: 600;
}

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

/* Mode toggle buttons */
.mode-toggle-group {
  display: flex;
  gap: 6px;
  padding: 4px 8px 8px 8px;
}

.mode-btn {
  flex: 1;
  padding: 7px 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-btn--active {
  background: var(--ion-color-primary);
  color: #ffffff;
  border-color: var(--ion-color-primary);
}

/* Informative mode banners */
.mode-info-banner {
  margin: 4px 8px 10px 8px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.4;
}

.banner-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  margin-bottom: 4px;
}

.banner-title ion-icon {
  font-size: 15px;
}

.compact-banner {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
}

.questionnaire-banner {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

/* Prompts list */
.prompts-list-section {
  padding: 4px 8px;
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.prompt-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.prompt-pos {
  font-size: 11px;
  font-weight: 700;
  color: #4338ca;
  background: #e0e7ff;
  border-radius: 4px;
  padding: 3px 6px;
  min-width: 28px;
  text-align: center;
}

.prompt-input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  font-size: 12px;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
}

.prompt-input:focus {
  border-color: var(--ion-color-primary);
  background: #ffffff;
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
}

.label-list-input:focus {
  border-color: var(--ion-color-primary);
  background: #ffffff;
}

.label-list-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
}

@media (prefers-color-scheme: dark) {
  .panel-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .prompt-input, .label-list-input {
    background: #231d42;
    color: #f7f7fd;
    border-color: rgba(255, 255, 255, 0.1);
  }
}

:global(body.dark) .panel-card,
:global(html.dark) .panel-card,
:global(.dark) .panel-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .panel-card-title,
:global(html.dark) .panel-card-title,
:global(.dark) .panel-card-title,
:global(body.dark) .props-group-title,
:global(html.dark) .props-group-title,
:global(.dark) .props-group-title {
  color: #f7f7fd;
}

:global(body.dark) .num-field label,
:global(html.dark) .num-field label,
:global(.dark) .num-field label,
:global(body.dark) .label-list-hint,
:global(html.dark) .label-list-hint,
:global(.dark) .label-list-hint {
  color: #9e9bb8;
}

:global(body.dark) .num-input-box,
:global(html.dark) .num-input-box,
:global(.dark) .num-input-box {
  background: #231d42;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .prompt-input,
:global(html.dark) .prompt-input,
:global(.dark) .prompt-input,
:global(body.dark) .label-list-input,
:global(html.dark) .label-list-input,
:global(.dark) .label-list-input {
  background: #231d42;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .prompt-pos,
:global(html.dark) .prompt-pos,
:global(.dark) .prompt-pos,
:global(body.dark) .label-list-pos,
:global(html.dark) .label-list-pos,
:global(.dark) .label-list-pos {
  background: #2a2353;
  color: #c0b7ff;
}
</style>
