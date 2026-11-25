<template>
  <ion-page class="ion-page qz-polls-page">
    <ion-content :fullscreen="true" class="qz-polls-content">
      <div class="qz-polls-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top">
              <div class="qz-hero-top-left">
                <button
                  type="button"
                  class="qz-back-btn"
                  title="Volver a herramientas"
                  aria-label="Volver"
                  @click="goBack"
                >
                  <ion-icon :icon="arrowBackOutline"></ion-icon>
                </button>
                <span class="qz-hero-tag">PARTICIPACIÓN EN VIVO</span>
              </div>

              <button
                v-if="esProfesor"
                type="button"
                class="qz-create-hero-btn"
                @click="router.push('/encuestas/crear')"
              >
                <ion-icon :icon="addOutline"></ion-icon>
                <span>Nueva Encuesta</span>
              </button>
            </div>

            <h1 class="qz-hero-title">Encuestas</h1>
            <p class="qz-hero-subtitle">
              Vota en tiempo real y consulta los resultados del curso
            </p>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-polls-body">
          <!-- Filtros Queezy -->
          <section class="qz-card qz-filters-card">
            <div
              class="qz-filters-grid"
              :class="{ 'qz-filters-grid--two': isStudent }"
            >
              <!-- Año -->
              <div class="qz-field-group">
                <label class="qz-field-label">Año</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="calendarOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <ion-select
                    v-model="yearSelected"
                    interface="popover"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    placeholder="Año"
                    class="qz-compact-select"
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
              </div>

              <!-- Periodo -->
              <div class="qz-field-group">
                <label class="qz-field-label">Periodo</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="layersOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <ion-select
                    v-model="periodoSelected"
                    interface="popover"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    placeholder="Periodo"
                    class="qz-compact-select"
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

              <!-- Curso (solo profesores/admin) -->
              <div class="qz-field-group qz-field-full" v-if="!isStudent">
                <label class="qz-field-label">Curso</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="schoolOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <ion-select
                    v-model="courseSelected"
                    interface="popover"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    placeholder="Selecciona un curso"
                    class="qz-compact-select"
                    @ionChange="changeCourse($event)"
                  >
                    <ion-select-option
                      v-for="course in courses"
                      :key="course.id"
                      :value="course.id"
                    >
                      Curso {{ course.name }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>
            </div>
          </section>

          <!-- Loading -->
          <div v-if="loading" class="qz-card qz-state-card">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p class="qz-state-text">Cargando encuestas...</p>
          </div>

          <!-- Empty state -->
          <div v-else-if="polls.length === 0" class="qz-card qz-state-card">
            <div class="qz-empty-icon-circle">
              <ion-icon :icon="barChartOutline"></ion-icon>
            </div>
            <h3 class="qz-empty-title">Sin encuestas</h3>
            <p class="qz-state-text">
              No hay encuestas disponibles para los filtros seleccionados.
            </p>
            <button
              v-if="esProfesor"
              type="button"
              class="qz-btn-primary qz-btn-empty"
              @click="router.push('/encuestas/crear')"
            >
              <ion-icon :icon="addOutline"></ion-icon>
              <span>Crear Primera Encuesta</span>
            </button>
          </div>

          <!-- Poll list -->
          <div v-else class="qz-polls-list">
            <div
              v-for="poll in polls"
              :key="poll.id"
              class="qz-card qz-poll-card"
              @click="openPoll(poll)"
            >
              <div class="qz-poll-icon-squircle">
                <ion-icon :icon="barChartOutline"></ion-icon>
              </div>

              <div class="qz-poll-info">
                <div class="qz-poll-badges">
                  <span
                    class="qz-status-badge"
                    :class="
                      poll.active ? 'qz-status--active' : 'qz-status--closed'
                    "
                  >
                    {{ poll.active ? "Activa" : "Cerrada" }}
                  </span>
                  <span class="qz-mode-badge">
                    {{ poll.mode === "group" ? "Grupal" : "Individual" }}
                  </span>
                </div>

                <h2 class="qz-poll-title">{{ poll.title }}</h2>
                <p class="qz-poll-question">{{ poll.question }}</p>
                <p v-if="poll.course" class="qz-poll-meta">
                  Curso {{ poll.course.name }} ·
                  {{ poll.options?.length || 0 }} opciones
                </p>
              </div>

              <ion-icon
                :icon="chevronForwardOutline"
                class="qz-poll-arrow"
              ></ion-icon>
            </div>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonIcon,
  IonSelect,
  IonSelectOption,
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import {
  barChartOutline,
  addOutline,
  arrowBackOutline,
  calendarOutline,
  layersOutline,
  schoolOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import axios from "axios";
import {
  adminOprofesor,
  tokenHeader,
  usuarioGet,
  periodosGet,
  currentServerYear,
} from "../globalService";

export default {
  name: "EncuestasPage",
  components: {
    IonPage,
    IonContent,
    IonSpinner,
    IonIcon,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const router = useRouter();
    const polls = ref([]);
    const loading = ref(false);
    const esProfesor = ref(false);
    const isInitialized = ref(false);

    const usuario = ref(null);
    const isStudent = computed(() => {
      return usuario.value?.rol === "student" || usuario.value?.rol === "user";
    });

    const years = ref([]);
    const yearSelected = ref(null);
    const periodos = ref([]);
    const periodoSelected = ref(null);
    const courses = ref([]);
    const courseSelected = ref(null);

    const fetchPolls = async () => {
      loading.value = true;
      try {
        polls.value = [];
        const params = {};
        if (courseSelected.value) {
          params.courseId = courseSelected.value;
        }
        if (periodoSelected.value) {
          params.periodId = periodoSelected.value;
        }
        if (yearSelected.value) {
          params.year = yearSelected.value;
        }

        if (
          isStudent.value ||
          (courseSelected.value && periodoSelected.value && yearSelected.value)
        ) {
          const response = await axios.get("/polls", {
            ...tokenHeader(),
            params,
          });
          polls.value = response.data;
        } else {
          polls.value = [];
        }
      } catch (error) {
        console.error("Error fetching polls:", error);
      } finally {
        loading.value = false;
      }
    };

    const openPoll = (poll) => {
      router.push(`/encuestas/${poll.id}`);
    };

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/herramientas");
      }
    };

    const changeYear = (event) => {
      yearSelected.value = event.detail.value;
      localStorage.setItem("year", JSON.stringify(yearSelected.value));
      if (isStudent.value) {
        const cursosUsuario =
          JSON.parse(localStorage.getItem("cursosUsuario")) || [];
        const courseForYear = cursosUsuario.find(
          (c) => c.year == yearSelected.value && (c.active || c.exist),
        );
        if (courseForYear) {
          courseSelected.value = courseForYear.id;
          localStorage.setItem("courseSelected", JSON.stringify(courseForYear));
        } else {
          courseSelected.value = null;
          localStorage.removeItem("courseSelected");
        }
      }
    };

    const changePeriodo = (event) => {
      periodoSelected.value = event.detail.value;
      localStorage.setItem(
        "periodoSelected",
        JSON.stringify(periodoSelected.value),
      );
    };

    const changeCourse = (event) => {
      courseSelected.value = event.detail.value;
      localStorage.setItem(
        "courseSelected",
        JSON.stringify({ id: courseSelected.value }),
      );
    };

    onIonViewWillEnter(async () => {
      isInitialized.value = false;
      usuario.value = usuarioGet();
      esProfesor.value = adminOprofesor();

      periodos.value = periodosGet() || [];
      const storedPeriod = JSON.parse(localStorage.getItem("periodoSelected"));
      if (
        storedPeriod &&
        periodos.value.some((p) => p.id === storedPeriod)
      ) {
        periodoSelected.value = storedPeriod;
      } else if (periodos.value.length > 0) {
        periodoSelected.value = periodos.value[0].id;
        localStorage.setItem(
          "periodoSelected",
          JSON.stringify(periodoSelected.value),
        );
      } else {
        periodoSelected.value = null;
      }

      const curServerYear = currentServerYear();
      years.value = new Array(10).fill(0).map((_, i) => curServerYear - i);
      yearSelected.value =
        JSON.parse(localStorage.getItem("year")) || curServerYear;

      if (isStudent.value) {
        const cursosUsuario =
          JSON.parse(localStorage.getItem("cursosUsuario")) || [];
        const sortedCourses = [...cursosUsuario].sort(
          (a, b) => b.year - a.year,
        );

        let activeCourse = sortedCourses.find(
          (c) => c.year == yearSelected.value && (c.active || c.exist),
        );
        if (!activeCourse && sortedCourses.length > 0) {
          activeCourse = sortedCourses[0];
          yearSelected.value = activeCourse.year;
          localStorage.setItem("year", JSON.stringify(yearSelected.value));
        }

        if (activeCourse) {
          courseSelected.value = activeCourse.id;
          localStorage.setItem("courseSelected", JSON.stringify(activeCourse));
        } else {
          courseSelected.value = null;
          polls.value = [];
          loading.value = false;
          isInitialized.value = true;
          return;
        }
        courses.value = activeCourse ? [activeCourse] : [];
      } else {
        try {
          const instId = usuario.value?.institute?.id;
          const url = instId
            ? `/courses?instituteId=${instId}&exist=true`
            : "/courses";
          const response = await axios.get(url, tokenHeader());
          courses.value = (response.data || [])
            .filter((c) => c.exist !== false)
            .sort((a, b) => a.name.localeCompare(b.name));

          const storedCourse = JSON.parse(
            localStorage.getItem("courseSelected"),
          );
          if (
            storedCourse &&
            courses.value.some((c) => c.id === storedCourse.id)
          ) {
            courseSelected.value = storedCourse.id;
          } else if (courses.value.length > 0) {
            courseSelected.value = courses.value[0].id;
            localStorage.setItem(
              "courseSelected",
              JSON.stringify(courses.value[0]),
            );
          }
        } catch (error) {
          console.error("Error fetching courses:", error);
          courses.value = [];
        }
      }

      isInitialized.value = true;
      await fetchPolls();
    });

    watch([yearSelected, periodoSelected, courseSelected], () => {
      if (!isInitialized.value) return;
      if (
        yearSelected.value &&
        periodoSelected.value &&
        (courseSelected.value || isStudent.value)
      ) {
        fetchPolls();
      } else if (!isStudent.value) {
        polls.value = [];
      }
    });

    return {
      polls,
      loading,
      esProfesor,
      router,
      openPoll,
      goBack,
      barChartOutline,
      addOutline,
      arrowBackOutline,
      calendarOutline,
      layersOutline,
      schoolOutline,
      chevronForwardOutline,
      isStudent,
      years,
      yearSelected,
      periodos,
      periodoSelected,
      courses,
      courseSelected,
      changeYear,
      changePeriodo,
      changeCourse,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: ENCUESTAS
   ========================================================================== */

.qz-polls-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-polls-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-polls-wrapper {
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
  max-width: 720px;
  margin: 0 auto;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.qz-hero-top-left {
  display: flex;
  align-items: center;
  gap: 12px;
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
  backdrop-filter: blur(6px);
}

.qz-create-hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  color: #6a5ae0;
  border: none;
  border-radius: 12px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.qz-create-hero-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
}

.qz-hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: #ffffff;
}

.qz-hero-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
}

/* 2. CUERPO Y FILTROS */
.qz-polls-body {
  padding: 20px 16px 24px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-card {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 6px 18px rgba(12, 9, 42, 0.05);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.qz-filters-card {
  padding: 16px;
}

.qz-filters-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.qz-filters-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 520px) {
  .qz-filters-grid,
  .qz-filters-grid--two {
    grid-template-columns: minmax(0, 1fr);
  }
}

.qz-field-full {
  grid-column: 1 / -1;
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
}

.qz-field-label {
  font-size: 11px;
  font-weight: 700;
  color: #6a5ae0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  max-width: 100%;
  min-width: 0;
  padding: 0 10px 0 36px;
  transition: all 0.2s ease;
  box-sizing: border-box;
  overflow: hidden;
}

.qz-select-wrapper:hover,
.qz-select-wrapper:focus-within {
  border-color: #6a5ae0;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.12);
}

.qz-field-icon {
  position: absolute;
  left: 11px;
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
  font-size: 13.5px;
  font-weight: 600;
  color: #0c092a;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-compact-select::part(container) {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.qz-compact-select::part(text) {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #0c092a;
}

.qz-compact-select::part(icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6a5ae0;
  opacity: 0.78;
}

/* ESTADOS DE CARGA Y VACÍO */
.qz-state-card {
  padding: 36px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.qz-empty-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 20px;
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
  max-width: 340px;
}

.qz-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.25);
  transition: all 0.2s ease;
}

.qz-btn-empty {
  margin-top: 8px;
}

/* LISTA DE ENCUESTAS */
.qz-polls-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-poll-card {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-poll-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(106, 90, 224, 0.12);
  border-color: rgba(106, 90, 224, 0.3);
}

.qz-poll-icon-squircle {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-poll-info {
  flex: 1;
  min-width: 0;
}

.qz-poll-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.qz-status-badge {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.qz-status--active {
  background: #eafbf1;
  color: #16a34a;
}

.qz-status--closed {
  background: #f0f0f5;
  color: #858494;
}

.qz-mode-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  background: #efeefc;
  color: #6a5ae0;
}

.qz-poll-title {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 800;
  color: #0c092a;
}

.qz-poll-question {
  margin: 0 0 4px;
  font-size: 13px;
  color: #5a5772;
  line-height: 1.35;
}

.qz-poll-meta {
  margin: 0;
  font-size: 11.5px;
  font-weight: 600;
  color: #858494;
}

.qz-poll-arrow {
  font-size: 20px;
  color: #858494;
  flex-shrink: 0;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-polls-page,
  body:not(.light) .qz-polls-content {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-hero-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  }

  body:not(.light) .qz-hero-tag {
    background: rgba(255, 255, 255, 0.12);
    color: #b5a9ff;
    border: 1px solid rgba(181, 169, 255, 0.28);
  }

  body:not(.light) .qz-create-hero-btn {
    background: #2b2254;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.18);
  }

  body:not(.light) .qz-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
  }

  body:not(.light) .qz-field-label,
  body:not(.light) .qz-field-icon {
    color: #b5a9ff;
  }

  body:not(.light) .qz-select-wrapper {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.12);
  }

  body:not(.light) .qz-select-wrapper:hover,
  body:not(.light) .qz-select-wrapper:focus-within {
    background: #2a2250;
    border-color: #8c7ef8;
    box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.2);
  }

  body:not(.light) .qz-compact-select,
  body:not(.light) .qz-compact-select::part(text) {
    color: #ffffff;
  }

  body:not(.light) .qz-compact-select::part(icon) {
    color: #b5a9ff;
  }

  body:not(.light) .qz-empty-icon-circle,
  body:not(.light) .qz-poll-icon-squircle {
    background: #2b2254;
    color: #b5a9ff;
  }

  body:not(.light) .qz-empty-title,
  body:not(.light) .qz-poll-title {
    color: #f7f7fd;
  }

  body:not(.light) .qz-poll-question {
    color: #c7c3e0;
  }

  body:not(.light) .qz-state-text,
  body:not(.light) .qz-poll-meta,
  body:not(.light) .qz-poll-arrow {
    color: #9e9bb8;
  }

  body:not(.light) .qz-status--active {
    background: rgba(83, 223, 131, 0.18);
    color: #53df83;
  }

  body:not(.light) .qz-status--closed {
    background: #241d42;
    color: #9e9bb8;
  }

  body:not(.light) .qz-mode-badge {
    background: #2b2254;
    color: #b5a9ff;
  }
}

:global(body.dark) .qz-polls-page,
:global(body.dark) .qz-polls-content,
:global(html.dark) .qz-polls-page,
:global(html.dark) .qz-polls-content,
:global(.dark) .qz-polls-page,
:global(.dark) .qz-polls-content {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

:global(body.dark) .qz-hero-tag,
:global(html.dark) .qz-hero-tag,
:global(.dark) .qz-hero-tag {
  background: rgba(255, 255, 255, 0.12);
  color: #b5a9ff;
  border: 1px solid rgba(181, 169, 255, 0.28);
}

:global(body.dark) .qz-create-hero-btn,
:global(html.dark) .qz-create-hero-btn,
:global(.dark) .qz-create-hero-btn {
  background: #2b2254;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-field-label,
:global(html.dark) .qz-field-label,
:global(.dark) .qz-field-label,
:global(body.dark) .qz-field-icon,
:global(html.dark) .qz-field-icon,
:global(.dark) .qz-field-icon {
  color: #b5a9ff;
}

:global(body.dark) .qz-select-wrapper,
:global(html.dark) .qz-select-wrapper,
:global(.dark) .qz-select-wrapper {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-select-wrapper:hover,
:global(html.dark) .qz-select-wrapper:hover,
:global(.dark) .qz-select-wrapper:hover,
:global(body.dark) .qz-select-wrapper:focus-within,
:global(html.dark) .qz-select-wrapper:focus-within,
:global(.dark) .qz-select-wrapper:focus-within {
  background: #2a2250;
  border-color: #8c7ef8;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.2);
}

:global(body.dark) .qz-compact-select,
:global(html.dark) .qz-compact-select,
:global(.dark) .qz-compact-select,
:global(body.dark) .qz-compact-select::part(text),
:global(html.dark) .qz-compact-select::part(text),
:global(.dark) .qz-compact-select::part(text) {
  color: #ffffff;
}

:global(body.dark) .qz-compact-select::part(icon),
:global(html.dark) .qz-compact-select::part(icon),
:global(.dark) .qz-compact-select::part(icon) {
  color: #b5a9ff;
}

:global(body.dark) .qz-empty-icon-circle,
:global(html.dark) .qz-empty-icon-circle,
:global(.dark) .qz-empty-icon-circle,
:global(body.dark) .qz-poll-icon-squircle,
:global(html.dark) .qz-poll-icon-squircle,
:global(.dark) .qz-poll-icon-squircle {
  background: #2b2254;
  color: #b5a9ff;
}

:global(body.dark) .qz-empty-title,
:global(html.dark) .qz-empty-title,
:global(.dark) .qz-empty-title,
:global(body.dark) .qz-poll-title,
:global(html.dark) .qz-poll-title,
:global(.dark) .qz-poll-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-poll-question,
:global(html.dark) .qz-poll-question,
:global(.dark) .qz-poll-question {
  color: #c7c3e0;
}

:global(body.dark) .qz-state-text,
:global(html.dark) .qz-state-text,
:global(.dark) .qz-state-text,
:global(body.dark) .qz-poll-meta,
:global(html.dark) .qz-poll-meta,
:global(.dark) .qz-poll-meta,
:global(body.dark) .qz-poll-arrow,
:global(html.dark) .qz-poll-arrow,
:global(.dark) .qz-poll-arrow {
  color: #9e9bb8;
}

:global(body.dark) .qz-status--active,
:global(html.dark) .qz-status--active,
:global(.dark) .qz-status--active {
  background: rgba(83, 223, 131, 0.18);
  color: #53df83;
}

:global(body.dark) .qz-status--closed,
:global(html.dark) .qz-status--closed,
:global(.dark) .qz-status--closed {
  background: #241d42;
  color: #9e9bb8;
}

:global(body.dark) .qz-mode-badge,
:global(html.dark) .qz-mode-badge,
:global(.dark) .qz-mode-badge {
  background: #2b2254;
  color: #b5a9ff;
}
</style>
