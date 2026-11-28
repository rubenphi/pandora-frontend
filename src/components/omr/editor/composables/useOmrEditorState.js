import { ref, computed, nextTick } from "vue";
import axios from "axios";
import { alertController, loadingController } from "@ionic/vue";
import { tokenHeader } from "@/globalService.js";
import {
  renderSheet,
  downloadCanvasAsPNG,
  downloadCanvasAsPDF,
  downloadDesignGuidePDF,
  exportTemplateJSON,
  getSectionBounds,
  getScannableBounds,
  CANVAS_PORTRAIT,
} from "@/components/functions/omr/omrSheetGenerator.js";
import { processUploadedBackground } from "@/components/functions/omr/omrBackgroundProcessor.js";
import {
  PARENT_SURVEY_PRESET,
  STUDENT_SURVEY_PRESET,
} from "@/components/omr/editor/constants.js";

// Slugs protegidos por ley / sistema
export const SYSTEM_RESERVED_SLUGS = ["parent-survey", "student-survey"];

export function resolveMediaUrl(url) {
  if (!url) return "";
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  const base = axios.defaults.baseURL
    ? axios.defaults.baseURL.replace(/\/+$/, "")
    : "";
  const cleanUrl = url.replace(/^\/+/, "");
  return base ? `${base}/${cleanUrl}` : `/${cleanUrl}`;
}

/**
 * Composable que encapsula el estado reactivo y la lógica de negocio de la plantilla OMR
 */
export function useOmrEditorState() {
  const templateId = ref(null);
  const templateSlug = ref("");
  const selectedIndex = ref(-1);
  const canvasWidth = ref(CANVAS_PORTRAIT.width);
  const canvasHeight = ref(CANVAS_PORTRAIT.height);
  const isSaving = ref(false);
  const isLoading = ref(false);
  const isProcessingBg = ref(false);
  const bgStatusMessage = ref("");

  const config = ref({
    name: "Modelo Encuesta a Padres (A4)",
    markerSize: 40,
    renderMode: "full", // "full" o "bubbles_only" (para diseñadores externos)
    margins: {
      top: 380, // Espacio superior para logo institucional, datos y texto de instrucciones
      bottom: 310, // Espacio inferior para pregunta abierta 19 y cierre
      left: 55,
      right: 55,
    },
    sections: [
      {
        name: "seccion1",
        title: "EL PROFESOR",
        type: "question",
        layoutMode: "questionnaire",
        rows: 14,
        cols: 4,
        columnGroups: 1,
        colSpacing: 62,
        rowSpacing: 36,
        radius: 10,
        scale: 100,
        showLabels: true,
        chartType: "stacked_bar",
        rowPrefix: "",
        rowStart: 1,
        labelWidth: 718.9,
        labels: [
          "Nunca\n1",
          "Algunas veces\n2",
          "Casi siempre\n3",
          "Siempre\n4",
        ],
        questionPrompts: [
          "Trata con respeto a su hijo y le expresa reglas claras de comportamiento",
          "Comunica claramente los objetivos de cada clase",
          "Responde las dudas que usted le ha planteado cuando lo ha requerido.",
          "Expresa expectativas positivas de los estudiantes",
          "Explica los criterios de evaluación de la materia a través del acuerdo pedagógico",
          "Evalúa la asignatura empleando estrategias innovadoras y dinámicas.",
          "Programa y coordina salidas pedagógicas como complemento a la materia",
          "Atiende dudas académicas de los estudiantes fuera de clase",
          "Realiza plan de mejoramiento para los estudiantes y lo informa a Ud. de ellas.",
          "Indica normas de comportamiento en clase claras para todos los estudiantes.",
          "Es respetado por todos los estudiantes y padres de familia del curso",
          "Realiza clases activas y dinámicas",
          "Informa a padres de familia y acudientes sobre el desempeño de los estudiantes",
          "Ud. lo cataloga como puntual, organizado y comprometido con la comunidad.",
        ],
        percentX: 7.7,
        percentY: 25.0,
      },
      {
        name: "seccion2",
        title: "LAS CLASES",
        type: "question",
        layoutMode: "questionnaire",
        rows: 4,
        cols: 4,
        columnGroups: 1,
        colSpacing: 62,
        rowSpacing: 36,
        radius: 10,
        scale: 100,
        showLabels: true,
        chartType: "stacked_bar",
        rowPrefix: "",
        rowStart: 15,
        labelWidth: 718.9,
        labels: [
          "Nunca\n1",
          "Algunas veces\n2",
          "Casi siempre\n3",
          "Siempre\n4",
        ],
        questionPrompts: [
          "Su hijo dice que sus clases son interesantes y le dejan enseñanzas en valores",
          "Empiezan y terminan a la hora indicada",
          "Desarrollan los temas propuestos en el tiempo indicado",
          "Tratan temas importantes para el barrio, la zona o la comunidad",
        ],
        percentX: 7.7,
        percentY: 61.5,
      },
      {
        name: "pregunta19_abierta",
        title: "19. Cuál es su opinión acerca del proceso de enseñanza aprendizaje de su hijo(a)",
        type: "instruction",
        content: "Líneas de respuesta abierta para el acudiente.\n_________________________________________________________________________________\n_________________________________________________________________________________\n_________________________________________________________________________________\n_________________________________________________________________________________\n\n¡Gracias por su tiempo!",
        widthPx: 1080,
        heightPx: 180,
        percentX: 6.0,
        percentY: 81.0,
      },
    ],
  });

  const selectedSection = computed(() => {
    if (
      selectedIndex.value >= 0 &&
      selectedIndex.value < config.value.sections.length
    ) {
      return config.value.sections[selectedIndex.value];
    }
    return null;
  });

  const dims = computed(() => ({
    width: canvasWidth.value,
    height: canvasHeight.value,
    margins: config.value.margins,
    markerSize: config.value.markerSize,
  }));

  const minCanvasDimensions = computed(() => {
    const w = canvasWidth.value;
    const h = canvasHeight.value;
    const ms = config.value.markerSize;
    let maxRight = 0;
    let maxBottom = 0;
    for (const sec of config.value.sections) {
      const bounds = getSectionBounds(sec, {
        width: w,
        height: h,
        margins: config.value.margins,
        markerSize: ms,
      });
      maxRight = Math.max(maxRight, bounds.x + bounds.width);
      maxBottom = Math.max(maxBottom, bounds.y + bounds.height);
    }
    const pad = ms + 80;
    return {
      width: Math.max(Math.ceil(maxRight + pad), 500),
      height: Math.max(Math.ceil(maxBottom + pad), 500),
    };
  });

  const autoMargins = computed(() => {
    const d = dims.value;
    return {
      left: d.width * 0.06,
      right: d.width * 0.06,
      top: d.height * 0.06,
      bottom: d.height * 0.06,
    };
  });

  let _canvasRef = null;
  const setCanvasRef = (cRef) => {
    _canvasRef = cRef;
  };

  const drawPreview = async () => {
    await nextTick();
    const canvas = _canvasRef?.value || _canvasRef;
    if (canvas) {
      const opts = {
        isPreview: true,
        selectedSectionIndex: selectedIndex.value,
        dims: dims.value,
        markerSize: config.value.markerSize,
        renderMode: config.value.renderMode || "full",
      };
      renderSheet(canvas, config.value, opts);
    }
  };

  const selectSection = (idx) => {
    selectedIndex.value = idx;
    drawPreview();
  };

  const sectionTypeLabel = (type) => {
    if (type === "code") return "Código";
    if (type === "multiselect") return "Múltiple";
    return "Pregunta";
  };

  const clampToScannableArea = () => {
    if (!selectedSection.value) return;
    const d = dims.value;
    const area = getScannableBounds(
      d.width,
      d.height,
      autoMargins.value,
      config.value.markerSize
    );
    const secIdx = selectedIndex.value;

    const bounds = getSectionBounds(selectedSection.value, d);
    let dx = 0,
      dy = 0;
    if (bounds.x < area.x) dx = area.x - bounds.x;
    if (bounds.y < area.y) dy = area.y - bounds.y;
    if (bounds.x + bounds.width > area.x + area.width)
      dx = area.x + area.width - (bounds.x + bounds.width);
    if (bounds.y + bounds.height > area.y + area.height)
      dy = area.y + area.height - (bounds.y + bounds.height);
    if (dx !== 0 || dy !== 0) {
      selectedSection.value.percentX = parseFloat(
        (selectedSection.value.percentX + (dx / d.width) * 100).toFixed(2)
      );
      selectedSection.value.percentY = parseFloat(
        (selectedSection.value.percentY + (dy / d.height) * 100).toFixed(2)
      );
    }

    const myBounds = getSectionBounds(selectedSection.value, d);
    for (let i = 0; i < config.value.sections.length; i++) {
      if (i === secIdx) continue;
      const other = config.value.sections[i];
      const ob = getSectionBounds(other, d);
      const overlaps =
        myBounds.x < ob.x + ob.width &&
        myBounds.x + myBounds.width > ob.x &&
        myBounds.y < ob.y + ob.height &&
        myBounds.y + myBounds.height > ob.y;
      if (overlaps) {
        const pushDown = ob.y + ob.height - myBounds.y + 4;
        const newPercentY =
          selectedSection.value.percentY + (pushDown / d.height) * 100;
        const testBounds = { ...myBounds, y: myBounds.y + pushDown };
        if (testBounds.y + testBounds.height <= area.y + area.height) {
          selectedSection.value.percentY = parseFloat(newPercentY.toFixed(2));
        } else {
          const pushRight = ob.x + ob.width - myBounds.x + 4;
          const newPercentX =
            selectedSection.value.percentX + (pushRight / d.width) * 100;
          const testBoundsX = { ...myBounds, x: myBounds.x + pushRight };
          if (testBoundsX.x + testBoundsX.width <= area.x + area.width) {
            selectedSection.value.percentX = parseFloat(newPercentX.toFixed(2));
          }
        }
      }
    }
  };

  const clampAndDraw = () => {
    clampToScannableArea();
    drawPreview();
  };

  const onCanvasWidthChange = (newWidth) => {
    const oldWidth = canvasWidth.value;
    newWidth = Math.max(
      minCanvasDimensions.value.width,
      Math.min(2000, newWidth)
    );
    if (Math.abs(newWidth - oldWidth) < 1) return;
    config.value.sections.forEach((sec) => {
      const absX = (sec.percentX / 100) * oldWidth;
      sec.percentX = parseFloat(((absX / newWidth) * 100).toFixed(2));
    });
    canvasWidth.value = newWidth;
    drawPreview();
  };

  const onCanvasHeightChange = (newHeight) => {
    const oldHeight = canvasHeight.value;
    newHeight = Math.max(
      minCanvasDimensions.value.height,
      Math.min(3000, newHeight)
    );
    if (Math.abs(newHeight - oldHeight) < 1) return;
    config.value.sections.forEach((sec) => {
      const absY = (sec.percentY / 100) * oldHeight;
      sec.percentY = parseFloat(((absY / newHeight) * 100).toFixed(2));
    });
    canvasHeight.value = newHeight;
    drawPreview();
  };

  const addNewSection = () => {
    const idx = config.value.sections.length;
    config.value.sections.push({
      name: `seccion${idx + 1}`,
      title: `Sección ${idx + 1}`,
      type: "question",
      rows: 5,
      cols: 4,
      columnGroups: 1,
      colSpacing: 58,
      rowSpacing: 38,
      radius: 11,
      scale: 100,
      showLabels: true,
      chartType: "stacked_bar",
      rowPrefix: "Q",
      labelWidth: 55,
      labels: ["A", "B", "C", "D"],
      percentX: 10,
      percentY: Math.min(90, 38 + idx * 20),
    });
    selectedIndex.value = config.value.sections.length - 1;
    drawPreview();
  };

  const removeSection = (idx) => {
    config.value.sections.splice(idx, 1);
    if (selectedIndex.value >= config.value.sections.length) {
      selectedIndex.value = config.value.sections.length - 1;
    }
    drawPreview();
  };

  const onSectionTypeChange = () => {
    if (!selectedSection.value) return;
    if (selectedSection.value.type === "code") {
      selectedSection.value.digits = selectedSection.value.digits || 6;
      selectedSection.value.cellSize = selectedSection.value.cellSize || 36;
      selectedSection.value.colSpacing =
        selectedSection.value.colSpacing || 48;
      selectedSection.value.rowSpacing =
        selectedSection.value.rowSpacing || 36;
      selectedSection.value.radius = selectedSection.value.radius || 10;
      delete selectedSection.value.rows;
      delete selectedSection.value.cols;
      delete selectedSection.value.labels;
      delete selectedSection.value.showLabels;
    } else if (selectedSection.value.type === "instruction") {
      selectedSection.value.title = selectedSection.value.title || "Instrucciones de Diligenciamiento";
      selectedSection.value.content = selectedSection.value.content || "Lea cuidadosamente cada pregunta y rellene completamente el círculo de la opción elegida. No haga marcas fuera de las áreas designadas.";
      selectedSection.value.fontSize = selectedSection.value.fontSize || 11;
      selectedSection.value.widthPx = selectedSection.value.widthPx || Math.round(dims.value.width * 0.82);
      selectedSection.value.heightPx = selectedSection.value.heightPx || 80;
      delete selectedSection.value.rows;
      delete selectedSection.value.cols;
      delete selectedSection.value.labels;
      delete selectedSection.value.showLabels;
    } else if (selectedSection.value.type === "multiselect") {
      selectedSection.value.rows = selectedSection.value.rows || 4;
      selectedSection.value.cols = selectedSection.value.cols || 3;
      selectedSection.value.colSpacing =
        selectedSection.value.colSpacing || 58;
      selectedSection.value.rowSpacing =
        selectedSection.value.rowSpacing || 38;
      selectedSection.value.radius = selectedSection.value.radius || 11;
      selectedSection.value.scale = selectedSection.value.scale || 100;
      selectedSection.value.showLabels = true;
      const needsRebuild =
        !Array.isArray(selectedSection.value.labels) ||
        selectedSection.value.labels.length === 0 ||
        !Array.isArray(selectedSection.value.labels[0]);
      if (needsRebuild) {
        selectedSection.value.labels = [];
        for (let r = 0; r < selectedSection.value.rows; r++) {
          selectedSection.value.labels[r] = [];
          for (let c = 0; c < selectedSection.value.cols; c++) {
            selectedSection.value.labels[r][c] = "";
          }
        }
      }
    } else {
      selectedSection.value.rows = selectedSection.value.rows || 5;
      selectedSection.value.cols = selectedSection.value.cols || 4;
      selectedSection.value.columnGroups =
        selectedSection.value.columnGroups || 1;
      selectedSection.value.labels = selectedSection.value.labels || [
        "A",
        "B",
        "C",
        "D",
      ];
      selectedSection.value.scale = selectedSection.value.scale || 100;
      selectedSection.value.showLabels = true;
    }
    drawPreview();
  };

  const applyScale = () => {
    if (!selectedSection.value) return;
    const s = (selectedSection.value.scale || 100) / 100;

    if (selectedSection.value.type === "code") {
      selectedSection.value.colSpacing = Math.round(48 * s);
      selectedSection.value.rowSpacing = Math.round(36 * s);
      selectedSection.value.radius = Math.max(5, Math.round(10 * s));
    } else {
      selectedSection.value.colSpacing = Math.round(58 * s);
      selectedSection.value.rowSpacing = Math.round(38 * s);
      selectedSection.value.radius = Math.max(5, Math.round(11 * s));
    }
    drawPreview();
  };

  /**
   * Ejecuta la descarga de la hoja en PNG según las opciones especificadas
   */
  const executeDownloadPNG = (opts = {}) => {
    const canvas = _canvasRef?.value || _canvasRef;
    if (!canvas) return;
    const exportCanvas = document.createElement("canvas");

    const effectiveConfig = {
      ...config.value,
      renderMode: opts.renderMode || config.value.renderMode || "full",
      ...(opts.withBackground === false
        ? { backgroundImage: null, backgroundImageElement: null }
        : {}),
    };

    renderSheet(exportCanvas, effectiveConfig, {
      isPreview: false,
      dims: dims.value,
      markerSize: effectiveConfig.markerSize,
      renderMode: effectiveConfig.renderMode,
    });

    let suffix = "";
    if (opts.renderMode === "bubbles_only") {
      suffix = "_solo_burbujas";
    } else if (opts.withBackground === false && config.value.backgroundImage) {
      suffix = "_sin_fondo";
    } else if (opts.withBackground === true) {
      suffix = "_con_fondo";
    }

    const safeName = (config.value.name || "plantilla_omr")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    downloadCanvasAsPNG(exportCanvas, `${safeName}${suffix}.png`);
  };

  /**
   * Ejecuta la descarga de la hoja en PDF según las opciones especificadas
   */
  const executeDownloadPDF = (opts = {}) => {
    const canvas = _canvasRef?.value || _canvasRef;
    if (!canvas) return;
    const exportCanvas = document.createElement("canvas");

    const effectiveConfig = {
      ...config.value,
      renderMode: opts.renderMode || config.value.renderMode || "full",
      ...(opts.withBackground === false
        ? { backgroundImage: null, backgroundImageElement: null }
        : {}),
    };

    renderSheet(exportCanvas, effectiveConfig, {
      isPreview: false,
      dims: dims.value,
      markerSize: effectiveConfig.markerSize,
      renderMode: effectiveConfig.renderMode,
    });

    let suffix = "";
    if (opts.renderMode === "bubbles_only") {
      suffix = "_solo_burbujas";
    } else if (opts.withBackground === false && config.value.backgroundImage) {
      suffix = "_sin_fondo";
    } else if (opts.withBackground === true) {
      suffix = "_con_fondo";
    }

    const safeName = (config.value.name || "plantilla_omr")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    downloadCanvasAsPDF(exportCanvas, `${safeName}${suffix}.pdf`);
  };

  /**
   * Permite descargar la plantilla en PNG con opciones de personalización
   */
  const downloadPNG = async () => {
    if (config.value.backgroundImage) {
      const alert = await alertController.create({
        header: "Descargar Imagen PNG",
        message: "Selecciona el formato que deseas descargar:",
        buttons: [
          {
            text: "Plantilla Completa (con fondo y burbujas)",
            handler: () => {
              executeDownloadPNG({ withBackground: true, renderMode: "full" });
            },
          },
          {
            text: "Plantilla Limpia (sin fondo personalizado)",
            handler: () => {
              executeDownloadPNG({ withBackground: false, renderMode: "full" });
            },
          },
          {
            text: "Solo Burbujas (sin textos ni fondo)",
            handler: () => {
              executeDownloadPNG({
                withBackground: false,
                renderMode: "bubbles_only",
              });
            },
          },
          {
            text: "Solo Mi Diseño de Fondo (PNG)",
            handler: () => {
              downloadBackground("png");
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await alert.present();
    } else {
      const alert = await alertController.create({
        header: "Descargar Imagen PNG",
        message: "Selecciona el formato a generar:",
        buttons: [
          {
            text: "Hoja Completa (con textos y preguntas)",
            handler: () => {
              executeDownloadPNG({ withBackground: false, renderMode: "full" });
            },
          },
          {
            text: "Solo Burbujas y Marcadores (sin textos)",
            handler: () => {
              executeDownloadPNG({
                withBackground: false,
                renderMode: "bubbles_only",
              });
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await alert.present();
    }
  };

  /**
   * Permite descargar la plantilla en PDF con opciones de personalización
   */
  const downloadPDF = async () => {
    if (config.value.backgroundImage) {
      const alert = await alertController.create({
        header: "Descargar Plantilla PDF",
        message: "Selecciona el formato que deseas descargar:",
        buttons: [
          {
            text: "Plantilla Completa (con fondo y burbujas)",
            handler: () => {
              executeDownloadPDF({ withBackground: true, renderMode: "full" });
            },
          },
          {
            text: "Plantilla Limpia (sin fondo personalizado)",
            handler: () => {
              executeDownloadPDF({ withBackground: false, renderMode: "full" });
            },
          },
          {
            text: "Solo Burbujas (sin textos ni fondo)",
            handler: () => {
              executeDownloadPDF({
                withBackground: false,
                renderMode: "bubbles_only",
              });
            },
          },
          {
            text: "Solo Mi Diseño de Fondo (PDF)",
            handler: () => {
              downloadBackground("pdf");
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await alert.present();
    } else {
      const alert = await alertController.create({
        header: "Descargar Plantilla PDF",
        message: "Selecciona el formato a generar:",
        buttons: [
          {
            text: "Hoja Completa (con textos y preguntas)",
            handler: () => {
              executeDownloadPDF({ withBackground: false, renderMode: "full" });
            },
          },
          {
            text: "Solo Burbujas y Marcadores (sin textos)",
            handler: () => {
              executeDownloadPDF({
                withBackground: false,
                renderMode: "bubbles_only",
              });
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await alert.present();
    }
  };

  /**
   * Descarga el diseño de fondo subido por el usuario de forma independiente
   */
  const downloadBackground = (format = "png") => {
    const safeName = (config.value.name || "plantilla_omr")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

    if (format === "pdf") {
      const canvas = document.createElement("canvas");
      canvas.width =
        config.value.backgroundImageElement?.naturalWidth || canvasWidth.value;
      canvas.height =
        config.value.backgroundImageElement?.naturalHeight || canvasHeight.value;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (config.value.backgroundImageElement) {
        ctx.drawImage(
          config.value.backgroundImageElement,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
      downloadCanvasAsPDF(canvas, `${safeName}_diseno_fondo.pdf`);
      return;
    }

    if (
      config.value.backgroundImageElement &&
      config.value.backgroundImageElement.complete &&
      config.value.backgroundImageElement.naturalWidth
    ) {
      const canvas = document.createElement("canvas");
      canvas.width =
        config.value.backgroundImageElement.naturalWidth || canvasWidth.value;
      canvas.height =
        config.value.backgroundImageElement.naturalHeight || canvasHeight.value;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(config.value.backgroundImageElement, 0, 0);
      downloadCanvasAsPNG(canvas, `${safeName}_diseno_fondo.png`);
      return;
    }

    if (
      config.value.backgroundImage &&
      config.value.backgroundImage.startsWith("data:")
    ) {
      const link = document.createElement("a");
      link.href = config.value.backgroundImage;
      link.download = `${safeName}_diseno_fondo.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (config.value.backgroundImage) {
      const resolved = resolveMediaUrl(config.value.backgroundImage);
      const link = document.createElement("a");
      link.href = resolved;
      link.download = `${safeName}_diseno_fondo.png`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const moveSectionUp = (idx) => {
    if (idx <= 0) return;
    const item = config.value.sections.splice(idx, 1)[0];
    config.value.sections.splice(idx - 1, 0, item);
    selectedIndex.value = idx - 1;
    drawPreview();
  };

  const moveSectionDown = (idx) => {
    if (idx >= config.value.sections.length - 1) return;
    const item = config.value.sections.splice(idx, 1)[0];
    config.value.sections.splice(idx + 1, 0, item);
    selectedIndex.value = idx + 1;
    drawPreview();
  };

  const exportJSON = () => {
    const jsonData = exportTemplateJSON(config.value, dims.value);
    const str = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = (config.value.name || "plantilla_omr")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    link.download = `${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Sube y procesa un diseño de fondo externo (PDF o Imagen)
   * detecta marcadores, alinea con homografía y enmascara elementos dobles
   */
  const uploadBackground = async (file, options = {}) => {
    if (!file) return;
    isProcessingBg.value = true;
    bgStatusMessage.value = "Cargando archivo...";

    let loading = null;
    try {
      loading = await loadingController.create({
        message: "Procesando archivo y analizando diseño...",
        spinner: "crescent",
        backdropDismiss: false,
      });
      await loading.present();
    } catch (e) {
      console.warn("Could not create loadingController:", e);
    }

    try {
      // Ceder el hilo de la UI para asegurar que el loading y la barra se pinten en pantalla
      await new Promise((r) => setTimeout(r, 80));

      const res = await processUploadedBackground(file, config.value, {
        targetWidth: canvasWidth.value,
        targetHeight: canvasHeight.value,
        ...options,
      });

      if (loading) {
        try {
          await loading.dismiss();
        } catch (e) {
          /* ignore */
        }
      }

      if (res.success && res.dataUrl) {
        config.value.backgroundImage = res.dataUrl;
        config.value.bgMarkersFound = res.markersFound;
        const img = new Image();
        img.onload = () => {
          config.value.backgroundImageElement = img;
          drawPreview();
        };
        img.src = res.dataUrl;
        bgStatusMessage.value = res.message;

        // Guardar copia del fondo de inmediato en uploads/OMR/templates
        try {
          tokenHeader();
          const uploadRes = await axios.post("/files/upload/omr/template", {
            identifier:
              templateSlug.value ||
              (templateId.value ? `tpl_${templateId.value}` : "template"),
            image: res.dataUrl,
            originalName: file.name,
          });
          if (uploadRes.data?.url) {
            config.value.backgroundImageUrl = uploadRes.data.url;
          }
        } catch (uploadErr) {
          console.warn("Persistencia preliminar de fondo diferida al guardar:", uploadErr);
        }

        const alert = await alertController.create({
          header:
            res.header ||
            (res.markersFound
              ? "Fondo Alineado y Calibrado"
              : "Disposición de Elementos Modificada"),
          message: res.message,
          buttons: ["OK"],
        });
        await alert.present();
      }
    } catch (err) {
      if (loading) {
        try {
          await loading.dismiss();
        } catch (e) {
          /* ignore */
        }
      }
      console.error("Error al procesar fondo:", err);
      const alert = await alertController.create({
        header: "Error al Procesar Fondo",
        message:
          "Ocurrió un problema procesando el archivo: " +
          (err.message || String(err)),
        buttons: ["OK"],
      });
      await alert.present();
    } finally {
      isProcessingBg.value = false;
    }
  };

  /**
   * Elimina el fondo de diseño externo y vuelve al lienzo blanco estándar
   */
  const removeBackground = () => {
    config.value.backgroundImage = null;
    config.value.backgroundImageUrl = null;
    config.value.backgroundImageElement = null;
    config.value.bgMarkersFound = null;
    bgStatusMessage.value = "";
    drawPreview();
  };

  /**
   * Descarga la plantilla guía para diseño (Canva / Illustrator)
   */
  const downloadDesignGuide = () => {
    const safeName = (config.value.name || "plantilla_omr")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    downloadDesignGuidePDF(config.value, `${safeName}_guia_diseno.pdf`);
  };

  const applyPreset = (presetKey) => {
    if (presetKey === "student") {
      config.value = JSON.parse(JSON.stringify(STUDENT_SURVEY_PRESET));
    } else if (presetKey === "parent") {
      config.value = JSON.parse(JSON.stringify(PARENT_SURVEY_PRESET));
    }
    selectedIndex.value = -1;
    drawPreview();
  };

  /**
   * Carga una plantilla existente desde la API de pandora-nest
   */
  const loadTemplate = async (id) => {
    isLoading.value = true;
    try {
      tokenHeader();
      const res = await axios.get(`/surveys/templates/${id}`);
      const tpl = res.data;
      templateId.value = tpl.id;
      templateSlug.value = tpl.slug;
      config.value.name = tpl.name;

      if (tpl.questionsConfig) {
        if (tpl.questionsConfig._editorConfig) {
          config.value = {
            ...tpl.questionsConfig._editorConfig,
            name: tpl.name || tpl.questionsConfig._editorConfig.name,
          };
        } else if (
          tpl.slug === "student-survey" ||
          tpl.slug === "studentSurvey" ||
          tpl.name?.toLowerCase().includes("estudiante")
        ) {
          config.value = JSON.parse(JSON.stringify(STUDENT_SURVEY_PRESET));
          config.value.name = tpl.name || STUDENT_SURVEY_PRESET.name;
        } else if (
          tpl.slug === "parent-survey" ||
          tpl.slug === "parentSurvey" ||
          tpl.name?.toLowerCase().includes("padre")
        ) {
          config.value = JSON.parse(JSON.stringify(PARENT_SURVEY_PRESET));
          config.value.name = tpl.name || PARENT_SURVEY_PRESET.name;
        } else if (Array.isArray(tpl.questionsConfig.sections)) {
          config.value.sections = tpl.questionsConfig.sections;
          if (tpl.questionsConfig.marker_size) {
            config.value.markerSize = tpl.questionsConfig.marker_size;
          }
        }
        if (tpl.questionsConfig.canvasDims) {
          canvasWidth.value =
            tpl.questionsConfig.canvasDims.width || CANVAS_PORTRAIT.width;
          canvasHeight.value =
            tpl.questionsConfig.canvasDims.height || CANVAS_PORTRAIT.height;
        }

        // Restaurar fondo personalizado si existía en la plantilla guardada
        const bgUrl =
          config.value.backgroundImageUrl || config.value.backgroundImage;
        if (bgUrl) {
          const resolved = resolveMediaUrl(bgUrl);
          config.value.backgroundImage = resolved;
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            config.value.backgroundImageElement = img;
            drawPreview();
          };
          img.src = resolved;
        }
      }
      await drawPreview();
    } catch (err) {
      console.error("Error al cargar plantilla:", err);
      const alert = await alertController.create({
        header: "Error",
        message: "No se pudo cargar la plantilla solicitada.",
        buttons: ["OK"],
      });
      await alert.present();
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Guarda o actualiza la plantilla actual en pandora-nest
   */
  const saveTemplate = async () => {
    if (!config.value.name || !config.value.name.trim()) {
      const alert = await alertController.create({
        header: "Atención",
        message: "Por favor asigna un nombre a la plantilla antes de guardar.",
        buttons: ["OK"],
      });
      await alert.present();
      return false;
    }

    // Si es creación, sugerir o generar slug automático
    let slug = templateSlug.value;
    if (!slug) {
      slug = config.value.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      templateSlug.value = slug;
    }

    // Proteger slugs reservados creando una copia personalizada para no alterar la encuesta base oficial
    let isClonedFromSystem = false;
    if (SYSTEM_RESERVED_SLUGS.includes(slug)) {
      isClonedFromSystem = true;
      slug = `${slug}-personalizada-${Date.now().toString().slice(-4)}`;
      templateSlug.value = slug;
      templateId.value = null;
    }

    isSaving.value = true;
    try {
      tokenHeader();
      // Si hay fondo en base64, subirlo primero al servidor en uploads/OMR/templates
      if (
        config.value.backgroundImage &&
        typeof config.value.backgroundImage === "string" &&
        config.value.backgroundImage.startsWith("data:")
      ) {
        try {
          const uploadRes = await axios.post("/files/upload/omr/template", {
            identifier: slug || "template",
            image: config.value.backgroundImage,
          });
          if (uploadRes.data?.url) {
            config.value.backgroundImageUrl = uploadRes.data.url;
            config.value.backgroundImage = uploadRes.data.url;
          }
        } catch (uploadErr) {
          console.warn(
            "No se pudo guardar el archivo de fondo en uploads/OMR/templates:",
            uploadErr
          );
        }
      }

      const exportedOmr = exportTemplateJSON(config.value, dims.value);
      const editorConfigCopy = JSON.parse(JSON.stringify(config.value));
      // Asegurar que editorConfigCopy guarde la URL limpia en lugar de megabytes de base64
      if (config.value.backgroundImageUrl) {
        editorConfigCopy.backgroundImage = config.value.backgroundImageUrl;
        editorConfigCopy.backgroundImageUrl = config.value.backgroundImageUrl;
      }

      const questionsConfig = {
        ...exportedOmr,
        _editorConfig: editorConfigCopy,
        canvasDims: {
          width: canvasWidth.value,
          height: canvasHeight.value,
        },
      };

      if (templateId.value) {
        // Actualizar
        const payload = {
          name: config.value.name,
          questionsConfig,
        };
        await axios.patch(`/surveys/templates/${templateId.value}`, payload);
        const alert = await alertController.create({
          header: "Plantilla Actualizada",
          message: "Los cambios se guardaron exitosamente en el servidor.",
          buttons: ["OK"],
        });
        await alert.present();
      } else {
        // Crear
        const payload = {
          name: isClonedFromSystem
            ? `${config.value.name} (Personalizada)`
            : config.value.name,
          slug,
          questionsConfig,
        };
        const res = await axios.post("/surveys/templates", payload);
        templateId.value = res.data.id;
        templateSlug.value = res.data.slug || slug;
        config.value.name = payload.name;
        const alertMsg = isClonedFromSystem
          ? `Para preservar intacta la encuesta base oficial del sistema, tus ajustes se guardaron como una nueva plantilla: '${payload.name}'.`
          : `La plantilla '${config.value.name}' ha sido guardada en el sistema.`;
        const alert = await alertController.create({
          header: "Plantilla Guardada",
          message: alertMsg,
          buttons: ["OK"],
        });
        await alert.present();
      }
      return true;
    } catch (err) {
      console.error("Error al guardar plantilla:", err);
      const msg =
        err.response?.data?.message ||
        "No se pudo guardar la plantilla en el servidor.";
      const alert = await alertController.create({
        header: "Error al Guardar",
        message: Array.isArray(msg) ? msg.join("\n") : msg,
        buttons: ["OK"],
      });
      await alert.present();
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  return {
    templateId,
    templateSlug,
    isSaving,
    isLoading,
    config,
    selectedIndex,
    selectedSection,
    canvasWidth,
    canvasHeight,
    dims,
    minCanvasDimensions,
    autoMargins,
    setCanvasRef,
    drawPreview,
    selectSection,
    sectionTypeLabel,
    clampToScannableArea,
    clampAndDraw,
    onCanvasWidthChange,
    onCanvasHeightChange,
    addNewSection,
    removeSection,
    onSectionTypeChange,
    applyScale,
    downloadPNG,
    downloadPDF,
    downloadBackground,
    moveSectionUp,
    moveSectionDown,
    exportJSON,
    loadTemplate,
    saveTemplate,
    applyPreset,
    isProcessingBg,
    bgStatusMessage,
    uploadBackground,
    removeBackground,
    downloadDesignGuide,
  };
}
