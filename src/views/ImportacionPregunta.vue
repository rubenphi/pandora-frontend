<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/cuestionario/' + idCuestionario">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Seleccione el cuestionario</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <!-- Selección de filtros -->
        <ion-item>
          <ion-label position="stacked">Curso</ion-label>
          <ion-select
            v-model="cursoSelected"
            placeholder="Selecciona un curso"
            @ionChange="areasSearch"
          >
            <ion-select-option
              v-for="curso in cursos"
              :key="curso.id"
              :value="curso"
            >
              {{ curso.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Área</ion-label>
          <ion-select v-model="areaSelected" placeholder="Selecciona un área">
            <ion-select-option
              v-for="area in areas"
              :key="area.id"
              :value="area"
            >
              {{ area.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-select
            slot="start"
            v-model="yearSelected"
            placeholder="Selecciona un año"
          >
            <ion-select-option v-for="year in years" :key="year" :value="year">
              <strong>Año: </strong> {{ year }}
            </ion-select-option>
          </ion-select>
          <ion-select
            slot="end"
            v-model="periodoSelected"
            placeholder="Selecciona un período"
          >
            <ion-select-option
              v-for="periodo in periodos"
              :key="periodo.id"
              :value="periodo"
            >
              {{ periodo.name }}
            </ion-select-option>
          </ion-select>
          <ion-buttons slot="end">
            <ion-button @click="search">
              <ion-icon :icon="searchOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-item>

        <!-- Lecciones y preguntas -->
        <ion-accordion-group :multiple="true">
          <ion-accordion v-for="lesson in lessons" :key="lesson.id">
            <ion-item slot="header" @click="loadQuizzesAndQuestions(lesson)">
              <ion-label>{{ lesson.topic }}</ion-label>
              <!-- The badge logic will need to be updated if we want to show total questions across all quizzes in a lesson -->
            </ion-item>

            <div class="ion-padding" slot="content">
              <ion-accordion-group :multiple="true">
                <ion-accordion v-for="quiz in lesson.quizzes" :key="quiz.id">
                  <ion-item slot="header">
                    <ion-label>{{ quiz.title }}</ion-label>
                    <ion-badge v-if="questionsByQuiz[quiz.id]?.questions?.length">
                      {{ questionsByQuiz[quiz.id].questions.length }} preguntas
                    </ion-badge>
                  </ion-item>

                  <div class="ion-padding" slot="content">
                    <ion-item>
                      <ion-checkbox
                        :checked="
                          questionsByQuiz[quiz.id]?.questions?.every(
                            (p) => p.selected
                          )
                        "
                        @ionChange="
                          (event) => toggleSeleccionTodas(quiz.id, event.detail.checked)
                        "
                      ></ion-checkbox>
                      <ion-label>Seleccionar todas</ion-label>
                    </ion-item>

                    <ion-item
                      v-for="pregunta in questionsByQuiz[quiz.id]?.questions || []"
                      :key="pregunta.id"
                    >
                      <ion-checkbox v-model="pregunta.selected"></ion-checkbox>
                      <ion-label>{{ pregunta.title }}</ion-label>
                    </ion-item>
                  </div>
                </ion-accordion>
              </ion-accordion-group>
            </div>
          </ion-accordion>
        </ion-accordion-group>

        <!-- Configuración de importación -->
        <ion-item>
          <ion-label>Modo de orden</ion-label>
          <ion-select v-model="modoOrden">
            <ion-select-option value="mix">Mezclado</ion-select-option>
            <ion-select-option value="tema">Por tema</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-button expand="block" @click="importarSeleccionadas">
          Importar preguntas seleccionadas
        </ion-button>
      </ion-list>

      <!-- Toasters -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        message="Importación exitosa"
        :duration="3000"
        color="success"
        @didDismiss="setSuccessToastOpen(false)"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        :message="errorMessage"
        :duration="3000"
        color="danger"
        @didDismiss="setErrorToastOpen(false)"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  onIonViewWillEnter,
  IonToast,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonButton,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonContent,
  IonList,
  IonTitle,
  IonAccordionGroup,
  IonAccordion,
  IonBadge,
} from "@ionic/vue";

import axios from "axios";
import {
  arrowBackOutline,
  downloadOutline,
  searchOutline,
} from "ionicons/icons";
import { periodosGet, numerosOrdinales } from "../globalService";

export default {
  components: {
    IonToast,
    IonCheckbox,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
    IonButton,
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonIcon,
    IonContent,
    IonList,
    IonTitle,
    IonAccordionGroup,
    IonAccordion,
    IonBadge,
  },
  setup() {
    const route = useRoute();
    const idCuestionario = route.params.id;

    const cursos = ref([]);
    const cursoSelected = ref();
    const areas = ref([]);
    const areaSelected = ref();
    const years = ref([]);
    const yearSelected = ref();
    const periodoSelected = ref();
    const periodos = ref(periodosGet());
    const lessons = ref([]); // Renamed from cuestionarios
    const questionsByQuiz = ref({}); // Renamed from preguntasPorLeccion
    const modoOrden = ref("mix");
    const seleccionarTodas = ref(false);

    const isSuccessToastOpen = ref(false);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const userLoged = ref(JSON.parse(localStorage.getItem("usuario")));

    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const setErrorToastOpen = (val) => (isErrorToastOpen.value = val);

    const search = async () => {
      if (
        !cursoSelected.value ||
        !areaSelected.value ||
        !periodoSelected.value ||
        !yearSelected.value
      )
        return;
      const res = await axios.get(
        `/lessons?courseId=${cursoSelected.value.id}&areaId=${areaSelected.value.id}&periodId=${periodoSelected.value.id}&year=${yearSelected.value}&instituteId=${userLoged.value.institute.id}&exist=true`
      );
      lessons.value = res.data.filter((c) => c.id != idCuestionario); // Use lessons.value
    };

    const areasSearch = async () => {
      const res = await axios.get(`/courses/${cursoSelected.value.id}/areas`);
      areas.value = res.data;
    };

    // New function to load quizzes and their questions
    const loadQuizzesAndQuestions = async (lesson) => {
      const quizzesRes = await axios.get(`/lessons/${lesson.id}/quizzes`);
      lesson.quizzes = quizzesRes.data; // Populate quizzes directly on the lesson object

      for (const quiz of lesson.quizzes) { // Iterate over the newly populated quizzes
        const questionsRes = await axios.get(`/quizzes/${quiz.id}/questions`);
        questionsRes.data.forEach((q) => (q.selected = false));
        questionsByQuiz.value[quiz.id] = {
          name: quiz.title, // Use quiz title as name
          questions: questionsRes.data,
        };
      }
    };

    const toggleSeleccionTodas = (quizId, checked) => { // Modified to take quizId and checked status
      if (questionsByQuiz.value[quizId]) {
        questionsByQuiz.value[quizId].questions.forEach((q) => (q.selected = checked));
      }
    };

    const importarSeleccionadas = async () => {
      let seleccionadas = [];
      Object.values(questionsByQuiz.value).forEach(({ questions }) => {
        // Iterate over questionsByQuiz
        seleccionadas.push(...questions.filter((p) => p.selected));
      });

      if (seleccionadas.length === 0) {
        errorMessage.value = "No has seleccionado ninguna pregunta para importar.";
        setErrorToastOpen(true);
        return;
      }

      if (modoOrden.value === "mix") {
        seleccionadas = seleccionadas.sort(() => Math.random() - 0.5);
      }

      try {
        // Fetch existing questions to determine the starting index
        const existingQuestionsRes = await axios.get(
          `/quizzes/${idCuestionario}/questions`
        );
        const baseIndex = existingQuestionsRes.data.length;

        seleccionadas = seleccionadas.map((p, index) => ({
          id: p.id,
          title:
            numerosOrdinales[baseIndex + index] ||
            `Pregunta ${baseIndex + index + 1}`,
        }));

        await axios.post(`/quizzes/${idCuestionario}/import-questions-mix`, {
          toQuizId: parseInt(idCuestionario),
          questions: seleccionadas,
        });
        setSuccessToastOpen(true);
      } catch (e) {
        errorMessage.value = e.response?.data?.message || "Error al importar";
        setErrorToastOpen(true);
      }
    };

    onIonViewWillEnter(async () => {
      userLoged.value.institute.id = parseInt(userLoged.value.institute.id);
      cursos.value = (
        await axios.get(
          `/courses?instituteId=${userLoged.value.institute.id}&exist=true`
        )
      ).data;
      years.value = Array.from(
        { length: 10 },
        (_, i) => new Date().getFullYear() - i
      );
      yearSelected.value =
        localStorage.getItem("year") || new Date().getFullYear();
    });

    return {
      arrowBackOutline,
      downloadOutline,
      searchOutline,
      isSuccessToastOpen,
      isErrorToastOpen,
      setSuccessToastOpen,
      setErrorToastOpen,
      importarSeleccionadas,
      errorMessage,
      userLoged,
      idCuestionario,
      cursos,
      cursoSelected,
      areas,
      areaSelected,
      lessons, // Renamed
      periodos,
      years,
      yearSelected,
      periodoSelected,
      search,
      areasSearch,
      questionsByQuiz, // Renamed
      modoOrden,
      seleccionarTodas,
      toggleSeleccionTodas,
      loadQuizzesAndQuestions, // Renamed
    };
  },
};
</script>

<style scoped>
ion-checkbox {
  margin-right: 1rem;
}
</style>
