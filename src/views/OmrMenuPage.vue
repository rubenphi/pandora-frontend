<template>
  <ion-page class="ion-page qz-menu-page">
    <ion-content :fullscreen="true" class="qz-menu-content">
      <div class="qz-menu-wrapper">
        <!-- 1. CABECERA HERO QUEEZY PÚRPURA -->
        <header class="qz-hero-header">
          <div class="qz-hero-top">
            <button
              type="button"
              class="qz-back-btn"
              title="Regresar"
              @click="goBack"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </button>

            <div class="qz-hero-status-pill">
              <ion-icon :icon="scanOutline"></ion-icon>
              <span>Módulo OMR</span>
            </div>

            <div class="qz-hero-spacer"></div>
          </div>

          <div class="qz-hero-titles">
            <div class="qz-hero-badge-row">
              <span class="qz-hero-tag">EVALUACIONES Y ENCUESTAS</span>
            </div>
            <h1 class="qz-hero-title">Encuestas y Test</h1>
            <p class="qz-hero-subtitle">
              Gestione y aplique instrumentos OMR, encuestas a la comunidad educativa y calibración de plantillas.
            </p>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-main-body">
          <div class="qz-menu-container">
            <!-- SECCIÓN 1: ENCUESTAS INSTITUCIONALES -->
            <div class="qz-section-group">
              <div class="qz-section-header">
                <span class="qz-section-pill">1</span>
                <h2 class="qz-section-title">Encuestas Institucionales</h2>
              </div>

              <div class="qz-cards-list">
                <!-- Tarjeta 1: Encuesta a Estudiantes -->
                <div
                  class="qz-menu-card"
                  @click="navigateTo('/omr-encuesta/estudiantes')"
                >
                  <div class="qz-icon-squircle qz-icon--purple">
                    <ion-icon :icon="schoolOutline"></ion-icon>
                  </div>
                  <div class="qz-card-details">
                    <div class="qz-card-header-row">
                      <h3 class="qz-card-name">Encuesta a Estudiantes</h3>
                      <span class="qz-tag qz-tag--purple">OMR</span>
                    </div>
                    <p class="qz-card-desc">
                      Lanzador de sesiones de aplicación y escaneo digital de hojas para estudiantes.
                    </p>
                  </div>
                  <div class="qz-card-arrow">
                    <ion-icon :icon="chevronForwardOutline"></ion-icon>
                  </div>
                </div>

                <!-- Tarjeta 2: Encuesta a Padres -->
                <div
                  class="qz-menu-card"
                  @click="navigateTo('/omr-encuesta/padres')"
                >
                  <div class="qz-icon-squircle qz-icon--teal">
                    <ion-icon :icon="peopleOutline"></ion-icon>
                  </div>
                  <div class="qz-card-details">
                    <div class="qz-card-header-row">
                      <h3 class="qz-card-name">Encuesta a Padres</h3>
                      <span class="qz-tag qz-tag--teal">OMR</span>
                    </div>
                    <p class="qz-card-desc">
                      Gestión de sesiones y captura de respuestas de padres de familia y acudientes.
                    </p>
                  </div>
                  <div class="qz-card-arrow">
                    <ion-icon :icon="chevronForwardOutline"></ion-icon>
                  </div>
                </div>

                <!-- Tarjeta 3: Plantillas y Encuestas Personalizadas -->
                <div
                  class="qz-menu-card"
                  @click="navigateTo('/admin/plantillas-encuestas')"
                >
                  <div class="qz-icon-squircle qz-icon--purple">
                    <ion-icon :icon="layersOutline"></ion-icon>
                  </div>
                  <div class="qz-card-details">
                    <div class="qz-card-header-row">
                      <h3 class="qz-card-name">Encuestas Personalizadas</h3>
                      <span class="qz-tag qz-tag--purple">Gestor OMR</span>
                    </div>
                    <p class="qz-card-desc">
                      Cree, diseñe visualmente y administre sesiones de encuestas personalizadas.
                    </p>
                  </div>
                  <div class="qz-card-arrow">
                    <ion-icon :icon="chevronForwardOutline"></ion-icon>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 2: HERRAMIENTAS Y CALIBRACIÓN -->
            <div class="qz-section-group">
              <div class="qz-section-header">
                <span class="qz-section-pill">2</span>
                <h2 class="qz-section-title">Herramientas y Pruebas OMR</h2>
              </div>

              <div class="qz-cards-list">
                <!-- Tarjeta 3: Editor de Plantillas OMR -->
                <div
                  class="qz-menu-card"
                  @click="navigateTo('/omr-editor')"
                >
                  <div class="qz-icon-squircle qz-icon--gold">
                    <ion-icon :icon="createOutline"></ion-icon>
                  </div>
                  <div class="qz-card-details">
                    <div class="qz-card-header-row">
                      <h3 class="qz-card-name">Editor de Plantillas OMR</h3>
                      <span class="qz-tag qz-tag--gold">Editor</span>
                    </div>
                    <p class="qz-card-desc">
                      Diseñe, configure y calibre visualmente las coordenadas de marcas y burbujas.
                    </p>
                  </div>
                  <div class="qz-card-arrow">
                    <ion-icon :icon="chevronForwardOutline"></ion-icon>
                  </div>
                </div>

                <!-- Tarjeta 4: Lector OMR / Evaluaciones -->
                <div
                  class="qz-menu-card"
                  @click="navigateTo('/omr-test')"
                >
                  <div class="qz-icon-squircle qz-icon--cyan">
                    <ion-icon :icon="scanOutline"></ion-icon>
                  </div>
                  <div class="qz-card-details">
                    <div class="qz-card-header-row">
                      <h3 class="qz-card-name">Lector OMR de Pruebas</h3>
                      <span class="qz-tag qz-tag--cyan">Escáner</span>
                    </div>
                    <p class="qz-card-desc">
                      Lectura y calificación de hojas de respuestas estándar con cámara o imagen.
                    </p>
                  </div>
                  <div class="qz-card-arrow">
                    <ion-icon :icon="chevronForwardOutline"></ion-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonIcon,
} from "@ionic/vue";
import { useRouter } from "vue-router";
import {
  arrowBackOutline,
  scanOutline,
  peopleOutline,
  schoolOutline,
  createOutline,
  chevronForwardOutline,
  layersOutline,
} from "ionicons/icons";

export default {
  name: "OmrMenuPage",
  components: {
    IonPage,
    IonContent,
    IonIcon,
  },
  setup() {
    const router = useRouter();

    const goBack = () => router.back();
    const navigateTo = (path) => router.push(path);

    return {
      goBack,
      navigateTo,
      arrowBackOutline,
      scanOutline,
      peopleOutline,
      schoolOutline,
      createOutline,
      chevronForwardOutline,
      layersOutline,
    };
  },
};
</script>

<style scoped>
.qz-menu-page {
  --background: var(--qz-color-bg, #EFEEFC);
  background-color: var(--qz-color-bg, #EFEEFC);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-menu-content {
  --background: var(--qz-color-bg, #EFEEFC);
}

.qz-menu-wrapper {
  display: flex;
  flex-direction: column;
  background-color: var(--qz-color-bg, #EFEEFC);
  box-sizing: border-box;
}

/* 1. CABECERA HERO QUEEZY PÚRPURA */
.qz-hero-header {
  background: linear-gradient(180deg, #6A5AE0 0%, #7668E3 85%, #EFEEFC 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 24px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 760px;
  margin: 0 auto;
  padding: 8px 18px 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qz-back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: 9999px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

.qz-hero-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 5px 14px;
  border-radius: 9999px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.qz-hero-spacer {
  width: 40px;
  height: 40px;
}

.qz-hero-titles {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 18px;
  text-align: left;
}

.qz-hero-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.qz-hero-tag {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
}

.qz-hero-title {
  margin: 2px 0 6px 0;
  font-size: clamp(22px, 3.5vw, 28px);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
  line-height: 1.45;
  max-width: 600px;
}

/* 2. CUERPO PRINCIPAL */
.qz-main-body {
  flex: 1;
  padding: 16px 16px 40px 16px;
  box-sizing: border-box;
}

.qz-menu-container {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* SECCIONES */
.qz-section-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 2px;
}

.qz-section-pill {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--qz-color-purple-primary, #6A5AE0);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.qz-section-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0C092A);
  margin: 0;
}

/* LISTA DE TARJETAS */
.qz-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-menu-card {
  background: var(--qz-color-card-bg, #FFFFFF);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.08));
  border-radius: 20px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(106, 90, 224, 0.05);
}

.qz-menu-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(106, 90, 224, 0.1);
}

.qz-menu-card:active {
  transform: scale(0.985);
}

/* ICONOS SQUIRCLE */
.qz-icon-squircle {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.qz-menu-card:hover .qz-icon-squircle {
  transform: scale(1.05);
}

.qz-icon--purple {
  background: #EFEEFC;
  color: #6A5AE0;
}

.qz-icon--teal {
  background: #E8F8F0;
  color: #05A660;
}

.qz-icon--gold {
  background: #FFF4E5;
  color: #FF8800;
}

.qz-icon--cyan {
  background: #E8F7FF;
  color: #00A3FF;
}

/* DETALLES DE LA TARJETA */
.qz-card-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.qz-card-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.qz-card-name {
  font-size: 15px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0C092A);
  margin: 0;
}

.qz-card-desc {
  font-size: 12.5px;
  color: var(--qz-color-text-muted, #858494);
  margin: 0;
  line-height: 1.4;
}

/* BADGES / TAGS */
.qz-tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 2px 7px;
  border-radius: 6px;
  text-transform: uppercase;
}

.qz-tag--purple {
  background: #EFEEFC;
  color: #6A5AE0;
}

.qz-tag--teal {
  background: #E8F8F0;
  color: #05A660;
}

.qz-tag--gold {
  background: #FFF4E5;
  color: #FF8800;
}

.qz-tag--cyan {
  background: #E8F7FF;
  color: #00A3FF;
}

/* FLECHA CHEVRON */
.qz-card-arrow {
  color: var(--qz-color-text-muted, #858494);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

.qz-menu-card:hover .qz-card-arrow {
  transform: translateX(3px);
  color: var(--qz-color-purple-primary, #6A5AE0);
}

/* ==========================================================================
   DARK MODE OVERRIDES
   ========================================================================== */
body.dark .qz-menu-page,
html.dark .qz-menu-page,
.dark .qz-menu-page {
  --background: #110D26;
  background-color: #110D26;
}

body.dark .qz-menu-content,
html.dark .qz-menu-content,
.dark .qz-menu-content {
  --background: #110D26;
}

body.dark .qz-menu-wrapper,
html.dark .qz-menu-wrapper,
.dark .qz-menu-wrapper {
  background-color: #110D26;
}

body.dark .qz-menu-card,
html.dark .qz-menu-card,
.dark .qz-menu-card {
  background: #1D1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

body.dark .qz-menu-card:hover,
html.dark .qz-menu-card:hover,
.dark .qz-menu-card:hover {
  background: #231D42;
  border-color: rgba(124, 110, 242, 0.3);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
}

body.dark .qz-section-title,
html.dark .qz-section-title,
.dark .qz-section-title,
body.dark .qz-card-name,
html.dark .qz-card-name,
.dark .qz-card-name {
  color: #F7F7FD;
}

body.dark .qz-card-desc,
html.dark .qz-card-desc,
.dark .qz-card-desc,
body.dark .qz-card-arrow,
html.dark .qz-card-arrow,
.dark .qz-card-arrow {
  color: #9E9BB8;
}

body.dark .qz-menu-card:hover .qz-card-arrow,
html.dark .qz-menu-card:hover .qz-card-arrow,
.dark .qz-menu-card:hover .qz-card-arrow {
  color: #7C6EF2;
}

body.dark .qz-section-pill,
html.dark .qz-section-pill,
.dark .qz-section-pill {
  background: #252048;
  color: #A39BF0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

body.dark .qz-icon--purple,
html.dark .qz-icon--purple,
.dark .qz-icon--purple {
  background: #252048;
  color: #A39BF0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

body.dark .qz-icon--teal,
html.dark .qz-icon--teal,
.dark .qz-icon--teal {
  background: #142823;
  color: #48DB9B;
  border: 1px solid rgba(83, 223, 131, 0.2);
}

body.dark .qz-icon--gold,
html.dark .qz-icon--gold,
.dark .qz-icon--gold {
  background: #2E2519;
  color: #FFAE33;
  border: 1px solid rgba(255, 174, 51, 0.2);
}

body.dark .qz-icon--cyan,
html.dark .qz-icon--cyan,
.dark .qz-icon--cyan {
  background: #172D38;
  color: #70D6F5;
  border: 1px solid rgba(112, 214, 245, 0.2);
}

body.dark .qz-tag--purple,
html.dark .qz-tag--purple,
.dark .qz-tag--purple {
  background: #2A2353;
  color: #C0B7FF;
}

body.dark .qz-tag--teal,
html.dark .qz-tag--teal,
.dark .qz-tag--teal {
  background: #142823;
  color: #48DB9B;
}

body.dark .qz-tag--gold,
html.dark .qz-tag--gold,
.dark .qz-tag--gold {
  background: #2E2519;
  color: #FFAE33;
}

body.dark .qz-tag--cyan,
html.dark .qz-tag--cyan,
.dark .qz-tag--cyan {
  background: #172D38;
  color: #70D6F5;
}

/* PREFERS COLOR SCHEME DARK */
@media (prefers-color-scheme: dark) {
  .qz-menu-page {
    --background: #110D26;
    background-color: #110D26;
  }

  .qz-menu-content {
    --background: #110D26;
  }

  .qz-menu-wrapper {
    background-color: #110D26;
  }

  .qz-menu-card {
    background: #1D1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .qz-menu-card:hover {
    background: #231D42;
    border-color: rgba(124, 110, 242, 0.3);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  }

  .qz-section-title,
  .qz-card-name {
    color: #F7F7FD;
  }

  .qz-card-desc,
  .qz-card-arrow {
    color: #9E9BB8;
  }

  .qz-menu-card:hover .qz-card-arrow {
    color: #7C6EF2;
  }

  .qz-section-pill {
    background: #252048;
    color: #A39BF0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .qz-icon--purple {
    background: #252048;
    color: #A39BF0;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .qz-icon--teal {
    background: #142823;
    color: #48DB9B;
    border: 1px solid rgba(83, 223, 131, 0.2);
  }

  .qz-icon--gold {
    background: #2E2519;
    color: #FFAE33;
    border: 1px solid rgba(255, 174, 51, 0.2);
  }

  .qz-icon--cyan {
    background: #172D38;
    color: #70D6F5;
    border: 1px solid rgba(112, 214, 245, 0.2);
  }

  .qz-tag--purple {
    background: #2A2353;
    color: #C0B7FF;
  }

  .qz-tag--teal {
    background: #142823;
    color: #48DB9B;
  }

  .qz-tag--gold {
    background: #2E2519;
    color: #FFAE33;
  }

  .qz-tag--cyan {
    background: #172D38;
    color: #70D6F5;
  }
}
</style>
