<template>
  <ion-page class="ion-page qz-survey-page">
    <ion-content
      v-show="!isScanning"
      :fullscreen="true"
      class="qz-survey-content"
    >
      <div class="qz-survey-wrapper">
        <!-- 1. BARRA SUPERIOR QUEEZY -->
        <header class="qz-top-bar">
          <button
            type="button"
            class="qz-circle-btn"
            @click="goBack"
            aria-label="Volver"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </button>
          <div class="qz-top-bar__center">
            <h1 class="qz-top-bar__title">Encuesta a Padres</h1>
            <div class="qz-top-bar__sub-row" v-if="currentSession">
              <span class="qz-top-bar__subtitle">
                {{ currentSession.label }} &bull; {{ currentSession.year }}
              </span>
              <button
                type="button"
                class="qz-session-edit-trigger"
                title="Modificar nombre o año de la sesión"
                @click="openEditSessionModal"
              >
                <ion-icon :icon="createOutline"></ion-icon>
              </button>
            </div>
            <span class="qz-top-bar__subtitle" v-else>Sesión General</span>
          </div>
          <div class="qz-top-bar__right">
            <span class="qz-count-badge" :title="'Total hojas registradas'">
              {{ responses.length }}
            </span>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main v-if="!isScanning" class="qz-main-body">
          <div class="qz-container qz-survey-container">
            <!-- TARJETA INFORMATIVA DE SESIÓN -->
            <div class="qz-card qz-session-info-card">
              <div class="qz-session-info-main">
                <div class="qz-session-icon-wrap">
                  <ion-icon :icon="currentSession ? documentTextOutline : scanOutline"></ion-icon>
                </div>
                <div class="qz-session-text-wrap">
                  <div class="qz-session-tag-row">
                    <span class="qz-meta-tag">{{ currentSession?.year || currentYear }}</span>
                    <span class="qz-tag qz-tag--purple">{{ currentSession ? "Sesión Asignada" : "Escaneo General" }}</span>
                  </div>
                  <h2 class="qz-session-title-text">{{ currentSession?.label || "Escaneo General sin Sesión" }}</h2>
                </div>
              </div>
              <button
                v-if="currentSession"
                type="button"
                class="qz-session-modify-btn"
                title="Modificar nombre o año de la sesión"
                @click="openEditSessionModal"
              >
                <ion-icon :icon="createOutline"></ion-icon>
                <span>Modificar</span>
              </button>
            </div>

            <!-- Tarjetas de métricas numéricas -->
            <div class="qz-metrics-grid">
              <div class="qz-metric-card">
                <div class="qz-metric-num">{{ responses.length }}</div>
                <div class="qz-metric-text">Hojas Registradas</div>
              </div>
              <div class="qz-metric-card">
                <div class="qz-metric-num">
                  {{ currentSession?.year || currentYear }}
                </div>
                <div class="qz-metric-text">Año Lectivo</div>
              </div>
            </div>

            <!-- VISTA PREVIA DEL ESCANEO ACTUAL -->
            <div v-if="currentResult" class="qz-card qz-preview-card">
              <div class="qz-card-header">
                <div class="qz-header-badge-row">
                  <span class="qz-tag qz-tag--purple"
                    >Registro #{{ currentResult.code }}</span
                  >
                  <span class="qz-tag qz-tag--success">Escaneo Capturado</span>
                </div>
                <h2 class="qz-card-title">Resultado de la Hoja</h2>
                <p class="qz-card-subtitle">
                  Revise o ajuste las respuestas detectadas antes de confirmar
                  el registro.
                </p>
              </div>

              <!-- Imagen del Escaneo -->
              <div v-if="currentResult.imageUrl" class="qz-scan-image-section">
                <div class="qz-image-wrapper">
                  <img
                    :src="currentResult.imageUrl"
                    class="qz-scan-img"
                    alt="Hoja Escaneada"
                  />
                </div>
              </div>

              <!-- Botones de Acción Inmediata (bajo la foto y sobre los resultados) -->
              <div class="qz-card-footer-actions qz-card-actions--top">
                <button class="qz-btn qz-btn-primary" @click="confirmResponse">
                  <ion-icon :icon="checkmarkOutline"></ion-icon>
                  <span>Confirmar y Guardar</span>
                </button>
                <button class="qz-btn qz-btn-secondary" @click="startScan">
                  <ion-icon :icon="cameraOutline"></ion-icon>
                  <span>Escanear de nuevo</span>
                </button>
              </div>

              <!-- Preguntas 1 a 14 -->
              <div class="qz-question-group">
                <div class="qz-group-header">
                  <span class="qz-group-indicator">1-14</span>
                  <h3 class="qz-group-title">
                    Preguntas 1 a 14 (Escala de Frecuencia)
                  </h3>
                </div>
                <div class="qz-answers-grid">
                  <div
                    v-for="(item, idx) in currentResult.seccion1"
                    :key="'s1-' + idx"
                    class="qz-answer-cell"
                  >
                    <div class="qz-q-label">Q{{ idx + 1 }}</div>
                    <ion-select
                      v-model="item.answer"
                      interface="action-sheet"
                      class="qz-select-picker"
                      @ionChange="redrawPreviewWithSelections"
                    >
                      <ion-select-option
                        v-for="opt in likertOptions"
                        :key="opt"
                        :value="opt"
                      >
                        {{ opt }}
                      </ion-select-option>
                    </ion-select>
                  </div>
                </div>
              </div>

              <!-- Preguntas 15 a 18 -->
              <div class="qz-question-group">
                <div class="qz-group-header">
                  <span class="qz-group-indicator">15-18</span>
                  <h3 class="qz-group-title">
                    Preguntas 15 a 18 (Escala de Frecuencia)
                  </h3>
                </div>
                <div class="qz-answers-grid">
                  <div
                    v-for="(item, idx) in currentResult.seccion2"
                    :key="'s2-' + idx"
                    class="qz-answer-cell"
                  >
                    <div class="qz-q-label">Q{{ idx + 15 }}</div>
                    <ion-select
                      v-model="item.answer"
                      interface="action-sheet"
                      class="qz-select-picker"
                      @ionChange="redrawPreviewWithSelections"
                    >
                      <ion-select-option
                        v-for="opt in likertOptions"
                        :key="opt"
                        :value="opt"
                      >
                        {{ opt }}
                      </ion-select-option>
                    </ion-select>
                  </div>
                </div>
              </div>

              <!-- Botones de Acción de la Hoja -->
              <div class="qz-card-footer-actions">
                <button class="qz-btn qz-btn-primary" @click="confirmResponse">
                  <ion-icon :icon="checkmarkOutline"></ion-icon>
                  <span>Confirmar y Guardar</span>
                </button>
                <button class="qz-btn qz-btn-secondary" @click="startScan">
                  <ion-icon :icon="cameraOutline"></ion-icon>
                  <span>Escanear de nuevo</span>
                </button>
              </div>
            </div>

            <!-- BOTÓN PRINCIPAL PARA ESCANEAR SI NO HAY VISTA PREVIA -->
            <div v-else class="qz-hero-scan-box">
              <button class="qz-hero-scan-btn" @click="startScan">
                <div class="qz-hero-icon-circle">
                  <ion-icon :icon="cameraOutline"></ion-icon>
                </div>
                <div class="qz-hero-content">
                  <span class="qz-hero-headline"
                    >Escanear Hoja de Encuesta</span
                  >
                  <span class="qz-hero-subheadline">
                    Alinee los 4 marcadores y el código QR/matriz en el visor
                  </span>
                </div>
              </button>
            </div>

            <!-- PANEL DE EXPORTACIÓN Y REPORTES UNIFICADO -->
            <div class="qz-card qz-export-card" v-if="responses.length > 0">
              <div class="qz-card-header">
                <h2 class="qz-card-title">
                  Exportación de Reportes y Escaneos
                </h2>
                <p class="qz-card-subtitle">
                  Descargue el archivo compilado de hojas escaneadas o el
                  análisis estadístico detallado.
                </p>
              </div>

              <div class="qz-export-section">
                <div class="qz-section-title-row">
                  <ion-icon
                    :icon="imagesOutline"
                    class="qz-sec-icon"
                  ></ion-icon>
                  <h4 class="qz-section-heading">
                    Hojas Registradas ({{ responses.length }})
                  </h4>
                </div>
                <div class="qz-export-btn-grid">
                  <button
                    class="qz-export-btn qz-export-btn--purple"
                    @click="downloadScansPDF"
                  >
                    <ion-icon :icon="imagesOutline"></ion-icon>
                    <div class="qz-btn-texts">
                      <span class="qz-btn-main">PDF de Escaneos</span>
                      <span class="qz-btn-sub">Hojas escaneadas</span>
                    </div>
                  </button>
                  <button
                    class="qz-export-btn qz-export-btn--teal"
                    @click="downloadAnalysisPDF"
                  >
                    <ion-icon :icon="statsChartOutline"></ion-icon>
                    <div class="qz-btn-texts">
                      <span class="qz-btn-main">PDF del Análisis</span>
                      <span class="qz-btn-sub">Gráficos y frecuencias</span>
                    </div>
                  </button>
                  <button
                    class="qz-export-btn qz-export-btn--outline"
                    @click="downloadCSV"
                  >
                    <ion-icon :icon="downloadOutline"></ion-icon>
                    <div class="qz-btn-texts">
                      <span class="qz-btn-main">Exportar CSV</span>
                      <span class="qz-btn-sub">Datos en tabla</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Acciones secundarias inferiores -->
              <div class="qz-aux-actions-row">
                <button
                  class="qz-btn-ghost"
                  @click="fetchResponses"
                  :disabled="isLoading"
                >
                  <ion-icon :icon="refreshOutline"></ion-icon>
                  <span>{{
                    isLoading ? "Actualizando..." : "Actualizar datos"
                  }}</span>
                </button>
                <button class="qz-btn-ghost" @click="startScan">
                  <ion-icon :icon="cameraOutline"></ion-icon>
                  <span>Escanear otra hoja</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>

    <!-- 3. OVERLAY DE ESCÁNER DE CÁMARA (Directamente en ion-page) -->
    <div v-show="isScanning" class="qz-scanner-overlay">
      <div class="qz-scanner-header">
        <button
          type="button"
          class="qz-scanner-cancel-btn"
          @click="onScanCancelled"
        >
          <ion-icon :icon="arrowBackOutline"></ion-icon>
          <span>Volver</span>
        </button>
        <div class="qz-scanner-instruction">Alinee la hoja en el visor</div>
        <div class="qz-scanner-tag">Padres de Familia</div>
      </div>

      <div class="qz-scanner-viewport">
        <omr-scanner
          ref="scannerComponent"
          templateName="parentSurvey"
          @scan-complete="onScanComplete"
          @scan-cancelled="onScanCancelled"
        ></omr-scanner>
      </div>
    </div>

    <!-- MODAL QUEEZY PARA MODIFICAR SESIÓN -->
    <ion-modal
      :is-open="showEditSessionModal"
      @did-dismiss="closeEditSessionModal"
      class="qz-session-modal"
    >
      <div class="qz-modal-content">
        <div class="qz-modal-header">
          <div class="qz-modal-badge">MODIFICAR SESIÓN</div>
          <h3 class="qz-modal-title">Editar Sesión de Padres</h3>
          <button
            type="button"
            class="qz-modal-close-btn"
            @click="closeEditSessionModal"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>

        <div class="qz-modal-body">
          <div class="qz-input-group">
            <label class="qz-input-label">Año Lectivo</label>
            <input
              type="number"
              v-model.number="editSessionYear"
              :min="2020"
              :max="2100"
              class="qz-form-input"
            />
          </div>

          <div class="qz-input-group">
            <label class="qz-input-label">Nombre o Etiqueta de la Sesión</label>
            <input
              type="text"
              v-model="editSessionLabel"
              placeholder="Ej: Asamblea General 2026, Entrega de Notas, etc."
              class="qz-form-input"
              @keyup.enter="updateCurrentSession"
            />
          </div>

          <button
            type="button"
            class="qz-modal-submit-btn"
            @click="updateCurrentSession"
            :disabled="!editSessionLabel || !editSessionYear || isUpdatingSession"
          >
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </ion-modal>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonModal,
  alertController,
  onIonViewDidEnter,
} from "@ionic/vue";
import { ref, nextTick } from "vue";
import OmrScanner from "@/components/OmrScanner.vue";
import { useRouter } from "vue-router";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
import axios from "axios";
import { tokenHeader, selectedYear } from "../globalService";
import {
  generateSurveyPDF,
  generateScansCompilationPDF,
  isShareCancelled,
} from "@/components/functions/omr/surveyPdfGenerator.js";
import {
  arrowBackOutline,
  checkmarkOutline,
  cameraOutline,
  downloadOutline,
  documentTextOutline,
  imagesOutline,
  refreshOutline,
  statsChartOutline,
  createOutline,
  closeOutline,
  scanOutline,
} from "ionicons/icons";

export default {
  name: "OmrParentSurveyReader",
  components: {
    IonPage,
    IonContent,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonModal,
    OmrScanner,
  },
  setup() {
    const router = useRouter();
    const isScanning = ref(false);
    const scannerComponent = ref(null);
    const currentResult = ref(null);
    const responses = ref([]);
    const autoCodeCounter = ref(1);
    const likertOptions = ["Nunca", "Algunas veces", "Casi siempre", "Siempre"];

    const templateId = ref(null);
    const isLoading = ref(false);
    const currentSession = ref(null);
    const currentYear = ref(selectedYear());

    const showEditSessionModal = ref(false);
    const editSessionYear = ref(selectedYear());
    const editSessionLabel = ref("");
    const isUpdatingSession = ref(false);

    const openEditSessionModal = () => {
      if (!currentSession.value) return;
      editSessionYear.value = currentSession.value.year;
      editSessionLabel.value = currentSession.value.label;
      showEditSessionModal.value = true;
    };

    const closeEditSessionModal = () => {
      showEditSessionModal.value = false;
      editSessionLabel.value = "";
    };

    const updateCurrentSession = async () => {
      if (
        !currentSession.value ||
        !editSessionLabel.value?.trim() ||
        !editSessionYear.value ||
        isUpdatingSession.value
      ) {
        return;
      }

      isUpdatingSession.value = true;
      try {
        tokenHeader();
        const payload = {
          year: Number(editSessionYear.value),
          label: editSessionLabel.value.trim(),
        };
        const res = await axios.patch(
          `/surveys/sessions/${currentSession.value.id}`,
          payload,
        );
        const updated = res.data;
        currentSession.value = {
          ...currentSession.value,
          year: updated.year,
          label: updated.label,
        };

        closeEditSessionModal();

        const alert = await alertController.create({
          header: "Sesión Actualizada",
          message: "Los datos de la sesión se han modificado exitosamente.",
          buttons: ["Aceptar"],
        });
        await alert.present();
      } catch (err) {
        console.error(
          "updateCurrentSession error:",
          err.response?.data || err.message,
        );
        const alert = await alertController.create({
          header: "Error",
          message:
            err.response?.data?.message ||
            "No se pudo actualizar la sesión. Intente nuevamente.",
          buttons: ["Aceptar"],
        });
        await alert.present();
      } finally {
        isUpdatingSession.value = false;
      }
    };

    const ensureTemplate = async () => {
      if (templateId.value) return templateId.value;
      try {
        tokenHeader();
        const res = await axios.get("/surveys/templates", {
          params: { slug: "parent-survey" },
        });
        if (res.data && res.data.length > 0) {
          templateId.value = res.data[0].id;
        } else {
          const createRes = await axios.post("/surveys/templates", {
            name: "Encuesta a Padres",
            slug: "parent-survey",
            active: true,
          });
          templateId.value = createRes.data.id;
        }
      } catch (err) {
        console.error(
          "ensureTemplate error:",
          err.response?.data || err.message,
        );
      }
      return templateId.value;
    };

    const loadSessionFromRoute = async () => {
      const sessionId = router.currentRoute.value.params.sessionId;
      if (!sessionId || sessionId === "general") {
        currentSession.value = null;
        await ensureTemplate();
        return;
      }
      try {
        tokenHeader();
        const res = await axios.get(`/surveys/sessions/${sessionId}`);
        currentSession.value = res.data;
        if (res.data.template) {
          templateId.value = res.data.template.id;
        }
      } catch (err) {
        console.error("loadSession error:", err.response?.data || err.message);
      }
    };

    const fetchResponses = async () => {
      isLoading.value = true;
      try {
        tokenHeader();
        await ensureTemplate();
        const params = {
          templateId: templateId.value,
          respondent: "parent",
        };
        if (currentSession.value?.id) {
          params.sessionId = currentSession.value.id;
        } else {
          params.sessionId = 0; // general / sin sesión
        }
        const res = await axios.get("/surveys/responses", { params });
        responses.value = res.data || [];

        // Calcular siguiente código correlativo disponible
        const maxCode = responses.value.reduce((acc, r) => {
          const n = parseInt(r.code, 10);
          return !isNaN(n) && n > acc ? n : acc;
        }, 0);
        autoCodeCounter.value = maxCode + 1;
      } catch (err) {
        console.error(
          "fetchResponses error:",
          err.response?.data || err.message,
        );
        responses.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    onIonViewDidEnter(async () => {
      await loadSessionFromRoute();
      await fetchResponses();
    });

    const goBack = () => router.back();

    const startScan = async () => {
      currentResult.value = null;
      isScanning.value = true;
      await nextTick();
      if (scannerComponent.value) scannerComponent.value.start();
    };

    const onScanComplete = async (payload) => {
      isScanning.value = false;

      const allQuestions = payload.results
        .filter((r) => r.typeOrigin === "question")
        .flatMap((r) => r.content || []);

      const assigned = String(autoCodeCounter.value).padStart(4, "0");
      autoCodeCounter.value++;

      currentResult.value = {
        code: assigned,
        seccion1: allQuestions.slice(0, 14),
        seccion2: allQuestions.slice(14, 18),
        imageUrl: payload.imageUrl,
        cleanDataUrl: payload.cleanDataUrl || payload.cleanImageUrl,
        bubbleCoords: payload.bubbleCoords || [],
      };
    };

    const redrawPreviewWithSelections = () => {
      if (!currentResult.value) return;
      const { cleanDataUrl, bubbleCoords, seccion1, seccion2 } =
        currentResult.value;
      if (
        !cleanDataUrl ||
        !Array.isArray(bubbleCoords) ||
        bubbleCoords.length === 0
      )
        return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 1. Draw base clean rectified image
        ctx.drawImage(img, 0, 0);

        const isMatch = (selected, bubble) => {
          if (!selected) return false;
          const s = String(selected).trim().toLowerCase();
          const opt = String(bubble.optLetter || "")
            .trim()
            .toLowerCase();
          const raw = String(bubble.rawOptLabel || "")
            .trim()
            .toLowerCase();
          return s === opt || s === raw;
        };

        // 2. Redraw each bubble based on current selection
        for (const bubble of bubbleCoords) {
          let isSelected = false;

          if (bubble.sectionName === "seccion1" || bubble.matrixIdx === 0) {
            const ans = seccion1?.[bubble.row]?.answer;
            isSelected = isMatch(ans, bubble);
          } else if (
            bubble.sectionName === "seccion2" ||
            bubble.matrixIdx === 1
          ) {
            const ans = seccion2?.[bubble.row]?.answer;
            isSelected = isMatch(ans, bubble);
          }

          ctx.beginPath();
          ctx.arc(bubble.gx, bubble.gy, bubble.radius, 0, Math.PI * 2);

          if (isSelected) {
            // Selected bubble -> Filled Queezy purple
            ctx.fillStyle = "rgba(106, 90, 224, 0.85)";
            ctx.fill();
            ctx.strokeStyle = "#6a5ae0";
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else {
            // Unselected bubble -> subtle outline
            ctx.strokeStyle = "rgba(160, 160, 175, 0.35)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        currentResult.value.imageUrl = canvas.toDataURL("image/png");
      };
      img.src = cleanDataUrl;
    };

    const onScanCancelled = () => {
      isScanning.value = false;
    };

    const validateResponses = (seccion1, seccion2) => {
      const issues = [];
      const allItems = [
        ...seccion1.map((item, i) => ({ num: i + 1, item })),
        ...seccion2.map((item, i) => ({ num: i + 15, item })),
      ];
      for (const { num, item } of allItems) {
        if (!item.answer || item.answer.trim() === "") {
          issues.push(`Q${num}: sin respuesta`);
        }
        if (Array.isArray(item.answer)) {
          issues.push(`Q${num}: múltiples respuestas`);
        }
      }
      return issues;
    };

    const confirmResponse = async () => {
      if (!currentResult.value) return;

      const { code, seccion1, seccion2, imageUrl } = currentResult.value;
      const issues = validateResponses(seccion1, seccion2);

      let confirmed = false;
      const promptAlert = await alertController.create({
        header:
          issues.length > 0
            ? "Aviso: respuestas con inconsistencias"
            : "Confirmar registro",
        message:
          issues.length > 0
            ? "Se detectaron los siguientes problemas:\n\n" +
              issues.join("\n") +
              "\n\nPuede corregirlas o guardarlas tal como están."
            : "Los datos quedarán registrados en la base de datos de encuestas. ¿Desea continuar?",
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: issues.length > 0 ? "Guardar de todas formas" : "Confirmar",
            handler: () => {
              confirmed = true;
            },
          },
        ],
      });
      await promptAlert.present();
      await promptAlert.onDidDismiss();
      if (!confirmed) return;

      try {
        tokenHeader();
        await ensureTemplate();
        const payload = {
          templateId: templateId.value,
          code,
          answers: { seccion1, seccion2 },
          respondent: "parent",
          imageUrl: imageUrl || undefined,
        };
        if (currentSession.value?.id) {
          payload.sessionId = currentSession.value.id;
        }

        // 1. Guardar en base de datos
        await axios.post("/surveys/responses", payload);

        currentResult.value = null;
        await fetchResponses();

        const resultAlert = await alertController.create({
          header: "Registrado y Guardado",
          message: `Registrada exitosamente (${responses.value.length} registradas en total).`,
          buttons: ["OK"],
        });
        await resultAlert.present();
      } catch (err) {
        console.error(
          "confirmResponse error:",
          err.response?.data || err.message,
        );
        const errAlert = await alertController.create({
          header: "Error al guardar",
          message: "No se pudo registrar la respuesta en la base de datos.",
          buttons: ["OK"],
        });
        await errAlert.present();
      }
    };

    const downloadScansPDF = async () => {
      if (responses.value.length === 0) return;
      try {
        await generateScansCompilationPDF(
          responses.value,
          currentSession.value,
          "parent",
        );
      } catch (error) {
        if (!isShareCancelled(error)) {
          console.error("Error al exportar escaneos:", error);
          const alert = await alertController.create({
            header: "Error",
            message: "No se pudo generar el PDF con los escaneos.",
            buttons: ["OK"],
          });
          await alert.present();
        }
      }
    };

    const downloadAnalysisPDF = async () => {
      if (responses.value.length === 0) return;
      try {
        await generateSurveyPDF(
          responses.value,
          currentSession.value?.label || "General",
          currentSession.value,
        );
      } catch (error) {
        if (!isShareCancelled(error)) {
          console.error("Error al exportar análisis:", error);
          const alert = await alertController.create({
            header: "Error",
            message: "No se pudo generar el reporte PDF.",
            buttons: ["OK"],
          });
          await alert.present();
        }
      }
    };

    const escapeCSVCell = (str) => {
      const s = String(str);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const buildCSVString = () => {
      const headers = ["Código"];
      for (let i = 1; i <= 18; i++) {
        headers.push(`Q${i} (Nunca/Algunas veces/Casi siempre/Siempre)`);
      }

      const rows = responses.value.map((r) => {
        const row = [r.code];
        const ans = r.answers || {};
        const s1 = ans.seccion1 || [];
        const s2 = ans.seccion2 || [];
        for (let i = 0; i < 14; i++) row.push(s1[i] ? s1[i].answer || "" : "");
        for (let i = 0; i < 4; i++) row.push(s2[i] ? s2[i].answer || "" : "");
        return row.map(escapeCSVCell).join(",");
      });

      return "\uFEFF" + [headers.join(","), ...rows].join("\n");
    };

    const downloadCSVNative = async (csvString) => {
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
      });
      await FileSharer.share({
        filename: `encuesta_padres_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`,
        contentType: "text/csv",
        base64Data,
      });
    };

    const downloadCSVWeb = (csvString) => {
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `encuesta_padres_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const downloadCSV = async () => {
      if (responses.value.length === 0) return;
      const csvString = buildCSVString();
      if (Capacitor.isNativePlatform()) {
        try {
          await downloadCSVNative(csvString);
        } catch (error) {
          if (!isShareCancelled(error)) {
            const alert = await alertController.create({
              header: "Error",
              message: "Hubo un error al compartir el archivo.",
              buttons: ["OK"],
            });
            await alert.present();
          }
        }
      } else {
        downloadCSVWeb(csvString);
      }
    };

    return {
      isScanning,
      currentResult,
      responses,
      scannerComponent,
      arrowBackOutline,
      checkmarkOutline,
      cameraOutline,
      downloadOutline,
      documentTextOutline,
      imagesOutline,
      refreshOutline,
      statsChartOutline,
      goBack,
      startScan,
      onScanComplete,
      onScanCancelled,
      confirmResponse,
      downloadScansPDF,
      downloadAnalysisPDF,
      downloadCSV,
      likertOptions,
      templateId,
      isLoading,
      fetchResponses,
      currentSession,
      currentYear,
      redrawPreviewWithSelections,
      showEditSessionModal,
      editSessionYear,
      editSessionLabel,
      isUpdatingSession,
      openEditSessionModal,
      closeEditSessionModal,
      updateCurrentSession,
      createOutline,
      closeOutline,
      scanOutline,
    };
  },
};
</script>

<style scoped>
.qz-survey-page {
  --background: var(--qz-color-bg, #efeefc);
  background-color: var(--qz-color-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-survey-content {
  --background: var(--qz-color-bg, #efeefc);
}

.qz-survey-wrapper {
  display: flex;
  flex-direction: column;
  background-color: var(--qz-color-bg, #efeefc);
  box-sizing: border-box;
}

/* TOP BAR */
.qz-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(14px, env(safe-area-inset-top)) 16px 14px 16px;
  background: var(--qz-color-card-bg, #ffffff);
  border-bottom: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  position: sticky;
  top: 0;
  z-index: 20;
}

.qz-main-body {
  flex: 1;
  padding: 16px 16px 40px 16px;
  box-sizing: border-box;
}

.qz-circle-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.12));
  background: var(--qz-color-card-bg, #ffffff);
  color: var(--qz-color-text-main, #0c092a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.qz-circle-btn:active {
  transform: scale(0.92);
}

.qz-top-bar__center {
  flex: 1;
  text-align: center;
  padding: 0 10px;
}

.qz-top-bar__title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  letter-spacing: -0.2px;
}

.qz-top-bar__subtitle {
  font-size: 12px;
  font-weight: 500;
  color: var(--qz-color-text-muted, #858494);
}

.qz-top-bar__sub-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.qz-session-edit-trigger {
  background: var(--qz-color-purple-light, #efeefc);
  border: 1px solid rgba(106, 90, 224, 0.2);
  color: var(--qz-color-purple-primary, #6a5ae0);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  outline: none;
}

.qz-session-edit-trigger:hover {
  background: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
}

/* MODAL */
.qz-session-modal {
  --border-radius: 24px;
  --max-width: 480px;
}

.qz-modal-content {
  background: var(--qz-color-card-bg, #ffffff);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.qz-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  flex-wrap: wrap;
}

.qz-modal-badge {
  width: 100%;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--qz-color-purple-primary, #6a5ae0);
  margin-bottom: 4px;
}

.qz-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-modal-close-btn {
  background: var(--qz-color-purple-light, #efeefc);
  border: none;
  color: var(--qz-color-purple-primary, #6a5ae0);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
}

.qz-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-input-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-form-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1.5px solid var(--qz-color-border, rgba(106, 90, 224, 0.15));
  font-size: 14px;
  font-family: inherit;
  color: var(--qz-color-text-main, #0c092a);
  background: var(--qz-color-purple-light, #faf9fe);
  outline: none;
  box-sizing: border-box;
}

.qz-form-input:focus {
  border-color: var(--qz-color-purple-primary, #6a5ae0);
  background: #ffffff;
}

.qz-modal-submit-btn {
  background: var(--qz-color-purple-primary, #6a5ae0);
  border: none;
  color: #ffffff;
  border-radius: 9999px;
  padding: 14px;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  margin-top: 6px;
  transition: transform 0.15s ease;
}

.qz-modal-submit-btn:active {
  transform: scale(0.98);
}

.qz-count-badge {
  background: var(--qz-color-purple-light, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
  font-size: 13px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(106, 90, 224, 0.15);
}

/* CONTAINER */
.qz-container,
.qz-survey-container {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;
  width: 100%;
  box-sizing: border-box;
}

/* SESSION INFO CARD */
.qz-session-info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: var(--qz-color-card-bg, #ffffff);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  border-radius: 20px;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.04);
}

.qz-session-info-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.qz-session-icon-wrap {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 14px;
  background: rgba(106, 90, 224, 0.1);
  color: var(--qz-color-purple-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.qz-session-text-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.qz-session-tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.qz-meta-tag {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(106, 90, 224, 0.08);
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-session-title-text {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  line-height: 1.35;
  word-break: break-word;
}

.qz-session-modify-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-color-purple-primary, #6a5ae0);
  background: #efeefc;
  border: 1.5px solid rgba(106, 90, 224, 0.18);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.qz-session-modify-btn:hover {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
}

.qz-session-modify-btn:active {
  transform: scale(0.97);
}

@media (max-width: 600px) {
  .qz-session-info-card {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px 16px;
  }
  .qz-session-modify-btn {
    width: 100%;
    height: 42px;
  }
}

/* METRICS */
.qz-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.qz-metric-card {
  background: var(--qz-color-card-bg, #ffffff);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  border-radius: 20px;
  padding: 14px 16px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.04);
}

.qz-metric-num {
  font-size: 24px;
  font-weight: 800;
  color: var(--qz-color-purple-primary, #6a5ae0);
  line-height: 1.1;
}

.qz-metric-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--qz-color-text-muted, #858494);
  margin-top: 4px;
}

/* CARDS */
.qz-card {
  background: var(--qz-color-card-bg, #ffffff);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(106, 90, 224, 0.05);
}

.qz-card-header {
  margin-bottom: 16px;
}

.qz-header-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.qz-card-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0 0 4px 0;
}

.qz-card-subtitle {
  font-size: 13px;
  color: var(--qz-color-text-muted, #858494);
  margin: 0;
  line-height: 1.4;
}

/* TAGS */
.qz-tag {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
}

.qz-tag--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-tag--success {
  background: #e8f8f0;
  color: #05a660;
}

/* SCAN IMAGE SECTION */
.qz-scan-image-section {
  margin-bottom: 20px;
  text-align: center;
}

.qz-image-wrapper {
  background: #000000;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: inline-block;
  max-width: 100%;
}

.qz-scan-img {
  display: block;
  max-width: 100%;
  max-height: 380px;
  object-fit: contain;
  margin: 0 auto;
}

.qz-image-actions {
  margin-top: 10px;
}

.qz-btn-pill-action {
  background: var(--qz-color-card-bg, #ffffff);
  border: 1.5px solid var(--qz-color-purple-primary, #6a5ae0);
  color: var(--qz-color-purple-primary, #6a5ae0);
  border-radius: 9999px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.qz-btn-pill-action:active {
  transform: scale(0.96);
  background: rgba(106, 90, 224, 0.08);
}

/* QUESTION GROUPS */
.qz-question-group {
  margin-bottom: 20px;
}

.qz-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.qz-group-indicator {
  background: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 9999px;
}

.qz-group-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-answers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
}

.qz-answer-cell {
  background: var(--qz-color-purple-light, #f4f3fc);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.1));
  border-radius: 14px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-q-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-select-picker {
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  --padding-start: 4px;
  --padding-end: 4px;
  --padding-top: 2px;
  --padding-bottom: 2px;
  min-width: 90px;
  text-align: right;
}

/* CARD FOOTER ACTIONS */
.qz-card-footer-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.qz-card-actions--top {
  margin-top: 14px;
  margin-bottom: 24px;
}

.qz-btn {
  flex: 1;
  height: 48px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.qz-btn:active {
  transform: scale(0.97);
}

.qz-btn-primary {
  background: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.35);
}

.qz-btn-secondary {
  background: var(--qz-color-purple-light, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.15);
}

/* HERO SCAN STARTER */
.qz-hero-scan-box {
  margin: 10px 0;
}

.qz-hero-scan-btn {
  width: 100%;
  background: linear-gradient(135deg, #6a5ae0 0%, #8374f2 100%);
  border: none;
  border-radius: 28px;
  padding: 24px 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 10px 30px rgba(106, 90, 224, 0.35);
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.qz-hero-scan-btn:active {
  transform: scale(0.98);
}

.qz-hero-icon-circle {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.qz-hero-content {
  display: flex;
  flex-direction: column;
}

.qz-hero-headline {
  font-size: 18px;
  font-weight: 800;
}

.qz-hero-subheadline {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 4px;
}

/* EXPORT SECTION */
.qz-export-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
}

.qz-section-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.qz-sec-icon {
  font-size: 18px;
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-section-heading {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-export-btn-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

.qz-export-btn {
  border-radius: 18px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  border: none;
  text-align: left;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.qz-export-btn:active {
  transform: scale(0.97);
}

.qz-export-btn ion-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.qz-btn-texts {
  display: flex;
  flex-direction: column;
}

.qz-btn-main {
  font-size: 13px;
  font-weight: 800;
}

.qz-btn-sub {
  font-size: 11px;
  opacity: 0.85;
}

.qz-export-btn--purple {
  background: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.28);
}

.qz-export-btn--teal {
  background: #38a3a5;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(56, 163, 165, 0.28);
}

.qz-export-btn--outline {
  background: var(--qz-color-card-bg, #ffffff);
  border: 1.5px solid var(--qz-color-border, rgba(106, 90, 224, 0.15));
  color: var(--qz-color-text-main, #0c092a);
}

.qz-aux-actions-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--qz-color-border, rgba(106, 90, 224, 0.12));
}

.qz-btn-ghost {
  background: transparent;
  border: none;
  color: var(--qz-color-purple-primary, #6a5ae0);
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
}

.qz-btn-ghost:active {
  background: rgba(106, 90, 224, 0.08);
}

.qz-btn-ghost--danger {
  color: #ff5656;
}

.qz-btn-ghost--danger:active {
  background: rgba(255, 86, 86, 0.08);
}

/* ----------------------------------------------------
   OVERLAY DE ESCÁNER DE CÁMARA
---------------------------------------------------- */
.qz-scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  z-index: 99999;
  background: #0c091f;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.qz-scanner-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(12px, env(safe-area-inset-top)) 16px 10px 16px;
  background: rgba(18, 16, 36, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  z-index: 10;
  gap: 10px;
}

.qz-scanner-cancel-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.qz-scanner-cancel-btn:active {
  background: rgba(255, 255, 255, 0.35);
}

.qz-scanner-instruction {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  flex: 1;
}

.qz-scanner-tag {
  background: rgba(106, 90, 224, 0.5);
  color: #ffffff;
  border-radius: 9999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
}

.qz-scanner-viewport {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ==========================================================================
   DARK MODE OVERRIDES
   ========================================================================== */
body.dark .qz-survey-page,
html.dark .qz-survey-page,
.dark .qz-survey-page {
  --background: #110d26;
  background-color: #110d26;
}

body.dark .qz-survey-content,
html.dark .qz-survey-content,
.dark .qz-survey-content {
  --background: #110d26;
}

body.dark .qz-survey-wrapper,
html.dark .qz-survey-wrapper,
.dark .qz-survey-wrapper {
  background-color: #110d26;
}

body.dark .qz-top-bar,
html.dark .qz-top-bar,
.dark .qz-top-bar {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

body.dark .qz-top-bar__title,
html.dark .qz-top-bar__title,
.dark .qz-top-bar__title,
body.dark .qz-card-title,
html.dark .qz-card-title,
.dark .qz-card-title,
body.dark .qz-group-title,
html.dark .qz-group-title,
.dark .qz-group-title,
body.dark .qz-section-heading,
html.dark .qz-section-heading,
.dark .qz-section-heading {
  color: #f7f7fd;
}

body.dark .qz-top-bar__subtitle,
html.dark .qz-top-bar__subtitle,
.dark .qz-top-bar__subtitle,
body.dark .qz-card-subtitle,
html.dark .qz-card-subtitle,
.dark .qz-card-subtitle,
body.dark .qz-metric-text,
html.dark .qz-metric-text,
.dark .qz-metric-text {
  color: #9e9bb8;
}

body.dark .qz-circle-btn,
html.dark .qz-circle-btn,
.dark .qz-circle-btn {
  background: #252048;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-count-badge,
html.dark .qz-count-badge,
.dark .qz-count-badge {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-card,
html.dark .qz-card,
.dark .qz-card,
body.dark .qz-metric-card,
html.dark .qz-metric-card,
.dark .qz-metric-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

body.dark .qz-tag--purple,
html.dark .qz-tag--purple,
.dark .qz-tag--purple {
  background: #2a2353;
  color: #c0b7ff;
}

body.dark .qz-tag--success,
html.dark .qz-tag--success,
.dark .qz-tag--success {
  background: #142823;
  color: #48db9b;
}

body.dark .qz-btn-pill-action,
html.dark .qz-btn-pill-action,
.dark .qz-btn-pill-action {
  background: #231d42;
  border-color: #7c6ef2;
  color: #c0b7ff;
}

body.dark .qz-answer-cell,
html.dark .qz-answer-cell,
.dark .qz-answer-cell {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08);
}

body.dark .qz-select-picker,
html.dark .qz-select-picker,
.dark .qz-select-picker {
  color: #f7f7fd;
}

body.dark .qz-q-label,
html.dark .qz-q-label,
.dark .qz-q-label {
  color: #a39bf0;
}

body.dark .qz-btn-secondary,
html.dark .qz-btn-secondary,
.dark .qz-btn-secondary {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-export-btn--outline,
html.dark .qz-export-btn--outline,
.dark .qz-export-btn--outline {
  background: #231d42;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.12);
}

body.dark .qz-session-edit-trigger,
html.dark .qz-session-edit-trigger,
.dark .qz-session-edit-trigger {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.12);
}

body.dark .qz-session-edit-trigger:hover,
html.dark .qz-session-edit-trigger:hover,
.dark .qz-session-edit-trigger:hover {
  background: #7c6ef2;
  color: #ffffff;
}

body.dark .qz-modal-content,
html.dark .qz-modal-content,
.dark .qz-modal-content {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

body.dark .qz-modal-title,
html.dark .qz-modal-title,
.dark .qz-modal-title,
body.dark .qz-input-label,
html.dark .qz-input-label,
.dark .qz-input-label {
  color: #f7f7fd;
}

body.dark .qz-modal-close-btn,
html.dark .qz-modal-close-btn,
.dark .qz-modal-close-btn {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-form-input,
html.dark .qz-form-input,
.dark .qz-form-input {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.14);
  color: #f7f7fd;
}

body.dark .qz-form-input:focus,
html.dark .qz-form-input:focus,
.dark .qz-form-input:focus {
  background: #28214b !important;
  border-color: #7c6ef2 !important;
  color: #f7f7fd !important;
  box-shadow: 0 0 0 3px rgba(124, 110, 242, 0.25);
}

body.dark .qz-form-input::placeholder,
html.dark .qz-form-input::placeholder,
.dark .qz-form-input::placeholder {
  color: #858494;
}

body.dark .qz-group-indicator,
html.dark .qz-group-indicator,
.dark .qz-group-indicator {
  background: #252048;
  color: #a39bf0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

body.dark .qz-session-icon-wrap,
html.dark .qz-session-icon-wrap,
.dark .qz-session-icon-wrap {
  background: #252048;
  color: #a39bf0;
}

body.dark .qz-meta-tag,
html.dark .qz-meta-tag,
.dark .qz-meta-tag {
  background: #252048;
  color: #a39bf0;
}

body.dark .qz-session-title-text,
html.dark .qz-session-title-text,
.dark .qz-session-title-text {
  color: #f7f7fd;
}

body.dark .qz-session-modify-btn,
html.dark .qz-session-modify-btn,
.dark .qz-session-modify-btn {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.12);
}

body.dark .qz-session-modify-btn:hover,
html.dark .qz-session-modify-btn:hover,
.dark .qz-session-modify-btn:hover {
  background: #7c6ef2;
  color: #ffffff;
  border-color: #7c6ef2;
}

@media (prefers-color-scheme: dark) {
  .qz-survey-page {
    --background: #110d26;
    background-color: #110d26;
  }

  .qz-survey-content {
    --background: #110d26;
  }

  .qz-survey-wrapper {
    background-color: #110d26;
  }

  .qz-top-bar {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .qz-top-bar__title,
  .qz-card-title,
  .qz-group-title,
  .qz-section-heading {
    color: #f7f7fd;
  }

  .qz-top-bar__subtitle,
  .qz-card-subtitle,
  .qz-metric-text {
    color: #9e9bb8;
  }

  .qz-circle-btn {
    background: #252048;
    color: #f7f7fd;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-count-badge {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-card,
  .qz-preview-card,
  .qz-export-card,
  .qz-metric-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .qz-tag--purple {
    background: #2a2353;
    color: #c0b7ff;
  }

  .qz-tag--success {
    background: #142823;
    color: #48db9b;
  }

  .qz-btn-pill-action {
    background: #231d42;
    border-color: #7c6ef2;
    color: #c0b7ff;
  }

  .qz-group-indicator {
    background: #252048;
    color: #a39bf0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .qz-answer-cell {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .qz-select-picker {
    color: #f7f7fd;
  }

  .qz-q-label {
    color: #a39bf0;
  }

  .qz-btn-secondary {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-export-btn--outline {
    background: #231d42;
    color: #f7f7fd;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .qz-session-edit-trigger {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .qz-session-edit-trigger:hover {
    background: #7c6ef2;
    color: #ffffff;
  }

  .qz-modal-content {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .qz-modal-title,
  .qz-input-label {
    color: #f7f7fd;
  }

  .qz-modal-close-btn {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-form-input {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.14);
    color: #f7f7fd;
  }

  .qz-form-input:focus {
    background: #28214b !important;
    border-color: #7c6ef2 !important;
    color: #f7f7fd !important;
    box-shadow: 0 0 0 3px rgba(124, 110, 242, 0.25);
  }

  .qz-form-input::placeholder {
    color: #858494;
  }

  .qz-session-icon-wrap {
    background: #252048;
    color: #a39bf0;
  }

  .qz-meta-tag {
    background: #252048;
    color: #a39bf0;
  }

  .qz-session-title-text {
    color: #f7f7fd;
  }

  .qz-session-modify-btn {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .qz-session-modify-btn:hover {
    background: #7c6ef2;
    color: #ffffff;
    border-color: #7c6ef2;
  }
}
</style>
