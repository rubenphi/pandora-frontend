<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button
            v-if="cuestionario.id != 0"
            :href="
              '/cuestionarios/' +
              cuestionario.course.id +
              '/' +
              cuestionario.area.id +
              '/' +
              periodoSelected +
              '/' +
              year
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
          <ion-buttons v-if="admin" slot="end">
            <ion-button
              v-if="allVisible == false"
              @click="marcarTodoDisponibleVisible"
            >
              <ion-icon :icon="lockOpenOutline"></ion-icon>
            </ion-button>
            <ion-button
              v-if="allVisible == true"
              @click="marcarTodoDisponibleVisible"
            >
              <ion-icon :icon="lockClosedOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
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
            cuestionario.topic
          }}</ion-card-title>
          <ion-card-subtitle class="ion-text-center"
            >Ver Resultados</ion-card-subtitle
          >
        </ion-card-header>
      </ion-card>
      <ion-card class="ion-padding" v-if="cuestionario.questions">
        <ion-card-subtitle class="ion-text-center"
          >Preguntas de Seleccion Múltiple
        </ion-card-subtitle>
        <ion-list>
          <ion-item
            v-for="(question, index) in cuestionario.questions"
            :key="question.id"
            :href="'/pregunta/' + question.id"
          >
            <ion-icon
              v-if="question.available == false"
              slot="start"
              :icon="lockClosedOutline"
            ></ion-icon>
            <ion-icon
              v-if="question.available == true"
              slot="start"
              :icon="lockOpenOutline"
            ></ion-icon>
            <ion-label>
              <b>{{
                numeroOrdinal(index, question.title) + ". " + question.title
              }}</b></ion-label
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
        <ion-button
          :href="'/cuestionario/importar/' + cuestionario.id"
          expand="full"
          fill="outline"
          shape="round"
          color="medium"
          class="ion-align-self-center"
        >
          <ion-icon :icon="downloadOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-content>
  </ion-page>
</template>
<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, adminOprofesor, numeroOrdinal } from "../globalService";

import {
  lockClosedOutline,
  lockOpenOutline,
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  createOutline,
  addOutline,
  downloadOutline,
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
    const periodoSelected = ref();
    const year = ref();
    const allVisible = ref(false);
    const mroute = useRoute();
    const { id } = mroute.params;

    let cuestionario = ref(JSON.parse(localStorage.getItem("lessonSelected")));

    onIonViewDidEnter(async () => {
      periodoSelected.value = JSON.parse(
        localStorage.getItem("periodoSelected")
      );

      tokenHeader();

      if (cuestionario.value.id !== id) {
        await axios.get(`/lessons/${id}`).then((response) => {
          localStorage.setItem("lessonSelected", JSON.stringify(response.data));
          cuestionario.value = response.data;
          year.value = cuestionario.value.year;
        });
      }

      await axios.get(`/lessons/${id}/questions`).then((response) => {
        cuestionario.value.questions = response.data.filter((i) => i.exist);
        if (!admin) {
          cuestionario.value.questions = cuestionario.value.questions.filter(
            (i) => i.visible
          );
        } else {
          cuestionario.value.questions = cuestionario.value.questions.map(
            (pregunta) => ({
              available: pregunta.available,
              visible: pregunta.visible,
              id: pregunta.id,
              title: pregunta.title,
            })
          );
          if (
            cuestionario.value.questions.filter((i) => i.visible).length ===
              cuestionario.value.questions.length &&
            cuestionario.value.questions.filter((i) => i.available).length ===
              cuestionario.value.questions.length
          ) {
            allVisible.value = true;
          }
        }
      });
    });

    const marcarTodoDisponibleVisible = async function () {
      if (!cuestionario.value.questions.length) {
        return;
      }

      for (const pregunta of cuestionario.value.questions) {
        try {
          await axios.patch(
            `http://localhost:3000/questions/${pregunta.id}`,
            {
              lessonId: cuestionario.value.id,
              visible: pregunta.visible ? false : true,
              available: pregunta.available ? false : true,
              instituteId: cuestionario.value.institute.id,
            },
            tokenHeader()
          );
          //reload page
          window.location.reload();
        } catch (error) {
          console.error(`Error al actualizar pregunta ${pregunta.id}:`, error);
        }
      }
    };

    return {
      allVisible,
      marcarTodoDisponibleVisible,
      admin,
      cuestionario,
      id,
      periodoSelected,
      arrowBackOutline,
      handLeftOutline,
      refreshOutline,
      createOutline,
      addOutline,
      lockClosedOutline,
      lockOpenOutline,
      downloadOutline,
      year,
      numeroOrdinal,
    };
  },
};
</script>
