<template>
  <ion-app>
    <ion-router-outlet />
    <ion-toast
      :is-open="courseAccessNotice !== ''"
      :message="courseAccessNotice"
      :duration="4000"
      position="top"
      color="danger"
      @did-dismiss="clearCourseAccessNotice"
    ></ion-toast>
  </ion-app>
</template>

<script>
import { IonApp, IonRouterOutlet, IonToast } from "@ionic/vue";
import { defineComponent } from "vue";
import { courseAccessNotice, clearCourseAccessNotice } from "./courseAccessService";

export default defineComponent({
  name: "App",
  components: {
    IonApp,
    IonRouterOutlet,
    IonToast,
  },
  setup() {
    return { courseAccessNotice, clearCourseAccessNotice };
  },
});
</script>

<style>

.ProseMirror:focus {
    outline: #92949c solid 1px;
}

.ProseMirror {
    outline: #92949c solid 1px;
    min-height: 120px;
    padding: 10px;
    border-radius: 0 0 6px 6px;
}

code {
  background-color: rgba(135, 131, 120, 0.15);
  color: #eb5757;
  font-family: monospace, monospace;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}

pre {
  background-color: #282c34;
  color: #abb2bf;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.8em 0;
}

pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: 0.9em;
}

table {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
  table-layout: auto;
}

th, td {
  border: 1px solid #d7d8da;
  padding: 8px 12px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
  text-align: left;
}

th {
  font-weight: bold;
  background-color: #f4f5f8;
  color: #222428;
}

.selectedCell:after {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(200, 200, 255, 0.4);
  pointer-events: none;
}

/* Modo oscuro global para tablas y contenido tipográfico */
body.dark th,
html.dark th,
.dark th {
  background-color: #28214b;
  color: #f7f7fd;
}

body.dark th,
body.dark td,
html.dark th,
html.dark td,
.dark th,
.dark td {
  border-color: rgba(255, 255, 255, 0.12);
  color: #f7f7fd;
}

body.dark .selectedCell:after,
html.dark .selectedCell:after,
.dark .selectedCell:after {
  background: rgba(124, 110, 242, 0.28);
}

@media (prefers-color-scheme: dark) {
  body:not(.light) th {
    background-color: #28214b;
    color: #f7f7fd;
  }

  body:not(.light) th,
  body:not(.light) td {
    border-color: rgba(255, 255, 255, 0.12);
    color: #f7f7fd;
  }

  body:not(.light) .selectedCell:after {
    background: rgba(124, 110, 242, 0.28);
  }
}
</style>
