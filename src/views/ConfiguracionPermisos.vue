<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="`/actividades/${activityId}`">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Configurar Permisos</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="selectedTab">
          <ion-segment-button value="grupos">
            <ion-label>Permisos Grupales</ion-label>
          </ion-segment-button>
          <ion-segment-button value="individuales">
            <ion-label>Permisos Individuales</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="selectedTab === 'grupos'">
        <ion-list>
          <ion-list-header>
            <ion-label>Grupo revisor</ion-label>
            <ion-label>Grupo a ser revisado</ion-label>
          </ion-list-header>
          <ion-button expand="block" @click="assignAllSelfEvaluation" class="ion-margin">Asignar Autoevaluación a Todos</ion-button>
          <ion-item v-for="group in groups" :key="group.id">
            <ion-label>{{ group.name }}</ion-label>
            <ion-select
              v-model="groupPermissions[group.id]"
              placeholder="Seleccionar revisado"
            >
              <ion-select-option :value="group.id"
                >{{ group.name }} (Autoevaluación)</ion-select-option
              >
              <ion-select-option
                v-for="reviserGroup in getAvailableReviserGroups(group.id).filter(
                  (g) => g.id !== group.id
                )"
                :key="reviserGroup.id"
                :value="reviserGroup.id"
              >
                {{ reviserGroup.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>
      </div>
      <div v-if="selectedTab === 'individuales'">
        <ion-list>
          <ion-list-header>
          <ion-label>Estudiante revisor</ion-label>
          <ion-label>Estudiante a ser revisado</ion-label>
        </ion-list-header>
        <ion-button expand="block" @click="assignAllSelfEvaluation" class="ion-margin">Asignar Autoevaluación a Todos</ion-button>
          <ion-item
            v-for="student in students"
            :key="student.id"
          >
            <ion-label
              >{{ student.name }} {{ student.lastName }}</ion-label
            >
            <ion-select
              v-model="individualPermissions[student.id]"
              placeholder="¿a quién revisa?"
            >
              <ion-select-option :value="null">Ninguno</ion-select-option>
              <ion-select-option :value="student.id"
                >{{ student.name }}
                {{ student.lastName }} (Autoevaluación)</ion-select-option
              >
              <ion-select-option
                v-for="reviserStudent in getAvailableReviserStudents(student.id).filter(
                  (s) => s.id !== student.id
                )"
                :key="reviserStudent.id"
                :value="reviserStudent.id"
              >
                {{ reviserStudent.name }} {{ reviserStudent.lastName }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>
      </div>
      <ion-grid>
        <ion-row>
          <ion-col>
            <ion-button
              expand="full"
              color="danger"
              @click="removeAllPermissions"
              :disabled="isLoading"
            >
              Quitar Todos
            </ion-button>
          </ion-col>
          <ion-col>
            <ion-button
              expand="full"
              @click="savePermissions"
              :disabled="isLoading"
            >
              <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
              <span v-else>Guardar Permisos</span>
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Toasts -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        message="Permisos guardados correctamente"
        :duration="3000"
        color="success"
        @didDismiss="setSuccessToastOpen(false)"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        :message="errorMessage"
        :duration="3000"
        color="danger"
        @didDismiss="setErrorToastOpen(false)"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { tokenHeader } from "../globalService";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonButton,
  IonIcon,
  IonListHeader,
  IonSpinner,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonButton,
    IonIcon,
    IonListHeader,
    IonSpinner,
    IonToast,
    IonGrid,
    IonRow,
    IonCol,
  },
  setup() {
    const route = useRoute();
    const activityId = ref(route.params.id);
    const selectedTab = ref("grupos");
    const courseId = ref(null);
    const year = ref(null);
    const groups = ref([]);
    const students = ref([]);
    const groupPermissions = ref({});
    const individualPermissions = ref({});
    const initialPermissions = ref([]);
    const isLoading = ref(false);

    const isSuccessToastOpen = ref(false);
    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const setErrorToastOpen = (val, message = "") => {
      isErrorToastOpen.value = val;
      errorMessage.value = message;
    };

    const getAvailableReviserGroups = (currentGroupId) => {
      const otherSelectedIds = Object.entries(groupPermissions.value)
        .filter(([key]) => key !== String(currentGroupId))
        .map(([, value]) => value);
      return groups.value.filter((g) => !otherSelectedIds.includes(g.id));
    };

    const getAvailableReviserStudents = (currentStudentId) => {
      const otherSelectedIds = Object.entries(individualPermissions.value)
        .filter(([key]) => key !== String(currentStudentId))
        .map(([, value]) => value);
      return students.value.filter(
        (s) => !otherSelectedIds.includes(s.id)
      );
    };

    const fetchActivityDetails = async () => {
      try {
        const response = await axios.get(
          `/activities/${activityId.value}`,
          tokenHeader()
        );
        courseId.value = response.data.lesson.course.id;
        year.value = response.data.lesson.year;
        await fetchGroups();
        await fetchStudents();
        await fetchExistingPermissions();
      } catch (error) {
        console.error("Error fetching activity details:", error);
        setErrorToastOpen(
          true,
          "Error al cargar los detalles de la actividad."
        );
      }
    };

    const fetchGroups = async () => {
      if (!courseId.value) return;
      try {
        const response = await axios.get(
          `/courses/${courseId.value}/groups`,
          tokenHeader()
        );
        groups.value = response.data.filter(
          (group) =>
            group.usersToGroup &&
            group.usersToGroup.some(
              (userToGroup) => userToGroup.active === true
            )
        );
        groups.value.forEach((group) => {
          groupPermissions.value[group.id] = null;
        });
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    const fetchStudents = async () => {
      if (!courseId.value || !year.value) return;
      try {
        const usersResponse = await axios.get(
          `/courses/${courseId.value}/users?year=${year.value}`,
          tokenHeader()
        );
        const allUsersInCourse = usersResponse.data;

        students.value = allUsersInCourse
          .filter((u) => u.rol === "student")
          .map((u) => ({
            ...u.user,
          }));

        students.value.forEach((student) => {
          individualPermissions.value[student.id] = null;
        });
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    const fetchExistingPermissions = async () => {
      if (!activityId.value) return;
      try {
        const response = await axios.get(
          `/student-criterion-scores/permissions?activityId=${activityId.value}&expired=false`,
          tokenHeader()
        );
        initialPermissions.value = response.data; // Store initial state
        initialPermissions.value.forEach(p => {
          if (p.reviserType === 'Group') {
            groupPermissions.value[p.reviserId] = p.revisedId;
          } else if (p.reviserType === 'User') {
            individualPermissions.value[p.reviserId] = p.revisedId;
          }
        });
      } catch (error) {
        console.error("Error fetching existing permissions:", error);
      }
    };

    const removeAllPermissions = () => {
      if (selectedTab.value === 'grupos') {
        for (const key in groupPermissions.value) {
          groupPermissions.value[key] = null;
        }
      } else if (selectedTab.value === 'individuales') {
        for (const key in individualPermissions.value) {
          individualPermissions.value[key] = null;
        }
      }
    };

    const assignAllSelfEvaluation = () => {
      if (selectedTab.value === 'grupos') {
        for (const group of groups.value) {
          groupPermissions.value[group.id] = group.id;
        }
      } else if (selectedTab.value === 'individuales') {
        for (const student of students.value) {
          individualPermissions.value[student.id] = student.id;
        }
      }
    }

    const savePermissions = async () => {
      isLoading.value = true;
      try {
        const promises = [];
        const currentActivityId = parseInt(activityId.value);

        // Helper to process both group and individual permissions
        const processPermissions = (permissionsMap, reviserType, revisedType) => {
          for (const reviserId in permissionsMap) {
            const initialPermission = initialPermissions.value.find(
              (p) => p.reviserId == reviserId && p.reviserType === reviserType
            );
            const newRevisedId = permissionsMap[reviserId];

            if (initialPermission && !newRevisedId) {
              // DELETE -> Expire the old permission
              promises.push(
                axios.patch(
                  `/student-criterion-scores/permissions/${initialPermission.id}`,
                  { expired: true },
                  tokenHeader()
                )
              );
            } else if (
              initialPermission &&
              newRevisedId !== initialPermission.revisedId
            ) {
              // UPDATE -> Expire the old and create a new one
              // 1. Expire old
              promises.push(
                axios.patch(
                  `/student-criterion-scores/permissions/${initialPermission.id}`,
                  { expired: true },
                  tokenHeader()
                )
              );
              // 2. Create new
              promises.push(
                axios.post(
                  `/student-criterion-scores/permissions`,
                  {
                    reviserId: parseInt(reviserId),
                    reviserType: reviserType,
                    revisedId: newRevisedId,
                    revisedType: revisedType,
                    activityId: currentActivityId,
                    expired: false,
                  },
                  tokenHeader()
                )
              );
            } else if (!initialPermission && newRevisedId) {
              // CREATE
              promises.push(
                axios.post(
                  `/student-criterion-scores/permissions`,
                  {
                    reviserId: parseInt(reviserId),
                    reviserType: reviserType,
                    revisedId: newRevisedId,
                    revisedType: revisedType,
                    activityId: currentActivityId,
                    expired: false,
                  },
                  tokenHeader()
                )
              );
            }
          }
        };

        processPermissions(groupPermissions.value, "Group", "Group");
        processPermissions(individualPermissions.value, "User", "User");

        await Promise.all(promises);

        setSuccessToastOpen(true);
        await fetchExistingPermissions(); // Refresh state from server
      } catch (error) {
        console.error("Error saving permissions:", error);
        const message =
          error.response?.data?.message ||
          "Error al guardar los permisos. Inténtalo de nuevo.";
        setErrorToastOpen(true, message);
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(() => {
      fetchActivityDetails();
    });

    return {
      activityId,
      selectedTab,
      arrowBackOutline,
      groups,
      students,
      groupPermissions,
      individualPermissions,
      getAvailableReviserGroups,
      getAvailableReviserStudents,
      savePermissions,
      isLoading,
      isSuccessToastOpen,
      setSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setErrorToastOpen,
      removeAllPermissions,
      assignAllSelfEvaluation,
    };
  },
};
</script>

<style scoped>
ion-item ion-select {
  max-width: 60%; /* Allow it to take up more space, adjust as needed */
  flex: 1; /* Allow it to grow and shrink */
}
</style>
