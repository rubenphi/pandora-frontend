<template>
  <ion-page class="ion-page qz-import-quiz-page">
    <ion-content :fullscreen="true" class="qz-import-quiz-content">
      <div class="qz-page-wrapper">
        <!-- 1. CABECERA HERO QUEEZY PÚRPURA -->
        <header class="qz-hero-header">
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
              <ion-icon :icon="copyOutline"></ion-icon>
              <span>Banco de Cuestionarios</span>
            </div>

            <div class="qz-hero-actions-placeholder"></div>
          </div>

          <div class="qz-hero-titles">
            <span class="qz-hero-tag">IMPORTACIÓN DE PREGUNTAS</span>
            <h1 class="qz-hero-title">Copiar desde otro Cuestionario</h1>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-main-body">
          <div class="qz-container">
            <!-- BUSCADOR PRINCIPAL -->
            <div class="qz-card qz-search-card">
              <div class="qz-search-row">
                <div class="qz-search-input-wrap">
                  <ion-icon :icon="searchOutline" class="qz-search-icon"></ion-icon>
                  <input
                    v-model="searchQuery"
                    type="text"
                    class="qz-search-input"
                    placeholder="Buscar lección o cuestionario por tema..."
                    @keyup.enter="search"
                  />
                  <button
                    v-if="searchQuery"
                    type="button"
                    class="qz-clear-search-btn"
                    @click="clearSearch"
                  >
                    <ion-icon :icon="closeOutline"></ion-icon>
                  </button>
                </div>
                <button
                  type="button"
                  class="qz-primary-btn qz-search-btn"
                  @click="search"
                >
                  <span>Buscar</span>
                </button>
              </div>

              <!-- TOGGLE FILTROS AVANZADOS -->
              <div class="qz-filters-toggle-row">
                <button
                  type="button"
                  class="qz-filter-pill-btn"
                  :class="{ 'is-active': showFilters }"
                  @click="showFilters = !showFilters"
                >
                  <ion-icon :icon="optionsOutline"></ion-icon>
                  <span>Filtros avanzados</span>
                  <ion-icon
                    :icon="showFilters ? chevronUpOutline : chevronDownOutline"
                    class="qz-pill-chevron"
                  ></ion-icon>
                </button>

                <div v-if="hasActiveFilters" class="qz-active-filters-hint">
                  <span>Filtros aplicados</span>
                </div>
              </div>

              <!-- CAJA DESPLEGABLE DE FILTROS -->
              <div v-show="showFilters" class="qz-filters-panel">
                <div class="qz-filters-grid">
                  <!-- Curso -->
                  <div class="qz-field-group">
                    <label class="qz-field-label">Curso</label>
                    <div class="qz-select-wrapper">
                      <ion-icon :icon="schoolOutline" class="qz-field-icon"></ion-icon>
                      <ion-select
                        v-model="cursoSelected"
                        interface="popover"
                        :interface-options="{ cssClass: 'qz-popover-filter' }"
                        placeholder="Selecciona curso"
                        class="qz-compact-select"
                        @ionChange="areasSearch"
                      >
                        <ion-select-option :value="undefined">Todos los cursos</ion-select-option>
                        <ion-select-option
                          v-for="curso in cursos"
                          :key="curso.id"
                          :value="curso"
                        >
                          {{ curso.name }}
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>

                  <!-- Área -->
                  <div class="qz-field-group">
                    <label class="qz-field-label">Área</label>
                    <div class="qz-select-wrapper">
                      <ion-icon :icon="bookOutline" class="qz-field-icon"></ion-icon>
                      <ion-select
                        v-model="areaSelected"
                        interface="popover"
                        :interface-options="{ cssClass: 'qz-popover-filter' }"
                        placeholder="Selecciona área"
                        class="qz-compact-select"
                      >
                        <ion-select-option :value="undefined">Todas las áreas</ion-select-option>
                        <ion-select-option
                          v-for="area in areas"
                          :key="area.id"
                          :value="area"
                        >
                          {{ area.name }}
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>

                  <!-- Año -->
                  <div class="qz-field-group">
                    <label class="qz-field-label">Año lectivo</label>
                    <div class="qz-select-wrapper">
                      <ion-icon :icon="calendarOutline" class="qz-field-icon"></ion-icon>
                      <ion-select
                        v-model="yearSelected"
                        interface="popover"
                        :interface-options="{ cssClass: 'qz-popover-filter' }"
                        placeholder="Año"
                        class="qz-compact-select"
                      >
                        <ion-select-option :value="undefined">Todos</ion-select-option>
                        <ion-select-option
                          v-for="year in years"
                          :key="year"
                          :value="year"
                        >
                          {{ year }}
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>

                  <!-- Periodo -->
                  <div class="qz-field-group">
                    <label class="qz-field-label">Período</label>
                    <div class="qz-select-wrapper">
                      <ion-icon :icon="timeOutline" class="qz-field-icon"></ion-icon>
                      <ion-select
                        v-model="periodoSelected"
                        interface="popover"
                        :interface-options="{ cssClass: 'qz-popover-filter' }"
                        placeholder="Período"
                        class="qz-compact-select"
                      >
                        <ion-select-option :value="undefined">Todos</ion-select-option>
                        <ion-select-option
                          v-for="periodo in periodos"
                          :key="periodo.id"
                          :value="periodo"
                        >
                          {{ periodo.name }}
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>
                </div>

                <div class="qz-filters-actions">
                  <button
                    type="button"
                    class="qz-secondary-btn"
                    @click="clearFilters"
                  >
                    Restablecer
                  </button>
                  <button
                    type="button"
                    class="qz-primary-btn"
                    @click="search"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </div>

            <!-- RESULTADOS: LECCIONES Y CUESTIONARIOS -->
            <div class="qz-results-section">
              <div v-if="hasSearched" class="qz-section-header">
                <div class="qz-section-title-wrap">
                  <span class="qz-section-badge">LECCIONES DISPONIBLES</span>
                  <h2 class="qz-section-title">
                    {{ lessons.length }} lección(es) encontrada(s)
                  </h2>
                </div>
                <span class="qz-section-hint">Toca una lección para ver sus cuestionarios</span>
              </div>

              <!-- ESTADO INICIAL (SIN FILTROS NI BÚSQUEDA) -->
              <div v-if="!hasSearched" class="qz-card qz-empty-card">
                <div class="qz-empty-icon-wrap">
                  <ion-icon :icon="filterOutline"></ion-icon>
                </div>
                <h3 class="qz-empty-title">Aplica un filtro o realiza una búsqueda</h3>
                <p class="qz-empty-desc">
                  Selecciona un curso, área o escribe un término en el buscador para consultar las lecciones y cuestionarios disponibles.
                </p>
              </div>

              <!-- ESTADO VACÍO (CON FILTROS/BÚSQUEDA APLICADOS SIN RESULTADOS) -->
              <div v-else-if="lessons.length === 0" class="qz-card qz-empty-card">
                <div class="qz-empty-icon-wrap">
                  <ion-icon :icon="helpCircleOutline"></ion-icon>
                </div>
                <h3 class="qz-empty-title">No se encontraron cuestionarios</h3>
                <p class="qz-empty-desc">
                  Intenta cambiar las palabras clave de búsqueda o restablecer los filtros avanzados.
                </p>
              </div>

              <!-- LISTA DE LECCIONES Y ACORDEONES -->
              <div v-else class="qz-lessons-list">
                <div
                  v-for="lesson in lessons"
                  :key="lesson.id"
                  class="qz-card qz-lesson-card"
                >
                  <!-- Cabecera de la Lección -->
                  <div
                    class="qz-lesson-header"
                    @click="toggleLessonAccordion(lesson)"
                  >
                    <div class="qz-lesson-icon-wrap">
                      <ion-icon :icon="bookOutline"></ion-icon>
                    </div>
                    <div class="qz-lesson-info">
                      <h3 class="qz-lesson-topic">{{ lesson.topic }}</h3>
                      <div class="qz-lesson-meta">
                        <span v-if="lesson.course" class="qz-meta-tag">
                          {{ lesson.course.name }}
                        </span>
                        <span v-if="lesson.year" class="qz-meta-tag qz-meta-tag--sub">
                          Año {{ lesson.year }}
                        </span>
                      </div>
                    </div>
                    <ion-icon
                      :icon="isLessonOpen(lesson.id) ? chevronUpOutline : chevronDownOutline"
                      class="qz-lesson-chevron"
                    ></ion-icon>
                  </div>

                  <!-- Contenido desplegable: Cuestionarios de la Lección -->
                  <div
                    v-if="isLessonOpen(lesson.id)"
                    class="qz-lesson-content"
                  >
                    <div
                      v-if="!lesson.quizzes || lesson.quizzes.length === 0"
                      class="qz-no-quizzes-hint"
                    >
                      Esta lección no contiene cuestionarios registrados.
                    </div>

                    <div
                      v-for="quiz in lesson.quizzes"
                      :key="quiz.id"
                      class="qz-quiz-block"
                    >
                      <div class="qz-quiz-header">
                        <div class="qz-quiz-title-wrap">
                          <ion-icon :icon="documentTextOutline" class="qz-quiz-icon"></ion-icon>
                          <span class="qz-quiz-name">{{ quiz.title }}</span>
                        </div>
                        <span
                          v-if="questionsByQuiz[quiz.id]?.questions?.length"
                          class="qz-quiz-count-badge"
                        >
                          {{ questionsByQuiz[quiz.id].questions.length }} preguntas
                        </span>
                      </div>

                      <!-- Lista de Preguntas del Cuestionario -->
                      <div
                        v-if="questionsByQuiz[quiz.id]?.questions?.length"
                        class="qz-questions-sublist"
                      >
                        <!-- Selector Masivo del Cuestionario -->
                        <div class="qz-select-all-row">
                          <label class="qz-custom-checkbox-wrap">
                            <input
                              type="checkbox"
                              class="qz-checkbox"
                              :checked="isQuizAllSelected(quiz.id)"
                              @change="toggleSeleccionTodas(quiz.id, $event.target.checked)"
                            />
                            <span>Seleccionar todas las preguntas de este cuestionario</span>
                          </label>
                        </div>

                        <div class="qz-questions-grid">
                          <div
                            v-for="pregunta in questionsByQuiz[quiz.id].questions"
                            :key="pregunta.id"
                            class="qz-question-item"
                            :class="{ 'is-selected': pregunta.selected }"
                            @click="toggleQuestionSelection(quiz.id, pregunta)"
                          >
                            <input
                              type="checkbox"
                              class="qz-checkbox"
                              :checked="pregunta.selected"
                              @click.stop
                              @change="toggleQuestionSelection(quiz.id, pregunta)"
                            />
                            <span class="qz-question-title-text">{{ pregunta.title }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- BARRA DE CONFIGURACIÓN Y ACCIÓN INFERIOR -->
            <div class="qz-card qz-action-bottom-card">
              <div class="qz-action-top-row">
                <div class="qz-order-selector-group">
                  <label class="qz-field-label">Modo de ordenamiento</label>
                  <div class="qz-select-wrapper">
                    <ion-icon :icon="shuffleOutline" class="qz-field-icon"></ion-icon>
                    <ion-select
                      v-model="modoOrden"
                      interface="popover"
                      :interface-options="{ cssClass: 'qz-popover-filter' }"
                      class="qz-compact-select"
                    >
                      <ion-select-option value="mix">Mezclar preguntas (Aleatorio)</ion-select-option>
                      <ion-select-option value="tema">Agrupar por tema de origen</ion-select-option>
                    </ion-select>
                  </div>
                </div>

                <div class="qz-total-badge-box">
                  <span class="qz-total-lbl">Total seleccionadas:</span>
                  <span class="qz-total-val">{{ totalSelectedCount }}</span>
                </div>
              </div>

              <button
                type="button"
                class="qz-btn-import-final"
                :disabled="totalSelectedCount === 0 || isImporting"
                @click="importarSeleccionadas"
              >
                <ion-spinner v-if="isImporting" name="crescent"></ion-spinner>
                <template v-else>
                  <ion-icon :icon="downloadOutline"></ion-icon>
                  <span>Importar {{ totalSelectedCount }} Pregunta(s)</span>
                </template>
              </button>
            </div>

            <!-- RESUMEN FLOTANTE DE PREGUNTAS SELECCIONADAS -->
            <div
              v-if="selectedQuestionsSummary.length > 0"
              class="qz-card qz-summary-card"
            >
              <div class="qz-summary-header">
                <h3 class="qz-summary-title">Resumen de selección por cuestionario</h3>
                <span class="qz-summary-badge">{{ totalSelectedCount }} preguntas</span>
              </div>

              <div class="qz-summary-list">
                <div
                  v-for="item in selectedQuestionsSummary"
                  :key="item.quizId"
                  class="qz-summary-item"
                >
                  <div class="qz-summary-info">
                    <h4 class="qz-summary-quiz-title">{{ item.quizTitle }}</h4>
                    <p class="qz-summary-meta">
                      {{ item.lessonTopic }} ({{ item.year }}) · {{ item.courseName }}
                    </p>
                    <span class="qz-summary-count">
                      {{ item.count }} pregunta(s) seleccionada(s)
                    </span>
                  </div>
                  <button
                    type="button"
                    class="qz-summary-trash-btn"
                    title="Quitar este cuestionario de la selección"
                    @click="removeQuizFromSelection(item.quizId)"
                  >
                    <ion-icon :icon="trashOutline"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- TOASTS DE ESTADO -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        message="Preguntas importadas exitosamente"
        :duration="3000"
        color="success"
        @didDismiss="setSuccessToastOpen(false)"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        :message="errorMessage"
        :duration="3500"
        color="danger"
        @didDismiss="setErrorToastOpen(false)"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  onIonViewWillEnter,
  IonToast,
  IonPage,
  IonIcon,
  IonContent,
  IonSpinner,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";
import axios from "axios";
import {
  arrowBackOutline,
  copyOutline,
  downloadOutline,
  searchOutline,
  trashOutline,
  optionsOutline,
  chevronDownOutline,
  chevronUpOutline,
  closeOutline,
  bookOutline,
  documentTextOutline,
  helpCircleOutline,
  filterOutline,
  schoolOutline,
  calendarOutline,
  timeOutline,
  shuffleOutline,
} from "ionicons/icons";
import {
  periodosGet,
  numerosOrdinales,
  currentServerYear,
  tokenHeader,
  usuarioGet,
} from "../globalService";

export default {
  name: "ImportacionPregunta",
  components: {
    IonToast,
    IonPage,
    IonIcon,
    IonContent,
    IonSpinner,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const idCuestionario = route.params.id;

    const cursos = ref([]);
    const cursoSelected = ref();
    const areas = ref([]);
    const areaSelected = ref();
    const years = ref([]);
    const yearSelected = ref();
    const periodoSelected = ref();
    const periodos = ref(periodosGet());
    const lessons = ref([]);
    const questionsByQuiz = ref({});
    const searchQuery = ref("");
    const showFilters = ref(false);
    const openedLessons = ref(new Set());
    const isImporting = ref(false);
    const hasSearched = ref(false);

    // Global state to persist selection
    const globalSelectedQuestions = ref({});

    const totalSelectedCount = computed(() => {
      let total = 0;
      Object.values(globalSelectedQuestions.value).forEach((quiz) => {
        total += Object.keys(quiz.questions).length;
      });
      return total;
    });

    const selectedQuestionsSummary = computed(() => {
      return Object.entries(globalSelectedQuestions.value).map(
        ([quizId, data]) => ({
          quizId,
          quizTitle: data.quizTitle,
          lessonTopic: data.lessonTopic,
          year: data.year,
          courseName: data.courseName,
          count: Object.keys(data.questions).length,
        })
      );
    });

    const hasActiveFilters = computed(() => {
      return (
        cursoSelected.value !== undefined ||
        areaSelected.value !== undefined ||
        yearSelected.value !== undefined ||
        periodoSelected.value !== undefined
      );
    });

    const isLessonOpen = (lessonId) => openedLessons.value.has(lessonId);

    const toggleLessonAccordion = (lesson) => {
      if (openedLessons.value.has(lesson.id)) {
        openedLessons.value.delete(lesson.id);
      } else {
        openedLessons.value.add(lesson.id);
        loadQuizzesAndQuestions(lesson);
      }
    };

    const isQuizAllSelected = (quizId) => {
      const questions = questionsByQuiz.value[quizId]?.questions || [];
      if (questions.length === 0) return false;
      return questions.every((p) => p.selected);
    };

    const isSuccessToastOpen = ref(false);
    const setSuccessToastOpen = (state) => {
      isSuccessToastOpen.value = state;
    };
    const isErrorToastOpen = ref(false);
    const setErrorToastOpen = (state) => {
      isErrorToastOpen.value = state;
    };
    const errorMessage = ref("");
    const userLoged = ref();
    const modoOrden = ref("mix");

    const yearsF = () => {
      const y = currentServerYear();
      years.value = [];
      for (let i = y; i >= 2022; i--) {
        years.value.push(i);
      }
    };

    const getCursos = async () => {
      const response = await axios.get(
        `/users/${userLoged.value.id}/courses`,
        tokenHeader()
      );
      cursos.value = response.data
        .map((element) => element.course)
        .filter((c) => c !== null);
    };

    const clearFilters = () => {
      cursoSelected.value = undefined;
      areaSelected.value = undefined;
      yearSelected.value = undefined;
      periodoSelected.value = undefined;
      areas.value = [];
      searchQuery.value = "";
      lessons.value = [];
      openedLessons.value.clear();
      hasSearched.value = false;
    };

    const clearSearch = () => {
      searchQuery.value = "";
      if (
        cursoSelected.value?.id ||
        areaSelected.value?.id ||
        yearSelected.value ||
        periodoSelected.value?.id
      ) {
        search();
      } else {
        lessons.value = [];
        openedLessons.value.clear();
        hasSearched.value = false;
      }
    };

    const search = async () => {
      const hasQuery = searchQuery.value && searchQuery.value.trim() !== "";
      const hasCourse = !!cursoSelected.value?.id;
      const hasArea = !!areaSelected.value?.id;
      const hasYear = !!yearSelected.value;
      const hasPeriod = !!periodoSelected.value?.id;

      if (!hasQuery && !hasCourse && !hasArea && !hasYear && !hasPeriod) {
        lessons.value = [];
        openedLessons.value.clear();
        hasSearched.value = false;
        errorMessage.value =
          "Por favor selecciona un curso o escribe un término de búsqueda para filtrar.";
        setErrorToastOpen(true);
        return;
      }

      hasSearched.value = true;
      let url = "";
      const instId = userLoged.value?.institute?.id;

      if (hasQuery) {
        url = `/lessons?topic=${encodeURIComponent(
          searchQuery.value.trim()
        )}&exist=true`;
        if (instId) url += `&instituteId=${instId}`;
        if (hasCourse) url += `&courseId=${cursoSelected.value.id}`;
        if (hasArea) url += `&areaId=${areaSelected.value.id}`;
        if (hasYear) url += `&year=${yearSelected.value}`;
        if (hasPeriod) url += `&periodId=${periodoSelected.value.id}`;
      } else {
        url = `/lessons?exist=true`;
        if (hasCourse) url += `&courseId=${cursoSelected.value.id}`;
        if (hasArea) url += `&areaId=${areaSelected.value.id}`;
        if (hasYear) url += `&year=${yearSelected.value}`;
        if (hasPeriod) url += `&periodId=${periodoSelected.value.id}`;
        if (instId) url += `&instituteId=${instId}`;
      }

      try {
        const response = await axios.get(url, tokenHeader());
        lessons.value = (response.data || []).filter(
          (c) => c.id != idCuestionario
        );
        openedLessons.value.clear();
      } catch (error) {
        console.error("Error al buscar lecciones:", error);
      }
    };

    const areasSearch = async () => {
      areaSelected.value = undefined;
      if (!cursoSelected.value || !cursoSelected.value.id) {
        areas.value = [];
        return;
      }
      try {
        const response = await axios.get(
          `/courses/${cursoSelected.value.id}/areas`,
          tokenHeader()
        );
        const data = response.data || [];
        areas.value = data
          .map((c) => (c && c.area ? c.area : c))
          .filter((a) => a && typeof a === "object" && a.id);
      } catch (error) {
        console.error("Error al cargar áreas:", error);
        areas.value = [];
      }
    };

    const loadQuizzesAndQuestions = async (lesson) => {
      try {
        const response = await axios.get(
          `/lessons/${lesson.id}/quizzes`,
          tokenHeader()
        );
        lesson.quizzes = response.data;

        for (const quiz of lesson.quizzes) {
          const resQ = await axios.get(
            `/quizzes/${quiz.id}/questions`,
            tokenHeader()
          );

          const preselectedMap =
            globalSelectedQuestions.value[quiz.id]?.questions || {};

          questionsByQuiz.value[quiz.id] = {
            quizData: {
              id: quiz.id,
              title: quiz.title,
              lessonTopic: lesson.topic,
              year: lesson.year || "N/A",
              courseName: lesson.course?.name || "Sin Curso",
            },
            questions: resQ.data
              .filter((p) => p.exist)
              .map((p, index) => ({
                id: p.id,
                title: numerosOrdinales(index, p.title) + ". " + p.title,
                selected: !!preselectedMap[p.id],
              })),
          };
        }
      } catch (error) {
        console.error("Error al cargar cuestionarios y preguntas:", error);
      }
    };

    const toggleQuestionSelection = (quizId, pregunta) => {
      pregunta.selected = !pregunta.selected;

      if (!globalSelectedQuestions.value[quizId]) {
        const quizData = questionsByQuiz.value[quizId]?.quizData || {
          quizTitle: "Cuestionario",
          lessonTopic: "",
          year: "",
          courseName: "",
        };
        globalSelectedQuestions.value[quizId] = {
          ...quizData,
          questions: {},
        };
      }

      if (pregunta.selected) {
        globalSelectedQuestions.value[quizId].questions[pregunta.id] = pregunta;
      } else {
        delete globalSelectedQuestions.value[quizId].questions[pregunta.id];
        if (
          Object.keys(globalSelectedQuestions.value[quizId].questions).length === 0
        ) {
          delete globalSelectedQuestions.value[quizId];
        }
      }
    };

    const toggleSeleccionTodas = (quizId, estado) => {
      const quizObj = questionsByQuiz.value[quizId];
      if (!quizObj) return;

      quizObj.questions.forEach((pregunta) => {
        pregunta.selected = estado;
      });

      if (estado) {
        if (!globalSelectedQuestions.value[quizId]) {
          globalSelectedQuestions.value[quizId] = {
            ...quizObj.quizData,
            questions: {},
          };
        }
        quizObj.questions.forEach((pregunta) => {
          globalSelectedQuestions.value[quizId].questions[pregunta.id] = pregunta;
        });
      } else {
        delete globalSelectedQuestions.value[quizId];
      }
    };

    const removeQuizFromSelection = (quizId) => {
      delete globalSelectedQuestions.value[quizId];
      if (questionsByQuiz.value[quizId]) {
        questionsByQuiz.value[quizId].questions.forEach((p) => {
          p.selected = false;
        });
      }
    };

    const importarSeleccionadas = async () => {
      if (totalSelectedCount.value === 0) {
        errorMessage.value = "Selecciona al menos una pregunta para importar.";
        setErrorToastOpen(true);
        return;
      }

      const questionIds = [];
      Object.values(globalSelectedQuestions.value).forEach((quiz) => {
        Object.keys(quiz.questions).forEach((id) => {
          questionIds.push(Number(id));
        });
      });

      isImporting.value = true;
      try {
        await axios.post(
          `/questions/import`,
          {
            quizId: Number(idCuestionario),
            questionIds: questionIds,
            mode: modoOrden.value,
          },
          tokenHeader()
        );

        setSuccessToastOpen(true);
        setTimeout(() => {
          router.push(`/cuestionario/${idCuestionario}`);
        }, 1200);
      } catch (error) {
        console.error("Error al importar preguntas:", error);
        errorMessage.value =
          error.response?.data?.message || "Error al importar preguntas.";
        setErrorToastOpen(true);
      } finally {
        isImporting.value = false;
      }
    };

    const goBack = () => {
      router.push(`/cuestionario/${idCuestionario}`);
    };

    onIonViewWillEnter(async () => {
      userLoged.value = usuarioGet();
      tokenHeader();
      yearsF();
      await getCursos();
    });

    return {
      isSuccessToastOpen,
      isErrorToastOpen,
      setSuccessToastOpen,
      setErrorToastOpen,
      importarSeleccionadas,
      errorMessage,
      userLoged,
      idCuestionario,
      cursos,
      cursoSelected,
      areas,
      areaSelected,
      lessons,
      periodos,
      years,
      yearSelected,
      periodoSelected,
      search,
      areasSearch,
      clearFilters,
      questionsByQuiz,
      modoOrden,
      toggleSeleccionTodas,
      isQuizAllSelected,
      loadQuizzesAndQuestions,
      globalSelectedQuestions,
      totalSelectedCount,
      selectedQuestionsSummary,
      toggleQuestionSelection,
      removeQuizFromSelection,
      trashOutline,
      searchQuery,
      clearSearch,
      hasSearched,
      showFilters,
      hasActiveFilters,
      isLessonOpen,
      toggleLessonAccordion,
      isImporting,
      goBack,
      // Icons
      arrowBackOutline,
      copyOutline,
      downloadOutline,
      searchOutline,
      optionsOutline,
      chevronDownOutline,
      chevronUpOutline,
      closeOutline,
      bookOutline,
      documentTextOutline,
      helpCircleOutline,
      filterOutline,
      schoolOutline,
      calendarOutline,
      timeOutline,
      shuffleOutline,
    };
  },
};
</script>

<style scoped>
.qz-import-quiz-page {
  background-color: var(--qz-color-purple-bg, #efeefc);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}

.qz-import-quiz-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

/* 1. HERO HEADER */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 22px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 680px;
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
  transition: transform 0.15s ease;
}

.qz-back-btn:active {
  transform: scale(0.92);
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
}

.qz-hero-actions-placeholder {
  width: 40px;
}

.qz-hero-titles {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 20px;
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

/* 2. BODY */
.qz-main-body {
  flex: 1;
  padding: 0 18px 30px 18px;
}

.qz-container {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* TARJETAS BASE */
.qz-card {
  background: #ffffff;
  border-radius: var(--qz-radius-xl, 22px);
  padding: 16px 18px;
  box-shadow: 0 4px 16px rgba(106, 90, 224, 0.08);
  border: 1px solid rgba(106, 90, 224, 0.08);
}

/* SEARCH CARD */
.qz-search-row {
  display: flex;
  gap: 10px;
}

.qz-search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fbfbff;
  border: 1.5px solid #e5e3f5;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 4px 14px;
  transition: border-color 0.15s ease;
}

.qz-search-input-wrap:focus-within {
  border-color: #6a5ae0;
  background: #ffffff;
}

.qz-search-icon {
  font-size: 18px;
  color: #858494;
  margin-right: 8px;
}

.qz-search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  color: #0c092a;
  outline: none;
}

.qz-clear-search-btn {
  background: transparent;
  border: none;
  color: #858494;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.qz-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 10px 18px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease;
}

.qz-primary-btn:active {
  transform: scale(0.96);
}

/* FILTROS */
.qz-filters-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f0effc;
}

.qz-filter-pill-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #efeefc;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 6px 14px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  color: #5548b8;
  cursor: pointer;
  outline: none;
}

.qz-filter-pill-btn.is-active {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-pill-chevron {
  font-size: 14px;
}

.qz-active-filters-hint {
  font-size: 11px;
  font-weight: 700;
  color: #12b76a;
}

.qz-filters-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1.5px dashed #e5e3f5;
}

.qz-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qz-field-label {
  font-size: 11px;
  font-weight: 700;
  color: #636275;
}

.qz-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.18);
  border-radius: 12px;
  height: 42px;
  padding: 0 10px 0 34px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.qz-select-wrapper:hover,
.qz-select-wrapper:focus-within {
  border-color: #6a5ae0;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.12);
}

.qz-field-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #6a5ae0;
  pointer-events: none;
  z-index: 2;
}

.qz-compact-select {
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 500;
  color: #0c092a;
}

.qz-filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.qz-secondary-btn {
  background: #efeefc;
  border: none;
  color: #5548b8;
  padding: 8px 14px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

/* SECTION HEADERS */
.qz-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
}

.qz-section-badge {
  font-size: 10px;
  font-weight: 800;
  color: #6a5ae0;
  letter-spacing: 0.6px;
}

.qz-section-title {
  margin: 2px 0 0 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
}

.qz-section-hint {
  font-size: 11px;
  color: #858494;
}

/* LECCIONES */
.qz-lessons-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-lesson-card {
  padding: 0;
  overflow: hidden;
}

.qz-lesson-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  background: #ffffff;
  transition: background 0.15s ease;
}

.qz-lesson-header:hover {
  background: #fbfbff;
}

.qz-lesson-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--qz-radius-full, 9999px);
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.qz-lesson-info {
  flex: 1;
}

.qz-lesson-topic {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0c092a;
}

.qz-lesson-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
}

.qz-meta-tag {
  font-size: 10px;
  font-weight: 700;
  background: #efeefc;
  color: #5548b8;
  padding: 2px 7px;
  border-radius: var(--qz-radius-full, 9999px);
}

.qz-meta-tag--sub {
  background: #f0effc;
  color: #858494;
}

.qz-lesson-chevron {
  font-size: 18px;
  color: #858494;
}

.qz-lesson-content {
  padding: 12px 16px 16px 16px;
  background: #fbfbff;
  border-top: 1px solid #f0effc;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-no-quizzes-hint {
  font-size: 12px;
  color: #858494;
  font-style: italic;
  padding: 6px 0;
}

.qz-quiz-block {
  background: #ffffff;
  border: 1px solid #e5e3f5;
  border-radius: var(--qz-radius-lg, 16px);
  padding: 12px;
}

.qz-quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.qz-quiz-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-quiz-icon {
  font-size: 16px;
  color: #6a5ae0;
}

.qz-quiz-name {
  font-size: 13px;
  font-weight: 700;
  color: #0c092a;
}

.qz-quiz-count-badge {
  font-size: 11px;
  font-weight: 700;
  background: #efeefc;
  color: #5548b8;
  padding: 2px 8px;
  border-radius: var(--qz-radius-full, 9999px);
}

.qz-select-all-row {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0effc;
}

.qz-custom-checkbox-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #5548b8;
  cursor: pointer;
}

.qz-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #6a5ae0;
  cursor: pointer;
}

.qz-questions-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-question-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fbfbff;
  border: 1px solid #e9e7f8;
  border-radius: var(--qz-radius-md, 10px);
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-question-item:hover {
  background: #f4f3fd;
}

.qz-question-item.is-selected {
  background: #f0effc;
  border-color: #6a5ae0;
}

.qz-question-title-text {
  font-size: 12px;
  font-weight: 600;
  color: #0c092a;
}

/* EMPTY CARD */
.qz-empty-card {
  text-align: center;
  padding: 28px 20px;
}

.qz-empty-icon-wrap {
  font-size: 36px;
  color: #6a5ae0;
  margin-bottom: 8px;
}

.qz-empty-title {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 800;
  color: #0c092a;
}

.qz-empty-desc {
  margin: 0;
  font-size: 12px;
  color: #858494;
}

/* BOTTOM ACTION CARD */
.qz-action-bottom-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-action-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.qz-order-selector-group {
  flex: 1;
  min-width: 180px;
}

.qz-total-badge-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #efeefc;
  padding: 6px 14px;
  border-radius: var(--qz-radius-full, 9999px);
}

.qz-total-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #5548b8;
}

.qz-total-val {
  font-size: 15px;
  font-weight: 800;
  color: #6a5ae0;
}

.qz-btn-import-final {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  padding: 13px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  outline: none;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.3);
  transition: transform 0.15s ease;
}

.qz-btn-import-final:active {
  transform: scale(0.98);
}

.qz-btn-import-final:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

/* SUMMARY CARD */
.qz-summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.qz-summary-title {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #0c092a;
}

.qz-summary-badge {
  font-size: 11px;
  font-weight: 700;
  background: #e4f7eb;
  color: #12b76a;
  padding: 2px 8px;
  border-radius: var(--qz-radius-full, 9999px);
}

.qz-summary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fbfbff;
  border: 1px solid #e9e7f8;
  border-radius: var(--qz-radius-md, 12px);
  padding: 10px 14px;
}

.qz-summary-quiz-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #0c092a;
}

.qz-summary-meta {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: #858494;
}

.qz-summary-count {
  font-size: 11px;
  font-weight: 700;
  color: #6a5ae0;
}

.qz-summary-trash-btn {
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

/* ========================================================= */
/* DARK MODE STYLES                                          */
/* ========================================================= */

/* 1. Preferencia de Sistema */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-import-quiz-page,
  .qz-import-quiz-page {
    background-color: #0d0a1a !important;
  }
  body:not(.light) .qz-import-quiz-content,
  .qz-import-quiz-content {
    --background: #0d0a1a !important;
  }
  body:not(.light) .qz-card,
  .qz-card {
    background: #17132e !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-search-input-wrap,
  .qz-search-input-wrap {
    background: #201b3e !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
  body:not(.light) .qz-search-input,
  .qz-search-input {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-select-wrapper {
    background: #241d42 !important;
    border-color: rgba(255, 255, 255, 0.14) !important;
  }
  body:not(.light) .qz-select-wrapper:hover,
  body:not(.light) .qz-select-wrapper:focus-within {
    background: #2a2250 !important;
    border-color: #8c7ef8 !important;
    box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.25) !important;
  }
  body:not(.light) .qz-field-icon {
    color: #b7aefa !important;
  }
  body:not(.light) .qz-compact-select,
  body:not(.light) .qz-compact-select::part(text),
  body:not(.light) .qz-compact-select::part(placeholder) {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-filter-pill-btn,
  .qz-filter-pill-btn {
    background: #252044 !important;
    color: #b7aefa !important;
  }
  body:not(.light) .qz-field-label,
  .qz-field-label {
    color: #9e9bb8 !important;
  }
  body:not(.light) .qz-section-title,
  .qz-section-title {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-section-hint,
  .qz-section-hint {
    color: #9e9bb8 !important;
  }
  body:not(.light) .qz-lesson-header,
  .qz-lesson-header {
    background: #17132e !important;
  }
  body:not(.light) .qz-lesson-icon-wrap,
  .qz-lesson-icon-wrap {
    background: #252044 !important;
    color: #b7aefa !important;
  }
  body:not(.light) .qz-lesson-topic,
  .qz-lesson-topic {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-meta-tag,
  .qz-meta-tag {
    background: #252044 !important;
    color: #b7aefa !important;
  }
  body:not(.light) .qz-meta-tag--sub,
  .qz-meta-tag--sub {
    background: #1c1735 !important;
    color: #9e9bb8 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-lesson-content,
  .qz-lesson-content {
    background: #141026 !important;
    border-top-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-quiz-block,
  .qz-quiz-block {
    background: #1d1838 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-quiz-name,
  .qz-quiz-name {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-quiz-count-badge,
  .qz-quiz-count-badge {
    background: #2b2254 !important;
    color: #b5a9ff !important;
  }
  body:not(.light) .qz-question-item,
  .qz-question-item {
    background: #231d42 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-question-item.is-selected,
  .qz-question-item.is-selected {
    background: #2c2555 !important;
    border-color: #7c6ef2 !important;
  }
  body:not(.light) .qz-question-title-text,
  .qz-question-title-text {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-total-badge-box,
  .qz-total-badge-box {
    background: #252044 !important;
  }
  body:not(.light) .qz-total-lbl,
  .qz-total-lbl {
    color: #b7aefa !important;
  }
  body:not(.light) .qz-summary-title,
  .qz-summary-title {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-summary-item,
  .qz-summary-item {
    background: #201b3e !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-summary-quiz-title,
  .qz-summary-quiz-title {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-summary-meta,
  .qz-summary-meta {
    color: #9e9bb8 !important;
  }
}

/* 2. Clases y Atributos Explícitos */
:global(body.dark) .qz-import-quiz-page,
:global(html.dark) .qz-import-quiz-page,
:global(.dark) .qz-import-quiz-page,
:global(:root[data-theme="dark"]) .qz-import-quiz-page {
  background-color: #0d0a1a !important;
}

:global(body.dark) .qz-import-quiz-content,
:global(html.dark) .qz-import-quiz-content,
:global(.dark) .qz-import-quiz-content,
:global(:root[data-theme="dark"]) .qz-import-quiz-content {
  --background: #0d0a1a !important;
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card,
:global(:root[data-theme="dark"]) .qz-card {
  background: #17132e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-search-input-wrap,
:global(html.dark) .qz-search-input-wrap,
:global(.dark) .qz-search-input-wrap,
:global(:root[data-theme="dark"]) .qz-search-input-wrap {
  background: #201b3e !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

:global(body.dark) .qz-search-input,
:global(html.dark) .qz-search-input,
:global(.dark) .qz-search-input,
:global(:root[data-theme="dark"]) .qz-search-input {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-select-wrapper,
:global(html.dark) .qz-select-wrapper,
:global(.dark) .qz-select-wrapper,
:global(:root[data-theme="dark"]) .qz-select-wrapper {
  background: #241d42 !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
}

:global(body.dark) .qz-select-wrapper:hover,
:global(html.dark) .qz-select-wrapper:hover,
:global(.dark) .qz-select-wrapper:hover,
:global(:root[data-theme="dark"]) .qz-select-wrapper:hover,
:global(body.dark) .qz-select-wrapper:focus-within,
:global(html.dark) .qz-select-wrapper:focus-within,
:global(.dark) .qz-select-wrapper:focus-within,
:global(:root[data-theme="dark"]) .qz-select-wrapper:focus-within {
  background: #2a2250 !important;
  border-color: #8c7ef8 !important;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.25) !important;
}

:global(body.dark) .qz-field-icon,
:global(html.dark) .qz-field-icon,
:global(.dark) .qz-field-icon,
:global(:root[data-theme="dark"]) .qz-field-icon {
  color: #b7aefa !important;
}

:global(body.dark) .qz-compact-select,
:global(html.dark) .qz-compact-select,
:global(.dark) .qz-compact-select,
:global(:root[data-theme="dark"]) .qz-compact-select,
:global(body.dark) .qz-compact-select::part(text),
:global(html.dark) .qz-compact-select::part(text),
:global(.dark) .qz-compact-select::part(text),
:global(:root[data-theme="dark"]) .qz-compact-select::part(text),
:global(body.dark) .qz-compact-select::part(placeholder),
:global(html.dark) .qz-compact-select::part(placeholder),
:global(.dark) .qz-compact-select::part(placeholder),
:global(:root[data-theme="dark"]) .qz-compact-select::part(placeholder) {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-filter-pill-btn,
:global(html.dark) .qz-filter-pill-btn,
:global(.dark) .qz-filter-pill-btn,
:global(:root[data-theme="dark"]) .qz-filter-pill-btn {
  background: #252044 !important;
  color: #b7aefa !important;
}

:global(body.dark) .qz-field-label,
:global(html.dark) .qz-field-label,
:global(.dark) .qz-field-label,
:global(:root[data-theme="dark"]) .qz-field-label {
  color: #9e9bb8 !important;
}

:global(body.dark) .qz-section-title,
:global(html.dark) .qz-section-title,
:global(.dark) .qz-section-title,
:global(:root[data-theme="dark"]) .qz-section-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-section-hint,
:global(html.dark) .qz-section-hint,
:global(.dark) .qz-section-hint,
:global(:root[data-theme="dark"]) .qz-section-hint {
  color: #9e9bb8 !important;
}

:global(body.dark) .qz-lesson-header,
:global(html.dark) .qz-lesson-header,
:global(.dark) .qz-lesson-header,
:global(:root[data-theme="dark"]) .qz-lesson-header {
  background: #17132e !important;
}

:global(body.dark) .qz-lesson-icon-wrap,
:global(html.dark) .qz-lesson-icon-wrap,
:global(.dark) .qz-lesson-icon-wrap,
:global(:root[data-theme="dark"]) .qz-lesson-icon-wrap {
  background: #252044 !important;
  color: #b7aefa !important;
}

:global(body.dark) .qz-lesson-topic,
:global(html.dark) .qz-lesson-topic,
:global(.dark) .qz-lesson-topic,
:global(:root[data-theme="dark"]) .qz-lesson-topic {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-meta-tag,
:global(html.dark) .qz-meta-tag,
:global(.dark) .qz-meta-tag,
:global(:root[data-theme="dark"]) .qz-meta-tag {
  background: #252044 !important;
  color: #b7aefa !important;
}

:global(body.dark) .qz-meta-tag--sub,
:global(html.dark) .qz-meta-tag--sub,
:global(.dark) .qz-meta-tag--sub,
:global(:root[data-theme="dark"]) .qz-meta-tag--sub {
  background: #1c1735 !important;
  color: #9e9bb8 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-lesson-content,
:global(html.dark) .qz-lesson-content,
:global(.dark) .qz-lesson-content,
:global(:root[data-theme="dark"]) .qz-lesson-content {
  background: #141026 !important;
  border-top-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-quiz-block,
:global(html.dark) .qz-quiz-block,
:global(.dark) .qz-quiz-block,
:global(:root[data-theme="dark"]) .qz-quiz-block {
  background: #1d1838 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-quiz-name,
:global(html.dark) .qz-quiz-name,
:global(.dark) .qz-quiz-name,
:global(:root[data-theme="dark"]) .qz-quiz-name {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-quiz-count-badge,
:global(html.dark) .qz-quiz-count-badge,
:global(.dark) .qz-quiz-count-badge,
:global(:root[data-theme="dark"]) .qz-quiz-count-badge {
  background: #2b2254 !important;
  color: #b5a9ff !important;
}

:global(body.dark) .qz-question-item,
:global(html.dark) .qz-question-item,
:global(.dark) .qz-question-item,
:global(:root[data-theme="dark"]) .qz-question-item {
  background: #231d42 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-question-item.is-selected,
:global(html.dark) .qz-question-item.is-selected,
:global(.dark) .qz-question-item.is-selected,
:global(:root[data-theme="dark"]) .qz-question-item.is-selected {
  background: #2c2555 !important;
  border-color: #7c6ef2 !important;
}

:global(body.dark) .qz-question-title-text,
:global(html.dark) .qz-question-title-text,
:global(.dark) .qz-question-title-text,
:global(:root[data-theme="dark"]) .qz-question-title-text {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-total-badge-box,
:global(html.dark) .qz-total-badge-box,
:global(.dark) .qz-total-badge-box,
:global(:root[data-theme="dark"]) .qz-total-badge-box {
  background: #252044 !important;
}

:global(body.dark) .qz-total-lbl,
:global(html.dark) .qz-total-lbl,
:global(.dark) .qz-total-lbl,
:global(:root[data-theme="dark"]) .qz-total-lbl {
  color: #b7aefa !important;
}

:global(body.dark) .qz-summary-title,
:global(html.dark) .qz-summary-title,
:global(.dark) .qz-summary-title,
:global(:root[data-theme="dark"]) .qz-summary-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-summary-item,
:global(html.dark) .qz-summary-item,
:global(.dark) .qz-summary-item,
:global(:root[data-theme="dark"]) .qz-summary-item {
  background: #201b3e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-summary-quiz-title,
:global(html.dark) .qz-summary-quiz-title,
:global(.dark) .qz-summary-quiz-title,
:global(:root[data-theme="dark"]) .qz-summary-quiz-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-summary-meta,
:global(html.dark) .qz-summary-meta,
:global(.dark) .qz-summary-meta,
:global(:root[data-theme="dark"]) .qz-summary-meta {
  color: #9e9bb8 !important;
}
</style>
