<template>
  <ion-page class="ion-page qz-results-page">
    <header class="qz-top-bar">
      <qz-button
        circle
        variant="ghost"
        @click="goBack"
        aria-label="Volver"
      >
        <ion-icon :icon="arrowBackOutline"></ion-icon>
      </qz-button>
      <div class="qz-top-bar__center">
        <h1 class="qz-top-bar__title">
          Resultados: {{ session?.label || "Sesión" }}
        </h1>
        <span class="qz-top-bar__subtitle"
          >Tabulación y análisis estadístico</span
        >
      </div>
      <div class="qz-top-bar__right">
        <qz-button
          circle
          variant="primary"
          @click="goToScanner"
          title="Escanear más hojas"
        >
          <ion-icon :icon="cameraOutline"></ion-icon>
        </qz-button>
      </div>
    </header>

    <ion-content class="qz-content-wrap">
      <div v-if="loading" class="qz-empty-box">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Cargando datos y tabulando respuestas...</p>
      </div>

      <div v-else class="qz-container">
        <!-- Cabecera de la Sesión -->
        <div class="qz-card session-summary-card">
          <div class="summary-top-row">
            <span class="qz-tag qz-tag--purple">{{ session?.year }}</span>
            <span class="qz-tag qz-tag--success">{{ template?.name }}</span>
          </div>
          <h2 class="qz-session-title-text">{{ session?.label }}</h2>
          <span class="qz-card-subtitle">
            Plantilla: <code>{{ template?.slug }}</code> &bull; Creada:
            {{ formatDate(session?.createdAt) }}
          </span>

          <div class="metrics-grid">
            <div class="metric-box">
              <span class="metric-value">{{ responses.length }}</span>
              <span class="metric-label">Hojas Procesadas</span>
            </div>
            <div class="metric-box">
              <span class="metric-value">{{ questionSections.length }}</span>
              <span class="metric-label">Secciones de Preguntas</span>
            </div>
            <div class="metric-box">
              <span class="metric-value">{{ totalQuestionsCount }}</span>
              <span class="metric-label">Preguntas Totales</span>
            </div>
          </div>

          <!-- Botones de Acción y Exportación -->
          <div class="action-buttons-row">
            <qz-button 
              variant="primary"
              pill
              size="md"
              :disabled="responses.length === 0"
              @click="downloadAnalysisPDF"
            >
              <ion-icon :icon="pieChartOutline"></ion-icon>
              <span>Descargar Análisis Graficado (PDF)</span>
            </qz-button>
            <qz-button 
              variant="ghost"
              pill
              size="md"
              :disabled="responses.length === 0"
              @click="exportToCSV"
            >
              <ion-icon :icon="downloadOutline"></ion-icon>
              <span>Exportar CSV (Excel)</span>
            </qz-button>
            <qz-button 
              variant="outline"
              pill
              size="md"
              @click="loadData"
            >
              <ion-icon :icon="refreshOutline"></ion-icon>
              <span>Actualizar</span>
            </qz-button>
          </div>
        </div>

        <!-- Pestañas de Vista: Estadísticas vs. Hojas Individuales -->
        <div class="view-mode-tabs">
          <button
            type="button"
            :class="['tab-btn', { active: activeTab === 'stats' }]"
            @click="activeTab = 'stats'"
          >
            Tabulación y Frecuencias
          </button>
          <button
            type="button"
            :class="['tab-btn', { active: activeTab === 'raw' }]"
            @click="activeTab = 'raw'"
          >
            Hojas Escaneadas ({{ responses.length }})
          </button>
        </div>

        <!-- Estado vacío -->
        <div v-if="responses.length === 0" class="empty-state-box">
          <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
          <h3>Aún no hay respuestas escaneadas</h3>
          <p>Utiliza el escáner OMR para capturar las hojas de esta sesión.</p>
          <button
            type="button"
            class="qz-btn-main"
            @click="goToScanner"
            style="margin-top: 12px"
          >
            <ion-icon :icon="cameraOutline"></ion-icon>
            <span>Comenzar a Escanear</span>
          </button>
        </div>

        <!-- VISTA 1: TABULACIÓN Y FRECUENCIAS -->
        <div
          v-else-if="activeTab === 'stats'"
          class="stats-section-wrap ion-margin-top"
        >
          <div
            v-for="(sec, sIdx) in questionSections"
            :key="sIdx"
            class="section-stats-card ion-margin-bottom"
          >
            <div class="section-stats-header">
              <h3>{{ sec.title || sec.name || `Sección ${sIdx + 1}` }}</h3>
              <span
                class="section-info-badge"
                v-if="sec.type === 'multiselect'"
              >
                1 pregunta multiselección ·
                {{ getMultiselectOptions(sec).length }} herramientas/opciones
              </span>
              <span class="section-info-badge" v-else>
                {{ sec.rows || 1 }}
                {{ (sec.rows || 1) === 1 ? "pregunta" : "preguntas" }} ·
                Opciones: {{ (sec.labels || []).join(", ") }}
              </span>
            </div>

            <!-- TABLA PARA PREGUNTA MULTISELECCIÓN (Ej: Pregunta 20) -->
            <div v-if="sec.type === 'multiselect'" class="table-responsive">
              <table class="omr-table">
                <thead>
                  <tr>
                    <th class="col-q" style="width: 45%">
                      Herramienta / Recurso Evaluado
                    </th>
                    <th class="col-opt text-center" style="width: 18%">
                      Frecuencia (Votos)
                    </th>
                    <th class="col-opt text-center" style="width: 15%">
                      Porcentaje (%)
                    </th>
                    <th class="col-total" style="width: 22%">Distribución</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(opt, oIdx) in getMultiselectOptions(sec)"
                    :key="oIdx"
                  >
                    <td class="col-q">
                      <strong>{{ opt }}</strong>
                    </td>
                    <td class="col-opt text-center">
                      <span class="freq-count">{{
                        getMultiselectFrequency(sec, opt)
                      }}</span>
                    </td>
                    <td class="col-opt text-center">
                      <span class="freq-pct"
                        >{{ getMultiselectPercentage(sec, opt) }}%</span
                      >
                    </td>
                    <td class="col-total">
                      <div class="freq-bar-bg" style="width: 100%">
                        <div
                          class="freq-bar-fill"
                          :style="{
                            width: getMultiselectPercentage(sec, opt) + '%',
                            backgroundColor: '#38a3a5',
                          }"
                        ></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- TABLA ESTÁNDAR PARA PREGUNTAS LIKERT / OPCIÓN ÚNICA -->
            <div v-else class="table-responsive">
              <table class="omr-table">
                <thead>
                  <tr>
                    <th class="col-q">Ítem / Pregunta</th>
                    <th
                      v-for="(lbl, lIdx) in sec.labels || []"
                      :key="lIdx"
                      class="col-opt text-center"
                    >
                      {{ lbl }}
                    </th>
                    <th class="col-blank text-center">
                      En blanco / No marcada
                    </th>
                    <th class="col-total text-center">Total Válidas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="qNum in sec.rows || 1" :key="qNum">
                    <td class="col-q">
                      <div class="question-row-label">
                        <strong>Pregunta {{ qNum }}</strong>
                        <span
                          v-if="getQuestionPrompt(sec, qNum - 1)"
                          class="q-prompt-text"
                        >
                          {{ getQuestionPrompt(sec, qNum - 1) }}
                        </span>
                      </div>
                    </td>
                    <td
                      v-for="(lbl, lIdx) in sec.labels || []"
                      :key="lIdx"
                      class="col-opt text-center"
                    >
                      <div class="freq-cell">
                        <span class="freq-count">{{
                          getFrequency(sec, qNum - 1, lbl)
                        }}</span>
                        <span class="freq-pct">
                          {{ getPercentage(sec, qNum - 1, lbl) }}%
                        </span>
                        <div class="freq-bar-bg">
                          <div
                            class="freq-bar-fill"
                            :style="{
                              width: getPercentage(sec, qNum - 1, lbl) + '%',
                            }"
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td class="col-blank text-center">
                      <span class="freq-blank">{{
                        getBlankCount(sec, qNum - 1)
                      }}</span>
                    </td>
                    <td class="col-total text-center">
                      <strong>{{ getValidCount(sec, qNum - 1) }}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- VISTA 2: HOJAS ESCANEADAS (DATOS CRUDOS) -->
        <div
          v-else-if="activeTab === 'raw'"
          class="raw-section-wrap ion-margin-top"
        >
          <div class="table-responsive">
            <table class="omr-table omr-pivot-table">
              <thead>
                <tr>
                  <th class="sticky-col"># Hoja / Código</th>
                  <th>Fecha de Registro</th>
                  <template
                    v-for="(sec, sIdx) in questionSections"
                    :key="'h-' + sIdx"
                  >
                    <th v-if="sec.type === 'multiselect'" class="text-center">
                      {{
                        sec.title
                          ? sec.title.length > 25
                            ? sec.title.substring(0, 25) + "..."
                            : sec.title
                          : "P20 (Recursos)"
                      }}
                    </th>
                    <template v-else>
                      <th
                        v-for="qNum in sec.rows || 1"
                        :key="'h-' + sIdx + '-' + qNum"
                        class="text-center"
                      >
                        {{ getQuestionHeaderLabel(sec, sIdx, qNum) }}
                      </th>
                    </template>
                  </template>
                  <th class="text-center">Imagen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, rIdx) in responses" :key="r.id || rIdx">
                  <td class="sticky-col">
                    <span class="code-pill">{{
                      r.code || `#${rIdx + 1}`
                    }}</span>
                  </td>
                  <td>{{ formatDate(r.createdAt) }}</td>
                  <template
                    v-for="(sec, sIdx) in questionSections"
                    :key="'d-' + sIdx"
                  >
                    <td
                      v-if="sec.type === 'multiselect'"
                      class="text-center cell-answer cell-multiselect"
                    >
                      <div
                        class="multi-tags-cell"
                        v-if="
                          Array.isArray(r.answers?.[sec.name]) &&
                          r.answers[sec.name].length > 0
                        "
                      >
                        <span
                          v-for="(t, tIdx) in r.answers[sec.name]"
                          :key="tIdx"
                          class="ans-pill ans-pill--active"
                        >
                          {{ t }}
                        </span>
                      </div>
                      <span v-else class="ans-pill ans-pill--blank">—</span>
                    </td>
                    <template v-else>
                      <td
                        v-for="qNum in sec.rows || 1"
                        :key="'d-' + sIdx + '-' + qNum"
                        class="text-center cell-answer"
                      >
                        <span
                          :class="[
                            'ans-pill',
                            getAnswerClass(r, sec, qNum - 1),
                          ]"
                        >
                          {{ getAnswerFor(r, sec, qNum - 1) }}
                        </span>
                      </td>
                    </template>
                  </template>
                  <td class="text-center actions-cell">
                    <ion-button
                      v-if="r.imageUrl"
                      fill="clear"
                      size="small"
                      color="primary"
                      @click="previewImage(r)"
                      title="Ver imagen capturada"
                    >
                      <ion-icon :icon="eyeOutline"></ion-icon>
                    </ion-button>
                    <ion-button
                      fill="clear"
                      size="small"
                      color="danger"
                      @click="deleteResponse(r)"
                      title="Eliminar hoja"
                    >
                      <ion-icon :icon="trashOutline"></ion-icon>
                    </ion-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Modal para Previsualizar Hoja Escaneada -->
    <ion-modal :is-open="showImageModal" @did-dismiss="showImageModal = false">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Hoja #{{ selectedResponse?.code }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showImageModal = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding ion-text-center">
        <div v-if="selectedResponse?.imageUrl" class="image-preview-wrapper">
          <img
            :src="selectedResponse.imageUrl"
            alt="Hoja Escaneada"
            class="scanned-image-full"
          />
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonSpinner,
  IonModal,
  alertController,
} from "@ionic/vue";
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { tokenHeader } from "../globalService";
import {
  arrowBackOutline,
  cameraOutline,
  downloadOutline,
  refreshOutline,
  documentTextOutline,
  eyeOutline,
  closeOutline,
  trashOutline,
  pieChartOutline,
} from "ionicons/icons";
import { normalizeSurveyTemplate } from "@/components/functions/omr/templateLoader.js";
import { generateCustomSurveyReportPDF } from "@/components/functions/omr/customSurveyPdfGenerator.js";

export default {
  name: "OmrSurveyResultsView",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonSpinner,
    IonModal,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    const sessionId = computed(() => Number(route.params.sessionId));
    const loading = ref(true);
    const session = ref(null);
    const template = ref(null);
    const responses = ref([]);
    const activeTab = ref("stats");
    const showImageModal = ref(false);
    const selectedResponse = ref(null);

    const parsedTemplate = computed(() => {
      return normalizeSurveyTemplate(template.value);
    });

    const questionSections = computed(() => {
      const secs = parsedTemplate.value?.questionsConfig?.sections;
      if (!Array.isArray(secs)) return [];
      return secs.filter((s) => s.type !== "instruction" && s.type !== "code");
    });

    const totalQuestionsCount = computed(() => {
      return questionSections.value.reduce((acc, s) => {
        if (s.type === "multiselect") return acc + 1;
        return acc + (Number(s.rows) || 1);
      }, 0);
    });

    const loadData = async () => {
      loading.value = true;
      try {
        tokenHeader();
        // Cargar sesión
        const sRes = await axios.get(`/surveys/sessions/${sessionId.value}`);
        session.value = sRes.data;

        // Cargar plantilla asociada
        if (session.value?.template?.id) {
          const tRes = await axios.get(
            `/surveys/templates/${session.value.template.id}`,
          );
          template.value = tRes.data;
        }

        // Cargar respuestas de la sesión
        const rRes = await axios.get("/surveys/responses", {
          params: { sessionId: sessionId.value },
        });
        responses.value = Array.isArray(rRes.data) ? rRes.data : [];
      } catch (err) {
        console.error("Error al cargar resultados de la sesión:", err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadData();
    });

    const goBack = () => {
      if (template.value?.id) {
        router.push(`/omr-encuesta/sesiones/${template.value.id}`);
      } else {
        router.push("/admin/plantillas-encuestas");
      }
    };

    const goToScanner = () => {
      router.push(`/omr-encuesta/personalizada/${sessionId.value}`);
    };

    const formatDate = (isoStr) => {
      if (!isoStr) return "";
      try {
        const d = new Date(isoStr);
        return d.toLocaleDateString("es-CO", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return isoStr;
      }
    };

    const getQuestionPrompt = (sec, qIdx) => {
      if (Array.isArray(sec.questionPrompts) && sec.questionPrompts[qIdx]) {
        return sec.questionPrompts[qIdx];
      }
      return "";
    };

    const getQuestionHeaderLabel = (sec, sIdx, qNum) => {
      const prefix = sec.name
        ? sec.name.substring(0, 4).toUpperCase()
        : `S${sIdx + 1}`;
      return `${prefix}-P${qNum}`;
    };

    const getAnswerFor = (response, sec, qIdx) => {
      if (!response || !response.answers) return "—";
      const secKey = sec.name || sec.id || "";
      const secAnswers = response.answers[secKey];
      if (!secAnswers) return "—";

      let val = undefined;
      if (Array.isArray(secAnswers)) {
        const item = secAnswers[qIdx];
        if (item !== null && typeof item === "object") {
          val = item.answer !== undefined ? item.answer : item.value;
        } else {
          val = item;
        }
      } else if (typeof secAnswers === "object") {
        val =
          secAnswers[qIdx + 1] !== undefined
            ? secAnswers[qIdx + 1]
            : secAnswers[qIdx];
        if (val !== null && typeof val === "object") {
          val = val.answer !== undefined ? val.answer : val.value;
        }
      }

      if (val === undefined || val === null || val === "" || val === "—")
        return "—";
      return String(val);
    };

    const getAnswerClass = (response, sec, qIdx) => {
      const ans = getAnswerFor(response, sec, qIdx);
      if (ans === "—") return "ans-empty";
      return "ans-marked";
    };

    // Estadísticas
    const getFrequency = (sec, qIdx, label) => {
      let count = 0;
      responses.value.forEach((r) => {
        const ans = getAnswerFor(r, sec, qIdx);
        if (ans === String(label)) {
          count++;
        }
      });
      return count;
    };

    const getBlankCount = (sec, qIdx) => {
      let count = 0;
      responses.value.forEach((r) => {
        const ans = getAnswerFor(r, sec, qIdx);
        if (ans === "—") {
          count++;
        }
      });
      return count;
    };

    const getValidCount = (sec, qIdx) => {
      return responses.value.length - getBlankCount(sec, qIdx);
    };

    const getPercentage = (sec, qIdx, label) => {
      const total = responses.value.length;
      if (total === 0) return 0;
      const freq = getFrequency(sec, qIdx, label);
      return Math.round((freq / total) * 100);
    };

    // Métodos para multiselección (Ej: Pregunta 20)
    const getMultiselectOptions = (sec) => {
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

    const getMultiselectFrequency = (sec, opt) => {
      let count = 0;
      const secKey = sec.name || sec.id || "";
      const optClean = String(opt).trim().toLowerCase();
      responses.value.forEach((r) => {
        const list = r.answers?.[secKey];
        if (Array.isArray(list)) {
          if (
            list.some((item) => String(item).trim().toLowerCase() === optClean)
          ) {
            count++;
          }
        }
      });
      return count;
    };

    const getMultiselectPercentage = (sec, opt) => {
      const total = responses.value.length;
      if (total === 0) return 0;
      return Math.round((getMultiselectFrequency(sec, opt) / total) * 100);
    };

    const previewImage = (response) => {
      selectedResponse.value = response;
      showImageModal.value = true;
    };

    /**
     * Exportación limpia a formato CSV compatible con Microsoft Excel
     */
    const exportToCSV = () => {
      if (responses.value.length === 0) return;

      const headers = ["Codigo_Hoja", "Fecha_Registro"];
      questionSections.value.forEach((sec, sIdx) => {
        if (sec.type === "multiselect") {
          const prompt = sec.title || "Recursos_Docente";
          const cleanPrompt = `_${prompt
            .substring(0, 25)
            .replace(/[^a-zA-Z0-9]/g, "_")}`;
          headers.push(`"${sec.name || `Sec${sIdx + 1}`}${cleanPrompt}"`);
        } else {
          for (let q = 1; q <= (sec.rows || 1); q++) {
            const prompt = getQuestionPrompt(sec, q - 1);
            const cleanPrompt = prompt
              ? `_${prompt.substring(0, 25).replace(/[^a-zA-Z0-9]/g, "_")}`
              : "";
            headers.push(
              `"${sec.name || `Sec${sIdx + 1}`}_P${q}${cleanPrompt}"`,
            );
          }
        }
      });

      const rows = [];
      rows.push(headers.join(","));

      responses.value.forEach((r) => {
        const row = [];
        row.push(`"${r.code || ""}"`);
        row.push(`"${r.createdAt || ""}"`);

        questionSections.value.forEach((sec) => {
          if (sec.type === "multiselect") {
            const list = r.answers?.[sec.name];
            const val = Array.isArray(list) ? list.join("; ") : "";
            row.push(`"${val}"`);
          } else {
            for (let q = 0; q < (sec.rows || 1); q++) {
              const val = getAnswerFor(r, sec, q);
              row.push(`"${val === "—" ? "" : val}"`);
            }
          }
        });
        rows.push(row.join(","));
      });

      const csvContent = "\uFEFF" + rows.join("\r\n"); // UTF-8 BOM para Excel
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanSessionName = (session.value?.label || "sesion").replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      link.setAttribute("href", url);
      link.setAttribute("download", `Resultados_${cleanSessionName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const deleteResponse = async (resp) => {
      const alert = await alertController.create({
        header: "Eliminar registro",
        message: `¿Desea eliminar la hoja #${resp.code}? Esta acción descontará la hoja de la tabulación.`,
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Eliminar",
            role: "destructive",
            handler: async () => {
              try {
                tokenHeader();
                await axios.delete(`/surveys/responses/${resp.id}`);
                await loadData();
              } catch (err) {
                console.error("Error al borrar respuesta:", err);
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const downloadAnalysisPDF = async () => {
      await generateCustomSurveyReportPDF({
        session: session.value || {},
        template: parsedTemplate.value || template.value || {},
        responses: responses.value || [],
      });
    };

    return {
      sessionId,
      loading,
      session,
      template,
      parsedTemplate,
      responses,
      activeTab,
      showImageModal,
      selectedResponse,
      questionSections,
      totalQuestionsCount,
      loadData,
      goBack,
      goToScanner,
      formatDate,
      getQuestionPrompt,
      getQuestionHeaderLabel,
      getAnswerFor,
      getAnswerClass,
      getFrequency,
      getBlankCount,
      getValidCount,
      getPercentage,
      getMultiselectOptions,
      getMultiselectFrequency,
      getMultiselectPercentage,
      previewImage,
      deleteResponse,
      exportToCSV,
      downloadAnalysisPDF,
      arrowBackOutline,
      cameraOutline,
      downloadOutline,
      refreshOutline,
      documentTextOutline,
      eyeOutline,
      closeOutline,
      trashOutline,
      pieChartOutline,
    };
  },
};
</script>

<style scoped>
/* BASE PAGE & WRAPPER */
.qz-results-page {
  --background: var(--qz-color-bg, #efeefc);
  background-color: var(--qz-color-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-content-wrap {
  --background: var(--qz-color-bg, #efeefc);
}

/* TOP BAR */
.qz-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--qz-color-card-bg, #ffffff);
  border-bottom: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  box-shadow: 0 2px 10px rgba(106, 90, 224, 0.03);
  position: sticky;
  top: 0;
  z-index: 100;
}

.qz-circle-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(106, 90, 224, 0.2);
  background: var(--qz-color-purple-light, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-circle-btn:hover {
  background: #f1f5f9;
}

.qz-top-bar__center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qz-top-bar__title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
}

.qz-top-bar__subtitle {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

/* CONTAINER */
.qz-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px 60px 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* CARDS */
.qz-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(106, 90, 224, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.session-summary-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-session-title-text {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
}

.qz-card-subtitle {
  font-size: 12px;
  color: #64748b;
}

.qz-card-subtitle code {
  background: rgba(106, 90, 224, 0.08);
  color: #6a5ae0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.qz-tag {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qz-tag--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-tag--success {
  background: #ecfdf5;
  color: #059669;
}

/* METRICS */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.metric-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  text-align: center;
}

.metric-value {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #6a5ae0;
}

.metric-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  margin-top: 2px;
}

/* ACTION BUTTONS */
.action-buttons-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.qz-btn-main {
  background: linear-gradient(135deg, #6a5ae0 0%, #7c6ef2 100%);
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.3);
}

.qz-btn-main:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(106, 90, 224, 0.4);
}

.qz-btn-main:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.qz-btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.qz-btn-action--secondary {
  background: #f0fdf4;
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.2);
}

.qz-btn-action--secondary:hover {
  background: #16a34a;
  color: #ffffff;
}

.qz-btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qz-btn-outline {
  background: #ffffff;
  color: #6a5ae0;
  border: 1.5px solid rgba(106, 90, 224, 0.3);
  border-radius: 9999px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn-outline:hover {
  background: #efeefc;
}

/* TABS */
.view-mode-tabs {
  display: flex;
  background: #e9e8f4;
  padding: 4px;
  border-radius: 12px;
  max-width: 440px;
}

.tab-btn {
  flex: 1;
  padding: 9px 14px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #ffffff;
  color: #6a5ae0;
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.12);
}

/* SECTION STATS CARDS */
.section-stats-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(106, 90, 224, 0.08);
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  margin-bottom: 16px;
}

.section-stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.section-stats-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
}

.section-info-badge {
  font-size: 12px;
  color: #6a5ae0;
  background: #efeefc;
  padding: 3px 10px;
  border-radius: 9999px;
  font-weight: 700;
}

/* TABLES */
.table-responsive {
  overflow-x: auto;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.omr-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.omr-table th,
.omr-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.omr-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.text-center {
  text-align: center;
}

.question-row-label {
  display: flex;
  flex-direction: column;
}

.q-prompt-text {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
  max-width: 280px;
}

.freq-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.freq-count {
  font-weight: 700;
  color: #0f172a;
}

.freq-pct {
  font-size: 11px;
  color: #64748b;
}

.freq-bar-bg {
  width: 48px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.freq-bar-fill {
  height: 100%;
  background: #6a5ae0;
  border-radius: 2px;
}

.freq-blank {
  color: #94a3b8;
  font-weight: 600;
}

/* PIVOT TABLE */
.sticky-col {
  position: sticky;
  left: 0;
  background: #ffffff;
  z-index: 1;
  border-right: 2px solid #e2e8f0;
}

.code-pill {
  background: #efeefc;
  color: #6a5ae0;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 800;
  font-family: monospace;
}

.ans-pill {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 12px;
}

.ans-marked {
  background: #ecfdf5;
  color: #059669;
}

.ans-pill--active {
  background: #efeefc;
  color: #6a5ae0;
  border: 1px solid rgba(106, 90, 224, 0.4);
}

.ans-pill--blank {
  color: #cbd5e1;
}

.cell-multiselect {
  max-width: 280px;
}

.multi-tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.ans-empty {
  color: #cbd5e1;
}

/* EMPTY STATE */
.empty-state-box {
  background: #ffffff;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
}

.empty-state-box h3 {
  margin: 12px 0 6px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 800;
}

.empty-icon {
  font-size: 48px;
  color: #94a3b8;
}

.qz-empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
  gap: 12px;
}

/* MODALS */
.image-preview-wrapper {
  max-width: 100%;
  max-height: 80vh;
  overflow: auto;
}

.scanned-image-full {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ==========================================================================
   DARK MODE OVERRIDES
   ========================================================================== */
body.dark .qz-results-page,
html.dark .qz-results-page,
.dark .qz-results-page,
body.dark .qz-content-wrap,
html.dark .qz-content-wrap,
.dark .qz-content-wrap {
  --background: #110d26;
  background-color: #110d26;
}

body.dark .qz-top-bar,
html.dark .qz-top-bar,
.dark .qz-top-bar {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

body.dark .qz-circle-btn,
html.dark .qz-circle-btn,
.dark .qz-circle-btn {
  background: #252048;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-circle-btn:hover,
html.dark .qz-circle-btn:hover,
.dark .qz-circle-btn:hover {
  background: #2e2858;
}

body.dark .qz-top-bar__title,
html.dark .qz-top-bar__title,
.dark .qz-top-bar__title,
body.dark .qz-session-title-text,
html.dark .qz-session-title-text,
.dark .qz-session-title-text,
body.dark .section-stats-header h3,
html.dark .section-stats-header h3,
.dark .section-stats-header h3,
body.dark .empty-state-box h3,
html.dark .empty-state-box h3,
.dark .empty-state-box h3,
body.dark .freq-count,
html.dark .freq-count,
.dark .freq-count {
  color: #f7f7fd;
}

body.dark .qz-top-bar__subtitle,
html.dark .qz-top-bar__subtitle,
.dark .qz-top-bar__subtitle,
body.dark .qz-card-subtitle,
html.dark .qz-card-subtitle,
.dark .qz-card-subtitle,
body.dark .metric-label,
html.dark .metric-label,
.dark .metric-label,
body.dark .q-prompt-text,
html.dark .q-prompt-text,
.dark .q-prompt-text,
body.dark .freq-pct,
html.dark .freq-pct,
.dark .freq-pct,
body.dark .empty-state-box p,
html.dark .empty-state-box p,
.dark .empty-state-box p,
body.dark .qz-empty-box,
html.dark .qz-empty-box,
.dark .qz-empty-box {
  color: #9e9bb8;
}

body.dark .qz-card,
html.dark .qz-card,
.dark .qz-card,
body.dark .section-stats-card,
html.dark .section-stats-card,
.dark .section-stats-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

body.dark .qz-card-subtitle code,
html.dark .qz-card-subtitle code,
.dark .qz-card-subtitle code {
  background: #252048;
  color: #c0b7ff;
}

body.dark .qz-tag--purple,
html.dark .qz-tag--purple,
.dark .qz-tag--purple,
body.dark .section-info-badge,
html.dark .section-info-badge,
.dark .section-info-badge,
body.dark .code-pill,
html.dark .code-pill,
.dark .code-pill {
  background: #2a2353;
  color: #c0b7ff;
}

body.dark .qz-tag--success,
html.dark .qz-tag--success,
.dark .qz-tag--success {
  background: #142823;
  color: #48db9b;
}

body.dark .metric-box,
html.dark .metric-box,
.dark .metric-box {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08);
}

body.dark .metric-value,
html.dark .metric-value,
.dark .metric-value {
  color: #a39bf0;
}

body.dark .view-mode-tabs,
html.dark .view-mode-tabs,
.dark .view-mode-tabs {
  background: #231d42;
}

body.dark .tab-btn,
html.dark .tab-btn,
.dark .tab-btn {
  color: #9e9bb8;
}

body.dark .tab-btn.active,
html.dark .tab-btn.active,
.dark .tab-btn.active {
  background: #2f2759;
  color: #f7f7fd;
}

body.dark .table-responsive,
html.dark .table-responsive,
.dark .table-responsive {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

body.dark .omr-table th,
html.dark .omr-table th,
.dark .omr-table th {
  background: #231d42;
  color: #9e9bb8;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

body.dark .omr-table td,
html.dark .omr-table td,
.dark .omr-table td {
  border-bottom-color: rgba(255, 255, 255, 0.06);
  color: #f7f7fd;
}

body.dark .sticky-col,
html.dark .sticky-col,
.dark .sticky-col {
  background: #1d1838;
  border-right-color: rgba(255, 255, 255, 0.08);
}

body.dark .freq-bar-bg,
html.dark .freq-bar-bg,
.dark .freq-bar-bg {
  background: #2a2353;
}

body.dark .freq-bar-fill,
html.dark .freq-bar-fill,
.dark .freq-bar-fill {
  background: #7c6ef2;
}

body.dark .ans-marked,
html.dark .ans-marked,
.dark .ans-marked {
  background: #142823;
  color: #48db9b;
}

body.dark .ans-pill--active,
html.dark .ans-pill--active,
.dark .ans-pill--active {
  background: #2a2353;
  color: #c0b7ff;
  border-color: rgba(124, 110, 242, 0.4);
}

body.dark .qz-btn-outline,
html.dark .qz-btn-outline,
.dark .qz-btn-outline {
  background: #231d42;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.12);
}

body.dark .qz-btn-outline:hover,
html.dark .qz-btn-outline:hover,
.dark .qz-btn-outline:hover {
  background: #2a2353;
  color: #ffffff;
}

body.dark .qz-btn-action--secondary,
html.dark .qz-btn-action--secondary,
.dark .qz-btn-action--secondary {
  background: #142823;
  color: #48db9b;
  border-color: rgba(72, 219, 155, 0.2);
}

body.dark .qz-btn-action--secondary:hover,
html.dark .qz-btn-action--secondary:hover,
.dark .qz-btn-action--secondary:hover {
  background: #16a34a;
  color: #ffffff;
}

body.dark .empty-state-box,
html.dark .empty-state-box,
.dark .empty-state-box {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
