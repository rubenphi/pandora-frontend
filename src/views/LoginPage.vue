<template>
  <ion-page class="qz-login-page">
    <ion-header class="ion-no-border">
      <ion-toolbar class="qz-toolbar">
        <!-- Barra superior limpia con safe-area -->
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="qz-login-content">
      <div class="qz-auth-wrapper">
        <div class="qz-auth-card">
          <!-- 1. IDENTIDAD Y LOGO (Centralizado en AppLogo.vue) -->
          <div class="qz-auth-header">
            <AppLogo size="lg" :show-text="true" tagline="Plataforma de Aprendizaje & Quiz" />
            <div class="qz-welcome-text">
              <h2 class="qz-welcome-title">¡Bienvenido de nuevo!</h2>
              <p class="qz-welcome-subtitle">Inicia sesión con tu código o correo para continuar</p>
            </div>
          </div>

          <!-- 2. ALERTA DE ERROR ESTILIZADA QUEEZY -->
          <transition name="qz-fade">
            <div v-if="error.estatus === 1" class="qz-error-badge">
              <ion-icon :icon="alertCircleOutline" class="qz-error-icon"></ion-icon>
              <span class="qz-error-msg">{{ error.data }}</span>
            </div>
          </transition>

          <!-- 3. FORMULARIO DE ACCESO -->
          <form class="qz-form" @submit.prevent="mostrar">
            <!-- Campo Usuario / Código -->
            <div class="qz-field-group">
              <label class="qz-field-label">Usuario o Código</label>
              <div class="qz-input-box" :class="{ 'qz-input-box--focused': focusedField === 'code' }">
                <ion-icon :icon="personOutline" class="qz-input-icon"></ion-icon>
                <input
                  v-model="login.code"
                  type="text"
                  autocomplete="username"
                  placeholder="Código (ej. ADM001) o correo"
                  class="qz-native-input"
                  @focus="focusedField = 'code'"
                  @blur="focusedField = null"
                />
              </div>
            </div>

            <!-- Campo Contraseña -->
            <div class="qz-field-group">
              <label class="qz-field-label">Contraseña</label>
              <div class="qz-input-box" :class="{ 'qz-input-box--focused': focusedField === 'password' }">
                <ion-icon :icon="lockClosedOutline" class="qz-input-icon"></ion-icon>
                <input
                  v-model="login.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Tu contraseña secreta"
                  class="qz-native-input"
                  @focus="focusedField = 'password'"
                  @blur="focusedField = null"
                />
                <button
                  type="button"
                  class="qz-eye-btn"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                >
                  <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- Botón Principal: Entrar -->
            <div class="qz-actions-group">
              <QueezyButton
                type="submit"
                variant="primary"
                size="lg"
                :loading="isLoading"
                :block="true"
              >
                Entrar
              </QueezyButton>
            </div>
          </form>

          <!-- 4. SEPARADOR Y ACCIÓN SECUNDARIA -->
          <div class="qz-auth-footer">
            <div class="qz-divider">
              <span class="qz-divider-line"></span>
              <span class="qz-divider-text">¿Eres nuevo aquí?</span>
              <span class="qz-divider-line"></span>
            </div>

            <QueezyButton
              type="button"
              variant="ghost"
              size="md"
              :block="true"
              @click="register"
            >
              Crear una cuenta
            </QueezyButton>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from "vue";
import axios from "axios";
import {
  basedeURL,
  tokenHeader,
  usuarioGet,
  fetchServerTime,
  currentServerDate,
  initializeBaseUrl,
} from "../globalService";
import {
  alertController,
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  onIonViewWillEnter,
} from "@ionic/vue";
import {
  personOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { useRouter } from "vue-router";
import AppLogo from "@/components/common/AppLogo.vue";
import QueezyButton from "@/components/common/QueezyButton.vue";

export default {
  name: "LoginPage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    AppLogo,
    QueezyButton,
  },
  setup() {
    const router = useRouter();

    const login = ref({
      code: "",
      password: "",
    });

    const error = ref({
      estatus: 0,
      data: "",
    });

    const isLoading = ref(false);
    const showPassword = ref(false);
    const focusedField = ref(null);

    onIonViewWillEnter(async () => {
      // En modo standalone local asegurar que apunte a localhost:3000
      initializeBaseUrl();
    });

    const mostrar = async () => {
      // Limpiar espacios accidentales al inicio o final (común en teclados móviles)
      login.value.code = (login.value.code || "").trim();
      login.value.password = (login.value.password || "").trim();

      if (login.value.code === "" || login.value.password === "") {
        error.value.estatus = 1;
        error.value.data = "Debe ingresar usuario y contraseña";
        return;
      }

      // Limpiar errores previos y activar loading
      error.value.estatus = 0;
      error.value.data = "";
      isLoading.value = true;

      try {
        const response = await axios.post("/auth/login", login.value, {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        });

        if (!response.data?.userLoged?.accessToken) {
          error.value.estatus = 1;
          error.value.data = "Error al iniciar sesión: Respuesta no válida";
          return;
        }

        localStorage.setItem(
          "token",
          "Bearer " + response.data.userLoged.accessToken
        );
        localStorage.setItem(
          "usuario",
          JSON.stringify(response.data.userLoged)
        );

        error.value.estatus = 0;
        tokenHeader();

        // Verificar si es profesor o administrador para cargar asignaciones
        const userRole = usuarioGet().rol;
        if (userRole === "teacher" || userRole === "admin") {
          try {
            const teacherAssignmentsResponse = await axios.get(
              `/courses/teacher-assignments/${usuarioGet().id}`
            );
            localStorage.setItem(
              "teacherAssignments",
              JSON.stringify(teacherAssignmentsResponse.data)
            );
          } catch (assignmentError) {
            console.error(
              "Error fetching teacher assignments:",
              assignmentError
            );
            // No bloqueamos el login si esto falla
          }
        }

        // Cargar cursos del usuario
        const coursesResponse = await axios.get(
          `/users/${usuarioGet().id}/courses`
        );
        const cursosUsuario = coursesResponse.data.map((asignacion) => ({
          name: asignacion.course.name,
          id: asignacion.course.id,
          year: asignacion.year,
          active: asignacion.active,
          rol: asignacion.rol,
        }));
        localStorage.setItem("cursosUsuario", JSON.stringify(cursosUsuario));

        // Obtener año / tiempo del servidor
        const serverTime = await fetchServerTime();
        const currentYear = serverTime
          ? serverTime.year
          : currentServerDate().getFullYear();
        localStorage.setItem("year", JSON.stringify(currentYear));

        // Obtener periodos
        const periodsResponse = await axios.get(
          `/periods?instituteId=${usuarioGet().institute.id}`
        );
        const periodos = periodsResponse.data.map((periodo) => ({
          name: periodo.name,
          id: periodo.id,
        }));
        localStorage.setItem("periodos", JSON.stringify(periodos));

        router.push("/inicio");
      } catch (err) {
        error.value.estatus = 1;
        if (err.message === "Network Error") {
          const url = basedeURL();
          const alert = await alertController.create({
            header: "Error de conexión",
            message: `No se pudo conectar con el servidor en ${url}. Por favor, verifique la configuración de la aplicación o contacte al administrador.`,
            buttons: [{ text: "OK", role: "cancel" }],
          });
          await alert.present();
        } else if (err.response) {
          const msg = err.response.data?.message;
          const detalle = msg
            ? Array.isArray(msg)
              ? msg.join(", ")
              : msg
            : "Credenciales incorrectas o error del servidor";
          error.value.data = `Error ${err.response.status}: ${detalle}`;
        } else {
          error.value.data = "Ocurrió un error inesperado durante el login.";
        }
      } finally {
        isLoading.value = false;
      }
    };

    const register = () => {
      router.push("/register");
    };

    return {
      login,
      error,
      isLoading,
      showPassword,
      focusedField,
      mostrar,
      register,
      // Iconos
      personOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      alertCircleOutline,
    };
  },
};
</script>

<style scoped>
/* Contenedor y Fondo Queezy */
.qz-login-page {
  background-color: var(--qz-color-purple-bg, #EFEEFC);
}

.qz-toolbar {
  --background: transparent;
  --min-height: 20px;
}

.qz-login-content {
  --background: var(--qz-color-purple-bg, #EFEEFC);
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
}

.qz-auth-wrapper {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  box-sizing: border-box;
}

/* Tarjeta principal con bordes Queezy y sombra difusa tintada */
.qz-auth-card {
  width: 100%;
  max-width: 420px;
  background: #FFFFFF;
  border-radius: var(--qz-radius-2xl, 32px);
  padding: 36px 28px;
  box-shadow: 0 16px 40px -8px rgba(106, 90, 224, 0.12), 0 2px 8px rgba(12, 9, 42, 0.04);
  box-sizing: border-box;
}

/* Encabezado */
.qz-auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.qz-welcome-text {
  margin-top: 16px;
}

.qz-welcome-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0C092A);
  letter-spacing: -0.2px;
}

.qz-welcome-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 400;
  color: var(--qz-color-text-muted, #858494);
  line-height: 1.4;
}

/* Badge de Error */
.qz-error-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: var(--qz-color-red-bg, #FEECEC);
  border: 1px solid var(--qz-color-red-wrong, #FF5656);
  border-radius: var(--qz-radius-md, 16px);
  padding: 12px 16px;
  margin-bottom: 20px;
}

.qz-error-icon {
  font-size: 20px;
  color: var(--qz-color-red-wrong, #FF5656);
  flex-shrink: 0;
}

.qz-error-msg {
  font-size: 13px;
  font-weight: 600;
  color: #D32F2F;
  line-height: 1.3;
}

/* Campos de Formulario */
.qz-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--qz-color-text-main, #0C092A);
  letter-spacing: 0.2px;
  margin-left: 4px;
}

/* Input Box: Pill redondeado con sombras Queezy */
.qz-input-box {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1.5px solid var(--qz-color-border, #E6E6E6);
  border-radius: var(--qz-radius-lg, 20px);
  padding: 0 16px;
  height: 54px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(12, 9, 42, 0.02);
}

.qz-input-box--focused {
  border-color: var(--qz-color-purple-primary, #6A5AE0);
  box-shadow: 0 0 0 4px rgba(106, 90, 224, 0.15);
}

.qz-input-icon {
  font-size: 20px;
  color: var(--qz-color-text-muted, #858494);
  margin-right: 12px;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.qz-input-box--focused .qz-input-icon {
  color: var(--qz-color-purple-primary, #6A5AE0);
}

.qz-native-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--qz-color-text-main, #0C092A);
}

.qz-native-input::placeholder {
  color: #A3A2AF;
  font-weight: 400;
}

.qz-eye-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--qz-color-text-muted, #858494);
  font-size: 20px;
  outline: none;
  transition: color 0.2s ease;
}

.qz-eye-btn:hover {
  color: var(--qz-color-purple-primary, #6A5AE0);
}

/* Grupo de botones y footer */
.qz-actions-group {
  margin-top: 10px;
}

.qz-auth-footer {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-divider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qz-divider-line {
  flex: 1;
  height: 1px;
  background-color: var(--qz-color-border, #E6E6E6);
}

.qz-divider-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--qz-color-text-muted, #858494);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Animaciones */
.qz-fade-enter-active,
.qz-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.qz-fade-enter-from,
.qz-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Responsividad en pantallas móviles pequeñas */
@media (max-width: 480px) {
  .qz-auth-wrapper {
    padding: 16px 12px;
  }

  .qz-auth-card {
    padding: 28px 18px;
    border-radius: var(--qz-radius-xl, 24px);
  }

  .qz-welcome-title {
    font-size: 18px;
  }
}

/* ==========================================================================
   DARK MODE OVERRIDES (Login Page)
   ========================================================================== */
body.dark .qz-login-page,
html.dark .qz-login-page,
.dark .qz-login-page {
  background-color: #110D26;
}

body.dark .qz-login-content,
html.dark .qz-login-content,
.dark .qz-login-content {
  --background: #110D26;
  background-color: #110D26;
}

body.dark .qz-auth-card,
html.dark .qz-auth-card,
.dark .qz-auth-card {
  background: #1D1838;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.25);
}

body.dark .qz-welcome-title,
html.dark .qz-welcome-title,
.dark .qz-welcome-title {
  color: #F7F7FD;
}

body.dark .qz-welcome-subtitle,
html.dark .qz-welcome-subtitle,
.dark .qz-welcome-subtitle {
  color: #9E9BB8;
}

body.dark .qz-field-label,
html.dark .qz-field-label,
.dark .qz-field-label {
  color: #F7F7FD;
}

body.dark .qz-input-box,
html.dark .qz-input-box,
.dark .qz-input-box {
  background: #17132E;
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

body.dark .qz-input-box--focused,
html.dark .qz-input-box--focused,
.dark .qz-input-box--focused {
  border-color: #7C6EF2;
  box-shadow: 0 0 0 4px rgba(124, 110, 242, 0.22);
}

body.dark .qz-input-icon,
html.dark .qz-input-icon,
.dark .qz-input-icon {
  color: #9E9BB8;
}

body.dark .qz-input-box--focused .qz-input-icon,
html.dark .qz-input-box--focused .qz-input-icon,
.dark .qz-input-box--focused .qz-input-icon {
  color: #7C6EF2;
}

body.dark .qz-native-input,
html.dark .qz-native-input,
.dark .qz-native-input {
  color: #F7F7FD;
}

body.dark .qz-native-input::placeholder,
html.dark .qz-native-input::placeholder,
.dark .qz-native-input::placeholder {
  color: #6E6B8B;
}

body.dark .qz-eye-btn,
html.dark .qz-eye-btn,
.dark .qz-eye-btn {
  color: #9E9BB8;
}

body.dark .qz-eye-btn:hover,
html.dark .qz-eye-btn:hover,
.dark .qz-eye-btn:hover {
  color: #7C6EF2;
}

body.dark .qz-divider-line,
html.dark .qz-divider-line,
.dark .qz-divider-line {
  background-color: rgba(255, 255, 255, 0.1);
}

body.dark .qz-divider-text,
html.dark .qz-divider-text,
.dark .qz-divider-text {
  color: #9E9BB8;
}

body.dark .qz-auth-footer .qz-btn--ghost,
html.dark .qz-auth-footer .qz-btn--ghost,
.dark .qz-auth-footer .qz-btn--ghost {
  background-color: #252048;
  color: #F7F7FD;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

body.dark .qz-auth-footer .qz-btn--ghost:hover:not(:disabled),
html.dark .qz-auth-footer .qz-btn--ghost:hover:not(:disabled),
.dark .qz-auth-footer .qz-btn--ghost:hover:not(:disabled) {
  background-color: #2C2654;
  border-color: #7C6EF2;
  color: #A39BF0;
}

@media (prefers-color-scheme: dark) {
  .qz-login-page {
    background-color: #110D26;
  }

  .qz-login-content {
    --background: #110D26;
    background-color: #110D26;
  }

  .qz-auth-card {
    background: #1D1838;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.25);
  }

  .qz-welcome-title {
    color: #F7F7FD;
  }

  .qz-welcome-subtitle {
    color: #9E9BB8;
  }

  .qz-field-label {
    color: #F7F7FD;
  }

  .qz-input-box {
    background: #17132E;
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .qz-input-box--focused {
    border-color: #7C6EF2;
    box-shadow: 0 0 0 4px rgba(124, 110, 242, 0.22);
  }

  .qz-input-icon {
    color: #9E9BB8;
  }

  .qz-input-box--focused .qz-input-icon {
    color: #7C6EF2;
  }

  .qz-native-input {
    color: #F7F7FD;
  }

  .qz-native-input::placeholder {
    color: #6E6B8B;
  }

  .qz-eye-btn {
    color: #9E9BB8;
  }

  .qz-eye-btn:hover {
    color: #7C6EF2;
  }

  .qz-divider-line {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .qz-divider-text {
    color: #9E9BB8;
  }

  .qz-auth-footer .qz-btn--ghost {
    background-color: #252048;
    color: #F7F7FD;
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  }

  .qz-auth-footer .qz-btn--ghost:hover:not(:disabled) {
    background-color: #2C2654;
    border-color: #7C6EF2;
    color: #A39BF0;
  }
}
</style>
