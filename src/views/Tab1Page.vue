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
        <ion-item v-for="miembro in miembros" :key="miembro">
          <ion-icon slot="start" :icon="personOutline"></ion-icon>
          <ion-label>{{miembro}}</ion-label>
        </ion-item>
        
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { personOutline } from "ionicons/icons";
//import { ref } from "vue";
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
    const miembros  = [
      'Felipito',
      'Susanita',
      'Mafalda',
      'Guille',

    ]
    return {
      personOutline,
      miembros
    };
  },
};
</script>
