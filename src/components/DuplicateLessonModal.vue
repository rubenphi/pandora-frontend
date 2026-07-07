<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="cancel()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
      <ion-title>Importar Lección</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <!-- Step 1: Search and select source lesson -->
    <template v-if="step === 'search'">
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Curso</ion-label>
          <ion-select v-model="filters.courseId" placeholder="Selecciona un curso" @ionChange="onCourseChange">
            <ion-select-option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Área</ion-label>
          <ion-select v-model="filters.areaId" placeholder="Selecciona un área">
            <ion-select-option v-for="a in areas" :key="a.id" :value="a.id">{{ a.name }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Año</ion-label>
          <ion-select v-model="filters.year" placeholder="Selecciona un año">
            <ion-select-option v-for="y in years" :key="y" :value="y">{{ y }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Periodo</ion-label>
          <ion-select v-model="filters.periodId" placeholder="Selecciona un periodo">
            <ion-select-option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-button expand="block" @click="searchLessons">Buscar</ion-button>
      </ion-list>

      <ion-list v-if="isSearching">
        <ion-item><ion-label>Buscando lecciones...</ion-label><ion-spinner slot="end"></ion-spinner></ion-item>
      </ion-list>
      <ion-list v-else-if="searchDone && lessons.length === 0">
        <ion-item><ion-label>No se encontraron lecciones.</ion-label></ion-item>
      </ion-list>
      <ion-list v-else-if="searchDone && lessons.length > 0">
        <ion-item v-for="lesson in lessons" :key="lesson.id" button @click="selectLesson(lesson)">
          <ion-label>
            <h2>{{ lesson.topic }}</h2>
            <p>{{ lesson.date?.substring(0, 10) }}</p>
          </ion-label>
          <ion-icon slot="end" :icon="chevronForwardOutline"></ion-icon>
        </ion-item>
      </ion-list>
    </template>

    <!-- Step 2: Configure and import -->
    <template v-if="step === 'config'">
      <ion-list>
        <ion-item>
          <ion-label>
            <h2>Lección a importar</h2>
            <p>{{ selectedLesson.topic }}</p>
            <p>{{ selectedLesson.date?.substring(0, 10) }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Nuevo tema</ion-label>
          <ion-input v-model="form.topic" type="text"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Nueva fecha</ion-label>
          <ion-input v-model="form.date" type="date"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label>Incluir cuestionarios</ion-label>
          <ion-checkbox v-model="include.quizzes"></ion-checkbox>
        </ion-item>
        <ion-item>
          <ion-label>Incluir material de apoyo</ion-label>
          <ion-checkbox v-model="include.materials"></ion-checkbox>
        </ion-item>
        <ion-item>
          <ion-label>Incluir actividades</ion-label>
          <ion-checkbox v-model="include.activities"></ion-checkbox>
        </ion-item>

        <ion-button expand="block" :disabled="isImporting" @click="startImport">
          {{ isImporting ? 'Importando...' : 'Importar' }}
        </ion-button>

        <ion-item v-if="isImporting">
          <ion-label>
            <p>{{ statusMessage }}</p>
            <p v-if="statusDetail">{{ statusDetail }}</p>
          </ion-label>
          <ion-spinner slot="end"></ion-spinner>
        </ion-item>
      </ion-list>
    </template>
  </ion-content>
</template>

<script>
import { ref, reactive, onMounted } from "vue";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  modalController,
} from "@ionic/vue";
import { closeOutline, chevronForwardOutline } from "ionicons/icons";
import axios from "axios";
import { tokenHeader, usuarioGet, periodosGet, selectedYear } from "../globalService";

export default {
  name: "DuplicateLessonModal",
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonCheckbox,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
  },
  props: {
    currentCourseId: { type: Number, required: true },
    currentAreaId: { type: Number, required: true },
    currentPeriodId: { type: [Number, String], required: true },
    currentYear: { type: Number, required: true },
    lessonType: { type: String, default: "standard" },
  },
  setup(props) {
    const usuario = usuarioGet();
    const step = ref("search");
    const courses = ref([]);
    const areas = ref([]);
    const years = ref([]);
    const periods = ref([]);
    const lessons = ref([]);
    const isSearching = ref(false);
    const searchDone = ref(false);
    const selectedLesson = ref(null);
    const isImporting = ref(false);
    const statusMessage = ref("");
    const statusDetail = ref("");

    const filters = reactive({
      courseId: null,
      areaId: null,
      year: null,
      periodId: null,
    });

    const form = reactive({
      topic: "",
      date: new Date().toISOString().split("T")[0],
    });

    const include = reactive({
      quizzes: true,
      materials: true,
      activities: true,
    });

    onMounted(async () => {
      const curYear = selectedYear();
      years.value = Array.from({ length: 10 }, (_, i) => curYear - i);
      periods.value = periodosGet();

      try {
        const res = await axios.get(`/courses?instituteId=${usuario.institute.id}&exist=true`);
        courses.value = res.data;
        if (courses.value.length > 0) {
          filters.courseId = courses.value[0].id;
          await fetchAreas();
        }
      } catch (e) {
        console.error("Error fetching courses", e);
      }
    });

    const fetchAreas = async () => {
      if (!filters.courseId) return;
      try {
        const res = await axios.get(`/courses/${filters.courseId}/areas`);
        areas.value = res.data;
        if (areas.value.length > 0) {
          filters.areaId = areas.value[0].id;
        }
      } catch (e) {
        console.error("Error fetching areas", e);
      }
    };

    const onCourseChange = () => {
      filters.areaId = null;
      areas.value = [];
      fetchAreas();
    };

    const searchLessons = async () => {
      if (!filters.courseId || !filters.areaId || !filters.year || !filters.periodId) return;
      isSearching.value = true;
      searchDone.value = false;
      try {
        const res = await axios.get(
          `/lessons?courseId=${filters.courseId}&areaId=${filters.areaId}&year=${filters.year}&periodId=${filters.periodId}&exist=true&type=${props.lessonType}`
        );
        lessons.value = res.data;
      } catch (e) {
        console.error("Error searching lessons", e);
        lessons.value = [];
      } finally {
        isSearching.value = false;
        searchDone.value = true;
      }
    };

    const selectLesson = (lesson) => {
      selectedLesson.value = lesson;
      form.topic = `Copia de ${lesson.topic}`;
      step.value = "config";
    };

    const startImport = async () => {
      if (!form.topic || !form.date || !selectedLesson.value) return;
      isImporting.value = true;

      try {
        statusMessage.value = "Creando lección...";
        const lessonRes = await axios.post("/lessons", {
          date: form.date,
          topic: form.topic,
          courseId: props.currentCourseId,
          areaId: props.currentAreaId,
          periodId: Number(props.currentPeriodId),
          instituteId: Number(usuario.institute.id),
          year: props.currentYear,
          exist: true,
        });
        const newLessonId = lessonRes.data.id;
        const sourceId = selectedLesson.value.id;

        if (include.quizzes) {
          statusMessage.value = "Copiando cuestionarios...";
          const quizzesRes = await axios.get(`/lessons/${sourceId}/quizzes`, tokenHeader());
          for (const quiz of quizzesRes.data) {
            const newQuizRes = await axios.post("/quizzes", {
              title: quiz.title,
              quizType: quiz.quizType,
              lessonId: newLessonId,
              instituteId: Number(usuario.institute.id),
              evaluationType: quiz.evaluationType,
              category: quiz.category,
            });
            const newQuizId = newQuizRes.data.id;
            const questionsRes = await axios.get(`/quizzes/${quiz.id}/questions`, tokenHeader());
            if (questionsRes.data.length > 0) {
              const questions = questionsRes.data.map((q) => ({
                id: q.id,
                title: q.title,
              }));
              await axios.post(`/quizzes/${newQuizId}/import-questions-mix`, {
                toQuizId: newQuizId,
                questions,
              });
            }
          }
        }

        if (include.materials) {
          statusMessage.value = "Copiando material de apoyo...";
          const materialsRes = await axios.get(`/materials?lessonId=${sourceId}`, tokenHeader());
          for (const mat of materialsRes.data) {
            await axios.post("/materials", {
              title: mat.title,
              type: mat.type || "PDF",
              lessonId: newLessonId,
              instituteId: Number(usuario.institute.id),
              exist: true,
              content: mat.content || "",
              url: mat.url || "",
            }, tokenHeader());
          }
        }

        if (include.activities) {
          statusMessage.value = "Copiando actividades...";
          const activitiesRes = await axios.get(`/activities?lessonId=${sourceId}`, tokenHeader());
          if (activitiesRes.data.length > 0) {
            await axios.post("/activities/import", {
              lessonId: newLessonId,
              sourceActivityIds: activitiesRes.data.map(a => a.id),
            }, tokenHeader());
          }
        }

        modalController.dismiss({ imported: true });
      } catch (e) {
        statusMessage.value = "Error al importar";
        statusDetail.value = e.response?.data?.message || "Ocurrió un error inesperado";
        isImporting.value = false;
      }
    };

    const cancel = () => {
      modalController.dismiss(null);
    };

    return {
      closeOutline,
      chevronForwardOutline,
      step,
      courses,
      areas,
      years,
      periods,
      filters,
      lessons,
      isSearching,
      searchDone,
      selectedLesson,
      isImporting,
      statusMessage,
      statusDetail,
      form,
      include,
      onCourseChange,
      searchLessons,
      selectLesson,
      startImport,
      cancel,
    };
  },
};
</script>
