<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin/panel"></ion-back-button>
        </ion-buttons>
        <ion-title>Gestionar Áreas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-button expand="block" @click="presentCreateAlert()">Crear Nueva Área</ion-button>
      
      <ion-list>
        <ion-item v-for="area in areas" :key="area.id">
          <ion-label>
            <h2>{{ area.name }}</h2>
            <p>Estado: {{ area.exist ? 'Activa' : 'Inactiva' }}</p>
          </ion-label>
          <div slot="end">
            <ion-button fill="clear" @click="presentEditAlert(area)">
              <ion-icon slot="icon-only" :icon="createOutline"></ion-icon>
            </ion-button>
            <ion-button fill="clear" color="danger" @click="confirmDelete(area)">
              <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
            </ion-button>
          </div>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { tokenHeader, usuarioGet } from '../globalService';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons, IonBackButton,
  alertController
} from '@ionic/vue';
import { createOutline, trashOutline } from 'ionicons/icons';

const areas = ref([]);
const usuario = usuarioGet();

const getAreas = async () => {
  try {
    const response = await axios.get(`/areas?instituteId=${usuario.institute.id}`, tokenHeader());
    areas.value = response.data;
  } catch (error) {
    console.error("Error fetching areas:", error);
  }
};

const presentCreateAlert = async () => {
  const alert = await alertController.create({
    header: 'Crear Nueva Área',
    inputs: [
      {
        name: 'name',
        type: 'text',
        placeholder: 'Nombre de la área'
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Crear',
        handler: async (data) => {
          if (!data.name) return false;
          try {
            await axios.post('/areas', {
              name: data.name,
              instituteId: usuario.institute.id,
              exist: true
            }, tokenHeader());
            getAreas();
          } catch (error) {
            console.error("Error creating area:", error);
          }
        }
      }
    ]
  });
  await alert.present();
};

const presentEditAlert = async (area) => {
  const alert = await alertController.create({
    header: 'Editar Área',
    inputs: [
      {
        name: 'name',
        type: 'text',
        value: area.name,
        placeholder: 'Nombre de la área'
      },
      {
        name: 'exist',
        type: 'checkbox',
        label: 'Activa',
        value: 'true',
        checked: area.exist
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Guardar',
        handler: async (data) => {
          if (!data.name) return false;
          try {
             // In Ionic alert, checkbox data is usually an array if multiple, or value if single? 
             // Actually for single checkbox it's an array for some reason in some versions.
             const isActive = Array.isArray(data.exist) ? data.exist.includes('true') : data.exist === 'true';
             
            await axios.patch(`/areas/${area.id}`, {
              name: data.name,
              instituteId: usuario.institute.id,
              exist: isActive
            }, tokenHeader());
            getAreas();
          } catch (error) {
            console.error("Error updating area:", error);
          }
        }
      }
    ]
  });
  await alert.present();
};

const confirmDelete = async (area) => {
  const alert = await alertController.create({
    header: 'Confirmar Eliminación',
    message: `¿Estás seguro de que deseas eliminar la área "${area.name}"?`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          try {
            await axios.delete(`/areas/${area.id}`, tokenHeader());
            getAreas();
          } catch (error) {
            console.error("Error deleting area:", error);
          }
        }
      }
    ]
  });
  await alert.present();
};

onMounted(() => {
  getAreas();
});
</script>
