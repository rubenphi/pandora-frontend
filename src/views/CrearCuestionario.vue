<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons>
          <ion-button :href="'/cuestionarios/' + curso">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
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
        <ion-item>
          <ion-buttons class="ion-justify-content-center ion-padding-top ion-padding-bottom">>
            <ion-button
              expand="full"
              fill="outline"
              shape="round"
              color="primary"
              class="ion-align-self-center"
              @click="mostrar"
            >
              <ion-label class="ion-text-center ion-padding">
                Crear Cuestionario
              </ion-label>
            </ion-button>
          </ion-buttons>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
<script>
import axios from "axios";
import { ref } from "vue";
import { useRoute } from 'vue-router';

import { tokenHeader, usuarioGet } from "../globalService";
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
  IonInput,
} from "@ionic/vue";

import {
  arrowBackOutline
} from "ionicons/icons";


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
    IonInput,
  },
  setup() {
    const mroute = useRoute();
    const { curso } = mroute.params;

    let usuario = usuarioGet();
    const miembros = ref([]);
    onIonViewWillEnter(() => {
      tokenHeader();
      axios.get("/user/grupo/" + usuario.grupo_id).then((response) => {
        miembros.value = response.data;
      });
    });
    return {
      arrowBackOutline,
      curso,
      usuario,
      miembros,
    };
  },
};
</script>
