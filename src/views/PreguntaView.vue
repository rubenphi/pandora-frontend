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
          <ion-icon slot="end" :icon="createOutline"></ion-icon>
        </ion-card-header>
        <ion-buttons class="ion-justify-content-center ion-padding-top ion-padding-bottom">
        <ion-button expand="full" fill="outline" shape="round" color="medium" class="ion-align-self-center"  @click="responder">
          <ion-icon slot="end" :icon="createOutline"></ion-icon>
          <ion-label class="ion-text-center"> Editar pregunta </ion-label>
        </ion-button>
      </ion-buttons>
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
          <ion-card-subtitle v-if="error.estatus === 0" class="ion-text-center">
            Selecciona tu respuesta
          </ion-card-subtitle>
          <ion-card-subtitle color="danger" v-if="error.estatus === 1" class="ion-text-center">
           {{ error.data }}
          </ion-card-subtitle>
          <hr>
          <ion-radio-group v-model="respuesta.opcion_id">
            <ion-item lines="none" v-for="opcion in pregunta.opciones" :key="opcion.id">
              <ion-label class="ion-text-wrap"
                ><b>{{opcion.letra}}. </b> {{opcion.enunciado}}</ion-label
              >
              <ion-icon v-if="admin" slot="start" :icon="createOutline"></ion-icon>
              <ion-radio v-if="!admin" slot="start" :value="opcion.id" :id="opcion.id"></ion-radio>
            </ion-item>

          </ion-radio-group>
        </ion-list>
      </ion-card>

      <ion-buttons v-if="!admin" class="ion-justify-content-center ion-padding-top ion-padding-bottom">
        <ion-button expand="full" fill="outline" shape="round" color="primary" class="ion-align-self-center"  @click="responder">
          <ion-icon slot="end" :icon="paperPlaneOutline"></ion-icon>
          <ion-label class="ion-text-center"> Enviar Respuesta </ion-label>
        </ion-button>
      </ion-buttons>
      
      <ion-buttons v-if="admin" class="ion-justify-content-center ion-padding-top ion-padding-bottom">
        <ion-button expand="full" fill="outline" shape="round" color="medium" class="ion-align-self-center" >
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
      
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, usuarioGet, adminOprofesor } from "../globalService";
import { useRoute } from 'vue-router';
import router from "../router";

import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  paperPlaneOutline,
  podiumOutline,
  createOutline,
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonRadio,
  IonLabel,
  IonRadioGroup,
  IonCardSubtitle,
  IonItem,
  IonList
} from "@ionic/vue";

export default {
  components: {
    IonList,
    IonLabel,
    IonItem,
    IonHeader,
    IonToolbar,
    IonContent,
    IonPage,
    IonIcon,
    IonButtons,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonImg,
    IonRadioGroup,
    IonRadio,
    IonCardSubtitle,
  },
  setup() {
    const admin = adminOprofesor();
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
    
    const error = ref({
      estatus: 0,
      data: "",
    });
    
     onIonViewDidEnter(() => {
       tokenHeader();
        axios.get("/preguntas/" + id).then((response) => {
        pregunta.value = response.data;
      })
      
    });


    return {
      async responder(){
        if(respuesta.value.opcion_id == ''){
          error.value.estatus = 1;
          error.value.data = "Debe seleccionar una opción.";
        }
        else {
          respuesta.value.pregunta_id = pregunta.value.id;
          respuesta.value.grupo_id = usuarioGet().grupo_id;
          await axios.post("/respuestas", respuesta.value).then((response) => {
            router.push("/resultado/" + pregunta.value.id);
            localStorage.setItem('error' ,response.data.message)
          }).catch((response) => {
            localStorage.setItem('error' ,response.message)
            error.value.estatus = 1;
            error.value.data = "Error: ya respondiste la pregunta o no se te permite responder";
          })
        }
      },
      admin,
      error,
      respuesta,
      pregunta,
      arrowBackOutline,
      handLeftOutline,
      refreshOutline,
      paperPlaneOutline,
      podiumOutline,
      createOutline,
      addOutline
    };
  },
};
</script>
