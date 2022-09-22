<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button
            v-if="pregunta.cuestionario_id != 0"
            :href="'/cuestionario/' + pregunta.cuestionario_id"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons v-if="resVisible == 1" slot="end" class="ion-margin-end">
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
          <ion-card-subtitle class="ion-text-center">
            Esta pregunta vale: + {{ pregunta.valor }} puntos, {{ countDown }}
          </ion-card-subtitle>
          <ion-icon slot="end" :icon="createOutline"></ion-icon>
        </ion-card-header>
      </ion-card>
      <ion-card v-if="pregunta.photo">
        <ion-img :src="basedeURL + pregunta.photo"></ion-img>
      </ion-card>

      <ion-card>
        <div class="ion-padding" v-html="pregunta.enunciado"></div>
        <ion-item v-if="admin" button :href="'/editar/pregunta/' + pregunta.id">
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
              <ion-icon
                v-if="opcion.correcto == true"
                slot="start"
                color="success"
                :icon="createOutline"
              ></ion-icon>
              <ion-icon
                v-if="opcion.correcto == false"
                slot="start"
                :icon="createOutline"
              ></ion-icon>
            </ion-item>
          </div>
        </ion-list>
      </ion-card>

      <ion-buttons
        v-if="!admin"
        class="ion-justify-content-center ion-padding-top ion-padding-bottom"
      >
        <ion-button
          id="enviarRespuesta"
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
      valor: "",
      enunciado: "",
      tiempo: "",
      cuestionario_id: 0,
      opciones: {
        enunciado: "",
      },
    });
    const src = ref("");
    const respuesta = ref({
      opcion_id: "",
      pregunta_id: "",
      grupo_id: "",
      user_id: "",
      existe: 0,
    });
    const respuestas = ref([]);
    const error = ref({
      estatus: 0,
      data: "",
    });
    const resVisible = ref(0);
    const countDown = ref("");
    const downloadTimer = ref(0);
    const timeleft = ref(0);
    onIonViewDidEnter(async () => {
      tokenHeader();

      await axios.get("/preguntas/" + id).then((response) => {
        pregunta.value = response.data;
        timeleft.value = pregunta.value.tiempo;
        if (!pregunta.value.photo) {
          src.value = defaultFile("thumbnail");
        }
        var rem = new RegExp("<p></p>", "g");
        pregunta.value.enunciado = pregunta.value.enunciado.replace(
          rem,
          "</br>"
        );
      });

      await axios.get("/respuestas/pregunta/" + id).then((response) => {
        respuestas.value = response.data;
        respuestas.value.forEach(function (item) {
          if (item.grupo_id == usuarioGet().grupo_id || admin) {
            resVisible.value = 1;
          }
        });
      });
      if (admin) {
        resVisible.value = 1;
      }

      downloadTimer.value = setInterval(function () {
        if ((timeleft.value <= 0) & !admin & (resVisible.value == 0)) {
          const index = Math.floor(
            Math.random() * (pregunta.value.opciones.length - 1)
          );
          if (pregunta.value.opciones[index]) {
            respuesta.value.opcion_id = pregunta.value.opciones[index].id;
            document.getElementById("enviarRespuesta").click();
          }
        } else if (timeleft.value <= 0) {
          clearInterval(this.downloadTimer);
          countDown.value = "¡Responde!";
        } else {
          countDown.value =
            "Tienes " + timeleft.value + " segundos para responder";
        }

        if (
          (localStorage.getItem("timerOf" + pregunta.value.id) != null) &
          (timeleft.value ==
            parseInt(localStorage.getItem("timerOf" + pregunta.value.id)))
        ) {
          timeleft.value -= 1;
          localStorage.setItem(
            "timerOf" + pregunta.value.id,
            parseInt(timeleft.value)
          );
        } else if (
          localStorage.getItem("timerOf" + pregunta.value.id) == null
        ) {
          localStorage.setItem(
            "timerOf" + pregunta.value.id,
            parseInt(timeleft.value)
          );
        } else {
          timeleft.value = localStorage.getItem("timerOf" + pregunta.value.id);
        }
      }, 1000);
    });

    return {
      countDown,
      timeleft,
      resVisible,
      pregunta,
      async responder() {
        if (respuesta.value.opcion_id == "") {
          error.value.estatus = 1;
          error.value.data = "Debe seleccionar una opción.";
        } else {
          respuesta.value.pregunta_id = pregunta.value.id;
          respuesta.value.grupo_id = usuarioGet().grupo_id;
          respuesta.value.user_id = usuarioGet().id;
          respuesta.value.existe = 1;
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
