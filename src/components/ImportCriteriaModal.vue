<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Importar Criterios desde JSON</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-textarea
        v-model="jsonInput"
        :placeholder="placeholder"
        rows="15"
      ></ion-textarea>
      <ion-button expand="block" @click="copyPlaceholder">Copiar Ejemplo</ion-button>
      <ion-button expand="block" @click="importJson" class="ion-margin-top">Importar</ion-button>
    </ion-content>
  </ion-modal>
</template>

<script>
import { ref } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonTextarea,
  IonButton,
  IonButtons,
} from '@ionic/vue';

export default {
  name: 'ImportCriteriaModal',
  components: {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonTextarea,
    IonButton,
    IonButtons,
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['close', 'import'],
  setup(_, { emit }) {
    const placeholder = JSON.stringify([
      {
        "description": "Elabora un ensayo sobre la importancia de la biodiversidad.",
        "score": 85
      },
      {
        "description": "Analiza el impacto del cambio climático en los ecosistemas.",
        "score": 92
      },
      {
        "description": "Propone soluciones innovadoras para la conservación de especies.",
        "score": 78
      }
    ], null, 2);

    const jsonInput = ref('');

    const copyPlaceholder = () => {
      navigator.clipboard.writeText(placeholder);
    };

    const importJson = () => {
      try {
        const criteria = JSON.parse(jsonInput.value);
        if (Array.isArray(criteria)) {
          emit('import', criteria);
          emit('close');
        } else {
          alert('El JSON proporcionado no es un array válido.');
        }
      } catch (error) {
        alert('Error al parsear el JSON. Por favor, verifica el formato.');
      }
    };

    return {
      placeholder,
      jsonInput,
      copyPlaceholder,
      importJson,
    };
  },
};
</script>
