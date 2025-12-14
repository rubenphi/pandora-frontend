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
        :value="lesson.id"
        @ionChange="toggleLessonAccordion(lesson.id, $event)"
      >
        <ion-item slot="header" color="light">
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
import {
  tokenHeader,
  selectedPeriod as getSelectedPeriod,
} from "../globalService";

export default {
  name: "MaterialSelectionModal",
  props: {
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
    const selectedYear = ref(new Date().getFullYear());
    const selectedPeriod = ref(getSelectedPeriod()); // Use global service for default period
    const availableYears = ref([]);
    const availablePeriods = ref([
      { id: 1, name: "Primer Periodo" },
      { id: 2, name: "Segundo Periodo" },
      { id: 3, name: "Tercer Periodo" },
    ]);
    const lessons = ref([]);
    const isLoadingLessons = ref(false);
    const isLoadingMaterials = ref(false);
    const expandedLessonId = ref(null);
    const searchPerformed = ref(false); // New ref to track if search button was pressed

    const fetchAvailableYears = () => {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = currentYear - 5; i <= currentYear + 1; i++) {
        years.push(i);
      }
      availableYears.value = years;
    };

    const fetchLessons = async () => {
      if (!selectedYear.value || !selectedPeriod.value || !props.area) {
        lessons.value = [];
        return;
      }

      isLoadingLessons.value = true;
      try {
        const response = await axios.get(
          `/lessons?areaId=${props.area}&periodId=${selectedPeriod.value}&year=${selectedYear.value}&exist=true`,
          tokenHeader()
        );
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

    const handleYearChange = (year) => {
      selectedYear.value = year;
      // No automatic fetch here
    };

    const handlePeriodChange = (period) => {
      selectedPeriod.value = period;
      // No automatic fetch here
    };

    const toggleLessonAccordion = async (lessonId, event) => {
      if (event.detail.value === lessonId) {
        expandedLessonId.value = lessonId;
        await fetchMaterialsForLesson(lessonId);
      } else {
        expandedLessonId.value = null;
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
      // Removed initial fetchLessons()
    });

    // Removed watch for selectedYear and selectedPeriod

    return {
      selectedYear,
      selectedPeriod,
      availableYears,
      availablePeriods,
      lessons,
      isLoadingLessons,
      isLoadingMaterials,
      expandedLessonId,
      searchPerformed, // Make searchPerformed available in template
      performSearch,
      handleYearChange,
      handlePeriodChange,
      toggleLessonAccordion,
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
