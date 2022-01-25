<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-if="curso" :href="'/cuestionarios/' + curso">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
          <ion-button v-if="id" :href="'/cuestionario/' + cuestionario.id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="crearCuestionario">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Cuestionario</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="cuestionario != null" :fullscreen="true">
      <ion-list >

      <ion-item v-if="error.estatus == 1">
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
         <ion-item class="ion-text-center" v-if="id && cuestionario.existe == 1"  button color="danger" @click="borrarCuestionario(0)" >
          <ion-label >Borrar Cuestionario</ion-label>
        </ion-item>
         <ion-item class="ion-text-center" v-if="id && cuestionario.existe == 0"  button color="success" @click="borrarCuestionario(1)" >
          <ion-label >Recuperar Cuestionario</ion-label>
        </ion-item>

      
      </ion-list>
         
  </div>
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
  IonInput,
  IonIcon,
  IonButton,
  IonButtons
} from "@ionic/vue";

import {
  arrowBackOutline,
  checkmarkOutline,
  trashOutline
} from "ionicons/icons";


export default {
  components: {
    IonButton,
  IonButtons,
    IonIcon,
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
    const { area } = mroute.params; 
    const { id } = mroute.params;
    const cuestionario = ref ({
      id: 0,
      curso_id: 0
    });
    const error = ref({
      estatus: 0,
      data: "",
    });
    

    let usuario = usuarioGet();
    
 onIonViewWillEnter( async () => {
      if(id != undefined){
        await axios.get("/cuestionarios/" + id).then((response) => {
        cuestionario.value = response.data;
      });
      
      }
      if ( curso != undefined && area != undefined ){
      cuestionario.value = {
      fecha: '',
      tema: '',
      usuario_id: '',
      curso_id: '',
      area_id: '',
      existe: 1
        }
      }
    });
    

    return {
       borrarCuestionario(valor){
        cuestionario.value.existe = valor;
        this.crearCuestionario();
      },     
      async crearCuestionario(){
        if(cuestionario.value.fecha == '' || cuestionario.value.tema == ''){
          error.value.estatus = 1;
          error.value.data = "Debe seleccionar una fecha y añadir el tema";
          
        }
        else if (curso != undefined) {
       cuestionario.value.usuario_id = usuario.id;
       cuestionario.value.curso_id = curso;
       cuestionario.value.area_id = area;
       await axios.post("/cuestionarios", cuestionario.value).then((response) => {
         router.push("/cuestionarios/" + curso + '/' + area );
            localStorage.setItem('error' ,response.data.message)
          }).catch((response) => {
            localStorage.setItem('error' ,response.message)
            error.value.estatus = 1;
            error.value.data = "Error: no se pudo añadir el cuestionario";
          })

        }
        else if (id != undefined) {
        
       await axios.put("/cuestionarios/" + id, cuestionario.value).then((response) => {
           if(cuestionario.value.existe == 1){
             router.push("/cuestionario/" + id);
           } else {
             router.push("/cuestionarios/" + cuestionario.value.curso_id + '/' + cuestionario.value.area_id ); 
           }
            localStorage.setItem('error' ,response.data.message)
          }).catch((response) => {
            localStorage.setItem('error' ,response.message)
            error.value.estatus = 1;
            error.value.data = "Error: no se pudo actualizar el cuestionario";
          })

        }
      },
      area,
      arrowBackOutline,
      trashOutline,
      curso,
      id,
      usuario,
      error,
      cuestionario,
      checkmarkOutline
    };
  },
};
</script>
