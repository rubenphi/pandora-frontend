import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
import { alertController } from "@ionic/vue";

// === CONFIGURACIÓN DE DISEÑO DEL GRÁFICO ===
const CONFIG = {
  // Tipografías
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
  canvasWidth: 1000,
  headerHeight: 80,
  footerHeight: 80,

  rowHeight: 80,
  barHeight: 38,
  chartLeftMargin: 190,
  chartRightMargin: 50,
};

/**
 * Genera un gráfico de barras horizontales apiladas al 100% en un Canvas en memoria.
 */
export function generateStackedBarChart(
  sectionKey,
  responses,
  countQuestions,
  startQNum = 1,
) {
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
    const qNum = qIdx + startQNum;

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
 * Genera un gráfico de Torta / Donut en Canvas para la pregunta de Sí / No (Q1).
 */
export function generatePieChart(sectionKey, responses, title = "Pregunta 1") {
  let countSi = 0;
  let countNo = 0;
  let total = 0;

  responses.forEach((r) => {
    let sectionData = [];
    if (r.answers && r.answers[sectionKey]) {
      sectionData = r.answers[sectionKey];
    } else if (r[sectionKey]) {
      sectionData = r[sectionKey];
    }
    if (sectionData.length > 0 && sectionData[0]?.answer) {
      const ans = String(sectionData[0].answer).trim();
      if (ans === "Sí" || ans === "Si") countSi++;
      else if (ans === "No") countNo++;
      total++;
    }
  });

  const canvas = document.createElement("canvas");
  const width = 800;
  const height = 400;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Título
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.fillStyle = "#1e293b";
  ctx.textBaseline = "top";
  ctx.fillText(title, 40, 25);

  const centerX = 260;
  const centerY = 220;
  const outerRadius = 130;
  const innerRadius = 65;

  if (total === 0) {
    ctx.font = "italic 16px Arial, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("Sin respuestas registradas", width / 2, height / 2);
    return canvas.toDataURL("image/png");
  }

  const sliceSiAngle = (countSi / total) * 2 * Math.PI;

  const sliceData = [
    {
      label: "Sí",
      count: countSi,
      percent: Math.round((countSi / total) * 100),
      color: "#38A3A5",
      startAngle: -Math.PI / 2,
      endAngle: -Math.PI / 2 + sliceSiAngle,
    },
    {
      label: "No",
      count: countNo,
      percent: Math.round((countNo / total) * 100),
      color: "#E05D5D",
      startAngle: -Math.PI / 2 + sliceSiAngle,
      endAngle: -Math.PI / 2 + 2 * Math.PI,
    },
  ];

  sliceData.forEach((slice) => {
    if (slice.count === 0) return;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, slice.startAngle, slice.endAngle);
    ctx.arc(
      centerX,
      centerY,
      innerRadius,
      slice.endAngle,
      slice.startAngle,
      true,
    );
    ctx.closePath();

    ctx.fillStyle = slice.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Etiqueta sobre el segmento si es suficientemente grande
    if (slice.percent >= 8) {
      const midAngle = (slice.startAngle + slice.endAngle) / 2;
      const textRadius = (outerRadius + innerRadius) / 2;
      const tx = centerX + Math.cos(midAngle) * textRadius;
      const ty = centerY + Math.sin(midAngle) * textRadius;

      ctx.font = "bold 15px Arial, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${slice.percent}%`, tx, ty);
    }
  });

  // Texto en el centro de la dona
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${total}`, centerX, centerY - 10);

  ctx.font = "12px Arial, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Total respuestas", centerX, centerY + 14);

  // Leyenda a la derecha
  let legendY = 150;
  const legendX = 520;

  sliceData.forEach((slice) => {
    ctx.fillStyle = slice.color;
    ctx.beginPath();
    ctx.arc(legendX, legendY + 10, 10, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = "bold 18px Arial, sans-serif";
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${slice.label}`, legendX + 25, legendY + 10);

    ctx.font = "15px Arial, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(
      `${slice.count} respuestas (${slice.percent}%)`,
      legendX + 75,
      legendY + 10,
    );

    legendY += 50;
  });

  return canvas.toDataURL("image/png");
}

/**
 * Genera un gráfico Radar / Telaraña en Canvas para la pregunta de Selección Múltiple (Q20).
 */
export function generateRadarChart(
  sectionKey,
  responses,
  labels,
  title = "Pregunta 20",
) {
  const counts = {};
  labels.forEach((l) => (counts[l] = 0));
  const total = responses.length;

  responses.forEach((r) => {
    let sectionData = [];
    if (r.answers && r.answers[sectionKey]) {
      sectionData = r.answers[sectionKey];
    } else if (r[sectionKey]) {
      sectionData = r[sectionKey];
    }

    if (Array.isArray(sectionData)) {
      sectionData.forEach((selectedTool) => {
        if (counts[selectedTool] !== undefined) {
          counts[selectedTool]++;
        }
      });
    }
  });

  const canvas = document.createElement("canvas");
  const width = 850;
  const height = 620;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Título
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.fillStyle = "#1e293b";
  ctx.textBaseline = "top";
  ctx.fillText(title, 40, 25);

  const centerX = width / 2;
  const centerY = 330;
  const radius = 190;
  const numAxes = labels.length;

  if (total === 0) {
    ctx.font = "italic 16px Arial, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("Sin respuestas registradas", width / 2, height / 2);
    return canvas.toDataURL("image/png");
  }

  // Anillos concéntricos (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;

  rings.forEach((ringPct) => {
    const r = radius * ringPct;
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Etiqueta de porcentaje en el eje vertical superior
    ctx.font = "10px Arial, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${Math.round(ringPct * 100)}%`, centerX, centerY - r - 2);
  });

  // Ejes radiales y etiquetas de las 11 herramientas
  for (let i = 0; i < numAxes; i++) {
    const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    ctx.strokeStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Posición del texto alrededor del perímetro
    const labelRadius = radius + 28;
    const lx = centerX + labelRadius * Math.cos(angle);
    const ly = centerY + labelRadius * Math.sin(angle);

    ctx.font = "bold 12px Arial, sans-serif";
    ctx.fillStyle = "#334155";
    ctx.textBaseline = "middle";

    if (Math.abs(Math.cos(angle)) < 0.1) {
      ctx.textAlign = "center";
    } else if (Math.cos(angle) > 0) {
      ctx.textAlign = "left";
    } else {
      ctx.textAlign = "right";
    }

    const labelText = labels[i];
    const count = counts[labelText];
    const pct = Math.round((count / total) * 100);

    ctx.fillText(`${labelText} (${pct}%)`, lx, ly);
  }

  // Polígono de datos
  ctx.beginPath();
  labels.forEach((label, i) => {
    const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
    const count = counts[label];
    const pct = total > 0 ? count / total : 0;
    const dataR = radius * pct;

    const x = centerX + dataR * Math.cos(angle);
    const y = centerY + dataR * Math.sin(angle);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();

  ctx.fillStyle = "rgba(56, 163, 165, 0.35)";
  ctx.fill();
  ctx.strokeStyle = "#0f766e";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Puntos sobre los vértices
  labels.forEach((label, i) => {
    const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
    const count = counts[label];
    const pct = total > 0 ? count / total : 0;
    const dataR = radius * pct;

    const x = centerX + dataR * Math.cos(angle);
    const y = centerY + dataR * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f766e";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  return canvas.toDataURL("image/png");
}

/**
 * Genera y descarga/comparte el PDF del reporte para la Encuesta a Padres
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
    const imgSec1 = generateStackedBarChart("seccion1", responses, 14, 1);
    const imgSec2 = generateStackedBarChart("seccion2", responses, 4, 15);

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
    const filename = `resultados_encuesta_padres_${sessionName}_${dateStr}.pdf`;

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

/**
 * Genera y descarga/comparte el PDF del reporte para la Encuesta a Estudiantes
 */
export async function generateStudentSurveyPDF(
  responses,
  sourceLabel,
  sessionInfo,
) {
  if (responses.length === 0) return;

  const loadingAlert = await alertController.create({
    header: "Generando PDF",
    message: "Procesando gráficos e información, por favor espere...",
    backdropDismiss: false,
  });
  await loadingAlert.present();

  try {
    const imgPie = generatePieChart("seccion1", responses, "Pregunta 1");

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
    const imgRadar = generateRadarChart(
      "seccion4",
      responses,
      toolLabels,
      "Pregunta 20",
    );

    const imgSec2 = generateStackedBarChart("seccion2", responses, 14, 2);
    const imgSec3 = generateStackedBarChart("seccion3", responses, 4, 16);

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

    // Página 1: Torta (Q1) + Radar (Q20)
    drawHeader("Reporte de Resultados: Encuesta a Estudiantes");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105);

    pdf.addImage(imgPie, "PNG", 15, 46, 180, 90, undefined, "FAST");
    pdf.addImage(imgRadar, "PNG", 15, 138, 180, 130, undefined, "FAST");

    // Página 2: Likert (Q2 a Q15)
    pdf.addPage();
    drawHeader("Reporte de Resultados: Sección 2");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105);
    pdf.text("Distribución de Frecuencias (Preguntas 2 a 15)", 15, 42);

    const canvas2Height =
      CONFIG.headerHeight + 14 * CONFIG.rowHeight + CONFIG.footerHeight;
    const imgSec2Height = 185 * (canvas2Height / CONFIG.canvasWidth);

    pdf.addImage(imgSec2, "PNG", 15, 46, 185, imgSec2Height, undefined, "FAST");

    // Página 3: Likert (Q16 a Q19)
    pdf.addPage();
    drawHeader("Reporte de Resultados: Sección 3");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105);
    pdf.text("Distribución de Frecuencias (Preguntas 16 a 19)", 15, 42);

    const canvas3Height =
      CONFIG.headerHeight + 4 * CONFIG.rowHeight + CONFIG.footerHeight;
    const imgSec3Height = 185 * (canvas3Height / CONFIG.canvasWidth);

    pdf.addImage(imgSec3, "PNG", 15, 46, 185, imgSec3Height, undefined, "FAST");

    const sessionName = sessionInfo
      ? sessionInfo.label.replace(/\s+/g, "_").toLowerCase()
      : "general";
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `resultados_encuesta_estudiantes_${sessionName}_${dateStr}.pdf`;

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
    console.error("Error generating student survey PDF:", error);
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
