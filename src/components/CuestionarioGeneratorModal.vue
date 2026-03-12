<template>
  <ion-modal :is-open="isOpen" @didDismiss="emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Generar Cuestionario</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="emit('close')">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label>Tipo de Cuestionario</ion-label>
        <ion-select
          v-model="questionnaireType"
          @ionChange="generateQuestionnaire"
        >
          <ion-select-option value="fixed">Opciones Fijas</ion-select-option>
          <ion-select-option value="variable"
            >Opciones Variables</ion-select-option
          >
          <ion-select-option value="answers"
            >Solo Respuestas Correctas</ion-select-option
          >
          <ion-select-option value="csv">CSV (Claves)</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Cantidad de Preguntas (Máx: {{ localQuestions.length }})</ion-label>
        <ion-input
          type="number"
          v-model="questionsLimit"
          @ionChange="generateQuestionnaire"
          :min="1"
          :max="localQuestions.length"
        ></ion-input>
      </ion-item>

      <ion-button expand="block" @click="exportData" class="ion-margin-top">
        <ion-icon slot="start" :icon="downloadOutline"></ion-icon>
        Exportar
      </ion-button>
      <ion-button expand="block" @click="printView" fill="outline">
        <ion-icon slot="start" :icon="printOutline"></ion-icon>
        Imprimir (Estándar)
      </ion-button>
      <ion-button expand="block" @click="printThermal" fill="outline" color="medium">
        <ion-icon slot="start" :icon="printOutline"></ion-icon>
        Imprimir (Térmica 80mm)
      </ion-button>

      <div
        id="printable-content"
        class="ion-padding-top"
        v-if="questionnaireType !== 'csv'"
      >
        <div v-html="generatedHtml"></div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script>
import { ref, watch } from "vue";
import { defineComponent } from "vue";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonInput,
  actionSheetController,
  alertController,
} from "@ionic/vue";
import { downloadOutline, printOutline } from "ionicons/icons";
import html2pdf from "html2pdf.js";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
export default defineComponent({
  name: "CuestionarioGeneratorModal",
  components: {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonInput,
  },
  props: {
    isOpen: Boolean,
    questions: Array,
    title: String,
    lessonData: Object, // New prop for lesson data
  },
  setup(props, { emit }) {
    const questionnaireType = ref("variable");
    const questionsLimit = ref(0);
    const generatedHtml = ref("");
    const localQuestions = ref([]);

    // Deep copy questions prop to avoid mutation issues
    watch(
      () => props.questions,
      (newQuestions) => {
        if (newQuestions) {
          localQuestions.value = JSON.parse(JSON.stringify(newQuestions));
          questionsLimit.value = localQuestions.value.length;
        }
      },
      { immediate: true }
    );

    const generateQuestionnaire = () => {
      if (!localQuestions.value || localQuestions.value.length === 0) {
        generatedHtml.value = "";
        return;
      }

      let htmlOutput = `<h2>${props.lessonData.topic} - ${props.title}</h2><h3>Grado: ${props.lessonData.course.name}</h3>`;
      const type = questionnaireType.value;
      const limitedQuestions = localQuestions.value.slice(0, questionsLimit.value);

      if (type === "fixed") {
        htmlOutput += `<p>Responda la pregunta 1 a la ${limitedQuestions.length} teniendo como opciones de respuesta las siguientes:</p>`;
        htmlOutput += `<div class="fixed-options-container">`;
        limitedQuestions[0].options
          .sort((a, b) => a.identifier.localeCompare(b.identifier))
          .forEach((opt) => {
            htmlOutput += `<div class="fixed-option-item">${opt.identifier}. ${opt.sentence}</div>`;
          });
        htmlOutput += `</div>`;
      }

      limitedQuestions.forEach((question, index) => {
        let processedSentence = question.sentence;

        // If the sentence starts with <p>, remove only the opening and closing <p> tags
        if (
          processedSentence.trim().startsWith("<p>") &&
          processedSentence.trim().endsWith("</p>")
        ) {
          processedSentence = processedSentence.trim().slice(3, -4);
        }

        // If the sentence starts with any heading tag (h1-h6), replace it with <strong>
        processedSentence = processedSentence.replace(
          /^<h([1-6])>(.*?)<\/h\1>/i,
          "<strong>$2</strong>"
        );

        htmlOutput += `<p><strong>${
          index + 1
        }. ${processedSentence}</strong><br>`;

        if (type === "variable") {
          question.options
            .sort((a, b) => a.identifier.localeCompare(b.identifier))
            .forEach((opt) => {
              let processedOptionSentence = opt.sentence;
              if (
                processedOptionSentence.trim().startsWith("<p>") &&
                processedOptionSentence.trim().endsWith("</p>")
              ) {
                processedOptionSentence = processedOptionSentence
                  .trim()
                  .slice(3, -4);
              }
              processedOptionSentence = processedOptionSentence.replace(
                /^<h([1-6])>(.*?)<\/h\1>/i,
                "<strong>$2</strong>"
              );
              htmlOutput += `&nbsp;&nbsp;&nbsp;${opt.identifier}. ${processedOptionSentence}<br>`;
            });
        }

        if (type === "answers") {
          const correct = question.options.find((opt) => opt.correct);
          if (correct) {
            let processedCorrectSentence = correct.sentence;
            if (
              processedCorrectSentence.trim().startsWith("<p>") &&
              processedCorrectSentence.trim().endsWith("</p>")
            ) {
              processedCorrectSentence = processedCorrectSentence
                .trim()
                .slice(3, -4);
            }
            processedCorrectSentence = processedCorrectSentence.replace(
              /^<h([1-6])>(.*?)<\/h\1>/i,
              "<strong>$2</strong>"
            );
            htmlOutput += `&nbsp;&nbsp;&nbsp;${correct.identifier}. ${processedCorrectSentence}<br>`;
          }
        }

        htmlOutput += `</p>`;
      });

      generatedHtml.value = htmlOutput;
    };

    const exportPDF = async (mode) => {
      const isStandard = mode === "standard";
      const filename = `${props.title || "cuestionario"}_${isStandard ? "estandar" : "thermal"}.pdf`;

      const loading = await alertController.create({
        header: "Generando PDF",
        message: "Por favor espere...",
        backdropDismiss: false,
      });
      await loading.present();

      try {
        // Forzar generación del HTML antes de exportar
        generateQuestionnaire();

        // Estilos diferenciados por modo
        const styles = isStandard
          ? `
            <style>
              .pdf-page { padding: 10mm; font-family: Arial, sans-serif; color: black; background: white; width: 190mm; box-sizing: border-box; }
              .pdf-header { text-align: center; margin-bottom: 8mm; border-bottom: 1px solid #000; padding-bottom: 2mm; width: 100%; }
              .pdf-content { width: 100%; column-count: 2; column-gap: 10mm; }
              .pdf-content p { margin-bottom: 4mm; display: block; break-inside: avoid-column; page-break-inside: avoid; }
              .fixed-options-container { display: flex; flex-wrap: wrap; gap: 5mm; margin-bottom: 5mm; column-span: all; }
              .fixed-option-item { flex: 0 0 calc(50% - 5mm); }
              h2, h3 { margin: 0 0 2mm 0; }
            </style>
          `
          : `
            <style>
              .pdf-page { padding: 4mm; font-family: Arial, sans-serif; color: black; background: white; width: 72mm; box-sizing: border-box; font-size: 9pt; }
              .pdf-header { text-align: center; margin-bottom: 4mm; border-bottom: 1px dotted #000; padding-bottom: 2mm; width: 100%; }
              .pdf-content { width: 100%; }
              .pdf-content p { margin-bottom: 3mm; display: block; page-break-inside: avoid; }
              .fixed-options-container { display: block; margin-bottom: 4mm; }
              .fixed-option-item { display: block; margin-bottom: 1mm; }
              h2 { font-size: 11pt; margin: 0 0 1mm 0; }
              h3 { font-size: 10pt; margin: 0 0 2mm 0; }
            </style>
          `;

        const htmlContent = `
          ${styles}
          <div class="pdf-page">
            <div class="pdf-header">
              <h2>${props.title || "CUESTIONARIO"}</h2>
              <h3>${props.lessonData?.topic || ""} - Curso: ${props.lessonData?.course?.name || ""}</h3>
            </div>
            <div class="pdf-content">
              ${generatedHtml.value || "No se pudo recuperar el contenido del cuestionario."}
            </div>
          </div>
        `;

        const element = document.createElement("div");
        element.innerHTML = htmlContent;

        const opt = isStandard
          ? {
              margin: 0,
              filename: filename,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, logging: false },
              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            }
          : {
              margin: 0,
              filename: filename,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, logging: false },
              jsPDF: { unit: "mm", format: [80, 400], orientation: "portrait" }, // 80mm width, long height
            };

        const worker = html2pdf().from(element).set(opt);

        if (Capacitor.isNativePlatform()) {
          const pdfDataUri = await worker.outputPdf("datauristring");
          if (!pdfDataUri || pdfDataUri.length < 1000) {
            throw new Error("El PDF generado parece estar vacío.");
          }
          const base64Data = pdfDataUri.split(",")[1];
          await FileSharer.share({
            filename: filename,
            contentType: "application/pdf",
            base64Data: base64Data,
          });
        } else {
          await worker.save();
        }
      } catch (e) {
        const msg = (e.message || "").toLowerCase();
        const isCancel =
          msg.includes("cancelled") ||
          msg.includes("user_cancelled") ||
          msg.includes("dismiss") ||
          msg.includes("user back") ||
          msg.includes("back button") ||
          msg.includes("share was suppressed");

        if (!isCancel) {
          console.error("PDF EXPORT ERROR:", e);
          const errorAlert = await alertController.create({
            header: "Error al exportar",
            message: e.message || "Ocurrió un error inesperado al generar el PDF.",
            buttons: ["OK"],
          });
          await errorAlert.present();
        }
      } finally {
        await loading.dismiss();
      }
    };

    const exportData = async () => {
      if (questionnaireType.value === "csv") {
        generateAnswerKeyCsv();
        return;
      }

      const actionSheet = await actionSheetController.create({
        header: "Exportar como PDF",
        buttons: [
          {
            text: "PDF Estándar (A4)",
            handler: () => exportPDF("standard"),
          },
          {
            text: "PDF Térmica (80mm)",
            handler: () => exportPDF("thermal"),
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await actionSheet.present();
    };

    const generateAnswerKeyCsv = () => {
      let csvContent = '"Q No","KEY"\n';
      const limitedQuestions = localQuestions.value.slice(0, questionsLimit.value);

      limitedQuestions.forEach((question, index) => {
        const correctOption = question.options.find((option) => option.correct);
        csvContent += `"${index + 1}","${
          correctOption ? correctOption.identifier : ""
        }"\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${props.title}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const printView = () => {
      const printWindow = window.open("", "", "height=600,width=800");
      printWindow.document.write(
        `<html><head><title>${props.lessonData.course.name}:${props.lessonData.topic} - ${props.title}</title>`
      );
      printWindow.document.write(
        `<style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.4; }
          #printable-content { column-count: 2; column-gap: 20px; }
          #printable-content p { break-inside: avoid-column; }
          .fixed-options-container { display: flex; flex-wrap: wrap; gap: 10px; }
          .fixed-option-item { flex: 1 1 calc(50% - 10px); box-sizing: border-box; }
        </style>`
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(
        `<div id="printable-content">${generatedHtml.value}</div>`
      );
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      /*  printWindow.onload = function () {
        printWindow.print();
        printWindow.close();
      }; */
    };

    const printThermal = () => {
      const printWindow = window.open("", "", "height=600,width=320");
      printWindow.document.write(
        `<html><head><title>${props.lessonData.course.name}:${props.lessonData.topic} - ${props.title}</title>`
      );
      printWindow.document.write(
        `<style>
          @page { size: 80mm auto; margin: 4mm; }
          body { font-family: Arial, sans-serif; width: 72mm; margin: 0; padding: 0; font-size: 9pt; line-height: 1.3; }
          h2 { font-size: 10pt; margin: 2mm 0 1mm 0; text-align: center; }
          h3 { font-size: 9pt; margin: 1mm 0; text-align: center; }
          #printable-content { column-count: 1; }
          #printable-content p { margin: 1mm 0; break-inside: avoid; }
          .fixed-options-container { display: block; }
          .fixed-option-item { display: block; margin: 1mm 0; }
          strong { font-weight: bold; }
        </style>`
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(
        `<div id="printable-content">${generatedHtml.value}</div>`
      );
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
    };

    watch(
      () => props.isOpen,
      (newVal) => {
        if (newVal) {
          generateQuestionnaire();
        }
      }
    );

    return {
      questionnaireType,
      questionsLimit,
      generatedHtml,
      localQuestions,
      generateQuestionnaire,
      exportData,
      printView,
      printThermal,
      downloadOutline,
      printOutline,
      emit, // Make emit available in the template
    };
  },
});
</script>

<style scoped>
#printable-content {
  column-count: 2;
  column-gap: 20px;
}

#printable-content p {
  break-inside: avoid-column;
}

.fixed-options-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px; /* Espacio entre las opciones */
}

.fixed-option-item {
  flex: 1 1 calc(50% - 10px); /* Dos columnas con espacio */
  box-sizing: border-box;
  /* Puedes añadir más estilos aquí si quieres bordes, padding, etc. */
}
</style>
