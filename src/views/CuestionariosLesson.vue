<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Lecciones</ion-title>

        <ion-buttons slot="start" class="ion-margin-end">
          <ion-button
            v-if="lesson?.course"
            :href="`lecciones/${lesson.course.id}/${lesson.area.id}/${lesson.period.id}/${lesson.year}`"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-buttons v-if="adminOProfesor" slot="end" class="ion-margin-end">
          <ion-button
            v-if="lesson?.course && lesson?.area"
            slot="end"
            :href="`/crear/leccion/${lesson.course.id}/${lesson.area.id}/${lesson.year}`"
          >
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card
        v-for="cuestionario in cuestionarios"
        :key="cuestionario.id"
        v-on:click="lessonSelected(cuestionario)"
      >
        <ion-card-header>
          <ion-card-subtitle>{{ cursoSelected.name }}</ion-card-subtitle>

          <ion-card-title>{{ cuestionario.title }}</ion-card-title>
        </ion-card-header>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, usuarioGet, adminOprofesor } from "../globalService";
import { useRoute } from "vue-router";
import { addOutline, arrowBackOutline } from "ionicons/icons";

import {
  onIonViewWillEnter,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
} from "@ionic/vue";

export default {
  components: {
    IonCard,

    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonButtons,
    IonButton,
    IonIcon,
  },
  methods: {
    lessonSelected: function (cuestionario) {
      localStorage.setItem("lessonSelected", JSON.stringify(cuestionario));
    },
  },
  setup() {
    const mroute = useRoute();
    const { lessonId } = mroute.params;
    const cursoSelected = ref(
      JSON.parse(localStorage.getItem("courseSelected"))
    );

    const lesson = ref({});

    const usuario = ref();
    const adminOProfesor = ref();
    const cuestionarios = ref([]);
    const cuestionariosSinNotasIds = ref([]);

    onIonViewWillEnter(async () => {
      adminOProfesor.value = adminOprofesor();
      usuario.value = usuarioGet();

      tokenHeader();

      await axios.get(`/lessons/${lessonId}`).then((response) => {
        lesson.value = response.data;
      });

      await axios
        .get(
          `/lessons/${lessonId}/quizzes
          `
        )
        .then((response) => {
          cuestionarios.value = response.data
            .map((cuestionario) => ({
              id: cuestionario.id,
              title: cuestionario.title,
            }))
            .sort((a, b) => {
              return new Date(a.date) - new Date(b.date);
            });
        });
    });

    return {
      cursoSelected,
      adminOProfesor,
      lesson,
      addOutline,
      arrowBackOutline,
      usuario,
      cuestionarios,
      cuestionariosSinNotasIds,
    };
  },
};
</script>
