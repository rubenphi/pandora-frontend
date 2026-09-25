<template>
  <MultiQrScanner
    ref="scanner"
    :students="students"
    :options="options"
    v-bind="$attrs"
    @scan-complete="onScanComplete"
    @scan-submit="onScanSubmit"
    @scan-cancelled="onScanCancelled"
  />
</template>

<script>
import MultiQrScanner from "./MultiQrScanner.vue";

export default {
  name: "MatrixScanner",
  components: {
    MultiQrScanner,
  },
  inheritAttrs: false,
  props: {
    students: { type: Array, default: () => [] },
    options: { type: Array, default: () => ["A", "B", "C", "D"] },
  },
  emits: ["scan-complete", "scan-submit", "scan-cancelled"],
  methods: {
    onScanComplete(codes) {
      this.$emit("scan-complete", codes);
    },
    onScanSubmit(codes) {
      this.$emit("scan-submit", codes);
    },
    onScanCancelled() {
      this.$emit("scan-cancelled");
    },
    clearAccumulated() {
      return this.$refs.scanner?.clearAccumulated?.();
    },
  },
};
</script>
