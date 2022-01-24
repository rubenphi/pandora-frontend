<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-if="pregunta" :href="'/pregunta/' + pregunta">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
          <ion-button v-if="id" :href="'/pregunta/' + opcion.pregunta_id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="crearOpcion">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Opción</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="opcion != null" :fullscreen="true">
        <ion-list>
          <ion-item v-if="error.estatus == 1">
            <ion-label :color="error.color">{{ error.data }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Letra o Identificador</ion-label>
            <ion-input v-model="opcion.letra" type="text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Enunciado</ion-label>
            <ion-input v-model="opcion.enunciado" type="text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked"
              >Marcar opción como correcta:</ion-label
            >
            <ion-toggle
              slot="end"
              :checked="opcion.correcto"
              v-model="opcion.correcto"
            >
            </ion-toggle>
          </ion-item>
         <ion-item class="ion-text-center" v-if="id && opcion.existe == 1"  button color="danger" @click="borrarOpcion(0)" >
          <ion-label >Borrar Opción</ion-label>
        </ion-item>
        <ion-item class="ion-text-center" v-if="id && opcion.existe == 0"  button color="success" @click="borrarOpcion(1)" >
          <ion-label >Recuperar Opción</ion-label>
        </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>
<script>
import axios from "axios";
import { ref } from "vue";
import { useRoute } from "vue-router";
import router from "../router";

import { usuarioGet } from "../globalService";
import {
  onIonViewWillEnter,
  IonToggle,
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
  IonButtons,
} from "@ionic/vue";

import { arrowBackOutline, checkmarkOutline } from "ionicons/icons";

export default {
  components: {
    IonButton,
    IonButtons,
    IonToggle,
    IonIcon,
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
    const { pregunta } = mroute.params;
    const { id } = mroute.params;
    const opcion = ref({
      id: 0,
      pregunta_id: 0,
    });
    const error = ref({
      estatus: 0,
      data: "",
      color: "",
    });

    let usuario = usuarioGet();

    onIonViewWillEnter(async () => {
      if (id != undefined) {
        await axios.get("/opciones/" + id).then((response) => {
          opcion.value = response.data;
        });
      }
      if (pregunta != undefined) {
        opcion.value = {
          enunciado: "",
          correcto: 0,
          letra: "",
          pregunta_id: "",
          existe: 1
        };
      }
    });

    return {
      borrarOpcion(valor){
        opcion.value.existe = valor;
        this.crearOpcion();
      }, 
      async crearOpcion() {
        if (opcion.value.letra == "" || opcion.value.enunciado == "") {
          error.value.estatus = 1;
          error.value.data = "Debe seleccionar una fecha y añadir el tema";
        } else if (pregunta != undefined) {
          opcion.value.pregunta_id = pregunta;
          await axios
            .post("/opciones", opcion.value)
            .then((response) => {
              router.push("/pregunta/" + pregunta);
              localStorage.setItem("error", response.data.message);
            })
            .catch((response) => {
              localStorage.setItem("error", response.message);
              error.value.estatus = 1;
              error.value.color = "danger";
              error.value.data = "Error: no se pudo añadir el cuestionario";
            });
        } else if (id != undefined) {
          await axios
            .put("/opciones/" + id, opcion.value)
            .then((response) => {
              error.value.estatus = 1;
              error.value.data = "Opcion actualizada";
              error.value.color = "success";
              localStorage.setItem("error", response.data.message);
              setTimeout(function () {
                router.push("/pregunta/" + opcion.value.pregunta_id);
              }, 500);
            })
            .catch((response) => {
              localStorage.setItem("error", response.message);
              error.value.estatus = 1;
              error.value.color = "danger";
              error.value.data = "Error: no se pudo actualizar el cuestionario";
            });
        }
      },
      arrowBackOutline,
      pregunta,
      id,
      usuario,
      error,
      opcion,
      checkmarkOutline,
    };
  },
};
</script>
