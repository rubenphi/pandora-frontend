<template>
  <div class="panel-card">
    <div class="panel-card-title-row">
      <span class="panel-card-title">Secciones</span>
      <ion-button
        size="small"
        color="success"
        fill="solid"
        @click="$emit('add-section')"
      >
        <ion-icon :icon="addOutline" slot="start"></ion-icon>
        Añadir
      </ion-button>
    </div>

    <div
      v-for="(sec, idx) in sections"
      :key="idx"
      class="section-list-item"
      :class="{ 'section-list-item--active': selectedIndex === idx }"
      @click="$emit('select-section', idx)"
    >
      <div class="section-list-info">
        <span class="section-list-name">{{ sec.title || sec.name }}</span>
        <span class="section-list-meta">
          {{ sectionTypeLabel(sec) }}
          <span v-if="sec.type === 'code'">· {{ sec.digits }} dígitos</span>
          <span v-else-if="sec.type === 'instruction'">· Texto informativo</span>
          <span v-else>· {{ sec.rows }}×{{ sec.cols }} ({{ sec.layoutMode === 'questionnaire' ? 'Cuestionario' : 'Compacta' }})</span>
        </span>
      </div>
      
      <div class="section-actions" @click.stop>
        <button
          class="section-move-btn"
          :disabled="idx === 0"
          @click="$emit('move-up', idx)"
          title="Subir"
        >
          <ion-icon :icon="chevronUpOutline"></ion-icon>
        </button>
        <button
          class="section-move-btn"
          :disabled="idx === sections.length - 1"
          @click="$emit('move-down', idx)"
          title="Bajar"
        >
          <ion-icon :icon="chevronDownOutline"></ion-icon>
        </button>
        <button
          class="section-delete-btn"
          @click="$emit('remove-section', idx)"
          title="Eliminar"
        >
          ✕
        </button>
      </div>
    </div>

    <div v-if="sections.length === 0" class="empty-sections-hint">
      Haz clic en "Añadir" para crear secciones
    </div>
  </div>
</template>

<script>
import { IonButton, IonIcon } from "@ionic/vue";
import { addOutline, chevronUpOutline, chevronDownOutline } from "ionicons/icons";

export default {
  name: "SectionListCard",
  components: {
    IonButton,
    IonIcon,
  },
  props: {
    sections: {
      type: Array,
      required: true,
    },
    selectedIndex: {
      type: Number,
      required: true,
    },
  },
  emits: ["add-section", "select-section", "remove-section", "move-up", "move-down"],
  setup() {
    const sectionTypeLabel = (sec) => {
      if (sec.type === "code") return "Código";
      if (sec.type === "instruction") return "Instrucción";
      if (sec.type === "multiselect") return "Múltiple";
      return sec.layoutMode === "questionnaire" ? "Preguntas (Texto)" : "Preguntas (OMR)";
    };

    return {
      addOutline,
      chevronUpOutline,
      chevronDownOutline,
      sectionTypeLabel,
    };
  },
};
</script>

<style scoped>
.panel-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 10px 6px 12px 6px;
  margin-bottom: 10px;
}

.panel-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 6px 8px 6px;
}

.panel-card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 6px 8px 6px;
}

.section-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s;
  margin: 2px 0;
}

.section-list-item:hover {
  background: #f1f5f9;
}

.section-list-item--active {
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  border-left: 3px solid var(--ion-color-primary);
}

.section-list-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.section-list-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.section-list-meta {
  font-size: 11px;
  color: #64748b;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 3px;
}

.section-move-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  padding: 3px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-move-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #1e293b;
}

.section-move-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.section-delete-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 13px;
  padding: 3px 5px;
  border-radius: 4px;
  transition: background 0.1s;
}

.section-delete-btn:hover {
  background: #fee2e2;
}

.empty-sections-hint {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  padding: 16px 0;
}

@media (prefers-color-scheme: dark) {
  .panel-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
}

:global(body.dark) .panel-card,
:global(html.dark) .panel-card,
:global(.dark) .panel-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .panel-card-title,
:global(html.dark) .panel-card-title,
:global(.dark) .panel-card-title {
  color: #f7f7fd;
}

:global(body.dark) .section-list-item,
:global(html.dark) .section-list-item,
:global(.dark) .section-list-item {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .section-list-name,
:global(html.dark) .section-list-name,
:global(.dark) .section-list-name {
  color: #f7f7fd;
}

:global(body.dark) .section-list-meta,
:global(html.dark) .section-list-meta,
:global(.dark) .section-list-meta {
  color: #9e9bb8;
}

:global(body.dark) .section-list-item--active,
:global(html.dark) .section-list-item--active,
:global(.dark) .section-list-item--active {
  background: #2a2353;
  border-color: #7c6ef2;
}

:global(body.dark) .section-move-btn,
:global(html.dark) .section-move-btn,
:global(.dark) .section-move-btn {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .section-move-btn:hover:not(:disabled),
:global(html.dark) .section-move-btn:hover:not(:disabled),
:global(.dark) .section-move-btn:hover:not(:disabled) {
  background: #2e2858;
  color: #f7f7fd;
}
</style>
