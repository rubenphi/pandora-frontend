<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/inicio"></ion-back-button>
        </ion-buttons>
        <ion-title>Lector OMR</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="!isScanning">
        <ion-button expand="block" @click="startScan">
          Escanear de nuevo
        </ion-button>

        <div v-if="scanImageUrl" class="scan-result-container">
          <h3>Imagen del Escaneo</h3>
          <img
            :src="scanImageUrl"
            alt="Resultado del escaneo OMR"
            class="scan-result-image"
          />
        </div>

        <ion-item>
          <ion-label position="stacked"
            >Resultados del Escaneo (JSON)</ion-label
          >
          <ion-textarea
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
  IonBackButton,
  IonButton,
  IonTextarea,
  IonLabel,
  IonItem,
} from "@ionic/vue";
import { ref, nextTick } from "vue";
import OmrScanner from "@/components/OmrScanner.vue";

export default {
  name: "OmrRead",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonTextarea,
    IonLabel,
    IonItem,
    OmrScanner,
  },
  setup() {
    const isScanning = ref(false);
    const scanResults = ref("");
    const scanImageUrl = ref(null);
    const scannerComponent = ref(null);

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

    return {
      isScanning,
      scanResults,
      scanImageUrl,
      scannerComponent,
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
