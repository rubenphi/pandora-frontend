<template>
  <div class="evidence-container">
    <!-- File Input for document/file picker -->
    <input
      v-if="!readOnly"
      type="file"
      ref="fileInput"
      multiple
      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
      @change="onFileChange"
      style="display: none"
    />

    <!-- Camera Input for taking photos -->
    <input
      v-if="!readOnly"
      type="file"
      ref="cameraInput"
      accept="image/*"
      capture="environment"
      @change="onCameraPhotoCaptured"
      style="display: none"
    />

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state ion-padding-vertical">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
      <ion-label color="medium" class="loading-label">
        Procesando y convirtiendo archivos a PDF...
      </ion-label>
    </div>

    <!-- Existing evidence state -->
    <div v-else-if="evidence && evidence.pdfUrl" class="evidence-actions">
      <ion-chip color="success">
        <ion-icon :icon="documentTextOutline"></ion-icon>
        <ion-label>Evidencia PDF registrada</ion-label>
      </ion-chip>
      <div class="button-group">
        <ion-button size="small" fill="outline" color="primary" @click="viewEvidence">
          <ion-icon slot="start" :icon="eyeOutline"></ion-icon>
          Ver Evidencia
        </ion-button>
        <ion-button
          v-if="!readOnly"
          size="small"
          fill="outline"
          color="warning"
          @click="presentUploadOptions"
        >
          <ion-icon slot="start" :icon="cloudUploadOutline"></ion-icon>
          Reemplazar
        </ion-button>
        <ion-button
          v-if="!readOnly"
          size="small"
          fill="outline"
          color="danger"
          @click="confirmDelete"
        >
          <ion-icon slot="start" :icon="trashOutline"></ion-icon>
          Eliminar
        </ion-button>
      </div>
    </div>

    <!-- Empty state (No evidence yet) -->
    <div v-else-if="!readOnly" class="upload-state">
      <ion-button size="small" color="tertiary" @click="presentUploadOptions">
        <ion-icon slot="start" :icon="cloudUploadOutline"></ion-icon>
        Subir evidencia
      </ion-button>
    </div>
    <div v-else class="empty-readonly-state">
      <ion-note color="medium" class="no-evidence-note">Sin archivo anexo</ion-note>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import { basedeURL, tokenHeader, usuarioGet } from "../globalService";
import {
  IonButton,
  IonSpinner,
  IonLabel,
  IonChip,
  IonIcon,
  IonNote,
  alertController,
  actionSheetController,
} from "@ionic/vue";
import {
  cloudUploadOutline,
  documentTextOutline,
  documentAttachOutline,
  cameraOutline,
  closeOutline,
  eyeOutline,
  trashOutline,
} from "ionicons/icons";

export default {
  name: "EvidenceUploader",
  components: {
    IonButton,
    IonSpinner,
    IonLabel,
    IonChip,
    IonIcon,
    IonNote,
  },
  props: {
    studentId: {
      type: [Number, String],
      required: true,
    },
    activityId: {
      type: [Number, String],
      required: true,
    },
    instituteId: {
      type: [Number, String],
      default: null,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["evidence-changed"],
  setup(props, { emit }) {
    const fileInput = ref(null);
    const cameraInput = ref(null);
    const isLoading = ref(false);
    const evidence = ref(null);
    const capturedPhotos = ref([]);

    const getBaseUrl = () => {
      let url = basedeURL() || "";
      if (url && !url.endsWith("/")) {
        url += "/";
      }
      return url;
    };

    const fetchEvidence = async () => {
      if (!props.studentId || !props.activityId) return;
      tokenHeader();
      try {
        const response = await axios.get(
          `/activity-evidences/activity/${props.activityId}/student/${props.studentId}`
        );
        if (response.data && response.data.pdfUrl) {
          evidence.value = response.data;
        } else {
          evidence.value = null;
        }
      } catch (error) {
        console.error("Error fetching activity evidence:", error);
        evidence.value = null;
      } finally {
        emit("evidence-changed", {
          studentId: props.studentId,
          evidence: evidence.value,
        });
      }
    };

    onMounted(() => {
      fetchEvidence();
    });

    watch(
      () => [props.studentId, props.activityId],
      () => {
        fetchEvidence();
      }
    );

    const presentUploadOptions = async () => {
      capturedPhotos.value = [];
      const actionSheet = await actionSheetController.create({
        header: "Opción de Evidencia",
        buttons: [
          {
            text: "Seleccionar archivo(s) del dispositivo",
            icon: documentAttachOutline,
            handler: () => {
              triggerFileInput();
            },
          },
          {
            text: "Tomar fotos con la cámara",
            icon: cameraOutline,
            handler: () => {
              triggerCameraInput();
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
            icon: closeOutline,
          },
        ],
      });
      await actionSheet.present();
    };

    const triggerFileInput = () => {
      if (fileInput.value) {
        fileInput.value.value = null;
        fileInput.value.click();
      }
    };

    const triggerCameraInput = () => {
      if (cameraInput.value) {
        cameraInput.value.value = null;
        cameraInput.value.click();
      }
    };

    const onFileChange = async (event) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;
      await uploadFilesList(Array.from(selectedFiles));
    };

    const onCameraPhotoCaptured = async (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const photoFile = files[0];
      capturedPhotos.value.push(photoFile);
      const count = capturedPhotos.value.length;

      const alert = await alertController.create({
        header: "Foto Capturada",
        message: `Foto #${count} agregada al paquete.\n¿Deseas tomar otra foto o finalizar y subir el paquete de ${count} foto(s)?`,
        buttons: [
          {
            text: "📷 Tomar otra foto",
            handler: () => {
              setTimeout(() => {
                triggerCameraInput();
              }, 300);
            },
          },
          {
            text: `✅ Subir paquete (${count} foto${count > 1 ? "s" : ""})`,
            handler: async () => {
              await uploadPhotoBatch();
            },
          },
          {
            text: "❌ Cancelar paquete",
            role: "cancel",
            handler: () => {
              capturedPhotos.value = [];
            },
          },
        ],
      });
      await alert.present();
    };

    const uploadPhotoBatch = async () => {
      if (capturedPhotos.value.length === 0) return;
      await uploadFilesList(capturedPhotos.value);
      capturedPhotos.value = [];
    };

    const uploadFilesList = async (filesArray) => {
      if (!filesArray || filesArray.length === 0) return;

      isLoading.value = true;
      tokenHeader();

      const formData = new FormData();
      formData.append("studentId", props.studentId);
      formData.append("activityId", props.activityId);

      const resolvedInstituteId =
        props.instituteId || usuarioGet()?.institute?.id || 1;
      formData.append("instituteId", resolvedInstituteId);

      for (let i = 0; i < filesArray.length; i++) {
        formData.append("files", filesArray[i]);
      }

      try {
        const response = await axios.post("/activity-evidences/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        evidence.value = response.data.evidence;
        emit("evidence-changed", {
          studentId: props.studentId,
          evidence: response.data.evidence,
        });
      } catch (error) {
        console.error("Error uploading evidence:", error);
        const alert = await alertController.create({
          header: "Error de Subida",
          message:
            error.response?.data?.message ||
            "Ocurrió un error al procesar y convertir la evidencia.",
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        isLoading.value = false;
      }
    };

    const viewEvidence = () => {
      if (!evidence.value || !evidence.value.pdfUrl) return;
      const fullUrl = getBaseUrl() + evidence.value.pdfUrl;
      window.open(fullUrl, "_blank");
    };

    const confirmDelete = async () => {
      const alert = await alertController.create({
        header: "Confirmar Eliminación",
        message: "¿Estás seguro de que deseas eliminar la evidencia en PDF de este estudiante?",
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Eliminar",
            role: "destructive",
            handler: async () => {
              await deleteEvidence();
            },
          },
        ],
      });
      await alert.present();
    };

    const deleteEvidence = async () => {
      if (!evidence.value || !evidence.value.id) return;
      isLoading.value = true;
      tokenHeader();
      try {
        await axios.delete(`/activity-evidences/${evidence.value.id}`);
        evidence.value = null;
        emit("evidence-changed", {
          studentId: props.studentId,
          evidence: null,
        });
      } catch (error) {
        console.error("Error deleting evidence:", error);
      } finally {
        isLoading.value = false;
      }
    };

    return {
      fileInput,
      cameraInput,
      isLoading,
      evidence,
      cloudUploadOutline,
      documentTextOutline,
      eyeOutline,
      trashOutline,
      presentUploadOptions,
      onFileChange,
      onCameraPhotoCaptured,
      viewEvidence,
      confirmDelete,
    };
  },
};
</script>

<style scoped>
.evidence-container {
  margin-top: 8px;
  margin-bottom: 8px;
}
.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
}
.loading-label {
  font-size: 0.88rem;
}
.evidence-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.button-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.upload-state {
  display: flex;
  align-items: center;
}
.empty-readonly-state {
  display: flex;
  align-items: center;
  padding: 4px 0;
}
.no-evidence-note {
  font-size: 0.85rem;
  font-style: italic;
}
</style>
