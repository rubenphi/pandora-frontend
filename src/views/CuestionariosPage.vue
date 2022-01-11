<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cuestionarios</ion-title>

                <ion-buttons slot="end" class="ion-margin-end">
          <ion-button :href="'/home'">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">


      <ion-card v-for="cuestionario in cuestionarios" :key="cuestionario.id" :href="'/cuestionario/' + cuestionario.id" >
        <ion-card-header>
          <ion-card-subtitle>{{cuestionario.curso.nombre}}</ion-card-subtitle>
          <ion-card-title>{{cuestionario.fecha}}</ion-card-title>
        </ion-card-header>

        <ion-card-content> {{cuestionario.tema}} </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader , usuarioGet } from "../globalService";


import { addOutline } from "ionicons/icons";

import {
  onIonViewWillEnter,
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
    addOutline
  },
  setup() {
  let usuario = usuarioGet();
  const cuestionarios = ref ([]);
  onIonViewWillEnter(() => {
        tokenHeader();
        axios.get("/cuestionarios/" ).then((response) => {
        cuestionarios.value = response.data;
      })
    });

    return {
      addOutline,
      usuario,
      cuestionarios
      
    }
       
  },
};
</script>
