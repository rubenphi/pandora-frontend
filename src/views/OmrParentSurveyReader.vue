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
            Revise las respuestas. Si es necesario, toque la respuesta para cambiarla antes de confirmar.
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
                CSV local ({{ scannedResponses.length }})
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
            <ion-col v-if="templateId">
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
import axios from "axios";
import { tokenHeader } from "../globalService";
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

    const uploadToServer = async (code, seccion1, seccion2) => {
      if (!templateId.value) {
        console.warn("uploadToServer: templateId is null");
        return false;
      }
      try {
        tokenHeader();
        const payload = {
          templateId: templateId.value,
          code,
          answers: { seccion1, seccion2 },
          respondent: "parent",
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
            },
          },
        ],
      });
      await alert.present();
    };

    onIonViewDidEnter(async () => {
      await loadSessionFromRoute();
      if (templateId.value) {
        await fetchServerResponses();
      }
    });

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

    const validateResponses = (seccion1, seccion2) => {
      const issues = [];
      const allItems = [
        ...seccion1.map((item, i) => ({ num: i + 1, item })),
        ...seccion2.map((item, i) => ({ num: i + 15, item })),
      ];
      for (const { num, item } of allItems) {
        if (!item.answer || item.answer.trim() === "") {
          issues.push(`Q${num}: sin respuesta`);
        }
        if (Array.isArray(item.answer)) {
          issues.push(`Q${num}: múltiples respuestas`);
        }
      }
      return issues;
    };

    const confirmResponse = async () => {
      if (!currentResult.value) return;

      const { code, seccion1, seccion2 } = currentResult.value;
      const issues = validateResponses(seccion1, seccion2);

      let confirmed = false;
      const promptAlert = await alertController.create({
        header:
          issues.length > 0
            ? "Aviso: respuestas con inconsistencias"
            : "Confirmar registro",
        message:
          issues.length > 0
            ? "Se detectaron los siguientes problemas:\n\n" +
              issues.join("\n") +
              "\n\nPuede corregirlas o subirlas tal como están."
            : "Los datos guardados no se podrán modificar. ¿Desea continuar?",
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: issues.length > 0 ? "Subir de todas formas" : "Confirmar",
            handler: () => {
              confirmed = true;
            },
          },
        ],
      });
      await promptAlert.present();
      await promptAlert.onDidDismiss();
      if (!confirmed) return;

      scannedResponses.value.push({ code, seccion1, seccion2 });
      currentResult.value = null;

      const uploaded = await uploadToServer(code, seccion1, seccion2);
      if (uploaded) {
        await fetchServerResponses();
      }

      const resultAlert = await alertController.create({
        header: uploaded ? "Registrado" : "Error de conexión",
        message: uploaded
          ? `Respuesta registrada (${serverResponses.value.length} en servidor).`
          : "No se pudo conectar con el servidor. Intente de nuevo.",
        buttons: ["OK"],
      });
      await resultAlert.present();
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
      link.setAttribute(
        "download",
        `encuesta_padres_${new Date().toISOString().slice(0, 10)}.csv`,
      );
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
        filename: `encuesta_padres_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`,
        contentType: "text/csv",
        base64Data,
      });
    };

    const buildCSVFromServerData = () => {
      const headers = ["Código"];
      for (let i = 1; i <= 18; i++) {
        headers.push(`Q${i} (Nunca/Algunas veces/Casi siempre/Siempre)`);
      }

      const rows = serverResponses.value.map((r) => {
        const row = [r.code];
        const ans = r.answers || {};
        const s1 = ans.seccion1 || [];
        const s2 = ans.seccion2 || [];
        for (let i = 0; i < 14; i++) row.push(s1[i] ? s1[i].answer || "" : "");
        for (let i = 0; i < 4; i++) row.push(s2[i] ? s2[i].answer || "" : "");
        return row.map(escapeCSVCell).join(",");
      });

      return "\uFEFF" + [headers.join(","), ...rows].join("\n");
    };

    const downloadServerCSV = async () => {
      if (serverResponses.value.length === 0) return;
      await fetchServerResponses();
      const csvString = buildCSVFromServerData();
      if (Capacitor.isNativePlatform()) {
        try {
          await downloadCSVNative(csvString);
        } catch (error) {
          const msg = (error?.message || "").toLowerCase();
          if (
            !msg.includes("cancelled") &&
            !msg.includes("dismiss") &&
            !msg.includes("back button")
          ) {
            const alert = await alertController.create({
              header: "Error",
              message: "Hubo un error al compartir el archivo.",
              buttons: ["OK"],
            });
            await alert.present();
          }
        }
      } else {
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `encuesta_padres_servidor_${new Date()
            .toISOString()
            .slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    };

    const downloadCSV = async () => {
      if (scannedResponses.value.length === 0) return;
      const csvString = buildCSVString();
      if (Capacitor.isNativePlatform()) {
        try {
          await downloadCSVNative(csvString);
        } catch (error) {
          const msg = (error?.message || "").toLowerCase();
          if (
            !msg.includes("cancelled") &&
            !msg.includes("dismiss") &&
            !msg.includes("back button")
          ) {
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
      downloadServerCSV,
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
</style>
