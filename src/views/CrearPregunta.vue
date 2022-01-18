<template>
  <ion-page>
    <ion-content>
      <ion-card class="ion-padding">
        <ion-list v-if="editor" class="ion-no-padding">
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
              @click="editor.chain().focus().setUnderline().run()"
              :class="{ 'is-active': editor.isActive('underline') }"
            >
              <u> S </u>
            </ion-button>
          </ion-item>
          <!--
        <button
          
         
        >
          bold
        </button>
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
        >
          italic
        </button>
        <button
          
        >
          strike
        </button>
        <button
          @click="editor.chain().focus().setUnderline().run()"
          :class="{ 'is-active': editor.isActive('underline') }"
        >
          Underline
        </button>
        <button @click="mostrar()">mostrar</button>
        -->
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
import {
  IonPage,
  IonContent,
  IonCard,
  IonList,
  IonItem,
  IonButton,
} from "@ionic/vue";

export default {
  components: {
    IonList,
    IonItem,
    IonButton,
    EditorContent,
    IonPage,
    IonContent,
    IonCard,
  },

  data() {
    return {
      editor: null,
    };
  },

  mounted() {
    this.editor = new Editor({
      extensions: [StarterKit, Underline],
      autofocus: "start",
      editable: true,
      content:
        "<h6><strong> Crea tu pregunta </strong></h6> <p> En esta sección <br> puedes crear tu pregunta </p>",
      editorProps: {
        attributes: {
          class: "",
        },
      },
    });
  },

  beforeUnmount() {
    this.editor.destroy();
  },
  methods: {
    mostrar() {
      console.log(this.editor.getHTML());
    },
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
</style>



