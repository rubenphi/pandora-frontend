import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
import { alertController } from "@ionic/vue";

// === CONFIGURACIÓN DE DISEÑO DEL GRÁFICO ===
const CONFIG = {
  // Tipografías (puedes cambiar los tamaños de fuente aquí)
  questionFont: "bold 22px Arial, sans-serif",
  percentFont: "bold 13px Arial, sans-serif",
  countFont: "9px Arial, sans-serif",
  titleFont: "bold 18px Arial, sans-serif",
  legendFont: "14px Arial, sans-serif",

  // Colores de la escala Likert
  colors: {
    Nunca: "#E05D5D",
    "Algunas veces": "#F0A500",
    "Casi siempre": "#65C18C",
    Siempre: "#38A3A5",
  },

  // Dimensiones (en píxeles) del Canvas
  canvasWidth: 1000, // Ancho total de la imagen del gráfico
  headerHeight: 80, // Margen superior interno del gráfico
  footerHeight: 80, // Margen inferior interno (escala del eje X)

  // Control de ocupación y tamaño de barras
  rowHeight: 80, // Altura asignada a cada fila de pregunta
  barHeight: 38, // Grosor de las barras de porcentaje (debe ser menor a rowHeight)
  chartLeftMargin: 190, // Espacio izquierdo reservado para la etiqueta "Pregunta X"
  chartRightMargin: 50, // Margen derecho del gráfico antes del borde
};

/**
 * Genera un gráfico de barras horizontales apiladas al 100% en un elemento Canvas en memoria
 * y retorna la representación en base64 de la imagen PNG.
 */
export function generateStackedBarChart(sectionKey, responses, countQuestions) {
  const counts = [];
  for (let qIdx = 0; qIdx < countQuestions; qIdx++) {
    counts.push({
      Nunca: 0,
      "Algunas veces": 0,
      "Casi siempre": 0,
      Siempre: 0,
      total: 0,
    });
  }

  responses.forEach((r) => {
    let sectionData = [];
    if (r.answers && r.answers[sectionKey]) {
      sectionData = r.answers[sectionKey];
    } else if (r[sectionKey]) {
      sectionData = r[sectionKey];
    }

    for (let qIdx = 0; qIdx < countQuestions; qIdx++) {
      const item = sectionData[qIdx];
      if (item && item.answer) {
        const ans = item.answer.trim();
        if (counts[qIdx][ans] !== undefined) {
          counts[qIdx][ans]++;
          counts[qIdx].total++;
        }
      }
    }
  });

  const canvas = document.createElement("canvas");
  const width = CONFIG.canvasWidth;
  const rowHeight = CONFIG.rowHeight;
  const headerHeight = CONFIG.headerHeight;
  const footerHeight = CONFIG.footerHeight;
  const height = headerHeight + countQuestions * rowHeight + footerHeight;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const colors = CONFIG.colors;

  ctx.font = CONFIG.titleFont;
  ctx.fillStyle = "#1e293b";
  ctx.textBaseline = "middle";
  ctx.fillText("Distribución de Respuestas", 40, headerHeight / 2);

  const legendKeys = ["Nunca", "Algunas veces", "Casi siempre", "Siempre"];
  let legendX = width - 580;
  ctx.font = CONFIG.legendFont;
  legendKeys.forEach((key) => {
    ctx.fillStyle = colors[key];
    ctx.fillRect(legendX, headerHeight / 2 - 9, 18, 18);
    ctx.fillStyle = "#334155";
    ctx.fillText(key, legendX + 24, headerHeight / 2 + 1);
    legendX += 130;
  });

  const chartWidth = width - CONFIG.chartLeftMargin - CONFIG.chartRightMargin;
  const xStart = CONFIG.chartLeftMargin;

  for (let qIdx = 0; qIdx < countQuestions; qIdx++) {
    const yPos = headerHeight + qIdx * rowHeight;
    const qNum = sectionKey === "seccion1" ? qIdx + 1 : qIdx + 15;

    ctx.font = CONFIG.questionFont;
    ctx.fillStyle = "#475569";
    ctx.textBaseline = "middle";
    ctx.fillText(`Pregunta ${qNum}`, 40, yPos + rowHeight / 2);

    const qData = counts[qIdx];
    const barY = yPos + (rowHeight - CONFIG.barHeight) / 2;
    const barH = CONFIG.barHeight;

    if (qData.total === 0) {
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(xStart, barY, chartWidth, barH);
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(xStart, barY, chartWidth, barH);

      ctx.font = "italic 13px Arial, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textBaseline = "middle";
      ctx.fillText("Sin respuestas registradas", xStart + 20, barY + barH / 2);
      continue;
    }

    let currentX = xStart;
    legendKeys.forEach((key) => {
      const count = qData[key];
      if (count === 0) return;
      const percentage = count / qData.total;
      const segW = percentage * chartWidth;

      ctx.fillStyle = colors[key];
      ctx.fillRect(currentX, barY, segW, barH);

      if (segW > 45) {
        ctx.font = CONFIG.percentFont;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const percentStr = `${Math.round(percentage * 100)}%`;
        ctx.fillText(percentStr, currentX + segW / 2, barY + barH / 2 - 5);

        ctx.font = CONFIG.countFont;
        ctx.fillText(`(${count})`, currentX + segW / 2, barY + barH / 2 + 7);
      }

      currentX += segW;
    });

    ctx.textAlign = "left";
  }

  const footerY = height - footerHeight + 20;
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xStart, footerY);
  ctx.lineTo(xStart + chartWidth, footerY);
  ctx.stroke();

  ctx.font = "11px Arial, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const percent = i * 25;
    const xPos = xStart + (percent / 100) * chartWidth;
    ctx.beginPath();
    ctx.moveTo(xPos, footerY);
    ctx.lineTo(xPos, footerY + 5);
    ctx.stroke();
    ctx.fillText(`${percent}%`, xPos, footerY + 18);
  }
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

/**
 * Genera y descarga/comparte el PDF del reporte de resultados de la encuesta
 */
export async function generateSurveyPDF(responses, sourceLabel, sessionInfo) {
  if (responses.length === 0) return;

  const loadingAlert = await alertController.create({
    header: "Generando PDF",
    message: "Procesando gráficos e información, por favor espere...",
    backdropDismiss: false,
  });
  await loadingAlert.present();

  try {
    const imgSec1 = generateStackedBarChart("seccion1", responses, 14);
    const imgSec2 = generateStackedBarChart("seccion2", responses, 4);

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      unit: "mm",
      format: "letter",
      orientation: "portrait",
    });

    const drawHeader = (titleText) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(30, 41, 59);
      pdf.text(titleText, 15, 20);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);

      let y = 26;
      if (sessionInfo) {
        pdf.text(`Nombre de encuesta: ${sessionInfo.label || "N/A"}`, 15, y);
        y += 5;
        pdf.text(`Año: ${sessionInfo.year || "N/A"}`, 15, y);
      } else {
        pdf.text(`Nombre de encuesta: General`, 15, y);
        y += 5;
        pdf.text(`Año: N/A`, 15, y);
      }

      pdf.text(`Respuestas: ${responses.length}`, 80, y);
      pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 140, y);

      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(15, y + 4, 200, y + 4);
    };

    const canvas1Height =
      CONFIG.headerHeight + 14 * CONFIG.rowHeight + CONFIG.footerHeight;
    const imgSec1Height = 185 * (canvas1Height / CONFIG.canvasWidth);

    const canvas2Height =
      CONFIG.headerHeight + 4 * CONFIG.rowHeight + CONFIG.footerHeight;
    const imgSec2Height = 185 * (canvas2Height / CONFIG.canvasWidth);

    drawHeader("Reporte de Resultados: Sección 1");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(71, 85, 105);
    pdf.text("Distribución de Frecuencias (Preguntas 1 a 14)", 15, 42);

    pdf.addImage(imgSec1, "PNG", 15, 47, 185, imgSec1Height, undefined, "FAST");

    pdf.addPage();
    drawHeader("Reporte de Resultados: Sección 2");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(71, 85, 105);
    pdf.text("Distribución de Frecuencias (Preguntas 15 a 18)", 15, 42);

    pdf.addImage(imgSec2, "PNG", 15, 47, 185, imgSec2Height, undefined, "FAST");

    const sessionName = sessionInfo
      ? sessionInfo.label.replace(/\s+/g, "_").toLowerCase()
      : "general";
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `resultados_encuesta_${sessionName}_${dateStr}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfOutput = pdf.output("datauristring");
      const base64Data = pdfOutput.split(",")[1];
      await FileSharer.share({
        filename,
        contentType: "application/pdf",
        base64Data,
      });
    } else {
      pdf.save(filename);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "No se pudo generar el reporte PDF.",
      buttons: ["OK"],
    });
    await alert.present();
  } finally {
    await loadingAlert.dismiss();
  }
}
