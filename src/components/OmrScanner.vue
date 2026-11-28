<template>
  <div class="omr-scanner-root">
    <div v-if="isLoading" class="loading-indicator">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Iniciando escáner...</p>
    </div>

    <div v-show="!isLoading" class="scanner-content">
      <video
        ref="video"
        playsinline
        autoplay
        muted
        style="display: none"
      ></video>

      <!-- 1. CONTROLES EN LA PARTE SUPERIOR -->
      <div class="controls-container controls-container--top">
        <div class="controls-inner">
          <div class="contrast-group">
            <ion-icon :icon="contrastOutline" class="contrast-icon"></ion-icon>
            <ion-range
              min="0"
              max="200"
              :value="contrastSliderValue"
              @ionChange="onContrastChange"
              class="contrast-slider"
              aria-label="Contraste"
            ></ion-range>
          </div>

          <div class="scanner-action-btns">
            <button
              v-if="isFlashSupported"
              type="button"
              class="qz-scanner-ctrl-btn"
              :class="{ 'qz-scanner-ctrl-btn--active': isFlashOn }"
              @click="toggleFlash"
              aria-label="Flash"
              title="Flash"
            >
              <ion-icon
                :icon="isFlashOn ? flashlight : flashlightOutline"
              ></ion-icon>
            </button>
            <button
              type="button"
              class="qz-scanner-ctrl-btn qz-scanner-ctrl-btn--close"
              @click="cancelScan"
              aria-label="Cancelar"
              title="Cancelar escaneo"
            >
              <ion-icon :icon="closeCircleOutline"></ion-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- 2. VISOR REDUCIDO Y ENMARCADO -->
      <div class="video-feed-wrapper">
        <div class="video-feed-frame">
          <canvas ref="outputCanvas" class="video-feed"></canvas>
          <div class="scanner-corner scanner-corner--tl"></div>
          <div class="scanner-corner scanner-corner--tr"></div>
          <div class="scanner-corner scanner-corner--bl"></div>
          <div class="scanner-corner scanner-corner--br"></div>
        </div>
      </div>

      <!-- 3. GUÍA INFERIOR COMPACTA -->
      <div class="scanner-bottom-hint">
        <span class="scanner-hint-text">
          Alinee los 4 marcadores dentro del recuadro
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, reactive, markRaw } from "vue";
import {
  IonSpinner,
  alertController,
  IonRange,
  IonIcon,
} from "@ionic/vue";
import {
  flashlight,
  flashlightOutline,
  contrastOutline,
  closeCircleOutline,
} from "ionicons/icons";
import { CapacitorFlash } from "@capgo/capacitor-flash";
import cv from "@techstark/opencv-js";
import { fetchTemplates, fetchSurveyTemplate } from "@/components/functions/omr/templateLoader.js";
import {
  findAndLabelMarkers,
  performPerspectiveCorrection,
  extractAndDrawResults,
  drawMarkerOverlays,
} from "@/components/functions/omr/imageProcessor.js";
import { setCv } from "@/components/functions/omr/omrState.js";

// Promise wrapper for OpenCV's initialization
function waitForOpenCv(cvModule) {
  return new Promise((resolve) => {
    if (cvModule.Mat) {
      resolve();
    } else {
      cvModule.onRuntimeInitialized = () => {
        resolve();
      };
    }
  });
}

export default {
  name: "OmrScanner",
  components: {
    IonSpinner,
    IonRange,
    IonIcon,
  },
  props: {
    templateName: {
      type: String,
      default: null,
    },
    customTemplate: {
      type: Object,
      default: null,
    },
    answerKeys: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["scan-complete", "scan-cancelled"],
  setup(props, { emit, expose }) {
    const video = ref(null);
    const outputCanvas = ref(null);
    const isLoading = ref(true);
    let stream = null;
    let animationFrameId = null;
    const contrastSliderValue = ref(100);
    const isFlashSupported = ref(false);
    const isFlashOn = ref(false);

    const OMR_STATE = reactive({
      cv: null,
      video: null,
      canvas: null,
      ctx: null,
      width: 640,
      height: 480,
      captured: false,
      src: null,
      gray: null,
      bw: null,
      clahe: null,
      circleTemplate: [],
      matrixTemplate: {},
      // NEW: store clipLimit/gamma for reinit & processing
      contrastClipLimit: 2.0,
      gamma: 1.0,
      contrastValue: 1.0,
    });

    const onContrastChange = (event) => {
      const value = event.detail.value;
      contrastSliderValue.value = value;

      // LESS AGGRESSIVE mapping:
      // clipLimit: 1.0 -> 3.0  (anteriormente 1.0 -> 5.0)
      const clipLimit = 1.0 + (value / 200) * 2.0; // 1.0 → 3.0
      OMR_STATE.contrastClipLimit = clipLimit;

      // Gamma mapping for gentle mid-tone control:
      // value 0..200 -> gamma 0.6 .. 1.6 (1.0 is neutral)
      const gamma = 0.6 + (value / 200) * 1.0;
      OMR_STATE.gamma = gamma;

      // Keep legacy field for compatibility
      OMR_STATE.contrastValue = clipLimit;

      // If CLAHE exists, try to update its clip limit, otherwise re-create in reinitialize
      try {
        if (OMR_STATE.clahe && typeof OMR_STATE.clahe.setClipLimit === "function") {
          OMR_STATE.clahe.setClipLimit(clipLimit);
        } else if (OMR_STATE.cv) {
          // recreate
          if (OMR_STATE.clahe) {
            try { OMR_STATE.clahe.delete(); } catch (e) {
              console.log(e);
              
            }
          }
          OMR_STATE.clahe = markRaw(new OMR_STATE.cv.CLAHE(clipLimit, new OMR_STATE.cv.Size(8, 8)));
        }
      } catch (e) {
        console.warn("Could not update CLAHE clipLimit:", e);
      }

      try {
        localStorage.setItem("omrContrast", value);
      } catch (e) {
        console.warn("Could not save contrast to localStorage.");
      }
    };

    const checkFlashAvailability = async () => {
      try {
        const { value } = await CapacitorFlash.isAvailable();
        if (value) {
          isFlashSupported.value = true;
          return;
        }
      } catch (e) {
        // CapacitorFlash not available or not running native
      }

      try {
        if (stream) {
          const track = stream.getVideoTracks()[0];
          const capabilities = track?.getCapabilities ? track.getCapabilities() : null;
          if (capabilities && "torch" in capabilities) {
            isFlashSupported.value = true;
            return;
          }
        }
      } catch (e) {
        console.warn("Could not check web torch capabilities:", e);
      }

      isFlashSupported.value = false;
    };

    const toggleFlash = async () => {
      // 1. Try native CapacitorFlash
      try {
        const isCap = await CapacitorFlash.isAvailable()
          .then((r) => r.value)
          .catch(() => false);
        if (isCap) {
          await CapacitorFlash.toggle();
          const { value } = await CapacitorFlash.isSwitchedOn();
          isFlashOn.value = value;
          localStorage.setItem("omrFlashState", String(value));
          return;
        }
      } catch (e) {
        // Fall back to web torch
      }

      // 2. Try web torch via MediaStreamTrack
      try {
        if (stream) {
          const track = stream.getVideoTracks()[0];
          const newState = !isFlashOn.value;
          await track.applyConstraints({
            advanced: [{ torch: newState }],
          });
          isFlashOn.value = newState;
          localStorage.setItem("omrFlashState", String(newState));
        }
      } catch (e) {
        console.error("Error toggling flash/torch", e);
      }
    };

    const turnOffFlash = async () => {
      try {
        const { value } = await CapacitorFlash.isSwitchedOn();
        if (value) {
          await CapacitorFlash.switchOff();
        }
      } catch (e) {
        // ignore
      }
      try {
        if (stream) {
          const track = stream.getVideoTracks()[0];
          if (track && track.applyConstraints) {
            await track.applyConstraints({
              advanced: [{ torch: false }],
            });
          }
        }
      } catch (e) {
        // ignore
      }
      isFlashOn.value = false;
    };

    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "environment",
            },
            audio: false,
          });
          video.value.srcObject = stream;
          await video.value.play();
          await checkFlashAvailability();
        } else {
          throw new Error("La API de cámara no está disponible.");
        }
      } catch (error) {
        const alert = await alertController.create({
          header: "Error de Cámara",
          message: `No se pudo acceder a la cámara. Asegúrate de haber dado los permisos necesarios. Error: ${error.message}`,
          buttons: ["OK"],
        });
        await alert.present();
      }
    };

    const reinitializeOMRMats = () => {
      if (!OMR_STATE.cv || !OMR_STATE.width || !OMR_STATE.height) {
        console.error(
          "OpenCV or dimensions not initialized for OMR Mat reinitialization."
        );
        return;
      }
      OMR_STATE.src = markRaw(
        new OMR_STATE.cv.Mat(
          OMR_STATE.height,
          OMR_STATE.width,
          OMR_STATE.cv.CV_8UC4
        )
      );
      OMR_STATE.gray = markRaw(
        new OMR_STATE.cv.Mat(
          OMR_STATE.height,
          OMR_STATE.width,
          OMR_STATE.cv.CV_8UC1
        )
      );
      OMR_STATE.bw = markRaw(
        new OMR_STATE.cv.Mat(
          OMR_STATE.height,
          OMR_STATE.width,
          OMR_STATE.cv.CV_8UC1
        )
      );
      // create CLAHE using current clipLimit
      try {
        if (OMR_STATE.clahe) {
          try { OMR_STATE.clahe.delete(); } catch (e) {
            console.log(e);
            
          }
        }
        OMR_STATE.clahe = markRaw(
          new OMR_STATE.cv.CLAHE(OMR_STATE.contrastClipLimit || 2.0, new OMR_STATE.cv.Size(8, 8))
        );
      } catch (e) {
        console.warn("Could not create CLAHE:", e);
        OMR_STATE.clahe = null;
      }
    };

    const initialize = () => {
      setTimeout(async () => {
        try {
          await waitForOpenCv(cv);
          OMR_STATE.cv = cv;
          setCv(OMR_STATE.cv);

          await checkFlashAvailability();

          let templates;
          if (props.customTemplate) {
            const rawSections = Array.isArray(props.customTemplate.sections)
              ? props.customTemplate.sections
              : (props.customTemplate.circleTemplate || []);
            // Filtrar solo las secciones que contienen burbujas OMR escaneables
            const scannableSections = rawSections.filter(
              (s) => s.type !== "instruction" && s.circles
            );
            OMR_STATE.isSurvey = true;
            OMR_STATE.templateName =
              props.customTemplate.template_name ||
              props.customTemplate.name ||
              "custom";
            OMR_STATE.circleTemplate = scannableSections;
            OMR_STATE.matrixTemplate =
              props.customTemplate.matrixTemplate || {};
          } else if (props.templateName) {
            templates = await fetchSurveyTemplate(props.templateName);
            OMR_STATE.isSurvey = true;
            OMR_STATE.templateName = props.templateName;
            OMR_STATE.circleTemplate = templates.circleTemplate;
            OMR_STATE.matrixTemplate = templates.matrixTemplate;
          } else {
            templates = await fetchTemplates();
            OMR_STATE.isSurvey = false;
            OMR_STATE.templateName = null;
            OMR_STATE.circleTemplate = templates.circleTemplate;
            OMR_STATE.matrixTemplate = templates.matrixTemplate;
          }

          const handleMetadataLoaded = () => {
            if (!video.value) return;
            OMR_STATE.width = video.value.videoWidth || 640;
            OMR_STATE.height = video.value.videoHeight || 480;
            OMR_STATE.video = video.value;
            OMR_STATE.canvas = outputCanvas.value;
            OMR_STATE.ctx = OMR_STATE.canvas ? OMR_STATE.canvas.getContext("2d", {
              willReadFrequently: true,
            }) : null;

            if (OMR_STATE.canvas) {
              OMR_STATE.canvas.width = OMR_STATE.width;
              OMR_STATE.canvas.height = OMR_STATE.height;
            }

            reinitializeOMRMats(); // Call the new function here

            isLoading.value = false;
            // Do not start loop here, wait for start() call
          };

          if (video.value && video.value.readyState >= 1 && video.value.videoWidth > 0) {
            handleMetadataLoaded();
          } else if (video.value) {
            video.value.addEventListener("loadedmetadata", handleMetadataLoaded, { once: true });
          }

          // await startCamera(); // MOVED TO start()
        } catch (error) {
          console.error("Error en la inicialización de OMR:", error);
          isLoading.value = false;
        }
      }, 50);
    };

    const processingLoop = () => {
      if (
        OMR_STATE.captured ||
        !video.value ||
        video.value.paused ||
        video.value.ended ||
        isLoading.value ||
        !OMR_STATE.src // Added check for OMR_STATE.src
      ) {
        return;
      }

      const { cv, ctx, width, height, src, gray, bw, clahe } = OMR_STATE;

      ctx.drawImage(video.value, 0, 0, width, height);
      src.data.set(ctx.getImageData(0, 0, width, height).data);

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // CLAHE (contrast limited adaptive histogram equalization)
      if (clahe) {
        try {
          clahe.apply(gray, gray);
        } catch (e) {
          // If apply fails, ignore and continue
          console.warn("CLAHE apply failed:", e);
        }
      }

      // Apply gentle gamma correction (controlled by slider)
      try {
        const gamma = OMR_STATE.gamma || 1.0;
        if (Math.abs(gamma - 1.0) > 0.001) {
          // create LUT for gamma correction
          let lut = new cv.Mat(1, 256, cv.CV_8UC1);
          for (let i = 0; i < 256; i++) {
            // use 1/gamma to make slider intuitive (higher slider -> brighter)
            const v = Math.pow(i / 255.0, 1.0 / gamma) * 255.0;
            lut.ucharPtr(0, i)[0] = Math.min(255, Math.max(0, Math.round(v)));
          }
          cv.LUT(gray, lut, gray);
          lut.delete();
        }
      } catch (e) {
        console.warn("Gamma LUT failed:", e);
      }

      // Slight blur to reduce noise
      cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);

      // Use adaptive threshold (more stable) instead of global Otsu + truncation.
      // Map slider into blockSize and C (offset)
      let blockSize = 15 + Math.floor((contrastSliderValue.value / 200) * 30); // 15..45
      if (blockSize % 2 === 0) blockSize += 1; // must be odd
      // C: small positive/negative offset to fine-tune darkness (value near 100 -> C=0)
      const C = Math.round((100 - contrastSliderValue.value) / 50); // -2..2 approx

      try {
        cv.adaptiveThreshold(
          gray,
          bw,
          255,
          cv.ADAPTIVE_THRESH_GAUSSIAN_C,
          cv.THRESH_BINARY,
          blockSize,
          C
        );
      } catch (e) {
        // fallback to Otsu if adaptiveThreshold fails for some reason
        try {
          cv.threshold(gray, bw, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
        } catch (e2) {
          console.error("Thresholding failed:", e2);
        }
      }

      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(
        bw,
        contours,
        hierarchy,
        cv.RETR_TREE,
        cv.CHAIN_APPROX_SIMPLE
      );

      let dst = new cv.Mat();
      cv.cvtColor(bw, dst, cv.COLOR_GRAY2RGBA);

      const markers = findAndLabelMarkers(
        OMR_STATE,
        contours,
        hierarchy,
        width,
        height
      );
      drawMarkerOverlays(OMR_STATE, dst, markers, contours, hierarchy);

      cv.imshow(outputCanvas.value, dst);

      const allMarkersPresent = ["TL", "TR", "BL", "BR"].every((label) =>
        markers.some((m) => m.label === label)
      );

      if (markers.length >= 4 && allMarkersPresent) {
        OMR_STATE.captured = true;
        handleCapture(markers);
      }

      dst.delete();
      contours.delete();
      hierarchy.delete();

      if (!OMR_STATE.captured) {
        animationFrameId = requestAnimationFrame(processingLoop);
      }
    };

    const handleCapture = async (markers) => {
      try {
        const { cv, bw, width, height } = OMR_STATE;
        const labelMap = {};
        markers.forEach((m) => {
          labelMap[m.label] = { x: m.cx, y: m.cy };
        });

        // Create a canvas from the black and white matrix 'bw'
        const snapshotCanvas = document.createElement("canvas");
        snapshotCanvas.width = width;
        snapshotCanvas.height = height;
        cv.imshow(snapshotCanvas, bw);

        const { correctedCanvas, correctedMat, matrix } =
          performPerspectiveCorrection(OMR_STATE, snapshotCanvas, labelMap);

        const { finalResults, cleanDataUrl, bubbleCoords } =
          extractAndDrawResults(
            OMR_STATE,
            correctedCanvas,
            correctedMat,
            matrix,
            labelMap,
            props.answerKeys
          );

        cv.imshow(outputCanvas.value, correctedMat);

        // Get the image data from the canvas where results were drawn
        const imageDataUrl = correctedCanvas.toDataURL("image/png");

        correctedMat.delete();
        matrix.delete();

        // Turn off flash immediately after capture
        await turnOffFlash();

        // Emit an object with results, the image URL, clean image and bubble coordinates
        emit("scan-complete", {
          results: finalResults,
          imageUrl: imageDataUrl,
          cleanImageUrl: cleanDataUrl,
          cleanDataUrl: cleanDataUrl,
          bubbleCoords: bubbleCoords,
        });
      } catch (err) {
        console.error("Error during handleCapture in OmrScanner:", err);
        // Reset capture flag so camera loop does not freeze
        OMR_STATE.captured = false;
        animationFrameId = requestAnimationFrame(processingLoop);
      }
    };

    const start = async () => {
      // Make it async because video.play() returns a Promise
      // Load contrast from localStorage every time a scan starts
      try {
        const storedContrast = localStorage.getItem("omrContrast");
        if (storedContrast !== null) {
          const value = parseInt(storedContrast, 10);
          contrastSliderValue.value = value;
          // update clip/gamma mapping to match slider
          const clipLimit = 1.0 + (value / 200) * 2.0;
          const gamma = 0.6 + (value / 200) * 1.0;
          OMR_STATE.contrastClipLimit = clipLimit;
          OMR_STATE.gamma = gamma;
        }
      } catch (e) {
        console.warn("Could not read contrast from localStorage.");
      }

      OMR_STATE.captured = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Re-initialize OMR Mats if they were nullified by cancelScan
      if (!OMR_STATE.src) {
        reinitializeOMRMats();
      }

      // Re-acquire camera stream if it was stopped
      if (!stream) {
        await startCamera();
        await checkFlashAvailability();
      }

      // Si el video ya tiene dimensiones listas, asegurar apagar el spinner de carga
      if (video.value && video.value.videoWidth > 0) {
        isLoading.value = false;
      }

      // Restore flash state
      try {
        const storedFlash = localStorage.getItem("omrFlashState");
        if (storedFlash === "true" && isFlashSupported.value) {
          if (!isFlashOn.value) {
            await toggleFlash();
          }
        }
      } catch (e) {
        console.warn("Could not restore flash state:", e);
      }

      // Ensure the video is playing before restarting the processing loop
      if (video.value && video.value.paused) {
        try {
          await video.value.play();
        } catch (error) {
          console.error("Error trying to play video on restart:", error);
          // Handle error, maybe show an alert to the user
        }
      }

      animationFrameId = requestAnimationFrame(processingLoop);
    };

    const cancelScan = async () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      // Turn off flash if it's on
      await turnOffFlash();
      if (OMR_STATE.src) {
        OMR_STATE.src.delete();
        OMR_STATE.src = null;
      }
      if (OMR_STATE.gray) {
        OMR_STATE.gray.delete();
        OMR_STATE.gray = null;
      }
      if (OMR_STATE.bw) {
        OMR_STATE.bw.delete();
        OMR_STATE.bw = null;
      }
      if (OMR_STATE.clahe) {
        OMR_STATE.clahe.delete();
        OMR_STATE.clahe = null;
      }
      emit("scan-cancelled");
    };

    expose({ start, cancelScan });

    onMounted(() => {
      initialize();
    });

    onUnmounted(async () => {
      await turnOffFlash();

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      // Ensure Mats are deleted only if they exist and then nullify references
      if (OMR_STATE.src) {
        OMR_STATE.src.delete();
        OMR_STATE.src = null;
      }
      if (OMR_STATE.gray) {
        OMR_STATE.gray.delete();
        OMR_STATE.gray = null;
      }
      if (OMR_STATE.bw) {
        OMR_STATE.bw.delete();
        OMR_STATE.bw = null;
      }
      if (OMR_STATE.clahe) {
        OMR_STATE.clahe.delete();
        OMR_STATE.clahe = null;
      }
    });

    return {
      video,
      outputCanvas,
      isLoading,
      contrastSliderValue,
      onContrastChange,
      isFlashSupported,
      isFlashOn,
      toggleFlash,
      cancelScan,
      flashlight,
      flashlightOutline,
      contrastOutline,
      closeCircleOutline,
    };
  },
};
</script>

<style scoped>
.omr-scanner-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background-color: #0c091f;
}

.scanner-content {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 1. CONTROLES EN LA PARTE SUPERIOR */
.controls-container--top {
  flex-shrink: 0;
  width: 100%;
  padding: 8px 16px;
  background: rgba(18, 16, 36, 0.98);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 50;
}

.controls-inner {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.contrast-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 2px 12px;
  min-height: 42px;
}

.contrast-icon {
  font-size: 20px;
  color: #c0b7ff;
  flex-shrink: 0;
}

.contrast-slider {
  flex: 1;
  padding: 0;
  --bar-background: rgba(255, 255, 255, 0.2);
  --bar-background-active: #7c6ef2;
  --knob-background: #ffffff;
  --knob-size: 20px;
  --pin-background: #7c6ef2;
}

.scanner-action-btns {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.qz-scanner-ctrl-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f7f7fd;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.qz-scanner-ctrl-btn:active {
  transform: scale(0.94);
  background: rgba(255, 255, 255, 0.25);
}

.qz-scanner-ctrl-btn--active {
  background: #7c6ef2 !important;
  border-color: #9488f5 !important;
  color: #ffffff !important;
  box-shadow: 0 0 14px rgba(124, 110, 242, 0.6);
}

.qz-scanner-ctrl-btn--close {
  color: #ff6b6b;
  border-color: rgba(255, 107, 107, 0.35);
}

.qz-scanner-ctrl-btn--close:active {
  background: rgba(255, 107, 107, 0.25);
}

/* 2. VISOR ADAPTABLE Y ENMARCADO */
.video-feed-wrapper {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background-color: #0c091f;
  overflow: hidden;
}

.video-feed-frame {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 960px;
  max-height: 70vh;
  border-radius: 18px;
  overflow: hidden;
  border: 2px solid rgba(124, 110, 242, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(106, 90, 224, 0.25);
  background-color: #000000;
}

.video-feed {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  background-color: #000000;
}

/* Adaptación fluida para móviles */
@media (max-width: 768px) {
  .video-feed-wrapper {
    padding: 8px 10px;
  }

  .video-feed-frame {
    max-width: 100%;
    max-height: 55vh;
    border-radius: 14px;
  }
}

/* Esquinas visuales tipo escáner */
.scanner-corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border-color: #7c6ef2;
  border-style: solid;
  pointer-events: none;
  z-index: 10;
}
.scanner-corner--tl {
  top: 10px;
  left: 10px;
  border-width: 3px 0 0 3px;
  border-top-left-radius: 8px;
}
.scanner-corner--tr {
  top: 10px;
  right: 10px;
  border-width: 3px 3px 0 0;
  border-top-right-radius: 8px;
}
.scanner-corner--bl {
  bottom: 10px;
  left: 10px;
  border-width: 0 0 3px 3px;
  border-bottom-left-radius: 8px;
}
.scanner-corner--br {
  bottom: 10px;
  right: 10px;
  border-width: 0 3px 3px 0;
  border-bottom-right-radius: 8px;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #a39bf0;
  gap: 12px;
}

/* 3. GUÍA INFERIOR COMPACTA */
.scanner-bottom-hint {
  flex-shrink: 0;
  width: 100%;
  padding: 8px 16px max(12px, env(safe-area-inset-bottom)) 16px;
  background: rgba(18, 16, 36, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-hint-text {
  font-size: 13px;
  font-weight: 500;
  color: #a39bf0;
  text-align: center;
  max-width: 960px;
  margin: 0 auto;
}
</style>