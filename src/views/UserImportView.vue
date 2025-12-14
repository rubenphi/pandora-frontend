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
            <ion-item slot="header" :color="user.hasError ? 'danger' : 'light'">
              <ion-label>{{ user.lastName }}, {{ user.name }}</ion-label>
            </ion-item>
            <div class="ion-padding" slot="content">
              <ion-item>
                <ion-label position="stacked">Nombre</ion-label>
                <ion-input v-model="user.name" @ionInput="validateUser(user)"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Apellido</ion-label>
                <ion-input v-model="user.lastName" @ionInput="validateUser(user)"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Email</ion-label>
                <ion-input v-model="user.email" @ionInput="validateUser(user)"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Código</ion-label>
                <ion-input :value="user.code" @ionInput="updateUserCode(user, $event.target.value)" @ionBlur="checkCodeUniqueness(user)"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Contraseña</ion-label>
                <ion-input v-model="user.password" type="password" @ionInput="validateUser(user)"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Rol en Sistema</ion-label>
                <ion-select v-model="user.systemRol" interface="popover" @ionChange="validateUser(user)">
                  <ion-select-option value="student">Estudiante</ion-select-option>
                  <ion-select-option value="teacher">Profesor</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Curso</ion-label>
                <ion-select v-model="user.course" interface="popover" :disabled="user.systemRol === 'teacher'" @ionChange="validateUser(user)">
                  <ion-select-option :value="undefined">Sin Curso</ion-select-option>
                  <ion-select-option v-for="curso in cursos" :key="curso.id" :value="curso.id">
                    {{ curso.name }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <!-- Add other editable properties here -->
              <ion-button color="danger" expand="block" @click="removeUser(index)">Eliminar Usuario</ion-button>
            </div>
          </ion-accordion>
        </ion-accordion-group>

        <ion-button expand="block" @click="submitImport" :disabled="!canSubmit">Importar Usuarios</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';
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
  IonSelect, // Added
  IonSelectOption, // Added
  alertController, // Import alertController
} from '@ionic/vue';
import * as XLSX from 'xlsx';
import axios from 'axios'; // Import axios
import { onIonViewWillEnter } from '@ionic/vue'; // Import onIonViewWillEnter
import { tokenHeader, usuarioGet } from '../globalService'; // Import globalService

/**
 * @typedef {object} UserImportData
 * @property {string} name
 * @property {string} lastName
 * @property {string} email
 * @property {string} code
 * @property {string} [password]
 * @property {boolean} exist
 * @property {('student'|'teacher'|undefined)} systemRol // Updated type
 * @property {string} [course]
 * @property {boolean} [hasError] // New property to indicate if the user has an error
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
    IonSelect, // Added
    IonSelectOption, // Added
  },
  setup() {
    /** @type {import('vue').Ref<UserImportData[]>} */
    const usersToImport = ref([]);
    const cursos = ref([]); // New ref for courses
    const usuario = ref(null); // New ref for user data
    const inconsistentUsers = ref([]); // New ref to store names of inconsistent users
    const existingUserCodes = ref(new Set()); // New ref to store existing user codes

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      await getCursos();
      await getExistingUserCodes();
    });

    const getExistingUserCodes = async (codesToCheck) => {
      if (codesToCheck.length === 0) {
        existingUserCodes.value = new Set();
        return;
      }
      try {
        const response = await axios.get(`/users?instituteId=${usuario.value.institute.id}&code=${codesToCheck.join(',')}`, tokenHeader());
        existingUserCodes.value = new Set(response.data.map(user => String(user.code))); // Extract codes from user objects
      } catch (error) {
        console.error('Error fetching existing user codes:', error);
      }
    };

    const getCursos = async () => {
      if (!usuario.value || !usuario.value.institute || !usuario.value.institute.id) {
        console.warn('Institute ID not available for fetching courses.');
        return;
      }
      try {
        const response = await axios.get(
          `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
          tokenHeader()
        );
        cursos.value = response.data.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    const handleFileUpload = async (event) => {
      const input = event.target;
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          inconsistentUsers.value = []; // Clear previous inconsistencies

          const codesFromExcel = json.map(row => String(row.Codigo)).filter(code => code);
          await getExistingUserCodes(codesFromExcel);

          usersToImport.value = json.map((row) => {
            let systemRol = undefined; // Default to undefined for invalid roles
            if (row['Rol en Sistema']) {
              const lowerCaseRol = String(row['Rol en Sistema']).toLowerCase();
              if (lowerCaseRol === 'estudiante') {
                systemRol = 'student';
              } else if (lowerCaseRol === 'profesor') {
                systemRol = 'teacher';
              }
            }

            let courseId = undefined;
            if (row.Curso) {
              const matchedCourse = cursos.value.find(
                (c) => c.name.toLowerCase() === String(row.Curso).toLowerCase()
              );
              if (matchedCourse) {
                courseId = matchedCourse.id;
              } else {
                // console.warn(`Course "${row.Curso}" from Excel not found in available courses.`);
              }
            }

            const user = {
              name: row.Nombre || '',
              lastName: row.Apellido || '',
              email: row.Email || '',
              code: row.Codigo || '',
              password: row.Contraseña || 'defaultpassword', // Use 'Contraseña'
              exist: true,
              systemRol: systemRol,
              course: systemRol === 'teacher' ? undefined : courseId, // Assign courseId
              hasError: false, // Initialize hasError
            };

            // Validate code is numeric
            if (user.code && !/^\d+$/.test(user.code)) {
              user.hasError = true;
              inconsistentUsers.value.push(`${user.lastName}, ${user.name} (Código "${user.code}" no es numérico)`);
            } else if (user.code && existingUserCodes.value.has(user.code)) {
              user.hasError = true;
              inconsistentUsers.value.push(`${user.lastName}, ${user.name} (Código "${user.code}" ya existe)`);
            }

            // Check for errors
            if (user.systemRol === 'student' && user.course === undefined) {
              user.hasError = true;
              inconsistentUsers.value.push(`${user.lastName}, ${user.name} (Estudiante sin curso válido)`);
            }
            if (user.systemRol === undefined) {
              user.hasError = true;
              inconsistentUsers.value.push(`${user.lastName}, ${user.name} (Rol en Sistema inválido: "${row['Rol en Sistema']}")`);
            }

            return user;
          });

          // Display alert if there are inconsistent users
          if (inconsistentUsers.value.length > 0) {
            presentInconsistencyAlert();
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };

    const presentInconsistencyAlert = async () => {
      const currentInconsistentUsers = usersToImport.value.filter(user => user.hasError);
      if (currentInconsistentUsers.length === 0) {
        return; // No inconsistencies to report
      }

      const messages = currentInconsistentUsers.map(user => {
        let msg = `${user.lastName}, ${user.name}`;
        // Re-evaluate specific error messages for the alert
        if (user.code && !/^\d+$/.test(user.code)) {
          msg += ` (Código "${user.code}" no es numérico)`;
        } else if (user.code && existingUserCodes.value.has(user.code)) {
          msg += ` (Código "${user.code}" ya existe)`;
        }
        if (user.systemRol === undefined) {
          msg += ` (Rol en Sistema inválido)`;
        }
        if (user.systemRol === 'student' && user.course === undefined) {
          msg += ` (Estudiante sin curso válido)`;
        }
        return `<li>${msg}</li>`;
      }).join('');

      const alert = await alertController.create({
        header: 'Inconsistencias en la Importación',
        message: `Se encontraron las siguientes inconsistencias en el archivo Excel:<br><br><ul>${messages}</ul><br>Por favor, revise y corrija los datos antes de importar.`,
        buttons: ['OK'],
      });
      await alert.present();
    };

    const canSubmit = computed(() => {
      return usersToImport.value.length > 0 && usersToImport.value.every(user => !user.hasError);
    });

    const generateSampleExcel = () => {
      const sampleData = [
        {
          Nombre: 'Juan',
          Apellido: 'Perez',
          Email: 'juan.perez@example.com',
          Codigo: '001', // Changed to include leading zeros
          Contraseña: 'password123', // Changed to Contraseña
          'Rol en Sistema': 'estudiante', // New field
          Curso: 'Matematicas',
        },
        {
          Nombre: 'Maria',
          Apellido: 'Gomez',
          Email: 'maria.gomez@example.com',
          Codigo: '002', // Changed to include leading zeros
          Contraseña: 'password123',
          'Rol en Sistema': 'estudiante',
          Curso: 'Historia',
        },
        {
          Nombre: 'Carlos',
          Apellido: 'Ruiz',
          Email: 'carlos.ruiz@example.com',
          Codigo: '003', // Changed to include leading zeros
          Contraseña: 'password123',
          'Rol en Sistema': 'profesor', // Teacher role
          Curso: '', // Empty for teacher
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
      XLSX.writeFile(workbook, 'usuarios_ejemplo.xlsx');
    };

    const submitImport = async () => {
      try {
        const usersToSend = usersToImport.value.map((user) => {
          return {
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            code: user.code,
            password: user.password,
            exist: user.exist,
            systemRol: user.systemRol,
            courseId: user.course, // Send course ID directly
            // rolEnCurso is not explicitly defined in frontend, backend will likely derive it
          };
        });

        console.log('Users being sent to backend:', usersToSend); // Diagnostic log

        const response = await axios.post('/users/bulk', { users: usersToSend });
        console.log('Bulk import successful:', response.data);
        alert('Usuarios importados exitosamente!');
        usersToImport.value = []; // Clear the list after successful import
      } catch (error) {
        console.error('Error during bulk import:', error.response ? error.response.data : error.message);
        alert('Error al importar usuarios. Por favor, revise la consola para más detalles.');
      }
    };

    const removeUser = (index) => {
      usersToImport.value.splice(index, 1);
      // Re-evaluate inconsistencies if needed, though current logic should handle it
      // if a user with error is removed, canSubmit will automatically update.
    };

    const validateUser = (user) => {
      user.hasError = false; // Assume valid until an error is found
      const currentInconsistencies = [];

      // Validate code is numeric
      if (user.code && !/^\d+$/.test(user.code)) {
        user.hasError = true;
        currentInconsistencies.push(`${user.lastName}, ${user.name} (Código "${user.code}" no es numérico)`);
      }

      // Validate systemRol
      if (user.systemRol === undefined) {
        user.hasError = true;
        currentInconsistencies.push(`${user.lastName}, ${user.name} (Rol en Sistema inválido)`);
      }

      // Validate course for students
      if (user.systemRol === 'student' && user.course === undefined) {
        user.hasError = true;
        currentInconsistencies.push(`${user.lastName}, ${user.name} (Estudiante sin curso válido)`);
      }

      // Update the global inconsistentUsers list (optional, but good for a summary alert)
      // This part is a bit tricky to manage for individual user changes without re-parsing the whole file.
      // For now, we'll just rely on user.hasError for the accordion color.
      // If a summary alert is needed after manual edits, a re-evaluation of all users would be required.

      return !user.hasError;
    };

    const checkCodeUniqueness = async (user) => {
      if (!user.code || !/^\d+$/.test(user.code)) {
        // If code is empty or not numeric, uniqueness check is not applicable or already handled by validateUser
        return;
      }

      try {
        const response = await axios.get(`/users?instituteId=${usuario.value.institute.id}&code=${user.code}`, tokenHeader());
        const existingUsers = response.data;

        if (existingUsers.length > 0) {
          // If there are existing users with this code, mark as error
          user.hasError = true;
          // Add to inconsistentUsers for the alert summary if needed, or handle locally
          // For now, we'll just rely on user.hasError for the accordion color.
          // A more robust solution would involve updating the inconsistentUsers array dynamically.
        } else {
          // If code is unique, ensure hasError is false for this specific check
          // This is important if validateUser previously set hasError for other reasons
          // We should only clear the code-related error here.
          // For simplicity, we'll let validateUser handle other errors.
          // If validateUser already set hasError for another reason, it will remain true.
          if (!user.hasError) { // Only clear if no other errors are present
            user.hasError = false;
          }
        }
      } catch (error) {
        console.error('Error checking code uniqueness:', error);
        // Optionally, set user.hasError to true if there's an API error
        user.hasError = true;
      }
    };

    const updateUserCode = (user, value) => {
      user.code = value;
      validateUser(user);
    };

    return {
      usersToImport,
      handleFileUpload,
      generateSampleExcel,
      submitImport,
      cursos, // Expose cursos
      inconsistentUsers, // Expose inconsistentUsers
      presentInconsistencyAlert, // Expose presentInconsistencyAlert
      canSubmit, // Expose canSubmit
      removeUser, // Expose removeUser
      validateUser, // Expose validateUser
      checkCodeUniqueness, // Expose checkCodeUniqueness
      updateUserCode, // Expose updateUserCode
    };
  },
});
</script>

<style scoped>
/*
 * The ion-item's color="danger" attribute handles the red styling for error rows.
 * A dedicated CSS class (e.g., .error-row) can be added here if more complex styling is needed.
 */
</style>
