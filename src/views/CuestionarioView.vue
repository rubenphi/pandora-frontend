<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button
            v-if="cuestionario.id != 0"
            :href="
              '/cuestionarios/' +
              cuestionario.curso_id +
              '/' +
              cuestionario.area_id
            "
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title size="large" class="ion-text-center">{{
          cuestionario.fecha
        }}</ion-title>
        <ion-buttons v-if="!admin" slot="end" class="ion-margin-end">
          <ion-button
            v-if="cuestionario.id != 0"
            :href="'/cuestionario/' + cuestionario.id"
          >
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons v-if="admin" slot="end" class="ion-margin-end">
          <ion-button
            v-if="cuestionario.id != 0"
            :href="'editar/cuestionario/' + cuestionario.id"
          >
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card
        v-if="cuestionario.id != 0"
        :href="'/ganadores/' + cuestionario.id"
      >
        <ion-card-header>
          <ion-card-title class="ion-text-center">{{
            cuestionario.tema
          }}</ion-card-title>
          <ion-card-subtitle class="ion-text-center"
            >Ver Resultados</ion-card-subtitle
          >
        </ion-card-header>
      </ion-card>
      <ion-card class="ion-padding" v-if="cuestionario.preguntas != ''">
        <ion-card-subtitle class="ion-text-center"
          >Preguntas de Seleccion Múltiple
        </ion-card-subtitle>
        <ion-list>
          <ion-item
            v-for="(pregunta, index) in cuestionario.preguntas"
            :key="pregunta.id"
            :href="'/pregunta/' + pregunta.id"
          >
            <ion-icon
              v-if="pregunta.disponible == false"
              slot="start"
              :icon="lockClosedOutline"
            ></ion-icon>
            <ion-icon
              v-if="pregunta.disponible == true"
              slot="start"
              :icon="lockOpenOutline"
            ></ion-icon>
            <ion-label>
              <b>{{ index + 1 + ". " + pregunta.titulo }}</b></ion-label
            >
          </ion-item>
        </ion-list>
      </ion-card>

      <ion-buttons
        v-if="admin"
        class="ion-justify-content-center ion-padding-top ion-padding-bottom"
      >
        <ion-button
          :href="'/crear/pregunta/' + cuestionario.id"
          expand="full"
          fill="outline"
          shape="round"
          color="medium"
          class="ion-align-self-center"
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
import { tokenHeader, adminOprofesor } from "../globalService";

import {
  lockClosedOutline,
  lockOpenOutline,
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  createOutline,
  addOutline,
} from "ionicons/icons";
import {
  IonLabel,
  IonItem,
  IonIcon,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  onIonViewDidEnter,
} from "@ionic/vue";

import { useRoute } from "vue-router";

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
    IonIcon,
    IonButtons,
    IonButton,
    IonCard,
    IonCardTitle,
    IonCardHeader,
    IonCardSubtitle,
  },
  setup() {
    const admin = adminOprofesor();
    const mroute = useRoute();
    const { id } = mroute.params;
    const cuestionario = ref({
      id: 0,
      fecha: "",
      tema: "",
      preguntas: "",
    });

    const seleccionMultiple = ref([]);
    onIonViewDidEnter(async () => {
      tokenHeader();
      await axios.get("/cuestionarios/" + id).then((response) => {
        cuestionario.value = response.data;
        if (!admin) {
          cuestionario.value.preguntas = cuestionario.value.preguntas.filter(
            (i) => i.visible === 1 && i.disponible
          );

          cuestionario.value.preguntas.forEach((pregunta) => {
            if (pregunta.tipo == "seleccionMultiple") {
              seleccionMultiple.value.push(pregunta);
            }
          });
        }
      });
    });

    return {
      admin,
      cuestionario,
      id,
      seleccionMultiple,
      arrowBackOutline,
      handLeftOutline,
      refreshOutline,
      createOutline,
      addOutline,
      lockClosedOutline,
      lockOpenOutline,
    };
  },
};
</script>
