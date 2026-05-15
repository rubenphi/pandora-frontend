<template>
  <ion-item>
    <div style="width: 100%; padding-top: 10px; padding-bottom: 10px">
      <ion-label class="ion-text-wrap" style="margin-bottom: 10px; font-weight: 500">
        {{ criterion.description }}
      </ion-label>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <div class="range-wrapper" style="width: 100%; flex: 1">
          <div class="range-labels">
            <span class="range-label" style="text-align: left">0</span>
            <span class="range-label" style="text-align: right">{{ criterion.score }}</span>
          </div>
          <ion-range
            :value="modelValue ?? 0"
            @ionChange="$emit('update:modelValue', $event.detail.value)"
            min="0"
            :max="criterion.score"
            step="0.5"
            snaps="true"
            ticks="true"
            pin="true"
            :pin-formatter="(value) => value.toFixed(1)"
            style="width: 100%"
          />
        </div>
        <ion-note
          style="min-width: 50px; text-align: right; font-size: 1.1em; font-weight: bold"
        >
          {{ modelValue != null ? Number(modelValue).toFixed(1) : "-" }}
        </ion-note>
      </div>
    </div>
  </ion-item>
</template>

<script>
import { IonItem, IonLabel, IonRange, IonNote } from "@ionic/vue";

export default {
  name: "CriterionSlider",
  components: { IonItem, IonLabel, IonRange, IonNote },
  props: {
    /** Criterion object: { id, description, score } */
    criterion: {
      type: Object,
      required: true,
    },
    /** Current score value. null means "not yet evaluated". */
    modelValue: {
      type: Number,
      default: null,
    },
  },
  emits: ["update:modelValue"],
};
</script>

<style scoped>
.range-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 5px;
  font-size: 0.8em;
  margin-bottom: 5px;
}

.range-label {
  flex: 1;
}
</style>
