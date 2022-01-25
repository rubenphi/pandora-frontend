<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cuestionarios</ion-title>

        <ion-buttons
          slot="start"
          class="ion-margin-end"
        >
          <ion-button :href="'/areas/' + curso">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-buttons
          v-if="usuario.rol == 'admin' || usuario.rol == 'profesor'"
          slot="end"
          class="ion-margin-end"
        >
          <ion-button
            slot="end"
            :href="'/crear/cuestionario/' + curso + '/' + area"
          >
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card
        v-for="cuestionario in cuestionarios"
        :key="cuestionario.id"
        :href="'/cuestionario/' + cuestionario.id"
      >
        <ion-card-header>
          <ion-card-subtitle>{{ cuestionario.curso.nombre }}</ion-card-subtitle>
          <ion-card-title>{{ cuestionario.fecha }}</ion-card-title>
        </ion-card-header>

        <ion-card-content> {{ cuestionario.tema }} </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, usuarioGet, adminOprofesor } from "../globalService";
import { useRoute } from "vue-router";
import router from "../router";
import { addOutline, arrowBackOutline } from "ionicons/icons";

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
  IonButton,
  IonButtons,
  IonIcon,
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
    IonButtons,
    IonButton,
    IonIcon,
  },
  setup() {
    const mroute = useRoute();
    const { curso } = mroute.params;
    const { area } = mroute.params;
    let usuario = usuarioGet();
    const cuestionarios = ref([]);
    onIonViewWillEnter(async () => {
      if (curso != usuario.curso_id) {
        if (adminOprofesor()) {
          router.push(
            "/cuestionarios/curso/area/" + usuario.curso_id + "/" + area
          );
        }
      } else {
        tokenHeader();
        await axios
          .get("/cuestionarios/curso/area/" + curso + "/" + area)
          .then((response) => {
            cuestionarios.value = response.data;
          });
      }
    });

    return {
      area,
      curso,
      addOutline,
      arrowBackOutline,
      usuario,
      cuestionarios,
    };
  },
};
</script>
