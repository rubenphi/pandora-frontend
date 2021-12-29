<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button href="/cuestionario">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button href="/">
            <ion-icon :icon="eyeOutline"></ion-icon>
            <ion-note>Ver Resultados</ion-note>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card>
        <ion-card-header>
          <ion-card-title class="ion-text-center"
            >1. Primera Pregunta</ion-card-title
          >
        </ion-card-header>
      </ion-card>
      <ion-card>
        <ion-img
          src="https://s1.significados.com/foto/897px-eugene-delacroix-le-28-juillet.-la-liberte-guidant-le-peuple_bg.jpg"
        ></ion-img>
      </ion-card>
      <ion-card>
        <ion-card-content>
          El Romanticismo es un movimiento cultural que se originó en Alemania y
          en Reino Unido a finales del siglo XVIII como una reacción
          revolucionaria contra la Ilustración y el Neoclasicismo, confiriendo
          prioridad a los sentimientos. Es considerado como el primer movimiento
          de cultura que cubrió el mapa completo de Europa. En la mayoría de las
          áreas estuvo en su apogeo en el período aproximado de 1800 a 1850.
          Luego, cedió su lugar al positivismo, que fomenta el pensamiento
          crítico y el empirismo como bases del conocimiento y la sociedad.
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-list>
          <ion-radio-group value="biff">
            <ion-list-header>
              <ion-label>Selecciona una respuesta</ion-label>
            </ion-list-header>

            <ion-item>
              <ion-label class="ion-text-wrap"
                >Demasiada información completa para poder rellenar más de una
                línea, la idea es probar que esto funciona</ion-label
              >
              <ion-radio slot="start" value="biff"></ion-radio>
            </ion-item>

            <ion-item>
              <ion-label class="ion-text-wrap"
                >Demasiada información completa para poder rellenar más de una
                línea, la idea es probar que esto funciona</ion-label
              >
              <ion-radio slot="start" value="griff"></ion-radio>
            </ion-item>

            <ion-item>
              <ion-label class="ion-text-wrap"
                >Demasiada información completa para poder rellenar más de una
                línea, la idea es probar que esto funciona</ion-label
              >
              <ion-radio slot="start" value="buford"></ion-radio>
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap"
                >Demasiada información completa para poder rellenar más de una
                línea, la idea es probar que esto funciona</ion-label
              >
              <ion-radio slot="start" value="buford"></ion-radio>
            </ion-item>
          </ion-radio-group>
        </ion-list>

        <ion-item> </ion-item>
      </ion-card>

      <ion-buttons slot="secondary">
      <ion-button>
        <ion-icon slot="end" :icon="paperPlaneOutline"></ion-icon>
        <ion-label class="ion-text-center">
          Enviar Respuesta
        </ion-label>
      </ion-button>
      </ion-buttons>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  eyeOutline,
  paperPlaneOutline
} from "ionicons/icons";

import {
  IonIcon,
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonCard,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonNote,
  IonRadio,
  IonRadioGroup
} from "@ionic/vue";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonContent,
    IonPage,
    IonIcon,
    IonButtons,
    IonButton,
    IonCard,
    IonCardTitle,
    IonCardContent,
    IonImg,
    IonNote,
    IonRadioGroup,
    IonRadio
  },
  setup() {
    return {
      arrowBackOutline,
      handLeftOutline,
      refreshOutline,
      eyeOutline,
      paperPlaneOutline
    };
  },
};
</script>
