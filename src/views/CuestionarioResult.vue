<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center">20-03-2011</ion-title>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button :href="'/cuestionario/' + id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button :href="'/ganadores/' + id">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item v-for="(respuesta, index) in respuestas" :key="index" lines="full" class="ion-padding-end">
          <ion-icon v-if="index === 0" :icon="trophyOutline" size="large" slot="start"></ion-icon>
          <ion-icon v-else-if="respuesta.total > 0" :icon="happyOutline" size="large" slot="start"></ion-icon>
          <ion-icon v-else :icon="sadOutline" size="large" slot="start"></ion-icon>
          
          <ion-label color="medium">
            {{respuesta.grupo.nombre}}</ion-label>
          <ion-note slot="end">
            <ion-text v-if="index === 0" color="warning"><h6><ion-icon :icon="starOutline"></ion-icon>GANADOR<ion-icon :icon="starOutline"></ion-icon></h6></ion-text>
            <ion-text v-if="respuesta.total > 0" color="success"><h6>Total Puntos: {{respuesta.total}}</h6></ion-text>
            <ion-text v-else color="danger"><h6>Total Puntos: {{respuesta.total}}</h6></ion-text>
          </ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>

import axios from "axios";
import { ref } from "vue";
import { tokenHeader } from "../globalService";
import { useRoute } from 'vue-router';


import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  paperPlaneOutline,
  happyOutline,
  sadOutline,
  ribbonOutline,
  starOutline,
  trophyOutline
} from "ionicons/icons";

import {
  onIonViewDidEnter,
  IonIcon,
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonNote,
  IonText,
  IonLabel,
} from "@ionic/vue";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonContent,
    IonPage,
    IonIcon,
    IonButtons,
    IonButton,
    IonList,
    IonItem,
    IonNote,
    IonText,
    IonLabel,
  },
  setup() {
    const mroute = useRoute();
    const { id } = mroute.params;
    const respuestas = ref([
      {  grupo: {nombre: 'Cargando'}, total: 'Cargando' }
    ]);
    
    onIonViewDidEnter(() => {
       tokenHeader();
        axios.get("/respuestas/resultado/" + id).then((response) => {
        respuestas.value = response.data;
      })
      
    });

    return {
      id,
      respuestas,
      arrowBackOutline,
      handLeftOutline,
      paperPlaneOutline,
      refreshOutline,
      happyOutline,
      sadOutline,
      ribbonOutline,
      starOutline,
      trophyOutline
    };
  },
};
</script>
