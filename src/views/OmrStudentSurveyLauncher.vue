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
              <ion-icon :icon="peopleOutline"></ion-icon>
              <span>Encuestas Estudiantes</span>
            </div>

            <qz-button
              circle
              variant="translucent"
              title="Crear Nueva Sesión"
              @click="showCreateModal = true"
            >
              <ion-icon :icon="addOutline"></ion-icon>
            </qz-button>
          </div>

          <div class="qz-hero-titles">
            <div class="qz-hero-badge-row">
              <span class="qz-hero-tag">LECTOR ÓPTICO OMR</span>
            </div>
            <h1 class="qz-hero-title">Sesiones de Encuesta</h1>
            <p class="qz-hero-subtitle">
              Seleccione una sesión de aplicación para registrar hojas de
              estudiantes o cree una nueva sesión.
            </p>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-main-body">
          <div class="qz-launcher-container">
            <!-- BARRA DE FILTRO POR AÑO -->
            <div class="qz-card qz-filter-card">
              <div class="qz-filter-row">
                <div class="qz-filter-field">
                  <span class="qz-filter-label">Año Lectivo:</span>
                  <div class="qz-year-pill">
                    <ion-icon :icon="calendarOutline"></ion-icon>
                    <input
                      type="number"
                      v-model.number="year"
                      :min="2020"
                      :max="2100"
                      class="qz-year-input"
                      @change="fetchSessions"
                    />
                  </div>
                </div>
                <qz-button
                  pill
                  size="sm"
                  variant="primary"
                  @click="fetchSessions"
                  title="Buscar sesiones"
                >
                  <ion-icon :icon="searchOutline"></ion-icon>
                  <span>Buscar</span>
                </qz-button>
              </div>
            </div>

            <!-- BOTONES DE ACCIÓN RÁPIDA -->
            <div class="qz-quick-actions-row">
              <button
                type="button"
                class="qz-quick-btn qz-quick-btn--primary"
                @click="showCreateModal = true"
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
                @click="enterGeneralSession"
              >
                <div class="qz-quick-btn__icon">
                  <ion-icon :icon="scanOutline"></ion-icon>
                </div>
                <div class="qz-quick-btn__text">
                  <span class="qz-quick-btn__title">Escaneo General</span>
                  <span class="qz-quick-btn__sub">Sin asignar a sesión</span>
                </div>
              </button>
            </div>

            <!-- LISTADO DE SESIONES -->
            <div class="qz-sessions-section">
              <div class="qz-section-title-row">
                <h3 class="qz-section-title">
                  Sesiones del Año {{ year }}
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
                  @click="enterSession(s)"
                >
                  <div class="qz-session-icon-wrap">
                    <ion-icon :icon="documentTextOutline"></ion-icon>
                  </div>
                  <div class="qz-session-details">
                    <h4 class="qz-session-name">{{ s.label }}</h4>
                    <div class="qz-session-meta">
                      <span class="qz-meta-tag">{{ s.year }}</span>
                      <span class="qz-meta-dot">&bull;</span>
                      <span class="qz-meta-date"
                        >Creada {{ formatDate(s.createdAt) }}</span
                      >
                    </div>
                  </div>
                  <div class="qz-session-badge-wrap">
                    <span class="qz-count-badge">
                      {{ s.responseCount || 0 }} hojas
                    </span>
                    <button
                      type="button"
                      class="qz-session-edit-btn"
                      title="Modificar nombre o año"
                      @click.stop="openEditModal(s)"
                    >
                      <ion-icon :icon="createOutline"></ion-icon>
                    </button>
                    <button
                      type="button"
                      class="qz-session-edit-btn"
                      title="Modificar nombre o año"
                      @click.stop="openEditModal(s)"
                    >
                      <ion-icon :icon="createOutline"></ion-icon>
                    </button>
                    <ion-icon
                      :icon="chevronForwardOutline"
                      class="qz-chevron"
                    ></ion-icon>
                  </div>
                </div>
              </div>

              <!-- ESTADO VACÍO -->
              <div v-else-if="searched" class="qz-empty-card">
                <div class="qz-empty-icon-circle">
                  <ion-icon :icon="folderOpenOutline"></ion-icon>
                </div>
                <h4 class="qz-empty-title">No hay sesiones para {{ year }}</h4>
                <p class="qz-empty-desc">
                  No se encontraron sesiones registradas para este año lectivo.
                  Presione <strong>Nueva Sesión</strong> para comenzar.
                </p>
                <qz-button
                  pill
                  size="md"
                  variant="primary"
                  @click="showCreateModal = true"
                >
                  <ion-icon :icon="addOutline"></ion-icon>
                  <span>Crear Sesión {{ year }}</span>
                </qz-button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>

    <!-- MODAL QUEEZY PARA NUEVA SESIÓN -->
    <ion-modal
      :is-open="showCreateModal"
      @did-dismiss="showCreateModal = false"
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
            @click="showCreateModal = false"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </qz-button>
        </div>

        <div class="qz-modal-body">
          <div class="qz-input-group">
            <label class="qz-input-label">Año Lectivo</label>
            <input
              type="number"
              v-model.number="createYear"
              :min="2020"
              :max="2100"
              class="qz-form-input"
            />
          </div>

          <div class="qz-input-group">
            <label class="qz-input-label">Nombre o Etiqueta de la Sesión</label>
            <input
              type="text"
              v-model="createLabel"
              placeholder="Ej: Primer Semestre 2026, Grado 10°, etc."
              class="qz-form-input"
              @keyup.enter="createSession"
            />
          </div>

          <qz-button
            block
            size="lg"
            variant="primary"
            @click="createSession"
            :disabled="!createLabel || !createYear"
          >
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span>Crear y Abrir Sesión</span>
          </qz-button>
        </div>
      </div>
    </ion-modal>

    <!-- MODAL QUEEZY PARA MODIFICAR SESIÓN -->
    <ion-modal
      :is-open="showEditModal"
      @did-dismiss="closeEditModal"
      class="qz-session-modal"
    >
      <div class="qz-modal-content">
        <div class="qz-modal-header">
          <div class="qz-modal-badge">MODIFICAR SESIÓN</div>
          <h3 class="qz-modal-title">Editar Sesión de Estudiantes</h3>
          <qz-button
            circle
            size="sm"
            variant="ghost"
            @click="closeEditModal"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </qz-button>
        </div>

        <div class="qz-modal-body">
          <div class="qz-input-group">
            <label class="qz-input-label">Año Lectivo</label>
            <input
              type="number"
              v-model.number="editYear"
              :min="2020"
              :max="2100"
              class="qz-form-input"
            />
          </div>

          <div class="qz-input-group">
            <label class="qz-input-label">Nombre o Etiqueta de la Sesión</label>
            <input
              type="text"
              v-model="editLabel"
              placeholder="Ej: Primer Semestre 2026, Grado 10°, etc."
              class="qz-form-input"
              @keyup.enter="updateSession"
            />
          </div>

          <qz-button
            block
            size="lg"
            variant="primary"
            @click="updateSession"
            :disabled="!editLabel || !editYear || isUpdatingSession"
          >
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span>Guardar Cambios</span>
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
  IonModal,
  alertController,
} from "@ionic/vue";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { tokenHeader, selectedYear } from "../globalService";
import {
  arrowBackOutline,
  addOutline,
  closeOutline,
  checkmarkOutline,
  searchOutline,
  calendarOutline,
  peopleOutline,
  scanOutline,
  documentTextOutline,
  chevronForwardOutline,
  folderOpenOutline,
  createOutline,
} from "ionicons/icons";

export default {
  name: "OmrStudentSurveyLauncher",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonModal,
  },
  setup() {
    const router = useRouter();
    const templateId = ref(null);
    const year = ref(selectedYear());
    const createYear = ref(selectedYear());
    const createLabel = ref("");
    const sessions = ref([]);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const editingSession = ref(null);
    const editYear = ref(selectedYear());
    const editLabel = ref("");
    const isUpdatingSession = ref(false);
    const searched = ref(false);

    const goBack = () => router.back();

    const loadTemplate = async () => {
      try {
        tokenHeader();
        const res = await axios.get("/surveys/templates", {
          params: { slug: "student-survey" },
        });
        if (res.data && res.data.length > 0) {
          templateId.value = res.data[0].id;
        } else {
          try {
            const createRes = await axios.post("/surveys/templates", {
              name: "Encuesta a Estudiantes",
              slug: "student-survey",
              active: true,
            });
            templateId.value = createRes.data.id;
          } catch {
            // Ignorar errores al auto-crear
          }
        }
      } catch (err) {
        console.error("loadTemplate error:", err.response?.data || err.message);
      }
    };

    const fetchSessions = async () => {
      if (!templateId.value) return;
      searched.value = true;
      try {
        tokenHeader();
        const res = await axios.get("/surveys/sessions", {
          params: { templateId: templateId.value, year: Number(year.value) },
        });
        const data = res.data || [];

        const sessionIds = data.map((s) => s.id);
        const responseCounts = {};
        if (sessionIds.length > 0) {
          try {
            const allRes = await axios.get("/surveys/responses", {
              params: { templateId: templateId.value },
            });
            const responses = allRes.data || [];
            for (const r of responses) {
              if (r.session?.id) {
                responseCounts[r.session.id] =
                  (responseCounts[r.session.id] || 0) + 1;
              }
            }
          } catch {
            // ignorar errores
          }
        }

        sessions.value = data.map((s) => ({
          ...s,
          responseCount: responseCounts[s.id] || 0,
        }));
      } catch (err) {
        console.error(
          "fetchSessions error:",
          err.response?.data || err.message,
        );
        sessions.value = [];
      }
    };

    const createSession = async () => {
      if (!templateId.value || !createLabel.value || !createYear.value) return;

      try {
        tokenHeader();
        const res = await axios.post("/surveys/sessions", {
          templateId: templateId.value,
          year: Number(createYear.value),
          label: createLabel.value,
        });
        const created = res.data;
        createLabel.value = "";
        showCreateModal.value = false;
        if (created?.id) {
          router.push(`/omr-encuesta/estudiantes/${created.id}`);
        } else {
          year.value = Number(createYear.value);
          await fetchSessions();
        }
      } catch (err) {
        console.error(
          "createSession error:",
          err.response?.data || err.message,
        );
      }
    };

    const blurActiveElement = () => {
      if (
        document.activeElement &&
        typeof document.activeElement.blur === "function"
      ) {
        document.activeElement.blur();
      }
    };

    const openEditModal = (session) => {
      blurActiveElement();
      editingSession.value = session;
      editYear.value = session.year;
      editLabel.value = session.label;
      showEditModal.value = true;
    };

    const closeEditModal = () => {
      showEditModal.value = false;
      editingSession.value = null;
      editLabel.value = "";
    };

    const updateSession = async () => {
      if (
        !editingSession.value ||
        !editLabel.value?.trim() ||
        !editYear.value ||
        isUpdatingSession.value
      ) {
        return;
      }

      isUpdatingSession.value = true;
      try {
        tokenHeader();
        const payload = {
          year: Number(editYear.value),
          label: editLabel.value.trim(),
        };
        const res = await axios.patch(
          `/surveys/sessions/${editingSession.value.id}`,
          payload,
        );
        const updated = res.data;

        // Actualizar en la lista local si existe
        const idx = sessions.value.findIndex(
          (s) => s.id === editingSession.value.id,
        );
        if (idx !== -1) {
          sessions.value[idx] = {
            ...sessions.value[idx],
            year: updated.year,
            label: updated.label,
          };
        }

        // Si el año cambió respecto al filtro actual de la vista, sincronizar año y recargar
        if (Number(editYear.value) !== Number(year.value)) {
          year.value = Number(editYear.value);
          await fetchSessions();
        }

        closeEditModal();

        const alert = await alertController.create({
          header: "Sesión Actualizada",
          message: "Los datos de la sesión se han modificado exitosamente.",
          buttons: ["Aceptar"],
        });
        await alert.present();
      } catch (err) {
        console.error(
          "updateSession error:",
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

    const enterSession = (session) => {
      blurActiveElement();
      router.push(`/omr-encuesta/estudiantes/${session.id}`);
    };

    const enterGeneralSession = () => {
      blurActiveElement();
      router.push("/omr-encuesta/estudiantes/general");
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString();
    };

    onMounted(async () => {
      await loadTemplate();
      if (templateId.value) {
        await fetchSessions();
      }
    });

    return {
      templateId,
      year,
      createYear,
      createLabel,
      sessions,
      showCreateModal,
      showEditModal,
      editYear,
      editLabel,
      isUpdatingSession,
      searched,
      goBack,
      fetchSessions,
      createSession,
      openEditModal,
      closeEditModal,
      updateSession,
      enterSession,
      enterGeneralSession,
      formatDate,
      arrowBackOutline,
      addOutline,
      closeOutline,
      checkmarkOutline,
      searchOutline,
      calendarOutline,
      peopleOutline,
      scanOutline,
      documentTextOutline,
      chevronForwardOutline,
      folderOpenOutline,
      createOutline,
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

.qz-back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: 9999px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
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
}

.qz-action-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: 9999px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.qz-action-btn:active {
  transform: scale(0.92);
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

/* FILTER CARD */
.qz-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qz-filter-field {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.qz-filter-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  white-space: nowrap;
}

.qz-year-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--qz-color-purple-light, #efeefc);
  border: 1px solid rgba(106, 90, 224, 0.2);
  border-radius: 9999px;
  padding: 6px 14px;
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-year-input {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 800;
  color: var(--qz-color-purple-primary, #6a5ae0);
  width: 60px;
  outline: none;
}

.qz-btn-search {
  background: var(--qz-color-purple-primary, #6a5ae0);
  border: none;
  color: #ffffff;
  border-radius: 9999px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.qz-btn-search:active {
  transform: scale(0.95);
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

.qz-session-edit-btn {
  background: var(--qz-color-purple-light, #efeefc);
  border: 1px solid rgba(106, 90, 224, 0.2);
  color: var(--qz-color-purple-primary, #6a5ae0);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.qz-session-edit-btn:hover {
  background: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
}

.qz-session-edit-btn {
  background: var(--qz-color-purple-light, #efeefc);
  border: 1px solid rgba(106, 90, 224, 0.2);
  color: var(--qz-color-purple-primary, #6a5ae0);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.qz-session-edit-btn:hover {
  background: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
}

.qz-chevron {
  font-size: 18px;
  color: var(--qz-color-text-muted, #858494);
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

.qz-btn-create-empty {
  margin-top: 8px;
  background: var(--qz-color-purple-primary, #6a5ae0);
  border: none;
  color: #ffffff;
  border-radius: 9999px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
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

.qz-modal-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qz-modal-submit-btn:active:not(:disabled) {
  transform: scale(0.98);
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

body.dark .qz-filter-label,
html.dark .qz-filter-label,
.dark .qz-filter-label,
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

body.dark .qz-year-input,
html.dark .qz-year-input,
.dark .qz-year-input {
  background: transparent;
  color: #f7f7fd;
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
body.dark .qz-session-edit-btn,
html.dark .qz-session-edit-btn,
.dark .qz-session-edit-btn,
body.dark .qz-year-pill,
html.dark .qz-year-pill,
.dark .qz-year-pill,
body.dark .qz-empty-icon-circle,
html.dark .qz-empty-icon-circle,
.dark .qz-empty-icon-circle,
body.dark .qz-modal-close-btn,
html.dark .qz-modal-close-btn,
.dark .qz-modal-close-btn {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-session-edit-btn:hover,
html.dark .qz-session-edit-btn:hover,
.dark .qz-session-edit-btn:hover {
  background: #7c6ef2;
  color: #ffffff;
}

body.dark .qz-session-edit-btn:hover,
html.dark .qz-session-edit-btn:hover,
.dark .qz-session-edit-btn:hover {
  background: #7c6ef2;
  color: #ffffff;
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

  .qz-filter-label,
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

  .qz-year-input {
    background: transparent;
    color: #f7f7fd;
  }

  .qz-session-icon-wrap,
  .qz-count-pill,
  .qz-count-badge,
  .qz-session-edit-btn,
  .qz-year-pill,
  .qz-empty-icon-circle,
  .qz-modal-close-btn {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-session-edit-btn:hover {
    background: #7c6ef2;
    color: #ffffff;
  }

  .qz-session-edit-btn:hover {
    background: #7c6ef2;
    color: #ffffff;
  }
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

  .qz-filter-label,
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

  .qz-year-input {
    background: transparent;
    color: #f7f7fd;
  }

  .qz-session-icon-wrap,
  .qz-count-pill,
  .qz-count-badge,
  .qz-year-pill,
  .qz-empty-icon-circle,
  .qz-modal-close-btn {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
