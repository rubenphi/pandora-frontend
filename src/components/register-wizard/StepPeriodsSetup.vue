<template>
  <div class="qz-wizard-step">
    <div class="qz-step-header">
      <div class="qz-badge-pill">
        <ion-icon :icon="calendarOutline"></ion-icon>
        <span>Paso 5 · Periodos</span>
      </div>
      <h2 class="qz-step-title">Periodos académicos</h2>
      <p class="qz-step-subtitle">
        Indica cuántos periodos maneja la institución cada año y dales un nombre.
      </p>
    </div>

    <div class="qz-field-group">
      <label class="qz-field-label">¿Cuántos periodos por año?</label>
      <div class="qz-count-row">
        <div class="qz-preset-pills">
          <button
            v-for="preset in [2, 3, 4]"
            :key="preset"
            type="button"
            class="qz-preset-pill"
            :class="{ 'is-active': periodsCount === preset }"
            @click="setPeriodsCount(preset)"
          >
            {{ preset }} periodos
          </button>
        </div>

        <div class="qz-stepper-control">
          <button
            type="button"
            class="qz-stepper-btn"
            :disabled="periodsCount <= 1"
            @click="setPeriodsCount(periodsCount - 1)"
          >
            -
          </button>
          <span class="qz-stepper-val">{{ periodsCount }}</span>
          <button
            type="button"
            class="qz-stepper-btn"
            :disabled="periodsCount >= 12"
            @click="setPeriodsCount(periodsCount + 1)"
          >
            +
          </button>
        </div>
      </div>
    </div>

    <div class="qz-periods-list">
      <div
        v-for="(periodName, idx) in localPeriods"
        :key="idx"
        class="qz-field-group qz-period-item"
      >
        <label class="qz-field-label">
          Nombre del periodo {{ idx + 1 }} <span class="qz-required">*</span>
        </label>
        <div class="qz-input-box">
          <ion-icon :icon="calendarOutline" class="qz-input-icon"></ion-icon>
          <input
            v-model="localPeriods[idx]"
            type="text"
            :placeholder="`Ej. Periodo ${idx + 1}`"
            class="qz-native-input"
          />
        </div>
      </div>
    </div>

    <p v-if="errorMsg" class="qz-inline-error">{{ errorMsg }}</p>

    <div class="qz-step-actions">
      <button type="button" class="qz-btn-secondary" @click="$emit('back')">
        <ion-icon :icon="arrowBackOutline"></ion-icon>
        <span>Anterior</span>
      </button>
      <button type="button" class="qz-btn-primary" @click="handleNext">
        <span>Siguiente</span>
        <ion-icon :icon="arrowForwardOutline"></ion-icon>
      </button>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from "vue";
import { IonIcon } from "@ionic/vue";
import {
  arrowBackOutline,
  arrowForwardOutline,
  calendarOutline,
} from "ionicons/icons";

export default {
  components: { IonIcon },
  props: {
    periods: { type: Array, required: true },
  },
  emits: ["next", "back", "update:periods"],
  setup(props, { emit }) {
    const localPeriods = ref([...props.periods]);
    const errorMsg = ref("");
    const periodsCount = computed(() => localPeriods.value.length);

    watch(
      localPeriods,
      (val) => {
        emit("update:periods", [...val]);
      },
      { deep: true }
    );

    const setPeriodsCount = (nextCount) => {
      const clamped = Math.max(1, Math.min(12, nextCount));
      const list = [...localPeriods.value];
      while (list.length < clamped) {
        list.push(`Periodo ${list.length + 1}`);
      }
      while (list.length > clamped) {
        list.pop();
      }
      localPeriods.value = list;
    };

    const handleNext = () => {
      errorMsg.value = "";
      const hasEmpty = localPeriods.value.some((p) => !p || !p.trim());
      if (localPeriods.value.length === 0 || hasEmpty) {
        errorMsg.value = "Todos los periodos deben tener un nombre.";
        return;
      }
      emit("next");
    };

    return {
      localPeriods,
      errorMsg,
      periodsCount,
      setPeriodsCount,
      handleNext,
      arrowBackOutline,
      arrowForwardOutline,
      calendarOutline,
    };
  },
};
</script>
