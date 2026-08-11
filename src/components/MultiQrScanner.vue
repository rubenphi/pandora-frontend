<template>
  <div class="multi-qr-scanner">
    <div v-if="isLoading" class="loading-indicator">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Iniciando escáner QR de alta sensibilidad...</p>
    </div>

    <div v-show="!isLoading" class="scanner-wrapper">
      <video ref="video" playsinline autoplay muted style="display: none"></video>

      <!-- Canvas with overlaid badge & controls -->
      <div class="canvas-container">
        <canvas ref="outputCanvas" class="video-feed"></canvas>

        <!-- Live scanning indicator -->
        <div class="scanning-live-indicator">
          <span class="live-dot"></span>
          <span class="live-text">ESCANEANDO MULTI-PASO</span>
        </div>

        <!-- QR counter badge (Clickable to view modal) -->
        <div
          class="qr-count-badge"
          :class="{ 'qr-count-badge--active': detectedCount > 0 }"
          @click="openPreviewModal"
        >
          <span class="qr-count-number">{{ detectedCount }}</span>
          <span class="qr-count-label">QRs (Ver lista)</span>
        </div>

        <!-- Zoom controls -->
        <div class="zoom-controls">
          <span class="zoom-title">Zoom:</span>
          <button
            v-for="z in [1, 1.5, 2, 2.5, 3]"
            :key="z"
            class="zoom-btn"
            :class="{ 'zoom-btn--active': currentZoom === z }"
            @click="setZoom(z)"
          >
            {{ z }}x
          </button>
        </div>
      </div>

      <!-- Control row -->
      <div class="controls-row">
        <ion-button
          class="capture-btn"
          color="success"
          @click="captureResults"
          :disabled="detectedCount === 0"
        >
          <ion-icon slot="start" :icon="checkmarkCircleOutline"></ion-icon>
          {{ detectedCount > 0 ? `Capturar (${detectedCount})` : 'Capturar' }}
        </ion-button>

        <ion-button fill="outline" color="warning" @click="clearAccumulated" :disabled="detectedCount === 0">
          <ion-icon slot="icon-only" :icon="refreshOutline"></ion-icon>
        </ion-button>

        <ion-button v-if="isFlashSupported" fill="clear" @click="toggleFlash">
          <ion-icon slot="icon-only" :icon="isFlashOn ? flashlight : flashlightOutline"></ion-icon>
        </ion-button>

        <ion-button fill="clear" color="danger" @click="cancelScan">
          <ion-icon slot="icon-only" :icon="closeCircleOutline"></ion-icon>
        </ion-button>
      </div>
    </div>

    <!-- Modal preview list of scanned responses -->
    <ion-modal :is-open="isPreviewModalOpen" @didDismiss="isPreviewModalOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>QRs Escaneados ({{ detectedCount }})</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="isPreviewModalOpen = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div v-if="scannedListItems.length === 0" class="ion-text-center ion-padding">
          <p style="color: var(--ion-color-medium)">No hay códigos escaneados.</p>
        </div>
        <ion-list v-else>
          <ion-item v-for="item in scannedListItems" :key="item.rawCode">
            <ion-label class="ion-text-wrap">
              <h3>{{ item.name }} {{ item.lastName }}</h3>
              <p>Opción seleccionada: <strong>{{ item.option }}</strong></p>
            </ion-label>
            <ion-button
              slot="end"
              fill="clear"
              color="danger"
              @click="removeItem(item.rawCode)"
            >
              <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, reactive, computed, markRaw } from 'vue';
import {
  IonSpinner,
  IonButton,
  IonIcon,
  alertController,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
} from '@ionic/vue';
import {
  flashlight,
  flashlightOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  refreshOutline,
  trashOutline,
} from 'ionicons/icons';
import { CapacitorFlash } from '@capgo/capacitor-flash';
import cv from '@techstark/opencv-js';
import axios from 'axios';
import { tokenHeader } from '../globalService';

function waitForOpenCv(cvModule) {
  return new Promise((resolve) => {
    if (cvModule && cvModule.Mat) {
      resolve();
    } else if (cvModule) {
      const prevOnInit = cvModule.onRuntimeInitialized;
      cvModule.onRuntimeInitialized = () => {
        if (typeof prevOnInit === 'function') prevOnInit();
        resolve();
      };
    } else {
      resolve();
    }
  });
}

export default {
  name: 'MultiQrScanner',
  components: {
    IonSpinner,
    IonButton,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
  },
  emits: ['scan-complete', 'scan-cancelled'],
  setup(_, { emit, expose }) {
    const video        = ref(null);
    const outputCanvas = ref(null);
    const isLoading    = ref(true);
    const isFlashSupported = ref(false);
    const isFlashOn    = ref(false);
    const detectedCount = ref(0);
    const isPreviewModalOpen = ref(false);
    const currentZoom  = ref(1);

    let stream           = null;
    let animationFrameId = null;
    let isRunning        = false;
    let isVideoReady     = false;
    let frameCounter     = 0;

    // Accumulated QR codes — unique strings like "42:A" or "EST01:A"
    const accumulatedCodes = new Set();
    const studentCache     = reactive({});

    // OpenCV resources
    let cvReady    = false;
    let qrDetector = null;
    let srcMat     = null;
    let grayMat    = null;
    let bwMat      = null;

    // ─── Digital Zoom setter ──────────────────────────────────────
    const setZoom = async (z) => {
      currentZoom.value = z;
      if (stream) {
        try {
          const track = stream.getVideoTracks()[0];
          if (track && typeof track.getCapabilities === 'function') {
            const caps = track.getCapabilities();
            if (caps.zoom) {
              const targetZoom = Math.min(Math.max(z, caps.zoom.min || 1), caps.zoom.max || 5);
              await track.applyConstraints({ advanced: [{ zoom: targetZoom }] });
            }
          }
        } catch (_) {
          /* ignore hardware zoom error, digital zoom is active */
        }
      }
    };

    // ─── Fetch Student Detail ─────────────────────────────────────
    const fetchStudentDetail = async (studentCodeOrId) => {
      if (!studentCodeOrId || studentCache[studentCodeOrId]) return;
      try {
        tokenHeader();
        let student = null;

        if (/^\d+$/.test(String(studentCodeOrId))) {
          try {
            const res = await axios.get(`/users/${studentCodeOrId}`);
            student = res.data;
          } catch (_) { /* ignore */ }
        }

        if (!student || !student.id) {
          const searchRes = await axios.get(`/users?code=${encodeURIComponent(studentCodeOrId)}`);
          if (searchRes.data && searchRes.data.length > 0) {
            student = searchRes.data[0];
          }
        }

        if (student) {
          studentCache[studentCodeOrId] = {
            name: student.name || 'Estudiante',
            lastName: student.lastName || `${studentCodeOrId}`,
          };
        } else {
          studentCache[studentCodeOrId] = {
            name: 'Estudiante',
            lastName: `${studentCodeOrId}`,
          };
        }
      } catch (_) {
        studentCache[studentCodeOrId] = {
          name: 'Estudiante',
          lastName: `${studentCodeOrId}`,
        };
      }
    };

    const scannedListItems = computed(() => {
      return Array.from(accumulatedCodes).map((rawCode) => {
        const parts = rawCode.split(':');
        const studentCodeOrId = parts[0] || '';
        const option = parts[1] || '';
        const student = studentCache[studentCodeOrId];

        return {
          rawCode,
          studentCodeOrId,
          option,
          name: student ? student.name : 'Estudiante',
          lastName: student ? student.lastName : `${studentCodeOrId}`,
        };
      });
    });

    // ─── Flash helpers ────────────────────────────────────────────
    const checkFlashAvailability = async () => {
      try {
        const { value } = await CapacitorFlash.isAvailable();
        isFlashSupported.value = value;
      } catch (_) {
        isFlashSupported.value = false;
      }
    };

    const toggleFlash = async () => {
      try {
        await CapacitorFlash.toggle();
        const { value } = await CapacitorFlash.isSwitchedOn();
        isFlashOn.value = value;
      } catch (e) {
        console.error('Error toggling flash', e);
      }
    };

    // ─── Camera ───────────────────────────────────────────────────
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width:      { ideal: 3840, min: 1920 },
            height:     { ideal: 2160, min: 1080 },
            facingMode: 'environment',
            focusMode:  'continuous',
          },
          audio: false,
        });

        // Try applying continuous auto-focus constraint if supported by device
        try {
          const track = stream.getVideoTracks()[0];
          if (track && typeof track.getCapabilities === 'function') {
            const caps = track.getCapabilities();
            if (caps.focusMode && caps.focusMode.includes('continuous')) {
              await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
            }
          }
        } catch (_) { /* ignore focus constraint warning */ }

        if (video.value) {
          video.value.srcObject = stream;
          await video.value.play();
        }
      } catch (error) {
        const alert = await alertController.create({
          header:  'Error de Cámara',
          message: `No se pudo acceder a la cámara: ${error.message}`,
          buttons: ['OK'],
        });
        await alert.present();
        throw error;
      }
    };

    // ─── OpenCV resource lifecycle ────────────────────────────────
    const cleanupOpenCvResources = () => {
      if (srcMat)     { try { srcMat.delete();     srcMat     = null; } catch (_) { /* ignore */ } }
      if (grayMat)    { try { grayMat.delete();    grayMat    = null; } catch (_) { /* ignore */ } }
      if (bwMat)      { try { bwMat.delete();      bwMat      = null; } catch (_) { /* ignore */ } }
      if (qrDetector) { try { qrDetector.delete(); qrDetector = null; } catch (_) { /* ignore */ } }
    };

    const ensureOpenCvResources = (width, height) => {
      if (!cvReady || width <= 0 || height <= 0) return false;

      if (!srcMat || srcMat.cols !== width || srcMat.rows !== height) {
        if (srcMat)  { try { srcMat.delete();  } catch (_) { /* ignore */ } }
        if (grayMat) { try { grayMat.delete(); } catch (_) { /* ignore */ } }
        if (bwMat)   { try { bwMat.delete();   } catch (_) { /* ignore */ } }

        srcMat  = markRaw(new cv.Mat(height, width, cv.CV_8UC4));
        grayMat = markRaw(new cv.Mat(height, width, cv.CV_8UC1));
        bwMat   = markRaw(new cv.Mat(height, width, cv.CV_8UC1));
      }

      return true;
    };

    // ─── Main Processing Loop (Multi-Pass: Alternate Grayscale / Otsu Binary) ─────
    const processingLoop = () => {
      if (!isRunning || !video.value || video.value.paused || video.value.ended) return;

      const canvas = outputCanvas.value;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const vw = video.value.videoWidth;
      const vh = video.value.videoHeight;
      if (!vw || !vh) {
        animationFrameId = requestAnimationFrame(processingLoop);
        return;
      }

      // Match canvas internal resolution 1:1 with high-res camera stream
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width  = vw;
        canvas.height = vh;
      }

      // Digital Zoom crop calculations
      const z  = currentZoom.value;
      const sw = vw / z;
      const sh = vh / z;
      const sx = (vw - sw) / 2;
      const sy = (vh - sh) / 2;

      // Draw clear video frame
      ctx.drawImage(video.value, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      // Multi-pass OpenCV QR Detection
      if (cvReady && qrDetector && ensureOpenCvResources(canvas.width, canvas.height)) {
        try {
          frameCounter++;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          srcMat.data.set(imageData.data);

          // Convert to Grayscale
          cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);

          // Alternate passes:
          // Odd frames  (1,3,5...): Direct Grayscale Mat (natural gradients)
          // Even frames (2,4,6...): Otsu Binarized Mat (high-contrast for paper shadows/glare)
          let targetMat = grayMat;
          if (frameCounter % 2 === 0) {
            try {
              cv.threshold(grayMat, bwMat, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
              targetMat = bwMat;
            } catch (_) {
              targetMat = grayMat;
            }
          }

          let decodedVec = new cv.StringVector();
          let pointsMat  = new cv.Mat();

          qrDetector.detectAndDecodeMulti(targetMat, decodedVec, pointsMat);

          const numDetected = decodedVec.size();
          const pointsRows  = pointsMat.rows;

          if (numDetected > 0 || pointsRows > 0) {
            const ptsData = pointsMat.data32F;
            const countToIterate = numDetected > 0 ? numDetected : Math.floor(pointsRows / 4);

            for (let i = 0; i < countToIterate; i++) {
              const code = numDetected > i ? decodedVec.get(i) : '';
              const base = i * 8; // 4 corners (x, y)

              if (ptsData && ptsData.length >= base + 8) {
                const pts = [
                  { x: ptsData[base + 0], y: ptsData[base + 1] },
                  { x: ptsData[base + 2], y: ptsData[base + 3] },
                  { x: ptsData[base + 4], y: ptsData[base + 5] },
                  { x: ptsData[base + 6], y: ptsData[base + 7] },
                ];

                const isValidCode = code && code.trim().length > 0;
                const isNew       = isValidCode && !accumulatedCodes.has(code);

                // Draw bounding polygon
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                ctx.lineTo(pts[1].x, pts[1].y);
                ctx.lineTo(pts[2].x, pts[2].y);
                ctx.lineTo(pts[3].x, pts[3].y);
                ctx.closePath();
                ctx.lineWidth = 4;

                if (isValidCode) {
                  ctx.strokeStyle = isNew ? '#00e5ff' : '#00e676';
                  ctx.fillStyle   = isNew ? 'rgba(0,229,255,0.22)' : 'rgba(0,230,118,0.22)';
                } else {
                  ctx.strokeStyle = '#ff9800';
                  ctx.fillStyle   = 'rgba(255,152,0,0.15)';
                }
                ctx.stroke();
                ctx.fill();

                // Pill label with option letter
                if (isValidCode) {
                  const label   = code.split(':')[1] || code;
                  const centerX = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
                  const centerY = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;

                  ctx.font = 'bold 22px sans-serif';
                  const tw = ctx.measureText(label).width;

                  ctx.fillStyle = 'rgba(0,0,0,0.8)';
                  ctx.beginPath();
                  ctx.roundRect(centerX - tw / 2 - 8, centerY - 15, tw + 16, 26, 8);
                  ctx.fill();

                  ctx.fillStyle    = isNew ? '#00e5ff' : '#00e676';
                  ctx.textAlign    = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(label, centerX, centerY);
                  ctx.textAlign    = 'left';
                  ctx.textBaseline = 'alphabetic';

                  if (isNew) {
                    accumulatedCodes.add(code);
                    detectedCount.value = accumulatedCodes.size;
                    const studentCodeOrId = code.split(':')[0];
                    if (studentCodeOrId && !studentCache[studentCodeOrId]) {
                      fetchStudentDetail(studentCodeOrId);
                    }
                  }
                }
              }
            }
          }

          decodedVec.delete();
          pointsMat.delete();
        } catch (e) {
          console.warn('Error en detección OpenCV:', e);
        }
      }

      animationFrameId = requestAnimationFrame(processingLoop);
    };

    const handleVideoReady = () => {
      if (isVideoReady || !video.value) return;
      isVideoReady = true;
      isLoading.value = false;
      isRunning = true;
      processingLoop();
    };

    // ─── Initialization ───────────────────────────────────────────
    const initialize = async () => {
      try {
        await waitForOpenCv(cv);
        cvReady    = true;
        qrDetector = markRaw(new cv.QRCodeDetector());

        await checkFlashAvailability();

        if (video.value) {
          video.value.addEventListener('loadedmetadata', handleVideoReady);
        }

        await startCamera();

        if (video.value && video.value.videoWidth > 0) {
          handleVideoReady();
        }
      } catch (err) {
        console.error('Error al inicializar MultiQrScanner:', err);
        isLoading.value = false;
      }
    };

    // ─── User actions ─────────────────────────────────────────────
    const openPreviewModal = () => {
      if (detectedCount.value > 0) {
        isPreviewModalOpen.value = true;
      }
    };

    const removeItem = (rawCode) => {
      accumulatedCodes.delete(rawCode);
      detectedCount.value = accumulatedCodes.size;
      if (detectedCount.value === 0) {
        isPreviewModalOpen.value = false;
      }
    };

    const captureResults = () => {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      emit('scan-complete', Array.from(accumulatedCodes));
    };

    const clearAccumulated = () => {
      accumulatedCodes.clear();
      detectedCount.value = 0;
      isPreviewModalOpen.value = false;
    };

    const stopEverything = async () => {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
      try {
        const { value } = await CapacitorFlash.isSwitchedOn();
        if (value) {
          await CapacitorFlash.switchOff();
          isFlashOn.value = false;
        }
      } catch (_) {
        /* ignore */
      }
      cleanupOpenCvResources();
    };

    const cancelScan = async () => {
      await stopEverything();
      emit('scan-cancelled');
    };

    expose({ clearAccumulated });

    onMounted(() => {
      setTimeout(initialize, 50);
    });

    onUnmounted(async () => {
      await stopEverything();
    });

    return {
      video,
      outputCanvas,
      isLoading,
      isFlashSupported,
      isFlashOn,
      detectedCount,
      isPreviewModalOpen,
      scannedListItems,
      currentZoom,
      setZoom,
      openPreviewModal,
      removeItem,
      captureResults,
      clearAccumulated,
      cancelScan,
      toggleFlash,
      flashlight,
      flashlightOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      refreshOutline,
      trashOutline,
    };
  },
};
</script>

<style scoped>
.multi-qr-scanner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #fff;
  gap: 12px;
}

.scanner-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.canvas-container {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: #000;
}

.video-feed {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* ── Live indicator ── */
.scanning-live-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  pointer-events: none;
  z-index: 10;
}

.live-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00e5ff;
  box-shadow: 0 0 8px #00e5ff;
  animation: pulse-dot 1.2s infinite ease-in-out;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(0.85); opacity: 0.5; }
  50% { transform: scale(1.25); opacity: 1; }
}

.live-text {
  font-size: 11px;
  font-weight: 700;
  color: #00e5ff;
  letter-spacing: 0.8px;
}

/* ── Badge ── */
.qr-count-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 16px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.75);
  border: 2px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
  pointer-events: auto;
  cursor: pointer;
  user-select: none;
  z-index: 10;
}

.qr-count-badge--active {
  border-color: #00e5ff;
  background: rgba(0, 229, 255, 0.22);
  box-shadow: 0 0 18px rgba(0, 229, 255, 0.5);
}

.qr-count-number {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.qr-count-badge--active .qr-count-number {
  color: #00e5ff;
}

.qr-count-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 2px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* ── Digital Zoom Controls ── */
.zoom-controls {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.75);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 10;
}

.zoom-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  margin-right: 4px;
}

.zoom-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.zoom-btn--active {
  background: #00e5ff;
  color: #000;
}

/* ── Controls ── */
.controls-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.capture-btn {
  flex: 1;
  --border-radius: 10px;
}
</style>
