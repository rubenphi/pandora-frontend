<template>
  <ion-page class="ion-page qz-wizard-page">
    <ion-content :fullscreen="true" class="qz-wizard-content">
      <div class="qz-wizard-wrapper">
        <!-- 1. CABECERA HERO PÚRPURA -->
        <div class="qz-hero-header">
          <div class="qz-hero-top">
            <button
              type="button"
              class="qz-back-btn"
              title="Volver al cuestionario"
              @click="goBack"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </button>

            <div class="qz-hero-pill">
              <ion-icon :icon="sparklesOutline"></ion-icon>
              <span>Generador con IA</span>
            </div>

            <div class="qz-hero-actions-placeholder"></div>
          </div>

          <div class="qz-hero-titles">
            <span class="qz-hero-tag">IMPORTACIÓN INTELIGENTE</span>
            <h1 class="qz-hero-title">Asistente de Preguntas</h1>
          </div>
        </div>

        <!-- 2. BARRA DE PASOS (STEPPER) -->
        <div class="qz-stepper-container">
          <div class="qz-stepper-bar">
            <button
              type="button"
              class="qz-step-item"
              :class="{
                'is-active': currentStep === 1,
                'is-completed': currentStep > 1,
              }"
              @click="currentStep = 1"
            >
              <div class="qz-step-num">
                <ion-icon v-if="currentStep > 1" :icon="checkmarkOutline"></ion-icon>
                <span v-else>1</span>
              </div>
              <span class="qz-step-title">1. Configurar</span>
            </button>

            <div class="qz-step-line" :class="{ 'is-active': currentStep > 1 }"></div>

            <button
              type="button"
              class="qz-step-item"
              :class="{
                'is-active': currentStep === 2,
                'is-completed': currentStep > 2,
              }"
              @click="currentStep = 2"
            >
              <div class="qz-step-num">
                <ion-icon v-if="currentStep > 2" :icon="checkmarkOutline"></ion-icon>
                <span v-else>2</span>
              </div>
              <span class="qz-step-title">2. Copiar Prompt</span>
            </button>

            <div class="qz-step-line" :class="{ 'is-active': currentStep > 2 }"></div>

            <button
              type="button"
              class="qz-step-item"
              :class="{
                'is-active': currentStep === 3,
                'is-completed': objetosValidos.length > 0,
              }"
              @click="currentStep = 3"
            >
              <div class="qz-step-num">
                <ion-icon v-if="objetosValidos.length > 0" :icon="checkmarkOutline"></ion-icon>
                <span v-else>3</span>
              </div>
              <span class="qz-step-title">3. Pegar e Importar</span>
            </button>
          </div>
        </div>

        <!-- 3. CUERPO DEL ASISTENTE -->
        <div class="qz-wizard-body">
          <div class="qz-card-box">
            <!-- ========================================== -->
            <!-- PASO 1: DEFINIR TIPO DE PREGUNTA Y EJEMPLO -->
            <!-- ========================================== -->
            <div v-show="currentStep === 1" class="qz-step-panel">
              <div class="qz-step-panel-header">
                <h2 class="qz-panel-title">¿Qué tipo de preguntas deseas generar?</h2>
                <p class="qz-panel-desc">
                  Indica a la IA el tema, estilo, nivel y un ejemplo opcional para que redacte el cuestionario perfecto en formato compatible.
                </p>
              </div>

              <!-- Tema o Materia -->
              <div class="qz-form-group">
                <label class="qz-label">
                  Tema o Contenido principal <span class="qz-required">*</span>
                </label>
                <input
                  v-model="wizardData.topic"
                  type="text"
                  class="qz-input"
                  placeholder="Ej: La Revolución Industrial, Ecuaciones Cuadráticas, Biología Celular..."
                />
              </div>

              <!-- Nivel y Cantidad -->
              <div class="qz-form-row">
                <div class="qz-form-group">
                  <label class="qz-label">Nivel o Grado</label>
                  <input
                    v-model="wizardData.gradeLevel"
                    type="text"
                    class="qz-input"
                    placeholder="Ej: 9° Grado, Secundaria, Universidad"
                  />
                </div>
                <div class="qz-form-group">
                  <label class="qz-label">Cantidad de preguntas</label>
                  <input
                    v-model.number="wizardData.questionCount"
                    type="number"
                    min="1"
                    max="50"
                    class="qz-input"
                  />
                </div>
              </div>

              <!-- Estilo o Tipo de pregunta -->
              <div class="qz-form-group">
                <label class="qz-label">Tipo o Estilo de pregunta</label>
                <div class="qz-chips-group">
                  <button
                    v-for="tipo in questionTypes"
                    :key="tipo.id"
                    type="button"
                    class="qz-chip"
                    :class="{ 'is-selected': wizardData.questionType === tipo.id }"
                    @click="wizardData.questionType = tipo.id"
                  >
                    {{ tipo.name }}
                  </button>
                </div>
              </div>

              <!-- Descripción o Contexto Adicional -->
              <div class="qz-form-group">
                <label class="qz-label">
                  Explicación detallada o instrucciones específicas
                </label>
                <textarea
                  v-model="wizardData.description"
                  rows="3"
                  class="qz-textarea"
                  placeholder="Ej: Enfocarse en causas económicas y consecuencias sociales. Redactar enunciados claros y distractores plausibles..."
                ></textarea>
              </div>

              <!-- Ejemplo de pregunta (Opcional) -->
              <div class="qz-form-group">
                <label class="qz-label">
                  Ejemplo de pregunta o modelo a imitar (Opcional)
                </label>
                <textarea
                  v-model="wizardData.example"
                  rows="3"
                  class="qz-textarea"
                  placeholder="Ej: ¿Cuál fue la principal fuente de energía de la primera fase de la Revolución Industrial?&#10;A) Carbón (Correcta)&#10;B) Electricidad&#10;C) Petróleo&#10;D) Energía nuclear"
                ></textarea>
              </div>

              <!-- Configuración de Opciones -->
              <div class="qz-form-row">
                <div class="qz-form-group">
                  <label class="qz-label">Opciones por pregunta</label>
                  <select v-model.number="wizardData.optionsPerQuestion" class="qz-select">
                    <option :value="4">4 opciones (A - D, ideal tarjetas/matriz)</option>
                    <option :value="5">5 opciones (A - E)</option>
                    <option :value="6">6 opciones (A - F)</option>
                    <option :value="8">8 opciones (A - H, hoja OMR)</option>
                    <option :value="10">10 opciones (dispositivos)</option>
                  </select>
                </div>
                <div class="qz-form-group">
                  <label class="qz-label">Puntos por pregunta</label>
                  <input
                    v-model.number="points"
                    type="number"
                    min="1"
                    class="qz-input"
                  />
                </div>
              </div>

              <div class="qz-step-actions">
                <button
                  type="button"
                  class="qz-btn-primary"
                  :disabled="!wizardData.topic.trim()"
                  @click="goToPromptStep"
                >
                  <span>Continuar a Generar Prompt</span>
                  <ion-icon :icon="arrowForwardOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- ========================================== -->
            <!-- PASO 2: VISUALIZAR Y COPIAR EL PROMPT IA   -->
            <!-- ========================================== -->
            <div v-show="currentStep === 2" class="qz-step-panel">
              <div class="qz-step-panel-header">
                <h2 class="qz-panel-title">Tu Prompt de Inteligencia Artificial</h2>
                <p class="qz-panel-desc">
                  Copia este prompt y pégalo en cualquier IA (ChatGPT, Claude, Gemini, DeepSeek). Luego regresa al Paso 3 para pegar la respuesta JSON.
                </p>
              </div>

              <!-- Vista previa del Prompt generado -->
              <div class="qz-prompt-container">
                <div class="qz-prompt-header">
                  <span class="qz-prompt-badge">PROMPT OPTIMIZADO</span>
                  <button
                    type="button"
                    class="qz-copy-btn"
                    :class="{ 'is-copied': isPromptCopied }"
                    @click="copyGeneratedPrompt"
                  >
                    <ion-icon :icon="isPromptCopied ? checkmarkOutline : copyOutline"></ion-icon>
                    <span>{{ isPromptCopied ? "¡Copiado!" : "Copiar Prompt" }}</span>
                  </button>
                </div>
                <pre class="qz-prompt-box">{{ generatedPrompt }}</pre>
              </div>

              <div class="qz-instructions-alert">
                <div class="qz-alert-icon-wrap">
                  <ion-icon :icon="sparklesOutline"></ion-icon>
                </div>
                <div class="qz-alert-text-wrap">
                  <strong>Flujo de trabajo:</strong>
                  <ol class="qz-steps-list">
                    <li>Haz clic en el botón superior <strong>"Copiar Prompt"</strong>.</li>
                    <li>Pégalo en tu IA preferida (Gemini, ChatGPT, Claude) y ejecútala.</li>
                    <li>Copia únicamente el array JSON devuelto por la IA.</li>
                    <li>Avanza al <strong>Paso 3</strong> y pégalo en el recuadro para validar e importar.</li>
                  </ol>
                </div>
              </div>

              <div class="qz-step-actions qz-actions-between">
                <button
                  type="button"
                  class="qz-btn-secondary"
                  @click="currentStep = 1"
                >
                  <ion-icon :icon="arrowBackOutline"></ion-icon>
                  <span>Atrás</span>
                </button>

                <button
                  type="button"
                  class="qz-btn-primary"
                  @click="currentStep = 3"
                >
                  <span>Pegar JSON en el Paso 3</span>
                  <ion-icon :icon="arrowForwardOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- ========================================== -->
            <!-- PASO 3: PEGAR JSON, IMÁGENES E IMPORTAR    -->
            <!-- ========================================== -->
            <div v-show="currentStep === 3" class="qz-step-panel">
              <div class="qz-step-panel-header">
                <h2 class="qz-panel-title">Pegar Respuesta JSON e Importar</h2>
                <p class="qz-panel-desc">
                  Pega aquí el código JSON devuelto por la IA. El sistema lo validará y podrás editar cualquier pregunta antes de guardar.
                </p>
              </div>

              <!-- Opciones de orden y aleatoriedad -->
              <div class="qz-options-toggles-row">
                <label class="qz-checkbox-label">
                  <input type="checkbox" v-model="mezclarPreguntas" class="qz-checkbox" />
                  <span>Mezclar orden de preguntas</span>
                </label>
                <label class="qz-checkbox-label">
                  <input type="checkbox" v-model="mezclarOpciones" class="qz-checkbox" />
                  <span>Mezclar orden de opciones</span>
                </label>
              </div>

              <!-- Área de texto JSON -->
              <div class="qz-form-group">
                <div class="qz-textarea-header">
                  <label class="qz-label">Array de Objetos JSON</label>
                  <button
                    type="button"
                    class="qz-mini-btn"
                    title="Pegar ejemplo base"
                    @click="loadSampleJson"
                  >
                    <span>Cargar ejemplo</span>
                  </button>
                </div>
                <textarea
                  v-model="textareaContent"
                  rows="9"
                  class="qz-textarea qz-code-font"
                  :placeholder="placeholderText"
                  @blur="procesarObjetos"
                ></textarea>
              </div>

              <!-- Sección Imágenes Opcionales -->
              <div class="qz-images-panel">
                <div class="qz-images-header">
                  <div>
                    <span class="qz-label">Imágenes de preguntas (opcional)</span>
                    <p class="qz-sub-help">
                      Si el JSON referencia imágenes en el campo "photo", selecciónalas aquí por su nombre original de archivo.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="qz-mini-btn"
                    @click="pickImages"
                  >
                    <ion-icon :icon="imagesOutline"></ion-icon>
                    <span>Seleccionar fotos</span>
                  </button>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  class="image-picker-hidden"
                  ref="imageInput"
                  @change="onImagesSelected"
                />

                <div v-if="selectedImages.length > 0" class="qz-selected-files-bar">
                  <span class="qz-files-count">
                    {{ selectedImages.length }} archivo(s) listo(s): {{ selectedImageNames.join(", ") }}
                  </span>
                  <button
                    type="button"
                    class="qz-danger-link"
                    @click="clearImages"
                  >
                    <ion-icon :icon="trashOutline"></ion-icon>
                    <span>Quitar</span>
                  </button>
                </div>

                <div v-if="missingImages.length > 0" class="qz-warning-badge-box">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                  <span>El JSON referencia fotos no seleccionadas: {{ missingImages.join(", ") }}</span>
                </div>
              </div>

              <!-- Botón Validar / Procesar -->
              <div class="qz-form-group">
                <button
                  type="button"
                  class="qz-btn-process"
                  @click="procesarObjetos"
                >
                  <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                  <span>Validar y Procesar JSON</span>
                </button>
              </div>

              <!-- PREVISUALIZACIÓN DE PREGUNTAS VÁLIDAS -->
              <div v-if="objetosValidos.length > 0" class="qz-preview-section">
                <div class="qz-preview-header">
                  <h3 class="qz-preview-title">
                    Preguntas detectadas ({{ objetosValidos.length }})
                  </h3>
                  <span class="qz-preview-points">{{ points }} pts c/u</span>
                </div>

                <div class="qz-preview-list">
                  <div
                    v-for="(objeto, index) in objetosValidos"
                    :key="index"
                    class="qz-preview-item"
                  >
                    <div class="qz-preview-item-top">
                      <div class="qz-preview-item-index">{{ index + 1 }}</div>
                      <div class="qz-preview-item-content">
                        <h4 class="qz-preview-sentence">{{ objeto.sentence }}</h4>
                        <span v-if="objeto.photo" class="qz-photo-tag">
                          Foto: {{ objeto.photo }}
                        </span>
                      </div>
                      <button
                        type="button"
                        class="qz-edit-icon-btn"
                        title="Editar pregunta"
                        @click="abrirModalEdicion(index)"
                      >
                        <ion-icon :icon="pencil"></ion-icon>
                      </button>
                    </div>

                    <!-- Opciones de respuesta -->
                    <div class="qz-preview-options-grid">
                      <div
                        v-for="(opt, optIdx) in objeto.options"
                        :key="optIdx"
                        class="qz-preview-opt-item"
                        :class="{ 'is-correct': opt.correct }"
                      >
                        <span class="qz-opt-letter">
                          {{ String.fromCharCode(65 + optIdx) }}
                        </span>
                        <span class="qz-opt-text">{{ opt.sentence }}</span>
                        <ion-icon
                          v-if="opt.correct"
                          :icon="checkmarkCircle"
                          class="qz-opt-check"
                        ></ion-icon>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Botón Definitivo de Importar -->
                <div class="qz-final-submit-box">
                  <button
                    type="button"
                    class="qz-btn-import-now"
                    :disabled="isImporting"
                    @click="importarPreguntas"
                  >
                    <ion-spinner v-if="isImporting" name="crescent"></ion-spinner>
                    <template v-else>
                      <ion-icon :icon="downloadOutline"></ion-icon>
                      <span>Guardar {{ objetosValidos.length }} Preguntas en el Cuestionario</span>
                    </template>
                  </button>
                </div>
              </div>

              <div class="qz-step-actions qz-actions-between" style="margin-top: 24px;">
                <button
                  type="button"
                  class="qz-btn-secondary"
                  @click="currentStep = 2"
                >
                  <ion-icon :icon="arrowBackOutline"></ion-icon>
                  <span>Volver al Prompt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL DE EDICIÓN RÁPIDA -->
      <ion-modal
        :is-open="isModalOpen"
        @didDismiss="cancelarEdicion"
        class="qz-modal-edit"
      >
        <div class="qz-modal-sheet" v-if="preguntaEnEdicion">
          <div class="qz-modal-header">
            <h3 class="qz-modal-title">Editar Pregunta</h3>
            <button
              type="button"
              class="qz-modal-close-btn"
              @click="cancelarEdicion"
            >
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>

          <div class="qz-modal-body">
            <div class="qz-form-group">
              <label class="qz-label">Enunciado de la pregunta</label>
              <textarea
                v-model="preguntaEnEdicion.sentence"
                rows="3"
                class="qz-textarea"
              ></textarea>
            </div>

            <div class="qz-form-group">
              <label class="qz-label">Opciones y Respuesta Correcta</label>
              <div class="qz-modal-options-list">
                <div
                  v-for="(opcion, optIndex) in preguntaEnEdicion.options"
                  :key="optIndex"
                  class="qz-modal-opt-row"
                >
                  <input
                    v-model="opcion.sentence"
                    type="text"
                    class="qz-input"
                    :placeholder="'Opción ' + String.fromCharCode(65 + optIndex)"
                  />
                  <label class="qz-correct-checkbox-wrap">
                    <input
                      type="checkbox"
                      v-model="opcion.correct"
                      class="qz-checkbox"
                    />
                    <span>Correcta</span>
                  </label>
                  <button
                    type="button"
                    class="qz-trash-opt-btn"
                    title="Eliminar opción"
                    @click="quitarOpcion(optIndex)"
                  >
                    <ion-icon :icon="trash"></ion-icon>
                  </button>
                </div>
              </div>

              <button
                type="button"
                class="qz-btn-add-opt"
                @click="agregarOpcion"
              >
                <ion-icon :icon="addOutline"></ion-icon>
                <span>Añadir opción</span>
              </button>
            </div>
          </div>

          <div class="qz-modal-footer">
            <button
              type="button"
              class="qz-btn-secondary"
              @click="cancelarEdicion"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="qz-btn-primary"
              @click="guardarCambios"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </ion-modal>

      <!-- TOASTS -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        :message="toastSuccessMessage"
        :duration="3000"
        color="success"
        @didDismiss="isSuccessToastOpen = false"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        :message="toastErrorMessage"
        :duration="3500"
        color="danger"
        @didDismiss="isErrorToastOpen = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, reactive, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usuarioGet, tokenHeader, shuffleArray } from "../globalService";
import {
  findMissingImages,
  buildImagePreviews,
  revokeImagePreviews,
  resolveQuestionPhotos,
} from "../questionImageService";
import {
  onIonViewWillEnter,
  alertController,
  IonToast,
  IonPage,
  IonContent,
  IonIcon,
  IonModal,
  IonSpinner,
} from "@ionic/vue";
import {
  arrowBackOutline,
  arrowForwardOutline,
  sparklesOutline,
  checkmarkOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  copyOutline,
  pencil,
  trash,
  trashOutline,
  imagesOutline,
  downloadOutline,
  alertCircleOutline,
  closeOutline,
  addOutline,
} from "ionicons/icons";
import axios from "axios";

export default {
  name: "ImportarPreguntaVariables",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonModal,
    IonToast,
    IonSpinner,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const id = parseInt(route.params.id) || 0;

    const currentStep = ref(1);
    const isPromptCopied = ref(false);
    const isImporting = ref(false);

    const mezclarPreguntas = ref(true);
    const mezclarOpciones = ref(true);
    const points = ref(10);

    const isSuccessToastOpen = ref(false);
    const isErrorToastOpen = ref(false);
    const toastErrorMessage = ref("");
    const toastSuccessMessage = ref("Importación exitosa");

    const usuario = ref();
    const textareaContent = ref("");
    const objetosValidos = ref([]);

    const questionTypes = ref([
      { id: "conceptual", name: "Conceptual & Teórica" },
      { id: "casos", name: "Análisis de Caso / Situacional" },
      { id: "logica", name: "Razonamiento / Lógica" },
      { id: "calculo", name: "Problemas & Cálculo" },
      { id: "vocabulario", name: "Glosario & Términos" },
    ]);

    const wizardData = reactive({
      topic: "",
      gradeLevel: "",
      questionCount: 5,
      questionType: "conceptual",
      description: "",
      example: "",
      optionsPerQuestion: 4,
    });

    const placeholderText = `[
  {
    "sentence": "¿Cuál es la capital de Francia?",
    "options": [
      { "sentence": "París", "correct": true },
      { "sentence": "Londres", "correct": false },
      { "sentence": "Madrid", "correct": false },
      { "sentence": "Berlín", "correct": false }
    ]
  }
]`;

    // Prompt generator computation
    const generatedPrompt = computed(() => {
      const typeObj = questionTypes.value.find(
        (t) => t.id === wizardData.questionType
      );
      const typeLabel = typeObj ? typeObj.name : "Opción múltiple";

      let prompt = `Actúa como un experto pedagogo y docente evaluador. Genera un cuestionario de ${wizardData.questionCount} preguntas de selección múltiple sobre el tema: "${wizardData.topic || 'Tema general'}".\n\n`;

      if (wizardData.gradeLevel) {
        prompt += `- Nivel educativo del público objetivo: ${wizardData.gradeLevel}.\n`;
      }
      prompt += `- Estilo / Tipo de preguntas: ${typeLabel}.\n`;
      prompt += `- Número de opciones por pregunta: ${wizardData.optionsPerQuestion} opciones (con exactamente 1 sola respuesta correcta y ${wizardData.optionsPerQuestion - 1} distractores plausibles y educativos).\n`;

      if (wizardData.description) {
        prompt += `- Instrucciones adicionales del docente: ${wizardData.description}\n`;
      }

      if (wizardData.example) {
        prompt += `\nUsa como modelo de referencia este ejemplo proporcionado por el docente:\n"${wizardData.example}"\n`;
      }

      prompt += `\nREGLAS DE FORMATO ESTRICTAS:
1. Responde ÚNICAMENTE con un array JSON válido, sin bloques explicativos adicionales, sin texto antes ni después, sin markdown adicional que impida el parseo (devuelve solo el JSON limpio).
2. Cada objeto del array debe tener la estructura exacta:
[
  {
    "sentence": "Texto claro del enunciado de la pregunta",
    "options": [
      { "sentence": "Texto de la opción correcta", "correct": true },
      { "sentence": "Texto del distractor 1", "correct": false },
      { "sentence": "Texto del distractor 2", "correct": false },
      { "sentence": "Texto del distractor 3", "correct": false }
    ]
  }
]
3. Asegúrate de que las opciones estén bien formuladas y que no incluyan letras iniciales como "A)" o "B)" en el texto de la opción, ya que el sistema las asigna de forma dinámica.`;

      return prompt;
    });

    const copyGeneratedPrompt = async () => {
      let exitoso = false;
      const texto = generatedPrompt.value;

      // 1. Método moderno: Clipboard API (Web segura y navegadores modernos)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(texto);
          exitoso = true;
        } catch (e) {
          console.log("Clipboard API falló, intentando método de compatibilidad:", e);
        }
      }

      // 2. Método de fallback: TextArea con execCommand (Apps móviles WebView, Capacitor y navegadores sin HTTPS)
      if (!exitoso) {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        // Evitar zoom y saltos de scroll en dispositivos móviles
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.width = "2em";
        textarea.style.height = "2em";
        textarea.style.padding = "0";
        textarea.style.border = "none";
        textarea.style.outline = "none";
        textarea.style.boxShadow = "none";
        textarea.style.background = "transparent";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          exitoso = document.execCommand("copy");
        } catch (err) {
          console.error("Error al copiar texto:", err);
        } finally {
          document.body.removeChild(textarea);
        }
      }

      if (exitoso) {
        isPromptCopied.value = true;
        toastSuccessMessage.value = "Prompt copiado al portapapeles";
        isSuccessToastOpen.value = true;
        setTimeout(() => {
          isPromptCopied.value = false;
        }, 2500);
      } else {
        toastErrorMessage.value = "No se pudo copiar automáticamente. Puedes seleccionar el texto manualmente.";
        isErrorToastOpen.value = true;
      }
    };

    const goToPromptStep = () => {
      currentStep.value = 2;
    };

    const loadSampleJson = () => {
      textareaContent.value = placeholderText;
      procesarObjetos();
    };

    // Images handling
    const imageInput = ref(null);
    const selectedImages = ref([]);
    const imagePreviews = ref({});
    const selectedImageNames = computed(() =>
      selectedImages.value.map((file) => file.name)
    );
    const missingImages = computed(() =>
      findMissingImages(objetosValidos.value, selectedImages.value)
    );

    const pickImages = () => {
      if (imageInput.value) imageInput.value.click();
    };

    const clearImages = () => {
      revokeImagePreviews(imagePreviews.value);
      imagePreviews.value = {};
      selectedImages.value = [];
      if (imageInput.value) imageInput.value.value = "";
    };

    const onImagesSelected = (event) => {
      revokeImagePreviews(imagePreviews.value);
      selectedImages.value = Array.from(event.target.files || []);
      imagePreviews.value = buildImagePreviews(selectedImages.value);
    };

    onUnmounted(() => revokeImagePreviews(imagePreviews.value));

    // Modal state
    const isModalOpen = ref(false);
    const preguntaEnEdicion = ref(null);
    const indiceEnEdicion = ref(-1);

    // Función robusta para limpiar cualquier formato sucio de IA (escapes, markdown, comillas raras, HTML entities)
    const limpiarTextoJson = (raw) => {
      if (!raw) return "";
      let texto = raw.trim();

      // 1. Quitar bloques de código Markdown (```json ... ``` o ``` ... ```)
      texto = texto.replace(/^```[a-zA-Z]*\s*/i, "").replace(/\s*```$/i, "").trim();

      // Si el bloque de código estaba rodeado de texto explicativo, extraer lo que esté entre ``` y ```
      const markdownBlockMatch = texto.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (markdownBlockMatch && markdownBlockMatch[1]) {
        texto = markdownBlockMatch[1].trim();
      }

      // 2. Decodificar entidades HTML frecuentes de IAs o copy-paste (&quot;, &#x20;, &nbsp;, &amp;, etc.)
      texto = texto
        .replace(/&#x20;/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");

      // 3. Normalizar comillas tipográficas que introducen algunas IAs (“ ” „ « »)
      texto = texto
        .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");

      // 4. Limpiar barras invertidas de escape sueltas al final de línea o antes de espacios (\ al final de línea de chats markdown)
      texto = texto.replace(/\\\s*\n/g, "\n");
      texto = texto.replace(/\\\r\n/g, "\n");

      // 5. Encontrar el inicio del array '[' o del objeto '{'
      const firstBracket = texto.indexOf("[");
      const lastBracket = texto.lastIndexOf("]");
      const firstBrace = texto.indexOf("{");
      const lastBrace = texto.lastIndexOf("}");

      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        texto = texto.substring(firstBracket, lastBracket + 1);
      } else if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        // Si pegaron un solo objeto o lista de objetos
        texto = texto.substring(firstBrace, lastBrace + 1);
      }

      return texto.trim();
    };

    const procesarObjetos = () => {
      try {
        isErrorToastOpen.value = false;
        let contenido = textareaContent.value;

        if (!contenido || !contenido.trim()) {
          objetosValidos.value = [];
          return;
        }

        const contenidoLimpio = limpiarTextoJson(contenido);

        let objetosProcesados = [];
        let arrayObjetos = null;

        try {
          arrayObjetos = JSON.parse(contenidoLimpio);
        } catch (parseError) {
          // Si falló el parseo, intentar envolver entre corchetes si pegaron objetos sueltos separados por comas
          if (contenidoLimpio.startsWith("{") && contenidoLimpio.endsWith("}")) {
            try {
              arrayObjetos = JSON.parse(`[${contenidoLimpio}]`);
            } catch (_) {
              throw new Error("El JSON tiene errores de sintaxis: " + parseError.message);
            }
          } else {
            throw new Error("El formato del texto no es un JSON válido: " + parseError.message);
          }
        }

        // Si es un solo objeto individual, convertir a array
        if (!Array.isArray(arrayObjetos) && typeof arrayObjetos === "object" && arrayObjetos !== null) {
          arrayObjetos = [arrayObjetos];
        }

        if (!Array.isArray(arrayObjetos)) {
          throw new Error("El contenido JSON debe ser un Array [...] o una lista de preguntas.");
        }

        arrayObjetos.forEach((objeto, index) => {
          if (
            typeof objeto !== "object" ||
            !objeto ||
            typeof objeto.sentence !== "string" ||
            !Array.isArray(objeto.options)
          ) {
            throw new Error(`La pregunta #${index + 1} no tiene la estructura requerida (sentence y options).`);
          }

          if (objeto.options.length < 2) {
            throw new Error(`La pregunta #${index + 1} debe tener al menos 2 opciones.`);
          }

          objeto.options.forEach((opcion, optIndex) => {
            if (
              typeof opcion !== "object" ||
              !opcion ||
              typeof opcion.sentence !== "string" ||
              typeof opcion.correct !== "boolean"
            ) {
              throw new Error(
                `La opción ${optIndex + 1} de la pregunta #${index + 1} no es válida (requiere sentence y correct).`
              );
            }
          });

          objetosProcesados.push(objeto);
        });

        if (mezclarPreguntas.value) {
          objetosProcesados = shuffleArray(objetosProcesados);
        }
        objetosValidos.value = objetosProcesados;

        toastSuccessMessage.value = `${objetosValidos.value.length} pregunta(s) validadas correctamente`;
        isSuccessToastOpen.value = true;
      } catch (err) {
        toastErrorMessage.value = err.message || "Error al procesar el JSON";
        isErrorToastOpen.value = true;
        objetosValidos.value = [];
      }
    };

    const confirmarImportacion = async () => {
      if (missingImages.value.length === 0) return true;
      const alert = await alertController.create({
        header: "Imágenes sin archivo",
        message: `No se encontró archivo para: ${missingImages.value.join(", ")}. Esas preguntas se importarán sin imagen.`,
        buttons: [
          { text: "Cancelar", role: "cancel" },
          { text: "Importar de todos modos" },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      return role !== "cancel";
    };

    const importarPreguntas = async () => {
      isErrorToastOpen.value = false;
      if (objetosValidos.value.length === 0) {
        toastErrorMessage.value = "No hay preguntas válidas para importar.";
        isErrorToastOpen.value = true;
        return;
      }

      try {
        if (!(await confirmarImportacion())) return;
        isImporting.value = true;

        const { questions, uploaded } = await resolveQuestionPhotos(
          objetosValidos.value,
          selectedImages.value
        );

        await axios.post(
          "/questions/import/variable-option",
          {
            quizId: id || 0,
            points: points.value,
            shuffleOptions: mezclarOpciones.value,
            questions: questions.map((objeto) => ({
              sentence: objeto.sentence,
              photo: objeto.photo,
              options: (objeto.options || []).map((opcion) => ({
                sentence: opcion.sentence,
                correct: opcion.correct,
              })),
            })),
          },
          { headers: tokenHeader() }
        );

        toastSuccessMessage.value =
          uploaded > 0
            ? `¡Importación exitosa! ${uploaded} imagen(es) subida(s).`
            : "¡Preguntas importadas exitosamente!";
        isSuccessToastOpen.value = true;

        setTimeout(() => {
          router.push(`/cuestionario/${id}`);
        }, 1500);
      } catch (err) {
        console.error("Error al importar preguntas:", err);
        toastErrorMessage.value =
          "Error al importar preguntas: " + (err.response?.data?.message || err.message);
        isErrorToastOpen.value = true;
      } finally {
        isImporting.value = false;
      }
    };

    const abrirModalEdicion = (index) => {
      indiceEnEdicion.value = index;
      preguntaEnEdicion.value = JSON.parse(
        JSON.stringify(objetosValidos.value[index])
      );
      isModalOpen.value = true;
    };

    const cancelarEdicion = () => {
      isModalOpen.value = false;
    };

    const guardarCambios = () => {
      if (preguntaEnEdicion.value && indiceEnEdicion.value > -1) {
        objetosValidos.value[indiceEnEdicion.value] = preguntaEnEdicion.value;
      }
      isModalOpen.value = false;
    };

    const agregarOpcion = () => {
      if (preguntaEnEdicion.value) {
        preguntaEnEdicion.value.options.push({ sentence: "", correct: false });
      }
    };

    const quitarOpcion = (optIndex) => {
      if (preguntaEnEdicion.value) {
        preguntaEnEdicion.value.options.splice(optIndex, 1);
      }
    };

    const goBack = () => {
      if (id) {
        router.push(`/cuestionario/${id}`);
      } else {
        router.back();
      }
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();
    });

    return {
      id,
      currentStep,
      wizardData,
      questionTypes,
      generatedPrompt,
      isPromptCopied,
      isImporting,
      points,
      mezclarPreguntas,
      mezclarOpciones,
      textareaContent,
      placeholderText,
      objetosValidos,
      isSuccessToastOpen,
      isErrorToastOpen,
      toastErrorMessage,
      toastSuccessMessage,
      imageInput,
      selectedImages,
      selectedImageNames,
      missingImages,
      isModalOpen,
      preguntaEnEdicion,
      goBack,
      goToPromptStep,
      copyGeneratedPrompt,
      loadSampleJson,
      pickImages,
      clearImages,
      onImagesSelected,
      procesarObjetos,
      importarPreguntas,
      abrirModalEdicion,
      cancelarEdicion,
      guardarCambios,
      agregarOpcion,
      quitarOpcion,
      // Icons
      arrowBackOutline,
      arrowForwardOutline,
      sparklesOutline,
      checkmarkOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      copyOutline,
      pencil,
      trash,
      trashOutline,
      imagesOutline,
      downloadOutline,
      alertCircleOutline,
      closeOutline,
      addOutline,
    };
  },
};
</script>

<style scoped>
.qz-wizard-page {
  background-color: var(--qz-color-purple-bg, #efeefc);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}

.qz-wizard-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-wizard-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
}

/* 1. HERO HEADER */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 20px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 600px;
  margin: 0 auto;
  padding: 8px 18px 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

.qz-hero-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  padding: 6px 14px;
  border-radius: var(--qz-radius-full, 9999px);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.qz-hero-actions-placeholder {
  width: 40px;
}

.qz-hero-titles {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: left;
}

.qz-hero-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
}

.qz-hero-title {
  margin: 4px 0 0 0;
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
}

/* 2. STEPPER BAR */
.qz-stepper-container {
  max-width: 600px;
  margin: -10px auto 14px auto;
  padding: 0 18px;
  width: 100%;
  box-sizing: border-box;
}

.qz-stepper-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 8px 14px;
  border-radius: var(--qz-radius-xl, 22px);
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.08);
  border: 1px solid rgba(106, 90, 224, 0.08);
}

.qz-step-item {
  display: flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  outline: none;
  transition: opacity 0.2s ease;
}

.qz-step-num {
  width: 26px;
  height: 26px;
  border-radius: var(--qz-radius-full, 9999px);
  background: #f0effc;
  color: #858494;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.qz-step-title {
  font-size: 12px;
  font-weight: 700;
  color: #858494;
  white-space: nowrap;
}

.qz-step-item.is-active .qz-step-num {
  background: #6a5ae0;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(106, 90, 224, 0.35);
}

.qz-step-item.is-active .qz-step-title {
  color: #0c092a;
  font-weight: 800;
}

.qz-step-item.is-completed .qz-step-num {
  background: #e4f7eb;
  color: #12b76a;
}

.qz-step-line {
  flex: 1;
  height: 2px;
  background: #f0effc;
  margin: 0 6px;
  transition: background 0.2s ease;
}

.qz-step-line.is-active {
  background: #6a5ae0;
}

@media (max-width: 420px) {
  .qz-step-title {
    display: none;
  }
  .qz-step-item {
    gap: 0;
  }
}

/* 3. WIZARD BODY & CARDS */
.qz-wizard-body {
  flex: 1;
  padding: 0 18px 30px 18px;
}

.qz-card-box {
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: var(--qz-radius-xl, 22px);
  padding: 20px 22px;
  box-shadow: 0 6px 20px rgba(106, 90, 224, 0.08);
  border: 1px solid rgba(106, 90, 224, 0.06);
}

.qz-step-panel-header {
  margin-bottom: 20px;
}

.qz-panel-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 800;
  color: #0c092a;
  letter-spacing: -0.3px;
}

.qz-panel-desc {
  margin: 0;
  font-size: 13px;
  color: #636275;
  line-height: 1.45;
}

/* FORMS */
.qz-form-group {
  margin-bottom: 16px;
}

.qz-form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.qz-form-row .qz-form-group {
  flex: 1;
  margin-bottom: 0;
}

.qz-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #49465b;
  margin-bottom: 6px;
}

.qz-required {
  color: #e53935;
}

.qz-input,
.qz-select,
.qz-textarea {
  width: 100%;
  box-sizing: border-box;
  background: #fbfbff;
  border: 1.5px solid #e5e3f5;
  border-radius: var(--qz-radius-md, 12px);
  padding: 10px 14px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  color: #0c092a;
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.qz-input:focus,
.qz-select:focus,
.qz-textarea:focus {
  border-color: #6a5ae0;
  background: #ffffff;
}

.qz-textarea {
  resize: vertical;
}

.qz-code-font {
  font-family: "Courier New", Courier, monospace;
  font-size: 12px;
  line-height: 1.4;
}

/* CHIPS */
.qz-chips-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.qz-chip {
  background: #f0effc;
  border: 1px solid rgba(106, 90, 224, 0.15);
  color: #5548b8;
  padding: 7px 12px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.qz-chip.is-selected {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
  box-shadow: 0 2px 6px rgba(106, 90, 224, 0.3);
}

/* PROMPT CONTAINER */
.qz-prompt-container {
  background: #17132e;
  border-radius: var(--qz-radius-lg, 16px);
  padding: 14px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.qz-prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.qz-prompt-badge {
  font-size: 10px;
  font-weight: 800;
  color: #a39bf0;
  letter-spacing: 0.6px;
}

.qz-copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-copy-btn:active {
  transform: scale(0.95);
}

.qz-copy-btn.is-copied {
  background: #12b76a;
}

.qz-prompt-box {
  margin: 0;
  max-height: 240px;
  overflow-y: auto;
  font-family: "Courier New", Courier, monospace;
  font-size: 12px;
  color: #e3e0fc;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.45;
}

/* ALERTA DE INSTRUCCIONES */
.qz-instructions-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f4f3fd;
  border-radius: var(--qz-radius-md, 14px);
  padding: 12px 14px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  margin-bottom: 20px;
}

.qz-alert-icon-wrap {
  font-size: 20px;
  color: #6a5ae0;
  margin-top: 1px;
}

.qz-alert-text-wrap {
  font-size: 12px;
  color: #49465b;
  line-height: 1.45;
}

.qz-steps-list {
  margin: 6px 0 0 0;
  padding-left: 18px;
}

.qz-steps-list li {
  margin-bottom: 4px;
}

/* TOGGLES / CHECKBOXES */
.qz-options-toggles-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 14px;
  padding: 8px 12px;
  background: #fbfbff;
  border-radius: var(--qz-radius-md, 12px);
  border: 1px solid #e5e3f5;
}

.qz-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #49465b;
  cursor: pointer;
}

.qz-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #6a5ae0;
  cursor: pointer;
}

.qz-textarea-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.qz-mini-btn {
  background: transparent;
  border: none;
  color: #6a5ae0;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  outline: none;
}

.qz-mini-btn:hover {
  text-decoration: underline;
}

/* IMAGES PANEL */
.qz-images-panel {
  background: #fbfbff;
  border: 1.5px dashed #dcd9f2;
  border-radius: var(--qz-radius-md, 14px);
  padding: 12px 14px;
  margin-bottom: 16px;
}

.qz-images-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qz-sub-help {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: #858494;
}

.image-picker-hidden {
  display: none;
}

.qz-selected-files-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding: 6px 10px;
  background: #efeefc;
  border-radius: var(--qz-radius-sm, 8px);
  font-size: 11px;
  font-weight: 600;
  color: #5548b8;
}

.qz-danger-link {
  background: transparent;
  border: none;
  color: #e53935;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.qz-warning-badge-box {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: #b54708;
  font-size: 11px;
  font-weight: 600;
}

/* ACTION BUTTONS */
.qz-step-actions {
  display: flex;
  gap: 12px;
}

.qz-actions-between {
  justify-content: space-between;
}

.qz-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 12px 22px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  outline: none;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.28);
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-btn-primary:active {
  transform: scale(0.97);
}

.qz-btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.qz-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f0effc;
  color: #5548b8;
  border: 1px solid rgba(106, 90, 224, 0.15);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 11px 18px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease;
}

.qz-btn-secondary:active {
  transform: scale(0.97);
}

.qz-btn-process {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f0effc;
  border: 1.5px dashed #6a5ae0;
  color: #5548b8;
  padding: 12px;
  border-radius: var(--qz-radius-md, 12px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.qz-btn-process:hover {
  background: #e8e6fb;
}

/* PREVIEW SECTION */
.qz-preview-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #f0effc;
}

.qz-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.qz-preview-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0c092a;
}

.qz-preview-points {
  font-size: 11px;
  font-weight: 700;
  color: #6a5ae0;
  background: #efeefc;
  padding: 2px 8px;
  border-radius: var(--qz-radius-full, 9999px);
}

.qz-preview-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.qz-preview-item {
  background: #fbfbff;
  border-radius: var(--qz-radius-md, 14px);
  padding: 14px;
  border: 1px solid #e5e3f5;
}

.qz-preview-item-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.qz-preview-item-index {
  width: 24px;
  height: 24px;
  border-radius: var(--qz-radius-full, 9999px);
  background: #6a5ae0;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qz-preview-item-content {
  flex: 1;
}

.qz-preview-sentence {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #0c092a;
  line-height: 1.35;
}

.qz-photo-tag {
  display: inline-block;
  font-size: 11px;
  color: #6a5ae0;
  margin-top: 2px;
}

.qz-edit-icon-btn {
  background: #efeefc;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: var(--qz-radius-full, 9999px);
  color: #5548b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}

.qz-preview-options-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  padding-left: 34px;
}

.qz-preview-opt-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border-radius: var(--qz-radius-sm, 8px);
  padding: 6px 10px;
  border: 1px solid #e9e7f8;
  font-size: 12px;
  color: #49465b;
}

.qz-preview-opt-item.is-correct {
  border-color: #12b76a;
  background: #f0fbf5;
  color: #027a48;
  font-weight: 700;
}

.qz-opt-letter {
  font-weight: 800;
  color: #858494;
}

.qz-preview-opt-item.is-correct .qz-opt-letter {
  color: #027a48;
}

.qz-opt-check {
  margin-left: auto;
  font-size: 16px;
  color: #12b76a;
}

.qz-btn-import-now {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #12b76a;
  color: #ffffff;
  border: none;
  padding: 14px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  outline: none;
  box-shadow: 0 4px 14px rgba(18, 183, 106, 0.35);
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-btn-import-now:active {
  transform: scale(0.98);
}

.qz-btn-import-now:disabled {
  opacity: 0.6;
}

/* MODAL DE EDICIÓN */
.qz-modal-edit {
  --background: transparent;
}

.qz-modal-sheet {
  background: #ffffff;
  border-radius: var(--qz-radius-xl, 22px);
  padding: 20px;
  max-width: 500px;
  margin: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.qz-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.qz-modal-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
}

.qz-modal-close-btn {
  background: #efeefc;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: var(--qz-radius-full, 9999px);
  color: #5548b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  outline: none;
}

.qz-modal-options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.qz-modal-opt-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-correct-checkbox-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #12b76a;
  white-space: nowrap;
  cursor: pointer;
}

.qz-trash-opt-btn {
  background: #fef3f2;
  border: none;
  color: #f04438;
  width: 32px;
  height: 32px;
  border-radius: var(--qz-radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.qz-btn-add-opt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
}

.qz-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #f0effc;
}

/* ========================================================= */
/* DARK MODE STYLES                                          */
/* ========================================================= */

/* 1. Soporte para preferencia de sistema operativo (prefers-color-scheme: dark) */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-wizard-page,
  .qz-wizard-page {
    background-color: #0d0a1a !important;
  }
  body:not(.light) .qz-wizard-content,
  .qz-wizard-content {
    --background: #0d0a1a !important;
  }
  body:not(.light) .qz-stepper-bar,
  .qz-stepper-bar {
    background: #17132e !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-step-num,
  .qz-step-num {
    background: #252044 !important;
    color: #8c88ab !important;
  }
  body:not(.light) .qz-step-title,
  .qz-step-title {
    color: #8c88ab !important;
  }
  body:not(.light) .qz-step-item.is-active .qz-step-title,
  .qz-step-item.is-active .qz-step-title {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-step-line,
  .qz-step-line {
    background: #252044 !important;
  }
  body:not(.light) .qz-card-box,
  .qz-card-box {
    background: #17132e !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-panel-title,
  .qz-panel-title {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-panel-desc,
  .qz-panel-desc {
    color: #9e9bb8 !important;
  }
  body:not(.light) .qz-label,
  .qz-label {
    color: #c7c4e2 !important;
  }
  body:not(.light) .qz-input,
  body:not(.light) .qz-select,
  body:not(.light) .qz-textarea,
  .qz-input,
  .qz-select,
  .qz-textarea {
    background: #201b3e !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-chip,
  .qz-chip {
    background: #241e46 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    color: #b7aefa !important;
  }
  body:not(.light) .qz-instructions-alert,
  .qz-instructions-alert {
    background: #201b3e !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-alert-text-wrap,
  .qz-alert-text-wrap {
    color: #c7c4e2 !important;
  }
  body:not(.light) .qz-options-toggles-row,
  .qz-options-toggles-row {
    background: #201b3e !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-checkbox-label,
  .qz-checkbox-label {
    color: #c7c4e2 !important;
  }
  body:not(.light) .qz-images-panel,
  .qz-images-panel {
    background: #201b3e !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
  body:not(.light) .qz-btn-process,
  .qz-btn-process {
    background: #241e46 !important;
    border-color: #6a5ae0 !important;
    color: #b7aefa !important;
  }
  body:not(.light) .qz-preview-section,
  .qz-preview-section {
    border-top-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-preview-title,
  .qz-preview-title {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-preview-item,
  .qz-preview-item {
    background: #201b3e !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-preview-sentence,
  .qz-preview-sentence {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-preview-opt-item,
  .qz-preview-opt-item {
    background: #27214b !important;
    border-color: rgba(255, 255, 255, 0.06) !important;
    color: #d1ceed !important;
  }
  body:not(.light) .qz-preview-opt-item.is-correct,
  .qz-preview-opt-item.is-correct {
    background: #113425 !important;
    border-color: #12b76a !important;
    color: #56df98 !important;
  }
  body:not(.light) .qz-edit-icon-btn,
  .qz-edit-icon-btn {
    background: #2b2453 !important;
    color: #b7aefa !important;
  }
  body:not(.light) .qz-modal-sheet,
  .qz-modal-sheet {
    background: #1a1633 !important;
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-modal-title,
  .qz-modal-title {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-btn-secondary,
  .qz-btn-secondary {
    background: #252044 !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    color: #b7aefa !important;
  }
  body:not(.light) .qz-selected-files-bar,
  .qz-selected-files-bar {
    background: #252044 !important;
    color: #b7aefa !important;
  }
  body:not(.light) .qz-sub-help,
  .qz-sub-help {
    color: #9e9bb8 !important;
  }
  body:not(.light) .qz-mini-btn,
  .qz-mini-btn {
    color: #a39bf0 !important;
  }
  body:not(.light) .qz-preview-points,
  .qz-preview-points {
    background: #252044 !important;
    color: #b7aefa !important;
  }
  body:not(.light) .qz-photo-tag,
  .qz-photo-tag {
    color: #a39bf0 !important;
  }
  body:not(.light) .qz-opt-letter,
  .qz-opt-letter {
    color: #9e9bb8 !important;
  }
  body:not(.light) .qz-trash-opt-btn,
  .qz-trash-opt-btn {
    background: #3e1b1b !important;
    color: #ff6b6b !important;
  }
  body:not(.light) .qz-btn-add-opt,
  .qz-btn-add-opt {
    color: #a39bf0 !important;
  }
}

/* 2. Soporte para clases explícitas (body.dark, html.dark, .dark, [data-theme="dark"]) */
:global(body.dark) .qz-wizard-page,
:global(html.dark) .qz-wizard-page,
:global(.dark) .qz-wizard-page,
:global(:root[data-theme="dark"]) .qz-wizard-page {
  background-color: #0d0a1a !important;
}

:global(body.dark) .qz-wizard-content,
:global(html.dark) .qz-wizard-content,
:global(.dark) .qz-wizard-content,
:global(:root[data-theme="dark"]) .qz-wizard-content {
  --background: #0d0a1a !important;
}

:global(body.dark) .qz-stepper-bar,
:global(html.dark) .qz-stepper-bar,
:global(.dark) .qz-stepper-bar,
:global(:root[data-theme="dark"]) .qz-stepper-bar {
  background: #17132e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-step-num,
:global(html.dark) .qz-step-num,
:global(.dark) .qz-step-num,
:global(:root[data-theme="dark"]) .qz-step-num {
  background: #252044 !important;
  color: #8c88ab !important;
}

:global(body.dark) .qz-step-title,
:global(html.dark) .qz-step-title,
:global(.dark) .qz-step-title,
:global(:root[data-theme="dark"]) .qz-step-title {
  color: #8c88ab !important;
}

:global(body.dark) .qz-step-item.is-active .qz-step-title,
:global(html.dark) .qz-step-item.is-active .qz-step-title,
:global(.dark) .qz-step-item.is-active .qz-step-title,
:global(:root[data-theme="dark"]) .qz-step-item.is-active .qz-step-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-step-line,
:global(html.dark) .qz-step-line,
:global(.dark) .qz-step-line,
:global(:root[data-theme="dark"]) .qz-step-line {
  background: #252044 !important;
}

:global(body.dark) .qz-card-box,
:global(html.dark) .qz-card-box,
:global(.dark) .qz-card-box,
:global(:root[data-theme="dark"]) .qz-card-box {
  background: #17132e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-panel-title,
:global(html.dark) .qz-panel-title,
:global(.dark) .qz-panel-title,
:global(:root[data-theme="dark"]) .qz-panel-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-panel-desc,
:global(html.dark) .qz-panel-desc,
:global(.dark) .qz-panel-desc,
:global(:root[data-theme="dark"]) .qz-panel-desc {
  color: #9e9bb8 !important;
}

:global(body.dark) .qz-label,
:global(html.dark) .qz-label,
:global(.dark) .qz-label,
:global(:root[data-theme="dark"]) .qz-label {
  color: #c7c4e2 !important;
}

:global(body.dark) .qz-input,
:global(body.dark) .qz-select,
:global(body.dark) .qz-textarea,
:global(html.dark) .qz-input,
:global(html.dark) .qz-select,
:global(html.dark) .qz-textarea,
:global(.dark) .qz-input,
:global(.dark) .qz-select,
:global(.dark) .qz-textarea,
:global(:root[data-theme="dark"]) .qz-input,
:global(:root[data-theme="dark"]) .qz-select,
:global(:root[data-theme="dark"]) .qz-textarea {
  background: #201b3e !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #f7f7fd !important;
}

:global(body.dark) .qz-input:focus,
:global(body.dark) .qz-select:focus,
:global(body.dark) .qz-textarea:focus,
:global(html.dark) .qz-input:focus,
:global(html.dark) .qz-select:focus,
:global(html.dark) .qz-textarea:focus,
:global(.dark) .qz-input:focus,
:global(.dark) .qz-select:focus,
:global(.dark) .qz-textarea:focus,
:global(:root[data-theme="dark"]) .qz-input:focus,
:global(:root[data-theme="dark"]) .qz-select:focus,
:global(:root[data-theme="dark"]) .qz-textarea:focus {
  border-color: #7c6ef2 !important;
  background: #27214b !important;
}

:global(body.dark) .qz-chip,
:global(html.dark) .qz-chip,
:global(.dark) .qz-chip,
:global(:root[data-theme="dark"]) .qz-chip {
  background: #241e46 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #b7aefa !important;
}

:global(body.dark) .qz-chip.is-selected,
:global(html.dark) .qz-chip.is-selected,
:global(.dark) .qz-chip.is-selected,
:global(:root[data-theme="dark"]) .qz-chip.is-selected {
  background: #6a5ae0 !important;
  color: #ffffff !important;
}

:global(body.dark) .qz-instructions-alert,
:global(html.dark) .qz-instructions-alert,
:global(.dark) .qz-instructions-alert,
:global(:root[data-theme="dark"]) .qz-instructions-alert {
  background: #201b3e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-alert-text-wrap,
:global(html.dark) .qz-alert-text-wrap,
:global(.dark) .qz-alert-text-wrap,
:global(:root[data-theme="dark"]) .qz-alert-text-wrap {
  color: #c7c4e2 !important;
}

:global(body.dark) .qz-options-toggles-row,
:global(html.dark) .qz-options-toggles-row,
:global(.dark) .qz-options-toggles-row,
:global(:root[data-theme="dark"]) .qz-options-toggles-row {
  background: #201b3e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-checkbox-label,
:global(html.dark) .qz-checkbox-label,
:global(.dark) .qz-checkbox-label,
:global(:root[data-theme="dark"]) .qz-checkbox-label {
  color: #c7c4e2 !important;
}

:global(body.dark) .qz-images-panel,
:global(html.dark) .qz-images-panel,
:global(.dark) .qz-images-panel,
:global(:root[data-theme="dark"]) .qz-images-panel {
  background: #201b3e !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

:global(body.dark) .qz-btn-process,
:global(html.dark) .qz-btn-process,
:global(.dark) .qz-btn-process,
:global(:root[data-theme="dark"]) .qz-btn-process {
  background: #241e46 !important;
  border-color: #6a5ae0 !important;
  color: #b7aefa !important;
}

:global(body.dark) .qz-btn-process:hover,
:global(html.dark) .qz-btn-process:hover,
:global(.dark) .qz-btn-process:hover,
:global(:root[data-theme="dark"]) .qz-btn-process:hover {
  background: #2c2555 !important;
}

:global(body.dark) .qz-preview-section,
:global(html.dark) .qz-preview-section,
:global(.dark) .qz-preview-section,
:global(:root[data-theme="dark"]) .qz-preview-section {
  border-top-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-preview-title,
:global(html.dark) .qz-preview-title,
:global(.dark) .qz-preview-title,
:global(:root[data-theme="dark"]) .qz-preview-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-preview-item,
:global(html.dark) .qz-preview-item,
:global(.dark) .qz-preview-item,
:global(:root[data-theme="dark"]) .qz-preview-item {
  background: #201b3e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-preview-sentence,
:global(html.dark) .qz-preview-sentence,
:global(.dark) .qz-preview-sentence,
:global(:root[data-theme="dark"]) .qz-preview-sentence {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-preview-opt-item,
:global(html.dark) .qz-preview-opt-item,
:global(.dark) .qz-preview-opt-item,
:global(:root[data-theme="dark"]) .qz-preview-opt-item {
  background: #27214b !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
  color: #d1ceed !important;
}

:global(body.dark) .qz-preview-opt-item.is-correct,
:global(html.dark) .qz-preview-opt-item.is-correct,
:global(.dark) .qz-preview-opt-item.is-correct,
:global(:root[data-theme="dark"]) .qz-preview-opt-item.is-correct {
  background: #113425 !important;
  border-color: #12b76a !important;
  color: #56df98 !important;
}

:global(body.dark) .qz-edit-icon-btn,
:global(html.dark) .qz-edit-icon-btn,
:global(.dark) .qz-edit-icon-btn,
:global(:root[data-theme="dark"]) .qz-edit-icon-btn {
  background: #2b2453 !important;
  color: #b7aefa !important;
}

:global(body.dark) .qz-modal-sheet,
:global(html.dark) .qz-modal-sheet,
:global(.dark) .qz-modal-sheet,
:global(:root[data-theme="dark"]) .qz-modal-sheet {
  background: #1a1633 !important;
  color: #f7f7fd !important;
}

:global(body.dark) .qz-modal-title,
:global(html.dark) .qz-modal-title,
:global(.dark) .qz-modal-title,
:global(:root[data-theme="dark"]) .qz-modal-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-modal-close-btn,
:global(html.dark) .qz-modal-close-btn,
:global(.dark) .qz-modal-close-btn,
:global(:root[data-theme="dark"]) .qz-modal-close-btn {
  background: #252044 !important;
  color: #b7aefa !important;
}

:global(body.dark) .qz-btn-secondary,
:global(html.dark) .qz-btn-secondary,
:global(.dark) .qz-btn-secondary,
:global(:root[data-theme="dark"]) .qz-btn-secondary {
  background: #252044 !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: #b7aefa !important;
}

:global(body.dark) .qz-selected-files-bar,
:global(html.dark) .qz-selected-files-bar,
:global(.dark) .qz-selected-files-bar,
:global(:root[data-theme="dark"]) .qz-selected-files-bar {
  background: #252044 !important;
  color: #b7aefa !important;
}

:global(body.dark) .qz-sub-help,
:global(html.dark) .qz-sub-help,
:global(.dark) .qz-sub-help,
:global(:root[data-theme="dark"]) .qz-sub-help {
  color: #9e9bb8 !important;
}

:global(body.dark) .qz-mini-btn,
:global(html.dark) .qz-mini-btn,
:global(.dark) .qz-mini-btn,
:global(:root[data-theme="dark"]) .qz-mini-btn {
  color: #a39bf0 !important;
}

:global(body.dark) .qz-preview-points,
:global(html.dark) .qz-preview-points,
:global(.dark) .qz-preview-points,
:global(:root[data-theme="dark"]) .qz-preview-points {
  background: #252044 !important;
  color: #b7aefa !important;
}

:global(body.dark) .qz-photo-tag,
:global(html.dark) .qz-photo-tag,
:global(.dark) .qz-photo-tag,
:global(:root[data-theme="dark"]) .qz-photo-tag {
  color: #a39bf0 !important;
}

:global(body.dark) .qz-opt-letter,
:global(html.dark) .qz-opt-letter,
:global(.dark) .qz-opt-letter,
:global(:root[data-theme="dark"]) .qz-opt-letter {
  color: #9e9bb8 !important;
}

:global(body.dark) .qz-trash-opt-btn,
:global(html.dark) .qz-trash-opt-btn,
:global(.dark) .qz-trash-opt-btn,
:global(:root[data-theme="dark"]) .qz-trash-opt-btn {
  background: #3e1b1b !important;
  color: #ff6b6b !important;
}

:global(body.dark) .qz-btn-add-opt,
:global(html.dark) .qz-btn-add-opt,
:global(.dark) .qz-btn-add-opt,
:global(:root[data-theme="dark"]) .qz-btn-add-opt {
  color: #a39bf0 !important;
}

:global(body.dark) .qz-modal-footer,
:global(html.dark) .qz-modal-footer,
:global(.dark) .qz-modal-footer,
:global(:root[data-theme="dark"]) .qz-modal-footer {
  border-top-color: rgba(255, 255, 255, 0.08) !important;
}
</style>
