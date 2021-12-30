<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center"
          >1. Primera pregunta</ion-title
        >
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button href="/pregunta">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button href="/resultado">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item lines="full" class="ion-padding-end">
          <ion-icon :icon="happyOutline" size="large" slot="start"></ion-icon>
          <ion-label color="medium">Resultado Grupo 1</ion-label>
          <ion-note slot="end">
            <ion-text color="success"><h6>Obtienen: +9</h6></ion-text>
            <ion-text color="warning"><h6>Respuesta: B</h6></ion-text>
          </ion-note>
        </ion-item>
        <ion-item lines="full" class="ion-padding-end">
          <ion-icon :icon="sadOutline" size="large" slot="start"></ion-icon>
          <ion-label color="medium">Resultado Grupo 2</ion-label>
          <ion-note slot="end">
            <ion-text color="danger"><h6>Obtienen: 0</h6></ion-text>
            <ion-text color="warning"><h6>Respuesta: B</h6></ion-text>
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
  sadOutline
} from "ionicons/icons";

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
    return {
      arrowBackOutline,
      handLeftOutline,
      paperPlaneOutline,
      refreshOutline,
      happyOutline,
      sadOutline
    };
  },
};
</script>
