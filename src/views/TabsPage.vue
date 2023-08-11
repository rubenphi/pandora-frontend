<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button
          v-if="adminOProfesor"
          tab="tab1"
          href="/cursos"
        >
          <ion-icon :icon="peopleOutline" />
          <ion-label>Grupos</ion-label>
        </ion-tab-button>

        <ion-tab-button v-else tab="tab1" href="/grupo">
          <ion-icon :icon="peopleOutline" />
          <ion-label>Grupo</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/inicio">
          <ion-icon :icon="homeOutline" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3"  v-if="usuario.rol === 'admin' || usuario.rol === 'director'"
          href="/admin/cuestionarios">
          <ion-icon :icon="helpCircleOutline" />

          <ion-label>Cuestionarios</ion-label>
        </ion-tab-button>

        <ion-tab-button v-else tab="tab3" :href="'/areas/' + usuario.curso_id">
          <ion-icon :icon="helpCircleOutline" />

          <ion-label>Cuestionarios</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>
<script>
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
} from "@ionic/vue";
import { helpCircleOutline, homeOutline, peopleOutline } from "ionicons/icons";
import { adminOprofesor, usuarioGet } from "../globalService";
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
    return {
      usuario: usuarioGet(),
      adminOProfesor: adminOprofesor(),
      helpCircleOutline,
      homeOutline,
      peopleOutline,
    };
  },
};
</script>
