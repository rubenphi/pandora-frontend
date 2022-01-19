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
          <ion-button>
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Pregunta</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-card class="ion-padding">
        <ion-list v-if="editor" class="ion-no-padding">
          <ion-item>
          
              <ion-button expand="full" fill="outline" shape="round" color="primary" >
          <ion-icon slot="end" :icon="paperPlaneOutline"></ion-icon>
           <input
              type="file"
              accept="image/*"
              class="file"
            />
          <ion-label class="ion-text-center"> Seleccionar Imagen </ion-label>
        </ion-button>
           
          </ion-item>
          <ion-item>
            <ion-label position="floating">Valor:</ion-label>
            <ion-input type="number" v-model="pregunta.valor"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Visible</ion-label>
            <ion-toggle
              slot="end"
              :checked="pregunta.visible"
              v-model="pregunta.visible"
            >
            </ion-toggle>
          </ion-item>
          <ion-item>
            <ion-label>Disponible</ion-label>
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
        <button @click="mostrar()">console.log</button>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import { Editor, EditorContent } from "@tiptap/vue-3";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

import { ref } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

import {
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

import { arrowBackOutline, checkmarkOutline, imageOutline } from "ionicons/icons";

export default {
  components: {
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
    const mroute = useRoute();
    const { cuestionario } = mroute.params;
    const { id } = mroute.params;
    const editor = ref(null);

    const pregunta = ref({
      id: 0,
      cuestionario_id: 0,
    });

    onIonViewWillEnter(async () => {
      if (id != undefined) {
        await axios.get("/preguntas/" + id).then((response) => {
          pregunta.value = response.data;
          console.log(pregunta.value.disponible);
        });
      }

      if (cuestionario != undefined) {
        pregunta.value = {
          enunciado:
            "<h6><strong> Crea tu pregunta </strong></h6> <p> En esta sección <br> puedes crear tu pregunta </p>",
          photo: "",
          cuestionario_id: cuestionario,
          valor: "",
          visible: "",
          disponible: "",
        };
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
      mostrar() {
        console.log(pregunta.value.disponible);
      },
      pregunta,
      editor,
      arrowBackOutline,
      checkmarkOutline,
      imageOutline
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

.file{
  position: absolute;
  opacity: 0;
}

</style>



