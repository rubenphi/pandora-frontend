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
    <ion-content v-if="cuestionario != null" :fullscreen="true">
      <ion-list >

      <ion-item v-if="error.status == 1">
          <ion-label color="danger">{{error.data}}</ion-label>
        </ion-item>
        
      
        <ion-item>
          <ion-label position="stacked">Fecha</ion-label>
          <ion-input v-model="cuestionario.fecha" type="date"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Tema</ion-label>
          <ion-input v-model="cuestionario.tema" type="text"></ion-input>
        </ion-item>
        
      
      </ion-list>
                <ion-buttons class="ion-justify-content-center ion-padding-top ion-padding-bottom">
            <ion-button
              expand="full"
              fill="outline"
              shape="round"
              color="primary"
              class="ion-align-self-center"
              @click="crearCuestionario"
            >
              <ion-label class="ion-text-center ion-padding">
                {{boton}}
              </ion-label>
            </ion-button>
          </ion-buttons>

    </ion-content>
  </ion-page>
</template>
<script>
import axios from "axios";
import { ref } from "vue";
import { useRoute } from 'vue-router';
import router from "../router";

import {  usuarioGet } from "../globalService";
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
    IonInput
  },
  setup() {
    const mroute = useRoute();
    const { curso } = mroute.params;
    const { id } = mroute.params;
    const cuestionario = ref ();
    const boton = ref();
    const error = ref({
      estatus: 0,
      data: "",
    });
    

    let usuario = usuarioGet();
    
 onIonViewWillEnter( async () => {
      if(id != undefined){
        boton.value = "Actualizar cuestionario";
      await  axios.get("/cuestionarios/" + id).then((response) => {
        cuestionario.value = response.data;
      });
      
      }
      if ( curso != undefined){
        boton.value = "Crear cuestionario";
      cuestionario.value = {
      fecha: '',
      tema: '',
      usuario_id: '',
      curso_id: ''
        }
      }
    });
    

    return {
      async crearCuestionario(){
        if(cuestionario.value.fecha == '' || cuestionario.value.tema == ''){
          error.value.estatus = 1;
          error.value.data = "Debe seleccionar una fecha y añadir el tema";
        }
        else if (curso != undefined) {
       cuestionario.value.usuario_id = usuario.id;
       cuestionario.value.curso_id = curso;
       await axios.post("/cuestionarios", cuestionario.value).then((response) => {
            router.push("/cuestionarios/" + curso);
            localStorage.setItem('error' ,response.data.message)
          }).catch((response) => {
            localStorage.setItem('error' ,response.message)
            error.value.estatus = 1;
            error.value.data = "Error: no se pudo añadir el cuestionario";
          })

        }
        else if (id != undefined) {
       await axios.put("/cuestionarios/" + id, cuestionario.value).then((response) => {
            router.push("/cuestionario/" + id);
            localStorage.setItem('error' ,response.data.message)
          }).catch((response) => {
            localStorage.setItem('error' ,response.message)
            error.value.estatus = 1;
            error.value.data = "Error: no se pudo actualizar el cuestionario";
          })

        }
      },
      
      actualizar cuestionarios

      arrowBackOutline,
      curso,
      usuario,
      error,
      cuestionario,
      boton
    };
  },
};
</script>
