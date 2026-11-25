<template>
  <ion-page class="ion-page qz-tingo-page">
    <ion-content :fullscreen="true" class="qz-tingo-content">
      <div class="qz-tingo-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top">
              <div class="qz-hero-top-left">
                <button
                  type="button"
                  class="qz-back-btn"
                  title="Volver a herramientas"
                  aria-label="Volver"
                  @click="goBack"
                >
                  <ion-icon :icon="arrowBackOutline"></ion-icon>
                </button>
                <span class="qz-hero-tag">JUEGO DE AULA</span>
              </div>

              <button
                type="button"
                class="qz-sound-btn"
                :class="{ 'is-muted': isMuted }"
                :title="isMuted ? 'Activar sonido' : 'Silenciar sonido'"
                :aria-label="isMuted ? 'Activar sonido' : 'Silenciar sonido'"
                @click="toggleMute"
              >
                <ion-icon
                  :icon="isMuted ? volumeMuteOutline : volumeHighOutline"
                ></ion-icon>
                <span>{{ isMuted ? "Silencio" : "Sonido" }}</span>
              </button>
            </div>

            <h1 class="qz-hero-title">Tingo Tango</h1>
            <p class="qz-hero-subtitle">
              Pasa el objeto al ritmo del Tingo hasta que caiga el ¡Tango!
            </p>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-tingo-body">
          <div class="qz-card qz-tingo-card">
            <!-- ESTADO 1: INICIAL -->
            <template v-if="!isPlaying && !hasEnded">
              <div class="qz-stage qz-stage--idle">
                <span class="qz-preview-word">TINGO</span>
                <p class="qz-stage-hint">
                  Elige la duración de la ronda y presiona Iniciar
                </p>
              </div>

              <div class="qz-duration-section">
                <span class="qz-section-label">Duración de la ronda</span>
                <div class="qz-duration-pills">
                  <button
                    v-for="preset in durationPresets"
                    :key="preset.id"
                    type="button"
                    class="qz-duration-pill"
                    :class="{ 'is-active': selectedPresetId === preset.id }"
                    @click="selectedPresetId = preset.id"
                  >
                    <span class="qz-pill-title">{{ preset.label }}</span>
                    <span class="qz-pill-range">{{ preset.rangeText }}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                class="qz-btn-primary"
                @click="startCountdown"
              >
                <ion-icon :icon="playOutline"></ion-icon>
                <span>Iniciar Ronda</span>
              </button>
            </template>

            <!-- ESTADO 2: JUGANDO (PALABRA TINGO PULSANTE) -->
            <template v-else-if="isPlaying">
              <div class="qz-stage qz-stage--playing">
                <span v-if="isPaused" class="qz-paused-pill">EN PAUSA</span>

                <div
                  class="qz-tingo-word"
                  :class="{
                    'is-pulsing': !isPaused && pulseBeat,
                    'is-fast': !isPaused && isFinalStretch,
                    'is-paused': isPaused,
                  }"
                  :style="{
                    color: activeColor,
                    '--pulse-ms': `${pulseTransitionMs}ms`,
                  }"
                >
                  TINGO
                </div>
              </div>

              <div class="qz-live-controls">
                <button
                  type="button"
                  class="qz-btn-outline"
                  @click="togglePause"
                >
                  <ion-icon
                    :icon="isPaused ? playOutline : pauseOutline"
                  ></ion-icon>
                  <span>{{ isPaused ? "Reanudar" : "Pausar" }}</span>
                </button>

                <button
                  type="button"
                  class="qz-btn-tango-now"
                  @click="endGame"
                >
                  <ion-icon :icon="flashOutline"></ion-icon>
                  <span>¡Tango ahora!</span>
                </button>
              </div>

              <button
                type="button"
                class="qz-btn-stop"
                @click="cancelGame"
              >
                <ion-icon :icon="stopOutline"></ion-icon>
                <span>Detener ronda</span>
              </button>
            </template>

            <!-- ESTADO 3: CLÍMAX FINAL (¡TANGO!) -->
            <template v-else>
              <div class="qz-stage qz-stage--ended">
                <span class="qz-tango-badge">¡TIEMPO CUMPLIDO!</span>
                <div class="qz-tango-word">¡TANGO!</div>
                <p class="qz-stage-hint">
                  Quien tenga el objeto cumple la actividad asignada
                </p>
              </div>

              <div class="qz-duration-section">
                <span class="qz-section-label">Duración próxima ronda</span>
                <div class="qz-duration-pills">
                  <button
                    v-for="preset in durationPresets"
                    :key="preset.id"
                    type="button"
                    class="qz-duration-pill"
                    :class="{ 'is-active': selectedPresetId === preset.id }"
                    @click="selectedPresetId = preset.id"
                  >
                    <span class="qz-pill-title">{{ preset.label }}</span>
                    <span class="qz-pill-range">{{ preset.rangeText }}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                class="qz-btn-primary"
                @click="startCountdown"
              >
                <ion-icon :icon="refreshOutline"></ion-icon>
                <span>Nueva Ronda</span>
              </button>
            </template>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import { defineComponent, ref, computed, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import {
  arrowBackOutline,
  playOutline,
  pauseOutline,
  stopOutline,
  refreshOutline,
  flashOutline,
  volumeHighOutline,
  volumeMuteOutline,
} from "ionicons/icons";
import bipSound from "@/assets/audio/bip.mp3";
import bongSound from "@/assets/audio/bong.mp3";

const QUEEZY_PALETTE = [
  "#6a5ae0",
  "#ff8fa2",
  "#ffae33",
  "#2cb67d",
  "#00a8cc",
  "#9087e5",
  "#ff5656",
];

const DURATION_PRESETS = [
  { id: "short", label: "Corto", rangeText: "5–12 s", min: 5, max: 12 },
  { id: "normal", label: "Normal", rangeText: "10–25 s", min: 10, max: 25 },
  { id: "long", label: "Largo", rangeText: "20–45 s", min: 20, max: 45 },
];

export default defineComponent({
  name: "TingoTangoPage",
  components: {
    IonPage,
    IonContent,
    IonIcon,
  },
  setup() {
    const router = useRouter();

    const isPlaying = ref(false);
    const isPaused = ref(false);
    const hasEnded = ref(false);
    const isMuted = ref(false);
    const selectedPresetId = ref("normal");
    const activeColor = ref(QUEEZY_PALETTE[0]);
    const pulseBeat = ref(false);
    const isFinalStretch = ref(false);
    const pulseTransitionMs = ref(220);

    let beatTimeoutId = null;
    let pulseTimeoutId = null;
    let totalDurationMs = 0;
    let remainingMs = 0;
    let lastTickAt = 0;
    let colorIndex = 0;
    let bipAudio = null;
    let bongAudio = null;

    const currentPreset = computed(
      () =>
        DURATION_PRESETS.find((p) => p.id === selectedPresetId.value) ||
        DURATION_PRESETS[1],
    );

    const randomTime = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const nextQueezyColor = () => {
      let nextIdx = Math.floor(Math.random() * QUEEZY_PALETTE.length);
      if (nextIdx === colorIndex) {
        nextIdx = (nextIdx + 1) % QUEEZY_PALETTE.length;
      }
      colorIndex = nextIdx;
      return QUEEZY_PALETTE[nextIdx];
    };

    const ensureAudioInitialized = () => {
      if (!bipAudio) {
        bipAudio = new Audio(bipSound);
        bipAudio.loop = true;
      }
      if (!bongAudio) {
        bongAudio = new Audio(bongSound);
      }
    };

    const playAudio = (audio) => {
      if (!audio || isMuted.value) return;
      try {
        audio.currentTime = 0;
        audio.play().catch((e) => {
          console.warn("Audio play interrupted or failed", e);
        });
      } catch (error) {
        console.error("Critical audio error", error);
      }
    };

    const pauseAudio = (audio) => {
      if (!audio) return;
      try {
        audio.pause();
      } catch (error) {
        console.error("Error pausing audio", error);
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

    const triggerPulse = (beatDelayMs = 780) => {
      const holdMs = Math.max(70, Math.round(beatDelayMs * 0.42));
      pulseTransitionMs.value = Math.max(75, Math.round(beatDelayMs * 0.35));
      pulseBeat.value = true;
      if (pulseTimeoutId) clearTimeout(pulseTimeoutId);
      pulseTimeoutId = setTimeout(() => {
        pulseBeat.value = false;
      }, holdMs);
    };

    const clearTimers = () => {
      if (beatTimeoutId) {
        clearTimeout(beatTimeoutId);
        beatTimeoutId = null;
      }
      if (pulseTimeoutId) {
        clearTimeout(pulseTimeoutId);
        pulseTimeoutId = null;
      }
    };

    const getCurrentBeatDelay = () => {
      if (totalDurationMs <= 0) return 780;
      const progress = Math.min(
        1,
        Math.max(0, 1 - remainingMs / totalDurationMs),
      );
      // Arranca en 780 ms y acelera progresivamente hasta 160 ms cerca del ¡TANGO!
      return Math.round(780 - 620 * Math.pow(progress, 1.35));
    };

    const updateAudioPlaybackRate = () => {
      if (!bipAudio || totalDurationMs <= 0) return;
      const progress = Math.min(
        1,
        Math.max(0, 1 - remainingMs / totalDurationMs),
      );
      try {
        bipAudio.playbackRate = Number(
          (1 + 0.45 * Math.pow(progress, 1.35)).toFixed(2),
        );
      } catch {
        // Ignore if playbackRate adjustment is unsupported
      }
    };

    const scheduleNextBeat = () => {
      if (!isPlaying.value || isPaused.value) return;

      const delay = Math.min(getCurrentBeatDelay(), Math.max(80, remainingMs));
      lastTickAt = Date.now();

      beatTimeoutId = setTimeout(() => {
        if (!isPlaying.value || isPaused.value) return;

        const elapsed = Date.now() - lastTickAt;
        remainingMs = Math.max(0, remainingMs - elapsed);

        if (remainingMs <= 0) {
          endGame();
          return;
        }

        const progress = 1 - remainingMs / totalDurationMs;
        isFinalStretch.value = progress >= 0.72;
        activeColor.value = nextQueezyColor();
        updateAudioPlaybackRate();

        const nextDelay = getCurrentBeatDelay();
        triggerPulse(nextDelay);
        scheduleNextBeat();
      }, delay);
    };

    const startCountdown = () => {
      ensureAudioInitialized();
      clearTimers();

      const { min, max } = currentPreset.value;
      const targetSeconds = randomTime(min, max);
      totalDurationMs = targetSeconds * 1000;
      remainingMs = totalDurationMs;

      isPlaying.value = true;
      isPaused.value = false;
      hasEnded.value = false;
      isFinalStretch.value = false;
      activeColor.value = nextQueezyColor();
      if (bipAudio) {
        try {
          bipAudio.playbackRate = 1;
        } catch {
          // Ignore
        }
      }
      triggerPulse(780);

      if (!isMuted.value) {
        playAudio(bipAudio);
      }

      scheduleNextBeat();
    };

    const togglePause = () => {
      if (!isPlaying.value) return;
      if (isPaused.value) {
        isPaused.value = false;
        if (!isMuted.value && bipAudio) {
          bipAudio.play().catch(() => {});
        }
        scheduleNextBeat();
      } else {
        const elapsed = Date.now() - lastTickAt;
        remainingMs = Math.max(0, remainingMs - elapsed);
        isPaused.value = true;
        clearTimers();
        pauseAudio(bipAudio);
      }
    };

    const toggleMute = () => {
      isMuted.value = !isMuted.value;
      if (isMuted.value) {
        pauseAudio(bipAudio);
      } else if (isPlaying.value && !isPaused.value && bipAudio) {
        bipAudio.play().catch(() => {});
      }
    };

    const endGame = () => {
      clearTimers();
      stopAudio(bipAudio);
      playAudio(bongAudio);
      isPlaying.value = false;
      isPaused.value = false;
      isFinalStretch.value = false;
      hasEnded.value = true;
    };

    const cancelGame = () => {
      clearTimers();
      stopAudio(bipAudio);
      isPlaying.value = false;
      isPaused.value = false;
      isFinalStretch.value = false;
      hasEnded.value = false;
    };

    const goBack = () => {
      cancelGame();
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/herramientas");
      }
    };

    onBeforeUnmount(() => {
      clearTimers();
      stopAudio(bipAudio);
      stopAudio(bongAudio);
    });

    return {
      arrowBackOutline,
      playOutline,
      pauseOutline,
      stopOutline,
      refreshOutline,
      flashOutline,
      volumeHighOutline,
      volumeMuteOutline,
      durationPresets: DURATION_PRESETS,
      selectedPresetId,
      isPlaying,
      isPaused,
      hasEnded,
      isMuted,
      activeColor,
      pulseBeat,
      isFinalStretch,
      pulseTransitionMs,
      startCountdown,
      togglePause,
      toggleMute,
      endGame,
      cancelGame,
      goBack,
    };
  },
});
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: TINGO TANGO
   ========================================================================== */

.qz-tingo-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-tingo-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-tingo-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
  padding-bottom: 70px;
}

/* 1. CABECERA HERO PÚRPURA QUEEZY */
.qz-hero-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  padding: max(20px, env(safe-area-inset-top)) 20px 26px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.2);
}

.qz-hero-inner {
  max-width: 680px;
  margin: 0 auto;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.qz-hero-top-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qz-back-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: all 0.2s ease;
}

.qz-back-btn:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.9px;
  padding: 5px 12px;
  border-radius: 9999px;
  backdrop-filter: blur(6px);
}

.qz-sound-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #ffffff;
  border-radius: 9999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: all 0.2s ease;
}

.qz-sound-btn.is-muted {
  background: rgba(12, 9, 42, 0.28);
  border-color: rgba(255, 255, 255, 0.16);
  opacity: 0.85;
}

.qz-hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: #ffffff;
}

.qz-hero-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
}

/* 2. CUERPO Y TARJETA CENTRAL */
.qz-tingo-body {
  padding: 20px 16px 24px;
  max-width: 680px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.qz-card {
  background: #ffffff;
  border-radius: var(--qz-radius-xl, 24px);
  padding: 26px 20px;
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.12));
  box-shadow: 0 6px 20px rgba(12, 9, 42, 0.05);
  box-sizing: border-box;
}

/* ESCENARIO DE LA PALABRA */
.qz-stage {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: #f4f3fd;
  border: 1.5px dashed rgba(106, 90, 224, 0.22);
  border-radius: 20px;
  padding: 24px 16px;
  margin-bottom: 22px;
  position: relative;
  overflow: hidden;
}

.qz-stage--playing {
  border-style: solid;
  border-color: rgba(106, 90, 224, 0.2);
}

.qz-stage--ended {
  background: #fff0f3;
  border-style: solid;
  border-color: rgba(255, 86, 86, 0.35);
}

.qz-preview-word {
  font-size: clamp(2.8rem, 10vw, 4.2rem);
  font-weight: 900;
  letter-spacing: 3px;
  color: #6a5ae0;
  line-height: 1.05;
  margin-bottom: 10px;
}

.qz-stage-hint {
  margin: 0;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--qz-color-text-muted, #858494);
  max-width: 340px;
}

.qz-paused-pill {
  position: absolute;
  top: 14px;
  background: #fff6e7;
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  padding: 4px 12px;
  border-radius: 9999px;
}

/* PALABRA TINGO PULSANTE */
.qz-tingo-word {
  font-size: clamp(3.4rem, 13vw, 5.4rem);
  font-weight: 900;
  letter-spacing: 4px;
  line-height: 1;
  user-select: none;
  transform: scale(0.88);
  transition: transform var(--pulse-ms, 220ms) cubic-bezier(0.22, 1, 0.36, 1),
    color 0.14s ease;
  text-shadow: 0 6px 20px rgba(12, 9, 42, 0.08);
}

.qz-tingo-word.is-pulsing {
  transform: scale(1.18);
}

.qz-tingo-word.is-fast.is-pulsing {
  transform: scale(1.26);
}

.qz-tingo-word.is-paused {
  opacity: 0.5;
  transform: scale(0.95);
}

/* CLÍMAX ¡TANGO! */
.qz-tango-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #e11d48;
  background: rgba(225, 29, 72, 0.12);
  padding: 5px 14px;
  border-radius: 9999px;
  margin-bottom: 10px;
}

.qz-tango-word {
  font-size: clamp(3.5rem, 14vw, 5.6rem);
  font-weight: 900;
  letter-spacing: 4px;
  line-height: 1.05;
  color: #ff5656;
  margin-bottom: 10px;
  user-select: none;
  animation: tangoImpact 0.55s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  text-shadow: 0 8px 24px rgba(255, 86, 86, 0.28);
}

@keyframes tangoImpact {
  0% {
    opacity: 0;
    transform: scale(0.45) rotate(-4deg);
  }
  65% {
    opacity: 1;
    transform: scale(1.14) rotate(2deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* SELECTOR DE DURACIÓN */
.qz-duration-section {
  margin-bottom: 20px;
}

.qz-section-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--qz-color-text-muted, #858494);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.qz-duration-pills {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.qz-duration-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 8px;
  border-radius: 14px;
  border: 1.5px solid rgba(106, 90, 224, 0.15);
  background: #f4f3fd;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-duration-pill:hover {
  border-color: rgba(106, 90, 224, 0.4);
}

.qz-duration-pill.is-active {
  background: #6a5ae0;
  border-color: #6a5ae0;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
}

.qz-pill-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-pill-range {
  font-size: 11px;
  font-weight: 600;
  color: var(--qz-color-text-muted, #858494);
}

.qz-duration-pill.is-active .qz-pill-title,
.qz-duration-pill.is-active .qz-pill-range {
  color: #ffffff;
}

/* BOTONES */
.qz-btn-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.28);
  transition: all 0.2s ease;
}

.qz-btn-primary:hover {
  background: #5b4cc9;
  transform: translateY(-1px);
}

.qz-live-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.qz-btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #efeefc;
  color: #6a5ae0;
  border: 1.5px solid rgba(106, 90, 224, 0.2);
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn-outline:hover {
  background: #e2e0fb;
}

.qz-btn-tango-now {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #ff5656;
  color: #ffffff;
  border: none;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 86, 86, 0.26);
  transition: all 0.2s ease;
}

.qz-btn-tango-now:hover {
  background: #e11d48;
}

.qz-btn-stop {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  color: #858494;
  border: 1px solid rgba(133, 132, 148, 0.28);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn-stop:hover {
  background: #fff1f2;
  color: #e11d48;
  border-color: rgba(225, 29, 72, 0.3);
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-tingo-page,
  body:not(.light) .qz-tingo-content {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-hero-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  }

  body:not(.light) .qz-hero-tag {
    background: rgba(255, 255, 255, 0.12);
    color: #b5a9ff;
    border: 1px solid rgba(181, 169, 255, 0.28);
  }

  body:not(.light) .qz-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  body:not(.light) .qz-stage {
    background: #241d42;
    border-color: rgba(181, 169, 255, 0.22);
  }

  body:not(.light) .qz-stage--ended {
    background: rgba(255, 86, 86, 0.12);
    border-color: rgba(255, 86, 86, 0.4);
  }

  body:not(.light) .qz-preview-word {
    color: #b5a9ff;
  }

  body:not(.light) .qz-stage-hint,
  body:not(.light) .qz-section-label,
  body:not(.light) .qz-pill-range {
    color: #9e9bb8;
  }

  body:not(.light) .qz-paused-pill {
    background: rgba(245, 158, 11, 0.18);
    color: #fcd34d;
    border-color: rgba(245, 158, 11, 0.35);
  }

  body:not(.light) .qz-tango-badge {
    background: rgba(255, 86, 86, 0.22);
    color: #fda4af;
  }

  body:not(.light) .qz-tango-word {
    color: #ff7a8a;
  }

  body:not(.light) .qz-duration-pill {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.1);
  }

  body:not(.light) .qz-duration-pill.is-active {
    background: #6a5ae0;
    border-color: #7c6ef2;
  }

  body:not(.light) .qz-pill-title {
    color: #f7f7fd;
  }

  body:not(.light) .qz-btn-outline {
    background: #2b2254;
    color: #b5a9ff;
    border-color: rgba(181, 169, 255, 0.28);
  }

  body:not(.light) .qz-btn-outline:hover {
    background: #362b69;
    color: #ffffff;
  }

  body:not(.light) .qz-btn-stop {
    color: #9e9bb8;
    border-color: rgba(255, 255, 255, 0.12);
  }

  body:not(.light) .qz-btn-stop:hover {
    background: rgba(225, 29, 72, 0.18);
    color: #fda4af;
    border-color: rgba(225, 29, 72, 0.35);
  }
}

:global(body.dark) .qz-tingo-page,
:global(body.dark) .qz-tingo-content,
:global(html.dark) .qz-tingo-page,
:global(html.dark) .qz-tingo-content,
:global(.dark) .qz-tingo-page,
:global(.dark) .qz-tingo-content {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

:global(body.dark) .qz-hero-tag,
:global(html.dark) .qz-hero-tag,
:global(.dark) .qz-hero-tag {
  background: rgba(255, 255, 255, 0.12);
  color: #b5a9ff;
  border: 1px solid rgba(181, 169, 255, 0.28);
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-stage,
:global(html.dark) .qz-stage,
:global(.dark) .qz-stage {
  background: #241d42;
  border-color: rgba(181, 169, 255, 0.22);
}

:global(body.dark) .qz-stage--ended,
:global(html.dark) .qz-stage--ended,
:global(.dark) .qz-stage--ended {
  background: rgba(255, 86, 86, 0.12);
  border-color: rgba(255, 86, 86, 0.4);
}

:global(body.dark) .qz-preview-word,
:global(html.dark) .qz-preview-word,
:global(.dark) .qz-preview-word {
  color: #b5a9ff;
}

:global(body.dark) .qz-stage-hint,
:global(html.dark) .qz-stage-hint,
:global(.dark) .qz-stage-hint,
:global(body.dark) .qz-section-label,
:global(html.dark) .qz-section-label,
:global(.dark) .qz-section-label,
:global(body.dark) .qz-pill-range,
:global(html.dark) .qz-pill-range,
:global(.dark) .qz-pill-range {
  color: #9e9bb8;
}

:global(body.dark) .qz-paused-pill,
:global(html.dark) .qz-paused-pill,
:global(.dark) .qz-paused-pill {
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.35);
}

:global(body.dark) .qz-tango-badge,
:global(html.dark) .qz-tango-badge,
:global(.dark) .qz-tango-badge {
  background: rgba(255, 86, 86, 0.22);
  color: #fda4af;
}

:global(body.dark) .qz-tango-word,
:global(html.dark) .qz-tango-word,
:global(.dark) .qz-tango-word {
  color: #ff7a8a;
}

:global(body.dark) .qz-duration-pill,
:global(html.dark) .qz-duration-pill,
:global(.dark) .qz-duration-pill {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-duration-pill.is-active,
:global(html.dark) .qz-duration-pill.is-active,
:global(.dark) .qz-duration-pill.is-active {
  background: #6a5ae0;
  border-color: #7c6ef2;
}

:global(body.dark) .qz-pill-title,
:global(html.dark) .qz-pill-title,
:global(.dark) .qz-pill-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-btn-outline,
:global(html.dark) .qz-btn-outline,
:global(.dark) .qz-btn-outline {
  background: #2b2254;
  color: #b5a9ff;
  border-color: rgba(181, 169, 255, 0.28);
}

:global(body.dark) .qz-btn-outline:hover,
:global(html.dark) .qz-btn-outline:hover,
:global(.dark) .qz-btn-outline:hover {
  background: #362b69;
  color: #ffffff;
}

:global(body.dark) .qz-btn-stop,
:global(html.dark) .qz-btn-stop,
:global(.dark) .qz-btn-stop {
  color: #9e9bb8;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-btn-stop:hover,
:global(html.dark) .qz-btn-stop:hover,
:global(.dark) .qz-btn-stop:hover {
  background: rgba(225, 29, 72, 0.18);
  color: #fda4af;
  border-color: rgba(225, 29, 72, 0.35);
}
</style>
