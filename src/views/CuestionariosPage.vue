<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Selecciona el curso</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item
          v-for="curso in cursos"
          :key="curso.id"
          :href="'areas/' + curso.id"
          v-on:click="courseSelected(curso)"
        >
          <ion-icon slot="start" :icon="peopleCircleOutline"></ion-icon>
          <ion-label>{{ curso.name }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from "vue";
import { tokenHeader, usuarioGet } from "../globalService";

import { peopleCircleOutline } from "ionicons/icons";

import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonIcon,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/vue";

export default {
  components: {
    IonLabel,
    IonItem,
    IonList,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonIcon,
  },
  methods: {
    courseSelected: function (course) {
      localStorage.setItem("courseSelected", JSON.stringify(course));
    },
  },
  setup() {
    const usuario = ref();

    const cursos = ref([]);
    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();
      cursos.value = JSON.parse(localStorage.getItem("cursosUsuario"));
    });

    return {
      peopleCircleOutline,
      usuario,
      cursos,
    };
  },
};
</script>
