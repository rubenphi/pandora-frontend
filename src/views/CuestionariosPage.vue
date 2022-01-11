<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cuestionarios</ion-title>

        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button :href="'/home'">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Cursos</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-list>
        <ion-item v-for="curso in cursos" :key="curso.id" >
          <ion-icon slot="start" :icon="peopleCircleOutline"></ion-icon>
          <ion-label>{{curso.nombre}}</ion-label>
        </ion-item>
        
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, usuarioGet } from "../globalService";

import { addOutline } from "ionicons/icons";

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
  IonIcon,
  IonButtons,
  IonButton,
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
    IonIcon,
    IonButtons,
    IonButton,
  },
  setup() {
    let usuario = usuarioGet();
    const cursos = ref([]);
    onIonViewWillEnter(() => {
      tokenHeader();
      axios.get("/cursos").then((response) => {
        cursos.value = response.data;
      });
    });

    return {
      addOutline,
      usuario,
      cuestionarios,
    };
  },
};
</script>
