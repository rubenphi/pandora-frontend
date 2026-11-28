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
            <h1 class="qz-top-bar__title">
              {{ template?.name || "Lector de Encuesta" }}
            </h1>
            <span class="qz-top-bar__subtitle" v-if="session">
              {{ session.label }} &bull; {{ session.year }}
            </span>
            <span class="qz-top-bar__subtitle" v-else>
              Plantilla OMR
            </span>
          </div>
          <div class="qz-top-bar__right">
            <span class="qz-count-badge" title="Total hojas registradas">
              {{ responses.length }}
            </span>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-main-body">
          <div class="qz-container qz-survey-container">
            <!-- TARJETA INFORMATIVA DE SESIÓN -->
            <div class="qz-card qz-session-info-card" v-if="session">
              <div class="qz-session-info-main">
                <div class="qz-session-icon-wrap">
                  <ion-icon :icon="documentTextOutline"></ion-icon>
                </div>
                <div class="qz-session-text-wrap">
                  <div class="qz-session-tag-row">
                    <span class="qz-meta-tag">{{ session.year }}</span>
                    <span class="qz-tag qz-tag--purple">v{{ template?.version || 1 }}</span>
                  </div>
                  <h2 class="qz-session-title-text">{{ session.label }}</h2>
                  <span class="qz-card-subtitle">{{ template?.name }}</span>
                </div>
              </div>
            </div>

            <!-- TARJETAS DE MÉTRICAS -->
            <div class="qz-metrics-grid" v-if="session">
              <div class="qz-metric-card">
                <div class="qz-metric-num">{{ responses.length }}</div>
                <div class="qz-metric-text">Hojas Guardadas</div>
              </div>
              <div class="qz-metric-card">
                <div class="qz-metric-num">{{ session.year }}</div>
                <div class="qz-metric-text">Año Lectivo</div>
              </div>
            </div>

            <!-- BOTÓN PRINCIPAL PARA INICIAR ESCANEO (SI NO HAY RESULTADO PENDIENTE) -->
            <div class="qz-card qz-scan-cta-card" v-if="!currentResult">
              <qz-button
                block
                size="lg"
                variant="primary"
                @click="startScan"
                :disabled="!template"
              >
                <ion-icon :icon="cameraOutline"></ion-icon>
                <span>{{ template ? "Escanear Hoja" : "Cargando plantilla..." }}</span>
              </qz-button>
              <p class="qz-scan-hint">
                Alinee los 4 marcadores de las esquinas dentro de la pantalla para capturar automáticamente.
              </p>
            </div>

            <!-- TARJETA DE REVISIÓN DEL RESULTADO CAPTURADO -->
            <div v-if="currentResult" class="qz-card qz-preview-card">
              <div class="qz-card-header">
                <div class="qz-header-badge-row">
                  <span class="qz-tag qz-tag--purple">Código #{{ currentResult.code }}</span>
                  <span class="qz-tag qz-tag--success">Escaneo Capturado</span>
                </div>
                <h3 class="qz-card-title">Resultado de la Hoja</h3>
                <p class="qz-card-subtitle">
                  Revise o ajuste las respuestas detectadas antes de confirmar y guardar en el servidor.
                </p>
              </div>

              <!-- Imagen escaneada -->
              <div v-if="currentResult.imageUrl" class="qz-scan-img-box">
                <img
                  :src="currentResult.imageUrl"
                  alt="Hoja Escaneada"
                  class="qz-scan-img"
                />
              </div>

              <!-- Botones de Acción -->
              <div class="qz-preview-actions">
                <qz-button
                  block
                  size="lg"
                  variant="primary"
                  @click="confirmAndSave"
                  :disabled="isSavingResponse"
                >
                  <ion-icon :icon="checkmarkOutline"></ion-icon>
                  <span>{{ isSavingResponse ? "Guardando..." : "Confirmar y Guardar" }}</span>
                </qz-button>

                <qz-button
                  block
                  size="md"
                  variant="ghost"
                  @click="startScan"
                >
                  <ion-icon :icon="cameraOutline"></ion-icon>
                  <span>Re-escanear Hoja</span>
                </qz-button>
              </div>

              <!-- Código de Identificación -->
              <div
                class="qz-input-group qz-code-group"
                v-if="hasCodeSection || currentResult.code"
              >
                <label class="qz-input-label">Código de Identificación / Participante</label>
                <input
                  type="text"
                  v-model="currentResult.code"
                  placeholder="Código detectado"
                  class="qz-form-input"
                />
              </div>

              <!-- Respuestas detectadas por sección -->
              <div class="qz-detected-sections">
                <div
                  v-for="sec in scannableSections"
                  :key="sec.name"
                  class="qz-section-block"
                >
                  <div class="qz-section-block-header">
                    <h4>{{ sec.title || sec.name }}</h4>
                  </div>

                  <!-- Caso: Pregunta de selección única / Likert -->
                  <div
                    v-if="
                      sec.type === 'question' &&
                      Array.isArray(currentResult.answers[sec.name])
                    "
                    class="qz-answers-grid"
                  >
                    <div
                      v-for="(item, idx) in currentResult.answers[sec.name]"
                      :key="sec.name + '-' + idx"
                      class="qz-answer-cell"
                    >
                      <div class="qz-q-label" :title="getQuestionPrompt(sec, idx)">
                        {{ (sec.rowPrefix || "P") + (idx + 1) }}
                      </div>
                      <ion-select
                        v-model="item.answer"
                        interface="action-sheet"
                        class="qz-select-picker"
                        placeholder="-"
                      >
                        <ion-select-option
                          v-for="opt in getSectionOptions(sec)"
                          :key="opt"
                          :value="opt"
                        >
                          {{ opt }}
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>

                  <!-- Caso: Multiselección interactiva -->
                  <div
                    v-else-if="sec.type === 'multiselect'"
                    class="qz-multiselect-tags"
                  >
                    <div class="qz-multiselect-interactive-grid">
                      <button
                        v-for="(opt, optIdx) in getSectionMultiOptions(sec)"
                        :key="optIdx"
                        type="button"
                        :class="[
                          'qz-multi-tag-btn',
                          {
                            'qz-multi-tag-btn--active': isMultiOptionSelected(
                              sec.name,
                              opt,
                            ),
                          },
                        ]"
                        @click="toggleMultiOption(sec.name, opt)"
                      >
                        <ion-icon
                          :icon="
                            isMultiOptionSelected(sec.name, opt)
                              ? checkmarkOutline
                              : addOutline
                          "
                          class="qz-chip-icon"
                        ></ion-icon>
                        <span>{{ opt }}</span>
                      </button>
                    </div>
                    <span
                      v-if="
                        !currentResult.answers[sec.name] ||
                        currentResult.answers[sec.name].length === 0
                      "
                      class="qz-empty-tag-hint"
                    >
                      Sin marcas detectadas. Puedes seleccionar las opciones deseadas pulsando sobre ellas.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- BANDEJA DE HOJAS REGISTRADAS EN LA SESIÓN -->
            <div class="qz-history-section">
              <h3 class="qz-history-title">
                Hojas registradas en esta sesión ({{ responses.length }})
              </h3>

              <div
                v-if="responses.length === 0"
                class="qz-empty-card"
              >
                <p class="qz-empty-desc">Aún no se han guardado respuestas en esta sesión.</p>
              </div>

              <div v-else class="qz-responses-list">
                <div
                  v-for="resp in responses"
                  :key="resp.id"
                  class="qz-card qz-response-item"
                >
                  <div class="qz-resp-info">
                    <span class="qz-resp-code">#{{ resp.code }}</span>
                    <span class="qz-resp-date">{{ formatDate(resp.createdAt) }}</span>
                  </div>
                  <div class="qz-resp-actions">
                    <button
                      type="button"
                      class="qz-delete-resp-btn"
                      title="Eliminar respuesta"
                      @click="deleteResponse(resp)"
                    >
                      <ion-icon :icon="trashOutline"></ion-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>

    <!-- COMPONENTE DEL ESCÁNER EN VIVO -->
    <div v-if="isScanning" class="fullscreen-scanner-wrapper">
      <OmrScanner
        ref="scannerComponent"
        :custom-template="parsedTemplate?.questionsConfig"
        @scan-complete="onScanComplete"
        @scan-cancelled="cancelScan"
      />
    </div>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption,
  alertController,
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { tokenHeader } from "../globalService";
import {
  arrowBackOutline,
  cameraOutline,
  checkmarkOutline,
  trashOutline,
  addOutline,
  documentTextOutline,
} from "ionicons/icons";
import OmrScanner from "@/components/OmrScanner.vue";
import { normalizeSurveyTemplate } from "@/components/functions/omr/templateLoader.js";

export default {
  name: "OmrGenericSurveyReader",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSelect,
    IonSelectOption,
    OmrScanner,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    const sessionId = computed(() =>
      Number(route.params.sessionId || route.query.sessionId),
    );
    const session = ref(null);
    const template = ref(null);
    const responses = ref([]);
    const isScanning = ref(false);
    const scannerComponent = ref(null);
    const isSavingResponse = ref(false);
    const currentResult = ref(null);
    const autoCodeCounter = ref(1);

    const parsedTemplate = computed(() => {
      return normalizeSurveyTemplate(template.value);
    });

    const scannableSections = computed(() => {
      const secs = parsedTemplate.value?.questionsConfig?.sections;
      if (!Array.isArray(secs)) return [];
      return secs.filter((s) => s.type !== "instruction" && s.type !== "code");
    });

    const hasCodeSection = computed(() => {
      const secs = parsedTemplate.value?.questionsConfig?.sections;
      if (!Array.isArray(secs)) return false;
      return secs.some((s) => s.type === "code");
    });

    const goBack = () => {
      if (session.value?.template?.id) {
        router.push(`/omr-encuesta/sesiones/${session.value.template.id}`);
      } else {
        router.push("/admin/plantillas-encuestas");
      }
    };

    const loadSessionAndTemplate = async () => {
      try {
        tokenHeader();
        // 1. Cargar sesión (incluye relación template)
        const sessRes = await axios.get(`/surveys/sessions/${sessionId.value}`);
        session.value = sessRes.data;

        // 2. Cargar plantilla completa
        if (session.value?.template?.id) {
          const tplRes = await axios.get(
            `/surveys/templates/${session.value.template.id}`,
          );
          template.value = tplRes.data;
        }

        // 3. Cargar respuestas existentes
        await fetchResponses();
      } catch (err) {
        console.error("Error al cargar sesión:", err);
      }
    };

    const fetchResponses = async () => {
      try {
        tokenHeader();
        const res = await axios.get("/surveys/responses", {
          params: { sessionId: sessionId.value },
        });
        responses.value = Array.isArray(res.data) ? res.data : [];
        if (responses.value.length > 0) {
          autoCodeCounter.value = responses.value.length + 1;
        }
      } catch {
        responses.value = [];
      }
    };

    const startScan = async () => {
      if (!template.value) return;
      currentResult.value = null;
      isScanning.value = true;
      await nextTick();
      setTimeout(async () => {
        if (
          scannerComponent.value &&
          typeof scannerComponent.value.start === "function"
        ) {
          await scannerComponent.value.start();
        }
      }, 100);
    };

    const cancelScan = () => {
      if (
        scannerComponent.value &&
        typeof scannerComponent.value.cancelScan === "function"
      ) {
        scannerComponent.value.cancelScan();
      }
      isScanning.value = false;
    };

    /**
     * Procesa los resultados emitidos por OmrScanner dinámicamente
     */
    const onScanComplete = (payload) => {
      isScanning.value = false;

      const rawSections = parsedTemplate.value?.questionsConfig?.sections || [];
      const scannables = rawSections.filter((s) => s.type !== "instruction");
      const dynamicAnswers = {};
      let detectedCode = "";

      // Mapear cada resultado al bloque de sección correspondiente
      scannables.forEach((sec, idx) => {
        const resultItem = payload.results?.[idx];
        const secName = sec.name || `seccion${idx + 1}`;

        if (!resultItem) {
          if (sec.type === "question") {
            const rowsCount = Number(sec.rows || 1);
            dynamicAnswers[secName] = Array.from(
              { length: rowsCount },
              (_, rIdx) => ({
                question: rIdx + 1,
                answer: "",
              }),
            );
          } else if (sec.type === "multiselect") {
            dynamicAnswers[secName] = [];
          }
          return;
        }

        if (sec.type === "code" || resultItem.typeOrigin === "numeric") {
          detectedCode = String(resultItem.content || "").trim();
        } else if (
          sec.type === "multiselect" ||
          resultItem.typeOrigin === "multiselect"
        ) {
          dynamicAnswers[secName] = Array.isArray(resultItem.content)
            ? resultItem.content
            : [];
        } else {
          // Tipo pregunta
          dynamicAnswers[secName] = Array.isArray(resultItem.content)
            ? resultItem.content
            : [];
        }
      });

      // Si no detectó código numérico, asignar correlativo automático
      const finalCode =
        detectedCode || String(autoCodeCounter.value).padStart(4, "0");

      currentResult.value = {
        code: finalCode,
        answers: dynamicAnswers,
        imageUrl: payload.imageUrl,
        cleanDataUrl: payload.cleanDataUrl,
      };
    };

    const confirmAndSave = async () => {
      if (!currentResult.value) return;
      isSavingResponse.value = true;
      try {
        tokenHeader();
        const payload = {
          templateId: template.value.id,
          sessionId: sessionId.value,
          code: currentResult.value.code,
          answers: currentResult.value.answers,
          imageUrl:
            currentResult.value.cleanDataUrl || currentResult.value.imageUrl,
        };

        await axios.post("/surveys/responses", payload);
        autoCodeCounter.value++;
        currentResult.value = null;
        await fetchResponses();

        const alert = await alertController.create({
          header: "Hoja Registrada",
          message: `La encuesta #${payload.code} fue guardada exitosamente.`,
          buttons: [
            { text: "Listo" },
            {
              text: "Escanear Siguiente",
              handler: () => {
                startScan();
              },
            },
          ],
        });
        await alert.present();
      } catch (err) {
        console.error("Error al guardar respuesta:", err);
        const alert = await alertController.create({
          header: "Error",
          message: "No se pudo guardar la respuesta en el servidor.",
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        isSavingResponse.value = false;
      }
    };

    const deleteResponse = async (resp) => {
      const alert = await alertController.create({
        header: "Eliminar registro",
        message: `¿Desea eliminar la hoja #${resp.code}?`,
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Eliminar",
            role: "destructive",
            handler: async () => {
              try {
                tokenHeader();
                await axios.delete(`/surveys/responses/${resp.id}`);
                await fetchResponses();
              } catch {
                console.error("Error al borrar respuesta");
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const getSectionOptions = (sec) => {
      if (Array.isArray(sec.labels) && sec.labels.length > 0) {
        return sec.labels;
      }
      return ["A", "B", "C", "D"];
    };

    const getQuestionPrompt = (sec, idx) => {
      if (sec.questionPrompts && sec.questionPrompts[idx]) {
        return sec.questionPrompts[idx];
      }
      return `Pregunta ${idx + 1}`;
    };

    const getSectionMultiOptions = (sec) => {
      if (Array.isArray(sec.options) && sec.options.length > 0) {
        return sec.options.map((o) => String(o).trim()).filter(Boolean);
      }
      if (Array.isArray(sec.labels)) {
        return sec.labels
          .flat()
          .map((l) => String(l).trim())
          .filter(Boolean);
      }
      return [];
    };

    const isMultiOptionSelected = (secName, opt) => {
      if (!currentResult.value?.answers?.[secName]) return false;
      const list = currentResult.value.answers[secName];
      if (!Array.isArray(list)) return false;
      const optClean = String(opt).trim().toLowerCase();
      return list.some(
        (item) => String(item).trim().toLowerCase() === optClean,
      );
    };

    const toggleMultiOption = (secName, opt) => {
      if (!currentResult.value) return;
      if (!Array.isArray(currentResult.value.answers[secName])) {
        currentResult.value.answers[secName] = [];
      }
      const list = currentResult.value.answers[secName];
      const optClean = String(opt).trim();
      const existingIdx = list.findIndex(
        (item) => String(item).trim().toLowerCase() === optClean.toLowerCase(),
      );
      if (existingIdx !== -1) {
        list.splice(existingIdx, 1);
      } else {
        list.push(optClean);
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return dateStr;
      }
    };

    onMounted(() => {
      if (sessionId.value) {
        loadSessionAndTemplate();
      }
    });

    onIonViewWillEnter(() => {
      if (sessionId.value) {
        loadSessionAndTemplate();
      }
    });

    return {
      session,
      template,
      parsedTemplate,
      responses,
      isScanning,
      scannerComponent,
      isSavingResponse,
      currentResult,
      scannableSections,
      hasCodeSection,
      goBack,
      startScan,
      cancelScan,
      onScanComplete,
      confirmAndSave,
      deleteResponse,
      getSectionOptions,
      getSectionMultiOptions,
      isMultiOptionSelected,
      toggleMultiOption,
      getQuestionPrompt,
      formatDate,
      arrowBackOutline,
      cameraOutline,
      checkmarkOutline,
      trashOutline,
      addOutline,
      documentTextOutline,
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
  min-height: 100%;
  background-color: var(--qz-color-bg, #efeefc);
}

/* TOP BAR */
.qz-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--qz-color-card-bg, #ffffff);
  border-bottom: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  box-shadow: 0 2px 10px rgba(106, 90, 224, 0.03);
  position: sticky;
  top: 0;
  z-index: 10;
}

.qz-circle-btn {
  background: var(--qz-color-purple-light, #efeefc);
  border: 1px solid rgba(106, 90, 224, 0.2);
  color: var(--qz-color-purple-primary, #6a5ae0);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-circle-btn:active {
  transform: scale(0.92);
}

.qz-top-bar__center {
  flex: 1;
  text-align: center;
  padding: 0 8px;
}

.qz-top-bar__title {
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0;
  line-height: 1.2;
}

.qz-top-bar__subtitle {
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
  margin-top: 2px;
  display: block;
}

.qz-top-bar__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 40px;
}

.qz-count-badge {
  background: var(--qz-color-purple-light, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 9999px;
  white-space: nowrap;
}

/* MAIN BODY */
.qz-main-body {
  padding: 16px;
}

.qz-container {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* CARDS */
.qz-card {
  background: var(--qz-color-card-bg, #ffffff);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 6px 20px rgba(106, 90, 224, 0.05);
}

/* SESSION INFO CARD */
.qz-session-info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qz-session-info-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.qz-session-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--qz-color-purple-light, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-session-text-wrap {
  flex: 1;
  min-width: 0;
}

.qz-session-tag-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.qz-meta-tag {
  background: #e8f8f0;
  color: #05a660;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.qz-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.qz-tag--purple {
  background: var(--qz-color-purple-light, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-tag--success {
  background: #e8f8f0;
  color: #05a660;
}

.qz-session-title-text {
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-card-subtitle {
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
  margin: 2px 0 0 0;
}

/* METRICS GRID */
.qz-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.qz-metric-card {
  background: var(--qz-color-card-bg, #ffffff);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.04);
}

.qz-metric-num {
  font-size: 24px;
  font-weight: 800;
  color: var(--qz-color-purple-primary, #6a5ae0);
  line-height: 1;
}

.qz-metric-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--qz-color-text-muted, #858494);
  margin-top: 4px;
}

/* SCAN CTA CARD */
.qz-scan-cta-card {
  text-align: center;
  padding: 20px;
}

.qz-scan-hint {
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
  margin: 10px 0 0 0;
  line-height: 1.4;
}

/* PREVIEW CARD */
.qz-preview-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qz-header-badge-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-card-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0;
}

.qz-scan-img-box {
  text-align: center;
  border-radius: 14px;
  overflow: hidden;
  background: #000000;
  max-height: 320px;
}

.qz-scan-img {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.qz-preview-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* INPUTS */
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

/* SECTIONS AND ANSWERS */
.qz-detected-sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-top: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  padding-top: 14px;
}

.qz-section-block-header h4 {
  font-size: 14px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0 0 8px 0;
}

.qz-answers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
}

.qz-answer-cell {
  background: var(--qz-color-purple-light, #faf9fe);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.12));
  border-radius: 12px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-q-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-select-picker {
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-color-purple-primary, #6a5ae0);
  --padding-start: 6px;
  --padding-end: 4px;
}

/* MULTISELECT INTERACTIVE TAGS */
.qz-multiselect-interactive-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.qz-multi-tag-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--qz-color-card-bg, #ffffff);
  color: var(--qz-color-text-main, #0c092a);
  border: 1.5px solid var(--qz-color-border, rgba(106, 90, 224, 0.2));
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-multi-tag-btn--active {
  background: #e8f8f0;
  color: #05a660;
  border-color: #05a660;
  box-shadow: 0 2px 8px rgba(5, 166, 96, 0.2);
}

.qz-chip-icon {
  font-size: 15px;
}

.qz-empty-tag-hint {
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
  font-style: italic;
  margin-top: 6px;
  display: block;
}

/* HISTORY */
.qz-history-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-history-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0;
}

.qz-empty-card {
  background: var(--qz-color-card-bg, #ffffff);
  border: 1px dashed var(--qz-color-border, rgba(106, 90, 224, 0.2));
  border-radius: 20px;
  padding: 24px;
  text-align: center;
}

.qz-empty-desc {
  font-size: 13px;
  color: var(--qz-color-text-muted, #858494);
  margin: 0;
}

.qz-responses-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-response-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 16px;
}

.qz-resp-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-resp-code {
  font-size: 14px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-resp-date {
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-delete-resp-btn {
  background: #feecec;
  border: 1px solid rgba(255, 86, 86, 0.2);
  color: #ff5656;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.qz-delete-resp-btn:active {
  transform: scale(0.92);
}

/* SCANNER FULLSCREEN */
.fullscreen-scanner-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #000000;
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

body.dark .qz-circle-btn,
html.dark .qz-circle-btn,
.dark .qz-circle-btn,
body.dark .qz-session-icon-wrap,
html.dark .qz-session-icon-wrap,
.dark .qz-session-icon-wrap,
body.dark .qz-count-badge,
html.dark .qz-count-badge,
.dark .qz-count-badge,
body.dark .qz-tag--purple,
html.dark .qz-tag--purple,
.dark .qz-tag--purple {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-card,
html.dark .qz-card,
.dark .qz-card,
body.dark .qz-metric-card,
html.dark .qz-metric-card,
.dark .qz-metric-card,
body.dark .qz-response-item,
html.dark .qz-response-item,
.dark .qz-response-item {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

body.dark .qz-empty-card,
html.dark .qz-empty-card,
.dark .qz-empty-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-top-bar__title,
html.dark .qz-top-bar__title,
.dark .qz-top-bar__title,
body.dark .qz-session-title-text,
html.dark .qz-session-title-text,
.dark .qz-session-title-text,
body.dark .qz-card-title,
html.dark .qz-card-title,
.dark .qz-card-title,
body.dark .qz-history-title,
html.dark .qz-history-title,
.dark .qz-history-title,
body.dark .qz-section-block-header h4,
html.dark .qz-section-block-header h4,
.dark .qz-section-block-header h4,
body.dark .qz-q-label,
html.dark .qz-q-label,
.dark .qz-q-label,
body.dark .qz-resp-code,
html.dark .qz-resp-code,
.dark .qz-resp-code,
body.dark .qz-input-label,
html.dark .qz-input-label,
.dark .qz-input-label {
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
.dark .qz-metric-text,
body.dark .qz-scan-hint,
html.dark .qz-scan-hint,
.dark .qz-scan-hint,
body.dark .qz-resp-date,
html.dark .qz-resp-date,
.dark .qz-resp-date,
body.dark .qz-empty-desc,
html.dark .qz-empty-desc,
.dark .qz-empty-desc,
body.dark .qz-empty-tag-hint,
html.dark .qz-empty-tag-hint,
.dark .qz-empty-tag-hint {
  color: #858494;
}

body.dark .qz-metric-num,
html.dark .qz-metric-num,
.dark .qz-metric-num {
  color: #7c6ef2;
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

body.dark .qz-answer-cell,
html.dark .qz-answer-cell,
.dark .qz-answer-cell {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08);
}

body.dark .qz-select-picker,
html.dark .qz-select-picker,
.dark .qz-select-picker {
  color: #a39bf0;
}

body.dark .qz-multi-tag-btn,
html.dark .qz-multi-tag-btn,
.dark .qz-multi-tag-btn {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.1);
  color: #f7f7fd;
}

body.dark .qz-multi-tag-btn--active,
html.dark .qz-multi-tag-btn--active,
.dark .qz-multi-tag-btn--active {
  background: #173d2a;
  border-color: #53df83;
  color: #53df83;
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

  .qz-circle-btn,
  .qz-session-icon-wrap,
  .qz-count-badge,
  .qz-tag--purple {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-card,
  .qz-metric-card,
  .qz-response-item {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .qz-empty-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-top-bar__title,
  .qz-session-title-text,
  .qz-card-title,
  .qz-history-title,
  .qz-section-block-header h4,
  .qz-q-label,
  .qz-resp-code,
  .qz-input-label {
    color: #f7f7fd;
  }

  .qz-top-bar__subtitle,
  .qz-card-subtitle,
  .qz-metric-text,
  .qz-scan-hint,
  .qz-resp-date,
  .qz-empty-desc,
  .qz-empty-tag-hint {
    color: #858494;
  }

  .qz-metric-num {
    color: #7c6ef2;
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

  .qz-answer-cell {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .qz-select-picker {
    color: #a39bf0;
  }

  .qz-multi-tag-btn {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.1);
    color: #f7f7fd;
  }

  .qz-multi-tag-btn--active {
    background: #173d2a;
    border-color: #53df83;
    color: #53df83;
  }
}
</style>
