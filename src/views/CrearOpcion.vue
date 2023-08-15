<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-if="pregunta" :href="'/pregunta/' + pregunta">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
          <ion-button v-if="id" :href="'/pregunta/' + opcion.questionId">
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
            <ion-input v-model="opcion.identifier" type="text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Enunciado</ion-label>
            <ion-input v-model="opcion.sentence" type="text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked"
              >Marcar opción como correcta:</ion-label
            >
            <ion-toggle
              slot="end"
              :checked="opcion.correct"
              v-model="opcion.correct"
            >
            </ion-toggle>
          </ion-item>
          <ion-item
            class="ion-text-center"
            v-if="id && opcion.exist == true"
            button
            color="danger"
            @click="borrarOpcion(0)"
          >
            <ion-label>Borrar Opción</ion-label>
          </ion-item>
          <ion-item
            class="ion-text-center"
            v-if="id && opcion.exist == false"
            button
            color="success"
            @click="borrarOpcion(1)"
          >
            <ion-label>Recuperar Opción</ion-label>
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

import { usuarioGet, tokenHeader } from "../globalService";
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
      questionId: 0,
    });
    const error = ref({
      estatus: 0,
      data: "",
      color: "",
    });

    let usuario = usuarioGet();

    onIonViewWillEnter(async () => {
      tokenHeader();
      if (id != undefined) {
        await axios.get("/options/" + id).then((response) => {
          const questionId = response.data.question.id;
          delete response.data.id;
          delete response.data.createdAt;
          delete response.data.updatedAt;

          delete response.data.question;
          delete response.data.institute;
          opcion.value = { ...response.data, questionId };
        });
      }
      if (pregunta != undefined) {
        opcion.value = {
          sentence: "",
          correct: false,
          indentifier: "",
          questionId: "",
          instituteId: usuarioGet().institute.id,
          exist: true,
        };
      }
    });

    return {
      borrarOpcion(valor) {
        opcion.value.existe = valor;
        this.crearOpcion();
      },
      async crearOpcion() {
        if (opcion.value.identifier == "" || opcion.value.sentence == "") {
          error.value.estatus = 1;
          error.value.data = "Debe añadir un identificador y un enunciado";
        } else if (pregunta != undefined) {
          opcion.value.questionId = pregunta;
          await axios
            .post("/options", [opcion.value])
            .then((response) => {
              router.push("/pregunta/" + pregunta);
              localStorage.setItem("error", response.data.message);
            })
            .catch((response) => {
              localStorage.setItem("error", response.data.message);
              error.value.estatus = 1;
              error.value.color = "danger";
              error.value.data = response.data.message;
            });
        } else if (id != undefined) {
          await axios
            .patch("/options/" + id, opcion.value)
            .then((response) => {
              error.value.estatus = 1;
              error.value.data = "Opcion actualizada";
              error.value.color = "success";
              localStorage.setItem("error", response.data.message);
              setTimeout(function () {
                router.push("/pregunta/" + response.data.question.id);
              }, 500);
            })
            .catch((fallo) => {
              console.log(fallo.response);
              localStorage.setItem("error", fallo.response.data.message);
              error.value.estatus = 1;
              error.value.color = "danger";
              error.value.data = fallo.response.data.message;
              console.log(error.value);
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
