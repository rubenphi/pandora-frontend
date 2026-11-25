<template>
  <div class="qz-wizard-step">
    <div class="qz-step-header">
      <div class="qz-badge-pill">
        <ion-icon :icon="sparklesOutline"></ion-icon>
        <span>Paso 1 · Perfil</span>
      </div>
      <h2 class="qz-step-title">¿Cómo deseas registrarte?</h2>
      <p class="qz-step-subtitle">
        Elige tu rol para llevarte al flujo de registro adecuado.
      </p>
    </div>

    <div class="qz-choice-grid">
      <button
        type="button"
        class="qz-choice-card"
        @click="$emit('select', 'student')"
      >
        <div class="qz-choice-icon qz-choice-icon--student">
          <ion-icon :icon="schoolOutline"></ion-icon>
        </div>
        <div class="qz-choice-body">
          <h3>Soy Estudiante</h3>
          <p>
            Ingresa con el código de invitación que te compartió tu institución o
            docente.
          </p>
        </div>
        <ion-icon :icon="chevronForwardOutline" class="qz-choice-arrow"></ion-icon>
      </button>

      <button
        type="button"
        class="qz-choice-card"
        @click="$emit('select', 'teacher')"
      >
        <div class="qz-choice-icon qz-choice-icon--teacher">
          <ion-icon :icon="personOutline"></ion-icon>
        </div>
        <div class="qz-choice-body">
          <h3>Soy Docente</h3>
          <p>
            Únete a una institución existente o registra una institución nueva
            desde cero.
          </p>
        </div>
        <ion-icon :icon="chevronForwardOutline" class="qz-choice-arrow"></ion-icon>
      </button>
    </div>
  </div>
</template>

<script>
import { IonIcon } from "@ionic/vue";
import {
  chevronForwardOutline,
  personOutline,
  schoolOutline,
  sparklesOutline,
} from "ionicons/icons";

export default {
  components: { IonIcon },
  emits: ["select"],
  setup() {
    return {
      chevronForwardOutline,
      personOutline,
      schoolOutline,
      sparklesOutline,
    };
  },
};
</script>
