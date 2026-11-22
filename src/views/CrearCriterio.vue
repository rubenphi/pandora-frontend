<template>
  <ion-page class="ion-page qz-criteria-page">
    <!-- BARRA SUPERIOR FIJA QUEEZY (Permanece anclada sin cortarse) -->
    <ion-header class="ion-no-border qz-sticky-header">
      <div class="qz-hero-top">
        <!-- Botón Volver -->
        <button
          type="button"
          class="qz-back-btn"
          title="Volver a la actividad"
          @click="goBack"
        >
          <ion-icon :icon="arrowBackOutline"></ion-icon>
        </button>

        <!-- Resumen en Píldoras -->
        <div class="qz-hero-pills">
          <span class="qz-summary-pill">
            {{ criteriaForms.length }}
            <span class="qz-pill-label-full">{{
              criteriaForms.length === 1 ? "criterio" : "criterios"
            }}</span>
            <span class="qz-pill-label-short">crit.</span>
          </span>
          <span class="qz-summary-pill qz-pill--highlight">
            {{ totalScore }} pts<span class="qz-pill-label-full"> total</span>
          </span>
        </div>

        <!-- Botón Guardar en Cabecera -->
        <button
          type="button"
          class="qz-save-hero-btn"
          :disabled="isSaving"
          title="Guardar Criterios"
          @click="saveCriteria"
        >
          <ion-spinner
            v-if="isSaving"
            name="crescent"
            class="qz-btn-spinner"
          ></ion-spinner>
          <template v-else>
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span class="qz-save-text">Guardar</span>
          </template>
        </button>
      </div>
    </ion-header>

    <ion-content
      ref="contentRef"
      :fullscreen="true"
      class="qz-criteria-content"
    >
      <div class="qz-page-wrapper">
        <!-- 1. BANNER HERO QUEEZY PÚRPURA -->
        <div class="qz-hero-banner">
          <div class="qz-hero-titles">
            <span class="qz-hero-tag">
              RÚBRICA & EVALUACIÓN
              <template v-if="activityDetails?.lesson?.topic">
                · {{ activityDetails.lesson.topic }}
              </template>
            </span>
            <h1 class="qz-hero-title">
              Editor de Criterios
            </h1>
            <p class="qz-hero-subtitle">
              {{
                activityDetails?.title
                  ? `Actividad: ${activityDetails.title}`
                  : "Edita y organiza de forma compacta la lista de pautas y puntajes de calificación"
              }}
            </p>
          </div>
        </div>

        <!-- 2. CUERPO PRINCIPAL -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- BANNER DE ALERTA O ERROR -->
            <div
              v-if="error.estatus === 1"
              class="qz-alert-banner"
              :class="'qz-alert--' + (error.color || 'danger')"
            >
              <div class="qz-alert-icon">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
              </div>
              <div class="qz-alert-text">
                {{ error.data }}
              </div>
              <button
                type="button"
                class="qz-alert-dismiss"
                title="Cerrar aviso"
                @click="error.estatus = 0"
              >
                <ion-icon :icon="closeOutline"></ion-icon>
              </button>
            </div>

            <!-- CONTENEDOR EN FORMATO DE LISTA (SHEET UNIFICADA) -->
            <div class="qz-criteria-sheet">
              <!-- Cabecera de la Lista -->
              <div class="qz-sheet-top-header">
                <div class="qz-sheet-title-info">
                  <div class="qz-sheet-icon">
                    <ion-icon :icon="ribbonOutline"></ion-icon>
                  </div>
                  <div>
                    <h2 class="qz-sheet-title">Pautas de Calificación</h2>
                    <p class="qz-sheet-desc">
                      Organiza los criterios arrastrando el ícono y ajusta los
                      puntajes
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  class="qz-sheet-quick-add"
                  title="Añadir nuevo criterio al final"
                  @click="addCriterion"
                >
                  <ion-icon :icon="addOutline"></ion-icon>
                  <span>Añadir Criterio</span>
                </button>
              </div>

              <!-- Encabezado de Columnas (Desktop & Tablet) -->
              <div class="qz-columns-header">
                <span class="qz-col-head qz-col--order">#</span>
                <span class="qz-col-head qz-col--desc">Descripción del Criterio</span>
                <span class="qz-col-head qz-col--score">Puntaje</span>
                <span class="qz-col-head qz-col--actions"></span>
              </div>

              <!-- Lista con Reordenamiento de Filas -->
              <ion-reorder-group
                :disabled="false"
                class="qz-rows-reorder-group"
                @ionItemReorder="handleReorder($event)"
              >
                <div
                  v-for="(criterion, index) in criteriaForms"
                  :id="
                    criterion.id
                      ? 'criterion-' + criterion.id
                      : 'new-criterion-' + index
                  "
                  :key="criterion.id || 'new-' + index"
                  class="qz-criterion-row"
                >
                  <!-- 1. Lead: Agarrador y Número -->
                  <div class="qz-row-lead">
                    <ion-reorder
                      class="qz-row-drag-handle"
                      title="Arrastra para reordenar"
                    >
                      <ion-icon :icon="reorderThreeOutline"></ion-icon>
                    </ion-reorder>
                    <span class="qz-row-num">#{{ index + 1 }}</span>
                    <span class="qz-row-mobile-tag">Pauta</span>
                  </div>

                  <!-- 2. Textarea de Descripción (100% en móvil, centro en desktop) -->
                  <div class="qz-row-desc-wrap">
                    <textarea
                      v-model="criterion.description"
                      class="qz-row-textarea"
                      rows="2"
                      placeholder="Escribe la pauta o criterio de calificación..."
                      @input="autoResizeTextarea($event)"
                    ></textarea>
                  </div>

                  <!-- 3. Tail: Puntaje y Botón Eliminar -->
                  <div class="qz-row-tail">
                    <div class="qz-row-score-wrap">
                      <input
                        v-model.number="criterion.score"
                        type="number"
                        min="0"
                        step="1"
                        class="qz-row-score-input"
                        placeholder="10"
                      />
                      <span class="qz-row-score-label">pts</span>
                    </div>

                    <button
                      type="button"
                      class="qz-row-delete-btn"
                      title="Eliminar este criterio"
                      @click="removeCriterion(index)"
                    >
                      <ion-icon :icon="trashOutline"></ion-icon>
                    </button>
                  </div>
                </div>
              </ion-reorder-group>

              <!-- Botón en línea al final de la lista -->
              <div class="qz-add-inline-wrap">
                <button
                  type="button"
                  class="qz-add-inline-btn"
                  @click="addCriterion"
                >
                  <ion-icon :icon="addOutline"></ion-icon>
                  <span>Añadir Criterio a la Lista</span>
                </button>
              </div>

              <!-- Pie de la Lista con Totales -->
              <div class="qz-sheet-footer">
                <div class="qz-footer-left">
                  <span class="qz-footer-badge">
                    {{ criteriaForms.length }}
                    {{ criteriaForms.length === 1 ? "criterio" : "criterios" }}
                  </span>
                </div>
                <div class="qz-footer-right">
                  <span class="qz-footer-total-label">Puntaje Máximo:</span>
                  <span class="qz-footer-total-pts">{{ totalScore }} pts</span>
                </div>
              </div>
            </div>

            <!-- TARJETA DE IMPORTACIÓN RÁPIDA -->
            <div class="qz-import-panel-card">
              <div class="qz-import-panel-header">
                <div class="qz-import-icon-box">
                  <ion-icon :icon="copyOutline"></ion-icon>
                </div>
                <div class="qz-import-header-texts">
                  <h3 class="qz-import-panel-title">Importación Rápida</h3>
                  <p class="qz-import-panel-hint">
                    Carga múltiples criterios desde JSON o desde otras actividades
                  </p>
                </div>
              </div>

              <div class="qz-import-buttons-grid">
                <button
                  type="button"
                  class="qz-import-btn qz-btn--secondary"
                  @click="openImportModal"
                >
                  <ion-icon :icon="documentTextOutline"></ion-icon>
                  <div class="qz-import-btn-text">
                    <strong>Importar JSON</strong>
                    <span>Pega un arreglo de criterios con puntos</span>
                  </div>
                </button>

                <button
                  type="button"
                  class="qz-import-btn qz-btn--purple"
                  @click="openActivityImportModal"
                >
                  <ion-icon :icon="copyOutline"></ion-icon>
                  <div class="qz-import-btn-text">
                    <strong>Desde otra Actividad</strong>
                    <span>Reutiliza criterios de lecciones previas</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- BOTÓN GUARDAR INFERIOR DESTACADO -->
            <div class="qz-bottom-save-bar">
              <button
                type="button"
                class="qz-main-save-btn"
                :disabled="isSaving"
                @click="saveCriteria"
              >
                <ion-spinner v-if="isSaving" name="crescent"></ion-spinner>
                <template v-else>
                  <ion-icon :icon="saveOutline"></ion-icon>
                  <span>Guardar Criterios ({{ totalScore }} pts)</span>
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Importación JSON -->
      <import-criteria-modal
        :is-open="isImportModalOpen"
        @close="closeImportModal"
        @import="handleImport"
      ></import-criteria-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { tokenHeader, usuarioGet } from "../globalService";
import ImportCriteriaModal from "../components/ImportCriteriaModal.vue";
import ActivityCriterionSelectionModal from "../components/ActivityCriterionSelectionModal.vue";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonIcon,
  IonSpinner,
  IonReorderGroup,
  IonReorder,
  alertController,
  modalController,
  onIonViewWillEnter,
} from "@ionic/vue";
import {
  arrowBackOutline,
  checkmarkOutline,
  trashOutline,
  addOutline,
  reorderThreeOutline,
  documentTextOutline,
  copyOutline,
  ribbonOutline,
  alertCircleOutline,
  closeOutline,
  saveOutline,
} from "ionicons/icons";

export default {
  name: "CrearCriterio",
  components: {
    IonPage,
    IonHeader,
    IonContent,
    IonIcon,
    IonSpinner,
    IonReorderGroup,
    IonReorder,
    ImportCriteriaModal,
  },
  setup() {
    const mroute = useRoute();
    const router = useRouter();
    const { activityId } = mroute.params;

    const contentRef = ref(null);
    const criteriaForms = ref([]);
    const error = ref({
      estatus: 0,
      data: "",
      color: "",
    });
    const usuario = ref(null);
    const activityDetails = ref({});
    const isImportModalOpen = ref(false);
    const isSaving = ref(false);

    const backUrl = `/actividades/${activityId}`;

    const totalScore = computed(() => {
      if (!criteriaForms.value || criteriaForms.value.length === 0) return 0;
      return criteriaForms.value.reduce(
        (sum, item) => sum + (Number(item.score) || 0),
        0,
      );
    });

    const autoResizeTextarea = (event) => {
      const el = event?.target || event;
      if (!el || !el.style) return;
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 38)}px`;
    };

    const resizeAllTextareas = () => {
      nextTick(() => {
        document.querySelectorAll(".qz-row-textarea").forEach((el) => {
          autoResizeTextarea(el);
        });
      });
    };

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(backUrl);
      }
    };

    const addCriterion = () => {
      criteriaForms.value.push({
        description: "Entregó el trabajo a tiempo",
        score: 10,
        activityId: parseInt(activityId, 10),
        instituteId: usuario.value?.institute?.id,
      });
      resizeAllTextareas();
    };

    const openImportModal = () => {
      isImportModalOpen.value = true;
    };

    const closeImportModal = () => {
      isImportModalOpen.value = false;
    };

    const openActivityImportModal = async () => {
      const modal = await modalController.create({
        component: ActivityCriterionSelectionModal,
        cssClass: "qz-activity-import-modal",
      });

      modal.onDidDismiss().then((result) => {
        if (result.role !== "backdrop" && result.data && result.data.criteria) {
          handleActivityImport(result.data.criteria);
        }
      });

      return await modal.present();
    };

    const handleActivityImport = (importedCriteria) => {
      importedCriteria.forEach((criterion) => {
        criteriaForms.value.push({
          description: criterion.description,
          score: criterion.score,
          activityId: parseInt(activityId, 10),
          instituteId: usuario.value?.institute?.id,
        });
      });
      resizeAllTextareas();
    };

    const handleImport = (importedCriteria) => {
      importedCriteria.forEach((criterion) => {
        criteriaForms.value.push({
          description: criterion.description,
          score: criterion.score,
          activityId: parseInt(activityId, 10),
          instituteId: usuario.value?.institute?.id,
        });
      });
      resizeAllTextareas();
    };

    const removeCriterion = async (index) => {
      const criterionToRemove = criteriaForms.value[index];

      if (criterionToRemove.id) {
        const alert = await alertController.create({
          header: "Confirmar Eliminación",
          message:
            "¿Estás seguro de que quieres eliminar este criterio? Esta acción es irreversible.",
          buttons: [
            {
              text: "Cancelar",
              role: "cancel",
            },
            {
              text: "Eliminar",
              role: "destructive",
              handler: async () => {
                try {
                  await axios.delete(
                    `/criteria/${criterionToRemove.id}`,
                    tokenHeader(),
                  );
                  criteriaForms.value.splice(index, 1);
                } catch (err) {
                  console.error("Error deleting criterion:", err);
                  error.value.estatus = 1;
                  error.value.data =
                    "Error al eliminar el criterio. Por favor, intente de nuevo.";
                  error.value.color = "danger";
                }
              },
            },
          ],
        });
        await alert.present();
      } else {
        criteriaForms.value.splice(index, 1);
      }
    };

    const handleReorder = (event) => {
      const item = criteriaForms.value.splice(event.detail.from, 1)[0];
      criteriaForms.value.splice(event.detail.to, 0, item);
      event.detail.complete();
    };

    onIonViewWillEnter(async () => {
      window.scrollTo(0, 0);
      try {
        const scrollEl = await contentRef.value?.$el?.getScrollElement?.();
        if (scrollEl) {
          scrollEl.scrollTop = 0;
        }
      } catch (e) {
        // silencioso
      }

      usuario.value = usuarioGet();
      tokenHeader();

      try {
        const activityResponse = await axios.get(`/activities/${activityId}`);
        activityDetails.value = activityResponse.data;

        const criteriaResponse = await axios.get(
          `/criteria?activityId=${activityId}`,
        );
        if (criteriaResponse.data.length > 0) {
          criteriaForms.value = criteriaResponse.data.sort(
            (a, b) => a.id - b.id,
          );
        } else {
          addCriterion();
        }

        resizeAllTextareas();
      } catch (err) {
        console.error("Error fetching activity or criteria:", err);
        error.value.estatus = 1;
        error.value.data = "Error al cargar la actividad o los criterios.";
        error.value.color = "danger";
      }
    });

    const saveCriteria = async () => {
      error.value.estatus = 0;

      for (const criterion of criteriaForms.value) {
        if (
          !criterion.description ||
          criterion.description.toString().trim() === "" ||
          criterion.score === null ||
          criterion.score === undefined ||
          criterion.score === ""
        ) {
          error.value.estatus = 1;
          error.value.data =
            "Todos los campos de descripción y puntuación son obligatorios.";
          error.value.color = "danger";
          return;
        }
      }

      isSaving.value = true;
      try {
        for (const criterion of criteriaForms.value) {
          const payload = {
            description: criterion.description.toString().trim(),
            score: parseInt(criterion.score, 10),
            activityId: parseInt(activityId, 10),
            instituteId: usuario.value?.institute?.id,
          };

          if (criterion.id) {
            await axios.patch(
              `/criteria/${criterion.id}`,
              payload,
              tokenHeader(),
            );
          } else {
            const res = await axios.post("/criteria", payload, tokenHeader());
            if (res.data?.id) {
              criterion.id = res.data.id;
            }
          }
        }

        localStorage.setItem("error", "Criterios guardados exitosamente.");
        router.push(backUrl);
      } catch (err) {
        console.error("Error saving criteria:", err);
        error.value.estatus = 1;
        error.value.data =
          "Error al guardar los criterios. Por favor, intente de nuevo.";
        error.value.color = "danger";
      } finally {
        isSaving.value = false;
      }
    };

    return {
      contentRef,
      activityDetails,
      criteriaForms,
      totalScore,
      error,
      backUrl,
      isSaving,
      goBack,
      addCriterion,
      removeCriterion,
      saveCriteria,
      handleReorder,
      autoResizeTextarea,
      isImportModalOpen,
      openImportModal,
      closeImportModal,
      openActivityImportModal,
      handleImport,
      // Icons
      arrowBackOutline,
      checkmarkOutline,
      trashOutline,
      addOutline,
      reorderThreeOutline,
      documentTextOutline,
      copyOutline,
      ribbonOutline,
      alertCircleOutline,
      closeOutline,
      saveOutline,
    };
  },
};
</script>

<style scoped>
.qz-criteria-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-criteria-content {
  --background: var(--qz-color-purple-bg, #efeefc);
}

.qz-page-wrapper {
  display: flex;
  flex-direction: column;
}

/* 1. CABECERA FIJA SUPERIOR QUEEZY CON PARTE INFERIOR DEGRADADA */
.qz-sticky-header {
  --background: transparent;
  background: linear-gradient(
    180deg,
    #6a5ae0 0%,
    #6d5ee2 45%,
    #7667e8 70%,
    rgba(118, 103, 232, 0.75) 86%,
    rgba(106, 90, 224, 0) 100%
  );
  padding-top: max(8px, env(safe-area-inset-top));
  padding-bottom: 22px;
  flex-shrink: 0;
  z-index: 100;
  border: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
  outline: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  margin-bottom: -22px;
  pointer-events: none;
}

.qz-sticky-header::after {
  display: none !important;
  content: none !important;
}

.qz-hero-top {
  max-width: 820px;
  margin: 0 auto;
  padding: 4px 20px 2px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  pointer-events: auto;
}

/* BANNER HERO QUEEZY PÚRPURA */
.qz-hero-banner {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 40%, #efeefc 100%);
  padding: 16px 20px 24px 20px;
  flex-shrink: 0;
  margin-top: 0;
}

.qz-back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.qz-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

.qz-hero-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  justify-content: center;
  flex-shrink: 0;
}

.qz-summary-pill {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(4px);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.qz-pill-label-short {
  display: none;
}

.qz-pill-label-full {
  display: inline;
}

.qz-pill--highlight {
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  border-color: #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.qz-save-hero-btn {
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 8px 18px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  flex-shrink: 0;
}

.qz-save-hero-btn:active {
  transform: scale(0.94);
}

.qz-save-hero-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.qz-save-hero-btn ion-icon {
  font-size: 18px;
}

.qz-btn-spinner {
  width: 18px;
  height: 18px;
}

.qz-hero-titles {
  max-width: 820px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: left;
}

.qz-hero-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
}

.qz-hero-title {
  margin: 4px 0 6px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: clamp(22px, 3.5vw, 30px);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

/* 2. CUERPO PRINCIPAL */
.qz-main-body {
  flex: 1;
  padding: 12px 16px 36px 16px;
}

.qz-container {
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* BANNER DE ALERTA O ERROR */
.qz-alert-banner {
  border-radius: var(--qz-radius-lg, 20px);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: qzFadeIn 0.25s ease;
}

.qz-alert--danger {
  background: #fff0f0;
  border: 1px solid #ffccd7;
  color: #ff5656;
}

.qz-alert--success {
  background: #eefdf3;
  border: 1px solid #c8f5d7;
  color: #27ae60;
}

.qz-alert-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.qz-alert-text {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.qz-alert-dismiss {
  background: transparent;
  border: none;
  font-size: 20px;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

/* ==========================================================================
   FORMATO DE LISTA / SHEET UNIFICADA
   ========================================================================== */
.qz-criteria-sheet {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: var(--qz-radius-xl, 24px);
  box-shadow: var(--qz-shadow-card);
  border: 1px solid var(--qz-color-border, #e6e6e6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Cabecera superior del Sheet */
.qz-sheet-top-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(106, 90, 224, 0.1);
}

.qz-sheet-title-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qz-sheet-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--qz-color-gold-bg, #fff6e7);
  color: var(--qz-color-gold, #ffae33);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-sheet-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-sheet-desc {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-sheet-quick-add {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.2);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 7px 16px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.qz-sheet-quick-add:active {
  transform: scale(0.95);
  background: #e5e2fa;
}

/* Cabecera de Columnas (visible en desktop, oculta en móvil para dar espacio a la pauta) */
.qz-columns-header {
  display: none;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(106, 90, 224, 0.04);
  border-bottom: 1px solid rgba(106, 90, 224, 0.08);
  font-size: 11px;
  font-weight: 700;
  color: var(--qz-color-text-muted, #858494);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qz-col--order {
  width: 64px;
  text-align: center;
  flex-shrink: 0;
}

.qz-col--desc {
  flex: 1;
}

.qz-col--score {
  width: 90px;
  text-align: right;
  padding-right: 8px;
  flex-shrink: 0;
}

.qz-col--actions {
  width: 34px;
  flex-shrink: 0;
}

/* Filas de Criterios (Diseño Mobile-First adaptativo) */
.qz-rows-reorder-group {
  display: flex;
  flex-direction: column;
}

.qz-criterion-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(106, 90, 224, 0.08);
  background: var(--qz-color-card-bg, #ffffff);
  transition: background 0.15s ease;
  box-sizing: border-box;
}

.qz-criterion-row:hover {
  background: #faf9ff;
}

.qz-criterion-row.qz-row--highlighted {
  animation: qzRowFlash 2s ease;
}

@keyframes qzRowFlash {
  0%,
  100% {
    background: var(--qz-color-card-bg, #ffffff);
  }
  20%,
  60% {
    background: #eef7ff;
    outline: 2px solid #6a5ae0;
  }
}

/* 1. Lead: Drag y Número */
.qz-row-lead {
  order: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-row-drag-handle {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: grab;
  transition: color 0.15s ease, transform 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.qz-row-drag-handle:hover {
  background: #e5e2fa;
}

.qz-row-drag-handle:active {
  cursor: grabbing;
  transform: scale(0.92);
}

.qz-row-num {
  font-size: 14px;
  font-weight: 800;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-row-mobile-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--qz-color-text-muted, #858494);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* 2. Tail: Puntaje y Eliminar */
.qz-row-tail {
  order: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-row-score-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--qz-color-purple-bg, #efeefc);
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 4px 10px;
  width: 86px;
  box-sizing: border-box;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.qz-row-score-wrap:focus-within {
  border-color: var(--ion-color-primary, #6a5ae0);
  background: #ffffff;
}

.qz-row-score-input {
  width: 46px;
  background: transparent;
  border: none;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 15px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  text-align: right;
  outline: none;
  padding: 0;
}

.qz-row-score-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-row-delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #a09cb8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.qz-row-delete-btn:hover {
  background: #fff0f0;
  color: #ff5656;
}

.qz-row-delete-btn:active {
  transform: scale(0.9);
}

/* 3. Área de Descripción (100% de ancho en móvil para máxima legibilidad) */
.qz-row-desc-wrap {
  order: 3;
  width: 100%;
  flex-basis: 100%;
}

.qz-row-textarea {
  width: 100%;
  min-height: 52px;
  background: var(--qz-color-purple-bg, #efeefc);
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 10px 14px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--qz-color-text-main, #0c092a);
  line-height: 1.5;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.qz-row-textarea:focus {
  border-color: var(--ion-color-primary, #6a5ae0);
  background: #ffffff;
}

/* En Tablet y Escritorio (> 680px): Fila horizontal continua */
@media (min-width: 681px) {
  .qz-columns-header {
    display: flex;
  }

  .qz-row-mobile-tag {
    display: none;
  }

  .qz-criterion-row {
    flex-wrap: nowrap;
    padding: 8px 16px;
    gap: 12px;
  }

  .qz-row-lead {
    order: 1;
    flex-shrink: 0;
    width: 64px;
    justify-content: center;
  }

  .qz-row-desc-wrap {
    order: 2;
    flex: 1;
    width: auto;
    flex-basis: auto;
  }

  .qz-row-textarea {
    min-height: 40px;
    height: 40px;
    padding: 8px 12px;
    font-size: 14.5px;
    resize: none;
  }

  .qz-row-tail {
    order: 3;
    flex-shrink: 0;
  }
}

@media (max-width: 680px) {
  .qz-hero-top {
    padding: 4px 14px 6px 14px;
    gap: 8px;
  }

  .qz-hero-pills {
    gap: 6px;
  }

  .qz-summary-pill {
    padding: 4px 10px;
    font-size: 11.5px;
  }
}

@media (max-width: 480px) {
  .qz-hero-top {
    padding: 4px 10px 6px 10px;
    gap: 6px;
  }

  .qz-hero-pills {
    gap: 4px;
  }

  .qz-summary-pill {
    padding: 4px 7px;
    font-size: 11px;
    letter-spacing: -0.2px;
  }

  .qz-pill-label-full {
    display: none;
  }

  .qz-pill-label-short {
    display: inline;
  }

  .qz-save-hero-btn {
    padding: 7px 12px;
    font-size: 12px;
    gap: 4px;
  }

  .qz-back-btn {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

/* Botón en línea al final de la lista */
.qz-add-inline-wrap {
  padding: 12px 16px;
  background: var(--qz-color-card-bg, #ffffff);
  border-bottom: 1px solid rgba(106, 90, 224, 0.08);
}

.qz-add-inline-btn {
  width: 100%;
  background: var(--qz-color-purple-bg, #efeefc);
  border: 1.5px dashed rgba(106, 90, 224, 0.35);
  border-radius: 14px;
  padding: 10px 16px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
  transition: all 0.18s ease;
}

.qz-add-inline-btn:hover {
  background: #e9e6fb;
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-add-inline-btn:active {
  transform: scale(0.99);
}

/* Pie de la Lista con Totales */
.qz-sheet-footer {
  padding: 12px 20px;
  background: rgba(106, 90, 224, 0.03);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qz-footer-badge {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
}

.qz-footer-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-footer-total-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--qz-color-text-muted, #858494);
}

.qz-footer-total-pts {
  font-size: 15px;
  font-weight: 800;
  color: var(--ion-color-primary, #6a5ae0);
}

/* PANEL DE IMPORTACIÓN */
.qz-import-panel-card {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: var(--qz-radius-xl, 24px);
  padding: 18px 20px;
  box-shadow: var(--qz-shadow-card);
  border: 1px solid var(--qz-color-border, #e6e6e6);
}

.qz-import-panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.qz-import-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--qz-color-cyan-bg, #e8f9fe);
  color: #12b0e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-import-header-texts {
  display: flex;
  flex-direction: column;
}

.qz-import-panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-import-panel-hint {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-import-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}

.qz-import-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--qz-radius-lg, 20px);
  border: 1px solid rgba(106, 90, 224, 0.15);
  background: var(--qz-color-purple-bg, #efeefc);
  cursor: pointer;
  text-align: left;
  outline: none;
  transition: all 0.15s ease;
}

.qz-import-btn:hover {
  background: #e9e7fc;
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-import-btn:active {
  transform: scale(0.98);
}

.qz-import-btn ion-icon {
  font-size: 22px;
  color: var(--ion-color-primary, #6a5ae0);
  flex-shrink: 0;
}

.qz-import-btn-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qz-import-btn-text strong {
  font-size: 13px;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-import-btn-text span {
  font-size: 11px;
  color: var(--qz-color-text-muted, #858494);
}

/* BOTÓN GUARDAR INFERIOR */
.qz-bottom-save-bar {
  margin-top: 4px;
}

.qz-main-save-btn {
  width: 100%;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 15px 24px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  outline: none;
  box-shadow: 0 8px 24px rgba(106, 90, 224, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.qz-main-save-btn:hover {
  filter: brightness(1.05);
}

.qz-main-save-btn:active {
  transform: scale(0.98);
}

.qz-main-save-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.qz-main-save-btn ion-icon {
  font-size: 20px;
}

@keyframes qzFadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
