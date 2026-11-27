<template>
  <div
    class="qz-date-picker-container"
    :class="{
      'qz-date-picker--disabled': disabled,
      'qz-date-picker--open': isOpen,
    }"
  >
    <label v-if="label" class="qz-date-label">{{ label }}</label>

    <!-- Caja de visualización clicable -->
    <div
      class="qz-date-display-box"
      :class="{ 'has-value': !!modelValue }"
      @click="openModal"
    >
      <ion-icon :icon="calendarOutline" class="qz-date-box-icon"></ion-icon>
      <span class="qz-date-box-text">
        {{ formattedDisplayDate || placeholder }}
      </span>
      <button
        v-if="clearable && modelValue && !disabled"
        type="button"
        class="qz-date-clear-btn"
        title="Limpiar fecha"
        @click.stop="clearDate"
      >
        <ion-icon :icon="closeCircleOutline"></ion-icon>
      </button>
      <ion-icon
        v-else
        :icon="chevronDownOutline"
        class="qz-date-arrow-icon"
      ></ion-icon>
    </div>

    <!-- Modal Elegante Queezy con ion-datetime -->
    <ion-modal
      :is-open="isOpen"
      @didDismiss="onModalDismiss"
      class="qz-date-picker-modal"
    >
      <div class="qz-date-modal-wrap">
        <!-- Cabecera del selector -->
        <header class="qz-date-modal-header">
          <div class="qz-date-modal-header-info">
            <span class="qz-date-modal-tag">CALENDARIO</span>
            <h3 class="qz-date-modal-title">
              {{ modalFormattedDate || "Selecciona una fecha" }}
            </h3>
          </div>
          <button
            type="button"
            class="qz-date-modal-close"
            title="Cerrar"
            aria-label="Cerrar selector"
            @click="closeModal"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </header>

        <!-- Calendario interactivo de Ionic -->
        <div class="qz-date-modal-body">
          <ion-datetime
            :value="internalDateValue"
            presentation="date"
            :prefer-wheel="false"
            :show-default-buttons="false"
            class="qz-styled-datetime"
            @ionChange="onDatetimeChange"
          ></ion-datetime>
        </div>

        <!-- Barra inferior de acciones Queezy -->
        <footer class="qz-date-modal-footer">
          <button
            v-if="clearable"
            type="button"
            class="qz-date-btn-secondary"
            @click="clearDateAndClose"
          >
            Borrar
          </button>
          <button
            type="button"
            class="qz-date-btn-primary"
            @click="confirmDate"
          >
            Confirmar
          </button>
        </footer>
      </div>
    </ion-modal>
  </div>
</template>

<script>
import {
  IonIcon,
  IonModal,
  IonDatetime,
} from "@ionic/vue";
import {
  calendarOutline,
  closeOutline,
  closeCircleOutline,
  chevronDownOutline,
} from "ionicons/icons";
import { ref, computed, watch } from "vue";

export default {
  name: "QzDatePicker",
  components: {
    IonIcon,
    IonModal,
    IonDatetime,
  },
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: null,
    },
    placeholder: {
      type: String,
      default: "Seleccionar fecha",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:modelValue", "change"],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const tempValue = ref("");

    const internalDateValue = computed(() => {
      const val = tempValue.value || props.modelValue;
      if (!val) return new Date().toISOString();
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return `${val}T12:00:00.000Z`;
      }
      return val;
    });

    const openModal = () => {
      if (props.disabled) return;
      tempValue.value = props.modelValue || new Date().toISOString().substring(0, 10);
      isOpen.value = true;
    };

    const closeModal = () => {
      isOpen.value = false;
    };

    const onModalDismiss = () => {
      isOpen.value = false;
    };

    const onDatetimeChange = (event) => {
      const selected = event.detail.value;
      if (selected) {
        tempValue.value = typeof selected === "string" ? selected.substring(0, 10) : "";
      }
    };

    const confirmDate = () => {
      const val = tempValue.value || new Date().toISOString().substring(0, 10);
      emit("update:modelValue", val);
      emit("change", val);
      isOpen.value = false;
    };

    const clearDate = () => {
      tempValue.value = "";
      emit("update:modelValue", "");
      emit("change", "");
    };

    const clearDateAndClose = () => {
      clearDate();
      isOpen.value = false;
    };

    // Formato visible: DD/MM/YYYY
    const formattedDisplayDate = computed(() => {
      if (!props.modelValue) return "";
      const match = props.modelValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
      }
      return props.modelValue;
    });

    // Formato título modal en español: ej. "25 de Noviembre, 2026"
    const modalFormattedDate = computed(() => {
      const val = tempValue.value || props.modelValue;
      if (!val) return "";
      const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return val;
      const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      const day = parseInt(match[3], 10);
      const monthName = meses[parseInt(match[2], 10) - 1] || "";
      const yr = match[1];
      return `${day} de ${monthName}, ${yr}`;
    });

    watch(
      () => props.modelValue,
      (newVal) => {
        tempValue.value = newVal || "";
      }
    );

    return {
      isOpen,
      internalDateValue,
      openModal,
      closeModal,
      onModalDismiss,
      onDatetimeChange,
      confirmDate,
      clearDate,
      clearDateAndClose,
      formattedDisplayDate,
      modalFormattedDate,
      calendarOutline,
      closeOutline,
      closeCircleOutline,
      chevronDownOutline,
    };
  },
};
</script>

<style scoped>
.qz-date-picker-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  position: relative;
  box-sizing: border-box;
}

.qz-date-label {
  font-size: 11px;
  font-weight: 700;
  color: #6a5ae0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Caja de entrada estilizada */
.qz-date-display-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.16);
  border-radius: 14px;
  height: 44px;
  padding: 0 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  user-select: none;
}

.qz-date-display-box:hover {
  border-color: rgba(106, 90, 224, 0.35);
  background: #f0effe;
}

.qz-date-box-icon {
  font-size: 18px;
  color: #6a5ae0;
  flex-shrink: 0;
}

.qz-date-box-text {
  flex: 1;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  color: #858494;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-date-display-box.has-value .qz-date-box-text {
  color: #0c092a;
}

.qz-date-arrow-icon {
  font-size: 14px;
  color: #858494;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.qz-date-clear-btn {
  border: none;
  background: transparent;
  color: #858494;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.qz-date-clear-btn:hover {
  color: #e11d48;
}

/* MODAL DATEPICKER QUEEZY */
.qz-date-picker-modal {
  --background: #efeefc;
  --max-width: 380px;
  --height: auto;
  --border-radius: 26px;
}

.qz-date-modal-wrap {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(12, 9, 42, 0.14);
}

.qz-date-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  color: #ffffff;
}

.qz-date-modal-header-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.qz-date-modal-tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 9999px;
  display: inline-block;
  align-self: flex-start;
}

.qz-date-modal-title {
  margin: 0;
  font-size: 16.5px;
  font-weight: 800;
  color: #ffffff;
}

.qz-date-modal-close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.qz-date-modal-body {
  padding: 10px 12px;
  display: flex;
  justify-content: center;
  background: #ffffff;
}

.qz-styled-datetime {
  --background: transparent;
  border-radius: 16px;
  width: 100%;
}

.qz-date-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px 18px;
  background: #faf9fe;
  border-top: 1px solid rgba(106, 90, 224, 0.1);
}

.qz-date-btn-primary {
  padding: 10px 22px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.3);
  transition: all 0.2s ease;
}

.qz-date-btn-primary:hover {
  transform: translateY(-1px);
}

.qz-date-btn-secondary {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(106, 90, 224, 0.18);
  background: transparent;
  color: #858494;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.qz-date-btn-secondary:hover {
  background: #efeefc;
  color: #6a5ae0;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-date-label,
  body:not(.light) .qz-date-box-icon {
    color: #b5a9ff;
  }

  body:not(.light) .qz-date-display-box {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.12);
  }

  body:not(.light) .qz-date-display-box:hover {
    border-color: #7c6ef2;
    background: #2b2254;
  }

  body:not(.light) .qz-date-display-box.has-value .qz-date-box-text {
    color: #f7f7fd;
  }

  body:not(.light) .qz-date-modal-wrap,
  body:not(.light) .qz-date-modal-body {
    background: #1d1838;
  }

  body:not(.light) .qz-date-modal-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  }

  body:not(.light) .qz-date-modal-footer {
    background: #181430;
    border-color: rgba(255, 255, 255, 0.08);
  }

  body:not(.light) .qz-date-btn-secondary {
    border-color: rgba(255, 255, 255, 0.14);
    color: #9e9bb8;
  }
}

:global(body.dark) .qz-date-label,
:global(html.dark) .qz-date-label,
:global(.dark) .qz-date-label,
:global(body.dark) .qz-date-box-icon,
:global(html.dark) .qz-date-box-icon,
:global(.dark) .qz-date-box-icon {
  color: #b5a9ff;
}

:global(body.dark) .qz-date-display-box,
:global(html.dark) .qz-date-display-box,
:global(.dark) .qz-date-display-box {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-date-display-box:hover,
:global(html.dark) .qz-date-display-box:hover,
:global(.dark) .qz-date-display-box:hover {
  border-color: #7c6ef2;
  background: #2b2254;
}

:global(body.dark) .qz-date-display-box.has-value .qz-date-box-text,
:global(html.dark) .qz-date-display-box.has-value .qz-date-box-text,
:global(.dark) .qz-date-display-box.has-value .qz-date-box-text {
  color: #f7f7fd;
}

:global(body.dark) .qz-date-modal-wrap,
:global(body.dark) .qz-date-modal-body,
:global(html.dark) .qz-date-modal-wrap,
:global(html.dark) .qz-date-modal-body,
:global(.dark) .qz-date-modal-wrap,
:global(.dark) .qz-date-modal-body {
  background: #1d1838;
}

:global(body.dark) .qz-date-modal-header,
:global(html.dark) .qz-date-modal-header,
:global(.dark) .qz-date-modal-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
}

:global(body.dark) .qz-date-modal-footer,
:global(html.dark) .qz-date-modal-footer,
:global(.dark) .qz-date-modal-footer {
  background: #181430;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-date-btn-secondary,
:global(html.dark) .qz-date-btn-secondary,
:global(.dark) .qz-date-btn-secondary {
  border-color: rgba(255, 255, 255, 0.14);
  color: #9e9bb8;
}
</style>
