<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="backUrl">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="saveCriteria">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Criterios de Actividad</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item v-if="error.estatus == 1">
          <ion-label :color="error.color">{{ error.data }}</ion-label>
        </ion-item>

        <ion-reorder-group :disabled="false" @ionItemReorder="handleReorder($event)">
          <div
            v-for="(criterion, index) in criteriaForms"
            :key="index"
            :id="
              criterion.id
                ? 'criterion-' + criterion.id
                : 'new-criterion-' + index
            "
          >
            <ion-item>
              <ion-label position="stacked">Descripción</ion-label>
              <ion-input v-model="criterion.description" type="text"></ion-input>
              <ion-reorder slot="end"></ion-reorder>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Puntuación</ion-label>
              <ion-input v-model="criterion.score" type="number"></ion-input>
            </ion-item>
            <ion-item>
              <ion-button
                expand="full"
                color="danger"
                @click="removeCriterion(index)"
              >
                Eliminar Criterio
              </ion-button>
            </ion-item>
          </div>
        </ion-reorder-group>

        <ion-item>
          <ion-button expand="full" @click="addCriterion">
            Añadir Criterio
          </ion-button>
        </ion-item>
        <ion-item>
          <ion-button expand="full" @click="openImportModal">
            Importar desde JSON
          </ion-button>
        </ion-item>
      </ion-list>
      <import-criteria-modal
        :is-open="isImportModalOpen"
        @close="closeImportModal"
        @import="handleImport"
      ></import-criteria-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { tokenHeader, usuarioGet } from "../globalService";
import ImportCriteriaModal from "../components/ImportCriteriaModal.vue";

import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonIcon,
  IonButton,
  IonButtons,
  alertController,
  IonReorderGroup,
  IonReorder,
} from "@ionic/vue";

import { arrowBackOutline, checkmarkOutline } from "ionicons/icons";

export default {
  components: {
    IonLabel,
    IonItem,
    IonList,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonIcon,
    IonButton,
    IonButtons,
    ImportCriteriaModal,
    IonReorderGroup,
    IonReorder,
  },
  setup() {
    const mroute = useRoute();
    const router = useRouter();
    const { activityId } = mroute.params;

    const criteriaForms = ref([]);
    const error = ref({
      estatus: 0,
      data: "",
      color: "",
    });
    const usuario = ref(null);
    const activityDetails = ref(null);
    const isImportModalOpen = ref(false);

    const backUrl = `/actividades/${activityId}`;

    const addCriterion = () => {
      criteriaForms.value.push({
        description: "Entregó el trabajo a tiempo",
        score: 10,
        activityId: parseInt(activityId, 10),
        instituteId: usuario.value.institute.id,
      });
    };

    const openImportModal = () => {
      isImportModalOpen.value = true;
    };

    const closeImportModal = () => {
      isImportModalOpen.value = false;
    };

    const handleImport = (importedCriteria) => {
      importedCriteria.forEach((criterion) => {
        criteriaForms.value.push({
          description: criterion.description,
          score: criterion.score,
          activityId: parseInt(activityId, 10),
          instituteId: usuario.value.institute.id,
        });
      });
    };

    const removeCriterion = async (index) => {
      const criterionToRemove = criteriaForms.value[index];

      if (criterionToRemove.id) {
        // If criterion has an ID, it exists in the backend, ask for confirmation
        const alert = await alertController.create({
          header: "Confirmar Eliminación",
          message:
            "¿Estás seguro de que quieres eliminar este criterio? Esta acción es irreversible.",
          buttons: [
            {
              text: "Cancelar",
              role: "cancel",
            },
            {
              text: "Eliminar",
              handler: async () => {
                try {
                  await axios.delete(
                    `/criteria/${criterionToRemove.id}`,
                    tokenHeader()
                  );
                  criteriaForms.value.splice(index, 1); // Remove from frontend array after successful backend deletion
                  localStorage.setItem(
                    "error",
                    "Criterio eliminado exitosamente."
                  );
                } catch (err) {
                  console.error("Error deleting criterion:", err);
                  error.value.estatus = 1;
                  error.value.data =
                    "Error al eliminar el criterio. Por favor, intente de nuevo.";
                  error.value.color = "danger";
                }
              },
            },
          ],
        });
        await alert.present();
      } else {
        // If criterion does not have an ID, it's a new unsaved criterion, just remove from frontend
        criteriaForms.value.splice(index, 1);
      }
    };

    const handleReorder = (event) => {
      const item = criteriaForms.value.splice(event.detail.from, 1)[0];
      criteriaForms.value.splice(event.detail.to, 0, item);
      event.detail.complete();
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();

      try {
        // Fetch activity details to get lesson info for backUrl
        const activityResponse = await axios.get(`/activities/${activityId}`);
        activityDetails.value = activityResponse.data;

        // Fetch existing criteria for this activity
        const criteriaResponse = await axios.get(
          `/criteria?activityId=${activityId}`
        );
        if (criteriaResponse.data.length > 0) {
          criteriaForms.value = criteriaResponse.data.sort(
            (a, b) => a.id - b.id
          );
        } else {
          // If no existing criteria, add one empty criterion by default
          addCriterion();
        }

        // Scroll to specific criterion if hash is present
        if (mroute.hash) {
          const targetId = mroute.hash.substring(1); // Remove '#' from hash
          setTimeout(() => {
            const element = document.getElementById(targetId);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 100); // Small delay to ensure rendering
        }
      } catch (err) {
        console.error("Error fetching activity or criteria:", err);
        error.value.estatus = 1;
        error.value.data = "Error al cargar la actividad o los criterios.";
        error.value.color = "danger";
      }
    });

    const saveCriteria = async () => {
      error.value.estatus = 0; // Reset error

      for (const criterion of criteriaForms.value) {
        if (!criterion.description || criterion.score === null) {
          error.value.estatus = 1;
          error.value.data =
            "Todos los campos de descripción y puntuación son obligatorios.";
          error.value.color = "danger";
          return; // Stop if validation fails
        }

        const payload = {
          description: criterion.description,
          score: parseInt(criterion.score, 10),
          activityId: parseInt(activityId, 10),
          instituteId: usuario.value.institute.id,
        };

        try {
          if (criterion.id) {
            // Update existing criterion
            await axios.patch(`/criteria/${criterion.id}`, payload, tokenHeader());
          } else {
            // Create new criterion
            await axios.post("/criteria", payload, tokenHeader());
          }
        } catch (err) {
          console.error("Error saving criteria:", err);
          error.value.estatus = 1;
          error.value.data =
            "Error al guardar los criterios. Por favor, intente de nuevo.";
          error.value.color = "danger";
          return; // Stop on first error
        }
      }

      router.push(`/actividades/${activityId}`);
      localStorage.setItem("error", "Criterios guardados exitosamente.");
    };

    return {
      criteriaForms,
      error,
      backUrl,
      addCriterion,
      removeCriterion,
      saveCriteria,
      arrowBackOutline,
      checkmarkOutline,
      isImportModalOpen,
      openImportModal,
      closeImportModal,
      handleImport,
      handleReorder,
    };
  },
};
</script>

<style scoped>
/* Add any specific styles for this page here */
</style>


