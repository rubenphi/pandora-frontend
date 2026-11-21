<template>
  <ion-page
    class="ion-page qz-material-page"
    :class="{ 'font-caligrafia': isCalligraphy }"
  >
    <ion-content :fullscreen="true" class="qz-material-content">
      <div class="qz-page-wrapper">
        <!-- 1. CABECERA HERO QUEEZY PÚRPURA -->
        <div class="qz-hero-header">
          <div class="qz-hero-top">
            <!-- Botón Volver -->
            <button
              type="button"
              class="qz-back-btn"
              title="Volver a Lecciones"
              @click="goBack"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </button>

            <!-- Acciones de Cabecera -->
            <div class="qz-hero-actions">
              <!-- Botón Alternar Tipografía Caligráfica (si hay texto enriquecido o contenido) -->
              <button
                v-if="hasTextContent"
                type="button"
                class="qz-action-btn"
                :class="{ 'is-active': isCalligraphy }"
                title="Cambiar tipo de letra (Caligrafía / Normal)"
                @click="toggleFont"
              >
                <span class="qz-font-btn-text">Aa</span>
              </button>

              <!-- Botón Exportar / Descargar PDF -->
              <button
                v-if="canExport"
                type="button"
                class="qz-action-btn"
                title="Descargar / Exportar a PDF"
                @click="exportToPdf"
              >
                <ion-icon :icon="downloadOutline"></ion-icon>
              </button>

              <!-- Botón Abrir en nueva pestaña (si tiene URL de archivo) -->
              <button
                v-if="material?.url"
                type="button"
                class="qz-action-btn"
                title="Abrir archivo en pestaña nueva"
                @click="openInNewTab(fullUrl)"
              >
                <ion-icon :icon="openOutline"></ion-icon>
              </button>

              <!-- Botón Editar Material (Docentes / Admin) -->
              <button
                v-if="isAdminOrProfessor && material?.id"
                type="button"
                class="qz-action-btn"
                title="Editar material"
                @click="goToEditMaterial"
              >
                <ion-icon :icon="createOutline"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Títulos y Categoría Hero -->
          <div class="qz-hero-titles">
            <span class="qz-hero-tag">
              {{ formatMaterialType(material?.type) }}
              <template v-if="lessonTopic"> · {{ lessonTopic }}</template>
            </span>
            <h1 class="qz-hero-title">
              {{ material?.title || "Material de Apoyo" }}
            </h1>
            <p class="qz-hero-subtitle">
              {{ heroSubtitle }}
            </p>
          </div>
        </div>

        <!-- 2. CUERPO PRINCIPAL -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- Estado de Carga -->
            <div v-if="isLoading" class="qz-loading-card">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <p>Cargando material de apoyo...</p>
            </div>

            <!-- Estado de Error -->
            <div v-else-if="errorMessage" class="qz-error-card">
              <ion-icon
                :icon="alertCircleOutline"
                class="qz-error-icon"
              ></ion-icon>
              <p>{{ errorMessage }}</p>
              <button type="button" class="qz-retry-btn" @click="fetchMaterial">
                <ion-icon :icon="refreshOutline"></ion-icon>
                <span>Reintentar</span>
              </button>
            </div>

            <!-- Contenedor del Material -->
            <div v-else class="qz-material-card">
              <!-- CASO 1: IMAGEN CON VISOR DE ZOOM INTERACTIVO Y ESCALABLE -->
              <div
                v-if="material?.type === MaterialType.IMAGE"
                ref="imageSectionRef"
                class="qz-image-section"
                :class="{ 'is-fullscreen': isFullscreen }"
              >
                <!-- Botón flotante para salir en Pantalla Completa (sin estorbar) -->
                <button
                  v-if="isFullscreen"
                  type="button"
                  class="qz-fullscreen-close-btn"
                  title="Salir de pantalla completa (Esc)"
                  @click="toggleFullScreen"
                >
                  <ion-icon :icon="closeOutline"></ion-icon>
                </button>

                <!-- Barra de Herramientas de Zoom Superior (OCULTA en pantalla completa) -->
                <div v-if="!isFullscreen" class="qz-zoom-toolbar">
                  <div class="qz-zoom-controls-left">
                    <button
                      type="button"
                      class="qz-zoom-btn"
                      title="Alejar (-)"
                      :disabled="zoomLevel <= 0.4"
                      @click="zoomOut"
                    >
                      <ion-icon :icon="removeOutline"></ion-icon>
                    </button>

                    <button
                      type="button"
                      class="qz-zoom-level-pill"
                      title="Restablecer a 100%"
                      @click="resetZoom"
                    >
                      {{ Math.round(zoomLevel * 100) }}%
                    </button>

                    <button
                      type="button"
                      class="qz-zoom-btn"
                      title="Acercar (+)"
                      :disabled="zoomLevel >= 4.0"
                      @click="zoomIn"
                    >
                      <ion-icon :icon="addOutline"></ion-icon>
                    </button>
                  </div>

                  <div class="qz-zoom-controls-right">
                    <!-- Ajustar / Pantalla completa -->
                    <button
                      type="button"
                      class="qz-zoom-action-pill"
                      title="Ajustar y ver en pantalla completa"
                      @click="toggleFullScreen"
                    >
                      <ion-icon :icon="scanOutline"></ion-icon>
                      <span>Pantalla Completa</span>
                    </button>

                    <!-- Tamaño 1:1 original -->
                    <button
                      type="button"
                      class="qz-zoom-action-pill"
                      :class="{ 'is-active': isOriginalSize }"
                      title="Tamaño 100% nativo en píxeles"
                      @click="setOriginalSize"
                    >
                      <span>1:1</span>
                    </button>

                    <!-- Abrir imagen directa -->
                    <button
                      type="button"
                      class="qz-zoom-action-pill"
                      title="Abrir imagen original"
                      @click="openInNewTab(fullUrl)"
                    >
                      <ion-icon :icon="openOutline"></ion-icon>
                    </button>
                  </div>
                </div>

                <!-- Visor Interactivo de la Imagen (Permite zoom en PC y desplazamiento hacia el cursor) -->
                <div
                  ref="imageViewerRef"
                  class="qz-image-viewer-container"
                  :class="{
                    'is-grabbing': isDragging,
                    'is-fullscreen': isFullscreen,
                  }"
                  @wheel.prevent="handleWheelZoom"
                  @mousedown="startPan"
                  @mousemove="onPan"
                  @mouseup="stopPan"
                  @mouseleave="stopPan"
                  @dblclick="toggleSpaceFit"
                >
                  <div class="qz-image-stage" :style="stageStyle">
                    <img
                      :src="fullUrl"
                      :alt="material.title"
                      class="qz-zoom-image"
                      :style="imageStyle"
                      draggable="false"
                      @load="onImageLoad"
                    />
                  </div>
                </div>

                <!-- Indicador flotante en pantalla completa -->
                <div v-if="isFullscreen" class="qz-fullscreen-hint-pill">
                  <span
                    >Rueda del ratón: Zoom · Espacio: Ajustar · Esc: Salir</span
                  >
                </div>

                <div v-else class="qz-zoom-hint">
                  <span
                    >💡 Tip: Pulsa <b>Ajustar</b> para ver en pantalla completa.
                    Usa la rueda del ratón para zoom, Espacio para alternar y
                    Esc para salir.</span
                  >
                </div>
              </div>

              <!-- CASO 2: PDF -->
              <div
                v-else-if="material?.type === MaterialType.PDF"
                class="qz-pdf-section"
              >
                <div class="qz-media-toolbar">
                  <span class="qz-media-tag">Documento PDF</span>
                  <button
                    type="button"
                    class="qz-media-btn"
                    @click="openInNewTab(fullUrl)"
                  >
                    <ion-icon :icon="openOutline"></ion-icon>
                    <span>Abrir en pestaña nueva</span>
                  </button>
                </div>
                <div class="qz-pdf-frame-wrapper">
                  <iframe
                    :src="fullUrl"
                    class="qz-pdf-frame"
                    title="Visor PDF"
                  ></iframe>
                </div>
              </div>

              <!-- CASO 3: VIDEO -->
              <div
                v-else-if="material?.type === MaterialType.VIDEO"
                class="qz-video-section"
              >
                <div class="qz-video-wrapper">
                  <video
                    controls
                    :src="fullUrl"
                    class="qz-video-player"
                  ></video>
                </div>
              </div>

              <!-- CASO 4: AUDIO -->
              <div
                v-else-if="material?.type === MaterialType.AUDIO"
                class="qz-audio-section"
              >
                <div class="qz-audio-card">
                  <div class="qz-audio-icon">
                    <ion-icon :icon="musicalNotesOutline"></ion-icon>
                  </div>
                  <div class="qz-audio-info">
                    <h3 class="qz-audio-title">{{ material.title }}</h3>
                    <p class="qz-audio-sub">Reproductor de audio</p>
                  </div>
                  <audio
                    controls
                    :src="fullUrl"
                    class="qz-audio-player"
                  ></audio>
                </div>
              </div>

              <!-- CASO 5: OTRO ARCHIVO / DOC -->
              <div
                v-else-if="
                  material?.type === MaterialType.DOC ||
                  (!isTextType && material?.url)
                "
                class="qz-file-section"
              >
                <div class="qz-file-card">
                  <div class="qz-file-icon">
                    <ion-icon :icon="documentTextOutline"></ion-icon>
                  </div>
                  <div class="qz-file-info">
                    <h3 class="qz-file-title">{{ material.title }}</h3>
                    <p class="qz-file-sub">Archivo adjunto descargable</p>
                  </div>
                  <button
                    type="button"
                    class="qz-file-download-btn"
                    @click="exportToPdf"
                  >
                    <ion-icon :icon="downloadOutline"></ion-icon>
                    <span>Descargar archivo</span>
                  </button>
                </div>
              </div>

              <!-- CONTENIDO DE TEXTO ENRIQUECIDO / NOTAS ADICIONALES -->
              <div
                v-if="material?.content"
                class="qz-content-section"
                :class="{ 'has-border-top': material?.url }"
              >
                <div
                  class="qz-rich-content"
                  :class="{ 'font-caligrafia': isCalligraphy }"
                  v-html="material.content"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  alertController,
  onIonViewWillEnter,
} from "@ionic/vue";
import {
  arrowBackOutline,
  createOutline,
  downloadOutline,
  openOutline,
  addOutline,
  removeOutline,
  scanOutline,
  contractOutline,
  closeOutline,
  documentTextOutline,
  musicalNotesOutline,
  alertCircleOutline,
  refreshOutline,
} from "ionicons/icons";
import { defineComponent, ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { adminOprofesor, basedeURL, tokenHeader } from "../globalService";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";

const MaterialType = {
  VIDEO: "VIDEO",
  PDF: "PDF",
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
  DOC: "DOC",
  TEXT_RICH: "TEXT_RICH",
  TEXT_SHORT: "TEXT_SHORT",
};

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const generateNativePdfFromHtml = async (pdf, htmlContent, isCalligraphy) => {
  const marginX = 20;
  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const maxContentWidth = pageWidth - marginX * 2;
  const bottomMargin = 25;

  let currentY = 30;
  let fontLoaded = false;

  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      pdf.addPage("letter", "portrait");
      if (isCalligraphy && fontLoaded) {
        pdf.setFont("caligrafia", "normal");
      } else {
        pdf.setFont("helvetica", "normal");
      }
      currentY = 25;
      return true;
    }
    return false;
  };

  if (isCalligraphy) {
    try {
      const response = await fetch("/resources/caligrafia.ttf");
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64Font = arrayBufferToBase64(buffer);
        pdf.addFileToVFS("caligrafia.ttf", base64Font);
        pdf.addFont("caligrafia.ttf", "caligrafia", "normal");
        pdf.setFont("caligrafia", "normal");
        fontLoaded = true;
      }
    } catch (e) {
      console.error("Failed to load calligraphy font for native PDF:", e);
    }
  }

  if (!fontLoaded) {
    pdf.setFont("helvetica", "normal");
  }

  pdf.setFontSize(isCalligraphy && fontLoaded ? 14 : 10);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Material de Apoyo", marginX, 15);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(marginX, 17, pageWidth - marginX, 17);

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const children = Array.from(doc.body.childNodes);

  for (const node of children) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (!text) continue;

      if (fontLoaded && isCalligraphy) {
        pdf.setFont("caligrafia", "normal");
        pdf.setFontSize(20);
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
      }
      pdf.setTextColor(30, 41, 59);

      const lineHeight = fontLoaded && isCalligraphy ? 12 : 6;
      const lines = pdf.splitTextToSize(text, maxContentWidth);

      for (const line of lines) {
        checkPageBreak(lineHeight);
        pdf.text(line, marginX, currentY);
        currentY += lineHeight;
      }
      currentY += 2;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      if (tagName === "p" || tagName === "div") {
        const text = node.innerText || node.textContent || "";
        if (!text.trim()) continue;

        if (fontLoaded && isCalligraphy) {
          pdf.setFont("caligrafia", "normal");
          pdf.setFontSize(20);
        } else {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
        }
        pdf.setTextColor(30, 41, 59);

        const lineHeight = fontLoaded && isCalligraphy ? 12 : 6;
        const lines = pdf.splitTextToSize(text, maxContentWidth);

        for (const line of lines) {
          checkPageBreak(lineHeight);
          pdf.text(line, marginX, currentY);
          currentY += lineHeight;
        }
        currentY += fontLoaded && isCalligraphy ? 6 : 4;
      } else if (tagName.startsWith("h") && tagName.length === 2) {
        const level = parseInt(tagName.charAt(1), 10);
        const text = node.innerText || node.textContent || "";
        if (!text.trim()) continue;

        let fontSize = 12;
        let lineHeight = 6;
        let bottomSpace = 4;

        if (fontLoaded && isCalligraphy) {
          if (level === 1) {
            fontSize = 32;
            lineHeight = 16;
            bottomSpace = 8;
          } else if (level === 2) {
            fontSize = 28;
            lineHeight = 14;
            bottomSpace = 7;
          } else {
            fontSize = 24;
            lineHeight = 12;
            bottomSpace = 6;
          }
          pdf.setFont("caligrafia", "normal");
        } else {
          if (level === 1) {
            fontSize = 22;
            lineHeight = 9;
            bottomSpace = 6;
          } else if (level === 2) {
            fontSize = 18;
            lineHeight = 8;
            bottomSpace = 5;
          } else {
            fontSize = 14;
            lineHeight = 7;
            bottomSpace = 4;
          }
          pdf.setFont("helvetica", "bold");
        }
        pdf.setFontSize(fontSize);
        pdf.setTextColor(15, 23, 42);

        const lines = pdf.splitTextToSize(text, maxContentWidth);
        currentY += 2;
        checkPageBreak(lineHeight);

        for (const line of lines) {
          checkPageBreak(lineHeight);
          pdf.text(line, marginX, currentY);
          currentY += lineHeight;
        }
        currentY += bottomSpace;
      } else if (tagName === "ul" || tagName === "ol") {
        const listItems = Array.from(node.querySelectorAll("li"));
        let index = 1;
        const bulletSymbol = tagName === "ul" ? "• " : "";

        for (const li of listItems) {
          const text = li.innerText || li.textContent || "";
          if (!text.trim()) continue;

          if (fontLoaded && isCalligraphy) {
            pdf.setFont("caligrafia", "normal");
            pdf.setFontSize(20);
          } else {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(11);
          }
          pdf.setTextColor(30, 41, 59);

          const prefix = tagName === "ul" ? bulletSymbol : `${index}. `;
          const fullText = prefix + text;
          const lineHeight = fontLoaded && isCalligraphy ? 12 : 6;
          const lines = pdf.splitTextToSize(fullText, maxContentWidth - 6);

          for (let l = 0; l < lines.length; l++) {
            checkPageBreak(lineHeight);
            const indentX = l === 0 ? marginX : marginX + 6;
            pdf.text(lines[l], indentX, currentY);
            currentY += lineHeight;
          }
          index++;
        }
        currentY += 4;
      } else if (tagName === "hr") {
        checkPageBreak(5);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(marginX, currentY + 2, pageWidth - marginX, currentY + 2);
        currentY += 6;
      } else if (tagName === "img") {
        const src = node.getAttribute("src");
        if (src) {
          try {
            const absoluteSrc = src.startsWith("http")
              ? src
              : window.location.origin + (src.startsWith("/") ? "" : "/") + src;
            const response = await fetch(absoluteSrc);
            const blob = await response.blob();
            const base64 = await new Promise((res, rej) => {
              const r = new FileReader();
              r.onloadend = () => res(r.result);
              r.onerror = rej;
              r.readAsDataURL(blob);
            });

            const img = new Image();
            img.src = base64;
            await new Promise((resolve) => {
              img.onload = resolve;
            });

            let imgWidth = img.width * 0.264583;
            let imgHeight = img.height * 0.264583;

            if (imgWidth > maxContentWidth) {
              const ratio = maxContentWidth / imgWidth;
              imgWidth = maxContentWidth;
              imgHeight = imgHeight * ratio;
            }

            checkPageBreak(imgHeight + 10);
            pdf.addImage(
              base64,
              "PNG",
              marginX,
              currentY,
              imgWidth,
              imgHeight,
              undefined,
              "FAST",
            );
            currentY += imgHeight + 6;
          } catch (e) {
            console.error("Error drawing image natively in PDF:", e);
          }
        }
      }
    }
  }
};

export default defineComponent({
  name: "MaterialView",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSpinner,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const isAdminOrProfessor = adminOprofesor();

    const material = ref(null);
    const isLoading = ref(true);
    const errorMessage = ref("");
    const isCalligraphy = ref(false);

    // Zoom & pan state for images
    const zoomScale = ref(1.0);
    const panX = ref(0);
    const panY = ref(0);
    const baseWidth = ref(0);
    const baseHeight = ref(0);
    const naturalWidth = ref(0);
    const naturalHeight = ref(0);
    const imageViewerRef = ref(null);
    const imageSectionRef = ref(null);
    const isFullscreen = ref(false);

    const isDragging = ref(false);
    const isWheeling = ref(false);
    let wheelTimeout = null;

    let startX = 0;
    let startY = 0;
    let startPanX = 0;
    let startPanY = 0;

    const fullUrl = computed(() => {
      if (!material.value?.url) return "";
      const url = material.value.url;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }
      const base = basedeURL() || "";
      const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
      const cleanUrl = url.startsWith("/") ? url : `/${url}`;
      return `${cleanBase}${cleanUrl}`;
    });

    const isTextType = computed(() => {
      const t = material.value?.type;
      return t === MaterialType.TEXT_RICH || t === MaterialType.TEXT_SHORT;
    });

    const hasTextContent = computed(() => {
      return Boolean(material.value?.content && material.value.content.trim());
    });

    const canExport = computed(() => {
      const type = material.value?.type;
      return (
        type === MaterialType.TEXT_RICH ||
        type === MaterialType.TEXT_SHORT ||
        type === MaterialType.IMAGE ||
        type === MaterialType.PDF ||
        type === MaterialType.DOC ||
        Boolean(material.value?.content)
      );
    });

    const lessonTopic = computed(() => {
      return material.value?.lesson?.topic || "";
    });

    const heroSubtitle = computed(() => {
      if (material.value?.lesson?.course?.name) {
        return `${material.value.lesson.course.name} · ${
          material.value.lesson.area?.name || "Área académica"
        }`;
      }
      return "Recurso educativo y material de estudio";
    });

    const formatMaterialType = (type) => {
      switch (type) {
        case MaterialType.IMAGE:
          return "MATERIAL DE APOYO · IMAGEN";
        case MaterialType.PDF:
          return "MATERIAL DE APOYO · PDF";
        case MaterialType.VIDEO:
          return "MATERIAL DE APOYO · VIDEO";
        case MaterialType.AUDIO:
          return "MATERIAL DE APOYO · AUDIO";
        case MaterialType.TEXT_RICH:
        case MaterialType.TEXT_SHORT:
          return "MATERIAL DE APOYO · LECTURA";
        case MaterialType.DOC:
          return "MATERIAL DE APOYO · DOCUMENTO";
        default:
          return "MATERIAL DE APOYO";
      }
    };

    const fetchMaterial = async () => {
      const id = route.params.id;
      if (!id) {
        errorMessage.value = "Identificador de material no válido.";
        isLoading.value = false;
        return;
      }

      isLoading.value = true;
      errorMessage.value = "";

      try {
        const response = await axios.get(`/materials/${id}`, tokenHeader());
        material.value = response.data;
        if (response.data.lesson?.id) {
          sessionStorage.setItem(
            "lastActiveLessonId",
            String(response.data.lesson.id),
          );
          sessionStorage.setItem("lastActiveSection", "materiales");
        }
        resetZoom();
      } catch (error) {
        console.error("Error al obtener el material:", error);
        errorMessage.value =
          "No fue posible cargar el material de apoyo. Por favor intenta de nuevo.";
      } finally {
        isLoading.value = false;
      }
    };

    onIonViewWillEnter(() => {
      fetchMaterial();
    });

    const goBack = () => {
      const l = material.value?.lesson;
      if (l?.id) {
        sessionStorage.setItem("lastActiveLessonId", String(l.id));
        sessionStorage.setItem("lastActiveSection", "materiales");
      }
      if (window.history.length > 1) {
        router.back();
      } else if (l) {
        const cId = l.course?.id || l.courseId;
        const aId = l.area?.id || l.areaId;
        const pId = l.period?.id || l.periodId;
        const yr = l.year || new Date().getFullYear();
        const typeSuffix = l.type ? `/${l.type}` : "";
        if (cId && aId && pId) {
          router.push(`/lecciones/${cId}/${aId}/${pId}/${yr}${typeSuffix}`);
          return;
        }
        router.push("/inicio");
      } else {
        router.push("/inicio");
      }
    };

    const openInNewTab = (url) => {
      if (url) {
        window.open(url, "_blank");
      }
    };

    const goToEditMaterial = () => {
      if (!material.value) return;
      const lessonId =
        material.value.lesson?.id ||
        material.value.lessonId ||
        route.query.lessonId;
      if (lessonId) {
        router.push(`/crear/material/${lessonId}/${material.value.id}`);
      } else {
        router.push(`/materials/edit/${material.value.id}`);
      }
    };

    const toggleFont = () => {
      isCalligraphy.value = !isCalligraphy.value;
    };

    // Zoom & Pan methods
    const zoomLevel = computed(() => zoomScale.value);

    const isCenteredAndFitted = () => {
      if (!imageViewerRef.value || !baseWidth.value) return true;
      const cWidth = imageViewerRef.value.clientWidth;
      const cHeight = imageViewerRef.value.clientHeight;
      const expectedX = Math.round((cWidth - baseWidth.value) / 2);
      const expectedY = Math.max(
        0,
        Math.round((cHeight - baseHeight.value) / 2),
      );
      return (
        Math.abs(zoomScale.value - 1.0) < 0.05 &&
        Math.abs(panX.value - expectedX) < 10 &&
        Math.abs(panY.value - expectedY) < 10
      );
    };

    const isFitWidth = computed(() => isCenteredAndFitted());

    const isOriginalSize = computed(() => {
      if (!naturalWidth.value || !baseWidth.value) return false;
      return (
        Math.abs(zoomScale.value - naturalWidth.value / baseWidth.value) < 0.05
      );
    });

    const fitImage = () => {
      if (!imageViewerRef.value || !naturalWidth.value || !naturalHeight.value)
        return;
      const cWidth = imageViewerRef.value.clientWidth;
      const cHeight = imageViewerRef.value.clientHeight;
      if (!cWidth || !cHeight) return;

      const imgW = naturalWidth.value;
      const imgH = naturalHeight.value;

      let ratio;
      if (isFullscreen.value) {
        ratio = Math.min(cWidth / imgW, cHeight / imgH);
      } else {
        const maxH = Math.min(cHeight || 600, window.innerHeight * 0.75);
        ratio = Math.min(cWidth / imgW, maxH / imgH, 1.0);
        if (cWidth / imgW < 1.0) ratio = cWidth / imgW;
      }

      const fittedW = Math.round(imgW * ratio);
      const fittedH = Math.round(imgH * ratio);

      baseWidth.value = fittedW;
      baseHeight.value = fittedH;
      zoomScale.value = 1.0;

      panX.value = Math.round((cWidth - fittedW) / 2);
      panY.value = Math.max(0, Math.round((cHeight - fittedH) / 2));
    };

    const onImageLoad = (e) => {
      naturalWidth.value = e.target.naturalWidth;
      naturalHeight.value = e.target.naturalHeight;
      fitImage();
    };

    const zoomAtCenter = (factor) => {
      if (!imageViewerRef.value) return;
      const cWidth = imageViewerRef.value.clientWidth;
      const cHeight = imageViewerRef.value.clientHeight;
      const cx = cWidth / 2;
      const cy = cHeight / 2;

      const ix = (cx - panX.value) / zoomScale.value;
      const iy = (cy - panY.value) / zoomScale.value;

      const newScale = Math.min(
        Math.max(0.35, Number((zoomScale.value * factor).toFixed(3))),
        12.0,
      );

      panX.value = Math.round(cx - ix * newScale);
      panY.value = Math.round(cy - iy * newScale);
      zoomScale.value = newScale;
    };

    const zoomIn = () => {
      zoomAtCenter(1.25);
    };

    const zoomOut = () => {
      zoomAtCenter(1 / 1.25);
    };

    const setOriginalSize = () => {
      if (!imageViewerRef.value || !naturalWidth.value || !baseWidth.value)
        return;
      const cWidth = imageViewerRef.value.clientWidth;
      const cHeight = imageViewerRef.value.clientHeight;
      const cx = cWidth / 2;
      const cy = cHeight / 2;

      const targetScale = naturalWidth.value / baseWidth.value;
      const ix = (cx - panX.value) / zoomScale.value;
      const iy = (cy - panY.value) / zoomScale.value;

      zoomScale.value = Number(targetScale.toFixed(3));
      panX.value = Math.round(cx - ix * zoomScale.value);
      panY.value = Math.round(cy - iy * zoomScale.value);
    };

    const resetZoom = () => {
      fitImage();
    };

    const toggleFitWidth = () => {
      fitImage();
    };

    const toggleSpaceFit = () => {
      if (!isCenteredAndFitted()) {
        fitImage();
      } else {
        setOriginalSize();
      }
    };

    const handleWheelZoom = (e) => {
      if (!imageViewerRef.value) return;
      e.preventDefault();

      isWheeling.value = true;
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        isWheeling.value = false;
      }, 100);

      const rect = imageViewerRef.value.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      // Coordenadas locales en la imagen antes del nuevo factor
      const ix = (cx - panX.value) / zoomScale.value;
      const iy = (cy - panY.value) / zoomScale.value;

      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      const newScale = Math.min(
        Math.max(0.35, Number((zoomScale.value * factor).toFixed(3))),
        12.0,
      );

      // El punto bajo el puntero (cx, cy) permanece exactamente bajo el puntero
      panX.value = Math.round(cx - ix * newScale);
      panY.value = Math.round(cy - iy * newScale);
      zoomScale.value = newScale;
    };

    const startPan = (e) => {
      if (e.button !== 0) return;
      isDragging.value = true;
      startX = e.clientX;
      startY = e.clientY;
      startPanX = panX.value;
      startPanY = panY.value;
    };

    const onPan = (e) => {
      if (!isDragging.value) return;
      panX.value = startPanX + (e.clientX - startX);
      panY.value = startPanY + (e.clientY - startY);
    };

    const stopPan = () => {
      isDragging.value = false;
    };

    const toggleFullScreen = async () => {
      const sectionEl = imageSectionRef.value;
      if (!sectionEl) return;

      if (!isFullscreen.value) {
        try {
          if (sectionEl.requestFullscreen) {
            await sectionEl.requestFullscreen();
          } else if (sectionEl.webkitRequestFullscreen) {
            await sectionEl.webkitRequestFullscreen();
          } else if (sectionEl.msRequestFullscreen) {
            await sectionEl.msRequestFullscreen();
          }
        } catch (err) {
          console.warn("Fullscreen request warning (using fallback):", err);
        }
        isFullscreen.value = true;
        setTimeout(fitImage, 60);
      } else {
        try {
          if (document.exitFullscreen && document.fullscreenElement) {
            await document.exitFullscreen();
          } else if (
            document.webkitExitFullscreen &&
            document.webkitFullscreenElement
          ) {
            await document.webkitExitFullscreen();
          } else if (
            document.msExitFullscreen &&
            document.msFullscreenElement
          ) {
            await document.msExitFullscreen();
          }
        } catch (err) {
          console.warn("Exit fullscreen error:", err);
        }
        isFullscreen.value = false;
        setTimeout(fitImage, 60);
      }
    };

    const handleFullscreenChange = () => {
      const isDocFullscreen = Boolean(
        document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement,
      );
      if (!isDocFullscreen && isFullscreen.value) {
        isFullscreen.value = false;
        setTimeout(fitImage, 60);
      }
    };

    const handleKeyDown = (e) => {
      if (isFullscreen.value) {
        if (e.key === "Escape") {
          toggleFullScreen();
        } else if (e.code === "Space" || e.key === " ") {
          e.preventDefault();
          toggleSpaceFit();
        }
      }
    };

    onMounted(() => {
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("MSFullscreenChange", handleFullscreenChange);
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("resize", fitImage);
    });

    onUnmounted(() => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", fitImage);
      clearTimeout(wheelTimeout);
    });

    const stageStyle = computed(() => {
      return {
        transform: `translate3d(${panX.value}px, ${panY.value}px, 0) scale(${zoomScale.value})`,
        transformOrigin: "0 0",
        transition:
          isDragging.value || isWheeling.value
            ? "none"
            : "transform 0.18s ease-out",
        willChange: "transform",
      };
    });

    const imageStyle = computed(() => {
      return {
        width: `${baseWidth.value || naturalWidth.value || 100}px`,
        height: `${baseHeight.value || naturalHeight.value || 100}px`,
        maxWidth: "none",
        maxHeight: "none",
        display: "block",
        userSelect: "none",
        pointerEvents: "none",
        borderRadius: isFullscreen.value ? "0" : "12px",
        boxShadow: isFullscreen.value
          ? "none"
          : "0 8px 24px rgba(12, 9, 42, 0.1)",
      };
    });

    // Native PDF Export
    const exportToPdf = async () => {
      if (!material.value) return;

      const type = material.value.type;

      // Caso A: Documento ya en PDF o DOC
      if (type === MaterialType.PDF || type === MaterialType.DOC) {
        const loading = await alertController.create({
          header: "Descargando archivo",
          message: "Por favor espere...",
          backdropDismiss: false,
        });
        await loading.present();

        try {
          const url = fullUrl.value;
          const response = await fetch(url);
          if (!response.ok)
            throw new Error("No se pudo descargar el archivo original.");
          const blob = await response.blob();

          const fileExtension =
            url.split(".").pop().split("?")[0] ||
            (type === MaterialType.PDF ? "pdf" : "docx");
          const sanitizedTitle = material.value.title
            ? material.value.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
            : "documento";
          const filename = `${sanitizedTitle}.${fileExtension}`;

          if (Capacitor.isNativePlatform()) {
            const base64Data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(",")[1]);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            await FileSharer.share({
              filename: filename,
              contentType: blob.type || "application/octet-stream",
              base64Data: base64Data,
            });
          } else {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
          }
        } catch (err) {
          console.error("Error al exportar archivo original:", err);
          const errorAlert = await alertController.create({
            header: "Error",
            message: "Hubo un error al descargar o compartir el archivo.",
            buttons: ["OK"],
          });
          await errorAlert.present();
        } finally {
          await loading.dismiss();
        }
        return;
      }

      // Caso B: IMAGEN a PDF Carta
      if (type === MaterialType.IMAGE) {
        const loading = await alertController.create({
          header: "Generando PDF",
          message: "Por favor espere...",
          backdropDismiss: false,
        });
        await loading.present();

        try {
          const url = fullUrl.value;
          const response = await fetch(url);
          if (!response.ok)
            throw new Error("No se pudo descargar la imagen original.");
          const blob = await response.blob();

          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const { jsPDF } = await import("jspdf");
          const pdf = new jsPDF({
            unit: "mm",
            format: "letter",
            orientation: "portrait",
          });
          const pageWidthMm = 215.9;
          const pageHeightMm = 279.4;
          const margin = 20;
          const maxW = pageWidthMm - margin * 2;
          const maxH = pageHeightMm - margin * 2 - 20;

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(100, 116, 139);
          pdf.text("Material de Apoyo", margin, 15);
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.5);
          pdf.line(margin, 17, pageWidthMm - margin, 17);

          const img = new Image();
          img.src = base64Data;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          let imgWidth = img.width * 0.264583;
          let imgHeight = img.height * 0.264583;

          if (imgWidth > maxW) {
            const ratio = maxW / imgWidth;
            imgWidth = maxW;
            imgHeight = imgHeight * ratio;
          }
          if (imgHeight > maxH) {
            const ratio = maxH / imgHeight;
            imgHeight = maxH;
            imgWidth = imgWidth * ratio;
          }

          const x = margin + (maxW - imgWidth) / 2;
          const y = 25 + (maxH - imgHeight) / 2;

          pdf.addImage(
            base64Data,
            "PNG",
            x,
            y,
            imgWidth,
            imgHeight,
            undefined,
            "FAST",
          );

          const sanitizedTitle = material.value.title
            ? material.value.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
            : "imagen";
          const filename = `material_${sanitizedTitle}_${Date.now()}.pdf`;

          if (Capacitor.isNativePlatform()) {
            await FileSharer.share({
              filename: filename,
              contentType: "application/pdf",
              base64Data: pdf.output("datauristring").split(",")[1],
            });
          } else {
            pdf.save(filename);
          }
        } catch (e) {
          console.error("Error creating image PDF:", e);
          const errorAlert = await alertController.create({
            header: "Error",
            message: "Hubo un error al generar el PDF de la imagen.",
            buttons: ["OK"],
          });
          await errorAlert.present();
        } finally {
          await loading.dismiss();
        }
        return;
      }

      // Caso C: TEXT_RICH, TEXT_SHORT o Contenido HTML
      const loading = await alertController.create({
        header: "Generando PDF",
        message: "Generando documento nativo, por favor espere...",
        backdropDismiss: false,
      });
      await loading.present();

      try {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
          unit: "mm",
          format: "letter",
          orientation: "portrait",
        });

        await generateNativePdfFromHtml(
          pdf,
          material.value.content || "",
          isCalligraphy.value,
        );

        pdf.setPage(1);
        let titleFontSize = 22;
        let titleLineHeight = 9;
        const fontLoaded =
          isCalligraphy.value && pdf.getFont().fontName === "caligrafia";

        if (isCalligraphy.value && fontLoaded) {
          titleFontSize = 28;
          titleLineHeight = 14;
        }

        pdf.setFontSize(titleFontSize);
        pdf.setTextColor(15, 23, 42);
        if (!fontLoaded) {
          pdf.setFont("helvetica", "bold");
        }

        const docTitleLines = pdf.splitTextToSize(
          material.value.title || "Material",
          175.9,
        );
        let titleY = 25;
        for (const line of docTitleLines) {
          pdf.text(line, 20, titleY);
          titleY += titleLineHeight;
        }

        const sanitizedTitle = material.value.title
          ? material.value.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
          : "material";
        const filename = `material_${sanitizedTitle}_${Date.now()}.pdf`;

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
      } catch (error) {
        console.error("Error generating native PDF from HTML:", error);
        const errorAlert = await alertController.create({
          header: "Error",
          message: "Hubo un error al generar el PDF nativo.",
          buttons: ["OK"],
        });
        await errorAlert.present();
      } finally {
        await loading.dismiss();
      }
    };

    return {
      MaterialType,
      material,
      isLoading,
      errorMessage,
      fullUrl,
      isTextType,
      hasTextContent,
      canExport,
      lessonTopic,
      heroSubtitle,
      formatMaterialType,
      fetchMaterial,
      goBack,
      openInNewTab,
      goToEditMaterial,
      toggleFont,
      isCalligraphy,
      isAdminOrProfessor,
      // Zoom
      zoomScale,
      zoomLevel,
      isFitWidth,
      isOriginalSize,
      imageViewerRef,
      imageSectionRef,
      isFullscreen,
      isDragging,
      stageStyle,
      imageStyle,
      onImageLoad,
      zoomIn,
      zoomOut,
      resetZoom,
      toggleFitWidth,
      toggleFullScreen,
      toggleSpaceFit,
      setOriginalSize,
      handleWheelZoom,
      startPan,
      onPan,
      stopPan,
      exportToPdf,
      // Icons
      arrowBackOutline,
      createOutline,
      downloadOutline,
      openOutline,
      addOutline,
      removeOutline,
      scanOutline,
      contractOutline,
      closeOutline,
      documentTextOutline,
      musicalNotesOutline,
      alertCircleOutline,
      refreshOutline,
    };
  },
});
</script>

<style scoped>
.qz-material-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-material-content {
  --background: var(--qz-color-purple-bg, #efeefc);
}

.qz-page-wrapper {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* 1. CABECERA HERO QUEEZY PÚRPURA */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 24px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 1000px;
  margin: 0 auto;
  padding: 8px 20px 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

.qz-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-action-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.qz-action-btn.is-active {
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.qz-action-btn:active {
  transform: scale(0.92);
}

.qz-font-btn-text {
  font-family: "caligrafia", cursive, sans-serif;
  font-size: 19px;
  font-weight: 700;
  line-height: 1;
}

.qz-hero-titles {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: left;
}

.qz-hero-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
}

.qz-hero-title {
  margin: 4px 0 6px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: clamp(22px, 3.5vw, 32px);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
  word-break: break-word;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

/* 2. CUERPO PRINCIPAL */
.qz-main-body {
  flex: 1;
  padding: 12px 20px 36px 20px;
}

.qz-container {
  max-width: 1000px;
  margin: 0 auto;
}

/* ESTADOS DE CARGA Y ERROR */
.qz-loading-card,
.qz-error-card {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: var(--qz-radius-xl, 24px);
  padding: 48px 24px;
  text-align: center;
  box-shadow: var(--qz-shadow-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-error-icon {
  font-size: 48px;
  color: var(--ion-color-danger, #ff5656);
}

.qz-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 10px 22px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.qz-retry-btn:active {
  transform: scale(0.95);
}

/* TARJETA PRINCIPAL DEL MATERIAL */
.qz-material-card {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: var(--qz-radius-xl, 24px);
  box-shadow: var(--qz-shadow-card);
  border: 1px solid var(--qz-color-border, #e6e6e6);
  overflow: hidden;
}

/* SECCIÓN 1: IMAGEN Y ZOOM */
.qz-image-section {
  display: flex;
  flex-direction: column;
  background: rgba(106, 90, 224, 0.03);
}

.qz-zoom-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: #ffffff;
  border-bottom: 1px solid var(--qz-color-border, #e6e6e6);
  gap: 12px;
  flex-wrap: wrap;
}

.qz-zoom-controls-left,
.qz-zoom-controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-zoom-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--qz-radius-full, 9999px);
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qz-zoom-btn:not(:disabled):active {
  transform: scale(0.92);
  background: #dedbfb;
}

.qz-zoom-level-pill {
  height: 36px;
  padding: 0 14px;
  border-radius: var(--qz-radius-full, 9999px);
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.2);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-zoom-action-pill {
  height: 36px;
  padding: 0 12px;
  border-radius: var(--qz-radius-full, 9999px);
  background: #ffffff;
  color: var(--qz-color-text-main, #0c092a);
  border: 1px solid var(--qz-color-border, #e6e6e6);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-zoom-action-pill.is-active {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-zoom-action-pill:active {
  transform: scale(0.94);
}

/* VISOR DE IMAGEN (Con zoom GPU hacia el puntero y arrastre libre) */
.qz-image-viewer-container {
  width: 100%;
  min-height: 420px;
  max-height: 75vh;
  overflow: hidden;
  position: relative;
  background: rgba(106, 90, 224, 0.04);
  cursor: grab;
  user-select: none;
}

.qz-image-viewer-container.is-grabbing {
  cursor: grabbing;
}

.qz-image-stage {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  user-select: none;
}

.qz-zoom-image {
  display: block;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(12, 9, 42, 0.1);
  background: #ffffff;
  image-rendering: auto;
  user-select: none;
  pointer-events: none;
}

.qz-zoom-hint {
  padding: 10px 18px;
  background: #ffffff;
  border-top: 1px solid var(--qz-color-border, #e6e6e6);
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
  text-align: center;
}

/* SECCIÓN 2: PDF */
.qz-pdf-section {
  display: flex;
  flex-direction: column;
}

.qz-media-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: #ffffff;
  border-bottom: 1px solid var(--qz-color-border, #e6e6e6);
}

.qz-media-tag {
  font-size: 13px;
  font-weight: 700;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-media-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.2);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.qz-media-btn:active {
  transform: scale(0.95);
}

.qz-pdf-frame-wrapper {
  width: 100%;
  height: 80vh;
  min-height: 550px;
}

.qz-pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
}

/* SECCIÓN 3: VIDEO */
.qz-video-section {
  padding: 20px;
  background: #0c092a;
}

.qz-video-wrapper {
  max-width: 900px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
}

.qz-video-player {
  width: 100%;
  display: block;
  border-radius: 16px;
}

/* SECCIÓN 4: AUDIO */
.qz-audio-section {
  padding: 32px 20px;
}

.qz-audio-card {
  max-width: 540px;
  margin: 0 auto;
  background: var(--qz-color-purple-bg, #efeefc);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  border: 1px solid rgba(106, 90, 224, 0.15);
}

.qz-audio-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.qz-audio-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-audio-sub {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-audio-player {
  width: 100%;
  margin-top: 8px;
}

/* SECCIÓN 5: ARCHIVO DESCARGABLE */
.qz-file-section {
  padding: 32px 20px;
}

.qz-file-card {
  max-width: 540px;
  margin: 0 auto;
  background: var(--qz-color-purple-bg, #efeefc);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  border: 1px solid rgba(106, 90, 224, 0.15);
}

.qz-file-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.qz-file-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-file-sub {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-file-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.3);
}

.qz-file-download-btn:active {
  transform: scale(0.95);
}

/* SECCIÓN 6: CONTENIDO DE TEXTO ENRIQUECIDO */
.qz-content-section {
  padding: 28px 24px;
}

.qz-content-section.has-border-top {
  border-top: 1px solid var(--qz-color-border, #e6e6e6);
}

.qz-rich-content {
  font-size: 16px;
  line-height: 1.65;
  color: var(--qz-color-text-main, #0c092a);
  word-break: break-word;
}

.qz-rich-content img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 12px 0;
}

.qz-rich-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.qz-rich-content th,
.qz-rich-content td {
  border: 1px solid var(--qz-color-border, #e6e6e6);
  padding: 8px 12px;
}

/* MODO CALIGRAFÍA */
.font-caligrafia .qz-rich-content,
.font-caligrafia .qz-rich-content * {
  font-family: "caligrafia", cursive, sans-serif !important;
  font-weight: 400 !important;
  font-size: clamp(1.8rem, 4vw, 3.2rem) !important;
  line-height: 1.4 !important;
}

/* RESPONSIVE DESKTOP / PC */
@media (min-width: 768px) {
  .qz-material-card {
    border-radius: var(--qz-radius-2xl, 32px);
  }

  .qz-image-viewer-container {
    min-height: 520px;
    max-height: 80vh;
  }
}

/* PANTALLA COMPLETA */
.qz-image-section.is-fullscreen,
.qz-image-section:fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 99999 !important;
  background: #000000 !important;
  border-radius: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.qz-image-section.is-fullscreen .qz-zoom-toolbar,
.qz-image-section:fullscreen .qz-zoom-toolbar {
  display: none !important;
}

.qz-image-section.is-fullscreen .qz-image-viewer-container,
.qz-image-section:fullscreen .qz-image-viewer-container {
  flex: 1 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  background: #000000 !important;
  border-radius: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.qz-image-section.is-fullscreen .qz-image-stage,
.qz-image-section:fullscreen .qz-image-stage {
  user-select: none !important;
}

.qz-fullscreen-close-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(20, 20, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100000;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
  outline: none;
}

.qz-fullscreen-close-btn:hover {
  background: rgba(30, 30, 30, 0.95);
  transform: scale(1.1);
}

.qz-fullscreen-hint-pill {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 15, 15, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  padding: 8px 20px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 500;
  z-index: 100000;
  pointer-events: none;
  backdrop-filter: blur(8px);
  user-select: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.2px;
}
</style>
