<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="backUrl">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Escaneo de Hoja de Respuestas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-card v-if="cuestionario.id != 0">
        <ion-card-header
          style="position: relative"
          @click="goToWinners(cuestionario.id)"
        >
          <ion-card-title class="ion-text-center">{{
            cuestionario.title
          }}</ion-card-title>
          <ion-card-subtitle class="ion-text-center"
            >Las respuestas escaneadas se registrarán a este
            cuestionario</ion-card-subtitle
          >
        </ion-card-header>
      </ion-card>
      <div v-if="!isScanning">
        <ion-button expand="block" @click="startScan"> Escanear </ion-button>

        <div v-if="scanImageUrl" class="scan-result-container">
          <h3>Imagen del Escaneo</h3>
          <img
            :src="scanImageUrl"
            alt="Resultado del escaneo OMR"
            class="scan-result-image"
          />
        </div>

        <ion-item v-if="scanResults ¡=''>
          <ion-label position="stacked"
            >Resultados del Escaneo (JSON)</ion-label
          >
          <ion-textarea
          v-if="scanResults ¡=''"
            v-model="scanResults"
            readonly
            rows="10"
            placeholder="Los resultados del escaneo aparecerán aquí..."
          ></ion-textarea>
        </ion-item>
      </div>

      <div
        v-show="isScanning"
        style="
          height: 90%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        "
      >
        <omr-scanner
          ref="scannerComponent"
          @scan-complete="onScanComplete"
          @scan-cancelled="onScanCancelled"
        ></omr-scanner>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonTextarea,
  IonLabel,
  IonItem,
  onIonViewDidEnter,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonIcon,
} from "@ionic/vue";
import { ref, nextTick } from "vue";
import OmrScanner from "@/components/OmrScanner.vue";
import { tokenHeader } from "../globalService";
import axios from "axios";
import { useRoute } from "vue-router";
import { arrowBackOutline } from "ionicons/icons";

export default {
  name: "OmrRead",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonTextarea,
    IonLabel,
    IonItem,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonIcon,
    OmrScanner,
  },
  setup() {
    const route = useRoute();
    const quizId = route.params.id;
    const cuestionario = ref({});
    const isScanning = ref(false);
    const scanResults = ref("");
    const scanImageUrl = ref(null);
    const scannerComponent = ref(null);
    const backUrl = ref("/inicio");

    const startScan = async () => {
      scanImageUrl.value = null;
      scanResults.value = "";
      isScanning.value = true;
      await nextTick(); // Wait for the DOM to update after v-show
      if (scannerComponent.value) {
        scannerComponent.value.start();
      }
    };

    const onScanComplete = (payload) => {
      scanResults.value = JSON.stringify(payload.results, null, 2);
      scanImageUrl.value = payload.imageUrl;
      isScanning.value = false;
    };

    const onScanCancelled = () => {
      isScanning.value = false;
    };

    onIonViewDidEnter(async () => {
      tokenHeader();
      const response = await axios.get(`/quizzes/${quizId}`);
      cuestionario.value = {
        id: response.data.id,
        title: response.data.title,
        quizType: response.data.quizType,
        lessonId: response.data.lesson.id,
        questions: response.data.questions,
        instituteId: response.data.lesson.institute.id,
        exist: response.data.exist,
      };
      if (cuestionario.value.id) {
        backUrl.value = `/ganadores/${cuestionario.value.id}`;
      }
    });

    return {
      isScanning,
      scanResults,
      scanImageUrl,
      cuestionario,
      scannerComponent,
      arrowBackOutline,
      backUrl,
      startScan,
      onScanComplete,
      onScanCancelled,
    };
  },
};
</script>

<style scoped>
ion-textarea {
  margin-top: 10px;
  border: 1px solid var(--ion-color-medium);
  border-radius: 5px;
}
.scan-result-container {
  margin-top: 20px;
  margin-bottom: 20px;
  text-align: center;
}
.scan-result-image {
  max-width: 100%;
  border: 1px solid var(--ion-color-medium);
  border-radius: 5px;
}
</style>
