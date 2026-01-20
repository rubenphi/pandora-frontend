<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons v-if="materialId" slot="end">
          <ion-button @click="deleteMaterial()">
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Título</ion-label>
          <ion-input
            v-model="materialForm.title"
            type="text"
            required
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label>Tipo de Material</ion-label>

          <ion-select
            @ionChange="handleTypeChange($event.detail.value)"
            interfaceOptions="{ cssClass: 'my-custom-interface' }"
            placeholder="Selecciona un tipo de material"
            :value="materialForm.type"
          >
            >
            <ion-select-option value="VIDEO">Video</ion-select-option>
            <ion-select-option value="PDF">PDF</ion-select-option>
            <ion-select-option value="IMAGE">Imagen</ion-select-option>
            <ion-select-option value="AUDIO">Audio</ion-select-option>
            <ion-select-option value="DOC">Documento</ion-select-option>
            <ion-select-option value="TEXT_RICH">Texto Largo</ion-select-option>
            <ion-select-option value="TEXT_SHORT"
              >Texto Corto</ion-select-option
            >
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked"
            >Contenido o descripción del archivo</ion-label
          >
        </ion-item>
        <ion-item class="ion-no-padding" lines="none" v-if="editor">
          <ion-button
            class="margen"
            color="light"
            slot="start"
            @click="editor.chain().focus().toggleBold().run()"
            :class="{ 'is-active': editor.isActive('bold') }"
          >
            <b> B </b>
          </ion-button>
          <ion-button
            class="margen"
            slot="start"
            color="light"
            @click="editor.chain().focus().toggleItalic().run()"
            :class="{ 'is-active': editor.isActive('italic') }"
          >
            <i> I </i>
          </ion-button>
          <ion-button
            class="margen"
            slot="start"
            color="light"
            @click="editor.chain().focus().toggleStrike().run()"
            :class="{ 'is-active': editor.isActive('strike') }"
          >
            <s> T </s>
          </ion-button>
          <ion-button
            class="margen"
            slot="start"
            color="light"
            @click="editor.chain().focus().toggleUnderline().run()"
            :class="{ 'is-active': editor.isActive('underline') }"
          >
            <u> S </u>
          </ion-button>
        </ion-item>
        <editor-content class="editor-content" :editor="editor" />

        <ion-item v-if="!isTextType">
          <ion-label position="stacked">Archivo</ion-label>

          <!-- Botón visible -->
          <ion-button @click="triggerFileInput" expand="block" color="primary">
            <ion-icon slot="start" name="cloud-upload-outline"></ion-icon>
            Seleccionar archivo
          </ion-button>

          <!-- Input oculto -->
          <input
            type="file"
            ref="hiddenFileInput"
            @change="handleFileUpload"
            style="display: none"
          />
        </ion-item>

        <ion-item
          v-if="uploadedFileUrl && !isTextType"
          :key="materialForm.type + uploadedFileUrl"
        >
          <ion-label position="stacked">Vista Previa</ion-label>
          <div class="preview-container">
            <img
              v-if="materialForm.type === 'IMAGE'"
              :src="previewSource"
              class="preview-image"
            />
            <video
              v-else-if="materialForm.type === 'VIDEO'"
              :src="previewSource"
              controls
              class="preview-video"
            ></video>
            <audio
              v-else-if="materialForm.type === 'AUDIO'"
              :src="previewSource"
              controls
              class="preview-audio"
            ></audio>
            <iframe
              v-else-if="materialForm.type === 'PDF'"
              :src="previewSource"
              class="preview-iframe"
            ></iframe>
            <a
              v-else-if="materialForm.type === 'DOC'"
              :href="previewSource"
              target="_blank"
              class="preview-link"
              >Ver Documento</a
            >
            <ion-text v-else
              >No hay vista previa disponible para este tipo de
              archivo.</ion-text
            >
          </div>
        </ion-item>
      </ion-list>
      <div class="ion-padding">
        <ion-button expand="block" @click="saveMaterial"
          >Guardar Material</ion-button
        >
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed } from "vue";
import axios from "axios";
import { useRouter, useRoute } from "vue-router";
import {
  onIonViewWillEnter,
  onIonViewDidLeave,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonIcon,
  IonSelect,
  IonSelectOption,
  alertController,
  IonText,
} from "@ionic/vue";
import { basedeURL, tokenHeader, usuarioGet } from "../globalService";
import { arrowBackOutline, trashOutline } from "ionicons/icons";
import { Editor, EditorContent } from "@tiptap/vue-3";

import StarterKit from "@tiptap/starter-kit";

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonButtons,
    IonIcon,
    IonSelect,
    IonSelectOption,

    EditorContent,
    IonText,
  },
  setup() {
    const urlBackend = basedeURL();
    const router = useRouter();
    const mroute = useRoute();
    const lessonId = parseInt(mroute.params.lessonId, 10);
    let materialId = mroute.params.id ? parseInt(mroute.params.id, 10) : null;

    const uploadedFileUrl = ref(null); // Moved declaration
    const originalFileUrl = ref(null); // Moved declaration
    const materialSaved = ref(false); // Moved declaration

    const materialForm = ref({
      id: materialId,
      title: "",
      type: "PDF",
      content: "",
      url: "",
      lessonId: lessonId,
      instituteId: null,
    });

    // Check for copied material data from sessionStorage
    const copiedMaterialString = sessionStorage.getItem("copiedMaterial");
    if (copiedMaterialString) {
      const copiedMaterial = JSON.parse(copiedMaterialString);
      materialForm.value.title = copiedMaterial.title;
      materialForm.value.type = copiedMaterial.type || "PDF"; // Default to PDF if type is not provided
      materialForm.value.content = copiedMaterial.content || "";
      materialForm.value.url = copiedMaterial.url || "";
      materialForm.value.id = null; // Ensure it's a new material
      materialId = null; // Ensure materialId is null for new creation
      uploadedFileUrl.value = copiedMaterial.url || null; // Set for preview
      sessionStorage.removeItem("copiedMaterial"); // Clear from sessionStorage
    }
    const usuario = ref(null);
    const lessonDetails = ref(null);
    const editor = ref(null);

    const previewSource = computed(() => {
      return uploadedFileUrl.value ? urlBackend + uploadedFileUrl.value : null;
    });

    const backUrl = ref("");

    const pageTitle = computed(() => {
      return materialId ? "Editar Material" : "Crear Material";
    });

    const isTextType = computed(() => {
      return (
        materialForm.value.type === "TEXT_RICH" ||
        materialForm.value.type === "TEXT_SHORT"
      );
    });

    const handleTypeChange = (newType) => {
      // Solo limpiar si realmente cambió el tipo
      if (materialForm.value.type !== newType) {
        uploadedFileUrl.value = null;
        materialForm.value.url = null;

        // Limpiar el input file
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          fileInput.value = "";
        }
      }

      materialForm.value.type = newType;
    };

    const hiddenFileInput = ref(null);

    const triggerFileInput = () => {
      hiddenFileInput.value?.click();
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      materialForm.value.instituteId = usuario.value.institute.id;

      try {
        const response = await axios.get(`/lessons/${lessonId}`, tokenHeader());
        lessonDetails.value = response.data;

        const { course, area, period, year } = lessonDetails.value;
        backUrl.value = `/lecciones/${course.id}/${area.id}/${period.id}/${year}`;

        if (materialId) {
          const materialResponse = await axios.get(
            `/materials/${materialId}`,
            tokenHeader()
          );

          const { title, type, content, url } = materialResponse.data;

          materialForm.value.title = title;
          materialForm.value.type = type;
          materialForm.value.content = content;
          materialForm.value.url = url;

          uploadedFileUrl.value = url;

          // Set uploadedFileUrl for existing material
          originalFileUrl.value = url; // Store original file URL
        }
      } catch (error) {
        console.error("Error fetching lesson or material details:", error);
      }

      editor.value = new Editor({
        extensions: [StarterKit],
        autofocus: "start",
        editable: true,
        content: materialForm.value.content,
        editorProps: {
          attributes: {
            class: "tiptap-editor-area",
          },
        },
      });
    });

    onIonViewDidLeave(async () => {
      if (editor.value) {
        editor.value.destroy();
      }
    });

    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Guardar referencia al archivo anterior para eliminarlo después
      const previousFileUrl = uploadedFileUrl.value;

      uploadedFileUrl.value = null; // Clear previous preview

      const materialType = materialForm.value.type;
      const fileExtension = file.name.split(".").pop().toLowerCase();

      const allowedExtensions = {
        PDF: ["pdf"],
        IMAGE: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"],
        VIDEO: ["mp4", "webm", "ogg", "mov", "avi", "mkv"],
        AUDIO: ["mp3", "wav", "ogg", "aac", "flac"],
        DOC: ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf"],
      };

      const currentAllowed = allowedExtensions[materialType];

      if (currentAllowed && !currentAllowed.includes(fileExtension)) {
        //cuando se presiona ok se debe refrescar la página

        const alert = await alertController.create({
          header: "Error de archivo",
          message: `Para el tipo de material "${materialType}", solo se permiten archivos con las siguientes extensiones: ${currentAllowed.join(
            ", "
          )}.`,
          buttons: ["OK"],
          backdropDismiss: false,
          cssClass: "my-custom-alert",
        });

        await alert.present();

        // Espera a que el usuario cierre la alerta y luego recarga la página
        await alert.onDidDismiss();
        location.reload();

        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          "/files/upload",
          formData,
          tokenHeader()
        );

        const newFileUrl = response.data.url;
        uploadedFileUrl.value = newFileUrl;

        // Eliminar el archivo anterior si existe y es diferente al nuevo archivo
        // Y también diferente al archivo original (para no eliminar el archivo original antes de guardar)
        if (
          previousFileUrl &&
          previousFileUrl !== newFileUrl &&
          previousFileUrl !== originalFileUrl.value
        ) {
          try {
            const filename = previousFileUrl.split("/").pop();
            await axios.delete(`/files/uploads/${filename}`, tokenHeader());
            console.log(`Archivo temporal anterior eliminado: ${filename}`);
          } catch (error) {
            console.error(
              `Error eliminando archivo temporal anterior: ${previousFileUrl}`,
              error
            );
          }
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    };

    const saveMaterial = async () => {
      if (!materialForm.value.title) {
        const alert = await alertController.create({
          header: "Error",
          message: "El título es obligatorio.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      materialForm.value.content = editor.value.getHTML();

      // If it's not a text type and a file was uploaded, set the URL
      if (!isTextType.value && uploadedFileUrl.value) {
        materialForm.value.url = uploadedFileUrl.value;
      }

      // Prepare data as JSON
      const materialData = {
        title: materialForm.value.title,
        type: materialForm.value.type,
        lessonId: Number(materialForm.value.lessonId),
        instituteId: Number(materialForm.value.instituteId),
        exist: true,
        content: materialForm.value.content,
        url: materialForm.value.url, // This will be null for text types or if no file uploaded
      };

      try {
        if (materialId) {
          await axios.patch(
            `/materials/${materialId}`,
            materialData,
            tokenHeader()
          );
        } else {
          await axios.post("/materials", materialData, tokenHeader());
        }

        materialSaved.value = true; // Mark as saved
        router.push(backUrl.value);
      } catch (error) {
        console.error("Error saving material:", error);
      }
    };

    const deleteMaterial = async () => {
      const alert = await alertController.create({
        header: "¿Estás seguro?",
        message: "Esta acción eliminará el material permanentemente.",
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Eliminar",
            handler: async () => {
              try {
                await axios.delete(`/materials/${materialId}`, tokenHeader());
                router.push(backUrl.value);
              } catch (error) {
                console.error("Error deleting material:", error);
                const errorAlert = await alertController.create({
                  header: "Error",
                  message: "No se pudo eliminar el material.",
                  buttons: ["OK"],
                });
                await errorAlert.present();
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const goBack = () => {
      if (backUrl.value) {
        router.push(backUrl.value);
      } else {
        router.back();
      }
    };

    return {
      triggerFileInput,
      hiddenFileInput,
      handleTypeChange,
      materialForm,
      urlBackend,
      saveMaterial,
      handleFileUpload,
      isTextType,
      backUrl,
      arrowBackOutline,
      pageTitle,
      editor,
      goBack,
      uploadedFileUrl, // Make uploadedFileUrl available in the template
      previewSource,
      materialId, // Make materialId available in the template for v-if
      deleteMaterial,
      trashOutline,
    };
  },
};
</script>
<style>
.ProseMirror {
  outline: none !important;
  height: 100%; /* Ensure ProseMirror itself takes full height */
}

.ProseMirror :focus {
  outline: none !important; /* Remove focus outline */
}
.ProseMirror p {
  margin: 0; /* Remove default paragraph margins */
}

.margen {
  font-family: serif;
  margin-left: 0px;
  margin-right: 3px;
  font-size: 12pt;
}

.editor-content {
  min-height: 10vh; /* 25% de la altura del viewport */
  border: 1px solid var(--ion-color-step-150, #d7d8da); /* Borde para visualizar la altura */
  border-radius: 4px;
  padding: 8px;
  box-sizing: border-box; /* Incluye padding y borde en el cálculo de la altura */
  margin: 16px;
  display: flex; /* Make it a flex container */
  flex-direction: column; /* Stack children vertically */
  overflow: hidden; /* Hide overflow to prevent scrollbars on the container */
}

.tiptap-editor-area {
  flex-grow: 1; /* Allow the editor content to grow and fill available space */
  min-height: 100%; /* Ensure it takes at least 100% of the flex container's height */
  outline: none !important; /* Remove the outline on focus */
  text-align: left; /* Ensure text aligns to the left */
  overflow-y: auto; /* Add scrollbar if content overflows vertically */
}

.preview-container {
  margin-top: 16px;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 150px; /* Adjust as needed */
  background-color: #f9f9f9;
}

.preview-image,
.preview-video,
.preview-audio {
  max-width: 100%;
  max-height: 200px; /* Adjust as needed */
  display: block;
  margin: auto;
}

.preview-iframe {
  width: 100%;
  height: 200px; /* Adjust as needed */
  border: none;
}

.preview-link {
  font-size: 1.1em;
  color: var(--ion-color-primary);
  text-decoration: underline;
}
</style>
