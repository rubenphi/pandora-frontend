<template>
  <ion-page class="ion-page qz-print-page">
    <ion-content :fullscreen="true" class="qz-print-content">
      <div class="qz-print-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top">
              <button
                type="button"
                class="qz-back-btn"
                title="Volver a papelería"
                aria-label="Volver"
                @click="goBack"
              >
                <ion-icon :icon="arrowBackOutline"></ion-icon>
              </button>
              <span class="qz-hero-tag">PAPELERÍA</span>
            </div>
            <div class="qz-hero-title-row">
              <div>
                <h1 class="qz-hero-title">Hojas de Respuesta OMR</h1>
                <p class="qz-hero-subtitle">
                  Configura e imprime las hojas de respuestas personalizadas por estudiante
                </p>
              </div>
              <button
                type="button"
                class="qz-hero-action-btn"
                title="Imprimir todas las hojas"
                @click="printSheets"
              >
                <ion-icon :icon="printOutline"></ion-icon>
                <span>Imprimir todas</span>
              </button>
            </div>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-print-body">
          <!-- Tarjeta de configuración del cuestionario -->
          <section class="qz-card qz-config-card">
            <div class="qz-card-header-row">
              <div class="qz-card-icon-squircle qz-icon--purple">
                <ion-icon :icon="optionsOutline"></ion-icon>
              </div>
              <div>
                <h2 class="qz-config-title">Configuración del Cuestionario</h2>
                <p class="qz-config-subtitle">
                  Define las preguntas y el tema opcional para las hojas
                </p>
              </div>
            </div>

            <div class="qz-config-form-grid">
              <!-- Total de preguntas -->
              <div class="qz-field-group">
                <label class="qz-field-label" for="totalQuestions">
                  Total de Preguntas
                </label>
                <div class="qz-input-wrapper">
                  <ion-icon :icon="helpCircleOutline" class="qz-field-icon"></ion-icon>
                  <input
                    id="totalQuestions"
                    v-model.number="totalQuestions"
                    type="number"
                    min="1"
                    placeholder="Ej. 20"
                    class="qz-number-input"
                  />
                </div>
              </div>

              <!-- Tema (opcional) con botón de búsqueda -->
              <div class="qz-field-group qz-field-grow">
                <div class="qz-field-label-row">
                  <label class="qz-field-label" for="quizTopic">
                    Tema del Cuestionario (Opcional)
                  </label>
                  <button
                    type="button"
                    class="qz-link-btn"
                    @click="openQuizSearchModal"
                  >
                    <ion-icon :icon="searchOutline"></ion-icon>
                    <span>Buscar cuestionario</span>
                  </button>
                </div>
                <div class="qz-input-wrapper">
                  <ion-icon :icon="documentTextOutline" class="qz-field-icon"></ion-icon>
                  <input
                    id="quizTopic"
                    v-model="topic"
                    type="text"
                    placeholder="Ej. Evaluación de Biología - Célula"
                    class="qz-text-input"
                  />
                  <button
                    v-if="topic"
                    type="button"
                    class="qz-clear-btn"
                    title="Limpiar tema"
                    @click="topic = ''"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>

            <!-- Resumen de cálculo de hojas -->
            <div class="qz-calc-summary">
              <div class="qz-calc-item">
                <span class="qz-calc-label">Preguntas por hoja</span>
                <span class="qz-calc-value">{{ maxQuestionsPerSheet }}</span>
              </div>
              <div class="qz-calc-divider"></div>
              <div class="qz-calc-item">
                <span class="qz-calc-label">Hojas por estudiante</span>
                <span class="qz-calc-value">{{ sheets.length }}</span>
              </div>
              <div class="qz-calc-divider"></div>
              <div class="qz-calc-item">
                <span class="qz-calc-label">Total estudiantes</span>
                <span class="qz-calc-value">{{ allStudents.length }}</span>
              </div>
              <div class="qz-calc-divider"></div>
              <div class="qz-calc-item qz-calc-highlight">
                <span class="qz-calc-label">Total hojas a imprimir</span>
                <span class="qz-calc-value">{{ allStudents.length * sheets.length }}</span>
              </div>
            </div>

            <!-- Detalle de secciones -->
            <div class="qz-sections-pills" v-if="sheets.length > 0">
              <span
                v-for="sheet in sheets"
                :key="sheet.index"
                class="qz-section-pill"
              >
                Sec {{ sheet.index }}: preguntas {{ sheet.start }} - {{ sheet.end }}
              </span>
            </div>
          </section>

          <!-- Encabezado de estudiantes -->
          <div class="qz-list-header">
            <span class="qz-list-title">Estudiantes para previsualización</span>
            <span class="qz-count-pill">{{ allStudents.length }}</span>
          </div>

          <!-- Estado vacío -->
          <div v-if="allStudents.length === 0" class="qz-card qz-state-card">
            <div class="qz-empty-icon">
              <ion-icon :icon="peopleOutline"></ion-icon>
            </div>
            <h3 class="qz-empty-title">Sin estudiantes seleccionados</h3>
            <p class="qz-state-text">
              No se encontraron estudiantes para generar las hojas. Regresa a papelería y selecciona un curso.
            </p>
            <button type="button" class="qz-primary-btn" @click="goBack">
              <ion-icon :icon="arrowBackOutline"></ion-icon>
              <span>Regresar a Papelería</span>
            </button>
          </div>

          <!-- Lista de estudiantes en tarjetas Queezy -->
          <div v-else class="qz-students-grid">
            <div
              v-for="student in allStudents"
              :key="student.id"
              class="qz-card qz-student-card"
              @click="openStudentSheetModal(student)"
            >
              <div class="qz-student-left">
                <div class="qz-card-icon-squircle qz-icon--purple">
                  <ion-icon :icon="personOutline"></ion-icon>
                </div>
                <div class="qz-student-info">
                  <h3 class="qz-student-name">
                    {{ student.lastName }} {{ student.name }}
                  </h3>
                  <div class="qz-student-meta">
                    <span class="qz-student-code">Cód. {{ student.code }}</span>
                    <span v-if="student.courseName" class="qz-student-course">
                      {{ student.courseName }}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="qz-view-sheet-btn"
                title="Ver hoja de respuestas"
                aria-label="Ver hoja de respuestas"
              >
                <ion-icon :icon="eyeOutline"></ion-icon>
                <span>Ver hoja</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      <!-- MODAL DE PREVISUALIZACIÓN DE HOJA INDIVIDUAL -->
      <ion-modal
        :is-open="isModalOpen"
        @didDismiss="isModalOpen = false"
        class="qz-sheet-modal"
      >
        <div class="qz-modal-wrap">
          <header class="qz-modal-header">
            <div>
              <span class="qz-modal-tag">VISTA PREVIA DE HOJA</span>
              <h3 class="qz-modal-title" v-if="selectedStudent">
                {{ selectedStudent.lastName }} {{ selectedStudent.name }}
              </h3>
            </div>
            <div class="qz-modal-header-actions">
              <button
                type="button"
                class="qz-modal-action-btn"
                title="Descargar imagen PNG"
                @click="downloadSheet"
              >
                <ion-icon :icon="downloadOutline"></ion-icon>
                <span>Descargar</span>
              </button>
              <button
                type="button"
                class="qz-modal-close-btn"
                title="Cerrar"
                aria-label="Cerrar modal"
                @click="isModalOpen = false"
              >
                <ion-icon :icon="closeOutline"></ion-icon>
              </button>
            </div>
          </header>

          <div class="qz-modal-body">
            <!-- Selector de sección si son múltiples hojas -->
            <div class="qz-sheet-selector" v-if="sheets.length > 1">
              <button
                v-for="sheet in sheets"
                :key="sheet.index"
                type="button"
                class="qz-sheet-tab-btn"
                :class="{ 'is-active': selectedSheetIndex === sheet.index - 1 }"
                @click="selectedSheetIndex = sheet.index - 1"
              >
                Sec {{ sheet.index }}: {{ sheet.start }} - {{ sheet.end }}
              </button>
            </div>

            <div class="modal-sheet-wrapper" v-if="selectedStudent">
              <AnswerSheet
                ref="answerSheetRef"
                :student="selectedStudent"
                :course-name="courseName"
                :topic="topic"
                :sheet-index="selectedSheet.index"
                :start-number="selectedSheet.start"
                :question-count="selectedSheet.count"
                class="responsive-answer-sheet-modal"
              />
            </div>
          </div>
        </div>
      </ion-modal>

      <!-- MODAL DE BÚSQUEDA DE CUESTIONARIOS -->
      <ion-modal
        :is-open="isQuizSearchModalOpen"
        @didDismiss="isQuizSearchModalOpen = false"
        class="qz-quiz-search-modal"
      >
        <div class="qz-modal-wrap">
          <header class="qz-modal-header">
            <div>
              <span class="qz-modal-tag">BUSCAR CUESTIONARIO</span>
              <h3 class="qz-modal-title">Seleccionar Cuestionario</h3>
            </div>
            <button
              type="button"
              class="qz-modal-close-btn"
              title="Cerrar"
              aria-label="Cerrar modal"
              @click="isQuizSearchModalOpen = false"
            >
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </header>

          <div class="qz-modal-body">
            <!-- Filtros: Asignatura y Periodo -->
            <div class="qz-modal-filters-grid">
              <!-- Asignatura / Área -->
              <div class="qz-field-group">
                <label class="qz-field-label">Asignatura</label>
                <div class="qz-select-wrapper">
                  <ion-icon :icon="bookOutline" class="qz-field-icon"></ion-icon>
                  <ion-select
                    v-model="searchAreaId"
                    interface="popover"
                    class="qz-compact-select"
                    placeholder="Seleccionar asignatura"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    @ionChange="fetchLessonsAndQuizzes"
                  >
                    <ion-select-option v-for="area in availableAreas" :key="area.id" :value="area.id">
                      {{ area.name }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>

              <!-- Periodo -->
              <div class="qz-field-group">
                <label class="qz-field-label">Periodo</label>
                <div class="qz-select-wrapper">
                  <ion-icon :icon="calendarOutline" class="qz-field-icon"></ion-icon>
                  <ion-select
                    v-model="searchPeriodId"
                    interface="popover"
                    class="qz-compact-select"
                    placeholder="Seleccionar periodo"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    @ionChange="fetchLessonsAndQuizzes"
                  >
                    <ion-select-option v-for="period in availablePeriods" :key="period.id" :value="period.id">
                      {{ period.name }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>
            </div>

            <!-- Mensaje si faltan filtros -->
            <div v-if="!searchAreaId || !searchPeriodId" class="qz-state-card qz-sub-empty">
              <div class="qz-empty-icon">
                <ion-icon :icon="optionsOutline"></ion-icon>
              </div>
              <h4 class="qz-empty-title">Selecciona Asignatura y Periodo</h4>
              <p class="qz-state-text">
                Para consultar los cuestionarios disponibles del curso, selecciona primero la asignatura y el periodo.
              </p>
            </div>

            <!-- Estado de carga -->
            <div v-else-if="isLoadingQuizzes" class="qz-sub-loading">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <span>Consultando cuestionarios...</span>
            </div>

            <!-- Sin resultados -->
            <div v-else-if="groupedLessons.length === 0" class="qz-state-card qz-sub-empty">
              <div class="qz-empty-icon">
                <ion-icon :icon="documentTextOutline"></ion-icon>
              </div>
              <h4 class="qz-empty-title">Sin cuestionarios</h4>
              <p class="qz-state-text">
                No se encontraron cuestionarios para los filtros seleccionados.
              </p>
            </div>

            <!-- Acordeón de Lecciones y sus Cuestionarios -->
            <ion-accordion-group v-else class="qz-lessons-accordion-group">
              <ion-accordion
                v-for="lessonGroup in groupedLessons"
                :key="lessonGroup.lessonId"
                :value="'lesson-' + lessonGroup.lessonId"
                class="qz-lesson-accordion"
              >
                <!-- Cabecera de la Lección -->
                <div slot="header" class="qz-lesson-acc-header">
                  <div class="qz-acc-title-wrap">
                    <div class="qz-acc-icon">
                      <ion-icon :icon="bookOutline"></ion-icon>
                    </div>
                    <span class="qz-acc-lesson-topic">{{ lessonGroup.topic }}</span>
                  </div>
                  <span class="qz-acc-badge">
                    {{ lessonGroup.quizzes.length }} {{ lessonGroup.quizzes.length === 1 ? 'cuestionario' : 'cuestionarios' }}
                  </span>
                </div>

                <!-- Contenido: Lista de Cuestionarios de la Lección -->
                <div slot="content" class="qz-lesson-acc-content">
                  <div
                    v-for="quiz in lessonGroup.quizzes"
                    :key="quiz.id"
                    class="qz-quiz-select-item"
                    @click="selectQuiz(quiz)"
                  >
                    <div class="qz-quiz-info">
                      <h4 class="qz-quiz-title">{{ quiz.title }}</h4>
                      <div class="qz-quiz-meta">
                        <span v-if="quiz.questions && quiz.questions.length" class="qz-quiz-badge">
                          {{ quiz.questions.length }} preguntas
                        </span>
                        <span v-if="quiz.lesson?.area?.name" class="qz-quiz-badge qz-badge--area">
                          {{ quiz.lesson.area.name }}
                        </span>
                        <span v-if="quiz.lesson?.period?.name" class="qz-quiz-badge qz-badge--period">
                          {{ quiz.lesson.period.name }}
                        </span>
                      </div>
                    </div>
                    <button type="button" class="qz-pick-btn">
                      <span>Usar</span>
                      <ion-icon :icon="checkmarkOutline"></ion-icon>
                    </button>
                  </div>
                </div>
              </ion-accordion>
            </ion-accordion-group>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonIcon,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonAccordionGroup,
  IonAccordion,
  alertController,
  actionSheetController,
} from "@ionic/vue";
import {
  arrowBackOutline,
  printOutline,
  optionsOutline,
  helpCircleOutline,
  documentTextOutline,
  searchOutline,
  peopleOutline,
  personOutline,
  eyeOutline,
  downloadOutline,
  closeOutline,
  bookOutline,
  calendarOutline,
  checkmarkOutline,
} from "ionicons/icons";
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import AnswerSheet from "@/components/AnswerSheet.vue";
import {
  buildSheets,
  questionNumbers,
  MAX_QUESTIONS_PER_SHEET,
} from "@/answerSheetNumbers";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
import axios from "axios";
import { tokenHeader, usuarioGet } from "@/globalService";

export default {
  name: "PrintableStudentSheet",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonModal,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonAccordionGroup,
    IonAccordion,
    AnswerSheet,
  },
  setup() {
    const router = useRouter();
    const studentData = ref([]);
    const year = ref(null);
    const isModalOpen = ref(false);
    const selectedStudent = ref(null);
    const answerSheetRef = ref(null);
    const sheetsPerPage = ref(6);
    const totalQuestions = ref(20);
    const selectedSheetIndex = ref(0);
    const topic = ref("");
    const selectedCourseId = ref(null);

    // Modal de búsqueda de cuestionarios
    const isQuizSearchModalOpen = ref(false);
    const searchAreaId = ref(null);
    const searchPeriodId = ref(null);
    const availableAreas = ref([]);
    const availablePeriods = ref([]);
    const rawQuizzes = ref([]);
    const isLoadingQuizzes = ref(false);

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/papeleria");
      }
    };

    const courseName = computed(() => {
      if (!studentData.value || studentData.value.length === 0) return "";
      if (studentData.value.length === 1) return studentData.value[0]?.name || "";
      return "Institución";
    });

    const sheets = computed(() =>
      buildSheets(totalQuestions.value, MAX_QUESTIONS_PER_SHEET),
    );

    const selectedSheet = computed(
      () => sheets.value[selectedSheetIndex.value] || sheets.value[0],
    );

    const maxQuestionsPerSheet = MAX_QUESTIONS_PER_SHEET;

    onMounted(async () => {
      let data = window.history.state?.studentData;
      let yr = window.history.state?.year;
      let cId = window.history.state?.courseId;

      if (!data) {
        try {
          const stored = sessionStorage.getItem("pandora_printable_studentData");
          if (stored) data = JSON.parse(stored);
          const storedYear = sessionStorage.getItem("pandora_printable_year");
          if (storedYear) yr = parseInt(storedYear, 10);
          const storedCourseId = sessionStorage.getItem("pandora_printable_courseId");
          if (storedCourseId) cId = parseInt(storedCourseId, 10);
        } catch (e) {
          console.error("Error al leer sessionStorage en PrintableStudentSheet:", e);
        }
      }

      if (cId !== undefined && cId !== null && !isNaN(cId) && cId !== -1) {
        selectedCourseId.value = cId;
      } else if (data && data.length === 1 && data[0]?.id) {
        selectedCourseId.value = data[0].id;
      }

      if (data) {
        if (data[0] && data[0].students) {
          data[0].students.sort((a, b) => {
            const nameA = (a.lastName + " " + a.name).toLowerCase();
            const nameB = (b.lastName + " " + b.name).toLowerCase();
            return nameA.localeCompare(nameB);
          });
        }
        studentData.value = data;
        year.value = yr;
      }
    });

    // ─── Modal Cuestionarios: Carga y Agrupación ──────────────────────────

    const openQuizSearchModal = async () => {
      isQuizSearchModalOpen.value = true;
      rawQuizzes.value = [];
      await fetchFilters();
      if (searchAreaId.value && searchPeriodId.value) {
        await fetchLessonsAndQuizzes();
      }
    };

    const fetchFilters = async () => {
      try {
        const usuario = usuarioGet();
        const instId = usuario?.institute?.id;

        // Cargar periodos
        const perRes = await axios.get("/periods", tokenHeader());
        availablePeriods.value = perRes.data || [];

        // Cargar áreas del curso o generales
        let areasUrl = "/areas";
        const effectiveCourseId = selectedCourseId.value || (studentData.value?.length === 1 ? studentData.value[0]?.id : null);
        if (effectiveCourseId) {
          areasUrl = `/courses/${effectiveCourseId}/areas`;
        } else if (instId) {
          areasUrl = `/areas?instituteId=${instId}`;
        }
        const areaRes = await axios.get(areasUrl, tokenHeader());
        availableAreas.value = areaRes.data || [];
      } catch (error) {
        console.error("Error al cargar filtros para cuestionarios:", error);
      }
    };

    const fetchLessonsAndQuizzes = async () => {
      if (!searchAreaId.value || !searchPeriodId.value) {
        rawQuizzes.value = [];
        return;
      }
      isLoadingQuizzes.value = true;
      try {
        const usuario = usuarioGet();
        const instId = usuario?.institute?.id;
        const params = { exist: true };

        if (instId) params.instituteId = instId;
        if (year.value) params.year = year.value;
        const effectiveCourseId = selectedCourseId.value || (studentData.value?.length === 1 ? studentData.value[0]?.id : null);
        if (effectiveCourseId) {
          params.courseId = effectiveCourseId;
        }
        params.areaId = searchAreaId.value;
        params.periodId = searchPeriodId.value;

        const res = await axios.get("/quizzes", {
          ...tokenHeader(),
          params,
        });
        rawQuizzes.value = res.data || [];
      } catch (error) {
        console.error("Error al buscar cuestionarios:", error);
        rawQuizzes.value = [];
      } finally {
        isLoadingQuizzes.value = false;
      }
    };

    const groupedLessons = computed(() => {
      const groupsMap = new Map();
      rawQuizzes.value.forEach((quiz) => {
        const lesson = quiz.lesson;
        const lessonId = lesson?.id || 0;
        const topicName = lesson?.topic || "Sin Lección Asignada";

        if (!groupsMap.has(lessonId)) {
          groupsMap.set(lessonId, {
            lessonId,
            topic: topicName,
            quizzes: [],
          });
        }
        groupsMap.get(lessonId).quizzes.push(quiz);
      });
      return Array.from(groupsMap.values());
    });

    const selectQuiz = async (quiz) => {
      topic.value = quiz.title || "";
      isQuizSearchModalOpen.value = false;

      // 1. Si el quiz ya trae el arreglo de preguntas
      if (Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        totalQuestions.value = quiz.questions.length;
        return;
      }

      // 2. Si no trae las preguntas cargadas en la lista, consultamos sus detalles
      try {
        const res = await axios.get(`/quizzes/${quiz.id}`, tokenHeader());
        const fullQuiz = res.data;
        if (fullQuiz && Array.isArray(fullQuiz.questions) && fullQuiz.questions.length > 0) {
          totalQuestions.value = fullQuiz.questions.length;
        } else {
          // Intentar alternativa directa endpoint /questions?quizId=
          const qRes = await axios.get(`/questions?quizId=${quiz.id}`, tokenHeader());
          if (Array.isArray(qRes.data) && qRes.data.length > 0) {
            totalQuestions.value = qRes.data.length;
          }
        }
      } catch (err) {
        console.warn("No se pudieron cargar las preguntas del cuestionario:", err);
      }
    };

    // ─── Generador HTML para impresión y PDF ──────────────────────────────

    const generateSheetContentHTML = () => {
      const students = allStudents.value;
      const course = courseName.value || "";
      const currentTopic = topic.value || "";

      const newImageWidth = 3313;
      const newImageHeight = 4919;
      const sheetSpacing = 30;

      let scale = 0.0800;
      if (sheetsPerPage.value === 6) {
        scale = 0.0800;
      } else if (sheetsPerPage.value === 4) {
        scale = 0.1180;
      } else if (sheetsPerPage.value === 1) {
        scale = 0.2350;
      }

      const scaledWidth = newImageWidth * scale;
      const scaledHeight = newImageHeight * scale;

      const generateQuestionNumbers = (sheet) => {
        return questionNumbers(sheet.start, sheet.count)
          .map(
            (item) => `
              <div style="position: absolute; left: ${item.left}%; top: ${item.top}%;
                   width: ${item.width}%; height: ${item.height}%;
                   display: flex; align-items: center; justify-content: center;
                   font-size: ${item.fontSize}px; line-height: 1; font-weight: bold;
                   color: black; font-family: Arial, sans-serif;">
                ${item.value}
              </div>`
          )
          .join("");
      };

      const generateSheetCode = (student, sheet) => {
        const originalCode = student.code || "";
        const name = student.name || "";
        const lastName = student.lastName || "";

        const originalImageWidth = 3313;
        const originalImageHeight = 3520;

        const nameTopPercent = (60 / originalImageHeight) * 100;
        const nameLeftPercent = (600 / originalImageWidth) * 100;
        const nameWidthPercent = (2100 / originalImageWidth) * 100;
        const nameHeightPercent = (114 / originalImageHeight) * 100;
        const nameFontSizePx = 120;

        // Posicionamiento del Tema: justo en la mitad entre Nombre (60) y Grado (400)
        const topicTopPercent = (230 / originalImageHeight) * 100;
        const topicLeftPercent = (600 / originalImageWidth) * 100;
        const topicWidthPercent = (2100 / originalImageWidth) * 100;
        const topicHeightPercent = (110 / originalImageHeight) * 100;
        const topicFontSizePx = 110;

        const courseTopPercent = (400 / originalImageHeight) * 100;
        const courseLeftPercent = (600 / originalImageWidth) * 100;
        const courseWidthPercent = (1883 / originalImageWidth) * 100;
        const courseHeightPercent = (161 / originalImageHeight) * 100;
        const courseFontSizePx = 180;

        // Sección Sec {num} en la misma fila que el tema (extremo derecho)
        const sectionTopPercent = (230 / originalImageHeight) * 100;
        const sectionRightPercent = (120 / originalImageWidth) * 100;
        const sectionFontSizePx = 110;

        const digitsTopPercent = (850 / originalImageHeight) * 100;
        const digitsLeftPercent = (640 / originalImageWidth) * 100;
        const digitsWidthPercent = (1350 / originalImageWidth) * 100;
        const digitsHeightPercent = (95 / originalImageHeight) * 100;

        const matrixTopPercent = (980 / originalImageHeight) * 100;
        const matrixLeftPercent = (670 / originalImageWidth) * 100;
        const matrixWidthPercent = (1303 / originalImageWidth) * 100;
        const matrixHeightPercent = (950 / originalImageHeight) * 100;
        const matrixGapPx = 20;

        let formattedCode = String(originalCode).replace(/\D/g, "");
        formattedCode = formattedCode.padStart(10, "0").slice(0, 10);

        const matrix = Array.from({ length: 10 }, () => Array(10).fill(0));
        for (let col = 0; col < 10; col++) {
          const digit = parseInt(formattedCode[col], 10);
          if (!isNaN(digit)) {
            const rowIndex = digit === 0 ? 9 : digit - 1;
            if (rowIndex >= 0 && rowIndex < 10) {
              matrix[rowIndex][col] = 1;
            }
          }
        }

        let cellsHTML = "";
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            const filled =
              matrix[r][c] === 1
                ? "background: black; border-radius: 50%;"
                : "";
            cellsHTML += `<div class="grid-cell" style="width: 100%; height: 100%; box-sizing: border-box; ${filled}"></div>`;
          }
        }

        const domain = window.location.origin;

        return `
      <div class="image-wrapper">
        <img src="${domain}/hoja50.jpg" crossorigin="anonymous" alt="Hoja OMR" style="display: block; width: 100%; height: 100%;" />
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;">
          
          <!-- Nombre del Estudiante -->
          <div style="position: absolute; left: ${nameLeftPercent}%; top: ${nameTopPercent}%; width: ${nameWidthPercent}%; height: ${nameHeightPercent}%;
               font-size: ${nameFontSizePx}px; line-height: 1; color: black; font-family: Arial, sans-serif;
               white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center;">
            ${lastName} ${name}
          </div>

          <!-- Tema (Opcional, en la mitad entre nombre y curso) -->
          ${
            currentTopic
              ? `
            <div style="position: absolute; left: ${topicLeftPercent}%; top: ${topicTopPercent}%; width: ${topicWidthPercent}%; height: ${topicHeightPercent}%;
                 font-size: ${topicFontSizePx}px; line-height: 1; color: black; font-family: Arial, sans-serif;
                 white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center;">
              ${currentTopic}
            </div>
          `
              : ""
          }

          <!-- Nombre del Curso -->
          ${
            course
              ? `
            <div style="position: absolute; left: ${courseLeftPercent}%; top: ${courseTopPercent}%; width: ${courseWidthPercent}%; height: ${courseHeightPercent}%;
                 font-size: ${courseFontSizePx}px; line-height: 1; color: black; font-family: Arial, sans-serif;
                 white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center;">
              ${course}
            </div>
          `
              : ""
          }

          <!-- Número de Sección (Extremo Superior Derecho) -->
          <div style="position: absolute; right: ${sectionRightPercent}%; top: ${sectionTopPercent}%;
               font-size: ${sectionFontSizePx}px; line-height: 1; font-weight: bold; color: black; font-family: Arial, sans-serif;
               white-space: nowrap; display: flex; align-items: center;">
            Sec ${sheet.index}
          </div>

          <!-- Dígitos del Código -->
          <div style="position: absolute; left: ${digitsLeftPercent}%; top: ${digitsTopPercent}%; width: ${digitsWidthPercent}%; height: ${digitsHeightPercent}%;
                      display: flex; align-items: center; justify-content: space-between;">
             ${
               formattedCode
                 ? formattedCode
                     .split("")
                     .map(
                       (digit) => `
                <div style="flex: 1; height: 100%; 
                            display: flex; align-items: center; justify-content: center;
                            font-size: 150px; font-weight: bold; color: black; font-family: Arial, sans-serif; line-height: 1;">
                  ${digit}
                </div>`
                     )
                     .join("")
                 : ""
             }
          </div>
        </div>

        <!-- Matriz de Burbujas -->
        <div style="position: absolute; left: ${matrixLeftPercent}%; top: ${matrixTopPercent}%; width: ${matrixWidthPercent}%; height: ${matrixHeightPercent}%;
             display: grid; grid-template-columns: repeat(10, 1fr); grid-template-rows: repeat(10, 1fr);
             gap: ${matrixGapPx}px; z-index: 50; pointer-events: none;">
          ${cellsHTML}
        </div>

        <!-- Números de pregunta -->
        ${generateQuestionNumbers(sheet)}
      </div>
    `;
      };

      const perPage = sheetsPerPage.value;
      const sheetUnits = [];
      students.forEach((student) => {
        sheets.value.forEach((sheet) => {
          sheetUnits.push({ student, sheet });
        });
      });

      let pagesHTML = "";
      for (let i = 0; i < sheetUnits.length; i += perPage) {
        const pageUnits = sheetUnits.slice(i, i + perPage);
        let sheetsHTML = "";

        pageUnits.forEach(({ student, sheet }) => {
          sheetsHTML += `
        <div class="grid-item">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: ${scaledWidth}px; height: ${scaledHeight}px; position: relative; overflow: hidden; box-sizing: border-box;">
              ${generateSheetCode(student, sheet)}
            </div>
            <div style="width: ${scaledWidth}px; height: 1px; border-top: 1px dashed black; margin-top: 5px;"></div>
          </div>
        </div>
      `;
        });

        pagesHTML += `
      <div class="print-page">
        <div class="grid-container">
          ${sheetsHTML}
        </div>
      </div>
    `;
      }
      return {
        pagesHTML,
        newImageHeight,
        newImageWidth,
        scale,
        sheetSpacing,
      };
    };

    const generateStyles = (newImageWidth, newImageHeight, scale, sheetSpacing) => {
      return `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        @page {
          size: legal;
          margin: 0;
          padding-top: 3mm;
        }
        
        .print-page {
          page-break-after: always;
          width: 216mm;
          height: 330mm;
          overflow: hidden;
          position: relative;
        }
        
        .print-page:last-child {
          page-break-after: auto;
        }
        
        .grid-container {
          display: grid;
          row-gap: ${sheetSpacing}px;
          column-gap: 0;
          padding: 0;
          grid-template-columns: ${
            sheetsPerPage.value === 1 ? "1fr" : "repeat(2, 1fr)"
          };
          grid-template-rows: ${
            sheetsPerPage.value === 6
              ? "repeat(3, 1fr)"
              : sheetsPerPage.value === 4
              ? "repeat(2, 1fr)"
              : "1fr"
          };
          width: 100%;
          height: 100%;
        }
        
        .grid-item {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .student-code-digit-text {
          font-size: 180px;
        }

       .image-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: ${newImageWidth}px;
          height: ${newImageHeight}px;
          user-select: none;
          transform: scale(${scale});
          transform-origin: top left;
          overflow: hidden;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .student-code-digit-text {
            font-size: 180px;
          }
        }
      `;
    };

    const generatePrintHTML = () => {
      const { pagesHTML, newImageWidth, newImageHeight, scale, sheetSpacing } =
        generateSheetContentHTML();
      const css = generateStyles(newImageWidth, newImageHeight, scale, sheetSpacing);

      return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hojas de Respuesta</title>
      <style>${css}</style>
    </head>
    <body>
      ${pagesHTML}
    </body>
    </html>
  `;
    };

    const processPDF = async (action) => {
      const getBase64ImageFromUrl = async (imageUrl) => {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const domain = window.location.origin;
      const bgImageBase64 = await getBase64ImageFromUrl(`${domain}/hoja50.jpg`);

      let { pagesHTML, newImageWidth, newImageHeight, scale, sheetSpacing } =
        generateSheetContentHTML();

      const originalSrcRegex = new RegExp(`${domain}/hoja50\\.jpg`, "g");
      const relativeSrcRegex = /src="\/hoja50\.jpg"/g;
      pagesHTML = pagesHTML.replace(originalSrcRegex, bgImageBase64);
      pagesHTML = pagesHTML.replace(relativeSrcRegex, `src="${bgImageBase64}"`);

      const css = generateStyles(newImageWidth, newImageHeight, scale, sheetSpacing);

      const tempContainer = document.createElement("div");
      tempContainer.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
      tempContainer.innerHTML = pagesHTML;
      document.body.appendChild(tempContainer);

      const pageNodes = Array.from(tempContainer.querySelectorAll(".print-page"));

      const isNative = Capacitor.isNativePlatform();
      const canvasScale = isNative ? 1 : 2;

      const h2cOptions = {
        scale: canvasScale,
        useCORS: true,
        logging: false,
        allowTaint: false,
      };

      const { jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const pdf = new jsPDF({ unit: "mm", format: "legal", orientation: "portrait" });
      const pageWidthMm = 215.9;
      const pageHeightMm = 355.6;

      for (let i = 0; i < pageNodes.length; i++) {
        const node = pageNodes[i];
        const styleEl = document.createElement("style");
        styleEl.textContent = css;
        node.prepend(styleEl);

        const canvas = await html2canvas(node, h2cOptions);
        const imgData = canvas.toDataURL("image/jpeg", isNative ? 0.85 : 0.98);

        if (i > 0) pdf.addPage("legal", "portrait");
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");

        canvas.width = 0;
        canvas.height = 0;
        await new Promise((r) => setTimeout(r, 50));
      }

      document.body.removeChild(tempContainer);

      if (action === "save") {
        pdf.save("hojas_respuesta.pdf");
      } else if (action === "base64") {
        return "data:application/pdf;base64," + pdf.output("datauristring").split(",")[1];
      }
    };

    const presentOutputOptions = async () => {
      if (Capacitor.isNativePlatform()) {
        const loading = await alertController.create({
          header: "Generando PDF",
          message:
            "Por favor espere mientras se genera el archivo para imprimir...",
          backdropDismiss: false,
        });
        await loading.present();

        try {
          const pdfDataUri = await processPDF("base64");
          const base64Data = pdfDataUri.split(",")[1];
          const filename = `hojas_respuesta_${Date.now()}.pdf`;

          await FileSharer.share({
            filename: filename,
            contentType: "application/pdf",
            base64Data: base64Data,
          });
        } catch (error) {
          const msg = (error?.message || "").toLowerCase();
          const isCancel =
            msg.includes("cancelled") ||
            msg.includes("user_cancelled") ||
            msg.includes("dismiss") ||
            msg.includes("user back") ||
            msg.includes("back button");

          if (!isCancel) {
            console.error("Error generating/sharing PDF:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al generar o compartir el archivo.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        } finally {
          await loading.dismiss();
        }
      } else {
        const actionSheet = await actionSheetController.create({
          header: "Opciones de Impresión",
          buttons: [
            {
              text: "Imprimir / Vista Previa",
              icon: printOutline,
              handler: () => {
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                  printWindow.document.write(generatePrintHTML());
                  printWindow.document.close();
                  printWindow.onload = () => {
                    setTimeout(() => {
                      printWindow.focus();
                    }, 500);
                  };
                }
              },
            },
            {
              text: "Descargar PDF",
              handler: async () => {
                const loading = await alertController.create({
                  header: "Generando PDF",
                  message: "Espere mientras se descarga el archivo...",
                  backdropDismiss: false,
                });
                await loading.present();
                try {
                  await processPDF("save");
                } catch (e) {
                  console.error("Error downloading PDF", e);
                  const errorAlert = await alertController.create({
                    header: "Error",
                    message: "Hubo un error al descargar el PDF.",
                    buttons: ["OK"],
                  });
                  await errorAlert.present();
                } finally {
                  await loading.dismiss();
                }
              },
            },
            {
              text: "Cancelar",
              role: "cancel",
            },
          ],
        });
        await actionSheet.present();
      }
    };

    const printSheets = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Seleccione formato por página",
        buttons: [
          {
            text: "6 por página",
            handler: () => {
              sheetsPerPage.value = 6;
              presentOutputOptions();
            },
          },
          {
            text: "4 por página",
            handler: () => {
              sheetsPerPage.value = 4;
              presentOutputOptions();
            },
          },
          {
            text: "1 por página",
            handler: () => {
              sheetsPerPage.value = 1;
              presentOutputOptions();
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await actionSheet.present();
    };

    const allStudents = computed(() => {
      if (!studentData.value || studentData.value.length === 0) return [];
      if (studentData.value.length === 1) return studentData.value[0]?.students || [];
      return studentData.value.flatMap((c) =>
        (c.students || []).map((s) => ({ ...s, courseName: c.name }))
      );
    });

    const openStudentSheetModal = (student) => {
      selectedStudent.value = student;
      isModalOpen.value = true;
    };

    const downloadSheet = async () => {
      const componentInstance = answerSheetRef.value;
      if (!componentInstance) return;

      const imgSrc = componentInstance.generatedImageSrc;

      if (!imgSrc) {
        const alert = await alertController.create({
          header: "Espere un momento",
          message:
            "La imagen se está generando. Por favor intente nuevamente en unos segundos.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      const filename = `hoja_respuesta_${selectedStudent.value.code}_${
        selectedSheet.value.start
      }-${selectedSheet.value.end}.png`;

      if (Capacitor.isNativePlatform()) {
        const nativeLoading = await alertController.create({
          header: "Generando Hoja de Respuesta",
          message: "Por favor espere...",
          backdropDismiss: false,
        });
        try {
          const base64Data = imgSrc.split(",")[1];
          await FileSharer.share({
            filename: filename,
            contentType: "image/png",
            base64Data: base64Data,
          });
        } catch (e) {
          const msg = (e?.message || "").toLowerCase();
          const isCancel =
            msg.includes("cancelled") ||
            msg.includes("user_cancelled") ||
            msg.includes("dismiss") ||
            msg.includes("user back") ||
            msg.includes("back button");

          if (!isCancel) {
            console.error("Error sharing student sheet:", e);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un problema al compartir la hoja.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        } finally {
          await nativeLoading.dismiss();
        }
      } else {
        const link = document.createElement("a");
        link.download = filename;
        link.href = imgSrc;
        link.click();
      }
    };

    return {
      allStudents,
      year,
      courseName,
      topic,
      printSheets,
      printOutline,
      optionsOutline,
      helpCircleOutline,
      documentTextOutline,
      searchOutline,
      peopleOutline,
      personOutline,
      eyeOutline,
      downloadOutline,
      closeOutline,
      arrowBackOutline,
      bookOutline,
      calendarOutline,
      checkmarkOutline,
      isModalOpen,
      selectedStudent,
      openStudentSheetModal,
      answerSheetRef,
      downloadSheet,
      sheetsPerPage,
      totalQuestions,
      maxQuestionsPerSheet,
      sheets,
      selectedSheet,
      selectedSheetIndex,
      goBack,
      isQuizSearchModalOpen,
      openQuizSearchModal,
      searchAreaId,
      searchPeriodId,
      availableAreas,
      availablePeriods,
      isLoadingQuizzes,
      fetchLessonsAndQuizzes,
      groupedLessons,
      selectQuiz,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: HOJAS DE RESPUESTA OMR
   ========================================================================== */

.qz-print-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-print-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-print-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
  padding-bottom: 70px;
}

/* 1. CABECERA HERO PÚRPURA QUEEZY */
.qz-hero-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  padding: max(20px, env(safe-area-inset-top)) 20px 26px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.2);
}

.qz-hero-inner {
  max-width: 820px;
  margin: 0 auto;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.qz-back-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: all 0.2s ease;
}

.qz-back-btn:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.9px;
  padding: 5px 12px;
  border-radius: 9999px;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}

.qz-hero-title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.qz-hero-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.qz-hero-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
}

.qz-hero-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.qz-hero-action-btn:hover {
  background: rgba(255, 255, 255, 0.32);
  transform: translateY(-1px);
}

/* 2. CUERPO PRINCIPAL */
.qz-print-body {
  padding: 20px 16px 24px;
  max-width: 820px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 18px 20px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 6px 18px rgba(12, 9, 42, 0.05);
  box-sizing: border-box;
}

/* TARJETA CONFIGURACIÓN */
.qz-config-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-card-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qz-card-icon-squircle {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-icon--purple {
  background-color: #efeefc;
  color: #6a5ae0;
}

.qz-config-title {
  margin: 0;
  font-size: 16.5px;
  font-weight: 800;
  color: #0c092a;
}

.qz-config-subtitle {
  margin: 2px 0 0;
  font-size: 12.5px;
  font-weight: 500;
  color: #858494;
}

.qz-config-form-grid {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.qz-field-grow {
  flex: 1;
  min-width: 260px;
}

.qz-field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-field-label {
  font-size: 11px;
  font-weight: 700;
  color: #6a5ae0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qz-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: #6a5ae0;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.qz-link-btn:hover {
  text-decoration: underline;
}

.qz-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.15);
  border-radius: 14px;
  height: 44px;
  padding: 0 12px 0 38px;
  box-sizing: border-box;
}

.qz-field-icon {
  position: absolute;
  left: 12px;
  font-size: 17px;
  color: #6a5ae0;
  pointer-events: none;
}

.qz-number-input,
.qz-text-input {
  width: 100%;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #0c092a;
  outline: none;
}

.qz-clear-btn {
  border: none;
  background: rgba(106, 90, 224, 0.12);
  color: #6a5ae0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

/* CÁLCULO RESUMEN */
.qz-calc-summary {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #f8f7ff;
  border-radius: 14px;
  padding: 12px 14px;
  border: 1px dashed rgba(106, 90, 224, 0.2);
  flex-wrap: wrap;
  gap: 8px;
}

.qz-calc-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.qz-calc-label {
  font-size: 11px;
  font-weight: 600;
  color: #858494;
}

.qz-calc-value {
  font-size: 16px;
  font-weight: 800;
  color: #0c092a;
}

.qz-calc-highlight .qz-calc-label {
  color: #6a5ae0;
}

.qz-calc-highlight .qz-calc-value {
  color: #6a5ae0;
}

.qz-calc-divider {
  width: 1px;
  height: 28px;
  background: rgba(106, 90, 224, 0.15);
}

.qz-sections-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.qz-section-pill {
  font-size: 11.5px;
  font-weight: 700;
  color: #6a5ae0;
  background: #efeefc;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid rgba(106, 90, 224, 0.15);
}

/* LISTA DE ESTUDIANTES */
.qz-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 0;
}

.qz-list-title {
  font-size: 12px;
  font-weight: 800;
  color: #6a5ae0;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.qz-count-pill {
  background: #ffffff;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 9999px;
  border: 1px solid rgba(106, 90, 224, 0.16);
}

.qz-students-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-student-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-student-card:hover {
  transform: translateY(-1px);
  border-color: rgba(106, 90, 224, 0.32);
  box-shadow: 0 8px 20px rgba(106, 90, 224, 0.09);
}

.qz-student-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.qz-student-info {
  min-width: 0;
}

.qz-student-name {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  color: #0c092a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-student-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-size: 11.5px;
  color: #858494;
}

.qz-student-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: #6a5ae0;
}

.qz-student-course {
  background: #f4f3fd;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 600;
}

.qz-view-sheet-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(106, 90, 224, 0.2);
  background: #efeefc;
  color: #6a5ae0;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.qz-view-sheet-btn:hover {
  background: #6a5ae0;
  color: #ffffff;
}

/* ESTADO VACÍO */
.qz-state-card {
  padding: 36px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.qz-empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.qz-empty-title {
  margin: 4px 0 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
}

.qz-state-text {
  margin: 0;
  font-size: 13.5px;
  color: #858494;
  max-width: 440px;
}

.qz-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  padding: 0 20px;
  border: none;
  border-radius: 13px;
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  color: #ffffff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(106, 90, 224, 0.28);
  transition: all 0.2s ease;
}

.qz-primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(106, 90, 224, 0.36);
}

/* MODALES */
.qz-sheet-modal,
.qz-quiz-search-modal {
  --background: var(--qz-color-purple-bg, #efeefc);
}

.qz-modal-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  color: #ffffff;
}

.qz-modal-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 3px 10px;
  border-radius: 9999px;
  margin-bottom: 4px;
}

.qz-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #ffffff;
}

.qz-modal-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-modal-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: all 0.2s ease;
}

.qz-modal-action-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

.qz-modal-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.qz-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-sheet-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.qz-sheet-tab-btn {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1.5px solid rgba(106, 90, 224, 0.2);
  background: #ffffff;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-sheet-tab-btn.is-active {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
}

.modal-sheet-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.responsive-answer-sheet-modal {
  width: 90%;
  max-width: 480px;
  height: auto;
}

/* FILTROS MODAL BÚSQUEDA */
.qz-modal-filters-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  background: #ffffff;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(106, 90, 224, 0.12);
}

@media (max-width: 520px) {
  .qz-modal-filters-grid {
    grid-template-columns: 1fr;
  }
}

.qz-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.15);
  border-radius: 12px;
  height: 42px;
  width: 100%;
  padding: 0 10px 0 36px;
  box-sizing: border-box;
}

.qz-compact-select {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  --padding-start: 0;
  --padding-end: 0;
  font-size: 13px;
  font-weight: 600;
  color: #0c092a;
}

.qz-sub-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  color: #858494;
  font-size: 13.5px;
  font-weight: 600;
}

/* ACORDEONES QUEEZY */
.qz-lessons-accordion-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-lesson-accordion {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(106, 90, 224, 0.12);
}

.qz-lesson-acc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  background: #ffffff;
  cursor: pointer;
}

.qz-acc-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.qz-acc-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.qz-acc-lesson-topic {
  font-size: 14px;
  font-weight: 700;
  color: #0c092a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-acc-badge {
  font-size: 11px;
  font-weight: 700;
  color: #6a5ae0;
  background: #efeefc;
  padding: 3px 8px;
  border-radius: 9999px;
  white-space: nowrap;
}

.qz-lesson-acc-content {
  padding: 10px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #faf9fe;
}

.qz-quiz-select-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #ffffff;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(106, 90, 224, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-quiz-select-item:hover {
  border-color: #6a5ae0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.1);
}

.qz-quiz-info {
  min-width: 0;
  flex: 1;
}

.qz-quiz-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #0c092a;
}

.qz-quiz-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.qz-quiz-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  background: #efeefc;
  color: #6a5ae0;
}

.qz-badge--area {
  background: #e8f9fe;
  color: #0284c7;
}

.qz-badge--period {
  background: #fff6e7;
  color: #d97706;
}

.qz-pick-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #6a5ae0;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-print-page,
  body:not(.light) .qz-print-content,
  body:not(.light) .qz-sheet-modal,
  body:not(.light) .qz-quiz-search-modal,
  body:not(.light) .qz-modal-wrap {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-hero-header,
  body:not(.light) .qz-modal-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  }

  body:not(.light) .qz-hero-tag,
  body:not(.light) .qz-modal-tag {
    background: rgba(255, 255, 255, 0.12);
    color: #b5a9ff;
    border: 1px solid rgba(181, 169, 255, 0.28);
  }

  body:not(.light) .qz-card,
  body:not(.light) .qz-modal-filters-grid,
  body:not(.light) .qz-lesson-accordion,
  body:not(.light) .qz-lesson-acc-header,
  body:not(.light) .qz-quiz-select-item {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }

  body:not(.light) .qz-card:hover,
  body:not(.light) .qz-student-card:hover {
    border-color: #7c6ef2;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55);
  }

  body:not(.light) .qz-config-title,
  body:not(.light) .qz-student-name,
  body:not(.light) .qz-calc-value,
  body:not(.light) .qz-empty-title,
  body:not(.light) .qz-acc-lesson-topic,
  body:not(.light) .qz-quiz-title,
  body:not(.light) .qz-number-input,
  body:not(.light) .qz-text-input,
  body:not(.light) .qz-compact-select {
    color: #f7f7fd;
  }

  body:not(.light) .qz-field-label,
  body:not(.light) .qz-field-icon,
  body:not(.light) .qz-link-btn,
  body:not(.light) .qz-student-code,
  body:not(.light) .qz-list-title,
  body:not(.light) .qz-calc-highlight .qz-calc-value,
  body:not(.light) .qz-calc-highlight .qz-calc-label {
    color: #b5a9ff;
  }

  body:not(.light) .qz-input-wrapper,
  body:not(.light) .qz-select-wrapper {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.12);
  }

  body:not(.light) .qz-calc-summary,
  body:not(.light) .qz-lesson-acc-content {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.08);
  }

  body:not(.light) .qz-count-pill,
  body:not(.light) .qz-empty-icon,
  body:not(.light) .qz-icon--purple,
  body:not(.light) .qz-acc-icon,
  body:not(.light) .qz-acc-badge,
  body:not(.light) .qz-quiz-badge {
    background: #2b2254;
    color: #b5a9ff;
  }

  body:not(.light) .qz-view-sheet-btn,
  body:not(.light) .qz-section-pill,
  body:not(.light) .qz-sheet-tab-btn {
    background: #2b2254;
    color: #b5a9ff;
    border-color: rgba(181, 169, 255, 0.2);
  }

  body:not(.light) .qz-sheet-tab-btn.is-active {
    background: #7c6ef2;
    color: #ffffff;
  }

  body:not(.light) .qz-student-course {
    background: #241d42;
    color: #b5a9ff;
  }

  body:not(.light) .qz-badge--area {
    background: rgba(112, 214, 245, 0.16);
    color: #70d6f5;
  }

  body:not(.light) .qz-badge--period {
    background: rgba(251, 191, 36, 0.16);
    color: #fbbf24;
  }

  body:not(.light) .qz-config-subtitle,
  body:not(.light) .qz-calc-label,
  body:not(.light) .qz-student-meta,
  body:not(.light) .qz-state-text,
  body:not(.light) .qz-sub-loading {
    color: #9e9bb8;
  }
}

:global(body.dark) .qz-print-page,
:global(body.dark) .qz-print-content,
:global(body.dark) .qz-sheet-modal,
:global(body.dark) .qz-quiz-search-modal,
:global(body.dark) .qz-modal-wrap,
:global(html.dark) .qz-print-page,
:global(html.dark) .qz-print-content,
:global(html.dark) .qz-sheet-modal,
:global(html.dark) .qz-quiz-search-modal,
:global(html.dark) .qz-modal-wrap,
:global(.dark) .qz-print-page,
:global(.dark) .qz-print-content,
:global(.dark) .qz-sheet-modal,
:global(.dark) .qz-quiz-search-modal,
:global(.dark) .qz-modal-wrap,
:global(:root[data-theme="dark"]) .qz-print-page,
:global(:root[data-theme="dark"]) .qz-print-content,
:global(:root[data-theme="dark"]) .qz-sheet-modal,
:global(:root[data-theme="dark"]) .qz-quiz-search-modal,
:global(:root[data-theme="dark"]) .qz-modal-wrap {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(body.dark) .qz-modal-header,
:global(html.dark) .qz-hero-header,
:global(html.dark) .qz-modal-header,
:global(.dark) .qz-hero-header,
:global(.dark) .qz-modal-header,
:global(:root[data-theme="dark"]) .qz-hero-header,
:global(:root[data-theme="dark"]) .qz-modal-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
}

:global(body.dark) .qz-hero-tag,
:global(body.dark) .qz-modal-tag,
:global(html.dark) .qz-hero-tag,
:global(html.dark) .qz-modal-tag,
:global(.dark) .qz-hero-tag,
:global(.dark) .qz-modal-tag,
:global(:root[data-theme="dark"]) .qz-hero-tag,
:global(:root[data-theme="dark"]) .qz-modal-tag {
  background: rgba(255, 255, 255, 0.12);
  color: #b5a9ff;
  border: 1px solid rgba(181, 169, 255, 0.28);
}

:global(body.dark) .qz-card,
:global(body.dark) .qz-modal-filters-grid,
:global(body.dark) .qz-lesson-accordion,
:global(body.dark) .qz-lesson-acc-header,
:global(body.dark) .qz-quiz-select-item,
:global(html.dark) .qz-card,
:global(html.dark) .qz-modal-filters-grid,
:global(html.dark) .qz-lesson-accordion,
:global(html.dark) .qz-lesson-acc-header,
:global(html.dark) .qz-quiz-select-item,
:global(.dark) .qz-card,
:global(.dark) .qz-modal-filters-grid,
:global(.dark) .qz-lesson-accordion,
:global(.dark) .qz-lesson-acc-header,
:global(.dark) .qz-quiz-select-item,
:global(:root[data-theme="dark"]) .qz-card,
:global(:root[data-theme="dark"]) .qz-modal-filters-grid,
:global(:root[data-theme="dark"]) .qz-lesson-accordion,
:global(:root[data-theme="dark"]) .qz-lesson-acc-header,
:global(:root[data-theme="dark"]) .qz-quiz-select-item {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-config-title,
:global(body.dark) .qz-student-name,
:global(body.dark) .qz-calc-value,
:global(body.dark) .qz-empty-title,
:global(body.dark) .qz-acc-lesson-topic,
:global(body.dark) .qz-quiz-title,
:global(body.dark) .qz-number-input,
:global(body.dark) .qz-text-input,
:global(body.dark) .qz-compact-select,
:global(html.dark) .qz-config-title,
:global(html.dark) .qz-student-name,
:global(html.dark) .qz-calc-value,
:global(html.dark) .qz-empty-title,
:global(html.dark) .qz-acc-lesson-topic,
:global(html.dark) .qz-quiz-title,
:global(html.dark) .qz-number-input,
:global(html.dark) .qz-text-input,
:global(html.dark) .qz-compact-select,
:global(.dark) .qz-config-title,
:global(.dark) .qz-student-name,
:global(.dark) .qz-calc-value,
:global(.dark) .qz-empty-title,
:global(.dark) .qz-acc-lesson-topic,
:global(.dark) .qz-quiz-title,
:global(.dark) .qz-number-input,
:global(.dark) .qz-text-input,
:global(.dark) .qz-compact-select,
:global(:root[data-theme="dark"]) .qz-config-title,
:global(:root[data-theme="dark"]) .qz-student-name,
:global(:root[data-theme="dark"]) .qz-calc-value,
:global(:root[data-theme="dark"]) .qz-empty-title,
:global(:root[data-theme="dark"]) .qz-acc-lesson-topic,
:global(:root[data-theme="dark"]) .qz-quiz-title,
:global(:root[data-theme="dark"]) .qz-number-input,
:global(:root[data-theme="dark"]) .qz-text-input,
:global(:root[data-theme="dark"]) .qz-compact-select {
  color: #f7f7fd;
}

:global(body.dark) .qz-field-label,
:global(body.dark) .qz-field-icon,
:global(body.dark) .qz-link-btn,
:global(body.dark) .qz-student-code,
:global(body.dark) .qz-list-title,
:global(body.dark) .qz-calc-highlight .qz-calc-value,
:global(body.dark) .qz-calc-highlight .qz-calc-label,
:global(html.dark) .qz-field-label,
:global(html.dark) .qz-field-icon,
:global(html.dark) .qz-link-btn,
:global(html.dark) .qz-student-code,
:global(html.dark) .qz-list-title,
:global(html.dark) .qz-calc-highlight .qz-calc-value,
:global(html.dark) .qz-calc-highlight .qz-calc-label,
:global(.dark) .qz-field-label,
:global(.dark) .qz-field-icon,
:global(.dark) .qz-link-btn,
:global(.dark) .qz-student-code,
:global(.dark) .qz-list-title,
:global(.dark) .qz-calc-highlight .qz-calc-value,
:global(.dark) .qz-calc-highlight .qz-calc-label,
:global(:root[data-theme="dark"]) .qz-field-label,
:global(:root[data-theme="dark"]) .qz-field-icon,
:global(:root[data-theme="dark"]) .qz-link-btn,
:global(:root[data-theme="dark"]) .qz-student-code,
:global(:root[data-theme="dark"]) .qz-list-title,
:global(:root[data-theme="dark"]) .qz-calc-highlight .qz-calc-value,
:global(:root[data-theme="dark"]) .qz-calc-highlight .qz-calc-label {
  color: #b5a9ff;
}

:global(body.dark) .qz-input-wrapper,
:global(body.dark) .qz-select-wrapper,
:global(html.dark) .qz-input-wrapper,
:global(html.dark) .qz-select-wrapper,
:global(.dark) .qz-input-wrapper,
:global(.dark) .qz-select-wrapper,
:global(:root[data-theme="dark"]) .qz-input-wrapper,
:global(:root[data-theme="dark"]) .qz-select-wrapper {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-calc-summary,
:global(body.dark) .qz-lesson-acc-content,
:global(html.dark) .qz-calc-summary,
:global(html.dark) .qz-lesson-acc-content,
:global(.dark) .qz-calc-summary,
:global(.dark) .qz-lesson-acc-content,
:global(:root[data-theme="dark"]) .qz-calc-summary,
:global(:root[data-theme="dark"]) .qz-lesson-acc-content {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-count-pill,
:global(body.dark) .qz-empty-icon,
:global(body.dark) .qz-icon--purple,
:global(body.dark) .qz-acc-icon,
:global(body.dark) .qz-acc-badge,
:global(body.dark) .qz-quiz-badge,
:global(html.dark) .qz-count-pill,
:global(html.dark) .qz-empty-icon,
:global(html.dark) .qz-icon--purple,
:global(html.dark) .qz-acc-icon,
:global(html.dark) .qz-acc-badge,
:global(html.dark) .qz-quiz-badge,
:global(.dark) .qz-count-pill,
:global(.dark) .qz-empty-icon,
:global(.dark) .qz-icon--purple,
:global(.dark) .qz-acc-icon,
:global(.dark) .qz-acc-badge,
:global(.dark) .qz-quiz-badge,
:global(:root[data-theme="dark"]) .qz-count-pill,
:global(:root[data-theme="dark"]) .qz-empty-icon,
:global(:root[data-theme="dark"]) .qz-icon--purple,
:global(:root[data-theme="dark"]) .qz-acc-icon,
:global(:root[data-theme="dark"]) .qz-acc-badge,
:global(:root[data-theme="dark"]) .qz-quiz-badge {
  background: #2b2254;
  color: #b5a9ff;
}

:global(body.dark) .qz-view-sheet-btn,
:global(body.dark) .qz-section-pill,
:global(body.dark) .qz-sheet-tab-btn,
:global(html.dark) .qz-view-sheet-btn,
:global(html.dark) .qz-section-pill,
:global(html.dark) .qz-sheet-tab-btn,
:global(.dark) .qz-view-sheet-btn,
:global(.dark) .qz-section-pill,
:global(.dark) .qz-sheet-tab-btn,
:global(:root[data-theme="dark"]) .qz-view-sheet-btn,
:global(:root[data-theme="dark"]) .qz-section-pill,
:global(:root[data-theme="dark"]) .qz-sheet-tab-btn {
  background: #2b2254;
  color: #b5a9ff;
  border-color: rgba(181, 169, 255, 0.2);
}

:global(body.dark) .qz-sheet-tab-btn.is-active,
:global(html.dark) .qz-sheet-tab-btn.is-active,
:global(.dark) .qz-sheet-tab-btn.is-active,
:global(:root[data-theme="dark"]) .qz-sheet-tab-btn.is-active {
  background: #7c6ef2;
  color: #ffffff;
}

:global(body.dark) .qz-student-course,
:global(html.dark) .qz-student-course,
:global(.dark) .qz-student-course,
:global(:root[data-theme="dark"]) .qz-student-course {
  background: #241d42;
  color: #b5a9ff;
}

:global(body.dark) .qz-badge--area,
:global(html.dark) .qz-badge--area,
:global(.dark) .qz-badge--area,
:global(:root[data-theme="dark"]) .qz-badge--area {
  background: rgba(112, 214, 245, 0.16);
  color: #70d6f5;
}

:global(body.dark) .qz-badge--period,
:global(html.dark) .qz-badge--period,
:global(.dark) .qz-badge--period,
:global(:root[data-theme="dark"]) .qz-badge--period {
  background: rgba(251, 191, 36, 0.16);
  color: #fbbf24;
}

:global(body.dark) .qz-config-subtitle,
:global(body.dark) .qz-calc-label,
:global(body.dark) .qz-student-meta,
:global(body.dark) .qz-state-text,
:global(body.dark) .qz-sub-loading,
:global(html.dark) .qz-config-subtitle,
:global(html.dark) .qz-calc-label,
:global(html.dark) .qz-student-meta,
:global(html.dark) .qz-state-text,
:global(html.dark) .qz-sub-loading,
:global(.dark) .qz-config-subtitle,
:global(.dark) .qz-calc-label,
:global(.dark) .qz-student-meta,
:global(.dark) .qz-state-text,
:global(.dark) .qz-sub-loading,
:global(:root[data-theme="dark"]) .qz-config-subtitle,
:global(:root[data-theme="dark"]) .qz-calc-label,
:global(:root[data-theme="dark"]) .qz-student-meta,
:global(:root[data-theme="dark"]) .qz-state-text,
:global(:root[data-theme="dark"]) .qz-sub-loading {
  color: #9e9bb8;
}
</style>
