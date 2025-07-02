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
  {"sentence": "¿Cuál es la capital de Francia?", "type": "geografia"},
  {"sentence": "¿Qué es 2+2?", "type": "matematicas"}
]

O también objetos separados:
{"sentence": "Pregunta 1", "type": "tipo1"}
{"sentence": "Pregunta 2", "type": "tipo2"}'
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
              <ion-label>
                <h3>{{ objeto.sentence }}</h3>
                <p>Tipo: {{ objeto.type }}</p>
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
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed } from "vue";
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
} from "@ionic/vue";

import { arrowBackOutline } from "ionicons/icons";
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

    const error = ref({
      estatus: 0,
      data: "",
      color: "",
    });

    const usuario = ref();
    const textareaContent = ref("");
    const objetosValidos = ref([]);
    const tiposDetectados = ref([]);
    const tiposIncorrectos = ref([]);
    const debugMessage = ref("");

    // Computed para filtrar preguntas excluyendo tipos incorrectos
    const preguntasFiltradas = computed(() => {
      if (tiposIncorrectos.value.length === 0) {
        return objetosValidos.value;
      }
      return objetosValidos.value.filter(
        (objeto) => !tiposIncorrectos.value.includes(objeto.type)
      );
    });

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
          error.value.estatus = 1;
          error.value.color = "warning";
          error.value.data = "No se encontraron objetos válidos";
        }
      } catch (err) {
        error.value.estatus = 1;
        error.value.color = "danger";
        error.value.data = err.message;
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
      error.value.estatus = 1;
      error.value.color = "success";
      error.value.data = `Se eliminaron ${tiposAEliminar.length} tipos incorrectos exitosamente`;
    };

    const importarPreguntas = () => {
      axios
        .post(
          "/questions/import/types",
          {
            quizId: id ? id : 0,
            points: points.value,
            questions: preguntasFiltradas.value.map((objeto) => ({
              type: objeto.type,
              sentence: objeto.sentence,
            })),
            types: tiposDetectados.value,
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
      error,
      opcion,
      textareaContent,
      objetosValidos,
      tiposDetectados,
      tiposIncorrectos,
      preguntasFiltradas,
      procesarObjetos,
      toggleTipoIncorrecto,
      importarPreguntas,
    };
  },
};
</script>
