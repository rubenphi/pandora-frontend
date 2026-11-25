<template>
  <div class="qz-wizard-step">
    <div class="qz-step-header">
      <div class="qz-badge-pill">
        <ion-icon :icon="businessOutline"></ion-icon>
        <span>Paso 4 · Institución</span>
      </div>
      <h2 class="qz-step-title">Tu institución</h2>
      <p class="qz-step-subtitle">
        Ingresa el nombre de la nueva institución educativa que vas a registrar.
      </p>
    </div>

    <form class="qz-form" @submit.prevent="handleNext">
      <div class="qz-field-group">
        <label class="qz-field-label">
          Nombre de la institución <span class="qz-required">*</span>
        </label>
        <div
          class="qz-input-box"
          :class="{ 'qz-input-box--focused': isFocused }"
        >
          <ion-icon :icon="businessOutline" class="qz-input-icon"></ion-icon>
          <input
            v-model="localInstitute.name"
            type="text"
            placeholder="Ej. Colegio San José"
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
  businessOutline,
} from "ionicons/icons";

export default {
  components: { IonIcon },
  props: {
    institute: { type: Object, required: true },
  },
  emits: ["next", "back", "update:institute"],
  setup(props, { emit }) {
    const localInstitute = reactive({ ...props.institute });
    const isFocused = ref(false);
    const errorMsg = ref("");

    watch(
      localInstitute,
      (val) => {
        emit("update:institute", { ...val });
      },
      { deep: true }
    );

    const handleNext = () => {
      errorMsg.value = "";
      if (!localInstitute.name || !localInstitute.name.trim()) {
        errorMsg.value = "Ingresa el nombre de la institución para continuar.";
        return;
      }
      emit("next");
    };

    return {
      localInstitute,
      isFocused,
      errorMsg,
      handleNext,
      arrowBackOutline,
      arrowForwardOutline,
      businessOutline,
    };
  },
};
</script>
