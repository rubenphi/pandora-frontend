<template>
  <ion-page class="ion-page qz-register-page">
    <ion-header class="qz-register-header">
      <ion-toolbar class="qz-register-toolbar">
        <ion-buttons slot="start">
          <ion-button
            v-if="!userLoged?.id"
            @click="goBack('/register')"
            aria-label="Volver al asistente de registro"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
          <ion-button
            v-if="userLoged?.id"
            @click="goBack('/admin/gestionar/usuarios')"
            aria-label="Volver a usuarios"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ esAdmin ? 'Nuevo Usuario' : 'Registro' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="registrarUsuario" aria-label="Guardar registro">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="qz-register-content">
      <div class="qz-auth-wrapper">
        <div class="qz-auth-card">
          <div class="qz-auth-header">
            <div class="qz-badge-pill">
              <ion-icon :icon="personAddOutline"></ion-icon>
              <span>{{ esAdmin ? 'Administración' : 'Nueva cuenta' }}</span>
            </div>
            <h2 class="qz-welcome-title">
              {{ esAdmin ? 'Registrar nuevo usuario' : 'Crea tu cuenta en Pandora' }}
            </h2>
            <p class="qz-welcome-subtitle">
              {{
                esAdmin
                  ? 'Completa los datos del usuario y asígnalo opcionalmente a un curso o grupo.'
                  : 'Ingresa tus datos personales y el código de invitación de tu institución.'
              }}
            </p>
          </div>

          <form class="qz-form" @submit.prevent="registrarUsuario">
            <div class="qz-form-grid">
              <div class="qz-field-group">
                <label class="qz-field-label">Nombre <span class="qz-required">*</span></label>
                <div class="qz-input-box" :class="{ 'qz-input-box--focused': focusedField === 'name' }">
                  <ion-icon :icon="personOutline" class="qz-input-icon"></ion-icon>
                  <input
                    v-model="formData.name"
                    type="text"
                    placeholder="Escribe tu nombre"
                    class="qz-native-input"
                    @focus="focusedField = 'name'"
                    @blur="focusedField = null"
                  />
                </div>
              </div>

              <div class="qz-field-group">
                <label class="qz-field-label">Apellido <span class="qz-required">*</span></label>
                <div class="qz-input-box" :class="{ 'qz-input-box--focused': focusedField === 'lastName' }">
                  <ion-icon :icon="personOutline" class="qz-input-icon"></ion-icon>
                  <input
                    v-model="formData.lastName"
                    type="text"
                    placeholder="Escribe tu apellido"
                    class="qz-native-input"
                    @focus="focusedField = 'lastName'"
                    @blur="focusedField = null"
                  />
                </div>
              </div>
            </div>

            <div class="qz-field-group">
              <label class="qz-field-label">Correo electrónico</label>
              <div class="qz-input-box" :class="{ 'qz-input-box--focused': focusedField === 'email' }">
                <ion-icon :icon="mailOutline" class="qz-input-icon"></ion-icon>
                <input
                  v-model="formData.email"
                  type="email"
                  placeholder="Escribe tu correo electrónico"
                  class="qz-native-input"
                  @focus="focusedField = 'email'"
                  @blur="focusedField = null"
                />
              </div>
            </div>

            <div class="qz-form-grid">
              <div class="qz-field-group">
                <label class="qz-field-label">Código / Documento <span class="qz-required">*</span></label>
                <div class="qz-input-box" :class="{ 'qz-input-box--focused': focusedField === 'code' }">
                  <ion-icon :icon="cardOutline" class="qz-input-icon"></ion-icon>
                  <input
                    v-model="formData.code"
                    type="text"
                    placeholder="Escribe tu código"
                    class="qz-native-input"
                    @focus="focusedField = 'code'"
                    @blur="focusedField = null"
                  />
                </div>
              </div>

              <div class="qz-field-group">
                <label class="qz-field-label">Teléfono</label>
                <div class="qz-input-box" :class="{ 'qz-input-box--focused': focusedField === 'telephone' }">
                  <ion-icon :icon="callOutline" class="qz-input-icon"></ion-icon>
                  <input
                    v-model="formData.telephone"
                    type="tel"
                    inputmode="numeric"
                    placeholder="Número de teléfono"
                    class="qz-native-input"
                    @focus="focusedField = 'telephone'"
                    @blur="focusedField = null"
                    @input="filterNumericInput($event, formData, 'telephone')"
                  />
                </div>
              </div>
            </div>

            <div v-if="!esAdmin" class="qz-field-group">
              <label class="qz-field-label">Invitación de la institución</label>
              <div class="qz-input-box" :class="{ 'qz-input-box--focused': focusedField === 'invitation' }">
                <ion-icon :icon="keyOutline" class="qz-input-icon"></ion-icon>
                <input
                  v-model="formData.instituteInvitation"
                  type="text"
                  placeholder="Escribe el código de invitación"
                  class="qz-native-input"
                  @focus="focusedField = 'invitation'"
                  @blur="focusedField = null"
                />
              </div>
            </div>

            <div class="qz-field-group">
              <label class="qz-field-label">Contraseña <span class="qz-required">*</span></label>
              <div class="qz-input-box" :class="{ 'qz-input-box--focused': focusedField === 'password' }">
                <ion-icon :icon="lockClosedOutline" class="qz-input-icon"></ion-icon>
                <input
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Escribe tu contraseña"
                  class="qz-native-input"
                  @focus="focusedField = 'password'"
                  @blur="focusedField = null"
                />
                <button
                  type="button"
                  class="qz-eye-btn"
                  @click="showPassword = !showPassword"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- Campos para administradores y directivos -->
            <template v-if="esAdmin">
              <div class="qz-admin-section">
                <span class="qz-admin-section-title">Asignación Académica</span>

                <div class="qz-form-grid">
                  <div class="qz-field-group">
                    <label class="qz-field-label">Año Lectivo</label>
                    <div class="qz-select-box">
                      <ion-select
                        v-model="selectedYear"
                        interface="popover"
                        placeholder="Seleccione el año"
                        class="qz-ion-select"
                        @ionChange="getCursos"
                      >
                        <ion-select-option
                          v-for="year in years"
                          :key="year"
                          :value="year"
                        >
                          {{ year }}
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>

                  <div class="qz-field-group">
                    <label class="qz-field-label">Rol del usuario</label>
                    <div class="qz-select-box">
                      <ion-select
                        v-model="selectedRol"
                        interface="popover"
                        placeholder="Seleccione el rol"
                        class="qz-ion-select"
                      >
                        <ion-select-option
                          v-for="rol in roles"
                          :key="rol.rol"
                          :value="rol.rol"
                        >
                          {{ rol.titulo }}
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>
                </div>

                <div class="qz-form-grid">
                  <div class="qz-field-group">
                    <label class="qz-field-label">Curso</label>
                    <div class="qz-select-box">
                      <ion-select
                        v-model="selectedCourseId"
                        interface="popover"
                        placeholder="Seleccione el curso (opcional)"
                        class="qz-ion-select"
                        @ionChange="getGruposCurso"
                      >
                        <ion-select-option :value="null">Sin asignar</ion-select-option>
                        <ion-select-option
                          v-for="curso in cursosInstituto"
                          :key="curso.id"
                          :value="curso.id"
                        >
                          {{ curso.name }}
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>

                  <div v-if="selectedCourseId" class="qz-field-group">
                    <label class="qz-field-label">Grupo</label>
                    <div class="qz-select-box">
                      <ion-select
                        v-model="selectedGroupId"
                        interface="popover"
                        placeholder="Seleccione el grupo (opcional)"
                        :disabled="!selectedCourseId"
                        class="qz-ion-select"
                      >
                        <ion-select-option :value="null">Sin asignar</ion-select-option>
                        <ion-select-option
                          v-for="grupo in gruposCursoDestino"
                          :key="grupo.id"
                          :value="grupo.id"
                        >
                          {{ grupo.name }}
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <div class="qz-actions-group">
              <button type="submit" class="qz-btn qz-btn--primary">
                <ion-icon :icon="checkmarkOutline"></ion-icon>
                <span>{{ esAdmin ? 'Crear Usuario' : 'Registrarme' }}</span>
              </button>

              <button
                type="button"
                class="qz-btn qz-btn--ghost"
                @click="goBack(userLoged?.id ? '/admin/gestionar/usuarios' : '/login')"
              >
                <span>{{ userLoged?.id ? 'Volver a Usuarios' : 'Ya tengo cuenta · Iniciar Sesión' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ion-toast
        :is-open="isSuccessToastOpen"
        position="middle"
        message="Registro exitoso. Redirigiendo..."
        :duration="3000"
        @didDismiss="setSuccessToastOpen(false)"
        color="success"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        position="middle"
        :message="errorMessage"
        :duration="3000"
        @didDismiss="setErrorToastOpen(false)"
        color="danger"
      ></ion-toast>
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
  IonIcon,
  IonButton,
  IonButtons,
  IonToast,
  IonSelect,
  IonSelectOption,
  onIonViewWillEnter,
} from "@ionic/vue";

import axios from "axios";
import {
  arrowBackOutline,
  checkmarkOutline,
  personOutline,
  personAddOutline,
  mailOutline,
  cardOutline,
  callOutline,
  keyOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
} from "ionicons/icons";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { adminOdirectivo, tokenHeader, selectedYear as selectedYearService, currentServerYear } from "../globalService";

export default {
  components: {
    IonButton,
    IonButtons,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonToast,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const router = useRouter();
    const goBack = (target) => {
      router.push(target);
    };
    const isSuccessToastOpen = ref(false);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const userLoged = ref({});
    const esAdmin = ref(!!adminOdirectivo());
    const focusedField = ref(null);
    const showPassword = ref(false);

    // Nuevas referencias para la gestión de cursos
    const selectedYearVal = selectedYearService();
    const selectedYear = ref(selectedYearVal);
    const years = ref(
      Array.from({ length: 10 }, (_, i) => currentServerYear() - i)
    );
    const selectedRol = ref("student");
    const selectedCourseId = ref(null);
    const selectedGroupId = ref(null);
    const cursosInstituto = ref([]);
    const gruposCursoDestino = ref([]);

    const roles = ref([
      { titulo: "Estudiante", rol: "student" },
      { titulo: "Profesor", rol: "teacher" },
      { titulo: "Coordinador", rol: "coordinator" },
      { titulo: "Rector / Directivo", rol: "director" },
      { titulo: "Administrador", rol: "admin" },
    ]);

    const setSuccessToastOpen = (state) => {
      isSuccessToastOpen.value = state;
    };

    const setErrorToastOpen = (state) => {
      isErrorToastOpen.value = state;
    };

    const getCursos = async () => {
      if (userLoged.value?.institute?.id) {
        const response = await axios.get(
          `/courses?instituteId=${userLoged.value.institute.id}&exist=true`,
          tokenHeader()
        );
        cursosInstituto.value = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        
        // Ensure groups are updated or cleared if year changes
        if (selectedCourseId.value) {
          getGruposCurso();
        } else {
          gruposCursoDestino.value = [];
          selectedGroupId.value = null;
        }
      }
    };

    const getGruposCurso = async () => {
      if (selectedCourseId.value) {
        try {
          tokenHeader();
          const response = await axios.get(
            `/courses/${selectedCourseId.value}/groups?year=${selectedYear.value}`
          );
          
          let gruposFiltrados = response.data;
          
          if (Array.isArray(gruposFiltrados)) {
            gruposFiltrados = gruposFiltrados.filter(
              (grupo) => 
                grupo.year === parseInt(selectedYear.value, 10) && 
                grupo.exist !== false && 
                grupo.active !== false
            );
          }
          
          gruposCursoDestino.value = gruposFiltrados;
          // Clear current group selection if it does not exist in the new filtered array
          if (selectedGroupId.value && !gruposCursoDestino.value.find(g => g.id === selectedGroupId.value)) {
            selectedGroupId.value = null;
          }
        } catch (error) {
          console.error("Error fetching groups:", error);
          gruposCursoDestino.value = [];
          selectedGroupId.value = null;
        }
      } else {
        gruposCursoDestino.value = [];
        selectedGroupId.value = null;
      }
    };

    onIonViewWillEnter(async () => {
      userLoged.value = JSON.parse(localStorage.getItem("usuario")) || {};
      esAdmin.value = !!adminOdirectivo();
      if (esAdmin.value) {
        await getCursos();
      }
    });

    return {
      router,
      goBack,
      arrowBackOutline,
      checkmarkOutline,
      personOutline,
      personAddOutline,
      mailOutline,
      cardOutline,
      callOutline,
      keyOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      focusedField,
      showPassword,
      isSuccessToastOpen,
      isErrorToastOpen,
      setSuccessToastOpen,
      setErrorToastOpen,
      errorMessage,
      userLoged,
      esAdmin,
      selectedYear,
      years,
      selectedRol,
      roles,
      selectedCourseId,
      selectedGroupId,
      cursosInstituto,
      gruposCursoDestino,
      getCursos,
      getGruposCurso,
    };
  },
  data() {
    return {
      formData: {
        name: "",
        lastName: "",
        email: "",
        code: "",
        telephone: "", // Added telephone field
        instituteInvitation: "",
        password: "",
        exist: false,
      },
    };
  },
  methods: {
    filterNumericInput(event, item, field) {
      let value = event.target.value;
      console.log('filterNumericInput called for field:', field, 'with value:', value);
      if (value === null || value === undefined) {
        value = '';
      }
      const filteredValue = value.replace(/\D/g, ''); // Remove non-digits
      if (value !== filteredValue) {
        event.target.value = filteredValue; // Update the input element directly
        item[field] = filteredValue; // Update the v-model bound property
        console.log('Filtered value set to:', item[field]);
      } else {
        item[field] = value; // Ensure v-model is always in sync
      }
    },

    async asignarUsuarioACurso(userId) {
      try {
        // Asignar usuario al curso
        if (this.selectedCourseId) {
          await axios.post(
            `/courses/${this.selectedCourseId}/users`,
            [
              {
                userId: userId,
                year: this.selectedYear,
                rol: this.selectedRol,
                active: true,
              },
            ],
            tokenHeader()
          );
        }

        // Si hay grupo seleccionado, asignar usuario al grupo
        if (this.selectedGroupId) {
          await axios.post(
            `/groups/${this.selectedGroupId}/users`,
            [
              {
                userId: userId,
                periodId: 1, // Default period
                year: this.selectedYear,
                active: true,
              },
            ],
            tokenHeader()
          );
        }
      } catch (error) {
        console.error("Error al asignar usuario:", error);
        throw error;
      }
    },

    async registrarUsuario() {
      // Frontend validation for telephone
      if (this.formData.telephone && !/^\d+$/.test(this.formData.telephone)) {
        this.errorMessage = "El número de teléfono solo debe contener dígitos.";
        this.isErrorToastOpen = true;
        return;
      }

      if (
        !this.formData.name ||
        !this.formData.lastName ||
        !this.formData.code ||
        !this.formData.password
      ) {
        this.errorMessage =
          "Por favor completa los campos obligatorios: nombre, apellido, código y contraseña.";
        this.isErrorToastOpen = true;
        return;
      }

      try {
        tokenHeader();

        const payload = {
          name: this.formData.name,
          lastName: this.formData.lastName,
          email: this.formData.email,
          code: this.formData.code,
          telephone: this.formData.telephone || undefined,
          password: this.formData.password,
          exist: true,
        };

        if (this.esAdmin) {
          payload.rol = this.selectedRol || "student";
        } else {
          payload.instituteInvitation = this.formData.instituteInvitation;
        }

        const response = await axios.post("/users", payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Si es admin y hay curso seleccionado, asignar el usuario
        if (this.esAdmin && this.selectedCourseId) {
          await this.asignarUsuarioACurso(response.data.id);
        }

        this.isSuccessToastOpen = true;
        setTimeout(() => {
          if (this.userLoged?.id !== undefined) {
            this.$router.push("/admin/gestionar/usuarios");
          } else {
            this.$router.push("/login");
          }
        }, 1800);
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "Error al registrar el usuario";
        this.isErrorToastOpen = true;
      }
    },
  },
};
</script>

<style scoped>
/* ==========================================================================
   MODO CLARO (QUEEZY) - /register
   ========================================================================== */
.qz-register-page {
  --background: var(--qz-color-purple-bg, #EFEEFC);
  background-color: var(--qz-color-purple-bg, #EFEEFC);
}

.qz-register-toolbar {
  --background: #FFFFFF;
  --color: #0C092A;
  --border-color: rgba(106, 90, 224, 0.12);
}

.qz-register-content {
  --background: var(--qz-color-purple-bg, #EFEEFC);
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
}

.qz-register-content::part(scroll) {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
}

.qz-auth-wrapper {
  margin: auto;
  width: 100%;
  max-width: 580px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px 40px;
  box-sizing: border-box;
}

.qz-auth-card {
  width: 100%;
  background: #FFFFFF;
  border-radius: var(--qz-radius-2xl, 28px);
  padding: 30px 26px;
  box-shadow: 0 16px 40px -8px rgba(106, 90, 224, 0.12), 0 2px 8px rgba(12, 9, 42, 0.04);
  border: 1px solid rgba(106, 90, 224, 0.08);
  box-sizing: border-box;
}

.qz-auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.qz-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(106, 90, 224, 0.1);
  color: #6A5AE0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin-bottom: 12px;
}

.qz-welcome-title {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  color: #0C092A;
  letter-spacing: -0.2px;
}

.qz-welcome-subtitle {
  margin: 6px 0 0;
  font-size: 13.5px;
  color: #858494;
  line-height: 1.45;
  max-width: 440px;
}

.qz-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 540px) {
  .qz-form-grid {
    grid-template-columns: 1fr;
  }
  .qz-auth-card {
    padding: 24px 18px;
  }
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #0C092A;
  margin-left: 4px;
}

.qz-required {
  color: #FF5656;
}

.qz-input-box,
.qz-select-box {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1.5px solid #E6E6E6;
  border-radius: 16px;
  padding: 0 14px;
  height: 48px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(12, 9, 42, 0.02);
}

.qz-input-box--focused {
  border-color: #6A5AE0;
  box-shadow: 0 0 0 4px rgba(106, 90, 224, 0.14);
}

.qz-input-icon {
  font-size: 19px;
  color: #858494;
  margin-right: 10px;
  flex-shrink: 0;
}

.qz-input-box--focused .qz-input-icon {
  color: #6A5AE0;
}

.qz-native-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #0C092A;
  font-family: inherit;
}

.qz-native-input::placeholder {
  color: #A0A0B2;
}

.qz-eye-btn {
  background: transparent;
  border: none;
  color: #858494;
  font-size: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  cursor: pointer;
}

.qz-eye-btn:hover {
  color: #6A5AE0;
}

.qz-ion-select {
  width: 100%;
  --padding-start: 0;
  --padding-end: 0;
  font-size: 14px;
  color: #0C092A;
}

.qz-admin-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  background: #F7F7FD;
  border: 1px solid rgba(106, 90, 224, 0.14);
}

.qz-admin-section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6A5AE0;
}

.qz-actions-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.qz-btn {
  height: 50px;
  border-radius: 18px;
  font-size: 14.5px;
  font-weight: 700;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.qz-btn--primary {
  background: #6A5AE0;
  color: #FFFFFF;
  box-shadow: 0 8px 20px rgba(106, 90, 224, 0.28);
}

.qz-btn--primary:hover {
  background: #5B4BC8;
  transform: translateY(-1px);
}

.qz-btn--ghost {
  background: #F4F3FC;
  color: #6A5AE0;
  border: 1px solid rgba(106, 90, 224, 0.2);
}

.qz-btn--ghost:hover {
  background: #EAE7FB;
}

/* ==========================================================================
   MODO OSCURO (CLASES Y PREFERS-COLOR-SCHEME)
   ========================================================================== */
:global(body.dark) .qz-register-page,
:global(html.dark) .qz-register-page,
:global(.dark) .qz-register-page,
:global(:root[data-theme="dark"]) .qz-register-page,
:global(body.dark) .qz-register-content,
:global(html.dark) .qz-register-content,
:global(.dark) .qz-register-content,
:global(:root[data-theme="dark"]) .qz-register-content {
  --background: #110D26;
  background-color: #110D26;
}

:global(body.dark) .qz-register-toolbar,
:global(html.dark) .qz-register-toolbar,
:global(.dark) .qz-register-toolbar,
:global(:root[data-theme="dark"]) .qz-register-toolbar {
  --background: #1D1838 !important;
  --color: #F7F7FD !important;
  color: #F7F7FD !important;
  --border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-register-toolbar ion-title,
:global(html.dark) .qz-register-toolbar ion-title,
:global(.dark) .qz-register-toolbar ion-title,
:global(:root[data-theme="dark"]) .qz-register-toolbar ion-title,
:global(body.dark) .qz-register-toolbar :deep(.toolbar-title),
:global(html.dark) .qz-register-toolbar :deep(.toolbar-title),
:global(.dark) .qz-register-toolbar :deep(.toolbar-title),
:global(:root[data-theme="dark"]) .qz-register-toolbar :deep(.toolbar-title),
:global(body.dark) .qz-register-toolbar ion-button,
:global(html.dark) .qz-register-toolbar ion-button,
:global(.dark) .qz-register-toolbar ion-button,
:global(:root[data-theme="dark"]) .qz-register-toolbar ion-button {
  color: #F7F7FD !important;
  --color: #F7F7FD !important;
}

:global(body.dark) .qz-auth-card,
:global(html.dark) .qz-auth-card,
:global(.dark) .qz-auth-card,
:global(:root[data-theme="dark"]) .qz-auth-card {
  background: #1D1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.25);
}

:global(body.dark) .qz-badge-pill,
:global(html.dark) .qz-badge-pill,
:global(.dark) .qz-badge-pill,
:global(:root[data-theme="dark"]) .qz-badge-pill {
  background: rgba(124, 110, 242, 0.18);
  color: #A39BF0;
}

:global(body.dark) .qz-welcome-title,
:global(html.dark) .qz-welcome-title,
:global(.dark) .qz-welcome-title,
:global(:root[data-theme="dark"]) .qz-welcome-title,
:global(body.dark) .qz-field-label,
:global(html.dark) .qz-field-label,
:global(.dark) .qz-field-label,
:global(:root[data-theme="dark"]) .qz-field-label {
  color: #F7F7FD;
}

:global(body.dark) .qz-welcome-subtitle,
:global(html.dark) .qz-welcome-subtitle,
:global(.dark) .qz-welcome-subtitle,
:global(:root[data-theme="dark"]) .qz-welcome-subtitle {
  color: #9E9BB8;
}

:global(body.dark) .qz-input-box,
:global(html.dark) .qz-input-box,
:global(.dark) .qz-input-box,
:global(:root[data-theme="dark"]) .qz-input-box,
:global(body.dark) .qz-select-box,
:global(html.dark) .qz-select-box,
:global(.dark) .qz-select-box,
:global(:root[data-theme="dark"]) .qz-select-box {
  background: #17132E;
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

:global(body.dark) .qz-input-box--focused,
:global(html.dark) .qz-input-box--focused,
:global(.dark) .qz-input-box--focused,
:global(:root[data-theme="dark"]) .qz-input-box--focused {
  border-color: #7C6EF2;
  box-shadow: 0 0 0 4px rgba(124, 110, 242, 0.22);
}

:global(body.dark) .qz-input-icon,
:global(html.dark) .qz-input-icon,
:global(.dark) .qz-input-icon,
:global(:root[data-theme="dark"]) .qz-input-icon,
:global(body.dark) .qz-eye-btn,
:global(html.dark) .qz-eye-btn,
:global(.dark) .qz-eye-btn,
:global(:root[data-theme="dark"]) .qz-eye-btn {
  color: #9E9BB8;
}

:global(body.dark) .qz-input-box--focused .qz-input-icon,
:global(html.dark) .qz-input-box--focused .qz-input-icon,
:global(.dark) .qz-input-box--focused .qz-input-icon,
:global(:root[data-theme="dark"]) .qz-input-box--focused .qz-input-icon,
:global(body.dark) .qz-eye-btn:hover,
:global(html.dark) .qz-eye-btn:hover,
:global(.dark) .qz-eye-btn:hover,
:global(:root[data-theme="dark"]) .qz-eye-btn:hover {
  color: #7C6EF2;
}

:global(body.dark) .qz-native-input,
:global(html.dark) .qz-native-input,
:global(.dark) .qz-native-input,
:global(:root[data-theme="dark"]) .qz-native-input,
:global(body.dark) .qz-ion-select,
:global(html.dark) .qz-ion-select,
:global(.dark) .qz-ion-select,
:global(:root[data-theme="dark"]) .qz-ion-select {
  color: #F7F7FD;
}

:global(body.dark) .qz-native-input::placeholder,
:global(html.dark) .qz-native-input::placeholder,
:global(.dark) .qz-native-input::placeholder,
:global(:root[data-theme="dark"]) .qz-native-input::placeholder {
  color: #6E6B8B;
}

:global(body.dark) .qz-admin-section,
:global(html.dark) .qz-admin-section,
:global(.dark) .qz-admin-section,
:global(:root[data-theme="dark"]) .qz-admin-section {
  background: #17132E;
  border-color: rgba(124, 110, 242, 0.22);
}

:global(body.dark) .qz-admin-section-title,
:global(html.dark) .qz-admin-section-title,
:global(.dark) .qz-admin-section-title,
:global(:root[data-theme="dark"]) .qz-admin-section-title {
  color: #A39BF0;
}

:global(body.dark) .qz-btn--ghost,
:global(html.dark) .qz-btn--ghost,
:global(.dark) .qz-btn--ghost,
:global(:root[data-theme="dark"]) .qz-btn--ghost {
  background: #252048;
  color: #F7F7FD;
  border-color: rgba(255, 255, 255, 0.14);
}

:global(body.dark) .qz-btn--ghost:hover,
:global(html.dark) .qz-btn--ghost:hover,
:global(.dark) .qz-btn--ghost:hover,
:global(:root[data-theme="dark"]) .qz-btn--ghost:hover {
  background: #2C2654;
  border-color: #7C6EF2;
  color: #A39BF0;
}

@media (prefers-color-scheme: dark) {
  :global(body:not(.light)) .qz-register-page,
  :global(body:not(.light)) .qz-register-content {
    --background: #110D26;
    background-color: #110D26;
  }

  :global(body:not(.light)) .qz-register-toolbar {
    --background: #1D1838 !important;
    --color: #F7F7FD !important;
    color: #F7F7FD !important;
    --border-color: rgba(255, 255, 255, 0.08);
  }

  :global(body:not(.light)) .qz-register-toolbar ion-title,
  :global(body:not(.light)) .qz-register-toolbar :deep(.toolbar-title),
  :global(body:not(.light)) .qz-register-toolbar ion-button {
    color: #F7F7FD !important;
    --color: #F7F7FD !important;
  }

  :global(body:not(.light)) .qz-auth-card {
    background: #1D1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.25);
  }

  :global(body:not(.light)) .qz-badge-pill {
    background: rgba(124, 110, 242, 0.18);
    color: #A39BF0;
  }

  :global(body:not(.light)) .qz-welcome-title,
  :global(body:not(.light)) .qz-field-label {
    color: #F7F7FD;
  }

  :global(body:not(.light)) .qz-welcome-subtitle {
    color: #9E9BB8;
  }

  :global(body:not(.light)) .qz-input-box,
  :global(body:not(.light)) .qz-select-box {
    background: #17132E;
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  :global(body:not(.light)) .qz-input-box--focused {
    border-color: #7C6EF2;
    box-shadow: 0 0 0 4px rgba(124, 110, 242, 0.22);
  }

  :global(body:not(.light)) .qz-input-icon,
  :global(body:not(.light)) .qz-eye-btn {
    color: #9E9BB8;
  }

  :global(body:not(.light)) .qz-input-box--focused .qz-input-icon,
  :global(body:not(.light)) .qz-eye-btn:hover {
    color: #7C6EF2;
  }

  :global(body:not(.light)) .qz-native-input,
  :global(body:not(.light)) .qz-ion-select {
    color: #F7F7FD;
  }

  :global(body:not(.light)) .qz-native-input::placeholder {
    color: #6E6B8B;
  }

  :global(body:not(.light)) .qz-admin-section {
    background: #17132E;
    border-color: rgba(124, 110, 242, 0.22);
  }

  :global(body:not(.light)) .qz-admin-section-title {
    color: #A39BF0;
  }

  :global(body:not(.light)) .qz-btn--ghost {
    background: #252048;
    color: #F7F7FD;
    border-color: rgba(255, 255, 255, 0.14);
  }

  :global(body:not(.light)) .qz-btn--ghost:hover {
    background: #2C2654;
    border-color: #7C6EF2;
    color: #A39BF0;
  }
}
</style>

<style>
/* Estilos globales encapsulados por .qz-register-page para Shadow DOM de ion-header / ion-toolbar / ion-title */
.qz-register-page ion-header.qz-register-header,
.qz-register-page ion-toolbar.qz-register-toolbar {
  background: #ffffff !important;
  --background: #ffffff !important;
  --color: #0c092a !important;
  color: #0c092a !important;
}

.qz-register-page ion-toolbar.qz-register-toolbar::part(background) {
  background: #ffffff !important;
}

body.dark .qz-register-page ion-header.qz-register-header,
html.dark .qz-register-page ion-header.qz-register-header,
.dark .qz-register-page ion-header.qz-register-header,
:root[data-theme="dark"] .qz-register-page ion-header.qz-register-header,
body.dark .qz-register-page ion-toolbar.qz-register-toolbar,
html.dark .qz-register-page ion-toolbar.qz-register-toolbar,
.dark .qz-register-page ion-toolbar.qz-register-toolbar,
:root[data-theme="dark"] .qz-register-page ion-toolbar.qz-register-toolbar {
  background: #1d1838 !important;
  --background: #1d1838 !important;
  --color: #f7f7fd !important;
  color: #f7f7fd !important;
  --border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-register-page ion-toolbar.qz-register-toolbar::part(background),
html.dark .qz-register-page ion-toolbar.qz-register-toolbar::part(background),
.dark .qz-register-page ion-toolbar.qz-register-toolbar::part(background),
:root[data-theme="dark"] .qz-register-page ion-toolbar.qz-register-toolbar::part(background) {
  background: #1d1838 !important;
}

body.dark .qz-register-page ion-toolbar.qz-register-toolbar ion-title,
html.dark .qz-register-page ion-toolbar.qz-register-toolbar ion-title,
.dark .qz-register-page ion-toolbar.qz-register-toolbar ion-title,
:root[data-theme="dark"] .qz-register-page ion-toolbar.qz-register-toolbar ion-title,
body.dark .qz-register-page ion-toolbar.qz-register-toolbar ion-button,
html.dark .qz-register-page ion-toolbar.qz-register-toolbar ion-button,
.dark .qz-register-page ion-toolbar.qz-register-toolbar ion-button,
:root[data-theme="dark"] .qz-register-page ion-toolbar.qz-register-toolbar ion-button {
  color: #f7f7fd !important;
  --color: #f7f7fd !important;
}

@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-register-page ion-header.qz-register-header,
  body:not(.light) .qz-register-page ion-toolbar.qz-register-toolbar {
    background: #1d1838 !important;
    --background: #1d1838 !important;
    --color: #f7f7fd !important;
    color: #f7f7fd !important;
    --border-color: rgba(255, 255, 255, 0.08) !important;
  }

  body:not(.light) .qz-register-page ion-toolbar.qz-register-toolbar::part(background) {
    background: #1d1838 !important;
  }

  body:not(.light) .qz-register-page ion-toolbar.qz-register-toolbar ion-title,
  body:not(.light) .qz-register-page ion-toolbar.qz-register-toolbar ion-button {
    color: #f7f7fd !important;
    --color: #f7f7fd !important;
  }
}
</style>
