<template>
  <ion-page class="ion-page qz-ruleta-page">
    <ion-content :fullscreen="true" class="qz-ruleta-content">
      <div class="qz-ruleta-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top">
              <button
                type="button"
                class="qz-back-btn"
                title="Volver a herramientas"
                aria-label="Volver"
                @click="goBack"
              >
                <ion-icon :icon="arrowBackOutline"></ion-icon>
              </button>
              <span class="qz-hero-tag">SELECCIÓN ALEATORIA</span>
            </div>

            <div class="qz-hero-title-row">
              <div>
                <h1 class="qz-hero-title">Ruleta de Estudiantes</h1>
                <p class="qz-hero-subtitle" v-if="selectedCourseId">
                  {{ selectedCourseName }} · Año {{ selectedYear }} ({{
                    students.length
                  }}
                  estudiantes)
                </p>
                <p class="qz-hero-subtitle" v-else>
                  Elige un curso y gira para seleccionar al azar
                </p>
              </div>

              <button
                v-if="selectedCourseId"
                type="button"
                class="qz-course-pill-btn"
                @click="openSelectionModal"
              >
                <ion-icon :icon="schoolOutline"></ion-icon>
                <span>Cambiar Curso</span>
              </button>
            </div>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-ruleta-body">
          <!-- Estado Inicial: Sin girar aún -->
          <div
            v-if="!spinning && !winner && !hasMarshaled"
            class="qz-card qz-ruleta-card"
          >
            <div class="qz-card-top-center">
              <div class="qz-icon-squircle qz-icon--purple">
                <ion-icon :icon="discOutline"></ion-icon>
              </div>
              <h2 class="qz-card-title">¿Quién participará ahora?</h2>
              <p class="qz-card-desc" v-if="!selectedCourseId">
                Por favor, selecciona un curso para empezar.
              </p>
              <p class="qz-card-desc" v-else-if="!students.length">
                No hay estudiantes activos en este curso.
              </p>
              <p class="qz-card-desc" v-else>
                Listo para girar con {{ students.length }} estudiantes.
              </p>
            </div>

            <div class="qz-toggle-row">
              <span class="qz-toggle-label">
                Excluir estudiantes que ya salieron
              </span>
              <ion-toggle
                v-model="excludeSelected"
                class="qz-toggle"
              ></ion-toggle>
            </div>

            <div class="qz-card-actions">
              <button
                type="button"
                class="qz-btn-primary"
                :disabled="!students.length || !selectedCourseId"
                @click="spinRoulette"
              >
                <ion-icon :icon="playOutline"></ion-icon>
                <span>Girar Ruleta</span>
              </button>

              <button
                v-if="selectedCourseId"
                type="button"
                class="qz-btn-outline"
                @click="openSelectionModal"
              >
                <ion-icon :icon="schoolOutline"></ion-icon>
                <span>Cambiar Curso</span>
              </button>
              <button
                v-else
                type="button"
                class="qz-btn-outline"
                @click="openSelectionModal"
              >
                <ion-icon :icon="schoolOutline"></ion-icon>
                <span>Seleccionar Curso</span>
              </button>
            </div>
          </div>

          <!-- Estado Girando o Ganador -->
          <div v-else class="qz-card qz-ruleta-card">
            <div class="qz-state-header">
              <span
                class="qz-state-pill"
                :class="spinning ? 'qz-state--spinning' : 'qz-state--winner'"
              >
                {{ spinning ? "Girando la ruleta..." : "¡Estudiante Seleccionado!" }}
              </span>
            </div>

            <!-- Ventana de la Ruleta -->
            <div class="roulette-window">
              <div class="roulette-strip" :style="stripStyle">
                <div
                  v-for="(student, index) in rouletteItems"
                  :key="index"
                  class="roulette-item"
                >
                  {{ student.lastName }} {{ student.name }}
                </div>
              </div>
              <div class="roulette-highlight"></div>
            </div>

            <!-- Controles debajo de la ruleta -->
            <div class="controls-container" v-if="!spinning && winner">
              <div class="qz-winner-banner">
                <span class="qz-winner-label">GANADOR</span>
                <h2 class="winner-name">
                  {{ winner.lastName }} {{ winner.name }}
                </h2>
              </div>

              <div class="qz-toggle-row qz-toggle-row--compact">
                <span class="qz-toggle-label">
                  Excluir estudiantes que ya salieron
                </span>
                <ion-toggle
                  v-model="excludeSelected"
                  class="qz-toggle"
                ></ion-toggle>
              </div>

              <div class="action-buttons">
                <button
                  type="button"
                  class="qz-btn-primary"
                  @click="spinRoulette"
                >
                  <ion-icon :icon="refreshOutline"></ion-icon>
                  <span>Girar de nuevo</span>
                </button>
                <button
                  type="button"
                  class="qz-btn-outline"
                  @click="openSelectionModal"
                >
                  <ion-icon :icon="schoolOutline"></ion-icon>
                  <span>Cambiar Curso</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- Modal de Selección de Curso y Año -->
      <ion-modal
        :is-open="isSelectionModalOpen"
        @didDismiss="handleSelectionModalDismiss"
        :backdrop-dismiss="false"
        class="qz-session-modal"
      >
        <div class="qz-modal-container">
          <div class="qz-modal-header">
            <div>
              <span class="qz-modal-badge">CONFIGURACIÓN</span>
              <h3 class="qz-modal-title">Selecciona Curso y Año</h3>
            </div>
            <button
              type="button"
              class="qz-modal-close-btn"
              title="Cerrar"
              aria-label="Cerrar"
              @click="handleSelectionModalDismiss"
            >
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>

          <div class="qz-modal-body">
            <div class="qz-field-group">
              <label class="qz-field-label">Año Lectivo</label>
              <div class="qz-select-wrapper">
                <ion-icon
                  :icon="calendarOutline"
                  class="qz-field-icon"
                ></ion-icon>
                <ion-select
                  v-model="selectedYear"
                  interface="popover"
                  :interface-options="{ cssClass: 'qz-popover-filter' }"
                  placeholder="Seleccione el año"
                  class="qz-compact-select"
                  @ionChange="getCourses"
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

            <div class="qz-field-group">
              <label class="qz-field-label">Curso</label>
              <div class="qz-select-wrapper">
                <ion-icon
                  :icon="schoolOutline"
                  class="qz-field-icon"
                ></ion-icon>
                <ion-select
                  v-model="selectedCourseId"
                  interface="popover"
                  :interface-options="{ cssClass: 'qz-popover-filter' }"
                  placeholder="Seleccione un curso"
                  :disabled="!courses.length"
                  class="qz-compact-select"
                  @ionChange="getStudents"
                >
                  <ion-select-option
                    v-for="course in courses"
                    :key="course.id"
                    :value="course.id"
                  >
                    {{ course.name }}
                  </ion-select-option>
                </ion-select>
              </div>
            </div>
          </div>

          <div class="qz-modal-footer">
            <button
              type="button"
              class="qz-modal-btn qz-btn--cancel"
              @click="handleSelectionModalDismiss"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="qz-modal-btn qz-btn--confirm"
              :disabled="!selectedCourseId"
              @click="confirmSelection"
            >
              Confirmar
            </button>
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
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonModal,
  IonToggle,
} from "@ionic/vue";
import { defineComponent, ref, computed, onMounted, onUnmounted } from "vue";
import {
  playOutline,
  refreshOutline,
  arrowBackOutline,
  discOutline,
  schoolOutline,
  calendarOutline,
  closeOutline,
} from "ionicons/icons";
import axios from "axios";
import {
  tokenHeader,
  usuarioGet,
  currentServerYear,
  fetchServerTime,
} from "../globalService";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "RuletaPage",
  components: {
    IonPage,
    IonContent,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonModal,
    IonToggle,
  },
  setup() {
    const router = useRouter();
    const usuario = ref(null);
    const isSelectionModalOpen = ref(true);
    const selectedYear = ref(currentServerYear());
    const years = ref([]);
    const courses = ref([]);
    const selectedCourseId = ref(null);
    const students = ref([]);
    const selectedStudentIds = ref([]);
    const excludeSelected = ref(false);

    // Roulette State
    const spinning = ref(false);
    const winner = ref(null);
    const hasMarshaled = ref(false);
    const rouletteItems = ref([]);
    const stripStyle = ref({});

    // Constants for visuals
    const ITEM_HEIGHT = 50; // pixels
    const VISIBLE_ITEMS = 3;

    const selectedCourseName = computed(() => {
      const course = courses.value.find((c) => c.id === selectedCourseId.value);
      return course ? `Curso ${course.name}` : "";
    });

    const generateYears = () => {
      const currentYear = currentServerYear();
      years.value = Array.from({ length: 10 }, (_, i) => currentYear - i);
    };

    const getCourses = async () => {
      if (!usuario.value || !usuario.value.institute || !selectedYear.value) {
        courses.value = [];
        selectedCourseId.value = null;
        students.value = [];
        return;
      }
      try {
        const response = await axios.get(
          `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
          tokenHeader(),
        );
        courses.value = response.data.sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        selectedCourseId.value = null;
        students.value = [];
      } catch (error) {
        console.error("Error fetching courses:", error);
        courses.value = [];
      }
    };

    const getStudents = async () => {
      if (!selectedCourseId.value) {
        students.value = [];
        return;
      }
      try {
        const response = await axios.get(
          `/courses/${selectedCourseId.value}/users?year=${selectedYear.value}&active=true`,
          tokenHeader(),
        );
        students.value = response.data
          .filter(
            (assignment) =>
              assignment.rol === "student" || assignment.rol === "user",
          )
          .map((assignment) => assignment.user)
          .sort((a, b) => {
            const lastNameA = a.lastName || "";
            const lastNameB = b.lastName || "";
            if (lastNameA !== lastNameB) {
              return lastNameA.localeCompare(lastNameB);
            }
            const nameA = a.name || "";
            const nameB = b.name || "";
            return nameA.localeCompare(nameB);
          });
      } catch (error) {
        console.error("Error fetching students:", error);
        students.value = [];
      }
    };

    const confirmSelection = async () => {
      if (selectedCourseId.value) {
        selectedStudentIds.value = [];
        await getStudents();
        isSelectionModalOpen.value = false;
      }
    };

    const openSelectionModal = () => {
      isSelectionModalOpen.value = true;
    };

    const handleSelectionModalDismiss = () => {
      if (!selectedCourseId.value && isSelectionModalOpen.value) {
        isSelectionModalOpen.value = false;
        router.back();
      } else {
        isSelectionModalOpen.value = false;
      }
    };

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/herramientas");
      }
    };

    const spinRoulette = () => {
      if (!students.value.length) return;

      let availableStudents = students.value;

      if (excludeSelected.value) {
        availableStudents = students.value.filter(
          (s) => !selectedStudentIds.value.includes(s.id),
        );

        if (availableStudents.length === 0) {
          selectedStudentIds.value = [];
          availableStudents = students.value;
        }
      }

      spinning.value = true;
      winner.value = null;
      hasMarshaled.value = true;

      const totalStudents = availableStudents.length;
      const targetIndex = Math.floor(Math.random() * totalStudents);
      const targetStudent = availableStudents[targetIndex];

      selectedStudentIds.value.push(targetStudent.id);

      const numberOfFillers = 40;
      const fillerStudents = [];

      for (let i = 0; i < numberOfFillers; i++) {
        const randomIndex = Math.floor(Math.random() * totalStudents);
        fillerStudents.push(availableStudents[randomIndex]);
      }

      const prevIndex = (targetIndex - 1 + totalStudents) % totalStudents;
      const nextIndex = (targetIndex + 1) % totalStudents;

      const finalView = [
        availableStudents[prevIndex],
        targetStudent,
        availableStudents[nextIndex],
      ];

      const fullList = [...finalView, ...fillerStudents];
      rouletteItems.value = fullList;

      const totalHeight = fullList.length * ITEM_HEIGHT;
      const windowHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
      const startOffset = -(totalHeight - windowHeight);
      const endOffset = 0;

      const SPIN_DURATION_MS = 9000;
      const SPIN_DURATION_SEC = SPIN_DURATION_MS / 1000;

      stripStyle.value = {
        transform: `translateY(${startOffset}px)`,
        transition: "none",
      };

      setTimeout(() => {
        stripStyle.value = {
          transform: `translateY(${endOffset}px)`,
          transition: `transform ${SPIN_DURATION_SEC}s cubic-bezier(0.1, 0.7, 0.1, 1)`,
        };
      }, 50);

      setTimeout(() => {
        winner.value = targetStudent;
        spinning.value = false;
      }, SPIN_DURATION_MS + 50);
    };

    onMounted(async () => {
      usuario.value = usuarioGet();
      await fetchServerTime();
      selectedYear.value = currentServerYear();
      generateYears();
      await getCourses();
    });

    onUnmounted(() => {
      selectedStudentIds.value = [];
    });

    return {
      playOutline,
      refreshOutline,
      arrowBackOutline,
      discOutline,
      schoolOutline,
      calendarOutline,
      closeOutline,
      isSelectionModalOpen,
      selectedYear,
      years,
      courses,
      selectedCourseId,
      selectedCourseName,
      students,
      spinning,
      winner,
      hasMarshaled,
      selectedStudentIds,
      excludeSelected,
      rouletteItems,
      stripStyle,
      getCourses,
      getStudents,
      confirmSelection,
      openSelectionModal,
      handleSelectionModalDismiss,
      goBack,
      spinRoulette,
    };
  },
});
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: RULETA DE ESTUDIANTES
   ========================================================================== */

.qz-ruleta-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-ruleta-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-ruleta-wrapper {
  display: flex;
  flex-direction: column;
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
  max-width: 680px;
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
  backdrop-filter: blur(6px);
}

.qz-hero-title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
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

.qz-course-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  color: #6a5ae0;
  border: none;
  border-radius: 12px;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.qz-course-pill-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
}

/* 2. CUERPO Y TARJETAS */
.qz-ruleta-body {
  padding: 20px 16px 24px;
  max-width: 680px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.qz-card {
  background: #ffffff;
  border-radius: var(--qz-radius-xl, 24px);
  padding: 24px 20px;
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.12));
  box-shadow: 0 6px 20px rgba(12, 9, 42, 0.05);
  box-sizing: border-box;
}

.qz-card-top-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
}

.qz-icon-squircle {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 12px;
}

.qz-icon--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-card-title {
  margin: 0 0 6px;
  font-size: 19px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-card-desc {
  margin: 0;
  font-size: 13.5px;
  color: var(--qz-color-text-muted, #858494);
  font-weight: 500;
}

/* TOGGLE ROW */
.qz-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #f4f3fd;
  border: 1px solid rgba(106, 90, 224, 0.12);
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.qz-toggle-row--compact {
  margin: 16px 0;
}

.qz-toggle-label {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-toggle {
  --track-background: rgba(133, 132, 148, 0.3);
  --track-background-checked: #6a5ae0;
  --handle-background: #ffffff;
}

/* BOTONES */
.qz-card-actions,
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-btn-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.28);
  transition: all 0.2s ease;
}

.qz-btn-primary:hover:not(:disabled) {
  background: #5b4cc9;
  transform: translateY(-1px);
}

.qz-btn-primary:disabled {
  opacity: 0.48;
  cursor: not-allowed;
  box-shadow: none;
}

.qz-btn-outline {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #efeefc;
  color: #6a5ae0;
  border: 1.5px solid rgba(106, 90, 224, 0.2);
  border-radius: 14px;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn-outline:hover {
  background: #e2e0fb;
}

/* ESTADO RULETA */
.qz-state-header {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.qz-state-pill {
  font-size: 12px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 9999px;
  letter-spacing: 0.4px;
}

.qz-state--spinning {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-state--winner {
  background: #eafbf1;
  color: #16a34a;
}

.roulette-window {
  height: 150px; /* 3 items * 50px */
  overflow: hidden;
  position: relative;
  background: #f4f3fd;
  border-radius: 16px;
  border: 3px solid #6a5ae0;
  margin-bottom: 18px;
  box-shadow: inset 0 2px 10px rgba(106, 90, 224, 0.1);
}

.roulette-strip {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.roulette-item {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  border-bottom: 1px solid rgba(106, 90, 224, 0.12);
  background: #ffffff;
  box-sizing: border-box;
  padding: 0 12px;
  text-align: center;
}

.roulette-highlight {
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  height: 50px;
  background: rgba(106, 90, 224, 0.14);
  pointer-events: none;
  border-top: 2px solid #6a5ae0;
  border-bottom: 2px solid #6a5ae0;
  box-sizing: border-box;
}

.controls-container {
  text-align: center;
  animation: fadeIn 0.4s ease-out;
}

.qz-winner-banner {
  background: #eafbf1;
  border: 1.5px solid rgba(44, 182, 125, 0.3);
  border-radius: 16px;
  padding: 14px 16px;
}

.qz-winner-label {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #16a34a;
  margin-bottom: 4px;
}

.winner-name {
  text-align: center;
  color: #15803d;
  font-size: 1.5rem;
  margin: 0;
  font-weight: 900;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==========================================================================
   MODAL QUEEZY DE SELECCIÓN
   ========================================================================== */
.qz-session-modal {
  --background: #ffffff;
  --border-radius: 26px;
}

.qz-modal-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: #ffffff;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22px;
}

.qz-modal-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: #6a5ae0;
  background: #efeefc;
  padding: 4px 10px;
  border-radius: 8px;
}

.qz-modal-title {
  margin: 6px 0 0;
  font-size: 19px;
  font-weight: 800;
  color: #0c092a;
}

.qz-modal-close-btn {
  background: #f4f3fd;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: #858494;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-modal-close-btn:hover {
  background: #e6e4fa;
  color: #0c092a;
}

.qz-modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-field-label {
  font-size: 12px;
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
  border: 1.5px solid rgba(106, 90, 224, 0.18);
  border-radius: 14px;
  height: 46px;
  padding: 0 12px 0 40px;
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
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
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
  font-size: 14px;
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
  opacity: 0.8;
}

.qz-modal-footer {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.qz-modal-btn {
  flex: 1;
  padding: 13px 18px;
  border-radius: 14px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn--cancel {
  background: #f4f3fd;
  color: #858494;
}

.qz-btn--cancel:hover {
  background: #e9e7fc;
  color: #0c092a;
}

.qz-btn--confirm {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-btn--confirm:hover:not(:disabled) {
  background: #5b4cc9;
}

.qz-btn--confirm:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-ruleta-page,
  body:not(.light) .qz-ruleta-content {
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

  body:not(.light) .qz-course-pill-btn {
    background: #2b2254;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.16);
  }

  body:not(.light) .qz-card,
  body:not(.light) .qz-modal-container {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  body:not(.light) .qz-session-modal {
    --background: #1d1838;
  }

  body:not(.light) .qz-icon--purple {
    background: rgba(124, 110, 242, 0.2);
    color: #b5a9ff;
  }

  body:not(.light) .qz-card-title,
  body:not(.light) .qz-toggle-label,
  body:not(.light) .qz-modal-title {
    color: #f7f7fd;
  }

  body:not(.light) .qz-card-desc {
    color: #9e9bb8;
  }

  body:not(.light) .qz-toggle-row {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.08);
  }

  body:not(.light) .qz-btn-outline {
    background: #2b2254;
    color: #b5a9ff;
    border-color: rgba(181, 169, 255, 0.28);
  }

  body:not(.light) .qz-btn-outline:hover {
    background: #362b69;
    color: #ffffff;
  }

  body:not(.light) .qz-state--spinning {
    background: #2b2254;
    color: #b5a9ff;
  }

  body:not(.light) .qz-state--winner {
    background: rgba(83, 223, 131, 0.18);
    color: #53df83;
  }

  body:not(.light) .roulette-window {
    background: #120f24;
    border-color: #7c6ef2;
  }

  body:not(.light) .roulette-item {
    background: #1d1838;
    color: #f7f7fd;
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  body:not(.light) .roulette-highlight {
    background: rgba(124, 110, 242, 0.24);
    border-top-color: #8c7ef8;
    border-bottom-color: #8c7ef8;
  }

  body:not(.light) .qz-winner-banner {
    background: rgba(83, 223, 131, 0.15);
    border-color: rgba(83, 223, 131, 0.32);
  }

  body:not(.light) .qz-winner-label,
  body:not(.light) .winner-name {
    color: #53df83;
  }

  body:not(.light) .qz-modal-badge {
    background: #2b2254;
    color: #b5a9ff;
  }

  body:not(.light) .qz-modal-close-btn,
  body:not(.light) .qz-btn--cancel {
    background: #241d42;
    color: #a49fc4;
  }

  body:not(.light) .qz-modal-close-btn:hover,
  body:not(.light) .qz-btn--cancel:hover {
    background: #2c2550;
    color: #ffffff;
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
}

:global(body.dark) .qz-ruleta-page,
:global(body.dark) .qz-ruleta-content,
:global(html.dark) .qz-ruleta-page,
:global(html.dark) .qz-ruleta-content,
:global(.dark) .qz-ruleta-page,
:global(.dark) .qz-ruleta-content {
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

:global(body.dark) .qz-course-pill-btn,
:global(html.dark) .qz-course-pill-btn,
:global(.dark) .qz-course-pill-btn {
  background: #2b2254;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card,
:global(body.dark) .qz-modal-container,
:global(html.dark) .qz-modal-container,
:global(.dark) .qz-modal-container {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-session-modal,
:global(html.dark) .qz-session-modal,
:global(.dark) .qz-session-modal {
  --background: #1d1838;
}

:global(body.dark) .qz-icon--purple,
:global(html.dark) .qz-icon--purple,
:global(.dark) .qz-icon--purple {
  background: rgba(124, 110, 242, 0.2);
  color: #b5a9ff;
}

:global(body.dark) .qz-card-title,
:global(html.dark) .qz-card-title,
:global(.dark) .qz-card-title,
:global(body.dark) .qz-toggle-label,
:global(html.dark) .qz-toggle-label,
:global(.dark) .qz-toggle-label,
:global(body.dark) .qz-modal-title,
:global(html.dark) .qz-modal-title,
:global(.dark) .qz-modal-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-card-desc,
:global(html.dark) .qz-card-desc,
:global(.dark) .qz-card-desc {
  color: #9e9bb8;
}

:global(body.dark) .qz-toggle-row,
:global(html.dark) .qz-toggle-row,
:global(.dark) .qz-toggle-row {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-btn-outline,
:global(html.dark) .qz-btn-outline,
:global(.dark) .qz-btn-outline {
  background: #2b2254;
  color: #b5a9ff;
  border-color: rgba(181, 169, 255, 0.28);
}

:global(body.dark) .qz-btn-outline:hover,
:global(html.dark) .qz-btn-outline:hover,
:global(.dark) .qz-btn-outline:hover {
  background: #362b69;
  color: #ffffff;
}

:global(body.dark) .qz-state--spinning,
:global(html.dark) .qz-state--spinning,
:global(.dark) .qz-state--spinning {
  background: #2b2254;
  color: #b5a9ff;
}

:global(body.dark) .qz-state--winner,
:global(html.dark) .qz-state--winner,
:global(.dark) .qz-state--winner {
  background: rgba(83, 223, 131, 0.18);
  color: #53df83;
}

:global(body.dark) .roulette-window,
:global(html.dark) .roulette-window,
:global(.dark) .roulette-window {
  background: #120f24;
  border-color: #7c6ef2;
}

:global(body.dark) .roulette-item,
:global(html.dark) .roulette-item,
:global(.dark) .roulette-item {
  background: #1d1838;
  color: #f7f7fd;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .roulette-highlight,
:global(html.dark) .roulette-highlight,
:global(.dark) .roulette-highlight {
  background: rgba(124, 110, 242, 0.24);
  border-top-color: #8c7ef8;
  border-bottom-color: #8c7ef8;
}

:global(body.dark) .qz-winner-banner,
:global(html.dark) .qz-winner-banner,
:global(.dark) .qz-winner-banner {
  background: rgba(83, 223, 131, 0.15);
  border-color: rgba(83, 223, 131, 0.32);
}

:global(body.dark) .qz-winner-label,
:global(html.dark) .qz-winner-label,
:global(.dark) .qz-winner-label,
:global(body.dark) .winner-name,
:global(html.dark) .winner-name,
:global(.dark) .winner-name {
  color: #53df83;
}

:global(body.dark) .qz-modal-badge,
:global(html.dark) .qz-modal-badge,
:global(.dark) .qz-modal-badge {
  background: #2b2254;
  color: #b5a9ff;
}

:global(body.dark) .qz-modal-close-btn,
:global(html.dark) .qz-modal-close-btn,
:global(.dark) .qz-modal-close-btn,
:global(body.dark) .qz-btn--cancel,
:global(html.dark) .qz-btn--cancel,
:global(.dark) .qz-btn--cancel {
  background: #241d42;
  color: #a49fc4;
}

:global(body.dark) .qz-modal-close-btn:hover,
:global(html.dark) .qz-modal-close-btn:hover,
:global(.dark) .qz-modal-close-btn:hover,
:global(body.dark) .qz-btn--cancel:hover,
:global(html.dark) .qz-btn--cancel:hover,
:global(.dark) .qz-btn--cancel:hover {
  background: #2c2550;
  color: #ffffff;
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
</style>
