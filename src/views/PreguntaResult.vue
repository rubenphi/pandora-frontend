<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center"
          >1. Primera pregunta</ion-title
        >
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button :href="'/pregunta/' + id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button :href="'/resultado/' + id">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item v-for="(respuesta, index) in respuestas" :key="respuesta.id" lines="full" class="ion-padding-end">
          <ion-icon v-if="index === 0" :icon="ribbonOutline" size="large" slot="start"></ion-icon>
          <ion-icon v-else-if="respuesta.puntaje > 0" :icon="happyOutline" size="large" slot="start"></ion-icon>
          <ion-icon v-else :icon="sadOutline" size="large" slot="start"></ion-icon>
          
          <ion-label color="medium">{{respuesta.grupo.nombre}}</ion-label>
          <ion-note slot="end">
            <ion-text v-if="respuesta.puntaje > 0" color="success"><h6>Obtienen: +{{respuesta.puntaje}}</h6></ion-text>
            <ion-text v-else color="danger"><h6>Obtienen: {{respuesta.puntaje}}</h6></ion-text>
            <ion-text color="warning"><h6>Respuesta: {{respuesta.opcion.letra}}</h6></ion-text>
          </ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader } from "../globalService";
import { useRoute } from 'vue-router';


import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  paperPlaneOutline,
  happyOutline,
  sadOutline,
  ribbonOutline
} from "ionicons/icons";

import {
  onIonViewDidEnter,
  IonIcon,
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonNote,
  IonText,
  IonLabel,
  IonTitle
} from "@ionic/vue";

export default {
  components: {
      IonTitle,
    IonHeader,
    IonToolbar,
    IonContent,
    IonPage,
    IonIcon,
    IonButtons,
    IonButton,
    IonList,
    IonItem,
    IonNote,
    IonText,
    IonLabel,
  },
  setup() {
    const mroute = useRoute();
    const { id } = mroute.params;
    const respuestas = ref ([{
      id: 'Cargando',
      grupo: {nombre: 'Cargando'},
      puntaje: 0,
      opcion: {
        letra: 'Cargando'
      }
    }]);
    
    
     onIonViewDidEnter(async () => {
       tokenHeader();
       await axios.get("/respuestas/pregunta/" + id).then((response) => {
        respuestas.value = response.data;
      })
      
    });

    return {
      id,
      respuestas,
      arrowBackOutline,
      handLeftOutline,
      paperPlaneOutline,
      refreshOutline,
      happyOutline,
      sadOutline,
      ribbonOutline
    };
  },
};
</script>
