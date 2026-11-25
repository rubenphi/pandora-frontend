<template>
  <ion-page class="ion-page qz-autorizaciones-page">
    <ion-content :fullscreen="true" class="qz-autorizaciones-content">
      <div class="qz-autorizaciones-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top">
              <button
                type="button"
                class="qz-back-btn"
                title="Volver a configuraciones"
                aria-label="Volver"
                @click="goBack"
              >
                <ion-icon :icon="arrowBackOutline"></ion-icon>
              </button>
              <span class="qz-hero-tag">AUTORIZACIONES</span>
            </div>
            <h1 class="qz-hero-title">Códigos de Invitación</h1>
            <p class="qz-hero-subtitle">
              Genera, copia o administra códigos de acceso temporal
            </p>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-autorizaciones-body">
          <!-- Formulario para generar códigos -->
          <section class="qz-card qz-generator-card">
            <div class="qz-generator-row">
              <div class="qz-field-group">
                <label class="qz-field-label" for="numeroDeCodigos">
                  Número de Códigos
                </label>
                <div class="qz-input-wrapper">
                  <ion-icon :icon="keyOutline" class="qz-field-icon"></ion-icon>
                  <input
                    id="numeroDeCodigos"
                    v-model.number="numeroDeCodigos"
                    type="number"
                    min="1"
                    class="qz-number-input"
                  />
                </div>
              </div>

              <button
                type="button"
                class="qz-primary-btn"
                @click="generarCodigos"
              >
                <ion-icon :icon="addCircleOutline"></ion-icon>
                <span>Generar Códigos</span>
              </button>
            </div>
          </section>

          <!-- Encabezado de lista -->
          <div class="qz-list-header">
            <span class="qz-list-title">Códigos registrados</span>
            <span class="qz-count-pill">{{ codigos.length }}</span>
          </div>

          <!-- Estado vacío -->
          <div v-if="codigos.length === 0" class="qz-card qz-state-card">
            <div class="qz-empty-icon">
              <ion-icon :icon="keyOutline"></ion-icon>
            </div>
            <h3 class="qz-empty-title">Sin códigos disponibles</h3>
            <p class="qz-state-text">
              Genera uno o más códigos de invitación para compartir acceso.
            </p>
          </div>

          <!-- Lista de códigos -->
          <div v-else class="qz-codes-list">
            <div
              v-for="codigo in codigos"
              :key="codigo.id"
              class="qz-card qz-code-card"
            >
              <div
                class="qz-code-info"
                title="Toca para copiar el código"
                @click="copiarCodigo(codigo.code)"
              >
                <div class="qz-code-top">
                  <span class="qz-code-value">{{ codigo.code }}</span>
                  <span
                    class="qz-status-badge"
                    :class="codigo.valid ? 'is-active' : 'is-inactive'"
                  >
                    {{ codigo.valid ? "Activo" : "No Activo" }}
                  </span>
                </div>
                <div class="qz-code-meta">
                  <span>
                    Expira:
                    {{ new Date(codigo.expirationDate).toLocaleString() }}
                  </span>
                  <span class="qz-copy-hint">
                    <ion-icon :icon="copyOutline"></ion-icon>
                    Tocar para copiar
                  </span>
                </div>
              </div>

              <div class="qz-code-actions">
                <button
                  v-if="codigo.valid"
                  type="button"
                  class="qz-icon-btn qz-icon-btn--warn"
                  title="Desactivar código"
                  aria-label="Desactivar código"
                  @click="invalidarCodigo(codigo)"
                >
                  <ion-icon :icon="closeCircleOutline"></ion-icon>
                </button>
                <button
                  v-else
                  type="button"
                  class="qz-icon-btn qz-icon-btn--success"
                  title="Activar código"
                  aria-label="Activar código"
                  @click="invalidarCodigo(codigo)"
                >
                  <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                </button>
                <button
                  type="button"
                  class="qz-icon-btn qz-icon-btn--danger"
                  title="Eliminar código"
                  aria-label="Eliminar código"
                  @click="eliminarCodigo(codigo)"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div v-if="mostrarMensaje" class="mensaje-copiado">
        Código copiado al portapapeles
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  arrowBackOutline,
  keyOutline,
  addCircleOutline,
  copyOutline,
  trashOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import axios from "axios";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { tokenHeader, currentServerDate } from "../globalService";
import {
  onIonViewWillEnter,
  IonIcon,
  IonPage,
  IonContent,
} from "@ionic/vue";

export default {
  name: "AutorizacionesPage",
  components: {
    IonContent,
    IonPage,
    IonIcon,
  },
  setup() {
    const router = useRouter();
    const codigos = ref([]);
    const numeroDeCodigos = ref(1); // Valor inicial para el número de códigos
    const mostrarMensaje = ref(false);

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/configuraciones");
      }
    };

    const cargarCodigos = async () => {
      tokenHeader();
      try {
        const response = await axios.get(`/invitations`);
        codigos.value = response.data.filter((c) => c.exist);
      } catch (error) {
        console.error("Error al cargar los códigos:", error);
      }
    };

    const copiarCodigo = async (codigo) => {
      let exitoso = false;

      // Primero intentamos con el API moderno (Clipboard)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(codigo);
          exitoso = true;
        } catch (err) {
          console.log(
            "Clipboard API falló, intentando método alternativo:",
            err
          );
        }
      }

      // Si el método moderno falla, usamos el método fallback
      if (!exitoso) {
        const textarea = document.createElement("textarea");
        textarea.value = codigo;

        // Necesitamos agregar el elemento al DOM para poder seleccionarlo
        document.body.appendChild(textarea);

        // Configuramos el textarea
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "0";
        textarea.style.top = "0";

        // Seleccionamos y copiamos
        textarea.select();

        try {
          exitoso = document.execCommand("copy");
        } catch (err) {
          console.error("Error al copiar:", err);
        } finally {
          // Limpiamos eliminando el textarea
          document.body.removeChild(textarea);
        }
      }

      // Mostramos el mensaje de éxito si la copia funcionó
      if (exitoso) {
        mostrarMensaje.value = true;
        setTimeout(() => {
          mostrarMensaje.value = false;
        }, 2000);
      }

      return exitoso;
    };

    const eliminarCodigo = async (codigo) => {
      try {
        await axios.patch(`/invitations/${codigo.id}`, {
          expirationDate: codigo.expirationDate,
          code: codigo.code,
          instituteId: codigo.institute.id,
          exist: false,
          valid: codigo.valid,
        });
        codigos.value = codigos.value.filter((c) => c.id !== codigo.id);
      } catch (error) {
        console.error("Error al eliminar el código:", error);
      }
    };

    const invalidarCodigo = async (codigo) => {
      try {
        await axios.patch(`/invitations/${codigo.id}`, {
          expirationDate: codigo.expirationDate,
          code: codigo.code,
          instituteId: codigo.institute.id,
          exist: codigo.exist,
          valid: codigo.valid ? false : true,
        });
        const codigoActualizado = codigos.value.find((c) => c.id === codigo.id);
        if (codigoActualizado) {
          codigoActualizado.valid = !codigo.valid;
        }
      } catch (error) {
        console.error("Error al invalidar el código:", error);
      }
    };

    const generarCodigos = async () => {
      const hoy = currentServerDate();
      const fechaExpiracion = new Date(hoy);
      fechaExpiracion.setDate(hoy.getDate() + 1); // Establecer la fecha de expiración al día siguiente

      const nuevosCodigos = [];
      for (let i = 0; i < numeroDeCodigos.value; i++) {
        const nuevoCodigo = {
          expirationDate: fechaExpiracion.toISOString(),
          instituteId: 1,
          exist: true,
          valid: true,
        };
        nuevosCodigos.push(nuevoCodigo);

        // Aquí se pueden realizar la lógica de envío a la API para guardar los códigos
        try {
          await axios.post(`/invitations`, nuevoCodigo);
        } catch (error) {
          console.error("Error al generar el código:", error);
        }
      }

      // Actualizamos la lista de códigos después de la creación
      cargarCodigos();
    };

    onIonViewWillEnter(cargarCodigos);

    return {
      codigos,
      arrowBackOutline,
      keyOutline,
      addCircleOutline,
      copyOutline,
      trashOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      goBack,
      eliminarCodigo,
      invalidarCodigo,
      numeroDeCodigos,
      generarCodigos,
      copiarCodigo,
      mostrarMensaje,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: AUTORIZACIONES / CÓDIGOS DE INVITACIÓN
   ========================================================================== */

.qz-autorizaciones-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-autorizaciones-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-autorizaciones-wrapper {
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

/* 2. CUERPO PRINCIPAL */
.qz-autorizaciones-body {
  padding: 20px 16px 24px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 16px 18px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 6px 18px rgba(12, 9, 42, 0.05);
  width: 100%;
  box-sizing: border-box;
}

/* GENERADOR */
.qz-generator-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.qz-field-label {
  font-size: 11px;
  font-weight: 700;
  color: #6a5ae0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qz-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.15);
  border-radius: 14px;
  height: 44px;
  padding: 0 12px 0 38px;
  box-sizing: border-box;
}

.qz-field-icon {
  position: absolute;
  left: 12px;
  font-size: 17px;
  color: #6a5ae0;
  pointer-events: none;
}

.qz-number-input {
  width: 100%;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 700;
  color: #0c092a;
  outline: none;
}

.qz-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(106, 90, 224, 0.28);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.qz-primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(106, 90, 224, 0.36);
}

.qz-primary-btn:active {
  transform: scale(0.98);
}

@media (max-width: 520px) {
  .qz-generator-row {
    flex-direction: column;
    align-items: stretch;
  }

  .qz-primary-btn {
    width: 100%;
  }
}

/* ENCABEZADO LISTA */
.qz-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 0;
}

.qz-list-title {
  font-size: 12px;
  font-weight: 800;
  color: #6a5ae0;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.qz-count-pill {
  background: #ffffff;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 9999px;
  border: 1px solid rgba(106, 90, 224, 0.16);
}

/* ESTADO VACÍO */
.qz-state-card {
  padding: 36px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.qz-empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.qz-empty-title {
  margin: 4px 0 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
}

.qz-state-text {
  margin: 0;
  font-size: 13.5px;
  color: #858494;
}

/* TARJETAS DE CÓDIGO */
.qz-codes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-code-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: all 0.2s ease;
}

.qz-code-card:hover {
  border-color: rgba(106, 90, 224, 0.32);
  box-shadow: 0 10px 22px rgba(106, 90, 224, 0.1);
}

.qz-code-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-code-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.qz-code-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 16.5px;
  font-weight: 800;
  color: #0c092a;
  letter-spacing: 0.6px;
}

.qz-status-badge {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 9999px;
}

.qz-status-badge.is-active {
  background: #eafbf1;
  color: #16a34a;
}

.qz-status-badge.is-inactive {
  background: #fff1f2;
  color: #e11d48;
}

.qz-code-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  font-weight: 500;
  color: #858494;
}

.qz-copy-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #6a5ae0;
  font-weight: 600;
}

.qz-code-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.qz-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-icon-btn--warn {
  background: #fff6e7;
  color: #d97706;
  border-color: rgba(217, 119, 6, 0.2);
}

.qz-icon-btn--warn:hover {
  background: #d97706;
  color: #ffffff;
}

.qz-icon-btn--success {
  background: #eafbf1;
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.2);
}

.qz-icon-btn--success:hover {
  background: #16a34a;
  color: #ffffff;
}

.qz-icon-btn--danger {
  background: #fff1f2;
  color: #e11d48;
  border-color: rgba(225, 29, 72, 0.2);
}

.qz-icon-btn--danger:hover {
  background: #e11d48;
  color: #ffffff;
}

/* TOAST DE COPIA */
.mensaje-copiado {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #6a5ae0;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 700;
  padding: 11px 22px;
  border-radius: 9999px;
  box-shadow: 0 8px 22px rgba(106, 90, 224, 0.35);
  z-index: 1000;
  animation: fadeOut 2s forwards;
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-autorizaciones-page,
  body:not(.light) .qz-autorizaciones-content {
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

  body:not(.light) .qz-code-card:hover {
    border-color: #7c6ef2;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55);
  }

  body:not(.light) .qz-field-label,
  body:not(.light) .qz-field-icon,
  body:not(.light) .qz-list-title,
  body:not(.light) .qz-copy-hint {
    color: #b5a9ff;
  }

  body:not(.light) .qz-input-wrapper {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.12);
  }

  body:not(.light) .qz-number-input,
  body:not(.light) .qz-code-value,
  body:not(.light) .qz-empty-title {
    color: #f7f7fd;
  }

  body:not(.light) .qz-count-pill,
  body:not(.light) .qz-empty-icon {
    background: #2b2254;
    color: #b5a9ff;
    border-color: rgba(181, 169, 255, 0.2);
  }

  body:not(.light) .qz-code-meta,
  body:not(.light) .qz-state-text {
    color: #9e9bb8;
  }

  body:not(.light) .qz-status-badge.is-active,
  body:not(.light) .qz-icon-btn--success {
    background: rgba(83, 223, 131, 0.16);
    color: #53df83;
    border-color: rgba(83, 223, 131, 0.28);
  }

  body:not(.light) .qz-status-badge.is-inactive,
  body:not(.light) .qz-icon-btn--danger {
    background: rgba(251, 113, 133, 0.16);
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.28);
  }

  body:not(.light) .qz-icon-btn--warn {
    background: rgba(251, 191, 36, 0.16);
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.28);
  }

  body:not(.light) .mensaje-copiado {
    background: #7c6ef2;
  }
}

:global(body.dark) .qz-autorizaciones-page,
:global(body.dark) .qz-autorizaciones-content,
:global(html.dark) .qz-autorizaciones-page,
:global(html.dark) .qz-autorizaciones-content,
:global(.dark) .qz-autorizaciones-page,
:global(.dark) .qz-autorizaciones-content,
:global(:root[data-theme="dark"]) .qz-autorizaciones-page,
:global(:root[data-theme="dark"]) .qz-autorizaciones-content {
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

:global(body.dark) .qz-code-card:hover,
:global(html.dark) .qz-code-card:hover,
:global(.dark) .qz-code-card:hover,
:global(:root[data-theme="dark"]) .qz-code-card:hover {
  border-color: #7c6ef2;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55);
}

:global(body.dark) .qz-field-label,
:global(html.dark) .qz-field-label,
:global(.dark) .qz-field-label,
:global(:root[data-theme="dark"]) .qz-field-label,
:global(body.dark) .qz-field-icon,
:global(html.dark) .qz-field-icon,
:global(.dark) .qz-field-icon,
:global(:root[data-theme="dark"]) .qz-field-icon,
:global(body.dark) .qz-list-title,
:global(html.dark) .qz-list-title,
:global(.dark) .qz-list-title,
:global(:root[data-theme="dark"]) .qz-list-title,
:global(body.dark) .qz-copy-hint,
:global(html.dark) .qz-copy-hint,
:global(.dark) .qz-copy-hint,
:global(:root[data-theme="dark"]) .qz-copy-hint {
  color: #b5a9ff;
}

:global(body.dark) .qz-input-wrapper,
:global(html.dark) .qz-input-wrapper,
:global(.dark) .qz-input-wrapper,
:global(:root[data-theme="dark"]) .qz-input-wrapper {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-number-input,
:global(html.dark) .qz-number-input,
:global(.dark) .qz-number-input,
:global(:root[data-theme="dark"]) .qz-number-input,
:global(body.dark) .qz-code-value,
:global(html.dark) .qz-code-value,
:global(.dark) .qz-code-value,
:global(:root[data-theme="dark"]) .qz-code-value,
:global(body.dark) .qz-empty-title,
:global(html.dark) .qz-empty-title,
:global(.dark) .qz-empty-title,
:global(:root[data-theme="dark"]) .qz-empty-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-count-pill,
:global(html.dark) .qz-count-pill,
:global(.dark) .qz-count-pill,
:global(:root[data-theme="dark"]) .qz-count-pill,
:global(body.dark) .qz-empty-icon,
:global(html.dark) .qz-empty-icon,
:global(.dark) .qz-empty-icon,
:global(:root[data-theme="dark"]) .qz-empty-icon {
  background: #2b2254;
  color: #b5a9ff;
  border-color: rgba(181, 169, 255, 0.2);
}

:global(body.dark) .qz-code-meta,
:global(html.dark) .qz-code-meta,
:global(.dark) .qz-code-meta,
:global(:root[data-theme="dark"]) .qz-code-meta,
:global(body.dark) .qz-state-text,
:global(html.dark) .qz-state-text,
:global(.dark) .qz-state-text,
:global(:root[data-theme="dark"]) .qz-state-text {
  color: #9e9bb8;
}

:global(body.dark) .qz-status-badge.is-active,
:global(html.dark) .qz-status-badge.is-active,
:global(.dark) .qz-status-badge.is-active,
:global(:root[data-theme="dark"]) .qz-status-badge.is-active,
:global(body.dark) .qz-icon-btn--success,
:global(html.dark) .qz-icon-btn--success,
:global(.dark) .qz-icon-btn--success,
:global(:root[data-theme="dark"]) .qz-icon-btn--success {
  background: rgba(83, 223, 131, 0.16);
  color: #53df83;
  border-color: rgba(83, 223, 131, 0.28);
}

:global(body.dark) .qz-status-badge.is-inactive,
:global(html.dark) .qz-status-badge.is-inactive,
:global(.dark) .qz-status-badge.is-inactive,
:global(:root[data-theme="dark"]) .qz-status-badge.is-inactive,
:global(body.dark) .qz-icon-btn--danger,
:global(html.dark) .qz-icon-btn--danger,
:global(.dark) .qz-icon-btn--danger,
:global(:root[data-theme="dark"]) .qz-icon-btn--danger {
  background: rgba(251, 113, 133, 0.16);
  color: #fb7185;
  border-color: rgba(251, 113, 133, 0.28);
}

:global(body.dark) .qz-icon-btn--warn,
:global(html.dark) .qz-icon-btn--warn,
:global(.dark) .qz-icon-btn--warn,
:global(:root[data-theme="dark"]) .qz-icon-btn--warn {
  background: rgba(251, 191, 36, 0.16);
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.28);
}

:global(body.dark) .mensaje-copiado,
:global(html.dark) .mensaje-copiado,
:global(.dark) .mensaje-copiado,
:global(:root[data-theme="dark"]) .mensaje-copiado {
  background: #7c6ef2;
}
</style>
