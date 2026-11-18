<template>
  <ion-modal :is-open="isOpen" @didDismiss="emit('close')" class="qz-modal-pop">
    <div class="qz-gen-modal-wrapper">
      <!-- 1. Cabecera Queezy -->
      <div class="qz-gen-header">
        <div class="qz-gen-titles">
          <span class="qz-gen-tag">IMPRESIÓN Y EXPORTACIÓN</span>
          <h2 class="qz-gen-title">Generar Cuestionario</h2>
        </div>
        <button
          type="button"
          class="qz-gen-close-btn"
          @click="emit('close')"
          title="Cerrar modal"
        >
          <ion-icon :icon="closeOutline"></ion-icon>
        </button>
      </div>

      <!-- 2. Contenido con Scroll -->
      <div class="qz-gen-body">
        <!-- Tarjeta de Configuración -->
        <div class="qz-config-card">
          <!-- Campo 1: Tipo de Formato -->
          <div class="qz-config-field">
            <label class="qz-config-label">Formato del Cuestionario</label>
            <div class="qz-select-container">
              <ion-select
                v-model="questionnaireType"
                interface="popover"
                class="qz-gen-select"
                @ionChange="generateQuestionnaire"
              >
                <ion-select-option value="fixed">Opciones Fijas (A, B, C, D)</ion-select-option>
                <ion-select-option value="variable">Opciones Variables</ion-select-option>
                <ion-select-option value="answers">Solo Respuestas Correctas</ion-select-option>
                <ion-select-option value="csv">CSV (Claves OMR)</ion-select-option>
              </ion-select>
            </div>
          </div>

          <!-- Campo 2: Rango de Preguntas (2 Columnas) -->
          <div class="qz-range-grid">
            <div class="qz-config-field">
              <label class="qz-config-label">Pregunta Inicial</label>
              <div class="qz-input-wrap">
                <input
                  type="number"
                  v-model.number="questionStart"
                  @input="onRangeChange"
                  :min="1"
                  :max="localQuestions.length"
                  class="qz-native-input"
                />
              </div>
            </div>

            <div class="qz-config-field">
              <label class="qz-config-label">
                Pregunta Final
                <span class="qz-max-badge">Máx: {{ localQuestions.length }}</span>
              </label>
              <div class="qz-input-wrap">
                <input
                  type="number"
                  v-model.number="questionEnd"
                  @input="onRangeChange"
                  :min="1"
                  :max="localQuestions.length"
                  class="qz-native-input"
                />
              </div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="qz-buttons-row">
            <button type="button" class="qz-btn-primary" @click="exportData">
              <ion-icon :icon="downloadOutline"></ion-icon>
              <span>Exportar PDF</span>
            </button>
            <button
              type="button"
              class="qz-btn-secondary"
              @click="printData"
              v-if="!isNative"
            >
              <ion-icon :icon="printOutline"></ion-icon>
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        <!-- Vista previa del cuestionario -->
        <div
          v-if="questionnaireType !== 'csv'"
          class="qz-preview-wrapper"
        >
          <div class="qz-preview-header">
            <span class="qz-preview-tag">VISTA PREVIA DEL EXAMEN</span>
          </div>
          <div id="printable-content" class="qz-printable-area">
            <div v-html="generatedHtml"></div>
          </div>
        </div>
      </div>
    </div>
  </ion-modal>
</template>

<script>
import { ref, watch } from "vue";
import { defineComponent } from "vue";
import {
  IonModal,
  IonSelect,
  IonSelectOption,
  IonIcon,
  actionSheetController,
  alertController,
} from "@ionic/vue";
import { downloadOutline, printOutline, closeOutline } from "ionicons/icons";
import html2canvas from "html2canvas";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
import { basedeURL } from "../globalService";

export default defineComponent({
  name: "CuestionarioGeneratorModal",
  components: {
    IonModal,
    IonSelect,
    IonSelectOption,
    IonIcon,
  },
  props: {
    isOpen: Boolean,
    questions: Array,
    title: String,
    lessonData: Object,
  },
  setup(props, { emit }) {
    const questionnaireType = ref("variable");
    const questionStart = ref(1);
    const questionEnd = ref(0);
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
          questionStart.value = 1;
          questionEnd.value = localQuestions.value.length;
        }
      },
      { immediate: true },
    );

    const generateQuestionnaire = () => {
      if (!localQuestions.value || localQuestions.value.length === 0) {
        generatedHtml.value = "";
        return;
      }

      let htmlOutput = `<h2>LECCIÓN: ${props.lessonData.topic}</h2> <h2> CUESTIONARIO: ${props.title}</h2><h3>Grado: ${props.lessonData.course.name}</h3>`;
      const type = questionnaireType.value;

      let start = parseInt(questionStart.value);
      let end = parseInt(questionEnd.value);
      if (isNaN(start) || start < 1) start = 1;
      if (isNaN(end) || end < start) end = start;
      if (end > localQuestions.value.length)
        end = localQuestions.value.length;

      const limitedQuestions = localQuestions.value.slice(start - 1, end);

      if (type === "fixed" && limitedQuestions.length > 0) {
        htmlOutput += `<p>Responda la pregunta ${start} a la ${end} teniendo como opciones de respuesta las siguientes:</p>`;
        htmlOutput += `<div class="fixed-options-container">`;

        const firstQuestionOptions = limitedQuestions[0].options || [];

        firstQuestionOptions
          .slice()
          .sort((a, b) => a.identifier.localeCompare(b.identifier))
          .forEach((opt) => {
            htmlOutput += `<div class="fixed-option-item"><strong>${opt.identifier}. </strong>${opt.sentence}</div>`;
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
          "<strong>$2</strong>",
        );

        htmlOutput += `<div class="question-item">`;
        htmlOutput += `<p class="question-title"><strong>${
          start + index
        }. </strong>${processedSentence}</p>`;

        if (question.photo) {
          const photoUrl = question.photo.startsWith("http")
            ? question.photo
            : (basedeURL() || "") + question.photo;
          htmlOutput += `<img src="${photoUrl}" style="max-width:100%;margin:4px 0 12px 0;display:block;" />`;
        }

        if (type === "variable") {
          htmlOutput += `<div class="question-options">`;
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
                "<strong>$2</strong>",
              );
              htmlOutput += `<p class="question-option"><strong>${opt.identifier}. </strong>${processedOptionSentence}</p>`;
            });
          htmlOutput += `</div>`;
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
              "<strong>$2</strong>",
            );
            htmlOutput += `<div class="question-options">`;
            htmlOutput += `<p class="question-option"><strong>${correct.identifier}. </strong>${processedCorrectSentence}</p>`;
            htmlOutput += `</div>`;
          }
        }

        htmlOutput += `</div>`;
      });

      generatedHtml.value = htmlOutput;
    };

    const getBase64ImageFromUrl = async (imageUrl) => {
      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    };

    const convertImagesToBase64 = async (html) => {
      const baseUrl = basedeURL() || "";
      const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
      const matches = [...html.matchAll(imgRegex)];

      for (const match of matches) {
        const fullMatch = match[0];
        const src = match[1];
        let absoluteUrl = src;
        if (src.startsWith("/")) {
          absoluteUrl = baseUrl + src;
        } else if (!src.startsWith("http") && !src.startsWith("data:")) {
          absoluteUrl = baseUrl + "/" + src;
        }
        if (absoluteUrl.startsWith("data:")) continue;
        const base64 = await getBase64ImageFromUrl(absoluteUrl);
        if (base64) {
          html = html.replace(fullMatch, fullMatch.replace(src, base64));
        }
      }
      return html;
    };

    const atkinsonDither = (base64Image) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const w = canvas.width;
          const h = canvas.height;

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4;
              const old = data[idx];
              const newVal = old > 128 ? 255 : 0;
              data[idx] = newVal;
              data[idx + 1] = newVal;
              data[idx + 2] = newVal;
              const err = (old - newVal) / 8;

              const neighbors = [
                [1, 0], [2, 0],
                [-1, 1], [0, 1], [1, 1], [2, 1],
              ];
              for (const [dx, dy] of neighbors) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  const nIdx = (ny * w + nx) * 4;
                  data[nIdx] = Math.max(0, Math.min(255, data[nIdx] + err));
                  data[nIdx + 1] = data[nIdx];
                  data[nIdx + 2] = data[nIdx];
                }
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(base64Image);
        img.src = base64Image;
      });
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
              overflow-wrap: break-word;
              word-break: break-word;
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

            .question-item {
              margin-bottom: ${4 * THERMAL_SCALE}mm;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .question-title {
              margin: 0 0 ${1.5 * THERMAL_SCALE}mm 0;
              font-weight: normal;
              font-size: ${10 * THERMAL_SCALE}pt;
              line-height: 1.35;
            }

            .question-title strong {
              font-weight: bold;
              font-size: ${10.5 * THERMAL_SCALE}pt;
            }

            .question-options {
              margin-left: ${4 * THERMAL_SCALE}mm;
            }

            .question-option {
              margin: ${1 * THERMAL_SCALE}mm 0;
              font-size: ${10 * THERMAL_SCALE}pt;
              line-height: 1.3;
            }

            .question-option strong {
              font-weight: bold;
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

        const headerHtml = `
          <div class="pdf-header">
            <h2>${props.title || "CUESTIONARIO"}</h2>
            <h3>${props.lessonData?.topic || ""}</h3>
            <h3>${props.lessonData?.course?.name || ""}</h3>
          </div>
        `;

        const contentHtml = generatedHtml.value || "";

        // 1. Dividir contenido por question-item
        const chunks = [];
        if (contentHtml.includes("question-item")) {
          const parts = contentHtml.split(/(?=<div class="question-item">)/);
          for (const part of parts) {
            if (part.trim()) chunks.push(part);
          }
        } else {
          chunks.push(contentHtml);
        }

        // 2. Crear contenedor off-screen
        const container = document.createElement("div");
        container.style.cssText =
          "position:absolute;left:-9999px;top:0;width:210mm;padding:8mm;box-sizing:border-box;font-family:Arial,sans-serif;background:#fff;";
        document.body.appendChild(container);

        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true,
        });

        // 3. Renderizar chunk por chunk
        for (let i = 0; i < chunks.length; i++) {
          // Convertir imágenes de este chunk
          let convertedChunk = await convertImagesToBase64(chunks[i]);

          // Aplicar dithering Atkinson a cada imagen del chunk
          const imgMatches = [...convertedChunk.matchAll(/<img\s+[^>]*src="(data:image[^"]+)"[^>]*>/gi)];
          for (const match of imgMatches) {
            const dithered = await atkinsonDither(match[1]);
            convertedChunk = convertedChunk.replace(match[1], dithered);
          }

          container.innerHTML = `
            <!DOCTYPE html><html><head>${thermalStyles}</head><body>
            <div class="pdf-container">
              ${i === 0 ? headerHtml : ""}
              <div class="pdf-content">${convertedChunk}</div>
            </div></body></html>
          `;

          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: "#ffffff",
            windowWidth: 210,
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          const imgW = 210;
          const imgH = (canvas.height * imgW) / canvas.width;

          if (i > 0) pdf.addPage("a4", "portrait");
          pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);

          canvas.width = 0;
          canvas.height = 0;
          container.innerHTML = "";
        }

        document.body.removeChild(container);

        if (Capacitor.isNativePlatform()) {
          const pdfDataUri = pdf.output("datauristring");
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
          pdf.save(filename);
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
      const filename = `${props.lessonData.topic}_${
        props.title || "cuestionario"
      }_${props.lessonData?.course?.name}_carta.pdf`;

      const loading = await alertController.create({
        header: "Generando PDF",
        message: "Generando documento nativo A4...",
        backdropDismiss: false,
      });
      await loading.present();

      try {
        generateQuestionnaire();

        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true,
        });

        const marginX = 15;
        const pageWidth = 210;
        const pageHeight = 297;
        const maxContentWidth = pageWidth - marginX * 2; // 180 mm
        const bottomMargin = 15;
        const topMargin = 22;

        // 2 Column Configuration
        const gap = 8;
        const colWidth = (pageWidth - marginX * 2 - gap) / 2; // 86 mm
        const col1X = marginX;
        const col2X = marginX + colWidth + gap; // 109 mm

        let currentY = 25;
        let inTwoColumns = false;
        let currentColumn = 0;

        const drawPageHeader = () => {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(100, 116, 139); // slate-400
          pdf.text("Cuestionario", marginX, 14);

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(100, 116, 139);
          const rightText = props.title || "Cuestionario";
          const leftLabelWidth = pdf.getTextWidth("Cuestionario");
          const maxRightWidth = pageWidth - marginX * 2 - leftLabelWidth - 6;
          let displayTitle = rightText;
          if (pdf.getTextWidth(displayTitle) > maxRightWidth) {
            while (pdf.getTextWidth(displayTitle + "...") > maxRightWidth && displayTitle.length > 0) {
              displayTitle = displayTitle.slice(0, -1);
            }
            displayTitle += "...";
          }
          pdf.text(
            displayTitle,
            pageWidth - marginX - pdf.getTextWidth(displayTitle),
            14,
          );

          pdf.setDrawColor(226, 232, 240); // slate-200
          pdf.setLineWidth(0.5);
          pdf.line(marginX, 16, pageWidth - marginX, 16);
        };

        const checkPageBreak = (neededHeight) => {
          if (currentY + neededHeight > pageHeight - bottomMargin) {
            if (!inTwoColumns) {
              pdf.addPage("a4", "portrait");
              drawPageHeader();
              currentY = topMargin;
              return true;
            } else {
              if (currentColumn === 0) {
                currentColumn = 1;
                currentY = topMargin;
                return true;
              } else {
                pdf.addPage("a4", "portrait");
                drawPageHeader();
                currentColumn = 0;
                currentY = topMargin;
                return true;
              }
            }
          }
          return false;
        };

        const estimateItemHeight = (node) => {
          let height = 0;
          const titleNode = node.querySelector(".question-title");
          const optionsNode = node.querySelector(".question-options");

          if (titleNode) {
            const qNumStrong = titleNode.querySelector("strong");
            const qNumText = qNumStrong
              ? qNumStrong.innerText || qNumStrong.textContent
              : "";
            const qHtml = titleNode.innerHTML || "";
            const qFrags = extractFragments(qHtml);
            const qFragmentsWithoutNum = (() => {
              let text = "";
              for (const f of qFrags) text += f.text;
              if (qNumText && text.startsWith(qNumText)) {
                return [{ text: text.substring(qNumText.length), bold: false, italic: false, underline: false }];
              }
              return qFrags;
            })();

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            const numWidth = pdf.getTextWidth(qNumText);
            const textIndent = Math.max(numWidth + 1.2, 5);
            const textWidth = colWidth - textIndent;

            const qLines = wrapFragments(qFragmentsWithoutNum, textWidth, 10.5);
            height += qLines.length * 5.5;
            height += 1.5;
          }

          const imgNodes = node.querySelectorAll("img");
          for (const imgNode of imgNodes) {
            const imgSrc = imgNode.getAttribute("src") || "";
            if (!imgSrc) continue;
            if (imgSrc.startsWith("data:image")) {
              try {
                const imgProps = pdf.getImageProperties(imgSrc);
                const imgWidth = colWidth;
                let imgHeight = (imgProps.height / imgProps.width) * imgWidth;
                if (imgHeight > 120) imgHeight = 120;
                height += imgHeight + 8;
              } catch {
                height += 48;
              }
            } else {
              height += 68;
            }
          }

          const allParagraphs = node.querySelectorAll("p");
          for (const pNode of allParagraphs) {
            if (
              pNode.classList.contains("question-title") ||
              pNode.classList.contains("question-option")
            ) continue;
            const pHtml = pNode.innerHTML || pNode.textContent || "";
            if (!pHtml.trim()) continue;
            const pFrags = extractFragments(pHtml);
            const pLines = wrapFragments(pFrags, colWidth, 10);
            height += pLines.length * 5 + 2;
          }

          if (optionsNode) {
            const optionItems =
              optionsNode.querySelectorAll(".question-option");
            for (const optNode of optionItems) {
              const optStrong = optNode.querySelector("strong");
              const optNumText = optStrong
                ? optStrong.innerText || optStrong.textContent
                : "";
              const optHtml = optNode.innerHTML || "";
              const optFrags = extractFragments(optHtml);
              const allText = optFrags.reduce((acc, f) => acc + f.text, "");
              let trimmedFrags = optFrags;
              if (optNumText && allText.startsWith(optNumText)) {
                let charsToRemove = optNumText.length;
                trimmedFrags = [];
                for (const f of optFrags) {
                  if (charsToRemove <= 0) { trimmedFrags.push(f); continue; }
                  if (charsToRemove >= f.text.length) { charsToRemove -= f.text.length; }
                  else { trimmedFrags.push({ text: f.text.substring(charsToRemove), bold: f.bold, italic: f.italic, underline: f.underline }); charsToRemove = 0; }
                }
              }

              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(9.5);
              const optNumWidth = pdf.getTextWidth(optNumText);
              const optTextIndent = Math.max(optNumWidth + 1.2, 4);
              const optTextWidth = colWidth - 4 - optTextIndent;

              const optLines = wrapFragments(trimmedFrags, optTextWidth, 9.5);
              height += optLines.length * 5;
              height += 1.2;
            }
          }
          return height;
        };

        const extractFragments = (htmlStr) => {
          const div = document.createElement("div");
          div.innerHTML = htmlStr;
          const frags = [];
          const walk = (node, bold, italic, underline) => {
            if (node.nodeType === 3) {
              const t = node.textContent;
              if (t) frags.push({ text: t, bold, italic, underline });
              return;
            }
            const tag = node.tagName;
            if (tag === "BR") {
              frags.push({ text: "\n", bold, italic, underline });
              return;
            }
            const b = bold || tag === "STRONG" || tag === "B";
            const i = italic || tag === "EM" || tag === "I";
            const u = underline || tag === "U";
            for (const ch of node.childNodes) walk(ch, b, i, u);
          };
          for (const ch of div.childNodes) walk(ch, false, false, false);
          return frags;
        };

        const setFragmentFont = (frag) => {
          const style = frag.bold
            ? frag.italic ? "bolditalic" : "bold"
            : frag.italic ? "italic" : "normal";
          pdf.setFont("helvetica", style);
        };

        const drawFormattedLine = (frags, x, y, maxWidth, fontSize, color) => {
          pdf.setFontSize(fontSize);
          pdf.setTextColor(color[0], color[1], color[2]);
          let cursorX = x;
          for (const frag of frags) {
            setFragmentFont(frag);
            pdf.text(frag.text, cursorX, y);
            cursorX += pdf.getTextWidth(frag.text);
            if (frag.underline) {
              const w = pdf.getTextWidth(frag.text);
              const underlineY = y + fontSize * 0.12;
              pdf.setDrawColor(color[0], color[1], color[2]);
              pdf.setLineWidth(0.25);
              pdf.line(cursorX - w, underlineY, cursorX, underlineY);
            }
          }
        };

        const wrapFragments = (fragments, maxWidth, fontSize) => {
          const lines = [];
          let currentLine = [];
          let currentWidth = 0;

          for (const frag of fragments) {
            const parts = frag.text.split("\n");
            for (let pi = 0; pi < parts.length; pi++) {
              if (pi > 0) {
                lines.push(currentLine);
                currentLine = [];
                currentWidth = 0;
              }
              const segment = parts[pi];
              if (!segment) continue;
              const words = segment.split(/(\s+)/);
              for (const word of words) {
                if (!word) continue;
                pdf.setFont("helvetica", frag.bold ? "bold" : "normal");
                pdf.setFontSize(fontSize);
                const wordWidth = pdf.getTextWidth(word);
                if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
                  lines.push(currentLine);
                  currentLine = [];
                  currentWidth = 0;
                }
                currentLine.push({ text: word, bold: frag.bold, italic: frag.italic, underline: frag.underline });
                currentWidth += wordWidth;
              }
            }
          }
          if (currentLine.length > 0) lines.push(currentLine);
          return lines;
        };

        const drawListItem = (numberStr, htmlStr, isQuestion) => {
          const fontSizeNumber = isQuestion ? 11 : 9.5;
          const fontSizeText = isQuestion ? 10.5 : 9.5;
          const fontColorNumber = [15, 23, 42];
          const fontColorText = isQuestion ? [51, 65, 85] : [71, 85, 105];

          const colW = inTwoColumns ? colWidth : maxContentWidth;
          const currentWidth = isQuestion ? colW : colW - 4;
          const lineHeight = isQuestion ? 5.5 : 5;

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(fontSizeNumber);
          const numWidth = pdf.getTextWidth(numberStr);
          const textIndent = Math.max(numWidth + 1.2, isQuestion ? 5 : 4);
          const textWidth = currentWidth - textIndent;

          const fragments = extractFragments(htmlStr);
          const lines = wrapFragments(fragments, textWidth, fontSizeText);
          const neededHeight = lines.length * lineHeight;
          checkPageBreak(neededHeight);

          const finalColX = inTwoColumns
            ? currentColumn === 0 ? col1X : col2X
            : marginX;
          const finalMarginX = isQuestion ? finalColX : finalColX + 4;

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(fontSizeNumber);
          pdf.setTextColor(fontColorNumber[0], fontColorNumber[1], fontColorNumber[2]);
          pdf.text(numberStr, finalMarginX, currentY);

          lines.forEach((lineFrags, idx) => {
            drawFormattedLine(
              lineFrags,
              finalMarginX + textIndent,
              currentY + idx * lineHeight,
              textWidth,
              fontSizeText,
              fontColorText,
            );
          });

          currentY += neededHeight;
        };

        // Draw Header on first page
        drawPageHeader();

        // Parse HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(generatedHtml.value, "text/html");
        const children = Array.from(doc.body.childNodes);

        for (const node of children) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (!text) continue;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(11);
            pdf.setTextColor(30, 41, 59);

            const lines = pdf.splitTextToSize(text, maxContentWidth);
            const lineHeight = 6;

            for (const line of lines) {
              checkPageBreak(lineHeight);
              pdf.text(line, marginX, currentY);
              currentY += lineHeight;
            }
            currentY += 2;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            if (tagName === "div" && node.classList.contains("question-item")) {
              if (!inTwoColumns) {
                inTwoColumns = true;
                currentColumn = 0;
                currentY += 2; // gap before columns
              }

              const estimatedHeight = estimateItemHeight(node);
              const maxColHeight = pageHeight - bottomMargin - topMargin;

              if (estimatedHeight < maxColHeight) {
                checkPageBreak(estimatedHeight);
              }

              const titleNode = node.querySelector(".question-title");
              const optionsNode = node.querySelector(".question-options");

              if (titleNode) {
                const qNumStrong = titleNode.querySelector("strong");
                const qNumText = qNumStrong
                  ? qNumStrong.innerText || qNumStrong.textContent
                  : "";

                const qHtml = titleNode.innerHTML || "";
                let trimmedHtml = qHtml;
                if (qNumText) {
                  const tmp = document.createElement("div");
                  tmp.innerHTML = qHtml;
                  const fullText = tmp.textContent || "";
                  if (fullText.startsWith(qNumText)) {
                    const charsToRemove = qNumText.length;
                    let removed = 0;
                    const walkAndTrim = (node) => {
                      if (removed >= charsToRemove) return;
                      if (node.nodeType === 3) {
                        const len = Math.min(node.textContent.length, charsToRemove - removed);
                        node.textContent = node.textContent.substring(len);
                        removed += len;
                      } else {
                        for (const ch of node.childNodes) walkAndTrim(ch);
                      }
                    };
                    walkAndTrim(tmp);
                    trimmedHtml = tmp.innerHTML;
                  }
                }

                drawListItem(qNumText, trimmedHtml, true);
                currentY += 1.5;
              }

              const imgNodes = node.querySelectorAll("img");
              for (const imgNode of imgNodes) {
                let imgSrc = imgNode.getAttribute("src") || "";
                if (!imgSrc) continue;
                if (!imgSrc.startsWith("data:image")) {
                  try {
                    imgSrc = await getBase64ImageFromUrl(imgSrc);
                  } catch { continue; }
                  if (!imgSrc) continue;
                }
                try {
                  const imgProps = pdf.getImageProperties(imgSrc);
                  const maxImgWidth = inTwoColumns ? colWidth : maxContentWidth;
                  let imgWidth = maxImgWidth;
                  let imgHeight =
                    (imgProps.height / imgProps.width) * imgWidth;
                  if (imgHeight > 120) {
                    imgHeight = 120;
                    imgWidth = (imgProps.width / imgProps.height) * imgHeight;
                  }
                  checkPageBreak(imgHeight + 8);
                  const imgX = inTwoColumns
                    ? currentColumn === 0
                      ? col1X
                      : col2X
                    : marginX;
                  pdf.addImage(imgSrc, "JPEG", imgX, currentY, imgWidth, imgHeight);
                  currentY += imgHeight + 8;
                } catch {
                  // skip broken image
                }
              }

              const allParagraphs = node.querySelectorAll("p");
              for (const pNode of allParagraphs) {
                if (
                  pNode.classList.contains("question-title") ||
                  pNode.classList.contains("question-option")
                ) continue;
                const pHtml = pNode.innerHTML || pNode.textContent || "";
                if (!pHtml.trim()) continue;
                const colW = inTwoColumns ? colWidth : maxContentWidth;
                const pFrags = extractFragments(pHtml);
                const pLines = wrapFragments(pFrags, colW, 10);
                const pColor = [51, 65, 85];
                const pLh = 5;
                for (const lineFrags of pLines) {
                  checkPageBreak(pLh);
                  const lx = inTwoColumns
                    ? currentColumn === 0 ? col1X : col2X
                    : marginX;
                  drawFormattedLine(lineFrags, lx, currentY, colW, 10, pColor);
                  currentY += pLh;
                }
                currentY += 2;
              }

              if (optionsNode) {
                const optionItems =
                  optionsNode.querySelectorAll(".question-option");
                for (const optNode of optionItems) {
                  const optStrong = optNode.querySelector("strong");
                  const optNumText = optStrong
                    ? optStrong.innerText || optStrong.textContent
                    : "";

                  const optHtml = optNode.innerHTML || "";
                  let trimmedHtml = optHtml;
                  if (optNumText) {
                    const tmp = document.createElement("div");
                    tmp.innerHTML = optHtml;
                    const fullText = tmp.textContent || "";
                    if (fullText.startsWith(optNumText)) {
                      const charsToRemove = optNumText.length;
                      let removed = 0;
                      const walkAndTrim = (node) => {
                        if (removed >= charsToRemove) return;
                        if (node.nodeType === 3) {
                          const len = Math.min(node.textContent.length, charsToRemove - removed);
                          node.textContent = node.textContent.substring(len);
                          removed += len;
                        } else {
                          for (const ch of node.childNodes) walkAndTrim(ch);
                        }
                      };
                      walkAndTrim(tmp);
                      trimmedHtml = tmp.innerHTML;
                    }
                  }

                  drawListItem(optNumText, trimmedHtml, false);
                  currentY += 1.2;
                }
              }
              currentY += 3;
            } else if (
              tagName === "div" &&
              node.classList.contains("fixed-options-container")
            ) {
              const optionItems = node.querySelectorAll(".fixed-option-item");
              for (const optNode of optionItems) {
                const optStrong = optNode.querySelector("strong");
                const optNumText = optStrong
                  ? optStrong.innerText || optStrong.textContent
                  : "";

                let optText = optNode.innerText || optNode.textContent || "";
                if (optNumText && optText.startsWith(optNumText)) {
                  optText = optText.substring(optNumText.length);
                }
                optText = optText.trim();

                drawListItem(optNumText, optText, false);
                currentY += 1.2;
              }
              currentY += 3;
            } else if (tagName === "p") {
              const text = node.innerText || node.textContent || "";
              if (text.trim()) {
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(11);
                pdf.setTextColor(51, 65, 85);
                const lines = pdf.splitTextToSize(text, maxContentWidth);
                for (const line of lines) {
                  checkPageBreak(6);
                  pdf.text(line, marginX, currentY);
                  currentY += 6;
                }
                currentY += 2;
              }
            } else if (tagName.startsWith("h") && tagName.length === 2) {
              const level = parseInt(tagName.charAt(1), 10);
              const text = node.innerText || node.textContent || "";
              if (!text.trim()) continue;

              let fontSize = 12;
              let lineHeight = 6;
              let bottomSpace = 4;

              if (level === 1) {
                fontSize = 18;
                lineHeight = 9;
                bottomSpace = 6;
              } else if (level === 2) {
                fontSize = 15;
                lineHeight = 8;
                bottomSpace = 5;
              } else {
                fontSize = 12;
                lineHeight = 7;
                bottomSpace = 4;
              }

              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(fontSize);
              pdf.setTextColor(15, 23, 42);

              const lines = pdf.splitTextToSize(text, colWidth);
              currentY += 2;
              checkPageBreak(lineHeight);

              for (const line of lines) {
                checkPageBreak(lineHeight);
                pdf.text(line, marginX, currentY);
                currentY += lineHeight;
              }
              currentY += bottomSpace;
            } else if (tagName === "hr") {
              checkPageBreak(5);
              pdf.setDrawColor(203, 213, 225);
              pdf.setLineWidth(0.5);
              pdf.line(
                marginX,
                currentY + 2,
                pageWidth - marginX,
                currentY + 2,
              );
              currentY += 6;
            }
          }
        }

        // Share or Save PDF
        if (Capacitor.isNativePlatform()) {
          const pdfOutput = pdf.output("datauristring");
          const base64Data = pdfOutput.split(",")[1];
          await FileSharer.share({
            filename: filename,
            contentType: "application/pdf",
            base64Data: base64Data,
          });
        } else {
          pdf.save(filename);
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

      let start = parseInt(questionStart.value);
      let end = parseInt(questionEnd.value);
      if (isNaN(start) || start < 1) start = 1;
      if (isNaN(end) || end < start) end = start;
      if (end > localQuestions.value.length)
        end = localQuestions.value.length;

      const limitedQuestions = localQuestions.value.slice(start - 1, end);

      limitedQuestions.forEach((question, index) => {
        const correctOption = question.options.find((option) => option.correct);
        csvContent += `"${start + index}","${
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
        `<html><head><title>${props.lessonData.course.name}: ${props.lessonData.topic} - ${props.title}</title>`,
      );
      printWindow.document.write(
        `<style>
          body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.4; }
          h2, h3 { text-align: center; margin-bottom: 15px; }
          h2 { font-size: 18px; }
          h3 { font-size: 14px; color: #333; }
          #printable-content { column-count: 2; column-gap: 20px; }
          .question-item { break-inside: avoid-column; page-break-inside: avoid; margin-bottom: 12px; }
          .question-title { margin: 0 0 4px 0; font-weight: normal; }
          .question-title strong { font-weight: bold; }
          .question-options { margin-left: 15px; }
          .question-option { margin: 2px 0; }
          .question-option strong { font-weight: bold; }
          .fixed-options-container { display: flex; flex-wrap: wrap; gap: 10px; column-span: all; margin-bottom: 15px; }
          .fixed-option-item { flex: 1 1 calc(50% - 10px); box-sizing: border-box; }
        </style>`,
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(`<h2>${props.title}</h2>`);
      printWindow.document.write(
        `<h3>${props.lessonData.topic} - ${props.lessonData.course.name}</h3>`,
      );
      printWindow.document.write(
        `<div id="printable-content">${generatedHtml.value}</div>`,
      );
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
    };

    const printThermal = () => {
      const printWindow = window.open("", "", "height=900,width=400");
      printWindow.document.write(
        `<html><head><title>${props.lessonData.course.name}: ${props.lessonData.topic}</title>`,
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
          .question-item { margin: 2mm 0; break-inside: avoid; page-break-inside: avoid; }
          .question-title { margin: 0 0 1mm 0; font-weight: normal; }
          .question-title strong { font-weight: bold; }
          .question-options { margin-left: 4mm; }
          .question-option { margin: 0.5mm 0; }
          .question-option strong { font-weight: bold; }
          .fixed-options-container { display: block; margin-bottom: 3mm; }
          .fixed-option-item { display: block; margin: 1mm 0; font-size: 9pt; }
        </style>`,
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(`<h2>${props.title}</h2>`);
      printWindow.document.write(`<h3>${props.lessonData.topic}</h3>`);
      printWindow.document.write(`<h3>${props.lessonData.course.name}</h3>`);
      printWindow.document.write(
        `<div id="printable-content">${generatedHtml.value}</div>`,
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

    const onRangeChange = () => {
      let start = parseInt(questionStart.value);
      let end = parseInt(questionEnd.value);
      if (isNaN(start) || start < 1) start = 1;
      if (start > localQuestions.value.length)
        start = localQuestions.value.length;
      if (isNaN(end) || end < start) end = start;
      if (end > localQuestions.value.length)
        end = localQuestions.value.length;
      questionStart.value = start;
      questionEnd.value = end;
      generateQuestionnaire();
    };

    const isNative = Capacitor.isNativePlatform();

    watch(
      () => props.isOpen,
      (newVal) => {
        if (newVal) {
          generateQuestionnaire();
        }
      },
    );

    return {
      questionnaireType,
      questionStart,
      questionEnd,
      generatedHtml,
      localQuestions,
      isNative,
      generateQuestionnaire,
      onRangeChange,
      exportData,
      printData,
      downloadOutline,
      printOutline,
      closeOutline,
      emit,
    };
  },
});
</script>

<style scoped>
.qz-gen-modal-wrapper {
  background: #EFEEFC;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
}

/* 1. Cabecera */
.qz-gen-header {
  background: linear-gradient(180deg, #6A5AE0 0%, #7668E3 100%);
  padding: 16px 20px 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(106, 90, 224, 0.15);
}

.qz-gen-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
}

.qz-gen-title {
  margin: 2px 0 0 0;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 20px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: -0.3px;
}

.qz-gen-close-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #FFFFFF;
  border-radius: var(--qz-radius-full, 9999px);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease;
}

.qz-gen-close-btn:active {
  transform: scale(0.92);
}

/* 2. Cuerpo con Scroll */
.qz-gen-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Tarjeta de Configuración */
.qz-config-card {
  background: #FFFFFF;
  border-radius: var(--qz-radius-xl, 22px);
  padding: 18px;
  box-shadow: 0 6px 20px -4px rgba(106, 90, 224, 0.08);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-config-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-config-label {
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 12px;
  font-weight: 700;
  color: #0C092A;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-max-badge {
  font-size: 11px;
  color: #858494;
  font-weight: 500;
}

.qz-select-container {
  background: #F4F3FD;
  border: 1px solid #E0DCFA;
  border-radius: 14px;
  padding: 4px 12px;
}

.qz-gen-select {
  --color: #0C092A;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 13px;
  font-weight: 700;
}

/* Grid de Rango */
.qz-range-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.qz-input-wrap {
  background: #F4F3FD;
  border: 1px solid #E0DCFA;
  border-radius: 14px;
  padding: 8px 12px;
}

.qz-native-input {
  width: 100%;
  border: none;
  background: transparent;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 14px;
  font-weight: 700;
  color: #0C092A;
  outline: none;
}

/* Botones */
.qz-buttons-row {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.qz-btn-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--ion-color-primary, #6A5AE0);
  color: #FFFFFF;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 12px;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.28);
  transition: transform 0.15s ease;
}

.qz-btn-primary:active {
  transform: scale(0.98);
}

.qz-btn-secondary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #FFFFFF;
  color: var(--ion-color-primary, #6A5AE0);
  border: 1px solid #D6D1F9;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 12px;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.qz-btn-secondary:active {
  transform: scale(0.98);
  background: #F9F9FE;
}

/* Vista Previa */
.qz-preview-wrapper {
  background: #FFFFFF;
  border-radius: var(--qz-radius-xl, 22px);
  padding: 18px;
  box-shadow: 0 6px 20px -4px rgba(106, 90, 224, 0.08);
}

.qz-preview-header {
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ECEAF9;
}

.qz-preview-tag {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--ion-color-primary, #6A5AE0);
  text-transform: uppercase;
}

.qz-printable-area {
  padding: 4px;
}

#printable-content {
  column-count: 2;
  column-gap: 20px;
}

.question-item {
  break-inside: avoid-column;
  page-break-inside: avoid;
  margin-bottom: 15px;
}

.question-title {
  margin: 0 0 6px 0;
  font-weight: normal;
}

.question-title strong {
  font-weight: bold;
}

.question-options {
  margin-left: 15px;
}

.question-option {
  margin: 4px 0;
}

.question-option strong {
  font-weight: bold;
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
