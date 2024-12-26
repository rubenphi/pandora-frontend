<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button v-if="adminOProfesor" tab="tab1" href="/cursos">
          <ion-icon :icon="peopleOutline" />
          <ion-label>Grupos</ion-label>
        </ion-tab-button>

        <ion-tab-button v-else tab="tab1" href="/grupo">
          <ion-icon :icon="personOutline" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/inicio">
          <ion-icon :icon="homeOutline" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" v-if="adminOProfesor" href="/admin/panel">
          <ion-icon :icon="helpCircleOutline" />

          <ion-label>Panel</ion-label>
        </ion-tab-button>

        <ion-tab-button
          v-else
          tab="tab3"
          :href="'/areas/' + cursoEstudiante?.id"
        >
          <ion-icon :icon="helpCircleOutline" />

          <ion-label>Cuestionarios</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>
<script>
import { ref } from "vue";
import {
  IonTabBar,
  onIonViewWillEnter,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
} from "@ionic/vue";
import {
  helpCircleOutline,
  homeOutline,
  peopleOutline,
  personOutline,
} from "ionicons/icons";
import { adminOprofesor } from "../globalService";
export default {
  components: {
    IonLabel,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonPage,
    IonRouterOutlet,
  },
  setup() {
    const cursoEstudiante = ref();
    const adminOProfesor = ref();
    onIonViewWillEnter(async () => {
      const year = localStorage.getItem("year");

      adminOProfesor.value = adminOprofesor();
      cursoEstudiante.value = JSON.parse(
        localStorage.getItem("cursosUsuario")
      ).find((course) => course.year == year);
    });
    return {
      cursoEstudiante,
      adminOProfesor,
      helpCircleOutline,
      homeOutline,
      peopleOutline,
      personOutline,
    };
  },
};
</script>
