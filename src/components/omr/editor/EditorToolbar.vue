<template>
  <header class="qz-top-bar qz-editor-toolbar">
    <div class="qz-top-bar__left">
      <button
        type="button"
        class="qz-circle-btn"
        @click="$emit('back')"
        aria-label="Volver"
      >
        <ion-icon :icon="arrowBackOutline"></ion-icon>
      </button>
      <div class="qz-top-bar__title-wrap">
        <h1 class="qz-top-bar__title">
          {{ isEditing ? "Editar Plantilla OMR" : "Nueva Plantilla OMR" }}
        </h1>
        <span class="qz-top-bar__subtitle" v-if="templateId"
          >Plantilla ID #{{ templateId }}</span
        >
      </div>
    </div>

    <div class="qz-top-bar__actions">
      <button
        v-if="templateId"
        type="button"
        class="qz-btn-action qz-btn-action--purple"
        @click="$emit('scan')"
        title="Crear sesiones y escanear en visor independiente"
      >
        <ion-icon :icon="cameraOutline"></ion-icon>
        <span>Escanear</span>
      </button>

      <button
        type="button"
        class="qz-btn-action qz-btn-action--success"
        @click="$emit('save')"
        :disabled="isSaving"
        title="Guardar en base de datos"
      >
        <ion-icon :icon="saveOutline"></ion-icon>
        <span>{{
          isSaving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"
        }}</span>
      </button>

      <button
        type="button"
        class="qz-btn-action qz-btn-action--primary"
        @click="$emit('download-pdf')"
        title="Descargar PDF imprimible (A4)"
      >
        <ion-icon :icon="documentTextOutline"></ion-icon>
        <span>PDF</span>
      </button>

      <button
        type="button"
        class="qz-btn-action qz-btn-action--ghost"
        @click="$emit('download-png')"
        title="Descargar imagen PNG"
      >
        <ion-icon :icon="downloadOutline"></ion-icon>
        <span>PNG</span>
      </button>
    </div>
  </header>
</template>

<script>
import { IonIcon } from "@ionic/vue";
import {
  arrowBackOutline,
  downloadOutline,
  codeDownloadOutline,
  saveOutline,
  documentTextOutline,
  cameraOutline,
} from "ionicons/icons";

export default {
  name: "EditorToolbar",
  components: {
    IonIcon,
  },
  props: {
    templateId: {
      type: [Number, String],
      default: null,
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
    isSaving: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "back",
    "save",
    "scan",
    "download-pdf",
    "download-png",
    "export-json",
  ],
  setup() {
    return {
      arrowBackOutline,
      downloadOutline,
      codeDownloadOutline,
      saveOutline,
      documentTextOutline,
      cameraOutline,
    };
  },
};
</script>

<style scoped>
.qz-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-wrap: wrap;
  gap: 10px;
}

.qz-top-bar__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qz-circle-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-circle-btn:hover {
  background: #f1f5f9;
}

.qz-top-bar__title-wrap {
  display: flex;
  flex-direction: column;
}

.qz-top-bar__title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
}

.qz-top-bar__subtitle {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.qz-top-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.qz-btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.qz-btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qz-btn-action--purple {
  background: #efeefc;
  color: #6a5ae0;
  border-color: rgba(106, 90, 224, 0.2);
}

.qz-btn-action--purple:hover:not(:disabled) {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-btn-action--success {
  background: #ecfdf5;
  color: #059669;
  border-color: rgba(5, 150, 105, 0.2);
}

.qz-btn-action--success:hover:not(:disabled) {
  background: #059669;
  color: #ffffff;
}

.qz-btn-action--primary {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #cbd5e1;
}

.qz-btn-action--primary:hover:not(:disabled) {
  background: #e2e8f0;
}

.qz-btn-action--ghost {
  background: #ffffff;
  color: #475569;
  border-color: #e2e8f0;
}

.qz-btn-action--ghost:hover:not(:disabled) {
  background: #f8fafc;
  color: #1e293b;
}

/* ==========================================================================
   DARK MODE OVERRIDES
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  .qz-editor-toolbar {
    background: #1d1838;
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
}

:global(body.dark) .qz-editor-toolbar,
:global(html.dark) .qz-editor-toolbar,
:global(.dark) .qz-editor-toolbar {
  background: #1d1838;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-circle-btn,
:global(html.dark) .qz-circle-btn,
:global(.dark) .qz-circle-btn {
  background: #252048;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-circle-btn:hover,
:global(html.dark) .qz-circle-btn:hover,
:global(.dark) .qz-circle-btn:hover {
  background: #2e2858;
}

:global(body.dark) .qz-top-bar__title,
:global(html.dark) .qz-top-bar__title,
:global(.dark) .qz-top-bar__title {
  color: #f7f7fd;
}

:global(body.dark) .qz-top-bar__subtitle,
:global(html.dark) .qz-top-bar__subtitle,
:global(.dark) .qz-top-bar__subtitle {
  color: #9e9bb8;
}

:global(body.dark) .qz-btn-action--purple,
:global(html.dark) .qz-btn-action--purple,
:global(.dark) .qz-btn-action--purple {
  background: #2a2353;
  color: #c0b7ff;
  border-color: rgba(124, 110, 242, 0.3);
}

:global(body.dark) .qz-btn-action--purple:hover:not(:disabled),
:global(html.dark) .qz-btn-action--purple:hover:not(:disabled),
:global(.dark) .qz-btn-action--purple:hover:not(:disabled) {
  background: #6a5ae0;
  color: #ffffff;
}

:global(body.dark) .qz-btn-action--success,
:global(html.dark) .qz-btn-action--success,
:global(.dark) .qz-btn-action--success {
  background: #142823;
  color: #48db9b;
  border-color: rgba(72, 219, 155, 0.2);
}

:global(body.dark) .qz-btn-action--success:hover:not(:disabled),
:global(html.dark) .qz-btn-action--success:hover:not(:disabled),
:global(.dark) .qz-btn-action--success:hover:not(:disabled) {
  background: #059669;
  color: #ffffff;
}

:global(body.dark) .qz-btn-action--primary,
:global(html.dark) .qz-btn-action--primary,
:global(.dark) .qz-btn-action--primary {
  background: #252048;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-btn-action--primary:hover:not(:disabled),
:global(html.dark) .qz-btn-action--primary:hover:not(:disabled),
:global(.dark) .qz-btn-action--primary:hover:not(:disabled) {
  background: #2e2858;
}

:global(body.dark) .qz-btn-action--ghost,
:global(html.dark) .qz-btn-action--ghost,
:global(.dark) .qz-btn-action--ghost {
  background: #231d42;
  color: #9e9bb8;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-btn-action--ghost:hover:not(:disabled),
:global(html.dark) .qz-btn-action--ghost:hover:not(:disabled),
:global(.dark) .qz-btn-action--ghost:hover:not(:disabled) {
  background: #2a2353;
  color: #f7f7fd;
}
</style>
