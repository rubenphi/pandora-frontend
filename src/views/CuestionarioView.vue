<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button :href="'/cuestionarios/' + cuestionario.curso_id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title size="large" class="ion-text-center">{{cuestionario.fecha}}</ion-title>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button :href="'/cuestionario/' + cuestionario.id">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card :href="'/ganadores/' + cuestionario.id">
        <ion-card-header>
          <ion-card-title class="ion-text-center"
            >{{cuestionario.tema}}</ion-card-title
          >
          <ion-card-subtitle class="ion-text-center"
            >Ver Resultados</ion-card-subtitle
          >
        </ion-card-header>
      </ion-card>
      <ion-card v-if="cuestionario.preguntas != ''">
        <ion-list>
          <ion-item  v-for="(pregunta , index) in cuestionario.preguntas" :key="pregunta.id" :href="'/pregunta/' + pregunta.id">
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              > <b>Pregunta {{index + 1}}</b></ion-label
            >
          </ion-item>
        </ion-list>
      </ion-card>
    </ion-content>
  </ion-page>
</template>
<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader } from "../globalService";


import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
} from "ionicons/icons";
import {
  IonLabel,
  IonItem,
  IonIcon,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonCard,
  IonCardTitle,
  IonCardSubtitle,
  onIonViewDidEnter
} from "@ionic/vue";

import { useRoute } from 'vue-router';

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButtons,
    IonButton,
    IonCard,
    IonCardTitle,
    IonCardSubtitle,
  },
  setup() {
    const mroute = useRoute();
    const { id } = mroute.params;
    const cuestionario = ref ({
      id: 0,
      fecha: '',
      tema: '',
      preguntas: ''
    });
     onIonViewDidEnter(() => {
       tokenHeader();
        axios.get("/cuestionarios/" + id).then((response) => {
        cuestionario.value = response.data;
        
      })
      
    });

    return {
      cuestionario,
      id,
      arrowBackOutline,
      handLeftOutline,
      refreshOutline,
    };
  },
};
</script>
