<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center">{{
          pregunta.title
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
              (index === 0) & admin || (index === 0) 
            "
            :icon="ribbonOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-icon
            v-else-if="
              (respuesta.points > 0) & admin ||
              (respuesta.points > 0) 
            "
            :icon="happyOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-icon
            v-else-if="
              (respuesta.points <= 0) & admin ||
              (respuesta.points <= 0)  
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

          <ion-label color="medium">{{ respuesta.group.name }}</ion-label>
          <ion-note slot="end">
            <ion-text
              v-if="
                (respuesta.points > 0) & admin ||
                (respuesta.points > 0) 
              "
              color="success"
              ><h6>Obtienen: +{{ respuesta.points }}</h6></ion-text
            >
            <ion-text
              v-else-if="
                admin & (respuesta.points <= 0) ||
                  (respuesta.points <= 0)
              "
              color="danger"
              ><h6>Obtienen: {{ respuesta.points }}</h6></ion-text
            >
            <ion-text v-else color="warning"><h6>Obtienen: ?</h6></ion-text>
            <ion-text v-if="admin || grupoUsuario.id == respuesta.group.id " color="warning"
              ><h6>Respuesta: {{ respuesta.option.identifier }}  </h6></ion-text
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
    const grupoUsuario = ref(
      JSON.parse(localStorage.getItem("grupoUsuario"))
    );
    const { id } = mroute.params;
    const respuestas = ref([
      {
        id: "Cargando",
        group: { name: "Cargando" },
        points: 0,
        option: {
          identifier: "Cargando",
        },
      },
    ]);
    const pregunta = ref({ title: "Cargando..." });

    onIonViewDidEnter(async () => {
      tokenHeader();
      await axios.get("/questions/" + id).then((response) => {
        pregunta.value = { title: response.data.title};
      });
      await axios.get("/questions/" + id + "/answers").then((response) => {
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
      grupoUsuario,
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
