<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center">20-03-2011</ion-title>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button href="/cuestionario">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button href="/ganadores">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item v-for="(respuesta, index) in respuestas" :key="respuesta.id" lines="full" class="ion-padding-end">
          <ion-icon v-if="index === 0" :icon="trophyOutline" size="large" slot="start"></ion-icon>
          <ion-icon v-else-if="respuesta.puntaje > 0" :icon="happyOutline" size="large" slot="start"></ion-icon>
          <ion-icon v-else :icon="sadOutline" size="large" slot="start"></ion-icon>
          
          <ion-label color="medium">
            Ganador<br>
            {{respuesta.grupo}}</ion-label>
          <ion-note slot="end">
            <ion-text v-if="respuesta.puntaje > 0" color="success"><h6>Obtienen: +{{respuesta.puntaje}}</h6></ion-text>
            <ion-text v-else color="danger"><h6>Obtienen: +{{respuesta.puntaje}}</h6></ion-text>
            <ion-text color="warning"><h6>Respuesta: {{respuesta.opcion}}</h6></ion-text>
          </ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
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
import { ref } from "vue";
import {
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
    const respuestas = ref([
      { id: 1, grupo: "Grupo 2", puntaje: 9, opcion: "B" },
      { id: 2, grupo: "Grupo 3", puntaje: 6, opcion: "B" },
      { id: 3, grupo: "Grupo 1", puntaje: 0, opcion: "C" },
    ]);

    return {
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
