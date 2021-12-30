<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center"
          >1. Primera pregunta</ion-title
        >
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
    <ion-list>
    <ion-item lines="full" class="ion-padding-end">
      <ion-text slot="start" color="dark">
          <h3>Resultados de Grupo 1</h3>
        </ion-text>
       <ion-note slot="end" >
      <ion-text color="success"><h5>Obtienen: +9</h5></ion-text>
      <ion-text color="warning"><h5>Respuesta: B</h5></ion-text>
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
  IonText
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
    IonText
  },
  setup() {
    return {
      arrowBackOutline,
      handLeftOutline,
      paperPlaneOutline,
      refreshOutline,
    };
  },
};
</script>
