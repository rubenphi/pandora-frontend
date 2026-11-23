<template>
  <ion-page class="ion-page qz-areas-page">
    <ion-content class="qz-areas-content">
      <div class="qz-page-wrapper">
        <!-- 1. CABECERA HERO QUEEZY PÚRPURA -->
        <div class="qz-hero-header">
          <!-- Barra superior: Botón volver + Insignia del curso -->
          <div class="qz-hero-top">
            <button
              type="button"
              class="qz-back-btn"
              title="Regresar a Cursos"
              @click="goBack"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </button>

            <div class="qz-course-badge" v-if="courseName">
              <ion-icon
                :icon="schoolOutline"
                class="qz-course-badge-icon"
              ></ion-icon>
              <span>{{ courseName }}</span>
            </div>
          </div>

          <!-- Títulos del Hero -->
          <div class="qz-hero-titles">
            <span class="qz-hero-tag">GESTIÓN ACADÉMICA</span>
            <h1 class="qz-hero-title">
              {{ courseName ? courseName : "Áreas y Materias" }}
            </h1>
            <p class="qz-hero-subtitle">
              Selecciona un área para ingresar a sus lecciones y actividades
            </p>
          </div>

          <!-- Filtros de Año y Periodo en Píldoras Queezy -->
          <div class="qz-filters-row">
            <!-- Filtro de Año -->
            <div class="qz-filter-pill">
              <ion-icon
                :icon="calendarOutline"
                class="qz-filter-icon"
              ></ion-icon>
              <span class="qz-filter-label">Año:</span>
              <ion-select
                v-model="yearSelected"
                interface="popover"
                class="qz-filter-select"
                :interface-options="{ cssClass: 'qz-popover-filter' }"
                @ionChange="changeYear($event)"
              >
                <ion-select-option
                  v-for="year in years"
                  :key="year"
                  :value="year"
                >
                  {{ year }}
                </ion-select-option>
              </ion-select>
            </div>

            <!-- Filtro de Periodo (Resaltado con pulso si no hay selección) -->
            <div
              class="qz-filter-pill"
              :class="{
                'qz-filter-pill--alert': !periodoSelected,
                'qz-filter-pill--pulse': shouldHighlightPeriod,
              }"
            >
              <ion-icon :icon="timeOutline" class="qz-filter-icon"></ion-icon>
              <span class="qz-filter-label">Periodo:</span>
              <ion-select
                v-model="periodoSelected"
                placeholder="Elegir..."
                interface="popover"
                class="qz-filter-select"
                :interface-options="{ cssClass: 'qz-popover-filter' }"
                @ionChange="changePeriodo($event)"
              >
                <ion-select-option
                  v-for="periodo in periodos"
                  :key="periodo.id"
                  :value="periodo.id"
                >
                  {{ periodo.name }}
                </ion-select-option>
              </ion-select>
            </div>
          </div>
        </div>

        <!-- 2. CUERPO: SECCIÓN DE ÁREAS (Estilo image7) Y ACORDEÓN (Estilo image13) -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- Encabezado de la Sección (Estilo image7) -->
            <div class="qz-section-header">
              <div class="qz-section-title-wrap">
                <h2 class="qz-section-title">Áreas</h2>
                <span class="qz-section-count" v-if="areas && areas.length > 0">
                  {{ areas.length }}
                </span>
              </div>
              <span class="qz-period-indicator" v-if="periodoSelectedName">
                {{ periodoSelectedName }}
              </span>
            </div>

            <!-- Lista de Áreas -->
            <div v-if="areas && areas.length > 0" class="qz-areas-list">
              <div
                v-for="(area, index) in areas"
                :key="area.id"
                class="qz-area-item"
              >
                <!-- Tarjeta Principal del Área (Estilo image7_1_2_375x812.png) -->
                <div
                  class="qz-area-card"
                  :class="{
                    'qz-area-card--active': expandedAreaId === area.id,
                  }"
                  @click="toggleArea(area.id)"
                >
                  <!-- Squircle Pastel con icono de Materia -->
                  <div
                    class="qz-area-squircle"
                    :class="getSquircleColor(index)"
                  >
                    <ion-icon :icon="bookOutline"></ion-icon>
                  </div>

                  <!-- Textos del Área -->
                  <div class="qz-area-info">
                    <h3 class="qz-area-name">{{ area.name }}</h3>
                    <p class="qz-area-sub">
                      {{
                        expandedAreaId === area.id
                          ? "Selecciona una actividad:"
                          : "Lecciones, refuerzos y nivelaciones"
                      }}
                    </p>
                  </div>

                  <!-- Chevron indicador de apertura -->
                  <div
                    class="qz-area-chevron"
                    :class="{ 'qz-chevron--open': expandedAreaId === area.id }"
                  >
                    <ion-icon :icon="chevronForwardOutline"></ion-icon>
                  </div>
                </div>

                <!-- Acordeón / Sub-tarjeta con opciones (Estilo image13_1_2_375x1211.png) -->
                <div v-if="expandedAreaId === area.id" class="qz-options-card">
                  <!-- 1. Lecciones Estándar -->
                  <div
                    class="qz-option-row"
                    @click.stop="navigateToTab3(area.id, LessonType.STANDARD)"
                  >
                    <div class="qz-option-badge qz-badge--purple">
                      <ion-icon :icon="documentTextOutline"></ion-icon>
                    </div>
                    <div class="qz-option-info">
                      <h4 class="qz-option-title">Lecciones</h4>
                      <p class="qz-option-desc">
                        Cuestionarios y contenido temático
                      </p>
                    </div>
                    <div class="qz-option-arrow">
                      <ion-icon :icon="chevronForwardOutline"></ion-icon>
                    </div>
                  </div>

                  <!-- 2. Refuerzos -->
                  <div
                    v-if="adminOProfesor || hasReinforcement(area.id)"
                    class="qz-option-row"
                    @click.stop="
                      navigateToTab3(area.id, LessonType.REINFORCEMENT)
                    "
                  >
                    <div class="qz-option-badge qz-badge--coral">
                      <ion-icon :icon="trendingUpOutline"></ion-icon>
                    </div>
                    <div class="qz-option-info">
                      <div class="qz-option-title-row">
                        <h4 class="qz-option-title">Refuerzos</h4>
                        <span
                          v-if="assignmentsCount[area.id]?.reinforcement"
                          class="qz-count-chip qz-chip--coral"
                        >
                          {{ assignmentsCount[area.id].reinforcement }}
                        </span>
                      </div>
                      <p class="qz-option-desc">
                        Actividades de apoyo asignadas
                      </p>
                    </div>
                    <div class="qz-option-arrow">
                      <ion-icon :icon="chevronForwardOutline"></ion-icon>
                    </div>
                  </div>

                  <!-- 3. Nivelaciones -->
                  <div
                    v-if="adminOProfesor || hasRemedial(area.id)"
                    class="qz-option-row"
                    @click.stop="navigateToTab3(area.id, LessonType.REMEDIAL)"
                  >
                    <div class="qz-option-badge qz-badge--cyan">
                      <ion-icon :icon="helpBuoyOutline"></ion-icon>
                    </div>
                    <div class="qz-option-info">
                      <div class="qz-option-title-row">
                        <h4 class="qz-option-title">Nivelaciones</h4>
                        <span
                          v-if="assignmentsCount[area.id]?.remedial"
                          class="qz-count-chip qz-chip--cyan"
                        >
                          {{ assignmentsCount[area.id].remedial }}
                        </span>
                      </div>
                      <p class="qz-option-desc">
                        Plan de mejora y recuperación
                      </p>
                    </div>
                    <div class="qz-option-arrow">
                      <ion-icon :icon="chevronForwardOutline"></ion-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Estado Vacío -->
            <div v-else class="qz-empty-card">
              <div class="qz-empty-icon-box">
                <ion-icon :icon="libraryOutline"></ion-icon>
              </div>
              <h3 class="qz-empty-title">Sin áreas asignadas</h3>
              <p class="qz-empty-desc">
                No se encontraron áreas activas para este curso en el año
                lectivo {{ yearSelected }}.
              </p>
            </div>
          </div>
        </div>

        <!-- Alerta Toast de Periodo Faltante -->
        <ion-toast
          :is-open="isOpen"
          position="bottom"
          message="Por favor, selecciona un periodo antes de continuar."
          :duration="3000"
          color="warning"
          @didDismiss="setOpen(false)"
        >
          <ion-icon slot="start" :icon="alertCircleOutline"></ion-icon>
        </ion-toast>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import {
  tokenHeader,
  usuarioGet,
  periodosGet,
  adminOprofesor,
  LessonType,
  currentServerYear,
} from "../globalService";

import {
  bookOutline,
  libraryOutline,
  schoolOutline,
  arrowBackOutline,
  chevronForwardOutline,
  calendarOutline,
  timeOutline,
  documentTextOutline,
  trendingUpOutline,
  helpBuoyOutline,
  alertCircleOutline,
} from "ionicons/icons";

import {
  onIonViewWillEnter,
  IonPage,
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonToast,
} from "@ionic/vue";

export default {
  name: "AreasPage",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonToast,
  },
  setup() {
    const mroute = useRoute();
    const router = useRouter();
    const { id } = mroute.params;

    const usuario = ref();
    const areas = ref([]);
    const courseName = ref("");
    const isOpen = ref(false);
    const shouldHighlightPeriod = ref(false);
    const expandedAreaId = ref(null);
    const assignmentsCount = ref({}); // { areaId: { reinforcement: 0, remedial: 0 } }

    const adminOProfesor = ref(false);
    const periodos = ref([]);
    const periodoSelected = ref();
    const years = ref([]);
    const yearSelected = ref();

    const isStudent = computed(() => {
      return usuario.value?.rol === "student" || usuario.value?.rol === "user";
    });

    const periodoSelectedName = computed(() => {
      if (!periodos.value || !periodoSelected.value) return "";
      const p = periodos.value.find((item) => item.id == periodoSelected.value);
      return p ? p.name : "";
    });

    // Paleta pastel para squircles
    const colorClasses = [
      "qz-squircle--purple",
      "qz-squircle--coral",
      "qz-squircle--cyan",
      "qz-squircle--gold",
      "qz-squircle--green",
    ];

    const getSquircleColor = (index) => {
      return colorClasses[index % colorClasses.length];
    };

    const presentToast = () => {
      isOpen.value = true;
    };

    const setOpen = (state) => {
      isOpen.value = state;
    };

    const toggleArea = (areaId) => {
      if (!periodoSelected.value) {
        shouldHighlightPeriod.value = true;
        setTimeout(() => {
          shouldHighlightPeriod.value = false;
        }, 2200);
        presentToast();
        return;
      }

      if (expandedAreaId.value === areaId) {
        expandedAreaId.value = null;
      } else {
        expandedAreaId.value = areaId;
      }
    };

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/cuestionarios");
      }
    };

    const fetchStudentAssignments = async () => {
      try {
        const counts = await Promise.all(
          areas.value.flatMap((area) => [
            axios.get("/reinforcement/count", {
              params: {
                studentId: usuario.value.id,
                courseId: id,
                areaId: area.id,
                periodId: periodoSelected.value,
                year: yearSelected.value,
                lessonType: LessonType.REINFORCEMENT,
              },
            }),
            axios.get("/reinforcement/count", {
              params: {
                studentId: usuario.value.id,
                courseId: id,
                areaId: area.id,
                periodId: periodoSelected.value,
                year: yearSelected.value,
                lessonType: LessonType.REMEDIAL,
              },
            }),
          ]),
        );

        let idx = 0;
        areas.value.forEach((area) => {
          assignmentsCount.value[area.id] = {
            reinforcement: counts[idx++].data,
            remedial: counts[idx++].data,
          };
        });
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    onIonViewWillEnter(async () => {
      adminOProfesor.value = adminOprofesor();
      periodos.value = periodosGet();
      periodoSelected.value = JSON.parse(
        localStorage.getItem("periodoSelected"),
      );
      const curServerYear = currentServerYear();
      years.value = new Array(10).fill(0).map((_, i) => curServerYear - i);

      const storedYear = localStorage.getItem("year");
      yearSelected.value = storedYear ? JSON.parse(storedYear) : curServerYear;

      usuario.value = usuarioGet();
      tokenHeader();

      // Leer nombre del curso
      const storedCourse = localStorage.getItem("courseSelected");
      if (storedCourse) {
        try {
          const parsed = JSON.parse(storedCourse);
          courseName.value = parsed.name || "";
        } catch (e) {
          console.error("Error reading course name:", e);
        }
      }

      if (usuario.value.rol === "student" || usuario.value.rol === "user") {
        const cursosUsuario =
          JSON.parse(localStorage.getItem("cursosUsuario")) || [];
        const sortedCourses = cursosUsuario.sort((a, b) => b.year - a.year);

        const storedYearValue = storedYear ? JSON.parse(storedYear) : null;
        const isValidStoredYear = sortedCourses.some(
          (c) => c.year == storedYearValue,
        );

        if (isValidStoredYear) {
          yearSelected.value = storedYearValue;
        } else if (sortedCourses.length > 0) {
          yearSelected.value = sortedCourses[0].year;
          localStorage.setItem("year", JSON.stringify(yearSelected.value));
        }

        const courseSelected =
          sortedCourses.find(
            (c) =>
              c.year == yearSelected.value &&
              (c.active == 1 || c.active === true || c.active),
          ) || sortedCourses[0];

        if (courseSelected) {
          localStorage.setItem(
            "courseSelected",
            JSON.stringify(courseSelected),
          );
          if (courseSelected.name) {
            courseName.value = courseSelected.name;
          }
        }
      }

      // Cargar áreas del curso
      try {
        const allCourseAreas = await axios
          .get(`/courses/${id}/areas`)
          .then((res) => res.data);

        const courseAssignments = await axios
          .get(`/courses/${id}/areas-teachers`)
          .then((res) => res.data);

        const isAdminView = localStorage.getItem("adminView") === "true";

        if (usuario.value.rol === "admin" && isAdminView) {
          areas.value = allCourseAreas;
        } else if (
          usuario.value.rol === "teacher" ||
          usuario.value.rol === "director" ||
          usuario.value.rol === "coordinator" ||
          (usuario.value.rol === "admin" && !isAdminView)
        ) {
          areas.value = allCourseAreas.filter((area) => {
            return courseAssignments.some((assignment) => {
              return (
                (assignment.active == 1 ||
                  assignment.active === true ||
                  assignment.active) &&
                Number(assignment.area.id) === Number(area.id) &&
                Number(assignment.teacher?.id) === Number(usuario.value.id)
              );
            });
          });
        } else if (isStudent.value) {
          areas.value = allCourseAreas.filter((area) => {
            return courseAssignments.some((assignment) => {
              return (
                (assignment.active == 1 ||
                  assignment.active === true ||
                  assignment.active) &&
                Number(assignment.area.id) === Number(area.id) &&
                assignment.teacher
              );
            });
          });
        } else {
          areas.value = allCourseAreas;
        }
      } catch (err) {
        console.error("Error loading areas:", err);
        areas.value = [];
      }
    });

    watch([areas, periodoSelected], () => {
      if (isStudent.value && areas.value.length > 0 && periodoSelected.value) {
        fetchStudentAssignments();
      }
    });

    const changePeriodo = (event) => {
      const pVal = event.detail.value;
      localStorage.setItem("periodoSelected", JSON.stringify(pVal));
      periodoSelected.value = pVal;
    };

    const changeYear = (event) => {
      const selectedYearValue = event.detail.value;
      localStorage.setItem("year", JSON.stringify(selectedYearValue));
      yearSelected.value = selectedYearValue;

      if (usuario.value?.rol === "student" || usuario.value?.rol === "user") {
        const cursosUsuario =
          JSON.parse(localStorage.getItem("cursosUsuario")) || [];
        const courseForYear = cursosUsuario.find(
          (c) => c.year == selectedYearValue,
        );
        if (courseForYear) {
          localStorage.setItem("courseSelected", JSON.stringify(courseForYear));
          if (id != courseForYear.id) {
            router.push(`/areas/${courseForYear.id}`);
          }
        }
      }
    };

    const navigateToTab3 = (areaId, type) => {
      if (!periodoSelected.value) {
        presentToast();
        return;
      }

      router.push(
        `/lecciones/${id}/${areaId}/${periodoSelected.value}/${yearSelected.value}/${type}`,
      );
    };

    const hasReinforcement = (areaId) => {
      return assignmentsCount.value[areaId]?.reinforcement > 0;
    };

    const hasRemedial = (areaId) => {
      return assignmentsCount.value[areaId]?.remedial > 0;
    };

    return {
      usuario,
      areas,
      courseName,
      periodos,
      periodoSelected,
      periodoSelectedName,
      years,
      yearSelected,
      adminOProfesor,
      isStudent,
      isOpen,
      shouldHighlightPeriod,
      expandedAreaId,
      assignmentsCount,
      LessonType,
      toggleArea,
      changePeriodo,
      changeYear,
      navigateToTab3,
      hasReinforcement,
      hasRemedial,
      presentToast,
      setOpen,
      goBack,
      getSquircleColor,
      bookOutline,
      libraryOutline,
      schoolOutline,
      arrowBackOutline,
      chevronForwardOutline,
      calendarOutline,
      timeOutline,
      documentTextOutline,
      trendingUpOutline,
      helpBuoyOutline,
      alertCircleOutline,
    };
  },
};
</script>

<style scoped>
.qz-areas-page {
  background-color: var(--qz-color-purple-bg, #efeefc);
}

.qz-areas-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-page-wrapper {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: 70px;
}

/* 1. CABECERA HERO QUEEZY PÚRPURA */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 20px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 540px;
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

.qz-course-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 5px 14px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.qz-course-badge-icon {
  font-size: 16px;
}

/* Títulos del Hero */
.qz-hero-titles {
  max-width: 540px;
  margin: 0 auto;
  padding: 0 20px 14px 20px;
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
  margin: 3px 0 4px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

/* Fila de Filtros en Píldoras */
.qz-filters-row {
  max-width: 540px;
  margin: 0 auto;
  padding: 0 18px;
  display: flex;
  gap: 10px;
}

.qz-filter-pill {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 3px 12px;
  color: #ffffff;
  transition: all 0.2s ease;
}

.qz-filter-pill--alert {
  background: rgba(255, 117, 98, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
}

.qz-filter-pill--pulse {
  animation: qz-pulse-glow 0.6s ease infinite alternate;
}

@keyframes qz-pulse-glow {
  from {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  to {
    transform: scale(1.03);
    box-shadow: 0 0 12px 2px rgba(255, 255, 255, 0.6);
  }
}

.qz-filter-icon {
  font-size: 16px;
  margin-right: 5px;
  color: #ffffff;
  flex-shrink: 0;
}

.qz-filter-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-right: 4px;
  flex-shrink: 0;
}

.qz-filter-select {
  --color: #ffffff;
  --placeholder-color: rgba(255, 255, 255, 0.85);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  padding-left: 0;
  width: 100%;
}

/* 2. CUERPO PRINCIPAL */
.qz-main-body {
  flex: 1;
  padding: 10px 18px 28px 18px;
}

.qz-container {
  max-width: 540px;
  margin: 0 auto;
}

/* Encabezado de Sección estilo image7 */
.qz-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 0 4px;
}

.qz-section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-section-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 20px;
  font-weight: 800;
  color: #0c092a;
  letter-spacing: -0.3px;
}

.qz-section-count {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 2px 8px;
  min-width: 22px;
  text-align: center;
}

.qz-period-indicator {
  font-size: 13px;
  font-weight: 600;
  color: var(--ion-color-primary, #6a5ae0);
  background: #ffffff;
  padding: 3px 10px;
  border-radius: var(--qz-radius-full, 9999px);
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.08);
}

/* Lista de Áreas */
.qz-areas-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-area-item {
  display: flex;
  flex-direction: column;
}

/* Tarjeta de Área estilo image7_1_2_375x812.png */
.qz-area-card {
  background: #ffffff;
  border-radius: var(--qz-radius-xl, 22px);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 6px 20px -4px rgba(106, 90, 224, 0.08);
  border: 1px solid rgba(106, 90, 224, 0.04);
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease,
    border-radius 0.15s ease;
  position: relative;
  z-index: 2;
}

.qz-area-card:active {
  transform: scale(0.98);
}

.qz-area-card--active {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  box-shadow: 0 8px 24px -2px rgba(106, 90, 224, 0.12);
}

/* Squircle de Materia */
.qz-area-squircle {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.qz-area-card:active .qz-area-squircle {
  transform: scale(0.94);
}

/* Paleta Pastel Queezy */
.qz-squircle--purple {
  background-color: #efeefc;
  color: #6a5ae0;
}

.qz-squircle--coral {
  background-color: #ffeaea;
  color: #ff7562;
}

.qz-squircle--cyan {
  background-color: #e2f6fc;
  color: #0582ca;
}

.qz-squircle--gold {
  background-color: #fff3da;
  color: #e59800;
}

.qz-squircle--green {
  background-color: #e4f9ec;
  color: #10b981;
}

/* Info del Área */
.qz-area-info {
  flex: 1;
  min-width: 0;
}

.qz-area-name {
  margin: 0 0 3px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 16px;
  font-weight: 700;
  color: #0c092a;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-area-sub {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: #858494;
}

/* Chevron */
.qz-area-chevron {
  width: 34px;
  height: 34px;
  border-radius: var(--qz-radius-full, 9999px);
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  transition: transform 0.25s ease, background 0.15s ease, color 0.15s ease;
}

.qz-chevron--open {
  transform: rotate(90deg);
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
}

/* Sub-tarjeta de Opciones estilo image13_1_2_375x1211.png */
.qz-options-card {
  background: #f4f3fd;
  border-radius: 0 0 var(--qz-radius-xl, 22px) var(--qz-radius-xl, 22px);
  padding: 14px 12px 14px 12px;
  margin-top: -8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid rgba(106, 90, 224, 0.08);
  border-top: none;
  animation: qz-slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 1;
}

@keyframes qz-slide-down {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fila de opción estilo Questions en image13 */
.qz-option-row {
  background: #ffffff;
  border-radius: var(--qz-radius-lg, 16px);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: 0 3px 10px -2px rgba(106, 90, 224, 0.05);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.qz-option-row:active {
  transform: scale(0.97);
  box-shadow: 0 1px 4px rgba(106, 90, 224, 0.08);
}

.qz-option-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-badge--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-badge--coral {
  background: #ffeaea;
  color: #ff7562;
}

.qz-badge--cyan {
  background: #e2f6fc;
  color: #0582ca;
}

.qz-option-info {
  flex: 1;
  min-width: 0;
}

.qz-option-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-option-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  color: #0c092a;
}

.qz-count-chip {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
}

.qz-chip--coral {
  background: #ffeaea;
  color: #ff7562;
}

.qz-chip--cyan {
  background: #e2f6fc;
  color: #0582ca;
}

.qz-option-desc {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: #858494;
  font-weight: 500;
}

.qz-option-arrow {
  color: #9d9bb0;
  font-size: 16px;
  flex-shrink: 0;
  transition: transform 0.15s ease, color 0.15s ease;
}

.qz-option-row:active .qz-option-arrow {
  transform: translateX(2px);
  color: #6a5ae0;
}

/* Estado Vacío */
.qz-empty-card {
  background: #ffffff;
  border-radius: var(--qz-radius-2xl, 28px);
  padding: 36px 24px;
  text-align: center;
  box-shadow: 0 8px 24px -4px rgba(106, 90, 224, 0.08);
  margin-top: 10px;
}

.qz-empty-icon-box {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin: 0 auto 16px auto;
}

.qz-empty-title {
  margin: 0 0 8px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 18px;
  font-weight: 700;
  color: #0c092a;
}

.qz-empty-desc {
  margin: 0;
  font-size: 14px;
  color: #858494;
  line-height: 1.5;
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-areas-page,
  body:not(.light) .qz-areas-content {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-hero-header {
    background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
  }

  body:not(.light) .qz-section-title,
  body:not(.light) .qz-area-name,
  body:not(.light) .qz-option-title,
  body:not(.light) .qz-empty-title {
    color: #f7f7fd;
  }

  body:not(.light) .qz-period-indicator {
    background: #28214b;
    color: #a39bf0;
  }

  body:not(.light) .qz-area-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.4);
  }

  body:not(.light) .qz-options-card {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.08);
  }

  body:not(.light) .qz-option-row {
    background: #1d1838;
    box-shadow: 0 3px 10px -2px rgba(0, 0, 0, 0.35);
  }

  body:not(.light) .qz-option-desc {
    color: #9e9bb8;
  }

  body:not(.light) .qz-empty-card {
    background: #1d1838;
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.4);
  }

  body:not(.light) .qz-empty-icon-box {
    background: #28214b;
    color: #a39bf0;
  }

  body:not(.light) .qz-squircle--purple,
  body:not(.light) .qz-badge--purple {
    background-color: rgba(124, 110, 242, 0.2);
    color: #a39bf0;
  }

  body:not(.light) .qz-squircle--coral,
  body:not(.light) .qz-badge--coral,
  body:not(.light) .qz-chip--coral {
    background-color: rgba(255, 143, 162, 0.2);
    color: #ff8fa2;
  }

  body:not(.light) .qz-squircle--cyan,
  body:not(.light) .qz-badge--cyan,
  body:not(.light) .qz-chip--cyan {
    background-color: rgba(112, 214, 245, 0.2);
    color: #70d6f5;
  }

  body:not(.light) .qz-squircle--gold {
    background-color: rgba(255, 174, 51, 0.2);
    color: #ffae33;
  }

  body:not(.light) .qz-squircle--green {
    background-color: rgba(83, 223, 131, 0.2);
    color: #53df83;
  }
}

:global(body.dark) .qz-areas-page,
:global(body.dark) .qz-areas-content,
:global(html.dark) .qz-areas-page,
:global(html.dark) .qz-areas-content,
:global(.dark) .qz-areas-page,
:global(.dark) .qz-areas-content {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
}

:global(body.dark) .qz-section-title,
:global(body.dark) .qz-area-name,
:global(body.dark) .qz-option-title,
:global(body.dark) .qz-empty-title,
:global(html.dark) .qz-section-title,
:global(html.dark) .qz-area-name,
:global(html.dark) .qz-option-title,
:global(html.dark) .qz-empty-title,
:global(.dark) .qz-section-title,
:global(.dark) .qz-area-name,
:global(.dark) .qz-option-title,
:global(.dark) .qz-empty-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-period-indicator,
:global(html.dark) .qz-period-indicator,
:global(.dark) .qz-period-indicator {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-area-card,
:global(html.dark) .qz-area-card,
:global(.dark) .qz-area-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-options-card,
:global(html.dark) .qz-options-card,
:global(.dark) .qz-options-card {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-option-row,
:global(html.dark) .qz-option-row,
:global(.dark) .qz-option-row {
  background: #1d1838;
  box-shadow: 0 3px 10px -2px rgba(0, 0, 0, 0.35);
}

:global(body.dark) .qz-option-desc,
:global(html.dark) .qz-option-desc,
:global(.dark) .qz-option-desc {
  color: #9e9bb8;
}

:global(body.dark) .qz-empty-card,
:global(html.dark) .qz-empty-card,
:global(.dark) .qz-empty-card {
  background: #1d1838;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-empty-icon-box,
:global(html.dark) .qz-empty-icon-box,
:global(.dark) .qz-empty-icon-box {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-squircle--purple,
:global(body.dark) .qz-badge--purple,
:global(html.dark) .qz-squircle--purple,
:global(html.dark) .qz-badge--purple,
:global(.dark) .qz-squircle--purple,
:global(.dark) .qz-badge--purple {
  background-color: rgba(124, 110, 242, 0.2);
  color: #a39bf0;
}

:global(body.dark) .qz-squircle--coral,
:global(body.dark) .qz-badge--coral,
:global(body.dark) .qz-chip--coral,
:global(html.dark) .qz-squircle--coral,
:global(html.dark) .qz-badge--coral,
:global(html.dark) .qz-chip--coral,
:global(.dark) .qz-squircle--coral,
:global(.dark) .qz-badge--coral,
:global(.dark) .qz-chip--coral {
  background-color: rgba(255, 143, 162, 0.2);
  color: #ff8fa2;
}

:global(body.dark) .qz-squircle--cyan,
:global(body.dark) .qz-badge--cyan,
:global(body.dark) .qz-chip--cyan,
:global(html.dark) .qz-squircle--cyan,
:global(html.dark) .qz-badge--cyan,
:global(html.dark) .qz-chip--cyan,
:global(.dark) .qz-squircle--cyan,
:global(.dark) .qz-badge--cyan,
:global(.dark) .qz-chip--cyan {
  background-color: rgba(112, 214, 245, 0.2);
  color: #70d6f5;
}

:global(body.dark) .qz-squircle--gold,
:global(html.dark) .qz-squircle--gold,
:global(.dark) .qz-squircle--gold {
  background-color: rgba(255, 174, 51, 0.2);
  color: #ffae33;
}

:global(body.dark) .qz-squircle--green,
:global(html.dark) .qz-squircle--green,
:global(.dark) .qz-squircle--green {
  background-color: rgba(83, 223, 131, 0.2);
  color: #53df83;
}
</style>
