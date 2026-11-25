<template>
  <ion-page class="ion-page qz-register-page qz-wizard-page">
    <ion-header class="qz-register-header">
      <ion-toolbar class="qz-register-toolbar">
        <ion-buttons slot="start">
          <ion-button @click="handleTopBack" aria-label="Volver">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Registro</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="qz-register-content">
      <div class="qz-auth-wrapper">
        <div class="qz-auth-card">
          <!-- Barra de progreso compacta -->
          <div class="qz-progress-wrap">
            <div class="qz-progress-meta">
              <span>Paso {{ currentStep }} de {{ totalSteps }}</span>
              <span>{{ stepLabel }}</span>
            </div>
            <div class="qz-progress-track">
              <div
                class="qz-progress-fill"
                :style="{ width: `${progressPercent}%` }"
              ></div>
            </div>
          </div>

          <StepRoleSelection
            v-if="currentStep === 1"
            @select="handleRoleSelect"
          />

          <StepInstitutionChoice
            v-else-if="currentStep === 2"
            @select="handleInstitutionChoice"
            @back="currentStep = 1"
          />

          <StepUserSetup
            v-else-if="currentStep === 3"
            v-model:user="wizardState.user"
            @next="currentStep = 4"
            @back="currentStep = 2"
          />

          <StepInstituteSetup
            v-else-if="currentStep === 4"
            v-model:institute="wizardState.institute"
            @next="currentStep = 5"
            @back="currentStep = 3"
          />

          <StepPeriodsSetup
            v-else-if="currentStep === 5"
            v-model:periods="wizardState.periods"
            @next="currentStep = 6"
            @back="currentStep = 4"
          />

          <StepCourseSetup
            v-else-if="currentStep === 6"
            v-model:course="wizardState.course"
            @next="currentStep = 7"
            @back="currentStep = 5"
          />

          <StepAreasSetup
            v-else-if="currentStep === 7"
            v-model:areas="wizardState.areas"
            :course-name="wizardState.course.name"
            :is-submitting="isSubmitting"
            @finish="finishWizard"
            @back="currentStep = 6"
          />
        </div>
      </div>

      <ion-toast
        :is-open="toast.open"
        :message="toast.message"
        :color="toast.color"
        :duration="2600"
        @didDismiss="toast.open = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
} from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";
import { tokenHeader } from "../globalService";
import StepRoleSelection from "../components/register-wizard/StepRoleSelection.vue";
import StepInstitutionChoice from "../components/register-wizard/StepInstitutionChoice.vue";
import StepInstituteSetup from "../components/register-wizard/StepInstituteSetup.vue";
import StepUserSetup from "../components/register-wizard/StepUserSetup.vue";
import StepPeriodsSetup from "../components/register-wizard/StepPeriodsSetup.vue";
import StepCourseSetup from "../components/register-wizard/StepCourseSetup.vue";
import StepAreasSetup from "../components/register-wizard/StepAreasSetup.vue";

const router = useRouter();
const currentStep = ref(1);
const isSubmitting = ref(false);

const wizardState = reactive({
  user: {
    name: "",
    lastName: "",
    email: "",
    code: "",
    telephone: "",
    password: "",
  },
  institute: {
    name: "",
  },
  periods: ["Periodo 1", "Periodo 2"],
  course: {
    name: "",
  },
  areas: [],
});

const toast = reactive({
  open: false,
  message: "",
  color: "danger",
});

const totalSteps = computed(() => (currentStep.value <= 2 ? 2 : 7));
const progressPercent = computed(() =>
  Math.round((currentStep.value / totalSteps.value) * 100)
);

const stepLabels = {
  1: "Perfil",
  2: "Institución",
  3: "Datos usuario",
  4: "Nombre institución",
  5: "Periodos",
  6: "Primer curso",
  7: "Asignaturas",
};
const stepLabel = computed(() => stepLabels[currentStep.value] || "");

const handleTopBack = () => {
  if (currentStep.value > 1) {
    currentStep.value -= 1;
  } else {
    router.push("/login");
  }
};

const handleRoleSelect = (role) => {
  if (role === "student") {
    router.push("/register/classic?role=student");
    return;
  }
  currentStep.value = 2;
};

const handleInstitutionChoice = (choice) => {
  if (choice === "existing") {
    router.push("/register/classic?role=teacher");
    return;
  }
  currentStep.value = 3;
};

const finishWizard = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    tokenHeader();
    const payload = {
      user: {
        name: wizardState.user.name.trim(),
        lastName: wizardState.user.lastName.trim(),
        email: wizardState.user.email.trim() || undefined,
        code: wizardState.user.code.trim(),
        telephone: wizardState.user.telephone.trim() || undefined,
        password: wizardState.user.password,
      },
      institute: {
        name: wizardState.institute.name.trim(),
      },
      periods: wizardState.periods.map((p) => p.trim()).filter(Boolean),
      course: {
        name: wizardState.course.name.trim(),
      },
      areas: wizardState.areas.map((a) => a.trim()).filter(Boolean),
    };

    const response = await axios.post("/auth/register-institute", payload, {
      headers: { "Content-Type": "application/json" },
    });

    const userLoged = response.data?.userLoged;
    if (userLoged?.accessToken) {
      localStorage.setItem("token", "Bearer " + userLoged.accessToken);
      localStorage.setItem("usuario", JSON.stringify(userLoged));
      tokenHeader();
    }

    toast.color = "success";
    toast.message = "¡Institución y cuenta creadas con éxito!";
    toast.open = true;

    setTimeout(() => {
      router.push(userLoged?.accessToken ? "/inicio" : "/login");
    }, 1200);
  } catch (error) {
    const rawMsg = error.response?.data?.message;
    toast.color = "danger";
    toast.message = Array.isArray(rawMsg)
      ? rawMsg.join(", ")
      : rawMsg || "Error al completar el registro.";
    toast.open = true;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style>
/* ==========================================================================
   WIZARD REGISTRO - ESTILOS BASE (LIGHT MODE)
   ========================================================================== */
.qz-wizard-page.ion-page {
  --background: #efeefc;
  background-color: #efeefc;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-wizard-page ion-header.qz-register-header,
.qz-wizard-page ion-toolbar.qz-register-toolbar {
  background: #ffffff !important;
  --background: #ffffff !important;
  --color: #0c092a !important;
  color: #0c092a !important;
  --border-color: rgba(106, 90, 224, 0.12) !important;
}

.qz-wizard-page ion-toolbar.qz-register-toolbar::part(background) {
  background: #ffffff !important;
}

.qz-wizard-page ion-toolbar.qz-register-toolbar ion-title,
.qz-wizard-page ion-toolbar.qz-register-toolbar ion-button {
  color: #0c092a !important;
  --color: #0c092a !important;
}

.qz-wizard-page .qz-register-content {
  --background: #efeefc;
  background-color: #efeefc;
}

.qz-wizard-page .qz-register-content::part(scroll) {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
}

.qz-wizard-page .qz-auth-wrapper {
  margin: auto;
  width: 100%;
  max-width: 580px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px 32px;
  box-sizing: border-box;
}

.qz-wizard-page .qz-auth-card {
  width: 100%;
  background: #ffffff;
  border-radius: 28px;
  padding: 28px 24px;
  box-shadow: 0 18px 42px rgba(106, 90, 224, 0.12);
  border: 1px solid rgba(106, 90, 224, 0.08);
  box-sizing: border-box;
}

.qz-wizard-page .qz-progress-wrap {
  margin-bottom: 22px;
}

.qz-wizard-page .qz-progress-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #6a5ae0;
  margin-bottom: 6px;
}

.qz-wizard-page .qz-progress-track {
  width: 100%;
  height: 6px;
  background: #efeefc;
  border-radius: 999px;
  overflow: hidden;
}

.qz-wizard-page .qz-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6a5ae0 0%, #8f82f0 100%);
  border-radius: 999px;
  transition: width 0.25s ease;
}

.qz-wizard-page .qz-step-header {
  text-align: center;
  margin-bottom: 22px;
}

.qz-wizard-page .qz-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #efeefc;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
}

.qz-wizard-page .qz-step-title {
  margin: 0 0 6px !important;
  font-size: 22px !important;
  font-weight: 700 !important;
  color: #0c092a !important;
}

.qz-wizard-page .qz-step-subtitle {
  margin: 0 !important;
  font-size: 14px !important;
  color: #666382 !important;
  line-height: 1.45 !important;
}

.qz-wizard-page .qz-choice-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-wizard-page .qz-choice-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  background: #faf9ff;
  border: 1.5px solid rgba(106, 90, 224, 0.16);
  border-radius: 18px;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;
}

.qz-wizard-page .qz-choice-card:hover {
  border-color: #6a5ae0;
  background: #f3f1fe;
  transform: translateY(-1px);
}

.qz-wizard-page .qz-choice-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.qz-wizard-page .qz-choice-icon--student,
.qz-wizard-page .qz-choice-icon--existing {
  background: rgba(106, 90, 224, 0.16);
  color: #6a5ae0;
}

.qz-wizard-page .qz-choice-icon--teacher,
.qz-wizard-page .qz-choice-icon--new {
  background: rgba(255, 138, 101, 0.18);
  color: #ff8a65;
}

.qz-wizard-page .qz-choice-body {
  flex: 1;
}

.qz-wizard-page .qz-choice-body h3 {
  margin: 0 0 4px !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  color: #0c092a !important;
}

.qz-wizard-page .qz-choice-body p {
  margin: 0 !important;
  font-size: 13px !important;
  color: #666382 !important;
  line-height: 1.4 !important;
}

.qz-wizard-page .qz-choice-arrow {
  font-size: 20px;
  color: #9e9bb5;
}

.qz-wizard-page .qz-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-wizard-page .qz-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 520px) {
  .qz-wizard-page .qz-form-grid {
    grid-template-columns: 1fr;
  }
}

.qz-wizard-page .qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.qz-wizard-page .qz-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #2f2b4e;
}

.qz-wizard-page .qz-required {
  color: #ff6b6b;
}

.qz-wizard-page .qz-input-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 46px;
  border-radius: 14px;
  background: #f7f6fc;
  border: 1.5px solid rgba(106, 90, 224, 0.14);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.qz-wizard-page .qz-input-box--focused {
  border-color: #6a5ae0;
  background: #ffffff;
}

.qz-wizard-page .qz-input-icon {
  font-size: 18px;
  color: #6a5ae0;
  flex-shrink: 0;
}

.qz-wizard-page .qz-native-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #0c092a;
}

.qz-wizard-page .qz-native-input::placeholder {
  color: #8d89a8;
}

.qz-wizard-page .qz-eye-btn {
  border: none;
  background: transparent;
  color: #666382;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 18px;
}

.qz-wizard-page .qz-count-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.qz-wizard-page .qz-preset-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.qz-wizard-page .qz-preset-pill {
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(106, 90, 224, 0.25);
  background: #faf9ff;
  color: #4b476b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.qz-wizard-page .qz-preset-pill.is-active {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
}

.qz-wizard-page .qz-stepper-control {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #f7f6fc;
  border-radius: 12px;
  padding: 4px 8px;
  border: 1px solid rgba(106, 90, 224, 0.16);
}

.qz-wizard-page .qz-stepper-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: #ffffff;
  color: #6a5ae0;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
}

.qz-wizard-page .qz-stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qz-wizard-page .qz-stepper-val {
  min-width: 20px;
  text-align: center;
  font-weight: 700;
  color: #0c092a;
}

.qz-wizard-page .qz-periods-list {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.qz-wizard-page .qz-add-row {
  display: flex;
  gap: 8px;
}

.qz-wizard-page .qz-add-input {
  flex: 1;
}

.qz-wizard-page .qz-btn-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 46px;
  border-radius: 14px;
  border: none;
  background: #6a5ae0;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.qz-wizard-page .qz-quick-suggestions {
  margin: 10px 0 14px;
}

.qz-wizard-page .qz-suggestions-label {
  display: block;
  font-size: 12px;
  color: #666382;
  margin-bottom: 6px;
}

.qz-wizard-page .qz-suggestions-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.qz-wizard-page .qz-suggestion-pill {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px dashed rgba(106, 90, 224, 0.35);
  background: transparent;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.qz-wizard-page .qz-suggestion-pill:disabled {
  opacity: 0.4;
  cursor: default;
}

.qz-wizard-page .qz-areas-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.qz-wizard-page .qz-area-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  background: #efeefc;
  color: #4638b8;
  font-size: 13px;
  font-weight: 600;
}

.qz-wizard-page .qz-area-remove {
  border: none;
  background: transparent;
  color: #4638b8;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0;
}

.qz-wizard-page .qz-empty-hint {
  font-size: 13px;
  color: #8581a0;
  text-align: center;
  margin: 12px 0;
}

.qz-wizard-page .qz-inline-error {
  margin: 4px 0 8px;
  color: #ff6b6b;
  font-size: 13px;
  font-weight: 500;
}

.qz-wizard-page .qz-step-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
}

.qz-wizard-page .qz-step-actions--single {
  justify-content: flex-start;
}

.qz-wizard-page .qz-btn-primary,
.qz-wizard-page .qz-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  padding: 0 20px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.qz-wizard-page .qz-btn-primary {
  background: #6a5ae0;
  color: #ffffff;
  flex: 1;
}

.qz-wizard-page .qz-btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.qz-wizard-page .qz-btn-secondary {
  background: #efeefc;
  color: #4638b8;
}

/* ==========================================================================
   WIZARD REGISTRO - MODO OSCURO (DARK MODE)
   Abarca tanto clases (.dark, body.dark, html.dark, [data-theme="dark"])
   como el media query nativo (prefers-color-scheme: dark)
   ========================================================================== */
body.dark .qz-wizard-page.ion-page,
html.dark .qz-wizard-page.ion-page,
.dark .qz-wizard-page.ion-page,
:root[data-theme="dark"] .qz-wizard-page.ion-page,
body.dark .qz-wizard-page .qz-register-content,
html.dark .qz-wizard-page .qz-register-content,
.dark .qz-wizard-page .qz-register-content,
:root[data-theme="dark"] .qz-wizard-page .qz-register-content {
  --background: #110d26 !important;
  background-color: #110d26 !important;
}

body.dark .qz-wizard-page ion-header.qz-register-header,
html.dark .qz-wizard-page ion-header.qz-register-header,
.dark .qz-wizard-page ion-header.qz-register-header,
:root[data-theme="dark"] .qz-wizard-page ion-header.qz-register-header,
body.dark .qz-wizard-page ion-toolbar.qz-register-toolbar,
html.dark .qz-wizard-page ion-toolbar.qz-register-toolbar,
.dark .qz-wizard-page ion-toolbar.qz-register-toolbar,
:root[data-theme="dark"] .qz-wizard-page ion-toolbar.qz-register-toolbar {
  background: #1d1838 !important;
  --background: #1d1838 !important;
  --color: #f7f7fd !important;
  color: #f7f7fd !important;
  --border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-wizard-page ion-toolbar.qz-register-toolbar::part(background),
html.dark .qz-wizard-page ion-toolbar.qz-register-toolbar::part(background),
.dark .qz-wizard-page ion-toolbar.qz-register-toolbar::part(background),
:root[data-theme="dark"] .qz-wizard-page ion-toolbar.qz-register-toolbar::part(background) {
  background: #1d1838 !important;
}

body.dark .qz-wizard-page ion-toolbar.qz-register-toolbar ion-title,
html.dark .qz-wizard-page ion-toolbar.qz-register-toolbar ion-title,
.dark .qz-wizard-page ion-toolbar.qz-register-toolbar ion-title,
:root[data-theme="dark"] .qz-wizard-page ion-toolbar.qz-register-toolbar ion-title,
body.dark .qz-wizard-page ion-toolbar.qz-register-toolbar ion-button,
html.dark .qz-wizard-page ion-toolbar.qz-register-toolbar ion-button,
.dark .qz-wizard-page ion-toolbar.qz-register-toolbar ion-button,
:root[data-theme="dark"] .qz-wizard-page ion-toolbar.qz-register-toolbar ion-button {
  color: #f7f7fd !important;
  --color: #f7f7fd !important;
}

body.dark .qz-wizard-page .qz-auth-card,
html.dark .qz-wizard-page .qz-auth-card,
.dark .qz-wizard-page .qz-auth-card,
:root[data-theme="dark"] .qz-wizard-page .qz-auth-card {
  background: #1d1838 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.25) !important;
}

body.dark .qz-wizard-page .qz-progress-track,
html.dark .qz-wizard-page .qz-progress-track,
.dark .qz-wizard-page .qz-progress-track,
:root[data-theme="dark"] .qz-wizard-page .qz-progress-track {
  background: #2b2452 !important;
}

body.dark .qz-wizard-page .qz-progress-meta,
html.dark .qz-wizard-page .qz-progress-meta,
.dark .qz-wizard-page .qz-progress-meta,
:root[data-theme="dark"] .qz-wizard-page .qz-progress-meta {
  color: #a39bf0 !important;
}

body.dark .qz-wizard-page .qz-badge-pill,
html.dark .qz-wizard-page .qz-badge-pill,
.dark .qz-wizard-page .qz-badge-pill,
:root[data-theme="dark"] .qz-wizard-page .qz-badge-pill {
  background: rgba(124, 110, 242, 0.18) !important;
  color: #a39bf0 !important;
}

body.dark .qz-wizard-page .qz-step-title,
html.dark .qz-wizard-page .qz-step-title,
.dark .qz-wizard-page .qz-step-title,
:root[data-theme="dark"] .qz-wizard-page .qz-step-title {
  color: #f7f7fd !important;
}

body.dark .qz-wizard-page .qz-step-subtitle,
html.dark .qz-wizard-page .qz-step-subtitle,
.dark .qz-wizard-page .qz-step-subtitle,
:root[data-theme="dark"] .qz-wizard-page .qz-step-subtitle {
  color: #9e9bb8 !important;
}

body.dark .qz-wizard-page .qz-choice-card,
html.dark .qz-wizard-page .qz-choice-card,
.dark .qz-wizard-page .qz-choice-card,
:root[data-theme="dark"] .qz-wizard-page .qz-choice-card {
  background: #252048 !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

body.dark .qz-wizard-page .qz-choice-card:hover,
html.dark .qz-wizard-page .qz-choice-card:hover,
.dark .qz-wizard-page .qz-choice-card:hover,
:root[data-theme="dark"] .qz-wizard-page .qz-choice-card:hover {
  background: #2e2858 !important;
  border-color: #7c6ef2 !important;
}

body.dark .qz-wizard-page .qz-choice-body h3,
html.dark .qz-wizard-page .qz-choice-body h3,
.dark .qz-wizard-page .qz-choice-body h3,
:root[data-theme="dark"] .qz-wizard-page .qz-choice-body h3 {
  color: #f7f7fd !important;
}

body.dark .qz-wizard-page .qz-choice-body p,
html.dark .qz-wizard-page .qz-choice-body p,
.dark .qz-wizard-page .qz-choice-body p,
:root[data-theme="dark"] .qz-wizard-page .qz-choice-body p {
  color: #9e9bb8 !important;
}

body.dark .qz-wizard-page .qz-field-label,
html.dark .qz-wizard-page .qz-field-label,
.dark .qz-wizard-page .qz-field-label,
:root[data-theme="dark"] .qz-wizard-page .qz-field-label {
  color: #f7f7fd !important;
}

body.dark .qz-wizard-page .qz-input-box,
html.dark .qz-wizard-page .qz-input-box,
.dark .qz-wizard-page .qz-input-box,
:root[data-theme="dark"] .qz-wizard-page .qz-input-box {
  background: #17132e !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
}

body.dark .qz-wizard-page .qz-input-box--focused,
html.dark .qz-wizard-page .qz-input-box--focused,
.dark .qz-wizard-page .qz-input-box--focused,
:root[data-theme="dark"] .qz-wizard-page .qz-input-box--focused {
  border-color: #7c6ef2 !important;
  background: #1f1a3d !important;
  box-shadow: 0 0 0 4px rgba(124, 110, 242, 0.22) !important;
}

body.dark .qz-wizard-page .qz-input-icon,
html.dark .qz-wizard-page .qz-input-icon,
.dark .qz-wizard-page .qz-input-icon,
:root[data-theme="dark"] .qz-wizard-page .qz-input-icon,
body.dark .qz-wizard-page .qz-eye-btn,
html.dark .qz-wizard-page .qz-eye-btn,
.dark .qz-wizard-page .qz-eye-btn,
:root[data-theme="dark"] .qz-wizard-page .qz-eye-btn {
  color: #9e9bb8 !important;
}

body.dark .qz-wizard-page .qz-native-input,
html.dark .qz-wizard-page .qz-native-input,
.dark .qz-wizard-page .qz-native-input,
:root[data-theme="dark"] .qz-wizard-page .qz-native-input {
  color: #f7f7fd !important;
}

body.dark .qz-wizard-page .qz-native-input::placeholder,
html.dark .qz-wizard-page .qz-native-input::placeholder,
.dark .qz-wizard-page .qz-native-input::placeholder,
:root[data-theme="dark"] .qz-wizard-page .qz-native-input::placeholder {
  color: #6e6b8b !important;
}

body.dark .qz-wizard-page .qz-preset-pill,
html.dark .qz-wizard-page .qz-preset-pill,
.dark .qz-wizard-page .qz-preset-pill,
:root[data-theme="dark"] .qz-wizard-page .qz-preset-pill {
  background: #252048 !important;
  color: #f7f7fd !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
}

body.dark .qz-wizard-page .qz-preset-pill.is-active,
html.dark .qz-wizard-page .qz-preset-pill.is-active,
.dark .qz-wizard-page .qz-preset-pill.is-active,
:root[data-theme="dark"] .qz-wizard-page .qz-preset-pill.is-active {
  background: #7c6ef2 !important;
  color: #ffffff !important;
  border-color: #7c6ef2 !important;
}

body.dark .qz-wizard-page .qz-stepper-control,
html.dark .qz-wizard-page .qz-stepper-control,
.dark .qz-wizard-page .qz-stepper-control,
:root[data-theme="dark"] .qz-wizard-page .qz-stepper-control {
  background: #17132e !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
}

body.dark .qz-wizard-page .qz-stepper-btn,
html.dark .qz-wizard-page .qz-stepper-btn,
.dark .qz-wizard-page .qz-stepper-btn,
:root[data-theme="dark"] .qz-wizard-page .qz-stepper-btn {
  background: #2a2452 !important;
  color: #f7f7fd !important;
}

body.dark .qz-wizard-page .qz-stepper-val,
html.dark .qz-wizard-page .qz-stepper-val,
.dark .qz-wizard-page .qz-stepper-val,
:root[data-theme="dark"] .qz-wizard-page .qz-stepper-val {
  color: #f7f7fd !important;
}

body.dark .qz-wizard-page .qz-suggestions-label,
html.dark .qz-wizard-page .qz-suggestions-label,
.dark .qz-wizard-page .qz-suggestions-label,
:root[data-theme="dark"] .qz-wizard-page .qz-suggestions-label {
  color: #9e9bb8 !important;
}

body.dark .qz-wizard-page .qz-suggestion-pill,
html.dark .qz-wizard-page .qz-suggestion-pill,
.dark .qz-wizard-page .qz-suggestion-pill,
:root[data-theme="dark"] .qz-wizard-page .qz-suggestion-pill {
  border-color: rgba(124, 110, 242, 0.4) !important;
  color: #a39bf0 !important;
}

body.dark .qz-wizard-page .qz-area-chip,
html.dark .qz-wizard-page .qz-area-chip,
.dark .qz-wizard-page .qz-area-chip,
:root[data-theme="dark"] .qz-wizard-page .qz-area-chip {
  background: #252048 !important;
  color: #f7f7fd !important;
}

body.dark .qz-wizard-page .qz-area-remove,
html.dark .qz-wizard-page .qz-area-remove,
.dark .qz-wizard-page .qz-area-remove,
:root[data-theme="dark"] .qz-wizard-page .qz-area-remove {
  color: #a39bf0 !important;
}

body.dark .qz-wizard-page .qz-btn-secondary,
html.dark .qz-wizard-page .qz-btn-secondary,
.dark .qz-wizard-page .qz-btn-secondary,
:root[data-theme="dark"] .qz-wizard-page .qz-btn-secondary {
  background: #252048 !important;
  color: #f7f7fd !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
}

body.dark .qz-wizard-page .qz-btn-secondary:hover,
html.dark .qz-wizard-page .qz-btn-secondary:hover,
.dark .qz-wizard-page .qz-btn-secondary:hover,
:root[data-theme="dark"] .qz-wizard-page .qz-btn-secondary:hover {
  background: #2c2654 !important;
  color: #a39bf0 !important;
  border-color: #7c6ef2 !important;
}

/* ==========================================================================
   Soporte para @media (prefers-color-scheme: dark) cuando el sistema operativo
   o navegador está en modo oscuro y no tiene clase .light
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-wizard-page.ion-page,
  body:not(.light) .qz-wizard-page .qz-register-content {
    --background: #110d26 !important;
    background-color: #110d26 !important;
  }

  body:not(.light) .qz-wizard-page ion-header.qz-register-header,
  body:not(.light) .qz-wizard-page ion-toolbar.qz-register-toolbar {
    background: #1d1838 !important;
    --background: #1d1838 !important;
    --color: #f7f7fd !important;
    color: #f7f7fd !important;
    --border-color: rgba(255, 255, 255, 0.08) !important;
  }

  body:not(.light) .qz-wizard-page ion-toolbar.qz-register-toolbar::part(background) {
    background: #1d1838 !important;
  }

  body:not(.light) .qz-wizard-page ion-toolbar.qz-register-toolbar ion-title,
  body:not(.light) .qz-wizard-page ion-toolbar.qz-register-toolbar ion-button {
    color: #f7f7fd !important;
    --color: #f7f7fd !important;
  }

  body:not(.light) .qz-wizard-page .qz-auth-card {
    background: #1d1838 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.25) !important;
  }

  body:not(.light) .qz-wizard-page .qz-progress-track {
    background: #2b2452 !important;
  }

  body:not(.light) .qz-wizard-page .qz-progress-meta {
    color: #a39bf0 !important;
  }

  body:not(.light) .qz-wizard-page .qz-badge-pill {
    background: rgba(124, 110, 242, 0.18) !important;
    color: #a39bf0 !important;
  }

  body:not(.light) .qz-wizard-page .qz-step-title {
    color: #f7f7fd !important;
  }

  body:not(.light) .qz-wizard-page .qz-step-subtitle {
    color: #9e9bb8 !important;
  }

  body:not(.light) .qz-wizard-page .qz-choice-card {
    background: #252048 !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }

  body:not(.light) .qz-wizard-page .qz-choice-card:hover {
    background: #2e2858 !important;
    border-color: #7c6ef2 !important;
  }

  body:not(.light) .qz-wizard-page .qz-choice-body h3 {
    color: #f7f7fd !important;
  }

  body:not(.light) .qz-wizard-page .qz-choice-body p {
    color: #9e9bb8 !important;
  }

  body:not(.light) .qz-wizard-page .qz-field-label {
    color: #f7f7fd !important;
  }

  body:not(.light) .qz-wizard-page .qz-input-box {
    background: #17132e !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
  }

  body:not(.light) .qz-wizard-page .qz-input-box--focused {
    border-color: #7c6ef2 !important;
    background: #1f1a3d !important;
    box-shadow: 0 0 0 4px rgba(124, 110, 242, 0.22) !important;
  }

  body:not(.light) .qz-wizard-page .qz-input-icon,
  body:not(.light) .qz-wizard-page .qz-eye-btn {
    color: #9e9bb8 !important;
  }

  body:not(.light) .qz-wizard-page .qz-native-input {
    color: #f7f7fd !important;
  }

  body:not(.light) .qz-wizard-page .qz-native-input::placeholder {
    color: #6e6b8b !important;
  }

  body:not(.light) .qz-wizard-page .qz-preset-pill {
    background: #252048 !important;
    color: #f7f7fd !important;
    border-color: rgba(255, 255, 255, 0.14) !important;
  }

  body:not(.light) .qz-wizard-page .qz-preset-pill.is-active {
    background: #7c6ef2 !important;
    color: #ffffff !important;
    border-color: #7c6ef2 !important;
  }

  body:not(.light) .qz-wizard-page .qz-stepper-control {
    background: #17132e !important;
    border-color: rgba(255, 255, 255, 0.14) !important;
  }

  body:not(.light) .qz-wizard-page .qz-stepper-btn {
    background: #2a2452 !important;
    color: #f7f7fd !important;
  }

  body:not(.light) .qz-wizard-page .qz-stepper-val {
    color: #f7f7fd !important;
  }

  body:not(.light) .qz-wizard-page .qz-suggestions-label {
    color: #9e9bb8 !important;
  }

  body:not(.light) .qz-wizard-page .qz-suggestion-pill {
    border-color: rgba(124, 110, 242, 0.4) !important;
    color: #a39bf0 !important;
  }

  body:not(.light) .qz-wizard-page .qz-area-chip {
    background: #252048 !important;
    color: #f7f7fd !important;
  }

  body:not(.light) .qz-wizard-page .qz-area-remove {
    color: #a39bf0 !important;
  }

  body:not(.light) .qz-wizard-page .qz-btn-secondary {
    background: #252048 !important;
    color: #f7f7fd !important;
    border: 1px solid rgba(255, 255, 255, 0.14) !important;
  }

  body:not(.light) .qz-wizard-page .qz-btn-secondary:hover {
    background: #2c2654 !important;
    color: #a39bf0 !important;
    border-color: #7c6ef2 !important;
  }
}
</style>
