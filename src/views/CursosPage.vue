<template>
  <ion-page class="ion-page qz-courses-page">
    <ion-content
      :fullscreen="true"
      class="qz-courses-content"
      :force-overscroll="false"
    >
      <div class="qz-courses-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top-row">
              <button class="qz-back-btn" @click="goBack" title="Regresar">
                <ion-icon :icon="arrowBackOutline"></ion-icon>
              </button>
              <span class="qz-hero-tag">GESTIÓN ACADÉMICA</span>
            </div>

            <div class="qz-hero-title-row">
              <div>
                <h1 class="qz-hero-title">Mis Cursos</h1>
                <p class="qz-hero-subtitle">
                  Planillas de notas y organización de grupos por área
                </p>
              </div>
            </div>

            <!-- Selector de Año Lectivo y Periodo Centralizado en Hero -->
            <div class="qz-hero-filters-row">
              <div class="qz-year-pill-container">
                <span class="qz-year-label">AÑO LECTIVO:</span>
                <div class="qz-year-select-wrap">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                  <select
                    v-model="selectedYear"
                    class="qz-year-select"
                    @change="getCursoUsuario(selectedYear)"
                  >
                    <option v-for="year in years" :key="year" :value="year">
                      {{ year }}
                    </option>
                  </select>
                </div>
              </div>

              <div
                class="qz-year-pill-container"
                v-if="periodos && periodos.length > 0"
              >
                <span class="qz-year-label">PERÍODO:</span>
                <div class="qz-year-select-wrap">
                  <ion-icon :icon="timeOutline"></ion-icon>
                  <select
                    v-model="selectedPeriod"
                    class="qz-year-select"
                    @change="onPeriodChange"
                  >
                    <option
                      v-for="periodo in periodos"
                      :key="periodo.id"
                      :value="periodo.id"
                    >
                      {{ periodo.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-courses-body">
          <!-- Barra de Búsqueda de Cursos y Áreas -->
          <div class="qz-search-bar-wrap">
            <ion-icon :icon="searchOutline" class="qz-search-icon"></ion-icon>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por curso o nombre de área..."
              class="qz-search-input"
            />
          </div>

          <!-- Loading State -->
          <div v-if="cargandoCursos" class="qz-loading-box">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <span>Cargando cursos asignados...</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredCursos.length === 0" class="qz-empty-box">
            <ion-icon :icon="schoolOutline"></ion-icon>
            <p v-if="cursosUsuario.length === 0">
              No se encontraron cursos o asignaciones académicas para el año
              {{ selectedYear }}.
            </p>
            <p v-else>
              No se encontraron cursos o áreas que coincidan con "{{
                searchQuery
              }}".
            </p>
          </div>

          <!-- Listado de Cursos Activos -->
          <div v-else class="qz-courses-list">
            <div
              v-for="curso in filteredCursos"
              :key="curso.id"
              class="qz-course-card"
              :class="{
                'qz-course-card--expanded': isExpanded(curso.id),
              }"
            >
              <!-- Encabezado de la Tarjeta del Curso -->
              <div
                class="qz-course-card-header"
                @click="toggleCourse(curso.id)"
              >
                <div class="qz-course-header-left">
                  <div class="qz-course-icon-squircle">
                    <ion-icon :icon="schoolOutline"></ion-icon>
                  </div>
                  <div>
                    <h3 class="qz-course-name">{{ curso.name }}</h3>
                    <span class="qz-course-sub">
                      {{ (curso.areas || []).length }}
                      {{
                        (curso.areas || []).length === 1
                          ? "área asignada"
                          : "áreas asignadas"
                      }}
                    </span>
                  </div>
                </div>

                <div class="qz-course-header-actions">
                  <button
                    class="qz-course-toggle-btn"
                    @click.stop="toggleCourse(curso.id)"
                    :title="
                      isExpanded(curso.id) ? 'Colapsar áreas' : 'Ver áreas'
                    "
                  >
                    <ion-icon
                      :icon="
                        isExpanded(curso.id)
                          ? chevronUpOutline
                          : chevronDownOutline
                      "
                    ></ion-icon>
                  </button>
                </div>
              </div>

              <!-- Contenido Expandido del Curso: Grid de Áreas -->
              <div v-if="isExpanded(curso.id)" class="qz-course-card-body">
                <div
                  v-if="!curso.areas || curso.areas.length === 0"
                  class="qz-empty-areas"
                >
                  <p>Este curso no tiene áreas asignadas.</p>
                </div>

                <div v-else class="qz-areas-grid">
                  <div
                    v-for="area in curso.areas"
                    :key="area.id"
                    class="qz-area-card-item"
                  >
                    <div class="qz-area-info-row">
                      <div class="qz-area-icon-wrap">
                        <ion-icon :icon="bookOutline"></ion-icon>
                      </div>
                      <div class="qz-area-text-wrap">
                        <h4 class="qz-area-name">{{ area.name }}</h4>
                        <span class="qz-area-sub">Acciones académicas</span>
                      </div>
                    </div>

                    <div class="qz-area-actions-row">
                      <button
                        type="button"
                        class="qz-area-btn qz-btn--notes"
                        @click="
                          router.push(
                            `/admin/notas/${curso.id}/${area.id}/${selectedYear}`,
                          )
                        "
                        title="Ver y calificar planilla de notas"
                      >
                        <ion-icon :icon="easelOutline"></ion-icon>
                        <span>Notas</span>
                      </button>

                      <button
                        type="button"
                        class="qz-area-btn qz-btn--groups"
                        @click="
                          router.push(
                            `/admin/grupos/${curso.id}/${selectedYear}`,
                          )
                        "
                        title="Organizar equipos y grupos del curso"
                      >
                        <ion-icon :icon="peopleOutline"></ion-icon>
                        <span>Grupos</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import router from "../router";

import { ref, computed } from "vue";
import {
  tokenHeader,
  usuarioGet,
  selectedYear as selectedYearService,
  currentServerYear,
  periodosGet,
} from "../globalService";
import {
  schoolOutline,
  bookOutline,
  peopleOutline,
  calendarOutline,
  timeOutline,
  easelOutline,
  arrowBackOutline,
  searchOutline,
  chevronUpOutline,
  chevronDownOutline,
} from "ionicons/icons";
import {
  onIonViewWillEnter,
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
} from "@ionic/vue";

export default {
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSpinner,
  },
  setup() {
    const usuario = ref();
    const currentYear = selectedYearService();
    const years = ref(
      Array.from({ length: 10 }, (_, i) => currentServerYear() - i),
    );
    const selectedYear = ref(currentYear);
    const periodos = ref([]);
    const selectedPeriod = ref();

    const cursosUsuario = ref([]);
    const cargandoCursos = ref(false);
    const searchQuery = ref("");
    const expandedCourseIds = ref(new Set());

    const toggleCourse = (courseId) => {
      if (expandedCourseIds.value.has(courseId)) {
        expandedCourseIds.value.delete(courseId);
      } else {
        expandedCourseIds.value.add(courseId);
      }
    };

    const isExpanded = (courseId) => expandedCourseIds.value.has(courseId);

    const filteredCursos = computed(() => {
      if (!cursosUsuario.value) return [];
      const q = searchQuery.value.trim().toLowerCase();
      if (!q) return cursosUsuario.value;
      return cursosUsuario.value.filter((curso) => {
        const matchCourse = curso.name && curso.name.toLowerCase().includes(q);
        const matchArea = (curso.areas || []).some(
          (a) => a.name && a.name.toLowerCase().includes(q),
        );
        return matchCourse || matchArea;
      });
    });

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/panel");
      }
    };

    const onPeriodChange = () => {
      if (selectedPeriod.value) {
        localStorage.setItem(
          "periodoSelected",
          JSON.stringify(selectedPeriod.value),
        );
      }
    };

    const cargarPeriodos = async () => {
      const stored = periodosGet();
      if (stored && stored.length > 0) {
        periodos.value = stored;
      } else {
        try {
          const instId = usuario.value?.institute?.id;
          const url = instId ? `/periods?instituteId=${instId}` : "/periods";
          const res = await axios.get(url, tokenHeader());
          periodos.value = res.data || [];
        } catch (e) {
          console.error("Error al cargar períodos:", e);
        }
      }

      const storedPeriod = localStorage.getItem("periodoSelected");
      if (storedPeriod) {
        try {
          selectedPeriod.value = JSON.parse(storedPeriod);
        } catch (e) {
          selectedPeriod.value = storedPeriod;
        }
      }
      if (!selectedPeriod.value && periodos.value.length > 0) {
        selectedPeriod.value = periodos.value[0].id;
      }
    };

    onIonViewWillEnter(async () => {
      tokenHeader();
      usuario.value = usuarioGet();

      await cargarPeriodos();
      await getCursoUsuario(selectedYear.value);
    });

    const getCursoUsuario = async (year) => {
      cargandoCursos.value = true;
      try {
        const isAdminView = localStorage.getItem("adminView") === "true";

        if (usuario.value.rol === "admin" && isAdminView) {
          const response = await axios.get(
            `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
            tokenHeader(),
          );

          cursosUsuario.value = response.data.map((curso) => ({
            id: curso.id,
            name: curso.name,
            areas: (curso.courseAreas || [])
              .filter((a) => a.active == 1 || a.active === true || a.active)
              .map((a) => a.area),
          }));
        } else {
          const response = await axios.get(
            `/users/${usuario.value.id}/courses?year=${year}&active=true`,
            tokenHeader(),
          );

          const areAAssignments = await axios
            .get(`/courses/teacher-assignments/${usuario.value.id}`)
            .then((response) => {
              return response.data.filter(
                (assignment) =>
                  assignment.active == 1 ||
                  assignment.active === true ||
                  assignment.active,
              );
            });

          cursosUsuario.value = (response.data || [])
            .filter((curso) => curso && curso.course)
            .map((curso) => ({
              id: curso.course.id,
              name: curso.course.name,
              areas: isAdminView
                ? (curso.course.courseAreas || [])
                    .filter(
                      (a) => a.active == 1 || a.active === true || a.active,
                    )
                    .map((a) => a.area)
                : areAAssignments
                    .filter(
                      (assignment) =>
                        assignment.course &&
                        assignment.course.id == curso.course.id,
                    )
                    .map((assignment) => assignment.area),
            }));
        }

        cursosUsuario.value = cursosUsuario.value.sort(
          (a, b) => parseInt(a.name) - parseInt(b.name),
        );

        // Auto-expand all loaded courses
        if (cursosUsuario.value.length > 0) {
          cursosUsuario.value.forEach((c) => expandedCourseIds.value.add(c.id));
        }
      } catch (e) {
        console.error("Error al cargar cursos:", e);
      } finally {
        cargandoCursos.value = false;
      }
    };

    return {
      usuario,
      router,
      cursosUsuario,
      filteredCursos,
      cargandoCursos,
      searchQuery,
      years,
      selectedYear,
      periodos,
      selectedPeriod,
      expandedCourseIds,
      toggleCourse,
      isExpanded,
      goBack,
      onPeriodChange,
      getCursoUsuario,
      // Icons
      schoolOutline,
      bookOutline,
      peopleOutline,
      calendarOutline,
      timeOutline,
      easelOutline,
      arrowBackOutline,
      searchOutline,
      chevronUpOutline,
      chevronDownOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: MIS CURSOS
   Consistent with gestionUsuarios.vue and GestionAcademica.vue
   ========================================================================== */

.qz-courses-page {
  --background: #f9f9ff;
  background-color: #f9f9ff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
}

.qz-courses-content {
  --background: transparent;
  --keyboard-offset: 0px !important;
}

.qz-courses-wrapper {
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: 70px;
  box-sizing: border-box;
}

/* 1. HERO HEADER QUEEZY */
.qz-hero-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  padding: 36px 24px 28px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.2);
}

.qz-hero-inner {
  max-width: 960px;
  margin: 0 auto;
}

.qz-hero-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.qz-back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.qz-back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 5px 12px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
}

.qz-hero-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.qz-hero-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
  color: #ffffff;
}

.qz-hero-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
  max-width: 580px;
  color: #ffffff;
}

/* Filtros en el Hero (Año Lectivo y Periodo) */
.qz-hero-filters-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.qz-year-pill-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.18);
  padding: 6px 14px;
  border-radius: 14px;
  width: fit-content;
  backdrop-filter: blur(6px);
  white-space: nowrap !important;
  flex-shrink: 0;
}

.qz-year-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #ffffff;
}

.qz-year-select-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ffffff;
}

.qz-year-select-wrap ion-icon {
  font-size: 15px;
}

.qz-year-select {
  background: transparent;
  border: none;
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  outline: none;
}

.qz-year-select option {
  background: #6a5ae0;
  color: #ffffff;
}

/* 2. BODY PRINCIPAL */
.qz-courses-body {
  padding: 20px 18px 0;
}

/* Barra de Búsqueda */
.qz-search-bar-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.qz-search-icon {
  position: absolute;
  left: 16px;
  font-size: 18px;
  color: #858494;
  pointer-events: none;
}

.qz-search-input {
  width: 100%;
  padding: 13px 18px 13px 44px;
  background: #ffffff;
  border: 1.5px solid rgba(106, 90, 224, 0.12);
  border-radius: 16px;
  font-size: 14px;
  color: #110d26;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.qz-search-input:focus {
  border-color: #6a5ae0;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.15);
}

/* Loading & Empty States */
.qz-loading-box,
.qz-empty-box {
  background: #ffffff;
  border-radius: 20px;
  padding: 40px 20px;
  text-align: center;
  border: 1.5px solid rgba(106, 90, 224, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #858494;
  font-size: 14px;
}

.qz-empty-box ion-icon {
  font-size: 42px;
  color: #6a5ae0;
  opacity: 0.6;
}

/* 3. LISTADO DE TARJETAS DE CURSO */
.qz-courses-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-course-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1.5px solid rgba(106, 90, 224, 0.1);
  box-shadow: 0 3px 12px rgba(106, 90, 224, 0.04);
  transition: all 0.2s ease;
  overflow: hidden;
}

.qz-course-card--expanded {
  border-color: rgba(106, 90, 224, 0.35);
  box-shadow: 0 8px 24px rgba(106, 90, 224, 0.1);
}

.qz-course-card-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.qz-course-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.qz-course-icon-squircle {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-course-name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #110d26;
}

.qz-course-sub {
  font-size: 12px;
  color: #858494;
  margin-top: 2px;
  display: block;
}

.qz-course-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-course-toggle-btn {
  background: #f4f3fd;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-course-toggle-btn:hover {
  background: #e9e6fd;
}

/* Cuerpo de la Tarjeta del Curso */
.qz-course-card-body {
  padding: 16px 20px 20px;
  border-top: 1px solid rgba(106, 90, 224, 0.08);
  background: #faf9ff;
}

.qz-empty-areas {
  padding: 16px;
  text-align: center;
  color: #858494;
  font-size: 13px;
}

/* 4. GRID DE ÁREAS */
.qz-areas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.qz-area-card-item {
  background: #ffffff;
  border: 1.5px solid rgba(106, 90, 224, 0.1);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.qz-area-card-item:hover {
  border-color: #cfccfb;
  transform: translateY(-2px);
}

.qz-area-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-area-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.qz-area-text-wrap {
  flex: 1;
  min-width: 0;
}

.qz-area-name {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  color: #110d26;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-area-sub {
  font-size: 11.5px;
  color: #858494;
}

.qz-area-actions-row {
  display: flex;
  gap: 8px;
}

.qz-area-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  border-radius: 12px;
  font-size: 12.5px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.qz-area-btn:active {
  transform: scale(0.97);
}

.qz-btn--notes {
  background: #efeefc;
  color: #6a5ae0;
  border: 1px solid rgba(106, 90, 224, 0.2);
}

.qz-btn--notes:hover {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-btn--groups {
  background: #f0f9ff;
  color: #0284c7;
  border: 1px solid rgba(2, 132, 199, 0.25);
}

.qz-btn--groups:hover {
  background: #0284c7;
  color: #ffffff;
}

/* ==========================================================================
   5. MODO OSCURO (DARK MODE) COMPLETO QUEEZY
   Matching gestionUsuarios.vue & GestionAcademica.vue
   ========================================================================== */

@media (prefers-color-scheme: dark) {
  .qz-courses-page {
    --background: #110d26;
    background-color: #110d26;
  }

  .qz-courses-content {
    --background: #110d26;
  }

  .qz-hero-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
  }

  .qz-hero-tag {
    background: rgba(255, 255, 255, 0.12);
    color: #b5a9ff;
    border: 1px solid rgba(181, 169, 255, 0.3);
  }

  .qz-back-btn {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .qz-back-btn:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  .qz-year-pill-container {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .qz-year-select option {
    background: #1d1838;
    color: #ffffff;
  }

  .qz-search-input {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .qz-search-icon {
    color: #a49fc4;
  }

  .qz-loading-box,
  .qz-empty-box {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    color: #a49fc4;
  }

  .qz-empty-box ion-icon {
    color: #b5a9ff;
  }

  .qz-course-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .qz-course-card--expanded {
    border-color: rgba(106, 90, 224, 0.6);
  }

  .qz-course-name {
    color: #ffffff;
  }

  .qz-course-sub {
    color: #a49fc4;
  }

  .qz-course-icon-squircle {
    background: #2b2254;
    color: #b5a9ff;
  }

  .qz-course-toggle-btn {
    background: #241d42;
    color: #b5a9ff;
  }

  .qz-course-toggle-btn:hover {
    background: #2c2550;
    color: #ffffff;
  }

  .qz-course-card-body {
    background: #181430;
    border-top-color: rgba(255, 255, 255, 0.06);
  }

  .qz-empty-areas {
    color: #a49fc4;
  }

  .qz-area-card-item {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.06);
  }

  .qz-area-card-item:hover {
    border-color: rgba(106, 90, 224, 0.4);
  }

  .qz-area-icon-wrap {
    background: #2b2254;
    color: #b5a9ff;
  }

  .qz-area-name {
    color: #ffffff;
  }

  .qz-area-sub {
    color: #a49fc4;
  }

  .qz-btn--notes {
    background: #2b2254;
    color: #b5a9ff;
    border: 1px solid rgba(106, 90, 224, 0.3);
  }

  .qz-btn--notes:hover {
    background: #6a5ae0;
    color: #ffffff;
  }

  .qz-btn--groups {
    background: rgba(2, 132, 199, 0.2);
    color: #7dd3fc;
    border: 1px solid rgba(2, 132, 199, 0.35);
  }

  .qz-btn--groups:hover {
    background: #0284c7;
    color: #ffffff;
  }
}

/* Explicit class selectors for dark mode */
:global(body.dark) .qz-courses-page,
:global(html.dark) .qz-courses-page,
:global(.dark) .qz-courses-page {
  --background: #110d26;
  background-color: #110d26;
}

:global(body.dark) .qz-courses-content,
:global(html.dark) .qz-courses-content,
:global(.dark) .qz-courses-content {
  --background: #110d26;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-hero-tag,
:global(html.dark) .qz-hero-tag,
:global(.dark) .qz-hero-tag {
  background: rgba(255, 255, 255, 0.12);
  color: #b5a9ff;
  border: 1px solid rgba(181, 169, 255, 0.3);
}

:global(body.dark) .qz-back-btn,
:global(html.dark) .qz-back-btn,
:global(.dark) .qz-back-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

:global(body.dark) .qz-back-btn:hover,
:global(html.dark) .qz-back-btn:hover,
:global(.dark) .qz-back-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}

:global(body.dark) .qz-year-pill-container,
:global(html.dark) .qz-year-pill-container,
:global(.dark) .qz-year-pill-container {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

:global(body.dark) .qz-year-select option,
:global(html.dark) .qz-year-select option,
:global(.dark) .qz-year-select option {
  background: #1d1838;
  color: #ffffff;
}

:global(body.dark) .qz-search-input,
:global(html.dark) .qz-search-input,
:global(.dark) .qz-search-input {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

:global(body.dark) .qz-search-icon,
:global(html.dark) .qz-search-icon,
:global(.dark) .qz-search-icon {
  color: #a49fc4;
}

:global(body.dark) .qz-loading-box,
:global(html.dark) .qz-loading-box,
:global(.dark) .qz-loading-box,
:global(body.dark) .qz-empty-box,
:global(html.dark) .qz-empty-box,
:global(.dark) .qz-empty-box {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  color: #a49fc4;
}

:global(body.dark) .qz-empty-box ion-icon,
:global(html.dark) .qz-empty-box ion-icon,
:global(.dark) .qz-empty-box ion-icon {
  color: #b5a9ff;
}

:global(body.dark) .qz-course-card,
:global(html.dark) .qz-course-card,
:global(.dark) .qz-course-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-course-card--expanded,
:global(html.dark) .qz-course-card--expanded,
:global(.dark) .qz-course-card--expanded {
  border-color: rgba(106, 90, 224, 0.6);
}

:global(body.dark) .qz-course-name,
:global(html.dark) .qz-course-name,
:global(.dark) .qz-course-name {
  color: #ffffff;
}

:global(body.dark) .qz-course-sub,
:global(html.dark) .qz-course-sub,
:global(.dark) .qz-course-sub {
  color: #a49fc4;
}

:global(body.dark) .qz-course-icon-squircle,
:global(html.dark) .qz-course-icon-squircle,
:global(.dark) .qz-course-icon-squircle {
  background: #2b2254;
  color: #b5a9ff;
}

:global(body.dark) .qz-course-toggle-btn,
:global(html.dark) .qz-course-toggle-btn,
:global(.dark) .qz-course-toggle-btn {
  background: #241d42;
  color: #b5a9ff;
}

:global(body.dark) .qz-course-toggle-btn:hover,
:global(html.dark) .qz-course-toggle-btn:hover,
:global(.dark) .qz-course-toggle-btn:hover {
  background: #2c2550;
  color: #ffffff;
}

:global(body.dark) .qz-course-card-body,
:global(html.dark) .qz-course-card-body,
:global(.dark) .qz-course-card-body {
  background: #181430;
  border-top-color: rgba(255, 255, 255, 0.06);
}

:global(body.dark) .qz-empty-areas,
:global(html.dark) .qz-empty-areas,
:global(.dark) .qz-empty-areas {
  color: #a49fc4;
}

:global(body.dark) .qz-area-card-item,
:global(html.dark) .qz-area-card-item,
:global(.dark) .qz-area-card-item {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.06);
}

:global(body.dark) .qz-area-card-item:hover,
:global(html.dark) .qz-area-card-item:hover,
:global(.dark) .qz-area-card-item:hover {
  border-color: rgba(106, 90, 224, 0.4);
}

:global(body.dark) .qz-area-icon-wrap,
:global(html.dark) .qz-area-icon-wrap,
:global(.dark) .qz-area-icon-wrap {
  background: #2b2254;
  color: #b5a9ff;
}

:global(body.dark) .qz-area-name,
:global(html.dark) .qz-area-name,
:global(.dark) .qz-area-name {
  color: #ffffff;
}

:global(body.dark) .qz-area-sub,
:global(html.dark) .qz-area-sub,
:global(.dark) .qz-area-sub {
  color: #a49fc4;
}

:global(body.dark) .qz-btn--notes,
:global(html.dark) .qz-btn--notes,
:global(.dark) .qz-btn--notes {
  background: #2b2254;
  color: #b5a9ff;
  border: 1px solid rgba(106, 90, 224, 0.3);
}

:global(body.dark) .qz-btn--notes:hover,
:global(html.dark) .qz-btn--notes:hover,
:global(.dark) .qz-btn--notes:hover {
  background: #6a5ae0;
  color: #ffffff;
}

:global(body.dark) .qz-btn--groups,
:global(html.dark) .qz-btn--groups,
:global(.dark) .qz-btn--groups {
  background: rgba(2, 132, 199, 0.2);
  color: #7dd3fc;
  border: 1px solid rgba(2, 132, 199, 0.35);
}

:global(body.dark) .qz-btn--groups:hover,
:global(html.dark) .qz-btn--groups:hover,
:global(.dark) .qz-btn--groups:hover {
  background: #0284c7;
  color: #ffffff;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .qz-hero-header {
    padding: 20px 14px 18px;
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
  }

  .qz-hero-title {
    font-size: 20px;
  }

  .qz-hero-subtitle {
    font-size: 12px;
  }

  .qz-hero-filters-row {
    gap: 8px;
    flex-wrap: wrap;
  }

  .qz-year-pill-container {
    padding: 5px 10px;
    font-size: 10.5px;
    gap: 6px;
    white-space: nowrap !important;
    flex-shrink: 0;
  }

  .qz-year-label {
    font-size: 10px;
  }

  .qz-year-select {
    font-size: 13px;
  }

  .qz-courses-body {
    padding: 14px 12px 0;
  }

  .qz-search-bar-wrap {
    margin-bottom: 14px;
  }

  .qz-search-input {
    padding: 11px 16px 11px 40px;
    font-size: 13px;
    border-radius: 14px;
  }

  .qz-course-card-header {
    padding: 12px 14px;
    gap: 10px;
  }

  .qz-course-icon-squircle {
    width: 38px;
    height: 38px;
    font-size: 18px;
    border-radius: 12px;
  }

  .qz-course-name {
    font-size: 15px;
  }

  .qz-course-sub {
    font-size: 11px;
  }

  .qz-course-toggle-btn {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .qz-course-card-body {
    padding: 12px 14px 16px;
  }

  .qz-areas-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .qz-area-card-item {
    padding: 12px 14px;
    gap: 10px;
    border-radius: 14px;
  }

  .qz-area-btn {
    height: 36px;
    font-size: 12px;
  }
}
</style>
