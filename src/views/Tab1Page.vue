<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Grupo</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Grupo</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list>
        <ion-item>
          <ion-icon slot="start" :icon="personOutline"></ion-icon>
          <ion-label>Felipito</ion-label>
        </ion-item>
        <ion-item>
          <ion-icon slot="start" :icon="personOutline"></ion-icon>
          <ion-label>Susanita</ion-label>
        </ion-item>
        <ion-item>
          <ion-icon slot="start" :icon="personOutline"></ion-icon>
          <ion-label>Mafalda</ion-label>
        </ion-item>
        <ion-item>
          <ion-icon slot="start" :icon="personOutline"></ion-icon>
          <ion-label>Guille</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { personOutline } from "ionicons/icons";

import {
  IonLabel,
  IonItem,
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
      personOutline,
    };
  },
};
</script>
