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
      if (
        estudiante.hasReinforcement &&
        promReinf > promReg &&
        promReinf >= 3
      ) {
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

      // Add conventions sheet
      const conventions = [
        {
          "Código L1": 91,
          Significado: "El estudiante aprobó con un desempeño superior.",
        },
        {
          "Código L1": 92,
          Significado: "El estudiante aprobó con un desempeño alto.",
        },
        {
          "Código L1": 93,
          Significado: "El estudiante aprobó con un desempeño básico.",
        },
        {
          "Código L1": 94,
          Significado:
            "A pesar de las actividades de nivelación, el estudiante no superó los desempeños esperados.",
        },
        {
          "Código L1": 95,
          Significado:
            "A pesar de las actividades de refuerzo, el estudiante no superó los desempeños esperados.",
        },
        {
          "Código L1": 96,
          Significado:
            "El estudiante logró los desempeños básicos con su nota regular, aunque no superó el refuerzo.",
        },
        {
          "Código L1": 98,
          Significado:
            "El estudiante logrado cumplir con los desempeños esperado gracias a actividades de nivelación.",
        },
        {
          "Código L1": 99,
          Significado:
            "El estudiante logró cumplir con los desempeños esperado gracias a actividades de refuerzo.",
        },
      ];

      const wsConventions = XLSX.utils.json_to_sheet(conventions);
      XLSX.utils.book_append_sheet(wb, wsConventions, "Convenciones");

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

      // 1. Create maps for efficient lookup
      const systemStudentsMap = new Map(
        props.usuariosEstudiantes.map((s) => [normalizeString(s.code), s])
      );
      const excelStudentsMap = new Map(
        jsonData.map((row) => [normalizeString(row.DI), row])
      );

      // 2. Determine the majority grade from matched students
      const gradeCounts = {};
      for (const student of props.usuariosEstudiantes) {
        const excelStudent = excelStudentsMap.get(
          normalizeString(student.code)
        );
        if (excelStudent && excelStudent.Grado) {
          gradeCounts[excelStudent.Grado] =
            (gradeCounts[excelStudent.Grado] || 0) + 1;
        }
      }

      let majorityGrade = "";
      let maxCount = 0;
      for (const grade in gradeCounts) {
        if (gradeCounts[grade] > maxCount) {
          majorityGrade = grade;
          maxCount = gradeCounts[grade];
        }
      }

      if (!majorityGrade) {
        const alert = await alertController.create({
          header: "Advertencia",
          message:
            "No se pudo determinar un grado mayoritario a partir de las coincidencias. No se pueden añadir estudiantes que no estén en el sistema.",
          buttons: ["OK"],
        });
        await alert.present();
        // Continue without adding excel-only students if no majority grade is found
      }

      // 3. Build the master list
      const finalStudentList = [];
      const systemStudentsFoundInExcel = new Set();

      // Process all students from Excel
      jsonData.forEach((excelRow) => {
        const normalizedDi = normalizeString(excelRow.DI);
        const systemStudent = systemStudentsMap.get(normalizedDi);
        const isRetired =
          excelRow.Retirado && excelRow.Retirado.toUpperCase() === "SI";

        // Add student if they belong to the majority grade OR if they are in our system
        if (
          (majorityGrade && excelRow.Grado === majorityGrade) ||
          systemStudent
        ) {
          let studentData;
          if (systemStudent) {
            // Student exists in both systems
            systemStudentsFoundInExcel.add(normalizedDi);
            const def =
              parseFloat(systemStudent.promedioRefuerzo) >
                parseFloat(systemStudent.promedioRegular) &&
              systemStudent.hasReinforcement
                ? systemStudent.promedioRefuerzo
                : systemStudent.promedioRegular;
            const niv = systemStudent.hasRemedial
              ? systemStudent.promedioNivelacion
              : "";
            const l1 = calculateL1Value(systemStudent);

            studentData = {
              ...systemStudent,
              NOMBRE: `${systemStudent.lastName} ${systemStudent.name}`,
              FALLAS: "",
              DEF: def,
              NIV: niv,
              L1: l1,
              L2: "",
              numeroOrden: Number(excelRow.Numero),
              inSystem: true,
              inExcel: true,
              isRetired: isRetired,
            };
          } else {
            // Student only in Excel (and belongs to majority grade)
            studentData = {
              NOMBRE: `${excelRow.Apellidos || ""} ${
                excelRow.Nombres || ""
              }`.trim(), // Assuming columns are "Apellidos" and "Nombres"
              FALLAS: "",
              DEF: "",
              NIV: "",
              L1: "",
              L2: "",
              numeroOrden: Number(excelRow.Numero),
              inSystem: false,
              inExcel: true,
              isRetired: isRetired,
            };
          }
          finalStudentList.push(studentData);
        }
      });

      // Identify and add students only in our system
      const systemOnlyStudents = [];
      props.usuariosEstudiantes.forEach((student) => {
        if (!systemStudentsFoundInExcel.has(normalizeString(student.code))) {
          const def =
            parseFloat(student.promedioRefuerzo) >
              parseFloat(student.promedioRegular) && student.hasReinforcement
              ? student.promedioRefuerzo
              : student.promedioRegular;
          const niv = student.hasRemedial ? student.promedioNivelacion : "";
          const l1 = calculateL1Value(student);

          systemOnlyStudents.push({
            ...student,
            NOMBRE: `${student.lastName} ${student.name}`,
            FALLAS: "",
            DEF: def,
            NIV: niv,
            L1: l1,
            L2: "",
            numeroOrden: Infinity, // To sort them at the end
            inSystem: true,
            inExcel: false,
            isRetired: false,
          });
        }
      });

      // 4. Sort and combine lists
      finalStudentList.sort((a, b) => a.numeroOrden - b.numeroOrden);
      const combinedList = [...finalStudentList, ...systemOnlyStudents];

      // 5. Generate data for the sheet
      const data = combinedList.map((estudiante, index) => ({
        NUM: index + 1,
        NOMBRE: estudiante.NOMBRE,
        FALLAS: estudiante.FALLAS,
        DEF: estudiante.DEF,
        NIV: estudiante.NIV,
        L1: estudiante.L1,
        L2: estudiante.L2,
      }));

      const ws = XLSX.utils.json_to_sheet(data);

      // 6. Apply styling
      const pinkStyle = { fill: { fgColor: { rgb: "FFFFC0CB" } } }; // Pink
      const blueStyle = { fill: { fgColor: { rgb: "FFADD8E6" } } }; // Light Blue

      combinedList.forEach((estudiante, index) => {
        const rowNum = index + 2; // 1-based index + header row
        let style = null;

        if (estudiante.isRetired || !estudiante.inSystem) {
          style = pinkStyle;
        } else if (!estudiante.inExcel) {
          style = blueStyle;
        }

        if (style) {
          const range = XLSX.utils.decode_range(ws["!ref"]);
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowNum - 1, c: C });
            if (!ws[cellAddress]) ws[cellAddress] = {};
            ws[cellAddress].s = style;
          }
        }
      });

      // 7. Write and download file
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Planilla de Notas Ordenada");

      // Add conventions sheet
      const conventions = [
        {
          "Código L1": 91,
          Significado: "El estudiante aprobó con un desempeño superior.",
        },
        {
          "Código L1": 92,
          Significado: "El estudiante aprobó con un desempeño alto.",
        },
        {
          "Código L1": 93,
          Significado: "El estudiante aprobó con un desempeño básico.",
        },
        {
          "Código L1": 94,
          Significado:
            "A pesar de las actividades de nivelación, el estudiante no superó los desempeños esperados.",
        },
        {
          "Código L1": 95,
          Significado:
            "A pesar de las actividades de refuerzo, el estudiante no superó los desempeños esperados.",
        },
        {
          "Código L1": 96,
          Significado:
            "El estudiante logró los desempeños básicos con su nota regular, aunque no superó el refuerzo.",
        },
        {
          "Código L1": 98,
          Significado:
            "El estudiante logrado cumplir con los desempeños esperado gracias a actividades de nivelación.",
        },
        {
          "Código L1": 99,
          Significado:
            "El estudiante logró cumplir con los desempeños esperado gracias a actividades de refuerzo.",
        },
      ];
      const wsConventions = XLSX.utils.json_to_sheet(conventions);
      XLSX.utils.book_append_sheet(wb, wsConventions, "Convenciones");

      XLSX.writeFile(wb, "planilla_notas_plataforma.xlsx");
      mostrarModalCargaExcel.value = false;
      onClose();
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
