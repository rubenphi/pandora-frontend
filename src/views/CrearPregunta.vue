<template>
  <QuillEditor :options="options" />
</template>

<script>
  import '@vueup/vue-quill/dist/vue-quill.core.css';
  import '@vueup/vue-quill/dist/vue-quill.snow.css';
  import {
    QuillEditor
  } from '@vueup/vue-quill'


  export default {
    components: {
      QuillEditor
    },
    data() {
      return {
        options: {
          debug: 'info',
          modules: {
            toolbar: ['bold',
              'italic',
              'underline']
          },
          placeholder: 'Compose an epic...',
          readOnly: true
        }
      }
    },
  }
  </script>