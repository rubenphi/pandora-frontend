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
        </ion-item>
      </ion-list>

      <!-- Botones para alternar la visibilidad de las secciones -->
      <ion-grid v-if="isPrivilegedUser">
        <ion-row>
          <ion-col>
            <ion-button
              expand="block"
              fill="outline"
              @click="toggleTeachersSection()"
            >
              Profesores del Instituto
            </ion-button>
          </ion-col>
          <ion-col>
            <ion-button
              expand="block"
              fill="outline"
              @click="toggleNoCourseSection()"
            >
              Usuarios Sin Curso
            </ion-button>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col>
            <ion-button
              expand="block"
              color="primary"
              @click="router.push('/admin/importar-usuarios')"
            >
              <ion-icon slot="start" :icon="personAddOutline"></ion-icon>
              Importar Usuarios
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Sección de Profesores del Instituto -->
      <ion-list v-if="showTeachersSection && isPrivilegedUser">
        <ion-list-header>
          <ion-label>Profesores del Instituto</ion-label>
        </ion-list-header>
        <ion-item v-for="usuario in usersCourse" :key="usuario.id">
          <ion-label class="ion-text-wrap">
            <h6>{{ usuario.lastName + " " + usuario.name }}</h6>
            <p>
              {{ getRoleLabel(usuario) }}<br />
              {{ usuario.code }}
            </p>
          </ion-label>
          <div slot="end" style="display: flex; gap: 10px">
            <ion-icon
              v-if="canManage(usuario)"
              :icon="swapHorizontalOutline"
              style="cursor: pointer; font-size: 24px"
              @click="openModal(usuario)"
            ></ion-icon>
            <ion-icon
              v-if="canManage(usuario)"
              :icon="trashOutline"
              style="cursor: pointer; font-size: 24px"
              color="danger"
              @click="deactivateUser(usuario)"
            ></ion-icon>
            <ion-icon
              v-if="canManage(usuario)"
              :icon="createOutline"
              style="cursor: pointer; font-size: 24px"
              @click="router.push(`/admin/actualizar/usuarios/${usuario.id}`)"
            ></ion-icon>
          </div>
        </ion-item>
      </ion-list>


      <!-- Sección de Usuarios Sin Curso -->
      <ion-list v-if="showNoCourseSection && isPrivilegedUser">
        <ion-list-header>
          <ion-label>Usuarios Sin Curso</ion-label>
        </ion-list-header>
        <div
          v-if="usersCourse.length === 0"
          class="ion-text-center ion-padding"
        >
          <p>No hay usuarios sin curso.</p>
        </div>
        <ion-item v-else v-for="usuario in usersCourse" :key="usuario.id">
          <ion-label class="ion-text-wrap">
            <h6>{{ usuario.lastName + " " + usuario.name }}</h6>
            <p>
              {{ getRoleLabel(usuario) }}<br />
              {{ usuario.code }}
            </p>
          </ion-label>
          <div slot="end" style="display: flex; gap: 10px">
            <ion-icon
              v-if="canManage(usuario)"
              :icon="swapHorizontalOutline"
              style="cursor: pointer; font-size: 24px"
              @click="openModal(usuario)"
            ></ion-icon>
            <ion-icon
              v-if="canManage(usuario)"
              :icon="trashOutline"
              style="cursor: pointer; font-size: 24px"
              color="danger"
              @click="deactivateUser(usuario)"
            ></ion-icon>
            <ion-icon
              v-if="canManage(usuario)"
              :icon="createOutline"
              style="cursor: pointer; font-size: 24px"
              @click="router.push(`/admin/actualizar/usuarios/${usuario.id}`)"
            ></ion-icon>
          </div>
        </ion-item>
      </ion-list>

      <ion-list-header color="primary">
        <ion-label>Cursos Activos</ion-label>
      </ion-list-header>

      <!-- Main Accordion Group for Active Courses -->
      <ion-accordion-group @ionChange="captarAbierto($event)">
        <ion-accordion
          v-for="curso in cursosInstituto.filter((c) => c.id !== 0)"
          :key="curso.id"
        >
          <IonItem slot="header" @click="changeCourse(curso)">
            <IonLabel v-if="!loading || courseSelected.id != curso.id">{{
              curso.name
            }}</IonLabel>
            <IonLabel v-if="loading && courseSelected.id == curso.id">{{
              curso.name + ": ⏳ Cargando usuarios"
            }}</IonLabel>
            <ion-button @click.stop="presentActionSheet(curso)" color="medium">
              <ion-icon slot="icon-only" :icon="downloadOutline"></ion-icon>
            </ion-button>
          </IonItem>
          <div class="ion-padding" slot="content">
            <div
              v-if="usersCourse.length === 0 && !loading && curso.id !== 0"
              class="ion-text-center ion-padding"
            >
              <p>Este curso no tiene usuarios.</p>
            </div>
            <ion-list v-if="usersCourse.length > 0">
              <ion-list-header>
                <ion-label>Estudiantes y Profesores</ion-label>
              </ion-list-header>
              <ion-item v-for="usuario in usersCourse" :key="usuario.id">
                <ion-label class="ion-text-wrap">
                  <h6>{{ usuario.lastName + " " + usuario.name }}</h6>
                  <p>
                    {{ getRoleLabel(usuario) }}<br />
                    {{ usuario.code }}
                  </p>
                </ion-label>
                <div slot="end" style="display: flex; gap: 10px">
                  <ion-icon
                    v-if="canManage(usuario)"
                    :icon="swapHorizontalOutline"
                    style="cursor: pointer; font-size: 24px"
                    @click="openModal(usuario)"
                  ></ion-icon>
                  <ion-icon
                    v-if="canManage(usuario)"
                    :icon="trashOutline"
                    style="cursor: pointer; font-size: 24px"
                    color="danger"
                    @click="deactivateUser(usuario)"
                  ></ion-icon>
                  <ion-icon
                    v-if="canManage(usuario)"
                    :icon="createOutline"
                    style="cursor: pointer; font-size: 24px"
                    @click="
                      router.push(`/admin/actualizar/usuarios/${usuario.id}`)
                    "
                  ></ion-icon>
                </div>
              </ion-item>
            </ion-list>

            <!-- Sección de Áreas y Docentes -->
            <ion-list v-if="(courseAreas?.length || 0) > 0 && isPrivilegedUser">
              <ion-list-header color="light">
                <ion-label>Asignación de Áreas y Docentes</ion-label>
              </ion-list-header>
              <ion-item v-for="area in courseAreas" :key="area.id">
                <ion-icon slot="start" :icon="layersOutline"></ion-icon>
                <ion-label>
                  <h2>{{ area.name }}</h2>
                  <p>
                    Docente:
                    <span
                      :color="
                        getAssignedTeacher(area.id) ? 'primary' : 'danger'
                      "
                    >
                      {{
                        getAssignedTeacher(area.id)
                          ? getAssignedTeacher(area.id).lastName +
                            " " +
                            getAssignedTeacher(area.id).name
                          : "Sin asignar"
                      }}
                    </span>
                  </p>
                </ion-label>
                <ion-button
                  slot="end"
                  fill="clear"
                  @click="openAreaTeacherPicker(area)"
                >
                  <ion-icon slot="icon-only" :icon="createOutline"></ion-icon>
                </ion-button>
              </ion-item>
            </ion-list>
          </div>
        </ion-accordion>
      </ion-accordion-group>

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
          <div v-if="selectedUser">
            <ion-item>
              <ion-label>
                Usuario Seleccionado:
                <strong>
                  {{ selectedUser.lastName }} {{ selectedUser.name }}</strong
                >
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>Curso Destino</ion-label>
              <ion-select
                v-model="selectedCourseId"
                placeholder="Seleccione el curso"
                @ionChange="getGruposCurso"
              >
                <ion-select-option
                  v-for="curso in availableCourses"
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
                  v-for="rol in availableRoles"
                  :key="rol.rol"
                  :value="rol.rol"
                >
                  {{ rol.titulo }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <!-- Selección de Áreas -->
            <div
              v-if="
                selectedCourseId &&
                selectedCourseId != 0 &&
                (rolSelected === 'teacher' || rolSelected === 'admin')
              "
            >
              <ion-list-header color="light">
                <ion-label>Áreas que manejará</ion-label>
              </ion-list-header>
              <ion-item v-for="area in currentCourseAreas" :key="area.id">
                <ion-checkbox
                  slot="start"
                  :checked="selectedAreas[area.id]"
                  @ionChange="selectedAreas[area.id] = $event.detail.checked"
                ></ion-checkbox>
                <ion-label>{{ area.name }}</ion-label>
              </ion-item>
            </div>
            <ion-item v-if="rolSelected === 'student'">
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
          </div>
        </ion-content>
      </ion-modal>
      <ion-modal
        :is-open="isBulkAssignModalOpen"
        @didDismiss="closeBulkAssignModal"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeBulkAssignModal">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>
              Asignación Múltiple de
              {{ sourceCourseForBulk?.name }}</ion-title
            >
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="confirmBulkAssign()"
                >Confirmar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label>Año Destino</ion-label>
            <ion-select
              v-model="selectedYearForBulk"
              placeholder="Seleccione el año"
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
            <ion-label>Curso Destino</ion-label>
            <ion-select
              v-model="selectedCourseId"
              placeholder="Seleccione el curso"
            >
              <ion-select-option
                v-for="curso in cursosInstituto.filter(
                  (c) => c.id !== sourceCourseForBulk?.id
                )"
                :key="curso.id"
                :value="curso.id"
              >
                {{ curso.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-list>
            <ion-item>
              <ion-label>Seleccionar todos</ion-label>
              <ion-checkbox @ionChange="toggleSelectAll($event)"></ion-checkbox>
            </ion-item>
            <ion-item
              v-for="student in studentsForBulkAssign"
              :key="student.id"
            >
              <ion-label>{{ student.lastName }}, {{ student.name }}</ion-label>
              <ion-checkbox
                :value="student.id"
                @ionChange="
                  (ev) => {
                    if (ev.detail.checked) {
                      selectedStudents.push(student.id);
                    } else {
                      selectedStudents = selectedStudents.filter(
                        (id) => id !== student.id
                      );
                    }
                  }
                "
                :checked="selectedStudents.includes(student.id)"
              ></ion-checkbox>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <!-- New Teacher Assignment Modal -->
      <TeacherAssignmentModal
        :is-open="isTeacherAssignmentModalOpen"
        :selected-user="selectedUser"
        @didDismiss="isTeacherAssignmentModalOpen = false"
        @confirm="
          isTeacherAssignmentModalOpen = false;
          location.reload();
        "
      ></TeacherAssignmentModal>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import router from "../router";

import TeacherAssignmentModal from "../components/TeacherAssignmentModal.vue";

import { ref, computed, watch } from "vue";
import { tokenHeader, usuarioGet, selectedYear as selectedYearService, currentServerYear } from "../globalService";
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
  alertController, // Import alertController
  loadingController,
  IonCheckbox,
  IonGrid, // New import
  IonRow, // New import
  IonCol, // New import
  IonListHeader, // New import
} from "@ionic/vue";

import {
  swapHorizontalOutline,
  createOutline,
  downloadOutline,
  trashOutline,
  layersOutline,
  schoolOutline,
  personAddOutline,
} from "ionicons/icons";

const AssignmentType = {
  COURSE: "COURSE",
  GROUP: "GROUP",
};

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
    IonCheckbox,
    IonGrid, // New component
    IonRow, // New component
    IonCol, // New component
    IonListHeader, // New component
    TeacherAssignmentModal, // New component
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

    const isTeacherAssignmentModalOpen = ref(false); // New ref for the new modal

    const showTeachersSection = ref(false); // New ref for teachers section visibility
    const showNoCourseSection = ref(false); // New ref for no course section visibility
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

    const courseAreas = ref([]);
    const courseAssignments = ref([]);
    const allTeachers = ref([]);
    const currentCourseAreas = ref([]); // Areas for the modal
    const selectedAreas = ref({}); // Checked areas in modal
    const initialSelectedAreas = ref({}); // To store initial state of selected areas
    const initialAssignedTeachers = ref({}); // To store initial teacher assignments for areas

    const cursosInstituto = ref([
      {
        id: 0,
        name: "Sin Curso",
      },
    ]);
    const curServerYear = currentServerYear();
    const years = ref(
      Array.from({ length: 10 }, (_, i) => curServerYear - i)
    );
    const selectedYear = ref(curServerYear);
    const selectedYearForBulk = ref(curServerYear);

    const isBulkAssignModalOpen = ref(false);
    const studentsForBulkAssign = ref([]);
    let selectedStudents = ref([]);
    const sourceCourseForBulk = ref(null);
    const teacherSearchResults = ref([]);
    const searchQuery = ref("");

    const isPrivilegedUser = computed(() => {
      if (!usuario.value) return false;
      const privilegedRoles = ["admin", "director", "coordinator"];
      return privilegedRoles.includes(usuario.value.rol);
    });

    const canManage = (targetUser) => {
      if (!usuario.value) return false;

      // Privileged users can manage anyone, including themselves
      if (isPrivilegedUser.value) {
        return true;
      }

      // Non-privileged users cannot manage themselves
      if (usuario.value.id === targetUser.id) return false;

      // Teachers can only manage students in their courses
      if (usuario.value.rol === "teacher") {
        const isStudent =
          targetUser.rol === "student" || targetUser.rol === "user";
        const teacherCourses =
          usuario.value.courses?.map((c) => c.course.id) || [];
        const isTeacherInCourse = teacherCourses.includes(
          courseSelected.value.id
        );

        return isStudent && isTeacherInCourse;
      }

      return false;
    };

    const availableRoles = computed(() => {
      // Scenario 1: No user is selected yet (e.g., when using the search bar to find a teacher)
      // In this case, we assume the intent is to assign a teacher/admin to the course.
      if (!selectedUser.value) {
        return roles.value.filter(
          (r) => r.rol === "teacher" || r.rol === "admin"
        );
      }

      // Scenario 2: A user has been selected
      // Determine available roles based on the selected user's system role
      if (
        selectedUser.value.rol === "teacher" ||
        selectedUser.value.rol === "admin"
      ) {
        return roles.value.filter(
          (r) => r.rol === "teacher" || r.rol === "admin"
        );
      } else if (["student", "user"].includes(selectedUser.value.rol)) {
        return roles.value.filter((r) => r.rol === "student");
      }

      // Scenario 3: Fallback for privileged users or unexpected roles
      // If the logged-in user is privileged, they can assign any role,
      // unless the selected user's system role restricts it (handled above).
      // This part should only be reached if selectedUser.value.rol is something unexpected.
      if (isPrivilegedUser.value) {
        return roles.value;
      }

      return [];
    });

    const availableCourses = computed(() => {
      if (isPrivilegedUser.value) {
        return cursosInstituto.value;
      }
      if (usuario.value?.rol === "teacher") {
        const teacherCourseIds =
          usuario.value.courses?.map((c) => c.course.id) || [];
        return cursosInstituto.value.filter(
          (c) => c.id === 0 || teacherCourseIds.includes(c.id)
        );
      }
      return [];
    });

    watch(rolSelected, (newRole) => {
      if (newRole !== "student") {
        selectedGroupId.value = null;
      }
    });

    watch(selectedUser, () => {
      rolSelected.value = null; // Reset selected role when user changes
    });

    const getRoleLabel = (item) => {
      const rol = item.courseRol || item.rol;
      switch (rol) {
        case "user":
        case "student":
          return "Estudiante";
        case "admin":
          return "Administrador";
        case "teacher":
          return "Profesor";
        default:
          return "Rol no identificado";
      }
    };

    const openModal = (user) => {
      selectedUser.value = user;
      if (user.rol === "teacher" || user.rol === "admin") {
        isTeacherAssignmentModalOpen.value = true;
      } else {
        selectedCourseId.value = null;
        selectedGroupId.value = null;
        selectedAreas.value = {};
        initialSelectedAreas.value = {}; // Reset initial state
        initialAssignedTeachers.value = {}; // Reset initial state
        currentCourseAreas.value = [];
        isModalOpen.value = true;
      }
    };

    const closeModal = () => {
      isModalOpen.value = false;
      selectedAreas.value = {};
      initialSelectedAreas.value = {};
      initialAssignedTeachers.value = {};
    };

    const fetchUserAreaAssignments = async (userId, courseId, year) => {
      if (!userId || !courseId || courseId === 0) {
        selectedAreas.value = {};
        initialSelectedAreas.value = {};
        initialAssignedTeachers.value = {};
        return;
      }
      try {
        const response = await axios.get(
          `/courses/${courseId}/areas-teachers?year=${year}`,
          tokenHeader()
        );
        const assignments = response.data;
        const userAssignments = assignments.filter(
          (assignment) =>
            assignment.teacher &&
            assignment.teacher.id === userId &&
            assignment.active
        );

        const tempSelectedAreas = {};
        const tempInitialSelectedAreas = {};
        const tempInitialAssignedTeachers = {};

        userAssignments.forEach((assignment) => {
          tempSelectedAreas[assignment.area.id] = true;
          tempInitialSelectedAreas[assignment.area.id] = true;
        });

        assignments.forEach((assignment) => {
          if (assignment.teacher) {
            tempInitialAssignedTeachers[assignment.area.id] =
              assignment.teacher.id;
          }
        });

        selectedAreas.value = tempSelectedAreas;
        initialSelectedAreas.value = tempInitialSelectedAreas;
        initialAssignedTeachers.value = tempInitialAssignedTeachers;
      } catch (error) {
        console.error("Error fetching user area assignments:", error);
        selectedAreas.value = {};
        initialSelectedAreas.value = {};
        initialAssignedTeachers.value = {};
      }
    };

    const presentActionSheet = async (curso) => {
      const buttons = [
        {
          text: "Imprimir Lista",
          handler: () => {
            navigateToPrintableList(curso);
          },
        },
        {
          text: "Imprimir Hojas de Respuestas",
          handler: () => {
            navigateToPrintableSheet(curso);
          },
        },
        {
          text: "Imprimir QRs de Respuestas",
          handler: () => {
            navigateToPrintableQr(curso);
          },
        },
        {
          text: "Cancelar",
          role: "cancel",
        },
      ];

      if (curso.id !== 0) {
        buttons.splice(0, 0, {
          text: "Asignación Múltiple",
          handler: () => {
            openBulkAssignModal(curso);
          },
        });
      }

      const actionSheet = await actionSheetController.create({
        header: "Opciones para " + curso.name,
        buttons: buttons,
      });
      await actionSheet.present();
    };

    const openBulkAssignModal = async (curso) => {
      sourceCourseForBulk.value = curso;
      selectedCourseId.value = null;
      rolSelected.value = "student";
      selectedStudents.value = [];
      selectedYearForBulk.value = selectedYear.value;

      // Re-use getUsuarios logic to fetch students
      loading.value = true;
      const response = await axios.get(
        `/courses/${curso.id}/users?active=true&year=${selectedYear.value}`,
        tokenHeader()
      );
      const allUsers = response.data
        .filter((assignment) => assignment.active !== false)
        .map((usuario) => usuario.user);

      studentsForBulkAssign.value = allUsers.filter(
        (user) => user.rol === "student" || user.rol === "user"
      );
      loading.value = false;
      isBulkAssignModalOpen.value = true;
    };

    const closeBulkAssignModal = () => {
      isBulkAssignModalOpen.value = false;
    };

    const toggleSelectAll = (event) => {
      if (event.detail.checked) {
        selectedStudents.value = studentsForBulkAssign.value.map(
          (student) => student.id
        );
      } else {
        selectedStudents.value = [];
      }
    };

    const confirmBulkAssign = async () => {
      if (!selectedCourseId.value || selectedStudents.value.length === 0) {
        const alert = await alertController.create({
          header: "Información incompleta",
          message:
            "Por favor, seleccione un curso de destino y al menos un estudiante.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      // Show loading indicator
      const loading = await loadingController.create({
        message: "Procesando traslado de estudiantes...",
      });
      await loading.present();

      try {
        // Step 1: Deactivate previous assignments for all selected students
        const deactivationPromises = selectedStudents.value.map((userId) =>
          axios.patch(
            `/users/${userId}/deactivate-assignments`,
            {
              assignmentTypes: ["COURSE", "GROUP"],
            },
            tokenHeader()
          )
        );

        await Promise.all(deactivationPromises);

        // Step 2: Assign to new course
        const assignments = selectedStudents.value.map((userId) => ({
          userId: userId,
          year: parseInt(selectedYearForBulk.value, 10),
          rol: "student",
        }));

        await axios.post(
          `/courses/${selectedCourseId.value}/users`,
          assignments,
          {
            headers: tokenHeader(),
          }
        );

        await loading.dismiss();
        closeBulkAssignModal();
        
        // Show success message
        const successAlert = await alertController.create({
          header: "Éxito",
          message: "Estudiantes trasladados correctamente.",
          buttons: [
            {
              text: "OK",
              handler: () => {
                location.reload(); // Reload to see the changes
              }
            }
          ],
        });
        await successAlert.present();

      } catch (error) {
        await loading.dismiss();
        console.error("Error en la asignación múltiple:", error);
        const errorAlert = await alertController.create({
          header: "Error",
          message:
            "Hubo un error al intentar trasladar los estudiantes. Por favor intente nuevamente.",
          buttons: ["OK"],
        });
        await errorAlert.present();
      }
    };

    const navigateToPrintableList = async (curso) => {
      const studentData = await preparePrintableData(curso);
      router.push({
        name: "PrintableStudentList",
        state: {
          studentData: studentData,
          year: selectedYear.value,
        },
      });
    };

    const navigateToPrintableSheet = async (curso) => {
      const studentData = await preparePrintableData(curso);
      router.push({
        name: "PrintableStudentSheet",
        state: {
          studentData: studentData,
          year: selectedYear.value,
        },
      });
    };

    const navigateToPrintableQr = async (curso) => {
      const studentData = await preparePrintableData(curso);
      router.push({
        name: "PrintableStudentQr",
        state: {
          studentData: studentData,
          year: selectedYear.value,
        },
      });
    };

    const preparePrintableData = async (curso) => {
      const year = selectedYear.value;
      const coursesWithStudents = [];

      if (curso.id !== 0) {
        try {
          const response = await axios.get(
            `/courses/${curso.id}/users?active=true&year=${year}`,
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
      return coursesWithStudents;
    };

    const downloadCSV = async (curso) => {
      let csvContent = '"ROLLNO","NAME","CLASS","EMAILID","PHONENO"\r\n';
      const year = selectedYear.value;

      if (curso.id !== 0) {
        // Skip "Sin Curso"
        try {
          const response = await axios.get(
            `/courses/${curso.id}/users?active=true&year=${year}`,
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

      // Create a Blob from the CSV string
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `estudiantes_${curso.name}_${year}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    const asignarUsuario = async () => {
      try {
        // Step 0: Deactivate previous assignments if user is being moved from another active course
        // This ensures they don't stay active in the old course/group
        if (
          courseSelected.value &&
          courseSelected.value.id &&
          courseSelected.value.id !== 0
        ) {
          try {
            await axios.patch(
              `/users/${selectedUser.value.id}/deactivate-assignments`,
              {
                assignmentTypes: [AssignmentType.COURSE, AssignmentType.GROUP],
              },
              tokenHeader()
            );
          } catch (deactivateError) {
            console.warn(
              "Warning: Could not deactivate previous assignments",
              deactivateError
            );
            // We continue even if deactivation fails, but valid to log it
          }
        }

        // Step 1: Assign to course (skip if course is 0 - "Sin Curso")
        if (selectedCourseId.value != 0) {
          await axios.post(
            `/courses/${selectedCourseId.value}/users`,
            [
              {
                userId: selectedUser.value.id,
                year: parseInt(selectedYear.value, 10),
                rol: rolSelected.value || "student",
              },
            ],
            {
              headers: tokenHeader(),
            }
          );
        }

        // Step 2: Assign to group (if group is selected)
        if (selectedGroupId.value) {
          await axios.post(
            `/groups/${selectedGroupId.value}/users`,
            [
              {
                userId: selectedUser.value.id,
                periodId: 1,
                year: parseInt(selectedYear.value, 10),
                active: true,
              },
            ],
            {
              headers: tokenHeader(),
            }
          );
        }

        // Step 3: Assign/Unassign to areas (if teacher/admin and areas selected)
        if (
          selectedCourseId.value != 0 &&
          (rolSelected.value === "teacher" || rolSelected.value === "admin")
        ) {
          for (const area of currentCourseAreas.value) {
            const isCurrentlyChecked = selectedAreas.value[area.id];

            // Send the desired state to the backend
            await axios.post(
              `/courses/${selectedCourseId.value}/areas-teachers`,
              {
                areaId: area.id,
                teacherId: selectedUser.value.id,
                year: parseInt(selectedYear.value, 10),
                active: isCurrentlyChecked, // Set active based on checkbox state
              },
              tokenHeader()
            );
          }
        }

        // Success: close modal and reload
        closeModal();
        router.go(0); // Use router.go(0) for full reload
      } catch (error) {
        console.error("Error al asignar el usuario:", error);
        // Optionally show an error alert to the user
      }
    };

    const deactivateUser = async (user) => {
      const alert = await alertController.create({
        header: "Confirmar Eliminación",
        message: `¿Estás seguro de que quieres marcar a ${user.name} ${user.lastName} como eliminado de sus asignaciones a cursos y grupos?`,
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
            cssClass: "secondary",
          },
          {
            text: "Eliminar",
            handler: async () => {
              try {
                await axios.patch(
                  `/users/${user.id}/deactivate-assignments`,
                  {
                    assignmentTypes: [
                      AssignmentType.COURSE,
                      AssignmentType.GROUP,
                    ],
                  },
                  tokenHeader()
                );

                // Refresh the user list or remove the user from the current view
                // For simplicity, I'll reload the current course's users.
                if (courseSelected.value?.id) {
                  getUsuarios(courseSelected.value.id, selectedYear.value);
                } else {
                  getUsuariosSinCurso();
                }
              } catch (error) {
                console.error(
                  "Error al desactivar asignaciones del usuario:",
                  error
                );
                const errorAlert = await alertController.create({
                  header: "Error",
                  message:
                    "Hubo un error al intentar desactivar las asignaciones del usuario.",
                  buttons: ["OK"],
                });
                await errorAlert.present();
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const captarAbierto = (event) => {
      const selectedValue = event.detail.value;
      abierto.value = selectedValue !== undefined;

      if (abierto.value) {
        if (courseSelected.value?.id !== undefined) {
          getUsuarios(courseSelected.value.id, selectedYear.value);
          fetchCourseAssignments(courseSelected.value.id);
        }
      }
    };

    const fetchCourseAssignments = async (courseId) => {
      if (courseId === 0) {
        courseAreas.value = [];
        courseAssignments.value = [];
        return;
      }
      try {
        // Fetch course to get its linked areas
        const courseRes = await axios.get(
          `/courses/${courseId}`,
          tokenHeader()
        );
        courseAreas.value = courseRes.data.areas;

        // Fetch area-teacher assignments
        const assignmentsRes = await axios.get(
          `/courses/${courseId}/areas-teachers?year=${selectedYear.value}`,
          tokenHeader()
        );
        courseAssignments.value = assignmentsRes.data;

        // Fetch all teachers for selection if not already fetched
        if (allTeachers.value.length === 0) {
          const teachersRes = await axios.get(
            `/users?instituteId=${usuario.value.institute.id}&rol=teacher,admin`,
            tokenHeader()
          );
          allTeachers.value = teachersRes.data;
        }
      } catch (error) {
        console.error("Error fetching course assignments:", error);
      }
    };

    const getAssignedTeacher = (areaId) => {
      const assignment = courseAssignments.value.find(
        (a) => a.area.id === areaId && a.active
      );
      return assignment ? assignment.teacher : null;
    };

    const assignAreaTeacher = async (areaId, teacherId) => {
      try {
        await axios.post(
          `/courses/${courseSelected.value.id}/areas-teachers`,
          {
            areaId,
            teacherId,
            year: parseInt(selectedYear.value, 10),
            active: true,
          },
          tokenHeader()
        );
        fetchCourseAssignments(courseSelected.value.id);
      } catch (error) {
        console.error("Error assigning teacher to area:", error);
      }
    };

    const openAreaTeacherPicker = async (area) => {
      const currentTeacher = getAssignedTeacher(area.id);

      const inputs = allTeachers.value.map((t) => ({
        type: "radio",
        label: `${t.lastName} ${t.name}`,
        value: t.id,
        checked: currentTeacher && currentTeacher.id === t.id,
      }));

      // Add "Sin asignar" option
      inputs.unshift({
        type: "radio",
        label: "Sin Docente",
        value: null,
        checked: !currentTeacher,
      });

      const alert = await alertController.create({
        header: `Asignar Docente a ${area.name}`,
        inputs,
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Asignar",
            handler: (teacherId) => {
              assignAreaTeacher(area.id, teacherId);
            },
          },
        ],
      });
      await alert.present();
    };

    const getTeachers = async () => {
      loading.value = true;
      usersCourse.value = [];
      try {
        const response = await axios.get(
          `/users?instituteId=${usuario.value.institute.id}&rol=teacher,admin`,
          tokenHeader()
        );
        usersCourse.value = response.data;
      } catch (error) {
        console.error("Error fetching teachers:", error);
      } finally {
        loading.value = false;
      }
    };

    const getUsuarios = async (cursoId, year) => {
      loading.value = true;
      usersCourse.value = [];

      if (cursoId == 0) {
        await getUsuariosSinCurso();
      } else {
        const response = await axios.get(
          `/courses/${cursoId}/users?year=${year}&active=true`,
          tokenHeader()
        );

        const users = response.data
          .filter((assignment) => assignment.active !== false)
          .map((assignment) => {
            return {
              ...assignment.user,
              courseRol: assignment.rol,
            };
          });

        const roleOrder = {
          admin: 0,
          director: 1,
          coordinator: 2,
          teacher: 3,
          student: 4,
          user: 4,
        };

        users.sort((a, b) => {
          const roleA = a.courseRol || a.rol || "user";
          const roleB = b.courseRol || b.rol || "user";
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

      // 1. Get users with NO assignments at all from the existing endpoint
      const responseNoCourse = await axios.get(
        `/institutes/${usuario.value.institute.id}/usersNoCourse?year=0`,
        tokenHeader()
      );
      const usersWithNoAssignments = responseNoCourse.data;

      // 2. Get all courses to find users with only inactive assignments
      const allCourses = cursosInstituto.value.filter((c) => c.id !== 0);
      const allAssignments = [];

      // Fetch all assignments from all courses in parallel
      const assignmentPromises = allCourses.map((course) =>
        axios.get(
          `/courses/${course.id}/users?active=true&year=${selectedYear.value}`,
          tokenHeader()
        )
      );

      try {
        const assignmentResponses = await Promise.all(assignmentPromises);
        assignmentResponses.forEach((response) => {
          allAssignments.push(...response.data);
        });
      } catch (error) {
        console.error("Error fetching assignments for all courses:", error);
      }

      const usersData = new Map();

      allAssignments.forEach((assignment) => {
        if (!usersData.has(assignment.user.id)) {
          usersData.set(assignment.user.id, {
            user: assignment.user,
            hasActive: false,
          });
        }
        if (assignment.active !== false) {
          usersData.get(assignment.user.id).hasActive = true;
        }
      });

      const usersWithOnlyInactiveAssignments = [];
      usersData.forEach((data) => {
        if (!data.hasActive) {
          usersWithOnlyInactiveAssignments.push(data.user);
        }
      });

      // 3. Combine the lists and remove duplicates
      const combinedUsers = [
        ...usersWithNoAssignments,
        ...usersWithOnlyInactiveAssignments,
      ];
      const uniqueUsers = Array.from(
        new Set(combinedUsers.map((u) => u.id))
      ).map((id) => {
        return combinedUsers.find((u) => u.id === id);
      });

      usersCourse.value = uniqueUsers;
      loading.value = false;
    };

    const changeCourse = (curso) => {
      courseSelected.value = curso;
    };

    const getGruposCurso = async () => {
      if (selectedCourseId.value !== null) {
        if (selectedCourseId.value === 0) {
          gruposCursoDestino.value = [];
          currentCourseAreas.value = [];
          selectedGroupId.value = null;
          return;
        }

        try {
          // Fetch groups
          const groupsResponse = await axios.get(
            `/courses/${selectedCourseId.value}/groups`,
            {
              headers: tokenHeader(),
            }
          );
          gruposCursoDestino.value = groupsResponse.data;
          selectedGroupId.value = null;

          // Fetch areas for the modal
          const areasResponse = await axios.get(
            `/courses/${selectedCourseId.value}/areas`,
            tokenHeader()
          );
          currentCourseAreas.value = areasResponse.data;

          // If a user is selected and is a teacher/admin, fetch their area assignments for the selected course
          if (
            selectedUser.value &&
            (selectedUser.value.rol === "teacher" ||
              selectedUser.value.rol === "admin")
          ) {
            await fetchUserAreaAssignments(
              selectedUser.value.id,
              selectedCourseId.value,
              selectedYear.value
            );
          }
        } catch (error) {
          console.error("Error fetching course data:", error);
          gruposCursoDestino.value = [];
          currentCourseAreas.value = [];
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
        ...response.data.sort((a, b) => parseInt(a.name) - parseInt(b.name)),
      ];
    };



    const toggleTeachersSection = () => {
      showTeachersSection.value = !showTeachersSection.value;
      if (showTeachersSection.value) {
        getTeachers();
      }
    };


    const toggleNoCourseSection = async () => {
      showNoCourseSection.value = !showNoCourseSection.value;
      if (showNoCourseSection.value) {
        await getUsuariosSinCurso();
      }
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
      selectedYearService,
      captarAbierto,
      getCurso,
      getUsuarios,
      getTeachers,
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
      deactivateUser, // Expose the new method

      swapHorizontalOutline,
      createOutline,
      downloadOutline,
      trashOutline, // Expose the new icon

      // Bulk Assign
      isBulkAssignModalOpen,
      studentsForBulkAssign,
      selectedStudents,
      sourceCourseForBulk,
      openBulkAssignModal,
      closeBulkAssignModal,
      toggleSelectAll,
      confirmBulkAssign,
      canManage,
      availableRoles,
      availableCourses,
      isPrivilegedUser,
      getRoleLabel,
      selectedYearForBulk,

      teacherSearchResults,
      searchQuery,

      // Archived Courses

      // Section Visibility
      showTeachersSection,
      showNoCourseSection,
      toggleTeachersSection,
      toggleNoCourseSection,

      // Area-Teacher assignments
      courseAreas,
      courseAssignments,
      getAssignedTeacher,
      openAreaTeacherPicker,
      layersOutline,
      schoolOutline,
      currentCourseAreas,
      selectedAreas,
      isTeacherAssignmentModalOpen,
      personAddOutline,
    };
  },
};
</script>
