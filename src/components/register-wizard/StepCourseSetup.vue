<template>
  <div class="qz-wizard-step">
    <div class="qz-step-header">
      <div class="qz-badge-pill">
        <ion-icon :icon="schoolOutline"></ion-icon>
        <span>Paso 6 · Primer Curso</span>
      </div>
      <h2 class="qz-step-title">Crea tu primer curso</h2>
      <p class="qz-step-subtitle">
        Para que el sistema funcione desde el primer momento, debe existir al
        menos un curso. Luego podrás crear más en Gestión Académica.
      </p>
    </div>

    <form class="qz-form" @submit.prevent="handleNext">
      <div class="qz-field-group">
        <label class="qz-field-label">
          Nombre del curso <span class="qz-required">*</span>
        </label>
        <div
          class="qz-input-box"
          :class="{ 'qz-input-box--focused': isFocused }"
        >
          <ion-icon :icon="schoolOutline" class="qz-input-icon"></ion-icon>
          <input
            v-model="localCourse.name"
            type="text"
            placeholder="Ej. Grado 10°A, Primero B, Grupo Único"
            class="qz-native-input"
            @focus="isFocused = true"
            @blur="isFocused = false"
          />
        </div>
      </div>

      <p v-if="errorMsg" class="qz-inline-error">{{ errorMsg }}</p>

      <div class="qz-step-actions">
        <button type="button" class="qz-btn-secondary" @click="$emit('back')">
          <ion-icon :icon="arrowBackOutline"></ion-icon>
          <span>Anterior</span>
        </button>
        <button type="submit" class="qz-btn-primary">
          <span>Siguiente</span>
          <ion-icon :icon="arrowForwardOutline"></ion-icon>
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { reactive, ref, watch } from "vue";
import { IonIcon } from "@ionic/vue";
import {
  arrowBackOutline,
  arrowForwardOutline,
  schoolOutline,
} from "ionicons/icons";

export default {
  components: { IonIcon },
  props: {
    course: { type: Object, required: true },
  },
  emits: ["next", "back", "update:course"],
  setup(props, { emit }) {
    const localCourse = reactive({ ...props.course });
    const isFocused = ref(false);
    const errorMsg = ref("");

    watch(
      localCourse,
      (val) => {
        emit("update:course", { ...val });
      },
      { deep: true }
    );

    const handleNext = () => {
      errorMsg.value = "";
      if (!localCourse.name || !localCourse.name.trim()) {
        errorMsg.value = "Debes ingresar el nombre del curso para continuar.";
        return;
      }
      emit("next");
    };

    return {
      localCourse,
      isFocused,
      errorMsg,
      handleNext,
      arrowBackOutline,
      arrowForwardOutline,
      schoolOutline,
    };
  },
};
</script>
