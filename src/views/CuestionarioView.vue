<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cuestionario 20-04-2011</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button href="/cuestionarios">
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title size="large">Cuestionario 20-03-2011</ion-title>
          <ion-buttons slot="end">
            <ion-button href="/cuestionarios">
              <ion-icon :icon="refreshOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

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
