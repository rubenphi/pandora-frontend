<template>
  <button
    :class="[
      'qz-btn',
      `qz-btn--${variant}`,
      `qz-btn--${size}`,
      {
        'qz-btn--block': block,
        'qz-btn--circle': circle,
        'qz-btn--pill': pill,
        'qz-btn--disabled': disabled || loading
      }
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click', $event)"
  >
    <ion-spinner v-if="loading" name="crescent" class="qz-btn__spinner" />
    <template v-else>
      <slot name="start">
        <ion-icon v-if="icon" :icon="icon" class="qz-btn__icon-start"></ion-icon>
      </slot>
      <span class="qz-btn__text" v-if="$slots.default">
        <slot />
      </span>
      <slot name="end" />
    </template>
  </button>
</template>

<script>
import { IonSpinner, IonIcon } from "@ionic/vue";

export default {
  name: "QzButton",
  components: {
    IonSpinner,
    IonIcon,
  },
  props: {
    variant: {
      type: String,
      default: "primary",
      validator: (val) =>
        [
          "primary",
          "secondary",
          "outline",
          "ghost",
          "translucent",
          "danger",
          "success",
        ].includes(val),
    },
    size: {
      type: String,
      default: "md",
      validator: (val) => ["sm", "md", "lg"].includes(val),
    },
    type: {
      type: String,
      default: "button",
    },
    block: {
      type: Boolean,
      default: false,
    },
    circle: {
      type: Boolean,
      default: false,
    },
    pill: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: [Object, String],
      default: null,
    },
  },
  emits: ["click"],
};
</script>

<style scoped>
.qz-btn__spinner {
  --color: currentColor;
  width: 20px;
  height: 20px;
}

.qz-btn__text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.qz-btn__icon-start {
  font-size: 1.25em;
  flex-shrink: 0;
}
</style>
