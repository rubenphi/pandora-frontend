<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin/panel"></ion-back-button>
        </ion-buttons>
        <ion-title>Herramientas de Administrador</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-list>
        <!-- Primera herramienta: Descargar cuestionarios del año -->
        <ion-item button @click="abrirDescargaCuestionarios">
          <ion-icon
            slot="start"
            :icon="cloudDownloadOutline"
            color="primary"
          ></ion-icon>
          <ion-label>
            <h2>Descargar Cuestionarios</h2>
            <p>Exportar todos los exámenes del año en PDF agrupados por año, periodo, curso y área (ZIP)</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <!-- Modal de progreso de la generación ZIP anual -->
      <ion-modal :is-open="isExporting" :backdrop-dismiss="false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Descargando Cuestionarios ({{ selectedExportYear }})</ion-title>
            <ion-buttons slot="end" v-if="isExportComplete">
              <ion-button @click="cerrarModalExportacion">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding ion-text-center">
          <h2 style="margin-top: 20px">
            {{ isExportComplete ? "¡Descarga Completada!" : "Generando Paquete de Exámenes" }}
          </h2>
          <p>{{ exportProgressText }}</p>
          <ion-progress-bar
            :value="exportProgressValue"
            style="margin-top: 20px"
            :color="isExportComplete ? 'success' : 'primary'"
          ></ion-progress-bar>

          <p
            v-if="!isExportComplete"
            style="margin-top: 20px; font-size: 0.9em; color: gray"
          >
            Por favor, no cierre esta ventana mientras se compilan los exámenes
            en PDF y se arma el archivo ZIP.
          </p>

          <ion-button
            v-if="!isExportComplete"
            color="danger"
            fill="outline"
            style="margin-top: 25px"
            @click="cancelarExportacion"
            :disabled="isExportCancelled"
          >
            Cancelar
          </ion-button>

          <div v-if="isExportComplete" class="ion-margin-top ion-padding">
            <ion-icon
              :icon="checkmarkCircleOutline"
              color="success"
              style="font-size: 52px"
            ></ion-icon>
            <p style="color: #475569; font-size: 0.95em; margin-top: 10px">
              Los exámenes en PDF se han generado y descargado directamente en tu dispositivo sin ocupar espacio de almacenamiento en el servidor.
            </p>
            <ion-button
              expand="block"
              color="primary"
              class="ion-margin-top"
              @click="cerrarModalExportacion"
            >
              Cerrar
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from "vue";
import axios from "axios";
import JSZip from "jszip";
import {
  tokenHeader,
  basedeURL,
  currentServerYear,
} from "../globalService";
import { generateQuizPdfBlob } from "../utils/quizPdfGenerator";

import {
  cloudDownloadOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonModal,
  IonProgressBar,
  IonButton,
  alertController,
} from "@ionic/vue";

export default {
  name: "AdminHerramientasPage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonModal,
    IonProgressBar,
    IonButton,
  },
  setup() {
    const isExporting = ref(false);
    const isExportCancelled = ref(false);
    const isExportComplete = ref(false);
    const exportProgressValue = ref(0);
    const exportProgressText = ref("");
    const selectedExportYear = ref(currentServerYear());

    const sanitizeName = (str) => {
      if (!str) return "Sin_Nombre";
      return String(str)
        .replace(/[/\\?%*:|"<>]/g, "_")
        .replace(/\s+/g, " ")
        .trim();
    };

    const abrirDescargaCuestionarios = async () => {
      const curYear = currentServerYear();
      const years = Array.from({ length: 6 }, (_, i) => curYear - i);

      const alert = await alertController.create({
        header: "Descargar Cuestionarios",
        message:
          "Seleccione el año lectivo que desea empaquetar en PDFs organizados por año, periodo, curso y área:",
        inputs: years.map((y) => ({
          type: "radio",
          label: `Año ${y}`,
          value: y,
          checked: y === curYear,
        })),
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Continuar",
            handler: (y) => {
              if (y) {
                selectedExportYear.value = y;
                iniciarDescargaAnual(y);
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const iniciarDescargaAnual = async (year) => {
      isExporting.value = true;
      isExportCancelled.value = false;
      isExportComplete.value = false;
      exportProgressValue.value = 0.05;
      exportProgressText.value = `Consultando cuestionarios del año ${year}...`;

      try {
        const response = await axios.get(
          `/quizzes/export/year/${year}`,
          tokenHeader()
        );
        const quizzes = response.data || [];

        if (!quizzes.length) {
          isExporting.value = false;
          const noDataAlert = await alertController.create({
            header: "Sin cuestionarios",
            message: `No se encontraron cuestionarios registrados para el año ${year}.`,
            buttons: ["Entendido"],
          });
          await noDataAlert.present();
          return;
        }

        const zip = new JSZip();
        const total = quizzes.length;
        const usedPaths = new Set();
        const baseUrl = basedeURL() || "";

        for (let i = 0; i < total; i++) {
          if (isExportCancelled.value) {
            exportProgressText.value = "Exportación cancelada.";
            return;
          }

          const quiz = quizzes[i];
          const periodo = sanitizeName(
            quiz.lesson?.period?.name ||
              (quiz.lesson?.period?.id ? `Periodo_${quiz.lesson.period.id}` : "Periodo_General")
          );
          const curso = sanitizeName(
            quiz.lesson?.course?.name ||
              (quiz.lesson?.course?.id ? `Curso_${quiz.lesson.course.id}` : "Curso_General")
          );
          const area = sanitizeName(
            quiz.lesson?.area?.name ||
              (quiz.lesson?.area?.id ? `Area_${quiz.lesson.area.id}` : "Area_General")
          );
          const titulo = sanitizeName(quiz.title || `Cuestionario_${quiz.id}`);

          exportProgressText.value = `Generando PDF (${i + 1}/${total}): ${quiz.title || "Cuestionario"} [${curso} - ${area}]`;
          exportProgressValue.value = 0.1 + (i / total) * 0.75; // 10% a 85%

          try {
            const pdfBlob = await generateQuizPdfBlob({ quiz, baseUrl });

            let fileName = `${titulo}.pdf`;
            let fullPath = `${year}/${periodo}/${curso}/${area}/${fileName}`;
            if (usedPaths.has(fullPath)) {
              fileName = `${titulo}_${quiz.id}.pdf`;
              fullPath = `${year}/${periodo}/${curso}/${area}/${fileName}`;
            }
            usedPaths.add(fullPath);

            zip.file(fullPath, pdfBlob);
          } catch (pdfErr) {
            console.error(`Error al generar PDF de cuestionario ID ${quiz.id}:`, pdfErr);
          }

          // Cede el hilo de ejecución para refrescar la UI fluidamente
          await new Promise((resolve) => setTimeout(resolve, 20));
        }

        if (isExportCancelled.value) return;

        exportProgressText.value = "Comprimiendo cuestionarios en archivo ZIP...";
        exportProgressValue.value = 0.85;

        const zipBlob = await zip.generateAsync(
          {
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
          },
          (metadata) => {
            exportProgressValue.value = 0.85 + (metadata.percent / 100) * 0.14;
            exportProgressText.value = `Comprimiendo archivo ZIP (${Math.round(metadata.percent)}%)...`;
          }
        );

        if (isExportCancelled.value) return;

        // Descarga local directa en memoria
        exportProgressText.value = "Iniciando descarga en el navegador...";
        const zipFilename = `Cuestionarios_${year}.zip`;
        const blobUrl = window.URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = zipFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Libera la memoria del Blob del navegador tras la descarga
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);

        exportProgressValue.value = 1;
        isExportComplete.value = true;
        exportProgressText.value = `¡Descarga completa! Se procesaron ${total} exámenes y el archivo "${zipFilename}" se ha descargado a tu equipo.`;
      } catch (error) {
        console.error("Error en la exportación anual de cuestionarios:", error);
        isExporting.value = false;
        const errAlert = await alertController.create({
          header: "Error en la exportación",
          message:
            error?.response?.data?.message ||
            error.message ||
            "Ocurrió un error al procesar los cuestionarios.",
          buttons: ["OK"],
        });
        await errAlert.present();
      }
    };

    const cancelarExportacion = () => {
      isExportCancelled.value = true;
      isExporting.value = false;
    };

    const cerrarModalExportacion = () => {
      isExporting.value = false;
    };

    return {
      cloudDownloadOutline,
      checkmarkCircleOutline,
      isExporting,
      isExportCancelled,
      isExportComplete,
      exportProgressValue,
      exportProgressText,
      selectedExportYear,
      abrirDescargaCuestionarios,
      cancelarExportacion,
      cerrarModalExportacion,
    };
  },
};
</script>

