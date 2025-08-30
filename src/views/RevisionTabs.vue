<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button
          tab="ver-revision"
          :href="`/actividades/${activityId}/revision/mi-entrega`"
        >
          <ion-icon :icon="eyeOutline" />
          <ion-label>Mi Revisión</ion-label>
        </ion-tab-button>

        <ion-tab-button
          v-if="canReviewPeers"
          tab="evaluar-pares"
          :href="`/actividades/${activityId}/revision/evaluar-pares`"
        >
          <ion-icon :icon="createOutline" />
          <ion-label>Evaluar a Pares</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { tokenHeader, usuarioGet } from "../globalService";
import {
  IonPage,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
} from "@ionic/vue";
import { eyeOutline, createOutline } from "ionicons/icons";

export default {
  name: "RevisionTabs",
  components: {
    IonPage,
    IonTabs,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonIcon,
  },
  setup() {
    const route = useRoute();
    const activityId = ref(route.params.activityId);
    const canReviewPeers = ref(false);
    const usuario = ref(usuarioGet());

    const checkPermissions = async () => {
      if (usuario.value.rol !== "student") {
        canReviewPeers.value = true; // Teachers/Admins can always review
        return;
      }
      try {
        const response = await axios.get(
          `/student-criterion-scores/getAll/permissions?reviserId=${usuario.value.id}&activityId=${activityId.value}`,
          tokenHeader()
        );
        if (response.data && response.data.length > 0) {
          canReviewPeers.value = true;
        }
      } catch (error) {
        console.error("Error fetching student permissions:", error);
        canReviewPeers.value = false;
      }
    };

    onMounted(() => {
      checkPermissions();
    });

    return {
      activityId,
      canReviewPeers,
      eyeOutline,
      createOutline,
    };
  },
};
</script>
