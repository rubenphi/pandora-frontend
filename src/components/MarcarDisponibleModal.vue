<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')" :breakpoints="[0, 0.5, 1]" :initial-breakpoint="1">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="$emit('close')">Cancelar</ion-button>
        </ion-buttons>
        <ion-title style="text-align: center">Marcar Disponible</ion-title>
        <ion-buttons slot="end">
          <ion-button :strong="true" @click="confirmar">
            Aplicar
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Acciones masivas -->
      <div class="bulk-actions">
        <ion-button size="small" fill="outline" @click="marcarTodos">
          <ion-icon :icon="checkboxOutline" slot="start"></ion-icon>
          Todos
        </ion-button>
        <ion-button size="small" fill="outline" color="medium" @click="desmarcarTodos">
          <ion-icon :icon="squareOutline" slot="start"></ion-icon>
          Ninguno
        </ion-button>
        <span class="count-badge">{{ selectedCount }} / {{ questions.length }}</span>
      </div>

      <!-- Lista de preguntas con checkbox -->
      <ion-list lines="full">
        <ion-item
          v-for="(question, index) in questions"
          :key="question.id"
          button
          @click="toggleQuestion(question.id)"
        >
          <ion-checkbox
            slot="start"
            v-model="selectedMap[question.id]"
            @click.stop
          ></ion-checkbox>
          <ion-label class="ion-text-wrap">
            <p class="question-index">Pregunta {{ index + 1 }}</p>
            <b>{{ question.title || '(Sin título)' }}</b>
          </ion-label>
          <ion-icon
            slot="end"
            :icon="question.available ? lockOpenOutline : lockClosedOutline"
            :color="question.available ? 'success' : 'medium'"
          ></ion-icon>
        </ion-item>
      </ion-list>

      <!-- Estado vacío -->
      <div v-if="!questions || questions.length === 0" class="empty-state">
        <ion-icon :icon="helpCircleOutline" size="large" color="medium"></ion-icon>
        <p>No hay preguntas disponibles</p>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script>
import { ref, computed, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonIcon,
} from '@ionic/vue';
import {
  checkboxOutline,
  squareOutline,
  lockOpenOutline,
  lockClosedOutline,
  helpCircleOutline,
} from 'ionicons/icons';

export default {
  name: 'MarcarDisponibleModal',
  components: {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
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
  emits: ['close', 'confirmar'],
  setup(props, { emit }) {
    // Mapa reactivo: { [questionId]: boolean }
    const selectedMap = ref({});

    // Al abrir el modal, inicializar según estado actual de available
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
      emit('confirmar', selectedIds);
      emit('close');
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
    };
  },
};
</script>

<style scoped>
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 12px;
  border-bottom: 1px solid var(--ion-color-light-shade, #d9d9d9);
  margin-bottom: 4px;
}

.count-badge {
  margin-left: auto;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  font-weight: 600;
}

.question-index {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin: 0 0 2px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: var(--ion-color-medium);
  gap: 12px;
}
</style>
