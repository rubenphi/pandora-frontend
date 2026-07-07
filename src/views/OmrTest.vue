<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Encuesta OMR</ion-title>
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
          <h3>Resultado escaneo</h3>

          <ion-item>
            <ion-label position="stacked">Código</ion-label>
            <ion-input
              v-model="currentResult.code"
              placeholder="Código del estudiante"
            ></ion-input>
          </ion-item>

          <p class="ion-padding-start ion-text-small">
            Toque la respuesta para editarla si es necesario.
          </p>
          <IonList>
            <IonItem
              v-for="answer in currentResult.answers"
              :key="answer.question"
            >
              <IonLabel>Pregunta {{ answer.question }}</IonLabel>
              <ion-select
                v-model="answer.answer"
                interface="action-sheet"
                class="editable-answer-select"
              >
                <ion-select-option
                  v-for="opt in answerOptions"
                  :key="opt"
                  :value="opt.toLowerCase()"
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
              <ion-button
                expand="block"
                color="danger"
                fill="outline"
                @click="resetAll"
              >
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
  IonInput,
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
  name: "OmrSurveyReader",
  components: {
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
    IonInput,
    OmrScanner,
  },
  setup() {
    const router = useRouter();
    const isScanning = ref(false);
    const scannerComponent = ref(null);
    const currentResult = ref(null);
    const scannedResponses = ref([]);
    const autoCodeCounter = ref(1);
    const answerOptions = ["A", "B", "C", "D", "E", "F", "G", "H"];

    const STORAGE_KEY = "omr_survey_responses";
    const COUNTER_KEY = "omr_survey_counter";

    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          scannedResponses.value = JSON.parse(saved);
        }
        const savedCounter = localStorage.getItem(COUNTER_KEY);
        if (savedCounter) {
          autoCodeCounter.value = parseInt(savedCounter, 10);
        }
      } catch (e) {
        console.warn("Error loading survey data from storage:", e);
      }
    };

    const trySaveToStorage = () => {
      try {
        const dataToSave = scannedResponses.value.map((r) => ({
          code: r.code,
          answers: r.answers,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        localStorage.setItem(COUNTER_KEY, String(autoCodeCounter.value));
        return true;
      } catch (e) {
        return false;
      }
    };

    const resetAll = async () => {
      const alert = await alertController.create({
        header: "Nuevo escaneo general",
        message:
          "Se borrarán todos los datos escaneados actuales. ¿Está seguro?",
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

    onIonViewDidEnter(() => {
      loadFromStorage();
    });

    const goBack = () => {
      router.back();
    };

    const startScan = async () => {
      currentResult.value = null;
      isScanning.value = true;
      await nextTick();
      if (scannerComponent.value) scannerComponent.value.start();
    };

    const extractCode = (results) => {
      const numericBlock = results.find((r) => r.typeOrigin === "numeric");
      if (!numericBlock) return "";
      const rawCode = numericBlock.content || "";
      const trimmedCode = rawCode.replace(/^0+/, "");
      return trimmedCode;
    };

    const extractAnswers = (results) => {
      const questionBlocks = results.filter((r) => r.typeOrigin === "question");
      const allAnswers = [];
      questionBlocks.forEach((block) => {
        allAnswers.push(...block.content);
      });
      return allAnswers;
    };

    const onScanComplete = async (payload) => {
      isScanning.value = false;

      const code = extractCode(payload.results);
      const answers = extractAnswers(payload.results);

      let finalCode = code;

      if (!code) {
        const alert = await alertController.create({
          header: "Código no detectado",
          message:
            "No se pudo reconocer un código de identificación en la hoja escaneada. ¿Desea almacenarla igualmente? Se le asignará un código automático.",
          buttons: [
            {
              text: "No, cancelar",
              role: "cancel",
              handler: () => {
                currentResult.value = null;
              },
            },
            {
              text: "Sí, almacenar",
              handler: () => {
                const assigned = String(autoCodeCounter.value).padStart(
                  10,
                  "0",
                );
                autoCodeCounter.value++;
                finalCode = assigned;
                currentResult.value = {
                  code: finalCode,
                  answers: answers,
                  imageUrl: payload.imageUrl,
                };
              },
            },
          ],
        });
        await alert.present();
      } else {
        currentResult.value = {
          code: finalCode,
          answers: answers,
          imageUrl: payload.imageUrl,
        };
      }
    };

    const onScanCancelled = () => {
      isScanning.value = false;
    };

    const confirmResponse = async () => {
      if (!currentResult.value) return;

      const savedItem = {
        code: currentResult.value.code,
        answers: currentResult.value.answers,
      };
      scannedResponses.value.push(savedItem);
      currentResult.value = null;

      if (!trySaveToStorage()) {
        const alert = await alertController.create({
          header: "Almacenado en memoria",
          message:
            "No se pudo guardar en almacenamiento local, pero los datos están retenidos en memoria. Descargue el CSV antes de salir para no perderlos.",
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

    const buildCSVString = () => {
      const maxQuestions = scannedResponses.value.reduce(
        (max, r) => Math.max(max, r.answers.length),
        0,
      );

      const headers = ["Código"];
      for (let i = 1; i <= maxQuestions; i++) {
        headers.push(`P${i}`);
      }

      const rows = scannedResponses.value.map((response) => {
        const row = [response.code];
        for (let i = 0; i < maxQuestions; i++) {
          const answer = response.answers[i];
          row.push(answer ? answer.answer.toUpperCase() : "");
        }
        return row;
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((r) =>
          r
            .map((cell) => {
              const str = String(cell);
              if (
                str.includes(",") ||
                str.includes('"') ||
                str.includes("\n")
              ) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(","),
        ),
      ].join("\n");

      return "\uFEFF" + csvContent;
    };

    const downloadCSVWeb = (csvString) => {
      const blob = new Blob([csvString], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `encuesta_omr_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const downloadCSVNative = async (csvString) => {
      const blob = new Blob([csvString], {
        type: "text/csv;charset=utf-8;",
      });

      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(blob);
      });

      await FileSharer.share({
        filename: `encuesta_omr_${new Date().toISOString().slice(0, 10)}.csv`,
        contentType: "text/csv",
        base64Data: base64Data,
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
          const isCancel =
            msg.includes("cancelled") ||
            msg.includes("user_cancelled") ||
            msg.includes("dismiss") ||
            msg.includes("user back") ||
            msg.includes("back button");

          if (!isCancel) {
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
      isScanning,
      currentResult,
      scannedResponses,
      scannerComponent,
      arrowBackOutline,
      checkmarkOutline,
      cameraOutline,
      downloadOutline,
      trashOutline,
      goBack,
      startScan,
      onScanComplete,
      onScanCancelled,
      confirmResponse,
      downloadCSV,
      answerOptions,
      resetAll,
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
  min-width: 80px;
  text-align: center;
  font-weight: bold;
}
</style>
