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
            <ion-label>Grupo a ser revisado</ion-label>
            <ion-label>Grupo revisor</ion-label>
          </ion-list-header>
          <ion-item v-for="group in groups" :key="group.id">
            <ion-label>{{ group.name }}</ion-label>
            <ion-select
              v-model="groupPermissions[group.id]"
              placeholder="Seleccionar grupo"
            >
              <ion-select-option :value="group.id"
                >{{ group.name }} (Autoevaluación)</ion-select-option
              >
              <ion-select-option
                v-for="reviserGroup in availableReviserGroups.filter(
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
            <ion-label>Estudiante a ser revisado</ion-label>
            <ion-label>Estudiante revisor</ion-label>
          </ion-list-header>
          <ion-item
            v-for="student in students"
            :key="student.id"
            :class="{ 'no-group-student': !student.hasGroup }"
          >
            <ion-label
              >{{ student.name }} {{ student.lastName }}
              <span v-if="!student.hasGroup">(Sin grupo)</span></ion-label
            >
            <ion-select
              v-model="individualPermissions[student.id]"
              placeholder="Seleccionar revisor"
              :disabled="!student.hasGroup"
            >
              <ion-select-option :value="student.id"
                >{{ student.name }}
                {{ student.lastName }} (Autoevaluación)</ion-select-option
              >
              <ion-select-option
                v-for="reviserStudent in availableReviserStudents.filter(
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
      <ion-button
        expand="full"
        @click="savePermissions"
        class="ion-margin"
        :disabled="isLoading"
      >
        <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
        <span v-else>Guardar Permisos</span>
      </ion-button>

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
import { ref, onMounted, computed } from "vue";
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
    const isLoading = ref(false);

    const isSuccessToastOpen = ref(false);
    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const setErrorToastOpen = (val, message = "") => {
      isErrorToastOpen.value = val;
      errorMessage.value = message;
    };

    const availableReviserGroups = computed(() => {
      const selectedReviserIds = new Set(Object.values(groupPermissions.value));
      return groups.value.filter((g) => !selectedReviserIds.has(g.id));
    });

    const availableReviserStudents = computed(() => {
      const selectedReviserIds = new Set(
        Object.values(individualPermissions.value)
      );
      return students.value.filter(
        (s) => s.hasGroup && !selectedReviserIds.has(s.id)
      );
    });

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

        const usersNoGroupResponse = await axios.get(
          `/courses/${courseId.value}/usersNoGroup?year=${year.value}`,
          tokenHeader()
        );
        const usersWithoutGroupIds = new Set(
          usersNoGroupResponse.data.map((u) => u.user.id)
        );

        students.value = allUsersInCourse
          .filter((u) => u.rol === "student")
          .map((u) => ({
            ...u.user,
            hasGroup: !usersWithoutGroupIds.has(u.user.id),
          }));

        students.value.forEach((student) => {
          individualPermissions.value[student.id] = null;
        });
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    const savePermissions = async () => {
      isLoading.value = true;
      try {
        // 1. Delete old permissions for this activity
        await axios.delete(
          `/student-criterion-scores/permissions?activityId=${activityId.value}`,
          tokenHeader()
        );

        // 2. Prepare new permissions
        const permissionsToCreate = [];
        const currentActivityId = parseInt(activityId.value);

        // Group permissions
        for (const revisedId in groupPermissions.value) {
          const reviserId = groupPermissions.value[revisedId];
          if (reviserId) {
            permissionsToCreate.push({
              reviserId: parseInt(reviserId),
              reviserType: "Group",
              revisedId: parseInt(revisedId),
              revisedType: "Group",
              activityId: currentActivityId,
              expired: false,
            });
          }
        }

        // Individual permissions
        for (const revisedId in individualPermissions.value) {
          const reviserId = individualPermissions.value[revisedId];
          if (reviserId) {
            permissionsToCreate.push({
              reviserId: parseInt(reviserId),
              reviserType: "User",
              revisedId: parseInt(revisedId),
              revisedType: "User",
              activityId: currentActivityId,
              expired: false,
            });
          }
        }

        // 3. Save new permissions
        if (permissionsToCreate.length > 0) {
          await axios.post(
            "/student-criterion-scores/permissions/bulk",
            permissionsToCreate,
            tokenHeader()
          );
        }

        setSuccessToastOpen(true);
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
      availableReviserGroups,
      availableReviserStudents,
      savePermissions,
      isLoading,
      isSuccessToastOpen,
      setSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setErrorToastOpen,
    };
  },
};
</script>

<style scoped>
.no-group-student {
  opacity: 0.6;
  font-style: italic;
}
</style>
