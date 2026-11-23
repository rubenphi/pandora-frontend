<template>
  <ion-modal
    :is-open="isOpen"
    class="qz-import-modal"
    @didDismiss="$emit('close')"
  >
    <div class="qz-modal-sheet">
      <!-- Cabecera del Modal -->
      <div class="qz-modal-header">
        <div class="qz-modal-title-wrap">
          <div class="qz-modal-icon">
            <ion-icon :icon="codeSlashOutline"></ion-icon>
          </div>
          <div>
            <h2 class="qz-modal-title">Importar Criterios desde JSON</h2>
            <p class="qz-modal-sub">
              Pega un arreglo de criterios con su descripción y puntaje
            </p>
          </div>
        </div>

        <button
          type="button"
          class="qz-modal-close-btn"
          title="Cerrar modal"
          @click="$emit('close')"
        >
          <ion-icon :icon="closeOutline"></ion-icon>
        </button>
      </div>

      <!-- Contenido del Modal -->
      <div class="qz-modal-body">
        <div class="qz-code-box-wrapper">
          <label class="qz-code-label">Estructura JSON:</label>
          <textarea
            v-model="jsonInput"
            :placeholder="placeholder"
            rows="12"
            class="qz-code-textarea"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Banner de Error si falla el parseo -->
        <div v-if="errorMessage" class="qz-error-notice">
          <ion-icon :icon="alertCircleOutline"></ion-icon>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Acciones del Modal -->
        <div class="qz-modal-actions-row">
          <button
            type="button"
            class="qz-action-pill-btn qz-btn--secondary"
            @click="copyPlaceholder"
          >
            <ion-icon :icon="copyOutline"></ion-icon>
            <span>Copiar Ejemplo</span>
          </button>

          <button
            type="button"
            class="qz-action-pill-btn qz-btn--primary"
            @click="importJson"
          >
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span>Importar Criterios</span>
          </button>
        </div>
      </div>
    </div>
  </ion-modal>
</template>

<script>
import { ref } from "vue";
import { IonModal, IonIcon } from "@ionic/vue";
import {
  closeOutline,
  copyOutline,
  checkmarkOutline,
  codeSlashOutline,
  alertCircleOutline,
} from "ionicons/icons";

export default {
  name: "ImportCriteriaModal",
  components: {
    IonModal,
    IonIcon,
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["close", "import"],
  setup(_, { emit }) {
    const placeholder = JSON.stringify(
      [
        {
          description:
            "Elabora un ensayo sobre la importancia de la biodiversidad.",
          score: 85,
        },
        {
          description:
            "Analiza el impacto del cambio climático en los ecosistemas.",
          score: 92,
        },
        {
          description:
            "Propone soluciones innovadoras para la conservación de especies.",
          score: 78,
        },
      ],
      null,
      2,
    );

    const jsonInput = ref("");
    const errorMessage = ref("");

    const copyPlaceholder = () => {
      navigator.clipboard.writeText(placeholder);
      jsonInput.value = placeholder;
      errorMessage.value = "";
    };

    const importJson = () => {
      errorMessage.value = "";
      if (!jsonInput.value || jsonInput.value.trim() === "") {
        errorMessage.value =
          "Por favor pega o ingresa el JSON de criterios a importar.";
        return;
      }

      try {
        const criteria = JSON.parse(jsonInput.value);
        if (Array.isArray(criteria)) {
          emit("import", criteria);
          jsonInput.value = "";
          emit("close");
        } else {
          errorMessage.value =
            "El formato debe ser una lista o arreglo de criterios: [ { description: '...', score: 10 } ].";
        }
      } catch (error) {
        errorMessage.value =
          "El formato JSON no es válido. Revisa que no falten comillas o corchetes.";
      }
    };

    return {
      placeholder,
      jsonInput,
      errorMessage,
      copyPlaceholder,
      importJson,
      closeOutline,
      copyOutline,
      checkmarkOutline,
      codeSlashOutline,
      alertCircleOutline,
    };
  },
};
</script>

<style scoped>
.qz-import-modal {
  --border-radius: 28px;
  --max-width: 560px;
  --height: auto;
}

.qz-modal-sheet {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: 28px;
  padding: 24px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 50px rgba(106, 90, 224, 0.25);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.1));
}

.qz-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qz-modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qz-modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-modal-sub {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-modal-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--qz-color-purple-bg, #efeefc);
  border: none;
  color: var(--qz-color-text-muted, #858494);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-modal-close-btn:hover {
  color: var(--qz-color-text-main, #0c092a);
  background: #e5e3fa;
}

.qz-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-code-box-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-code-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--qz-color-text-muted, #858494);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.qz-code-textarea {
  width: 100%;
  background: var(--qz-color-purple-bg, #efeefc);
  border: 1.5px solid transparent;
  border-radius: var(--qz-radius-md, 16px);
  padding: 14px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  color: var(--qz-color-text-main, #0c092a);
  line-height: 1.5;
  resize: vertical;
  min-height: 200px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.qz-code-textarea:focus {
  border-color: var(--ion-color-primary, #6a5ae0);
  background: #ffffff;
}

.qz-error-notice {
  background: #fff0f0;
  border: 1px solid #ffccd7;
  color: #ff5656;
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
}

.qz-modal-actions-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.qz-action-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
  outline: none;
}

.qz-btn--primary {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
}

.qz-btn--secondary {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.18);
}

.qz-action-pill-btn:active {
  transform: scale(0.96);
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-modal-sheet {
    background: #1d1838;
    color: #f7f7fd;
    border-color: rgba(255, 255, 255, 0.12);
  }

  body:not(.light) .qz-modal-icon {
    background: #28214b;
    color: #a39bf0;
  }

  body:not(.light) .qz-modal-title {
    color: #f7f7fd;
  }

  body:not(.light) .qz-modal-close-btn {
    background: #28214b;
    color: #f7f7fd;
  }

  body:not(.light) .qz-code-textarea {
    background: #17132e;
    color: #f7f7fd;
    border-color: rgba(255, 255, 255, 0.12);
  }

  body:not(.light) .qz-btn--secondary {
    background: #28214b;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.12);
  }
}

:global(body.dark) .qz-modal-sheet,
:global(html.dark) .qz-modal-sheet,
:global(.dark) .qz-modal-sheet {
  background: #1d1838;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-modal-icon,
:global(html.dark) .qz-modal-icon,
:global(.dark) .qz-modal-icon {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-modal-title,
:global(html.dark) .qz-modal-title,
:global(.dark) .qz-modal-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-modal-close-btn,
:global(html.dark) .qz-modal-close-btn,
:global(.dark) .qz-modal-close-btn {
  background: #28214b;
  color: #f7f7fd;
}

:global(body.dark) .qz-code-textarea,
:global(html.dark) .qz-code-textarea,
:global(.dark) .qz-code-textarea {
  background: #17132e;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-btn--secondary,
:global(html.dark) .qz-btn--secondary,
:global(.dark) .qz-btn--secondary {
  background: #28214b;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
