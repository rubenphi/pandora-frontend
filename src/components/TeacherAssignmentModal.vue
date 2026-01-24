<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleDidDismiss">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="handleDidDismiss">Cancelar</ion-button>
        </ion-buttons>
        <ion-title
          >Asignar Cursos y Áreas a {{ selectedUser?.name }}
          {{ selectedUser?.lastName }}</ion-title
        >
        <ion-buttons slot="end">
          <ion-button :strong="true" @click="confirmChanges"
            >Confirmar</ion-button
          >
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="loading">Cargando...</div>
      <div v-else>
        <ion-card
          v-for="course in allCourses"
          :key="course.id"
          class="ion-margin-bottom"
        >
          <ion-card-header>
            <ion-item lines="none">
              <ion-label>
                <h2>{{ course.name }}</h2>
              </ion-label>
            </ion-item>
          </ion-card-header>

          <ion-card-content>
            <ion-item>
              <ion-label>Rol en el curso</ion-label>
              <ion-select
                :value="courseAssignments[course.id]?.rol"
                @ionChange="handleRoleChange(course.id, $event.detail.value)"
                placeholder="Seleccionar Rol"
                interface="popover"
              >
                <ion-select-option :value="null">Ninguno</ion-select-option>
                <ion-select-option value="teacher">Profesor</ion-select-option>
                <ion-select-option value="admin"
                  >Director de Curso</ion-select-option
                >
              </ion-select>
            </ion-item>

            <ion-list>
              <ion-list-header>
                <ion-label>Áreas</ion-label>
              </ion-list-header>
              <ion-item v-for="area in allAreas[course.id]" :key="area.id">
                <ion-label>{{ area.name }}</ion-label>
                <ion-checkbox
                  slot="start"
                  :checked="isAreaAssigned(course.id, area.id)"
                  @ionChange="
                    toggleAreaAssignment(
                      course.id,
                      area.id,
                      $event.detail.checked
                    )
                  "
                ></ion-checkbox>
              </ion-item>
              <ion-item
                v-if="!allAreas[course.id] || allAreas[course.id].length === 0"
              >
                <ion-label class="ion-text-wrap"
                  >No hay áreas disponibles para este curso.</ion-label
                >
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script>
import { ref, watch } from "vue";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardContent,
  alertController,
} from "@ionic/vue";
import axios from "axios";
import { tokenHeader, usuarioGet, selectedYear as selectedYearService } from "../globalService";
import { useRouter } from "vue-router"; // Import useRouter

export default {
  components: {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardContent,
  },
  props: {
    isOpen: Boolean,
    selectedUser: Object,
  },
  emits: ["didDismiss", "confirm"],
  setup(props, { emit }) {
    const router = useRouter(); // Initialize router
    const currentUser = ref(usuarioGet());
    const loading = ref(false);
    const allCourses = ref([]);
    const allAreas = ref({}); // Stores areas by courseId: { courseId: [area1, area2] }

    // State for course assignments (UserToCourse)
    const courseAssignments = ref({}); // { courseId: { rol: 'teacher', active: true, initialRol: 'student' } }
    const initialCourseAssignments = ref({}); // To compare changes

    // State for area assignments (CourseAreaTeacher)
    const areaAssignments = ref({}); // { courseId: { areaId: true } }
    const initialAreaAssignments = ref({}); // To compare changes
    const courseAreaTeacherIds = ref({}); // Stores { courseId: { areaId: assignmentId } }

    const handleDidDismiss = () => {
      emit("didDismiss");
    };

    const isAreaAssigned = (courseId, areaId) => {
      return areaAssignments.value[courseId]?.[areaId] === true;
    };

    const handleRoleChange = (courseId, newRole) => {
      if (!courseAssignments.value[courseId]) {
        courseAssignments.value[courseId] = {
          rol: newRole,
          active: !!newRole,
          initialRol: null,
        };
      } else {
        courseAssignments.value[courseId].rol = newRole;
      }

      // Si selecciona "Ninguno", limpiar todas las áreas de este curso
      if (!newRole) {
        if (areaAssignments.value[courseId]) {
          // Desmarcar todas las áreas
          Object.keys(areaAssignments.value[courseId]).forEach((areaId) => {
            areaAssignments.value[courseId][areaId] = false;
          });
        }
      }
    };

    const toggleAreaAssignment = (courseId, areaId, isChecked) => {
      if (!areaAssignments.value[courseId]) {
        areaAssignments.value[courseId] = {};
      }
      areaAssignments.value[courseId][areaId] = isChecked;

      // Auto-asignar rol "teacher" si no tiene rol y marca un área
      if (isChecked && !courseAssignments.value[courseId]) {
        courseAssignments.value[courseId] = {
          rol: "teacher",
          active: true,
          initialRol: null,
        };
      }
    };

    const fetchAllData = async () => {
      if (!props.selectedUser || !props.isOpen) return;

      loading.value = true;
      let stage = "inicialización";
      try {
        // Fetch all courses
        stage = "obteniendo cursos";
        const coursesRes = await axios.get(
          `/courses?instituteId=${currentUser.value.institute.id}&exist=true`,
          tokenHeader()
        );
        allCourses.value = coursesRes.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        // Fetch all areas for all courses
        stage = "obteniendo áreas para los cursos";
        const areaPromises = allCourses.value.map((course) =>
          axios.get(`/courses/${course.id}/areas`, tokenHeader())
        );
        const areasResponses = await Promise.all(areaPromises);
        areasResponses.forEach((res, index) => {
          allAreas.value[allCourses.value[index].id] = res.data;
        });

        const userCourseData = {};
        const userAreaAssignmentsData = {};
        const tempCourseAreaTeacherIds = {};

        // Fetch user's current course assignments (UserToCourse) from backend
        stage = "obteniendo asignaciones de cursos del usuario";
        const userCoursesRes = await axios.get(
          `/users/${
            props.selectedUser.id
          }/courses?year=${selectedYearService()}`,
          tokenHeader()
        );
        userCoursesRes.data.forEach((assignment) => {
          if (assignment.active) {
            userCourseData[assignment.course.id] = {
              rol: assignment.rol,
              active: true,
              initialRol: assignment.rol,
            };
          }
        });

        // Fetch user's current area assignments (CourseAreaTeacher) from backend
        stage = "obteniendo asignaciones de áreas del usuario";
        const allCourseAreaTeacherPromises = allCourses.value.map((course) =>
          axios.get(`/courses/${course.id}/areas-teachers`, tokenHeader())
        );
        const allCourseAreaTeacherResponses = await Promise.all(
          allCourseAreaTeacherPromises
        );
        allCourseAreaTeacherResponses.forEach((res, courseIndex) => {
          const courseId = allCourses.value[courseIndex].id;
          userAreaAssignmentsData[courseId] = {};
          tempCourseAreaTeacherIds[courseId] = {};
          res.data.forEach((assignment) => {
            if (assignment.teacher?.id === props.selectedUser.id) {
              tempCourseAreaTeacherIds[courseId][assignment.area.id] =
                assignment.id;
              if (assignment.active) {
                userAreaAssignmentsData[courseId][assignment.area.id] = true;
              }
            }
          });
        });

        stage = "reconciliando asignaciones de áreas y cursos";
        for (const courseId in userAreaAssignmentsData) {
          const hasActiveArea = Object.values(
            userAreaAssignmentsData[courseId]
          ).some((isActive) => isActive);
          if (hasActiveArea && !userCourseData[courseId]?.active) {
            if (!userCourseData[courseId]) {
              userCourseData[courseId] = {
                rol: "teacher",
                active: true,
                initialRol: "student",
              };
            } else {
              userCourseData[courseId].active = true;
            }
          }
        }

        stage = "actualizando estado del componente";
        courseAssignments.value = { ...userCourseData };
        initialCourseAssignments.value = { ...userCourseData };
        areaAssignments.value = JSON.parse(
          JSON.stringify(userAreaAssignmentsData)
        );
        initialAreaAssignments.value = JSON.parse(
          JSON.stringify(userAreaAssignmentsData)
        );
        courseAreaTeacherIds.value = { ...tempCourseAreaTeacherIds };
      } catch (error) {
        console.error(
          `Error en la etapa '${stage}' al obtener datos para el modal de asignación:`,
          error
        );
        const alert = await alertController.create({
          header: "Error",
          message: `No se pudieron cargar los datos de asignación (fallo en: ${stage}).`,
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        loading.value = false;
      }
    };

    const confirmChanges = async () => {
      loading.value = true;
      try {
        // PASO 1: Guardar asignaciones de áreas
        const areaPromises = [];
        for (const courseId in allAreas.value) {
          for (const area of allAreas.value[courseId]) {
            const isCurrentlyAssigned =
              areaAssignments.value[courseId]?.[area.id] === true;
            const wasInitiallyAssigned =
              initialAreaAssignments.value[courseId]?.[area.id] === true;
            const assignmentId =
              courseAreaTeacherIds.value[courseId]?.[area.id];

            if (isCurrentlyAssigned !== wasInitiallyAssigned) {
              if (assignmentId) {
                // Actualizar asignación existente
                areaPromises.push(
                  axios.patch(
                    `/courses/areas-teachers/${assignmentId}`,
                    { active: isCurrentlyAssigned },
                    tokenHeader()
                  )
                );
              } else if (isCurrentlyAssigned) {
                // Crear nueva asignación
                areaPromises.push(
                  axios.post(
                    `/courses/${courseId}/areas-teachers`,
                    {
                      areaId: area.id,
                      teacherId: props.selectedUser.id,
                      active: true,
                    },
                    tokenHeader()
                  )
                );
              }
            }
          }
        }

        // Esperar a que se guarden todas las áreas
        await Promise.all(areaPromises);

        // PASO 2: Actualizar pertenencia a cursos DESPUÉS de guardar áreas
        const coursePromises = [];
        for (const courseId of allCourses.value.map((c) => c.id)) {
          const current = courseAssignments.value[courseId];

          // Verificar si tiene áreas asignadas ACTUALMENTE
          const currentAreas = areaAssignments.value[courseId] || {};
          const hasActiveAreas = Object.values(currentAreas).some((v) => v);
          const currentRol = current?.rol;

          // Usuario debe pertenecer al curso si tiene rol O áreas asignadas
          const shouldBelongToCourse = !!currentRol || hasActiveAreas;

          // SIEMPRE enviar actualización para este curso
          // No importa el estado anterior, solo el estado actual
          const payload = [
            {
              userId: props.selectedUser.id,
              year: selectedYearService(),
              rol: currentRol || (hasActiveAreas ? "teacher" : "student"),
              active: shouldBelongToCourse,
            },
          ];
          coursePromises.push(
            axios.post(`/courses/${courseId}/users`, payload, tokenHeader())
          );
        }

        // Esperar a que se actualicen todas las pertenencias a cursos
        await Promise.all(coursePromises);

        // PASO 3: Mostrar mensaje de éxito y recargar SOLO después de que todo termine
        const alert = await alertController.create({
          header: "Éxito",
          message: "Asignaciones actualizadas correctamente.",
          buttons: [
            {
              text: "OK",
              handler: () => {
                router.go(0);
              },
            },
          ],
        });
        await alert.present();
      } catch (error) {
        console.error("Error al guardar asignaciones:", error);
        const alert = await alertController.create({
          header: "Error",
          message: "Hubo un error al actualizar las asignaciones.",
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        loading.value = false;
      }
    };

    watch(
      () => props.isOpen,
      (newVal) => {
        if (newVal) {
          fetchAllData();
        }
      }
    );

    return {
      currentUser,
      loading,
      allCourses,
      allAreas,
      courseAssignments,
      areaAssignments,
      handleDidDismiss,
      isAreaAssigned,
      toggleAreaAssignment,
      handleRoleChange,
      confirmChanges,
    };
  },
};
</script>

<style scoped>
/* Add any specific styles here */
</style>
