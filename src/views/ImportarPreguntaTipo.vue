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
            <ion-textarea
              v-model="textareaContent"
              placeholder='[
  {"sentence": "¿Cuál es la capital de Francia?", "type": "geografia", "photo": "mapa.png"},
  {"sentence": "¿Qué es 2+2?", "type": "matematicas"}
]

O también objetos separados:
{"sentence": "Pregunta 1", "type": "tipo1"}
{"sentence": "Pregunta 2", "type": "tipo2"}'
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

          <!-- Mensaje de tipos detectados -->
          <ion-item v-if="tiposDetectados.length > 0">
            <ion-label>
              <h3>
                Estos son los tipos detectados en los objetos, valide si son
                correctos, si alguno es incorrecto márquelo:
              </h3>
            </ion-label>
          </ion-item>

          <!-- Debug info mejorado -->
          <ion-item v-if="tiposDetectados.length > 0">
            <ion-label>
              <p><strong>Debug Info:</strong></p>
              <p>
                Tipos detectados: {{ tiposDetectados.length }} - [{{
                  tiposDetectados.join(", ")
                }}]
              </p>
              <p>
                Tipos marcados como incorrectos: {{ tiposIncorrectos.length }} -
                [{{ tiposIncorrectos.join(", ") }}]
              </p>
              <p>Total objetos: {{ objetosValidos.length }}</p>
              <p>Objetos filtrados: {{ preguntasFiltradas.length }}</p>
              <p><strong>Última acción:</strong> {{ debugMessage }}</p>
            </ion-label>
          </ion-item>

          <!-- Lista de tipos con checkboxes -->
          <ion-item v-for="tipo in tiposDetectados" :key="tipo">
            <ion-checkbox
              :checked="tiposIncorrectos.includes(tipo)"
              @ionChange="toggleTipoIncorrecto(tipo, $event.detail.checked)"
              slot="start"
            ></ion-checkbox>
            <ion-label>{{ tipo }}</ion-label>
          </ion-item>

          <!-- Lista de objetos válidos -->
          <ion-item-group v-if="objetosValidos.length > 0">
            <ion-item-divider>
              <ion-label
                >Preguntas a Importar ({{
                  preguntasFiltradas.length
                }})</ion-label
              >
            </ion-item-divider>

            <ion-item
              v-for="(objeto, index) in preguntasFiltradas"
              :key="index"
            >
              <ion-thumbnail slot="start" v-if="objeto.photo">
                <img :src="previewForPhoto(objeto.photo)" />
              </ion-thumbnail>
              <ion-label>
                <h3>{{ objeto.sentence }}</h3>
                <p>Tipo: {{ objeto.type }}</p>
                <p v-if="objeto.photo">Imagen: {{ objeto.photo }}</p>
              </ion-label>
            </ion-item>
          </ion-item-group>

          <!-- Botón importar -->
          <ion-item v-if="preguntasFiltradas.length > 0">
            <ion-button
              expand="block"
              color="success"
              @click="importarPreguntas"
            >
              Importar Preguntas ({{ preguntasFiltradas.length }})
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
  IonThumbnail,
} from "@ionic/vue";

import {
  arrowBackOutline,
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
    IonItem,
    IonIcon,
    IonInput,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonLabel,
    IonThumbnail,
  },
  setup() {
    const mroute = useRoute();
    const { pregunta } = mroute.params;
    const id = parseInt(mroute.params.id) || 0;
    const mezclarPreguntas = ref(true);
    const points = ref(10);

    const opcion = ref({
      id: 0,
      questionId: 0,
    });

    const isSuccessToastOpen = ref(false);
    const isErrorToastOpen = ref(false);
    const toastErrorMessage = ref("");
    const toastSuccessMessage = ref("Importación exitosa");
    const debugMessage = ref("");

    const usuario = ref();
    const textareaContent = ref("");
    const objetosValidos = ref([]);
    const tiposDetectados = ref([]);
    const tiposIncorrectos = ref([]);

    const imageInput = ref(null);
    const selectedImages = ref([]);
    const imagePreviews = ref({});
    const selectedImageNames = computed(() =>
      selectedImages.value.map((file) => file.name),
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

    // Computed para filtrar preguntas excluyendo tipos incorrectos
    const preguntasFiltradas = computed(() => {
      if (tiposIncorrectos.value.length === 0) {
        return objetosValidos.value;
      }
      return objetosValidos.value.filter(
        (objeto) => !tiposIncorrectos.value.includes(objeto.type)
      );
    });

    const missingImages = computed(() =>
      findMissingImages(preguntasFiltradas.value, selectedImages.value),
    );

    const assertPhoto = (objeto, etiqueta) => {
      if (
        objeto.photo !== undefined &&
        objeto.photo !== null &&
        typeof objeto.photo !== "string"
      ) {
        throw new Error(
          `El campo "photo" de ${etiqueta} debe ser el nombre original de la imagen.`
        );
      }
    };

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
        const tipos = new Set();

        // Intentar parsear como array JSON primero
        try {
          const arrayObjetos = JSON.parse(contenido);
          if (Array.isArray(arrayObjetos)) {
          arrayObjetos.forEach((objeto, index) => {
            if (
              !Object.prototype.hasOwnProperty.call(objeto, "sentence") ||
              !Object.prototype.hasOwnProperty.call(objeto, "type")
            ) {
              throw new Error(
                `Objeto en posición ${
                  index + 1
                } no tiene las propiedades 'sentence' y 'type' requeridas`
              );
            }
            assertPhoto(objeto, `el objeto en posición ${index + 1}`);
            objetosProcesados.push(objeto);
            tipos.add(objeto.type);
          });
        } else {
          // Si no es array, tratar como objeto único
          if (
            !Object.prototype.hasOwnProperty.call(arrayObjetos, "sentence") ||
            !Object.prototype.hasOwnProperty.call(arrayObjetos, "type")
          ) {
            throw new Error(
              `El objeto no tiene las propiedades 'sentence' y 'type' requeridas`
            );
          }
          assertPhoto(arrayObjetos, "el objeto");
          objetosProcesados.push(arrayObjetos);
          tipos.add(arrayObjetos.type);
        }
        } catch (parseError) {
          // Si falla como JSON válido, intentar extraer objetos individuales
          const regex = /\{[^{}]*\}/g;
          const matches = contenido.match(regex);

          if (!matches) {
            throw new Error("No se pudieron encontrar objetos JSON válidos");
          }

          matches.forEach((match, index) => {
            try {
              const objeto = JSON.parse(match);

              if (
                !Object.prototype.hasOwnProperty.call(objeto, "sentence") ||
                !Object.prototype.hasOwnProperty.call(objeto, "type")
              ) {
                throw new Error(
                  `Objeto ${
                    index + 1
                  } no tiene las propiedades 'sentence' y 'type' requeridas`
                );
              }

              assertPhoto(objeto, `el objeto ${index + 1}`);
              objetosProcesados.push(objeto);
              tipos.add(objeto.type);
            } catch (objError) {
              throw new Error(
                `Error en objeto ${index + 1}: ${objError.message}`
              );
            }
          });
        }

        if (mezclarPreguntas.value) {
          objetosProcesados = shuffleArray(objetosProcesados);
        }
        objetosValidos.value = objetosProcesados;
        tiposDetectados.value = Array.from(tipos);
        tiposIncorrectos.value = []; // Reset tipos incorrectos

        if (objetosProcesados.length === 0) {
          toastErrorMessage.value = "No se encontraron objetos válidos";
          isErrorToastOpen.value = true;
        }
      } catch (err) {
        toastErrorMessage.value = err.message;
        isErrorToastOpen.value = true;
        objetosValidos.value = [];
        tiposDetectados.value = [];
      }
    };

    const toggleTipoIncorrecto = (tipo, checked) => {
      debugMessage.value = `Toggle: ${tipo} -> ${
        checked ? "marcado" : "desmarcado"
      }`;

      if (checked) {
        if (!tiposIncorrectos.value.includes(tipo)) {
          tiposIncorrectos.value.push(tipo);
        }
      } else {
        const index = tiposIncorrectos.value.indexOf(tipo);
        if (index > -1) {
          tiposIncorrectos.value.splice(index, 1);
        }
      }

      debugMessage.value += ` | Incorrectos: ${tiposIncorrectos.value.length} | Filtradas: ${preguntasFiltradas.value.length}`;
    };

    const removeInvalidTypes = () => {
      debugMessage.value = `Eliminando ${tiposIncorrectos.value.length} tipos incorrectos`;

      const tiposAEliminar = [...tiposIncorrectos.value];

      // Filtrar objetosValidos para eliminar permanentemente los tipos incorrectos
      objetosValidos.value = objetosValidos.value.filter(
        (objeto) => !tiposAEliminar.includes(objeto.type)
      );

      // Actualizar tiposDetectados para eliminar los tipos removidos
      tiposDetectados.value = tiposDetectados.value.filter(
        (tipo) => !tiposAEliminar.includes(tipo)
      );

      // Limpiar la lista de tipos incorrectos
      tiposIncorrectos.value = [];

      debugMessage.value = `Eliminados ${tiposAEliminar.length} tipos. Quedan ${objetosValidos.value.length} objetos`;

      // Mostrar mensaje de éxito
      isSuccessToastOpen.value = true;
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
          preguntasFiltradas.value,
          selectedImages.value,
        );

        await axios.post(
          "/questions/import/types",
          {
            quizId: id ? id : 0,
            points: points.value,
            questions: questions.map((objeto) => ({
              type: objeto.type,
              sentence: objeto.sentence,
              photo: objeto.photo,
            })),
            types: tiposDetectados.value,
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

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();
    });

    return {
      points,
      debugMessage,
      mezclarPreguntas,
      removeInvalidTypes,
      arrowBackOutline,
      pregunta,
      id,
      usuario,
      isSuccessToastOpen,
      isErrorToastOpen,
      toastErrorMessage,
      toastSuccessMessage,
      opcion,
      textareaContent,
      objetosValidos,
      tiposDetectados,
      tiposIncorrectos,
      preguntasFiltradas,
      procesarObjetos,
      toggleTipoIncorrecto,
      importarPreguntas,
      trashOutline,
      imagesOutline,
      imageInput,
      selectedImages,
      selectedImageNames,
      missingImages,
      pickImages,
      clearImages,
      onImagesSelected,
      previewForPhoto,
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
