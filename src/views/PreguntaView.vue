<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button href="/cuestionarios">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button href="/cuestionario">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card>
        <ion-card-header>
          <ion-card-title class="ion-text-center"
            >1. Primera Pregunta</ion-card-title
          >
        </ion-card-header>
      </ion-card>
      <ion-card>
        <ion-img src="https://s1.significados.com/foto/897px-eugene-delacroix-le-28-juillet.-la-liberte-guidant-le-peuple_bg.jpg"></ion-img>
      </ion-card>
      <ion-card-content>
      El Romanticismo es un movimiento cultural que se originó en Alemania y en Reino Unido a finales del siglo XVIII como una reacción revolucionaria contra la Ilustración y el Neoclasicismo, confiriendo prioridad a los sentimientos. Es considerado como el primer movimiento de cultura que cubrió el mapa completo de Europa. En la mayoría de las áreas estuvo en su apogeo en el período aproximado de 1800 a 1850. Luego, cedió su lugar al positivismo, que fomenta el pensamiento crítico y el empirismo como bases del conocimiento y la sociedad.
    </ion-card-content>
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
  IonImg
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
    IonImg
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
