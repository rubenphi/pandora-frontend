<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Plantillas de Encuestas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-button expand="block" color="primary" @click="openCreateModal" class="ion-margin-bottom">
        <ion-icon :icon="addOutline" slot="start"></ion-icon>
        Nueva plantilla
      </ion-button>

      <div v-if="loading" class="ion-text-center ion-padding">
        <p>Cargando plantillas...</p>
      </div>

      <div v-else-if="templates.length === 0" class="ion-text-center ion-padding">
        <p>No hay plantillas de encuesta. Cree una nueva.</p>
      </div>

      <ion-card v-for="tpl in templates" :key="tpl.id" class="template-card">
        <ion-card-header>
          <ion-card-title>{{ tpl.name }}</ion-card-title>
          <ion-card-subtitle>
            Slug: <code>{{ tpl.slug }}</code> &middot; v{{ tpl.version }}
            <ion-badge :color="tpl.active ? 'success' : 'medium'">
              {{ tpl.active ? 'Activo' : 'Inactivo' }}
            </ion-badge>
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <p class="ion-text-small">Secciones: {{ sectionCount(tpl.questionsConfig) }}</p>
          <ion-button fill="outline" color="primary" size="small" @click="openEditModal(tpl)">
            <ion-icon :icon="createOutline" slot="start"></ion-icon>
            Editar
          </ion-button>
          <ion-button fill="outline" color="danger" size="small" class="ion-margin-start" @click="confirmDelete(tpl)">
            <ion-icon :icon="trashOutline" slot="start"></ion-icon>
            Eliminar
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>

    <ion-modal :is-open="showModal" @did-dismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editingTemplate ? 'Editar plantilla' : 'Nueva plantilla' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input v-model="form.name" placeholder="Ej: Encuesta a Padres"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Slug (identificador único)</ion-label>
            <ion-input v-model="form.slug" placeholder="Ej: parent-survey"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Activo</ion-label>
            <ion-toggle v-model="form.active" slot="end"></ion-toggle>
          </ion-item>
        </ion-list>

        <ion-item lines="none" class="ion-margin-top">
          <ion-label class="section-title">
            <strong>Configuración de preguntas (JSON)</strong>
          </ion-label>
        </ion-item>
        <p class="ion-padding-start ion-text-small ion-margin-bottom">
          Define la estructura de secciones, tipos de pregunta y opciones.
        </p>
        <ion-textarea
          v-model="form.questionsConfigRaw"
          :auto-grow="true"
          rows="12"
          class="json-editor"
          placeholder='{"sections": [...]}'
        ></ion-textarea>

        <ion-button expand="block" color="primary" @click="saveTemplate" :disabled="!form.name || !form.slug" class="ion-margin-top">
          <ion-icon :icon="saveOutline" slot="start"></ion-icon>
          {{ editingTemplate ? 'Actualizar' : 'Crear' }}
        </ion-button>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel,
  IonInput, IonToggle, IonTextarea, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonBadge,
  alertController, IonModal,
} from "@ionic/vue";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { tokenHeader } from "../globalService";
import {
  arrowBackOutline, addOutline, createOutline, trashOutline,
  closeOutline, saveOutline,
} from "ionicons/icons";

export default {
  name: "SurveyTemplateManager",
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel,
    IonInput, IonToggle, IonTextarea, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonBadge,
    IonModal,
  },
  setup() {
    const router = useRouter();
    const templates = ref([]);
    const loading = ref(true);
    const showModal = ref(false);
    const editingTemplate = ref(null);

    const form = ref({
      name: "",
      slug: "",
      active: true,
      questionsConfigRaw: JSON.stringify({
        sections: [
          {
            id: "seccion1",
            title: "Sección 1",
            type: "likert",
            options: ["Nunca", "Algunas veces", "Casi siempre", "Siempre"],
            count: 5,
          },
        ],
      }, null, 2),
    });

    const goBack = () => router.back();

    const fetchTemplates = async () => {
      loading.value = true;
      try {
        tokenHeader();
        const res = await axios.get("/surveys/templates");
        templates.value = res.data || [];
      } catch {
        templates.value = [];
      } finally {
        loading.value = false;
      }
    };

    const sectionCount = (config) => {
      if (!config || !config.sections) return 0;
      return config.sections.length;
    };

    const openCreateModal = () => {
      editingTemplate.value = null;
      form.value = {
        name: "",
        slug: "",
        active: true,
        questionsConfigRaw: JSON.stringify({
          sections: [
            {
              id: "seccion1",
              title: "Sección 1",
              type: "likert",
              options: ["Nunca", "Algunas veces", "Casi siempre", "Siempre"],
              count: 5,
            },
          ],
        }, null, 2),
      };
      showModal.value = true;
    };

    const openEditModal = (tpl) => {
      editingTemplate.value = tpl;
      form.value = {
        name: tpl.name,
        slug: tpl.slug,
        active: tpl.active,
        questionsConfigRaw: JSON.stringify(tpl.questionsConfig, null, 2),
      };
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
      editingTemplate.value = null;
    };

    const saveTemplate = async () => {
      let questionsConfig;
      try {
        questionsConfig = JSON.parse(form.value.questionsConfigRaw);
      } catch {
        const alert = await alertController.create({
          header: "Error",
          message: "El JSON de configuración no es válido. Revise la sintaxis.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      const payload = {
        name: form.value.name,
        slug: form.value.slug,
        questionsConfig,
      };
      if (editingTemplate.value) {
        payload.active = form.value.active;
      }

      try {
        tokenHeader();
        if (editingTemplate.value) {
          await axios.patch(`/surveys/templates/${editingTemplate.value.id}`, payload);
        } else {
          await axios.post("/surveys/templates", payload);
        }
        closeModal();
        await fetchTemplates();
      } catch (error) {
        let msg = "Error al guardar la plantilla.";
        if (error.response?.status === 409) {
          msg = "Ya existe una plantilla con ese slug.";
        } else if (error.response?.data?.message) {
          msg = error.response.data.message;
        }
        const alert = await alertController.create({
          header: "Error",
          message: msg,
          buttons: ["OK"],
        });
        await alert.present();
      }
    };

    const confirmDelete = async (tpl) => {
      const alert = await alertController.create({
        header: "Eliminar plantilla",
        message: `¿Está seguro de eliminar "${tpl.name}"? Las respuestas asociadas también se eliminarán.`,
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Eliminar",
            role: "destructive",
            handler: async () => {
              try {
                tokenHeader();
                await axios.delete(`/surveys/templates/${tpl.id}`);
                await fetchTemplates();
              } catch {
                const errAlert = await alertController.create({
                  header: "Error",
                  message: "No se pudo eliminar la plantilla.",
                  buttons: ["OK"],
                });
                await errAlert.present();
              }
            },
          },
        ],
      });
      await alert.present();
    };

    onMounted(() => {
      fetchTemplates();
    });

    return {
      templates, loading, showModal, editingTemplate, form,
      goBack, fetchTemplates, sectionCount,
      openCreateModal, openEditModal, closeModal, saveTemplate, confirmDelete,
      arrowBackOutline, addOutline, createOutline, trashOutline,
      closeOutline, saveOutline,
    };
  },
};
</script>

<style scoped>
.json-editor {
  font-family: monospace;
  font-size: 0.85em;
  background: var(--ion-color-light);
  border-radius: 4px;
  --padding-start: 8px;
  --padding-end: 8px;
}
.template-card {
  margin-bottom: 12px;
}
.section-title {
  font-size: 1.1em;
}
</style>
