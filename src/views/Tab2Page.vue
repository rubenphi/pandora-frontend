<template>
  <ion-page class="ion-page qz-home-page">
    <ion-content :fullscreen="true" class="qz-home-content">
      <div class="qz-page-wrapper">
        <!-- 1. CABECERA HERO COMPACTA (Fondo púrpura Queezy) -->
        <div class="qz-hero-header">
          <div class="qz-hero-container">
            <div class="qz-user-greeting">
              <div class="qz-greeting-tag">
                <ion-icon
                  :icon="greetingIcon"
                  class="qz-greeting-icon"
                ></ion-icon>
                <span>{{ greetingText }}</span>
              </div>
              <h1 class="qz-user-name">{{ userName }}</h1>
              <span class="qz-role-badge">{{ userRoleLabel }}</span>
            </div>

            <button
              type="button"
              class="qz-logout-btn"
              title="Cerrar sesión"
              @click="confirmarSalida"
            >
              <ion-icon :icon="exitOutline"></ion-icon>
            </button>
          </div>
        </div>

        <!-- 2. TARJETA CENTRAL: ACCESO Y CÓDIGO QR -->
        <div class="qz-main-body">
          <div class="qz-qr-card">
            <!-- Título de la tarjeta -->
            <div class="qz-card-header">
              <div class="qz-icon-pill">
                <ion-icon :icon="wifiOutline"></ion-icon>
              </div>
              <div class="qz-card-titles">
                <h2 class="qz-card-title">Acceso para Estudiantes</h2>
                <p class="qz-card-subtitle">
                  Muestra esta pantalla para que se conecten a la sesión
                </p>
              </div>
            </div>

            <!-- DIRECCIÓN IP NÍTIDA Y COMPLETA (Visible al 100% y botón centrado debajo) -->
            <div
              v-if="serverIp && serverIp !== 'Error al obtener IP'"
              class="qz-ip-block"
            >
              <div class="qz-ip-details">
                <span class="qz-ip-legend">DIRECCIÓN DE ACCESO:</span>
                <div
                  class="qz-ip-display"
                  @click="copiarEnlace"
                  title="Toca para copiar"
                >
                  <span class="qz-ip-full">http://{{ serverIp }}:3000</span>
                </div>
              </div>

              <div class="qz-copy-wrapper">
                <button
                  type="button"
                  class="qz-copy-btn"
                  :class="{ 'qz-copy-btn--copied': copied }"
                  title="Copiar dirección al portapapeles"
                  @click="copiarEnlace"
                >
                  <ion-icon
                    :icon="copied ? checkmarkCircleOutline : copyOutline"
                  ></ion-icon>
                  <span>{{
                    copied ? "¡Enlace copiado!" : "Copiar enlace"
                  }}</span>
                </button>
              </div>
            </div>

            <div v-else class="qz-ip-loading">
              <ion-spinner name="crescent" class="qz-spinner"></ion-spinner>
              <span>Obteniendo dirección de red...</span>
            </div>

            <!-- Canvas del Código QR -->
            <div class="qz-qr-section">
              <div class="qz-qr-frame">
                <canvas id="qr-code-canvas"></canvas>
              </div>
              <p class="qz-qr-hint">
                Escanea con la cámara o ingresa el enlace anterior
              </p>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  alertController,
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref, computed, onMounted, watch } from "vue";
import { tokenHeader, usuarioGet } from "../globalService";
import router from "../router";
import {
  exitOutline,
  wifiOutline,
  copyOutline,
  checkmarkCircleOutline,
  sunnyOutline,
  moonOutline,
} from "ionicons/icons";
import QRCode from "qrcode";
import { Capacitor } from "@capacitor/core";
import { resetDemoLock } from "../utils/demoLicense";

export default {
  name: "Tab2Page",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSpinner,
  },
  setup() {
    const isNative = ref(false);
    const serverIp = ref(null);
    const copied = ref(false);
    const user = ref({});

    const loadUserData = () => {
      const u = usuarioGet();
      if (u) {
        user.value = u;
      }
    };

    const userName = computed(() => {
      return user.value?.nombre || user.value?.code || "Docente";
    });

    const userRoleLabel = computed(() => {
      const rol = user.value?.rol;
      if (rol === "admin") return "Administrador";
      if (rol === "teacher") return "Profesor";
      if (rol === "student") return "Estudiante";
      return "Miembro";
    });

    // Saludo según la hora
    const currentHour = new Date().getHours();
    const greetingText = computed(() => {
      if (currentHour < 12) return "BUENOS DÍAS";
      if (currentHour < 19) return "BUENAS TARDES";
      return "BUENAS NOCHES";
    });

    const greetingIcon = computed(() => {
      return currentHour >= 6 && currentHour < 19 ? sunnyOutline : moonOutline;
    });

    const fetchServerIp = () => {
      // Se utiliza la direccion local sin llamada de red inicial innecesaria
      if (!Capacitor.isNativePlatform()) {
        serverIp.value = window.location.hostname || "127.0.0.1";
      } else {
        serverIp.value = "127.0.0.1";
      }
    };

    const generateQrCode = (ip) => {
      const canvas = document.getElementById("qr-code-canvas");
      if (canvas && ip && ip !== "Error al obtener IP") {
        QRCode.toCanvas(
          canvas,
          `http://${ip}:3000`,
          {
            width: 175,
            margin: 2,
            color: {
              dark: "#0C092A",
              light: "#FFFFFF",
            },
          },
          function (error) {
            if (error) console.error("Error generating QR:", error);
          },
        );
      }
    };

    const copiarEnlace = async () => {
      if (!serverIp.value) return;
      const url = `http://${serverIp.value}:3000`;
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          const el = document.createElement("textarea");
          el.value = url;
          document.body.appendChild(el);
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
        }
        copied.value = true;
        setTimeout(() => {
          copied.value = false;
        }, 2200);
      } catch (err) {
        console.error("No se pudo copiar el enlace:", err);
      }
    };

    onIonViewWillEnter(async () => {
      tokenHeader();
      loadUserData();
      isNative.value = Capacitor.isNativePlatform();
      await fetchServerIp();
      if (serverIp.value) {
        setTimeout(() => {
          generateQrCode(serverIp.value);
        }, 150);
      }
    });

    onMounted(async () => {
      loadUserData();
      await fetchServerIp();
      if (serverIp.value) {
        setTimeout(() => {
          generateQrCode(serverIp.value);
        }, 150);
      }
    });

    watch(serverIp, (newIp) => {
      if (newIp && newIp !== "Error al obtener IP") {
        setTimeout(() => {
          generateQrCode(newIp);
        }, 100);
      }
    });

    const confirmarSalida = async () => {
      const alert = await alertController.create({
        header: "Cerrar sesión",
        message: "¿Deseas cerrar tu sesión en Pandora?",
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Cerrar sesión",
            role: "destructive",
            handler: () => {
              salir();
            },
          },
        ],
      });
      await alert.present();
    };

    const salir = () => {
      const periodoSelected = JSON.parse(
        localStorage.getItem("periodoSelected"),
      );
      localStorage.clear();
      resetDemoLock();
      localStorage.setItem("periodoSelected", JSON.stringify(periodoSelected));
      localStorage.removeItem("miembros");
      localStorage.removeItem("notas");
      router.push("/login");
    };

    return {
      serverIp,
      isNative,
      copied,
      userName,
      userRoleLabel,
      greetingText,
      greetingIcon,
      copiarEnlace,
      confirmarSalida,
      salir,
      exitOutline,
      wifiOutline,
      copyOutline,
      checkmarkCircleOutline,
    };
  },
};
</script>

<style scoped>
.qz-home-page {
  background-color: var(--qz-color-purple-bg, #efeefc);
}

.qz-home-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  --overflow: hidden;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-page-wrapper {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 1. CABECERA HERO COMPACTA */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 12px;
  flex-shrink: 0;
}

.qz-hero-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-user-greeting {
  display: flex;
  flex-direction: column;
}

.qz-greeting-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.88);
  text-transform: uppercase;
}

.qz-greeting-icon {
  font-size: 13px;
  color: #ffae33;
}

.qz-user-name {
  margin: 2px 0 4px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
}

.qz-role-badge {
  display: inline-block;
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--qz-radius-full, 9999px);
  backdrop-filter: blur(4px);
}

.qz-logout-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  color: #ffffff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(6px);
  flex-shrink: 0;
}

.qz-logout-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

/* 2. CUERPO PRINCIPAL */
.qz-main-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 16px 20px 16px;
  box-sizing: border-box;
}

.qz-qr-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: var(--qz-radius-2xl, 28px);
  padding: 18px 18px;
  box-shadow: 0 10px 30px -4px rgba(106, 90, 224, 0.12);
  border: 1px solid rgba(230, 230, 230, 0.6);
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

.qz-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qz-icon-pill {
  width: 40px;
  height: 40px;
  border-radius: var(--qz-radius-md, 14px);
  background-color: var(--qz-color-cyan-bg, #e8f9fe);
  color: var(--qz-color-cyan, #70d6f5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-card-titles {
  flex: 1;
}

.qz-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  letter-spacing: -0.2px;
}

.qz-card-subtitle {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: var(--qz-color-text-muted, #858494);
  line-height: 1.35;
}

/* BLOQUE DE LA IP: CENTRADO CON BOTÓN DEBAJO */
.qz-ip-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background-color: var(--qz-color-purple-bg, #efeefc);
  border: 1.5px dashed var(--qz-color-purple-soft, #9087e5);
  border-radius: var(--qz-radius-lg, 18px);
  padding: 10px 14px;
  gap: 8px;
}

.qz-ip-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100%;
}

.qz-ip-legend {
  font-size: 10px;
  font-weight: 700;
  color: var(--qz-color-purple-primary, #6a5ae0);
  letter-spacing: 0.8px;
}

.qz-ip-display {
  cursor: pointer;
  user-select: all;
}

.qz-ip-full {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  letter-spacing: 0.4px;
  word-break: break-all;
  line-height: 1.25;
}

.qz-copy-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}

.qz-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: #ffffff;
  border: 1px solid var(--qz-color-border, #e6e6e6);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 5px 16px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  color: var(--qz-color-purple-primary, #6a5ae0);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(12, 9, 42, 0.04);
}

.qz-copy-btn:hover {
  background-color: #f8f7fd;
  border-color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-copy-btn--copied {
  background-color: var(--qz-color-green-correct, #53df83) !important;
  border-color: var(--qz-color-green-correct, #53df83) !important;
  color: #ffffff !important;
}

.qz-ip-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 14px;
  background-color: var(--qz-color-purple-bg, #efeefc);
  border-radius: var(--qz-radius-lg, 18px);
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
  font-weight: 600;
}

.qz-spinner {
  width: 20px;
  height: 20px;
  --color: var(--qz-color-purple-primary, #6a5ae0);
}

/* SECCIÓN DEL CÓDIGO QR */
.qz-qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.qz-qr-frame {
  background: #ffffff;
  border: 2px solid var(--qz-color-purple-bg, #efeefc);
  border-radius: var(--qz-radius-xl, 20px);
  padding: 6px;
  box-shadow: 0 4px 16px rgba(106, 90, 224, 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

#qr-code-canvas {
  display: block;
}

.qz-qr-hint {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--qz-color-text-muted, #858494);
  max-width: 280px;
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-home-page,
  body:not(.light) .qz-home-content {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-hero-header {
    background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
  }

  body:not(.light) .qz-qr-card {
    background: #1d1838;
    box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.5);
  }

  body:not(.light) .qz-card-title {
    color: #f7f7fd;
  }

  body:not(.light) .qz-ip-block {
    background-color: #231d42;
    border-color: rgba(163, 155, 240, 0.3);
  }

  body:not(.light) .qz-ip-legend {
    color: #a39bf0;
  }

  body:not(.light) .qz-ip-full {
    color: #f7f7fd;
  }

  body:not(.light) .qz-copy-btn {
    background-color: #28214b;
    border-color: rgba(255, 255, 255, 0.12);
    color: #a39bf0;
  }

  body:not(.light) .qz-copy-btn:hover {
    background-color: #352c63;
  }

  body:not(.light) .qz-ip-loading {
    background-color: #231d42;
    color: #9e9bb8;
  }

  body:not(.light) .qz-qr-frame {
    border-color: #28214b;
  }
}

:global(body.dark) .qz-home-page,
:global(body.dark) .qz-home-content,
:global(html.dark) .qz-home-page,
:global(html.dark) .qz-home-content,
:global(.dark) .qz-home-page,
:global(.dark) .qz-home-content {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
}

:global(body.dark) .qz-qr-card,
:global(html.dark) .qz-qr-card,
:global(.dark) .qz-qr-card {
  background: #1d1838;
  box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.5);
}

:global(body.dark) .qz-card-title,
:global(html.dark) .qz-card-title,
:global(.dark) .qz-card-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-ip-block,
:global(html.dark) .qz-ip-block,
:global(.dark) .qz-ip-block {
  background-color: #231d42;
  border-color: rgba(163, 155, 240, 0.3);
}

:global(body.dark) .qz-ip-legend,
:global(html.dark) .qz-ip-legend,
:global(.dark) .qz-ip-legend {
  color: #a39bf0;
}

:global(body.dark) .qz-ip-full,
:global(html.dark) .qz-ip-full,
:global(.dark) .qz-ip-full {
  color: #f7f7fd;
}

:global(body.dark) .qz-copy-btn,
:global(html.dark) .qz-copy-btn,
:global(.dark) .qz-copy-btn {
  background-color: #28214b;
  border-color: rgba(255, 255, 255, 0.12);
  color: #a39bf0;
}

:global(body.dark) .qz-copy-btn:hover,
:global(html.dark) .qz-copy-btn:hover,
:global(.dark) .qz-copy-btn:hover {
  background-color: #352c63;
}

:global(body.dark) .qz-ip-loading,
:global(html.dark) .qz-ip-loading,
:global(.dark) .qz-ip-loading {
  background-color: #231d42;
  color: #9e9bb8;
}

:global(body.dark) .qz-qr-frame,
:global(html.dark) .qz-qr-frame,
:global(.dark) .qz-qr-frame {
  border-color: #28214b;
}
</style>
