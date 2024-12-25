<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cuestionarios</ion-title>

        <ion-buttons slot="start" class="ion-margin-end">
          <ion-button v-if="curso" :href="'/areas/' + curso">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-buttons v-if="adminOProfesor" slot="end" class="ion-margin-end">
          <ion-button
            v-if="curso && area"
            slot="end"
            :href="'/crear/cuestionario/' + curso + '/' + area"
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
        :href="'/cuestionario/' + cuestionario.id"
      >
        <ion-card-header>
          <ion-card-subtitle>{{ cursoSelected.name }}</ion-card-subtitle>
          <ion-card-title>{{ cuestionario.topic }}</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          {{ cuestionario.date.substring(0, 10) }}
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, usuarioGet, adminOprofesor } from "../globalService";
import { useRoute } from "vue-router";
import router from "../router";
import { addOutline, arrowBackOutline } from "ionicons/icons";

import {
  onIonViewWillEnter,
  IonCard,
  IonCardContent,
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
    IonCardContent,
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
    const { curso } = mroute.params;
    const { area } = mroute.params;
    const { periodo } = mroute.params;
    const cursoSelected = ref(
      JSON.parse(localStorage.getItem("courseSelected"))
    );
    const cursosUsuario = ref(
      JSON.parse(localStorage.getItem("cursosUsuario"))
    );
    let usuario = usuarioGet();
    let adminOProfesor = adminOprofesor();
    const cuestionarios = ref([]);
    onIonViewWillEnter(async () => {
      tokenHeader();
      if (curso != cursosUsuario.value[0].id && !adminOprofesor()) {
        router.push("/cuestionarios/" + cursosUsuario.value[0].id + "/" + area);
      } else {
        await axios
          .get(`/lessons?courseId=${curso}&areaId=${area}&periodId=${periodo}`)
          .then((response) => {
            cuestionarios.value = response.data.map((cuestionario) => ({
              id: cuestionario.id,
              topic: cuestionario.topic,
              date: cuestionario.date,
              area: { id: cuestionario.area.id },
              course: { id: cuestionario.course.id },
            }));
          });
      }
    });

    return {
      cursoSelected,
      adminOProfesor,
      area,
      curso,
      addOutline,
      arrowBackOutline,
      usuario,
      cuestionarios,
    };
  },
};
</script>
