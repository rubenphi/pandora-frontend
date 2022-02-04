<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center"
          >{{ pregunta.titulo }}</ion-title
        >
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button v-if="id"  :href="'/pregunta/' + id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button v-if="id"  :href="'/resultado/' + id">
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

        <ion-buttons
        v-if="admin"
        class="ion-justify-content-center ion-padding-top ion-padding-bottom"
      >
        <ion-button
          expand="full"
          fill="outline"
          shape="round"
          color="medium"
          class="ion-align-self-center"
           @click="bonus"
        >
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader , adminOprofesor } from "../globalService";
import { useRoute } from 'vue-router';


import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  paperPlaneOutline,
  happyOutline,
  sadOutline,
  ribbonOutline,
  addOutline
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
    const admin = adminOprofesor();
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
    const pregunta = ref(
      {titulo:'Cargando...'}
    );
    
     onIonViewDidEnter(async () => {
       tokenHeader();
       await axios.get("/preguntas/" + id).then((response) => {
pregunta.value = response.data;
       });
       await axios.get("/respuestas/pregunta/" + id).then((response) => {
        respuestas.value = response.data;
      })
      
    });

    return {
      admin,
      id,
    async  bonus(){
        await axios.post("/respuestas/bonus/pregunta/" + id).then((response) => {
        localStorage.setItem('error', response);
      });
      window.location.reload()
      console.log('hola');
      },
      respuestas,
      arrowBackOutline,
      handLeftOutline,
      paperPlaneOutline,
      refreshOutline,
      happyOutline,
      sadOutline,
      ribbonOutline,
      addOutline,
      pregunta

    };
  },
};
</script>
