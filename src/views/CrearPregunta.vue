<template>
<div id="editor">
  <p>Hello World!</p>
  <p>Some initial <strong>bold</strong> text</p>
  <p><br></p>
</div>

</template>

<script>
  
  import '../theme/snow.css';
  import '../quill.js'
  import {
    defineComponent,
    ref
  } from 'vue'
  export default defineComponent({
    components: {
    },
    setup() {
var quill = new Quill('#editor', {
    theme: 'snow'
  });
      return {
        inputValue
      }
    },
  })
  </script>