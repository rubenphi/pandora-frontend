<template>
a  <QuillEditor v-model:content="inputValue" content-type="html" theme="snow" />
b <QuillEditor v-model:content="inputValue" content-type="html" class="snow" />
</template>

<script>
  import {
    QuillEditor
  } from '@vueup/vue-quill'
  import '@vueup/vue-quill/dist/vue-quill.snow.css';
  import './theme/snow.css';
  import {
    defineComponent,
    ref
  } from 'vue'
  export default defineComponent({
    components: {
      QuillEditor,
    },
    setup() {
      const inputValue = ref('<h1>This is header</h1><p>This is paragraph</p>')
      return {
        inputValue,
        snow
      }
    },
  })
  </script>