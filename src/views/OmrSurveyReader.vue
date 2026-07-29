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

        <ion-card v-if="currentSession">
          <ion-card-header>
            <ion-card-title>{{ currentSession.label }}</ion-card-title>
            <ion-card-subtitle>
              {{ currentSession.year }} &middot;
              {{ serverResponses.length }} respuesta(s) en servidor
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
                CSV local ({{ scannedResponses.length }})
              </ion-button>
            </ion-col>
            <ion-col>
              <ion-button expand="block" color="success" fill="outline" @click="downloadLocalPDF">
                <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
                PDF local ({{ scannedResponses.length }})
              </ion-button>
            </ion-col>
          </ion-row>
          <ion-row v-if="templateId">
            <ion-col>
              <ion-button
                expand="block"
                color="tertiary"
                @click="downloadServerCSV"
                :disabled="serverResponses.length === 0"
              >
                <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
                CSV servidor ({{ serverResponses.length }})
              </ion-button>
            </ion-col>
            <ion-col>
              <ion-button
                expand="block"
                color="tertiary"
                fill="outline"
                @click="downloadServerPDF"
                :disabled="serverResponses.length === 0"
              >
                <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
                PDF servidor ({{ serverResponses.length }})
              </ion-button>
            </ion-col>
          </ion-row>
          <ion-row v-if="templateId">
            <ion-col>
              <ion-button
                expand="block"
                fill="outline"
                color="medium"
                @click="fetchServerResponses"
                :disabled="isServerLoading"
              >
                {{ isServerLoading ? "Cargando..." : "Actualizar" }}
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
import axios from "axios";
import { tokenHeader } from "../globalService";
import { generateStudentSurveyPDF } from "@/components/functions/omr/surveyPdfGenerator.js";
import {
  STUDENT_SURVEY_KEYS,
  getLocalData,
  saveLocalData,
  clearLocalData,
  confirmLocalDataOverwrite,
} from "@/components/functions/omr/surveyStorage.js";
import {
  arrowBackOutline,
  checkmarkOutline,
  cameraOutline,
  downloadOutline,
  trashOutline,
  documentTextOutline,
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

    const templateId = ref(null);
    const serverResponses = ref([]);
    const isServerLoading = ref(false);
    const currentSession = ref(null);

    const loadSessionFromRoute = async () => {
      const sessionId = router.currentRoute.value.params.sessionId;
      if (!sessionId) return;
      try {
        tokenHeader();
        const res = await axios.get(`/surveys/sessions/${sessionId}`);
        currentSession.value = res.data;
        if (res.data.template) {
          templateId.value = res.data.template.id;
        }
      } catch (err) {
        console.error("loadSession error:", err.response?.data || err.message);
      }
    };

    const fetchServerResponses = async () => {
      if (!templateId.value) return;
      isServerLoading.value = true;
      try {
        tokenHeader();
        const params = { templateId: templateId.value };
        if (currentSession.value) {
          params.sessionId = currentSession.value.id;
        }
        const res = await axios.get("/surveys/responses", { params });
        serverResponses.value = res.data || [];
      } catch {
        serverResponses.value = [];
      } finally {
        isServerLoading.value = false;
      }
    };

    const uploadToServer = async (code, sections) => {
      if (!templateId.value) {
        return false;
      }
      try {
        tokenHeader();
        const payload = {
          templateId: templateId.value,
          code,
          answers: sections,
          respondent: "student",
        };
        if (currentSession.value) {
          payload.sessionId = currentSession.value.id;
        }
        await axios.post("/surveys/responses", payload);
        return true;
      } catch (err) {
        console.error(
          "uploadToServer error:",
          err.response?.status,
          err.response?.data || err.message,
        );
        return false;
      }
    };

    const checkAndLoadLocalData = async () => {
      const localData = getLocalData(STUDENT_SURVEY_KEYS);
      if (localData.responses && localData.responses.length > 0) {
        if (
          localData.session?.id &&
          currentSession.value?.id &&
          localData.session.id === currentSession.value.id
        ) {
          scannedResponses.value = localData.responses;
          autoCodeCounter.value = localData.counter;
        } else {
          const savedLabel = localData.session?.label;
          const confirmed = await confirmLocalDataOverwrite(savedLabel, "ingresar");
          if (confirmed) {
            clearLocalData(STUDENT_SURVEY_KEYS);
            scannedResponses.value = [];
            autoCodeCounter.value = 1;
            if (currentSession.value) {
              saveLocalData(STUDENT_SURVEY_KEYS, [], 1, currentSession.value);
            }
          } else {
            router.back();
          }
        }
      } else {
        scannedResponses.value = [];
        autoCodeCounter.value = 1;
        if (currentSession.value) {
          saveLocalData(STUDENT_SURVEY_KEYS, [], 1, currentSession.value);
        }
      }
    };

    const trySaveToStorage = () => {
      return saveLocalData(
        STUDENT_SURVEY_KEYS,
        scannedResponses.value,
        autoCodeCounter.value,
        currentSession.value
      );
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
              clearLocalData(STUDENT_SURVEY_KEYS);
            },
          },
        ],
      });
      await alert.present();
    };

    onIonViewDidEnter(async () => {
      await loadSessionFromRoute();
      await checkAndLoadLocalData();
      if (templateId.value) {
        await fetchServerResponses();
      }
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

      const code = currentResult.value.code;
      const sections = currentResult.value.sections;

      const savedItem = {
        code: code,
        answers: sections,
      };
      scannedResponses.value.push(savedItem);
      currentResult.value = null;
      trySaveToStorage();

      let uploaded = false;
      if (templateId.value) {
        uploaded = await uploadToServer(code, sections);
        if (uploaded) {
          await fetchServerResponses();
        }
      }

      const alert = await alertController.create({
        header: uploaded ? "Registrado" : "Respuesta guardada",
        message: uploaded
          ? `Respuesta registrada (${serverResponses.value.length} en servidor).`
          : `Respuesta almacenada localmente (${scannedResponses.value.length} en total).`,
        buttons: ["OK"],
      });
      await alert.present();
    };

    const escapeCSVCell = (str) => {
      const s = String(str);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

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

    const buildCSVString = () => {
      const headers = ["Código", "Q1 (Sí/No)"];
      for (let i = 2; i <= 15; i++) {
        headers.push(`Q${i} (Nunca/Algunas veces/Casi siempre/Siempre)`);
      }
      for (let i = 16; i <= 19; i++) {
        headers.push(`Q${i} (Nunca/Algunas veces/Casi siempre/Siempre)`);
      }
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

    const buildCSVFromServerData = () => {
      const headers = ["Código", "Q1 (Sí/No)"];
      for (let i = 2; i <= 15; i++) {
        headers.push(`Q${i} (Nunca/Algunas veces/Casi siempre/Siempre)`);
      }
      for (let i = 16; i <= 19; i++) {
        headers.push(`Q${i} (Nunca/Algunas veces/Casi siempre/Siempre)`);
      }
      toolLabels.forEach((l) => headers.push(`Q20_${l}`));

      const rows = serverResponses.value.map((response) => {
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

    const downloadCSVWeb = (csvString, filenameStr) => {
      const blob = new Blob([csvString], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filenameStr);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const downloadCSVNative = async (csvString, filenameStr) => {
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
        filename: filenameStr,
        contentType: "text/csv",
        base64Data: base64Data,
      });
    };

    const downloadCSV = async () => {
      if (scannedResponses.value.length === 0) return;

      const csvString = buildCSVString();
      const fn = `encuesta_estudiantes_local_${new Date().toISOString().slice(0, 10)}.csv`;

      if (Capacitor.isNativePlatform()) {
        try {
          await downloadCSVNative(csvString, fn);
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
        downloadCSVWeb(csvString, fn);
      }
    };

    const downloadServerCSV = async () => {
      if (serverResponses.value.length === 0) return;
      await fetchServerResponses();
      const csvString = buildCSVFromServerData();
      const fn = `encuesta_estudiantes_servidor_${new Date().toISOString().slice(0, 10)}.csv`;

      if (Capacitor.isNativePlatform()) {
        try {
          await downloadCSVNative(csvString, fn);
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
        downloadCSVWeb(csvString, fn);
      }
    };

    const downloadLocalPDF = async () => {
      if (scannedResponses.value.length === 0) return;
      await generateStudentSurveyPDF(
        scannedResponses.value,
        "Escaneos locales",
        currentSession.value
      );
    };

    const downloadServerPDF = async () => {
      if (serverResponses.value.length === 0) return;
      await fetchServerResponses();
      await generateStudentSurveyPDF(
        serverResponses.value,
        "Servidor",
        currentSession.value
      );
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
      documentTextOutline,
      goBack,
      startScan,
      onScanComplete,
      onScanCancelled,
      confirmResponse,
      downloadCSV,
      downloadServerCSV,
      downloadLocalPDF,
      downloadServerPDF,
      likertOptions,
      resetAll,
      templateId,
      serverResponses,
      isServerLoading,
      fetchServerResponses,
      currentSession,
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
