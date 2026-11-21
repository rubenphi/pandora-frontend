<template>
  <div class="qz-criterion-list">
    <!-- Quick-fill buttons: 0 / Medio / Max -->
    <div v-if="showMarkButtons" class="qz-quick-fill-bar">
      <span class="qz-quick-fill-label">Llenar:</span>
      <div class="qz-quick-fill-btns">
        <button
          type="button"
          class="qz-qf-btn qz-qf--min"
          @click="markAll('min')"
          title="Asignar 0 a todos los criterios"
        >
          0 pts
        </button>
        <button
          type="button"
          class="qz-qf-btn qz-qf--mid"
          @click="markAll('mid')"
          title="Asignar el 50% del puntaje a todos los criterios"
        >
          Medio
        </button>
        <button
          type="button"
          class="qz-qf-btn qz-qf--max"
          @click="markAll('max')"
          title="Asignar puntaje máximo a todos los criterios"
        >
          Máx
        </button>
      </div>
    </div>

    <!-- One CriterionSlider per criterion -->
    <div class="qz-criterion-items">
      <criterion-slider
        v-for="criterion in criteria"
        :key="criterion.id"
        :criterion="criterion"
        :modelValue="modelValue[criterion.id] ?? null"
        @update:modelValue="onSliderChange(criterion.id, $event)"
      />
    </div>
  </div>
</template>

<script>
import CriterionSlider from "./CriterionSlider.vue";

export default {
  name: "CriterionList",
  components: { CriterionSlider },
  props: {
    /**
     * Array of criterion objects: [{ id, description, score }]
     */
    criteria: {
      type: Array,
      required: true,
    },
    /**
     * Flat map of scores: { [criterionId]: number | null }
     * Use v-model or :modelValue + @update:modelValue.
     */
    modelValue: {
      type: Object,
      required: true,
    },
    /**
     * Whether to show the 0 / Medio / Max quick-fill buttons.
     * Default: true.
     */
    showMarkButtons: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    /**
     * Fills all sliders with 0 (min), half-score (mid), or full-score (max).
     */
    const markAll = (valueType) => {
      const updated = { ...props.modelValue };
      for (const criterion of props.criteria) {
        let score = 0;
        if (valueType === "mid") score = criterion.score / 2;
        else if (valueType === "max") score = criterion.score;
        updated[criterion.id] = score;
      }
      emit("update:modelValue", updated);
    };

    /**
     * Propagates a single slider change while keeping the rest intact.
     */
    const onSliderChange = (criterionId, newValue) => {
      emit("update:modelValue", { ...props.modelValue, [criterionId]: newValue });
    };

    return { markAll, onSliderChange };
  },
};
</script>

<style scoped>
.qz-criterion-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-quick-fill-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding: 2px 4px;
  flex-wrap: wrap;
}

.qz-quick-fill-label {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 11px;
  font-weight: 700;
  color: var(--qz-color-text-muted, #858494);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.qz-quick-fill-btns {
  display: flex;
  align-items: center;
  gap: 5px;
}

.qz-qf-btn {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  cursor: pointer;
  outline: none;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  line-height: 1.4;
}

.qz-qf-btn:active {
  transform: scale(0.95);
}

.qz-qf--min {
  background: #ffebee;
  color: #d32f2f;
  border-color: rgba(211, 47, 47, 0.2);
}

.qz-qf--mid {
  background: #fff8e1;
  color: #f57c00;
  border-color: rgba(245, 124, 0, 0.2);
}

.qz-qf--max {
  background: #e8f5e9;
  color: #2e7d32;
  border-color: rgba(46, 125, 50, 0.2);
}

.qz-criterion-items {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>
