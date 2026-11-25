<template>
  <ion-page class="ion-page qz-tools-page">
    <ion-content :fullscreen="true" class="qz-tools-content">
      <div class="qz-tools-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-tools-hero">
          <div class="qz-hero-inner">
            <div class="qz-hero-top">
              <button
                type="button"
                class="qz-back-btn"
                title="Volver al panel"
                aria-label="Volver"
                @click="goBack"
              >
                <ion-icon :icon="arrowBackOutline"></ion-icon>
              </button>
              <span class="qz-tools-tag">DINÁMICAS Y UTILIDADES</span>
            </div>
            <h1 class="qz-tools-title">Herramientas</h1>
            <p class="qz-tools-subtitle">
              Recursos interactivos para dinamizar tus clases
            </p>
          </div>
        </header>

        <!-- 2. CUERPO CON CUADRÍCULA QUEEZY -->
        <main class="qz-tools-body">
          <div class="qz-grid-container">
            <div
              class="qz-tool-card"
              @click="navigateTo('/herramientas/tingo-tango')"
            >
              <div class="qz-card-icon-squircle qz-icon--purple">
                <ion-icon :icon="timeOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h2 class="qz-card-name">Tingo Tango</h2>
                <p class="qz-card-sub">Juego de selección aleatoria</p>
              </div>
            </div>

            <div
              class="qz-tool-card"
              @click="navigateTo('/herramientas/ruleta')"
            >
              <div class="qz-card-icon-squircle qz-icon--cyan">
                <ion-icon :icon="discOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h2 class="qz-card-name">Ruleta</h2>
                <p class="qz-card-sub">Selección de estudiantes al azar</p>
              </div>
            </div>

            <div class="qz-tool-card" @click="navigateTo('/encuestas')">
              <div class="qz-card-icon-squircle qz-icon--green">
                <ion-icon :icon="barChartOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h2 class="qz-card-name">Encuestas</h2>
                <p class="qz-card-sub">
                  Crea y gestiona encuestas para tu curso
                </p>
              </div>
            </div>

            <div
              v-if="modelsAvailable"
              class="qz-tool-card"
              @click="openExternal(modelsUrl)"
            >
              <div class="qz-card-icon-squircle qz-icon--gold-soft">
                <ion-icon :icon="hardwareChipOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h2 class="qz-card-name">IA</h2>
                <p class="qz-card-sub">
                  Modelo de IA configurado para la clase
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import { defineComponent, ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  arrowBackOutline,
  timeOutline,
  discOutline,
  barChartOutline,
  hardwareChipOutline,
} from "ionicons/icons";

export default defineComponent({
  name: "HerramientasPage",
  components: {
    IonPage,
    IonContent,
    IonIcon,
  },
  setup() {
    const router = useRouter();
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

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/panel");
      }
    };

    const openExternal = (url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    };

    const modelsUrl = computed(() => {
      const hostname = window.location.hostname;
      return `http://${hostname}:8081`;
    });

    return {
      arrowBackOutline,
      timeOutline,
      discOutline,
      barChartOutline,
      hardwareChipOutline,
      modelsAvailable,
      modelsUrl,
      navigateTo,
      goBack,
      openExternal,
    };
  },
});
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: HERRAMIENTAS
   ========================================================================== */

.qz-tools-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-tools-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-tools-wrapper {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: 70px;
}

/* 1. CABECERA HERO PÚRPURA QUEEZY */
.qz-tools-hero {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(18px, env(safe-area-inset-top));
  padding-bottom: 20px;
  flex-shrink: 0;
}

.qz-hero-inner {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 18px;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
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

.qz-tools-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.18);
  padding: 4px 12px;
  border-radius: 9999px;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
}

.qz-tools-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.qz-tools-subtitle {
  margin: 4px 0 0 0;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
}

/* 2. CUERPO CON CUADRÍCULA QUEEZY */
.qz-tools-body {
  padding: 6px 16px 24px 16px;
  max-width: 680px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.qz-grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.qz-tool-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: var(--qz-radius-xl, 24px);
  padding: 20px 18px;
  min-height: 144px;
  border: 1px solid rgba(230, 230, 230, 0.6);
  box-shadow: 0 4px 16px rgba(12, 9, 42, 0.04);
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  box-sizing: border-box;
}

.qz-tool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.12);
  border-color: rgba(106, 90, 224, 0.25);
}

.qz-tool-card:active {
  transform: scale(0.97);
}

/* SQUIRCLES DE ICONO PASTEL QUEEZY */
.qz-card-icon-squircle {
  width: 48px;
  height: 48px;
  border-radius: var(--qz-radius-md, 16px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.qz-icon--purple {
  background-color: var(--qz-color-purple-bg, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-icon--cyan {
  background-color: var(--qz-color-cyan-bg, #e8f9fe);
  color: #00a8cc;
}

.qz-icon--green {
  background-color: var(--qz-color-green-bg, #eafbf1);
  color: #2cb67d;
}

.qz-icon--gold-soft {
  background-color: #fff6e7;
  color: #e59822;
}

.qz-card-text {
  margin-top: 16px;
}

.qz-card-name {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0 0 4px 0;
  letter-spacing: -0.1px;
}

.qz-card-sub {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--qz-color-text-muted, #858494);
  margin: 0;
  line-height: 1.3;
}

@media (max-width: 480px) {
  .qz-grid-container {
    grid-template-columns: 1fr;
  }
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-tools-page,
  body:not(.light) .qz-tools-content {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-tools-hero {
    background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
  }

  body:not(.light) .qz-tool-card {
    background-color: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  body:not(.light) .qz-tool-card:hover {
    border-color: #7c6ef2;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6);
  }

  body:not(.light) .qz-card-name {
    color: #f7f7fd;
  }

  body:not(.light) .qz-card-sub {
    color: #9e9bb8;
  }

  body:not(.light) .qz-icon--purple {
    background-color: rgba(124, 110, 242, 0.2);
    color: #a39bf0;
  }

  body:not(.light) .qz-icon--cyan {
    background-color: rgba(112, 214, 245, 0.2);
    color: #70d6f5;
  }

  body:not(.light) .qz-icon--green {
    background-color: rgba(83, 223, 131, 0.2);
    color: #53df83;
  }

  body:not(.light) .qz-icon--gold-soft {
    background-color: rgba(255, 174, 51, 0.2);
    color: #ffae33;
  }
}

:global(body.dark) .qz-tools-page,
:global(body.dark) .qz-tools-content,
:global(html.dark) .qz-tools-page,
:global(html.dark) .qz-tools-content,
:global(.dark) .qz-tools-page,
:global(.dark) .qz-tools-content {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-tools-hero,
:global(html.dark) .qz-tools-hero,
:global(.dark) .qz-tools-hero {
  background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
}

:global(body.dark) .qz-tool-card,
:global(html.dark) .qz-tool-card,
:global(.dark) .qz-tool-card {
  background-color: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-tool-card:hover,
:global(html.dark) .qz-tool-card:hover,
:global(.dark) .qz-tool-card:hover {
  border-color: #7c6ef2;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6);
}

:global(body.dark) .qz-card-name,
:global(html.dark) .qz-card-name,
:global(.dark) .qz-card-name {
  color: #f7f7fd;
}

:global(body.dark) .qz-card-sub,
:global(html.dark) .qz-card-sub,
:global(.dark) .qz-card-sub {
  color: #9e9bb8;
}

:global(body.dark) .qz-icon--purple,
:global(html.dark) .qz-icon--purple,
:global(.dark) .qz-icon--purple {
  background-color: rgba(124, 110, 242, 0.2);
  color: #a39bf0;
}

:global(body.dark) .qz-icon--cyan,
:global(html.dark) .qz-icon--cyan,
:global(.dark) .qz-icon--cyan {
  background-color: rgba(112, 214, 245, 0.2);
  color: #70d6f5;
}

:global(body.dark) .qz-icon--green,
:global(html.dark) .qz-icon--green,
:global(.dark) .qz-icon--green {
  background-color: rgba(83, 223, 131, 0.2);
  color: #53df83;
}

:global(body.dark) .qz-icon--gold-soft,
:global(html.dark) .qz-icon--gold-soft,
:global(.dark) .qz-icon--gold-soft {
  background-color: rgba(255, 174, 51, 0.2);
  color: #ffae33;
}
</style>
