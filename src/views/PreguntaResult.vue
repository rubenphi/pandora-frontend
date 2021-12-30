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
<ion-card-subtitle color="dark"
            >Grupo 1</ion-card-subtitle
          >
          <ion-card-title color="tertiary"
            >Respuesta: A</ion-card-title
          >
<ion-card-subtitle color="success">Puntos obtenidos +8</ion-card-subtitle>
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
