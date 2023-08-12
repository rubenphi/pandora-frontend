<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center">{{
          pregunta.titulo
        }}</ion-title>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button v-if="id" :href="'/pregunta/' + id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button v-if="id" :href="'/resultado/' + id">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item
          v-for="(respuesta, index) in respuestas"
          :key="respuesta.id"
          lines="full"
          class="ion-padding-end"
        >
          <ion-icon
            v-if="
              (index === 0) & admin || (index === 0) & (pregunta.revelada == 1)
            "
            :icon="ribbonOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-icon
            v-else-if="
              (respuesta.puntaje > 0) & admin ||
              (respuesta.puntaje > 0) & (pregunta.revelada == 1)
            "
            :icon="happyOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-icon
            v-else-if="
              (respuesta.puntaje <= 0) & admin ||
              (respuesta.puntaje <= 0) & (pregunta.revelada == 1)
            "
            :icon="sadOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-icon
            v-else
            :icon="helpCircleOutline"
            size="large"
            slot="start"
          ></ion-icon>

          <ion-label color="medium">{{ respuesta.grupo.nombre }}</ion-label>
          <ion-note slot="end">
            <ion-text
              v-if="
                (respuesta.puntaje > 0) & admin ||
                (respuesta.puntaje > 0) & (pregunta.revelada == 1)
              "
              color="success"
              ><h6>Obtienen: +{{ respuesta.puntaje }}</h6></ion-text
            >
            <ion-text
              v-else-if="
                admin & (respuesta.puntaje <= 0) ||
                (pregunta.revelada == 1) & (respuesta.puntaje <= 0)
              "
              color="danger"
              ><h6>Obtienen: {{ respuesta.puntaje }}</h6></ion-text
            >
            <ion-text v-else color="warning"><h6>Obtienen: ?</h6></ion-text>
            <ion-text v-if="admin || pregunta.revelada == 1" color="warning"
              ><h6>Respuesta: {{ respuesta.opcion.letra }}</h6></ion-text
            >
            <ion-text v-else color="primary"><h6>Respuesta: ?</h6></ion-text>
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
          @click="updateTime"
        >
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-content>
  </ion-page>
</template>

<script>
import { useRoute } from "vue-router";
import router from "../router";
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, adminOprofesor } from "../globalService";

import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  paperPlaneOutline,
  happyOutline,
  sadOutline,
  ribbonOutline,
  addOutline,
  helpCircleOutline,
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
  IonTitle,
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
    const respuestas = ref([
      {
        id: "Cargando",
        grupo: { nombre: "Cargando" },
        puntaje: 0,
        opcion: {
          letra: "Cargando",
        },
      },
    ]);
    const pregunta = ref({ titulo: "Cargando..." });

    onIonViewDidEnter(async () => {
      tokenHeader();
      await axios.get("/preguntas/" + id).then((response) => {
        pregunta.value = response.data;
      });
      await axios.get("/respuestas/pregunta/" + id).then((response) => {
        respuestas.value = response.data;
      });
    });

    return {
      admin,
      id,
      async bonus() {
        await axios
          .post("/respuestas/bonus/pregunta/" + id)
          .then((response) => {
            localStorage.setItem("error", response);
          });
        window.location.reload();
  
      },
      async updateTime() {
        pregunta.value.tiempo = 15;
        pregunta.value.revelada = true;
        await axios
          .post("/preguntas/update/" + id, pregunta.value, {})
          .then((response) => {
            router.push("/pregunta/" + id);

            localStorage.setItem("error", response.data.message);
          })
          .catch(() => {
            router.push("/cuestionario/" + pregunta.value.cuestionario_id);
          });
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
      pregunta,
      helpCircleOutline,
    };
  },
};
</script>
