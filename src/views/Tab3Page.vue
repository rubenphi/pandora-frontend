<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cuestionarios</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Cuestionarios</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-card href="/cuestionario">
        <ion-card-header>
          <ion-card-subtitle>Cuestionario</ion-card-subtitle>
          <ion-card-title>20-03-2021</ion-card-title>
        </ion-card-header>

        <ion-card-content> Romanticismo y Realismo </ion-card-content>
      </ion-card>

      <ion-card href="/cuestionario">
        <ion-card-header>
          <ion-card-subtitle>Cuestionario</ion-card-subtitle>
          <ion-card-title>23-03-2021</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          Constructivismo y Novela Picaresca
        </ion-card-content>
      </ion-card>
      {{ cuestionarios }}
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import {
  onIonViewDidEnter,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/vue";

export default {
  components: {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
  },
  setup() {
  

    return {
      axios,
      cuestionarios: []
      
    },
       onIonViewDidEnter(() => {
         axios.get("/cuestionarios").then((response) => {
        this.cuestionarios = response.data;
      });
    });
  },
};
</script>
