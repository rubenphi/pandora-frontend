<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" :href="'/grupo/' + usuario.grupo_id">
          <ion-icon :icon="peopleOutline" />
          <ion-label>Grupo</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/inicio">
          <ion-icon :icon="homeOutline" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/cuestionarios">
          <ion-icon :icon="helpCircleOutline" />
          <ion-label>Cuestionarios</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script>
import { usuarioGet } from "../globalService";

import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
  onIonViewWillEnter
} from "@ionic/vue";
import { helpCircleOutline, homeOutline, peopleOutline } from "ionicons/icons";

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
    let usuario = {
      grupo_id: 0
    };
  onIonViewWillEnter(() => {
        usuario = usuarioGet();
        console.log(usuario.grupo_id)
      });
    return {
      usuario,
      helpCircleOutline,
      homeOutline,
      peopleOutline
    };
  },
};
</script>
