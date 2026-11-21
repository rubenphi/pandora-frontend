<template>
  <div class="qz-modal-sheet">
    <!-- 1. Cabecera del Modal -->
    <div class="qz-modal-top-bar">
      <div class="qz-modal-header-info">
        <div class="qz-modal-header-icon">
          <ion-icon :icon="copyOutline"></ion-icon>
        </div>
        <div>
          <h2 class="qz-modal-title">Importar desde otra Actividad</h2>
          <p class="qz-modal-desc">
            Filtra por curso, área y periodo para explorar y reutilizar
            criterios
          </p>
        </div>
      </div>

      <button
        type="button"
        class="qz-modal-close-btn"
        title="Cerrar modal"
        @click="cancel()"
      >
        <ion-icon :icon="closeOutline"></ion-icon>
      </button>
    </div>

    <!-- 2. Caja de Filtros Queezy -->
    <div class="qz-modal-filters-box">
      <div class="qz-filters-grid">
        <!-- Curso -->
        <div class="qz-filter-field">
          <label class="qz-filter-label">Curso</label>
          <div class="qz-select-wrap">
            <ion-select
              v-model="selectedCourse"
              placeholder="Selecciona curso"
              interface="popover"
              class="qz-custom-select"
              @ionChange="handleCourseChange($event.detail.value)"
            >
              <ion-select-option
                v-for="courseOpt in availableCourses"
                :key="courseOpt.id"
                :value="courseOpt.id"
              >
                {{ courseOpt.name }}
              </ion-select-option>
            </ion-select>
          </div>
        </div>

        <!-- Área -->
        <div class="qz-filter-field">
          <label class="qz-filter-label">Área</label>
          <div class="qz-select-wrap">
            <ion-select
              v-model="selectedArea"
              placeholder="Selecciona área"
              interface="popover"
              class="qz-custom-select"
            >
              <ion-select-option
                v-for="areaOpt in availableAreas"
                :key="areaOpt.id"
                :value="areaOpt.id"
              >
                {{ areaOpt.name }}
              </ion-select-option>
            </ion-select>
          </div>
        </div>

        <!-- Año -->
        <div class="qz-filter-field">
          <label class="qz-filter-label">Año</label>
          <div class="qz-select-wrap">
            <ion-select
              v-model="selectedYear"
              placeholder="Año"
              interface="popover"
              class="qz-custom-select"
            >
              <ion-select-option
                v-for="yearOpt in availableYears"
                :key="yearOpt"
                :value="yearOpt"
              >
                {{ yearOpt }}
              </ion-select-option>
            </ion-select>
          </div>
        </div>

        <!-- Periodo -->
        <div class="qz-filter-field">
          <label class="qz-filter-label">Periodo</label>
          <div class="qz-select-wrap">
            <ion-select
              v-model="selectedPeriod"
              placeholder="Periodo"
              interface="popover"
              class="qz-custom-select"
            >
              <ion-select-option
                v-for="periodOpt in availablePeriods"
                :key="periodOpt.id"
                :value="periodOpt.id"
              >
                {{ periodOpt.name }}
              </ion-select-option>
            </ion-select>
          </div>
        </div>
      </div>

      <!-- Botón de Búsqueda -->
      <div class="qz-filter-actions">
        <button
          type="button"
          class="qz-search-pill-btn"
          :disabled="isLoadingLessons"
          @click="performSearch()"
        >
          <ion-spinner
            v-if="isLoadingLessons"
            name="crescent"
            class="qz-spinner-sm"
          ></ion-spinner>
          <template v-else>
            <ion-icon :icon="searchOutline"></ion-icon>
            <span>Buscar Lecciones</span>
          </template>
        </button>
      </div>
    </div>

    <!-- 3. Contenido con Scroll para Resultados -->
    <div class="qz-modal-results-scroll">
      <!-- Estado de Carga -->
      <div v-if="isLoadingLessons && searchPerformed" class="qz-status-box">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <span>Buscando lecciones disponibles...</span>
      </div>

      <!-- Estado Sin Resultados -->
      <div
        v-else-if="searchPerformed && lessons.length === 0"
        class="qz-status-box"
      >
        <ion-icon :icon="alertCircleOutline"></ion-icon>
        <span>No se encontraron lecciones para los filtros seleccionados.</span>
      </div>

      <!-- Estado Inicial antes de buscar -->
      <div v-else-if="!searchPerformed" class="qz-status-box qz-status--idle">
        <ion-icon :icon="bookOutline"></ion-icon>
        <span
          >Ajusta los filtros y haz clic en "Buscar Lecciones" para explorar
          actividades</span
        >
      </div>

      <!-- Lista de Lecciones con Acordeones Queezy -->
      <ion-accordion-group v-else class="qz-lessons-accordion-group">
        <ion-accordion
          v-for="lesson in lessons"
          :key="lesson.id"
          :value="'lesson-' + lesson.id"
          class="qz-lesson-accordion"
        >
          <!-- Cabecera de Lección -->
          <div
            slot="header"
            class="qz-lesson-acc-header"
            @click="handleLessonClick(lesson)"
          >
            <div class="qz-acc-title-wrap">
              <div class="qz-acc-icon">
                <ion-icon :icon="bookOutline"></ion-icon>
              </div>
              <span class="qz-acc-lesson-topic">{{ lesson.topic }}</span>
            </div>
            <span class="qz-acc-badge">
              {{ lesson.activities ? lesson.activities.length : 0 }}
              actividades
            </span>
          </div>

          <!-- Contenido de Lección (Actividades) -->
          <div slot="content" class="qz-lesson-acc-content">
            <!-- Cargando actividades -->
            <div v-if="lesson.isLoadingActivities" class="qz-sub-loading">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <span>Cargando actividades de la lección...</span>
            </div>

            <!-- Acordeón de Actividades -->
            <ion-accordion-group
              v-else-if="lesson.activities && lesson.activities.length > 0"
              class="qz-activities-accordion-group"
            >
              <ion-accordion
                v-for="activity in lesson.activities"
                :key="activity.id"
                :value="'activity-' + activity.id"
                class="qz-activity-accordion"
              >
                <!-- Cabecera de Actividad -->
                <div
                  slot="header"
                  class="qz-activity-acc-header"
                  @click="handleActivityClick(activity)"
                >
                  <span class="qz-activity-title">{{ activity.title }}</span>
                  <span
                    v-if="activity.criteria && activity.criteria.length"
                    class="qz-activity-criteria-badge"
                  >
                    {{ activity.criteria.length }} criterios
                  </span>
                </div>

                <!-- Contenido de Actividad (Criterios) -->
                <div slot="content" class="qz-activity-acc-content">
                  <!-- Cargando criterios -->
                  <div
                    v-if="activity.isLoadingCriteria"
                    class="qz-sub-loading"
                  >
                    <ion-spinner name="crescent" color="primary"></ion-spinner>
                    <span>Cargando criterios de la actividad...</span>
                  </div>

                  <!-- Lista de Criterios Seleccionables -->
                  <div
                    v-else-if="
                      activity.criteria && activity.criteria.length > 0
                    "
                    class="qz-criteria-items-list"
                  >
                    <!-- Fila Seleccionar Todos -->
                    <div
                      class="qz-select-all-row"
                      @click="
                        toggleSelectAll(activity, !isAllSelected(activity))
                      "
                    >
                      <ion-checkbox
                        :checked="isAllSelected(activity)"
                        @ionChange="
                          toggleSelectAll(activity, $event.detail.checked)
                        "
                      ></ion-checkbox>
                      <span class="qz-select-all-label"
                        >Seleccionar todos los criterios de esta actividad</span
                      >
                    </div>

                    <!-- Filas Individuales -->
                    <div
                      v-for="criterion in activity.criteria"
                      :key="criterion.id"
                      class="qz-criterion-select-row"
                      :class="{ 'is-selected': criterion.selected }"
                      @click="criterion.selected = !criterion.selected"
                    >
                      <ion-checkbox
                        v-model="criterion.selected"
                        @click.stop
                      ></ion-checkbox>
                      <div class="qz-criterion-desc-text">
                        {{ criterion.description }}
                      </div>
                      <span class="qz-criterion-score-badge">
                        {{ criterion.score }} pts
                      </span>
                    </div>
                  </div>

                  <div v-else class="qz-empty-notice">
                    <span>Esta actividad no tiene criterios registrados.</span>
                  </div>
                </div>
              </ion-accordion>
            </ion-accordion-group>

            <div v-else class="qz-empty-notice">
              <span>No hay actividades registradas en esta lección.</span>
            </div>
          </div>
        </ion-accordion>
      </ion-accordion-group>
    </div>

    <!-- 4. Barra Inferior Acoplada con Botón Importar -->
    <div v-if="totalSelected > 0" class="qz-modal-docked-footer">
      <div class="qz-footer-info">
        <span class="qz-footer-count-badge">
          {{ totalSelected }}
          {{
            totalSelected === 1
              ? "criterio seleccionado"
              : "criterios seleccionados"
          }}
        </span>
      </div>
      <button
        type="button"
        class="qz-action-pill-btn qz-btn--primary"
        @click="importSelected"
      >
        <ion-icon :icon="checkmarkOutline"></ion-icon>
        <span>Importar {{ totalSelected }} Criterios</span>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import {
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonAccordionGroup,
  IonAccordion,
  modalController,
  IonCheckbox,
  IonSpinner,
} from "@ionic/vue";
import {
  closeOutline,
  searchOutline,
  checkmarkOutline,
  copyOutline,
  bookOutline,
  alertCircleOutline,
} from "ionicons/icons";
import axios from "axios";
import {
  tokenHeader,
  usuarioGet,
  selectedYear as selectedYearService,
} from "../globalService";

export default {
  name: "ActivityCriterionSelectionModal",
  components: {
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonAccordionGroup,
    IonAccordion,
    IonCheckbox,
    IonSpinner,
  },
  setup() {
    const selectedCourse = ref(null);
    const availableCourses = ref([]);
    const selectedArea = ref(null);
    const availableAreas = ref([]);
    const selectedYear = ref(selectedYearService());
    const selectedPeriod = ref(null);
    const availableYears = ref([]);
    const availablePeriods = ref([]);
    const lessons = ref([]);
    const isLoadingLessons = ref(false);
    const searchPerformed = ref(false);
    const usuario = ref(usuarioGet());

    const fetchAvailableYears = () => {
      const currentYear = selectedYearService();
      const years = [];
      for (let i = currentYear - 5; i <= currentYear + 1; i++) {
        years.push(i);
      }
      availableYears.value = years;
    };

    const fetchAvailablePeriods = async () => {
      try {
        const response = await axios.get("/periods", tokenHeader());
        availablePeriods.value = [
          { id: null, name: "Todos los Periodos" },
          ...response.data,
        ];
      } catch (error) {
        console.error("Error fetching periods:", error);
      }
    };

    const fetchAreasForCourse = async () => {
      if (!selectedCourse.value) {
        availableAreas.value = [];
        selectedArea.value = null;
        return;
      }
      try {
        const response = await axios.get(
          `/courses/${selectedCourse.value}/areas`,
          tokenHeader(),
        );
        availableAreas.value = response.data;
        if (availableAreas.value.length > 0) {
          selectedArea.value = availableAreas.value[0].id;
        } else {
          selectedArea.value = null;
        }
      } catch (error) {
        console.error(
          `Error fetching areas for course ${selectedCourse.value}:`,
          error,
        );
        availableAreas.value = [];
        selectedArea.value = null;
      }
    };

    const fetchAvailableCourses = async () => {
      try {
        const response = await axios.get(
          `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
          tokenHeader(),
        );
        availableCourses.value = response.data;
        if (availableCourses.value.length > 0) {
          selectedCourse.value = availableCourses.value[0].id;
          fetchAreasForCourse();
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    const fetchLessons = async () => {
      if (!selectedYear.value || !selectedArea.value || !selectedCourse.value) {
        lessons.value = [];
        return;
      }

      isLoadingLessons.value = true;
      try {
        let url = `/lessons?courseId=${selectedCourse.value}&areaId=${selectedArea.value}&year=${selectedYear.value}&exist=true`;
        if (selectedPeriod.value !== null) {
          url += `&periodId=${selectedPeriod.value}`;
        }

        const response = await axios.get(url, tokenHeader());
        lessons.value = response.data.map((lesson) => ({
          ...lesson,
          activities: [],
          isLoadingActivities: false,
          fetchedActivities: false,
        }));
      } catch (error) {
        console.error("Error fetching lessons:", error);
        lessons.value = [];
      } finally {
        isLoadingLessons.value = false;
      }
    };

    const handleLessonClick = async (lesson) => {
      if (!lesson.fetchedActivities) {
        lesson.isLoadingActivities = true;
        try {
          const response = await axios.get(
            `/activities?lessonId=${lesson.id}`,
            tokenHeader(),
          );
          lesson.activities = response.data.map((activity) => ({
            ...activity,
            criteria: [],
            isLoadingCriteria: false,
            fetchedCriteria: false,
          }));
          lesson.fetchedActivities = true;
        } catch (error) {
          console.error(
            `Error fetching activities for lesson ${lesson.id}:`,
            error,
          );
        } finally {
          lesson.isLoadingActivities = false;
        }
      }
    };

    const handleActivityClick = async (activity) => {
      if (!activity.fetchedCriteria) {
        activity.isLoadingCriteria = true;
        try {
          const response = await axios.get(
            `/criteria?activityId=${activity.id}`,
            tokenHeader(),
          );
          activity.criteria = response.data
            .sort((a, b) => a.id - b.id)
            .map((criterion) => ({
              ...criterion,
              selected: false,
            }));
          activity.fetchedCriteria = true;
        } catch (error) {
          console.error(
            `Error fetching criteria for activity ${activity.id}:`,
            error,
          );
        } finally {
          activity.isLoadingCriteria = false;
        }
      }
    };

    const performSearch = () => {
      searchPerformed.value = true;
      fetchLessons();
    };

    const handleCourseChange = (courseId) => {
      selectedCourse.value = courseId;
      fetchAreasForCourse();
    };

    const isAllSelected = (activity) => {
      if (!activity.criteria || activity.criteria.length === 0) return false;
      return activity.criteria.every((c) => c.selected);
    };

    const toggleSelectAll = (activity, checked) => {
      if (activity.criteria) {
        activity.criteria.forEach((c) => (c.selected = checked));
      }
    };

    const totalSelected = computed(() => {
      let count = 0;
      lessons.value.forEach((lesson) => {
        if (lesson.activities) {
          lesson.activities.forEach((activity) => {
            if (activity.criteria) {
              count += activity.criteria.filter((c) => c.selected).length;
            }
          });
        }
      });
      return count;
    });

    const getSelectedCriteria = () => {
      let selected = [];
      lessons.value.forEach((lesson) => {
        if (lesson.activities) {
          lesson.activities.forEach((activity) => {
            if (activity.criteria) {
              selected = selected.concat(
                activity.criteria.filter((c) => c.selected),
              );
            }
          });
        }
      });
      return selected;
    };

    const importSelected = () => {
      modalController.dismiss({ criteria: getSelectedCriteria() });
    };

    const cancel = () => {
      modalController.dismiss(null);
    };

    onMounted(() => {
      fetchAvailableYears();
      fetchAvailablePeriods();
      fetchAvailableCourses();
    });

    return {
      selectedCourse,
      availableCourses,
      selectedArea,
      availableAreas,
      selectedYear,
      selectedPeriod,
      availableYears,
      availablePeriods,
      lessons,
      isLoadingLessons,
      searchPerformed,
      performSearch,
      handleCourseChange,
      handleLessonClick,
      handleActivityClick,
      isAllSelected,
      toggleSelectAll,
      totalSelected,
      importSelected,
      cancel,
      // Icons
      closeOutline,
      searchOutline,
      checkmarkOutline,
      copyOutline,
      bookOutline,
      alertCircleOutline,
    };
  },
};
</script>

<style scoped>
.qz-modal-sheet {
  height: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: var(--qz-color-card-bg, #ffffff);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  overflow: hidden;
  border-radius: 28px;
}

/* 1. Cabecera */
.qz-modal-top-bar {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(106, 90, 224, 0.1);
  background: var(--qz-color-card-bg, #ffffff);
  flex-shrink: 0;
}

.qz-modal-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qz-modal-header-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-modal-desc {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-modal-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--qz-color-purple-bg, #efeefc);
  border: none;
  color: var(--qz-color-text-muted, #858494);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.qz-modal-close-btn:hover {
  background: #e5e2fa;
  color: var(--qz-color-text-main, #0c092a);
}

/* 2. Caja de Filtros */
.qz-modal-filters-box {
  padding: 14px 20px;
  background: var(--qz-color-purple-bg, #efeefc);
  border-bottom: 1px solid rgba(106, 90, 224, 0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.qz-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
}

.qz-filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qz-filter-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--qz-color-text-muted, #858494);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.qz-select-wrap {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(106, 90, 224, 0.15);
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.qz-custom-select {
  --padding-start: 10px;
  --padding-end: 10px;
  --padding-top: 6px;
  --padding-bottom: 6px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--qz-color-text-main, #0c092a);
  width: 100%;
}

.qz-filter-actions {
  display: flex;
  justify-content: flex-end;
}

.qz-search-pill-btn {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 8px 18px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.qz-search-pill-btn:hover {
  filter: brightness(1.05);
}

.qz-search-pill-btn:active {
  transform: scale(0.96);
}

.qz-spinner-sm {
  width: 16px;
  height: 16px;
}

/* 3. Contenido Scrollable con Resultados */
.qz-modal-results-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background: var(--qz-color-card-bg, #ffffff);
}

.qz-status-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
  text-align: center;
  color: var(--qz-color-text-muted, #858494);
  font-size: 13px;
}

.qz-status-box ion-icon {
  font-size: 32px;
  color: #a49fcf;
}

.qz-status--idle {
  padding: 48px 24px;
}

/* Acordeón de Lecciones */
.qz-lessons-accordion-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-lesson-accordion {
  border-radius: 16px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  background: var(--qz-color-card-bg, #ffffff);
  overflow: hidden;
}

.qz-lesson-acc-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #fbfaff;
  cursor: pointer;
}

.qz-acc-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.qz-acc-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.qz-acc-lesson-topic {
  font-size: 14px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-acc-badge {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.qz-lesson-acc-content {
  padding: 10px 14px 14px 14px;
  background: #ffffff;
}

.qz-sub-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

/* Acordeón de Actividades dentro de Lección */
.qz-activities-accordion-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-activity-accordion {
  border-radius: 12px;
  border: 1px solid rgba(106, 90, 224, 0.08);
  background: #ffffff;
  overflow: hidden;
}

.qz-activity-acc-header {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #f8f7fe;
  cursor: pointer;
}

.qz-activity-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-activity-criteria-badge {
  background: #fff6e7;
  color: #d68910;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.qz-activity-acc-content {
  padding: 8px 12px 12px 12px;
}

/* Lista de Criterios */
.qz-criteria-items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-select-all-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--qz-color-purple-bg, #efeefc);
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 4px;
}

.qz-select-all-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-criterion-select-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid rgba(106, 90, 224, 0.08);
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-criterion-select-row:hover {
  background: #faf9ff;
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-criterion-select-row.is-selected {
  background: rgba(106, 90, 224, 0.06);
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-criterion-desc-text {
  flex: 1;
  font-size: 14.5px;
  color: var(--qz-color-text-main, #0c092a);
  line-height: 1.45;
}

.qz-criterion-score-badge {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.qz-empty-notice {
  padding: 12px;
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
  text-align: center;
}

/* 4. Footer Docked */
.qz-modal-docked-footer {
  padding: 12px 20px;
  background: var(--qz-color-card-bg, #ffffff);
  border-top: 1px solid rgba(106, 90, 224, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 -4px 16px rgba(106, 90, 224, 0.08);
  flex-shrink: 0;
}

.qz-footer-count-badge {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
}

.qz-action-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
  outline: none;
}

.qz-btn--primary {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
}

.qz-action-pill-btn:active {
  transform: scale(0.96);
}
</style>
