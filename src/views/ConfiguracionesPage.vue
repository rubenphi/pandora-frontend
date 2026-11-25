<template>
  <ion-page class="ion-page qz-config-page">
    <ion-content :fullscreen="true" class="qz-config-content">
      <div class="qz-config-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
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
              <span class="qz-hero-tag">ADMINISTRACIÓN</span>
            </div>
            <h1 class="qz-hero-title">Configuraciones</h1>
            <p class="qz-hero-subtitle">
              Ajustes generales, permisos y herramientas del sistema
            </p>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-config-body">
          <div class="qz-settings-list">
            <!-- Autorizaciones -->
            <div class="qz-card qz-setting-card">
              <div class="qz-setting-left">
                <div class="qz-card-icon-squircle qz-icon--purple">
                  <ion-icon :icon="lockOpenOutline"></ion-icon>
                </div>
                <div class="qz-setting-text">
                  <h2 class="qz-setting-title">Autorizaciones</h2>
                  <p class="qz-setting-desc">
                    Gestionar permisos temporales y accesos especiales
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="qz-action-btn qz-btn--purple"
                @click="navigateTo('/admin/autorizaciones')"
              >
                <ion-icon :icon="lockOpenOutline"></ion-icon>
                <span>Gestionar</span>
              </button>
            </div>

            <!-- Vista Administrador -->
            <div class="qz-card qz-setting-card">
              <div class="qz-setting-left">
                <div class="qz-card-icon-squircle qz-icon--indigo">
                  <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
                </div>
                <div class="qz-setting-text">
                  <h2 class="qz-setting-title">Vista Administrador</h2>
                  <p class="qz-setting-desc">
                    Ver todos los cursos y áreas del instituto
                  </p>
                </div>
              </div>
              <ion-toggle
                class="qz-toggle"
                v-model="adminView"
                @ionChange="toggleAdminView"
              ></ion-toggle>
            </div>

            <!-- Token de Acceso -->
            <div v-if="adminView" class="qz-card qz-setting-card">
              <div class="qz-setting-left">
                <div class="qz-card-icon-squircle qz-icon--gold-soft">
                  <ion-icon :icon="keyOutline"></ion-icon>
                </div>
                <div class="qz-setting-text">
                  <h2 class="qz-setting-title">Token de Acceso</h2>
                  <p class="qz-setting-desc">
                    Ver y copiar el Bearer Token actual
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="qz-action-btn qz-btn--purple"
                @click="solicitarContrasenaToken"
              >
                <ion-icon :icon="keyOutline"></ion-icon>
                <span>Mostrar Token</span>
              </button>
            </div>

            <!-- Documentación de la API -->
            <div v-if="adminView" class="qz-card qz-setting-card">
              <div class="qz-setting-left">
                <div class="qz-card-icon-squircle qz-icon--cyan">
                  <ion-icon :icon="documentTextOutline"></ion-icon>
                </div>
                <div class="qz-setting-text">
                  <h2 class="qz-setting-title">Documentación de la API</h2>
                  <p class="qz-setting-desc">
                    Consultar endpoints y modelos interactivos
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="qz-action-btn qz-btn--cyan"
                @click="openApiDocs"
              >
                <ion-icon :icon="documentTextOutline"></ion-icon>
                <span>Consultar la API</span>
              </button>
            </div>

            <!-- Plantillas de Encuestas OMR -->
            <div v-if="adminView" class="qz-card qz-setting-card">
              <div class="qz-setting-left">
                <div class="qz-card-icon-squircle qz-icon--green">
                  <ion-icon :icon="fileTrayStackOutline"></ion-icon>
                </div>
                <div class="qz-setting-text">
                  <h2 class="qz-setting-title">Plantillas de Encuestas OMR</h2>
                  <p class="qz-setting-desc">
                    Gestionar plantillas de encuestas escaneables
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="qz-action-btn qz-btn--green"
                @click="navigateTo('/admin/plantillas-encuestas')"
              >
                <ion-icon :icon="fileTrayStackOutline"></ion-icon>
                <span>Gestionar</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonContent,
  IonToggle,
  IonIcon,
  alertController,
  toastController,
} from "@ionic/vue";
import {
  arrowBackOutline,
  keyOutline,
  copyOutline,
  documentTextOutline,
  fileTrayStackOutline,
  lockOpenOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import axios from "axios";
import { basedeURL } from "../globalService";

export default {
  name: "ConfiguracionesPage",
  components: {
    IonPage,
    IonContent,
    IonToggle,
    IonIcon,
  },
  setup() {
    const router = useRouter();
    const adminView = ref(false);

    onMounted(() => {
      const stored = localStorage.getItem("adminView");
      adminView.value = stored === "true";
    });

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/panel");
      }
    };

    const navigateTo = (path) => {
      router.push(path);
    };

    const toggleAdminView = (event) => {
      localStorage.setItem("adminView", event.detail.checked);
    };

    const solicitarContrasenaToken = async () => {
      const alert = await alertController.create({
        header: "Seguridad",
        message:
          "Por favor, ingrese su contraseña para ver el token de acceso.",
        inputs: [
          {
            name: "password",
            type: "password",
            placeholder: "Contraseña",
          },
        ],
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Verificar",
            handler: async (data) => {
              if (!data.password) return false;
              return await verificarYMostrarToken(data.password);
            },
          },
        ],
      });

      await alert.present();
    };

    const verificarYMostrarToken = async (password) => {
      try {
        const usuarioGlobal = JSON.parse(localStorage.getItem("usuario"));

        if (!usuarioGlobal || !usuarioGlobal.code) {
          throw new Error("No se pudo obtener el usuario actual.");
        }

        // Verify password using login endpoint
        const response = await axios.post("/auth/login", {
          code: usuarioGlobal.code,
          password: password,
        });

        // If successful, show the token
        if (response.data?.userLoged?.accessToken) {
          const token = "Bearer " + response.data.userLoged.accessToken;
          mostrarTokenConCopia(token);
          return true;
        } else {
          throw new Error("Credenciales inválidas");
        }
      } catch (error) {
        let msg = "Contraseña incorrecta o error al verificar.";
        if (error.response?.status === 401) {
          msg = "Contraseña incorrecta.";
        }
        const errorAlert = await alertController.create({
          header: "Error",
          message: msg,
          buttons: ["OK"],
        });
        await errorAlert.present();
        return false;
      }
    };

    const mostrarTokenConCopia = async (token) => {
      const alert = await alertController.create({
        header: "Token de Acceso",
        message: `<div style="word-break: break-all; max-height: 200px; overflow-y: auto; user-select: text;">${token}</div>`,
        buttons: [
          {
            text: "Cerrar",
            role: "cancel",
          },
          {
            text: "Copiar al Portapapeles",
            handler: () => {
              copiarTexto(token);
              return true;
            },
          },
        ],
      });
      await alert.present();
    };

    const copiarTexto = async (texto) => {
      let exitoso = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(texto);
          exitoso = true;
        } catch (err) {
          console.log(
            "Clipboard API falló, intentando método alternativo:",
            err,
          );
        }
      }

      if (!exitoso) {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "0";
        textarea.style.top = "0";
        textarea.select();

        try {
          exitoso = document.execCommand("copy");
        } catch (err) {
          console.error("Error al copiar:", err);
        } finally {
          document.body.removeChild(textarea);
        }
      }

      if (exitoso) {
        const toast = await toastController.create({
          message: "Token copiado al portapapeles",
          duration: 2000,
          color: "success",
          position: "bottom",
          icon: copyOutline,
        });
        await toast.present();
      } else {
        const toast = await toastController.create({
          message: "Error al copiar el token",
          duration: 2000,
          color: "danger",
          position: "bottom",
        });
        await toast.present();
      }
    };

    const openApiDocs = () => {
      const baseUrl = basedeURL() || "";
      const docsUrl = baseUrl.endsWith("/")
        ? `${baseUrl}api/docs/`
        : `${baseUrl}/api/docs/`;
      window.open(docsUrl, "_blank");
    };

    return {
      adminView,
      goBack,
      navigateTo,
      toggleAdminView,
      solicitarContrasenaToken,
      openApiDocs,
      arrowBackOutline,
      keyOutline,
      documentTextOutline,
      fileTrayStackOutline,
      lockOpenOutline,
      shieldCheckmarkOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: CONFIGURACIONES
   ========================================================================== */

.qz-config-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-config-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-config-wrapper {
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
  max-width: 720px;
  margin: 0 auto;
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

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.9px;
  padding: 5px 12px;
  border-radius: 9999px;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}

.qz-hero-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.qz-hero-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
}

/* 2. CUERPO Y TARJETAS */
.qz-config-body {
  padding: 20px 16px 24px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.qz-settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 16px 18px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 6px 18px rgba(12, 9, 42, 0.05);
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.qz-setting-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.qz-setting-card:hover {
  border-color: rgba(106, 90, 224, 0.28);
  box-shadow: 0 10px 22px rgba(106, 90, 224, 0.09);
}

.qz-setting-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

/* SQUIRCLES DE ICONO PASTEL QUEEZY */
.qz-card-icon-squircle {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-icon--purple {
  background-color: #efeefc;
  color: #6a5ae0;
}

.qz-icon--indigo {
  background-color: #ede9fe;
  color: #7c3aed;
}

.qz-icon--cyan {
  background-color: #e8f9fe;
  color: #00a8cc;
}

.qz-icon--green {
  background-color: #eafbf1;
  color: #2cb67d;
}

.qz-icon--gold-soft {
  background-color: #fff6e7;
  color: #e59822;
}

.qz-setting-text {
  min-width: 0;
}

.qz-setting-title {
  margin: 0 0 3px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 15.5px;
  font-weight: 700;
  color: #0c092a;
}

.qz-setting-desc {
  margin: 0;
  font-size: 12.5px;
  font-weight: 500;
  color: #858494;
  line-height: 1.35;
}

/* BOTONES DE ACCIÓN */
.qz-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 15px;
  border-radius: 13px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
  border: 1.5px solid transparent;
}

.qz-btn--purple {
  background: #efeefc;
  color: #6a5ae0;
  border-color: rgba(106, 90, 224, 0.2);
}

.qz-btn--purple:hover {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-btn--cyan {
  background: #e8f9fe;
  color: #0284c7;
  border-color: rgba(2, 132, 199, 0.2);
}

.qz-btn--cyan:hover {
  background: #0284c7;
  color: #ffffff;
}

.qz-btn--green {
  background: #eafbf1;
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.2);
}

.qz-btn--green:hover {
  background: #16a34a;
  color: #ffffff;
}

.qz-toggle {
  --track-background: #e2e0f5;
  --track-background-checked: #6a5ae0;
  --handle-background: #ffffff;
  --handle-background-checked: #ffffff;
  flex-shrink: 0;
}

@media (max-width: 540px) {
  .qz-setting-card {
    flex-direction: column;
    align-items: stretch;
  }

  .qz-action-btn {
    width: 100%;
  }

  .qz-toggle {
    align-self: flex-end;
  }
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-config-page,
  body:not(.light) .qz-config-content {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-hero-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  }

  body:not(.light) .qz-hero-tag {
    background: rgba(255, 255, 255, 0.12);
    color: #b5a9ff;
    border: 1px solid rgba(181, 169, 255, 0.28);
  }

  body:not(.light) .qz-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  body:not(.light) .qz-setting-card:hover {
    border-color: #7c6ef2;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55);
  }

  body:not(.light) .qz-setting-title {
    color: #f7f7fd;
  }

  body:not(.light) .qz-setting-desc {
    color: #9e9bb8;
  }

  body:not(.light) .qz-icon--purple {
    background-color: rgba(124, 110, 242, 0.2);
    color: #a39bf0;
  }

  body:not(.light) .qz-icon--indigo {
    background-color: rgba(167, 139, 250, 0.2);
    color: #c4b5fd;
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

  body:not(.light) .qz-btn--purple {
    background: #2b2254;
    color: #b5a9ff;
    border-color: rgba(181, 169, 255, 0.25);
  }

  body:not(.light) .qz-btn--purple:hover {
    background: #7c6ef2;
    color: #ffffff;
  }

  body:not(.light) .qz-btn--cyan {
    background: rgba(112, 214, 245, 0.15);
    color: #70d6f5;
    border-color: rgba(112, 214, 245, 0.28);
  }

  body:not(.light) .qz-btn--cyan:hover {
    background: #0284c7;
    color: #ffffff;
  }

  body:not(.light) .qz-btn--green {
    background: rgba(83, 223, 131, 0.15);
    color: #53df83;
    border-color: rgba(83, 223, 131, 0.28);
  }

  body:not(.light) .qz-btn--green:hover {
    background: #16a34a;
    color: #ffffff;
  }

  body:not(.light) .qz-toggle {
    --track-background: #2e2652;
    --track-background-checked: #7c6ef2;
  }
}

:global(body.dark) .qz-config-page,
:global(body.dark) .qz-config-content,
:global(html.dark) .qz-config-page,
:global(html.dark) .qz-config-content,
:global(.dark) .qz-config-page,
:global(.dark) .qz-config-content,
:global(:root[data-theme="dark"]) .qz-config-page,
:global(:root[data-theme="dark"]) .qz-config-content {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header,
:global(:root[data-theme="dark"]) .qz-hero-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
}

:global(body.dark) .qz-hero-tag,
:global(html.dark) .qz-hero-tag,
:global(.dark) .qz-hero-tag,
:global(:root[data-theme="dark"]) .qz-hero-tag {
  background: rgba(255, 255, 255, 0.12);
  color: #b5a9ff;
  border: 1px solid rgba(181, 169, 255, 0.28);
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card,
:global(:root[data-theme="dark"]) .qz-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-setting-card:hover,
:global(html.dark) .qz-setting-card:hover,
:global(.dark) .qz-setting-card:hover,
:global(:root[data-theme="dark"]) .qz-setting-card:hover {
  border-color: #7c6ef2;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55);
}

:global(body.dark) .qz-setting-title,
:global(html.dark) .qz-setting-title,
:global(.dark) .qz-setting-title,
:global(:root[data-theme="dark"]) .qz-setting-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-setting-desc,
:global(html.dark) .qz-setting-desc,
:global(.dark) .qz-setting-desc,
:global(:root[data-theme="dark"]) .qz-setting-desc {
  color: #9e9bb8;
}

:global(body.dark) .qz-icon--purple,
:global(html.dark) .qz-icon--purple,
:global(.dark) .qz-icon--purple,
:global(:root[data-theme="dark"]) .qz-icon--purple {
  background-color: rgba(124, 110, 242, 0.2);
  color: #a39bf0;
}

:global(body.dark) .qz-icon--indigo,
:global(html.dark) .qz-icon--indigo,
:global(.dark) .qz-icon--indigo,
:global(:root[data-theme="dark"]) .qz-icon--indigo {
  background-color: rgba(167, 139, 250, 0.2);
  color: #c4b5fd;
}

:global(body.dark) .qz-icon--cyan,
:global(html.dark) .qz-icon--cyan,
:global(.dark) .qz-icon--cyan,
:global(:root[data-theme="dark"]) .qz-icon--cyan {
  background-color: rgba(112, 214, 245, 0.2);
  color: #70d6f5;
}

:global(body.dark) .qz-icon--green,
:global(html.dark) .qz-icon--green,
:global(.dark) .qz-icon--green,
:global(:root[data-theme="dark"]) .qz-icon--green {
  background-color: rgba(83, 223, 131, 0.2);
  color: #53df83;
}

:global(body.dark) .qz-icon--gold-soft,
:global(html.dark) .qz-icon--gold-soft,
:global(.dark) .qz-icon--gold-soft,
:global(:root[data-theme="dark"]) .qz-icon--gold-soft {
  background-color: rgba(255, 174, 51, 0.2);
  color: #ffae33;
}

:global(body.dark) .qz-btn--purple,
:global(html.dark) .qz-btn--purple,
:global(.dark) .qz-btn--purple,
:global(:root[data-theme="dark"]) .qz-btn--purple {
  background: #2b2254;
  color: #b5a9ff;
  border-color: rgba(181, 169, 255, 0.25);
}

:global(body.dark) .qz-btn--purple:hover,
:global(html.dark) .qz-btn--purple:hover,
:global(.dark) .qz-btn--purple:hover,
:global(:root[data-theme="dark"]) .qz-btn--purple:hover {
  background: #7c6ef2;
  color: #ffffff;
}

:global(body.dark) .qz-btn--cyan,
:global(html.dark) .qz-btn--cyan,
:global(.dark) .qz-btn--cyan,
:global(:root[data-theme="dark"]) .qz-btn--cyan {
  background: rgba(112, 214, 245, 0.15);
  color: #70d6f5;
  border-color: rgba(112, 214, 245, 0.28);
}

:global(body.dark) .qz-btn--cyan:hover,
:global(html.dark) .qz-btn--cyan:hover,
:global(.dark) .qz-btn--cyan:hover,
:global(:root[data-theme="dark"]) .qz-btn--cyan:hover {
  background: #0284c7;
  color: #ffffff;
}

:global(body.dark) .qz-btn--green,
:global(html.dark) .qz-btn--green,
:global(.dark) .qz-btn--green,
:global(:root[data-theme="dark"]) .qz-btn--green {
  background: rgba(83, 223, 131, 0.15);
  color: #53df83;
  border-color: rgba(83, 223, 131, 0.28);
}

:global(body.dark) .qz-btn--green:hover,
:global(html.dark) .qz-btn--green:hover,
:global(.dark) .qz-btn--green:hover,
:global(:root[data-theme="dark"]) .qz-btn--green:hover {
  background: #16a34a;
  color: #ffffff;
}

:global(body.dark) .qz-toggle,
:global(html.dark) .qz-toggle,
:global(.dark) .qz-toggle,
:global(:root[data-theme="dark"]) .qz-toggle {
  --track-background: #2e2652;
  --track-background-checked: #7c6ef2;
}
</style>
