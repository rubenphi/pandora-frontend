<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script>
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  components: {
    IonApp,
    IonRouterOutlet,
  },
});
</script>

<style >

.ProseMirror:focus {
    outline: #92949c solid 1px;

  }

.ProseMirror {
    outline: #92949c solid 1px;

  }

</style>
