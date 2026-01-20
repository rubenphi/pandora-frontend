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
        <div
          class="file-drop-area"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{ 'drag-over': isDragOver }"
          @click="triggerFileInput"
        >
          <ion-icon :icon="documentAttachOutline" size="large"></ion-icon>
          <p>Arrastra tu archivo Excel aquí o haz clic para seleccionarlo</p>
          <input
            type="file"
            ref="fileInput"
            @change="handleFileInputChange"
            accept=".xlsx, .xls"
            style="display: none"
          />
        </div>

        <ion-button
          expand="block"
          @click="generateSampleExcel"
          color="secondary"
          >Generar Excel de Ejemplo</ion-button
        >

        <ion-accordion-group v-if="usersToImport.length > 0">
          <ion-accordion
            v-for="(user, index) in usersToImport"
            :key="index"
            :value="`user-${index}`"
          >
            <ion-item slot="header" :color="user.hasError ? 'danger' : 'light'">
              <ion-label>{{ user.lastName }}, {{ user.name }}</ion-label>
            </ion-item>
            <div class="ion-padding" slot="content">
              <ion-item>
                <ion-label position="stacked">Nombre</ion-label>
                <ion-input
                  v-model="user.name"
                  @ionInput="validateUser(user)"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Apellido</ion-label>
                <ion-input
                  v-model="user.lastName"
                  @ionInput="validateUser(user)"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Email</ion-label>
                <ion-input
                  v-model="user.email"
                  @ionInput="validateUser(user)"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Código</ion-label>
                <ion-input
                  :value="user.code"
                  @ionInput="updateUserCode(user, $event.target.value)"
                  @ionBlur="checkCodeUniqueness(user)"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Teléfono</ion-label>
                <ion-input
                  v-model="user.telephone"
                  type="tel"
                  inputmode="numeric"
                  placeholder="Número de teléfono"
                  @ionInput="validateUser(user)"
                  @input="filterNumericInput($event, user, 'telephone')"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Contraseña</ion-label>
                <ion-input
                  v-model="user.password"
                  type="password"
                  @ionInput="validateUser(user)"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Rol en Sistema</ion-label>
                <ion-select
                  v-model="user.systemRol"
                  @ionChange="validateUser(user)"
                >
                  <ion-select-option value="student"
                    >Estudiante</ion-select-option
                  >
                  <ion-select-option value="teacher"
                    >Profesor</ion-select-option
                  >
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Curso</ion-label>
                <ion-select
                  v-model="user.course"
                  :disabled="user.systemRol === 'teacher'"
                  @ionChange="validateUser(user)"
                >
                  <ion-select-option :value="undefined"
                    >Sin Curso</ion-select-option
                  >
                  <ion-select-option
                    v-for="curso in cursos"
                    :key="curso.id"
                    :value="curso.id"
                  >
                    {{ curso.name }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <!-- Add other editable properties here -->
              <ion-button
                color="danger"
                expand="block"
                @click="removeUser(index)"
                >Eliminar Usuario</ion-button
              >
            </div>
          </ion-accordion>
        </ion-accordion-group>

        <ion-button expand="block" @click="submitImport" :disabled="!canSubmit"
          >Importar Usuarios</ion-button
        >
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { useRouter } from "vue-router";
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
  IonSelect,
  IonSelectOption,
  alertController,
  IonIcon, // Added IonIcon
} from "@ionic/vue";
import { documentAttachOutline } from "ionicons/icons"; // Added documentAttachOutline icon
import * as XLSX from "xlsx";
import axios from "axios";
import { onIonViewWillEnter } from "@ionic/vue";
import { tokenHeader, usuarioGet } from "../globalService";

/**
 * @typedef {object} UserImportData
 * @property {string} name
 * @property {string} lastName
 * @property {string} email
 * @property {string} code
 * @property {string} [password]
 * @property {boolean} exist
 * @property {('student'|'teacher'|undefined)} systemRol
 * @property {string} [course]
 * @property {string} [telephone] // Added telephone field
 * @property {boolean} [hasError]
 */

export default defineComponent({
  name: "UserImportView",
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
    IonSelect,
    IonSelectOption,
    IonIcon, // Added IonIcon
  },
  setup() {
    const router = useRouter();
    /** @type {import('vue').Ref<UserImportData[]>} */
    const usersToImport = ref([]);
    const cursos = ref([]);
    const usuario = ref(null);
    const inconsistentUsers = ref([]);
    const existingUserCodes = ref(new Set());
    const fileInput = ref(null); // Ref for the hidden file input
    const isDragOver = ref(false); // Reactive state for drag-over effect

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      await getCursos();
      await getExistingUserCodes();
    });

    const getExistingUserCodes = async (codesToCheck) => {
      if (!Array.isArray(codesToCheck) || codesToCheck.length === 0) {
        existingUserCodes.value = new Set();
        return;
      }
      try {
        const response = await axios.get(
          `/users?instituteId=${
            usuario.value.institute.id
          }&code=${codesToCheck.join(",")}`,
          tokenHeader()
        );
        existingUserCodes.value = new Set(
          response.data.map((user) => String(user.code))
        );
      } catch (error) {
        console.error("Error fetching existing user codes:", error);
      }
    };

    const getCursos = async () => {
      if (
        !usuario.value ||
        !usuario.value.institute ||
        !usuario.value.institute.id
      ) {
        console.warn("Institute ID not available for fetching courses.");
        return;
      }
      try {
        const response = await axios.get(
          `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
          tokenHeader()
        );
        cursos.value = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    // New method to trigger the hidden file input
    const triggerFileInput = () => {
      fileInput.value.click();
    };

    // New method to handle file input change (from click)
    const handleFileInputChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        processFile(file);
      }
    };

    // New methods for drag and drop
    const handleDragOver = () => {
      isDragOver.value = true;
    };

    const handleDragLeave = () => {
      isDragOver.value = false;
    };

    const handleDrop = (event) => {
      isDragOver.value = false;
      const file = event.dataTransfer.files[0];
      if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
        processFile(file);
      } else {
        alert("Por favor, arrastra un archivo Excel válido (.xlsx o .xls).");
      }
    };

    // Refactored file processing logic
    const processFile = async (file) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        inconsistentUsers.value = [];

        const codesFromExcel = json
          .map((row) => String(row.Codigo))
          .filter((code) => code);
        await getExistingUserCodes(codesFromExcel);

        usersToImport.value = json.map((row) => {
          let systemRol = undefined;
          if (row["Rol en Sistema"]) {
            const lowerCaseRol = String(row["Rol en Sistema"]).toLowerCase();
            if (lowerCaseRol === "estudiante") {
              systemRol = "student";
            } else if (lowerCaseRol === "profesor") {
              systemRol = "teacher";
            }
          }

          let courseId = undefined;
          if (row.Curso) {
            const matchedCourse = cursos.value.find(
              (c) => c.name.toLowerCase() === String(row.Curso).toLowerCase()
            );
            if (matchedCourse) {
              courseId = matchedCourse.id;
            }
          }

          const user = {
            name: row.Nombre || "",
            lastName: row.Apellido || "",
            email: row.Email || `${row.Codigo}@yopmail.com`,
            code: row.Codigo || "",
            telephone: row.Telefono || "", // Added telephone field
            password: row.Contraseña || "defaultpassword",
            exist: true,
            systemRol: systemRol,
            course: systemRol === "teacher" ? undefined : courseId,
            hasError: false,
          };

          if (user.code && !/^\d+$/.test(user.code)) {
            user.hasError = true;
            inconsistentUsers.value.push(
              `${user.lastName}, ${user.name} (Código "${user.code}" no es numérico)`
            );
          } else if (user.code && existingUserCodes.value.has(user.code)) {
            user.hasError = true;
            inconsistentUsers.value.push(
              `${user.lastName}, ${user.name} (Código "${user.code}" ya existe)`
            );
          }

          if (user.systemRol === "student" && user.course === undefined) {
            user.hasError = true;
            inconsistentUsers.value.push(
              `${user.lastName}, ${user.name} (Estudiante sin curso válido)`
            );
          }
          if (user.systemRol === undefined) {
            user.hasError = true;
            inconsistentUsers.value.push(
              `${user.lastName}, ${user.name} (Rol en Sistema inválido: "${row["Rol en Sistema"]}")`
            );
          }

          return user;
        });

        if (inconsistentUsers.value.length > 0) {
          presentInconsistencyAlert();
        }
      };
      reader.readAsArrayBuffer(file);
    };

    const presentInconsistencyAlert = async () => {
      const currentInconsistentUsers = usersToImport.value.filter(
        (user) => user.hasError
      );
      if (currentInconsistentUsers.length === 0) {
        return;
      }

      const messages = currentInconsistentUsers
        .map((user) => {
          let msg = `${user.lastName}, ${user.name}`;
          if (user.code && !/^\d+$/.test(user.code)) {
            msg += ` (Código "${user.code}" no es numérico)`;
          } else if (user.code && existingUserCodes.value.has(user.code)) {
            msg += ` (Código "${user.code}" ya existe)`;
          }
          if (user.systemRol === undefined) {
            msg += ` (Rol en Sistema inválido)`;
          }
          if (user.systemRol === "student" && user.course === undefined) {
            msg += ` (Estudiante sin curso válido)`;
          }
          if (user.telephone && !/^\d+$/.test(user.telephone)) {
            msg += ` (Teléfono "${user.telephone}" no es numérico)`;
          }
          return `<li>${msg}</li>`;
        })
        .join("");

      const alert = await alertController.create({
        header: "Inconsistencias en la Importación",
        message: `Se encontraron las siguientes inconsistencias en el archivo Excel:<br><br><ul>${messages}</ul><br>Por favor, revise y corrija los datos antes de importar.`,
        buttons: ["OK"],
      });
      await alert.present();
    };

    const canSubmit = computed(() => {
      return (
        usersToImport.value.length > 0 &&
        usersToImport.value.every((user) => !user.hasError)
      );
    });

    const generateSampleExcel = () => {
      const sampleData = [
        {
          Nombre: "Juan",
          Apellido: "Perez",
          Email: "juan.perez@example.com",
          Codigo: "001",
          Contraseña: "password123",
          "Rol en Sistema": "estudiante",
          Curso: "Matematicas",
          Telefono: "1122334455", // Added sample telephone
        },
        {
          Nombre: "Maria",
          Apellido: "Gomez",
          Email: "maria.gomez@example.com",
          Codigo: "002",
          Contraseña: "password123",
          "Rol en Sistema": "estudiante",
          Curso: "Historia",
          Telefono: "5544332211", // Added sample telephone
        },
        {
          Nombre: "Carlos",
          Apellido: "Ruiz",
          Email: "carlos.ruiz@example.com",
          Codigo: "003",
          Contraseña: "password123",
          "Rol en Sistema": "profesor",
          Curso: "",
          Telefono: "9988776655", // Added sample telephone
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
      XLSX.writeFile(workbook, "usuarios_ejemplo.xlsx");
    };

    const presentSuccessAlert = async () => {
      const alert = await alertController.create({
        header: "Éxito",
        message: "Usuarios importados exitosamente!",
        buttons: [
          {
            text: "OK",
            handler: () => {
              usersToImport.value = [];
              router.push("/admin/gestionar/usuarios");
            },
          },
        ],
      });
      await alert.present();
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
            courseId: user.course,
            telephone: user.telephone, // Added telephone field
          };
        });

        await axios.post("/users/bulk", {
          users: usersToSend,
        });
        await presentSuccessAlert();
      } catch (error) {
        console.error(
          "Error during bulk import:",
          error.response ? error.response.data : error.message
        );
        alert(
          "Error al importar usuarios. Por favor, revise la consola para más detalles."
        );
      }
    };

    const removeUser = (index) => {
      usersToImport.value.splice(index, 1);
    };

    const validateUser = (user) => {
      user.hasError = false;
      const currentInconsistencies = [];

      if (user.code && !/^\d+$/.test(user.code)) {
        user.hasError = true;
        currentInconsistencies.push(
          `${user.lastName}, ${user.name} (Código "${user.code}" no es numérico)`
        );
      }

      if (user.systemRol === undefined) {
        user.hasError = true;
        currentInconsistencies.push(
          `${user.lastName}, ${user.name} (Rol en Sistema inválido)`
        );
      }

      if (user.systemRol === "student" && user.course === undefined) {
        user.hasError = true;
        currentInconsistencies.push(
          `${user.lastName}, ${user.name} (Estudiante sin curso válido)`
        );
      }
      // Validate telephone is numeric if not empty
      if (user.telephone && !/^\d+$/.test(user.telephone)) {
        user.hasError = true;
        currentInconsistencies.push(
          `${user.lastName}, ${user.name} (Teléfono "${user.telephone}" no es numérico)`
        );
      }

      return !user.hasError;
    };

    const checkCodeUniqueness = async (user) => {
      if (!user.code || !/^\d+$/.test(user.code)) {
        return;
      }

      try {
        const response = await axios.get(
          `/users?instituteId=${usuario.value.institute.id}&code=${user.code}`,
          tokenHeader()
        );
        const existingUsers = response.data;

        if (existingUsers.length > 0) {
          user.hasError = true;
        } else {
          if (!user.hasError) {
            user.hasError = false;
          }
        }
      } catch (error) {
        console.error("Error checking code uniqueness:", error);
        user.hasError = true;
      }
    };

    const updateUserCode = (user, value) => {
      user.code = value;
      validateUser(user);
    };

    const filterNumericInput = (event, item, field) => {
      let value = event.target.value;
      if (value === null || value === undefined) {
        value = "";
      }
      const filteredValue = value.replace(/\D/g, ""); // Remove non-digits
      if (value !== filteredValue) {
        event.target.value = filteredValue; // Update the input element directly
        item[field] = filteredValue; // Update the v-model bound property
      } else {
        item[field] = value; // Ensure v-model is always in sync
      }
    };

    return {
      usersToImport,
      generateSampleExcel,
      submitImport,
      cursos,
      inconsistentUsers,
      presentInconsistencyAlert,
      canSubmit,
      removeUser,
      validateUser,
      checkCodeUniqueness,
      updateUserCode,
      fileInput, // Expose fileInput ref
      isDragOver, // Expose isDragOver ref
      handleDragOver, // Expose drag handlers
      handleDragLeave,
      handleDrop,
      triggerFileInput, // Expose triggerFileInput
      handleFileInputChange, // Expose handleFileInputChange
      documentAttachOutline, // Expose the icon
      filterNumericInput, // Expose filterNumericInput
    };
  },
});
</script>

<style scoped>
.file-drop-area {
  border: 2px dashed var(--ion-color-medium);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px; /* Make it large */
}

.file-drop-area:hover,
.file-drop-area.drag-over {
  background-color: var(--ion-color-light);
  border-color: var(--ion-color-primary);
}

.file-drop-area ion-icon {
  font-size: 4em; /* Make icon large */
  color: var(--ion-color-medium);
  margin-bottom: 10px;
}

.file-drop-area p {
  color: var(--ion-color-medium-shade);
  font-size: 1.1em;
  margin: 0;
}
</style>
