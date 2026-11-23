<template>
  <ion-page class="ion-page qz-question-page">
    <ion-content
      :fullscreen="true"
      class="qz-question-content"
      :force-overscroll="false"
    >
      <!-- 1. CABECERA HERO PÚRPURA (Estilo image14_1_2_375x812.png) -->
      <div class="qz-hero-header">
        <div class="qz-hero-top">
          <!-- Botón Volver -->
          <button
            type="button"
            class="qz-circle-btn"
            title="Volver al cuestionario"
            @click="goBack"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </button>

          <!-- Pill Central de Puntos / Recompensa -->
          <div class="qz-points-pill">
            <ion-icon :icon="sparklesOutline" class="qz-points-icon"></ion-icon>
            <span>+{{ question.points || 0 }} PUNTOS</span>
          </div>

          <!-- Acciones Derecha: Resultados / Editar Pregunta -->
          <div class="qz-hero-actions">
            <!-- Botón Podio de Resultados (si ya respondió o es admin) -->
            <button
              v-if="resVisible == 1"
              type="button"
              class="qz-circle-btn"
              title="Ver Resultados / Podio"
              @click="goToResults"
            >
              <ion-icon :icon="podiumOutline"></ion-icon>
            </button>

            <!-- Botón Editar Pregunta (Solo Docente / Admin) -->
            <button
              v-if="admin"
              type="button"
              class="qz-circle-btn"
              title="Editar Pregunta"
              @click="goToEdit"
            >
              <ion-icon :icon="createOutline"></ion-icon>
            </button>
          </div>
        </div>

        <!-- Metadatos de la Pregunta / Tema -->
        <div class="qz-hero-meta">
          <span class="qz-hero-topic">
            {{ question.quiz?.topic || "EVALUACIÓN EN LÍNEA" }}
          </span>
          <h1
            v-if="question.title"
            class="qz-hero-title"
            v-html="question.title"
          ></h1>
        </div>
      </div>

      <!-- 2. CUERPO PRINCIPAL DE LA PREGUNTA (Estilo image14, image15, image18) -->
      <div class="qz-question-body">
        <!-- TARJETA BLANCA ELEVADA DEL ENUNCIADO -->
        <div class="qz-statement-card">
          <!-- Imagen / Foto adjunta de la pregunta (si existe) -->
          <div v-if="question.photo" class="qz-photo-wrapper">
            <ion-img
              :src="basedeURL + question.photo"
              class="qz-question-img"
              alt="Material gráfico de la pregunta"
            ></ion-img>
          </div>

          <!-- Texto del Enunciado -->
          <div class="qz-question-sentence" v-html="question.sentence"></div>
        </div>

        <!-- CABECERA DE OPCIONES & CONTROL DOCENTE -->
        <div class="qz-options-header">
          <span class="qz-options-title">
            {{ admin ? "Opciones registradas" : "Selecciona tu respuesta" }}
          </span>

          <!-- Toggle Docente: Revelar / Ocultar Respuesta Correcta -->
          <button
            v-if="admin"
            type="button"
            class="qz-reveal-btn"
            :class="{ 'qz-reveal-btn--active': showCorrectAnswer }"
            @click="toggleShowCorrectAnswer"
          >
            <ion-icon
              :icon="showCorrectAnswer ? eyeOffOutline : eyeOutline"
            ></ion-icon>
            <span>{{
              showCorrectAnswer ? "Ocultar correcta" : "Ver correcta"
            }}</span>
          </button>
        </div>

        <!-- Banner de Error o Advertencia -->
        <div v-if="error.estatus === 1" class="qz-alert-box qz-alert--error">
          <ion-icon
            :icon="alertCircleOutline"
            class="qz-alert-icon"
          ></ion-icon>
          <div class="qz-alert-text">{{ error.data }}</div>
        </div>

        <!-- LISTA DE OPCIONES INTERACTIVAS (Estilo QuizOptionCard) -->
        <div class="qz-options-list">
          <div
            v-for="option in question.options"
            :key="option.id"
            class="qz-option-card"
            :class="{
              'qz-option--selected':
                respuesta.optionId === option.id && !admin,
              'qz-option--correct': showCorrectAnswer && option.correct,
              'qz-option--disabled': loading || admin,
            }"
            @click="selectOption(option.id)"
          >
            <!-- Squircle de Letra (A, B, C, D) -->
            <div class="qz-option-letter">
              {{ option.identifier }}
            </div>

            <!-- Texto de la Opción -->
            <div class="qz-option-text" v-html="option.sentence"></div>

            <!-- Indicador a la Derecha (Radio o Icono de Acierto) -->
            <div class="qz-option-indicator">
              <!-- Icono de Éxito en Modo Docente -->
              <ion-icon
                v-if="showCorrectAnswer && option.correct"
                :icon="checkmarkCircle"
                class="qz-indicator-correct"
              ></ion-icon>

              <!-- Radio Indicator Estudiante -->
              <div
                v-else-if="!admin"
                class="qz-radio-ring"
                :class="{
                  'qz-radio-ring--active': respuesta.optionId === option.id,
                }"
              >
                <div
                  v-if="respuesta.optionId === option.id"
                  class="qz-radio-dot"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- AVISO DE REQUISITO DE GRUPO (Si no es individual y no tiene grupo) -->
        <div
          v-if="
            !admin &&
            !grupoUsuario?.id &&
            question.quiz?.quizType !== 'individual'
          "
          class="qz-no-group-card"
        >
          <div class="qz-no-group-icon-wrap">
            <ion-icon :icon="peopleOutline"></ion-icon>
          </div>
          <h3 class="qz-no-group-title">Cuestionario en Equipo</h3>
          <p class="qz-no-group-text">
            Para responder las preguntas debes pertenecer a un grupo activo en
            este curso.
          </p>
        </div>
      </div>

      <!-- 3. BARRA INFERIOR FLOTANTE DE ENVÍO -->
      <div
        v-if="
          !admin &&
          (grupoUsuario?.id || question.quiz?.quizType === 'individual')
        "
        class="qz-bottom-bar"
      >
        <button
          type="button"
          class="qz-btn-submit"
          :disabled="loading || !respuesta.optionId"
          @click="responder"
        >
          <ion-spinner
            v-if="loading"
            name="crescent"
            class="qz-btn-spinner"
          ></ion-spinner>
          <template v-else>
            <span>Enviar Respuesta</span>
            <ion-icon :icon="paperPlaneOutline"></ion-icon>
          </template>
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import {
  tokenHeader,
  usuarioGet,
  adminOprofesor,
  basedeURL,
  defaultFile,
  shuffleArray,
} from "../globalService";
import { useRoute } from "vue-router";
import router from "../router";
import { notifyCourseAccessDenied } from "../courseAccessService";

import {
  arrowBackOutline,
  sparklesOutline,
  podiumOutline,
  createOutline,
  paperPlaneOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircle,
  alertCircleOutline,
  peopleOutline,
} from "ionicons/icons";

import {
  onIonViewDidEnter,
  IonPage,
  IonContent,
  IonImg,
  IonIcon,
  IonSpinner,
  toastController,
} from "@ionic/vue";

export default {
  components: {
    IonPage,
    IonContent,
    IonImg,
    IonIcon,
    IonSpinner,
  },
  setup() {
    const admin = adminOprofesor();
    const usuario = usuarioGet();
    const botonInactivo = ref(false);
    const mroute = useRoute();
    const grupoUsuario = ref();
    const { id } = mroute.params;
    const question = ref({
      id: "",
      points: "",
      sentence: "",
      quiz: {
        id: 0,
        topic: "",
        quizType: "",
      },
      options: [],
    });
    const src = ref("");
    const respuesta = ref({
      optionId: "",
      questionId: "",
      groupId: null,
      quizId: "",
      userId: usuario?.id,
      exist: 0,
    });

    const error = ref({
      estatus: 0,
      data: "",
    });
    const resVisible = ref(0);
    const loading = ref(false);
    const disableRandomization = ref(false);
    const showCorrectAnswer = ref(false);

    const showErrorToast = async (message) => {
      const toast = await toastController.create({
        message,
        duration: 4000,
        color: "danger",
        position: "top",
      });
      await toast.present();
    };

    onIonViewDidEnter(async () => {
      tokenHeader();

      // 1. Cargar datos de la pregunta
      await axios
        .get("/questions/" + id)
        .then((response) => {
          question.value = {
            id: response.data.id,
            points: response.data.points,
            sentence: response.data.sentence,
            quiz: response.data.quiz,
            title: response.data.title,
            photo: response.data.photo,
            options: response.data.options,
          };

          if (!question.value.photo) {
            src.value = defaultFile("thumbnail");
          }
          const rem = new RegExp("<p></p>", "g");
          question.value.sentence = question.value.sentence.replace(
            rem,
            "</br>"
          );
        })
        .catch((fallo) => {
          const mensaje =
            fallo?.response?.data?.message ||
            "No se pudo cargar la pregunta.";
          if (fallo?.response?.status === 403) {
            notifyCourseAccessDenied(mensaje);
            router.push("/inicio");
            return;
          }
          showErrorToast(mensaje);
        });

      // 2. Lógica de aleatorización de opciones
      const storedRandomizationKey = localStorage.getItem("ordenOpcionesKey");
      if (storedRandomizationKey) {
        try {
          const { quizId, authCode } = JSON.parse(storedRandomizationKey);
          const invitationResponse = await axios.get(
            `/invitations?code=${authCode}&valid=true&exist=true`,
            tokenHeader()
          );

          if (invitationResponse.data && invitationResponse.data.length > 0) {
            if (quizId === question.value.quiz?.id) {
              disableRandomization.value = true;
            }
          } else {
            disableRandomization.value = false;
            localStorage.removeItem("ordenOpcionesKey");
          }
        } catch (e) {
          localStorage.removeItem("ordenOpcionesKey");
          console.error("Error parsing or validating randomization key:", e);
        }
      }

      // 3. Procesar y ordenar opciones
      let processedOptions;
      if (
        admin ||
        (disableRandomization.value &&
          question.value.quiz?.id === question.value.quiz?.id)
      ) {
        processedOptions = question.value.options.sort((a, b) =>
          a.identifier.localeCompare(b.identifier)
        );
      } else {
        processedOptions = shuffleArray(question.value.options).map(
          (option, index) => {
            return {
              ...option,
              identifier: String.fromCharCode(65 + index),
            };
          }
        );
      }
      question.value.options = processedOptions;

      // 4. Cargar grupo del estudiante (si no es admin)
      if (!adminOprofesor()) {
        await axios.get(`/users/${usuario?.id}/groups`).then((response) => {
          grupoUsuario.value = response.data.filter((g) => g.active)[0]?.group;
        });
      }

      // 5. Verificar si ya se respondió la pregunta
      if (!admin) {
        let queryParams = `?questionId=${id}`;
        if (question.value.quiz?.quizType === "individual") {
          queryParams += `&userId=${usuario?.id}`;
        } else if (grupoUsuario.value?.id) {
          queryParams += `&groupId=${grupoUsuario.value.id}`;
        }

        if (
          question.value.quiz?.quizType === "individual" ||
          grupoUsuario.value?.id
        ) {
          await axios
            .get(`/answers${queryParams}`)
            .then((response) => {
              if (response.data && response.data.length > 0) {
                resVisible.value = 1;
              }
            })
            .catch(() => {
              // Falla silenciosa
            });
        }
      }

      if (admin) {
        resVisible.value = 1;
      }
    });

    const toggleShowCorrectAnswer = () => {
      showCorrectAnswer.value = !showCorrectAnswer.value;
    };

    const selectOption = (optionId) => {
      if (admin) return;
      respuesta.value.optionId = optionId;
      if (error.value.estatus === 1) {
        error.value.estatus = 0;
        error.value.data = "";
      }
    };

    const goBack = () => {
      if (question.value.quiz?.id) {
        router.push("/cuestionario/" + question.value.quiz.id);
      } else {
        router.back();
      }
    };

    const goToResults = () => {
      if (question.value.id) {
        router.push("/resultado/" + question.value.id);
      }
    };

    const goToEdit = () => {
      if (question.value.id) {
        router.push("/editar/pregunta/" + question.value.id);
      }
    };

    return {
      async responder() {
        const hasCorrectOption = question.value.options.some(
          (option) => option.correct
        );

        if (!hasCorrectOption) {
          error.value.estatus = 1;
          error.value.data =
            "Esta pregunta no tiene una respuesta correcta marcada. Por favor, informa a tu profesor.";
          showErrorToast(error.value.data);
          return;
        }

        if (!respuesta.value.optionId) {
          error.value.estatus = 1;
          error.value.data = "Debe seleccionar una opción.";
          showErrorToast(error.value.data);
        } else {
          respuesta.value.questionId = question.value.id;
          if (question.value.quiz?.quizType !== "individual") {
            respuesta.value.groupId = grupoUsuario.value?.id;
          } else {
            delete respuesta.value.groupId;
          }
          respuesta.value.quizId = question.value.quiz?.id;
          respuesta.value.exist = true;
          respuesta.value.instituteId = usuarioGet()?.institute?.id;
          botonInactivo.value = true;
          loading.value = true;
          await axios
            .post("/answers", respuesta.value)
            .then(() => {
              botonInactivo.value = false;
              loading.value = false;
              router.push("/resultado/" + question.value.id);
            })
            .catch((fallo) => {
              botonInactivo.value = false;
              loading.value = false;
              const mensaje =
                fallo?.response?.data?.message ||
                "No se pudo registrar tu respuesta. Intenta de nuevo.";
              error.value.estatus = 1;
              error.value.data = mensaje;
              localStorage.setItem("error", mensaje);
              showErrorToast(mensaje);
            });
        }
      },
      basedeURL: basedeURL(),
      admin,
      error,
      resVisible,
      respuesta,
      question,
      grupoUsuario,
      botonInactivo,
      loading,
      showCorrectAnswer,
      toggleShowCorrectAnswer,
      selectOption,
      goBack,
      goToResults,
      goToEdit,
      arrowBackOutline,
      sparklesOutline,
      podiumOutline,
      createOutline,
      paperPlaneOutline,
      eyeOutline,
      eyeOffOutline,
      checkmarkCircle,
      alertCircleOutline,
      peopleOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   1. LAYOUT PRINCIPAL Y CABECERA HERO PÚRPURA
   ========================================================================== */
.qz-question-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-question-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  --keyboard-offset: 0px !important;
  --padding-bottom: 0px;
}

/* Cabecera Hero con curva suave */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7667e8 100%);
  padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 32px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  box-shadow: 0 10px 24px -4px rgba(106, 90, 224, 0.28);
  color: #ffffff;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Botones circulares translúcidos */
.qz-circle-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.qz-circle-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.3);
}

.qz-hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Pill central de puntuación */
.qz-points-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.38);
  padding: 6px 16px;
  border-radius: var(--qz-radius-full, 9999px);
  font-size: 13px;
  font-weight: 700;
  color: #ffae33;
  letter-spacing: 0.4px;
  box-shadow: 0 4px 12px rgba(12, 9, 42, 0.08);
}

.qz-points-icon {
  font-size: 15px;
  color: #ffae33;
}

/* Metadatos y título hero */
.qz-hero-meta {
  margin-top: 18px;
  text-align: center;
}

.qz-hero-topic {
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 4px;
}

.qz-hero-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.35;
}

/* ==========================================================================
   2. CONTENEDOR PRINCIPAL Y TARJETA DEL ENUNCIADO
   ========================================================================== */
.qz-question-body {
  max-width: 680px;
  margin: -16px auto 0;
  padding: 0 16px 120px;
  position: relative;
  z-index: 5;
}

/* Tarjeta Blanca Elevada */
.qz-statement-card {
  background: #ffffff;
  border-radius: var(--qz-radius-2xl, 32px);
  border: 1.5px solid rgba(230, 230, 230, 0.7);
  box-shadow: 0 12px 32px -4px rgba(106, 90, 224, 0.12),
    0 2px 6px -1px rgba(12, 9, 42, 0.04);
  padding: 24px 20px;
  box-sizing: border-box;
}

/* Contenedor de la foto adjunta */
.qz-photo-wrapper {
  border-radius: var(--qz-radius-lg, 20px);
  overflow: hidden;
  border: 1px solid #e6e6e6;
  background-color: #f8f7fd;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 260px;
}

.qz-question-img {
  width: 100%;
  max-height: 260px;
  object-fit: contain;
}

/* Tipografía del enunciado */
.qz-question-sentence {
  font-size: 18px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  line-height: 1.48;
}

/* ==========================================================================
   3. CABECERA DE OPCIONES & CONTROL DOCENTE
   ========================================================================== */
.qz-options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 24px 6px 12px;
  gap: 10px;
}

.qz-options-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--qz-color-text-muted, #858494);
}

/* Botón docente para revelar respuesta */
.qz-reveal-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid var(--qz-color-border, #e6e6e6);
  border-radius: var(--qz-radius-md, 16px);
  padding: 6px 14px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  color: var(--qz-color-purple-primary, #6a5ae0);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(12, 9, 42, 0.04);
  transition: all 0.2s ease;
}

.qz-reveal-btn ion-icon {
  font-size: 15px;
}

.qz-reveal-btn:active {
  transform: scale(0.95);
}

.qz-reveal-btn--active {
  background: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  border-color: var(--qz-color-purple-primary, #6a5ae0);
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.3);
}

/* Banner de alerta / error */
.qz-alert-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--qz-radius-lg, 20px);
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.qz-alert--error {
  background: var(--qz-color-red-bg, #feecec);
  border: 1.5px solid var(--qz-color-red-wrong, #ff5656);
  color: var(--qz-color-red-wrong, #ff5656);
}

.qz-alert-icon {
  font-size: 20px;
  flex-shrink: 0;
}

/* ==========================================================================
   4. TARJETAS DE OPCIÓN (Estilo QuizOptionCard)
   ========================================================================== */
.qz-options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-option-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background-color: #ffffff;
  border: 2px solid var(--qz-color-border, #e6e6e6);
  border-radius: var(--qz-radius-xl, 24px);
  padding: 16px 20px;
  min-height: 72px;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(12, 9, 42, 0.03);
  user-select: none;
  box-sizing: border-box;
}

.qz-option-card:hover:not(.qz-option--disabled) {
  border-color: #d1cbfa;
  transform: translateY(-1px);
}

.qz-option-card:active:not(.qz-option--disabled) {
  transform: scale(0.99);
}

.qz-option--disabled {
  cursor: default;
}

/* Estado: Opción Seleccionada */
.qz-option--selected {
  border-color: var(--qz-color-purple-primary, #6a5ae0);
  background-color: #ffffff;
  box-shadow: 0 8px 20px rgba(106, 90, 224, 0.22);
  transform: scale(1.01);
}

/* Estado: Respuesta Correcta (Modo Docente / Feedback) */
.qz-option--correct {
  border-color: var(--qz-color-green-correct, #53df83);
  background-color: var(--qz-color-green-bg, #eafbf1);
  box-shadow: 0 6px 18px rgba(83, 223, 131, 0.2);
}

/* Squircle de Letra (A, B, C, D) */
.qz-option-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--qz-radius-sm, 12px);
  background-color: var(--qz-color-purple-bg, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.qz-option--selected .qz-option-letter {
  background-color: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
}

.qz-option--correct .qz-option-letter {
  background-color: var(--qz-color-green-correct, #53df83);
  color: #ffffff;
}

/* Texto de la opción */
.qz-option-text {
  flex: 1;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 16px;
  font-weight: 500;
  color: var(--qz-color-text-main, #0c092a);
  line-height: 1.42;
}

/* Indicador de Selección / Radio */
.qz-option-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}

.qz-indicator-correct {
  font-size: 26px;
  color: var(--qz-color-green-correct, #53df83);
}

.qz-radio-ring {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--qz-color-border, #e6e6e6);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.qz-radio-ring--active {
  border-color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-radio-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--qz-color-purple-primary, #6a5ae0);
}

/* ==========================================================================
   5. AVISO PARA ESTUDIANTE SIN GRUPO
   ========================================================================== */
.qz-no-group-card {
  margin-top: 24px;
  background: #ffffff;
  border-radius: var(--qz-radius-xl, 24px);
  border: 1.5px dashed #c4d0fb;
  padding: 24px 20px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.06);
}

.qz-no-group-icon-wrap {
  width: 52px;
  height: 52px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #efeefc;
  color: var(--qz-color-purple-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.qz-no-group-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-no-group-text {
  margin: 0;
  font-size: 14px;
  color: var(--qz-color-text-muted, #858494);
  line-height: 1.45;
}

/* ==========================================================================
   6. BARRA FLOTANTE INFERIOR Y BOTÓN DE ENVÍO
   ========================================================================== */
.qz-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(239, 238, 252, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 14px 20px calc(env(safe-area-inset-bottom, 0px) + 14px);
  display: flex;
  justify-content: center;
  z-index: 20;
  border-top: 1px solid rgba(230, 230, 230, 0.6);
}

.qz-btn-submit {
  width: 100%;
  max-width: 680px;
  min-height: 56px;
  border: none;
  border-radius: var(--qz-radius-lg, 20px);
  background-color: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 10px 24px -2px rgba(106, 90, 224, 0.38);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.qz-btn-submit:hover:not(:disabled) {
  background-color: var(--qz-color-purple-dark, #5a33d6);
}

.qz-btn-submit:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
}

.qz-btn-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none !important;
  transform: none !important;
}

.qz-btn-spinner {
  --color: #ffffff;
  width: 24px;
  height: 24px;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  .qz-question-page {
    --background: #120f24;
    background-color: #120f24;
  }
  .qz-question-content {
    --background: #120f24;
  }
  .qz-statement-card {
    background: #1d1838;
    box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.35);
  }
  .qz-photo-wrapper {
    border-color: rgba(255, 255, 255, 0.1);
    background: #17132e;
  }
  .qz-question-sentence {
    color: #f7f7fd;
  }
  .qz-reveal-btn {
    background: #28214b;
    border-color: rgba(255, 255, 255, 0.1);
    color: #a39bf0;
  }
  .qz-option-card {
    background-color: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-option--selected {
    background-color: #231d42;
    border-color: #7c6ef2;
  }
  .qz-option-letter {
    background-color: #28214b;
    color: #a39bf0;
  }
  .qz-option-text {
    color: #f7f7fd;
  }
  .qz-radio-ring {
    border-color: rgba(255, 255, 255, 0.2);
  }
  .qz-no-group-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.1);
  }
  .qz-no-group-icon-wrap {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-no-group-title {
    color: #f7f7fd;
  }
}

:global(body.dark) .qz-question-page,
:global(html.dark) .qz-question-page,
:global(.dark) .qz-question-page {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-question-content,
:global(html.dark) .qz-question-content,
:global(.dark) .qz-question-content {
  --background: #120f24;
}

:global(body.dark) .qz-statement-card,
:global(html.dark) .qz-statement-card,
:global(.dark) .qz-statement-card {
  background: #1d1838;
  box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.35);
}

:global(body.dark) .qz-photo-wrapper,
:global(html.dark) .qz-photo-wrapper,
:global(.dark) .qz-photo-wrapper {
  border-color: rgba(255, 255, 255, 0.1);
  background: #17132e;
}

:global(body.dark) .qz-question-sentence,
:global(html.dark) .qz-question-sentence,
:global(.dark) .qz-question-sentence {
  color: #f7f7fd;
}

:global(body.dark) .qz-reveal-btn,
:global(html.dark) .qz-reveal-btn,
:global(.dark) .qz-reveal-btn {
  background: #28214b;
  border-color: rgba(255, 255, 255, 0.1);
  color: #a39bf0;
}

:global(body.dark) .qz-option-card,
:global(html.dark) .qz-option-card,
:global(.dark) .qz-option-card {
  background-color: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-option--selected,
:global(html.dark) .qz-option--selected,
:global(.dark) .qz-option--selected {
  background-color: #231d42;
  border-color: #7c6ef2;
}

:global(body.dark) .qz-option-letter,
:global(html.dark) .qz-option-letter,
:global(.dark) .qz-option-letter {
  background-color: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-option-text,
:global(html.dark) .qz-option-text,
:global(.dark) .qz-option-text {
  color: #f7f7fd;
}

:global(body.dark) .qz-radio-ring,
:global(html.dark) .qz-radio-ring,
:global(.dark) .qz-radio-ring {
  border-color: rgba(255, 255, 255, 0.2);
}

:global(body.dark) .qz-no-group-card,
:global(html.dark) .qz-no-group-card,
:global(.dark) .qz-no-group-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-no-group-icon-wrap,
:global(html.dark) .qz-no-group-icon-wrap,
:global(.dark) .qz-no-group-icon-wrap {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-no-group-title,
:global(html.dark) .qz-no-group-title,
:global(.dark) .qz-no-group-title {
  color: #f7f7fd;
}
</style>

<style>
/* Estilos globales profundos para contenido HTML (pre, code, etc.) dentro del enunciado y opciones */
.qz-question-sentence code,
.qz-option-text code {
  background-color: rgba(106, 90, 224, 0.1);
  color: #5a33d6;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  padding: 0.2em 0.45em;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
}

.qz-question-sentence pre,
.qz-option-text pre {
  background-color: #0c092a;
  color: #efeefc;
  padding: 14px 16px;
  border-radius: 16px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.qz-question-sentence pre code,
.qz-option-text pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

.qz-question-sentence p,
.qz-option-text p {
  margin: 0 0 8px 0;
}

.qz-question-sentence p:last-child,
.qz-option-text p:last-child {
  margin-bottom: 0;
}
</style>
