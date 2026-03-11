<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="cancel()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
      <ion-title>Importar Criterios</ion-title>
    </ion-toolbar>
    <ion-toolbar>
      <ion-item>
        <ion-label position="stacked">Curso</ion-label>
        <ion-select
          v-model="selectedCourse"
          placeholder="Selecciona un curso"
          @ionChange="handleCourseChange($event.detail.value)"
        >
          <ion-select-option
            v-for="courseOpt in availableCourses"
            :key="courseOpt.id"
            :value="courseOpt.id"
            >{{ courseOpt.name }}</ion-select-option
          >
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Área</ion-label>
        <ion-select
          v-model="selectedArea"
          placeholder="Selecciona un área"
        >
          <ion-select-option
            v-for="areaOpt in availableAreas"
            :key="areaOpt.id"
            :value="areaOpt.id"
            >{{ areaOpt.name }}</ion-select-option
          >
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Año</ion-label>
        <ion-select v-model="selectedYear" placeholder="Selecciona un año">
          <ion-select-option
            v-for="yearOpt in availableYears"
            :key="yearOpt"
            :value="yearOpt"
            >{{ yearOpt }}</ion-select-option
          >
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Periodo</ion-label>
        <ion-select
          v-model="selectedPeriod"
          placeholder="Selecciona un periodo"
        >
          <ion-select-option
            v-for="periodOpt in availablePeriods"
            :key="periodOpt.id"
            :value="periodOpt.id"
            >{{ periodOpt.name }}</ion-select-option
          >
        </ion-select>
      </ion-item>
      <ion-buttons slot="end">
        <ion-button @click="performSearch()">Buscar</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-list v-if="isLoadingLessons && searchPerformed">
      <ion-item>
        <ion-label>Cargando lecciones...</ion-label>
      </ion-item>
    </ion-list>
    <ion-list v-else-if="searchPerformed && lessons.length === 0">
      <ion-item>
        <ion-label
          >No se encontraron lecciones para los filtros
          seleccionados.</ion-label
        >
      </ion-item>
    </ion-list>
    <ion-accordion-group v-else-if="searchPerformed">
      <ion-accordion
        v-for="lesson in lessons"
        :key="lesson.id"
        :value="'lesson-' + lesson.id"
      >
        <ion-item slot="header" color="light" @click="handleLessonClick(lesson)">
          <ion-label>{{ lesson.topic }}</ion-label>
        </ion-item>
        <div slot="content" class="ion-padding">
          <ion-list v-if="lesson.isLoadingActivities">
            <ion-item>
              <ion-label>Cargando actividades...</ion-label>
            </ion-item>
          </ion-list>
          <ion-accordion-group v-else-if="lesson.activities && lesson.activities.length > 0">
            <ion-accordion v-for="activity in lesson.activities" :key="activity.id" :value="'activity-' + activity.id">
              <ion-item slot="header" @click="handleActivityClick(activity)">
                <ion-label>{{ activity.title }}</ion-label>
                <ion-badge v-if="activity.criteria && activity.criteria.length">
                  {{ activity.criteria.length }} criterios
                </ion-badge>
              </ion-item>
              <div slot="content" class="ion-padding">
                <ion-list v-if="activity.isLoadingCriteria">
                  <ion-item>
                    <ion-label>Cargando criterios...</ion-label>
                  </ion-item>
                </ion-list>
                <ion-list v-else-if="activity.criteria && activity.criteria.length > 0">
                  <ion-item>
                    <ion-checkbox
                      :checked="isAllSelected(activity)"
                      @ionChange="toggleSelectAll(activity, $event.detail.checked)"
                    ></ion-checkbox>
                    <ion-label><strong>Seleccionar todos</strong></ion-label>
                  </ion-item>
                  <ion-item v-for="criterion in activity.criteria" :key="criterion.id">
                    <ion-checkbox
                      v-model="criterion.selected"
                    ></ion-checkbox>
                    <ion-label class="ion-text-wrap">
                      <p><strong>{{ criterion.description }}</strong></p>
                      <p>Puntos: {{ criterion.score }}</p>
                    </ion-label>
                  </ion-item>
                </ion-list>
                <ion-item v-else>
                  <ion-label>No hay criterios para esta actividad.</ion-label>
                </ion-item>
              </div>
            </ion-accordion>
          </ion-accordion-group>
          <ion-item v-else>
            <ion-label>No hay actividades para esta lección.</ion-label>
          </ion-item>
        </div>
      </ion-accordion>
    </ion-accordion-group>
  </ion-content>
  <ion-footer v-if="totalSelected > 0">
    <ion-toolbar>
      <ion-title size="small">{{ totalSelected }} criterios seleccionados</ion-title>
      <ion-buttons slot="end">
        <ion-button color="primary" fill="solid" @click="importSelected">
          Importar
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-footer>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonAccordionGroup,
  IonAccordion,
  modalController,
  IonCheckbox,
  IonBadge,
  IonFooter
} from "@ionic/vue";
import { closeOutline } from "ionicons/icons";
import axios from "axios";
import { tokenHeader, usuarioGet, selectedYear as selectedYearService } from "../globalService";

export default {
  name: "ActivityCriterionSelectionModal",
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonAccordionGroup,
    IonAccordion,
    IonCheckbox,
    IonBadge,
    IonFooter
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

    const fetchAvailableCourses = async () => {
      try {
        const response = await axios.get(
          `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
          tokenHeader()
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

    const fetchAreasForCourse = async () => {
      if (!selectedCourse.value) {
        availableAreas.value = [];
        selectedArea.value = null;
        return;
      }
      try {
        const response = await axios.get(
          `/courses/${selectedCourse.value}/areas`,
          tokenHeader()
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
          error
        );
        availableAreas.value = [];
        selectedArea.value = null;
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
          fetchedActivities: false
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
          const response = await axios.get(`/activities?lessonId=${lesson.id}`, tokenHeader());
          lesson.activities = response.data.map(activity => ({
             ...activity, 
             criteria: [], 
             isLoadingCriteria: false,
             fetchedCriteria: false
          }));
          lesson.fetchedActivities = true;
        } catch (error) {
          console.error(`Error fetching activities for lesson ${lesson.id}:`, error);
        } finally {
          lesson.isLoadingActivities = false;
        }
      }
    };

    const handleActivityClick = async (activity) => {
      if (!activity.fetchedCriteria) {
        activity.isLoadingCriteria = true;
        try {
          const response = await axios.get(`/criteria?activityId=${activity.id}`, tokenHeader());
          activity.criteria = response.data.sort((a,b) => a.id - b.id).map(criterion => ({
             ...criterion,
             selected: false
          }));
          activity.fetchedCriteria = true;
        } catch(error) {
          console.error(`Error fetching criteria for activity ${activity.id}:`, error);
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
      return activity.criteria.every(c => c.selected);
    };

    const toggleSelectAll = (activity, checked) => {
      if (activity.criteria) {
        activity.criteria.forEach(c => c.selected = checked);
      }
    };

    const totalSelected = computed(() => {
      let count = 0;
      lessons.value.forEach(lesson => {
        if (lesson.activities) {
          lesson.activities.forEach(activity => {
            if (activity.criteria) {
              count += activity.criteria.filter(c => c.selected).length;
            }
          });
        }
      });
      return count;
    });

    const getSelectedCriteria = () => {
      let selected = [];
      lessons.value.forEach(lesson => {
        if (lesson.activities) {
          lesson.activities.forEach(activity => {
            if (activity.criteria) {
              selected = selected.concat(activity.criteria.filter(c => c.selected));
            }
          });
        }
      });
      return selected;
    }

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
      closeOutline,
    };
  },
};
</script>

<style scoped>
</style>
