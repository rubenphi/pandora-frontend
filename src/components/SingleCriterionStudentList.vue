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
          <slot name="name-suffix" :student="student">
            <ion-icon
              v-if="hasEvidence(student.id)"
              :icon="attachOutline"
              color="primary"
              class="evidence-icon"
              title="Tiene archivo anexo"
            ></ion-icon>
          </slot>
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
      <div class="row-suffix">
        <slot name="row-suffix" :student="student" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { IonButton, IonIcon } from "@ionic/vue";
import { attachOutline } from "ionicons/icons";
import { calculateFinalGrade } from "../composables/useEvaluation";

export default {
  name: "SingleCriterionStudentList",
  components: { IonButton, IonIcon },
  props: {
    students: { type: Array, required: true },
    criterion: { type: Object, required: true },
    /** { [studentId]: { [criterionId]: value } } — flat per-student scores */
    modelValue: { type: Object, required: true },
    /** Full criteria array (needed only for grade calculation) */
    criteria: { type: Array, required: true },
    /** Full evaluation object { [studentId]: { [criterionId]: { value, id } } } */
    evaluation: { type: Object, required: true },
    studentsWithEvidence: { type: [Object, Set, Array], default: () => ({}) },
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
      return grade !== null && grade !== undefined ? grade.toFixed(2) : "Sin calificar";
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

    const hasEvidence = (studentId) => {
      if (!props.studentsWithEvidence) return false;
      if (props.studentsWithEvidence instanceof Set) {
        return props.studentsWithEvidence.has(studentId);
      }
      if (Array.isArray(props.studentsWithEvidence)) {
        return props.studentsWithEvidence.includes(studentId);
      }
      return !!props.studentsWithEvidence[studentId];
    };

    return {
      focusedStudentId,
      setRef,
      displayValue,
      computeGrade,
      onBlur,
      tabToStudent,
      hasEvidence,
      attachOutline,
    };
  },
};
</script>

<style scoped>
.single-criterion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

.student-row {
  border: 1.5px solid var(--qz-color-border, #e6e6e6);
  border-radius: var(--qz-radius-lg, 18px);
  padding: 14px 16px;
  background: var(--qz-color-card-bg, #ffffff);
  box-shadow: 0 2px 8px rgba(12, 9, 42, 0.04);
  transition: all 0.2s ease;
}

.student-row--focused {
  border-color: var(--ion-color-primary, #6a5ae0);
  box-shadow: 0 0 0 4px rgba(106, 90, 224, 0.15);
}

.row-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.student-name {
  flex: 1;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--qz-color-text-main, #0c092a);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.evidence-icon {
  font-size: 1.2em;
  color: var(--ion-color-primary, #6a5ae0);
  vertical-align: middle;
}

.student-grade {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ion-color-primary, #6a5ae0);
  background: var(--qz-color-purple-bg, #efeefc);
  padding: 3px 10px;
  border-radius: 9999px;
  white-space: nowrap;
}

.row-body {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px dashed rgba(106, 90, 224, 0.12);
}

.criterion-label {
  flex: 1;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--qz-color-text-muted, #858494);
  min-width: 120px;
}

.score-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-input {
  width: 76px;
  padding: 6px 10px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 1.1rem;
  font-weight: 800;
  border: 1.5px solid rgba(106, 90, 224, 0.25);
  border-radius: 12px;
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
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--qz-color-text-muted, #858494);
}

.row-suffix {
  margin-top: 8px;
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
  body:not(.light) .student-row {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }

  body:not(.light) .student-name {
    color: #f7f7fd;
  }

  body:not(.light) .student-grade {
    background: #28214b;
    color: #a39bf0;
  }

  body:not(.light) .score-input {
    background: #17132e;
    color: #f7f7fd;
    border-color: rgba(255, 255, 255, 0.15);
  }

  body:not(.light) .row-body {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
}

:global(body.dark) .student-row,
:global(html.dark) .student-row,
:global(.dark) .student-row {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .student-name,
:global(html.dark) .student-name,
:global(.dark) .student-name {
  color: #f7f7fd;
}

:global(body.dark) .student-grade,
:global(html.dark) .student-grade,
:global(.dark) .student-grade {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .score-input,
:global(html.dark) .score-input,
:global(.dark) .score-input {
  background: #17132e;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.15);
}

:global(body.dark) .row-body,
:global(html.dark) .row-body,
:global(.dark) .row-body {
  border-top-color: rgba(255, 255, 255, 0.08);
}
</style>
