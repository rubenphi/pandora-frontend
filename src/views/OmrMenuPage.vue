<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Encuestas y Test</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item :href="'/omr-encuesta/estudiantes'">
          <ion-icon slot="start" :icon="peopleCircleOutline"></ion-icon>
          <ion-label>Encuesta a Estudiantes</ion-label>
        </ion-item>
        <ion-item :href="'/omr-encuesta/padres'">
          <ion-icon slot="start" :icon="peopleOutline"></ion-icon>
          <ion-label>Encuesta a Padres</ion-label>
        </ion-item>
        <ion-item :href="'/omr-test'">
          <ion-icon slot="start" :icon="scanOutline"></ion-icon>
          <ion-label>Lector OMR</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonList,
  IonLabel,
} from "@ionic/vue";
import { useRouter } from "vue-router";
import {
  arrowBackOutline,
  scanOutline,
  peopleOutline,
  peopleCircleOutline,
} from "ionicons/icons";

export default {
  name: "OmrMenuPage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonList,
    IonLabel,
  },
  setup() {
    const router = useRouter();
    const goBack = () => router.back();
    return {
      goBack,
      arrowBackOutline,
      peopleCircleOutline,
      scanOutline,
      peopleOutline,
    };
  },
};
</script>
