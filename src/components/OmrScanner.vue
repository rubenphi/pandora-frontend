<template>
  <div>
    <div v-if="isLoading" class="loading-indicator">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Iniciando escáner...</p>
    </div>

    <div v-show="!isLoading">
      <video ref="video" playsinline autoplay muted style="display: none;"></video>
      <canvas ref="outputCanvas" class="video-feed"></canvas>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, reactive, markRaw } from "vue";
import { IonSpinner, alertController } from "@ionic/vue";
import cv from "@techstark/opencv-js";
import { fetchTemplates } from "@/components/functions/omr/templateLoader.js";
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
      console.log("OpenCV ya está listo.");
      resolve();
    } else {
      console.log("Esperando a cv.onRuntimeInitialized...");
      cvModule.onRuntimeInitialized = () => {
        console.log("cv.onRuntimeInitialized disparado!");
        resolve();
      };
    }
  });
}

export default {
  name: "OmrScanner",
  components: {
    IonSpinner,
  },
  emits: ["scan-complete"],
  setup(_, { emit }) {
    const video = ref(null);
    const outputCanvas = ref(null);
    const isLoading = ref(true);
    let stream = null;
    let animationFrameId = null;

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
    });

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
        } else {
          throw new Error("La API de cámara no está disponible.");
        }
      } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        const alert = await alertController.create({
          header: "Error de Cámara",
          message: `No se pudo acceder a la cámara. Asegúrate de haber dado los permisos necesarios. Error: ${error.message}`,
          buttons: ["OK"],
        });
        await alert.present();
      }
    };

    const initialize = () => {
      setTimeout(async () => {
        try {
          console.log("Paso 1: Esperando a que OpenCV se inicialice...");
          await waitForOpenCv(cv);
          OMR_STATE.cv = cv;
          setCv(OMR_STATE.cv);
          console.log("Paso 2: OpenCV inicializado. Obteniendo plantillas...");

          const templates = await fetchTemplates();
          OMR_STATE.circleTemplate = templates.circleTemplate;
          OMR_STATE.matrixTemplate = templates.matrixTemplate;
          console.log("Paso 3: Plantillas obtenidas. Configurando listener de video...");

          video.value.addEventListener("loadedmetadata", () => {
            console.log("Paso 5: Evento 'loadedmetadata' disparado. Configurando Mats y bucle de procesamiento.");
            OMR_STATE.width = video.value.videoWidth;
            OMR_STATE.height = video.value.videoHeight;
            OMR_STATE.video = video.value;
            OMR_STATE.canvas = outputCanvas.value;
            OMR_STATE.ctx = OMR_STATE.canvas.getContext("2d");
            
            OMR_STATE.canvas.width = OMR_STATE.width;
            OMR_STATE.canvas.height = OMR_STATE.height;

            OMR_STATE.src = markRaw(new OMR_STATE.cv.Mat(OMR_STATE.height, OMR_STATE.width, OMR_STATE.cv.CV_8UC4));
            OMR_STATE.gray = markRaw(new OMR_STATE.cv.Mat(OMR_STATE.height, OMR_STATE.width, OMR_STATE.cv.CV_8UC1));
            OMR_STATE.bw = markRaw(new OMR_STATE.cv.Mat(OMR_STATE.height, OMR_STATE.width, OMR_STATE.cv.CV_8UC1));
            OMR_STATE.clahe = markRaw(new OMR_STATE.cv.CLAHE(2.0, new OMR_STATE.cv.Size(8, 8)));

            isLoading.value = false;
            animationFrameId = requestAnimationFrame(processingLoop);
          });

          console.log("Paso 4: Listener adjuntado. Iniciando cámara...");
          await startCamera();
          console.log("Paso 4.1: startCamera finalizado.");

        } catch (error) {
          console.error("Error en la inicialización de OMR:", error);
          isLoading.value = false;
        }
      }, 50);
    };
    
    const processingLoop = () => {
      if (OMR_STATE.captured || !video.value || video.value.paused || video.value.ended || isLoading.value) {
        return;
      }

      const { cv, ctx, width, height, src, gray, bw, clahe } = OMR_STATE;

      ctx.drawImage(video.value, 0, 0, width, height);
      src.data.set(ctx.getImageData(0, 0, width, height).data);
      
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);
      clahe.apply(gray, gray);
      cv.threshold(gray, bw, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(bw, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

      let dst = new cv.Mat();
      cv.cvtColor(bw, dst, cv.COLOR_GRAY2RGBA);

      const markers = findAndLabelMarkers(OMR_STATE, contours, hierarchy, width, height);
      drawMarkerOverlays(OMR_STATE, dst, markers, contours, hierarchy);
      
      cv.imshow(outputCanvas.value, dst);

      const allMarkersPresent = ["TL", "TM", "TR", "BL", "BM", "BR"].every(
        (label) => markers.some((m) => m.label === label)
      );

      if (markers.length >= 6 && allMarkersPresent) {
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

    const handleCapture = (markers) => {
        const { cv } = OMR_STATE;
        const labelMap = {};
        markers.forEach((m) => {
            labelMap[m.label] = { x: m.cx, y: m.cy };
        });

        const snapshotCanvas = document.createElement('canvas');
        snapshotCanvas.width = OMR_STATE.width;
        snapshotCanvas.height = OMR_STATE.height;
        snapshotCanvas.getContext('2d').drawImage(video.value, 0, 0, OMR_STATE.width, OMR_STATE.height);

        const { correctedCanvas, correctedMat, matrix } = performPerspectiveCorrection(OMR_STATE, snapshotCanvas, labelMap);
        
        const { finalResults } = extractAndDrawResults(OMR_STATE, correctedCanvas, correctedMat, matrix, labelMap);

        cv.imshow(outputCanvas.value, correctedMat);

        // Get the image data from the canvas where results were drawn
        const imageDataUrl = correctedCanvas.toDataURL('image/png');

        correctedMat.delete();
        matrix.delete();

        // Emit an object with both results and the image URL
        emit("scan-complete", { results: finalResults, imageUrl: imageDataUrl });
    };

    onMounted(() => {
      initialize();
    });

    onUnmounted(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      OMR_STATE.src?.delete();
      OMR_STATE.gray?.delete();
      OMR_STATE.bw?.delete();
      OMR_STATE.clahe?.delete();
    });

    return {
      video,
      outputCanvas,
      isLoading,
    };
  },
};
</script>

<style scoped>
.video-feed {
  width: 100%;
  max-width: 500px;
  border: 2px solid #ccc;
  border-radius: 8px;
  background-color: #000;
}
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}
</style>