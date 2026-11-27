<template>
  <div v-if="isDemoLocked" class="qz-demo-overlay">
    <div class="qz-demo-card">
      <!-- Icono de Bloqueo con disparador secreto (5 toques) -->
      <div
        class="qz-demo-icon-squircle"
        title="Licencia demo"
        @click="handleSecretTap"
      >
        <ion-icon :icon="lockClosedOutline" class="qz-demo-icon"></ion-icon>
      </div>

      <!-- Título y Mensaje de Licencia Demo -->
      <div class="qz-demo-header">
        <span class="qz-demo-badge">LICENCIA DEMO</span>
        <h2 class="qz-demo-title">Licencia de Prueba Vencida</h2>
        <p class="qz-demo-message">
          Tu licencia demo venció, comunícate con el desarrollador
        </p>
      </div>

      <!-- Detalle de Fecha Límite -->
      <div v-if="rawDemoDate" class="qz-demo-date-box">
        <ion-icon :icon="calendarOutline"></ion-icon>
        <span>Fecha límite asignada: {{ rawDemoDate }}</span>
      </div>

      <!-- PANEL SECRETO DE RESCATE (DESARROLLADOR) -->
      <div v-if="isRescueMode" class="qz-rescue-panel">
        <div class="qz-rescue-header">
          <ion-icon :icon="keyOutline"></ion-icon>
          <span>Acceso de Rescate Técnico</span>
        </div>

        <div v-if="!isSecretAuthorized" class="qz-rescue-form">
          <input
            v-model="secretPin"
            type="password"
            class="qz-rescue-input"
            placeholder="Clave de desarrollador..."
            @keyup.enter="validateSecretPin"
          />
          <button
            type="button"
            class="qz-primary-btn qz-rescue-submit-btn"
            @click="validateSecretPin"
          >
            <span>Verificar</span>
          </button>
        </div>

        <div v-if="secretError" class="qz-rescue-error">
          {{ secretError }}
        </div>

        <!-- ACCIONES DE DESCARGA / DESBLOQUEO UNA VEZ AUTORIZADO -->
        <div v-if="isSecretAuthorized" class="qz-rescue-actions">
          <div class="qz-rescue-success-badge">
            Acceso autorizado correctamente
          </div>

          <button
            type="button"
            class="qz-primary-btn qz-export-btn"
            :disabled="isExporting"
            @click="exportStorageZip"
          >
            <ion-spinner
              v-if="isExporting"
              name="crescent"
              class="qz-spinner-sm"
            ></ion-spinner>
            <ion-icon v-else :icon="cloudDownloadOutline"></ion-icon>
            <span>{{ isExporting ? 'Generando ZIP...' : 'Exportar Storage Completo (ZIP)' }}</span>
          </button>

          <button
            type="button"
            class="qz-secondary-btn qz-unlock-btn"
            @click="bypassDemo"
          >
            <ion-icon :icon="lockOpenOutline"></ion-icon>
            <span>Desbloquear Sesión</span>
          </button>

          <p class="qz-rescue-note">
            El archivo ZIP incluye la base de datos SQL íntegra y todos los archivos/evidencias de la carpeta storage.
          </p>
        </div>
      </div>

      <!-- Pie informativo normal -->
      <div v-else class="qz-demo-footer">
        <p class="qz-demo-contact">
          Para renovar la licencia o adquirir una versión permanente, por favor ponte en contacto con el soporte oficial.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from "vue";
import { IonIcon, IonSpinner } from "@ionic/vue";
import {
  lockClosedOutline,
  lockOpenOutline,
  calendarOutline,
  keyOutline,
  cloudDownloadOutline,
} from "ionicons/icons";
import { Capacitor } from "@capacitor/core";
import { basedeURL } from "../globalService";
import {
  isDemoLocked,
  getRawDemoDateString,
  unlockDemoTemporarily,
} from "../utils/demoLicense";

export default defineComponent({
  name: "DemoExpiredModal",
  components: {
    IonIcon,
    IonSpinner,
  },
  setup() {
    const rawDemoDate = ref(getRawDemoDateString());
    const tapCount = ref(0);
    const lastTapTime = ref(0);
    const isRescueMode = ref(false);
    const secretPin = ref("");
    const isSecretAuthorized = ref(false);
    const secretError = ref("");
    const isExporting = ref(false);

    // Secreto: 5 toques en menos de 3 segundos
    const handleSecretTap = () => {
      const now = Date.now();
      if (now - lastTapTime.value > 3000) {
        tapCount.value = 0;
      }
      lastTapTime.value = now;
      tapCount.value++;

      if (tapCount.value >= 5) {
        isRescueMode.value = true;
        tapCount.value = 0;
      }
    };

    const validateSecretPin = () => {
      secretError.value = "";
      const trimmed = secretPin.value.trim();
      // Claves maestras autorizadas
      if (trimmed === "pandora777" || trimmed === "2026demo" || trimmed === "7777") {
        isSecretAuthorized.value = true;
      } else {
        secretError.value = "Clave de desarrollador incorrecta.";
      }
    };

    const exportStorageZip = () => {
      isExporting.value = true;
      secretError.value = "";
      try {
        const rawBase = basedeURL() || "";
        const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
        const downloadUrl = `${base}files/export-storage-zip`;

        if (Capacitor.isNativePlatform()) {
          // En movil nativo abrimos la descarga a traves del navegador del sistema
          window.open(downloadUrl, "_system");
        } else {
          // En navegador web descargamos directamente por streaming mediante enlace nativo
          // Sin cargar los archivos en el heap de JavaScript, evitando errores de memoria Out of Memory
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.setAttribute(
            "download",
            `pandora_storage_backup_${Date.now()}.zip`,
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        setTimeout(() => {
          isExporting.value = false;
        }, 2500);
      } catch (error) {
        console.error("Error al exportar respaldo de storage:", error);
        secretError.value =
          "No se pudo generar el respaldo. Verifique que el servicio backend esté en ejecución.";
        isExporting.value = false;
      }
    };

    const bypassDemo = () => {
      unlockDemoTemporarily();
      isRescueMode.value = false;
      isSecretAuthorized.value = false;
      secretPin.value = "";
    };

    watch(isDemoLocked, (locked) => {
      if (locked) {
        isRescueMode.value = false;
        isSecretAuthorized.value = false;
        secretPin.value = "";
        secretError.value = "";
      }
    });

    return {
      isDemoLocked,
      rawDemoDate,
      isRescueMode,
      handleSecretTap,
      secretPin,
      validateSecretPin,
      isSecretAuthorized,
      secretError,
      isExporting,
      exportStorageZip,
      bypassDemo,
      // Iconos
      lockClosedOutline,
      lockOpenOutline,
      calendarOutline,
      keyOutline,
      cloudDownloadOutline,
    };
  },
});
</script>

<style scoped>
.qz-demo-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(13, 10, 26, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 20px;
  box-sizing: border-box;
}

.qz-demo-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 24px;
  padding: 32px 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
  animation: qzDemoPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes qzDemoPopIn {
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(14px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.qz-demo-icon-squircle {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #ff4757, #ff6b81);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(255, 71, 87, 0.35);
  margin-bottom: 20px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease;
}

.qz-demo-icon-squircle:active {
  transform: scale(0.92);
}

.qz-demo-icon {
  font-size: 34px;
  color: #ffffff;
}

.qz-demo-header {
  margin-bottom: 16px;
}

.qz-demo-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  color: #ff4757;
  background: #ffe5e8;
  padding: 4px 10px;
  border-radius: 9999px;
  letter-spacing: 0.8px;
  margin-bottom: 10px;
}

.qz-demo-title {
  font-size: 20px;
  font-weight: 800;
  color: #0c092a;
  margin: 0 0 8px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-demo-message {
  font-size: 14px;
  font-weight: 600;
  color: #49465f;
  line-height: 1.45;
  margin: 0;
}

.qz-demo-date-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f7f6fd;
  border: 1px solid #e7e5f8;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6a5ae0;
  margin-bottom: 20px;
}

.qz-demo-footer {
  margin-top: 8px;
}

.qz-demo-contact {
  font-size: 12px;
  color: #858494;
  line-height: 1.4;
  margin: 0;
}

/* PANEL SECRETO */
.qz-rescue-panel {
  width: 100%;
  background: #f7f6fd;
  border: 1.5px dashed #6a5ae0;
  border-radius: 18px;
  padding: 16px;
  box-sizing: border-box;
  margin-top: 10px;
}

.qz-rescue-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #6a5ae0;
  margin-bottom: 12px;
}

.qz-rescue-form {
  display: flex;
  gap: 8px;
}

.qz-rescue-input {
  flex: 1;
  height: 40px;
  background: #ffffff;
  border: 1.5px solid #dcd9f6;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 13px;
  color: #0c092a;
  outline: none;
  box-sizing: border-box;
}

.qz-rescue-input:focus {
  border-color: #6a5ae0;
}

.qz-rescue-submit-btn {
  height: 40px;
  padding: 0 14px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.qz-rescue-error {
  font-size: 11px;
  color: #ff4757;
  font-weight: 600;
  margin-top: 8px;
}

.qz-rescue-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.qz-rescue-success-badge {
  font-size: 11px;
  font-weight: 700;
  color: #12b76a;
  background: #e6f9f0;
  padding: 4px 10px;
  border-radius: 9999px;
  margin-bottom: 4px;
}

.qz-export-btn {
  width: 100%;
  height: 44px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.3);
}

.qz-export-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.qz-unlock-btn {
  width: 100%;
  height: 40px;
  background: #efeefc;
  color: #6a5ae0;
  border: none;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.qz-rescue-note {
  font-size: 10.5px;
  color: #858494;
  line-height: 1.35;
  margin: 4px 0 0 0;
}

.qz-spinner-sm {
  width: 18px;
  height: 18px;
  --color: #ffffff;
}

/* ========================================================= */
/* DARK MODE                                                 */
/* ========================================================= */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-demo-card {
    background: #17132e !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  body:not(.light) .qz-demo-title {
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-demo-message {
    color: #b7aefa !important;
  }
  body:not(.light) .qz-demo-date-box {
    background: #241d42 !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    color: #c7bfff !important;
  }
  body:not(.light) .qz-demo-contact {
    color: #9e9bb8 !important;
  }
  body:not(.light) .qz-rescue-panel {
    background: #201b3e !important;
    border-color: #8c7ef8 !important;
  }
  body:not(.light) .qz-rescue-header {
    color: #b7aefa !important;
  }
  body:not(.light) .qz-rescue-input {
    background: #17132e !important;
    border-color: rgba(255, 255, 255, 0.14) !important;
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-unlock-btn {
    background: #292150 !important;
    color: #c7bfff !important;
  }
}

:global(body.dark) .qz-demo-card,
:global(html.dark) .qz-demo-card,
:global(.dark) .qz-demo-card,
:global(:root[data-theme="dark"]) .qz-demo-card {
  background: #17132e !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:global(body.dark) .qz-demo-title,
:global(html.dark) .qz-demo-title,
:global(.dark) .qz-demo-title,
:global(:root[data-theme="dark"]) .qz-demo-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-demo-message,
:global(html.dark) .qz-demo-message,
:global(.dark) .qz-demo-message,
:global(:root[data-theme="dark"]) .qz-demo-message {
  color: #b7aefa !important;
}

:global(body.dark) .qz-demo-date-box,
:global(html.dark) .qz-demo-date-box,
:global(.dark) .qz-demo-date-box,
:global(:root[data-theme="dark"]) .qz-demo-date-box {
  background: #241d42 !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: #c7bfff !important;
}

:global(body.dark) .qz-demo-contact,
:global(html.dark) .qz-demo-contact,
:global(.dark) .qz-demo-contact,
:global(:root[data-theme="dark"]) .qz-demo-contact {
  color: #9e9bb8 !important;
}

:global(body.dark) .qz-rescue-panel,
:global(html.dark) .qz-rescue-panel,
:global(.dark) .qz-rescue-panel,
:global(:root[data-theme="dark"]) .qz-rescue-panel {
  background: #201b3e !important;
  border-color: #8c7ef8 !important;
}

:global(body.dark) .qz-rescue-header,
:global(html.dark) .qz-rescue-header,
:global(.dark) .qz-rescue-header,
:global(:root[data-theme="dark"]) .qz-rescue-header {
  color: #b7aefa !important;
}

:global(body.dark) .qz-rescue-input,
:global(html.dark) .qz-rescue-input,
:global(.dark) .qz-rescue-input,
:global(:root[data-theme="dark"]) .qz-rescue-input {
  background: #17132e !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
  color: #f7f7fd !important;
}

:global(body.dark) .qz-unlock-btn,
:global(html.dark) .qz-unlock-btn,
:global(.dark) .qz-unlock-btn,
:global(:root[data-theme="dark"]) .qz-unlock-btn {
  background: #292150 !important;
  color: #c7bfff !important;
}
</style>
