<template>
  <div class="tiptap-wrapper">
    <div class="tiptap-toolbar" v-if="editor && editable">
      <ion-button
        size="small"
        color="light"
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        title="Negrita"
      >
        <b>B</b>
      </ion-button>
      <ion-button
        size="small"
        color="light"
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        title="Cursiva"
      >
        <i>I</i>
      </ion-button>
      <ion-button
        size="small"
        color="light"
        type="button"
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
        title="Tachado"
      >
        <s>S</s>
      </ion-button>
      <ion-button
        size="small"
        color="light"
        type="button"
        @click="editor.chain().focus().toggleCode().run()"
        :class="{ 'is-active': editor.isActive('code') }"
        title="Código en línea (`código`)"
      >
        <code>&lt;/&gt;</code>
      </ion-button>
      <ion-button
        size="small"
        color="light"
        type="button"
        @click="editor.chain().focus().toggleCodeBlock().run()"
        :class="{ 'is-active': editor.isActive('codeBlock') }"
        title="Bloque de código (```código```)"
      >
        <span class="code-block-btn">{ }</span>
      </ion-button>
      <ion-button
        size="small"
        color="light"
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        title="Lista con viñetas"
      >
        • Lista
      </ion-button>
      <ion-button
        size="small"
        color="light"
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        title="Lista numerada"
      >
        1. Lista
      </ion-button>
      <ion-button
        size="small"
        color="light"
        type="button"
        @click="insertTable"
        :class="{ 'is-active': editor.isActive('table') }"
        title="Insertar Tabla"
      >
        📊 Tabla
      </ion-button>
      <ion-button
        v-if="editor.isActive('table')"
        size="small"
        color="light"
        type="button"
        @click="editor.chain().focus().addColumnAfter().run()"
        title="Agregar Columna"
      >
        +Col
      </ion-button>
      <ion-button
        v-if="editor.isActive('table')"
        size="small"
        color="light"
        type="button"
        @click="editor.chain().focus().addRowAfter().run()"
        title="Agregar Fila"
      >
        +Fila
      </ion-button>
      <ion-button
        v-if="editor.isActive('table')"
        size="small"
        color="danger"
        type="button"
        @click="editor.chain().focus().deleteTable().run()"
        title="Eliminar Tabla"
      >
        Eliminar Tabla
      </ion-button>
    </div>
    <editor-content class="tiptap-content" :editor="editor" />
  </div>
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount, watch, shallowRef } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { IonButton } from "@ionic/vue";

export default defineComponent({
  name: "TiptapEditor",
  components: {
    EditorContent,
    IonButton,
  },
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    editable: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const editor = shallowRef(null);

    // Transform pasted text if it contains markdown code or markdown table syntax
    const parseMarkdown = (text) => {
      if (!text) return text;

      let result = text;

      // 1. Transform Markdown tables (| col | col |) into HTML <table>
      const tableRegex = /((?:\|[^\n]+\|\r?\n)+)/g;
      if (tableRegex.test(result)) {
        result = result.replace(tableRegex, (match) => {
          const lines = match.trim().split(/\r?\n/).filter((line) => line.trim().startsWith("|"));
          if (lines.length < 2) return match;

          let html = '<table><thead><tr>';
          const headers = lines[0].split("|").slice(1, -1).map((h) => h.trim());
          headers.forEach((h) => {
            html += `<th>${h}</th>`;
          });
          html += '</tr></thead><tbody>';

          const startIndex = /^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[1].trim()) ? 2 : 1;

          for (let i = startIndex; i < lines.length; i++) {
            html += '<tr>';
            const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
            cells.forEach((c) => {
              html += `<td>${c}</td>`;
            });
            html += '</tr>';
          }
          html += '</tbody></table>';
          return html;
        });
      }

      // 2. Transform ```code``` blocks
      if (result.includes("```")) {
        result = result.replace(/```(?:[a-zA-Z0-9_-]+)?\r?\n?([\s\S]*?)```/g, (match, codeContent) => {
          const safeCode = codeContent
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `<pre><code>${safeCode}</code></pre>`;
        });
      }

      // 3. Transform inline code `code`
      if (/`[^`]+`/.test(result)) {
        result = result.replace(/`([^`]+)`/g, (match, inlineCode) => {
          const safeInline = inlineCode
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `<code>${safeInline}</code>`;
        });
      }

      return result;
    };

    onMounted(() => {
      editor.value = new Editor({
        extensions: [
          StarterKit,
          Table.configure({
            resizable: true,
          }),
          TableRow,
          TableHeader,
          TableCell,
        ],
        content: props.modelValue,
        editable: props.editable,
        editorProps: {
          attributes: {
            class: "tiptap-editor-area",
          },
          transformPastedText(text) {
            return parseMarkdown(text);
          },
        },
        onUpdate: () => {
          emit("update:modelValue", editor.value.getHTML());
        },
      });
    });

    const insertTable = () => {
      if (editor.value) {
        editor.value
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      }
    };

    watch(
      () => props.modelValue,
      (value) => {
        if (editor.value && editor.value.getHTML() !== value) {
          editor.value.commands.setContent(value, false);
        }
      }
    );

    watch(
      () => props.editable,
      (editable) => {
        if (editor.value) {
          editor.value.setEditable(editable);
        }
      }
    );

    onBeforeUnmount(() => {
      if (editor.value) {
        editor.value.destroy();
      }
    });

    return {
      editor,
      insertTable,
    };
  },
});
</script>

<style scoped>
.tiptap-wrapper {
  width: 100%;
}
.tiptap-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 8px;
  background-color: var(--ion-color-light, #f4f5f8);
  border: 1px solid var(--ion-color-light-shade, #e0e0e0);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
}
.tiptap-toolbar ion-button {
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
}
.tiptap-toolbar ion-button.is-active {
  --background: var(--ion-color-primary, #3880ff);
  --color: #ffffff;
}
.code-block-btn {
  font-family: monospace;
  font-weight: bold;
}
.tiptap-content {
  min-height: 120px;
}
</style>
