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
        localStorage.setItem("omrFlashState", value);
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
      }

      // Restore flash state
      try {
        const storedFlash = localStorage.getItem("omrFlashState");
        if (storedFlash === "true" && isFlashSupported.value) {
          await CapacitorFlash.switchOn();
          isFlashOn.value = true;
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