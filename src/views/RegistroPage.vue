<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button
            v-if="Number.isInteger(userLoged.id) == false"
            :href="'/login'"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
          <ion-button
            v-if="Number.isInteger(userLoged.id) == true"
            :href="'/admin/panel'"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="registrarUsuario">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Registro </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Nombre</ion-label>
          <ion-input
            v-model="formData.name"
            placeholder="Escribe tu nombre"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Apellido</ion-label>
          <ion-input
            v-model="formData.lastName"
            placeholder="Escribe tu apellido"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Correo electrónico</ion-label>
          <ion-input
            v-model="formData.email"
            type="email"
            placeholder="Escribe tu correo electrónico"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Código</ion-label>
          <ion-input
            v-model="formData.code"
            placeholder="Escribe tu código"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked"
            >Invitación de la institución (number)</ion-label
          >
          <ion-input
            v-model="formData.instituteInvitation"
            placeholder="Escribe el código de invitación"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Contraseña</ion-label>
          <ion-input
            v-model="formData.password"
            type="password"
            placeholder="Escribe tu contraseña"
            clear-input
          ></ion-input>
        </ion-item>

        <!-- Nuevos campos para administradores -->
        <template v-if="esAdmin">
          <ion-item>
            <ion-label>Año</ion-label>
            <ion-select
              v-model="selectedYear"
              placeholder="Seleccione el año"
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
          </ion-item>

          <ion-item>
            <ion-label>Rol en el curso</ion-label>
            <ion-select v-model="selectedRol" placeholder="Seleccione el rol">
              <ion-select-option
                v-for="rol in roles"
                :key="rol.rol"
                :value="rol.rol"
              >
                {{ rol.titulo }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label>Curso</ion-label>
            <ion-select
              v-model="selectedCourseId"
              placeholder="Seleccione el curso"
              @ionChange="getGruposCurso"
            >
              <ion-select-option
                v-for="curso in cursosInstituto"
                :key="curso.id"
                :value="curso.id"
              >
                {{ curso.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label>Grupo</ion-label>
            <ion-select
              v-model="selectedGroupId"
              placeholder="Seleccione el grupo"
              :disabled="!selectedCourseId"
            >
              <ion-select-option
                v-for="grupo in gruposCursoDestino"
                :key="grupo.id"
                :value="grupo.id"
              >
                {{ grupo.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </template>
      </ion-list>

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
  IonList,
  IonItem,
  IonLabel,
  IonInput,
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
import { arrowBackOutline, checkmarkOutline } from "ionicons/icons";
import { ref } from "vue";
import { adminOdirectivo, tokenHeader } from "../globalService";

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
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonToast,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const isSuccessToastOpen = ref(false);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const userLoged = ref({});
    const esAdmin = adminOdirectivo();

    // Nuevas referencias para la gestión de cursos
    const selectedYear = ref(new Date().getFullYear());
    const years = ref(
      Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
    );
    const selectedRol = ref(null);
    const selectedCourseId = ref(null);
    const selectedGroupId = ref(null);
    const cursosInstituto = ref([]);
    const gruposCursoDestino = ref([]);

    const roles = ref([
      { titulo: "Estudiante", rol: "student" },
      { titulo: "Profesor", rol: "teacher" },
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
      }
    };

    const getGruposCurso = async () => {
      if (selectedCourseId.value) {
        try {
          const response = await axios.get(
            `/courses/${selectedCourseId.value}/groups`,
            tokenHeader()
          );
          gruposCursoDestino.value = response.data;
          selectedGroupId.value = null;
        } catch (error) {
          console.error("Error fetching groups:", error);
          gruposCursoDestino.value = [];
        }
      }
    };

    onIonViewWillEnter(async () => {
      userLoged.value = JSON.parse(localStorage.getItem("usuario"));
      if (esAdmin) {
        await getCursos();
      }
    });

    return {
      arrowBackOutline,
      checkmarkOutline,
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
        instituteInvitation: "",
        password: "",
        exist: false,
      },
    };
  },
  methods: {
    async asignarUsuarioACurso(userId) {
      try {
        // Asignar usuario al curso
        await axios.post(
          `/courses/${this.selectedCourseId}/users`,
          [
            {
              userId: userId,
              year: this.selectedYear,
              rol: this.selectedRol,
            },
          ],
          tokenHeader()
        );

        // Si hay grupo seleccionado, asignar usuario al grupo
        if (this.selectedGroupId) {
          axios
            .post(`/users/${userId}/groups`, {
              groupId: this.selectedGroupId,
              userId: userId,
              code: "admin",
              year: this.selectedYear,
              active: true,
            })
            .then(() => {
              location.reload();
            });
        }
      } catch (error) {
        console.error("Error al asignar usuario:", error);
        throw error;
      }
    },

    async registrarUsuario() {
      try {
        const response = await axios.post("/users", this.formData, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });

        // Si es admin y hay curso seleccionado, asignar el usuario
        if (this.esAdmin && this.selectedCourseId) {
          await this.asignarUsuarioACurso(response.data.id);
        }

        this.isSuccessToastOpen = true;
        setTimeout(() => {
          if (this.userLoged.id !== undefined) {
            this.$router.push("/inicio");
          } else {
            this.$router.push("/login");
          }
        }, 3000);
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "Error al registrar";
        this.isErrorToastOpen = true;
      }
    },
  },
};
</script>
