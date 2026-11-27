<template>
  <ion-page class="ion-page qz-quiz-page">
    <ion-content :fullscreen="true" class="qz-quiz-content">
      <div class="qz-page-wrapper">
        <!-- 1. CABECERA HERO PÚRPURA QUEEZY -->
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

            <!-- Acciones Rápidas en la Barra Superior -->
            <div class="qz-hero-actions">
              <!-- Estudiante: Refrescar -->
              <button
                v-if="!admin"
                type="button"
                class="qz-action-btn"
                title="Actualizar cuestionario"
                @click="reloadQuiz"
              >
                <ion-icon :icon="refreshOutline"></ion-icon>
              </button>

              <!-- Docente: Bloqueo/Visibilidad Masiva -->
              <button
                v-if="admin"
                type="button"
                class="qz-action-btn"
                :title="
                  allVisible ? 'Bloquear preguntas' : 'Desbloquear preguntas'
                "
                @click="abrirMarcarDisponibleModal"
              >
                <ion-icon
                  :icon="allVisible ? lockClosedOutline : lockOpenOutline"
                ></ion-icon>
              </button>

              <!-- Docente: Descargar / Generar OMR -->
              <button
                v-if="admin"
                type="button"
                class="qz-action-btn"
                title="Generar hojas de respuesta / PDF"
                @click="openGeneratorModal"
              >
                <ion-icon :icon="downloadOutline"></ion-icon>
              </button>

              <!-- Docente: Editar Cuestionario -->
              <button
                v-if="admin && cuestionario?.id != 0"
                type="button"
                class="qz-action-btn"
                title="Editar cuestionario"
                @click="goToEditQuiz"
              >
                <ion-icon :icon="createOutline"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Título Hero -->
          <div class="qz-hero-titles">
            <span class="qz-hero-tag">EVALUACIÓN EN LÍNEA</span>
            <h1 class="qz-hero-title">Cuestionario</h1>
          </div>

          <!-- Selector de Modalidad en Cabecera (Admin / Docente) -->
          <div v-if="admin" class="qz-hero-mode-container">
            <div class="qz-hero-mode-header">
              <span class="qz-hero-mode-label">MODO DE RESPUESTA</span>
              <span class="qz-hero-mode-hint" v-if="activeMode === QUIZ_MODES.DIGITAL">
                Sin límite de opciones
              </span>
              <span class="qz-hero-mode-hint" v-else-if="activeMode === QUIZ_MODES.OMR">
                Máx. 8 opciones (A - H)
              </span>
              <span class="qz-hero-mode-hint" v-else-if="activeMode === QUIZ_MODES.CARDS">
                4 opciones fijas (A - D)
              </span>
            </div>
            <div class="qz-filter-tabs">
              <button
                type="button"
                class="qz-filter-tab"
                :class="{ 'is-active': activeMode === QUIZ_MODES.DIGITAL }"
                title="Modo Dispositivos (opciones ilimitadas)"
                @click="setQuizMode(QUIZ_MODES.DIGITAL)"
              >
                <ion-icon :icon="phonePortraitOutline"></ion-icon>
                <span>Dispositivos</span>
              </button>
              <button
                type="button"
                class="qz-filter-tab"
                :class="{ 'is-active': activeMode === QUIZ_MODES.OMR }"
                title="Modo Hoja OMR (máx. 8 opciones A-H)"
                @click="setQuizMode(QUIZ_MODES.OMR)"
              >
                <ion-icon :icon="scanOutline"></ion-icon>
                <span>Hoja OMR</span>
              </button>
              <button
                type="button"
                class="qz-filter-tab"
                :class="{ 'is-active': activeMode === QUIZ_MODES.CARDS }"
                title="Modo Tarjetas / Matriz (4 opciones A-D)"
                @click="setQuizMode(QUIZ_MODES.CARDS)"
              >
                <ion-icon :icon="matrixMarkerOutline"></ion-icon>
                <span>Tarjetas</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. CUERPO: TARJETA RESUMEN Y LISTA DE PREGUNTAS (Estilo image13_1_2_375x1211.png) -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- TARJETA SUPERIOR DE RESUMEN (Estilo tarjeta superior de image13) -->
            <div
              v-if="cuestionario && cuestionario.id != 0"
              class="qz-summary-card"
            >
              <!-- Tag/Badge Pill Superior -->
              <div class="qz-summary-top-row">
                <span class="qz-category-pill">
                  <ion-icon :icon="helpCircleOutline"></ion-icon>
                  <span>{{ getHeaderTag() }}</span>
                </span>

                <!-- Estudiante: Botón Desactivar Aleatoriedad con Código de Profesor -->
                <button
                  v-if="!admin"
                  type="button"
                  class="qz-auth-code-btn"
                  title="Deshabilitar opciones al azar con código"
                  @click="evitarAleatoriedadOpciones"
                >
                  <ion-icon :icon="codeDownloadOutline"></ion-icon>
                  <span>Orden Fijo</span>
                </button>
              </div>

              <!-- Tema / Título del Cuestionario -->
              <h2 class="qz-quiz-title">
                {{ cuestionario.topic || "Sin tema especificado" }}
              </h2>

              <!-- Fecha de Aplicación -->
              <div class="qz-quiz-date-row" v-if="cuestionario.fecha">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <span>{{ formatFecha(cuestionario.fecha) }}</span>
              </div>

              <!-- Botón Destacado: Ver Resultados / Podio de Ganadores -->
              <button
                type="button"
                class="qz-winners-btn"
                @click="goToWinners(cuestionario.id)"
              >
                <div class="qz-winners-icon">
                  <ion-icon :icon="trophyOutline"></ion-icon>
                </div>
                <div class="qz-winners-text">
                  <span class="qz-winners-title">Ver Resultados y Podio</span>
                  <span class="qz-winners-sub"
                    >Consulta los puntajes de los participantes</span
                  >
                </div>
                <ion-icon
                  :icon="chevronForwardOutline"
                  class="qz-winners-arrow"
                ></ion-icon>
              </button>
            </div>

            <!-- SECCIÓN QUESTIONS (Estilo Questions en image13_1_2_375x1211.png) -->
            <div class="qz-questions-section">
              <div class="qz-questions-header">
                <div class="qz-questions-title-wrap">
                  <h3 class="qz-questions-title">Preguntas</h3>
                  <span
                    class="qz-questions-badge"
                    v-if="cuestionario?.questions"
                  >
                    {{ cuestionario.questions.length }}
                  </span>
                </div>
                <span class="qz-questions-type-hint">Selección múltiple</span>
              </div>

              <!-- Contenedor Lavanda Suave de Preguntas -->
              <div class="qz-questions-card-box">
                <div
                  v-if="
                    cuestionario?.questions && cuestionario.questions.length > 0
                  "
                  class="qz-questions-list"
                >
                  <div
                    v-for="(question, index) in cuestionario.questions"
                    :key="question.id"
                    class="qz-question-row"
                    :class="{ 'is-locked': question.available === false }"
                    @click="goToQuestion(question.id)"
                  >
                    <!-- Número de Pregunta en Círculo Blanco -->
                    <div class="qz-question-num">
                      {{ index + 1 }}
                    </div>

                    <!-- Enunciado de la Pregunta -->
                    <div class="qz-question-info">
                      <p class="qz-question-text">
                        {{
                          question.title
                            ? question.title
                            : numeroOrdinal(index + 1, question.identifier)
                        }}
                      </p>
                      <div class="qz-question-meta-row">
                        <span
                          class="qz-question-sub"
                          v-if="question.available === false"
                        >
                          Bloqueada · Requiere habilitación del docente
                        </span>
                        <span class="qz-question-sub qz-sub--open" v-else>
                          Disponible para responder
                        </span>
                        <span
                          v-if="getHiddenCount(question) > 0"
                          class="qz-mode-limit-badge"
                        >
                          {{ question.options.length - getHiddenCount(question) }} de {{ question.options.length }} ops
                        </span>
                      </div>
                    </div>

                    <!-- Candado y Flecha Indicadora -->
                    <div class="qz-question-end">
                      <div
                        class="qz-lock-badge"
                        :class="
                          question.available === false
                            ? 'is-locked'
                            : 'is-unlocked'
                        "
                      >
                        <ion-icon
                          :icon="
                            question.available === false
                              ? lockClosedOutline
                              : lockOpenOutline
                          "
                        ></ion-icon>
                      </div>
                      <ion-icon
                        :icon="chevronForwardOutline"
                        class="qz-question-chevron"
                      ></ion-icon>
                    </div>
                  </div>
                </div>

                <!-- Estado sin preguntas -->
                <div v-else class="qz-no-questions-box">
                  <ion-icon
                    :icon="helpCircleOutline"
                    class="qz-no-q-icon"
                  ></ion-icon>
                  <h4>Aún no hay preguntas</h4>
                  <p>Este cuestionario no tiene preguntas activas agregadas.</p>
                </div>
              </div>
            </div>

            <!-- BOTONES DE ACCIÓN PARA EL DOCENTE -->
            <div v-if="admin" class="qz-teacher-actions">
              <button
                type="button"
                class="qz-primary-btn"
                @click="goToCreateQuestion"
              >
                <ion-icon :icon="addOutline"></ion-icon>
                <span>Nueva Pregunta</span>
              </button>

              <button
                type="button"
                class="qz-secondary-btn"
                @click="openTypeImportModal"
              >
                <ion-icon :icon="downloadOutline"></ion-icon>
                <span>Importar Preguntas</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- MODAL PARA TIPO DE IMPORTACIÓN (Queezy Selection Cards) -->
    <ion-modal
      :is-open="isModalOpen"
      @didDismiss="closeModal"
      :breakpoints="[0, 0.65, 0.95]"
      :initial-breakpoint="0.65"
      class="qz-modal-pop"
    >
      <div class="qz-modal-sheet">
        <div class="qz-modal-handle"></div>
        <div class="qz-modal-header">
          <h3 class="qz-modal-title">Importar Preguntas</h3>
          <p class="qz-modal-subtitle">
            Selecciona el método o formato de importación
          </p>
        </div>

        <div class="qz-modal-cards-list">
          <div
            v-for="tipo in tiposIportacion"
            :key="tipo.id"
            class="qz-import-card"
            :class="{ 'is-selected': tipoImportacionUrl === tipo.url }"
            @click="tipoImportacionUrl = tipo.url"
          >
            <div class="qz-import-icon-box" :class="tipo.colorClass">
              <ion-icon :icon="tipo.icon"></ion-icon>
            </div>
            <div class="qz-import-info">
              <h4 class="qz-import-name">{{ tipo.name }}</h4>
              <p class="qz-import-desc">{{ tipo.desc }}</p>
            </div>
            <div
              class="qz-import-radio"
              :class="{ 'is-checked': tipoImportacionUrl === tipo.url }"
            >
              <ion-icon
                v-if="tipoImportacionUrl === tipo.url"
                :icon="checkmarkOutline"
              ></ion-icon>
            </div>
          </div>
        </div>

        <div class="qz-modal-actions">
          <button
            type="button"
            class="qz-modal-btn qz-btn--cancel"
            @click="cancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="qz-modal-btn qz-btn--confirm"
            :disabled="!tipoImportacionUrl"
            @click="confirm"
          >
            Continuar
          </button>
        </div>
      </div>
    </ion-modal>

    <!-- MODAL GENERADOR OMR / PDF -->
    <CuestionarioGeneratorModal
      :is-open="isGeneratorModalOpen"
      :questions="cuestionario.questions"
      :title="cuestionario.topic"
      :lesson-data="cuestionario.lesson"
      @close="closeGeneratorModal"
    ></CuestionarioGeneratorModal>

    <!-- MODAL MARCAR DISPONIBLE -->
    <MarcarDisponibleModal
      :is-open="isMarcarDisponibleOpen"
      :questions="cuestionario.questions || []"
      :estado="!allVisible"
      @close="isMarcarDisponibleOpen = false"
      @confirmar="onConfirmarMarcar"
    ></MarcarDisponibleModal>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, adminOprofesor, numeroOrdinal } from "../globalService";
import { useRoute, useRouter } from "vue-router";
import {
  lockClosedOutline,
  lockOpenOutline,
  arrowBackOutline,
  refreshOutline,
  createOutline,
  addOutline,
  downloadOutline,
  codeDownloadOutline,
  chevronForwardOutline,
  helpCircleOutline,
  calendarOutline,
  trophyOutline,
  checkmarkOutline,
  copyOutline,
  extensionPuzzleOutline,
  phonePortraitOutline,
  scanOutline,
} from "ionicons/icons";
import { matrixMarkerOutline } from "../utils/customIcons";
import { QUIZ_MODES, getHiddenOptionsCount } from "../utils/quizModeAdapter";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonModal,
  onIonViewDidEnter,
  alertController,
} from "@ionic/vue";

import CuestionarioGeneratorModal from "../components/CuestionarioGeneratorModal.vue";
import MarcarDisponibleModal from "../components/MarcarDisponibleModal.vue";
import { notifyCourseAccessDenied } from "../courseAccessService";

export default {
  name: "CuestionarioView",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonModal,
    CuestionarioGeneratorModal,
    MarcarDisponibleModal,
  },
  setup() {
    const admin = ref(adminOprofesor());
    const periodoSelected = ref();
    const router = useRouter();
    const mroute = useRoute();
    const { id } = mroute.params;

    const activeMode = ref(
      sessionStorage.getItem("pandora_quiz_mode_" + id) || QUIZ_MODES.DIGITAL
    );

    const setQuizMode = (mode) => {
      activeMode.value = mode;
      sessionStorage.setItem("pandora_quiz_mode_" + id, mode);
    };

    const getHiddenCount = (question) => {
      if (!question || !question.options) return 0;
      return getHiddenOptionsCount(question.options, activeMode.value);
    };

    const isModalOpen = ref(false);
    const isGeneratorModalOpen = ref(false);
    const isMarcarDisponibleOpen = ref(false);
    const year = ref();
    const allVisible = ref(false);

    const tiposIportacion = ref([
      {
        id: 1,
        url: "/cuestionario/importar/",
        name: "Desde Cuestionario",
        desc: "Copia preguntas de otros cuestionarios creados",
        icon: copyOutline,
        colorClass: "qz-icon--purple",
      },
      {
        id: 2,
        url: "/cuestionario/importar/preguntas/variables/",
        name: "Asistente IA & JSON",
        desc: "Generador de prompts con IA y pegado de JSON",
        icon: extensionPuzzleOutline,
        colorClass: "qz-icon--coral",
      },
    ]);
    const tipoImportacionUrl = ref("");
    let cuestionario = ref(
      JSON.parse(localStorage.getItem("quizSelected")) || { id: 0 },
    );

    const formatFecha = (d) => {
      if (!d) return "";
      try {
        const parsed = new Date(d);
        if (isNaN(parsed.getTime())) return d;
        return parsed.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } catch (e) {
        return d;
      }
    };

    const getHeaderTag = () => {
      const areaName = cuestionario.value?.lesson?.area?.name;
      const count = cuestionario.value?.questions?.length || 0;
      if (areaName) {
        return `${areaName.toUpperCase()} · ${count} ${
          count === 1 ? "PREGUNTA" : "PREGUNTAS"
        }`;
      }
      return `CUESTIONARIO · ${count} ${
        count === 1 ? "PREGUNTA" : "PREGUNTAS"
      }`;
    };

    const goBack = () => {
      const l = cuestionario.value?.lesson;
      if (l?.id) {
        sessionStorage.setItem("lastActiveLessonId", String(l.id));
        sessionStorage.setItem("lastActiveSection", "cuestionarios");
      }
      if (
        l?.course?.id &&
        l?.area?.id
      ) {
        router.push(
          `/lecciones/${l.course.id}/${l.area.id}/${l.period?.id || ""}/${
            l.year || ""
          }${l.type ? "/" + l.type : ""}`,
        );
      } else if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/cuestionarios");
      }
    };

    const reloadQuiz = () => {
      window.location.reload();
    };

    const goToEditQuiz = () => {
      if (cuestionario.value?.lesson?.id && cuestionario.value?.id) {
        router.push(
          `/crear/cuestionario/${cuestionario.value.lesson.id}/${cuestionario.value.id}`,
        );
      }
    };

    const goToQuestion = (questionId) => {
      router.push(`/pregunta/${questionId}`);
    };

    const goToCreateQuestion = () => {
      router.push(`/crear/pregunta/${id}`);
    };

    const closeModal = () => {
      isModalOpen.value = false;
    };

    const openGeneratorModal = () => {
      isGeneratorModalOpen.value = true;
    };

    const closeGeneratorModal = () => {
      isGeneratorModalOpen.value = false;
    };

    const cancel = () => {
      closeModal();
      tipoImportacionUrl.value = "";
    };

    const confirm = () => {
      if (!tipoImportacionUrl.value) {
        return;
      }
      const url = tipoImportacionUrl.value + id;
      router.push(url);
      tipoImportacionUrl.value = "";
      closeModal();
    };

    const openTypeImportModal = () => {
      isModalOpen.value = true;
    };

    const goToWinners = (quizId) => {
      router.push(`/ganadores/${quizId}`);
    };

    const abrirMarcarDisponibleModal = () => {
      isMarcarDisponibleOpen.value = true;
    };

    const evitarAleatoriedadOpciones = async () => {
      const alert = await alertController.create({
        header: "Deshabilitar Opciones al Azar",
        message:
          "Va a deshabilitar las opciones al azar, ingrese el código de autorización del profesor",
        inputs: [
          {
            name: "authCode",
            type: "text",
            placeholder: "Código de autorización",
          },
        ],
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Confirmar",
            handler: async (data) => {
              const authCode = data.authCode;
              if (!authCode) {
                const errorAlert = await alertController.create({
                  header: "Error",
                  message: "Debe ingresar un código de autorización.",
                  buttons: ["OK"],
                });
                await errorAlert.present();
                return;
              }

              try {
                const response = await axios.get(
                  `/invitations?code=${authCode}&valid=true&exist=true`,
                  tokenHeader(),
                );

                if (response.data && response.data.length > 0) {
                  const dataToStore = {
                    quizId: cuestionario.value.id,
                    authCode: authCode,
                  };
                  localStorage.setItem(
                    "ordenOpcionesKey",
                    JSON.stringify(dataToStore),
                  );

                  const successAlert = await alertController.create({
                    header: "Éxito",
                    message:
                      "Las opciones de respuesta ahora estarán en orden.",
                    buttons: ["OK"],
                  });
                  await successAlert.present();
                } else {
                  localStorage.removeItem("ordenOpcionesKey");
                  const errorAlert = await alertController.create({
                    header: "Error de Autorización",
                    message: "El código ingresado no es válido o ha expirado.",
                    buttons: ["OK"],
                  });
                  await errorAlert.present();
                }
              } catch (error) {
                console.error("Error al validar el código:", error);
                const errorAlert = await alertController.create({
                  header: "Error",
                  message:
                    "Ocurrió un error al validar el código. Intente de nuevo.",
                  buttons: ["OK"],
                });
                await errorAlert.present();
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const onConfirmarMarcar = async (selectedIds) => {
      if (!cuestionario.value.questions.length || !cuestionario.value.institute)
        return;

      const promises = cuestionario.value.questions.map((pregunta) => {
        const visible = selectedIds.includes(pregunta.id);
        return axios.patch(
          `/questions/${pregunta.id}`,
          {
            quizId: cuestionario.value.id,
            visible,
            available: visible,
            instituteId: cuestionario.value.institute.id,
          },
          tokenHeader(),
        );
      });

      try {
        await Promise.all(promises);
        window.location.reload();
      } catch (error) {
        console.error("Error al actualizar preguntas:", error);
      }
    };

    const marcarTodoDisponibleVisible = async function (estado, questionIds) {
      if (
        !cuestionario.value.questions.length ||
        !cuestionario.value.institute
      ) {
        return;
      }

      const preguntasAActualizar = questionIds
        ? cuestionario.value.questions.filter((q) => questionIds.includes(q.id))
        : cuestionario.value.questions;

      const promises = preguntasAActualizar.map((pregunta) => {
        const preguntaUpdate = {
          quizId: cuestionario.value.id,
          visible: estado,
          available: estado,
          instituteId: cuestionario.value.institute.id,
        };
        return axios.patch(
          `/questions/${pregunta.id}`,
          preguntaUpdate,
          tokenHeader(),
        );
      });

      try {
        await Promise.all(promises);
        window.location.reload();
      } catch (error) {
        console.error("Error al actualizar una o más preguntas:", error);
      }
    };

    onIonViewDidEnter(async () => {
      admin.value = adminOprofesor();
      periodoSelected.value = JSON.parse(
        localStorage.getItem("periodoSelected"),
      );
      tokenHeader();

      if (cuestionario.value.id !== id) {
        await axios
          .get(`/quizzes/${id}`)
          .then((response) => {
            cuestionario.value = {
              ...response.data,
              id: response.data.id,
              topic: response.data.title,
              questions: response.data.questions
                .slice()
                .sort((a, b) => a.id - b.id)
                .map((question, index) => ({
                  ...question,
                  title:
                    numeroOrdinal(index, question.title) +
                    ". " +
                    question.title,
                }))
                .filter((question) => question.exist),
              course: response.data.course,
              institute: response.data.institute,
            };

            if (response.data.lesson?.id) {
              sessionStorage.setItem(
                "lastActiveLessonId",
                String(response.data.lesson.id),
              );
              sessionStorage.setItem("lastActiveSection", "cuestionarios");
            }

            if (!admin.value) {
              cuestionario.value.questions =
                cuestionario.value.questions.filter(
                  (question) => question.visible,
                );
            }
            localStorage.setItem(
              "quizSelected",
              JSON.stringify(cuestionario.value),
            );

            allVisible.value = cuestionario.value.questions.every(
              (question) => question.visible,
            );

            year.value = cuestionario.value.year;
          })
          .catch((fallo) => {
            if (fallo?.response?.status === 403) {
              notifyCourseAccessDenied(
                fallo?.response?.data?.message ||
                  "No tienes acceso a este cuestionario.",
              );
              router.push("/inicio");
            }
          });
      }
    });

    return {
      admin,
      cuestionario,
      id,
      year,
      allVisible,
      tipoImportacionUrl,
      tiposIportacion,
      isModalOpen,
      isGeneratorModalOpen,
      isMarcarDisponibleOpen,
      formatFecha,
      getHeaderTag,
      goBack,
      reloadQuiz,
      goToEditQuiz,
      goToQuestion,
      goToCreateQuestion,
      goToWinners,
      openTypeImportModal,
      openGeneratorModal,
      closeGeneratorModal,
      abrirMarcarDisponibleModal,
      evitarAleatoriedadOpciones,
      onConfirmarMarcar,
      marcarTodoDisponibleVisible,
      closeModal,
      cancel,
      confirm,
      numeroOrdinal,
      arrowBackOutline,
      refreshOutline,
      createOutline,
      lockClosedOutline,
      lockOpenOutline,
      downloadOutline,
      codeDownloadOutline,
      chevronForwardOutline,
      helpCircleOutline,
      calendarOutline,
      trophyOutline,
      addOutline,
      checkmarkOutline,
      phonePortraitOutline,
      scanOutline,
      matrixMarkerOutline,
      QUIZ_MODES,
      activeMode,
      setQuizMode,
      getHiddenCount,
    };
  },
};
</script>

<style scoped>
.qz-quiz-page {
  background-color: var(--qz-color-purple-bg, #efeefc);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.qz-quiz-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-page-wrapper {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 1. CABECERA HERO PÚRPURA QUEEZY */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 22px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 540px;
  margin: 0 auto;
  padding: 8px 18px 12px 18px;
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
  background: rgba(255, 255, 255, 0.35);
}

.qz-hero-titles {
  max-width: 540px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: left;
}

.qz-hero-mode-container {
  max-width: 540px;
  margin: 12px auto 0 auto;
  padding: 0 20px;
}

.qz-hero-mode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: 0 4px;
}

.qz-hero-mode-label {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.7px;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
}

.qz-hero-mode-hint {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

.qz-filter-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.18);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 3px;
  gap: 3px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.12);
}

.qz-filter-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 10px;
  background: transparent;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  color: rgba(255, 255, 255, 0.85);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.qz-filter-tab ion-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.qz-filter-tab:hover {
  color: #ffffff;
}

.qz-filter-tab.is-active {
  background: #ffffff;
  color: #5b4acb;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

@media (max-width: 380px) {
  .qz-hero-mode-container {
    padding: 0 14px;
  }
  .qz-filter-tab {
    font-size: 11px;
    padding: 6px 6px;
    gap: 4px;
  }
  .qz-filter-tab ion-icon {
    font-size: 13px;
  }
}

.qz-question-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.qz-mode-limit-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(106, 90, 224, 0.12);
  color: #5b4acb;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: var(--qz-radius-full, 9999px);
  letter-spacing: 0.2px;
}

.qz-hero-mode-container {
  max-width: 540px;
  margin: 12px auto 0 auto;
  padding: 0 20px;
}

.qz-filter-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.18);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 3px;
  gap: 3px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.12);
}

.qz-filter-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 10px;
  background: transparent;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  color: rgba(255, 255, 255, 0.85);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.qz-filter-tab ion-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.qz-filter-tab:hover {
  color: #ffffff;
}

.qz-filter-tab.is-active {
  background: #ffffff;
  color: #5b4acb;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

@media (max-width: 380px) {
  .qz-hero-mode-container {
    padding: 0 14px;
  }
  .qz-filter-tab {
    font-size: 11px;
    padding: 6px 6px;
    gap: 4px;
  }
  .qz-filter-tab ion-icon {
    font-size: 13px;
  }
}

.qz-question-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.qz-mode-limit-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(106, 90, 224, 0.12);
  color: #5b4acb;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: var(--qz-radius-full, 9999px);
  letter-spacing: 0.2px;
}

.qz-hero-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
}

.qz-hero-title {
  margin: 3px 0 0 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
}

/* 2. CUERPO PRINCIPAL */
.qz-main-body {
  flex: 1;
  padding: 6px 18px 28px 18px;
}

.qz-container {
  max-width: 540px;
  margin: 0 auto;
}

/* TARJETA SUPERIOR DE RESUMEN (Estilo image13) */
.qz-summary-card {
  background: #ffffff;
  border-radius: var(--qz-radius-xl, 24px);
  padding: 18px 18px 16px 18px;
  box-shadow: 0 8px 24px -4px rgba(106, 90, 224, 0.1);
  border: 1px solid rgba(106, 90, 224, 0.05);
  margin-bottom: 20px;
}

.qz-summary-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.qz-category-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #efeefc;
  color: var(--ion-color-primary, #6a5ae0);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 4px 12px;
  border-radius: var(--qz-radius-full, 9999px);
}

.qz-auth-code-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f9f9fe;
  border: 1px solid #eceaf9;
  color: #858494;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--qz-radius-full, 9999px);
  cursor: pointer;
}

.qz-auth-code-btn:active {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-quiz-title {
  margin: 0 0 6px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 20px;
  font-weight: 800;
  color: #0c092a;
  letter-spacing: -0.3px;
  line-height: 1.3;
}

.qz-quiz-date-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #858494;
  font-weight: 500;
  margin-bottom: 14px;
}

/* Botón Ganadores / Resultados */
.qz-winners-btn {
  width: 100%;
  background: linear-gradient(135deg, #fff7eb 0%, #fff1df 100%);
  border: 1px solid #ffe4c2;
  border-radius: var(--qz-radius-lg, 16px);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.qz-winners-btn:active {
  transform: scale(0.985);
}

.qz-winners-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #ffae33;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(255, 174, 51, 0.35);
}

.qz-winners-text {
  flex: 1;
  min-width: 0;
}

.qz-winners-title {
  display: block;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 800;
  color: #8c5300;
}

.qz-winners-sub {
  display: block;
  font-size: 11px;
  color: #b27b2b;
  font-weight: 500;
  margin-top: 1px;
}

.qz-winners-arrow {
  color: #ffae33;
  font-size: 18px;
  flex-shrink: 0;
}

/* SECCIÓN QUESTIONS (Estilo image13) */
.qz-questions-section {
  display: flex;
  flex-direction: column;
}

.qz-questions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
}

.qz-questions-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-questions-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 19px;
  font-weight: 800;
  color: #0c092a;
  letter-spacing: -0.3px;
}

.qz-questions-badge {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--qz-radius-full, 9999px);
  min-width: 22px;
  text-align: center;
}

.qz-questions-type-hint {
  font-size: 12px;
  font-weight: 600;
  color: #858494;
}

/* Contenedor Lavanda Suave de Preguntas */
.qz-questions-card-box {
  background: #f4f3fd;
  border-radius: var(--qz-radius-xl, 22px);
  padding: 12px;
  border: 1px solid rgba(106, 90, 224, 0.08);
}

.qz-questions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-question-row {
  background: #ffffff;
  border-radius: var(--qz-radius-lg, 16px);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.05);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.qz-question-row:active {
  transform: scale(0.985);
}

.qz-question-row.is-locked {
  opacity: 0.85;
  background: #fbfbff;
}

/* Número de Pregunta */
.qz-question-num {
  width: 32px;
  height: 32px;
  border-radius: var(--qz-radius-full, 9999px);
  background: #efeefc;
  color: var(--ion-color-primary, #6a5ae0);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qz-question-info {
  flex: 1;
  min-width: 0;
}

.qz-question-text {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  color: #0c092a;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-question-sub {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 500;
  color: #e58700;
  display: block;
}

.qz-sub--open {
  color: #10b981;
}

.qz-question-end {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.qz-lock-badge {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}

.qz-lock-badge.is-locked {
  background: #fff1df;
  color: #e58700;
}

.qz-lock-badge.is-unlocked {
  background: #e4f9ec;
  color: #10b981;
}

.qz-question-chevron {
  color: #9d9bb0;
  font-size: 16px;
}

.qz-no-questions-box {
  text-align: center;
  padding: 30px 16px;
  color: #858494;
}

.qz-no-q-icon {
  font-size: 36px;
  color: #afaac8;
  margin-bottom: 6px;
}

.qz-no-questions-box h4 {
  margin: 0 0 4px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 16px;
  font-weight: 700;
  color: #0c092a;
}

.qz-no-questions-box p {
  margin: 0;
  font-size: 13px;
}

/* BOTONES DE ACCIÓN PARA EL DOCENTE */
.qz-teacher-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}

.qz-primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 13px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(106, 90, 224, 0.28);
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-primary-btn:active {
  transform: scale(0.98);
}

.qz-secondary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: #ffffff;
  border: 1px solid #d6d1f9;
  color: var(--ion-color-primary, #6a5ae0);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 12px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.05);
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-secondary-btn:active {
  transform: scale(0.98);
  background: #f9f9fe;
}

/* MODAL BOTTOM SHEET */
.qz-modal-sheet {
  background: #ffffff;
  border-radius: 28px 28px 0 0;
  padding: 12px 20px 24px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-modal-handle {
  width: 40px;
  height: 5px;
  background: #d2d0e4;
  border-radius: 9999px;
  margin: 0 auto 16px auto;
}

.qz-modal-header {
  text-align: center;
  margin-bottom: 16px;
}

.qz-modal-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 800;
  color: #0c092a;
}

.qz-modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #858494;
}

.qz-modal-cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.qz-import-card {
  background: #f9f9fe;
  border: 2px solid #eceaf9;
  border-radius: var(--qz-radius-xl, 20px);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.qz-import-card:active {
  transform: scale(0.985);
}

.qz-import-card.is-selected {
  background: #efeefc;
  border-color: var(--ion-color-primary, #6a5ae0);
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.12);
}

.qz-import-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-import-info {
  flex: 1;
  min-width: 0;
}

.qz-import-name {
  margin: 0 0 2px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  color: #0c092a;
}

.qz-import-desc {
  margin: 0;
  font-size: 11px;
  color: #858494;
  line-height: 1.35;
}

.qz-import-radio {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #d2d0e4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #ffffff;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.qz-import-radio.is-checked {
  background: var(--ion-color-primary, #6a5ae0);
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.qz-modal-btn {
  flex: 1;
  padding: 13px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.qz-btn--cancel {
  background: #efeefc;
  color: #858494;
}

.qz-btn--confirm {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
}

.qz-btn--confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  .qz-quiz-page {
    background-color: #120f24;
  }
  .qz-quiz-content {
    --background: #120f24;
  }
  .qz-hero-header {
    background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
  }
  .qz-summary-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-category-pill {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-auth-code-btn {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.12);
    color: #f7f7fd;
  }
  .qz-auth-code-btn:active {
    background: #2a2254;
  }
  .qz-quiz-title {
    color: #f7f7fd;
  }
  .qz-questions-title {
    color: #f7f7fd;
  }
  .qz-questions-card-box {
    background: #17132e;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-question-row {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-question-num {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-question-text {
    color: #f7f7fd;
  }
  .qz-no-questions-box h4 {
    color: #f7f7fd;
  }
  .qz-secondary-btn {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.12);
    color: #a39bf0;
  }
  .qz-secondary-btn:active {
    background: #2a2254;
  }
  .qz-modal-sheet {
    background: #1d1838;
  }
  .qz-modal-title {
    color: #f7f7fd;
  }
  .qz-import-card {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-import-card.is-selected {
    background: #2a2254;
    border-color: #7c6ef2;
  }
  .qz-import-name {
    color: #f7f7fd;
  }
  .qz-btn--cancel {
    background: #28214b;
    color: #9e9bb8;
  }
}

:global(body.dark) .qz-quiz-page,
:global(html.dark) .qz-quiz-page,
:global(.dark) .qz-quiz-page {
  background-color: #120f24;
}

:global(body.dark) .qz-quiz-content,
:global(html.dark) .qz-quiz-content,
:global(.dark) .qz-quiz-content {
  --background: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
}

:global(body.dark) .qz-summary-card,
:global(html.dark) .qz-summary-card,
:global(.dark) .qz-summary-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-category-pill,
:global(html.dark) .qz-category-pill,
:global(.dark) .qz-category-pill {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-auth-code-btn,
:global(html.dark) .qz-auth-code-btn,
:global(.dark) .qz-auth-code-btn {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.12);
  color: #f7f7fd;
}

:global(body.dark) .qz-auth-code-btn:active,
:global(html.dark) .qz-auth-code-btn:active,
:global(.dark) .qz-auth-code-btn:active {
  background: #2a2254;
}

:global(body.dark) .qz-quiz-title,
:global(html.dark) .qz-quiz-title,
:global(.dark) .qz-quiz-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-questions-title,
:global(html.dark) .qz-questions-title,
:global(.dark) .qz-questions-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-questions-card-box,
:global(html.dark) .qz-questions-card-box,
:global(.dark) .qz-questions-card-box {
  background: #17132e;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-question-row,
:global(html.dark) .qz-question-row,
:global(.dark) .qz-question-row {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-question-num,
:global(html.dark) .qz-question-num,
:global(.dark) .qz-question-num {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-question-text,
:global(html.dark) .qz-question-text,
:global(.dark) .qz-question-text {
  color: #f7f7fd;
}

:global(body.dark) .qz-no-questions-box h4,
:global(html.dark) .qz-no-questions-box h4,
:global(.dark) .qz-no-questions-box h4 {
  color: #f7f7fd;
}

:global(body.dark) .qz-secondary-btn,
:global(html.dark) .qz-secondary-btn,
:global(.dark) .qz-secondary-btn {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.12);
  color: #a39bf0;
}

:global(body.dark) .qz-secondary-btn:active,
:global(html.dark) .qz-secondary-btn:active,
:global(.dark) .qz-secondary-btn:active {
  background: #2a2254;
}

:global(body.dark) .qz-modal-sheet,
:global(html.dark) .qz-modal-sheet,
:global(.dark) .qz-modal-sheet {
  background: #1d1838;
}

:global(body.dark) .qz-modal-title,
:global(html.dark) .qz-modal-title,
:global(.dark) .qz-modal-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-import-card,
:global(html.dark) .qz-import-card,
:global(.dark) .qz-import-card {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-import-card.is-selected,
:global(html.dark) .qz-import-card.is-selected,
:global(.dark) .qz-import-card.is-selected {
  background: #2a2254;
  border-color: #7c6ef2;
}

:global(body.dark) .qz-import-name,
:global(html.dark) .qz-import-name,
:global(.dark) .qz-import-name {
  color: #f7f7fd;
}

:global(body.dark) .qz-btn--cancel,
:global(html.dark) .qz-btn--cancel,
:global(.dark) .qz-btn--cancel {
  background: #28214b;
  color: #9e9bb8;
}

:global(body.dark) .qz-filter-tabs,
:global(html.dark) .qz-filter-tabs,
:global(.dark) .qz-filter-tabs {
  background: rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-filter-tab.is-active,
:global(html.dark) .qz-filter-tab.is-active,
:global(.dark) .qz-filter-tab.is-active {
  background: #322b60;
  color: #ffffff;
}

:global(body.dark) .qz-mode-limit-badge,
:global(html.dark) .qz-mode-limit-badge,
:global(.dark) .qz-mode-limit-badge {
  background: rgba(163, 155, 240, 0.18);
  color: #b7aefa;
}
</style>
