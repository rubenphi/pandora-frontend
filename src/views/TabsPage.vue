<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" >
          <a href="/login">
          <ion-icon :icon="peopleOutline" />
          <ion-label>Grupo</ion-label></a>
        </ion-tab-button>
        
          <ion-tab-button tab="tab2" >
            <a href="/inicio">
          <ion-icon :icon="homeOutline" />
          <ion-label>Inicio</ion-label>
          </a>
        </ion-tab-button>
        
       <ion-tab-button tab="tab3">
          <a href="/cuestionarios">
          <ion-icon :icon="helpCircleOutline" />
          <ion-label>Cuestionarios</ion-label>
          </a>
        </ion-tab-button>
        
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script>
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { helpCircleOutline ,homeOutline, peopleOutline } from 'ionicons/icons';

export default {
  components: { IonLabel, IonTabs, IonTabBar, IonTabButton, IonIcon, IonPage, IonRouterOutlet },
  setup() {
    return {
      helpCircleOutline,
      homeOutline,
      peopleOutline
    }
  }
}
</script>