<template>
  <ion-page class="ion-page qz-cursos-page">
    <ion-content class="qz-cursos-content">
      <div class="qz-page-wrapper">
        <!-- 1. CABECERA HERO QUEEZY CON FONDO PÚRPURA -->
        <div class="qz-hero-header">
          <div class="qz-hero-top">
            <!-- Botón Regresar -->
            <button
              type="button"
              class="qz-back-btn"
              title="Regresar al panel"
              @click="goBack"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </button>

            <!-- Cápsula Selector de Año Lectivo -->
            <div class="qz-year-capsule">
              <ion-icon
                :icon="calendarOutline"
                class="qz-calendar-icon"
              ></ion-icon>
              <span class="qz-year-label">Año:</span>
              <ion-select
                v-model="selectedYear"
                interface="popover"
                class="qz-year-select"
                :interface-options="{ cssClass: 'qz-popover-year' }"
              >
                <ion-select-option
                  v-for="year in availableYears"
                  :key="year"
                  :value="year"
                >
                  {{ year }}
                </ion-select-option>
              </ion-select>
            </div>
          </div>

          <!-- Título y subtítulo en Hero -->
          <div class="qz-hero-titles">
            <span class="qz-hero-tag">CUESTIONARIOS Y EVALUACIONES</span>
            <h1 class="qz-hero-title">Selecciona el Curso</h1>
            <p class="qz-hero-subtitle">
              Elige un curso para ver sus áreas y cuestionarios
            </p>
          </div>
        </div>

        <!-- 2. CUERPO: LISTA DE CURSOS ESTILO QUEEZY LEADERBOARD (image26) -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- Lista de Cursos -->
            <div v-if="cursos && cursos.length > 0" class="qz-course-list">
              <div
                v-for="(curso, index) in cursos"
                :key="curso.id"
                class="qz-course-card"
                @click="courseSelected(curso)"
              >
                <!-- Squircle de Birrete Educativo con paleta pastel alternada -->
                <div
                  class="qz-avatar-squircle"
                  :class="getSquircleColor(index)"
                >
                  <ion-icon :icon="schoolOutline"></ion-icon>
                </div>

                <!-- Info del Curso -->
                <div class="qz-course-info">
                  <h2 class="qz-course-name">{{ curso.name }}</h2>
                  <span class="qz-course-sub"
                    >Año lectivo {{ selectedYear }}</span
                  >
                </div>

                <!-- Botón flecha Queezy -->
                <div class="qz-action-pill">
                  <ion-icon :icon="chevronForwardOutline"></ion-icon>
                </div>
              </div>
            </div>

            <!-- Estado Vacío -->
            <div v-else class="qz-empty-card">
              <div class="qz-empty-icon-box">
                <ion-icon :icon="schoolOutline"></ion-icon>
              </div>
              <h3 class="qz-empty-title">No hay cursos registrados</h3>
              <p class="qz-empty-desc">
                No se encontraron cursos activos para el año lectivo
                {{ selectedYear }}. Prueba seleccionando otro año en el filtro
                superior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import {
  tokenHeader,
  usuarioGet,
  selectedYear as selectedYearService,
  currentServerYear,
} from "../globalService";

import {
  schoolOutline,
  arrowBackOutline,
  chevronForwardOutline,
  calendarOutline,
} from "ionicons/icons";

import {
  onIonViewWillEnter,
  IonPage,
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";

export default {
  name: "CuestionariosPage",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const router = useRouter();
    const usuario = ref();
    const cursos = ref([]);
    const selectedYear = ref();
    const availableYears = ref(
      Array.from({ length: 10 }, (_, i) => currentServerYear() - i),
    );

    // Paleta pastel Queezy para el squircle de los birretes
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

    const courseSelected = (course) => {
      localStorage.setItem("courseSelected", JSON.stringify(course));
      router.push(`/areas/${course.id}`);
    };

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/panel");
      }
    };

    const fetchCursosUsuario = async (year) => {
      if (!usuario.value?.id) return;
      try {
        const isAdminView = localStorage.getItem("adminView") === "true";
        let response;

        if (usuario.value.rol === "admin" && isAdminView) {
          // Fetch ALL institute courses
          response = await axios.get(
            `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
            tokenHeader(),
          );
          cursos.value = response.data
            .map((c) => ({
              id: c.id,
              name: c.name,
              year: year, // Assume selected year
              active: true,
            }))
            .sort((a, b) => parseInt(a.name) - parseInt(b.name));
        } else {
          // Fetch only assigned courses
          response = await axios.get(
            `/users/${usuario.value.id}/courses?year=${year}&active=true`,
            tokenHeader(),
          );
          cursos.value = (response.data || [])
            .filter((c) => c && c.course)
            .map((c) => ({
              id: c.course.id,
              name: c.course.name,
              year: c.year,
              active: c.active,
            }))
            .sort((a, b) => parseInt(a.name) - parseInt(b.name));
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        cursos.value = [];
      }
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();

      const storedYear = JSON.parse(localStorage.getItem("year"));
      selectedYear.value = storedYear || selectedYearService();

      await fetchCursosUsuario(selectedYear.value);
    });

    watch(selectedYear, async (newYear) => {
      localStorage.setItem("year", JSON.stringify(newYear));
      await fetchCursosUsuario(newYear);
    });

    return {
      usuario,
      cursos,
      selectedYear,
      availableYears,
      courseSelected,
      goBack,
      getSquircleColor,
      schoolOutline,
      arrowBackOutline,
      chevronForwardOutline,
      calendarOutline,
    };
  },
};
</script>

<style scoped>
.qz-cursos-page {
  background-color: var(--qz-color-purple-bg, #efeefc);
}

.qz-cursos-content {
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
  padding-bottom: 22px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 540px;
  margin: 0 auto;
  padding: 8px 18px 14px 18px;
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

/* Cápsula de Año */
.qz-year-capsule {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 4px 14px;
  color: #ffffff;
}

.qz-calendar-icon {
  font-size: 16px;
  color: #ffffff;
  margin-right: 6px;
}

.qz-year-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-right: 4px;
}

.qz-year-select {
  --color: #ffffff;
  --placeholder-color: #ffffff;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  padding-left: 0;
}

/* Títulos del Hero */
.qz-hero-titles {
  max-width: 540px;
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

/* 2. CUERPO Y CONTENEDOR */
.qz-main-body {
  flex: 1;
  padding: 8px 18px 28px 18px;
}

.qz-container {
  max-width: 540px;
  margin: 0 auto;
}

/* Lista de Tarjetas de Curso */
.qz-course-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-course-card {
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
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.qz-course-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 10px -2px rgba(106, 90, 224, 0.12);
}

/* Squircle de Avatar con Birrete */
.qz-avatar-squircle {
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

.qz-course-card:active .qz-avatar-squircle {
  transform: scale(0.94);
}

/* Variantes Pastel de Squircles */
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

/* Información del Curso */
.qz-course-info {
  flex: 1;
  min-width: 0;
}

.qz-course-name {
  margin: 0 0 3px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 17px;
  font-weight: 700;
  color: #0c092a;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-course-sub {
  font-size: 13px;
  font-weight: 500;
  color: #858494;
  display: block;
}

/* Píldora de Acción (Flecha) */
.qz-action-pill {
  width: 36px;
  height: 36px;
  border-radius: var(--qz-radius-full, 9999px);
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;
}

.qz-course-card:active .qz-action-pill {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
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

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  .qz-cursos-page {
    background-color: #120f24;
  }
  .qz-cursos-content {
    --background: #120f24;
  }
  .qz-hero-header {
    background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
  }
  .qz-course-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.35);
  }
  .qz-course-name {
    color: #f7f7fd;
  }
  .qz-course-sub {
    color: #9e9bb8;
  }
  .qz-action-pill {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-course-card:active .qz-action-pill {
    background: #352b6a;
    color: #ffffff;
  }
  .qz-empty-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.35);
  }
  .qz-empty-title {
    color: #f7f7fd;
  }
  .qz-empty-desc {
    color: #9e9bb8;
  }
  .qz-empty-icon-box {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-squircle--purple {
    background-color: #2a2254;
    color: #a39bf0;
  }
  .qz-squircle--coral {
    background-color: #482433;
    color: #ff8577;
  }
  .qz-squircle--cyan {
    background-color: #16344d;
    color: #38bdf8;
  }
  .qz-squircle--gold {
    background-color: #42321c;
    color: #f0af3d;
  }
  .qz-squircle--green {
    background-color: #143d2b;
    color: #34d399;
  }
}

:global(body.dark) .qz-cursos-page,
:global(html.dark) .qz-cursos-page,
:global(.dark) .qz-cursos-page {
  background-color: #120f24;
}

:global(body.dark) .qz-cursos-content,
:global(html.dark) .qz-cursos-content,
:global(.dark) .qz-cursos-content {
  --background: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
}

:global(body.dark) .qz-course-card,
:global(html.dark) .qz-course-card,
:global(.dark) .qz-course-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.35);
}

:global(body.dark) .qz-course-name,
:global(html.dark) .qz-course-name,
:global(.dark) .qz-course-name {
  color: #f7f7fd;
}

:global(body.dark) .qz-course-sub,
:global(html.dark) .qz-course-sub,
:global(.dark) .qz-course-sub {
  color: #9e9bb8;
}

:global(body.dark) .qz-action-pill,
:global(html.dark) .qz-action-pill,
:global(.dark) .qz-action-pill {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-course-card:active .qz-action-pill,
:global(html.dark) .qz-course-card:active .qz-action-pill,
:global(.dark) .qz-course-card:active .qz-action-pill {
  background: #352b6a;
  color: #ffffff;
}

:global(body.dark) .qz-empty-card,
:global(html.dark) .qz-empty-card,
:global(.dark) .qz-empty-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.35);
}

:global(body.dark) .qz-empty-title,
:global(html.dark) .qz-empty-title,
:global(.dark) .qz-empty-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-empty-desc,
:global(html.dark) .qz-empty-desc,
:global(.dark) .qz-empty-desc {
  color: #9e9bb8;
}

:global(body.dark) .qz-empty-icon-box,
:global(html.dark) .qz-empty-icon-box,
:global(.dark) .qz-empty-icon-box {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-squircle--purple,
:global(html.dark) .qz-squircle--purple,
:global(.dark) .qz-squircle--purple {
  background-color: #2a2254;
  color: #a39bf0;
}

:global(body.dark) .qz-squircle--coral,
:global(html.dark) .qz-squircle--coral,
:global(.dark) .qz-squircle--coral {
  background-color: #482433;
  color: #ff8577;
}

:global(body.dark) .qz-squircle--cyan,
:global(html.dark) .qz-squircle--cyan,
:global(.dark) .qz-squircle--cyan {
  background-color: #16344d;
  color: #38bdf8;
}

:global(body.dark) .qz-squircle--gold,
:global(html.dark) .qz-squircle--gold,
:global(.dark) .qz-squircle--gold {
  background-color: #42321c;
  color: #f0af3d;
}

:global(body.dark) .qz-squircle--green,
:global(html.dark) .qz-squircle--green,
:global(.dark) .qz-squircle--green {
  background-color: #143d2b;
  color: #34d399;
}
</style>
