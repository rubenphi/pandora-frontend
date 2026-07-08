<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Encuesta a Padres</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="!isScanning">
        <ion-card v-if="scannedResponses.length > 0">
          <ion-card-header>
            <ion-card-title>Hojas escaneadas</ion-card-title>
            <ion-card-subtitle>
              {{ scannedResponses.length }} registro(s) acumulado(s)
            </ion-card-subtitle>
          </ion-card-header>
        </ion-card>

        <div v-if="currentResult">
          <h3>Resultado del escaneo</h3>

          <ion-item>
            <ion-label>Registro #{{ currentResult.code }}</ion-label>
          </ion-item>

          <p class="ion-padding-start ion-text-small">
            Toque las respuestas para editarlas si es necesario.
          </p>

          <!-- Q1-Q14 -->
          <ion-item lines="none">
            <ion-label class="section-title">
              <strong>Preguntas 1 a 14</strong>
            </ion-label>
          </ion-item>
          <IonList>
            <IonItem
              v-for="(item, idx) in currentResult.seccion1"
              :key="'s1-' + idx"
            >
              <IonLabel>Q{{ idx + 1 }}</IonLabel>
              <ion-select
                v-model="item.answer"
                interface="action-sheet"
                class="editable-answer-select"
              >
                <ion-select-option
                  v-for="opt in likertOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </ion-select-option>
              </ion-select>
            </IonItem>
          </IonList>

          <!-- Q15-Q18 -->
          <ion-item lines="none">
            <ion-label class="section-title">
              <strong>Preguntas 15 a 18</strong>
            </ion-label>
          </ion-item>
          <IonList>
            <IonItem
              v-for="(item, idx) in currentResult.seccion2"
              :key="'s2-' + idx"
            >
              <IonLabel>Q{{ idx + 15 }}</IonLabel>
              <ion-select
                v-model="item.answer"
                interface="action-sheet"
                class="editable-answer-select"
              >
                <ion-select-option
                  v-for="opt in likertOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </ion-select-option>
              </ion-select>
            </IonItem>
          </IonList>

          <div v-if="currentResult.imageUrl" class="scan-result-container">
            <h3>Imagen del Escaneo</h3>
            <img :src="currentResult.imageUrl" class="scan-result-image" />
          </div>
        </div>

        <ion-grid>
          <ion-row>
            <ion-col>
              <ion-button
                expand="block"
                @click="confirmResponse"
                :disabled="!currentResult"
                color="primary"
              >
                <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
                Confirmar
              </ion-button>
            </ion-col>
            <ion-col>
              <ion-button expand="block" @click="startScan">
                <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
                {{ currentResult ? "Escanear de nuevo" : "Escanear" }}
              </ion-button>
            </ion-col>
          </ion-row>
          <ion-row v-if="scannedResponses.length > 0">
            <ion-col>
              <ion-button expand="block" color="success" @click="downloadCSV">
                <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
                Descargar CSV ({{ scannedResponses.length }} registros)
              </ion-button>
            </ion-col>
          </ion-row>
          <ion-row v-if="scannedResponses.length > 0">
            <ion-col>
              <ion-button expand="block" color="danger" fill="outline" @click="resetAll">
                <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                Nuevo escaneo general
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <div v-show="isScanning" class="scanner-container">
        <omr-scanner
          ref="scannerComponent"
          templateName="parentSurvey"
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
  IonLabel,
  IonList,
  IonItem,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonIcon,
  IonCol,
  IonRow,
  IonGrid,
  IonSelect,
  IonSelectOption,
  alertController,
  onIonViewDidEnter,
} from "@ionic/vue";
import { ref, nextTick } from "vue";
import OmrScanner from "@/components/OmrScanner.vue";
import { useRouter } from "vue-router";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
import {
  arrowBackOutline,
  checkmarkOutline,
  cameraOutline,
  downloadOutline,
  trashOutline,
} from "ionicons/icons";

export default {
  name: "OmrParentSurveyReader",
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonLabel, IonList, IonItem,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonIcon, IonCol, IonRow, IonGrid, IonSelect, IonSelectOption,
    OmrScanner,
  },
  setup() {
    const router = useRouter();
    const isScanning = ref(false);
    const scannerComponent = ref(null);
    const currentResult = ref(null);
    const scannedResponses = ref([]);
    const autoCodeCounter = ref(1);
    const likertOptions = ["Nunca", "Algunas veces", "Casi siempre", "Siempre"];

    const STORAGE_KEY = "omr_parent_survey_responses";
    const COUNTER_KEY = "omr_parent_survey_counter";

    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) scannedResponses.value = JSON.parse(saved);
        const savedCounter = localStorage.getItem(COUNTER_KEY);
        if (savedCounter) autoCodeCounter.value = parseInt(savedCounter, 10);
      } catch (e) {
        console.warn("Error loading parent survey data:", e);
      }
    };

    const trySaveToStorage = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scannedResponses.value));
        localStorage.setItem(COUNTER_KEY, String(autoCodeCounter.value));
        return true;
      } catch (e) {
        return false;
      }
    };

    const resetAll = async () => {
      const alert = await alertController.create({
        header: "Nuevo escaneo general",
        message: "Se borrarán todos los datos. ¿Está seguro?",
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Borrar todo",
            role: "destructive",
            handler: () => {
              scannedResponses.value = [];
              currentResult.value = null;
              autoCodeCounter.value = 1;
              localStorage.removeItem(STORAGE_KEY);
              localStorage.removeItem(COUNTER_KEY);
            },
          },
        ],
      });
      await alert.present();
    };

    onIonViewDidEnter(() => loadFromStorage());

    const goBack = () => router.back();

    const startScan = async () => {
      currentResult.value = null;
      isScanning.value = true;
      await nextTick();
      if (scannerComponent.value) scannerComponent.value.start();
    };

    const onScanComplete = async (payload) => {
      isScanning.value = false;

      const allQuestions = payload.results
        .filter((r) => r.typeOrigin === "question")
        .flatMap((r) => r.content || []);

      const assigned = String(autoCodeCounter.value).padStart(4, "0");
      autoCodeCounter.value++;

      currentResult.value = {
        code: assigned,
        seccion1: allQuestions.slice(0, 14),
        seccion2: allQuestions.slice(14, 18),
        imageUrl: payload.imageUrl,
      };
    };

    const onScanCancelled = () => {
      isScanning.value = false;
    };

    const confirmResponse = async () => {
      if (!currentResult.value) return;

      scannedResponses.value.push({
        code: currentResult.value.code,
        seccion1: currentResult.value.seccion1,
        seccion2: currentResult.value.seccion2,
      });
      currentResult.value = null;

      if (!trySaveToStorage()) {
        const alert = await alertController.create({
          header: "Almacenado en memoria",
          message: "No se pudo guardar en almacenamiento local. Descargue el CSV antes de salir.",
          buttons: ["OK"],
        });
        await alert.present();
      } else {
        const alert = await alertController.create({
          header: "Registrado",
          message: `Respuesta almacenada (${scannedResponses.value.length} en total).`,
          buttons: ["OK"],
        });
        await alert.present();
      }
    };

    const escapeCSVCell = (str) => {
      const s = String(str);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const buildCSVString = () => {
      const headers = ["Código"];
      for (let i = 1; i <= 18; i++) {
        headers.push(`Q${i} (Nunca/Algunas veces/Casi siempre/Siempre)`);
      }

      const rows = scannedResponses.value.map((r) => {
        const row = [r.code];
        const s1 = r.seccion1 || [];
        const s2 = r.seccion2 || [];
        for (let i = 0; i < 14; i++) row.push(s1[i] ? s1[i].answer || "" : "");
        for (let i = 0; i < 4; i++) row.push(s2[i] ? s2[i].answer || "" : "");
        return row.map(escapeCSVCell).join(",");
      });

      return "\uFEFF" + [headers.join(","), ...rows].join("\n");
    };

    const downloadCSVWeb = (csvString) => {
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `encuesta_padres_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const downloadCSVNative = async (csvString) => {
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
      });
      await FileSharer.share({
        filename: `encuesta_padres_${new Date().toISOString().slice(0, 10)}.csv`,
        contentType: "text/csv",
        base64Data,
      });
    };

    const downloadCSV = async () => {
      if (scannedResponses.value.length === 0) return;
      const csvString = buildCSVString();
      if (Capacitor.isNativePlatform()) {
        try {
          await downloadCSVNative(csvString);
        } catch (error) {
          const msg = (error?.message || "").toLowerCase();
          if (!msg.includes("cancelled") && !msg.includes("dismiss") && !msg.includes("back button")) {
            const alert = await alertController.create({
              header: "Error",
              message: "Hubo un error al compartir el archivo.",
              buttons: ["OK"],
            });
            await alert.present();
          }
        }
      } else {
        downloadCSVWeb(csvString);
      }
    };

    return {
      isScanning, currentResult, scannedResponses, scannerComponent,
      arrowBackOutline, checkmarkOutline, cameraOutline, downloadOutline, trashOutline,
      goBack, startScan, onScanComplete, onScanCancelled, confirmResponse,
      downloadCSV, likertOptions, resetAll,
    };
  },
};
</script>

<style scoped>
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
.scanner-container {
  height: 90%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.editable-answer-select {
  min-width: 110px;
  text-align: center;
  font-weight: bold;
}
.section-title {
  font-size: 1.1em;
  padding: 8px 0;
}
</style>
