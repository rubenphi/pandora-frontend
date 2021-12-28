<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button href="/cuestionarios">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title size="large" class="ion-text-center">20-03-2011</ion-title>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button href="/cuestionario">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <h5 class="ion-text-center">Romanticismo y Realismo</h5>
      <ion-list>
        <ion-item>
          <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
          <ion-label
            >¿Cuál de los siguientes documentos corresponde al a la información
            entregada en el siguiente enunciado?</ion-label
          >
        </ion-item>
        <ion-item>
          <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
          <ion-label
            >Los presentes textos corresponden a un tipo de texto, analice las
            diferentes características del texto e identifique a qué tipo de
            text corresponde</ion-label
          >
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
} from "@ionic/vue";

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
  },
  setup() {
    return {
      arrowBackOutline,
      handLeftOutline,
      refreshOutline,
    };
  },
};
</script>
