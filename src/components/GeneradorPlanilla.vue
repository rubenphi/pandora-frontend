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
import * as XLSX from "xlsx-js-style";
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

    const calculateL1Value = (estudiante) => {
      const promReg = parseFloat(estudiante.promedioRegular);
      const promReinf = parseFloat(estudiante.promedioRefuerzo);
      const promNiv = parseFloat(estudiante.promedioNivelacion);

      // 1. Student has Reinforcement AND Reinforcement grade (promedioRefuerzo) > Regular grade (promedioRegular) AND promedioRefuerzo >= 3: L1 = 99
      if (estudiante.hasReinforcement && promReinf > promReg && promReinf >= 3) {
        return 99;
      }
      // 2. Student has Remedial AND Remedial grade (promedioNivelacion) >= 3: L1 = 98
      if (estudiante.hasRemedial && promNiv >= 3) {
        return 98;
      }
      // 3. Student has Reinforcement AND Regular grade (promedioRegular) > Reinforcement grade (promedioRefuerzo) AND promedioRegular >= 3: L1 = 96
      if (estudiante.hasReinforcement && promReg > promReinf && promReg >= 3) {
        return 96;
      }
      // 4. Student has Reinforcement AND (promedioRefuerzo < 3 AND promedioRegular < 3): L1 = 95
      if (estudiante.hasReinforcement && promReinf < 3 && promReg < 3) {
        return 95;
      }
      // 5. Student has Remedial AND Remedial grade (promedioNivelacion) < 3: L1 = 94
      if (estudiante.hasRemedial && promNiv < 3) {
        return 94;
      }
      // 6. Student has Regular grade (promedioRegular) >= 3 AND promedioRegular < 4: L1 = 93
      if (promReg >= 3 && promReg < 4) {
        return 93;
      }
      // 7. Student has Regular grade (promedioRegular) >= 4 AND promedioRegular < 4.5: L1 = 92
      if (promReg >= 4 && promReg < 4.5) {
        return 92;
      }
      // 8. Student has Regular grade (promedioRegular) >= 4.5: L1 = 91
      if (promReg >= 4.5) {
        return 91;
      }

      return ""; // Default or if no condition met
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

        let l1 = calculateL1Value(estudiante); // Replaced with helper function

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

        let l1 = calculateL1Value(estudiante); // Replaced with helper function

        return {
          NUM: index + 1,
          NOMBRE: `${estudiante.lastName} ${estudiante.name}`,
          FALLAS: "", // Always empty now
          DEF: def,
          NIV: niv,
          L1: l1,
          L2: "",
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);

      // Apply styling for students without DI match
      finalOrderedStudents.forEach((estudiante, index) => {
        if (!estudiante.hasDiMatch) {
          const rowNum = index + 2; // +1 for 0-based index, +1 for header row
          const range = XLSX.utils.decode_range(ws['!ref']); // Get the range of the sheet

          for (let C = range.s.c; C <= range.e.c; ++C) { // Iterate through columns
            const cellAddress = XLSX.utils.encode_cell({ r: rowNum - 1, c: C }); // r is 0-based
            if (!ws[cellAddress]) ws[cellAddress] = {}; // Ensure cell object exists
            ws[cellAddress].s = {
              fill: {
                fgColor: { rgb: "FFADD8E6" }, // Light blue background
                patternType: "solid" // Ensure solid fill
              }
            };
          }
        }
      });

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