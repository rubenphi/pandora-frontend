<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="cancel()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
      <ion-title>Seleccionar Material</ion-title>
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
          @ionChange="handleAreaChange($event.detail.value)"
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
    <ion-accordion-group v-else-if="searchPerformed" :value="expandedLessonId" @ionChange="handleAccordionGroupChange($event.detail.value)">
      <ion-accordion
        v-for="lesson in lessons"
        :key="lesson.id"
        :value="lesson.id"
      >
        <ion-item slot="header" color="light" @click="handleLessonClick(lesson.id)">
          <ion-label>{{ lesson.topic }}</ion-label>
        </ion-item>
        <div slot="content" class="ion-padding">
          <ion-list v-if="isLoadingMaterials && expandedLessonId === lesson.id">
            <ion-item>
              <ion-label>Cargando materiales...</ion-label>
            </ion-item>
          </ion-list>
          <ion-list v-else-if="lesson.materials && lesson.materials.length > 0">
            <ion-item
              v-for="material in lesson.materials"
              :key="material.id"
              button
              @click="selectMaterial(material)"
            >
              <ion-label>{{ material.title }}</ion-label>
              <ion-note slot="end">{{ material.type }}</ion-note>
            </ion-item>
          </ion-list>
          <ion-item v-else>
            <ion-label>No hay materiales para esta lección.</ion-label>
          </ion-item>
        </div>
      </ion-accordion>
    </ion-accordion-group>
  </ion-content>
</template>

<script>
import { ref, onMounted } from "vue";
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
  IonNote,
  IonSelect,
  IonSelectOption,
  IonAccordionGroup,
  IonAccordion,
  modalController,
} from "@ionic/vue";
import { closeOutline } from "ionicons/icons";
import axios from "axios";
import { tokenHeader, usuarioGet, selectedYear as selectedYearService } from "../globalService";

export default {
  name: "MaterialSelectionModal",
  // Removed area and course props
  props: {
    // The area prop is still needed to pre-select the area from the current view
    area: {
      type: [String, Number],
      required: true,
    },
  },
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
    IonNote,
    IonSelect,
    IonSelectOption,
    IonAccordionGroup,
    IonAccordion,
  },
  setup(props) {
    const selectedCourse = ref(null);
    const availableCourses = ref([]);
    const selectedArea = ref(props.area); // Pre-select area from prop
    const availableAreas = ref([]);
    const selectedYear = ref(selectedYearService());
    const selectedPeriod = ref(null); // Default to "Todos los Periodos"
    const availableYears = ref([]);
    const availablePeriods = ref([]); // Will be fetched dynamically
    const lessons = ref([]);
    const isLoadingLessons = ref(false);
    const isLoadingMaterials = ref(false);
    const expandedLessonId = ref(null);
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
          { id: null, name: "Todos los Periodos" }, // Prepend "All Periods" option
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
        // Optionally pre-select the first course or a default one
        if (availableCourses.value.length > 0 && !selectedCourse.value) {
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
        // If the pre-selected area from props exists in the new list, keep it. Otherwise, select the first one.
        if (
          props.area &&
          availableAreas.value.some((area) => area.id === props.area)
        ) {
          selectedArea.value = props.area;
        } else if (availableAreas.value.length > 0) {
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
          materials: [],
        })); // Initialize materials array for each lesson
      } catch (error) {
        console.error("Error fetching lessons:", error);
        lessons.value = [];
      } finally {
        isLoadingLessons.value = false;
      }
    };

    const fetchMaterialsForLesson = async (lessonId) => {
      isLoadingMaterials.value = true;
      try {
        const response = await axios.get(
          `/materials?lessonId=${lessonId}`,
          tokenHeader()
        );
        const lessonIndex = lessons.value.findIndex((l) => l.id === lessonId);
        if (lessonIndex !== -1) {
          lessons.value[lessonIndex].materials = response.data;
        }
      } catch (error) {
        console.error(
          `Error fetching materials for lesson ${lessonId}:`,
          error
        );
      } finally {
        isLoadingMaterials.value = false;
      }
    };

    const performSearch = () => {
      searchPerformed.value = true;
      fetchLessons();
    };

    const handleCourseChange = (courseId) => {
      selectedCourse.value = courseId;
      fetchAreasForCourse(); // Fetch areas for the newly selected course
    };

    const handleAreaChange = (areaId) => {
      selectedArea.value = areaId;
    };

    const handleLessonClick = async (lessonId) => {
      if (expandedLessonId.value === lessonId) {
        // If already expanded, collapse it
        expandedLessonId.value = null;
      } else {
        // If collapsed, expand it and fetch materials
        expandedLessonId.value = lessonId;
        await fetchMaterialsForLesson(lessonId);
      }
    };

    // This method is needed to control the ion-accordion-group's value
    const handleAccordionGroupChange = (value) => {
      // The ion-accordion-group emits an array of values if multiple is true, or a single value if false
      // We are using single accordion behavior, so value will be the ID of the opened accordion or undefined
      if (Array.isArray(value)) {
        expandedLessonId.value = value.length > 0 ? value[0] : null;
      } else {
        expandedLessonId.value = value;
      }
    };

    const selectMaterial = (material) => {
      modalController.dismiss(material);
    };

    const cancel = () => {
      modalController.dismiss(null);
    };

    onMounted(() => {
      fetchAvailableYears();
      fetchAvailablePeriods(); // Fetch periods dynamically
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
      isLoadingMaterials,
      expandedLessonId,
      searchPerformed,
      performSearch,
      handleCourseChange,
      handleAreaChange,
      handleLessonClick,
      handleAccordionGroupChange,
      selectMaterial,
      cancel,
      closeOutline,
    };
  },
};
</script>

<style scoped>
/* Add any specific styles for the modal here */
</style>
