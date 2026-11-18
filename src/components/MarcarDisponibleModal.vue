<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="$emit('close')"
    :breakpoints="[0, 0.7, 1]"
    :initial-breakpoint="0.7"
    class="qz-modal-pop"
  >
    <div class="qz-modal-container">
      <!-- Barra superior / Handle bar -->
      <div class="qz-modal-handle"></div>

      <!-- Cabecera del Modal -->
      <div class="qz-modal-header">
        <div class="qz-header-titles">
          <h3 class="qz-modal-title">Disponibilidad de Preguntas</h3>
          <p class="qz-modal-subtitle">
            Habilita o bloquea preguntas para la respuesta de los estudiantes
          </p>
        </div>
        <div class="qz-count-capsule">
          <span class="qz-count-num">{{ selectedCount }}</span>
          <span class="qz-count-sep">/</span>
          <span class="qz-count-total">{{ questions.length }}</span>
          <span class="qz-count-label">activas</span>
        </div>
      </div>

      <!-- Barra de Acciones Masivas -->
      <div class="qz-bulk-bar">
        <button type="button" class="qz-bulk-btn" @click="marcarTodos">
          <ion-icon :icon="checkboxOutline"></ion-icon>
          <span>Marcar Todas</span>
        </button>
        <button type="button" class="qz-bulk-btn qz-bulk-btn--ghost" @click="desmarcarTodos">
          <ion-icon :icon="squareOutline"></ion-icon>
          <span>Desmarcar Todas</span>
        </button>
      </div>

      <!-- Lista con Scroll de Preguntas -->
      <div class="qz-modal-body-scroll">
        <div v-if="questions && questions.length > 0" class="qz-questions-cards-list">
          <div
            v-for="(question, index) in questions"
            :key="question.id"
            class="qz-question-select-card"
            :class="{ 'is-active': selectedMap[question.id] }"
            @click="toggleQuestion(question.id)"
          >
            <!-- Checkbox Redondeado Queezy -->
            <div
              class="qz-custom-checkbox"
              :class="{ 'is-checked': selectedMap[question.id] }"
            >
              <ion-icon v-if="selectedMap[question.id]" :icon="checkmarkOutline"></ion-icon>
            </div>

            <!-- Información de la Pregunta -->
            <div class="qz-question-select-info">
              <span class="qz-question-select-num">Pregunta {{ index + 1 }}</span>
              <p class="qz-question-select-title">{{ question.title || '(Sin título)' }}</p>
            </div>

            <!-- Candado Indicador -->
            <div
              class="qz-status-badge"
              :class="selectedMap[question.id] ? 'qz-badge--open' : 'qz-badge--locked'"
            >
              <ion-icon
                :icon="selectedMap[question.id] ? lockOpenOutline : lockClosedOutline"
              ></ion-icon>
              <span>{{ selectedMap[question.id] ? 'Visible' : 'Bloqueada' }}</span>
            </div>
          </div>
        </div>

        <!-- Estado Vacío -->
        <div v-else class="qz-empty-questions">
          <div class="qz-empty-icon-wrap">
            <ion-icon :icon="helpCircleOutline"></ion-icon>
          </div>
          <h4>No hay preguntas en este cuestionario</h4>
          <p>Agrega preguntas antes de configurar su disponibilidad.</p>
        </div>
      </div>

      <!-- Acciones Inferiores -->
      <div class="qz-modal-footer">
        <button type="button" class="qz-btn qz-btn--cancel" @click="$emit('close')">
          Cancelar
        </button>
        <button type="button" class="qz-btn qz-btn--confirm" @click="confirmar">
          Aplicar Cambios
        </button>
      </div>
    </div>
  </ion-modal>
</template>

<script>
import { ref, computed, watch } from "vue";
import { IonModal, IonIcon } from "@ionic/vue";
import {
  checkboxOutline,
  squareOutline,
  lockOpenOutline,
  lockClosedOutline,
  helpCircleOutline,
  checkmarkOutline,
} from "ionicons/icons";

export default {
  name: "MarcarDisponibleModal",
  components: {
    IonModal,
    IonIcon,
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    questions: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["close", "confirmar"],
  setup(props, { emit }) {
    const selectedMap = ref({});

    watch(
      () => props.isOpen,
      (open) => {
        if (open) {
          const map = {};
          props.questions.forEach((q) => {
            map[q.id] = !!q.available;
          });
          selectedMap.value = map;
        }
      }
    );

    const selectedCount = computed(
      () => Object.values(selectedMap.value).filter(Boolean).length
    );

    const marcarTodos = () => {
      props.questions.forEach((q) => {
        selectedMap.value[q.id] = true;
      });
    };

    const desmarcarTodos = () => {
      props.questions.forEach((q) => {
        selectedMap.value[q.id] = false;
      });
    };

    const toggleQuestion = (id) => {
      selectedMap.value[id] = !selectedMap.value[id];
    };

    const confirmar = () => {
      const selectedIds = Object.entries(selectedMap.value)
        .filter(([, v]) => v)
        .map(([k]) => Number(k));
      emit("confirmar", selectedIds);
      emit("close");
    };

    return {
      selectedMap,
      selectedCount,
      marcarTodos,
      desmarcarTodos,
      toggleQuestion,
      confirmar,
      checkboxOutline,
      squareOutline,
      lockOpenOutline,
      lockClosedOutline,
      helpCircleOutline,
      checkmarkOutline,
    };
  },
};
</script>

<style scoped>
.qz-modal-container {
  background: #FFFFFF;
  border-radius: 28px 28px 0 0;
  padding: 12px 18px 24px 18px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
}

.qz-modal-handle {
  width: 40px;
  height: 5px;
  background: #D2D0E4;
  border-radius: 9999px;
  margin: 0 auto 14px auto;
  flex-shrink: 0;
}

/* Cabecera */
.qz-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.qz-header-titles {
  flex: 1;
}

.qz-modal-title {
  margin: 0 0 3px 0;
  font-size: 18px;
  font-weight: 800;
  color: #0C092A;
  letter-spacing: -0.3px;
}

.qz-modal-subtitle {
  margin: 0;
  font-size: 12px;
  color: #858494;
  line-height: 1.35;
}

.qz-count-capsule {
  display: flex;
  align-items: baseline;
  gap: 3px;
  background: #EFEEFC;
  color: var(--ion-color-primary, #6A5AE0);
  padding: 5px 12px;
  border-radius: var(--qz-radius-full, 9999px);
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}

.qz-count-num {
  color: var(--ion-color-primary, #6A5AE0);
}

.qz-count-sep,
.qz-count-total {
  color: #8C82EA;
}

.qz-count-label {
  font-size: 11px;
  font-weight: 600;
  margin-left: 2px;
}

/* Acciones Masivas */
.qz-bulk-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.qz-bulk-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #EFEEFC;
  color: var(--ion-color-primary, #6A5AE0);
  border: 1px solid #D6D1F9;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 6px 14px;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-bulk-btn:active {
  transform: scale(0.96);
  background: #E0DCFA;
}

.qz-bulk-btn--ghost {
  background: #F9F9FE;
  border-color: #E2DFFA;
  color: #858494;
}

.qz-bulk-btn--ghost:active {
  background: #EFEEFC;
  color: var(--ion-color-primary, #6A5AE0);
}

/* Scroll de Preguntas */
.qz-modal-body-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 2px;
  margin-bottom: 12px;
}

.qz-questions-cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-question-select-card {
  background: #F9F9FE;
  border: 2px solid #ECEAF9;
  border-radius: 16px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.qz-question-select-card:active {
  transform: scale(0.985);
}

.qz-question-select-card.is-active {
  background: #FFFFFF;
  border-color: var(--ion-color-primary, #6A5AE0);
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.08);
}

/* Checkbox circular Queezy */
.qz-custom-checkbox {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #CFCBE8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #FFFFFF;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.qz-custom-checkbox.is-checked {
  background: var(--ion-color-primary, #6A5AE0);
  border-color: var(--ion-color-primary, #6A5AE0);
}

.qz-question-select-info {
  flex: 1;
  min-width: 0;
}

.qz-question-select-num {
  font-size: 11px;
  font-weight: 700;
  color: #858494;
  text-transform: uppercase;
  display: block;
  letter-spacing: 0.3px;
}

.qz-question-select-title {
  margin: 2px 0 0 0;
  font-size: 13px;
  font-weight: 700;
  color: #0C092A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.qz-status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--qz-radius-full, 9999px);
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.qz-badge--open {
  background: #E4F9EC;
  color: #10B981;
}

.qz-badge--locked {
  background: #FFF1DF;
  color: #E58700;
}

.qz-empty-questions {
  text-align: center;
  padding: 30px 16px;
  color: #858494;
}

.qz-empty-icon-wrap {
  font-size: 36px;
  color: #AFAAC8;
  margin-bottom: 6px;
}

.qz-empty-questions h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 700;
  color: #0C092A;
}

.qz-empty-questions p {
  margin: 0;
  font-size: 12px;
}

/* Footer / Botones */
.qz-modal-footer {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.qz-btn {
  flex: 1;
  padding: 13px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-btn:active {
  transform: scale(0.98);
}

.qz-btn--cancel {
  background: #EFEEFC;
  color: #858494;
}

.qz-btn--confirm {
  background: var(--ion-color-primary, #6A5AE0);
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.28);
}
</style>
