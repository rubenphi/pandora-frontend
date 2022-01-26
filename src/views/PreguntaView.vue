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
          <ion-card-title class="ion-text-center">
            {{ pregunta.titulo }}
          </ion-card-title>
          <ion-card-subtitle class="ion-text-center" >
            Esta pregunta vale: + {{ pregunta.valor }} puntos
          </ion-card-subtitle>
          <ion-icon slot="end" :icon="createOutline"></ion-icon>
        </ion-card-header>
      </ion-card>
      <ion-card v-if="pregunta.photo">
        <ion-img :src="basedeURL + pregunta.photo"></ion-img>
      </ion-card>

      <ion-card>
      <div class="ion-padding" v-html="pregunta.enunciado" >
      </div>
      <ion-item v-if="admin" button  :href="'/editar/pregunta/' + pregunta.id">
        <ion-icon slot="end" :icon="createOutline"></ion-icon>
      </ion-item>
      </ion-card>
      <ion-card class="ion-padding-top ion-padding-bottom">
        <ion-card-subtitle v-if="error.estatus === 0" class="ion-text-center">
          Selecciona tu respuesta
        </ion-card-subtitle>
        <ion-list>
          <ion-item v-if="error.estatus === 1" color="danger">
            <ion-label>
              {{ error.data }}
            </ion-label>
          </ion-item>
          <div v-if="!admin">
            <ion-radio-group v-model="respuesta.opcion_id">
              <ion-item
                lines="none"
                v-for="opcion in pregunta.opciones"
                :key="opcion.id"
              >
                <ion-label class="ion-text-wrap"
                  ><b>{{ opcion.letra }}. </b> {{ opcion.enunciado }}</ion-label
                >

                <ion-radio
                  slot="start"
                  :value="opcion.id"
                  :id="opcion.id"
                ></ion-radio>
              </ion-item>
            </ion-radio-group>
          </div>
          <div v-if="admin">
            <ion-item
              button
              lines="none"
              v-for="opcion in pregunta.opciones"
              :key="opcion.id"
              :href="'editar/opcion/' + opcion.id"
            >
              <ion-label class="ion-text-wrap"
                ><b>{{ opcion.letra }}. </b> {{ opcion.enunciado }}</ion-label
              >
              <ion-icon slot="start" :icon="createOutline"></ion-icon>
            </ion-item>
          </div>
        </ion-list>
      </ion-card>

      <ion-buttons
        v-if="!admin"
        class="ion-justify-content-center ion-padding-top ion-padding-bottom"
      >
        <ion-button
          expand="full"
          fill="outline"
          shape="round"
          color="primary"
          class="ion-align-self-center"
          @click="responder"
        >
          <ion-icon slot="end" :icon="paperPlaneOutline"></ion-icon>
          <ion-label class="ion-text-center"> Enviar Respuesta </ion-label>
        </ion-button>
      </ion-buttons>

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
          :href="'crear/opcion/' + pregunta.id"
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
import {
  tokenHeader,
  usuarioGet,
  adminOprofesor,
  basedeURL,
  defaultFile,
} from "../globalService";
import { useRoute } from "vue-router";
import router from "../router";

import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  paperPlaneOutline,
  podiumOutline,
  createOutline,
  addOutline,
} from "ionicons/icons";

import {
  onIonViewDidEnter,
  IonIcon,
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  // IonCardContent,
  IonImg,
  IonRadio,
  IonLabel,
  IonRadioGroup,
  IonCardSubtitle,
  IonItem,
  IonList,
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
    // IonCardContent,
    IonImg,
    IonRadioGroup,
    IonRadio,
    IonCardSubtitle,
  },
  setup() {
    const admin = adminOprofesor();
    const mroute = useRoute();
    const { id } = mroute.params;
    const pregunta = ref({
      id: "",
      puntaje: "",
      enunciado: "",
      opciones: {
        enunciado: "",
      },
    });
    const src = ref("");
    const respuesta = ref({
      opcion_id: "",
      pregunta_id: "",
      grupo_id: "",
      user_id: ""
    });

    const error = ref({
      estatus: 0,
      data: "",
    });

    onIonViewDidEnter(async () => {
      tokenHeader();
      await axios.get("/preguntas/" + id).then((response) => {
        pregunta.value = response.data;
        if (!pregunta.value.photo) {
          src.value = defaultFile("thumbnail");
        }
        var rem = new RegExp('<p></p>','g' )
        pregunta.value.enunciado =  pregunta.value.enunciado.replace(rem , '</br>');
      });
    });

    return {
      async responder() {
        if (respuesta.value.opcion_id == "") {
          error.value.estatus = 1;
          error.value.data = "Debe seleccionar una opción.";
        } else {
          respuesta.value.pregunta_id = pregunta.value.id;
          respuesta.value.grupo_id = usuarioGet().grupo_id;
          respuesta.value.user_id = usuarioGet().id;
          await axios
            .post("/respuestas", respuesta.value)
            .then((response) => {
              router.push("/resultado/" + pregunta.value.id);
              localStorage.setItem("error", response.data.message);
            })
            .catch((response) => {
              localStorage.setItem("error", response.message);
              error.value.estatus = 1;
              error.value.data =
                "Error: ya respondiste la pregunta o no se te permite responder";
            });
        }
      },
      basedeURL: basedeURL(),
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
      addOutline,
    };
  },
};
</script>
