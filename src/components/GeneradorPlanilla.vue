<template>
  <ion-modal :is-open="isOpen" @didDismiss="onClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Generar Planilla para Plataforma de Notas</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onClose">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Contenido del Generador de Planilla</p>
      <ion-button expand="block" @click="descargarPlanillaAlfabetico">
        Descargar planilla en orden alfabético
      </ion-button>
      <ion-button expand="block" @click="abrirModalCargaExcel">
        Descargar planilla en orden de plataforma
      </ion-button>
      <!-- Aquí irá la lógica para seleccionar el tipo de planilla y generar el archivo -->
    </ion-content>
  </ion-modal>

  <excel-upload-modal
    :is-open="mostrarModalCargaExcel"
    @close="mostrarModalCargaExcel = false"
    @file-uploaded="handleUploadedExcel"
  ></excel-upload-modal>
</template>

<script>
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  alertController,
} from "@ionic/vue";
import { ref } from "vue";
import * as XLSX from "xlsx"; // Import the xlsx library
import { cloudUploadOutline } from "ionicons/icons";
import ExcelUploadModal from "./ExcelUploadModal.vue";

export default {
  name: "GeneradorPlanilla",
  emits: ["close"],
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    cursoId: String,
    areaId: String,
    periodoSelected: Number,
    year: String,
    usuario: Object,
    usuariosEstudiantes: Array, // Pass the student data
  },
  components: {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    ExcelUploadModal,
  },
  setup(props, { emit }) {
    const mostrarModalCargaExcel = ref(false);

    const onClose = () => {
      emit("close");
    };

    const abrirModalCargaExcel = () => {
      mostrarModalCargaExcel.value = true;
    };

    const descargarPlanillaAlfabetico = async () => {
      if (
        !props.usuariosEstudiantes ||
        props.usuariosEstudiantes.length === 0
      ) {
        const alert = await alertController.create({
          header: "Error",
          message: "No hay estudiantes para generar la planilla.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      const sortedStudents = [...props.usuariosEstudiantes].sort((a, b) => {
        const lastNameA = a.lastName || "";
        const lastNameB = b.lastName || "";
        return lastNameA.localeCompare(lastNameB);
      });
      const data = sortedStudents.map((estudiante, index) => {
        const def =
          parseFloat(estudiante.promedioRefuerzo) >
            parseFloat(estudiante.promedioRegular) &&
          estudiante.hasReinforcement
            ? estudiante.promedioRefuerzo
            : estudiante.promedioRegular;

        const niv = estudiante.hasRemedial ? estudiante.promedioNivelacion : "";

        let l1 = "";
        if (estudiante.hasReinforcement) {
          l1 = 99;
        } else if (estudiante.hasRemedial) {
          l1 = 98;
        }

        return {
          NUM: index + 1,
          NOMBRE: `${estudiante.lastName} ${estudiante.name}`,
          FALLAS: "",
          DEF: def,
          NIV: niv,
          L1: l1,
          L2: "",
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Planilla de Notas");
      XLSX.writeFile(wb, "planilla_notas_alfabetico.xlsx");
      onClose();
    };

    const handleUploadedExcel = (jsonData) => {
      console.log("Datos del Excel subido:", jsonData);
      // Aquí irá la lógica para procesar los datos del Excel y generar la planilla en orden de plataforma
    };

    return {
      onClose,
      descargarPlanillaAlfabetico,
      mostrarModalCargaExcel,
      abrirModalCargaExcel,
      cloudUploadOutline,
      handleUploadedExcel,
    };
  },
};
</script>
