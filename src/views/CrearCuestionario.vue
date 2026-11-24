<template>
  <ion-page class="ion-page qz-create-quiz-page">
    <ion-content :fullscreen="true" class="qz-create-quiz-content">
      <div class="qz-page-container">
        <!-- 1. Barra Superior de Navegación -->
        <header class="qz-top-bar">
          <button
            type="button"
            class="qz-circle-btn"
            title="Regresar"
            @click="handleBack"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </button>

          <h1 class="qz-top-title">
            {{ isEditing ? "Editar Cuestionario" : "Nuevo Cuestionario" }}
          </h1>

          <div class="qz-top-actions">
            <button
              v-if="isEditing"
              type="button"
              class="qz-circle-btn qz-btn--delete"
              title="Eliminar cuestionario"
              @click="confirmarBorrado"
            >
              <ion-icon :icon="trashOutline"></ion-icon>
            </button>
            <div v-else class="qz-placeholder-btn"></div>
          </div>
        </header>

        <!-- 2. Tarjeta Informativa de Lección Asociada -->
        <div v-if="lessonDetails" class="qz-lesson-chip-card">
          <div class="qz-lesson-icon-box">
            <ion-icon :icon="schoolOutline"></ion-icon>
          </div>
          <div class="qz-lesson-info">
            <span class="qz-lesson-pre">LECCIÓN ASOCIADA</span>
            <h2 class="qz-lesson-title">
              {{ lessonDetails.title || `Lección #${lessonId}` }}
            </h2>
            <span
              v-if="lessonDetails.course?.name || lessonDetails.area?.name"
              class="qz-lesson-course"
            >
              {{ lessonDetails.course?.name || "" }}
              <template v-if="lessonDetails.course?.name && lessonDetails.area?.name"> · </template>
              {{ lessonDetails.area?.name || "" }}
            </span>
          </div>
        </div>

        <!-- 3. Formulario Queezy -->
        <form class="qz-form-container" @submit.prevent="crearCuestionario">
          <!-- Banner de Error si existe -->
          <div v-if="error.estatus === 1" class="qz-error-banner">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            <span>{{ error.data }}</span>
          </div>

          <!-- CAMPO 1: Título del Cuestionario -->
          <div class="qz-form-card">
            <div class="qz-card-header">
              <div class="qz-field-icon qz-icon--purple">
                <ion-icon :icon="documentTextOutline"></ion-icon>
              </div>
              <div class="qz-card-header-texts">
                <label class="qz-field-label">Título del Cuestionario</label>
                <p class="qz-field-desc">
                  Nombre descriptivo para identificarlo en las actividades
                </p>
              </div>
            </div>
            <div class="qz-input-wrap">
              <input
                type="text"
                v-model="cuestionario.title"
                placeholder="Ej. Evaluación de Biología Celular"
                class="qz-text-input"
                required
              />
            </div>
          </div>

          <!-- CAMPO 2: Modalidad (Grupal vs Individual) -->
          <div class="qz-form-card">
            <div class="qz-card-header">
              <div class="qz-field-icon qz-icon--coral">
                <ion-icon :icon="peopleOutline"></ion-icon>
              </div>
              <div class="qz-card-header-texts">
                <label class="qz-field-label">Modalidad de Participación</label>
                <p class="qz-field-desc">
                  Define si las respuestas y puntuación serán en equipo o personal
                </p>
              </div>
            </div>

            <div class="qz-choice-grid">
              <!-- Opción Grupal -->
              <div
                class="qz-choice-card"
                :class="{ 'is-selected': cuestionario.quizType === 'group' }"
                @click="cuestionario.quizType = 'group'"
              >
                <div class="qz-choice-top">
                  <div class="qz-choice-icon-wrap qz-choice--purple">
                    <ion-icon :icon="peopleOutline"></ion-icon>
                  </div>
                  <div class="qz-choice-radio">
                    <ion-icon
                      :icon="cuestionario.quizType === 'group' ? checkmarkCircle : ellipseOutline"
                    ></ion-icon>
                  </div>
                </div>
                <span class="qz-choice-title">Grupal</span>
                <p class="qz-choice-sub">
                  Estudiantes responden en equipo y comparten puntaje
                </p>
              </div>

              <!-- Opción Individual -->
              <div
                class="qz-choice-card"
                :class="{ 'is-selected': cuestionario.quizType === 'individual' }"
                @click="cuestionario.quizType = 'individual'"
              >
                <div class="qz-choice-top">
                  <div class="qz-choice-icon-wrap qz-choice--coral">
                    <ion-icon :icon="personOutline"></ion-icon>
                  </div>
                  <div class="qz-choice-radio">
                    <ion-icon
                      :icon="cuestionario.quizType === 'individual' ? checkmarkCircle : ellipseOutline"
                    ></ion-icon>
                  </div>
                </div>
                <span class="qz-choice-title">Individual</span>
                <p class="qz-choice-sub">
                  Cada estudiante responde y recibe su propia nota
                </p>
              </div>
            </div>
          </div>

          <!-- CAMPO 3: Tipo de Evaluación (Relativa vs Absoluta) -->
          <div class="qz-form-card">
            <div class="qz-card-header">
              <div class="qz-field-icon qz-icon--gold">
                <ion-icon :icon="trendingUpOutline"></ion-icon>
              </div>
              <div class="qz-card-header-texts">
                <label class="qz-field-label">Cálculo de la Calificación</label>
                <p class="qz-field-desc">
                  Cómo se calcula la nota en la escala de 0.0 a 5.0
                </p>
              </div>
            </div>

            <div class="qz-choice-grid">
              <!-- Opción Relativa -->
              <div
                class="qz-choice-card"
                :class="{ 'is-selected': cuestionario.evaluationType === 'relative' }"
                @click="cuestionario.evaluationType = 'relative'"
              >
                <div class="qz-choice-top">
                  <div class="qz-choice-icon-wrap qz-choice--gold">
                    <ion-icon :icon="trendingUpOutline"></ion-icon>
                  </div>
                  <div class="qz-choice-radio">
                    <ion-icon
                      :icon="cuestionario.evaluationType === 'relative' ? checkmarkCircle : ellipseOutline"
                    ></ion-icon>
                  </div>
                </div>
                <span class="qz-choice-title">Relativa (Curva)</span>
                <p class="qz-choice-sub">
                  El puntaje más alto obtenido por el grupo saca 5.0
                </p>
              </div>

              <!-- Opción Absoluta -->
              <div
                class="qz-choice-card"
                :class="{ 'is-selected': cuestionario.evaluationType === 'absolute' }"
                @click="cuestionario.evaluationType = 'absolute'"
              >
                <div class="qz-choice-top">
                  <div class="qz-choice-icon-wrap qz-choice--cyan">
                    <ion-icon :icon="flagOutline"></ion-icon>
                  </div>
                  <div class="qz-choice-radio">
                    <ion-icon
                      :icon="cuestionario.evaluationType === 'absolute' ? checkmarkCircle : ellipseOutline"
                    ></ion-icon>
                  </div>
                </div>
                <span class="qz-choice-title">Absoluta</span>
                <p class="qz-choice-sub">
                  La nota se calcula sobre el total máximo posible
                </p>
              </div>
            </div>
          </div>

          <!-- CAMPO 4: Categoría (Regular vs Mejora de Nota) -->
          <div v-if="!isReinforcementLesson" class="qz-form-card">
            <div class="qz-card-header">
              <div class="qz-field-icon qz-icon--orange">
                <ion-icon :icon="ribbonOutline"></ion-icon>
              </div>
              <div class="qz-card-header-texts">
                <label class="qz-field-label">Categoría del Cuestionario</label>
                <p class="qz-field-desc">
                  Finalidad académica de la evaluación
                </p>
              </div>
            </div>

            <div class="qz-choice-grid">
              <!-- Opción Regular -->
              <div
                class="qz-choice-card"
                :class="{ 'is-selected': cuestionario.category === 'regular' }"
                @click="cuestionario.category = 'regular'"
              >
                <div class="qz-choice-top">
                  <div class="qz-choice-icon-wrap qz-choice--purple">
                    <ion-icon :icon="clipboardOutline"></ion-icon>
                  </div>
                  <div class="qz-choice-radio">
                    <ion-icon
                      :icon="cuestionario.category === 'regular' ? checkmarkCircle : ellipseOutline"
                    ></ion-icon>
                  </div>
                </div>
                <span class="qz-choice-title">Nota de clase</span>
                <p class="qz-choice-sub">
                  Evaluación periódica estándar del plan de estudio
                </p>
              </div>

              <!-- Opción Mejora de Nota -->
              <div
                class="qz-choice-card"
                :class="{ 'is-selected': cuestionario.category === 'improvement' }"
                @click="cuestionario.category = 'improvement'"
              >
                <div class="qz-choice-top">
                  <div class="qz-choice-icon-wrap qz-choice--orange">
                    <ion-icon :icon="ribbonOutline"></ion-icon>
                  </div>
                  <div class="qz-choice-radio">
                    <ion-icon
                      :icon="cuestionario.category === 'improvement' ? checkmarkCircle : ellipseOutline"
                    ></ion-icon>
                  </div>
                </div>
                <span class="qz-choice-title">Mejora de Nota</span>
                <p class="qz-choice-sub">
                  Permite nivelar y reemplazar notas bajas anteriores
                </p>
              </div>
            </div>
          </div>

          <!-- BOTÓN PRINCIPAL DE GUARDAR -->
          <div class="qz-actions-footer">
            <button
              type="submit"
              class="qz-submit-btn"
              :disabled="saving"
            >
              <ion-spinner v-if="saving" name="crescent" color="light"></ion-spinner>
              <template v-else>
                <ion-icon :icon="checkmarkCircle"></ion-icon>
                <span>{{ isEditing ? "Guardar Cambios" : "Crear Cuestionario" }}</span>
              </template>
            </button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import router from "../router";
import { usuarioGet, tokenHeader, LessonType } from "../globalService";

import {
  arrowBackOutline,
  trashOutline,
  documentTextOutline,
  peopleOutline,
  personOutline,
  trendingUpOutline,
  flagOutline,
  clipboardOutline,
  ribbonOutline,
  checkmarkCircle,
  ellipseOutline,
  alertCircleOutline,
  schoolOutline,
} from "ionicons/icons";

import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  onIonViewWillEnter,
  alertController,
} from "@ionic/vue";

export default {
  name: "CrearCuestionario",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSpinner,
  },
  setup() {
    const mroute = useRoute();

    const lessonId = parseInt(mroute.params.lessonId, 10);
    const quizId = mroute.params.id ? parseInt(mroute.params.id, 10) : null;

    const cuestionario = ref({
      id: null,
      title: "",
      quizType: "group",
      lessonId: parseInt(lessonId, 10),
      instituteId: null,
      exist: true,
      evaluationType: "relative",
      category: "regular",
    });

    const error = ref({
      estatus: 0,
      data: "",
    });

    const saving = ref(false);
    const usuario = ref();
    const lessonDetails = ref(null);

    const isEditing = computed(() => !!quizId);

    const isReinforcementLesson = computed(() => {
      const t = lessonDetails.value?.type;
      return (
        t === "reinforcement" ||
        t === LessonType.REINFORCEMENT ||
        t === "remedial" ||
        t === LessonType.REMEDIAL
      );
    });

    const backUrl = computed(() => {
      if (cuestionario.value.id) {
        return `/cuestionario/${cuestionario.value.id}`;
      } else if (lessonDetails.value) {
        const { course, area, period, year, type } = lessonDetails.value;
        return `/lecciones/${course.id}/${area.id}/${period.id}/${year}${
          type ? "/" + type : ""
        }`;
      } else {
        return `/lecciones`;
      }
    });

    const backUrlAfterDelete = computed(() => {
      if (lessonDetails.value) {
        const { course, area, period, year, type } = lessonDetails.value;
        return `/lecciones/${course.id}/${area.id}/${period.id}/${year}${
          type ? "/" + type : ""
        }`;
      } else {
        return `/lecciones`;
      }
    });

    const handleBack = () => {
      router.push(backUrl.value);
    };

    const loadData = async () => {
      usuario.value = usuarioGet();
      tokenHeader();

      try {
        const response = await axios.get(`/lessons/${lessonId}`);
        lessonDetails.value = response.data;
      } catch (err) {
        console.error("Error fetching lesson details:", err);
        return;
      }

      if (quizId) {
        try {
          const response = await axios.get(`/quizzes/${quizId}`);
          cuestionario.value = {
            id: response.data.id,
            title: response.data.title,
            quizType: response.data.quizType || "group",
            lessonId: response.data.lesson.id,
            instituteId: response.data.lesson.institute.id,
            exist: response.data.exist,
            evaluationType: response.data.evaluationType || "relative",
            category: isReinforcementLesson.value
              ? "regular"
              : (response.data.category ?? "regular"),
          };
        } catch (err) {
          console.error("Error fetching quiz details:", err);
          cuestionario.value = {
            id: null,
            title: "",
            quizType: isReinforcementLesson.value
              ? "individual"
              : "group",
            lessonId: parseInt(lessonId, 10),
            instituteId: usuario.value?.institute?.id || 1,
            exist: true,
            evaluationType: "relative",
            category: "regular",
          };
        }
      } else {
        cuestionario.value = {
          id: null,
          title: "",
          quizType: isReinforcementLesson.value
            ? "individual"
            : "group",
          lessonId: parseInt(lessonId, 10),
          instituteId: usuario.value?.institute?.id || 1,
          exist: true,
          evaluationType: "relative",
          category: "regular",
        };
      }
    };

    onIonViewWillEnter(async () => {
      await loadData();
    });

    onMounted(async () => {
      await loadData();
    });

    const borrarCuestionario = async () => {
      try {
        await axios.delete(`/quizzes/${quizId}`);
        router.push(backUrlAfterDelete.value);
      } catch (err) {
        console.error("Error deleting quiz:", err);
        error.value.estatus = 1;
        error.value.data = "No se pudo eliminar el cuestionario";
      }
    };

    const confirmarBorrado = async () => {
      const alert = await alertController.create({
        header: "Eliminar Cuestionario",
        message:
          "¿Estás seguro de que deseas eliminar este cuestionario? Esta acción no se puede deshacer.",
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Eliminar",
            role: "destructive",
            handler: () => {
              borrarCuestionario();
            },
          },
        ],
      });
      await alert.present();
    };

    const crearCuestionario = async () => {
      if (!cuestionario.value.title || cuestionario.value.title.trim() === "") {
        error.value.estatus = 1;
        error.value.data = "Debe añadir un título al cuestionario";
        return;
      }

      error.value.estatus = 0;
      error.value.data = "";
      saving.value = true;

      const payload = {
        title: cuestionario.value.title.trim(),
        quizType: cuestionario.value.quizType,
        lessonId: cuestionario.value.lessonId,
        instituteId: cuestionario.value.instituteId,
        evaluationType: cuestionario.value.evaluationType,
        category: isReinforcementLesson.value
          ? "regular"
          : cuestionario.value.category,
      };

      try {
        let response;
        if (quizId) {
          payload.exist = cuestionario.value.exist;
          response = await axios.patch(`/quizzes/${quizId}`, payload);
        } else {
          response = await axios.post("/quizzes", payload);
        }

        router.push("/cuestionario/" + response.data.id);
        localStorage.setItem(
          "error",
          response.data.message || "Operación exitosa"
        );
      } catch (err) {
        console.error("Error saving questionnaire:", err);
        error.value.estatus = 1;
        error.value.data =
          err.response?.data?.message ||
          "Error: no se pudo guardar el cuestionario";
      } finally {
        saving.value = false;
      }
    };

    return {
      cuestionario,
      error,
      saving,
      isEditing,
      lessonId,
      lessonDetails,
      isReinforcementLesson,
      handleBack,
      crearCuestionario,
      confirmarBorrado,
      arrowBackOutline,
      trashOutline,
      documentTextOutline,
      peopleOutline,
      personOutline,
      trendingUpOutline,
      flagOutline,
      clipboardOutline,
      ribbonOutline,
      checkmarkCircle,
      ellipseOutline,
      alertCircleOutline,
      schoolOutline,
    };
  },
};
</script>

<style scoped>
.qz-create-quiz-page {
  background-color: var(--qz-color-purple-bg, #EFEEFC);
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

.qz-create-quiz-content {
  --background: var(--qz-color-purple-bg, #EFEEFC);
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
}

.qz-page-container {
  max-width: 580px;
  margin: 0 auto;
  padding: 16px 16px 20px 16px;
}

/* 1. BARRA SUPERIOR */
.qz-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.qz-top-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0C092A;
  text-align: center;
  letter-spacing: -0.3px;
}

.qz-circle-btn {
  width: 42px;
  height: 42px;
  border-radius: var(--qz-radius-full, 9999px);
  background: #FFFFFF;
  border: 1px solid #ECEAF9;
  color: #0C092A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.06);
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-circle-btn:active {
  transform: scale(0.92);
  background: #F4F3FD;
}

.qz-btn--delete {
  color: #FF5656;
  border-color: #FFEAEA;
  background: #FFFFFF;
}

.qz-btn--delete:active {
  background: #FFEAEA;
}

.qz-placeholder-btn {
  width: 42px;
  height: 42px;
}

/* 2. CHIP / TARJETA DE LECCIÓN */
.qz-lesson-chip-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.05);
  border: 1px solid rgba(106, 90, 224, 0.06);
}

.qz-lesson-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: #EFEEFC;
  color: var(--ion-color-primary, #6A5AE0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-lesson-info {
  flex: 1;
  min-width: 0;
}

.qz-lesson-pre {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: #858494;
  text-transform: uppercase;
}

.qz-lesson-title {
  margin: 1px 0 0 0;
  font-size: 14px;
  font-weight: 800;
  color: #0C092A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-lesson-course {
  display: block;
  font-size: 11px;
  color: #858494;
  margin-top: 1px;
}

/* 3. FORMULARIO Y TARJETAS */
.qz-form-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-error-banner {
  background: #FFEAEA;
  border: 1px solid #FF8FA2;
  color: #FF5656;
  border-radius: 16px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-error-banner ion-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.qz-form-card {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 6px 18px rgba(106, 90, 224, 0.06);
  border: 1px solid rgba(106, 90, 224, 0.04);
}

.qz-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.qz-field-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.qz-icon--purple {
  background: #EFEEFC;
  color: #6A5AE0;
}

.qz-icon--coral {
  background: #FFEAEA;
  color: #FF7562;
}

.qz-icon--gold {
  background: #FFF3DA;
  color: #E59800;
}

.qz-icon--orange {
  background: #FFF0E6;
  color: #FF8533;
}

.qz-card-header-texts {
  flex: 1;
}

.qz-field-label {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #0C092A;
  margin-bottom: 2px;
}

.qz-field-desc {
  margin: 0;
  font-size: 11px;
  color: #858494;
  line-height: 1.35;
}

/* INPUT DE TEXTO */
.qz-input-wrap {
  margin-top: 4px;
}

.qz-text-input {
  width: 100%;
  background: #F9F9FE;
  border: 2px solid #ECEAF9;
  border-radius: 16px;
  padding: 12px 14px;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 14px;
  font-weight: 600;
  color: #0C092A;
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
  box-sizing: border-box;
}

.qz-text-input:focus {
  border-color: var(--ion-color-primary, #6A5AE0);
  background: #FFFFFF;
}

.qz-text-input::placeholder {
  color: #B8B6CB;
  font-weight: 400;
}

/* GRID DE OPCIONES (CHOICE CARDS) */
.qz-choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.qz-choice-card {
  background: #F9F9FE;
  border: 2px solid #ECEAF9;
  border-radius: 18px;
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
  user-select: none;
}

.qz-choice-card:active {
  transform: scale(0.97);
}

.qz-choice-card.is-selected {
  border-color: var(--ion-color-primary, #6A5AE0);
  background: #F4F3FD;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.12);
}

.qz-choice-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.qz-choice-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.qz-choice--purple {
  background: #EFEEFC;
  color: #6A5AE0;
}

.qz-choice--coral {
  background: #FFEAEA;
  color: #FF7562;
}

.qz-choice--gold {
  background: #FFF3DA;
  color: #E59800;
}

.qz-choice--cyan {
  background: #E2F6FC;
  color: #0582CA;
}

.qz-choice--orange {
  background: #FFF0E6;
  color: #FF8533;
}

.qz-choice-radio {
  font-size: 20px;
  color: #D2D0E4;
}

.qz-choice-card.is-selected .qz-choice-radio {
  color: var(--ion-color-primary, #6A5AE0);
}

.qz-choice-title {
  font-size: 13px;
  font-weight: 800;
  color: #0C092A;
  margin-bottom: 3px;
}

.qz-choice-sub {
  margin: 0;
  font-size: 10.5px;
  color: #858494;
  line-height: 1.3;
}

/* BOTÓN DE ACCIÓN FINAL */
.qz-actions-footer {
  margin-top: 8px;
}

.qz-submit-btn {
  width: 100%;
  background: var(--ion-color-primary, #6A5AE0);
  color: #FFFFFF;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 15px 20px;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(106, 90, 224, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.qz-submit-btn:active {
  transform: scale(0.985);
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.2);
}

.qz-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.qz-submit-btn ion-icon {
  font-size: 18px;
}

@media (max-width: 360px) {
  .qz-choice-grid {
    grid-template-columns: 1fr;
  }
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  .qz-create-quiz-page {
    background-color: #120f24;
  }
  .qz-create-quiz-content {
    --background: #120f24;
  }
  .qz-top-title {
    color: #f7f7fd;
  }
  .qz-circle-btn {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.12);
    color: #f7f7fd;
  }
  .qz-btn--delete {
    background: #1d1838;
  }
  .qz-lesson-chip-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-lesson-icon-box {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-lesson-title {
    color: #f7f7fd;
  }
  .qz-form-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-icon--purple {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-field-label {
    color: #f7f7fd;
  }
  .qz-text-input {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.12);
    color: #f7f7fd;
  }
  .qz-text-input:focus {
    background: #2a2254;
    border-color: #7c6ef2;
  }
  .qz-choice-card {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-choice--purple {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-choice-title {
    color: #f7f7fd;
  }
}

:global(body.dark) .qz-create-quiz-page,
:global(html.dark) .qz-create-quiz-page,
:global(.dark) .qz-create-quiz-page {
  background-color: #120f24;
}

:global(body.dark) .qz-create-quiz-content,
:global(html.dark) .qz-create-quiz-content,
:global(.dark) .qz-create-quiz-content {
  --background: #120f24;
}

:global(body.dark) .qz-top-title,
:global(html.dark) .qz-top-title,
:global(.dark) .qz-top-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-circle-btn,
:global(html.dark) .qz-circle-btn,
:global(.dark) .qz-circle-btn {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.12);
  color: #f7f7fd;
}

:global(body.dark) .qz-btn--delete,
:global(html.dark) .qz-btn--delete,
:global(.dark) .qz-btn--delete {
  background: #1d1838;
}

:global(body.dark) .qz-lesson-chip-card,
:global(html.dark) .qz-lesson-chip-card,
:global(.dark) .qz-lesson-chip-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-lesson-icon-box,
:global(html.dark) .qz-lesson-icon-box,
:global(.dark) .qz-lesson-icon-box {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-lesson-title,
:global(html.dark) .qz-lesson-title,
:global(.dark) .qz-lesson-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-form-card,
:global(html.dark) .qz-form-card,
:global(.dark) .qz-form-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-icon--purple,
:global(html.dark) .qz-icon--purple,
:global(.dark) .qz-icon--purple {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-field-label,
:global(html.dark) .qz-field-label,
:global(.dark) .qz-field-label {
  color: #f7f7fd;
}

:global(body.dark) .qz-text-input,
:global(html.dark) .qz-text-input,
:global(.dark) .qz-text-input {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.12);
  color: #f7f7fd;
}

:global(body.dark) .qz-text-input:focus,
:global(html.dark) .qz-text-input:focus,
:global(.dark) .qz-text-input:focus {
  background: #2a2254;
  border-color: #7c6ef2;
}

:global(body.dark) .qz-choice-card,
:global(html.dark) .qz-choice-card,
:global(.dark) .qz-choice-card {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-choice--purple,
:global(html.dark) .qz-choice--purple,
:global(.dark) .qz-choice--purple {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-choice-title,
:global(html.dark) .qz-choice-title,
:global(.dark) .qz-choice-title {
  color: #f7f7fd;
}
</style>
