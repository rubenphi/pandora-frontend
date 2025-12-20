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
        <ion-list>
          <ion-list-header>
            <ion-label>Asignaciones de Cursos</ion-label>
          </ion-list-header>

          <ion-item v-for="course in allCourses" :key="course.id">
            <ion-label>{{ course.name }}</ion-label>
            <ion-checkbox
              slot="start"
              :checked="isCourseAssigned(course.id)"
              @ionChange="
                toggleCourseAssignment(course.id, $event.detail.checked)
              "
            ></ion-checkbox>
            <ion-select
              v-if="isCourseAssigned(course.id)"
              v-model="courseAssignments[course.id].rol"
              placeholder="Seleccionar Rol"
              interface="popover"
            >
              <ion-select-option value="teacher">Profesor</ion-select-option>
              <ion-select-option value="admin">Administrador</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <ion-list v-if="assignedCoursesWithAreas.length > 0">
          <ion-list-header>
            <ion-label>Asignación de Áreas por Curso</ion-label>
          </ion-list-header>
          <ion-accordion-group>
            <ion-accordion
              v-for="course in assignedCoursesWithAreas"
              :key="course.id"
            >
              <ion-item slot="header">
                <ion-label>{{ course.name }}</ion-label>
              </ion-item>
              <div class="ion-padding" slot="content">
                <ion-item v-for="area in course.areas" :key="area.id">
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
                <div v-if="course.areas.length === 0">
                  <p>No hay áreas disponibles para este curso.</p>
                </div>
              </div>
            </ion-accordion>
          </ion-accordion-group>
        </ion-list>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script>
import { ref, watch, computed } from "vue";
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
  IonAccordionGroup,
  IonAccordion,
  alertController,
} from "@ionic/vue";
import axios from "axios";
import { tokenHeader, usuarioGet } from "../globalService";
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
    IonAccordionGroup,
    IonAccordion,
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

    // const selectedYear = ref(new Date().getFullYear()); // Removed: Year is no longer relevant for CourseAreaTeacher

    const handleDidDismiss = () => {
      emit("didDismiss");
    };

    const isCourseAssigned = (courseId) => {
      return courseAssignments.value[courseId]?.active === true;
    };

    const isAreaAssigned = (courseId, areaId) => {
      return areaAssignments.value[courseId]?.[areaId] === true;
    };

    const toggleCourseAssignment = (courseId, isChecked) => {
      if (isChecked) {
        courseAssignments.value[courseId] = { rol: "teacher", active: true }; // Default to teacher
      } else {
        delete courseAssignments.value[courseId];
        // Also remove area assignments for this course if the course is unassigned
        if (areaAssignments.value[courseId]) {
          delete areaAssignments.value[courseId];
        }
      }
    };

    const toggleAreaAssignment = (courseId, areaId, isChecked) => {
      if (!areaAssignments.value[courseId]) {
        areaAssignments.value[courseId] = {};
      }
      areaAssignments.value[courseId][areaId] = isChecked;
    };

    const assignedCoursesWithAreas = computed(() => {
      return allCourses.value
        .filter((course) => isCourseAssigned(course.id))
        .map((course) => ({
          ...course,
          areas: allAreas.value[course.id] || [],
        }));
    });

    const fetchAllData = async () => {
      if (!props.selectedUser || !props.isOpen) return;

      loading.value = true;
      try {
        // Fetch all courses
        const coursesRes = await axios.get(
          `/courses?instituteId=${currentUser.value.institute.id}&exist=true`,
          tokenHeader()
        );
        allCourses.value = coursesRes.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        // Fetch all areas for all courses
        const areaPromises = allCourses.value.map((course) =>
          axios.get(`/courses/${course.id}/areas`, tokenHeader())
        );
        const areasResponses = await Promise.all(areaPromises);
        areasResponses.forEach((res, index) => {
          allAreas.value[allCourses.value[index].id] = res.data;
        });

        // Fetch user's current course assignments (UserToCourse)
        // Note: Year is still used here as UserToCourse still has a year.
        const userCoursesRes = await axios.get(
          `/users/${
            props.selectedUser.id
          }/courses?year=${new Date().getFullYear()}`, // Keep year for UserToCourse
          tokenHeader()
        );
        const userCourseData = {};
        userCoursesRes.data.forEach((assignment) => {
          if (assignment.active) {
            userCourseData[assignment.course.id] = {
              rol: assignment.rol,
              active: true,
              initialRol: assignment.rol, // Store initial role for comparison
            };
          }
        });
        courseAssignments.value = { ...userCourseData };
        initialCourseAssignments.value = { ...userCourseData };

        // Fetch user's current area assignments (CourseAreaTeacher)
        // Removed year from this API call
        const allCourseAreaTeacherPromises = allCourses.value.map((course) =>
          axios.get(`/courses/${course.id}/areas-teachers`, tokenHeader())
        );
        const allCourseAreaTeacherResponses = await Promise.all(
          allCourseAreaTeacherPromises
        );
        const userAreaAssignmentsData = {};
        const tempCourseAreaTeacherIds = {};

        allCourseAreaTeacherResponses.forEach((res, courseIndex) => {
          const courseId = allCourses.value[courseIndex].id;
          userAreaAssignmentsData[courseId] = {};
          tempCourseAreaTeacherIds[courseId] = {};
          res.data.forEach((assignment) => {
            if (assignment.teacher?.id === props.selectedUser.id) {
              // Check for any assignment for this teacher
              tempCourseAreaTeacherIds[courseId][assignment.area.id] =
                assignment.id;
              if (assignment.active) {
                userAreaAssignmentsData[courseId][assignment.area.id] = true;
              }
            }
          });
        });
        areaAssignments.value = JSON.parse(
          JSON.stringify(userAreaAssignmentsData)
        ); // Deep copy
        initialAreaAssignments.value = JSON.parse(
          JSON.stringify(userAreaAssignmentsData)
        ); // Deep copy
        courseAreaTeacherIds.value = { ...tempCourseAreaTeacherIds };
      } catch (error) {
        console.error(
          "Error fetching data for teacher assignment modal:",
          error
        );
        const alert = await alertController.create({
          header: "Error",
          message: "No se pudieron cargar los datos de asignación.",
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
        const promises = [];

        // Process Course Assignments (UserToCourse)
        for (const courseId of allCourses.value.map((c) => c.id)) {
          const current = courseAssignments.value[courseId];
          const initial = initialCourseAssignments.value[courseId];

          // If there's a change in assignment status or role for this course
          // The backend will find the existing UserToCourse record for this user/course/year
          // and update its active status and role, or create a new one if none exists.
          if (
            initial?.active !== current?.active ||
            (initial?.active && current?.active && initial.rol !== current.rol)
          ) {
            promises.push(
              axios.post(
                `/courses/${courseId}/users`,
                [
                  {
                    userId: props.selectedUser.id,
                    year: new Date().getFullYear(), // Keep year for UserToCourse
                    rol: current?.rol || "student", // Default to student if unassigned
                    active: current?.active || false, // Default to false if unassigned
                  },
                ],
                tokenHeader()
              )
            );
          }
        }

        // Process Area Assignments (CourseAreaTeacher)
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
                // Case 1: Assignment existed and changed status (assigned -> unassigned or vice versa)
                // Use PATCH to update its active status
                promises.push(
                  axios.patch(
                    `/courses/areas-teachers/${assignmentId}`,
                    {
                      active: isCurrentlyAssigned,
                      // teacherId: props.selectedUser.id, // Not needed for PATCH if only active is changing
                    },
                    tokenHeader()
                  )
                );
              } else if (isCurrentlyAssigned) {
                // Case 2: Assignment did not exist and is now created (assigned)
                // Use POST to create a new assignment (only if it's meant to be active)
                promises.push(
                  axios.post(
                    `/courses/${courseId}/areas-teachers`,
                    {
                      areaId: area.id,
                      teacherId: props.selectedUser.id,
                      active: true, // Always create as active
                    },
                    tokenHeader()
                  )
                );
              }
              // Case 3: Assignment did not exist and is now unassigned (no action needed)
              // If !isCurrentlyAssigned and no assignmentId, there's nothing to do (no inactive record to create)
            }
          }
        }

        await Promise.all(promises).then(async () => {
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
        });
      } catch (error) {
        console.error("Error confirming changes:", error);
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
      // selectedYear, // Removed from return
      handleDidDismiss,
      isCourseAssigned,
      isAreaAssigned,
      toggleCourseAssignment,
      toggleAreaAssignment,
      assignedCoursesWithAreas,
      confirmChanges,
    };
  },
};
</script>

<style scoped>
/* Add any specific styles here */
</style>
