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
              <ion-buttons slot="end" v-if="grupo?.id !== 0">
                <ion-button @click.stop="openEditGroupModal(grupo)">
                  <ion-icon :icon="createOutline"></ion-icon>
                </ion-button>
              </ion-buttons>
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

      <!-- Modal para editar grupo -->
      <ion-modal
        :is-open="isEditGroupModalOpen"
        @didDismiss="closeEditGroupModal"
        ref="editGroupModal"
        :breakpoints="[0.3, 0.5, 1]"
        :initial-breakpoint="0.5"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="cancelEditGroup()">Cancelar</ion-button>
            </ion-buttons>
            <ion-title style="text-align: center">Editar Grupo</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="confirmEditGroup()"
                >Guardar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="floating">Nombre del grupo</ion-label>
            <ion-input
              v-model="editGroupName"
              placeholder="Ingrese el nuevo nombre del grupo"
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
import {
  QuizSinNotas,
  periodosGet,
  tokenHeader,
  usuarioGet,
} from "../globalService";
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
  alertController,
} from "@ionic/vue";

import {
  addOutline,
  addCircleOutline,
  createOutline,
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
    const editGroupModal = ref();
    const curso = ref();
    const { cursoId, selectedYear } = mroute.params;
    const grupos = ref([]);
    const gruposLista = ref([]);
    const usuario = ref();
    const groupSelectedMembers = ref([]);
    const isModalOpen = ref(false);
    const isCreateGroupModalOpen = ref(false);
    const isEditGroupModalOpen = ref(false);
    const grupoId = ref();
    const userId = ref();
    const newGroupName = ref("");
    const editGroupName = ref("");
    const currentEditingGroup = ref(null);
    const periodos = periodosGet();
    const periodoId = ref(0);
    const mensajeAlerta = ref({
      header: "",
      subHeader: "",
      message: "",

      active: false,
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "OK",
          role: "confirm",
        },
      ],
    });

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
    const openCreateGroupModal = async () => {
      if ((await QuizSinNotas(cursoId, usuario)).length > 0) {
        mensajeAlerta.value.header = "Hay lecciones sin calificar";
        mensajeAlerta.value.subHeader = "¿Seguro que desea crear un grupo?";
        mensajeAlerta.value.message = `Las lecciones sin calificar son: <br> <ul> <li> ${(
          await QuizSinNotas(cursoId, usuario)
        )
          .map((leccion) => leccion.topic)
          .join("<br> </li></ul> <ul> <li>")}`;

        mensajeAlerta.value.buttons = [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Crear",
            role: "confirm",
            handler: () => {
              isCreateGroupModalOpen.value = true;
              newGroupName.value = "";
            },
          },
        ];
        mensajeAlerta.value.active = true;
        await presentAlert();
        return;
      }

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

    // Funciones para modal de edición de grupo
    const openEditGroupModal = async (grupo) => {
      if ((await QuizSinNotas(cursoId, usuario)).length > 0) {
        mensajeAlerta.value.header = "Hay lecciones sin calificar";
        mensajeAlerta.value.subHeader = "¿Seguro que desea editar un grupo?";
        mensajeAlerta.value.message = `<strong>Las lecciones sin calificar son:  <br></strong> <ul> <li>${(
          await QuizSinNotas(cursoId, usuario)
        )
          .map((leccion) => leccion.topic)
          .join("<br> </li></ul> <ul> <li>")}`;

        mensajeAlerta.value.buttons = [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Editar",
            role: "confirm",
            handler: () => {
              isEditGroupModalOpen.value = true;
              editGroupName.value = grupo.name;
              periodoId.value = grupo.periodId || 0; // Asegurarse de que el periodo esté definido
            },
          },
        ];
        mensajeAlerta.value.active = true;
        await presentAlert();
        return;
      }
      // Detener la propagación del evento para evitar que se abra el acordeón
      event.stopPropagation();

      currentEditingGroup.value = grupo;
      editGroupName.value = grupo.name;
      isEditGroupModalOpen.value = true;
    };

    const closeEditGroupModal = () => {
      isEditGroupModalOpen.value = false;
      currentEditingGroup.value = null;
    };

    const cancelEditGroup = () => {
      if (editGroupModal.value && editGroupModal.value.$el) {
        editGroupModal.value.$el.dismiss(null, "cancel");
      }
      closeEditGroupModal();
    };

    const confirmEditGroup = async () => {
      if (!editGroupName.value.trim()) {
        alert("Por favor ingrese un nombre para el grupo");
        return;
      }

      if (!currentEditingGroup.value) {
        alert("Error: No se ha seleccionado un grupo para editar");
        return;
      }

      try {
        // Actualizar el grupo con los datos requeridos
        const data = {
          name: editGroupName.value.trim(),
          courseId: parseInt(cursoId, 10),
          instituteId: curso.value.institute.id,
          periodId: periodoId.value,
          exist: true,
          active: true,
        };

        await axios.patch(`/groups/${currentEditingGroup.value.id}`, data, {
          headers: tokenHeader(),
        });

        // Cerrar el modal y actualizar la lista de grupos
        if (editGroupModal.value && editGroupModal.value.$el) {
          editGroupModal.value.$el.dismiss(data, "confirm");
        }
        closeEditGroupModal();

        // Refrescar la página para mostrar el grupo actualizado
        location.reload();
      } catch (error) {
        console.error("Error updating group:", error);
        alert("Error al actualizar el grupo. Por favor intente nuevamente.");
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

    const presentAlert = async () => {
      const alert = await alertController.create({
        header: mensajeAlerta.value.header || "Default Header",
        subHeader: mensajeAlerta.value.subHeader || "A Sub Header Is Optional",
        message:
          mensajeAlerta.value.message ||
          "A message should be a short, complete sentence.",
        buttons: mensajeAlerta.value.buttons || [
          {
            text: "OK",
            role: "cancel",
          },
        ],
      });

      await alert.present();
    };

    const openModal = async (selectedUserId) => {
      if ((await QuizSinNotas(cursoId, usuario)).length > 0) {
        mensajeAlerta.value.header = "Hay lecciones sin calificar";
        mensajeAlerta.value.subHeader = "¿Seguro que desea mover a un grupo?";
        mensajeAlerta.value.message = `<strong>Las lecciones sin calificar son:  <br></strong> <ul> <li>${(
          await QuizSinNotas(cursoId, usuario)
        )
          .map((leccion) => leccion.topic)
          .join("<br> </li></ul> <ul> <li>")}`;

        mensajeAlerta.value.buttons = [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Crear",
            role: "confirm",
            handler: () => {
              isModalOpen.value = true;
              grupoId.value = 0; // Asignar el grupo "Sin grupo"
              userId.value = selectedUserId;
            },
          },
        ];
        mensajeAlerta.value.active = true;
        await presentAlert();
        return;
      }

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
      alertController,
      periodoId,
      periodos,
      mroute,
      usuario,
      grupos,
      gruposLista,
      curso,
      mensajeAlerta,
      presentAlert,
      getMembers,
      removeMember,
      addOutline,
      addCircleOutline,
      createOutline,
      groupSelectedMembers,
      peopleCircleOutline,
      personCircleOutline,
      personRemoveOutline,
      swapHorizontalOutline,
      modal,
      createGroupModal,
      editGroupModal,
      cancel,
      confirm,
      isModalOpen,
      isCreateGroupModalOpen,
      isEditGroupModalOpen,
      grupoId,
      userId,
      newGroupName,
      editGroupName,
      currentEditingGroup,
      openModal,
      closeModal,
      openCreateGroupModal,
      closeCreateGroupModal,
      cancelCreateGroup,
      confirmCreateGroup,
      openEditGroupModal,
      closeEditGroupModal,
      cancelEditGroup,
      confirmEditGroup,
    };
  },
};
</script>
