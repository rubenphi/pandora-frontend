<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Materials List</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/materials/create">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>This is the Materials List page. You can create new materials from here.</p>
      <!-- Material list will go here -->
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/vue';
import { addOutline } from 'ionicons/icons';

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
  },
  setup() {
    return {
      addOutline,
    };
  },
};
</script>
