<template>
  <div>
    <!-- Quick-fill buttons: 0 / Medio / Max -->
    <ion-grid v-if="showMarkButtons">
      <ion-row>
        <ion-col>
          <ion-button expand="block" color="danger" @click="markAll('min')">
            0
          </ion-button>
        </ion-col>
        <ion-col>
          <ion-button expand="block" color="warning" @click="markAll('mid')">
            Medio
          </ion-button>
        </ion-col>
        <ion-col>
          <ion-button expand="block" color="success" @click="markAll('max')">
            Max
          </ion-button>
        </ion-col>
      </ion-row>
    </ion-grid>

    <!-- One CriterionSlider per criterion -->
    <ion-list>
      <criterion-slider
        v-for="criterion in criteria"
        :key="criterion.id"
        :criterion="criterion"
        :modelValue="modelValue[criterion.id] ?? null"
        @update:modelValue="onSliderChange(criterion.id, $event)"
      />
    </ion-list>
  </div>
</template>

<script>
import { IonList, IonGrid, IonRow, IonCol, IonButton } from "@ionic/vue";
import CriterionSlider from "./CriterionSlider.vue";

export default {
  name: "CriterionList",
  components: { IonList, IonGrid, IonRow, IonCol, IonButton, CriterionSlider },
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
