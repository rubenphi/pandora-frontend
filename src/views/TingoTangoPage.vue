<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin/panel"></ion-back-button>
        </ion-buttons>
        <ion-title>Tingo Tango</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tingo Tango</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="container">
        <div 
          v-if="isPlaying" 
          class="countdown" 
          :style="{ backgroundColor: circleColor }"
        ></div>
        
        <ion-button 
          v-else 
          @click="startCountdown" 
          expand="block" 
          size="large"
          color="primary"
        >
          Iniciar
        </ion-button>

        <div v-if="!isPlaying" class="instructions ion-padding-top">
          <p>Presiona "Iniciar" para comenzar el juego.</p>
        </div>
      </div>

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
  IonButton,
} from "@ionic/vue";
import { defineComponent, ref, onBeforeUnmount } from "vue";

// Import audio files - MUEVE tus archivos MP3 a src/assets/audio/
// y descomenta estas líneas:
 import bipSound from '@/assets/audio/bip.mp3';
 import bongSound from '@/assets/audio/bong.mp3';

export default defineComponent({
  name: "TingoTangoPage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
  },
  setup() {
    const isPlaying = ref(false);
    const circleColor = ref("red");
    let intervalId = null;
    let bipAudio = null;
    let bongAudio = null;

    const randomTime = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const randomColor = () => {
      return "#" + Math.floor(Math.random() * 16777215).toString(16);
    };

    const playAudio = (audio) => {
      if (!audio) return;
      try {
        audio.currentTime = 0;
        audio.play().catch(e => {
          console.warn("Audio play interrupted or failed", e);
        });
      } catch (error) {
        console.error("Critical audio error", error);
      }
    };

    const stopAudio = (audio) => {
      if (!audio) return;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {
        console.error("Error stopping audio", error);
      }
    };

    const startCountdown = () => {
      // Initialize audio on first click
      if (!bipAudio) {
        bipAudio = new Audio();
        // Si moviste los archivos a src/assets/audio/, usa:
        bipAudio.src = bipSound;
        // Temporal: usa URLs de ejemplo o Web Audio API
      //  bipAudio = null; // Comentar cuando uses imports
      }
      
      if (!bongAudio) {
        bongAudio = new Audio();
        // Si moviste los archivos a src/assets/audio/, usa:
        bongAudio.src = bongSound;
        // Temporal: usa URLs de ejemplo o Web Audio API
      //  bongAudio = null; // Comentar cuando uses imports
      }
      
      isPlaying.value = true;
      circleColor.value = "red"; 
      
      let timeLeft = randomTime(7, 30);
      
      // Play the "Tingo" sound continuously (music/chant)
      if (bipAudio) {
        bipAudio.loop = true;
        playAudio(bipAudio);
      }

      if (intervalId) clearInterval(intervalId);

      intervalId = setInterval(() => {
        timeLeft--;
        circleColor.value = randomColor();
        // Removed repeated playAudio(bipAudio) to avoid stuttering

        if (timeLeft <= 0) {
          endGame();
        }
      }, 1000);
    };

    const endGame = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      stopAudio(bipAudio);
      playAudio(bongAudio);
      isPlaying.value = false;
    };

    onBeforeUnmount(() => {
      if (intervalId) clearInterval(intervalId);
      if (bipAudio) stopAudio(bipAudio);
      if (bongAudio) stopAudio(bongAudio);
    });

    return {
      isPlaying,
      circleColor,
      startCountdown
    };
  },
});
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh; 
  flex-direction: column;
}

.countdown {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background-color: red;
  transition: background-color 0.2s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.instructions {
  text-align: center;
  color: var(--ion-color-medium);
}
</style>