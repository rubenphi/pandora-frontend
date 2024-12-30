<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Grupos - {{ curso?.name }}</ion-title>
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
                  <ion-icon slot="start" :icon="peopleCircleOutline"></ion-icon>
                  <IonLabel>{{
                    miembro?.name + " " + miembro?.lastName
                  }}</IonLabel>

                  <ion-icon
                    slot="end"
                    @click="openModal(miembro?.id)"
                    id="open-modal"
                    :icon="swapHorizontalOutline"
                  ></ion-icon>

                  <ion-icon
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
                v-for="grupo in grupos"
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
import { ref } from "vue";
import { tokenHeader, usuarioGet } from "../globalService";
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
} from "@ionic/vue";

import {
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
  },
  setup() {
    const mroute = useRoute();
    const modal = ref();
    const curso = ref();
    const { cursoId } = mroute.params;
    const grupos = ref([]);
    const usuario = ref();
    const groupSelectedMembers = ref([]);
    const isModalOpen = ref(false);
    const grupoId = ref();
    const userId = ref();

    const cancel = () => modal.value.$el.dismiss(null, "cancel");

    const confirm = () => {
      let data = {
        groupId: grupoId.value,
        userId: userId.value,
        code: "admin",
        active: true,
      };

      axios.post(`/users/${userId.value}/groups`, data).then(() => {
        modal.value.$el.dismiss(data, "confirm");
        //refresh page
        location.reload();
      });
      closeModal();
    };

    const getMembers = async (groupId) => {
      try {
        const response = await axios.get(`/groups/${groupId}/users`, {
          headers: tokenHeader(),
        });
        groupSelectedMembers.value = response.data.map((miembro) => ({
          ...miembro.user,
        }));
      } catch (error) {
        console.error("Error fetching group members:", error);
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
      grupos.value = (
        await axios.get(`/courses/${cursoId}/groups`, {
          headers: tokenHeader(),
        })
      ).data;
    });

    return {
      mroute,
      usuario,
      grupos,
      curso,
      getMembers,
      removeMember,

      groupSelectedMembers,
      peopleCircleOutline,
      personCircleOutline,
      personRemoveOutline,
      swapHorizontalOutline,
      modal,
      cancel,
      confirm,
      isModalOpen,
      grupoId,
      userId,
      openModal,
      closeModal,
    };
  },
};
</script>
