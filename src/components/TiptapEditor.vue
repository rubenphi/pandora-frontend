<template>
  <div class="tiptap-wrapper" :class="{ 'is-disabled': !editable }">
    <!-- Toolbar Queezy Bubbly -->
    <div v-if="editor && editable" class="tiptap-toolbar">
      <!-- Grupo Formato Básico -->
      <div class="qz-tool-group">
        <button
          type="button"
          class="qz-tool-btn"
          :class="{ 'is-active': editor.isActive('bold') }"
          title="Negrita (Ctrl+B)"
          @click="editor.chain().focus().toggleBold().run()"
        >
          <b>B</b>
        </button>
        <button
          type="button"
          class="qz-tool-btn"
          :class="{ 'is-active': editor.isActive('italic') }"
          title="Cursiva (Ctrl+I)"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          <i>I</i>
        </button>
        <button
          type="button"
          class="qz-tool-btn"
          :class="{ 'is-active': editor.isActive('strike') }"
          title="Tachado"
          @click="editor.chain().focus().toggleStrike().run()"
        >
          <s>S</s>
        </button>
      </div>

      <div class="qz-tool-divider"></div>

      <!-- Grupo Código -->
      <div class="qz-tool-group">
        <button
          type="button"
          class="qz-tool-btn qz-tool-btn--code"
          :class="{ 'is-active': editor.isActive('code') }"
          title="Código en línea (`código`)"
          @click="editor.chain().focus().toggleCode().run()"
        >
          <code>&lt;/&gt;</code>
        </button>
        <button
          type="button"
          class="qz-tool-btn qz-tool-btn--codeblock"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          title="Bloque de código (```código```)"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        >
          <span>{ }</span>
        </button>
      </div>

      <div class="qz-tool-divider"></div>

      <!-- Grupo Listas -->
      <div class="qz-tool-group">
        <button
          type="button"
          class="qz-tool-btn"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          title="Lista con viñetas"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          <span>• Lista</span>
        </button>
        <button
          type="button"
          class="qz-tool-btn"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          title="Lista numerada"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <span>1. Lista</span>
        </button>
      </div>

      <div class="qz-tool-divider"></div>

      <!-- Grupo Tablas -->
      <div class="qz-tool-group">
        <button
          type="button"
          class="qz-tool-btn qz-tool-btn--table"
          :class="{ 'is-active': editor.isActive('table') }"
          title="Insertar Tabla"
          @click="insertTable"
        >
          <span>📊 Tabla</span>
        </button>
        <template v-if="editor.isActive('table')">
          <button
            type="button"
            class="qz-tool-btn qz-tool-btn--chip"
            title="Agregar Columna"
            @click="editor.chain().focus().addColumnAfter().run()"
          >
            +Col
          </button>
          <button
            type="button"
            class="qz-tool-btn qz-tool-btn--chip"
            title="Agregar Fila"
            @click="editor.chain().focus().addRowAfter().run()"
          >
            +Fila
          </button>
          <button
            type="button"
            class="qz-tool-btn qz-tool-btn--danger"
            title="Eliminar Tabla"
            @click="editor.chain().focus().deleteTable().run()"
          >
            ✕ Tabla
          </button>
        </template>
      </div>
    </div>

    <!-- Área de Edición de Contenido -->
    <editor-content class="tiptap-content" :editor="editor" />
  </div>
</template>

<script>
import {
  defineComponent,
  onMounted,
  onBeforeUnmount,
  watch,
  shallowRef,
} from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";

export default defineComponent({
  name: "TiptapEditor",
  components: {
    EditorContent,
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
          const lines = match
            .trim()
            .split(/\r?\n/)
            .filter((line) => line.trim().startsWith("|"));
          if (lines.length < 2) return match;

          let html = "<table><thead><tr>";
          const headers = lines[0]
            .split("|")
            .slice(1, -1)
            .map((h) => h.trim());
          headers.forEach((h) => {
            html += `<th>${h}</th>`;
          });
          html += "</tr></thead><tbody>";

          const startIndex = /^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[1].trim())
            ? 2
            : 1;

          for (let i = startIndex; i < lines.length; i++) {
            html += "<tr>";
            const cells = lines[i]
              .split("|")
              .slice(1, -1)
              .map((c) => c.trim());
            cells.forEach((c) => {
              html += `<td>${c}</td>`;
            });
            html += "</tr>";
          }
          html += "</tbody></table>";
          return html;
        });
      }

      // 2. Transform ```code``` blocks
      if (result.includes("```")) {
        result = result.replace(
          /```(?:[a-zA-Z0-9_-]+)?\r?\n?([\s\S]*?)```/g,
          (match, codeContent) => {
            const safeCode = codeContent
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
            return `<pre><code>${safeCode}</code></pre>`;
          }
        );
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
/* ==========================================================================
   1. CONTENEDOR PRINCIPAL QUEEZY BUBBLY
   ========================================================================== */
.tiptap-wrapper {
  width: 100%;
  background: #ffffff;
  border: 1.5px solid var(--qz-color-border, #e6e6e6);
  border-radius: var(--qz-radius-xl, 24px);
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(12, 9, 42, 0.03);
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.tiptap-wrapper:focus-within {
  border-color: var(--qz-color-purple-primary, #6a5ae0);
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.15),
    0 8px 24px rgba(106, 90, 224, 0.08);
}

.tiptap-wrapper.is-disabled {
  opacity: 0.65;
  background-color: #fafafc;
  pointer-events: none;
}

/* ==========================================================================
   2. TOOLBAR FLOTANTE CON FONDOS LAVANDA Y BOTONES SQUIRCLE
   ========================================================================== */
.tiptap-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #f8f7fd;
  border-bottom: 1.5px solid #eceaf8;
  user-select: none;
}

.qz-tool-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.qz-tool-divider {
  width: 1.5px;
  height: 20px;
  background-color: #e1def5;
  margin: 0 4px;
  border-radius: 9999px;
  flex-shrink: 0;
}

/* Botón individual de herramienta */
.qz-tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  min-width: 34px;
  padding: 0 8px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--qz-color-text-muted, #5a5874);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.qz-tool-btn:hover {
  background-color: var(--qz-color-purple-bg, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-tool-btn:active {
  transform: scale(0.93);
}

/* Estado activo / seleccionado */
.qz-tool-btn.is-active {
  background-color: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  border-color: var(--qz-color-purple-primary, #6a5ae0);
  box-shadow: 0 3px 8px rgba(106, 90, 224, 0.28);
}

.qz-tool-btn--code code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  font-weight: 700;
}

.qz-tool-btn--codeblock span {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  font-weight: 700;
}

/* Chips específicos de tablas */
.qz-tool-btn--chip {
  background-color: #ffffff;
  border: 1px solid #e1def5;
  color: var(--qz-color-purple-primary, #6a5ae0);
  font-size: 11px;
  font-weight: 700;
  padding: 0 8px;
  height: 28px;
}

.qz-tool-btn--chip:hover {
  background-color: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
}

.qz-tool-btn--danger {
  background-color: var(--qz-color-red-bg, #feecec);
  border: 1px solid var(--qz-color-red-wrong, #ff5656);
  color: var(--qz-color-red-wrong, #ff5656);
  font-size: 11px;
  font-weight: 700;
  padding: 0 8px;
  height: 28px;
}

.qz-tool-btn--danger:hover {
  background-color: var(--qz-color-red-wrong, #ff5656);
  color: #ffffff;
}

/* ==========================================================================
   3. ÁREA DE CONTENIDO TIPTAP
   ========================================================================== */
.tiptap-content {
  flex: 1;
  min-height: 140px;
  cursor: text;
  display: flex;
  flex-direction: column;
}
</style>

<style>
/* ==========================================================================
   4. ESTILOS GLOBALES PROFUNDOS PARA EL CONTENIDO INTERIOR (.tiptap-editor-area)
   Se aplican a TiptapEditor en CrearPregunta, CrearActividad y CrearMaterial
   ========================================================================== */
.tiptap-editor-area {
  padding: 16px 20px;
  min-height: 140px;
  outline: none !important;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 15px;
  line-height: 1.55;
  color: var(--qz-color-text-main, #0c092a);
  text-align: left;
  box-sizing: border-box;
}

.tiptap-editor-area p {
  margin: 0 0 10px 0;
}

.tiptap-editor-area p:last-child {
  margin-bottom: 0;
}

.tiptap-editor-area h1,
.tiptap-editor-area h2,
.tiptap-editor-area h3,
.tiptap-editor-area h4,
.tiptap-editor-area h5,
.tiptap-editor-area h6 {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  margin: 14px 0 8px 0;
}

.tiptap-editor-area h1 {
  font-size: 22px;
}

.tiptap-editor-area h2 {
  font-size: 19px;
}

.tiptap-editor-area h3 {
  font-size: 17px;
}

.tiptap-editor-area h6 {
  font-size: 13px;
  color: var(--qz-color-purple-primary, #6a5ae0);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Listas con viñetas y ordenadas */
.tiptap-editor-area ul,
.tiptap-editor-area ol {
  padding-left: 24px;
  margin: 8px 0 12px 0;
}

.tiptap-editor-area li {
  margin-bottom: 4px;
}

/* Bloques de código y código inline */
.tiptap-editor-area code {
  background-color: rgba(106, 90, 224, 0.09);
  color: #5a33d6;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  padding: 0.2em 0.45em;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
}

.tiptap-editor-area pre {
  background-color: #0c092a;
  color: #efeefc;
  padding: 14px 16px;
  border-radius: 14px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tiptap-editor-area pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

/* Tablas formateadas con estilo Queezy */
.tiptap-editor-area table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  margin: 16px 0;
  border-radius: 14px;
  overflow: hidden;
  border: 1.5px solid #e1def5;
  box-shadow: 0 2px 8px rgba(12, 9, 42, 0.02);
}

.tiptap-editor-area th {
  background-color: var(--qz-color-purple-bg, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
  font-weight: 700;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1.5px solid #e1def5;
  font-size: 14px;
}

.tiptap-editor-area td {
  padding: 10px 14px;
  border-bottom: 1px solid #f0eefb;
  color: var(--qz-color-text-main, #0c092a);
  font-size: 14px;
}

.tiptap-editor-area tr:last-child td {
  border-bottom: none;
}

/* Celda seleccionada en la tabla */
.tiptap-editor-area .selectedCell:after {
  background: rgba(106, 90, 224, 0.12);
  content: "";
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}

.tiptap-editor-area table td,
.tiptap-editor-area table th {
  position: relative;
}
</style>
