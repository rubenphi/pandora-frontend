<template>
  <div class="qz-wizard-step">
    <div class="qz-step-header">
      <div class="qz-badge-pill">
        <ion-icon :icon="bookOutline"></ion-icon>
        <span>Paso 7 · Asignaturas</span>
      </div>
      <h2 class="qz-step-title">Asignaturas para {{ courseName }}</h2>
      <p class="qz-step-subtitle">
        Agrega al menos una asignatura (área) para este curso. Al finalizar se
        creará toda tu configuración inicial.
      </p>
    </div>

    <div class="qz-field-group">
      <label class="qz-field-label">
        Nueva asignatura <span class="qz-required">*</span>
      </label>
      <div class="qz-add-row">
        <div class="qz-input-box qz-add-input">
          <ion-icon :icon="bookOutline" class="qz-input-icon"></ion-icon>
          <input
            v-model="draftArea"
            type="text"
            placeholder="Ej. Matemáticas"
            class="qz-native-input"
            @keydown.enter.prevent="addArea"
          />
        </div>
        <button type="button" class="qz-btn-add" @click="addArea">
          <ion-icon :icon="addOutline"></ion-icon>
          <span>Agregar</span>
        </button>
      </div>
    </div>

    <div class="qz-quick-suggestions">
      <span class="qz-suggestions-label">Sugerencias rápidas:</span>
      <div class="qz-suggestions-pills">
        <button
          v-for="item in suggestions"
          :key="item"
          type="button"
          class="qz-suggestion-pill"
          :disabled="localAreas.includes(item)"
          @click="addSuggestion(item)"
        >
          + {{ item }}
        </button>
      </div>
    </div>

    <div v-if="localAreas.length > 0" class="qz-areas-list">
      <div v-for="(area, idx) in localAreas" :key="idx" class="qz-area-chip">
        <span>{{ area }}</span>
        <button
          type="button"
          class="qz-area-remove"
          @click="removeArea(idx)"
          aria-label="Eliminar asignatura"
        >
          <ion-icon :icon="closeOutline"></ion-icon>
        </button>
      </div>
    </div>
    <p v-else class="qz-empty-hint">
      Aún no has agregado asignaturas. Agrega al menos una para finalizar.
    </p>

    <p v-if="errorMsg" class="qz-inline-error">{{ errorMsg }}</p>

    <div class="qz-step-actions">
      <button
        type="button"
        class="qz-btn-secondary"
        :disabled="isSubmitting"
        @click="$emit('back')"
      >
        <ion-icon :icon="arrowBackOutline"></ion-icon>
        <span>Anterior</span>
      </button>
      <button
        type="button"
        class="qz-btn-primary"
        :disabled="isSubmitting"
        @click="handleFinish"
      >
        <ion-spinner v-if="isSubmitting" name="crescent"></ion-spinner>
        <template v-else>
          <span>Finalizar registro</span>
          <ion-icon :icon="checkmarkOutline"></ion-icon>
        </template>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { IonIcon, IonSpinner } from "@ionic/vue";
import {
  addOutline,
  arrowBackOutline,
  bookOutline,
  checkmarkOutline,
  closeOutline,
} from "ionicons/icons";

export default {
  components: { IonIcon, IonSpinner },
  props: {
    areas: { type: Array, required: true },
    courseName: { type: String, default: "tu curso" },
    isSubmitting: { type: Boolean, default: false },
  },
  emits: ["finish", "back", "update:areas"],
  setup(props, { emit }) {
    const localAreas = ref([...props.areas]);
    const draftArea = ref("");
    const errorMsg = ref("");
    const suggestions = [
      "Matemáticas",
      "Lenguaje",
      "Ciencias Naturales",
      "Ciencias Sociales",
      "Inglés",
    ];

    watch(
      localAreas,
      (val) => {
        emit("update:areas", [...val]);
      },
      { deep: true }
    );

    const addArea = () => {
      errorMsg.value = "";
      const clean = draftArea.value.trim();
      if (!clean) return;
      if (localAreas.value.some((a) => a.toLowerCase() === clean.toLowerCase())) {
        errorMsg.value = "Esa asignatura ya fue agregada.";
        return;
      }
      localAreas.value.push(clean);
      draftArea.value = "";
    };

    const addSuggestion = (name) => {
      errorMsg.value = "";
      if (!localAreas.value.some((a) => a.toLowerCase() === name.toLowerCase())) {
        localAreas.value.push(name);
      }
    };

    const removeArea = (idx) => {
      localAreas.value.splice(idx, 1);
    };

    const handleFinish = () => {
      errorMsg.value = "";
      if (draftArea.value.trim()) {
        addArea();
      }
      if (localAreas.value.length === 0) {
        errorMsg.value = "Debes ingresar al menos una asignatura para finalizar.";
        return;
      }
      emit("finish");
    };

    return {
      localAreas,
      draftArea,
      errorMsg,
      suggestions,
      addArea,
      addSuggestion,
      removeArea,
      handleFinish,
      addOutline,
      arrowBackOutline,
      bookOutline,
      checkmarkOutline,
      closeOutline,
    };
  },
};
</script>
