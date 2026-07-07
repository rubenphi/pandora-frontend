<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Encuesta a Estudiantes</ion-title>
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

          <!-- Q1: Sí/No -->
          <ion-item v-if="currentResult.sections.seccion1" lines="none">
            <ion-label class="section-title">
              <strong>Pregunta 1 - Sí / No</strong>
            </ion-label>
          </ion-item>
          <IonList v-if="currentResult.sections.seccion1">
            <IonItem
              v-for="item in currentResult.sections.seccion1"
              :key="'s1-' + item.question"
            >
              <IonLabel>Q1</IonLabel>
              <ion-select
                v-model="item.answer"
                interface="action-sheet"
                class="editable-answer-select"
              >
                <ion-select-option value="Sí">Sí</ion-select-option>
                <ion-select-option value="No">No</ion-select-option>
              </ion-select>
            </IonItem>
          </IonList>

          <!-- Q2-Q15: Likert 14 preguntas -->
          <ion-item v-if="currentResult.sections.seccion2" lines="none">
            <ion-label class="section-title">
              <strong>Preguntas 2 a 15 - Frecuencia</strong>
            </ion-label>
          </ion-item>
          <IonList v-if="currentResult.sections.seccion2">
            <IonItem
              v-for="(item, idx) in currentResult.sections.seccion2"
              :key="'s2-' + item.question"
            >
              <IonLabel>Q{{ idx + 2 }}</IonLabel>
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

          <!-- Q16-Q19: Likert 4 preguntas -->
          <ion-item v-if="currentResult.sections.seccion3" lines="none">
            <ion-label class="section-title">
              <strong>Preguntas 16 a 19 - Frecuencia</strong>
            </ion-label>
          </ion-item>
          <IonList v-if="currentResult.sections.seccion3">
            <IonItem
              v-for="(item, idx) in currentResult.sections.seccion3"
              :key="'s3-' + item.question"
            >
              <IonLabel>Q{{ idx + 16 }}</IonLabel>
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

          <!-- Q20: Multiselect -->
          <ion-item v-if="currentResult.sections.seccion4" lines="none">
            <ion-label class="section-title">
              <strong>Pregunta 20 - ¿Qué herramientas usa el docente?</strong>
            </ion-label>
          </ion-item>
          <IonList v-if="currentResult.sections.seccion4 && currentResult.sections.seccion4.length > 0">
            <IonItem>
              <div class="multiselect-chips">
                <ion-chip
                  v-for="opt in currentResult.sections.seccion4"
                  :key="opt"
                  color="primary"
                  outline
                  class="multiselect-chip"
                >
                  {{ opt }}
                </ion-chip>
                <span v-if="currentResult.sections.seccion4.length === 0" class="ion-text-medium ion-padding-start"
                  >(sin selección)</span
                >
              </div>
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
          templateName="studentSurvey"
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
  IonChip,
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
    IonChip,
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

    const STORAGE_KEY = "omr_student_survey_responses";
    const COUNTER_KEY = "omr_student_survey_counter";

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

    const parseResultsBySection = (results) => {
      const sections = { seccion1: [], seccion2: [], seccion3: [], seccion4: [] };

      const allQuestions = results
        .filter((r) => r.typeOrigin === "question")
        .flatMap((r) => r.content || []);

      if (allQuestions.length >= 19) {
        sections.seccion1 = allQuestions.slice(0, 1);
        sections.seccion2 = allQuestions.slice(1, 15);
        sections.seccion3 = allQuestions.slice(15, 19);
      } else if (allQuestions.length >= 15) {
        sections.seccion1 = allQuestions.slice(0, 1);
        sections.seccion2 = allQuestions.slice(1, 15);
        sections.seccion3 = allQuestions.slice(15);
      } else if (allQuestions.length >= 1) {
        sections.seccion1 = allQuestions.slice(0, 1);
        sections.seccion2 = allQuestions.slice(1);
      }

      const multiBlock = results.find((r) => r.typeOrigin === "multiselect");
      if (multiBlock && Array.isArray(multiBlock.content)) {
        sections.seccion4 = multiBlock.content;
      }

      return sections;
    };

    const onScanComplete = async (payload) => {
      isScanning.value = false;

      const sections = parseResultsBySection(payload.results);

      const assigned = String(autoCodeCounter.value).padStart(4, "0");
      autoCodeCounter.value++;

      currentResult.value = {
        code: assigned,
        sections: sections,
        imageUrl: payload.imageUrl,
      };
    };

    const onScanCancelled = () => {
      isScanning.value = false;
    };

    const confirmResponse = async () => {
      if (!currentResult.value) return;

      const savedItem = {
        code: currentResult.value.code,
        answers: currentResult.value.sections,
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

    const escapeCSVCell = (str) => {
      const s = String(str);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const buildCSVString = () => {
      const headers = [
        "Código",
        "Q1 (Sí/No)",
      ];
      for (let i = 2; i <= 15; i++) {
        headers.push(`Q${i} (Nunca/Algunas veces/Casi siempre/Siempre)`);
      }
      for (let i = 16; i <= 19; i++) {
        headers.push(`Q${i} (Nunca/Algunas veces/Casi siempre/Siempre)`);
      }
      const toolLabels = [
        "Tablero",
        "Películas y videos",
        "Láminas y otros materiales gráficos",
        "Computadores",
        "Diapositivas o acetatos",
        "Música",
        "Libros de texto",
        "Laboratorios",
        "Otros",
        "Programas educativos computarizados",
        "Mapas",
      ];
      toolLabels.forEach((l) => headers.push(`Q20_${l}`));

      const rows = scannedResponses.value.map((response) => {
        const row = [response.code];
        const sec = response.answers || {};

        const s1 = sec.seccion1 || [];
        row.push(s1.length > 0 ? s1[0].answer || "" : "");

        const s2 = sec.seccion2 || [];
        for (let i = 0; i < 14; i++) {
          row.push(s2[i] ? s2[i].answer || "" : "");
        }

        const s3 = sec.seccion3 || [];
        for (let i = 0; i < 4; i++) {
          row.push(s3[i] ? s3[i].answer || "" : "");
        }

        const s4 = sec.seccion4 || [];
        const selectedSet = new Set(s4);
        toolLabels.forEach((label) => {
          row.push(selectedSet.has(label) ? "Sí" : "");
        });

        return row.map(escapeCSVCell).join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
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
        `encuesta_estudiantes_${new Date().toISOString().slice(0, 10)}.csv`,
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
        filename: `encuesta_estudiantes_${new Date().toISOString().slice(0, 10)}.csv`,
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
      likertOptions,
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
  min-width: 110px;
  text-align: center;
  font-weight: bold;
}

.section-title {
  font-size: 1.1em;
  padding: 8px 0;
}

.multiselect-row {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  border-bottom: 1px solid var(--ion-color-light);
}

.multiselect-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 8px;
}

.multiselect-chip {
  font-size: 0.85em;
}
</style>
