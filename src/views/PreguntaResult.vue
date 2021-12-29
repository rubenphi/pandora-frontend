<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button href="/cuestionarios">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title size="large" class="ion-text-center">1. Primera Pregunta</ion-title>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button href="/cuestionario">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card href="/cuestionario">
        <ion-card-header>
          <ion-card-subtitle>Grupo 1</ion-card-subtitle>
          <ion-card-title>
            Respuesta:
            <strong>A</strong>
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-icon :icon="checkmarkOutline"></ion-icon>Obtuvo un total de 8 Puntos
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  arrowBackOutline,
  refreshOutline,
  checkmarkOutline,
} from "ionicons/icons";

import {
  IonIcon,
  IonButtons,
  IonButton,
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
} from "@ionic/vue";

export default {
  components: {
    IonIcon,
    IonButtons,
    IonButton,
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
    arrowBackOutline,
    refreshOutline,
    checkmarkOutline,
  },
  setup() {
    return {
      arrowBackOutline,
      refreshOutline,
      checkmarkOutline
    };
  },
};
</script>
