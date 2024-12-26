<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center">{{
          cuestionario.topic
        }}</ion-title>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button v-if="id" :href="'/cuestionario/' + id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button v-if="id" :href="'/ganadores/' + id">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button v-if="usuario?.rol == 'admin'" @click="ordenarPorNombre">
            <ion-icon :icon="arrowDownCircle"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item
          v-for="(respuesta, index) in respuestas"
          :key="index"
          lines="full"
          class="ion-padding-end"
        >
          <ion-icon
            v-if="index === 0 && respuesta.points > 0"
            :icon="trophyOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-icon
            v-else-if="respuesta.nota >= 3"
            :icon="happyOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-icon
            v-else
            :icon="sadOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-label color="medium">{{ respuesta.group.name }}</ion-label>
          <ion-note slot="end">
            <ion-text v-if="index === 0" color="warning">
              <h6>
                <ion-icon :icon="starOutline"></ion-icon>GANADOR<ion-icon
                  :icon="starOutline"
                ></ion-icon>
              </h6>
            </ion-text>
            <ion-text v-if="respuesta.points > 0" color="success">
              <h6>Total Puntos: {{ respuesta.points }}</h6>
            </ion-text>
            <ion-text v-else color="danger">
              <h6>Total Puntos: {{ respuesta.points }}</h6>
            </ion-text>
            <ion-text
              v-if="
                respuesta?.group?.id === usuario?.grupo?.id ||
                usuario?.rol == 'admin'
              "
            >
              Nota: {{ parseFloat(respuesta.nota).toFixed(1) }}
            </ion-text>
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
          @click="registrarNotas"
        >
          Registrar notas <ion-icon :icon="fileTrayFullOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { adminOprofesor } from "../globalService";
import { ref } from "vue";
import { usuarioGet, tokenHeader } from "../globalService";
import { useRoute } from "vue-router";

import {
  arrowBackOutline,
  refreshOutline,
  arrowDownCircle,
  handLeftOutline,
  paperPlaneOutline,
  happyOutline,
  sadOutline,
  ribbonOutline,
  starOutline,
  trophyOutline,
  fileTrayFullOutline,
} from "ionicons/icons";

import {
  IonTitle,
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
    const usuario = ref();
    const admin = adminOprofesor();
    const mroute = useRoute();
    const { id } = mroute.params;
    const cuestionario = ref(
      JSON.parse(localStorage.getItem("lessonSelected"))
    );
    const respuestas = ref([
      { group: { name: "Cargando", id: 0 }, points: "Cargando" },
    ]);

    const ordenarPorNombre = () => {
      respuestas.value.sort((a, b) => {
        // Extraer el texto y el número del nombre del grupo
        const regex = /(\D+)(\d+)/;
        const [, textA, numberA] = a.group.name.match(regex);
        const [, textB, numberB] = b.group.name.match(regex);

        // Comparar el texto
        const textComparison = textA.localeCompare(textB);
        if (textComparison !== 0) {
          return textComparison;
        }

        // Si el texto es el mismo, comparar el número como número en lugar de cadena
        return parseInt(numberA) - parseInt(numberB);
      });
    };
    onIonViewDidEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();
      await axios.get(`/lessons/${id}/results`).then((response) => {
        respuestas.value = response.data.map((e) => {
          e.points = parseFloat(e.points);
          e.nota = e.points != 0 ? (e.points * 5) / response.data[0].points : 0;
          e.nota = e.nota < 0 ? 0 : e.nota;
          return e;
        });
      });
    });

    async function registrarNotas() {
      for (const respuesta of respuestas.value) {
        //search users of the group
        const response = await axios.get(`/groups/${respuesta.group.id}/users`);
        for (const user of response.data) {
          const data = {
            userId: user.id,
            lessonId: parseInt(id, 10),
            periodId: cuestionario.value.period.id,
            grade: respuesta.nota,
            instituteId: cuestionario.value.institute.id,
          };
          await axios.post("/grades", data);
        }
      }
    }

    return {
      usuario,
      id,
      cuestionario,
      respuestas,
      registrarNotas,
      arrowBackOutline,
      handLeftOutline,
      paperPlaneOutline,
      refreshOutline,
      arrowDownCircle,
      happyOutline,
      sadOutline,
      ribbonOutline,
      starOutline,
      trophyOutline,
      ordenarPorNombre,
      admin,
      fileTrayFullOutline,
    };
  },
};
</script>
