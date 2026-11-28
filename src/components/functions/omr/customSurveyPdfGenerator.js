import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
import { alertController } from "@ionic/vue";

/**
 * Paleta de colores armónica para gráficos estadísticos
 */
const DEFAULT_PALETTE = [
  "#38a3a5", // Teal primario
  "#57cc99", // Verde esmeralda
  "#f0a500", // Ámbar / naranja
  "#e05d5d", // Coral / rojo
  "#4361ee", // Azul índigo
  "#7209b7", // Púrpura
  "#4cc9f0", // Celeste
  "#f72585", // Rosa fuerte
  "#80b918", // Verde lima
  "#6c757d", // Gris
];

const LIKERT_COLORS = {
  Nunca: "#E05D5D",
  "Algunas veces": "#F0A500",
  "Casi siempre": "#65C18C",
  Siempre: "#38A3A5",
  "Sí": "#38A3A5",
  "Si": "#38A3A5",
  "No": "#E05D5D",
};

/**
 * Obtiene el color correspondiente a una etiqueta
 */
function getOptionColor(label, index) {
  if (LIKERT_COLORS[label]) return LIKERT_COLORS[label];
  return DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
}

/**
 * Extrae la respuesta de una respuesta escaneada para una sección y pregunta
 */
function getAnswerValue(response, secKey, qIdx) {
  if (!response || !response.answers) return "";
  const secData = response.answers[secKey];
  if (!secData) return "";

  if (Array.isArray(secData)) {
    const item = secData[qIdx];
    if (item !== null && typeof item === "object") {
      return String(item.answer !== undefined ? item.answer : item.value || "").trim();
    }
    return String(item || "").trim();
  } else if (typeof secData === "object") {
    const item = secData[qIdx + 1] !== undefined ? secData[qIdx + 1] : secData[qIdx];
    if (item !== null && typeof item === "object") {
      return String(item.answer !== undefined ? item.answer : item.value || "").trim();
    }
    return String(item || "").trim();
  }
  return "";
}

/**
 * Genera un gráfico de barras horizontales apiladas al 100% en Canvas en memoria
 */
export function generateStackedBarChartCanvas(section, responses) {
  const secKey = section.name || "";
  const rows = Number(section.rows || 1);
  const labels = Array.isArray(section.labels) && section.labels.length > 0
    ? section.labels.map((l) => String(l).replace(/\n\d+/g, "").trim())
    : ["Nunca", "Algunas veces", "Casi siempre", "Siempre"];

  const counts = [];
  for (let r = 0; r < rows; r++) {
    const qCount = { total: 0 };
    labels.forEach((l) => (qCount[l] = 0));
    counts.push(qCount);
  }

  responses.forEach((resp) => {
    for (let r = 0; r < rows; r++) {
      const ans = getAnswerValue(resp, secKey, r);
      if (ans && counts[r][ans] !== undefined) {
        counts[r][ans]++;
        counts[r].total++;
      }
    }
  });

  const canvas = document.createElement("canvas");
  const width = 1100;
  const headerH = 70;
  const rowH = 65;
  const footerH = 60;
  const height = headerH + rows * rowH + footerH;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Fondo blanco nítido
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Leyenda en el encabezado
  ctx.font = "bold 13px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  let legendX = 220;
  labels.forEach((label, idx) => {
    const color = getOptionColor(label, idx);
    ctx.fillStyle = color;
    ctx.fillRect(legendX, 30, 16, 16);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, 30, 16, 16);

    ctx.fillStyle = "#334155";
    ctx.fillText(label, legendX + 24, 38);
    legendX += ctx.measureText(label).width + 50;
  });

  // Línea divisoria bajo la leyenda
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, headerH - 10);
  ctx.lineTo(width - 40, headerH - 10);
  ctx.stroke();

  // Dibujar barras por cada pregunta
  const barLeft = 220;
  const barWidth = width - barLeft - 50;
  const barHeight = 32;

  for (let r = 0; r < rows; r++) {
    const yCenter = headerH + r * rowH + rowH / 2;
    const yBarTop = yCenter - barHeight / 2;
    const rowPrefix = section.rowPrefix || "P";
    const qStart = Number(section.rowStart || 1);
    const qNum = qStart + r;
    const qPrompt = section.questionPrompts?.[r] || "";

    // Etiqueta de la pregunta (P1, P2 o prompt truncado)
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 15px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${rowPrefix}${qNum}`, 40, yCenter - (qPrompt ? 8 : 0));

    if (qPrompt) {
      ctx.fillStyle = "#64748b";
      ctx.font = "11px Arial, sans-serif";
      const shortPrompt = qPrompt.length > 24 ? qPrompt.substring(0, 22) + "..." : qPrompt;
      ctx.fillText(shortPrompt, 40, yCenter + 10);
    }

    const totalInRow = counts[r].total;
    if (totalInRow === 0) {
      // Barra vacía
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(barLeft, yBarTop, barWidth, barHeight);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "italic 12px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sin respuestas", barLeft + barWidth / 2, yCenter);
      continue;
    }

    let curBarX = barLeft;
    labels.forEach((label, lIdx) => {
      const c = counts[r][label] || 0;
      if (c === 0) return;
      const segWidth = (c / totalInRow) * barWidth;
      const color = getOptionColor(label, lIdx);

      ctx.fillStyle = color;
      ctx.fillRect(curBarX, yBarTop, segWidth, barHeight);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(curBarX, yBarTop, segWidth, barHeight);

      // Texto de porcentaje
      const pct = Math.round((c / totalInRow) * 100);
      if (segWidth > 35) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${pct}%`, curBarX + segWidth / 2, yCenter - 4);

        if (segWidth > 45) {
          ctx.font = "10px Arial, sans-serif";
          ctx.fillText(`(n=${c})`, curBarX + segWidth / 2, yCenter + 7);
        }
      }

      curBarX += segWidth;
    });
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
  };
}

/**
 * Genera un gráfico radial / telaraña en Canvas en memoria
 */
export function generateRadarChartCanvas(section, responses) {
  const secKey = section.name || "";
  const isMultiselect = section.type === "multiselect";
  const rows = Number(section.rows || 1);

  // Ejes del radar
  let axes = [];
  if (isMultiselect) {
    // Para multiselección, los ejes son las opciones disponibles
    const rawLabels =
      Array.isArray(section.options) && section.options.length > 0
        ? section.options
        : Array.isArray(section.labels)
        ? section.labels.flat()
        : [];
    axes = rawLabels.map((l) => String(l).trim()).filter(Boolean);
  } else {
    // Para preguntas, cada eje es una pregunta
    axes = Array.from({ length: rows }, (_, idx) => {
      const qNum = Number(section.rowStart || 1) + idx;
      return `${section.rowPrefix || "P"}${qNum}`;
    });
  }

  if (axes.length < 3) {
    // Si hay menos de 3 ejes, el radar se convierte en barras apiladas
    return generateStackedBarChartCanvas(section, responses);
  }

  const scores = axes.map(() => 0);
  const totalResponses = responses.length;

  if (isMultiselect) {
    responses.forEach((resp) => {
      const sel = resp.answers?.[secKey] || [];
      if (Array.isArray(sel)) {
        sel.forEach((item) => {
          const itemClean = String(item).trim().toLowerCase();
          const idx = axes.findIndex((a) => a.toLowerCase() === itemClean);
          if (idx !== -1) scores[idx]++;
        });
      }
    });
  } else {
    // Promedio relativo (1 a 4 o % de aprobación)
    responses.forEach((resp) => {
      for (let r = 0; r < rows; r++) {
        const ans = getAnswerValue(resp, secKey, r);
        const labels = section.labels || ["Nunca", "Algunas veces", "Casi siempre", "Siempre"];
        const optIdx = labels.findIndex((l) => String(l).includes(ans));
        if (optIdx !== -1) {
          scores[r] += (optIdx + 1) / labels.length;
        }
      }
    });
  }

  const canvas = document.createElement("canvas");
  const width = 900;
  const height = 650;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const radius = 210;
  const numAxes = axes.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Telaraña concéntrica
  const levels = 5;
  for (let lvl = 1; lvl <= levels; lvl++) {
    const rLvl = (radius / levels) * lvl;
    ctx.beginPath();
    for (let a = 0; a < numAxes; a++) {
      const angle = a * angleStep - Math.PI / 2;
      const x = centerX + rLvl * Math.cos(angle);
      const y = centerY + rLvl * Math.sin(angle);
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = lvl === levels ? "#94a3b8" : "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Etiqueta de nivel (%)
    const pctLabel = `${Math.round((lvl / levels) * 100)}%`;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pctLabel, centerX, centerY - rLvl + 12);
  }

  // Ejes radiales
  for (let a = 0; a < numAxes; a++) {
    const angle = a * angleStep - Math.PI / 2;
    const xEnd = centerX + radius * Math.cos(angle);
    const yEnd = centerY + radius * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(xEnd, yEnd);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Etiqueta del eje
    const xLabel = centerX + (radius + 28) * Math.cos(angle);
    const yLabel = centerY + (radius + 28) * Math.sin(angle);
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.textAlign = Math.abs(Math.cos(angle)) < 0.2 ? "center" : Math.cos(angle) > 0 ? "left" : "right";
    ctx.textBaseline = "middle";

    const labelText = axes[a].length > 18 ? axes[a].substring(0, 16) + "..." : axes[a];
    ctx.fillText(labelText, xLabel, yLabel);
  }

  // Polígono de datos
  ctx.beginPath();
  const dataPoints = [];
  for (let a = 0; a < numAxes; a++) {
    const frac = totalResponses > 0
      ? isMultiselect
        ? Math.min(1, scores[a] / totalResponses)
        : Math.min(1, scores[a] / totalResponses)
      : 0;
    const rData = radius * frac;
    const angle = a * angleStep - Math.PI / 2;
    const x = centerX + rData * Math.cos(angle);
    const y = centerY + rData * Math.sin(angle);
    dataPoints.push({ x, y });
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.fillStyle = "rgba(56, 163, 165, 0.35)";
  ctx.fill();
  ctx.strokeStyle = "#38a3a5";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Puntos en los vértices
  dataPoints.forEach((pt) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#38a3a5";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
  };
}

/**
 * Genera un gráfico circular (Pie / Donut) en Canvas en memoria
 */
export function generatePieChartCanvas(section, responses) {
  const secKey = section.name || "";
  const rawLabels = Array.isArray(section.labels) && section.labels.length > 0
    ? section.labels.map((l) => String(l).replace(/\n\d+/g, "").trim())
    : ["Sí", "No"];

  const counts = {};
  rawLabels.forEach((lbl) => (counts[lbl] = 0));
  let totalValid = 0;

  responses.forEach((resp) => {
    const ans = getAnswerValue(resp, secKey, 0);
    if (ans && counts[ans] !== undefined) {
      counts[ans]++;
      totalValid++;
    } else if (ans) {
      const matched = rawLabels.find((l) => l.toLowerCase() === ans.toLowerCase());
      if (matched) {
        counts[matched]++;
        totalValid++;
      }
    }
  });

  const canvas = document.createElement("canvas");
  const width = 850;
  const height = 450;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const centerX = width * 0.38;
  const centerY = height / 2;
  const outerRadius = 150;
  const innerRadius = 75;

  let startAngle = -Math.PI / 2;

  rawLabels.forEach((label, idx) => {
    const count = counts[label] || 0;
    const sliceAngle = totalValid > 0 ? (count / totalValid) * (Math.PI * 2) : (Math.PI * 2) / rawLabels.length;
    const endAngle = startAngle + sliceAngle;
    const color = getOptionColor(label, idx);

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    if (sliceAngle > 0.25 && totalValid > 0) {
      const midAngle = startAngle + sliceAngle / 2;
      const textRadius = (outerRadius + innerRadius) / 2;
      const tx = centerX + textRadius * Math.cos(midAngle);
      const ty = centerY + textRadius * Math.sin(midAngle);
      const pct = Math.round((count / totalValid) * 100);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${pct}%`, tx, ty);
    }

    startAngle = endAngle;
  });

  // Centro: Total
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${totalValid}`, centerX, centerY - 8);

  ctx.fillStyle = "#64748b";
  ctx.font = "11px Arial, sans-serif";
  ctx.fillText("Respuestas", centerX, centerY + 14);

  // Leyenda a la derecha
  let legendY = centerY - (rawLabels.length * 36) / 2;
  const legendX = width * 0.68;

  rawLabels.forEach((label, idx) => {
    const color = getOptionColor(label, idx);
    const count = counts[label] || 0;
    const pct = totalValid > 0 ? ((count / totalValid) * 100).toFixed(1) : "0.0";

    ctx.fillStyle = color;
    ctx.fillRect(legendX, legendY, 18, 18);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, 18, 18);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${label}`, legendX + 28, legendY);

    ctx.fillStyle = "#64748b";
    ctx.font = "12px Arial, sans-serif";
    ctx.fillText(`${count} votos (${pct}%)`, legendX + 28, legendY + 16);

    legendY += 44;
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
  };
}

/**
 * Genera un reporte PDF profesional con el análisis graficado de una sesión de encuesta
 */
export async function generateCustomSurveyReportPDF({ session, template, responses }) {
  if (!responses || responses.length === 0) {
    const alert = await alertController.create({
      header: "Sin Respuestas",
      message: "No hay hojas escaneadas ni respuestas registradas en esta sesión para graficar.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }

  const loadingAlert = await alertController.create({
    header: "Generando Reporte",
    message: "Construyendo análisis estadístico y gráficos personalizados...",
    backdropDismiss: false,
  });
  await loadingAlert.present();

  try {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      unit: "mm",
      format: "letter",
      orientation: "portrait",
    });

    const pageWidth = 215.9; // Carta en mm
    const pageHeight = 279.4;
    const marginX = 14;
    const contentW = pageWidth - marginX * 2;

    const sections = template.questionsConfig?.sections || [];
    const scannableSections = sections.filter(
      (s) => s.type !== "instruction" && s.type !== "code"
    );

    // Encabezado decorativo institucional
    const drawPageHeader = (subtitle) => {
      pdf.setFillColor(30, 41, 59); // Slate-800
      pdf.rect(0, 0, pageWidth, 12, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text("PANDORA OMR • INFORME DE ANÁLISIS ESTADÍSTICO DE ENCUESTA", marginX, 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(203, 213, 225);
      pdf.text(new Date().toLocaleDateString("es-CO"), pageWidth - marginX - 25, 8);

      // Título secundario
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text(subtitle, marginX, 24);

      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.4);
      pdf.line(marginX, 27, pageWidth - marginX, 27);
    };

    const drawPageFooter = (currentPage, totalPages) => {
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Generado por Pandora Evaluación y OMR", marginX, pageHeight - 7);
      pdf.text(
        `Página ${currentPage} de ${totalPages}`,
        pageWidth - marginX - 20,
        pageHeight - 7
      );
    };

    // ==========================================
    // PÁGINA 1: PORTADA Y RESUMEN EJECUTIVO
    // ==========================================
    drawPageHeader("Resumen Ejecutivo de la Evaluación");

    // Tarjeta principal con datos de la sesión
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(marginX, 32, contentW, 46, 3, 3, "FD");
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(marginX, 32, contentW, 46, 3, 3, "S");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(15, 23, 42);
    pdf.text(template.name || "Plantilla de Encuesta", marginX + 6, 42);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(71, 85, 105);

    let infoY = 50;
    pdf.text(`Identificador / Sesión: ${session.label || "General"}`, marginX + 6, infoY);
    pdf.text(`Año lectivo / Periodo: ${session.year || new Date().getFullYear()}`, marginX + 6, infoY + 6);
    pdf.text(`Total de hojas procesadas: ${responses.length} encuestas`, marginX + 6, infoY + 12);

    pdf.text(`Tipo de plantilla: ${template.slug || "Personalizada"}`, marginX + 105, infoY);
    pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString("es-CO")}`, marginX + 105, infoY + 6);
    pdf.text(`Secciones analizadas: ${scannableSections.length}`, marginX + 105, infoY + 12);

    // Métricas en cajas destacadas
    const boxW = (contentW - 12) / 3;
    const boxY = 85;
    const totalQuestions = scannableSections.reduce((acc, s) => {
      if (s.type === "multiselect") return acc + 1;
      return acc + (Number(s.rows) || 1);
    }, 0);

    // Caja 1: Respuestas
    pdf.setFillColor(238, 242, 255); // Indigo ligero
    pdf.roundedRect(marginX, boxY, boxW, 26, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(67, 97, 238);
    pdf.text(`${responses.length}`, marginX + boxW / 2, boxY + 12, { align: "center" });
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Hojas Tabuladas", marginX + boxW / 2, boxY + 20, { align: "center" });

    // Caja 2: Total Preguntas
    pdf.setFillColor(236, 253, 245); // Emerald ligero
    pdf.roundedRect(marginX + boxW + 6, boxY, boxW, 26, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(16, 185, 129);
    pdf.text(`${totalQuestions}`, marginX + boxW + 6 + boxW / 2, boxY + 12, { align: "center" });
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Preguntas Evaluadas", marginX + boxW + 6 + boxW / 2, boxY + 20, { align: "center" });

    // Caja 3: Secciones
    pdf.setFillColor(254, 243, 199); // Amber ligero
    pdf.roundedRect(marginX + (boxW + 6) * 2, boxY, boxW, 26, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(217, 119, 6);
    pdf.text(`${scannableSections.length}`, marginX + (boxW + 6) * 2 + boxW / 2, boxY + 12, { align: "center" });
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Dimensiones / Bloques", marginX + (boxW + 6) * 2 + boxW / 2, boxY + 20, { align: "center" });

    // Resumen de secciones incluidas
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(30, 41, 59);
    pdf.text("Contenido y Secciones del Reporte", marginX, 122);

    let secListY = 130;
    scannableSections.forEach((sec, idx) => {
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(marginX, secListY, contentW, 14, 2, 2, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      pdf.text(`${idx + 1}. ${sec.title || sec.name}`, marginX + 6, secListY + 9);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      const graphLabel =
        sec.chartType === "radar"
          ? "Gráfico Radial"
          : sec.chartType === "pie"
          ? "Circular / Torta"
          : sec.chartType === "table"
          ? "Solo Tabla"
          : "Barras Apiladas (100%)";
      const qCountText = sec.type === "multiselect" ? "1 preg. multiselección" : `${sec.rows || 1} preguntas`;
      pdf.text(`${qCountText} • ${graphLabel}`, pageWidth - marginX - 52, secListY + 9);

      secListY += 17;
    });

    // ==========================================
    // PÁGINAS POR CADA SECCIÓN
    // ==========================================
    for (let sIdx = 0; sIdx < scannableSections.length; sIdx++) {
      const sec = scannableSections[sIdx];
      pdf.addPage();
      drawPageHeader(`Análisis de Resultados: ${sec.title || sec.name}`);

      const chartType =
        sec.chartType ||
        (sec.type === "multiselect"
          ? "radar"
          : Number(sec.rows || 1) === 1
          ? "pie"
          : "stacked_bar");

      let chartImg = null;
      if (chartType === "radar") {
        chartImg = generateRadarChartCanvas(sec, responses);
      } else if (chartType === "pie") {
        chartImg = generatePieChartCanvas(sec, responses);
      } else if (chartType === "table") {
        chartImg = null;
      } else {
        // Por defecto barras apiladas
        chartImg = generateStackedBarChartCanvas(sec, responses);
      }

      let tableY = 35;
      // Incrustar imagen del gráfico si está habilitado
      if (chartImg && chartImg.dataUrl) {
        const imgAspect = chartImg.height / chartImg.width;
        const imgW = contentW;
        const imgH = Math.min(imgW * imgAspect, 130);
        pdf.addImage(chartImg.dataUrl, "PNG", marginX, 32, imgW, imgH, undefined, "FAST");
        tableY = 32 + imgH + 8;
      }

      // Tabla de datos debajo del gráfico o al inicio si es solo tabla
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Tabulación Detallada de Frecuencias", marginX, tableY);
      tableY += 5;

      if (sec.type === "multiselect") {
        const multiOptions =
          Array.isArray(sec.options) && sec.options.length > 0
            ? sec.options.map((o) => String(o).trim()).filter(Boolean)
            : Array.isArray(sec.labels)
            ? sec.labels.flat().map((l) => String(l).trim()).filter(Boolean)
            : [];

        // Encabezados de tabla multiselección
        pdf.setFillColor(241, 245, 249);
        pdf.rect(marginX, tableY, contentW, 7, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        pdf.text("Herramienta / Recurso Evaluado", marginX + 3, tableY + 5);
        pdf.text("Frecuencia (Respuestas)", marginX + contentW * 0.65, tableY + 5, { align: "center" });
        pdf.text("Porcentaje (%)", marginX + contentW * 0.88, tableY + 5, { align: "center" });
        tableY += 7;

        multiOptions.forEach((opt, oIdx) => {
          let count = 0;
          responses.forEach((resp) => {
            const list = resp.answers?.[sec.name];
            if (Array.isArray(list)) {
              if (list.some((item) => String(item).trim().toLowerCase() === opt.toLowerCase())) {
                count++;
              }
            }
          });
          const pct = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;

          if (oIdx % 2 === 1) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(marginX, tableY, contentW, 6, "F");
          }

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(30, 41, 59);
          pdf.text(opt, marginX + 3, tableY + 4.5);

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(71, 85, 105);
          pdf.text(`${count}`, marginX + contentW * 0.65, tableY + 4.5, { align: "center" });
          pdf.text(`${pct}%`, marginX + contentW * 0.88, tableY + 4.5, { align: "center" });

          tableY += 6;
          if (tableY > pageHeight - 20) {
            pdf.addPage();
            drawPageHeader(`Análisis de Resultados: ${sec.title || sec.name} (Cont.)`);
            tableY = 35;
          }
        });
      } else {
        // Encabezados de tabla
        const labels = Array.isArray(sec.labels) && sec.labels.length > 0
          ? sec.labels.map((l) => String(l).replace(/\n\d+/g, "").trim())
          : ["Nunca", "Algunas veces", "Casi siempre", "Siempre"];

        const colW = (contentW - 35) / labels.length;
        pdf.setFillColor(241, 245, 249);
        pdf.rect(marginX, tableY, contentW, 7, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        pdf.text("Ítem", marginX + 3, tableY + 5);

        labels.forEach((lbl, lIdx) => {
          pdf.text(lbl, marginX + 35 + lIdx * colW + colW / 2, tableY + 5, { align: "center" });
        });
        tableY += 7;

        // Filas de preguntas
        const qRows = Number(sec.rows || 1);
        for (let r = 0; r < qRows; r++) {
          const qNum = Number(sec.rowStart || 1) + r;
          const rowText = `${sec.rowPrefix || "P"}${qNum}`;

          if (r % 2 === 1) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(marginX, tableY, contentW, 6, "F");
          }

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(30, 41, 59);
          pdf.text(rowText, marginX + 3, tableY + 4.5);

          labels.forEach((lbl, lIdx) => {
            let count = 0;
            responses.forEach((resp) => {
              const ans = getAnswerValue(resp, sec.name, r);
              if (ans === lbl) count++;
            });
            const pct = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(71, 85, 105);
            pdf.text(`${count} (${pct}%)`, marginX + 35 + lIdx * colW + colW / 2, tableY + 4.5, {
              align: "center",
            });
          });

          tableY += 6;
          if (tableY > pageHeight - 20) break; // Evitar desborde
        }
      }
      }

    // Dibujar pie de página en todas las páginas
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      drawPageFooter(p, totalPages);
    }

    // Nombre de archivo limpio
    const cleanSessionName = (session.label || "sesion").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Informe_Graficado_${cleanSessionName}_${new Date().toISOString().slice(0, 10)}.pdf`;

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
    console.error("Error al generar el reporte PDF:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Ocurrió un error al generar el análisis graficado en PDF.",
      buttons: ["OK"],
    });
    await alert.present();
  } finally {
    await loadingAlert.dismiss();
  }
}
