<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/inicio"></ion-back-button>
        </ion-buttons>
        <ion-title>Lector OMR</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Lector de Hojas de Respuesta (OMR)</h1>
      <p>La cámara se activará aquí para escanear la hoja.</p>

      <!-- El video de la cámara se mostrará aquí -->
      <video ref="video" playsinline autoplay muted style="display: none;"></video>

      <!-- Canvas para capturar fotogramas (oculto) -->
      <canvas ref="inputCanvas" style="display: none;"></canvas>

      <!-- Canvas para mostrar el resultado procesado -->
      <canvas ref="outputCanvas" class="video-feed" style="border: 2px solid red;"></canvas>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  alertController,
} from "@ionic/vue";
import { onMounted, onUnmounted, ref } from "vue";
import cvModule from "@techstark/opencv-js";

export default {
  name: "OmrRead",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
  },
  setup() {
    const video = ref(null);
    const inputCanvas = ref(null); // New ref for input
    const outputCanvas = ref(null); // New ref for output
    let stream = null;
    const cv = ref(null);

    // Inicia la cámara del dispositivo
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment", // Usar la cámara trasera
            },
            audio: false,
          });
          video.value.srcObject = stream;
          video.value.play();
        } else {
          throw new Error("La API de cámara no está disponible en este navegador.");
        }
      } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        const alert = await alertController.create({
          header: "Error de Cámara",
          message: "No se pudo acceder a la cámara. Asegúrate de haber dado los permisos necesarios. Error: " + error.message,
          buttons: ["OK"],
        });
        await alert.present();
      }
    };

    // Función para inicializar OpenCV
    const initializeOpenCv = async () => {
      try {
        let cvObject;
        if (cvModule instanceof Promise) {
          cvObject = await cvModule;
        } else {
          await new Promise((resolve) => {
            cvModule.onRuntimeInitialized = () => resolve();
          });
          cvObject = cvModule;
        }
        cv.value = cvObject;
        console.log("OpenCV.js está listo!");
        
        // Ahora que OpenCV está listo, iniciamos la cámara.
        await startCamera();
        video.value.addEventListener('play', () => {
          requestAnimationFrame(processFrame);
        });

      } catch (error) {
        console.error("Error inicializando OpenCV.js:", error);
      }
    };

    const processFrame = () => {
      if (!video.value || video.value.paused || video.value.ended || !cv.value || !inputCanvas.value || !outputCanvas.value) {
        console.log("Waiting for video, OpenCV, or canvases to be ready...");
        requestAnimationFrame(processFrame);
        return;
      }

      if (video.value.videoWidth === 0 || video.value.videoHeight === 0) {
        console.log("Video dimensions not yet available. Retrying...");
        requestAnimationFrame(processFrame);
        return;
      }
      console.log("Processing frame (grayscale, blur, threshold)...");

      let src = new cv.value.Mat();
      let gray = new cv.value.Mat();
      let blurred = new cv.value.Mat();
      let thresh = new cv.value.Mat();
      let contours = new cv.value.MatVector(); // Declared here
      let hierarchy = new cv.value.Mat();    // Declared here
      let displayMat = new cv.value.Mat();   // Declared here

      try {
        const inputCtx = inputCanvas.value.getContext('2d');
        inputCanvas.value.width = video.value.videoWidth;
        inputCanvas.value.height = video.value.videoHeight;
        inputCtx.clearRect(0, 0, inputCanvas.value.width, inputCanvas.value.height);
        inputCtx.drawImage(video.value, 0, 0, inputCanvas.value.width, inputCanvas.value.height);

        outputCanvas.value.width = video.value.videoWidth;
        outputCanvas.value.height = video.value.videoHeight;

        src = cv.value.imread(inputCanvas.value);
        
        cv.value.cvtColor(src, gray, cv.value.COLOR_RGBA2GRAY);
        cv.value.GaussianBlur(gray, blurred, new cv.value.Size(5, 5), 0);
        cv.value.adaptiveThreshold(blurred, thresh, 255, cv.value.ADAPTIVE_THRESH_GAUSSIAN_C, cv.value.THRESH_BINARY_INV, 11, 2);

        // Display the thresholded image for now, or the detected contour
        let contours = new cv.value.MatVector();
        let hierarchy = new cv.value.Mat();
        cv.value.findContours(thresh, contours, hierarchy, cv.value.RETR_EXTERNAL, cv.value.CHAIN_APPROX_SIMPLE);

        let maxArea = 0;
        let maxContour = null;

        for (let i = 0; i < contours.size(); ++i) {
          let cnt = contours.get(i);
          let area = cv.value.contourArea(cnt);

          if (area > maxArea) {
            let peri = cv.value.arcLength(cnt, true);
            let approx = new cv.value.Mat();
            cv.value.approxPolyDP(cnt, approx, 0.02 * peri, true);

            if (approx.rows === 4) { // Look for 4-sided polygons (rectangles)
              maxArea = area;
              maxContour = approx;
            }
            approx.delete();
          }
          cnt.delete();
        }

        let displayMat = src.clone(); // Start with a copy of the original frame for drawing

        if (maxContour) {
          console.log("Max contour found! Drawing green rectangle.");
          let color = new cv.value.Scalar(0, 255, 0, 255); // Green color for the contour
          let contoursToDraw = new cv.value.MatVector();
          contoursToDraw.add(maxContour);
          cv.value.drawContours(displayMat, contoursToDraw, 0, color, 3, cv.value.LINE_8);
          contoursToDraw.delete(); // Delete the temporary MatVector
          maxContour.delete(); // Delete the approximated contour
        } else {
          console.log("No max contour found. Displaying thresholded image.");
          displayMat = thresh.clone(); // If no contour is found, display the thresholded image
        }
        cv.value.imshow(outputCanvas.value, displayMat);

      } catch (error) {
        console.error("Error in processFrame (grayscale, blur, threshold, contour):", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        } else if (typeof error === 'string') {
          console.error("Error string:", error);
        } else {
          console.error("Unknown error type:", JSON.stringify(error));
        }
      } finally {
        src.delete();
        gray.delete();
        blurred.delete();
        thresh.delete();
        contours.delete(); // Ensure contours are deleted
        hierarchy.delete(); // Ensure hierarchy is deleted
        displayMat.delete(); // Ensure displayMat is deleted
        requestAnimationFrame(processFrame);
      }
    };

    onMounted(() => {
      console.log("Componente OmrRead montado. Inicializando OpenCV...");
      initializeOpenCv();
    });

    onUnmounted(() => {
      // Detener la cámara cuando el componente se destruye
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });

    return {
      video,
      inputCanvas,
      outputCanvas,
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
</style>
