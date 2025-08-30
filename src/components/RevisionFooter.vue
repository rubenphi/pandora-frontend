<template>
  <ion-footer>
    <ion-toolbar>
      <ion-buttons class="ion-justify-content-center">
        <ion-button :router-link="`/actividad/${activityId}/ver-revision`">
          <ion-icon slot="start" :icon="eyeOutline"></ion-icon>
          Mi Revisión
        </ion-button>
        <ion-button v-if="canReviewPeers" :router-link="`/actividad/${activityId}/evaluar-pares`">
          <ion-icon slot="start" :icon="createOutline"></ion-icon>
          Evaluar a Pares
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-footer>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { tokenHeader, usuarioGet } from '../globalService';
import { IonFooter, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/vue';
import { eyeOutline, createOutline } from 'ionicons/icons';

export default {
  name: 'RevisionFooter',
  props: {
    activityId: {
      type: [String, Number],
      required: true,
    },
  },
  components: {
    IonFooter,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
  },
  setup(props) {
    const canReviewPeers = ref(false);
    const usuario = ref(usuarioGet());

    const checkPermissions = async () => {
      if (!props.activityId) return;

      if (usuario.value.rol !== 'student') {
        canReviewPeers.value = true;
        return;
      }
      try {
        const response = await axios.get(
          `/student-criterion-scores/permissions?reviserId=${usuario.value.id}&activityId=${props.activityId}`,
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
      canReviewPeers,
      eyeOutline,
      createOutline,
    };
  },
};
</script>

<style scoped>
ion-buttons {
  width: 100%;
  display: flex;
}
ion-button {
  flex: 1;
}
</style>
