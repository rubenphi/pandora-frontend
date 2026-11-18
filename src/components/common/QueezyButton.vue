<template>
  <button
    :class="[
      'qz-btn',
      `qz-btn--${variant}`,
      `qz-btn--${size}`,
      { 'qz-btn--block': block, 'qz-btn--disabled': disabled || loading }
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click', $event)"
  >
    <ion-spinner v-if="loading" name="crescent" class="qz-btn__spinner" />
    <span v-else class="qz-btn__content">
      <slot name="start"></slot>
      <span class="qz-btn__text"><slot /></span>
      <slot name="end"></slot>
    </span>
  </button>
</template>

<script>
import { IonSpinner } from "@ionic/vue";

export default {
  name: "QueezyButton",
  components: {
    IonSpinner,
  },
  props: {
    variant: {
      type: String,
      default: "primary",
      validator: (val) =>
        ["primary", "secondary", "outline", "ghost", "danger"].includes(val),
    },
    size: {
      type: String,
      default: "lg",
      validator: (val) => ["sm", "md", "lg"].includes(val),
    },
    type: {
      type: String,
      default: "button",
    },
    block: {
      type: Boolean,
      default: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["click"],
};
</script>

<style scoped>
.qz-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  box-sizing: border-box;
  outline: none;
}

.qz-btn--block {
  width: 100%;
}

/* Tamaños */
.qz-btn--sm {
  min-height: 40px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: var(--qz-radius-md, 16px);
}

.qz-btn--md {
  min-height: 48px;
  padding: 0 20px;
  font-size: 15px;
  border-radius: var(--qz-radius-lg, 20px);
}

.qz-btn--lg {
  min-height: 56px;
  padding: 0 24px;
  font-size: 16px;
  border-radius: var(--qz-radius-lg, 20px);
}

/* Variantes */
.qz-btn--primary {
  background-color: var(--qz-color-purple-primary, #6A5AE0);
  color: #FFFFFF;
  box-shadow: var(--qz-shadow-button-primary, 0 10px 24px -2px rgba(106, 90, 224, 0.38));
}

.qz-btn--primary:hover:not(:disabled) {
  background-color: var(--qz-color-purple-dark, #5A33D6);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -2px rgba(106, 90, 224, 0.45);
}

.qz-btn--primary:active:not(:disabled) {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
  background-color: var(--qz-color-purple-dark, #5A33D6);
}

.qz-btn--secondary {
  background-color: var(--qz-color-pink-coral, #FF8FA2);
  color: #FFFFFF;
  box-shadow: var(--qz-shadow-button-pink, 0 10px 24px -2px rgba(255, 143, 162, 0.38));
}

.qz-btn--secondary:hover:not(:disabled) {
  background-color: #f57a90;
  transform: translateY(-2px);
}

.qz-btn--secondary:active:not(:disabled) {
  transform: translateY(1px) scale(0.98);
}

.qz-btn--outline {
  background-color: transparent;
  color: var(--qz-color-purple-primary, #6A5AE0);
  border: 2px solid var(--qz-color-purple-primary, #6A5AE0);
}

.qz-btn--outline:hover:not(:disabled) {
  background-color: rgba(106, 90, 224, 0.08);
  transform: translateY(-1px);
}

.qz-btn--outline:active:not(:disabled) {
  transform: translateY(1px) scale(0.98);
  background-color: rgba(106, 90, 224, 0.15);
}

.qz-btn--ghost {
  background-color: #FFFFFF;
  color: var(--qz-color-text-main, #0C092A);
  box-shadow: 0 4px 14px rgba(12, 9, 42, 0.06);
  border: 1px solid var(--qz-color-border, #E6E6E6);
}

.qz-btn--ghost:hover:not(:disabled) {
  border-color: var(--qz-color-purple-primary, #6A5AE0);
  color: var(--qz-color-purple-primary, #6A5AE0);
  transform: translateY(-1px);
}

.qz-btn--ghost:active:not(:disabled) {
  transform: translateY(1px) scale(0.98);
}

.qz-btn--disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none !important;
  transform: none !important;
}

.qz-btn__content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.qz-btn__spinner {
  --color: currentColor;
  width: 24px;
  height: 24px;
}
</style>
