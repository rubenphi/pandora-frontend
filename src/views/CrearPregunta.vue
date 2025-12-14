<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button
            v-if="cuestionario"
            :href="'/cuestionario/' + cuestionario"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
          <ion-button v-if="id" :href="'/pregunta/' + id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-buttons slot="end">
          <ion-button v-if="id" @click="eliminarPreguntaHard">
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Pregunta</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-card class="ion-padding">
        <ion-list v-if="editor" class="ion-no-padding">
          <ion-item
            class="ion-text-center"
            button
            color="success"
            @click="crearPregunta"
          >
            <ion-label>Guardar Cambios de Pregunta</ion-label>
          </ion-item>
          <ion-item v-if="error.estatus == 1">
            <ion-label color="danger">{{ error.data }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Título:</ion-label>
            <ion-input v-model="pregunta.title"></ion-input>
          </ion-item>
          <ion-item>
            <ion-button slot="start" color="light">
              <ion-icon slot="start" :icon="uploadButtonIcon"></ion-icon>
              <input
                type="file"
                accept="image/*"
                class="file"
                name="attachment[]"
                @change="onFileChange"
              />
            </ion-button>
            <ion-label>Imagen de Pregunta:</ion-label>
            <ion-button
              v-if="pregunta.photo"
              slot="end"
              color="light"
              @click="borrarFoto()"
            >
              <ion-icon :icon="trashOutline"></ion-icon>
            </ion-button>
            <ion-thumbnail slot="end" :class="{'placeholder-thumbnail': !pregunta.photo}">
              <ion-icon v-if="!pregunta.photo" :icon="imageOutline"></ion-icon>
              <img v-else :src="src" />
            </ion-thumbnail>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Valor:</ion-label>
            <ion-input type="number" v-model="pregunta.points"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label>Visible:</ion-label>
            <ion-toggle
              slot="end"
              :checked="pregunta.visible"
              v-model="pregunta.visible"
            >
            </ion-toggle>
          </ion-item>
          <ion-item>
            <ion-label>Disponible:</ion-label>
            <ion-toggle
              slot="end"
              :checked="pregunta.available"
              v-model="pregunta.available"
            >
            </ion-toggle>
          </ion-item>

          <ion-item class="ion-no-padding" lines="none">
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
        </ion-list>
        <editor-content :editor="editor" />
      </ion-card>

      <ion-card class="ion-padding">
        <ion-card-header>
          <ion-card-title>Opciones</ion-card-title>
        </ion-card-header>
        <ion-list>
          <ion-item v-for="(option, index) in pregunta.options" :key="index">
            <ion-label slot="start">{{ option.identifier }}</ion-label>
            <ion-input
              v-model="option.sentence"
              placeholder="Enunciado de la opción"
            ></ion-input>
            <ion-toggle
              slot="end"
              :checked="option.correct"
              @ionChange="handleCorrectOptionToggle(option, $event)"
            ></ion-toggle>
            <ion-button
              slot="end"
              fill="clear"
              color="danger"
              @click="removeOption(index)"
            >
              <ion-icon :icon="removeCircleOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
        <ion-button expand="full" fill="outline" @click="addOption()">
          <ion-icon slot="start" :icon="addOutline"></ion-icon>
          Agregar Opción
        </ion-button>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  basedeURL,
  defaultFile,
  tokenHeader,
  usuarioGet,
  numerosOrdinales,
  getAlphabeticalIdentifier,
} from "../globalService";

import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import router from "../router";
import axios from "axios";

import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";

import {
  IonThumbnail,
  IonInput,
  IonToggle,
  IonLabel,
  IonTitle,
  onIonViewDidLeave,
  onIonViewWillEnter,
  IonHeader,
  IonToolbar,
  IonPage,
  IonContent,
  IonCard,
  IonList,
  IonItem,
  IonButtons,
  IonButton,
  IonIcon,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/vue";

import {
  arrowBackOutline,
  checkmarkOutline,
  imageOutline,
  trashOutline,
  addOutline,
  removeCircleOutline,
  cloudUploadOutline,
} from "ionicons/icons";

export default {
  components: {
    IonThumbnail,
    IonInput,
    IonToggle,
    IonLabel,
    IonTitle,
    IonHeader,
    IonToolbar,
    IonList,
    IonItem,
    IonButtons,
    IonButton,
    EditorContent,
    IonPage,
    IonContent,
    IonCard,
    IonIcon,
    IonCardHeader,
    IonCardTitle,
  },

  setup() {
    const handleError = (err) => { // Renamed parameter to 'err' for clarity
      console.error("Error:", err);
      localStorage.setItem(
        "error",
        err.response?.data?.message || "Ocurrió un error inesperado."
      );
      if (error.value) { // Check if the 'error' ref is still valid
        error.value.estatus = 1;
        error.value.data =
          err.response?.data?.message || "Ocurrió un error inesperado.";
      }
    };

    const getOrdinalTitle = (index) => {
      if (index >= 0 && index < numerosOrdinales.length) {
        return numerosOrdinales[index];
      }
      return `Pregunta ${index + 1}`; // Fallback if index is out of bounds
    };

    const basedeUrl = basedeURL();
    const mroute = useRoute();
    const { cuestionario } = mroute.params;
    const { id } = mroute.params;
    const editor = ref(null);
    const src = ref();
    const form_data = ref(new FormData());
    const file = ref({
      name: "",
    });
    const reader = ref();
    const pregunta = ref({
      id: 0,
      options: [], // Initialize options array
    });
    const quizIdForRedirect = ref(null); // New reactive variable
    const error = ref({
      estatus: 0,
      data: "",
    });

    const uploadButtonIcon = computed(() => {
      return pregunta.value.photo ? imageOutline : cloudUploadOutline;
    });

    onIonViewWillEnter(async () => {
      tokenHeader();
      if (id != undefined) {
        // Editing existing question
        await axios.get("/questions/" + id).then((response) => {
          pregunta.value = {
            ...response.data,
            quizId: response.data.quiz.id,
            instituteId: usuarioGet().institute.id,
            options: response.data.options || [], // Populate options
          };
          quizIdForRedirect.value = response.data.quiz.id; // Store it here
          if (!pregunta.value.photo) {
            pregunta.value.photo = null;
            src.value = defaultFile("thumbnail");
          } else {
            if (pregunta.value.photo.startsWith('data:')) {
              src.value = pregunta.value.photo;
            } else {
              src.value = basedeUrl + pregunta.value.photo;
            }
          }
        });
      }

      if (cuestionario != undefined) {
        // Creating new question
        let nextQuestionIndex = 0;
        try {
          const quizResponse = await axios.get(`/quizzes/${cuestionario}`);
          nextQuestionIndex = quizResponse.data.questions.length;
        } catch (e) {
          console.error("Error fetching quiz for question count:", e);
        }

        pregunta.value = {
          title: getOrdinalTitle(nextQuestionIndex), // Default title
          sentence:
            "<h6><strong> Crea tu pregunta </strong></h6> <p> En esta sección <br> puedes crear tu pregunta </p>",
          quizId: parseInt(cuestionario, 10),
          instituteId: usuarioGet().institute.id,
          points: "",
          visible: 0,
          available: 0,
          exist: true,
          options: [
            {
              identifier: getAlphabeticalIdentifier(0),
              sentence: "",
              correct: false,
              instituteId: usuarioGet().institute.id,
              exist: true,
            },
          ], // Default first option
        };

        src.value = defaultFile("thumbnail");
      }

      editor.value = new Editor({
        extensions: [StarterKit],
        autofocus: "start",
        editable: true,
        content: pregunta.value.sentence,
        editorProps: {
          attributes: {
            class: "",
          },
        },
      });
    });

    onIonViewDidLeave(() => {
      editor.value.destroy();
    });

    const addOption = () => {
      pregunta.value.options.push({
        identifier: getAlphabeticalIdentifier(pregunta.value.options.length),
        sentence: "",
        correct: false,
        instituteId: usuarioGet().institute.id,
        exist: true,
      });
    };

    const removeOption = async (index) => {
      const optionToRemove = pregunta.value.options[index];
      if (optionToRemove.id) {
        // If it's an existing option, call delete API
        try {
          await axios.delete(`/options/${optionToRemove.id}`);
          // Optionally, show a success message
        } catch (err) {
          console.error("Error deleting option:", err);
          handleError(err);
          return; // Don't remove from UI if delete fails
        }
      }
      pregunta.value.options.splice(index, 1); // Remove from UI
      // Re-assign identifiers to maintain alphabetical order
      pregunta.value.options.forEach((option, idx) => {
        option.identifier = getAlphabeticalIdentifier(idx);
      });
    };

    const handleCorrectOptionToggle = (toggledOption, event) => {
      const isChecked = event.detail.checked;
      toggledOption.correct = isChecked; // Update the toggled option's correct status

      // If the toggled option is being set to true, set all others to false
      if (isChecked) {
        pregunta.value.options.forEach((option) => {
          if (option !== toggledOption) {
            option.correct = false;
          }
        });
      }
    };

    return {
      async crearPregunta() {
        pregunta.value.sentence = editor.value.getHTML();
        delete pregunta.value.institute;
        delete pregunta.value.quiz;
        // Temporarily store options to process them separately
        const currentOptions = Array.isArray(pregunta.value.options) ? [...pregunta.value.options] : [];
        delete pregunta.value.options; // Remove options from question object for main API call
        delete pregunta.value.id;
        delete pregunta.value.createdAt;
        delete pregunta.value.updatedAt;

        if (
          pregunta.value.points == "" ||
          pregunta.value.sentence ==
            "<h6><strong> Crea tu pregunta </strong></h6> <p> En esta sección <br> puedes crear tu pregunta </p>"
        ) {
          error.value.estatus = 1;
          error.value.data = "Debe añadir un enunciado y añadir el valor";
          return;
        }

        // --- Start of new check ---
        if (cuestionario === undefined && id === undefined) {
          // This is a new question, but no quiz ID is provided in the route.
          error.value.estatus = 1;
          error.value.data = "No se puede crear una pregunta sin un cuestionario asociado. Verifique la URL.";
          return;
        }
        // --- End of new check ---

        for (var key in pregunta.value) {
          form_data.value.append(key, pregunta.value[key]);
        }

        let questionId = id; // Use existing ID if updating
        const tryCrearPregunta = async () => {
          try {
            if (cuestionario !== undefined) {
              const response = await axios.post("/questions", form_data.value, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });
              questionId = response.data.id; // Get new question ID
              localStorage.setItem("error", response.data.message);
            } else if (id !== undefined) {
              const response = await axios.patch(
                "/questions/" + id,
                form_data.value,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );
              localStorage.setItem("error", response.data.message);
            }

            // Process options after question is created/updated
            if (questionId) {
              for (const option of currentOptions) {
                option.questionId = questionId;
                if (option.id) {
                  // Update existing option
                  const optionToUpdate = { ...option }; // Create a copy to avoid modifying the original reactive object
                  delete optionToUpdate.createdAt;
                  delete optionToUpdate.updatedAt;
                  delete optionToUpdate.id; // Remove id from the body for PATCH requests
                  await axios.patch(`/options/${option.id}`, optionToUpdate);
                } else {
                  // Create new option
                  const optionToCreate = { ...option };
                  delete optionToCreate.id; // Ensure id is not sent for new options
                  await axios.post("/options", [optionToCreate]);
                }
              }
            }

            // Redirect after all operations are complete
            if (cuestionario !== undefined) {
              router.push("/pregunta/" + questionId);
            } else if (id !== undefined) {
              router.push("/pregunta/" + id);
            }
          } catch (err) {
            // Manejo del error 409 (conflicto de duplicados)
            if (
              err.response?.status === 409 &&
              err.response?.data?.message === "Este registro ya existe."
            ) {
              try {
                // Llamada al endpoint de reset
                await axios.get("/questions/reset/index");

                // Reintentar la creación
                await tryCrearPregunta();
              } catch (resetError) {
                handleError(resetError);
              }
            } else {
              handleError(err);
            }
          }
        };

        // Ejecutar la función que maneja la validación y reintento
        await tryCrearPregunta();
      },

      async eliminarPreguntaHard() {
        try {
          await axios.delete(`/questions/${mroute.params.id}`);
          localStorage.setItem("error", "Pregunta eliminada exitosamente.");
          router.push("/cuestionario/" + quizIdForRedirect.value); // Redirect to quiz page
        } catch (err) {
          handleError(err);
        }
      },

      onFileChange(e) {
        file.value = e.target.files[0];
        pregunta.value.photo = file.value;
        reader.value = new FileReader();
        reader.value.onload = function () {
          src.value = reader.value.result;
        };
        reader.value.readAsDataURL(file.value);
      },
      borrarFoto() {
        pregunta.value.photo = null;
        src.value = defaultFile("thumbnail");
      },
      id,
      cuestionario,
      basedeUrl,
      form_data,
      error,
      src,
      reader,
      file,
      pregunta,
      editor,
      arrowBackOutline,
      checkmarkOutline,
      imageOutline,
      trashOutline,
      addOutline,
      removeCircleOutline,
      addOption,
      removeOption,
      handleCorrectOptionToggle,
      getAlphabeticalIdentifier,
      uploadButtonIcon,
    };
  },
};
</script>

<style scoped>
.margen {
  font-family: serif;
  margin-left: 0px;
  margin-right: 3px;
  font-size: 12pt;
}

.file {
  position: absolute;
  opacity: 0;
}

.placeholder-thumbnail {
  display: flex;
  align-items: center;
  justify-content: center;
  /* You might need to adjust min-width/min-height or other sizing properties of ion-thumbnail
     to ensure it has a defined size for the icon to fill. */
}

.placeholder-thumbnail ion-icon {
  width: 100%;
  height: 100%;
  /* Adjust icon color if needed for better visibility */
  color: var(--ion-color-medium); /* Example color */
}
</style>
