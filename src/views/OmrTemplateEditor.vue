<template>
  <ion-page>
    <EditorToolbar
      :template-id="templateId"
      :is-editing="Boolean(templateId)"
      :is-saving="isSaving"
      @back="goBack"
      @save="onSave"
      @scan="goToScannerSession"
      @download-pdf="downloadPDF"
      @download-png="downloadPNG"
      @export-json="exportJSON"
    />

    <ion-content>
      <div v-if="isLoading" class="loading-overlay">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <span>Cargando plantilla...</span>
      </div>

      <div class="editor-layout" v-else>
        <!-- ===== PANEL IZQUIERDO: FORMULARIOS Y PROPIEDADES ===== -->
        <aside class="left-panel">
          <SheetConfigCard
            :config="config"
            :canvas-width="canvasWidth"
            :canvas-height="canvasHeight"
            :min-canvas-dimensions="minCanvasDimensions"
            :is-processing-bg="isProcessingBg"
            :bg-status-message="bgStatusMessage"
            @update:canvas-width="onCanvasWidthChange"
            @update:canvas-height="onCanvasHeightChange"
            @draw-preview="drawPreview"
            @apply-preset="applyPreset"
            @upload-background="uploadBackground"
            @remove-background="removeBackground"
            @download-background="downloadBackground"
            @download-design-guide="downloadDesignGuide"
          />

          <SectionListCard
            :sections="config.sections"
            :selected-index="selectedIndex"
            @add-section="addNewSection"
            @select-section="selectSection"
            @remove-section="removeSection"
            @move-up="moveSectionUp"
            @move-down="moveSectionDown"
          />

          <SectionPropertiesCard
            v-if="selectedSection"
            :selected-section="selectedSection"
            @draw-preview="drawPreview"
            @clamp-and-draw="clampAndDraw"
            @section-type-change="onSectionTypeChange"
            @apply-scale="applyScale"
          />
        </aside>

        <!-- ===== PANEL DERECHO: LIENZO INTERACTIVO ===== -->
        <CanvasViewport
          ref="viewportRef"
          :zoom="zoom"
          :dragging="dragging"
          :is-panning="isPanning"
          :hover-section-idx="hoverSectionIdx"
          :canvas-width="canvasWidth"
          :canvas-height="canvasHeight"
          @adjust-zoom="adjustZoom"
          @fit-zoom="fitZoom"
          @wheel="onWheel"
          @canvas-mouse-down="onCanvasMouseDown"
          @canvas-mouse-move="onCanvasMouseMove"
          @canvas-mouse-up="onCanvasMouseUp"
          @canvas-touch-start="onCanvasTouchStart"
          @canvas-touch-move="onCanvasTouchMove"
          @canvas-touch-end="onCanvasTouchEnd"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent, IonSpinner } from "@ionic/vue";
import { ref, onMounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";

import EditorToolbar from "@/components/omr/editor/EditorToolbar.vue";
import SheetConfigCard from "@/components/omr/editor/SheetConfigCard.vue";
import SectionListCard from "@/components/omr/editor/SectionListCard.vue";
import SectionPropertiesCard from "@/components/omr/editor/SectionPropertiesCard.vue";
import CanvasViewport from "@/components/omr/editor/CanvasViewport.vue";

import { useOmrEditorState } from "@/components/omr/editor/composables/useOmrEditorState.js";
import { useCanvasInteraction } from "@/components/omr/editor/composables/useCanvasInteraction.js";

export default {
  name: "OmrTemplateEditor",
  components: {
    IonPage,
    IonContent,
    IonSpinner,
    EditorToolbar,
    SheetConfigCard,
    SectionListCard,
    SectionPropertiesCard,
    CanvasViewport,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const viewportRef = ref(null);

    // 1. Estado del editor y la plantilla
    const editorState = useOmrEditorState();

    // 2. Interacciones del lienzo (zoom, arrastre, eventos de mouse/touch)
    const canvasInteraction = useCanvasInteraction({
      config: editorState.config,
      dims: editorState.dims,
      selectedSection: editorState.selectedSection,
      selectedIndex: editorState.selectedIndex,
      selectSection: editorState.selectSection,
      drawPreview: editorState.drawPreview,
      clampToScannableArea: editorState.clampToScannableArea,
    });

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/plantillas-encuestas");
      }
    };

    const onSave = async () => {
      const prevId = editorState.templateId.value;
      const success = await editorState.saveTemplate();
      if (
        success &&
        editorState.templateId.value &&
        editorState.templateId.value !== prevId
      ) {
        // Actualizar la URL de la ruta a la plantilla recién creada
        // para que al recargar / actualizar (F5) no vuelva a la plantilla base
        router.replace(`/omr-editor/${editorState.templateId.value}`);
      }
    };

    const goToScannerSession = () => {
      if (editorState.templateId.value) {
        router.push(`/omr-encuesta/sesiones/${editorState.templateId.value}`);
      }
    };

    onMounted(async () => {
      await nextTick();
      const tplId = route.params.templateId;
      if (tplId) {
        await editorState.loadTemplate(tplId);
      }

      if (viewportRef.value) {
        editorState.setCanvasRef(viewportRef.value.canvasRef);
        canvasInteraction.canvasRef.value = viewportRef.value.canvasRef;
        canvasInteraction.scrollContainer.value = viewportRef.value.scrollContainer;
      }
      await canvasInteraction.fitZoom();
      await editorState.drawPreview();
    });

    return {
      viewportRef,
      goBack,
      onSave,
      goToScannerSession,
      ...editorState,
      ...canvasInteraction,
    };
  },
};
</script>

<style scoped>
.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #64748b;
  font-size: 14px;
}

.editor-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.left-panel {
  width: 320px;
  min-width: 280px;
  max-width: 360px;
  overflow-y: auto;
  background: #f4f3fb;
  border-right: 1px solid #e2e8f0;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 768px) {
  .editor-layout {
    flex-direction: column;
  }
  .left-panel {
    width: 100%;
    max-width: 100%;
    max-height: 45vh;
  }
}

@media (prefers-color-scheme: dark) {
  .left-panel {
    background: #110d26;
    border-right-color: rgba(255, 255, 255, 0.08);
  }
}

:global(body.dark) .left-panel,
:global(html.dark) .left-panel,
:global(.dark) .left-panel {
  background: #110d26;
  border-right-color: rgba(255, 255, 255, 0.08);
}
</style>
