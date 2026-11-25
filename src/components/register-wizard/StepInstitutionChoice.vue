<template>
  <div class="qz-wizard-step">
    <div class="qz-step-header">
      <div class="qz-badge-pill">
        <ion-icon :icon="businessOutline"></ion-icon>
        <span>Paso 2 · Institución</span>
      </div>
      <h2 class="qz-step-title">¿Tu institución ya existe en Pandora?</h2>
      <p class="qz-step-subtitle">
        Puedes unirte a una institución creada previamente o configurar una nueva
        en pocos pasos.
      </p>
    </div>

    <div class="qz-choice-grid">
      <button
        type="button"
        class="qz-choice-card"
        @click="$emit('select', 'existing')"
      >
        <div class="qz-choice-icon qz-choice-icon--existing">
          <ion-icon :icon="keyOutline"></ion-icon>
        </div>
        <div class="qz-choice-body">
          <h3>Ya existe en el sistema</h3>
          <p>
            Tengo un código de invitación para vincular mi cuenta a la
            institución.
          </p>
        </div>
        <ion-icon :icon="chevronForwardOutline" class="qz-choice-arrow"></ion-icon>
      </button>

      <button
        type="button"
        class="qz-choice-card"
        @click="$emit('select', 'new')"
      >
        <div class="qz-choice-icon qz-choice-icon--new">
          <ion-icon :icon="addCircleOutline"></ion-icon>
        </div>
        <div class="qz-choice-body">
          <h3>Registrar institución nueva</h3>
          <p>
            Configura los datos básicos: institución, periodos, tu primer curso y
            asignaturas.
          </p>
        </div>
        <ion-icon :icon="chevronForwardOutline" class="qz-choice-arrow"></ion-icon>
      </button>
    </div>

    <div class="qz-step-actions qz-step-actions--single">
      <button type="button" class="qz-btn-secondary" @click="$emit('back')">
        <ion-icon :icon="arrowBackOutline"></ion-icon>
        <span>Anterior</span>
      </button>
    </div>
  </div>
</template>

<script>
import { IonIcon } from "@ionic/vue";
import {
  addCircleOutline,
  arrowBackOutline,
  businessOutline,
  chevronForwardOutline,
  keyOutline,
} from "ionicons/icons";

export default {
  components: { IonIcon },
  emits: ["select", "back"],
  setup() {
    return {
      addCircleOutline,
      arrowBackOutline,
      businessOutline,
      chevronForwardOutline,
      keyOutline,
    };
  },
};
</script>
