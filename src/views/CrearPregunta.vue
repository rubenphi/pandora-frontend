<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/cuestionario/' + pregunta.cuestionario_id">
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
          <ion-item v-if="error.estatus == 1">
            <ion-label color="danger">{{ error.data }}</ion-label>
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
              @click="borrarFoto"
            >
              <ion-icon :icon="trashOutline"></ion-icon>
            </ion-button>
            <ion-thumbnail slot="end">
              <img :src="src" />
            </ion-thumbnail>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Valor:</ion-label>
            <ion-input type="number" v-model="pregunta.valor"></ion-input>
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
              :checked="pregunta.disponible"
              v-model="pregunta.disponible"
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
import { booltoInt, basedeURL, defaultFile } from "../globalService";

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
      cuestionario_id: 0,
    });
    const error = ref({
      estatus: 0,
      data: "",
    });

    onIonViewWillEnter(async () => {
      if (id != undefined) {
        await axios.get("/preguntas/" + id).then((response) => {
          pregunta.value = response.data;
          if (pregunta.value.photo) {
            src.value = basedeUrl + pregunta.value.photo;
          } else {
            src.value = defaultFile("thumbnail");
          }
        });
      }

      if (cuestionario != undefined) {
        pregunta.value = {
          enunciado:
            "<h6><strong> Crea tu pregunta </strong></h6> <p> En esta sección <br> puedes crear tu pregunta </p>",
          photo: "",
          cuestionario_id: cuestionario,
          valor: "",
          visible: 0,
          disponible: 0,
        };

        src.value = defaultFile("thumbnail");
      }

      editor.value = new Editor({
        extensions: [StarterKit, Underline],
        autofocus: "start",
        editable: true,
        content: pregunta.value.enunciado,
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
      borrarFoto() {
        pregunta.value.photo = "";
        src.value = defaultFile("thumbnail");
      },
      async crearPregunta() {
        pregunta.value.visible = booltoInt(pregunta.value.visible);
        pregunta.value.disponible = booltoInt(pregunta.value.disponible);
        pregunta.value.enunciado = editor.value.getHTML();

        for (var key in pregunta.value) {
          form_data.value.append(key, pregunta.value[key]);
        }

        if (
          pregunta.value.valor == "" ||
          pregunta.value.enunciado ==
            "<h6><strong> Crea tu pregunta </strong></h6> <p> En esta sección <br> puedes crear tu pregunta </p>"
        ) {
          error.value.estatus = 1;
          error.value.data = "Debe añadir un enunciado y añadir el valor";
        } else if (cuestionario != undefined) {
          await axios
            .post("/preguntas", form_data.value, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((response) => {
              router.push("/cuestionario/" + cuestionario);
              localStorage.setItem("error", response.data.message);
            })
            .catch((response) => {
              localStorage.setItem("error", response.message);
              error.value.estatus = 1;
              error.value.data = "Error: no se pudo añadir la pregunta";
            });
        } else if (id != undefined) {
          await axios
            .post("/preguntas/update/" + id, form_data.value, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((response) => {
              router.push("/pregunta/" + id);
              localStorage.setItem("error", response.data.message);
            })
            .catch((response) => {
              localStorage.setItem("error", response.message);
              error.value.estatus = 1;
              error.value.data = "Error: no se pudo actualizar la pregunta";
            });
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
