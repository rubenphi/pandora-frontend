<template>
  <div id="editor">
    <p>
      Hello World!
    </p>
    <p>
      Some initial <strong>bold</strong> text
    </p>
    <p>
      <br>
    </p>
  </div>

</template>

<script>

  import '../theme/snow.css';
  import '../quill.js'
  export default defineComponent({},
    setup() {
      var quill = new Quill('#editor', {
        theme: 'snow'
      });
      return {}
  })
</script>