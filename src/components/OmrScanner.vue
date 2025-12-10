<template>
  <div>
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
      <canvas ref="outputCanvas" class="video-feed"></canvas>
      <div class="controls-container">
        <ion-icon :icon="contrastOutline" class="contrast-icon"></ion-icon>
        <ion-range
          min="0"
          max="200"
          :value="contrastSliderValue"
          @ionChange="onContrastChange"
          class="contrast-slider"
        ></ion-range>
        <ion-button v-if="isFlashSupported" @click="toggleFlash" fill="clear">
          <ion-icon
            slot="icon-only"
            :icon="isFlashOn ? flashlight : flashlightOutline"
          ></ion-icon>
        </ion-button>
        <ion-button @click="cancelScan" fill="clear">
          <ion-icon slot="icon-only" :icon="closeCircleOutline"></ion-icon>
        </ion-button>
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
  IonButton,
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
    IonButton,
    IonIcon,
  },
  emits: ["scan-complete", "scan-cancelled"],
  setup(_, { emit, expose }) {
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
      contrastValue: 1.0,
    });

    const onContrastChange = (event) => {
      const value = event.detail.value;
      contrastSliderValue.value = value;
      OMR_STATE.contrastValue = parseFloat(value) / 100.0;
      try {
        localStorage.setItem("omrContrast", value);
      } catch (e) {
        console.warn("Could not save contrast to localStorage.");
      }
    };

    const checkFlashAvailability = async () => {
      try {
        const { value } = await CapacitorFlash.isAvailable();
        isFlashSupported.value = value;
      } catch (e) {
        console.error("Error checking flash availability", e);
        isFlashSupported.value = false;
      }
    };

    const toggleFlash = async () => {
      try {
        await CapacitorFlash.toggle();
        const { value } = await CapacitorFlash.isSwitchedOn();
        isFlashOn.value = value;
      } catch (e) {
        console.error("Error toggling flash", e);
      }
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
      OMR_STATE.clahe = markRaw(
        new OMR_STATE.cv.CLAHE(2.0, new OMR_STATE.cv.Size(8, 8))
      );
    };

    const initialize = () => {
      setTimeout(async () => {
        try {
          await waitForOpenCv(cv);
          OMR_STATE.cv = cv;
          setCv(OMR_STATE.cv);

          await checkFlashAvailability();

          const templates = await fetchTemplates();
          OMR_STATE.circleTemplate = templates.circleTemplate;
          OMR_STATE.matrixTemplate = templates.matrixTemplate;

          video.value.addEventListener("loadedmetadata", () => {
            OMR_STATE.width = video.value.videoWidth;
            OMR_STATE.height = video.value.videoHeight;
            OMR_STATE.video = video.value;
            OMR_STATE.canvas = outputCanvas.value;
            OMR_STATE.ctx = OMR_STATE.canvas.getContext("2d");

            OMR_STATE.canvas.width = OMR_STATE.width;
            OMR_STATE.canvas.height = OMR_STATE.height;

            reinitializeOMRMats(); // Call the new function here

            isLoading.value = false;
            // Do not start loop here, wait for start() call
          });

          await startCamera();
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

      const { cv, ctx, width, height, src, gray, bw, clahe, contrastValue } =
        OMR_STATE;

      ctx.drawImage(video.value, 0, 0, width, height);
      src.data.set(ctx.getImageData(0, 0, width, height).data);

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.convertScaleAbs(gray, gray, contrastValue, 0);
      cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);
      clahe.apply(gray, gray);
      cv.threshold(gray, bw, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

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

    const handleCapture = async (markers) => {
      // Make it async
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

      const { finalResults } = extractAndDrawResults(
        OMR_STATE,
        correctedCanvas,
        correctedMat,
        matrix,
        labelMap
      );

      cv.imshow(outputCanvas.value, correctedMat);

      // Get the image data from the canvas where results were drawn
      const imageDataUrl = correctedCanvas.toDataURL("image/png");

      correctedMat.delete();
      matrix.delete();

      // Turn off flash immediately after capture
      try {
        const { value } = await CapacitorFlash.isSwitchedOn();
        if (value) {
          await CapacitorFlash.switchOff();
          isFlashOn.value = false; // Update reactive state
        }
      } catch (e) {
        console.error("Failed to turn off flash after capture", e);
      }

      // Emit an object with both results and the image URL
      emit("scan-complete", { results: finalResults, imageUrl: imageDataUrl });
    };

    const start = async () => {
      // Make it async because video.play() returns a Promise
      // Load contrast from localStorage every time a scan starts
      try {
        const storedContrast = localStorage.getItem("omrContrast");
        if (storedContrast !== null) {
          const value = parseInt(storedContrast, 10);
          contrastSliderValue.value = value;
          OMR_STATE.contrastValue = parseFloat(value) / 100.0;
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
      try {
        const { value } = await CapacitorFlash.isSwitchedOn();
        if (value) {
          await CapacitorFlash.switchOff();
          isFlashOn.value = false;
        }
      } catch (e) {
        console.error("Failed to turn off flash on cancel", e);
      }
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
      try {
        const { value } = await CapacitorFlash.isSwitchedOn();
        if (value) {
          await CapacitorFlash.switchOff();
        }
      } catch (e) {
        console.error("Failed to turn off flash on unmount", e);
      }

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
.scanner-content {
  display: flex;
  flex-direction: column;
  height: 90%;
}
.video-feed {
  width: 100%;
  height: auto;
  max-height: calc(100% - 80px); /* Adjust to leave space for controls */
  object-fit: contain;
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
.controls-container {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.contrast-icon {
  transform: rotate(90deg);
  font-size: 24px;
}
.contrast-slider {
  flex-grow: 1;
}
</style>
