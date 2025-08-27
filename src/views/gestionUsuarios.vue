<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cursos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Cursos</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-list>
        <ion-item>
          <ion-label><strong>Año:</strong></ion-label>
          <ion-select
            v-model="selectedYear"
            placeholder="Seleccione el año"
            @ionChange="getCurso()"
          >
            <ion-select-option v-for="year in years" :key="year" :value="year">
              {{ year }}
            </ion-select-option>
          </ion-select>
          <ion-button @click="presentActionSheet" color="medium">
            <ion-icon slot="icon-only" :icon="downloadOutline"></ion-icon>
          </ion-button>
        </ion-item>
        <ion-accordion-group @ionChange="captarAbierto($event)">
          <ion-accordion v-for="curso in cursosInstituto" :key="curso.id">
            <IonItem slot="header" @click="changeCourse(curso)">
              <IonLabel v-if="!loading || courseSelected.id != curso.id">{{
                curso.name
              }}</IonLabel>
              <IonLabel v-if="loading && courseSelected.id == curso.id">{{
                curso.name + ": ⏳ Cargando usuarios"
              }}</IonLabel>
            </IonItem>
            <div class="ion-padding" slot="content">
              <ion-list>
                <ion-item v-for="usuario in usersCourse" :key="usuario.id">
                  <ion-label class="ion-text-wrap">
                    <h6>{{ usuario.lastName + " " + usuario.name }}</h6>
                    <p>
                      {{
                        usuario?.rol == "user" || usuario?.rol == "student"
                          ? "Estudiante "
                          : usuario?.rol == "admin"
                          ? "Administrador "
                          : usuario?.rol == "teacher"
                          ? "Profesor "
                          : usuario?.rol == ""
                          ? ""
                          : "Rol no identificado"
                      }}<br />
                      {{ usuario.code }}
                    </p>
                  </ion-label>
                  <div slot="end" style="display: flex; gap: 10px">
                    <ion-icon
                      :icon="swapHorizontalOutline"
                      style="cursor: pointer; font-size: 24px"
                      @click="openModal(usuario)"
                    ></ion-icon>

                    <ion-icon
                      :icon="createOutline"
                      style="cursor: pointer; font-size: 24px"
                      @click="
                        router.push(`/admin/actualizar/usuarios/${usuario.id}`)
                      "
                    ></ion-icon>
                  </div>
                </ion-item>
              </ion-list>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </ion-list>

      <!-- Modal para asignar curso y grupo -->
      <ion-modal
        :is-open="isModalOpen"
        @didDismiss="closeModal"
        ref="modal"
        :breakpoints="[0.3, 0.5, 0.75]"
        :initial-breakpoint="0.5"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeModal">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>Asignar Curso y Grupo</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="asignarUsuario()">
                Confirmar
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label>Curso Destino</ion-label>
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
            <ion-label>Rol en el curso</ion-label>
            <ion-select v-model="rolSelected" placeholder="Seleccione el rol">
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
            <ion-label>Grupo Destino</ion-label>
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
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import router from "../router";

import { ref } from "vue";
import { tokenHeader, usuarioGet } from "../globalService";
import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSelect,
  IonSelectOption,
  IonAccordionGroup,
  IonAccordion,
  IonModal,
  IonButton,
  IonButtons,
  IonIcon,
  actionSheetController,
} from "@ionic/vue";

import {
  swapHorizontalOutline,
  createOutline,
  downloadOutline,
} from "ionicons/icons";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonAccordionGroup,
    IonAccordion,
    IonModal,
    IonButton,
    IonButtons,
    IonIcon,
  },
  setup() {
    const usuario = ref();
    const usersCourse = ref([]);
    const courseSelected = ref({});
    const abierto = ref(false);
    const loading = ref(false);
    const gruposCursoDestino = ref([]);
    const isModalOpen = ref(false);
    const selectedCourseId = ref(null);
    const selectedGroupId = ref(null);
    const selectedUser = ref(null);
    const rolSelected = ref(null);
    const asignado = ref(false);
    const roles = ref([
      {
        titulo: "Estudiante",
        rol: "student",
      },

      {
        titulo: "Profesor",
        rol: "teacher",
      },

      {
        titulo: "Administrador",
        rol: "admin",
      },
    ]);

    const cursosInstituto = ref([
      {
        id: 0,
        name: "Sin Curso",
      },
    ]);
    const years = ref(
      Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
    );
    const selectedYear = ref(new Date().getFullYear());

    const openModal = (user) => {
      selectedUser.value = user;
      isModalOpen.value = true;
    };

    const closeModal = () => {
      isModalOpen.value = false;
    };

    const presentActionSheet = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Opciones",
        buttons: [
          {
            text: "Descargar CSV",
            handler: () => {
              downloadCSV();
            },
          },
          {
            text: "Imprimir Lista",
            handler: () => {
              navigateToPrintableList();
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await actionSheet.present();
    };

    const navigateToPrintableList = async () => {
      const studentData = await preparePrintableData();
      router.push({
        name: "PrintableStudentList",
        state: {
          studentData: studentData,
          year: selectedYear.value,
        },
      });
    };

    const preparePrintableData = async () => {
      const year = selectedYear.value;
      const coursesWithStudents = [];

      for (const curso of cursosInstituto.value) {
        if (curso.id !== 0) {
          try {
            const response = await axios.get(
              `/courses/${curso.id}/users?year=${year}`,
              tokenHeader()
            );
            const users = response.data.map((usuario) => usuario.user);
            const students = users.filter(
              (user) => user.rol === "student" || user.rol === "user"
            );

            if (students.length > 0) {
              coursesWithStudents.push({
                id: curso.id,
                name: curso.name,
                students: students,
              });
            }
          } catch (error) {
            console.error(
              `Error fetching users for course ${curso.name}:`,
              error
            );
          }
        }
      }
      return coursesWithStudents;
    };

    const downloadCSV = async () => {
      let csvContent = '"ROLLNO","NAME","CLASS","EMAILID","PHONENO"\r\n';
      const year = selectedYear.value;

      for (const curso of cursosInstituto.value) {
        if (curso.id !== 0) {
          // Skip "Sin Curso"
          try {
            const response = await axios.get(
              `/courses/${curso.id}/users?year=${year}`,
              tokenHeader()
            );
            const users = response.data.map((usuario) => usuario.user);

            users.forEach((user) => {
              if (user.rol === "student" || user.rol === "user") {
                const rollNo = user.code ? user.code.substring(1) : "";
                const name = `${user.lastName} ${user.name}`;
                const className = `${curso.name}-${year}`;
                const email = user.email || "";
                const phoneNo = ""; // As per the comment, this is empty

                const row = `"${rollNo}","${name}","${className}","${email}","${phoneNo}"`;
                csvContent += row + "\r\n";
              }
            });
          } catch (error) {
            console.error(
              `Error fetching users for course ${curso.name}:`,
              error
            );
          }
        }
      }

      // Create a Blob from the CSV string
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `estudiantes_${year}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    const asignarUsuario = async () => {
      console.log(selectedUser.value);

      if (selectedCourseId.value == 0) {
        await axios
          .post(
            `/courses/${selectedCourseId.value}/users`,
            [
              {
                userId: selectedUser.value.id,
                year: parseInt(selectedYear.value, 10),
                rol: "student",
              },
            ],
            {
              headers: tokenHeader(),
            }
          )
          .then(() => {
            console.log("Usuario asignado al curso correctamente");
            asignado.value = true;
          })
          .catch((error) => {
            console.error("Error al asignar el usuario al curso:", error);
          });
      } else {
        /* 
        {
  "userId": 0,
  "year": 0,
  "rol": "string"
}
  */
        axios
          .post(
            `/courses/${selectedCourseId.value}/users`,
            [
              {
                userId: selectedUser.value.id,
                year: parseInt(selectedYear.value, 10),
                rol: rolSelected.value,
              },
            ],
            {
              headers: tokenHeader(),
            }
          )
          .then(() => {
            console.log("Usuario asignado al curso correctamente");
            asignado.value = true;
          })
          .catch((error) => {
            console.error("Error al asignar el usuario al curso:", error);
          });
      }

      if (selectedGroupId.value && asignado.value) {
        let data = {
          groupId: selectedGroupId.value,
          userId: selectedUser.value.id,
          code: "admin",
          year: parseInt(selectedYear.value, 10),
          active: true,
        };

        axios.post(`/users/${selectedUser.value.id}/groups`, data).then(() => {
          location.reload();
        });
        closeModal();

        await axios
          .post(
            `/groups/${selectedGroupId.value}/users`,
            [
              {
                userId: selectedUser.value.id,
                periodId: 1,
              },
            ],
            {
              headers: tokenHeader(),
            }
          )
          .then(() => {
            console.log("Usuario asignado al grupo correctamente");
          })
          .catch((error) => {
            console.error("Error al asignar el usuario al grupo:", error);
          });
      }

      closeModal();
      // reload
      location.reload();
    };

    const captarAbierto = (event) => {
      const selectedValue = event.detail.value;
      abierto.value = selectedValue !== undefined;

      if (
        (abierto.value && courseSelected.value?.id) ||
        (abierto.value && courseSelected.value.id == 0)
      ) {
        getUsuarios(courseSelected.value.id, selectedYear.value);
      }
    };

    const getUsuarios = async (cursoId, year) => {
      loading.value = true;
      usersCourse.value = [];

      if (cursoId == 0) {
        await getUsuariosSinCurso();
      } else {
        const response = await axios.get(
          `/courses/${cursoId}/users?year=${year}`,
          tokenHeader()
        );

        const users = response.data.map((usuario) => usuario.user);

        const roleOrder = {
          admin: 0,
          director: 1,
          coordinator: 2,
          teacher: 3,
          student: 4,
          user: 4,
        };

        users.sort((a, b) => {
          const roleA = a.rol || "user";
          const roleB = b.rol || "user";
          const orderA = roleOrder[roleA] ?? 99;
          const orderB = roleOrder[roleB] ?? 99;

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          const lastNameA = a.lastName || "";
          const lastNameB = b.lastName || "";
          if (lastNameA !== lastNameB) {
            return lastNameA.localeCompare(lastNameB);
          }

          const nameA = a.name || "";
          const nameB = b.name || "";
          return nameA.localeCompare(nameB);
        });

        usersCourse.value = users;
        loading.value = false;
      }
    };

    const getUsuariosSinCurso = async () => {
      loading.value = true;
      usersCourse.value = [];
      courseSelected.value = {
        id: 0,
        name: "Sin Curso",
      };

      const response = await axios.get(
        `/institutes/${usuario.value.institute.id}/usersNoCourse?year=0`,
        tokenHeader()
      );
      usersCourse.value = response.data;
      loading.value = false;
    };

    const changeCourse = (curso) => {
      courseSelected.value = curso;
    };

    const getGruposCurso = async () => {
      if (selectedCourseId.value) {
        try {
          const response = await axios.get(
            `/courses/${selectedCourseId.value}/groups`,
            {
              headers: tokenHeader(),
            }
          );
          gruposCursoDestino.value = response.data;
          selectedGroupId.value = null; // Reset group selection when course changes
        } catch (error) {
          console.error("Error fetching groups:", error);
          gruposCursoDestino.value = [];
        }
      }
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      await getCurso();
      tokenHeader();
    });

    const getCurso = async () => {
      const response = await axios.get(
        `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
        tokenHeader()
      );

      cursosInstituto.value = [
        { id: 0, name: "Sin Curso" },
        ...response.data.sort((a, b) => a.name.localeCompare(b.name)),
      ];
    };

    return {
      usuario,
      abierto,
      router,
      loading,
      cursosInstituto,
      getUsuariosSinCurso,
      years,
      usersCourse,
      courseSelected,
      changeCourse,
      selectedYear,
      captarAbierto,
      getCurso,
      getUsuarios,
      gruposCursoDestino,
      getGruposCurso,
      isModalOpen,
      openModal,
      closeModal,
      selectedCourseId,
      selectedGroupId,
      asignarUsuario,
      roles,
      selectedUser,
      rolSelected,
      downloadCSV,
      presentActionSheet,

      swapHorizontalOutline,
      createOutline,
      downloadOutline,
    };
  },
};
</script>
