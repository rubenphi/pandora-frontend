<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Importar Usuarios</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Importar Usuarios</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="ion-padding">
        <ion-item>
          <ion-label position="stacked">Seleccionar archivo Excel</ion-label>
          <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" />
        </ion-item>

        <ion-button expand="block" @click="generateSampleExcel" color="secondary">Generar Excel de Ejemplo</ion-button>

        <ion-accordion-group v-if="usersToImport.length > 0">
          <ion-accordion v-for="(user, index) in usersToImport" :key="index" :value="`user-${index}`">
            <ion-item slot="header" color="light">
              <ion-label>{{ user.lastName }}, {{ user.name }}</ion-label>
            </ion-item>
            <div class="ion-padding" slot="content">
              <ion-item>
                <ion-label position="stacked">Nombre</ion-label>
                <ion-input v-model="user.name"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Apellido</ion-label>
                <ion-input v-model="user.lastName"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Email</ion-label>
                <ion-input v-model="user.email"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Código</ion-label>
                <ion-input v-model="user.code"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Contraseña</ion-label>
                <ion-input v-model="user.password" type="password"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Rol en Sistema</ion-label>
                <ion-input v-model="user.systemRol"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Curso</ion-label>
                <ion-input v-model="user.cuurse"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Rol en Curso</ion-label>
                <ion-input v-model="user.rolEnCurso"></ion-input>
              </ion-item>
              <!-- Add other editable properties here -->
            </div>
          </ion-accordion>
        </ion-accordion-group>

        <ion-button expand="block" @click="submitImport" :disabled="usersToImport.length === 0">Importar Usuarios</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { defineComponent, ref } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonAccordionGroup,
  IonAccordion,
} from '@ionic/vue';
import * as XLSX from 'xlsx';
import axios from 'axios'; // Import axios

/**
 * @typedef {object} UserImportData
 * @property {string} name
 * @property {string} lastName
 * @property {string} email
 * @property {string} code
 * @property {string} [password]
 * @property {boolean} exist
 * @property {string} systemRol // New field
 * @property {string} [cuurse]
 * @property {string} [rolEnCurso]
 */

export default defineComponent({
  name: 'UserImportView',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonAccordionGroup,
    IonAccordion,
  },
  setup() {
    /** @type {import('vue').Ref<UserImportData[]>} */
    const usersToImport = ref([]);

    const handleFileUpload = (event) => {
      const input = event.target;
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);

          usersToImport.value = json.map((row) => {
            let systemRol = '';
            if (row['Rol en Sistema']) {
              const lowerCaseRol = String(row['Rol en Sistema']).toLowerCase();
              if (lowerCaseRol === 'estudiante') {
                systemRol = 'student';
              } else if (lowerCaseRol === 'profesor') {
                systemRol = 'teacher';
              }
            }

            return {
              name: row.Nombre || '',
              lastName: row.Apellido || '',
              email: row.Email || '',
              code: row.Codigo || '',
              password: row.Contraseña || 'defaultpassword', // Use 'Contraseña'
              exist: true,
              systemRol: systemRol,
              cuurse: systemRol === 'teacher' ? undefined : row.Curso || undefined, // Omit course for teachers
              rolEnCurso: systemRol === 'teacher' ? undefined : row['Rol en Curso'] || undefined, // Omit rolEnCurso for teachers
            };
          });
        };
        reader.readAsArrayBuffer(file);
      }
    };

    const generateSampleExcel = () => {
      const sampleData = [
        {
          Nombre: 'Juan',
          Apellido: 'Perez',
          Email: 'juan.perez@example.com',
          Codigo: 'JP001',
          Contraseña: 'password123', // Changed to Contraseña
          'Rol en Sistema': 'estudiante', // New field
          Curso: 'Matematicas',
          'Rol en Curso': 'Estudiante',
        },
        {
          Nombre: 'Maria',
          Apellido: 'Gomez',
          Email: 'maria.gomez@example.com',
          Codigo: 'MG002',
          Contraseña: 'password123',
          'Rol en Sistema': 'estudiante',
          Curso: 'Historia',
          'Rol en Curso': 'Estudiante',
        },
        {
          Nombre: 'Carlos',
          Apellido: 'Ruiz',
          Email: 'carlos.ruiz@example.com',
          Codigo: 'CR003',
          Contraseña: 'password123',
          'Rol en Sistema': 'profesor', // Teacher role
          Curso: '', // Empty for teacher
          'Rol en Curso': '', // Empty for teacher
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
      XLSX.writeFile(workbook, 'usuarios_ejemplo.xlsx');
    };

    const submitImport = async () => {
      try {
        // Assuming your backend is running on the same host or configured via globalService.ts
        const response = await axios.post('/users/bulk', { users: usersToImport.value });
        console.log('Bulk import successful:', response.data);
        alert('Usuarios importados exitosamente!');
        usersToImport.value = []; // Clear the list after successful import
      } catch (error) {
        console.error('Error during bulk import:', error.response ? error.response.data : error.message);
        alert('Error al importar usuarios. Por favor, revise la consola para más detalles.');
      }
    };

    return {
      usersToImport,
      handleFileUpload,
      generateSampleExcel,
      submitImport,
    };
  },
});
</script>

<style scoped>
/* Add any specific styles for this view here */
</style>

<style scoped>
/* Add any specific styles for this view here */
</style>
