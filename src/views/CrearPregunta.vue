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
          <ion-button @click="crearPregunta">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
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
            v-if="id && pregunta.exist == true"
            button
            color="danger"
            @click="borrarPregunta(false)"
          >
            <ion-label>Borrar Pregunta</ion-label>
          </ion-item>
          <ion-item
            class="ion-text-center"
            v-if="id && pregunta.exist == false"
            button
            color="success"
            @click="borrarPregunta(true)"
          >
            <ion-label>Recuperar Pregunta</ion-label>
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
              <ion-icon slot="start" :icon="imageOutline"></ion-icon>
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
            <ion-thumbnail slot="end">
              <img :src="src" />
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
    </ion-content>
  </ion-page>
</template>

<script>
import { Editor, EditorContent } from "@tiptap/vue-3";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import {
  basedeURL,
  defaultFile,
  tokenHeader,
  usuarioGet,
} from "../globalService";

import { ref } from "vue";
import { useRoute } from "vue-router";
import router from "../router";
import axios from "axios";

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
} from "@ionic/vue";

import {
  arrowBackOutline,
  checkmarkOutline,
  imageOutline,
  trashOutline,
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
  },

  setup() {
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
    });
    const error = ref({
      estatus: 0,
      data: "",
    });

    onIonViewWillEnter(async () => {
      tokenHeader();
      if (id != undefined) {
        await axios.get("/questions/" + id).then((response) => {
          pregunta.value = {
            ...response.data,
            lessonId: response.data.lesson.id,
            instituteId: usuarioGet().institute.id,
          };
          if (!pregunta.value.photo) {
            pregunta.value.photo = null;
            src.value = defaultFile("thumbnail");
          } else {
            src.value = basedeUrl + pregunta.value.photo;
          }
        });
      }

      if (cuestionario != undefined) {
        pregunta.value = {
          title: "",
          sentence:
            "<h6><strong> Crea tu pregunta </strong></h6> <p> En esta sección <br> puedes crear tu pregunta </p>",
          lessonId: cuestionario,
          instituteId: usuarioGet().institute.id,
          points: "",
          visible: 0,
          available: 0,
          exist: true,
        };

        src.value = defaultFile("thumbnail");
      }

      editor.value = new Editor({
        extensions: [StarterKit, Underline],
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

    return {
      async crearPregunta() {
        pregunta.value.sentence = editor.value.getHTML();
        delete pregunta.value.institute;
        delete pregunta.value.lesson;
        delete pregunta.value.institute;
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
        } else {
          for (var key in pregunta.value) {
          form_data.value.append(key, pregunta.value[key]);
        }

        if (cuestionario != undefined) {
          
          await axios
            .post("/questions", form_data.value, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((response) => {
              if (response.data.exist) {
                router.push("/pregunta/" + response.data.id);
              } else {
                router.push("/cuestionario/" + response.data.lesson.id);
              }
            })
            .catch((fallo) => {
              localStorage.setItem("error", fallo.response.data.message);
              error.value.estatus = 1;
              error.value.data = fallo.response.data.message;
            });
        } if (id != undefined) {
          await axios
            .patch("/questions/" + id, form_data.value, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((response) => {

              if (response.data.exist) {
                router.push("/pregunta/" + response.data.id);
              } else {
                router.push("/cuestionario/" + response.data.lesson.id);
              }

              localStorage.setItem("error", response.data.message);
            })
            .catch((fallo) => {
              localStorage.setItem("error", fallo.response.data.message);
              error.value.estatus = 1;
              error.value.data = fallo.response.data.message;
            });
        }
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
      borrarPregunta(valor) {
        pregunta.value.exist = valor;
        this.crearPregunta();
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
</style>
