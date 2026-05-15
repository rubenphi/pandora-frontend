<template>
  <ion-item>
    <div style="width: 100%; padding: 10px 0">
      <ion-label class="ion-text-wrap" style="margin-bottom: 8px; font-weight: 500">
        {{ criterion.description }}
      </ion-label>
      <div class="score-input-row">
        <input
          class="score-input"
          type="text"
          inputmode="decimal"
          v-model="localValue"
          :placeholder="`0 – ${criterion.score}`"
          @blur="handleBlur"
          @keydown.tab="$emit('tab', $event)"
        />
        <span class="score-max">/ {{ criterion.score }}</span>
      </div>
    </div>
  </ion-item>
</template>

<script>
import { ref, watch } from "vue";
import { IonItem, IonLabel } from "@ionic/vue";

export default {
  name: "CriterionSlider",
  components: { IonItem, IonLabel },
  props: {
    criterion: { type: Object, required: true },
    modelValue: { type: Number, default: null },
  },
  emits: ["update:modelValue", "tab"],
  setup(props, { emit }) {
    const localValue = ref(
      props.modelValue != null ? String(props.modelValue) : ""
    );

    // Sync when parent updates (e.g. markAll buttons)
    watch(
      () => props.modelValue,
      (val) => {
        localValue.value = val != null ? String(val) : "";
      }
    );

    const handleBlur = () => {
      const raw = localValue.value.replace(",", ".").trim();
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        const clamped = Math.min(Math.max(num, 0), props.criterion.score);
        localValue.value = String(clamped);
        emit("update:modelValue", clamped);
      } else if (raw === "") {
        emit("update:modelValue", null);
      } else {
        // Revert to last known good value
        localValue.value =
          props.modelValue != null ? String(props.modelValue) : "";
      }
    };

    return { localValue, handleBlur };
  },
};
</script>

<style scoped>
.score-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input {
  width: 80px;
  padding: 6px 10px;
  font-size: 1.1em;
  font-weight: bold;
  border: 1.5px solid var(--ion-color-medium);
  border-radius: 8px;
  text-align: center;
  background: var(--ion-background-color);
  color: var(--ion-text-color);
  transition: border-color 0.2s;
}

.score-input:focus {
  outline: none;
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ion-color-primary) 20%, transparent);
}

.score-max {
  font-size: 0.9em;
  color: var(--ion-color-medium);
}
</style>
