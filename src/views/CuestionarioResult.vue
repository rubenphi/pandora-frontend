<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center">{{cuestionario.tema}}</ion-title>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button v-if="id" :href="'/cuestionario/' + id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button v-if="id" :href="'/ganadores/' + id">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item v-for="(respuesta, index) in respuestas" :key="index" lines="full" class="ion-padding-end">
          <ion-icon v-if="index === 0" :icon="trophyOutline" size="large" slot="start"></ion-icon>
          <ion-icon v-else-if="respuesta.total > 0" :icon="happyOutline" size="large" slot="start"></ion-icon>
          <ion-icon v-else :icon="sadOutline" size="large" slot="start"></ion-icon>
          
          <ion-label color="medium">
            {{respuesta.group.name}}</ion-label>
          <ion-note slot="end">
            <ion-text v-if="index === 0" color="warning"><h6><ion-icon :icon="starOutline"></ion-icon>GANADOR<ion-icon :icon="starOutline"></ion-icon></h6></ion-text>
            <ion-text v-if="respuesta.points > 0" color="success"><h6>Total Puntos: {{respuesta.points}}</h6></ion-text>
            <ion-text v-else color="danger"><h6>Total Puntos: {{respuesta.points}}</h6></ion-text>
             <ion-text v-if="respuesta.grupo_id === usuario.grupo_id || usuario.rol == 'admin'">Nota: {{respuesta.nota}}</ion-text>
          </ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>

import axios from "axios";
import { ref } from "vue";
import { usuarioGet,  tokenHeader } from "../globalService";
import { useRoute } from 'vue-router';


import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  paperPlaneOutline,
  happyOutline,
  sadOutline,
  ribbonOutline,
  starOutline,
  trophyOutline
} from "ionicons/icons";

import {
  IonTitle,
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
    const  usuario = usuarioGet();
    const mroute = useRoute();
    const { id } = mroute.params;
    const cuestionario =  ref({
      tema: ''
    });
    const respuestas = ref([
      {  group: {name: 'Cargando'}, points: 'Cargando' }
    ]);
    
    onIonViewDidEnter( async () => {
       tokenHeader();
        await axios.get(`/lessons/${id}/results`).then((response) => {
          respuestas.value = response.data.map(
            e=> {e.points = parseFloat(e.points) ;
              e.nota =( ( e.points * 5 ) / response.data[0].points).toFixed(1);
              e.nota = e.nota < 0 ?  0 : e.nota;
              return e
            }
          );
          
        });
        await axios.get("/cuestionarios/" + id).then((response) => {
          cuestionario.value = response.data;
        });
      
    });

    return {
      usuario,
      id,
      cuestionario,
      respuestas,
      arrowBackOutline,
      handLeftOutline,
      paperPlaneOutline,
      refreshOutline,
      happyOutline,
      sadOutline,
      ribbonOutline,
      starOutline,
      trophyOutline
    };
  },
};
</script>
