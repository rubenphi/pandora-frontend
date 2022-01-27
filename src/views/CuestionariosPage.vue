<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Selecciona el curso</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item v-for="curso in cursos" :key="curso.id"  :href="'areas/' + curso.id">
          <ion-icon slot="start" :icon="peopleCircleOutline"></ion-icon>
          <ion-label>{{ curso.nombre }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, usuarioGet  } from "../globalService";

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
  setup() {
    let usuario = usuarioGet();
    const cursos = ref([]);
    onIonViewWillEnter( async () => {
      tokenHeader();
      await axios.get("/cursos").then((response) => {
        cursos.value = response.data;
      });
    });

    return {
      peopleCircleOutline,
      usuario,
      cursos,
    };
  },
};
</script>
