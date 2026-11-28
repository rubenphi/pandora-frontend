<template>
  <ion-page class="ion-page qz-template-manager-page">
    <!-- CABECERA HERO QUEEZY PÚRPURA -->
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
          <ion-icon :icon="colorPaletteOutline"></ion-icon>
          <span>Plantillas OMR</span>
        </div>

        <qz-button
          circle
          variant="translucent"
          title="Crear en Editor Visual"
          @click="goToVisualCreator"
        >
          <ion-icon :icon="addOutline"></ion-icon>
        </qz-button>
      </div>

      <div class="qz-hero-titles">
        <div class="qz-hero-badge-row">
          <span class="qz-hero-tag">SISTEMA DE EVALUACIÓN OMR</span>
        </div>
        <h1 class="qz-hero-title">Plantillas de Encuestas</h1>
        <p class="qz-hero-subtitle">
          Gestión, diseño visual y configuración de formatos y hojas de respuesta OMR.
        </p>
      </div>
    </header>

    <ion-content class="qz-content-wrap">
      <div class="qz-container">
        <!-- Acciones Rápidas -->
        <div class="qz-quick-actions-row">
          <button
            type="button"
            class="qz-quick-btn qz-quick-btn--primary"
            @click="goToVisualCreator"
          >
            <div class="qz-quick-btn__icon">
              <ion-icon :icon="colorPaletteOutline"></ion-icon>
            </div>
            <div class="qz-quick-btn__text">
              <span class="qz-quick-btn__title">Diseñar en Editor Visual</span>
              <span class="qz-quick-btn__sub">Crear nueva plantilla personalizada desde cero</span>
            </div>
          </button>
        </div>

        <div v-if="loading" class="qz-empty-card">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="qz-empty-desc">Cargando plantillas...</p>
        </div>

        <div v-else-if="templates.length === 0" class="qz-empty-card">
          <p class="qz-empty-desc">
            No hay plantillas de encuesta registradas. Diseña una nueva para
            comenzar.
          </p>
        </div>

        <!-- Lista de Tarjetas de Plantillas -->
        <div v-else class="qz-templates-grid">
          <div
            v-for="tpl in templates"
            :key="tpl.id"
            class="qz-card qz-template-card"
          >
            <div class="qz-card-header-row">
              <div>
                <div class="qz-tag-row">
                  <span
                    v-if="isSystemTemplate(tpl)"
                    class="qz-tag qz-tag--warning"
                    >Sistema / Oficial</span
                  >
                  <span
                    v-else
                    class="qz-tag"
                    :class="tpl.active ? 'qz-tag--success' : 'qz-tag--neutral'"
                  >
                    {{ tpl.active ? "Activa" : "Inactiva" }}
                  </span>
                  <span class="qz-tag qz-tag--purple">v{{ tpl.version }}</span>
                </div>
                <h3 class="qz-card-title">{{ tpl.name }}</h3>
                <span class="qz-card-subtitle">
                  Plantilla ID #{{ tpl.id }} &bull;
                  {{ sectionCount(tpl.questionsConfig) }} secciones
                </span>
              </div>
            </div>

            <div class="qz-card-footer">
              <div class="qz-btn-group">
                <!-- Editor Visual -->
                <qz-button
                  size="sm"
                  pill
                  variant="primary"
                  @click="openVisualEditor(tpl)"
                  title="Abrir editor visual"
                >
                  <ion-icon :icon="colorPaletteOutline"></ion-icon>
                  <span>Editor Visual</span>
                </qz-button>

                <!-- Sesiones / Escanear -->
                <qz-button
                  size="sm"
                  pill
                  variant="ghost"
                  @click="openSessions(tpl)"
                  title="Ver sesiones y escanear"
                >
                  <ion-icon :icon="scanOutline"></ion-icon>
                  <span>Sesiones / Escanear</span>
                </qz-button>

                <!-- Eliminar -->
                <qz-button
                  v-if="!isSystemTemplate(tpl)"
                  size="sm"
                  pill
                  variant="danger"
                  @click="confirmDelete(tpl)"
                  title="Eliminar plantilla"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                  <span>Eliminar</span>
                </qz-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-modal :is-open="showModal" @did-dismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{
            editingTemplate
              ? isSystemTemplate(editingTemplate)
                ? "Ver plantilla del sistema"
                : "Editar plantilla"
              : "Nueva plantilla"
          }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div
          v-if="editingTemplate && isSystemTemplate(editingTemplate)"
          class="system-warning ion-padding ion-margin-bottom"
        >
          <strong>Atención:</strong> Esta es una plantilla base protegida
          requerida por la evaluación docente oficial. Sus propiedades están en
          modo solo lectura.
        </div>

        <ion-list>
          <ion-item>
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input
              v-model="form.name"
              :readonly="editingTemplate && isSystemTemplate(editingTemplate)"
              placeholder="Ej: Encuesta a Padres"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Slug (identificador único)</ion-label>
            <ion-input
              v-model="form.slug"
              :readonly="Boolean(editingTemplate)"
              placeholder="Ej: parent-survey"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Activo</ion-label>
            <ion-toggle
              v-model="form.active"
              :disabled="editingTemplate && isSystemTemplate(editingTemplate)"
              slot="end"
            ></ion-toggle>
          </ion-item>
        </ion-list>

        <ion-item lines="none" class="ion-margin-top">
          <ion-label class="section-title">
            <strong>Configuración de preguntas (JSON)</strong>
          </ion-label>
        </ion-item>
        <p class="ion-padding-start ion-text-small ion-margin-bottom">
          Define la estructura de secciones, tipos de pregunta y opciones.
        </p>
        <ion-textarea
          v-model="form.questionsConfigRaw"
          :auto-grow="true"
          :readonly="editingTemplate && isSystemTemplate(editingTemplate)"
          rows="12"
          class="json-editor"
          placeholder='{"sections": [...]}'
        ></ion-textarea>

        <ion-button
          v-if="!editingTemplate || !isSystemTemplate(editingTemplate)"
          expand="block"
          color="primary"
          @click="saveTemplate"
          :disabled="!form.name || !form.slug"
          class="ion-margin-top"
        >
          <ion-icon :icon="saveOutline" slot="start"></ion-icon>
          {{ editingTemplate ? "Actualizar" : "Crear" }}
        </ion-button>
      </ion-content>
    </ion-modal>
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
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonTextarea,
  IonSpinner,
  alertController,
  IonModal,
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { tokenHeader } from "../globalService";
import {
  arrowBackOutline,
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  saveOutline,
  colorPaletteOutline,
  codeOutline,
  scanOutline,
} from "ionicons/icons";
import { SYSTEM_RESERVED_SLUGS } from "@/components/omr/editor/composables/useOmrEditorState.js";

export default {
  name: "SurveyTemplateManager",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonToggle,
    IonTextarea,
    IonSpinner,
    IonModal,
  },
  setup() {
    const router = useRouter();
    const templates = ref([]);
    const loading = ref(true);
    const showModal = ref(false);
    const editingTemplate = ref(null);

    const form = ref({
      name: "",
      slug: "",
      active: true,
      questionsConfigRaw: JSON.stringify(
        {
          sections: [
            {
              id: "seccion1",
              title: "Sección 1",
              type: "likert",
              options: ["Nunca", "Algunas veces", "Casi siempre", "Siempre"],
              count: 5,
            },
          ],
        },
        null,
        2,
      ),
    });

    const isSystemTemplate = (tpl) => {
      if (!tpl || !tpl.slug) return false;
      return SYSTEM_RESERVED_SLUGS.includes(tpl.slug);
    };

    const goBack = () => router.back();

    const goToVisualCreator = () => {
      router.push("/omr-editor");
    };

    const openVisualEditor = (tpl) => {
      router.push(`/omr-editor/${tpl.id}`);
    };

    const openSessions = (tpl) => {
      router.push(`/omr-encuesta/sesiones/${tpl.id}`);
    };

    const fetchTemplates = async () => {
      loading.value = true;
      try {
        tokenHeader();
        const res = await axios.get("/surveys/templates");
        templates.value = res.data || [];
      } catch {
        templates.value = [];
      } finally {
        loading.value = false;
      }
    };

    const sectionCount = (config) => {
      if (!config || !config.sections) return 0;
      return config.sections.length;
    };

    const openCreateModal = () => {
      editingTemplate.value = null;
      form.value = {
        name: "",
        slug: "",
        active: true,
        questionsConfigRaw: JSON.stringify(
          {
            sections: [
              {
                id: "seccion1",
                title: "Sección 1",
                type: "likert",
                options: ["Nunca", "Algunas veces", "Casi siempre", "Siempre"],
                count: 5,
              },
            ],
          },
          null,
          2,
        ),
      };
      showModal.value = true;
    };

    const openEditModal = (tpl) => {
      editingTemplate.value = tpl;
      form.value = {
        name: tpl.name,
        slug: tpl.slug,
        active: tpl.active,
        questionsConfigRaw: JSON.stringify(tpl.questionsConfig, null, 2),
      };
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
      editingTemplate.value = null;
    };

    const saveTemplate = async () => {
      if (editingTemplate.value && isSystemTemplate(editingTemplate.value)) {
        const alert = await alertController.create({
          header: "Acción no permitida",
          message:
            "Las plantillas del sistema están protegidas y no pueden modificarse.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      if (
        SYSTEM_RESERVED_SLUGS.includes(form.value.slug) &&
        (!editingTemplate.value ||
          editingTemplate.value.slug !== form.value.slug)
      ) {
        const alert = await alertController.create({
          header: "Slug Reservado",
          message: `El slug '${form.value.slug}' está reservado para las encuestas del sistema.`,
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      let questionsConfig;
      try {
        questionsConfig = JSON.parse(form.value.questionsConfigRaw);
      } catch {
        const alert = await alertController.create({
          header: "Error",
          message: "El JSON de configuración no es válido. Revise la sintaxis.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      const payload = {
        name: form.value.name,
        slug: form.value.slug,
        questionsConfig,
      };
      if (editingTemplate.value) {
        payload.active = form.value.active;
      }

      try {
        tokenHeader();
        if (editingTemplate.value) {
          await axios.patch(
            `/surveys/templates/${editingTemplate.value.id}`,
            payload,
          );
        } else {
          await axios.post("/surveys/templates", payload);
        }
        closeModal();
        await fetchTemplates();
      } catch (error) {
        let msg = "Error al guardar la plantilla.";
        if (error.response?.status === 409) {
          msg = "Ya existe una plantilla con ese slug.";
        } else if (error.response?.data?.message) {
          msg = error.response.data.message;
        }
        const alert = await alertController.create({
          header: "Error",
          message: msg,
          buttons: ["OK"],
        });
        await alert.present();
      }
    };

    const confirmDelete = async (tpl) => {
      if (isSystemTemplate(tpl)) {
        const alert = await alertController.create({
          header: "Acción no permitida",
          message:
            "Las plantillas del sistema están protegidas por ley y no pueden eliminarse.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      const alert = await alertController.create({
        header: "Eliminar plantilla",
        message: `¿Está seguro de eliminar "${tpl.name}"? Las respuestas asociadas también se eliminarán.`,
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Eliminar",
            role: "destructive",
            handler: async () => {
              try {
                tokenHeader();
                await axios.delete(`/surveys/templates/${tpl.id}`);
                await fetchTemplates();
              } catch {
                const errAlert = await alertController.create({
                  header: "Error",
                  message: "No se pudo eliminar la plantilla.",
                  buttons: ["OK"],
                });
                await errAlert.present();
              }
            },
          },
        ],
      });
      await alert.present();
    };

    onMounted(() => {
      fetchTemplates();
    });

    onIonViewWillEnter(() => {
      fetchTemplates();
    });

    return {
      templates,
      loading,
      showModal,
      editingTemplate,
      form,
      isSystemTemplate,
      goToVisualCreator,
      openVisualEditor,
      openSessions,
      goBack,
      fetchTemplates,
      sectionCount,
      openCreateModal,
      openEditModal,
      closeModal,
      saveTemplate,
      confirmDelete,
      arrowBackOutline,
      addOutline,
      createOutline,
      trashOutline,
      closeOutline,
      saveOutline,
      colorPaletteOutline,
      codeOutline,
      scanOutline,
    };
  },
};
</script>

<style scoped>
/* Base Page & Content */
.qz-template-manager-page {
  --background: var(--qz-color-bg, #efeefc);
  background-color: var(--qz-color-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-content-wrap {
  --background: var(--qz-color-bg, #efeefc);
}

/* HERO HEADER */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 24px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 900px;
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
}

.qz-hero-titles {
  max-width: 900px;
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

/* QUICK ACTIONS */
.qz-quick-actions-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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

.qz-quick-btn__icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
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

/* CONTAINER */
.qz-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px 60px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* HERO ACTION CARD */
.qz-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(106, 90, 224, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.qz-action-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%);
  border: 1.5px solid rgba(106, 90, 224, 0.15);
}

.qz-hero-text {
  flex: 1;
  min-width: 250px;
}

.qz-hero-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
}

.qz-hero-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

.qz-hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.qz-btn-main {
  background: linear-gradient(135deg, #6a5ae0 0%, #7c6ef2 100%);
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 10px 20px;
  font-size: 14px;
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

.qz-btn-outline {
  background: #ffffff;
  color: #6a5ae0;
  border: 1.5px solid rgba(106, 90, 224, 0.3);
  border-radius: 9999px;
  padding: 10px 18px;
  font-size: 14px;
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

/* EMPTY / LOADING */
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

/* GRID & CARDS */
.qz-templates-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.qz-template-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.qz-template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(106, 90, 224, 0.08);
}

.qz-card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.qz-tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
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

.qz-tag--warning {
  background: #fffbeb;
  color: #d97706;
}

.qz-tag--neutral {
  background: #f1f5f9;
  color: #64748b;
}

.qz-card-title {
  margin: 0 0 4px 0;
  font-size: 16px;
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

.qz-card-footer {
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.qz-btn-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.qz-btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.qz-btn-action--primary {
  background: #efeefc;
  color: #6a5ae0;
  border-color: rgba(106, 90, 224, 0.2);
}

.qz-btn-action--primary:hover {
  background: #6a5ae0;
  color: #ffffff;
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

.qz-btn-action--ghost {
  background: #f8fafc;
  color: #475569;
  border-color: #e2e8f0;
}

.qz-btn-action--ghost:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.qz-btn-action--danger {
  background: #fef2f2;
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.qz-btn-action--danger:hover {
  background: #ef4444;
  color: #ffffff;
}

/* SYSTEM WARNING & JSON EDITOR IN MODAL */
.system-warning {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 0.9em;
}

.json-editor {
  font-family: monospace;
  font-size: 0.85em;
  background: var(--ion-color-light);
  border-radius: 4px;
  --padding-start: 8px;
  --padding-end: 8px;
}

/* ==========================================================================
   DARK MODE OVERRIDES
   ========================================================================== */
body.dark .qz-template-manager-page,
html.dark .qz-template-manager-page,
.dark .qz-template-manager-page,
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
body.dark .qz-card-title,
html.dark .qz-card-title,
.dark .qz-card-title,
body.dark .qz-hero-title,
html.dark .qz-hero-title,
.dark .qz-hero-title {
  color: #f7f7fd;
}

body.dark .qz-top-bar__subtitle,
html.dark .qz-top-bar__subtitle,
.dark .qz-top-bar__subtitle,
body.dark .qz-card-subtitle,
html.dark .qz-card-subtitle,
.dark .qz-card-subtitle,
body.dark .qz-hero-desc,
html.dark .qz-hero-desc,
.dark .qz-hero-desc,
body.dark .qz-empty-box,
html.dark .qz-empty-box,
.dark .qz-empty-box {
  color: #9e9bb8;
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
.dark .qz-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

body.dark .qz-action-hero,
html.dark .qz-action-hero,
.dark .qz-action-hero {
  background: linear-gradient(135deg, #1d1838 0%, #252048 100%);
  border-color: rgba(124, 110, 242, 0.25);
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

body.dark .qz-tag--warning,
html.dark .qz-tag--warning,
.dark .qz-tag--warning {
  background: #332410;
  color: #fbbf24;
}

body.dark .qz-tag--neutral,
html.dark .qz-tag--neutral,
.dark .qz-tag--neutral {
  background: #252048;
  color: #9e9bb8;
}

body.dark .qz-card-subtitle code,
html.dark .qz-card-subtitle code,
.dark .qz-card-subtitle code {
  background: #252048;
  color: #c0b7ff;
}

body.dark .qz-card-footer,
html.dark .qz-card-footer,
.dark .qz-card-footer {
  border-top-color: rgba(255, 255, 255, 0.08);
}

body.dark .qz-btn-action--primary,
html.dark .qz-btn-action--primary,
.dark .qz-btn-action--primary {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-btn-action--primary:hover,
html.dark .qz-btn-action--primary:hover,
.dark .qz-btn-action--primary:hover {
  background: #6a5ae0;
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

body.dark .qz-btn-action--ghost,
html.dark .qz-btn-action--ghost,
.dark .qz-btn-action--ghost {
  background: #231d42;
  color: #9e9bb8;
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-btn-action--ghost:hover,
html.dark .qz-btn-action--ghost:hover,
.dark .qz-btn-action--ghost:hover {
  background: #2e2858;
  color: #f7f7fd;
}

body.dark .qz-btn-action--danger,
html.dark .qz-btn-action--danger,
.dark .qz-btn-action--danger {
  background: #2d1822;
  color: #ff6b6b;
  border-color: rgba(255, 107, 107, 0.2);
}

body.dark .qz-btn-action--danger:hover,
html.dark .qz-btn-action--danger:hover,
.dark .qz-btn-action--danger:hover {
  background: #ef4444;
  color: #ffffff;
}
</style>
