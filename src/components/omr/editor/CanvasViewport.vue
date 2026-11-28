<template>
  <div class="canvas-area">
    <div class="canvas-toolbar">
      <span class="canvas-label">Vista previa de la hoja imprimible</span>
      <div class="canvas-zoom-row">
        <button
          class="zoom-btn"
          @click="$emit('adjust-zoom', -0.05)"
          title="Alejar (o rueda del ratón hacia abajo)"
        >
          −
        </button>
        <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
        <button
          class="zoom-btn"
          @click="$emit('adjust-zoom', 0.05)"
          title="Acercar (o rueda del ratón hacia arriba)"
        >
          +
        </button>
        <button
          class="zoom-btn zoom-fit"
          @click="$emit('fit-zoom')"
          title="Ajustar hoja a la pantalla"
        >
          Ajustar
        </button>
      </div>
      <div class="canvas-legend">
        <span class="reserved-sample"></span> Zona reservada
        <span class="drag-sample"></span> Arrastrable
      </div>
    </div>

    <div
      class="canvas-scroll-container"
      ref="scrollContainer"
      @wheel.prevent="$emit('wheel', $event)"
      @mousedown="$emit('canvas-mouse-down', $event)"
      @mousemove="$emit('canvas-mouse-move', $event)"
      @mouseup="$emit('canvas-mouse-up', $event)"
      @mouseleave="$emit('canvas-mouse-up', $event)"
      @touchstart.prevent="$emit('canvas-touch-start', $event)"
      @touchmove.prevent="$emit('canvas-touch-move', $event)"
      @touchend.prevent="$emit('canvas-touch-end', $event)"
      @touchcancel="$emit('canvas-touch-end', $event)"
    >
      <div
        class="canvas-outer-wrapper"
        :style="{
          width: `${canvasWidth * zoom}px`,
          height: `${canvasHeight * zoom}px`,
        }"
      >
        <div
          class="canvas-scaled-wrapper"
          :style="{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }"
        >
          <canvas
            ref="canvasRef"
            class="omr-canvas"
            :style="{
              cursor: isPanning
                ? 'grabbing'
                : dragging
                ? 'grabbing'
                : hoverSectionIdx >= 0
                ? 'grab'
                : 'default',
            }"
          ></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  name: "CanvasViewport",
  props: {
    zoom: {
      type: Number,
      required: true,
    },
    dragging: {
      type: Boolean,
      default: false,
    },
    isPanning: {
      type: Boolean,
      default: false,
    },
    hoverSectionIdx: {
      type: Number,
      default: -1,
    },
    canvasWidth: {
      type: Number,
      default: 1240,
    },
    canvasHeight: {
      type: Number,
      default: 1754,
    },
  },
  emits: [
    "adjust-zoom",
    "fit-zoom",
    "wheel",
    "canvas-mouse-down",
    "canvas-mouse-move",
    "canvas-mouse-up",
    "canvas-touch-start",
    "canvas-touch-move",
    "canvas-touch-end",
  ],
  setup() {
    const canvasRef = ref(null);
    const scrollContainer = ref(null);

    return {
      canvasRef,
      scrollContainer,
    };
  },
};
</script>

<style scoped>
.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #e8ecf0;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.canvas-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  flex: 1;
}

.canvas-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #94a3b8;
}

.reserved-sample {
  display: inline-block;
  width: 12px;
  height: 12px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px dashed rgba(239, 68, 68, 0.5);
  border-radius: 2px;
}

.drag-sample {
  display: inline-block;
  width: 12px;
  height: 12px;
  background: rgba(37, 99, 235, 0.15);
  border: 1.5px solid #2563eb;
  border-radius: 2px;
  margin-left: 8px;
}

.canvas-scroll-container {
  flex: 1;
  overflow: auto;
  padding: 24px;
  box-sizing: border-box;
  text-align: center;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.canvas-outer-wrapper {
  display: inline-block;
  margin: 0 auto;
  position: relative;
  vertical-align: top;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  border-radius: 4px;
}

.canvas-scaled-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  border-radius: 4px;
  overflow: hidden;
  background: #ffffff;
}

.canvas-zoom-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  width: 28px;
  height: 28px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.zoom-btn:hover {
  background: #e2e8f0;
}

.zoom-fit {
  width: auto;
  padding: 0 8px;
  font-size: 12px;
}

.zoom-value {
  font-size: 13px;
  color: #64748b;
  min-width: 38px;
  text-align: center;
}

.omr-canvas {
  display: block;
  background: #ffffff;
}

@media (prefers-color-scheme: dark) {
  .canvas-area {
    background: #120f24;
  }
  .canvas-toolbar {
    background: #1d1838;
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
}

:global(body.dark) .canvas-area,
:global(html.dark) .canvas-area,
:global(.dark) .canvas-area {
  background: #120f24;
}

:global(body.dark) .canvas-toolbar,
:global(html.dark) .canvas-toolbar,
:global(.dark) .canvas-toolbar {
  background: #1d1838;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .zoom-btn,
:global(html.dark) .zoom-btn,
:global(.dark) .zoom-btn {
  background: #2a2350;
  border-color: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

:global(body.dark) .canvas-toolbar,
:global(html.dark) .canvas-toolbar,
:global(.dark) .canvas-toolbar {
  background: #1d1838;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .canvas-label,
:global(html.dark) .canvas-label,
:global(.dark) .canvas-label {
  color: #f7f7fd;
}

:global(body.dark) .zoom-value,
:global(html.dark) .zoom-value,
:global(.dark) .zoom-value,
:global(body.dark) .canvas-legend,
:global(html.dark) .canvas-legend,
:global(.dark) .canvas-legend {
  color: #9e9bb8;
}

:global(body.dark) .zoom-btn,
:global(html.dark) .zoom-btn,
:global(.dark) .zoom-btn {
  background: #252048;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .zoom-btn:hover,
:global(html.dark) .zoom-btn:hover,
:global(.dark) .zoom-btn:hover {
  background: #2e2858;
}
</style>
