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
        Exportar PDF
      </ion-button>
      <ion-button expand="block" @click="printData" fill="outline" v-if="!isNative">
        <ion-icon slot="start" :icon="printOutline"></ion-icon>
        Imprimir
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
    lessonData: Object,
  },
  setup(props, { emit }) {
    const questionnaireType = ref("variable");
    const questionsLimit = ref(0);
    const generatedHtml = ref("");
    const localQuestions = ref([]);

    // Escala para impresora térmica 80mm en PDF A4
    // A4: 210mm | Térmica: 80mm | Escala: 210/80 = 2.625 ≈ 2.6
    const THERMAL_SCALE = 2.6;

    // Deep copy questions prop
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
      
      let limit = parseInt(questionsLimit.value);
      if (isNaN(limit) || limit < 1) limit = 1;
      if (limit > localQuestions.value.length) limit = localQuestions.value.length;

      const limitedQuestions = localQuestions.value.slice(0, limit);

      if (type === "fixed" && limitedQuestions.length > 0) {
        htmlOutput += `<p>Responda la pregunta 1 a la ${limitedQuestions.length} teniendo como opciones de respuesta las siguientes:</p>`;
        htmlOutput += `<div class="fixed-options-container">`;
        
        const firstQuestionOptions = limitedQuestions[0].options || [];
        
        firstQuestionOptions
          .slice()
          .sort((a, b) => a.identifier.localeCompare(b.identifier))
          .forEach((opt) => {
            htmlOutput += `<div class="fixed-option-item">${opt.identifier}. ${opt.sentence}</div>`;
          });
        htmlOutput += `</div>`;
      }

      limitedQuestions.forEach((question, index) => {
        let processedSentence = question.sentence;

        if (
          processedSentence.trim().startsWith("<p>") &&
          processedSentence.trim().endsWith("</p>")
        ) {
          processedSentence = processedSentence.trim().slice(3, -4);
        }

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

    /**
     * NUEVA FUNCIÓN: Exportar PDF A4 escalado para impresora térmica
     * El contenido se escala 2.6x para que al imprimirse en 80mm
     * tenga proporciones reales de ticket
     */
    const exportPDFThermal = async () => {
      const filename = `${props.title || "cuestionario"}_thermal.pdf`;

      const loading = await alertController.create({
        header: "Generando PDF",
        message: "Escalando para impresora térmica...",
        backdropDismiss: false,
      });
      await loading.present();

      try {
        generateQuestionnaire();

        // ============================================================
        // CSS ESCALADO 2.6x PARA A4 → TÉRMICA 80mm
        // Solo se escala FONT-SIZE, no margins/padding
        // ============================================================
        const thermalStyles = `
          <style>
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
            }
            
            .pdf-container {
              width: 210mm;
              box-sizing: border-box;
              padding: 8mm;
              font-family: "Arial", sans-serif;
              color: #000;
              background: #fff;
              font-size: ${10 * THERMAL_SCALE}pt;
              line-height: 1.3;
            }
            
            .pdf-header {
              text-align: center;
              margin-bottom: 4mm;
              border-bottom: 1px solid #000;
              padding-bottom: 2mm;
              width: 100%;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            
            .pdf-header h2 {
              font-size: ${11 * THERMAL_SCALE}pt;
              font-weight: bold;
              margin: 0 0 2mm 0;
              letter-spacing: 0.5px;
            }
            
            .pdf-header h3 {
              font-size: ${10 * THERMAL_SCALE}pt;
              margin: 0 0 1mm 0;
              font-weight: 600;
            }
            
            .pdf-content {
              width: 100%;
              box-sizing: border-box;
            }
            
            .pdf-content p {
              margin: 0 0 4mm 0;
              page-break-inside: avoid;
              break-inside: avoid;
              font-size: ${10 * THERMAL_SCALE}pt;
              line-height: 1.35;
              orphans: 2;
              widows: 2;
            }
            
            .pdf-content p strong {
              font-weight: bold;
              font-size: ${10.5 * THERMAL_SCALE}pt;
            }
            
            .pdf-content p br {
              display: block;
              content: "";
              margin: 1.5mm 0;
            }
            
            .fixed-options-container {
              display: block;
              margin-bottom: 4mm;
              padding: 0;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .fixed-option-item {
              display: block;
              margin-bottom: 2mm;
              font-size: ${10 * THERMAL_SCALE}pt;
              page-break-inside: avoid;
              break-inside: avoid;
              line-height: 1.3;
            }
          </style>
        `;

        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              ${thermalStyles}
            </head>
            <body>
              <div class="pdf-container">
                <div class="pdf-header">
                  <h2>${props.title || "CUESTIONARIO"}</h2>
                  <h3>${props.lessonData?.topic || ""}</h3>
                  <h3>${props.lessonData?.course?.name || ""}</h3>
                </div>
                <div class="pdf-content">
                  ${generatedHtml.value || "No hay contenido disponible."}
                </div>
              </div>
            </body>
          </html>
        `;

        const element = document.createElement("div");
        element.innerHTML = htmlContent;
        element.style.width = "210mm";
        element.style.margin = "0";
        element.style.padding = "0";

        // Configuración html2pdf optimizada
        const opt = {
          margin: 0,
          filename: filename,
          image: {
            type: "jpeg",
            quality: 0.98,
          },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: "#ffffff",
            windowHeight: 1400,
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait",
            compress: true,
          },
          pagebreak: {
            mode: ["avoid-all", "css", "legacy"],
          },
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
            message: e.message || "Ocurrió un error inesperado.",
            buttons: ["OK"],
          });
          await errorAlert.present();
        }
      } finally {
        await loading.dismiss();
      }
    };

    /**
     * FUNCIÓN ESTÁNDAR: PDF A4 normal (sin escala)
     */
    const exportPDFStandard = async () => {
      const filename = `${props.title || "cuestionario"}_standard.pdf`;

      const loading = await alertController.create({
        header: "Generando PDF",
        message: "Por favor espere...",
        backdropDismiss: false,
      });
      await loading.present();

      try {
        generateQuestionnaire();

        const standardStyles = `
          <style>
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            html, body {
              width: 100%;
              margin: 0;
              padding: 0;
            }
            
            .pdf-container {
              width: 210mm;
              box-sizing: border-box;
              padding: 15mm;
              font-family: "Arial", sans-serif;
              color: #000;
              background: #fff;
              font-size: 11pt;
            }
            
            .pdf-header {
              text-align: center;
              margin-bottom: 12mm;
              border-bottom: 1px solid #000;
              padding-bottom: 5mm;
              width: 100%;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            
            .pdf-header h2 {
              font-size: 18pt;
              font-weight: bold;
              margin: 0 0 5mm 0;
            }
            
            .pdf-header h3 {
              font-size: 14pt;
              margin: 0 0 2mm 0;
              font-weight: 600;
            }
            
            .pdf-content {
              width: 100%;
              column-count: 2;
              column-gap: 10mm;
              box-sizing: border-box;
            }
            
            .pdf-content p {
              margin: 0 0 6mm 0;
              page-break-inside: avoid;
              break-inside: avoid-column;
              font-size: 11pt;
              line-height: 1.4;
              orphans: 2;
              widows: 2;
            }
            
            .pdf-content p strong {
              font-weight: bold;
              font-size: 12pt;
            }
            
            .fixed-options-container {
              display: flex;
              flex-wrap: wrap;
              gap: 8mm;
              margin-bottom: 8mm;
              column-span: all;
              page-break-inside: avoid;
            }
            
            .fixed-option-item {
              flex: 0 0 calc(50% - 4mm);
              font-size: 11pt;
              page-break-inside: avoid;
              break-inside: avoid;
            }
          </style>
        `;

        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              ${standardStyles}
            </head>
            <body>
              <div class="pdf-container">
                <div class="pdf-header">
                  <h2>${props.title || "CUESTIONARIO"}</h2>
                  <h3>${props.lessonData?.topic || ""}</h3>
                  <h3>${props.lessonData?.course?.name || ""}</h3>
                </div>
                <div class="pdf-content">
                  ${generatedHtml.value || "No hay contenido disponible."}
                </div>
              </div>
            </body>
          </html>
        `;

        const element = document.createElement("div");
        element.innerHTML = htmlContent;

        const opt = {
          margin: 0,
          filename: filename,
          image: {
            type: "jpeg",
            quality: 0.98,
          },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait",
            compress: true,
          },
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
          msg.includes("dismiss");

        if (!isCancel) {
          console.error("PDF EXPORT ERROR:", e);
          const errorAlert = await alertController.create({
            header: "Error al exportar",
            message: e.message || "Ocurrió un error inesperado.",
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
            text: "📄 A4 Estándar",
            handler: () => exportPDFStandard(),
          },
          {
            text: "🖨️ A4 para Térmica 80mm",
            handler: () => exportPDFThermal(),
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
      
      let limit = parseInt(questionsLimit.value);
      if (isNaN(limit) || limit < 1) limit = 1;
      if (limit > localQuestions.value.length) limit = localQuestions.value.length;

      const limitedQuestions = localQuestions.value.slice(0, limit);

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
      const printWindow = window.open("", "", "height=600,width=900");
      printWindow.document.write(
        `<html><head><title>${props.lessonData.course.name}: ${props.lessonData.topic} - ${props.title}</title>`
      );
      printWindow.document.write(
        `<style>
          body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.4; }
          h2, h3 { text-align: center; margin-bottom: 15px; }
          h2 { font-size: 18px; }
          h3 { font-size: 14px; color: #333; }
          #printable-content { column-count: 2; column-gap: 20px; }
          #printable-content p { break-inside: avoid-column; margin-bottom: 8px; }
          .fixed-options-container { display: flex; flex-wrap: wrap; gap: 10px; column-span: all; }
          .fixed-option-item { flex: 1 1 calc(50% - 10px); box-sizing: border-box; }
        </style>`
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(
        `<h2>${props.title}</h2>`
      );
      printWindow.document.write(
        `<h3>${props.lessonData.topic} - ${props.lessonData.course.name}</h3>`
      );
      printWindow.document.write(
        `<div id="printable-content">${generatedHtml.value}</div>`
      );
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
    };

    const printThermal = () => {
      const printWindow = window.open("", "", "height=900,width=400");
      printWindow.document.write(
        `<html><head><title>${props.lessonData.course.name}: ${props.lessonData.topic}</title>`
      );
      printWindow.document.write(
        `<style>
          @page { size: 80mm auto; margin: 5mm; }
          body { 
            font-family: "Courier New", monospace;
            width: 72mm; 
            margin: 0; 
            padding: 5mm;
            font-size: 9pt; 
            line-height: 1.3;
          }
          h2 { font-size: 11pt; margin: 3mm 0 1mm 0; text-align: center; font-weight: bold; }
          h3 { font-size: 9pt; margin: 1mm 0 2mm 0; text-align: center; }
          #printable-content { column-count: 1; }
          #printable-content p { margin: 2mm 0; break-inside: avoid; page-break-inside: avoid; font-size: 9pt; }
          .fixed-options-container { display: block; margin-bottom: 3mm; }
          .fixed-option-item { display: block; margin: 1mm 0; font-size: 9pt; }
          strong { font-weight: bold; }
        </style>`
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(
        `<h2>${props.title}</h2>`
      );
      printWindow.document.write(
        `<h3>${props.lessonData.topic}</h3>`
      );
      printWindow.document.write(
        `<h3>${props.lessonData.course.name}</h3>`
      );
      printWindow.document.write(
        `<div id="printable-content">${generatedHtml.value}</div>`
      );
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
    };

    const printData = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Imprimir cuestionario",
        buttons: [
          {
            text: "📄 Formato A4",
            handler: () => printView(),
          },
          {
            text: "🖨️ Formato Térmico (80mm)",
            handler: () => printThermal(),
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await actionSheet.present();
    };

    const isNative = Capacitor.isNativePlatform();

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
      isNative,
      generateQuestionnaire,
      exportData,
      printData,
      downloadOutline,
      printOutline,
      emit,
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
  gap: 10px;
}

.fixed-option-item {
  flex: 1 1 calc(50% - 10px);
  box-sizing: border-box;
}
</style>