<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button href="/cuestionarios">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title size="large" class="ion-text-center">20-03-2011</ion-title>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button href="/cuestionario">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card href="/ganadores">
        <ion-card-header>
          <ion-card-title class="ion-text-center"
            >{{cuestionario.tema}}</ion-card-title
          >
          <ion-card-subtitle class="ion-text-center"
            >Ver Resultados</ion-card-subtitle
          >
        </ion-card-header>
      </ion-card>
      <ion-card>
        <ion-list>
          <ion-item href="/pregunta">
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item href="/pregunta">
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item href="/pregunta">
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >¿Cuál de los siguientes documentos corresponde al a la
              información entregada en el siguiente enunciado?</ion-label
            >
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="handLeftOutline"></ion-icon>
            <ion-label
              >Los presentes textos corresponden a un tipo de texto, analice las
              diferentes características del texto e identifique a qué tipo de
              text corresponde</ion-label
            >
          </ion-item>
        </ion-list>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader} from "../globalService";
import router from "../router";
import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
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
  IonCardTitle,
  IonCardSubtitle,
  onIonViewWillEnter
} from "@ionic/vue";

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
    IonCardSubtitle,
  },
  setup() {
    const cuestionario = ref();
    onIonViewWillEnter(() => {
      tokenHeader();
      axios.get("/cuestionarios/" + router.params.id).then((response) => {
        cuestionario.value = response.data;
      });
    });

    return {
      arrowBackOutline,
      handLeftOutline,
      refreshOutline,
    };
  },
};
</script>
