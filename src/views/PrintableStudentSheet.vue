<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button
            default-href="/admin/gestionar/usuarios"
          ></ion-back-button>
        </ion-buttons>
        <ion-title>Hojas de Respuesta</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="printSheets">
            <ion-icon slot="icon-only" :icon="printOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div id="printable-area">
        <div
          v-for="(page, pageIndex) in paginatedStudents"
          :key="pageIndex"
          class="print-page"
        >
          <div class="grid-container">
            <div v-for="student in page" :key="student.id" class="grid-item">
              <AnswerSheet :student="student" :course-name="courseName" />
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
} from "@ionic/vue";
import { printOutline } from "ionicons/icons";
import { onMounted, ref, computed } from "vue";
import AnswerSheet from "@/components/AnswerSheet.vue";
import axios from "axios";
import { tokenHeader } from "@/globalService";

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    AnswerSheet,
  },
  setup() {
    const studentData = ref([]);
    const year = ref(null);

    const paginatedStudents = computed(() => {
      const students = studentData.value[0]?.students || [];
      const pageSize = 6;
      const pages = [];
      for (let i = 0; i < students.length; i += pageSize) {
        pages.push(students.slice(i, i + pageSize));
      }
      return pages;
    });

    const courseName = computed(() => studentData.value[0]?.name);

    onMounted(async () => {
      if (window.history.state.studentData) {
        const rawStudentData = window.history.state.studentData;
        const courseId = rawStudentData[0]?.id;
        const students = rawStudentData[0]?.students || [];
        year.value = window.history.state.year;

        if (courseId && students.length > 0) {
          try {
            const usersNoGroupResponse = await axios.get(
              `/courses/${courseId}/usersNoGroup?year=${year.value}`,
              tokenHeader()
            );
            const usersWithoutGroupIds = new Set(
              usersNoGroupResponse.data.map((u) => u.user.id)
            );

            const studentsWithGroup = students.filter(
              (student) => !usersWithoutGroupIds.has(student.id)
            );

            studentData.value = [
              {
                ...rawStudentData[0],
                students: studentsWithGroup,
              },
            ];
          } catch (error) {
            console.error("Error filtering students by group:", error);
            studentData.value = rawStudentData;
          }
        } else {
          studentData.value = rawStudentData;
        }
      }
    });

    const generatePrintHTML = () => {
      const students = studentData.value[0]?.students || [];
      const course = courseName.value || "";

      // Función para generar el código de una hoja
      const generateSheetCode = (student) => {
        const originalCode = student.code || "";
        const name = student.name || "";
        const lastName = student.lastName || "";

        // Formatear código a 9 dígitos SOLO para la matriz
        let formattedCode = String(originalCode).replace(/\D/g, "");
        if (formattedCode.length > 9) {
          formattedCode = formattedCode.slice(-9);
        } else if (formattedCode.length < 9) {
          formattedCode = formattedCode.padStart(9, "0");
        }

        if (formattedCode.length !== 9) {
          formattedCode = formattedCode.padStart(9, "0");
        }

        // Crear matriz de 10 filas × 9 columnas
        const matrix = Array.from({ length: 10 }, () => Array(9).fill(0));
        for (let col = 0; col < 9; col++) {
          const digit = parseInt(formattedCode[col], 10);
          if (!isNaN(digit)) {
            matrix[digit][col] = 1;
          }
        }

        // Generar celdas del grid
        let cellsHTML = "";
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 9; c++) {
            const filled = matrix[r][c] === 1 ? "background: black; border-radius: 50%;" : "";
            cellsHTML += `<div class="grid-cell" style="width: 100%; height: 100%; box-sizing: border-box; ${filled}"></div>`;
          }
        }

        // Generar dígitos usando el código ORIGINAL (sin formatear)
        const x1 = 177;
        const x2 = 1089;
        const totalWidth = x2 - x1;
        const codeToDisplay = String(originalCode);
        const digitWidth = totalWidth / codeToDisplay.length;
        let digitsHTML = "";
        for (let i = 0; i < codeToDisplay.length; i++) {
          digitsHTML += `
        <div style="position: absolute; left: ${
          x1 + i * digitWidth
        }px; top: 687px; 
             width: ${digitWidth}px; height: 95px; font-size: 76px; line-height: 95px;
             text-align: center; color: black; font-family: Arial, sans-serif;">
          ${codeToDisplay[i]}
        </div>
      `;
        }

        return `
      <div class="image-wrapper">
        <img src="/hoja50.jpg" alt="Hoja OMR" style="display: block; width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;">
          <div style="position: absolute; left: 366px; top: 20px; width: 2834px; height: 114px;
               font-size: 91px; line-height: 114px; color: black; font-family: Arial, sans-serif;
               white-space: nowrap; overflow: hidden;">
            ${lastName} ${name}
          </div>
          ${
            course
              ? `
            <div style="position: absolute; left: 1396px; top: 295px; width: 1883px; height: 161px;
                 font-size: 118px; line-height: 161px; color: black; font-family: Arial, sans-serif;
                 white-space: nowrap; overflow: hidden;">
              ${course}
            </div>
          `
              : ""
          }
          ${digitsHTML}
        </div>
        <div style="position: absolute; left: 266px; top: 796px; width: 825px; height: 918px;
             display: grid; grid-template-columns: repeat(9, 1fr); grid-template-rows: repeat(10, 1fr);
             gap: 20px; z-index: 50; pointer-events: none;">
          ${cellsHTML}
        </div>
      </div>
    `;
      };

      // Generar páginas
      let pagesHTML = "";
      for (let i = 0; i < students.length; i += 6) {
        const pageStudents = students.slice(i, i + 6);
        let sheetsHTML = "";

        pageStudents.forEach((student) => {
          sheetsHTML += `
        <div class="grid-item">
          ${generateSheetCode(student)}
        </div>
      `;
        });

        pagesHTML += `
      <div class="print-page">
        <div class="grid-container">
          ${sheetsHTML}
        </div>
      </div>
    `;
      }

      return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hojas de Respuesta</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        @page {
          size: legal;
          margin: 0;
        }
        
        .print-page {
          page-break-after: always;
          width: 216mm;
          height: 330mm;
          overflow: hidden;
          position: relative;
        }
        
        .print-page:last-child {
          page-break-after: auto;
        }
        
        .grid-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(3, 1fr);
          width: 100%;
          height: 100%;
        }
        
        .grid-item {
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        
       .image-wrapper {
  position: relative;
  width: 3313px;
  height: 3520px;
  user-select: none;
  transform: scale(0.1044);
  transform-origin: top left;
  transform-box: fill-box;  /* <-- importante */
  overflow: hidden;
}

        
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      ${pagesHTML}
    </body>
    </html>
  `;
    };

    const printSheets = () => {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(generatePrintHTML());
        printWindow.document.close();

        // Esperar a que las imágenes se carguen antes de permitir imprimir
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
          }, 500);
        };
      }
    };

    return {
      paginatedStudents,
      year,
      courseName,
      printSheets,
      printOutline,
    };
  },
};
</script>

<style>
@media print {
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print-page {
    page-break-after: always;
    width: 216mm;
    height: 330mm;
    overflow: hidden;
  }
  ion-header,
  ion-content {
    display: none;
  }
  #printable-area {
    display: block;
  }
}

@page {
  size: legal;
  margin: 0;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
}

.grid-item {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.grid-item .answer-sheet {
  transform: scale(0.1044);
  transform-origin: top left;
}

@media screen {
  #printable-area {
    background: #f0f0f0;
    padding: 20px;
  }
  .print-page {
    width: 216mm;
    height: 330mm;
    margin: 20px auto;
    border: 1px dashed #ccc;
  }
}
</style>
