<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cuestionario</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>

  <ion-item>
    <ion-label position="stacked">Fecha</ion-label>
    <ion-input type="date"></ion-input>
  </ion-item>

<ion-item>
    <ion-label position="stacked">Tema</ion-label>
    <ion-input type="text"></ion-input>
  </ion-item>
        
      </ion-list>
    </ion-content>
  </ion-page>
</template>
<script>
import axios from "axios";
import { ref } from "vue";


import { tokenHeader , usuarioGet } from "../globalService";
import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput
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
    IonInput
  },
  setup() {
    let usuario = usuarioGet();
    const miembros = ref([]);
    onIonViewWillEnter(() => {
      tokenHeader();
      axios.get("/user/grupo/" + usuario.grupo_id).then((response) => {
        miembros.value = response.data;
        
      });
    });
    return {
      usuario,
      miembros
    };
  
  },
};
</script>