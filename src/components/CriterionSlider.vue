<template>
  <div class="qz-criterion-row">
    <span class="qz-criterion-desc" :title="criterion.description">
      {{ criterion.description }}
    </span>
    <div class="score-input-row">
      <input
        class="score-input"
        type="text"
        inputmode="decimal"
        v-model="localValue"
        :placeholder="`0–${criterion.score}`"
        @blur="handleBlur"
        @keydown.tab="$emit('tab', $event)"
      />
      <span class="score-max">/ {{ criterion.score }}</span>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";

export default {
  name: "CriterionSlider",
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
.qz-criterion-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(106, 90, 224, 0.03);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.1));
  transition: all 0.15s ease;
}

.qz-criterion-row:hover {
  background: rgba(106, 90, 224, 0.06);
  border-color: rgba(106, 90, 224, 0.22);
}

.qz-criterion-desc {
  flex: 1;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 500;
  color: var(--qz-color-text-main, #0c092a);
  line-height: 1.3;
  word-break: break-word;
}

.score-input-row {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.score-input {
  width: 58px;
  height: 30px;
  padding: 2px 6px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 0.95rem;
  font-weight: 700;
  border: 1.5px solid rgba(106, 90, 224, 0.25);
  border-radius: 8px;
  text-align: center;
  background: var(--qz-color-card-bg, #ffffff);
  color: var(--qz-color-text-main, #0c092a);
  transition: all 0.2s ease;
}

.score-input:focus {
  outline: none;
  border-color: var(--ion-color-primary, #6a5ae0);
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.15);
}

.score-max {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 600;
  color: var(--qz-color-text-muted, #858494);
  min-width: 32px;
}
</style>
