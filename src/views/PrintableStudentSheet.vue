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
            <ion-icon :icon="printOutline"></ion-icon>
            Imprimir todas
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding" :fullscreen="true">
      <swiper :modules="modules" :pagination="{ clickable: true }" class="fullscreen-slides">
        <swiper-slide
          v-for="student in allStudents"
          :key="student.id"
        >
          <div class="slide-content-wrapper">
            <!-- Sección de Configuración para Vista Previa Individual -->
            <!--
              Estas variables controlan el tamaño de la hoja de respuesta individual
              dentro del carrusel de vista previa, usando unidades relativas (porcentajes, vw, vh).

              - individualSheetWidth: Ancho de la hoja de respuesta. Ejemplos: '80%', '70vw'.
                                      Ajusta este valor para controlar el ancho de la hoja.
              - individualSheetHeight: Alto de la hoja de respuesta. Ejemplos: 'auto', '90vh'.
                                       'auto' mantendrá la proporción.
            -->
            <AnswerSheet
              :student="student"
              :course-name="courseName"
              :style="{
                width: individualSheetWidth,
                height: individualSheetHeight,
              }"
            />
          </div>
        </swiper-slide>
      </swiper>
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

// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from "swiper/vue";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "@ionic/vue/css/ionic-swiper.css";

// import required modules
import { Pagination } from "swiper/modules";

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
    Swiper,
    SwiperSlide,
  },
  setup() {
    const studentData = ref([]);
    const year = ref(null);

    // --- Variables de Configuración para Vista Previa Individual ---
    // Ajusta estos valores para controlar el tamaño de la hoja de respuesta
    // en la vista previa individual (dentro del carrusel).
    // Puedes usar porcentajes (ej. '80%') o unidades de viewport (ej. '70vw', '90vh').
    const individualSheetWidth = ref('70vw'); // Ancho de la hoja de respuesta
    const individualSheetHeight = ref('auto'); // Alto de la hoja de respuesta ('auto' para mantener proporción)
    // --- Fin de Variables de Configuración para Vista Previa Individual ---

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

      // --- Configuración de Dimensiones y Posicionamiento ---
      // Nuevas dimensiones de la imagen (en píxeles).
      const newImageWidth = 3313;
      const newImageHeight = 4919;

      // El factor de escala se calcula para que la nueva imagen quepa en el espacio de la grilla.
      // Se asume que una celda de la grilla es aprox. 408x415px (a 96 DPI).
      // La escala es el valor mínimo para asegurar que tanto el ancho como el alto quepan.
      // scale = min(ancho_celda / ancho_imagen, alto_celda / alto_imagen)
      // scale = min(408 / 3313, 415 / 4919) = min(0.123, 0.0843) = 0.0843
      const scale = 0.0843;

      // Función para generar el código de una hoja
      const generateSheetCode = (student) => {
        const originalCode = student.code || "";
        const name = student.name || "";
        const lastName = student.lastName || "";

        // --- Variables de Posicionamiento (basadas en el layout original) ---
        // Estas variables usan porcentajes para posicionar los elementos.
        // Se basan en las coordenadas de píxeles del diseño original para mantener la consistencia.
        // La altura original (3520px) se usa como referencia para las posiciones verticales.

        const originalImageWidth = 3313;
        const originalImageHeight = 3520;

        // Posición y tamaño del nombre del estudiante
        const nameTopPercent = (60 / originalImageHeight) * 100;
        const nameLeftPercent = (600 / originalImageWidth) * 100;
        const nameWidthPercent = (2934 / originalImageWidth) * 100;
        const nameHeightPercent = (114 / originalImageHeight) * 100;
        const nameFontSizePx = 120; // Se escala con el transform del wrapper

        // Posición y tamaño del nombre del curso
        const courseTopPercent = (400 / originalImageHeight) * 100;
        const courseLeftPercent = (600 / originalImageWidth) * 100;
        const courseWidthPercent = (1883 / originalImageWidth) * 100;
        const courseHeightPercent = (161 / originalImageHeight) * 100;
        const courseFontSizePx = 180; // Se escala con el transform

        // Posición de los dígitos del código del estudiante
        const digitsTopPercent = (850 / originalImageHeight) * 100;
        const digitsLeftPercent = (670 / originalImageWidth) * 100;
        const digitsWidthPercent = ((1089 - 177) / originalImageWidth) * 100;
        const digitsHeightPercent = (95 / originalImageHeight) * 100;
        const digitsFontSizePx = 180; // Se escala con el transform

        // Posición y tamaño de la matriz de burbujas
        const matrixTopPercent = (980 / originalImageHeight) * 100;
        const matrixLeftPercent = (670 / originalImageWidth) * 100;
        const matrixWidthPercent = (1303 / originalImageWidth) * 100;
        const matrixHeightPercent = (950 / originalImageHeight) * 100;
        const matrixGapPx = 20; // Se escala con el transform

        // Formatear código a 9 dígitos SOLO para la matriz
        let formattedCode = String(originalCode).replace(/\D/g, "");

        // Crear matriz de 10 filas × 10 columnas
        const matrix = Array.from({ length: 10 }, () => Array(10).fill(0));
        for (let col = 0; col < 10; col++) {
          const digit = parseInt(formattedCode[col], 10);
          if (!isNaN(digit)) {
            // Mapeo de dígitos a filas:
            // Dígito 1-9 -> Fila 1-9 (índice 0-8)
            // Dígito 0 -> Fila 10 (índice 9)
            const rowIndex = digit === 0 ? 9 : digit - 1;
            if (rowIndex >= 0 && rowIndex < 10) {
              matrix[rowIndex][col] = 1;
            }
          }
        }

        // Generar celdas del grid para la matriz
        let cellsHTML = "";
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            const filled =
              matrix[r][c] === 1
                ? "background: black; border-radius: 50%;"
                : "";
            cellsHTML += `<div class="grid-cell" style="width: 100%; height: 100%; box-sizing: border-box; ${filled}"></div>`;
          }
        }

        // Generar dígitos del código
        const codeToDisplay = String(originalCode);
        let digitsHTML = "";
        const digitWidthPercent = 100 / codeToDisplay.length;
        for (let i = 0; i < codeToDisplay.length; i++) {
          digitsHTML += `
            <div style="position: absolute; left: ${
              i * digitWidthPercent
            }%; top: 0;
                 width: ${digitWidthPercent}%; height: 100%;
                 font-size: ${digitsFontSizePx}px; line-height: 1;
                 text-align: center; color: black; font-family: Arial, sans-serif;
                 display: flex; align-items: center; justify-content: center;">
              ${codeToDisplay[i]}
            </div>
          `;
        }

        return `
      <div class="image-wrapper">
        <img src="/hoja50.jpg" alt="Hoja OMR" style="display: block; width: 100%; height: 100%;" />
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;">
          
          <!-- Nombre del Estudiante -->
          <div style="position: absolute; left: ${nameLeftPercent}%; top: ${nameTopPercent}%; width: ${nameWidthPercent}%; height: ${nameHeightPercent}%;
               font-size: ${nameFontSizePx}px; line-height: 1; color: black; font-family: Arial, sans-serif;
               white-space: nowrap; overflow: hidden; display: flex; align-items: center;">
            ${lastName} ${name}
          </div>

          <!-- Nombre del Curso -->
          ${
            course
              ? `
            <div style="position: absolute; left: ${courseLeftPercent}%; top: ${courseTopPercent}%; width: ${courseWidthPercent}%; height: ${courseHeightPercent}%;
                 font-size: ${courseFontSizePx}px; line-height: 1; color: black; font-family: Arial, sans-serif;
                 white-space: nowrap; overflow: hidden; display: flex; align-items: center;">
              ${course}
            </div>
          `
              : ""
          }

          <!-- Dígitos del Código -->
          <div style="position: absolute; left: ${digitsLeftPercent}%; top: ${digitsTopPercent}%; width: ${digitsWidthPercent}%; height: ${digitsHeightPercent}%; display: flex;">
             ${digitsHTML}
          </div>
        </div>

        <!-- Matriz de Burbujas -->
        <div style="position: absolute; left: ${matrixLeftPercent}%; top: ${matrixTopPercent}%; width: ${matrixWidthPercent}%; height: ${matrixHeightPercent}%;
             display: grid; grid-template-columns: repeat(10, 1fr); grid-template-rows: repeat(10, 1fr);
             gap: ${matrixGapPx}px; z-index: 50; pointer-events: none;">
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
          width: ${newImageWidth}px;
          height: ${newImageHeight}px;
          user-select: none;
          transform: scale(${scale});
          transform-origin: top left;
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

    const allStudents = computed(() => {
      return studentData.value[0]?.students || [];
    });

    return {
      paginatedStudents,
      allStudents, // Added for individual student preview
      year,
      courseName,
      printSheets,
      printOutline,
      modules: [Pagination],
      individualSheetWidth,
      individualSheetHeight,
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

  .fullscreen-slides {
    height: 100%;
    background: #f0f0f0;
  }

  .print-page-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  /* For screen preview in slider, we scale down the page */
  .fullscreen-slides .print-page {
    transform: scale(0.3); /* Adjust this scale for best fit on screen */
    transform-origin: center center;
    border: 1px dashed #ccc;
    margin: 0;
  }

  .slide-content-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden; /* Ensure content doesn't spill out */
  }

  .slide-content-wrapper .answer-sheet {
    /* The scale is applied directly to the answer-sheet component */
    /* The margins are applied via inline style from the component */
    /* No need for additional transform or margin here */
  }
}
</style>
