<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button :href="'/cuestionario/' + pregunta.cuestionario_id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button :href="'/resultado/' + pregunta.id">
            <ion-icon :icon="podiumOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card>
        <ion-card-header>
          <ion-card-title class="ion-text-center"
            >Esta pregunta vale: + {{pregunta.valor}} puntos</ion-card-title
          >
        </ion-card-header>
      </ion-card>
      <ion-card v-if="pregunta.photo">
        <ion-img
          :src="pregunta.photo"
        ></ion-img>
      </ion-card>
      <ion-card>
        <ion-card-content>
          <div v-html="pregunta.enunciado"></div>
        </ion-card-content>
      </ion-card>

      <ion-card class="ion-padding-top ion-padding-bottom">
        <ion-list>
          <ion-card-subtitle class="ion-text-center">
            Selecciona tu respuesta
          </ion-card-subtitle>
          <hr>
          <ion-radio-group value="biff">
            <ion-item lines="none" v-for="opcion in pregunta.opciones" :key="opcion.id">
              <ion-label class="ion-text-wrap"
                ><b>{{opcion.letra}}. </b> {{opcion.enunciado}}</ion-label
              >
              <ion-radio v-model="respuesta.opcion_id" slot="start" :value="opcion.id" :id="opcion.id"></ion-radio>
            </ion-item>

          </ion-radio-group>
        </ion-list>
      </ion-card>

      <ion-buttons class="ion-justify-content-center ion-padding-top ion-padding-bottom">
        <ion-button expand="full" fill="outline" shape="round" color="primary" class="ion-align-self-center"  @click="responder">
          <ion-icon slot="end" :icon="paperPlaneOutline"></ion-icon>
          <ion-label class="ion-text-center"> Enviar Respuesta </ion-label>
        </ion-button>
      </ion-buttons>
      
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
  podiumOutline
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
  IonCard,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonRadio,
  IonRadioGroup,
  IonCardSubtitle,
} from "@ionic/vue";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonContent,
    IonPage,
    IonIcon,
    IonButtons,
    IonButton,
    IonCard,
    IonCardTitle,
    IonCardContent,
    IonImg,
    IonRadioGroup,
    IonRadio,
    IonCardSubtitle,
  },
  setup() {

    const mroute = useRoute();
    const { id } = mroute.params;
    const pregunta = ref ({
      id: '',
      puntaje: '',
      enunciado: '',
      opciones: {
        enunciado: ''
      }

    });
    
    const respuesta = ref ({
      opcion_id: '',
      pregunta_id: '',
      grupo_id: ''

    });
     onIonViewDidEnter(() => {
       tokenHeader();
        axios.get("/preguntas/" + id).then((response) => {
        pregunta.value = response.data;
      })
      
    });


    return {
       responder(){
        if(respuesta.value.opcion_id == ''){
          console.log('debe seleccionar una respuesta')
        }
        else {
          console.log('Usted seleccionó: ' + respuesta.value.opcion_id)
        }
      },
      respuesta,
      pregunta,
      arrowBackOutline,
      handLeftOutline,
      refreshOutline,
      paperPlaneOutline,
      podiumOutline
    };
  },
};
</script>
