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
import * as XLSX from "xlsx-js-style";

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
      if (
        droppedFile &&
        droppedFile.type.match(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application/vnd.ms-excel"
        )
      ) {
        file.value = droppedFile;
        fileName.value = droppedFile.name;
      } else {
        alertController
          .create({
            header: "Error",
            message: "Por favor, sube un archivo Excel válido (.xlsx o .xls).",
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      }
    };

    const triggerFileInput = () => {
      fileInput.value.click();
    };

    const handleFileSelect = (event) => {
      const selectedFile = event.target.files[0];
      if (
        selectedFile &&
        selectedFile.type.match(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application/vnd.ms-excel"
        )
      ) {
        file.value = selectedFile;
        fileName.value = selectedFile.name;
      } else {
        alertController
          .create({
            header: "Error",
            message: "Por favor, sube un archivo Excel válido (.xlsx o .xls).",
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      }
    };

    const processFile = async () => {
      if (!file.value) return;

      const fileReaderArrayBuffer = new FileReader();
      const fileReaderText = new FileReader();

      const processAsExcel = (arrayBuffer) => {
        try {
          const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          return json;
        } catch (excelError) {
          console.error("Error processing as Excel:", excelError);
          return null;
        }
      };

      const processAsHtml = (htmlString) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlString, "text/html");
          const table = doc.querySelector("table");

          if (!table) {
            return null; // No table found in HTML
          }

          let headers = [];
          let dataRows = Array.from(table.querySelectorAll("tr"));

          // Try to find headers in the first few rows
          for (let i = 0; i < Math.min(dataRows.length, 3); i++) { // Check first 3 rows for headers
            const potentialHeaders = Array.from(dataRows[i].querySelectorAll("th, td")).map(cell => cell.textContent.trim());
            if (potentialHeaders.some(h => h.length > 0)) { // If any cell in this row has content, assume it's a header row
              headers = potentialHeaders;
              dataRows = dataRows.slice(i + 1); // Data starts after this row
              break;
            }
          }

          if (headers.length === 0) {
            // Fallback if no clear headers found, assume first row is data or try to infer
            // For now, if no headers, we can't reliably parse, so return null
            return null;
          }

          const jsonData = [];
          dataRows.forEach((row) => {
            const cells = Array.from(row.querySelectorAll("td"));
            if (cells.length > 0) { // Only process rows with actual data cells
              const rowData = {};
              headers.forEach((header, index) => {
                rowData[header] = cells[index] ? cells[index].textContent.trim() : "";
              });
              jsonData.push(rowData);
            }
          });
          return jsonData;
        } catch (htmlError) {
          console.error("Error processing as HTML:", htmlError);
          return null;
        }
      };

      fileReaderArrayBuffer.onload = async (eArrayBuffer) => {
        const arrayBuffer = eArrayBuffer.target.result;

        // Read as text to detect HTML
        fileReaderText.onload = async (eText) => {
          const textContent = eText.target.result;
          let jsonData = null;

          // Check if it's an HTML table
          if (textContent.toLowerCase().includes("<table")) {
            jsonData = processAsHtml(textContent);
            if (jsonData && jsonData.length > 0) {
              emit("fileUploaded", jsonData);
              onClose();
              return;
            }
          }

          // If not HTML or HTML parsing failed, try as Excel
          jsonData = processAsExcel(arrayBuffer);

          if (jsonData && jsonData.length > 0) {
            emit("fileUploaded", jsonData);
            onClose();
          } else {
            alertController
              .create({
                header: "Error",
                message:
                  "No se pudo procesar el archivo. Asegúrate de que sea un archivo Excel válido o una tabla HTML con datos.",
                buttons: ["OK"],
              })
              .then((alert) => alert.present());
          }
        };
        fileReaderText.onerror = (error) => {
          console.error("FileReaderText error:", error);
          alertController.create({
            header: "Error de lectura",
            message: "No se pudo leer el archivo como texto.",
            buttons: ["OK"],
          }).then(alert => alert.present());
        };
        fileReaderText.readAsText(file.value);
      };

      fileReaderArrayBuffer.onerror = (error) => {
        console.error("FileReaderArrayBuffer error:", error);
        alertController.create({
          header: "Error de lectura",
          message: "No se pudo leer el archivo como binario.",
          buttons: ["OK"],
        }).then(alert => alert.present());
      };
      fileReaderArrayBuffer.readAsArrayBuffer(file.value);
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
