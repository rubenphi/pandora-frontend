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
            <ion-card @click="navigateTo('//herramientas/tingo-tango')" class="tool-card">
              <ion-card-content class="tool-content">
                <ion-icon :icon="timeOutline" class="tool-icon" color="primary"></ion-icon>
                <ion-label>
                  <h2>Tingo Tango</h2>
                  <p>Juego de selección aleatoria</p>
                </ion-label>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="6">
            <ion-card @click="navigateTo('//herramientas/ruleta')" class="tool-card">
              <ion-card-content class="tool-content">
                <ion-icon :icon="discOutline" class="tool-icon" color="secondary"></ion-icon>
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
                <ion-icon :icon="barChartOutline" class="tool-icon" color="tertiary"></ion-icon>
                <ion-label>
                  <h2>Encuestas</h2>
                  <p>Crea y gestiona encuestas para tu curso</p>
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
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { timeOutline, discOutline, barChartOutline } from "ionicons/icons";

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

    const navigateTo = (path) => {
      router.push(path);
    };

    return {
      timeOutline,
      discOutline,
      barChartOutline,
      navigateTo,
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
