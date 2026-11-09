<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/cuestionario/' + id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Importar Preguntas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div :fullscreen="true">
        <ion-list>


          <!-- checkbox para mezclar objetos de array "Mezclar objetos" -->
          <ion-item>
            <ion-label>Mezclar preguntas</ion-label>
            <ion-checkbox slot="end" v-model="mezclarPreguntas" />
          </ion-item>
          <ion-item>
            <ion-label>Mezclar opciones de respuesta</ion-label>
            <ion-checkbox slot="end" v-model="mezclarOpciones" />
          </ion-item>
          <!-- input for number of points  -->
          <ion-item>
            <ion-label position="stacked">Puntos</ion-label>
            <ion-input
              v-model.number="points"
              type="number"
              placeholder="Ingrese puntos para cada pregunta"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked"
              >Objetos JSON (pegue su array de objetos)</ion-label
            >
            <ion-button slot="end" @click="copyPlaceholder">
              <ion-icon :icon="copyOutline"></ion-icon>
            </ion-button>
            <ion-textarea
              v-model="textareaContent"
              :placeholder="placeholderText"
              rows="8"
              @ionBlur="procesarObjetos"
            ></ion-textarea>
          </ion-item>

          <!-- Imágenes de las preguntas -->
          <ion-item>
            <ion-label position="stacked">
              Imágenes (opcional)
              <p v-if="selectedImages.length > 0">
                {{ selectedImages.length }} imagen(es) seleccionada(s). En el JSON
                referencie cada archivo por su nombre original en el campo
                "photo".
              </p>
            </ion-label>
            <input
              type="file"
              accept="image/*"
              multiple
              class="image-picker"
              ref="imageInput"
              @change="onImagesSelected"
            />
            <ion-button slot="end" @click="pickImages">
              <ion-icon :icon="imagesOutline"></ion-icon>
            </ion-button>
          </ion-item>

          <ion-item v-if="selectedImages.length > 0">
            <ion-label>
              <p>Archivos: {{ selectedImageNames.join(", ") }}</p>
            </ion-label>
            <ion-button slot="end" color="medium" @click="clearImages">
              <ion-icon :icon="trashOutline"></ion-icon>
            </ion-button>
          </ion-item>

          <ion-item v-if="missingImages.length > 0" color="warning">
            <ion-label>
              <h3>El JSON referencia imágenes no seleccionadas</h3>
              <p>{{ missingImages.join(", ") }}</p>
            </ion-label>
          </ion-item>

          <!-- Botón para procesar objetos -->
          <ion-item>
            <ion-button expand="block" @click="procesarObjetos">
              Procesar Objetos
            </ion-button>
          </ion-item>

          <!-- Lista de objetos válidos -->
          <ion-item-group v-if="objetosValidos.length > 0">
            <ion-item-divider>
              <ion-label
                >Preguntas a Importar ({{ objetosValidos.length }})</ion-label
              >
            </ion-item-divider>

            <ion-item v-for="(objeto, index) in objetosValidos" :key="index">
              <ion-thumbnail slot="start" v-if="objeto.photo">
                <img :src="previewForPhoto(objeto.photo)" />
              </ion-thumbnail>
              <ion-label>
                <h3>{{ objeto.sentence }}</h3>
                <p v-if="objeto.photo">Imagen: {{ objeto.photo }}</p>
                <p>Opciones: <ul><li v-for="option in objeto.options" :key="option.sentence">{{ option.sentence }} <span v-if="option.correct">✓</span></li></ul></p>
              </ion-label>
              <ion-button slot="end" @click="abrirModalEdicion(index)">
                <ion-icon :icon="pencil"></ion-icon>
              </ion-button>
            </ion-item>
          </ion-item-group>

          <!-- Botón importar -->
          <ion-item v-if="objetosValidos.length > 0">
            <ion-button
              expand="block"
              color="success"
              @click="importarPreguntas"
            >
              Importar Preguntas ({{ objetosValidos.length }})
            </ion-button>
          </ion-item>
        </ion-list>
      </div>

      <!-- Toasts -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        :message="toastSuccessMessage"
        :duration="3000"
        color="success"
        @didDismiss="isSuccessToastOpen = false"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        :message="toastErrorMessage"
        :duration="3000"
        color="danger"
        @didDismiss="isErrorToastOpen = false"
      ></ion-toast>

      <!-- Modal de Edición -->
      <ion-modal :is-open="isModalOpen" @didDismiss="cancelarEdicion">
        <ion-header>
          <ion-toolbar>
            <ion-title>Editar Pregunta</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="cancelarEdicion">Cancelar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding" v-if="preguntaEnEdicion">
          <ion-item>
            <ion-label position="stacked">Enunciado de la pregunta</ion-label>
            <ion-input v-model="preguntaEnEdicion.sentence"></ion-input>
          </ion-item>

          <ion-item-divider>Opciones</ion-item-divider>

          <ion-item
            v-for="(opcion, optIndex) in preguntaEnEdicion.options"
            :key="optIndex"
          >
            <ion-input v-model="opcion.sentence"></ion-input>
            <ion-checkbox v-model="opcion.correct">Correcta</ion-checkbox>
            <ion-button
              color="danger"
              slot="end"
              @click="quitarOpcion(optIndex)"
            >
              <ion-icon :icon="trash"></ion-icon>
            </ion-button>
          </ion-item>

          <ion-button expand="block" @click="agregarOpcion"
            >Agregar Opción</ion-button
          >

          <ion-button expand="block" color="primary" @click="guardarCambios"
            >Guardar Cambios</ion-button
          >
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed, onUnmounted } from "vue";
import { useRoute } from "vue-router";

import { usuarioGet, tokenHeader, shuffleArray } from "../globalService";
import {
  findMissingImages,
  buildImagePreviews,
  revokeImagePreviews,
  previewForPhoto as previewForPhotoName,
  resolveQuestionPhotos,
} from "../questionImageService";
import {
  onIonViewWillEnter,
  alertController,
  IonToast,
  IonCheckbox,
  IonTextarea,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonItem,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonButtons,
  IonInput,
  IonModal,
  IonThumbnail,
} from "@ionic/vue";

import {
  arrowBackOutline,
  pencil,
  trash,
  copyOutline,
  trashOutline,
  imagesOutline,
} from "ionicons/icons";
import axios from "axios";

export default {
  components: {
    IonToast,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonTextarea,
    IonItemGroup,
    IonItemDivider,
    IonIcon,
    IonInput,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,
    IonModal,
    IonThumbnail,
  },
  setup() {
    const mroute = useRoute();
    const { pregunta } = mroute.params;
    const id = parseInt(mroute.params.id) || 0;
    const mezclarPreguntas = ref(true);
    const mezclarOpciones = ref(true);
    const points = ref(10);

    const isSuccessToastOpen = ref(false);
    const isErrorToastOpen = ref(false);
    const toastErrorMessage = ref("");
    const toastSuccessMessage = ref("Importación exitosa");

    const usuario = ref();
    const textareaContent = ref("");
    const objetosValidos = ref([]);
    const placeholderText = ref(
      `[
  {
    "sentence": "string",
    "photo": "nombre_original_de_la_imagen.png",
    "options": [
      {
        "sentence": "string",
        "correct": true
      }
    ]
  }
]`
    );

    const imageInput = ref(null);
    const selectedImages = ref([]);
    const imagePreviews = ref({});
    const selectedImageNames = computed(() =>
      selectedImages.value.map((file) => file.name),
    );
    const missingImages = computed(() =>
      findMissingImages(objetosValidos.value, selectedImages.value),
    );
    const previewForPhoto = (name) =>
      previewForPhotoName(imagePreviews.value, name);

    const pickImages = () => {
      if (imageInput.value) {
        imageInput.value.click();
      }
    };

    const clearImages = () => {
      revokeImagePreviews(imagePreviews.value);
      imagePreviews.value = {};
      selectedImages.value = [];
      if (imageInput.value) {
        imageInput.value.value = "";
      }
    };

    const onImagesSelected = (event) => {
      revokeImagePreviews(imagePreviews.value);
      selectedImages.value = Array.from(event.target.files || []);
      imagePreviews.value = buildImagePreviews(selectedImages.value);
    };

    onUnmounted(() => revokeImagePreviews(imagePreviews.value));

    // State for the editing modal
    const isModalOpen = ref(false);
    const preguntaEnEdicion = ref(null);
    const indiceEnEdicion = ref(-1);

    const procesarObjetos = () => {
      try {
        isErrorToastOpen.value = false;
        let contenido = textareaContent.value.trim();

        if (!contenido) {
          toastErrorMessage.value = "Por favor ingrese contenido JSON";
          isErrorToastOpen.value = true;
          return;
        }

        let objetosProcesados = [];

        try {
          const arrayObjetos = JSON.parse(contenido);

          if (!Array.isArray(arrayObjetos)) {
            throw new Error("El contenido no es un array.");
          }

          arrayObjetos.forEach((objeto, index) => {
            if (
              typeof objeto !== "object" ||
              typeof objeto.sentence !== "string" ||
              !Array.isArray(objeto.options)
            ) {
              throw new Error(
                `El objeto en la posición ${
                  index + 1
                } no tiene una estructura válida. Porque objeto es ${typeof objeto}, sentence es ${typeof objeto.sentence}, y options es ${Array.isArray(
                  objeto.options
                )}`
              );
            }

            if (objeto.options.length === 0) {
              throw new Error(
                `El objeto en la posición ${index + 1} no tiene opciones.`
              );
            }

            if (
              objeto.photo !== undefined &&
              objeto.photo !== null &&
              typeof objeto.photo !== "string"
            ) {
              throw new Error(
                `El campo "photo" del objeto en la posición ${
                  index + 1
                } debe ser el nombre original de la imagen.`
              );
            }

            objeto.options.forEach((opcion, optIndex) => {
              if (
                typeof opcion !== "object" ||
                typeof opcion.sentence !== "string" ||
                typeof opcion.correct !== "boolean"
              ) {
                throw new Error(
                  `La opción ${optIndex + 1} del objeto en la posición ${
                    index + 1
                  } no tiene una estructura válida.`
                );
              }
            });

            objetosProcesados.push(objeto);
          });
        } catch (error) {
          throw new Error(
            "Error al procesar el contenido JSON: " + error.message
          );
        }

        if (mezclarPreguntas.value) {
          objetosProcesados = shuffleArray(objetosProcesados);
        }
        objetosValidos.value = objetosProcesados;

        if (objetosProcesados.length === 0) {
          toastErrorMessage.value = "No se encontraron objetos válidos";
          isErrorToastOpen.value = true;
        }
      } catch (err) {
        toastErrorMessage.value = err.message;
        isErrorToastOpen.value = true;
        objetosValidos.value = [];
      }
    };

    const confirmarImportacion = async () => {
      if (missingImages.value.length === 0) {
        return true;
      }
      const alert = await alertController.create({
        header: "Imágenes sin archivo",
        message: `No se encontró archivo para: ${missingImages.value.join(
          ", ",
        )}. Esas preguntas se importarán sin imagen.`,
        buttons: [
          { text: "Cancelar", role: "cancel" },
          { text: "Importar de todos modos" },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      return role !== "cancel";
    };

    const importarPreguntas = async () => {
      isErrorToastOpen.value = false;
      try {
        if (!(await confirmarImportacion())) {
          return;
        }

        const { questions, uploaded } = await resolveQuestionPhotos(
          objetosValidos.value,
          selectedImages.value,
        );

        await axios.post(
          "/questions/import/variable-option",
          {
            quizId: id ? id : 0,
            points: points.value,
            shuffleOptions: mezclarOpciones.value,
            questions: questions.map((objeto) => ({
              sentence: objeto.sentence,
              photo: objeto.photo,
              options: (objeto.options || []).map((opcion) => ({
                sentence: opcion.sentence,
                correct: opcion.correct,
              })),
            })),
          },
          {
            headers: tokenHeader(),
          },
        );

        isSuccessToastOpen.value = true;
        toastSuccessMessage.value =
          uploaded > 0
            ? `Importación exitosa. ${uploaded} imagen(es) subida(s).`
            : "Importación exitosa";
      } catch (err) {
        console.error("Error al importar preguntas:", err);
        toastErrorMessage.value = "Error al importar preguntas: " + err.message;
        isErrorToastOpen.value = true;
      }
    };

    const abrirModalEdicion = (index) => {
      indiceEnEdicion.value = index;
      // Use deep copy to avoid mutating original object until save
      preguntaEnEdicion.value = JSON.parse(
        JSON.stringify(objetosValidos.value[index])
      );
      isModalOpen.value = true;
    };

    const cancelarEdicion = () => {
      isModalOpen.value = false;
    };

    const guardarCambios = () => {
      if (preguntaEnEdicion.value && indiceEnEdicion.value > -1) {
        objetosValidos.value[indiceEnEdicion.value] = preguntaEnEdicion.value;
      }
      isModalOpen.value = false;
    };

    const agregarOpcion = () => {
      if (preguntaEnEdicion.value) {
        preguntaEnEdicion.value.options.push({ sentence: "", correct: false });
      }
    };

    const quitarOpcion = (optIndex) => {
      if (preguntaEnEdicion.value) {
        preguntaEnEdicion.value.options.splice(optIndex, 1);
      }
    };

    const copyPlaceholder = async () => {
      let exitoso = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(placeholderText.value);
          exitoso = true;
        } catch (err) {
          console.log("Clipboard API falló, intentando método alternativo:", err);
        }
      }

      if (!exitoso) {
        const textarea = document.createElement("textarea");
        textarea.value = placeholderText.value;
        document.body.appendChild(textarea);
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "0";
        textarea.style.top = "0";
        textarea.select();
        try {
          exitoso = document.execCommand("copy");
        } catch (err) {
          console.error("Error al copiar:", err);
        } finally {
          document.body.removeChild(textarea);
        }
      }

      if (exitoso) {
        toastSuccessMessage.value = "Ejemplo copiado al portapapeles";
        isSuccessToastOpen.value = true;
        setTimeout(() => { isSuccessToastOpen.value = false; }, 2000);
      } else {
        toastErrorMessage.value = "No se pudo copiar el ejemplo";
        isErrorToastOpen.value = true;
      }
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();
    });

    return {
      points,
      mezclarPreguntas,
      mezclarOpciones,
      arrowBackOutline,
      pencil,
      trash,
      copyOutline,
      trashOutline,
      imagesOutline,
      pregunta,
      id,
      usuario,
      isSuccessToastOpen,
      isErrorToastOpen,
      toastErrorMessage,
      toastSuccessMessage,
      textareaContent,
      objetosValidos,
      procesarObjetos,
      importarPreguntas,
      placeholderText,
      copyPlaceholder,
      imageInput,
      selectedImages,
      selectedImageNames,
      missingImages,
      pickImages,
      clearImages,
      onImagesSelected,
      previewForPhoto,
      // Modal functions and state
      isModalOpen,
      preguntaEnEdicion,
      abrirModalEdicion,
      cancelarEdicion,
      guardarCambios,
      agregarOpcion,
      quitarOpcion,
    };
  },
};
</script>

<style scoped>
.image-picker {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
</style>
