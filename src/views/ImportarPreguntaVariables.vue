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
          <!-- Error display -->
          <ion-item v-if="error.estatus == 1">
            <ion-label :color="error.color">{{ error.data }}</ion-label>
          </ion-item>

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
              <ion-label>
                <h3>{{ objeto.sentence }}</h3>
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
import { ref } from "vue";
import { useRoute } from "vue-router";

import { usuarioGet, tokenHeader, shuffleArray } from "../globalService";
import {
  onIonViewWillEnter,
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
} from "@ionic/vue";

import { arrowBackOutline, pencil, trash, copyOutline } from "ionicons/icons";
import axios from "axios";

export default {
  components: {
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
  },
  setup() {
    const mroute = useRoute();
    const { pregunta } = mroute.params;
    const id = parseInt(mroute.params.id) || 0;
    const mezclarPreguntas = ref(true);
    const mezclarOpciones = ref(true);
    const points = ref(10);

    const error = ref({
      estatus: 0,
      data: "",
      color: "",
    });

    const usuario = ref();
    const textareaContent = ref("");
    const objetosValidos = ref([]);
    const placeholderText = ref(
      `[
  {
    "sentence": "string",
    "options": [
      {
        "sentence": "string",
        "correct": true
      }
    ]
  }
]`
    );

    // State for the editing modal
    const isModalOpen = ref(false);
    const preguntaEnEdicion = ref(null);
    const indiceEnEdicion = ref(-1);

    const procesarObjetos = () => {
      try {
        error.value.estatus = 0;
        let contenido = textareaContent.value.trim();

        if (!contenido) {
          error.value.estatus = 1;
          error.value.color = "warning";
          error.value.data = "Por favor ingrese contenido JSON";
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
          error.value.estatus = 1;
          error.value.color = "warning";
          error.value.data = "No se encontraron objetos válidos";
        }
      } catch (err) {
        error.value.estatus = 1;
        error.value.color = "danger";
        error.value.data = err.message;
        objetosValidos.value = [];
      }
    };

    const importarPreguntas = () => {
     
      
      axios
        .post(
          "/questions/import/variable-option",
          {
            quizId: id ? id : 0,
            points: points.value,
            shuffleOptions: mezclarOpciones.value,
            questions: objetosValidos.value,
          },
          {
            headers: tokenHeader(),
          }
        )
        .then((response) => {
          if (response.data.estatus === 1) {
            error.value.estatus = 1;
            error.value.color = "success";
            error.value.data = response.data.data;
          } else {
            error.value.estatus = 1;
            error.value.color = "danger";
            error.value.data = response.data.data;
          }
        })
        .catch((error) => {
          console.error("Error al importar preguntas:", error);
          error.value.estatus = 1;
          error.value.color = "danger";
          error.value.data = "Error al importar preguntas: " + error.message;
        });
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

    const copyPlaceholder = () => {
      navigator.clipboard.writeText(placeholderText.value);
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
      pregunta,
      id,
      usuario,
      error,
      textareaContent,
      objetosValidos,
      procesarObjetos,
      importarPreguntas,
      placeholderText,
      copyPlaceholder,
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
