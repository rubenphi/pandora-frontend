<template>
  <ion-modal :is-open="isOpen" @didDismiss="onClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Subir Planilla de Plataforma</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onClose">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div
        class="upload-area"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
        :class="{ 'drag-over': isDragOver }"
      >
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          accept=".xlsx, .xls"
          @change="handleFileSelect"
        />
        <ion-icon :icon="cloudUploadOutline" class="upload-icon"></ion-icon>
        <p>Arrastra tu archivo Excel aquí o haz clic para seleccionarlo</p>
        <p v-if="fileName">Archivo seleccionado: {{ fileName }}</p>
      </div>
      <ion-button expand="block" :disabled="!file" @click="processFile">
        Procesar Planilla
      </ion-button>
    </ion-content>
  </ion-modal>
</template>

<script>
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  alertController,
} from "@ionic/vue";
import { ref } from "vue";
import { cloudUploadOutline } from "ionicons/icons";
import * as XLSX from "xlsx";

export default {
  name: "ExcelUploadModal",
  emits: ["close", "fileUploaded"],
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },
  components: {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
  },
  setup(props, { emit }) {
    const isDragOver = ref(false);
    const fileInput = ref(null);
    const file = ref(null);
    const fileName = ref("");

    const onClose = () => {
      file.value = null;
      fileName.value = "";
      emit("close");
    };

    const handleDragOver = () => {
      isDragOver.value = true;
    };

    const handleDragLeave = () => {
      isDragOver.value = false;
    };

    const handleDrop = (event) => {
      isDragOver.value = false;
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile && droppedFile.type.match("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application/vnd.ms-excel")) {
        file.value = droppedFile;
        fileName.value = droppedFile.name;
      } else {
        alertController.create({
          header: "Error",
          message: "Por favor, sube un archivo Excel válido (.xlsx o .xls).",
          buttons: ["OK"],
        }).then(alert => alert.present());
      }
    };

    const triggerFileInput = () => {
      fileInput.value.click();
    };

    const handleFileSelect = (event) => {
      const selectedFile = event.target.files[0];
      if (selectedFile && selectedFile.type.match("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application/vnd.ms-excel")) {
        file.value = selectedFile;
        fileName.value = selectedFile.name;
      } else {
        alertController.create({
          header: "Error",
          message: "Por favor, sube un archivo Excel válido (.xlsx o .xls).",
          buttons: ["OK"],
        }).then(alert => alert.present());
      }
    };

    const processFile = async () => {
      if (!file.value) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);

          // Emit the processed JSON data
          emit("fileUploaded", json);
          onClose();
        } catch (error) {
          console.error("Error processing Excel file:", error);
          alertController.create({
            header: "Error",
            message: "No se pudo procesar el archivo Excel. Asegúrate de que sea un formato válido.",
            buttons: ["OK"],
          }).then(alert => alert.present());
        }
      };
      reader.readAsArrayBuffer(file.value);
    };

    return {
      isDragOver,
      fileInput,
      file,
      fileName,
      onClose,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      triggerFileInput,
      handleFileSelect,
      processFile,
      cloudUploadOutline,
    };
  },
};
</script>

<style scoped>
.upload-area {
  border: 2px dashed var(--ion-color-medium);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  background-color: var(--ion-color-light);
}

.upload-area.drag-over {
  border-color: var(--ion-color-primary);
  background-color: var(--ion-color-primary-tint);
}

.upload-icon {
  font-size: 4em;
  color: var(--ion-color-medium);
}

.upload-area.drag-over .upload-icon {
  color: var(--ion-color-primary);
}

.upload-area p {
  color: var(--ion-color-dark);
  margin-top: 10px;
}
</style>
