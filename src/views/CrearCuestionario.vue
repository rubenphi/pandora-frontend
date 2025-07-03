<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="backUrl">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="crearCuestionario">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Cuestionario</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="cuestionario != null" :fullscreen="true">
        <ion-list>
          <ion-item v-if="error.estatus == 1">
            <ion-label color="danger">{{ error.data }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Título</ion-label>
            <ion-input v-model="cuestionario.title" type="text"></ion-input>
          </ion-item>
          <ion-item
            class="ion-text-center"
            v-if="cuestionario.id && cuestionario.exist == true"
            button
            color="danger"
            @click="borrarCuestionario(false)"
          >
            <ion-label>Borrar Cuestionario</ion-label>
          </ion-item>
          <ion-item
            class="ion-text-center"
            v-if="cuestionario.id && cuestionario.exist == false"
            button
            color="success"
            @click="borrarCuestionario(true)"
          >
            <ion-label>Recuperar Cuestionario</ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>
<script>
import axios from "axios";
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import router from "../router";

import { usuarioGet, tokenHeader } from "../globalService";
import { arrowBackOutline, checkmarkOutline } from "ionicons/icons";
import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonIcon,
  IonButton,
  IonButtons,
} from "@ionic/vue";

export default {
  components: {
    IonButton,
    IonButtons,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
  },
  setup() {
    const mroute = useRoute();
    //change lessonId and id to Int
    const lessonId = parseInt(mroute.params.lessonId, 10);
        const quizId = mroute.params.id ? parseInt(mroute.params.id, 10) : null; // 'quizId' will be quizId if editing, null if creating

    const cuestionario = ref({
      id: null,
      title: "",
      quizType: "group", // Fixed value as per API comment
      lessonId: parseInt(lessonId, 10),
      instituteId: null,
      exist: true,
    });
    const error = ref({
      estatus: 0,
      data: "",
    });

    const usuario = ref();
    const lessonDetails = ref(null);

    const backUrl = computed(() => {
      if (cuestionario.value.id) {
        // If editing a quiz, go back to the quiz view
        return `/cuestionario/${cuestionario.value.id}`;
      } else if (lessonDetails.value) {
        // If creating a quiz, go back to the lessons page for the specific lesson
        const { course, area, period, year } = lessonDetails.value;
        return `/lecciones/${course.id}/${area.id}/${period.id}/${year}`;
      } else {
        // Fallback if lessonDetails is not yet loaded or invalid
        return `/lecciones`; // Or a more appropriate default route
      }
    });

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();

      // Fetch lesson details first, as it's needed for backUrl and new quiz creation
      try {
        const response = await axios.get(`/lessons/${lessonId}`);
        lessonDetails.value = response.data;
      } catch (error) {
        console.error("Error fetching lesson details:", error);
        // Handle error, maybe redirect or show a message
        return;
      }

      if (quizId) {
        // If 'quizId' exists, it means we are editing an existing quiz
        try {
          const response = await axios.get(`/quizzes/${quizId}`);
          cuestionario.value = {
            id: response.data.id,
            title: response.data.title,
            quizType: response.data.quizType,
            lessonId: response.data.lesson.id,
            instituteId: response.data.lesson.institute.id,
            exist: response.data.exist,
          };
        } catch (error) {
          console.error("Error fetching quiz details:", error);
          // If quiz not found or error, treat as new creation for this lesson
          cuestionario.value = {
            id: null,
            title: "",
            quizType: "group",
            lessonId: parseInt(lessonId, 10),
            instituteId: usuario.value.institute.id,
            exist: true,
          };
        }
      } else {
        // Creating a new quiz
        cuestionario.value = {
          id: null,
          title: "",
          quizType: "group",
          lessonId: parseInt(lessonId, 10),
          instituteId: usuario.value.institute.id,
          exist: true,
        };
      }
    });

    return {
      borrarCuestionario(valor) {
        cuestionario.value.exist = valor;
        this.crearCuestionario();
      },
      async crearCuestionario() {
        if (cuestionario.value.title == "") {
          error.value.estatus = 1;
          error.value.data = "Debe añadir un título al cuestionario";
          return;
        }

        const payload = {
          title: cuestionario.value.title,
          quizType: cuestionario.value.quizType,
          lessonId: cuestionario.value.lessonId,
          instituteId: cuestionario.value.instituteId,
        };

        try {
          let response;
          if (quizId) {
            // Editing existing quiz
            payload.exist = cuestionario.value.exist; // Add exist property for PATCH
            response = await axios.patch(
              `/quizzes/${quizId}`,
              payload
            );
          } else {
            // Creating new quiz
            response = await axios.post("/quizzes", payload);
          }

          router.push("/cuestionario/" + response.data.id);
          localStorage.setItem(
            "error",
            response.data.message || "Operación exitosa"
          );
        } catch (err) {
          console.error("Error saving questionnaire:", err);
          localStorage.setItem(
            "error",
            err.response?.data?.message || "Error al guardar el cuestionario"
          );
          error.value.estatus = 1;
          error.value.data =
            err.response?.data?.message ||
            "Error: no se pudo guardar el cuestionario";
        }
      },
      arrowBackOutline,
      cuestionario,
      error,
      checkmarkOutline,
      backUrl,
    };
  },
};
</script>
