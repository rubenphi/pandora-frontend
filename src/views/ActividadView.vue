<template>
  <ion-page class="ion-page qz-activity-page">
    <ion-content :fullscreen="true" class="qz-activity-content">
      <div class="qz-page-wrapper">
        <!-- 1. CABECERA HERO QUEEZY PÚRPURA -->
        <div class="qz-hero-header">
          <div class="qz-hero-top">
            <!-- Botón Volver -->
            <button
              type="button"
              class="qz-back-btn"
              title="Regresar a Lecciones"
              @click="goBack"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </button>

            <!-- Acciones Rápidas Superior -->
            <div class="qz-hero-actions">
              <!-- Docente: Editar Actividad -->
              <button
                v-if="admin && actividad?.id != 0 && actividad?.lesson?.id"
                type="button"
                class="qz-action-btn"
                title="Editar actividad"
                @click="goToEditActivity"
              >
                <ion-icon :icon="createOutline"></ion-icon>
              </button>

              <!-- Refrescar -->
              <button
                type="button"
                class="qz-action-btn"
                title="Actualizar datos"
                @click="reloadActivity"
              >
                <ion-icon :icon="refreshOutline"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Títulos del Hero -->
          <div class="qz-hero-titles">
            <span class="qz-hero-tag">
              ACTIVIDAD EVALUATIVA
              <template v-if="courseAndArea"> · {{ courseAndArea }}</template>
            </span>
            <h1 class="qz-hero-title">
              {{ actividad.title || "Detalle de Actividad" }}
            </h1>
            <p class="qz-hero-subtitle">
              {{
                actividad.lesson?.topic
                  ? `Lección: ${actividad.lesson.topic}`
                  : "Consulta las instrucciones, criterios de evaluación y entregas"
              }}
            </p>
          </div>
        </div>

        <!-- 2. CUERPO PRINCIPAL -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- Loading State -->
            <div v-if="isLoading" class="qz-loading-card">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <p>Cargando información de la actividad...</p>
            </div>

            <template v-else>
              <!-- BANNER DE ACCIONES RÁPIDAS -->
              <div class="qz-activity-actions-card">
                <div class="qz-actions-header">
                  <span class="qz-actions-title">Panel de Acciones</span>
                  <span class="qz-role-badge">
                    {{ admin ? "Docente" : "Estudiante" }}
                  </span>
                </div>

                <!-- Botones para DOCENTE / ADMIN -->
                <div v-if="admin" class="qz-action-buttons-grid">
                  <button
                    type="button"
                    class="qz-action-pill-btn qz-btn--primary"
                    @click="goToRevisar"
                  >
                    <ion-icon :icon="checkboxOutline"></ion-icon>
                    <span>Revisar Entregas</span>
                  </button>

                  <button
                    type="button"
                    class="qz-action-pill-btn qz-btn--secondary"
                    @click="goToPermisos"
                  >
                    <ion-icon :icon="keyOutline"></ion-icon>
                    <span>Configurar Permisos</span>
                  </button>

                  <button
                    type="button"
                    class="qz-action-pill-btn qz-btn--outline"
                    @click="goToAddCriterion"
                  >
                    <ion-icon :icon="addOutline"></ion-icon>
                    <span>Añadir Criterio</span>
                  </button>
                </div>

                <!-- Botones para ESTUDIANTE -->
                <div v-else class="qz-student-actions-wrap">
                  <!-- Banner destacado si tiene coevaluación pendiente -->
                  <div v-if="tienePermiso" class="qz-highlight-banner">
                    <div class="qz-highlight-icon">
                      <ion-icon :icon="sparklesOutline"></ion-icon>
                    </div>
                    <div class="qz-highlight-info">
                      <span class="qz-highlight-title"
                        >¡Puedes calificar esta actividad!</span
                      >
                      <p class="qz-highlight-desc">
                        Participa calificando según la rúbrica.
                      </p>
                    </div>
                    <button
                      type="button"
                      class="qz-action-pill-btn qz-btn--coral"
                      @click="goToEvaluarPares"
                    >
                      <ion-icon :icon="checkboxOutline"></ion-icon>
                      <span>Evaluar</span>
                    </button>
                  </div>

                  <!-- Botón Ver mi Calificación y Revisión -->
                  <button
                    type="button"
                    class="qz-action-pill-btn qz-btn--primary"
                    @click="goToVerRevision"
                  >
                    <ion-icon :icon="eyeOutline"></ion-icon>
                    <span>Ver Mi Calificación y Revisión</span>
                  </button>
                </div>
              </div>

              <!-- TARJETA 1: INSTRUCCIONES DE LA ACTIVIDAD -->
              <div class="qz-form-card">
                <div class="qz-card-header">
                  <div class="qz-field-icon qz-icon--cyan">
                    <ion-icon :icon="bookOutline"></ion-icon>
                  </div>
                  <div class="qz-card-header-texts">
                    <h2 class="qz-field-label">
                      Instrucciones de la Actividad
                    </h2>
                    <p class="qz-field-desc">
                      Pautas, requerimientos y objetivos para el desarrollo
                    </p>
                  </div>
                </div>

                <div class="qz-instructions-box">
                  <div
                    v-if="actividad.instructions"
                    class="qz-rich-content"
                    v-html="actividad.instructions"
                  ></div>
                  <div v-else class="qz-empty-box">
                    <ion-icon :icon="alertCircleOutline"></ion-icon>
                    <span>No hay instrucciones específicas registradas.</span>
                  </div>
                </div>
              </div>

              <!-- TARJETA 2: CRITERIOS DE EVALUACIÓN Y RÚBRICA -->
              <div class="qz-form-card">
                <div class="qz-card-header">
                  <div class="qz-field-icon qz-icon--gold">
                    <ion-icon :icon="ribbonOutline"></ion-icon>
                  </div>
                  <div class="qz-card-header-texts">
                    <div class="qz-header-title-row">
                      <h2 class="qz-field-label">Criterios de Evaluación</h2>
                      <div class="qz-badges-group">
                        <span class="qz-score-badge">
                          {{ criteriaList.length }}
                          {{
                            criteriaList.length === 1 ? "criterio" : "criterios"
                          }}
                        </span>
                        <span class="qz-score-badge qz-badge--highlight">
                          {{ totalScore }} pts máx.
                        </span>
                      </div>
                    </div>
                    <p class="qz-field-desc">
                      Rúbrica de calificación y ponderación de la actividad
                    </p>
                  </div>
                </div>

                <!-- Lista de Criterios -->
                <div
                  v-if="criteriaList && criteriaList.length > 0"
                  class="qz-criteria-list"
                >
                  <div
                    v-for="(criterion, index) in criteriaList"
                    :key="criterion.id"
                    class="qz-criterion-card"
                  >
                    <div class="qz-criterion-left">
                      <div class="qz-criterion-num">
                        {{ index + 1 }}
                      </div>
                      <div class="qz-criterion-info">
                        <span class="qz-criterion-desc">{{
                          criterion.description
                        }}</span>
                      </div>
                    </div>

                    <div class="qz-criterion-right">
                      <span class="qz-criterion-points-pill">
                        {{ criterion.score }} pts
                      </span>

                      <!-- Botón Editar Criterio (Docentes) -->
                      <button
                        v-if="admin"
                        type="button"
                        class="qz-item-edit-btn"
                        title="Editar criterio"
                        @click="goToEditCriterion(criterion.id)"
                      >
                        <ion-icon :icon="createOutline"></ion-icon>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Estado sin criterios -->
                <div v-else class="qz-empty-box">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                  <span
                    >No hay criterios de evaluación registrados para esta
                    actividad.</span
                  >
                </div>

                <!-- Botón Añadir Criterio (Docentes) -->
                <div v-if="admin" class="qz-add-criterion-wrap">
                  <button
                    type="button"
                    class="qz-add-criterion-btn"
                    @click="goToAddCriterion"
                  >
                    <ion-icon :icon="addOutline"></ion-icon>
                    <span>Añadir Criterio de Evaluación</span>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { tokenHeader, adminOprofesor, usuarioGet } from "../globalService";
import {
  arrowBackOutline,
  createOutline,
  addOutline,
  refreshOutline,
  checkboxOutline,
  keyOutline,
  eyeOutline,
  bookOutline,
  ribbonOutline,
  sparklesOutline,
  alertCircleOutline,
} from "ionicons/icons";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  onIonViewWillEnter,
} from "@ionic/vue";

export default {
  name: "ActividadView",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSpinner,
  },
  setup() {
    const mroute = useRoute();
    const router = useRouter();
    const admin = adminOprofesor();
    const userPermissions = ref([]);
    const grupoUsuario = ref(null);
    const tienePermiso = ref(false);
    const usuario = ref(null);
    const isLoading = ref(true);

    const { id } = mroute.params; // activityId

    const actividad = ref({
      id: 0,
      title: "",
      instructions: "",
      lesson: {},
    });
    const criteriaList = ref([]);

    const totalScore = computed(() => {
      if (!criteriaList.value || criteriaList.value.length === 0) return 0;
      return criteriaList.value.reduce(
        (sum, item) => sum + (Number(item.score) || 0),
        0,
      );
    });

    const courseAndArea = computed(() => {
      const l = actividad.value?.lesson;
      if (!l) return "";
      const courseName = l.course?.name || "";
      const areaName = l.area?.name || "";
      if (courseName && areaName) return `${courseName} · ${areaName}`;
      return courseName || areaName || "";
    });

    const fetchActivityDetails = async () => {
      try {
        const response = await axios.get(`/activities/${id}`);
        actividad.value = {
          ...response.data,
          lesson: response.data.lesson,
        };
        if (response.data.lesson?.id) {
          sessionStorage.setItem(
            "lastActiveLessonId",
            String(response.data.lesson.id),
          );
          sessionStorage.setItem("lastActiveSection", "actividades");
        }
      } catch (error) {
        console.error("Error fetching activity details:", error);
      }
    };

    const fetchCriteria = async () => {
      try {
        const criteriaResponse = await axios.get(`/criteria?activityId=${id}`);
        criteriaList.value = criteriaResponse.data.sort((a, b) => a.id - b.id);
      } catch (error) {
        console.error("Error fetching criteria:", error);
      }
    };

    const fetchStudentPermissions = async () => {
      try {
        if (!admin) {
          userPermissions.value = [];
          const response = await axios.get(
            `/student-criterion-scores/permissions?reviserId=${usuario.value.id}&activityId=${actividad.value.id}&expired=false&reviserType=User`,
            tokenHeader(),
          );
          userPermissions.value.push(...response.data);

          if (grupoUsuario.value != null) {
            const permisosGrupales = await axios.get(
              `/student-criterion-scores/permissions?reviserId=${grupoUsuario.value?.id}&activityId=${actividad.value.id}&expired=false&reviserType=Group`,
              tokenHeader(),
            );
            userPermissions.value.push(...permisosGrupales.data);
          }
          tienePermiso.value = userPermissions.value.length > 0;
        }
      } catch (error) {
        console.error("Error fetching student permissions:", error);
      }
    };

    const loadAll = async () => {
      isLoading.value = true;
      tokenHeader();
      usuario.value = usuarioGet();

      try {
        if (usuario.value?.id) {
          const groupRes = await axios.get(`/users/${usuario.value.id}/groups`);
          grupoUsuario.value =
            groupRes.data.filter((g) => g.active)[0]?.group ?? null;
        }

        await fetchActivityDetails();
        await fetchCriteria();
        await fetchStudentPermissions();
      } catch (e) {
        console.error("Error loading activity page data:", e);
      } finally {
        isLoading.value = false;
      }
    };

    onIonViewWillEnter(async () => {
      await loadAll();
    });

    const reloadActivity = async () => {
      await loadAll();
    };

    const goBack = () => {
      const l = actividad.value?.lesson;
      if (l?.id) {
        sessionStorage.setItem("lastActiveLessonId", String(l.id));
        sessionStorage.setItem("lastActiveSection", "actividades");
      }
      if (window.history.length > 1) {
        router.back();
      } else if (l) {
        const cId = l.course?.id || l.courseId;
        const aId = l.area?.id || l.areaId;
        const pId = l.period?.id || l.periodId;
        const yr = l.year || new Date().getFullYear();
        const typeSuffix = l.type ? `/${l.type}` : "";
        if (cId && aId && pId) {
          router.push(`/lecciones/${cId}/${aId}/${pId}/${yr}${typeSuffix}`);
          return;
        }
        router.push("/inicio");
      } else {
        router.push("/inicio");
      }
    };

    // Navigation methods
    const goToEditActivity = () => {
      if (actividad.value?.lesson?.id && actividad.value.id) {
        router.push(
          `/crear/actividad/${actividad.value.lesson.id}/${actividad.value.id}`,
        );
      }
    };

    const goToRevisar = () => {
      router.push(`/revisar/actividad/${actividad.value.id}`);
    };

    const goToPermisos = () => {
      router.push(`/revisar/actividad/${actividad.value.id}/permisos`);
    };

    const goToAddCriterion = () => {
      router.push(`/crear/criterio/${actividad.value.id}`);
    };

    const goToEditCriterion = () => {
      router.push(`/crear/criterio/${actividad.value.id}`);
    };

    const goToEvaluarPares = () => {
      router.push(`/actividad/${actividad.value.id}/evaluar-pares`);
    };

    const goToVerRevision = () => {
      router.push(`/ver/revision/${actividad.value.id}`);
    };

    return {
      admin,
      actividad,
      criteriaList,
      totalScore,
      courseAndArea,
      tienePermiso,
      isLoading,
      goBack,
      reloadActivity,
      goToEditActivity,
      goToRevisar,
      goToPermisos,
      goToAddCriterion,
      goToEditCriterion,
      goToEvaluarPares,
      goToVerRevision,
      // Icons
      arrowBackOutline,
      createOutline,
      addOutline,
      refreshOutline,
      checkboxOutline,
      keyOutline,
      eyeOutline,
      bookOutline,
      ribbonOutline,
      sparklesOutline,
      alertCircleOutline,
    };
  },
};
</script>

<style scoped>
.qz-activity-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-activity-content {
  --background: var(--qz-color-purple-bg, #efeefc);
}

.qz-page-wrapper {
  display: flex;
  flex-direction: column;
}

/* 1. CABECERA HERO QUEEZY PÚRPURA */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 24px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 760px;
  margin: 0 auto;
  padding: 8px 20px 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
}

.qz-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

.qz-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-action-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-action-btn:active {
  transform: scale(0.92);
}

.qz-hero-titles {
  max-width: 760px;
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
  word-break: break-word;
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
  padding: 12px 18px 36px 18px;
}

.qz-container {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ESTADO DE CARGA */
.qz-loading-card {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: var(--qz-radius-xl, 24px);
  padding: 48px 24px;
  text-align: center;
  box-shadow: var(--qz-shadow-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--qz-color-text-muted, #858494);
}

/* PANEL DE ACCIONES */
.qz-activity-actions-card {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: var(--qz-radius-xl, 24px);
  padding: 18px 20px;
  box-shadow: var(--qz-shadow-card);
  border: 1px solid var(--qz-color-border, #e6e6e6);
}

.qz-actions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.qz-actions-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-role-badge {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
}

.qz-action-buttons-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.qz-student-actions-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-action-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
  outline: none;
}

.qz-btn--primary {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
}

.qz-btn--secondary {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.18);
}

.qz-btn--outline {
  background: #ffffff;
  color: var(--qz-color-text-main, #0c092a);
  border: 1px solid var(--qz-color-border, #e6e6e6);
}

.qz-btn--coral {
  background: var(--qz-color-pink-coral, #ff8fa2);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(255, 143, 162, 0.35);
}

.qz-action-pill-btn:active {
  transform: scale(0.96);
}

/* BANNER DESTACADO DE COEVALUACIÓN */
.qz-highlight-banner {
  background: linear-gradient(135deg, #fff0f3 0%, #ffeaf0 100%);
  border: 1.5px solid rgba(255, 143, 162, 0.35);
  border-radius: var(--qz-radius-lg, 20px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-highlight-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #ffffff;
  color: var(--qz-color-pink-coral, #ff8fa2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.qz-highlight-title {
  font-size: 14px;
  font-weight: 700;
  color: #c0392b;
}

.qz-highlight-desc {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

/* TARJETAS DE CONTENIDO */
.qz-form-card {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: var(--qz-radius-xl, 24px);
  padding: 20px;
  box-shadow: var(--qz-shadow-card);
  border: 1px solid var(--qz-color-border, #e6e6e6);
}

.qz-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.qz-field-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-icon--cyan {
  background: var(--qz-color-cyan-bg, #e8f9fe);
  color: #12b0e8;
}

.qz-icon--gold {
  background: var(--qz-color-gold-bg, #fff6e7);
  color: var(--qz-color-gold, #ffae33);
}

.qz-card-header-texts {
  flex: 1;
}

.qz-header-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.qz-field-label {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-field-desc {
  margin: 3px 0 0 0;
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-badges-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-score-badge {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
}

.qz-badge--highlight {
  background: var(--qz-color-gold-bg, #fff6e7);
  color: #d68910;
}

/* INSTRUCCIONES */
.qz-instructions-box {
  background: var(--qz-color-purple-bg, #efeefc);
  border-radius: var(--qz-radius-lg, 20px);
  padding: 18px 20px;
  border: 1px solid rgba(106, 90, 224, 0.08);
}

.qz-rich-content {
  font-size: 15px;
  line-height: 1.6;
  color: var(--qz-color-text-main, #0c092a);
  word-break: break-word;
}

.qz-rich-content p {
  margin: 0 0 10px 0;
}

.qz-rich-content p:last-child {
  margin-bottom: 0;
}

.qz-empty-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  color: var(--qz-color-text-muted, #858494);
  font-size: 13px;
  justify-content: center;
}

.qz-empty-box ion-icon {
  font-size: 20px;
  color: var(--qz-color-text-muted, #858494);
}

/* LISTA DE CRITERIOS */
.qz-criteria-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-criterion-card {
  background: var(--qz-color-purple-bg, #efeefc);
  border-radius: var(--qz-radius-md, 16px);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid rgba(106, 90, 224, 0.1);
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-criterion-card:hover {
  background: #e9e7fc;
}

.qz-criterion-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.qz-criterion-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.qz-criterion-info {
  display: flex;
  flex-direction: column;
}

.qz-criterion-desc {
  font-size: 15.5px;
  font-weight: 600;
  color: var(--qz-color-text-main, #0c092a);
  line-height: 1.45;
  word-break: break-word;
}

.qz-criterion-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-criterion-points-pill {
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.2);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.qz-item-edit-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffffff;
  color: var(--qz-color-text-muted, #858494);
  border: 1px solid var(--qz-color-border, #e6e6e6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.qz-item-edit-btn:hover {
  color: var(--ion-color-primary, #6a5ae0);
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-item-edit-btn:active {
  transform: scale(0.9);
}

/* BOTÓN AÑADIR CRITERIO */
.qz-add-criterion-wrap {
  margin-top: 14px;
}

.qz-add-criterion-btn {
  width: 100%;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1.5px dashed rgba(106, 90, 224, 0.35);
  border-radius: var(--qz-radius-md, 16px);
  padding: 12px 18px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.qz-add-criterion-btn:hover {
  border-color: var(--ion-color-primary, #6a5ae0);
  background: #e9e7fc;
}

.qz-add-criterion-btn:active {
  transform: scale(0.98);
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  .qz-activity-page {
    --background: #120f24;
    background: #120f24;
  }
  .qz-activity-content {
    --background: #120f24;
  }
  .qz-hero-header {
    background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
  }
  .qz-loading-card,
  .qz-activity-actions-card,
  .qz-form-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-actions-title,
  .qz-field-label,
  .qz-rich-content,
  .qz-criterion-desc {
    color: #f7f7fd;
  }
  .qz-role-badge {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-btn--secondary {
    background: #28214b;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }
  .qz-btn--outline {
    background: #231d42;
    color: #f7f7fd;
    border-color: rgba(255, 255, 255, 0.12);
  }
  .qz-highlight-icon {
    background: #28214b;
  }
  .qz-score-badge {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-instructions-box {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-criterion-card {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-criterion-points-pill {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-item-edit-btn {
    background: #28214b;
    border-color: rgba(255, 255, 255, 0.12);
    color: #f7f7fd;
  }
  .qz-add-criterion-btn {
    background: #1d1838;
    border-color: #7c6ef2;
    color: #a39bf0;
  }
  .qz-add-criterion-btn:hover {
    background: #28214b;
    border-color: #9d93f7;
  }
}

:global(body.dark) .qz-activity-page,
:global(html.dark) .qz-activity-page,
:global(.dark) .qz-activity-page {
  --background: #120f24;
  background: #120f24;
}

:global(body.dark) .qz-activity-content,
:global(html.dark) .qz-activity-content,
:global(.dark) .qz-activity-content {
  --background: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
}

:global(body.dark) .qz-loading-card,
:global(html.dark) .qz-loading-card,
:global(.dark) .qz-loading-card,
:global(body.dark) .qz-activity-actions-card,
:global(html.dark) .qz-activity-actions-card,
:global(.dark) .qz-activity-actions-card,
:global(body.dark) .qz-form-card,
:global(html.dark) .qz-form-card,
:global(.dark) .qz-form-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-actions-title,
:global(html.dark) .qz-actions-title,
:global(.dark) .qz-actions-title,
:global(body.dark) .qz-field-label,
:global(html.dark) .qz-field-label,
:global(.dark) .qz-field-label,
:global(body.dark) .qz-rich-content,
:global(html.dark) .qz-rich-content,
:global(.dark) .qz-rich-content,
:global(body.dark) .qz-criterion-desc,
:global(html.dark) .qz-criterion-desc,
:global(.dark) .qz-criterion-desc {
  color: #f7f7fd;
}

:global(body.dark) .qz-role-badge,
:global(html.dark) .qz-role-badge,
:global(.dark) .qz-role-badge {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-btn--secondary,
:global(html.dark) .qz-btn--secondary,
:global(.dark) .qz-btn--secondary {
  background: #28214b;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-btn--outline,
:global(html.dark) .qz-btn--outline,
:global(.dark) .qz-btn--outline {
  background: #231d42;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-highlight-icon,
:global(html.dark) .qz-highlight-icon,
:global(.dark) .qz-highlight-icon {
  background: #28214b;
}

:global(body.dark) .qz-score-badge,
:global(html.dark) .qz-score-badge,
:global(.dark) .qz-score-badge {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-instructions-box,
:global(html.dark) .qz-instructions-box,
:global(.dark) .qz-instructions-box {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-criterion-card,
:global(html.dark) .qz-criterion-card,
:global(.dark) .qz-criterion-card {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-criterion-points-pill,
:global(html.dark) .qz-criterion-points-pill,
:global(.dark) .qz-criterion-points-pill {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-item-edit-btn,
:global(html.dark) .qz-item-edit-btn,
:global(.dark) .qz-item-edit-btn {
  background: #28214b;
  border-color: rgba(255, 255, 255, 0.12);
  color: #f7f7fd;
}

:global(body.dark) .qz-add-criterion-btn,
:global(html.dark) .qz-add-criterion-btn,
:global(.dark) .qz-add-criterion-btn {
  background: #1d1838;
  border-color: #7c6ef2;
  color: #a39bf0;
}

:global(body.dark) .qz-add-criterion-btn:hover,
:global(html.dark) .qz-add-criterion-btn:hover,
:global(.dark) .qz-add-criterion-btn:hover {
  background: #28214b;
  border-color: #9d93f7;
}
</style>
