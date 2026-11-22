<template>
  <ion-page class="ion-page qz-special-lesson-page">
    <!-- BARRA SUPERIOR FIJA QUEEZY -->
    <ion-header class="ion-no-border qz-sticky-header">
      <div class="qz-hero-top">
        <!-- Botón Volver Circular -->
        <button
          type="button"
          class="qz-back-btn"
          title="Regresar a lecciones"
          @click="goBack"
        >
          <ion-icon :icon="arrowBackOutline"></ion-icon>
        </button>

        <!-- Resumen en Píldora Queezy Central -->
        <div class="qz-hero-pills">
          <span
            class="qz-summary-pill"
            :title="`${selectedCount} de ${studentList.length} estudiantes asignados`"
          >
            <ion-icon :icon="peopleOutline"></ion-icon>
            <span class="qz-pill-num">{{ selectedCount }}/{{ studentList.length }}</span>
            <span class="qz-pill-label-full">asignados</span>
            <span class="qz-pill-label-short">asig.</span>
          </span>
        </div>

        <!-- Botón Circular Guardar en Barra Superior -->
        <div class="qz-hero-actions">
          <button
            type="button"
            class="qz-save-hero-btn"
            :title="isEditing ? 'Guardar cambios' : 'Crear lección especial'"
            aria-label="Guardar lección especial"
            @click="crearRefuerzo"
            :disabled="isSaving"
          >
            <ion-spinner
              v-if="isSaving"
              name="crescent"
              class="qz-btn-spinner"
            ></ion-spinner>
            <ion-icon v-else :icon="saveOutline"></ion-icon>
          </button>
        </div>
      </div>
    </ion-header>

    <ion-content :fullscreen="true" class="qz-special-lesson-content">
      <div class="qz-page-wrapper">
        <!-- 1. BANNER HERO QUEEZY PÚRPURA -->
        <div class="qz-hero-banner">
          <div class="qz-hero-titles">
            <span class="qz-hero-tag">
              {{ heroLessonTypeTag }}
              <template v-if="heroContextTag">
                · {{ heroContextTag }}
              </template>
            </span>
            <h1 class="qz-hero-title">{{ heroMainTitle }}</h1>
            <p class="qz-hero-subtitle">
              {{
                isEditing
                  ? "Modifica la fecha, tema o estudiantes asignados a esta sesión."
                  : lessonType === LessonType.REMEDIAL
                  ? "Programa la sesión de nivelación periódica y asigna los estudiantes a nivelar logros."
                  : "Programa la sesión de refuerzo académico y asigna los estudiantes que requieren apoyo pedagógico."
              }}
            </p>
          </div>
        </div>

        <!-- 2. CUERPO PRINCIPAL -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- Aviso de Error Visual -->
            <div v-if="error" class="qz-alert-banner qz-alert-banner--danger">
              <div class="qz-alert-icon">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
              </div>
              <div class="qz-alert-content">
                <strong>Atención</strong>
                <p>{{ error }}</p>
              </div>
              <button
                type="button"
                class="qz-alert-close-btn"
                @click="error = ''"
                title="Cerrar aviso"
              >
                <ion-icon :icon="closeOutline"></ion-icon>
              </button>
            </div>

            <!-- TARJETA DE DATOS BÁSICOS DE LA LECCIÓN -->
            <div class="qz-form-card">
              <div class="qz-card-header">
                <div class="qz-card-icon-badge">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                </div>
                <div>
                  <h2 class="qz-card-title">Datos de la Sesión</h2>
                  <p class="qz-card-subtitle">Fecha y temática pedagógica programada</p>
                </div>
              </div>

              <div class="qz-form-grid">
                <!-- Campo Fecha -->
                <div class="qz-input-group">
                  <label class="qz-sub-label">
                    <ion-icon :icon="calendarOutline"></ion-icon>
                    <span>Fecha de la Lección</span>
                  </label>
                  <div class="qz-input-wrap qz-input-wrap--icon">
                    <ion-icon :icon="calendarOutline" class="qz-input-lead-icon"></ion-icon>
                    <input
                      type="date"
                      v-model="form.date"
                      class="qz-text-input qz-input--has-icon"
                      required
                    />
                  </div>
                </div>

                <!-- Campo Tema -->
                <div class="qz-input-group">
                  <label class="qz-sub-label">
                    <ion-icon :icon="bookOutline"></ion-icon>
                    <span>Tema o Contenido a Trabajar</span>
                  </label>
                  <div class="qz-input-wrap qz-input-wrap--icon">
                    <ion-icon :icon="createOutline" class="qz-input-lead-icon"></ion-icon>
                    <input
                      type="text"
                      v-model="form.topic"
                      placeholder="Ej. Taller de afianzamiento y conceptos clave"
                      class="qz-text-input qz-input--has-icon"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- BUSCADOR Y LISTADO DE ESTUDIANTES -->
            <div class="qz-toolbox-card">
              <div class="qz-toolbox-header">
                <div class="qz-toolbox-title-wrap">
                  <h3 class="qz-toolbox-title">Estudiantes para Asignar</h3>
                  <span class="qz-toolbox-badge">{{ studentList.length }} en lista</span>
                </div>

                <!-- Buscador rápido por nombre -->
                <div class="qz-search-wrap">
                  <ion-icon :icon="searchOutline" class="qz-search-icon"></ion-icon>
                  <input
                    type="text"
                    v-model="searchQuery"
                    placeholder="Filtrar por nombre..."
                    class="qz-search-input"
                  />
                  <button
                    v-if="searchQuery"
                    type="button"
                    class="qz-search-clear-btn"
                    @click="searchQuery = ''"
                    title="Limpiar búsqueda"
                  >
                    <ion-icon :icon="closeOutline"></ion-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- SECCIÓN LISTADO DE ESTUDIANTES -->
            <div class="qz-students-section">
              <!-- Estado de Carga -->
              <div v-if="isLoadingStudents" class="qz-loading-card">
                <ion-spinner name="crescent" class="qz-loading-spinner"></ion-spinner>
                <p class="qz-loading-text">Cargando notas y estudiantes del grupo...</p>
              </div>

              <!-- Estado Vacío (Sin estudiantes) -->
              <div v-else-if="studentList.length === 0" class="qz-empty-card">
                <div class="qz-empty-icon-box">
                  <ion-icon :icon="schoolOutline"></ion-icon>
                </div>
                <h4 class="qz-empty-title">Sin estudiantes disponibles</h4>
                <p class="qz-empty-desc">
                  {{
                    lessonType === LessonType.REMEDIAL
                      ? "No se encontraron estudiantes con refuerzos previos para esta nivelación."
                      : "No se encontraron estudiantes con notas registradas para este curso y periodo."
                  }}
                </p>
              </div>

              <!-- Estado Búsqueda Vacía -->
              <div
                v-else-if="filteredStudents.length === 0"
                class="qz-empty-card"
              >
                <div class="qz-empty-icon-box">
                  <ion-icon :icon="searchOutline"></ion-icon>
                </div>
                <h4 class="qz-empty-title">Sin coincidencias</h4>
                <p class="qz-empty-desc">
                  Ningún estudiante coincide con el filtro "{{ searchQuery }}".
                </p>
                <button
                  type="button"
                  class="qz-clear-filter-btn"
                  @click="searchQuery = ''"
                >
                  Limpiar filtro
                </button>
              </div>

              <!-- Grid de Tarjetas de Estudiantes -->
              <div v-else class="qz-students-grid">
                <div
                  v-for="student in filteredStudents"
                  :key="student.id"
                  class="qz-student-card"
                  :class="{
                    'is-selected': student.selected,
                  }"
                  @click="toggleStudent(student)"
                >
                  <!-- Lado Izquierdo: Checkbox, Avatar, Nombre -->
                  <div class="qz-student-left">
                    <ion-checkbox
                      :checked="student.selected"
                      class="qz-round-checkbox"
                      @click.stop="toggleStudent(student)"
                    ></ion-checkbox>

                    <div class="qz-student-avatar">
                      {{ getInitials(student.name) }}
                    </div>

                    <div class="qz-student-meta">
                      <div class="qz-student-name-row">
                        <span class="qz-student-name">{{ student.name }}</span>
                      </div>
                      <span class="qz-student-status-text">
                        {{
                          student.selected
                            ? "Asignado a la sesión"
                            : "No asignado"
                        }}
                      </span>
                    </div>
                  </div>

                  <!-- Lado Derecho: Badges de Calificación -->
                  <div class="qz-student-right">
                    <!-- Si es NIVELACIÓN (REMEDIAL): Badges RG y RF -->
                    <template v-if="lessonType === LessonType.REMEDIAL">
                      <div
                        class="qz-grade-badge"
                        :class="getGradeBadgeClass(student.averageRegular)"
                        title="Calificación Regular (RG)"
                      >
                        <span class="qz-grade-lbl">RG</span>
                        <span class="qz-grade-val">
                          {{
                            student.averageRegular
                              ? student.averageRegular.toFixed(1)
                              : "1.0"
                          }}
                        </span>
                      </div>
                      <div
                        class="qz-grade-badge"
                        :class="getGradeBadgeClass(student.averageReinforcement)"
                        title="Calificación de Refuerzo (RF)"
                      >
                        <span class="qz-grade-lbl">RF</span>
                        <span class="qz-grade-val">
                          {{
                            student.averageReinforcement
                              ? student.averageReinforcement.toFixed(1)
                              : "1.0"
                          }}
                        </span>
                      </div>
                    </template>

                    <!-- Si es REFUERZO: Promedio Regular -->
                    <template v-else>
                      <div
                        class="qz-grade-badge"
                        :class="getGradeBadgeClass(student.averageRegular)"
                        title="Promedio Regular Acumulado"
                      >
                        <span class="qz-grade-lbl">Prom</span>
                        <span class="qz-grade-val">
                          {{
                            student.averageRegular
                              ? student.averageRegular.toFixed(1)
                              : "1.0"
                          }}
                        </span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- BARRA INFERIOR DE ACCIÓN -->
            <div class="qz-bottom-bar">
              <button
                type="button"
                class="qz-bottom-btn qz-bottom-btn--primary"
                @click="crearRefuerzo"
                :disabled="isSaving"
              >
                <ion-spinner
                  v-if="isSaving"
                  name="crescent"
                  class="qz-btn-spinner-inline"
                ></ion-spinner>
                <template v-else>
                  <ion-icon :icon="saveOutline"></ion-icon>
                  <span>
                    {{
                      isEditing
                        ? "Guardar Cambios"
                        : lessonType === LessonType.REMEDIAL
                        ? "Guardar Nivelación"
                        : "Guardar Refuerzo"
                    }}
                    <span class="qz-bottom-count-tag"
                      >({{ selectedCount }})</span
                    >
                  </span>
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toasts de Notificación -->
      <ion-toast
        :is-open="isErrorToastOpen"
        :message="errorMessage"
        :duration="3500"
        color="danger"
        @didDismiss="isErrorToastOpen = false"
      ></ion-toast>
      <ion-toast
        :is-open="isSuccessToastOpen"
        :message="successMessage"
        :duration="3000"
        color="success"
        @didDismiss="isSuccessToastOpen = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref, computed } from "vue";
import {
  LessonType,
  usuarioGet,
  tokenHeader,
  currentServerDate,
  periodosGet,
} from "../globalService";
import { useRoute, useRouter } from "vue-router";
import {
  onIonViewWillEnter,
  IonPage,
  IonHeader,
  IonContent,
  IonIcon,
  IonSpinner,
  IonCheckbox,
  IonToast,
} from "@ionic/vue";
import {
  arrowBackOutline,
  saveOutline,
  peopleOutline,
  calendarOutline,
  bookOutline,
  alertCircleOutline,
  schoolOutline,
  searchOutline,
  closeOutline,
  createOutline,
} from "ionicons/icons";

export default {
  name: "CreateSpecialLesson",
  components: {
    IonPage,
    IonHeader,
    IonContent,
    IonIcon,
    IonSpinner,
    IonCheckbox,
    IonToast,
  },
  setup() {
    const router = useRouter();
    const mroute = useRoute();
    const { curso, area, year, periodo, id, lessonType } = mroute.params;
    const usuario = ref();
    const error = ref("");
    const isEditing = ref(false);
    const isSaving = ref(false);

    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const isSuccessToastOpen = ref(false);
    const successMessage = ref("");

    const searchQuery = ref("");

    const form = ref({
      date: currentServerDate().toISOString().substring(0, 10),
      topic: "",
    });

    const studentList = ref([]);
    const isLoadingStudents = ref(false);

    // Obtener información contextual del curso y área para el Hero
    const courseInfo = computed(() => {
      try {
        const cursosUsuario = JSON.parse(
          localStorage.getItem("cursosUsuario") || "[]"
        );
        const foundCourse = cursosUsuario.find(
          (c) => String(c.id) === String(curso)
        );
        let courseName = foundCourse?.name || "";
        let areaName = "";
        if (foundCourse?.areas) {
          const foundArea = foundCourse.areas.find(
            (a) => String(a.id || a.areaId) === String(area)
          );
          if (foundArea) {
            areaName = foundArea.name || foundArea.areaName || "";
          }
        }
        return { courseName, areaName };
      } catch (e) {
        return { courseName: "", areaName: "" };
      }
    });

    const periodName = computed(() => {
      try {
        const periodos = periodosGet() || [];
        const found = periodos.find((p) => String(p.id) === String(periodo));
        return found?.name || (periodo ? `Periodo ${periodo}` : "");
      } catch (e) {
        return periodo ? `Periodo ${periodo}` : "";
      }
    });

    const heroContextTag = computed(() => {
      const parts = [];
      if (courseInfo.value.courseName) parts.push(courseInfo.value.courseName);
      if (courseInfo.value.areaName) parts.push(courseInfo.value.areaName);
      if (periodName.value) parts.push(periodName.value);
      if (year) parts.push(String(year));
      return parts.join(" · ");
    });

    const heroLessonTypeTag = computed(() => {
      return lessonType === LessonType.REMEDIAL
        ? "NIVELACIÓN PERIÓDICA"
        : "REFUERZO ACADÉMICO";
    });

    const heroMainTitle = computed(() => {
      const typeText =
        lessonType === LessonType.REMEDIAL ? "Nivelación" : "Refuerzo";
      return isEditing.value ? `Editar ${typeText}` : `Nuevo ${typeText}`;
    });

    const pageTitle = computed(() => heroMainTitle.value);

    const selectedCount = computed(() => {
      return studentList.value.filter((s) => s.selected).length;
    });

    const filteredStudents = computed(() => {
      if (!searchQuery.value || !searchQuery.value.trim()) {
        return studentList.value;
      }
      const q = searchQuery.value.toLowerCase().trim();
      return studentList.value.filter((s) => s.name.toLowerCase().includes(q));
    });

    const toggleStudent = (student) => {
      student.selected = !student.selected;
    };

    const getInitials = (fullName) => {
      if (!fullName) return "E";
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    };

    const getGradeBadgeClass = (grade) => {
      if (grade === null || isNaN(grade) || grade === undefined || grade === 0) {
        return "qz-badge--neutral";
      }
      const val = parseFloat(grade);
      if (val < 3.0) return "qz-badge--danger";
      if (val < 4.0) return "qz-badge--warning";
      return "qz-badge--success";
    };

    const goBack = () => {
      router.push(
        `/lecciones/${curso}/${area}/${periodo}/${year}/${lessonType}`
      );
    };

    const showToast = (msg, type = "danger") => {
      if (type === "success") {
        successMessage.value = msg;
        isSuccessToastOpen.value = true;
      } else {
        errorMessage.value = msg;
        isErrorToastOpen.value = true;
      }
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();
      isLoadingStudents.value = true;
      studentList.value = [];
      error.value = "";

      if (id) {
        isEditing.value = true;
      }

      try {
        // Parallel fetch: Grades + Students ( + Lesson Info & Assignments if editing)
        const promises = [
          axios.get(
            `/grades?year=${year}&courseId=${curso}&areaId=${area}&periodId=${periodo}&instituteId=${usuario.value.institute.id}`
          ),
          axios.get(`/courses/${curso}/users?active=true&year=${year}`),
        ];

        if (isEditing.value) {
          promises.push(axios.get(`/lessons/${id}`));
          promises.push(axios.get(`/reinforcement/lesson/${id}`));
        }

        const results = await Promise.all(promises);
        const allGrades = results[0].data;
        const usersData = results[1].data;

        let lessonData = null;
        let assignments = [];

        if (isEditing.value) {
          lessonData = results[2].data;
          assignments = results[3].data; // Reinforcement[]

          form.value.topic = lessonData.topic;
          form.value.date = lessonData.date.substring(0, 10);
        }

        const assignedStudentIds = new Set(
          assignments.map((r) => r.student.id)
        );

        // Extract all students from usersData
        const allStudents = usersData
          .filter((u) => u.rol === "student")
          .map((u) => u.user);

        // Build Master List of Regular Gradable Items (excluding reinforcement)
        const masterItemsMap = new Map();
        allGrades.forEach((grade) => {
          const isReinforcement =
            grade.gradableItem?.lesson?.type === LessonType.REINFORCEMENT;
          const isRemedial =
            grade.gradableItem?.lesson?.type === LessonType.REMEDIAL;

          if (
            !isReinforcement &&
            !isRemedial &&
            grade.gradableItem &&
            grade.gradableItem.id
          ) {
            const uniqueKey = `${grade.gradableType}-${grade.gradableItem.id}-${grade.classification}`;
            if (!masterItemsMap.has(uniqueKey)) {
              masterItemsMap.set(uniqueKey, {
                id: grade.gradableItem.id,
                type: grade.gradableType,
                classification: grade.classification,
              });
            }
          }
        });

        // Split Master List by Classification
        const masterKnowledge = Array.from(masterItemsMap.values()).filter(
          (i) => i.classification === "knowledge"
        );
        const masterExecution = Array.from(masterItemsMap.values()).filter(
          (i) => i.classification === "execution"
        );
        const masterBehavior = Array.from(masterItemsMap.values()).filter(
          (i) => i.classification === "behavior"
        );

        // Build Master List for REINFORCEMENT (needed for RF calculation)
        const masterReinfMap = new Map();
        allGrades.forEach((grade) => {
          if (
            grade.gradableItem?.lesson?.type === LessonType.REINFORCEMENT &&
            grade.gradableItem?.id
          ) {
            const uniqueKey = `${grade.gradableType}-${grade.gradableItem.id}-${grade.classification}`;
            if (!masterReinfMap.has(uniqueKey)) {
              masterReinfMap.set(uniqueKey, {
                id: grade.gradableItem.id,
                type: grade.gradableType,
                classification: grade.classification,
              });
            }
          }
        });

        const masterKnowledgeReinf = Array.from(masterReinfMap.values()).filter(
          (i) => i.classification === "knowledge"
        );
        const masterExecutionReinf = Array.from(masterReinfMap.values()).filter(
          (i) => i.classification === "execution"
        );
        const masterBehaviorReinf = Array.from(masterReinfMap.values()).filter(
          (i) => i.classification === "behavior"
        );

        // Fetch Reinforcement Students for filtering Remedial
        let reinforcementStudentsSet = new Set();
        if (lessonType === LessonType.REMEDIAL) {
          const reinfRes = await axios.get(
            `/reinforcement/by-context?courseId=${curso}&areaId=${area}&periodId=${periodo}&year=${year}&lessonType=${LessonType.REINFORCEMENT}`
          );
          reinforcementStudentsSet = new Set(
            reinfRes.data.map((r) => r.student.id)
          );
        }

        const formatGrade = (grade) => {
          if (!grade && grade !== 0) return 0;
          return Math.floor(grade * 10) / 10;
        };

        const calculateAverageFromMasterList = (studentGrades, masterList) => {
          if (masterList.length === 0) return 0;
          let totalScore = 0;
          masterList.forEach((masterItem) => {
            const foundGrade = studentGrades.find(
              (g) =>
                g.gradableType === masterItem.type &&
                g.gradableItem.id === masterItem.id &&
                g.classification === masterItem.classification
            );
            if (foundGrade && foundGrade.grade !== null) {
              totalScore += foundGrade.grade;
            }
          });
          const avg = totalScore / masterList.length;
          return Math.max(avg, 1.0);
        };

        const calcPromedioFinal = (grades, mK, mE, mB) => {
          const pS = calculateAverageFromMasterList(grades, mK);
          const pH = calculateAverageFromMasterList(grades, mE);
          const pB = calculateAverageFromMasterList(grades, mB);
          if (pS === 0 && pH === 0 && pB === 0) return 0;

          const avgFinal = (pS + pH + pB) / 3;
          return Math.max(avgFinal, 1.0);
        };

        studentList.value = allStudents
          .filter((student) => {
            if (lessonType === LessonType.REMEDIAL) {
              return reinforcementStudentsSet.has(student.id);
            }
            return true;
          })
          .map((student) => {
            const studentGrades = allGrades
              .filter((g) => g.user.id === student.id)
              .map((n) => ({ ...n, grade: formatGrade(n.grade) }));

            // Calculate Averages based on Master Lists
            const promedioRegular = calcPromedioFinal(
              studentGrades,
              masterKnowledge,
              masterExecution,
              masterBehavior
            );

            const promedioReinforcement = calcPromedioFinal(
              studentGrades,
              masterKnowledgeReinf,
              masterExecutionReinf,
              masterBehaviorReinf
            );

            return {
              id: student.id,
              name: student.name + " " + (student.lastName || ""),
              averageRegular: formatGrade(promedioRegular),
              averageReinforcement: formatGrade(promedioReinforcement),
              selected: isEditing.value
                ? assignedStudentIds.has(student.id)
                : false,
            };
          })
          .sort((a, b) => (a.averageRegular || 0) - (b.averageRegular || 0));
      } catch (e) {
        console.error("Error al cargar datos:", e);
        error.value = "Error al cargar la lista de estudiantes y notas.";
        showToast("Error al cargar datos", "danger");
      } finally {
        isLoadingStudents.value = false;
      }
    });

    const crearRefuerzo = async () => {
      error.value = "";
      if (!form.value.topic || !form.value.topic.trim() || !form.value.date) {
        error.value = "Por favor completa la fecha y el tema de la sesión.";
        showToast("Por favor completa la fecha y el tema de la sesión.", "danger");
        return;
      }

      const selectedStudentIds = studentList.value
        .filter((s) => s.selected)
        .map((s) => s.id);

      isSaving.value = true;
      try {
        if (isEditing.value) {
          await axios.patch(`/reinforcement/lesson/${id}`, {
            topic: form.value.topic.trim(),
            date: form.value.date,
            studentIds: selectedStudentIds,
            teacherId: usuario.value.id,
            lessonType: lessonType,
          });
        } else {
          await axios.post("/reinforcement/lesson", {
            topic: form.value.topic.trim(),
            date: form.value.date,
            year: parseInt(year),
            courseId: parseInt(curso),
            areaId: parseInt(area),
            periodId: parseInt(periodo),
            instituteId: usuario.value.institute.id,
            teacherId: usuario.value.id,
            studentIds: selectedStudentIds,
            lessonType: lessonType,
            exist: true,
          });
        }

        showToast(
          isEditing.value
            ? "Lección especial actualizada exitosamente"
            : "Lección especial creada exitosamente",
          "success"
        );

        setTimeout(() => {
          router.push(
            `/lecciones/${curso}/${area}/${periodo}/${year}/${lessonType}`
          );
        }, 300);
      } catch (e) {
        console.error("Error al guardar lección especial:", e);
        error.value = "Error al guardar la lección especial. Intenta de nuevo.";
        showToast("Error al guardar la lección especial", "danger");
      } finally {
        isSaving.value = false;
      }
    };

    return {
      form,
      studentList,
      filteredStudents,
      searchQuery,
      crearRefuerzo,
      curso,
      area,
      year,
      periodo,
      arrowBackOutline,
      saveOutline,
      peopleOutline,
      calendarOutline,
      bookOutline,
      alertCircleOutline,
      schoolOutline,
      searchOutline,
      closeOutline,
      createOutline,
      error,
      isLoadingStudents,
      isEditing,
      isSaving,
      pageTitle,
      heroMainTitle,
      heroLessonTypeTag,
      heroContextTag,
      lessonType,
      LessonType,
      selectedCount,
      toggleStudent,
      getInitials,
      getGradeBadgeClass,
      goBack,
      isErrorToastOpen,
      errorMessage,
      isSuccessToastOpen,
      successMessage,
    };
  },
};
</script>

<style scoped>
/* ─── BASE Y LAYOUT QUEEZY ─────────────────────────────────────────────────── */
.qz-special-lesson-page {
  background-color: var(--qz-color-purple-bg, #efeefc);
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.qz-special-lesson-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-page-wrapper {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* ─── 1. BARRA SUPERIOR FIJA QUEEZY ────────────────────────────────────────── */
.qz-sticky-header {
  background: #6a5ae0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.qz-hero-top {
  max-width: 680px;
  margin: 0 auto;
  padding: max(10px, env(safe-area-inset-top)) 16px 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Botón Volver Circular */
.qz-back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

/* Píldora Central Dinámica */
.qz-hero-pills {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.qz-summary-pill {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.32);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 6px 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

.qz-summary-pill ion-icon {
  font-size: 16px;
}

.qz-pill-num {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.qz-pill-label-short {
  display: none;
}

/* Botón Circular Guardar en Barra Superior */
.qz-hero-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.qz-save-hero-btn {
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.qz-save-hero-btn:active:not(:disabled) {
  transform: scale(0.92);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.qz-save-hero-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.qz-btn-spinner {
  width: 20px;
  height: 20px;
  --color: var(--ion-color-primary, #6a5ae0);
}

/* ─── 2. HERO BANNER PÚRPURA ───────────────────────────────────────────────── */
.qz-hero-banner {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 80%, #efeefc 100%);
  padding: 14px 20px 24px 20px;
  flex-shrink: 0;
}

.qz-hero-titles {
  max-width: 680px;
  margin: 0 auto;
  text-align: left;
}

.qz-hero-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.88);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.qz-hero-title {
  margin: 2px 0 6px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
  line-height: 1.2;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 400;
  line-height: 1.4;
}

/* ─── 3. CUERPO PRINCIPAL Y CONTENEDOR ─────────────────────────────────────── */
.qz-main-body {
  flex: 1;
  padding: 10px 16px 36px 16px;
}

.qz-container {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── ALERTA VISUAL ────────────────────────────────────────────────────────── */
.qz-alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  font-size: 13px;
  animation: qzFadeIn 0.2s ease-out;
}

.qz-alert-banner--danger {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.28);
  color: #b91c1c;
}

.qz-alert-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.qz-alert-content {
  flex: 1;
}

.qz-alert-content strong {
  display: block;
  font-weight: 700;
  margin-bottom: 2px;
}

.qz-alert-content p {
  margin: 0;
  font-size: 12.5px;
}

.qz-alert-close-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ─── CARD DE DATOS DE LA LECCIÓN ──────────────────────────────────────────── */
.qz-form-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 18px 20px;
  box-shadow: 0 4px 18px rgba(106, 90, 224, 0.08);
  border: 1px solid rgba(106, 90, 224, 0.1);
}

.qz-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.qz-card-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(106, 90, 224, 0.1);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-card-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
  letter-spacing: -0.2px;
}

.qz-card-subtitle {
  margin: 2px 0 0 0;
  font-size: 12.5px;
  color: #858399;
}

.qz-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.qz-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-sub-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: #49465f;
}

.qz-sub-label ion-icon {
  font-size: 14px;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-input-wrap {
  position: relative;
  width: 100%;
}

.qz-input-wrap--icon .qz-input-lead-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #858399;
  pointer-events: none;
  transition: color 0.15s ease;
}

.qz-text-input {
  width: 100%;
  background: #f9f9fe;
  border: 1.5px solid #eceaf9;
  border-radius: 14px;
  padding: 11px 14px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13.5px;
  font-weight: 600;
  color: #0c092a;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.qz-text-input.qz-input--has-icon {
  padding-left: 40px;
}

.qz-text-input:focus {
  border-color: var(--ion-color-primary, #6a5ae0);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.15);
}

.qz-text-input:focus + .qz-input-lead-icon,
.qz-input-wrap:focus-within .qz-input-lead-icon {
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-text-input::placeholder {
  color: #b8b6cb;
  font-weight: 400;
}

/* ─── 4. CABECERA DE ASIGNACIÓN Y BUSCADOR ──────────────────────────────────── */
.qz-toolbox-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: 0 3px 14px rgba(106, 90, 224, 0.06);
  border: 1px solid rgba(106, 90, 224, 0.08);
}

.qz-toolbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.qz-toolbox-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-toolbox-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 15px;
  font-weight: 800;
  color: #0c092a;
}

.qz-toolbox-badge {
  background: rgba(106, 90, 224, 0.08);
  color: var(--ion-color-primary, #6a5ae0);
  font-size: 11.5px;
  font-weight: 700;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 2px 8px;
}

/* Buscador de estudiantes */
.qz-search-wrap {
  position: relative;
  min-width: 200px;
  flex: 1;
  max-width: 280px;
}

.qz-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  color: #858399;
  pointer-events: none;
}

.qz-search-input {
  width: 100%;
  background: #f9f9fe;
  border: 1px solid #eceaf9;
  border-radius: 9999px;
  padding: 7px 28px 7px 32px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12.5px;
  font-weight: 500;
  color: #0c092a;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.qz-search-input:focus {
  border-color: var(--ion-color-primary, #6a5ae0);
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(106, 90, 224, 0.12);
}

.qz-search-clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  font-size: 14px;
  color: #858399;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
}

/* ─── 5. LISTADO DE ESTUDIANTES (CARDS INTERACTIVAS) ───────────────────────── */
.qz-students-section {
  display: flex;
  flex-direction: column;
}

.qz-students-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-student-card {
  background: #ffffff;
  border: 1.5px solid #eceaf9;
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
  box-shadow: 0 2px 6px rgba(106, 90, 224, 0.03);
}

.qz-student-card:hover {
  transform: translateY(-1px);
  border-color: rgba(106, 90, 224, 0.35);
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.08);
}

.qz-student-card:active {
  transform: scale(0.99);
}

/* Estado Seleccionado */
.qz-student-card.is-selected {
  border-color: var(--ion-color-primary, #6a5ae0);
  background: #f7f6fd;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.12);
}

/* Lado Izquierdo */
.qz-student-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

/* Checkbox circular estilizado */
.qz-round-checkbox {
  --size: 20px;
  --border-radius: 6px;
  --checkbox-background-checked: var(--ion-color-primary, #6a5ae0);
  --border-color-checked: var(--ion-color-primary, #6a5ae0);
  --checkmark-color: #ffffff;
  margin: 0;
  flex-shrink: 0;
}

/* Avatar de Iniciales */
.qz-student-avatar {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e0dcfa 0%, #efeefc 100%);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.2px;
  flex-shrink: 0;
}

.qz-student-card.is-selected .qz-student-avatar {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
}

/* Meta del estudiante */
.qz-student-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.qz-student-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-student-name {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  color: #0c092a;
  line-height: 1.3;
  word-break: break-word;
}

.qz-student-status-text {
  font-size: 11.5px;
  color: #858399;
  font-weight: 400;
}

.qz-student-card.is-selected .qz-student-status-text {
  color: var(--ion-color-primary, #6a5ae0);
  font-weight: 600;
}

/* Lado Derecho: Badges de Calificaciones */
.qz-student-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.qz-grade-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
}

.qz-grade-lbl {
  font-size: 10.5px;
  font-weight: 800;
  opacity: 0.85;
}

.qz-grade-val {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

/* Paleta Semántica Queezy para Notas */
.qz-badge--danger {
  background: #fee2e2;
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.25);
}

.qz-badge--warning {
  background: #fef3c7;
  color: #d97706;
  border-color: rgba(217, 119, 6, 0.25);
}

.qz-badge--success {
  background: #dcfce7;
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.25);
}

.qz-badge--neutral {
  background: #f1f0f7;
  color: #635f7a;
  border-color: #e2e0ed;
}

/* ─── ESTADOS DE CARGA Y VACÍO ─────────────────────────────────────────────── */
.qz-loading-card,
.qz-empty-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 36px 20px;
  text-align: center;
  box-shadow: 0 3px 14px rgba(106, 90, 224, 0.05);
  border: 1px solid rgba(106, 90, 224, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qz-loading-spinner {
  width: 32px;
  height: 32px;
  --color: var(--ion-color-primary, #6a5ae0);
  margin-bottom: 12px;
}

.qz-loading-text {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: #635f7a;
}

.qz-empty-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(106, 90, 224, 0.08);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-bottom: 12px;
}

.qz-empty-title {
  margin: 0 0 4px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 16px;
  font-weight: 800;
  color: #0c092a;
}

.qz-empty-desc {
  margin: 0;
  font-size: 13px;
  color: #858399;
  max-width: 360px;
  line-height: 1.4;
}

.qz-clear-filter-btn {
  margin-top: 14px;
  background: #f1f0f7;
  color: #635f7a;
  border: 1px solid #e2e0ed;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 6px 14px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.qz-clear-filter-btn:hover {
  background: #e7e5f3;
}

/* ─── 6. BARRA INFERIOR DE ACCIÓN ──────────────────────────────────────────── */
.qz-bottom-bar {
  display: flex;
  margin-top: 12px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.qz-bottom-btn {
  border: none;
  border-radius: 16px;
  height: 48px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  user-select: none;
}

.qz-bottom-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.qz-bottom-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.qz-bottom-btn--primary {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  width: 100%;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.3);
}

.qz-bottom-count-tag {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 9999px;
  padding: 1px 7px;
  font-size: 12px;
  margin-left: 2px;
}

.qz-btn-spinner-inline {
  width: 20px;
  height: 20px;
  --color: #ffffff;
}

/* ─── 7. MODO OSCURO (DARK THEME) ─────────────────────────────────────────── */
body.dark .qz-special-lesson-page,
.dark .qz-special-lesson-page,
@media (prefers-color-scheme: dark) {
  .qz-special-lesson-page {
    --background: #16132b;
    background-color: #16132b;
  }
  .qz-special-lesson-content {
    --background: #16132b;
  }

  .qz-hero-banner {
    background: linear-gradient(180deg, #6a5ae0 0%, #5748c9 80%, #16132b 100%);
  }

  .qz-form-card,
  .qz-toolbox-card,
  .qz-loading-card,
  .qz-empty-card {
    background: #1e1a3a;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .qz-card-title,
  .qz-toolbox-title,
  .qz-empty-title,
  .qz-student-name {
    color: #f3f2ff;
  }

  .qz-card-subtitle,
  .qz-sub-label,
  .qz-empty-desc,
  .qz-student-status-text {
    color: #a5a1c9;
  }

  .qz-text-input,
  .qz-search-input {
    background: #16132b;
    border-color: #2e2954;
    color: #f3f2ff;
  }

  .qz-text-input:focus,
  .qz-search-input:focus {
    border-color: #8c7eff;
    background: #1a1633;
  }

  .qz-student-card {
    background: #1e1a3a;
    border-color: #2a2550;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .qz-student-card.is-selected {
    background: #252048;
    border-color: #8c7eff;
    box-shadow: 0 4px 16px rgba(140, 126, 255, 0.15);
  }

  .qz-student-avatar {
    background: linear-gradient(135deg, #2d2660 0%, #3a3278 100%);
    color: #c4beff;
  }

  .qz-clear-filter-btn {
    background: #252048;
    color: #c4beff;
    border-color: #373068;
  }

  .qz-clear-filter-btn:hover {
    background: #2f295b;
  }

  .qz-badge--neutral {
    background: #252048;
    color: #c4beff;
    border-color: #373068;
  }

  .qz-badge--danger {
    background: rgba(239, 68, 68, 0.22);
    color: #fca5a5;
    border-color: rgba(239, 68, 68, 0.4);
  }

  .qz-badge--warning {
    background: rgba(245, 158, 11, 0.22);
    color: #fcd34d;
    border-color: rgba(245, 158, 11, 0.4);
  }

  .qz-badge--success {
    background: rgba(16, 185, 129, 0.22);
    color: #86efac;
    border-color: rgba(16, 185, 129, 0.4);
  }
}

/* ─── 8. RESPONSIVIDAD MÓVIL (< 600px) ─────────────────────────────────────── */
@media (max-width: 600px) {
  .qz-pill-label-full {
    display: none;
  }

  .qz-pill-label-short {
    display: inline;
  }

  .qz-hero-top {
    padding: max(8px, env(safe-area-inset-top)) 12px 10px 12px;
    gap: 8px;
  }

  .qz-back-btn,
  .qz-save-hero-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    font-size: 18px;
  }

  .qz-hero-banner {
    padding: 10px 14px 20px 14px;
  }

  .qz-hero-title {
    font-size: 21px;
  }

  .qz-hero-subtitle {
    font-size: 12.5px;
  }

  .qz-main-body {
    padding: 8px 12px 28px 12px;
  }

  .qz-form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .qz-toolbox-header {
    flex-direction: column;
    align-items: stretch;
  }

  .qz-search-wrap {
    max-width: 100%;
    min-width: 100%;
  }

  .qz-student-card {
    padding: 10px 12px;
    gap: 8px;
  }

  .qz-student-avatar {
    width: 34px;
    height: 34px;
    min-width: 34px;
    font-size: 12px;
  }

  .qz-student-name {
    font-size: 13.5px;
  }

  .qz-student-right {
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;
  }

  .qz-grade-badge {
    padding: 2px 6px;
    font-size: 11px;
  }
}

@keyframes qzFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
