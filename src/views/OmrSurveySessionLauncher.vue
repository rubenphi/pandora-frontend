<template>
  <ion-page class="ion-page qz-launcher-page">
    <ion-content :fullscreen="true" class="qz-launcher-content">
      <div class="qz-launcher-wrapper">
        <!-- 1. CABECERA HERO QUEEZY PÚRPURA -->
        <header class="qz-hero-header">
          <div class="qz-hero-top">
            <qz-button
              circle
              variant="translucent"
              title="Regresar"
              @click="goBack"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </qz-button>

            <div class="qz-hero-status-pill">
              <ion-icon :icon="documentTextOutline"></ion-icon>
              <span>{{ template?.name || "Encuesta OMR" }}</span>
            </div>

            <qz-button
              circle
              variant="translucent"
              title="Crear Nueva Sesión"
              @click="openNewSessionModal"
            >
              <ion-icon :icon="addOutline"></ion-icon>
            </qz-button>
          </div>

          <div class="qz-hero-titles">
            <div class="qz-hero-badge-row">
              <span class="qz-hero-tag">PLANTILLA PERSONALIZADA</span>
            </div>
            <h1 class="qz-hero-title">
              {{ template ? template.name : "Sesiones de Encuesta" }}
            </h1>
            <p class="qz-hero-subtitle">
              {{ template?.slug }} &bull; {{ sectionCount }} secciones &bull; Seleccione una sesión de aplicación o cree una nueva.
            </p>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-main-body">
          <div class="qz-launcher-container">
            <!-- BOTONES DE ACCIÓN RÁPIDA -->
            <div class="qz-quick-actions-row">
              <button
                type="button"
                class="qz-quick-btn qz-quick-btn--primary"
                @click="openNewSessionModal"
              >
                <div class="qz-quick-btn__icon">
                  <ion-icon :icon="addOutline"></ion-icon>
                </div>
                <div class="qz-quick-btn__text">
                  <span class="qz-quick-btn__title">Nueva Sesión</span>
                  <span class="qz-quick-btn__sub">Crear grupo de escaneo</span>
                </div>
              </button>

              <button
                type="button"
                class="qz-quick-btn qz-quick-btn--ghost"
                @click="openTemplateEditor"
              >
                <div class="qz-quick-btn__icon">
                  <ion-icon :icon="colorPaletteOutline"></ion-icon>
                </div>
                <div class="qz-quick-btn__text">
                  <span class="qz-quick-btn__title">Diseño de Hoja</span>
                  <span class="qz-quick-btn__sub">Abrir editor visual OMR</span>
                </div>
              </button>
            </div>

            <!-- SPINNER DE CARGA -->
            <div v-if="loading" class="qz-empty-card">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <p class="qz-empty-desc">Cargando información de la encuesta...</p>
            </div>

            <!-- LISTADO DE SESIONES -->
            <div v-else class="qz-sessions-section">
              <div class="qz-section-title-row">
                <h3 class="qz-section-title">
                  Sesiones Registradas
                  <span class="qz-count-pill" v-if="sessions.length > 0">
                    {{ sessions.length }}
                  </span>
                </h3>
              </div>

              <!-- CARDS DE SESIONES -->
              <div v-if="sessions.length > 0" class="qz-sessions-list">
                <div
                  v-for="s in sessions"
                  :key="s.id"
                  class="qz-session-card"
                  @click="goToScanner(s)"
                >
                  <div class="qz-session-icon-wrap">
                    <ion-icon :icon="documentTextOutline"></ion-icon>
                  </div>
                  <div class="qz-session-details">
                    <h4 class="qz-session-name">{{ s.label }}</h4>
                    <div class="qz-session-meta">
                      <span class="qz-meta-tag">{{ s.year }}</span>
                      <span class="qz-meta-dot">&bull;</span>
                      <span class="qz-meta-date">Creada {{ formatDate(s.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="qz-session-badge-wrap">
                    <span class="qz-count-badge">
                      {{ s.responsesCount || 0 }} hojas
                    </span>
                    <qz-button
                      size="sm"
                      pill
                      variant="primary"
                      @click.stop="goToScanner(s)"
                      title="Escanear hojas"
                    >
                      <ion-icon :icon="cameraOutline"></ion-icon>
                      <span>Escanear</span>
                    </qz-button>
                    <qz-button
                      size="sm"
                      pill
                      variant="ghost"
                      @click.stop="goToResults(s)"
                      title="Ver resultados y tabulación"
                    >
                      <ion-icon :icon="barChartOutline"></ion-icon>
                      <span>Resultados</span>
                    </qz-button>
                  </div>
                </div>
              </div>

              <!-- ESTADO VACÍO -->
              <div v-else class="qz-empty-card">
                <div class="qz-empty-icon-circle">
                  <ion-icon :icon="folderOpenOutline"></ion-icon>
                </div>
                <h4 class="qz-empty-title">No hay sesiones registradas</h4>
                <p class="qz-empty-desc">
                  Crea tu primera sesión (por ejemplo: "Año 2026 - Grado 10A") para comenzar a escanear respuestas.
                </p>
                <qz-button
                  pill
                  size="md"
                  variant="primary"
                  @click="openNewSessionModal"
                >
                  <ion-icon :icon="addOutline"></ion-icon>
                  <span>Crear Primera Sesión</span>
                </qz-button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>

    <!-- MODAL QUEEZY PARA NUEVA SESIÓN -->
    <ion-modal
      :is-open="showModal"
      @did-dismiss="closeModal"
      class="qz-session-modal"
    >
      <div class="qz-modal-content">
        <div class="qz-modal-header">
          <div class="qz-modal-badge">NUEVA SESIÓN</div>
          <h3 class="qz-modal-title">Crear Sesión de Encuesta</h3>
          <qz-button
            circle
            size="sm"
            variant="ghost"
            @click="closeModal"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </qz-button>
        </div>

        <div class="qz-modal-body">
          <div class="qz-input-group">
            <label class="qz-input-label">Año Lectivo o Periodo</label>
            <input
              type="number"
              v-model.number="form.year"
              :min="2020"
              :max="2100"
              class="qz-form-input"
            />
          </div>

          <div class="qz-input-group">
            <label class="qz-input-label">Nombre o Etiqueta de la Sesión</label>
            <input
              type="text"
              v-model="form.label"
              placeholder="Ej: Grado 10-A, Sede Principal, Jornada Mañana"
              class="qz-form-input"
              @keyup.enter="createSession"
            />
          </div>

          <qz-button
            block
            size="lg"
            variant="primary"
            @click="createSession"
            :disabled="!form.label || isCreating"
          >
            <ion-icon :icon="saveOutline"></ion-icon>
            <span>{{ isCreating ? "Creando sesión..." : "Guardar y Comenzar" }}</span>
          </qz-button>
        </div>
      </div>
    </ion-modal>
  </ion-page>
</template>

<script>
import {
  IonPage,
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
  createOutline,
  addOutline,
  folderOpenOutline,
  cameraOutline,
  closeOutline,
  saveOutline,
  barChartOutline,
  colorPaletteOutline,
  documentTextOutline,
} from "ionicons/icons";

export default {
  name: "OmrSurveySessionLauncher",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSpinner,
    IonModal,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    const templateId = computed(() => Number(route.params.templateId));
    const template = ref(null);
    const sessions = ref([]);
    const loading = ref(true);
    const showModal = ref(false);
    const isCreating = ref(false);

    const form = ref({
      year: new Date().getFullYear(),
      label: "",
    });

    const sectionCount = computed(() => {
      const cfg = template.value?.questionsConfig;
      if (!cfg || !Array.isArray(cfg.sections)) return 0;
      return cfg.sections.length;
    });

    const goBack = () => router.push("/admin/plantillas-encuestas");

    const openTemplateEditor = () => {
      if (templateId.value) {
        router.push(`/omr-editor/${templateId.value}`);
      }
    };

    const fetchTemplateAndSessions = async () => {
      loading.value = true;
      try {
        tokenHeader();
        // 1. Cargar plantilla
        const tplRes = await axios.get(
          `/surveys/templates/${templateId.value}`,
        );
        template.value = tplRes.data;

        // 2. Cargar sesiones
        await fetchSessions();
      } catch (err) {
        console.error("fetchTemplateAndSessions error:", err);
        const alert = await alertController.create({
          header: "Error",
          message: "No se pudo cargar la información de la plantilla.",
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        loading.value = false;
      }
    };

    const fetchSessions = async () => {
      try {
        tokenHeader();
        const res = await axios.get("/surveys/sessions", {
          params: { templateId: templateId.value },
        });
        sessions.value = res.data || [];
      } catch (err) {
        console.error("fetchSessions error:", err);
      }
    };

    const openNewSessionModal = () => {
      form.value = {
        year: new Date().getFullYear(),
        label: "",
      };
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
    };

    const createSession = async () => {
      if (!form.value.label.trim()) return;

      isCreating.value = true;
      try {
        tokenHeader();
        const payload = {
          templateId: templateId.value,
          year: form.value.year,
          label: form.value.label.trim(),
        };
        const res = await axios.post("/surveys/sessions", payload);
        const newSession = res.data;
        closeModal();
        await fetchSessions();

        // Preguntar si quiere ir directo al escáner
        const alert = await alertController.create({
          header: "Sesión Creada",
          message: `¿Deseas comenzar a escanear respuestas para "${newSession.label}" ahora?`,
          buttons: [
            { text: "Más tarde", role: "cancel" },
            {
              text: "Escanear Ahora",
              handler: () => {
                goToScanner(newSession);
              },
            },
          ],
        });
        await alert.present();
      } catch (err) {
        console.error("createSession error:", err);
        const alert = await alertController.create({
          header: "Error",
          message: "No se pudo crear la sesión.",
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        isCreating.value = false;
      }
    };

    const goToScanner = (session) => {
      // Rutas fijas para templates oficiales
      if (template.value?.slug === "encuesta-estudiantes") {
        router.push(`/omr-encuesta/estudiantes/${session.id}`);
        return;
      }
      if (template.value?.slug === "encuesta-padres") {
        router.push(`/omr-encuesta/padres/${session.id}`);
        return;
      }
      // Para plantillas dinámicas
      router.push({
        path: `/omr-encuesta/dinamica/${template.value?.slug}`,
        query: { sessionId: session.id },
      });
    };

    const goToResults = (session) => {
      router.push({
        path: `/omr-encuesta/resultados/${session.id}`,
      });
    };

    const formatDate = (isoStr) => {
      if (!isoStr) return "";
      try {
        const d = new Date(isoStr);
        return d.toLocaleDateString("es-CO", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return isoStr;
      }
    };

    onMounted(() => {
      fetchTemplateAndSessions();
    });

    return {
      template,
      sessions,
      loading,
      showModal,
      isCreating,
      form,
      sectionCount,
      goBack,
      openTemplateEditor,
      openNewSessionModal,
      closeModal,
      createSession,
      goToScanner,
      goToResults,
      formatDate,
      arrowBackOutline,
      createOutline,
      addOutline,
      folderOpenOutline,
      cameraOutline,
      closeOutline,
      saveOutline,
      barChartOutline,
      colorPaletteOutline,
      documentTextOutline,
    };
  },
};
</script>

<style scoped>
.qz-launcher-page {
  --background: var(--qz-color-bg, #efeefc);
  background-color: var(--qz-color-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-launcher-content {
  --background: var(--qz-color-bg, #efeefc);
}

.qz-launcher-wrapper {
  display: flex;
  flex-direction: column;
  background-color: var(--qz-color-bg, #efeefc);
  box-sizing: border-box;
}

/* HERO HEADER */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 24px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 760px;
  margin: 0 auto;
  padding: 8px 18px 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qz-hero-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 5px 14px;
  border-radius: 9999px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qz-hero-titles {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 18px;
  text-align: left;
}

.qz-hero-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.qz-hero-tag {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
}

.qz-hero-title {
  margin: 2px 0 6px 0;
  font-size: clamp(22px, 3.5vw, 28px);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
  line-height: 1.45;
}

/* MAIN BODY */
.qz-main-body {
  flex: 0 1 auto;
  padding: 16px 16px 20px 16px;
  box-sizing: border-box;
}

.qz-launcher-container {
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

/* QUICK ACTIONS */
.qz-quick-actions-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.qz-quick-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.qz-quick-btn:active {
  transform: scale(0.98);
}

.qz-quick-btn--primary {
  background: linear-gradient(135deg, #6a5ae0 0%, #8374f2 100%);
  color: #ffffff;
  box-shadow: 0 6px 18px rgba(106, 90, 224, 0.3);
}

.qz-quick-btn--ghost {
  background: var(--qz-color-card-bg, #ffffff);
  border: 1.5px solid var(--qz-color-border, rgba(106, 90, 224, 0.15));
  color: var(--qz-color-text-main, #0c092a);
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.04);
}

.qz-quick-btn__icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-quick-btn--primary .qz-quick-btn__icon {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.qz-quick-btn--ghost .qz-quick-btn__icon {
  background: var(--qz-color-purple-light, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-quick-btn__text {
  display: flex;
  flex-direction: column;
}

.qz-quick-btn__title {
  font-size: 14px;
  font-weight: 800;
}

.qz-quick-btn__sub {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}

/* SESSIONS LIST */
.qz-sessions-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-section-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-count-pill {
  background: var(--qz-color-purple-light, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
  font-size: 12px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 9999px;
}

.qz-sessions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-session-card {
  background: var(--qz-color-card-bg, #ffffff);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  border-radius: 20px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.04);
}

.qz-session-card:active {
  transform: scale(0.98);
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

.qz-session-details {
  flex: 1;
  min-width: 0;
}

.qz-session-name {
  font-size: 15px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qz-session-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-meta-tag {
  background: #e8f8f0;
  color: #05a660;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
}

.qz-meta-dot {
  font-size: 10px;
}

.qz-session-badge-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

/* EMPTY STATE */
.qz-empty-card {
  background: var(--qz-color-card-bg, #ffffff);
  border: 1px dashed var(--qz-color-border, rgba(106, 90, 224, 0.2));
  border-radius: 24px;
  padding: 32px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.qz-empty-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--qz-color-purple-light, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.qz-empty-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0;
}

.qz-empty-desc {
  font-size: 13px;
  color: var(--qz-color-text-muted, #858494);
  max-width: 400px;
  margin: 0;
  line-height: 1.45;
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

/* ==========================================================================
   DARK MODE OVERRIDES
   ========================================================================== */
body.dark .qz-launcher-page,
html.dark .qz-launcher-page,
.dark .qz-launcher-page {
  --background: #110d26;
  background-color: #110d26;
}

body.dark .qz-launcher-content,
html.dark .qz-launcher-content,
.dark .qz-launcher-content {
  --background: #110d26;
}

body.dark .qz-launcher-wrapper,
html.dark .qz-launcher-wrapper,
.dark .qz-launcher-wrapper {
  background-color: #110d26;
}

body.dark .qz-card,
html.dark .qz-card,
.dark .qz-card,
body.dark .qz-session-card,
html.dark .qz-session-card,
.dark .qz-session-card,
body.dark .qz-empty-card,
html.dark .qz-empty-card,
.dark .qz-empty-card,
body.dark .qz-modal-content,
html.dark .qz-modal-content,
.dark .qz-modal-content {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

body.dark .qz-section-title,
html.dark .qz-section-title,
.dark .qz-section-title,
body.dark .qz-session-name,
html.dark .qz-session-name,
.dark .qz-session-name,
body.dark .qz-empty-title,
html.dark .qz-empty-title,
.dark .qz-empty-title,
body.dark .qz-modal-title,
html.dark .qz-modal-title,
.dark .qz-modal-title,
body.dark .qz-input-label,
html.dark .qz-input-label,
.dark .qz-input-label {
  color: #f7f7fd;
}

body.dark .qz-quick-btn--ghost,
html.dark .qz-quick-btn--ghost,
.dark .qz-quick-btn--ghost {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.1);
  color: #f7f7fd;
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

body.dark .qz-session-icon-wrap,
html.dark .qz-session-icon-wrap,
.dark .qz-session-icon-wrap,
body.dark .qz-count-pill,
html.dark .qz-count-pill,
.dark .qz-count-pill,
body.dark .qz-count-badge,
html.dark .qz-count-badge,
.dark .qz-count-badge,
body.dark .qz-empty-icon-circle,
html.dark .qz-empty-icon-circle,
.dark .qz-empty-icon-circle {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

@media (prefers-color-scheme: dark) {
  .qz-launcher-page {
    --background: #110d26;
    background-color: #110d26;
  }

  .qz-launcher-content {
    --background: #110d26;
  }

  .qz-launcher-wrapper {
    background-color: #110d26;
  }

  .qz-card,
  .qz-session-card,
  .qz-empty-card,
  .qz-modal-content {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .qz-section-title,
  .qz-session-name,
  .qz-empty-title,
  .qz-modal-title,
  .qz-input-label {
    color: #f7f7fd;
  }

  .qz-quick-btn--ghost {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.1);
    color: #f7f7fd;
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

  .qz-session-icon-wrap,
  .qz-count-pill,
  .qz-count-badge,
  .qz-empty-icon-circle {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
