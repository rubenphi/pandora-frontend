<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Gestión Académica</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Gestión Académica</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-segment v-model="selectedTab">
        <ion-segment-button value="courses">
          <ion-label>Cursos</ion-label>
        </ion-segment-button>
        <ion-segment-button value="areas">
          <ion-label>Áreas</ion-label>
        </ion-segment-button>
        <ion-segment-button value="periods">
          <ion-label>Periodos</ion-label>
        </ion-segment-button>
      </ion-segment>

      <div v-if="selectedTab === 'courses'">
        <ion-button expand="block" @click="openCreateCourseModal()">
          Crear Nuevo Curso
        </ion-button>
        <ion-list-header color="primary">
          <ion-label>Cursos Activos</ion-label>
        </ion-list-header>
        <ion-list>
          <ion-item v-for="curso in cursosInstituto" :key="curso.id">
            <ion-label>{{ curso.name }}</ion-label>
            <ion-buttons slot="end">
              <ion-button @click="openEditCourseModal(curso)">
                <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
              <ion-button color="danger" @click="deleteCourse(curso)">
                <ion-icon :icon="trashOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>
        </ion-list>

        <ion-list-header color="medium">
          <ion-label>Cursos Archivados</ion-label>
        </ion-list-header>
        <div
          v-if="archivedCourses.length === 0"
          class="ion-text-center ion-padding"
        >
          <p>No hay cursos archivados.</p>
        </div>
        <ion-list v-else>
          <ion-item v-for="curso in archivedCourses" :key="curso.id">
            <ion-label>{{ curso.name }}</ion-label>
            <ion-buttons slot="end">
              <ion-button color="success" fill="outline" @click="reactivateCourse(curso)">
                Reactivar
              </ion-button>
            </ion-buttons>
          </ion-item>
        </ion-list>
      </div>

      <div v-if="selectedTab === 'areas'">
        <ion-button expand="block" @click="openCreateAreaModal()">
          Crear Nueva Área
        </ion-button>
        <ion-list-header color="primary">
          <ion-label>Áreas Existentes</ion-label>
        </ion-list-header>
        <ion-list>
          <ion-item v-for="area in areas" :key="area.id">
            <ion-label>{{ area.name }}</ion-label>
            <ion-buttons slot="end">
              <ion-button @click="openEditAreaModal(area)">
                <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
              <ion-button color="danger" @click="deleteArea(area)">
                <ion-icon :icon="trashOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>
        </ion-list>
      </div>

      <div v-if="selectedTab === 'periods'">
        <ion-button expand="block" @click="openCreatePeriodModal()">
          Crear Nuevo Periodo
        </ion-button>
        <ion-list-header color="primary">
          <ion-label>Periodos Existentes</ion-label>
        </ion-list-header>
        <ion-list>
          <ion-item v-for="period in periods" :key="period.id">
            <ion-label>{{ period.name }}</ion-label>
            <ion-buttons slot="end">
              <ion-button @click="openEditPeriodModal(period)">
                <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
              <ion-button color="danger" @click="deletePeriod(period)">
                <ion-icon :icon="trashOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>
        </ion-list>
      </div>

      <!-- Modal para crear un nuevo curso -->
      <ion-modal
        :is-open="isCreateCourseModalOpen"
        @didDismiss="closeCreateCourseModal"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeCreateCourseModal">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>Crear Nuevo Curso</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="createCourse()"
                >Crear</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Nombre del Curso</ion-label>
            <ion-input
              v-model="newCourse.name"
              placeholder="Ej: 1º Bachillerato A"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Activo</ion-label>
            <ion-toggle v-model="newCourse.exist" slot="end"></ion-toggle>
          </ion-item>
        </ion-content>
      </ion-modal>

      <!-- Modal para editar un curso existente -->
      <ion-modal
        :is-open="isEditCourseModalOpen"
        @didDismiss="closeEditCourseModal"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeEditCourseModal">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>Editar Curso</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="editCourse()"
                >Guardar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Nombre del Curso</ion-label>
            <ion-input v-model="editedCourse.name"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Activo</ion-label>
            <ion-toggle v-model="editedCourse.exist" slot="end"></ion-toggle>
          </ion-item>
          <ion-list-header>
            <ion-label>Áreas del Curso</ion-label>
          </ion-list-header>
          <ion-item v-for="area in allAreas" :key="area.id">
            <ion-checkbox
              slot="start"
              :checked="editedCourseAreas.includes(area.id)"
              @ionChange="toggleAreaInCourse(area.id, $event.detail.checked)"
            ></ion-checkbox>
            <ion-label>{{ area.name }}</ion-label>
          </ion-item>
        </ion-content>
      </ion-modal>

      <!-- Modal para crear una nueva área -->
      <ion-modal
        :is-open="isCreateAreaModalOpen"
        @didDismiss="closeCreateAreaModal"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeCreateAreaModal">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>Crear Nueva Área</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="createArea()"
                >Crear</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Nombre del Área</ion-label>
            <ion-input
              v-model="newArea.name"
              placeholder="Ej: Matemáticas"
            ></ion-input>
          </ion-item>
        </ion-content>
      </ion-modal>

      <!-- Modal para editar un área existente -->
      <ion-modal
        :is-open="isEditAreaModalOpen"
        @didDismiss="closeEditAreaModal"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeEditAreaModal">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>Editar Área</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="editArea()"
                >Guardar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Nombre del Área</ion-label>
            <ion-input v-model="editedArea.name"></ion-input>
          </ion-item>
        </ion-content>
      </ion-modal>

      <!-- Modal para crear un nuevo periodo -->
      <ion-modal
        :is-open="isCreatePeriodModalOpen"
        @didDismiss="closeCreatePeriodModal"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeCreatePeriodModal">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>Crear Nuevo Periodo</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="createPeriod()"
                >Crear</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Nombre del Periodo</ion-label>
            <ion-input
              v-model="newPeriod.name"
              placeholder="Ej: 1º Trimestre"
            ></ion-input>
          </ion-item>
        </ion-content>
      </ion-modal>

      <!-- Modal para editar un periodo existente -->
      <ion-modal
        :is-open="isEditPeriodModalOpen"
        @didDismiss="closeEditPeriodModal"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeEditPeriodModal">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>Editar Periodo</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="editPeriod()"
                >Guardar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Nombre del Periodo</ion-label>
            <ion-input v-model="editedPeriod.name"></ion-input>
          </ion-item>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import axios from "axios";
import { ref, onMounted } from "vue";
import { tokenHeader, usuarioGet, sortPeriods } from "../globalService";
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
  IonButton,
  IonButtons,
  IonIcon,
  IonModal,
  IonInput,
  IonToggle,
  IonListHeader,
  IonCheckbox,
  alertController,
} from "@ionic/vue";
import { createOutline, trashOutline } from "ionicons/icons";

const usuario = ref(null);
const selectedTab = ref("courses");

// --- Course Management ---
const cursosInstituto = ref([]);
const isCreateCourseModalOpen = ref(false);
const newCourse = ref({ name: "", instituteId: null, exist: true });
const isEditCourseModalOpen = ref(false);
const editedCourse = ref({
  id: null,
  name: "",
  instituteId: null,
  exist: true,
});
const allAreas = ref([]);
const editedCourseAreas = ref([]);
const archivedCourses = ref([]);

const fetchCourses = async () => {
  try {
    const response = await axios.get(
      `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
      tokenHeader()
    );
    cursosInstituto.value = response.data.sort((a, b) => parseInt(a.name) - parseInt(b.name));
  } catch (error) {
    console.error("Error fetching courses:", error);
  }
};

const fetchArchivedCourses = async () => {
  try {
    const response = await axios.get(
      `/courses?instituteId=${usuario.value.institute.id}&exist=false`,
      tokenHeader()
    );
    archivedCourses.value = response.data.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error("Error fetching archived courses:", error);
  }
};

const openCreateCourseModal = () => {
  newCourse.value = {
    name: "",
    instituteId: usuario.value.institute.id,
    exist: true,
  };
  isCreateCourseModalOpen.value = true;
};

const closeCreateCourseModal = () => {
  isCreateCourseModalOpen.value = false;
};

const createCourse = async () => {
  if (!newCourse.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del curso no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    await axios.post("/courses", newCourse.value, tokenHeader());
    closeCreateCourseModal();
    await fetchCourses();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Curso creado exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error creating course:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al crear el curso.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const openEditCourseModal = async (course) => {
  editedCourse.value = { ...course };
  try {
    const response = await axios.get(
      `/courses/${course.id}/areas`,
      tokenHeader()
    );
    editedCourseAreas.value = response.data.map((area) => area.id);
  } catch (error) {
    console.error("Error fetching course areas:", error);
    editedCourseAreas.value = [];
  }
  isEditCourseModalOpen.value = true;
};

const closeEditCourseModal = () => {
  isEditCourseModalOpen.value = false;
  editedCourseAreas.value = [];
};

const toggleAreaInCourse = (areaId, isChecked) => {
  if (isChecked) {
    if (!editedCourseAreas.value.includes(areaId)) {
      editedCourseAreas.value.push(areaId);
    }
  } else {
    editedCourseAreas.value = editedCourseAreas.value.filter(
      (id) => id !== areaId
    );
  }
};

const editCourse = async () => {
  if (!editedCourse.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del curso no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    const payload = {
      name: editedCourse.value.name,
      instituteId: editedCourse.value.institute.id,
      exist: editedCourse.value.exist,
    };
    await axios.patch(
      `/courses/${editedCourse.value.id}`,
      payload,
      tokenHeader()
    );
    const currentAreasResponse = await axios.get(
      `/courses/${editedCourse.value.id}/areas`,
      tokenHeader()
    );
    const currentAreaIds = currentAreasResponse.data.map((area) => area.id);
    const areasToAdd = editedCourseAreas.value.filter(
      (id) => !currentAreaIds.includes(id)
    );
    const areasToRemove = currentAreaIds.filter(
      (id) => !editedCourseAreas.value.includes(id)
    );
    if (areasToAdd.length > 0) {
      const addPayload = areasToAdd.map((areaId) => ({
        areaId,
        start_date: new Date().toISOString().split("T")[0],
      }));
      await axios.post(
        `/courses/${editedCourse.value.id}/areas`,
        addPayload,
        tokenHeader()
      );
    }
    if (areasToRemove.length > 0) {
      await axios.delete(`/courses/${editedCourse.value.id}/areas`, {
        data: areasToRemove,
        ...tokenHeader(),
      });
    }
    closeEditCourseModal();
    await fetchCourses();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Curso actualizado exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error updating course:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al actualizar el curso.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const deleteCourse = async (course) => {
  const alert = await alertController.create({
    header: "Confirmar Archivación",
    message: `¿Estás seguro de que quieres archivar el curso "${course.name}"?`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Archivar",
        handler: async () => {
          try {
            await axios.patch(
              `/courses/${course.id}`,
              { exist: false },
              tokenHeader()
            );
            await fetchCourses();
            await fetchArchivedCourses();
            const successAlert = await alertController.create({
              header: "Éxito",
              message: `El curso "${course.name}" ha sido archivado.`,
              buttons: ["OK"],
            });
            await successAlert.present();
          } catch (error) {
            console.error("Error archiving course:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al archivar el curso.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

const reactivateCourse = async (course) => {
  const alert = await alertController.create({
    header: "Confirmar Reactivación",
    message: `¿Estás seguro de que quieres reactivar el curso "${course.name}"?`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Reactivar",
        handler: async () => {
          try {
            await axios.patch(
              `/courses/${course.id}`,
              { exist: true },
              tokenHeader()
            );
            await fetchCourses();
            await fetchArchivedCourses();
            const successAlert = await alertController.create({
              header: "Éxito",
              message: `El curso "${course.name}" ha sido reactivado.`,
              buttons: ["OK"],
            });
            await successAlert.present();
          } catch (error) {
            console.error("Error reactivating course:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al reactivar el curso.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

// --- Area Management ---
const areas = ref([]);
const isCreateAreaModalOpen = ref(false);
const newArea = ref({ name: "" });
const isEditAreaModalOpen = ref(false);
const editedArea = ref({ id: null, name: "" });

const fetchAreas = async () => {
  try {
    const response = await axios.get("/areas", tokenHeader());
    areas.value = response.data.sort((a, b) => a.name.localeCompare(b.name));
    allAreas.value = areas.value;
  } catch (error) {
    console.error("Error fetching areas:", error);
  }
};

const openCreateAreaModal = () => {
  newArea.value = {
    name: "",
    instituteId: usuario.value.institute.id,
    exist: true,
  };
  isCreateAreaModalOpen.value = true;
};

const closeCreateAreaModal = () => {
  isCreateAreaModalOpen.value = false;
};

const createArea = async () => {
  if (!newArea.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del área no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    await axios.post("/areas", newArea.value, tokenHeader());
    closeCreateAreaModal();
    await fetchAreas();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Área creada exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error creating area:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al crear el área.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const openEditAreaModal = (area) => {
  editedArea.value = { ...area };
  isEditAreaModalOpen.value = true;
};

const closeEditAreaModal = () => {
  isEditAreaModalOpen.value = false;
};

const editArea = async () => {
  if (!editedArea.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del área no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    await axios.patch(
      `/areas/${editedArea.value.id}`,
      {
        name: editedArea.value.name,
        instituteId: editedArea.value.institute.id,
      },
      tokenHeader()
    );
    closeEditAreaModal();
    await fetchAreas();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Área actualizada exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error updating area:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al actualizar el área.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const deleteArea = async (area) => {
  const alert = await alertController.create({
    header: "Confirmar Eliminación",
    message: `¿Estás seguro de que quieres eliminar el área "${area.name}"?`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Eliminar",
        handler: async () => {
          try {
            await axios.delete(`/areas/${area.id}`, tokenHeader());
            await fetchAreas();
            const successAlert = await alertController.create({
              header: "Éxito",
              message: `El área "${area.name}" ha sido eliminada.`,
              buttons: ["OK"],
            });
            await successAlert.present();
          } catch (error) {
            console.error("Error deleting area:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al eliminar el área.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

// --- Period Management ---
const periods = ref([]);
const isCreatePeriodModalOpen = ref(false);
const newPeriod = ref({ name: "" });
const isEditPeriodModalOpen = ref(false);
const editedPeriod = ref({ id: null, name: "" });

const fetchPeriods = async () => {
  try {
    const response = await axios.get("/periods", tokenHeader());
    periods.value = sortPeriods(response.data);
  } catch (error) {
    console.error("Error fetching periods:", error);
  }
};

const openCreatePeriodModal = () => {
  newPeriod.value = {
    name: "",
    instituteId: usuario.value.institute.id,
  };
  isCreatePeriodModalOpen.value = true;
};

const closeCreatePeriodModal = () => {
  isCreatePeriodModalOpen.value = false;
};

const createPeriod = async () => {
  if (!newPeriod.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del periodo no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    await axios.post("/periods", newPeriod.value, tokenHeader());
    closeCreatePeriodModal();
    await fetchPeriods();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Periodo creado exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error creating period:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al crear el periodo.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const openEditPeriodModal = (period) => {
  editedPeriod.value = {
    id: period.id,
    name: period.name,
    instituteId: period.institute.id,
  };
  isEditPeriodModalOpen.value = true;
};

const closeEditPeriodModal = () => {
  isEditPeriodModalOpen.value = false;
};

const editPeriod = async () => {
  if (!editedPeriod.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del periodo no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    await axios.patch(
      `/periods/${editedPeriod.value.id}`,
      {
        name: editedPeriod.value.name,
        instituteId: editedPeriod.value.instituteId,
      },
      tokenHeader()
    );
    closeEditPeriodModal();
    await fetchPeriods();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Periodo actualizado exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error updating period:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al actualizar el periodo.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const deletePeriod = async (period) => {
  const alert = await alertController.create({
    header: "Confirmar Eliminación",
    message: `¿Estás seguro de que quieres eliminar el periodo "${period.name}"?`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Eliminar",
        handler: async () => {
          try {
            await axios.delete(`/periods/${period.id}`, tokenHeader());
            await fetchPeriods();
            const successAlert = await alertController.create({
              header: "Éxito",
              message: `El periodo "${period.name}" ha sido eliminado.`,
              buttons: ["OK"],
            });
            await successAlert.present();
          } catch (error) {
            console.error("Error deleting period:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al eliminar el periodo.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

onMounted(async () => {
  usuario.value = usuarioGet();
  if (usuario.value) {
    await fetchCourses();
    await fetchArchivedCourses();
    await fetchAreas();
    await fetchPeriods();
  }
});
</script>
