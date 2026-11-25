<template>
  <ion-page class="ion-page qz-poll-form-page">
    <ion-content :fullscreen="true" class="qz-poll-form-content">
      <div class="qz-poll-form-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top">
              <button
                type="button"
                class="qz-back-btn"
                title="Volver a encuestas"
                aria-label="Volver"
                @click="goBack"
              >
                <ion-icon :icon="arrowBackOutline"></ion-icon>
              </button>
              <span class="qz-hero-tag">
                {{ isEditMode ? "EDICIÓN" : "NUEVA ENCUESTA" }}
              </span>
            </div>

            <h1 class="qz-hero-title">
              {{ isEditMode ? "Editar Encuesta" : "Crear Encuesta" }}
            </h1>
            <p class="qz-hero-subtitle">
              Configura la pregunta, el curso y las opciones de votación
            </p>
          </div>
        </header>

        <!-- 2. FORMULARIO QUEEZY -->
        <main class="qz-form-body">
          <!-- Información Principal -->
          <section class="qz-card">
            <div class="qz-field-group">
              <label class="qz-field-label">Título</label>
              <input
                v-model="form.title"
                type="text"
                class="qz-input"
                placeholder="Ej: Encuesta del día"
              />
            </div>

            <div class="qz-field-group">
              <label class="qz-field-label">Pregunta</label>
              <textarea
                v-model="form.question"
                rows="3"
                class="qz-textarea"
                placeholder="Ej: ¿Cuál es tu color favorito?"
              ></textarea>
            </div>

            <div v-if="isEditMode" class="qz-toggle-row">
              <span class="qz-toggle-label">Encuesta activa</span>
              <ion-toggle v-model="form.active"></ion-toggle>
            </div>
          </section>

          <!-- Contexto y Modo -->
          <section class="qz-card">
            <div class="qz-grid-2">
              <div class="qz-field-group">
                <label class="qz-field-label">Año</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="calendarOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <ion-select
                    v-model="form.year"
                    interface="popover"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    placeholder="Año"
                    class="qz-compact-select"
                  >
                    <ion-select-option
                      v-for="year in years"
                      :key="year"
                      :value="year"
                    >
                      {{ year }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>

              <div class="qz-field-group">
                <label class="qz-field-label">Periodo</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="layersOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <ion-select
                    v-model="form.periodId"
                    interface="popover"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    placeholder="Periodo"
                    class="qz-compact-select"
                  >
                    <ion-select-option
                      v-for="periodo in periodos"
                      :key="periodo.id"
                      :value="periodo.id"
                    >
                      {{ periodo.name }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>

              <div class="qz-field-group">
                <label class="qz-field-label">Curso</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="schoolOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <ion-select
                    v-model="form.courseId"
                    interface="popover"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    placeholder="Selecciona un curso"
                    class="qz-compact-select"
                  >
                    <ion-select-option
                      v-for="course in courses"
                      :key="course.id"
                      :value="course.id"
                    >
                      {{ course.name }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>

              <div class="qz-field-group">
                <label class="qz-field-label">Modo de votación</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="peopleOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <ion-select
                    v-model="form.mode"
                    interface="popover"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    placeholder="Modo"
                    class="qz-compact-select"
                  >
                    <ion-select-option value="group">Grupal</ion-select-option>
                    <ion-select-option value="individual">
                      Individual
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>
            </div>

            <div v-if="form.mode === 'group'" class="qz-info-banner">
              <ion-icon :icon="informationCircleOutline"></ion-icon>
              <span>
                Los estudiantes votarán en nombre de su grupo (un voto por
                grupo).
              </span>
            </div>
          </section>

          <!-- Opciones -->
          <section class="qz-card">
            <div class="qz-options-header">
              <span class="qz-field-label">Opciones de respuesta</span>
              <span class="qz-options-hint">
                {{
                  isEditMode
                    ? "Bloqueadas para proteger votos existentes"
                    : "Mínimo 2 opciones"
                }}
              </span>
            </div>

            <div class="qz-options-list">
              <div
                v-for="(option, index) in form.options"
                :key="index"
                class="qz-option-row"
              >
                <input
                  v-model="form.options[index].text"
                  type="text"
                  class="qz-input qz-option-input"
                  :placeholder="`Opción ${index + 1}`"
                  :disabled="isEditMode"
                />
                <button
                  v-if="form.options.length > 2 && !isEditMode"
                  type="button"
                  class="qz-btn-icon-danger"
                  title="Eliminar opción"
                  @click="removeOption(index)"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                </button>
              </div>
            </div>

            <button
              v-if="!isEditMode"
              type="button"
              class="qz-btn-outline"
              @click="addOption"
            >
              <ion-icon :icon="addOutline"></ion-icon>
              <span>Agregar opción</span>
            </button>
          </section>

          <!-- Error -->
          <div v-if="errorMsg" class="qz-error-banner">
            {{ errorMsg }}
          </div>

          <!-- Submit -->
          <button
            type="button"
            class="qz-btn-primary"
            :disabled="submitting"
            @click="submit"
          >
            <ion-spinner
              v-if="submitting"
              name="crescent"
              class="qz-btn-spinner"
            ></ion-spinner>
            <span>
              {{
                submitting
                  ? isEditMode
                    ? "Guardando..."
                    : "Creando..."
                  : isEditMode
                  ? "Guardar Cambios"
                  : "Crear Encuesta"
              }}
            </span>
          </button>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonSpinner,
  IonToggle,
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  addOutline,
  trashOutline,
  informationCircleOutline,
  arrowBackOutline,
  calendarOutline,
  layersOutline,
  schoolOutline,
  peopleOutline,
} from "ionicons/icons";
import axios from "axios";
import {
  tokenHeader,
  usuarioGet,
  selectedPeriod,
  selectedYear,
  periodosGet,
  currentServerYear,
} from "../globalService";

export default {
  name: "CrearEncuesta",
  components: {
    IonPage,
    IonContent,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonSpinner,
    IonToggle,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const courses = ref([]);
    const submitting = ref(false);
    const errorMsg = ref("");
    const isEditMode = ref(false);
    const pollId = ref(null);

    const years = ref([]);
    const periodos = ref([]);

    const form = reactive({
      title: "",
      question: "",
      courseId: null,
      mode: "group",
      options: [{ text: "" }, { text: "" }],
      periodId: null,
      year: null,
      active: true,
    });

    const fetchCourses = async () => {
      try {
        const usuario = usuarioGet();
        const instId = usuario?.institute?.id;
        const url = instId
          ? `/courses?instituteId=${instId}&exist=true`
          : "/courses";
        const response = await axios.get(url, tokenHeader());
        courses.value = (response.data || [])
          .filter((c) => c.exist !== false)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (courses.value.length > 0 && !form.courseId) {
          form.courseId = courses.value[0].id;
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    const fetchPoll = async (id) => {
      try {
        const response = await axios.get(`/polls/${id}`, tokenHeader());
        const fetchedPoll = response.data;

        form.title = fetchedPoll.title;
        form.question = fetchedPoll.question;
        form.courseId = fetchedPoll.course?.id || null;
        form.mode = fetchedPoll.mode;
        form.options = (fetchedPoll.options || []).map((opt) => ({
          text: opt.text,
        }));
        form.periodId = fetchedPoll.period?.id || null;
        form.year = fetchedPoll.year;
        form.active = fetchedPoll.active;
      } catch (error) {
        console.error("Error fetching poll for edit:", error);
        router.push("/encuestas");
      }
    };

    const addOption = () => {
      form.options.push({ text: "" });
    };

    const removeOption = (index) => {
      form.options.splice(index, 1);
    };

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/encuestas");
      }
    };

    const submit = async () => {
      errorMsg.value = "";

      if (!form.title.trim()) {
        errorMsg.value = "El título es obligatorio.";
        return;
      }
      if (!form.question.trim()) {
        errorMsg.value = "La pregunta es obligatoria.";
        return;
      }
      if (!form.courseId) {
        errorMsg.value = "Debes seleccionar un curso.";
        return;
      }
      if (!form.periodId) {
        errorMsg.value = "Debes seleccionar un periodo.";
        return;
      }
      if (!form.year) {
        errorMsg.value = "Debes seleccionar un año.";
        return;
      }

      const validOptions = form.options
        .map((o) => ({ text: (o.text || "").trim() }))
        .filter((o) => o.text.length > 0);

      if (!isEditMode.value && validOptions.length < 2) {
        errorMsg.value = "Debes ingresar al menos 2 opciones.";
        return;
      }

      submitting.value = true;
      try {
        if (isEditMode.value) {
          // Omit options in PATCH so existing votes referencing poll_option IDs are preserved
          const updatePayload = {
            title: form.title.trim(),
            question: form.question.trim(),
            courseId: Number(form.courseId),
            periodId: Number(form.periodId),
            year: Number(form.year),
            mode: form.mode,
            active: Boolean(form.active),
          };
          await axios.patch(
            `/polls/${pollId.value}`,
            updatePayload,
            tokenHeader(),
          );
        } else {
          // CreatePollDto forbids 'active' (forbidNonWhitelisted: true)
          const createPayload = {
            title: form.title.trim(),
            question: form.question.trim(),
            courseId: Number(form.courseId),
            periodId: Number(form.periodId),
            year: Number(form.year),
            mode: form.mode,
            options: validOptions,
          };
          await axios.post("/polls", createPayload, tokenHeader());
        }
        router.push("/encuestas");
      } catch (error) {
        console.error(
          `Error ${isEditMode.value ? "updating" : "creating"} poll:`,
          error,
        );
        const msg = error.response?.data?.message;
        errorMsg.value = Array.isArray(msg)
          ? msg.join(", ")
          : msg ||
            `Error al ${
              isEditMode.value ? "actualizar" : "crear"
            } la encuesta.`;
      } finally {
        submitting.value = false;
      }
    };

    onIonViewWillEnter(async () => {
      pollId.value = route.params.id;
      isEditMode.value = !!pollId.value;

      periodos.value = periodosGet() || [];
      const curServerYear = currentServerYear();
      years.value = new Array(10).fill(0).map((_, i) => curServerYear - i);

      if (!isEditMode.value) {
        form.title = "";
        form.question = "";
        form.courseId = null;
        form.mode = "group";
        form.options = [{ text: "" }, { text: "" }];
        form.active = true;
        form.periodId = selectedPeriod() || periodos.value[0]?.id || null;
        form.year = selectedYear() || curServerYear;
      }
      errorMsg.value = "";

      await fetchCourses();

      if (isEditMode.value) {
        await fetchPoll(pollId.value);
      }
    });

    return {
      form,
      courses,
      submitting,
      errorMsg,
      isEditMode,
      years,
      periodos,
      addOption,
      removeOption,
      goBack,
      submit,
      addOutline,
      trashOutline,
      informationCircleOutline,
      arrowBackOutline,
      calendarOutline,
      layersOutline,
      schoolOutline,
      peopleOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: CREAR / EDITAR ENCUESTA
   ========================================================================== */

.qz-poll-form-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-poll-form-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-poll-form-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
  padding-bottom: 70px;
}

/* 1. CABECERA HERO */
.qz-hero-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  padding: max(20px, env(safe-area-inset-top)) 20px 26px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.2);
}

.qz-hero-inner {
  max-width: 720px;
  margin: 0 auto;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.qz-back-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: all 0.2s ease;
}

.qz-back-btn:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.9px;
  padding: 5px 12px;
  border-radius: 9999px;
  backdrop-filter: blur(6px);
}

.qz-hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: #ffffff;
}

.qz-hero-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
}

/* 2. FORMULARIO */
.qz-form-body {
  padding: 20px 16px 24px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 18px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 6px 18px rgba(12, 9, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

.qz-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 520px) {
  .qz-grid-2 {
    grid-template-columns: 1fr;
  }
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-field-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #6a5ae0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qz-input,
.qz-textarea {
  width: 100%;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.15);
  border-radius: 12px;
  padding: 11px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #0c092a;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.qz-input:focus,
.qz-textarea:focus {
  border-color: #6a5ae0;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.12);
}

.qz-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.qz-textarea {
  resize: vertical;
  min-height: 76px;
}

.qz-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f4f3fd;
  border: 1px solid rgba(106, 90, 224, 0.12);
  border-radius: 12px;
  padding: 10px 14px;
}

.qz-toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: #0c092a;
}

/* SELECTORES */
.qz-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.15);
  border-radius: 12px;
  height: 44px;
  padding: 0 10px 0 36px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.qz-select-wrapper:hover,
.qz-select-wrapper:focus-within {
  border-color: #6a5ae0;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.12);
}

.qz-field-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #6a5ae0;
  pointer-events: none;
  z-index: 2;
}

.qz-compact-select {
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: #0c092a;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-compact-select::part(container) {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.qz-compact-select::part(text) {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #0c092a;
}

.qz-compact-select::part(icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6a5ae0;
  opacity: 0.78;
}

.qz-info-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 12.5px;
  font-weight: 500;
}

.qz-info-banner ion-icon {
  font-size: 18px;
  flex-shrink: 0;
}

/* OPCIONES */
.qz-options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.qz-options-hint {
  font-size: 11.5px;
  color: #858494;
  font-weight: 500;
}

.qz-options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-option-input {
  flex: 1;
}

.qz-btn-icon-danger {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: #fff1f2;
  color: #e11d48;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.qz-btn-icon-danger:hover {
  background: #e11d48;
  color: #ffffff;
}

.qz-btn-outline {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #efeefc;
  color: #6a5ae0;
  border: 1.5px solid rgba(106, 90, 224, 0.2);
  border-radius: 12px;
  padding: 11px 16px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn-outline:hover {
  background: #e2e0fb;
}

.qz-error-banner {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
}

.qz-btn-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.28);
  transition: all 0.2s ease;
}

.qz-btn-primary:hover:not(:disabled) {
  background: #5b4cc9;
  transform: translateY(-1px);
}

.qz-btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.qz-btn-spinner {
  width: 18px;
  height: 18px;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-poll-form-page,
  body:not(.light) .qz-poll-form-content {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-hero-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  }

  body:not(.light) .qz-hero-tag {
    background: rgba(255, 255, 255, 0.12);
    color: #b5a9ff;
    border: 1px solid rgba(181, 169, 255, 0.28);
  }

  body:not(.light) .qz-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
  }

  body:not(.light) .qz-field-label,
  body:not(.light) .qz-field-icon {
    color: #b5a9ff;
  }

  body:not(.light) .qz-input,
  body:not(.light) .qz-textarea,
  body:not(.light) .qz-select-wrapper,
  body:not(.light) .qz-toggle-row {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }

  body:not(.light) .qz-input:focus,
  body:not(.light) .qz-textarea:focus,
  body:not(.light) .qz-select-wrapper:hover,
  body:not(.light) .qz-select-wrapper:focus-within {
    background: #2a2250;
    border-color: #8c7ef8;
    box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.2);
  }

  body:not(.light) .qz-toggle-label {
    color: #f7f7fd;
  }

  body:not(.light) .qz-compact-select,
  body:not(.light) .qz-compact-select::part(text) {
    color: #ffffff;
  }

  body:not(.light) .qz-compact-select::part(icon) {
    color: #b5a9ff;
  }

  body:not(.light) .qz-info-banner {
    background: rgba(37, 99, 235, 0.15);
    border-color: rgba(37, 99, 235, 0.35);
    color: #93c5fd;
  }

  body:not(.light) .qz-options-hint {
    color: #9e9bb8;
  }

  body:not(.light) .qz-btn-outline {
    background: #2b2254;
    color: #b5a9ff;
    border-color: rgba(181, 169, 255, 0.28);
  }

  body:not(.light) .qz-btn-icon-danger {
    background: rgba(225, 29, 72, 0.2);
    color: #fda4af;
  }

  body:not(.light) .qz-error-banner {
    background: rgba(225, 29, 72, 0.18);
    border-color: rgba(225, 29, 72, 0.35);
    color: #fda4af;
  }
}

:global(body.dark) .qz-poll-form-page,
:global(body.dark) .qz-poll-form-content,
:global(html.dark) .qz-poll-form-page,
:global(html.dark) .qz-poll-form-content,
:global(.dark) .qz-poll-form-page,
:global(.dark) .qz-poll-form-content {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

:global(body.dark) .qz-hero-tag,
:global(html.dark) .qz-hero-tag,
:global(.dark) .qz-hero-tag {
  background: rgba(255, 255, 255, 0.12);
  color: #b5a9ff;
  border: 1px solid rgba(181, 169, 255, 0.28);
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-field-label,
:global(html.dark) .qz-field-label,
:global(.dark) .qz-field-label,
:global(body.dark) .qz-field-icon,
:global(html.dark) .qz-field-icon,
:global(.dark) .qz-field-icon {
  color: #b5a9ff;
}

:global(body.dark) .qz-input,
:global(html.dark) .qz-input,
:global(.dark) .qz-input,
:global(body.dark) .qz-textarea,
:global(html.dark) .qz-textarea,
:global(.dark) .qz-textarea,
:global(body.dark) .qz-select-wrapper,
:global(html.dark) .qz-select-wrapper,
:global(.dark) .qz-select-wrapper,
:global(body.dark) .qz-toggle-row,
:global(html.dark) .qz-toggle-row,
:global(.dark) .qz-toggle-row {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

:global(body.dark) .qz-input:focus,
:global(html.dark) .qz-input:focus,
:global(.dark) .qz-input:focus,
:global(body.dark) .qz-textarea:focus,
:global(html.dark) .qz-textarea:focus,
:global(.dark) .qz-textarea:focus,
:global(body.dark) .qz-select-wrapper:hover,
:global(html.dark) .qz-select-wrapper:hover,
:global(.dark) .qz-select-wrapper:hover,
:global(body.dark) .qz-select-wrapper:focus-within,
:global(html.dark) .qz-select-wrapper:focus-within,
:global(.dark) .qz-select-wrapper:focus-within {
  background: #2a2250;
  border-color: #8c7ef8;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.2);
}

:global(body.dark) .qz-toggle-label,
:global(html.dark) .qz-toggle-label,
:global(.dark) .qz-toggle-label {
  color: #f7f7fd;
}

:global(body.dark) .qz-compact-select,
:global(html.dark) .qz-compact-select,
:global(.dark) .qz-compact-select,
:global(body.dark) .qz-compact-select::part(text),
:global(html.dark) .qz-compact-select::part(text),
:global(.dark) .qz-compact-select::part(text) {
  color: #ffffff;
}

:global(body.dark) .qz-compact-select::part(icon),
:global(html.dark) .qz-compact-select::part(icon),
:global(.dark) .qz-compact-select::part(icon) {
  color: #b5a9ff;
}

:global(body.dark) .qz-info-banner,
:global(html.dark) .qz-info-banner,
:global(.dark) .qz-info-banner {
  background: rgba(37, 99, 235, 0.15);
  border-color: rgba(37, 99, 235, 0.35);
  color: #93c5fd;
}

:global(body.dark) .qz-options-hint,
:global(html.dark) .qz-options-hint,
:global(.dark) .qz-options-hint {
  color: #9e9bb8;
}

:global(body.dark) .qz-btn-outline,
:global(html.dark) .qz-btn-outline,
:global(.dark) .qz-btn-outline {
  background: #2b2254;
  color: #b5a9ff;
  border-color: rgba(181, 169, 255, 0.28);
}

:global(body.dark) .qz-btn-icon-danger,
:global(html.dark) .qz-btn-icon-danger,
:global(.dark) .qz-btn-icon-danger {
  background: rgba(225, 29, 72, 0.2);
  color: #fda4af;
}

:global(body.dark) .qz-error-banner,
:global(html.dark) .qz-error-banner,
:global(.dark) .qz-error-banner {
  background: rgba(225, 29, 72, 0.18);
  border-color: rgba(225, 29, 72, 0.35);
  color: #fda4af;
}
</style>
