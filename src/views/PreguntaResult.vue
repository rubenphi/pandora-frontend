<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
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
<ion-card-subtitle class="ion-text-center"
            >Grupo 1.</ion-card-subtitle
          >
          <ion-card-title class="ion-text-center"
            >Respuesta: A</ion-card-title
          >
<ion-card-content>Puntos obtenidos +8</ion-card-content>
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
  IonImg,
  IonRadio,
  IonRadioGroup,
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
    IonImg,
    IonRadioGroup,
    IonRadio,
    IonCardSubtitle,
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
