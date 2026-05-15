<template>
  <div class="single-criterion-list">
    <div
      v-for="(student, idx) in students"
      :key="student.id"
      class="student-row"
      :class="{ 'student-row--focused': focusedStudentId === student.id }"
    >
      <!-- Row header: slot for extra content (e.g. checkbox) + name + grade -->
      <div class="row-header">
        <slot name="row-prefix" :student="student" />
        <span class="student-name">
          {{ student.lastName }} {{ student.name }}
        </span>
        <span class="student-grade">
          Nota: {{ computeGrade(student) }}
        </span>
      </div>

      <!-- Input row -->
      <div class="row-body">
        <span class="criterion-label">{{ criterion.description }}</span>
        <div class="score-input-wrap">
          <input
            class="score-input"
            type="text"
            inputmode="decimal"
            :ref="(el) => setRef(student.id, el)"
            :value="displayValue(student)"
            @focus="focusedStudentId = student.id"
            @blur="onBlur(student, $event)"
            @keydown.tab.prevent="tabToStudent($event, idx)"
          />
          <span class="score-max">/ {{ criterion.score }}</span>
        </div>
        <ion-button
          size="small"
          fill="outline"
          @click="$emit('save', student)"
          :disabled="isSaving"
        >
          Guardar
        </ion-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { IonButton } from "@ionic/vue";
import { calculateFinalGrade } from "../composables/useEvaluation";

export default {
  name: "SingleCriterionStudentList",
  components: { IonButton },
  props: {
    students: { type: Array, required: true },
    criterion: { type: Object, required: true },
    /** { [studentId]: { [criterionId]: value } } — flat per-student scores */
    modelValue: { type: Object, required: true },
    /** Full criteria array (needed only for grade calculation) */
    criteria: { type: Array, required: true },
    /** Full evaluation object { [studentId]: { [criterionId]: { value, id } } } */
    evaluation: { type: Object, required: true },
    isSaving: { type: Boolean, default: false },
  },
  emits: ["update:modelValue", "save"],
  setup(props, { emit }) {
    const focusedStudentId = ref(null);
    const inputRefs = {};

    const setRef = (studentId, el) => {
      if (el) inputRefs[studentId] = el;
    };

    const displayValue = (student) => {
      const val = props.modelValue[student.id]?.[props.criterion.id];
      return val != null ? String(val) : "";
    };

    const computeGrade = (student) => {
      const grade = calculateFinalGrade(
        student.id,
        props.evaluation,
        props.criteria
      );
      return grade != null ? grade.toFixed(2) : "N/A";
    };

    const onBlur = (student, event) => {
      focusedStudentId.value = null;
      const raw = event.target.value.replace(",", ".").trim();
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        const clamped = Math.min(Math.max(num, 0), props.criterion.score);
        event.target.value = String(clamped);
        const updated = {
          ...props.modelValue,
          [student.id]: {
            ...(props.modelValue[student.id] || {}),
            [props.criterion.id]: clamped,
          },
        };
        emit("update:modelValue", updated);
      } else if (raw === "") {
        const updated = {
          ...props.modelValue,
          [student.id]: {
            ...(props.modelValue[student.id] || {}),
            [props.criterion.id]: null,
          },
        };
        emit("update:modelValue", updated);
      } else {
        // Revert display
        event.target.value = displayValue(student);
      }
    };

    const tabToStudent = (event, currentIdx) => {
      const direction = event.shiftKey ? -1 : 1;
      const nextStudent = props.students[currentIdx + direction];
      if (nextStudent) {
        inputRefs[nextStudent.id]?.focus();
      }
    };

    return {
      focusedStudentId,
      setRef,
      displayValue,
      computeGrade,
      onBlur,
      tabToStudent,
    };
  },
};
</script>

<style scoped>
.single-criterion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.student-row {
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 10px 14px;
  background: var(--ion-item-background, var(--ion-background-color));
  transition: border-color 0.2s, box-shadow 0.2s;
}

.student-row--focused {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ion-color-primary) 15%, transparent);
}

.row-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.student-name {
  flex: 1;
  font-weight: 600;
  font-size: 1em;
}

.student-grade {
  font-size: 0.85em;
  color: var(--ion-color-medium);
}

.row-body {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.criterion-label {
  flex: 1;
  font-size: 0.9em;
  color: var(--ion-color-medium-shade);
  min-width: 100px;
}

.score-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-input {
  width: 72px;
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
}

.score-max {
  font-size: 0.9em;
  color: var(--ion-color-medium);
}
</style>
