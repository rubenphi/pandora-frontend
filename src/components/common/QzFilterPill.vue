<template>
  <div
    class="qz-filter-pill"
    :class="{ 'qz-filter-pill--disabled': disabled }"
  >
    <ion-icon v-if="icon" :icon="icon" class="qz-filter-icon"></ion-icon>
    <span v-if="label" class="qz-filter-label">{{ label }}</span>
    <ion-select
      :model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      interface="popover"
      :interface-options="effectiveInterfaceOptions"
      class="qz-filter-select"
      @ionChange="handleChange"
    >
      <slot>
        <ion-select-option
          v-for="opt in formattedOptions"
          :key="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
        >
          {{ opt.label }}
        </ion-select-option>
      </slot>
    </ion-select>
  </div>
</template>

<script>
import { IonSelect, IonSelectOption, IonIcon } from "@ionic/vue";
import { computed } from "vue";

export default {
  name: "QzFilterPill",
  components: {
    IonSelect,
    IonSelectOption,
    IonIcon,
  },
  props: {
    modelValue: {
      type: [String, Number, Boolean, Object],
      default: undefined,
    },
    label: {
      type: String,
      default: null,
    },
    icon: {
      type: [Object, String],
      default: null,
    },
    options: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: "Elegir...",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    interfaceOptions: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["update:modelValue", "change"],
  setup(props, { emit }) {
    const formattedOptions = computed(() => {
      if (!props.options || !Array.isArray(props.options)) return [];
      return props.options.map((opt) => {
        if (typeof opt === "object" && opt !== null) {
          return {
            value: opt.value !== undefined ? opt.value : opt.id,
            label: opt.label !== undefined ? opt.label : (opt.name || opt.titulo || opt.value || opt.id),
            disabled: opt.disabled || false,
          };
        }
        return {
          value: opt,
          label: String(opt),
          disabled: false,
        };
      });
    });

    const effectiveInterfaceOptions = computed(() => {
      return {
        cssClass: "qz-popover-filter",
        ...props.interfaceOptions,
      };
    });

    const handleChange = (event) => {
      const val = event.detail.value;
      emit("update:modelValue", val);
      emit("change", val);
    };

    return {
      formattedOptions,
      effectiveInterfaceOptions,
      handleChange,
    };
  },
};
</script>
