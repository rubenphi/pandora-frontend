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

    const normalizeString = (str) => {
      if (str === null || str === undefined) return "";
      return String(str).replace(/[.,\s]/g, ""); // Remove points, commas, and spaces
    };

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

    const handleUploadedExcel = async (jsonData) => {
      if (!jsonData || jsonData.length === 0) {
        const alert = await alertController.create({
          header: "Error",
          message: "El archivo Excel subido está vacío o no contiene datos.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }
      console.log(JSON.stringify(jsonData));

      const diToNumeroMap = new Map();
      jsonData.forEach((row) => {
        if (row.DI && row.Numero) {
          const normalizedDi = normalizeString(row.DI);
          diToNumeroMap.set(normalizedDi, Number(row.Numero));
        }
      });

      const studentsWithOrder = [];
      const studentsWithoutOrder = [];

      props.usuariosEstudiantes.forEach((estudiante) => {
        const studentCode = normalizeString(estudiante.code); // Corrected: use estudiante.code
        if (diToNumeroMap.has(studentCode)) {
          studentsWithOrder.push({
            ...estudiante,
            numeroOrden: diToNumeroMap.get(studentCode),
            hasDiMatch: true,
          });
        } else {
          studentsWithoutOrder.push({ ...estudiante, hasDiMatch: false });
        }
      });

      studentsWithOrder.sort((a, b) => a.numeroOrden - b.numeroOrden);

      const finalOrderedStudents = [
        ...studentsWithOrder,
        ...studentsWithoutOrder,
      ];

      const data = finalOrderedStudents.map((estudiante, index) => {
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
          FALLAS: estudiante.hasDiMatch ? "" : "Sin DI en Excel", // Indicate students without DI match
          DEF: def,
          NIV: niv,
          L1: l1,
          L2: "",
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Planilla de Notas Ordenada");
      XLSX.writeFile(wb, "planilla_notas_plataforma.xlsx");
      mostrarModalCargaExcel.value = false; // Close the upload modal
      onClose(); // Close the main modal
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
