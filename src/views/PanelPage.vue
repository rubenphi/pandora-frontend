<template>
  <ion-page class="qz-panel-page">
    <ion-content :fullscreen="true" class="qz-panel-content">
      <div class="qz-panel-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <div class="qz-panel-hero">
          <div class="qz-hero-inner">
            <div class="qz-panel-header-titles">
              <span class="qz-panel-tag">ADMINISTRACIÓN</span>
              <h1 class="qz-panel-title">Panel de Control</h1>
            </div>

            <div class="qz-admin-badge" v-if="admin">
              <span>Admin</span>
            </div>
            <div class="qz-admin-badge qz-badge--teacher" v-else-if="esProfesor">
              <span>Docente</span>
            </div>
          </div>
        </div>

        <!-- 2. CUERPO: CUADRÍCULA DE TARJETAS QUEEZY (Estilo image9_1_2_375x812.png) -->
        <div class="qz-panel-body">
          <div class="qz-grid-container">
            <!-- Tarjeta 1: Lecciones y Cuestionarios -->
            <div
              class="qz-panel-card"
              @click="navigateTo('/admin/cuestionarios')"
            >
              <div class="qz-card-icon-squircle qz-icon--purple">
                <ion-icon :icon="helpCircleOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h3 class="qz-card-name">Lecciones</h3>
                <p class="qz-card-sub">Cuestionarios y temas</p>
              </div>
            </div>

            <!-- Tarjeta 2: Gestión Académica (Solo Admin) -->
            <div
              v-if="admin"
              class="qz-panel-card"
              @click="navigateTo('/admin/gestion-academica')"
            >
              <div class="qz-card-icon-squircle qz-icon--cyan">
                <ion-icon :icon="schoolOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h3 class="qz-card-name">Académica</h3>
                <p class="qz-card-sub">Gestión institucional</p>
              </div>
            </div>

            <!-- Tarjeta 3: Gestionar Usuarios (Solo Admin) -->
            <div
              v-if="admin"
              class="qz-panel-card"
              @click="navigateTo('/admin/gestionar/usuarios')"
            >
              <div class="qz-card-icon-squircle qz-icon--green">
                <ion-icon :icon="peopleCircleOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h3 class="qz-card-name">Usuarios</h3>
                <p class="qz-card-sub">Administrar cuentas</p>
              </div>
            </div>

            <!-- Tarjeta 4: Añadir Usuario (Solo Admin) -->
            <div
              v-if="admin"
              class="qz-panel-card"
              @click="navigateTo('/admin/registro/usuarios')"
            >
              <div class="qz-card-icon-squircle qz-icon--gold">
                <ion-icon :icon="personAddOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h3 class="qz-card-name">Nuevo Usuario</h3>
                <p class="qz-card-sub">Crear registros</p>
              </div>
            </div>

            <!-- Tarjeta 5: Configuraciones (Admin o Docente - Incluye Autorizaciones) -->
            <div
              v-if="admin || esProfesor"
              class="qz-panel-card"
              @click="navigateTo('/admin/configuraciones')"
            >
              <div class="qz-card-icon-squircle qz-icon--coral">
                <ion-icon :icon="settingsOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h3 class="qz-card-name">Ajustes</h3>
                <p class="qz-card-sub">Autorizaciones y config</p>
              </div>
            </div>

            <!-- Tarjeta 6: Herramientas -->
            <div
              class="qz-panel-card"
              @click="navigateTo('/herramientas')"
            >
              <div class="qz-card-icon-squircle qz-icon--gold-soft">
                <ion-icon :icon="constructOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h3 class="qz-card-name">Herramientas</h3>
                <p class="qz-card-sub">Dinámicas de clase</p>
              </div>
            </div>

            <!-- Tarjeta 7: Encuestas y Test OMR -->
            <div
              class="qz-panel-card"
              @click="navigateTo('/encuestas-test')"
            >
              <div class="qz-card-icon-squircle qz-icon--lilac">
                <ion-icon :icon="scanOutline"></ion-icon>
              </div>
              <div class="qz-card-text">
                <h3 class="qz-card-name">Encuestas & OMR</h3>
                <p class="qz-card-sub">Escáner y pruebas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { esAdmin, tokenHeader, usuarioGet } from "../globalService";

import {
  helpCircleOutline,
  peopleCircleOutline,
  personAddOutline,
  settingsOutline,
  scanOutline,
  schoolOutline,
  constructOutline,
} from "ionicons/icons";

import {
  onIonViewWillEnter,
  IonPage,
  IonContent,
  IonIcon,
} from "@ionic/vue";

export default {
  name: "PanelPage",
  components: {
    IonContent,
    IonPage,
    IonIcon,
  },
  setup() {
    const router = useRouter();
    const usuario = ref(usuarioGet() || {});
    const admin = ref(esAdmin());

    const esProfesor = computed(() => {
      const rol = usuario.value?.rol;
      return rol === "teacher";
    });

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet() || {};
      admin.value = esAdmin();
      tokenHeader();
    });

    const navigateTo = (path) => {
      router.push(path);
    };

    return {
      usuario,
      admin,
      esProfesor,
      navigateTo,
      // Iconos
      helpCircleOutline,
      settingsOutline,
      personAddOutline,
      peopleCircleOutline,
      scanOutline,
      schoolOutline,
      constructOutline,
    };
  },
};
</script>

<style scoped>
.qz-panel-page {
  background-color: var(--qz-color-purple-bg, #EFEEFC);
}

.qz-panel-content {
  --background: var(--qz-color-purple-bg, #EFEEFC);
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
}

.qz-panel-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
}

/* 1. CABECERA HERO PÚRPURA QUEEZY */
.qz-panel-hero {
  background: linear-gradient(180deg, #6A5AE0 0%, #7668E3 85%, #EFEEFC 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 14px;
  flex-shrink: 0;
}

.qz-hero-inner {
  max-width: 520px;
  margin: 0 auto;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-panel-header-titles {
  display: flex;
  flex-direction: column;
}

.qz-panel-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
}

.qz-panel-title {
  margin: 2px 0 0 0;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 22px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: -0.3px;
}

.qz-admin-badge {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 4px 12px;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
}

.qz-badge--teacher {
  background: rgba(112, 214, 245, 0.28);
  border-color: rgba(112, 214, 245, 0.5);
  color: #FFFFFF;
}

/* 2. CUERPO CON CUADRÍCULA QUEEZY (2 Columnas) */
.qz-panel-body {
  padding: 4px 16px 84px 16px;
  max-width: 520px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.qz-grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

/* TARJETAS ORGÁNICAS BUBBLY */
.qz-panel-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #FFFFFF;
  border-radius: var(--qz-radius-xl, 24px);
  padding: 18px 16px;
  min-height: 136px;
  border: 1px solid rgba(230, 230, 230, 0.6);
  box-shadow: 0 4px 16px rgba(12, 9, 42, 0.04);
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  box-sizing: border-box;
}

.qz-panel-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.12);
  border-color: rgba(106, 90, 224, 0.25);
}

.qz-panel-card:active {
  transform: scale(0.97);
}

/* SQUIRCLES DE ICONO CON COLORES PASTEL QUEEZY */
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
  background-color: var(--qz-color-purple-bg, #EFEEFC);
  color: var(--qz-color-purple-primary, #6A5AE0);
}

.qz-icon--cyan {
  background-color: var(--qz-color-cyan-bg, #E8F9FE);
  color: var(--qz-color-cyan, #70D6F5);
}

.qz-icon--green {
  background-color: var(--qz-color-green-bg, #EAFBF1);
  color: var(--qz-color-green-correct, #53DF83);
}

.qz-icon--gold {
  background-color: var(--qz-color-gold-bg, #FFF6E7);
  color: var(--qz-color-gold, #FFAE33);
}

.qz-icon--coral {
  background-color: var(--qz-color-pink-bg, #FFF0F3);
  color: var(--qz-color-pink-coral, #FF8FA2);
}

.qz-icon--gold-soft {
  background-color: #FFF9EE;
  color: #E59822;
}

.qz-icon--lilac {
  background-color: var(--qz-color-purple-light, #E1DEF9);
  color: var(--qz-color-purple-soft, #9087E5);
}

/* TEXTOS DE LA TARJETA */
.qz-card-text {
  margin-top: 14px;
}

.qz-card-name {
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 15px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0C092A);
  margin: 0 0 3px 0;
  letter-spacing: -0.1px;
}

.qz-card-sub {
  font-size: 12px;
  font-weight: 500;
  color: var(--qz-color-text-muted, #858494);
  margin: 0;
  line-height: 1.25;
}

/* PANTALLAS PEQUEÑAS */
@media (max-width: 340px) {
  .qz-grid-container {
    grid-template-columns: 1fr;
  }
}
</style>
