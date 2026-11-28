import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import { initializeBaseUrl, tokenHeader } from "./globalService";
initializeBaseUrl();
tokenHeader();

// Asegurar que todas las peticiones axios incluyan siempre el token de autenticación
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !config.headers["Authorization"] && !config.headers["authorization"]) {
    config.headers["Authorization"] = token;
  }
  return config;
});

import { IonicVue } from "@ionic/vue";

/* Core CSS required for Ionic components to work properly */
import "@ionic/vue/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/vue/css/padding.css";
import "@ionic/vue/css/float-elements.css";
import "@ionic/vue/css/text-alignment.css";
import "@ionic/vue/css/text-transformation.css";
import "@ionic/vue/css/flex-utils.css";
import "@ionic/vue/css/display.css";

/* Theme variables and Queezy UI design system */
import "./theme/variables.css";
import "./theme/queezy-ui.css";

/* Queezy Global UI Components */
import QzButton from "./components/common/QzButton.vue";
import QzSelect from "./components/common/QzSelect.vue";
import QzFilterPill from "./components/common/QzFilterPill.vue";
import QzDatePicker from "./components/common/QzDatePicker.vue";

const app = createApp(App).use(IonicVue).use(router);

app.component("QzButton", QzButton);
app.component("QzSelect", QzSelect);
app.component("QzFilterPill", QzFilterPill);
app.component("QzDatePicker", QzDatePicker);
app.component("QueezyButton", QzButton);

router.isReady().then(() => {
  app.mount("#app");
});
