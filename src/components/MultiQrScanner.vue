<template>
  <div class="multi-qr-scanner">
    <div v-if="isLoading" class="loading-indicator">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Iniciando escáner QR de alta sensibilidad...</p>
    </div>

    <div v-show="!isLoading" class="scanner-wrapper">
      <video ref="video" playsinline autoplay muted style="display: none"></video>

      <!-- Camera pane + scanned students sidebar -->
      <div class="scanner-row">
        <div class="canvas-container">
          <canvas ref="outputCanvas" class="video-feed"></canvas>

         <!-- Live scanning indicator -->
         <div class="scanning-live-indicator">
           <span class="live-dot"></span>
           <span class="live-text">ESCANEANDO MULTI-PASO</span>
         </div>

         <!-- Camera picker (only when more than one camera is available) -->
         <div
           v-if="cameras.length > 1"
           class="camera-picker"
         >
           <span class="camera-picker-icon"><ion-icon :icon="cameraOutline"></ion-icon></span>
           <select :value="selectedCamera || ''" @change="onCameraChange">
             <option value="" disabled>Cámara predeterminada</option>
             <option
               v-for="(c, i) in cameras"
               :key="c.deviceId"
               :value="c.deviceId"
             >
               {{ c.label || `Cámara ${i + 1}` }}
             </option>
           </select>
         </div>

          <!-- QR counter badge (Clickable to view full modal) -->
          <div
            class="qr-count-badge"
            :class="{ 'qr-count-badge--active': detectedCount > 0 }"
            @click="openPreviewModal"
          >
            <span class="qr-count-number">{{ detectedCount }}</span>
            <span class="qr-count-label">QRs (Ver lista)</span>
          </div>

         <!-- Zoom controls (continuous encoder-style slider) -->
         <div class="zoom-controls">
           <span class="zoom-title">Zoom:</span>
           <input
             type="range"
             class="zoom-slider"
             :min="1"
             :max="zoomMax"
             :step="0.1"
             :value="zoomLevel"
             @input="onZoomInput"
           />
           <span class="zoom-value">{{ Math.round(zoomLevel * 10) / 10 }}x</span>
         </div>
        </div>

        <!-- Scanned students sidebar (collapsible) -->
        <div class="scanned-sidebar" :class="{ 'scanned-sidebar--collapsed': isSidebarCollapsed }">
          <!-- Header visible only when expanded -->
          <div v-if="!isSidebarCollapsed" class="sidebar-header">
            <span class="sidebar-title">Escaneados ({{ detectedCount }})</span>
            <button
              class="sidebar-toggle"
              :title="'Ocultar lista'"
              @click="toggleSidebar"
            >
              <ion-icon :icon="chevronBackOutline"></ion-icon>
            </button>
          </div>

           <div class="sidebar-content">
             <!-- Collapsed state: centered count + toggle -->
             <div v-if="isSidebarCollapsed" class="sidebar-collapsed-badge">
               <button
                 class="sidebar-toggle sidebar-toggle--centered"
                 :title="'Mostrar lista'"
                 @click="toggleSidebar"
               >
                 <ion-icon :icon="chevronForwardOutline"></ion-icon>
               </button>
               <span class="sidebar-collapsed-count">{{ detectedCount }}</span>
             </div>

             <!-- Expanded state: scrollable list (scanned + pending) -->
             <div v-else class="sidebar-list">
               <div v-if="scannedListItems.length === 0 && missingStudents.length === 0" class="sidebar-empty">
                 <p>No hay códigos escaneados.</p>
               </div>

               <div v-else>
                 <!-- Summary -->
                 <div class="sidebar-summary">
                   <span class="sidebar-summary-item sidebar-summary-item--scanned">
                     Scaneados: {{ scannedListItems.length }}
                   </span>
                   <span
                     v-if="missingStudents.length > 0"
                     class="sidebar-summary-item sidebar-summary-item--missing"
                   >
                     Faltan: {{ missingStudents.length }}
                   </span>
                 </div>

                 <!-- Scanned students (removable) -->
                 <div
                   v-for="item in scannedListItems"
                   :key="item.rawCode"
                   class="sidebar-item"
                 >
                   <div class="sidebar-item-main">
                     <span class="sidebar-item-name">{{ item.name }} {{ item.lastName }}</span>
                     <span class="sidebar-item-option">{{ item.option }}</span>
                   </div>
                   <button class="sidebar-item-remove" title="Eliminar" @click="removeItem(item.rawCode)">
                     ✕
                   </button>
                 </div>

                 <!-- Pending (not yet scanned) students from the grade roster -->
                 <div
                   v-for="s in missingStudents"
                   :key="String(s.id ?? s.code)"
                   class="sidebar-item sidebar-item--missing"
                 >
                   <div class="sidebar-item-main">
                     <span class="sidebar-item-name">{{ s.name }} {{ s.lastName }}</span>
                     <span class="sidebar-item-option sidebar-item--missing-label">Pendiente</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>
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
  chevronBackOutline,
  chevronForwardOutline,
  cameraOutline,
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
  props: {
    // Full roster of the grade/course: [{ id, code, name, lastName, ... }]
    // When provided, scanned students are shown normally and the remaining
    // (pending) students appear in the sidebar with a distinct style.
    students: { type: Array, default: () => [] },
  },
  setup(props, { emit, expose }) {
    const video        = ref(null);
    const outputCanvas = ref(null);
    const isLoading    = ref(true);
    const isFlashSupported = ref(false);
    const isFlashOn    = ref(false);
    const detectedCount = ref(0);
    const isPreviewModalOpen = ref(false);
    const isSidebarCollapsed = ref(false);
    const currentZoom  = ref(1); // digital crop factor used by the detection loop
    const zoomLevel    = ref(1); // perceived zoom level (what the UI/slider shows)
    const zoomMax      = ref(20); // slider upper bound (adapts to each camera's max zoom)

    // Camera selection (enumerateDevices) so the user can pick a non-Ultra-Wide camera
    const cameras        = ref([]);
    const selectedCamera = ref(null);

    let stream           = null;
    let animationFrameId = null;
    let isRunning        = false;
    let isVideoReady     = false;
    let frameCounter     = 0;
    let detectCounter    = 0;

    // ─── Performance tuning (mobile vs desktop) ──────────────────────
    // OpenCV runs on the main thread, so high resolutions make the mobile feed
    // lag. We adapt the camera stream and decode size to the viewport.
    const isMobileView =
      (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ||
      (window.innerWidth <= 768);

    // Cap the decode canvas width (display is upscaled/downscaled by CSS).
    // 960px on mobile keeps small (ultra-wide) QRs detectable; 1080px on desktop.
    const MAX_DETECT_WIDTH = isMobileView ? 960 : 1080;
    // Run OpenCV detection only every N frames (still draw live video every frame)
    const DETECT_EVERY = isMobileView ? 2 : 1;

    // Accumulated QR codes — unique strings like "42:A" or "EST01:A"
    const accumulatedCodes = new Set();
    const studentCache     = reactive({});

    // OpenCV resources
    let cvReady    = false;
    let qrDetector = null;
    let srcMat     = null;
    let grayMat    = null;
    let bwMat      = null;

    // ─── Unified zoom setter ─────────────────────────────────────────
    // Perceived zoom `z` is split into:
    //   - hardware zoom (1..device max)   → applied via applyConstraints
    //   - the remainder                   → digital crop (currentZoom.value)
    // so the two never compound into an uncontrolled x² effect, and it is
    // device-agnostic: the slider range adapts to each camera's max zoom.
    const setZoom = async (z) => {
      const level = Math.min(Math.max(z, 1), zoomMax.value);
      zoomLevel.value = level;

      let hwZoom = 1;
      if (stream) {
        try {
          const track = stream.getVideoTracks()[0];
          if (track && typeof track.getCapabilities === 'function') {
            const caps = track.getCapabilities();
            if (caps.zoom && caps.zoom.max) {
              // allow the slider to reach the device's native zoom ceiling,
              // and beyond (digital crop) so small / ultra-wide QRs can be acercados
              zoomMax.value = Math.max(20, caps.zoom.max);
              hwZoom = Math.min(level, caps.zoom.max);
              await track.applyConstraints({ advanced: [{ zoom: hwZoom }] });
            }
          }
        } catch (_) {
          /* hardware zoom unavailable — fall back to digital crop only */
          hwZoom = 1;
        }
      }
      // digital crop factor consumed by the detection loop
      currentZoom.value = level / hwZoom;
    };

    const onZoomInput = (e) => {
      const v = parseFloat(e.target.value);
      if (!Number.isNaN(v)) setZoom(v);
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

    // Reactive computed list for chips & preview modal
    // Note: referencing detectedCount.value ensures Vue tracks changes when Set updates!
    const scannedListItems = computed(() => {
      // Register reactivity dependency on detectedCount & studentCache
      const _trigger = detectedCount.value;
      if (_trigger < 0) return [];

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

    // ─── Pending (not yet scanned) students from the grade roster ─────
    // The QR encodes either the student id or a string "code"; match by both.
    const scannedKeys = computed(() => {
      // Register reactivity on detectedCount so this recomputes when the Set mutates
      void detectedCount.value;
      const keys = new Set();
      accumulatedCodes.forEach((raw) => keys.add(raw.split(':')[0]));
      return keys;
    });

    const isStudentScanned = (student) => {
      const keys = scannedKeys.value;
      if (student.id != null && keys.has(String(student.id))) return true;
      if (student.code != null && keys.has(String(student.code))) return true;
      return false;
    };

    const missingStudents = computed(() => {
      // force recompute when codes change; isStudentScanned reads scannedKeys.value
      void detectedCount.value;
      const roster = props.students;
      if (!roster || roster.length === 0) return [];
      return roster.filter((s) => !isStudentScanned(s));
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
        // If the user picked a specific camera, use its deviceId; otherwise fall
        // back to a rear-facing camera (avoids the ultra-wide default on some phones)
        const videoConstraints = {
          width:      { ideal: isMobileView ? 1280 : 1920, min: isMobileView ? 640 : 1280 },
          height:     { ideal: isMobileView ? 720 : 1080, min: isMobileView ? 480 : 720 },
          facingMode: 'environment',
          focusMode:  'continuous',
        };
        if (selectedCamera.value) {
          videoConstraints.deviceId = { exact: selectedCamera.value };
          delete videoConstraints.facingMode;
        }

        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });

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

      // Digital Zoom crop (centered) on the high-res video source
      const z  = currentZoom.value;
      const sw = vw / z;
      const sh = vh / z;
      const sx = (vw - sw) / 2;
      const sy = (vh - sh) / 2;

      // Scale the zoomed crop down to a capped width for BOTH display (upscaled
      // by CSS) and OpenCV detection. This is what makes the feed fluid on mobile.
      let dw = sw;
      let dh = sh;
      if (dw > MAX_DETECT_WIDTH) {
        const ratio = MAX_DETECT_WIDTH / dw;
        dw = MAX_DETECT_WIDTH;
        dh = Math.round(sh * ratio);
      }
      // CV prefers even dimensions
      dw -= dw % 2;
      dh -= dh % 2;

      // Match canvas internal resolution to the capped detection size
      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width  = dw;
        canvas.height = dh;
      }

      frameCounter++;

      // Always draw the (scaled) video frame so the live feed stays smooth
      ctx.drawImage(video.value, sx, sy, sw, sh, 0, 0, dw, dh);

      // Run OpenCV detection only every DETECT_EVERY-th frame to ease the CPU
      if (
        cvReady
        && qrDetector
        && frameCounter % DETECT_EVERY === 1
        && ensureOpenCvResources(dw, dh)
      ) {
        try {
          const imageData = ctx.getImageData(0, 0, dw, dh);
          srcMat.data.set(imageData.data);
          detectCounter++;

          // Convert to Grayscale
          cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);

          // Alternate passes (based on detection passes, not every frame):
          // Odd passes: Direct Grayscale
          // Even passes: Otsu Binarized
          let targetMat = grayMat;
          if (detectCounter % 2 === 0) {
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

    // ─── Camera enumeration ─────────────────────────────────────────
    const loadCameras = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          cameras.value = [];
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameras.value = devices.filter((d) => d.kind === 'videoinput');
        // If the previously selected camera is no longer available, fall back to null
        if (cameras.value.length && !selectedCamera.value) {
          selectedCamera.value = null; // keep default (environment) on first load
        }
      } catch (e) {
        cameras.value = [];
        console.warn('No se pudieron enumerar los dispositivos de cámara:', e);
      }
    };

    const onCameraChange = async (e) => {
      const deviceId = e.target.value;
      if (!deviceId) return;
      await setCamera(deviceId);
    };

    // Restart the stream on a different physical camera (e.g. switch away from ultra-wide)
    const setCamera = async (deviceId) => {
      selectedCamera.value = deviceId;
      if (!isRunning || !stream) return; // stream not started yet, will use this deviceId

      // stop current loop + stream
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (video.value) {
        video.value.pause();
        video.value.srcObject = null;
        video.value.removeEventListener('loadedmetadata', handleVideoReady);
      }
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
      isVideoReady = false;

      try {
        video.value.addEventListener('loadedmetadata', handleVideoReady);
        await startCamera();
        if (video.value && video.value.videoWidth > 0) {
          handleVideoReady();
        }
      } catch (error) {
        const alert = await alertController.create({
          header:  'Error de Cámara',
          message: `No se pudo cambiar de cámara: ${error?.message || error}`,
          buttons: ['OK'],
        });
        await alert.present();
      }
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

         // permission granted now → enumerate with labels so the user can switch
         await loadCameras();

         if (video.value && video.value.videoWidth > 0) {
           handleVideoReady();
         }
      } catch (err) {
        console.error('Error al inicializar MultiQrScanner:', err);
        isLoading.value = false;
      }
    };

    // ─── Sidebar toggle ────────────────────────────────────────────
    const toggleSidebar = () => {
      isSidebarCollapsed.value = !isSidebarCollapsed.value;
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
      isSidebarCollapsed,
      cameras,
      selectedCamera,
      scannedListItems,
      missingStudents,
      currentZoom,
      zoomLevel,
      zoomMax,
      setZoom,
      onZoomInput,
      onCameraChange,
      openPreviewModal,
      toggleSidebar,
      removeItem,
      captureResults,
      clearAccumulated,
      cancelScan,
      toggleFlash,
      flashlight,
      flashlightOutline,
      chevronBackOutline,
      chevronForwardOutline,
      cameraOutline,
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

/* Camera (2/3) + sidebar (1/3) row */
.scanner-row {
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 100%;
  gap: 1px;
}

/* Portrait: camera on top (2/3), sidebar at the bottom (1/3) */
@media (orientation: portrait) {
  .scanner-row {
    flex-direction: column;
  }

  .scanned-sidebar {
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* collapsed sidebar becomes a slim horizontal strip at the bottom */
  .scanned-sidebar--collapsed {
    flex: 0 0 64px;
    width: 100%;
    max-width: none;
    height: 64px;
  }

  /* keep right-safe-area spacing on edge items */
  .scanned-sidebar,
  .sidebar-header,
  .sidebar-list {
    padding-right: env(safe-area-inset-right);
  }

  .sidebar-list {
    padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
  }
}

.canvas-container {
  position: relative;
  flex: 2;
  min-width: 0;
  min-height: 0;
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
  top: max(12px, env(safe-area-inset-top));
  left: max(12px, env(safe-area-inset-left));
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

/* ── Camera picker ── */
.camera-picker {
  position: absolute;
  top: calc(48px + env(safe-area-inset-top));
  left: max(12px, env(safe-area-inset-left));
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  z-index: 10;
}

.camera-picker-icon {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  display: flex;
  align-items: center;
}

.camera-picker select {
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 28px 6px 8px;
  font-size: 13px;
  font-weight: 500;
  outline: none;
  min-width: 150px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23fff' fill-opacity='0.5' d='M0 0l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 10px 6px;
}

.camera-picker select option {
  background: #121212;
  color: #fff;
}

/* ── Badge ── */
.qr-count-badge {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
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

/* ── Scanned students sidebar (collapsible) ── */
.scanned-sidebar {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #121212;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  overflow: hidden;
  transition: flex-basis 0.25s ease, width 0.25s ease;
}

.scanned-sidebar--collapsed {
  flex: 0 0 64px;
  max-width: 64px;
  width: 64px;
}

.sidebar-content {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.5px;
}

.sidebar-toggle {
  appearance: none;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 18px;
  padding: 4px 4px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
}

.sidebar-toggle:hover {
  opacity: 1;
  color: #00e5ff;
  background: rgba(255, 255, 255, 0.08);
}

.sidebar-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.sidebar-list::-webkit-scrollbar {
  width: 6px;
}

.sidebar-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 3px;
}

.sidebar-list::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-empty {
  padding: 16px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 13px;
  text-align: center;
}

/* ── Scanned / pending summary ── */
.sidebar-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.sidebar-summary-item {
  display: inline-flex;
}

.sidebar-summary-item--scanned {
  color: #00e676;
}

.sidebar-summary-item--missing {
  color: #ff9800;
}

.sidebar-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 13px;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-item--missing {
  opacity: 0.65;
}

.sidebar-item--missing .sidebar-item-name {
  color: rgba(255, 255, 255, 0.55);
  font-style: italic;
}

.sidebar-item--missing-label {
  color: #ff9800;
  background: rgba(255, 152, 0, 0.15);
}

.sidebar-item-remove {
  display: none;
}

.sidebar-item:not(.sidebar-item--missing) .sidebar-item-remove {
  display: inline-flex;
}

.sidebar-item-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.sidebar-item-name {
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-item-option {
  color: #00e5ff;
  font-weight: 700;
  font-size: 12px;
  background: rgba(0, 229, 255, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
}

.sidebar-item-remove {
  appearance: none;
  border: none;
  background: transparent;
  color: #ff5252;
  font-size: 13px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}

.sidebar-item-remove:hover {
  color: #fff;
  background: rgba(255, 82, 82, 0.2);
}

.sidebar-collapsed-badge {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sidebar-toggle--centered {
  font-size: 16px;
  padding: 2px 2px;
}

.sidebar-collapsed-count {
  font-size: 32px;
  font-weight: 700;
  color: #00e5ff;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.6);
}

/* ── Digital Zoom Controls ── */
.zoom-controls {
  position: absolute;
  bottom: calc(16px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
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

.zoom-slider {
  flex: 1;
  -webkit-appearance: none;
  width: 140px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #00e5ff;
  border: 2px solid #000;
  box-shadow: 0 0 8px #00e5ff;
  cursor: pointer;
  transition: background 0.15s;
}

.zoom-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #00e5ff;
  border: 2px solid #000;
  box-shadow: 0 0 8px #00e5ff;
  cursor: pointer;
}

.zoom-slider:hover::-webkit-slider-thumb {
  background: #00e5ff;
}

.zoom-value {
  color: #00e5ff;
  font-size: 12px;
  font-weight: 700;
  min-width: 3ch;
  text-align: right;
}

/* ── Controls ── */
.controls-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  padding-left: max(10px, env(safe-area-inset-left));
  padding-right: max(10px, env(safe-area-inset-right));
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.capture-btn {
  flex: 1;
  --border-radius: 10px;
}
</style>
