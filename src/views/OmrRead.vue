<template>
  <ion-page class="ion-page qz-omr-page">
    <ion-content :fullscreen="true" class="qz-omr-content">
      <div class="qz-omr-wrapper">
        <!-- 1. CABECERA HERO QUEEZY PÚRPURA -->
        <div class="qz-hero-header">
          <div class="qz-hero-top">
            <!-- Botón Volver -->
            <button
              type="button"
              class="qz-back-btn"
              title="Regresar a Resultados"
              @click="goBack"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </button>

            <!-- Píldora Central de Modo -->
            <div class="qz-hero-status-pill">
              <ion-icon :icon="cameraOutline"></ion-icon>
              <span>Lector Óptico OMR</span>
            </div>

            <!-- Acciones Rápidas Superior -->
            <div class="qz-hero-actions">
              <button
                type="button"
                class="qz-action-btn qz-action-btn--save"
                :title="isSubmitting ? 'Guardando...' : 'Guardar Calificaciones'"
                :disabled="!student.id || isSubmitting || sectionValidity.includes(false)"
                @click="submitAnswers"
              >
                <ion-spinner v-if="isSubmitting" name="crescent"></ion-spinner>
                <ion-icon v-else :icon="saveOutline"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Títulos y Metadatos del Hero -->
          <div class="qz-hero-titles">
            <div class="qz-hero-badge-row">
              <span class="qz-hero-tag">HOJA DE RESPUESTAS OMR</span>
              <span v-if="cuestionario.quizType === 'group'" class="qz-hero-type-pill">
                <ion-icon :icon="peopleOutline"></ion-icon> Grupal
              </span>
              <span v-else class="qz-hero-type-pill">
                <ion-icon :icon="personOutline"></ion-icon> Individual
              </span>
            </div>

            <h1 class="qz-hero-title">
              {{ cuestionario.title || "Escaneo de Cuestionario" }}
            </h1>
            <p class="qz-hero-subtitle">
              Escanea la hoja óptica con la cámara o ingresa el código del estudiante para procesar y calificar automáticamente.
            </p>

            <!-- Barra de Resumen / Metadatos -->
            <div class="qz-hero-meta-bar">
              <div class="qz-meta-chip">
                <ion-icon :icon="sparklesOutline"></ion-icon>
                <span>{{ cuestionario.questions?.length || 0 }} Preguntas</span>
              </div>
              <div v-if="numberOfSections > 1" class="qz-meta-chip">
                <ion-icon :icon="checkmarkDoneOutline"></ion-icon>
                <span>{{ numberOfSections }} Secciones (20 preg/hoja)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. CUERPO PRINCIPAL (Cuando no se está escaneando) -->
        <div v-if="!isScanning" class="qz-main-body">
          <div class="qz-container">

            <!-- BARRA DE SECCIONES (SI TIENE MÁS DE 20 PREGUNTAS) -->
            <div v-if="numberOfSections > 1" class="qz-card qz-sections-card">
              <div class="qz-card-header">
                <div class="qz-card-header-left">
                  <span class="qz-card-icon-pill">📑</span>
                  <div>
                    <h3 class="qz-card-title">Secciones de la Hoja</h3>
                    <p class="qz-card-sub">Selecciona la sección para escanear o revisar respuestas</p>
                  </div>
                </div>
              </div>

              <div class="qz-sections-nav">
                <button
                  v-for="section in numberOfSections"
                  :key="section"
                  type="button"
                  class="qz-section-pill"
                  :class="{
                    'is-active': currentSection === section,
                    'is-invalid': !sectionValidity[section - 1],
                    'is-disabled': !isSectionEnabled(section),
                    'is-scanned': !!sectionStudentCodes[section - 1] && sectionValidity[section - 1]
                  }"
                  :disabled="!isSectionEnabled(section)"
                  @click="changeSection(section)"
                >
                  <span class="qz-sec-num">{{ section }}</span>
                  <span class="qz-sec-label">
                    Preguntas {{ (section - 1) * 20 + 1 }} - {{ Math.min(section * 20, cuestionario.questions.length) }}
                  </span>
                  <ion-icon
                    v-if="!sectionValidity[section - 1]"
                    :icon="alertCircleOutline"
                    class="qz-sec-icon qz-sec-icon--error"
                  ></ion-icon>
                  <ion-icon
                    v-else-if="sectionStudentCodes[section - 1]"
                    :icon="checkmarkCircle"
                    class="qz-sec-icon qz-sec-icon--success"
                  ></ion-icon>
                </button>
              </div>
            </div>

            <!-- PANEL PRINCIPAL DE ACCIONES (Escanear + Guardar) -->
            <div class="qz-card qz-actions-panel-card">
              <div class="qz-actions-grid">
                <!-- Botón de Escanear -->
                <button
                  type="button"
                  class="qz-action-big-btn qz-btn--scan"
                  :disabled="isSubmitting"
                  @click="startScan"
                >
                  <div class="qz-btn-icon-wrap">
                    <ion-icon :icon="cameraOutline"></ion-icon>
                  </div>
                  <div class="qz-btn-text-wrap">
                    <span class="qz-btn-main-text">Escanear con Cámara</span>
                    <span class="qz-btn-sub-text">
                      {{ numberOfSections > 1 ? `Sección ${currentSection} (Preg. ${(currentSection - 1) * 20 + 1} a ${Math.min(currentSection * 20, cuestionario.questions.length)})` : 'Hoja completa de respuestas' }}
                    </span>
                  </div>
                </button>

                <!-- Botón de Guardar -->
                <button
                  type="button"
                  class="qz-action-big-btn qz-btn--save"
                  :class="{ 'is-disabled': !student.id || isSubmitting || sectionValidity.includes(false) }"
                  :disabled="!student.id || isSubmitting || sectionValidity.includes(false)"
                  @click="submitAnswers"
                >
                  <div class="qz-btn-icon-wrap">
                    <ion-spinner v-if="isSubmitting" name="crescent"></ion-spinner>
                    <ion-icon v-else :icon="saveOutline"></ion-icon>
                  </div>
                  <div class="qz-btn-text-wrap">
                    <span class="qz-btn-main-text">{{ isSubmitting ? 'Guardando Respuestas...' : 'Guardar Calificaciones' }}</span>
                    <span class="qz-btn-sub-text">
                      {{ !student.id ? 'Identifica al estudiante primero' : (sectionValidity.includes(false) ? 'Hay códigos que no coinciden' : 'Registrar respuestas en el sistema') }}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <!-- ALERTA DE SECCIÓN NO COINCIDENTE -->
            <div
              v-if="invalidSectionDetails[currentSection]"
              class="qz-card qz-alert-card qz-alert--danger"
            >
              <div class="qz-alert-icon">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
              </div>
              <div class="qz-alert-content">
                <h4 class="qz-alert-title">¡Código de sección no coincide!</h4>
                <p class="qz-alert-desc">
                  El código escaneado en esta sección es <strong>{{ invalidSectionDetails[currentSection].code }}</strong>, pero la primera sección pertenece al estudiante con código <strong>{{ sectionStudentCodes[0] }}</strong>.
                </p>
                <div v-if="invalidSectionDetails[currentSection].name" class="qz-alert-detected">
                  Estudiante detectado: <strong>{{ invalidSectionDetails[currentSection].name }} {{ invalidSectionDetails[currentSection].lastName }}</strong>
                </div>
                <div class="qz-alert-actions">
                  <button type="button" class="qz-alert-btn" @click="startScan">
                    <ion-icon :icon="cameraOutline"></ion-icon> Volver a escanear sección
                  </button>
                </div>
              </div>
            </div>

            <!-- TARJETA DE ESTUDIANTE -->
            <div class="qz-card qz-student-card">
              <div class="qz-card-header">
                <div class="qz-card-header-left">
                  <span class="qz-card-icon-pill">👤</span>
                  <div>
                    <h3 class="qz-card-title">Estudiante Identificado</h3>
                    <p class="qz-card-sub">Verifica la identidad del estudiante antes de guardar</p>
                  </div>
                </div>
              </div>

              <!-- Input de Búsqueda Manual / Código -->
              <div class="qz-student-search-box">
                <div class="qz-input-group">
                  <span class="qz-input-icon">
                    <ion-icon :icon="personOutline"></ion-icon>
                  </span>
                  <input
                    type="text"
                    v-model="studentCodeInput"
                    placeholder="Código de estudiante..."
                    class="qz-code-input"
                    :disabled="isSubmitting"
                    @keyup.enter="findStudentByCode(studentCodeInput)"
                  />
                  <button
                    type="button"
                    class="qz-search-code-btn"
                    title="Buscar o sincronizar código"
                    :disabled="isSubmitting || !studentCodeInput"
                    @click="findStudentByCode(studentCodeInput)"
                  >
                    <ion-icon :icon="syncOutline"></ion-icon>
                    <span>Buscar</span>
                  </button>
                </div>
              </div>

              <!-- Detalle del Estudiante Encontrado -->
              <div v-if="student.id" class="qz-student-profile-wrap">
                <div class="qz-student-main-info">
                  <!-- Avatar con Iniciales -->
                  <div class="qz-student-avatar">
                    {{ getInitials(student) }}
                  </div>

                  <div class="qz-student-details">
                    <h4 class="qz-student-fullname">
                      {{ student.name }} {{ student.lastName }}
                    </h4>
                    <div class="qz-student-badges">
                      <span class="qz-code-badge">
                        Cód. {{ student.code }}
                      </span>
                      <span
                        v-if="cuestionario.quizType === 'group' && activeGroup"
                        class="qz-group-badge"
                      >
                        <ion-icon :icon="peopleOutline"></ion-icon>
                        {{ activeGroup.name }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Resumen de Respuestas -->
                <div class="qz-score-summary-grid">
                  <div class="qz-summary-chip qz-chip--success">
                    <ion-icon :icon="checkmarkCircle"></ion-icon>
                    <div class="qz-chip-data">
                      <span class="qz-chip-val">{{ totalCorrectAnswers }}</span>
                      <span class="qz-chip-lbl">Correctas</span>
                    </div>
                  </div>

                  <div class="qz-summary-chip qz-chip--danger">
                    <ion-icon :icon="closeCircle"></ion-icon>
                    <div class="qz-chip-data">
                      <span class="qz-chip-val">{{ totalIncorrectAnswers }}</span>
                      <span class="qz-chip-lbl">Incorrectas</span>
                    </div>
                  </div>

                  <div class="qz-summary-chip qz-chip--neutral">
                    <ion-icon :icon="sparklesOutline"></ion-icon>
                    <div class="qz-chip-data">
                      <span class="qz-chip-val">{{ answersToSend.length - totalCorrectAnswers - totalIncorrectAnswers }}</span>
                      <span class="qz-chip-lbl">En blanco</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Estado Vacío cuando aún no hay estudiante -->
              <div v-else-if="!invalidSectionDetails[currentSection]" class="qz-student-empty-state">
                <ion-icon :icon="personOutline" class="qz-empty-icon"></ion-icon>
                <p>Ingresa el código del estudiante arriba o escanea la hoja para identificarlo automáticamente.</p>
              </div>
            </div>

            <!-- VISTA PREVIA DE LA IMAGEN ESCANEADA -->
            <div
              v-if="sectionScanImageUrls[currentSection - 1]"
              class="qz-card qz-preview-card"
            >
              <div class="qz-card-header">
                <div class="qz-card-header-left">
                  <span class="qz-card-icon-pill">📷</span>
                  <div>
                    <h3 class="qz-card-title">
                      Hoja Escaneada
                      <template v-if="numberOfSections > 1">· Sección {{ currentSection }}</template>
                    </h3>
                    <p class="qz-card-sub">Captura procesada por el reconocedor óptico</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="qz-mini-btn"
                  title="Volver a escanear"
                  @click="startScan"
                >
                  <ion-icon :icon="cameraOutline"></ion-icon>
                  <span>Reescanear</span>
                </button>
              </div>

              <div class="qz-preview-body">
                <img
                  :src="sectionScanImageUrls[currentSection - 1]"
                  alt="Resultado del escaneo OMR"
                  class="qz-preview-img"
                />
              </div>
            </div>

            <!-- REVISIÓN Y EDICIÓN MANUAL DE PREGUNTAS -->
            <div class="qz-card qz-answers-review-card">
              <div class="qz-card-header">
                <div class="qz-card-header-left">
                  <span class="qz-card-icon-pill">✏️</span>
                  <div>
                    <h3 class="qz-card-title">
                      Revisión de Respuestas
                      <span class="qz-badge-count">
                        {{ questionsForCurrentSection.length }}
                      </span>
                    </h3>
                    <p class="qz-card-sub">
                      Toca cualquier burbuja para marcar, cambiar o desmarcar la respuesta escaneada.
                    </p>
                  </div>
                </div>
              </div>

              <div class="qz-questions-list">
                <div
                  v-for="(answer, index) in questionsForCurrentSection"
                  :key="answer.id"
                  class="qz-question-card"
                  :class="{
                    'is-correct': answer.isCorrect,
                    'is-incorrect': !answer.isCorrect && answer.selectedOption !== null,
                    'is-blank': answer.selectedOption === null
                  }"
                >
                  <!-- Cabecera de la pregunta -->
                  <div class="qz-q-top">
                    <div class="qz-q-left">
                      <span class="qz-q-index-pill">
                        #{{ (currentSection - 1) * 20 + index + 1 }}
                      </span>
                      <span class="qz-q-title">
                        {{ answer.questionTitle || `Pregunta ${(currentSection - 1) * 20 + index + 1}` }}
                      </span>
                    </div>

                    <!-- Estado Pill -->
                    <div class="qz-q-status">
                      <span v-if="answer.isCorrect" class="qz-status-tag qz-tag--success">
                        <ion-icon :icon="checkmarkCircle"></ion-icon> Correcta
                      </span>
                      <span v-else-if="answer.selectedOption !== null" class="qz-status-tag qz-tag--danger">
                        <ion-icon :icon="closeCircle"></ion-icon> Incorrecta
                      </span>
                      <span v-else class="qz-status-tag qz-tag--blank">
                        En blanco
                      </span>
                    </div>
                  </div>

                  <!-- Fila de Burbujas Interactivas OMR (A, B, C, D...) -->
                  <div class="qz-q-bubbles-row">
                    <div class="qz-bubbles-group">
                      <button
                        v-for="option in answer.options"
                        :key="option.id"
                        type="button"
                        class="qz-bubble-opt"
                        :class="{
                          'is-selected': answer.selectedOption === option.id,
                          'is-correct': answer.selectedOption === option.id && answer.isCorrect,
                          'is-incorrect': answer.selectedOption === option.id && !answer.isCorrect,
                          'is-key': option.correct
                        }"
                        :title="option.correct ? `Opción ${option.identifier} (Respuesta Clave)` : `Opción ${option.identifier}`"
                        @click="selectOption(answer, option.id)"
                      >
                        {{ option.identifier }}
                      </button>
                    </div>

                    <!-- Botón En Blanco y Clave Correcta -->
                    <div class="qz-bubble-actions">
                      <button
                        v-if="answer.selectedOption !== null"
                        type="button"
                        class="qz-clear-opt-btn"
                        title="Desmarcar y dejar en blanco"
                        @click="clearAnswer(answer)"
                      >
                        <ion-icon :icon="closeOutline"></ion-icon>
                        <span>Blanco</span>
                      </button>

                      <div class="qz-key-badge" title="Respuesta clave del cuestionario">
                        <span class="qz-key-lbl">Clave:</span>
                        <span class="qz-key-val">{{ answer.correctOptionIdentifier }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- 3. OVERLAY DE ESCÁNER DE CÁMARA (Cuando isScanning === true) -->
        <div v-show="isScanning" class="qz-scanner-overlay">
          <div class="qz-scanner-header">
            <button
              type="button"
              class="qz-scanner-cancel-btn"
              @click="onScanCancelled"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
              <span>Volver a Revisión</span>
            </button>
            <div class="qz-scanner-instruction">
              Alinea las esquinas de la hoja en el marco
            </div>
            <div class="qz-scanner-section-tag">
              Sección {{ currentSection }}
            </div>
          </div>

          <div class="qz-scanner-viewport">
            <omr-scanner
              ref="scannerComponent"
              :answer-keys="questionsForCurrentSection"
              @scan-complete="onScanComplete"
              @scan-cancelled="onScanCancelled"
            ></omr-scanner>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  alertController,
  onIonViewDidEnter,
} from "@ionic/vue";
import { ref, reactive, nextTick, computed } from "vue";
import OmrScanner from "@/components/OmrScanner.vue";
import { tokenHeader } from "../globalService";
import { useRoute, useRouter } from "vue-router";
import {
  arrowBackOutline,
  saveOutline,
  syncOutline,
  cameraOutline,
  checkmarkCircle,
  closeCircle,
  alertCircleOutline,
  personOutline,
  peopleOutline,
  sparklesOutline,
  checkmarkDoneOutline,
  closeOutline,
} from "ionicons/icons";
import axios from "axios";

export default {
  name: "OmrRead",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSpinner,
    OmrScanner,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const quizId = route.params.id;
    const cuestionario = ref({ questions: [] });
    const isScanning = ref(false);
    const scannerComponent = ref(null);
    const backUrl = ref("/inicio");
    const answersToSend = ref([]);
    const student = ref({});
    const studentCodeInput = ref("");
    const activeGroup = ref(null);
    const isSubmitting = ref(false);
    const invalidSectionDetails = ref({});

    // State for sections
    const numberOfSections = ref(1);
    const currentSection = ref(1);
    const sectionScanImageUrls = ref([]);
    const sectionCleanImages = ref([]);
    const sectionBubbleCoords = ref([]);
    const sectionStudentCodes = ref([]);
    const sectionValidity = ref([]);

    const saveButtonColor = computed(() => {
      return sectionValidity.value.includes(false) ? "medium" : "secondary";
    });

    const questionsForCurrentSection = computed(() => {
      if (answersToSend.value.length === 0) return [];
      const start = (currentSection.value - 1) * 20;
      const end = currentSection.value * 20;
      return answersToSend.value.slice(start, end);
    });

    const totalCorrectAnswers = computed(() => {
      return answersToSend.value.filter(
        (answer) =>
          answer.selectedOption !== null &&
          answer.selectedOption === answer.correctOptionId,
      ).length;
    });

    const totalIncorrectAnswers = computed(() => {
      return answersToSend.value.filter(
        (answer) =>
          answer.selectedOption !== null &&
          answer.selectedOption !== answer.correctOptionId,
      ).length;
    });

    // Helper: go back
    const goBack = () => {
      if (backUrl.value) {
        router.push(backUrl.value);
      } else {
        router.back();
      }
    };

    // Helper: get initials
    const getInitials = (user) => {
      if (!user) return "?";
      const first = user.name ? user.name.trim().charAt(0) : "";
      const last = user.lastName ? user.lastName.trim().charAt(0) : "";
      return (first + last).toUpperCase() || "?";
    };

    // Guardar imagen del escaneo en uploads/test/:quizId y registrar la entidad QuizScan
    const saveScanToBackend = async (dataUrl, sectionNum) => {
      if (!cuestionario.value?.id || !dataUrl || !student.value?.id) return;
      try {
        const studentCode =
          sectionStudentCodes.value[sectionNum - 1] ||
          studentCodeInput.value ||
          student.value.code ||
          "";
        const studentId = student.value.id;
        const instituteId =
          cuestionario.value.instituteId ||
          cuestionario.value.lesson?.institute?.id ||
          undefined;

        await axios.post(`/quizzes/${cuestionario.value.id}/scans`, {
          image: dataUrl,
          studentCode,
          userId: studentId,
          section: sectionNum,
          instituteId,
        });
      } catch (error) {
        console.error(
          "Error al guardar la imagen escaneada en el backend:",
          error,
        );
      }
    };

    // Redibujar dinámicamente la vista previa con notas coloreadas (verde = correcto, rojo = incorrecto)
    const renderSectionImageWithGrades = (sectionNum) => {
      const sectionIndex = sectionNum - 1;
      const cleanImgUrl = sectionCleanImages.value[sectionIndex];
      const coords = sectionBubbleCoords.value[sectionIndex];
      if (!cleanImgUrl || !coords || coords.length === 0) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const questions = questionsForCurrentSection.value;

        coords.forEach((b) => {
          ctx.beginPath();
          ctx.arc(b.gx, b.gy, b.radius, 0, Math.PI * 2);

          if (b.matrixType === "numeric") {
            if (b.isWinner) {
              ctx.fillStyle = "rgba(106, 90, 224, 0.85)";
              ctx.fill();
              ctx.strokeStyle = "#6a5ae0";
              ctx.lineWidth = 2;
              ctx.stroke();
            } else {
              ctx.strokeStyle = "rgba(160, 160, 175, 0.35)";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          } else if (b.matrixType === "question") {
            const question = questions[b.questionIdx];
            if (!question) {
              ctx.strokeStyle = "rgba(160, 160, 175, 0.35)";
              ctx.lineWidth = 1;
              ctx.stroke();
              return;
            }

            const selectedOpt = question.options.find(
              (opt) => opt.id === question.selectedOption,
            );
            const isSelected =
              selectedOpt &&
              selectedOpt.identifier.toUpperCase() === b.optLetter;
            const correctOpt = question.options.find((opt) => opt.correct);
            const isKey =
              correctOpt && correctOpt.identifier.toUpperCase() === b.optLetter;

            if (isSelected) {
              if (isKey) {
                // Correcto -> Verde Queezy
                ctx.fillStyle = "rgba(45, 211, 111, 0.88)";
                ctx.fill();
                ctx.strokeStyle = "#2dd36f";
                ctx.lineWidth = 2.5;
                ctx.stroke();
              } else {
                // Incorrecto -> Rojo Queezy
                ctx.fillStyle = "rgba(235, 68, 90, 0.88)";
                ctx.fill();
                ctx.strokeStyle = "#eb445a";
                ctx.lineWidth = 2.5;
                ctx.stroke();
              }
            } else if (isKey) {
              // Clave correcta sin marcar -> Aro verde destacado
              ctx.strokeStyle = "#2dd36f";
              ctx.lineWidth = 2.5;
              ctx.stroke();
            } else {
              // Opción sin marcar -> Borde sutil
              ctx.strokeStyle = "rgba(160, 160, 175, 0.4)";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });

        const updatedUrl = canvas.toDataURL("image/png");
        sectionScanImageUrls.value[sectionIndex] = updatedUrl;
      };
      img.src = cleanImgUrl;
    };

    // Helper: toggle/select option
    const selectOption = (answer, optionId) => {
      if (answer.selectedOption === optionId) {
        answer.selectedOption = null;
      } else {
        answer.selectedOption = optionId;
      }
      renderSectionImageWithGrades(currentSection.value);
    };

    // Helper: clear answer
    const clearAnswer = (answer) => {
      answer.selectedOption = null;
      renderSectionImageWithGrades(currentSection.value);
    };

    // Helper: change section
    const changeSection = (section) => {
      if (isSectionEnabled(section)) {
        currentSection.value = section;
      }
    };

    // Función para determinar si una sección está habilitada
    const isSectionEnabled = (sectionNumber) => {
      // La primera sección siempre está habilitada
      if (sectionNumber === 1) return true;

      // Las secciones siguientes solo se habilitan si la sección anterior tiene código escaneado
      const previousSectionIndex = sectionNumber - 2;
      return !!sectionStudentCodes.value[previousSectionIndex];
    };

    const startScan = async () => {
      const sectionIndex = currentSection.value - 1;
      const start = sectionIndex * 20;
      const end = currentSection.value * 20;

      for (let i = start; i < end && i < answersToSend.value.length; i++) {
        answersToSend.value[i].selectedOption = null;
      }
      sectionScanImageUrls.value[sectionIndex] = null;
      sectionStudentCodes.value[sectionIndex] = "";
      sectionValidity.value[sectionIndex] = true;

      isScanning.value = true;
      await nextTick();
      if (scannerComponent.value) scannerComponent.value.start();
    };

    const fetchStudentByCodeAPI = async (code) => {
      if (!code) return null;
      try {
        const response = await axios.get(`/users?code=${code}`);
        return response.data.length > 0 ? response.data[0] : null;
      } catch (error) {
        console.error("Error fetching student data:", error);
        return { error: "network" };
      }
    };

    const validateStudentCodes = async () => {
      const referenceCode = sectionStudentCodes.value[0];
      invalidSectionDetails.value = {};

      if (!referenceCode) {
        sectionValidity.value.fill(true);
        return;
      }

      if (student.value.code !== referenceCode) {
        await findStudentByCode(referenceCode, "scan");
      }

      const mismatchedSections = [];
      const promises = [];

      for (let i = 0; i < numberOfSections.value; i++) {
        const currentCode = sectionStudentCodes.value[i];
        const isValid = !currentCode || currentCode === referenceCode;
        sectionValidity.value[i] = isValid;

        if (!isValid) {
          mismatchedSections.push(i + 1);
          const p = fetchStudentByCodeAPI(currentCode).then((data) => {
            if (data?.error === "network") {
              invalidSectionDetails.value[i + 1] = {
                code: currentCode,
                name: "Error de Red",
                lastName: "",
              };
            } else if (data) {
              invalidSectionDetails.value[i + 1] = {
                code: currentCode,
                ...data,
              };
            } else {
              invalidSectionDetails.value[i + 1] = {
                code: currentCode,
                name: "No encontrado",
                lastName: "",
              };
            }
          });
          promises.push(p);
        }
      }

      await Promise.all(promises);

      if (mismatchedSections.length > 0) {
        const alert = await alertController.create({
          header: "Códigos no coinciden",
          message: `El código en la(s) sección(es) ${mismatchedSections.join(
            ", ",
          )} no coincide con el de la primera sección (${referenceCode}). Por favor, vuelva a escanear las secciones incorrectas.`,
          buttons: [
            {
              text: "OK",
              handler: () => {
                setTimeout(() => startScan(), 300);
              },
            },
          ],
        });
        await alert.present();
      }
    };

    const findStudentByCode = async (code, context = "manual") => {
      studentCodeInput.value = code;
      if (!code) {
        student.value = {};
        activeGroup.value = null;
        return;
      }

      const foundStudent = await fetchStudentByCodeAPI(code);

      if (foundStudent?.error === "network") {
        student.value = { id: null, name: "Error de Red", lastName: "" };
        activeGroup.value = null;
        const alert = await alertController.create({
          header: "Error de Red",
          message:
            "No se pudo verificar el código del estudiante. Verifique su conexión e inténtelo de nuevo.",
          buttons: [
            {
              text: "OK",
              handler: () => {
                setTimeout(() => startScan(), 300);
              },
            },
          ],
        });
        await alert.present();
        return;
      }

      if (!foundStudent) {
        student.value = { id: null, name: "o", lastName: "" };
        activeGroup.value = null;
        if (context === "scan") {
          const alert = await alertController.create({
            header: "Estudiante no encontrado",
            message: `No se encontró ningún estudiante con el código "${code}".`,
            inputs: [
              {
                name: "manualCode",
                type: "text",
                placeholder: "Código de estudiante",
                value: code || "",
              },
            ],
            buttons: [
              {
                text: "Reescanear",
                role: "cancel",
                handler: () => {
                  setTimeout(() => startScan(), 300);
                },
              },
              {
                text: "Ingresar",
                handler: (data) => {
                  const inputCode = data?.manualCode?.trim();
                  if (inputCode) {
                    findStudentByCode(inputCode, "manual");
                  } else {
                    studentCodeInput.value = "";
                  }
                },
              },
            ],
          });
          await alert.present();
        }
      } else {
        student.value = foundStudent;
        try {
          const coursesResponse = await axios.get(
            `/users/${student.value.id}/courses`,
          );
          const studentCourses = coursesResponse.data;
          const activeUserCourse = studentCourses.find((uc) => uc.active);

          if (
            !activeUserCourse ||
            activeUserCourse.course.id !== cuestionario.value.courseId
          ) {
            const alert = await alertController.create({
              header: "Estudiante no Autorizado",
              message: `El estudiante ${student.value.name} ${student.value.lastName} no pertenece al curso activo de este cuestionario.`,
              buttons: [
                {
                  text: "OK",
                  handler: () => {
                    student.value = {};
                    activeGroup.value = null;
                    studentCodeInput.value = "";
                    setTimeout(() => startScan(), 300);
                  },
                },
              ],
            });
            await alert.present();
            return; // Stop processing this student
          }
        } catch (error) {
          console.error("Error fetching student courses:", error);
          const alert = await alertController.create({
            header: "Error de Verificación",
            message:
              "No se pudo verificar la inscripción del estudiante al curso. Por favor, inténtelo de nuevo.",
            buttons: [
              {
                text: "OK",
                handler: () => {
                  student.value = {};
                  activeGroup.value = null;
                  setTimeout(() => startScan(), 300);
                },
              },
            ],
          });
          await alert.present();
          return;
        }

        try {
          const groupsResponse = await axios.get(
            `/users/${student.value.id}/groups?active=true`,
          );
          const activeUserToGroup = groupsResponse.data.find((g) => g.active);
          activeGroup.value = activeUserToGroup
            ? activeUserToGroup.group
            : null;
        } catch (error) {
          console.error("Error fetching student groups:", error);
          activeGroup.value = null;
        }
      }
    };

    const onScanComplete = async (payload) => {
      const sectionIndex = currentSection.value - 1;
      sectionScanImageUrls.value[sectionIndex] = payload.imageUrl;
      sectionCleanImages.value[sectionIndex] = payload.cleanImageUrl;
      sectionBubbleCoords.value[sectionIndex] = payload.bubbleCoords;

      const questionsArrayBlockResults = payload.results.filter(
        (r) => r.typeOrigin === "question",
      );
      const concatedAnswers = [];
      questionsArrayBlockResults.forEach((block) => {
        concatedAnswers.push(...block.content);
      });

      const sectionOffset = sectionIndex * 20;
      concatedAnswers.forEach((scannedAnswer, index) => {
        const globalIndex = sectionOffset + index;
        if (globalIndex < answersToSend.value.length) {
          const question = answersToSend.value[globalIndex];
          const option = question.options.find(
            (opt) =>
              opt.identifier.toLowerCase() ===
              scannedAnswer.answer.toLowerCase(),
          );
          if (option) question.selectedOption = option.id;
        }
      });

      const studentCode = payload.results.find(
        (r) => r.typeOrigin === "numeric",
      );
      // Remove leading zeros to match database format
      sectionStudentCodes.value[sectionIndex] = studentCode
        ? studentCode.content.replace(/^0+/, "")
        : "";

      isScanning.value = false;
      await validateStudentCodes();
    };

    const onScanCancelled = () => {
      isScanning.value = false;
    };

    const submitAnswers = async () => {
      if (sectionValidity.value.includes(false)) {
        const alert = await alertController.create({
          header: "Error de Validación",
          message:
            "No se pueden guardar las respuestas porque hay códigos de estudiante que no coinciden. Por favor, corrija las secciones marcadas en rojo.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      if (!student.value.id) {
        const alert = await alertController.create({
          header: "Error",
          message: "Se requiere un estudiante para guardar las respuestas.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      if (
        cuestionario.value.quizType === "group" &&
        (!activeGroup.value || !activeGroup.value.id)
      ) {
        const alert = await alertController.create({
          header: "Error",
          message:
            "Este es un cuestionario de grupo y no se encontró un grupo activo para el estudiante.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      const answersPayload = answersToSend.value
        .filter((a) => a.selectedOption !== null)
        .map((a) => ({
          questionId: a.id,
          optionId: a.selectedOption,
          quizId: cuestionario.value.id,
          instituteId: cuestionario.value.instituteId,
          userId: student.value.id,
          groupId:
            cuestionario.value.quizType === "group"
              ? activeGroup.value.id
              : null,
          exist: true, // Assuming new answers are always 'exist: true'
        }));

      if (answersPayload.length === 0) {
        const alert = await alertController.create({
          header: "Sin respuestas",
          message: "No hay ninguna respuesta seleccionada para enviar.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      isSubmitting.value = true;
      try {
        await axios.post("/answers/bulk", answersPayload);

        // Guardar las imágenes finales de escaneo en uploads/test/:quizId
        for (let s = 1; s <= numberOfSections.value; s++) {
          if (sectionScanImageUrls.value[s - 1]) {
            await saveScanToBackend(sectionScanImageUrls.value[s - 1], s);
          }
        }

        const alert = await alertController.create({
          header: "Éxito",
          message: "¿Qué desea hacer a continuación?",
          buttons: [
            {
              text: "Ver Resultados",
              handler: () => {
                router.push(backUrl.value);
              },
            },
            {
              text: "Escanear Nuevo",
              handler: () => {
                // Reset state
                student.value = {};
                studentCodeInput.value = "";
                activeGroup.value = null;
                sectionScanImageUrls.value.fill(null);
                sectionCleanImages.value.fill(null);
                sectionBubbleCoords.value.fill(null);
                sectionStudentCodes.value.fill("");
                sectionValidity.value.fill(true);
                answersToSend.value.forEach((a) => (a.selectedOption = null));
                currentSection.value = 1;
                // Restart scan
                setTimeout(() => startScan(), 300);
              },
            },
          ],
        });
        await alert.present();
      } catch (error) {
        const message =
          error.response?.data?.message ||
          "Ocurrió un error al guardar las respuestas.";
        const alert = await alertController.create({
          header: "Error al Guardar",
          message: message,
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        isSubmitting.value = false;
      }
    };

    onIonViewDidEnter(async () => {
      tokenHeader();
      const response = await axios.get(`/quizzes/${quizId}`);
      cuestionario.value = {
        id: response.data.id,
        title: response.data.title,
        quizType: response.data.quizType,
        lessonId: response.data.lesson.id,
        courseId: response.data.lesson.course.id,
        questions: response.data.questions.sort((a, b) => a.id - b.id),
        instituteId: response.data.lesson.institute.id,
      };

      numberOfSections.value = Math.ceil(
        cuestionario.value.questions.length / 20,
      );

      sectionScanImageUrls.value = Array(numberOfSections.value).fill(null);
      sectionCleanImages.value = Array(numberOfSections.value).fill(null);
      sectionBubbleCoords.value = Array(numberOfSections.value).fill(null);
      sectionStudentCodes.value = Array(numberOfSections.value).fill("");
      sectionValidity.value = Array(numberOfSections.value).fill(true);

      answersToSend.value = cuestionario.value.questions.map((question) => {
        const correctOption = question.options.find((opt) => opt.correct);
        const correctOptionId = correctOption ? correctOption.id : null;
        const correctOptionIdentifier = correctOption
          ? correctOption.identifier
          : "N/A";

        const questionReactive = reactive({
          id: question.id,
          questionTitle: question.title,
          correctOptionId: correctOptionId,
          options: question.options.map((option) => ({
            id: option.id,
            identifier: option.identifier,
            correct: option.correct,
          })),
          selectedOption: null,
          correctOptionIdentifier: correctOptionIdentifier,
        });

        questionReactive.isCorrect = computed(
          () =>
            questionReactive.selectedOption !== null &&
            questionReactive.selectedOption ===
              questionReactive.correctOptionId,
        );

        return questionReactive;
      });

      if (cuestionario.value.id) {
        backUrl.value = `/ganadores/${cuestionario.value.id}`;
      }
    });

    return {
      isScanning,
      student,
      cuestionario,
      answersToSend,
      scannerComponent,
      arrowBackOutline,
      saveOutline,
      syncOutline,
      cameraOutline,
      checkmarkCircle,
      closeCircle,
      alertCircleOutline,
      personOutline,
      peopleOutline,
      sparklesOutline,
      checkmarkDoneOutline,
      closeOutline,
      backUrl,
      studentCodeInput,
      activeGroup,
      isSubmitting,
      numberOfSections,
      currentSection,
      questionsForCurrentSection,
      sectionScanImageUrls,
      sectionStudentCodes,
      sectionValidity,
      isSectionEnabled,
      startScan,
      onScanComplete,
      onScanCancelled,
      findStudentByCode,
      submitAnswers,
      saveButtonColor,
      invalidSectionDetails,
      totalCorrectAnswers,
      totalIncorrectAnswers,
      goBack,
      getInitials,
      selectOption,
      clearAnswer,
      changeSection,
    };
  },
};
</script>

<style scoped>
/* ----------------------------------------------------
   VARIABLES Y BASE QUEEZY
---------------------------------------------------- */
.qz-omr-page {
  --background: #f8f7fc;
  background-color: #f8f7fc;
  font-family: var(--qz-font-family, "Rubik", -apple-system, Roboto, sans-serif);
}

.qz-omr-content {
  --background: #f8f7fc;
  background-color: #f8f7fc;
}

.qz-omr-wrapper {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f7fc;
}

/* ----------------------------------------------------
   1. HERO HEADER QUEEZY PÚRPURA
---------------------------------------------------- */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 24px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 760px;
  margin: 0 auto;
  padding: 8px 18px 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qz-back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: 9999px;
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

.qz-hero-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 5px 12px;
  border-radius: 9999px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.qz-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-action-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: 9999px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-action-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.qz-action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.qz-action-btn--save:not(:disabled) {
  background: #2dd36f;
  border-color: #28ba62;
  box-shadow: 0 4px 12px rgba(45, 211, 111, 0.35);
}

.qz-hero-titles {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 18px;
  text-align: left;
}

.qz-hero-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.qz-hero-tag {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
}

.qz-hero-type-pill {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-radius: 9999px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.qz-hero-title {
  margin: 2px 0 6px 0;
  font-size: clamp(22px, 3.5vw, 28px);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
  word-break: break-word;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
  line-height: 1.45;
}

.qz-hero-meta-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.qz-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  border-radius: 9999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
}

/* ----------------------------------------------------
   2. CUERPO PRINCIPAL
---------------------------------------------------- */
.qz-main-body {
  flex: 1;
  padding: 12px 16px 40px 16px;
  background-color: #f8f7fc;
}

.qz-container {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ----------------------------------------------------
   TARJETAS QUEEZY BASE
---------------------------------------------------- */
.qz-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 18px 20px;
  border: 1px solid #ebebf3;
  box-shadow: 0 4px 18px rgba(106, 90, 224, 0.05);
  transition: box-shadow 0.2s ease;
}

.qz-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.qz-card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-card-icon-pill {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #efeefc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.qz-card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0c092a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-card-sub {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #858494;
}

.qz-badge-count {
  background: #efeefc;
  color: #6a5ae0;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 9999px;
}

.qz-mini-btn {
  background: #efeefc;
  color: #6a5ae0;
  border: 1px solid rgba(106, 90, 224, 0.2);
  border-radius: 9999px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.qz-mini-btn:hover {
  background: #6a5ae0;
  color: #ffffff;
}

/* ----------------------------------------------------
   SECCIÓN TABS (Pills de sección)
---------------------------------------------------- */
.qz-sections-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.qz-section-pill {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 9999px;
  background: #f4f3fb;
  border: 1.5px solid #e5e3f4;
  color: #49465b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
}

.qz-sec-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.qz-sec-icon {
  font-size: 16px;
}

.qz-sec-icon--success {
  color: #2dd36f;
}

.qz-sec-icon--error {
  color: #eb445a;
}

.qz-section-pill.is-active {
  background: #6a5ae0;
  border-color: #6a5ae0;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.3);
}

.qz-section-pill.is-active .qz-sec-num {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.qz-section-pill.is-invalid {
  border-color: #eb445a;
  color: #eb445a;
  background: #fdf2f4;
}

.qz-section-pill.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ----------------------------------------------------
   PANEL DE BOTONES PRINCIPALES
---------------------------------------------------- */
.qz-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 580px) {
  .qz-actions-grid {
    grid-template-columns: 1fr;
  }
}

.qz-action-big-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  text-align: left;
  outline: none;
  transition: all 0.18s ease;
}

.qz-btn-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-btn-text-wrap {
  display: flex;
  flex-direction: column;
}

.qz-btn-main-text {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.2px;
}

.qz-btn-sub-text {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 2px;
  line-height: 1.3;
}

/* Estilo Escanear */
.qz-btn--scan {
  background: linear-gradient(135deg, #6a5ae0 0%, #7e6ff3 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.28);
}

.qz-btn--scan .qz-btn-icon-wrap {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.qz-btn--scan:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(106, 90, 224, 0.35);
}

.qz-btn--scan:active:not(:disabled) {
  transform: translateY(0);
}

/* Estilo Guardar */
.qz-btn--save {
  background: linear-gradient(135deg, #2dd36f 0%, #24b85e 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(45, 211, 111, 0.28);
}

.qz-btn--save .qz-btn-icon-wrap {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.qz-btn--save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(45, 211, 111, 0.35);
}

.qz-btn--save:active:not(:disabled) {
  transform: translateY(0);
}

.qz-btn--save.is-disabled,
.qz-action-big-btn:disabled {
  background: #ecebf2;
  color: #9c9ab3;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.qz-btn--save.is-disabled .qz-btn-icon-wrap,
.qz-action-big-btn:disabled .qz-btn-icon-wrap {
  background: #dedce7;
  color: #9c9ab3;
}

/* ----------------------------------------------------
   ALERTA DE SECCIÓN
---------------------------------------------------- */
.qz-alert-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #fff5f6;
  border: 1.5px solid #f8d7da;
  border-radius: 18px;
}

.qz-alert-icon {
  font-size: 28px;
  color: #eb445a;
  flex-shrink: 0;
  margin-top: 2px;
}

.qz-alert-content {
  flex: 1;
}

.qz-alert-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 800;
  color: #b71c1c;
}

.qz-alert-desc {
  margin: 0;
  font-size: 13px;
  color: #5c1e24;
  line-height: 1.45;
}

.qz-alert-detected {
  margin-top: 6px;
  font-size: 12.5px;
  color: #eb445a;
}

.qz-alert-actions {
  margin-top: 10px;
}

.qz-alert-btn {
  background: #eb445a;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.qz-alert-btn:hover {
  background: #d32f2f;
}

/* ----------------------------------------------------
   TARJETA DE ESTUDIANTE
---------------------------------------------------- */
.qz-student-search-box {
  margin-bottom: 14px;
}

.qz-input-group {
  display: flex;
  align-items: center;
  background: #f5f4fb;
  border: 1.5px solid #e5e3f4;
  border-radius: 14px;
  padding: 4px 6px 4px 12px;
  transition: border-color 0.15s ease;
  min-width: 0;
  position: relative;
}

.qz-input-group:focus-within {
  border-color: #6a5ae0;
  background: #ffffff;
}

.qz-input-icon {
  font-size: 18px;
  color: #858494;
  margin-right: 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.qz-code-input {
  flex: 1;
  min-width: 0;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #0c092a;
  padding: 8px 0;
}

.qz-code-input::placeholder {
  color: #a4a2b6;
  font-weight: 400;
}

.qz-search-code-btn {
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  white-space: nowrap;
  transition: all 0.15s ease;
}

@media (max-width: 480px) {
  .qz-search-code-btn span {
    display: none;
  }

  .qz-search-code-btn {
    padding: 8px;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    font-size: 18px;
  }
}

.qz-search-code-btn:hover:not(:disabled) {
  background: #5746d8;
}

.qz-search-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qz-student-profile-wrap {
  background: #faf9fd;
  border: 1px solid #ebe9f7;
  border-radius: 16px;
  padding: 14px 16px;
}

.qz-student-main-info {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.qz-student-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a5ae0 0%, #8c7eff 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(106, 90, 224, 0.25);
}

.qz-student-details {
  flex: 1;
}

.qz-student-fullname {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 800;
  color: #0c092a;
}

.qz-student-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.qz-code-badge {
  background: #efeefc;
  color: #6a5ae0;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
}

.qz-group-badge {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.qz-score-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #ebe9f7;
}

.qz-summary-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
}

.qz-chip-data {
  display: flex;
  flex-direction: column;
}

.qz-chip-val {
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
}

.qz-chip-lbl {
  font-size: 10.5px;
  font-weight: 600;
  opacity: 0.85;
  margin-top: 2px;
}

.qz-chip--success {
  background: #e8f9ef;
  color: #2dd36f;
}

.qz-chip--danger {
  background: #fdf0f2;
  color: #eb445a;
}

.qz-chip--neutral {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-student-empty-state {
  text-align: center;
  padding: 18px 12px;
  color: #858494;
}

.qz-empty-icon {
  font-size: 32px;
  color: #a4a2b6;
  margin-bottom: 6px;
}

.qz-student-empty-state p {
  margin: 0;
  font-size: 13px;
}

/* ----------------------------------------------------
   VISTA PREVIA DE HOJA ESCANEADA
---------------------------------------------------- */
.qz-preview-body {
  text-align: center;
  background: #f5f4fb;
  border-radius: 14px;
  padding: 10px;
}

.qz-preview-img {
  max-width: 100%;
  max-height: 380px;
  border-radius: 8px;
  border: 1px solid #e1dfec;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  object-fit: contain;
}

/* ----------------------------------------------------
   REVISIÓN DE PREGUNTAS (TARJETAS DE PREGUNTAS Y BURBUJAS)
---------------------------------------------------- */
.qz-questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-question-card {
  background: #faf9fd;
  border: 1.5px solid #ebe8f7;
  border-radius: 16px;
  padding: 12px 14px;
  transition: all 0.15s ease;
}

.qz-question-card:hover {
  border-color: #cfcaf0;
}

.qz-question-card.is-correct {
  border-color: rgba(45, 211, 111, 0.35);
  background: #fbfdfc;
}

.qz-question-card.is-incorrect {
  border-color: rgba(235, 68, 90, 0.35);
  background: #fffbfb;
}

.qz-q-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.qz-q-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.qz-q-index-pill {
  background: #efeefc;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 8px;
  flex-shrink: 0;
}

.qz-q-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #0c092a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.qz-tag--success {
  background: #e8f9ef;
  color: #2dd36f;
}

.qz-tag--danger {
  background: #fdf0f2;
  color: #eb445a;
}

.qz-tag--blank {
  background: #ecebf2;
  color: #858494;
}

/* Fila de Burbujas */
.qz-q-bubbles-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.qz-bubbles-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-bubble-opt {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #d5d3e8;
  background: #ffffff;
  color: #3b3753;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  position: relative;
}

.qz-bubble-opt:hover {
  border-color: #6a5ae0;
  color: #6a5ae0;
  transform: scale(1.05);
}

.qz-bubble-opt:active {
  transform: scale(0.95);
}

/* Burbuja marcada como clave (borde sutil) */
.qz-bubble-opt.is-key::after {
  content: "";
  position: absolute;
  bottom: -4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2dd36f;
}

/* Seleccionada y correcta */
.qz-bubble-opt.is-selected.is-correct {
  background: #2dd36f;
  border-color: #2dd36f;
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(45, 211, 111, 0.4);
}

/* Seleccionada e incorrecta */
.qz-bubble-opt.is-selected.is-incorrect {
  background: #eb445a;
  border-color: #eb445a;
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(235, 68, 90, 0.4);
}

/* Seleccionada genérica (si no se sabe si es correcta aún) */
.qz-bubble-opt.is-selected:not(.is-correct):not(.is-incorrect) {
  background: #6a5ae0;
  border-color: #6a5ae0;
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(106, 90, 224, 0.35);
}

.qz-bubble-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-clear-opt-btn {
  background: transparent;
  border: 1px dashed #cfcde2;
  color: #858494;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.qz-clear-opt-btn:hover {
  background: #fdf0f2;
  border-color: #eb445a;
  color: #eb445a;
}

.qz-key-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 8px;
  background: #e8f9ef;
  color: #1a7a40;
}

.qz-key-lbl {
  font-size: 10.5px;
  opacity: 0.8;
}

.qz-key-val {
  font-weight: 900;
  color: #1a7a40;
}

/* ----------------------------------------------------
   3. OVERLAY DE ESCÁNER
---------------------------------------------------- */
.qz-scanner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #000000;
  display: flex;
  flex-direction: column;
}

.qz-scanner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(14px, env(safe-area-inset-top)) 16px 12px 16px;
  background: rgba(18, 16, 36, 0.95);
  backdrop-filter: blur(8px);
  color: #ffffff;
  z-index: 10;
  gap: 10px;
}

.qz-scanner-cancel-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
}

.qz-scanner-instruction {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  font-weight: 500;
}

.qz-scanner-section-tag {
  background: #6a5ae0;
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

.qz-scanner-viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ----------------------------------------------------
   MODO OSCURO (DARK MODE - CLASES Y PREFERS-COLOR-SCHEME)
---------------------------------------------------- */
body.dark .qz-omr-page,
html.dark .qz-omr-page,
.dark .qz-omr-page,
body.dark .qz-omr-content,
html.dark .qz-omr-content,
.dark .qz-omr-content,
body.dark .qz-omr-wrapper,
html.dark .qz-omr-wrapper,
.dark .qz-omr-wrapper,
body.dark .qz-main-body,
html.dark .qz-main-body,
.dark .qz-main-body {
  --background: #121024 !important;
  background-color: #121024 !important;
}

body.dark .qz-hero-header,
html.dark .qz-hero-header,
.dark .qz-hero-header {
  background: linear-gradient(180deg, #372f75 0%, #282159 85%, #121024 100%);
}

body.dark .qz-card,
html.dark .qz-card,
.dark .qz-card {
  background: #1e1a3a;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

body.dark .qz-card-title,
html.dark .qz-card-title,
.dark .qz-card-title {
  color: #f3f2ff;
}

body.dark .qz-card-sub,
html.dark .qz-card-sub,
.dark .qz-card-sub {
  color: #9c9ab3;
}

body.dark .qz-card-icon-pill,
html.dark .qz-card-icon-pill,
.dark .qz-card-icon-pill {
  background: #27224f;
}

body.dark .qz-section-pill,
html.dark .qz-section-pill,
.dark .qz-section-pill {
  background: #242045;
  border-color: #353061;
  color: #cfcaf0;
}

body.dark .qz-section-pill.is-active,
html.dark .qz-section-pill.is-active,
.dark .qz-section-pill.is-active {
  background: #6a5ae0;
  border-color: #6a5ae0;
  color: #ffffff;
}

body.dark .qz-section-pill.is-invalid,
html.dark .qz-section-pill.is-invalid,
.dark .qz-section-pill.is-invalid {
  background: #381a24;
  border-color: #eb445a;
  color: #ff8595;
}

body.dark .qz-input-group,
html.dark .qz-input-group,
.dark .qz-input-group {
  background: #252048;
  border-color: #383363;
}

body.dark .qz-code-input,
html.dark .qz-code-input,
.dark .qz-code-input {
  color: #f3f2ff;
}

body.dark .qz-code-input::placeholder,
html.dark .qz-code-input::placeholder,
.dark .qz-code-input::placeholder {
  color: #85839f;
}

body.dark .qz-student-profile-wrap,
html.dark .qz-student-profile-wrap,
.dark .qz-student-profile-wrap {
  background: #17142e;
  border-color: #2e2954;
}

body.dark .qz-student-fullname,
html.dark .qz-student-fullname,
.dark .qz-student-fullname {
  color: #f3f2ff;
}

body.dark .qz-score-summary-grid,
html.dark .qz-score-summary-grid,
.dark .qz-score-summary-grid {
  border-color: #2e2954;
}

body.dark .qz-chip--success,
html.dark .qz-chip--success,
.dark .qz-chip--success {
  background: #123321;
  color: #4eed88;
}

body.dark .qz-chip--danger,
html.dark .qz-chip--danger,
.dark .qz-chip--danger {
  background: #3b1820;
  color: #ff6f80;
}

body.dark .qz-chip--neutral,
html.dark .qz-chip--neutral,
.dark .qz-chip--neutral {
  background: #27224f;
  color: #c4beff;
}

body.dark .qz-preview-body,
html.dark .qz-preview-body,
.dark .qz-preview-body {
  background: #17142e;
}

body.dark .qz-preview-img,
html.dark .qz-preview-img,
.dark .qz-preview-img {
  border-color: #2e2954;
}

body.dark .qz-question-card,
html.dark .qz-question-card,
.dark .qz-question-card {
  background: #17142e;
  border-color: #2e2954;
}

body.dark .qz-question-card.is-correct,
html.dark .qz-question-card.is-correct,
.dark .qz-question-card.is-correct {
  background: #142322;
  border-color: rgba(45, 211, 111, 0.45);
}

body.dark .qz-question-card.is-incorrect,
html.dark .qz-question-card.is-incorrect,
.dark .qz-question-card.is-incorrect {
  background: #261520;
  border-color: rgba(235, 68, 90, 0.45);
}

body.dark .qz-status-tag.qz-tag--success,
html.dark .qz-status-tag.qz-tag--success,
.dark .qz-status-tag.qz-tag--success {
  background: rgba(45, 211, 111, 0.18);
  color: #4eed88;
}

body.dark .qz-status-tag.qz-tag--danger,
html.dark .qz-status-tag.qz-tag--danger,
.dark .qz-status-tag.qz-tag--danger {
  background: rgba(235, 68, 90, 0.2);
  color: #ff6f80;
}

body.dark .qz-status-tag.qz-tag--blank,
html.dark .qz-status-tag.qz-tag--blank,
.dark .qz-status-tag.qz-tag--blank {
  background: #252048;
  color: #a09eb5;
}

body.dark .qz-q-title,
html.dark .qz-q-title,
.dark .qz-q-title {
  color: #f3f2ff;
}

body.dark .qz-q-index-pill,
html.dark .qz-q-index-pill,
.dark .qz-q-index-pill {
  background: #27224f;
  color: #c4beff;
}

body.dark .qz-bubble-opt,
html.dark .qz-bubble-opt,
.dark .qz-bubble-opt {
  background: #252048;
  border-color: #3e386e;
  color: #e5e3f4;
}

body.dark .qz-bubble-opt:hover,
html.dark .qz-bubble-opt:hover,
.dark .qz-bubble-opt:hover {
  border-color: #8c7eff;
  color: #8c7eff;
}

body.dark .qz-clear-opt-btn,
html.dark .qz-clear-opt-btn,
.dark .qz-clear-opt-btn {
  border-color: #3e386e;
  color: #9c9ab3;
}

body.dark .qz-clear-opt-btn:hover,
html.dark .qz-clear-opt-btn:hover,
.dark .qz-clear-opt-btn:hover {
  background: #3b1820;
  border-color: #eb445a;
  color: #ff6f80;
}

body.dark .qz-key-badge,
html.dark .qz-key-badge,
.dark .qz-key-badge {
  background: #123321;
  color: #4eed88;
}

body.dark .qz-key-val,
html.dark .qz-key-val,
.dark .qz-key-val {
  color: #4eed88;
}

body.dark .qz-alert-card,
html.dark .qz-alert-card,
.dark .qz-alert-card {
  background: #2b141b;
  border-color: #53232c;
}

body.dark .qz-alert-title,
html.dark .qz-alert-title,
.dark .qz-alert-title {
  color: #ff8595;
}

body.dark .qz-alert-desc,
html.dark .qz-alert-desc,
.dark .qz-alert-desc {
  color: #f3c2c7;
}

/* Fallback automático por preferencia del sistema */
@media (prefers-color-scheme: dark) {
  .qz-omr-page,
  .qz-omr-content,
  .qz-omr-wrapper,
  .qz-main-body {
    --background: #121024 !important;
    background-color: #121024 !important;
  }

  .qz-hero-header {
    background: linear-gradient(180deg, #372f75 0%, #282159 85%, #121024 100%);
  }

  .qz-card {
    background: #1e1a3a;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  }

  .qz-card-title {
    color: #f3f2ff;
  }

  .qz-card-sub {
    color: #9c9ab3;
  }

  .qz-card-icon-pill {
    background: #27224f;
  }

  .qz-section-pill {
    background: #242045;
    border-color: #353061;
    color: #cfcaf0;
  }

  .qz-section-pill.is-active {
    background: #6a5ae0;
    border-color: #6a5ae0;
    color: #ffffff;
  }

  .qz-section-pill.is-invalid {
    background: #381a24;
    border-color: #eb445a;
    color: #ff8595;
  }

  .qz-input-group {
    background: #252048;
    border-color: #383363;
  }

  .qz-code-input {
    color: #f3f2ff;
  }

  .qz-code-input::placeholder {
    color: #85839f;
  }

  .qz-student-profile-wrap {
    background: #17142e;
    border-color: #2e2954;
  }

  .qz-student-fullname {
    color: #f3f2ff;
  }

  .qz-score-summary-grid {
    border-color: #2e2954;
  }

  .qz-chip--success {
    background: #123321;
    color: #4eed88;
  }

  .qz-chip--danger {
    background: #3b1820;
    color: #ff6f80;
  }

  .qz-chip--neutral {
    background: #27224f;
    color: #c4beff;
  }

  .qz-preview-body {
    background: #17142e;
  }

  .qz-preview-img {
    border-color: #2e2954;
  }

  .qz-question-card {
    background: #17142e;
    border-color: #2e2954;
  }

  .qz-question-card.is-correct {
    background: #142322;
    border-color: rgba(45, 211, 111, 0.45);
  }

  .qz-question-card.is-incorrect {
    background: #261520;
    border-color: rgba(235, 68, 90, 0.45);
  }

  .qz-status-tag.qz-tag--success {
    background: rgba(45, 211, 111, 0.18);
    color: #4eed88;
  }

  .qz-status-tag.qz-tag--danger {
    background: rgba(235, 68, 90, 0.2);
    color: #ff6f80;
  }

  .qz-status-tag.qz-tag--blank {
    background: #252048;
    color: #a09eb5;
  }

  .qz-q-title {
    color: #f3f2ff;
  }

  .qz-q-index-pill {
    background: #27224f;
    color: #c4beff;
  }

  .qz-bubble-opt {
    background: #252048;
    border-color: #3e386e;
    color: #e5e3f4;
  }

  .qz-bubble-opt:hover {
    border-color: #8c7eff;
    color: #8c7eff;
  }

  .qz-clear-opt-btn {
    border-color: #3e386e;
    color: #9c9ab3;
  }

  .qz-clear-opt-btn:hover {
    background: #3b1820;
    border-color: #eb445a;
    color: #ff6f80;
  }

  .qz-key-badge {
    background: #123321;
    color: #4eed88;
  }

  .qz-key-val {
    color: #4eed88;
  }

  .qz-alert-card {
    background: #2b141b;
    border-color: #53232c;
  }

  .qz-alert-title {
    color: #ff8595;
  }

  .qz-alert-desc {
    color: #f3c2c7;
  }
}
</style>
