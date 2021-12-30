<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
<ion-title size="large" class="ion-text-center">1. Primera pregunta</ion-title>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button href="/cuestionario">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button href="/">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card>
        <ion-card-header>
<ion-card-subtitle
            >Grupo 1</ion-card-subtitle
          >
          <ion-card-title
            >Respuesta: A</ion-card-title
          >
<ion-card-subtitle>Puntos obtenidos +8</ion-card-subtitle>
        </ion-card-header>
      </ion-card>
      
    </ion-content>
  </ion-page>
</template>

<script>
import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  paperPlaneOutline
} from "ionicons/icons";

import {
  IonIcon,
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonCard,
  IonCardTitle,
  IonCardContent,
  IonCardSubtitle,
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
    IonCard,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle
  },
  setup() {
    return {
      arrowBackOutline,
      handLeftOutline,
      paperPlaneOutline,
      refreshOutline
    };
  },
};
</script>
