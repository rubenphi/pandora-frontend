<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Grupos - {{ curso?.name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openCreateGroupModal">
            <ion-icon :icon="addCircleOutline"></ion-icon>
            Crear Grupo
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Grupos</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-list>
        <ion-accordion-group>
          <ion-accordion v-for="grupo in grupos" :key="grupo?.id">
            <IonItem slot="header" @click="getMembers(grupo?.id)">
              <ion-icon slot="start" :icon="peopleCircleOutline"></ion-icon>
              <IonLabel>{{ grupo?.name }}</IonLabel>
            </IonItem>
            <div class="ion-padding" slot="content">
              <IonList>
                <IonItem
                  v-for="miembro in groupSelectedMembers"
                  :key="miembro?.id"
                >
                  <ion-icon slot="start" :icon="personCircleOutline"></ion-icon>
                  <IonLabel
                    ><h6>{{ miembro?.name + " " + miembro?.lastName }}</h6>
                    <p>{{ miembro.code }}</p></IonLabel
                  >

                  <ion-icon
                    v-if="grupo?.id != 0"
                    slot="end"
                    @click="openModal(miembro?.id)"
                    id="open-modal"
                    :icon="swapHorizontalOutline"
                  ></ion-icon>

                  <ion-icon
                    v-if="grupo?.id == 0"
                    slot="end"
                    @click="openModal(miembro?.id)"
                    id="open-modal"
                    :icon="addOutline"
                  ></ion-icon>

                  <ion-icon
                    v-if="grupo?.id != 0"
                    slot="end"
                    :icon="personRemoveOutline"
                    @click="removeMember(grupo.id, miembro?.id)"
                  ></ion-icon>
                </IonItem>
              </IonList>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </ion-list>

      <!-- Modal para cambio de grupo -->
      <ion-modal
        :is-open="isModalOpen"
        @didDismiss="closeModal"
        ref="modal"
        trigger="open-modal"
        :breakpoints="[0.3, 0.5, 1]"
        :initial-breakpoint="0.5"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="cancel()">Cancelar</ion-button>
            </ion-buttons>
            <ion-title style="text-align: center">Cambio De Grupo</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="confirm()"
                >Confirmar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-select
              label="Seleccione el nuevo grupo"
              v-model="grupoId"
              placeholder="Seleccion el nuevo grupo"
            >
              <ion-select-option
                v-for="grupoEnLista in gruposLista"
                :key="grupoEnLista.id"
                :value="grupoEnLista.id"
              >
                {{ grupoEnLista.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-content>
      </ion-modal>

      <!-- Modal para crear nuevo grupo -->
      <ion-modal
        :is-open="isCreateGroupModalOpen"
        @didDismiss="closeCreateGroupModal"
        ref="createGroupModal"
        :breakpoints="[0.3, 0.5, 1]"
        :initial-breakpoint="0.5"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="cancelCreateGroup()">Cancelar</ion-button>
            </ion-buttons>
            <ion-title style="text-align: center">Crear Nuevo Grupo</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="confirmCreateGroup()"
                >Crear</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="floating">Nombre del grupo</ion-label>
            <ion-input
              v-model="newGroupName"
              placeholder="Ingrese el nombre del grupo"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-select
              v-model="periodoId"
              label="Seleccione el periodo"
              placeholder="Seleccione el periodo"
            >
              <ion-select-option
                v-for="periodo in periodos"
                :key="periodo.id"
                :value="periodo.id"
              >
                {{ periodo.name }}
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
import { ref } from "vue";
import { periodosGet, tokenHeader, usuarioGet } from "../globalService";
import { useRoute } from "vue-router";
import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonHeader,
  IonToolbar,
  IonList,
  IonPage,
  IonTitle,
  IonContent,
  IonAccordionGroup,
  IonAccordion,
  IonIcon,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonButtons,
  IonInput,
} from "@ionic/vue";

import {
  addOutline,
  addCircleOutline,
  peopleCircleOutline,
  personCircleOutline,
  personRemoveOutline,
  swapHorizontalOutline,
} from "ionicons/icons";

export default {
  components: {
    IonLabel,
    IonItem,
    IonHeader,
    IonToolbar,
    IonList,
    IonPage,
    IonTitle,
    IonContent,
    IonAccordionGroup,
    IonAccordion,
    IonIcon,
    IonModal,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonButtons,
    IonInput,
  },
  setup() {
    const mroute = useRoute();
    const modal = ref();
    const createGroupModal = ref();
    const curso = ref();
    const { cursoId, selectedYear } = mroute.params;
    const grupos = ref([]);
    const gruposLista = ref([]);
    const usuario = ref();
    const groupSelectedMembers = ref([]);
    const isModalOpen = ref(false);
    const isCreateGroupModalOpen = ref(false);
    const grupoId = ref();
    const userId = ref();
    const newGroupName = ref("");
    const periodos = periodosGet();
    const periodoId = ref(0);

    // Funciones para modal de cambio de grupo
    const cancel = () => modal.value.$el.dismiss(null, "cancel");

    const confirm = () => {
      let data = {
        groupId: grupoId.value,
        userId: userId.value,
        code: "admin",
        year: parseInt(selectedYear, 10),
        active: true,
      };

      axios.post(`/users/${userId.value}/groups`, data).then(() => {
        modal.value.$el.dismiss(data, "confirm");
        //refresh page
        location.reload();
      });
      closeModal();
    };

    // Funciones para modal de creación de grupo
    const openCreateGroupModal = () => {
      isCreateGroupModalOpen.value = true;
      newGroupName.value = "";
    };

    const closeCreateGroupModal = () => {
      isCreateGroupModalOpen.value = false;
    };

    const cancelCreateGroup = () => {
      if (createGroupModal.value && createGroupModal.value.$el) {
        createGroupModal.value.$el.dismiss(null, "cancel");
      }
      closeCreateGroupModal();
    };

    const confirmCreateGroup = async () => {
      if (!newGroupName.value.trim()) {
        alert("Por favor ingrese un nombre para el grupo");
        return;
      }

      try {
        // Crear el nuevo grupo con los datos requeridos
        const data = {
          name: newGroupName.value.trim(),
          courseId: parseInt(cursoId, 10),
          instituteId: curso.value.institute.id,
          periodId: periodoId.value,
          exist: true,
          active: true,
        };

        await axios.post("/groups", data, {
          headers: tokenHeader(),
        });

        // Cerrar el modal y actualizar la lista de grupos
        if (createGroupModal.value && createGroupModal.value.$el) {
          createGroupModal.value.$el.dismiss(data, "confirm");
        }
        closeCreateGroupModal();

        // Refrescar la página para mostrar el nuevo grupo
        location.reload();
      } catch (error) {
        console.error("Error creating group:", error);
        alert("Error al crear el grupo. Por favor intente nuevamente.");
      }
    };

    const getMembers = async (groupId) => {
      //  /courses/{{cursoId}}/usersNoGroup?year={{selectedYear}}'
      if (groupId == 0) {
        try {
          const response = await axios.get(
            `/courses/${cursoId}/usersNoGroup?year=${selectedYear}`,
            {
              headers: tokenHeader(),
            }
          );
          // only rol student

          groupSelectedMembers.value = response.data
            .map((miembro) => ({
              ...miembro.user,
            }))
            .filter(
              (estudiante) =>
                estudiante.rol === "student" || estudiante.rol === "user"
            );
        } catch (error) {
          console.error("Error fetching group members:", error);
        }
      } else {
        try {
          const response = await axios.get(
            `/groups/${groupId}/${selectedYear}/users`,
            {
              headers: tokenHeader(),
            }
          );
          groupSelectedMembers.value = response.data.map((miembro) => ({
            ...miembro.user,
          }));
        } catch (error) {
          console.error("Error fetching group members:", error);
        }
      }
    };

    const removeMember = async (groupId, miembroId) => {
      try {
        await axios.patch(
          `/groups/${groupId}/users`,
          {
            userIdToRemove: miembroId,
            active: false,
          },
          {
            headers: tokenHeader(),
          }
        );
        getMembers(groupId);
        //refresh page
        location.reload();
      } catch (error) {
        console.error("Error removing member from group:", error);
      }
    };

    const openModal = (selectedUserId) => {
      isModalOpen.value = true;

      userId.value = selectedUserId;
    };

    const closeModal = () => {
      isModalOpen.value = false;
    };

    onIonViewWillEnter(async () => {
      curso.value = (
        await axios.get(`/courses/${cursoId}`, { headers: tokenHeader() })
      ).data;
      usuario.value = usuarioGet();
      const llamado = (
        await axios.get(`/courses/${cursoId}/groups`, {
          headers: tokenHeader(),
        })
      ).data;

      gruposLista.value = [...llamado];

      grupos.value = llamado;

      grupos.value.push({
        id: 0,
        name: "Sin grupo",
        year: selectedYear,
        course: cursoId,
        active: true,
      });
    });

    return {
      selectedYear,
      cursoId,
      periodoId,
      periodos,
      mroute,
      usuario,
      grupos,
      gruposLista,
      curso,
      getMembers,
      removeMember,
      addOutline,
      addCircleOutline,
      groupSelectedMembers,
      peopleCircleOutline,
      personCircleOutline,
      personRemoveOutline,
      swapHorizontalOutline,
      modal,
      createGroupModal,
      cancel,
      confirm,
      isModalOpen,
      isCreateGroupModalOpen,
      grupoId,
      userId,
      newGroupName,
      openModal,
      closeModal,
      openCreateGroupModal,
      closeCreateGroupModal,
      cancelCreateGroup,
      confirmCreateGroup,
    };
  },
};
</script>
