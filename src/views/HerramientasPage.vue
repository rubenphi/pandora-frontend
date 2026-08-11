<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin/panel"></ion-back-button>
        </ion-buttons>
        <ion-title>Herramientas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Herramientas</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-grid>
        <ion-row>
          <ion-col size="12" size-md="6">
            <ion-card
              @click="navigateTo('/herramientas/tingo-tango')"
              class="tool-card"
            >
              <ion-card-content class="tool-content">
                <ion-icon
                  :icon="timeOutline"
                  class="tool-icon"
                  color="primary"
                ></ion-icon>
                <ion-label>
                  <h2>Tingo Tango</h2>
                  <p>Juego de selección aleatoria</p>
                </ion-label>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="6">
            <ion-card
              @click="navigateTo('/herramientas/ruleta')"
              class="tool-card"
            >
              <ion-card-content class="tool-content">
                <ion-icon
                  :icon="discOutline"
                  class="tool-icon"
                  color="primary"
                ></ion-icon>
                <ion-label>
                  <h2>Ruleta</h2>
                  <p>Selección de estudiantes al azar</p>
                </ion-label>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="6">
            <ion-card @click="navigateTo('/encuestas')" class="tool-card">
              <ion-card-content class="tool-content">
                <ion-icon
                  :icon="barChartOutline"
                  class="tool-icon"
                  color="tertiary"
                ></ion-icon>
                <ion-label>
                  <h2>Encuestas</h2>
                  <p>Crea y gestiona encuestas para tu curso</p>
                </ion-label>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="6" v-if="wikipediaAvailable">
            <ion-card @click="openExternal(wikipediaUrl)" class="tool-card">
              <ion-card-content class="tool-content">
                <ion-icon
                  :icon="libraryOutline"
                  class="tool-icon"
                  color="primary"
                ></ion-icon>
                <ion-label>
                  <h2>Wikipedia</h2>
                  <p>Visor offline de Wikipedia</p>
                </ion-label>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="6" v-if="modelsAvailable">
            <ion-card @click="openExternal(modelsUrl)" class="tool-card">
              <ion-card-content class="tool-content">
                <ion-icon
                  :icon="hardwareChipOutline"
                  class="tool-icon"
                  color="primary"
                ></ion-icon>
                <ion-label>
                  <h2>IA</h2>
                  <p>Modelo de IA configurado para la clase</p>
                </ion-label>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonIcon,
  IonLabel,
} from "@ionic/vue";
import { defineComponent, ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  timeOutline,
  discOutline,
  barChartOutline,
  libraryOutline,
  hardwareChipOutline,
} from "ionicons/icons";

export default defineComponent({
  name: "HerramientasPage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonIcon,
    IonLabel,
  },
  setup() {
    const router = useRouter();
    const wikipediaAvailable = ref(false);
    const modelsAvailable = ref(false);

    const checkServiceAvailability = async (url) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch(url, {
          signal: controller.signal,
          mode: "no-cors",
        });
        clearTimeout(timeoutId);
        return true;
      } catch {
        return false;
      }
    };

    const checkServices = async () => {
      const hostname = window.location.hostname;
      wikipediaAvailable.value = await checkServiceAvailability(
        `http://${hostname}:8080/`,
      );
      modelsAvailable.value = await checkServiceAvailability(
        `http://${hostname}:8081/api/v1/models`,
      );
    };

    onMounted(() => {
      checkServices();
    });

    const navigateTo = (path) => {
      router.push(path);
    };

    const openExternal = (url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    };

    const wikipediaUrl = computed(() => {
      const hostname = window.location.hostname;
      return `http://${hostname}:8080/viewer#wiki-es/Wikipedia%3AOffline`;
    });

    const modelsUrl = computed(() => {
      const hostname = window.location.hostname;
      return `http://${hostname}:8081`;
    });

    return {
      timeOutline,
      discOutline,
      barChartOutline,
      libraryOutline,
      hardwareChipOutline,
      wikipediaAvailable,
      modelsAvailable,
      wikipediaUrl,
      modelsUrl,
      navigateTo,
      openExternal,
    };
  },
});
</script>

<style scoped>
.tool-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.tool-card:active {
  transform: scale(0.98);
}

.tool-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tool-icon {
  font-size: 32px;
  min-width: 32px;
}

ion-label h2 {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 4px;
}

ion-label p {
  color: var(--ion-color-medium);
  font-size: 0.9em;
}
</style>
