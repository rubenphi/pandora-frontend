<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/actividades/' + activityId">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Revisar Actividad</ion-title>
        <ion-buttons slot="primary">
          <ion-item>
            <ion-label>Sel. Todos</ion-label>
            <ion-checkbox
              :checked="areAllSelected"
              @ionChange="toggleSelectAll"
            ></ion-checkbox>
          </ion-item>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="presentImportExportOptions()">
            <ion-icon :icon="documentOutline"></ion-icon>
          </ion-button>
          <ion-button @click="presentSaveOptions()">
            <ion-icon :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <!-- ── Single-criterion mode: flat list, Tab between students ── -->
      <single-criterion-student-list
        v-if="isSingleCriterion"
        :students="students"
        :criterion="criteria[0]"
        :modelValue="getAllFlat()"
        :criteria="criteria"
        :evaluation="evaluation"
        :isSaving="isSaving"
        :students-with-evidence="evidences"
        @update:modelValue="onAllFlatUpdate"
        @save="saveSingleEvaluation"
      >
        <template #row-prefix="{ student }">
          <ion-checkbox
            :checked="selectedStudents.has(student.id)"
            @ionChange="
              handleStudentSelection(student.id, $event.detail.checked)
            "
            @click.stop
          />
        </template>
        <template #row-suffix="{ student }">
          <evidence-uploader
            :student-id="student.id"
            :activity-id="activityId"
            :institute-id="instituteId"
            @evidence-changed="handleEvidenceChanged"
          />
        </template>
      </single-criterion-student-list>

      <!-- ── Multi-criterion mode: accordion per student ── -->
      <ion-accordion-group v-else>
        <ion-accordion
          v-for="student in students"
          :key="student.id"
          @ionChange="handleAccordionChange($event, student)"
        >
          <IonItem slot="header">
            <ion-checkbox
              slot="start"
              :checked="selectedStudents.has(student.id)"
              @ionChange="
                handleStudentSelection(student.id, $event.detail.checked)
              "
              @click.stop
            ></ion-checkbox>
            <IonLabel>
              {{ student.lastName + " " + student.name }}
              <ion-icon
                v-if="hasEvidence(student.id)"
                :icon="attachOutline"
                color="primary"
                class="evidence-indicator-icon"
                title="Tiene archivo anexo"
              ></ion-icon>
            </IonLabel>
            <IonNote slot="end"
              >Nota:
              {{
                studentGrades[student.id] != null
                  ? studentGrades[student.id].toFixed(2)
                  : "N/A"
              }}</IonNote
            >
          </IonItem>
          <div class="ion-padding" slot="content">
            <evidence-uploader
              :student-id="student.id"
              :activity-id="activityId"
              :institute-id="instituteId"
              @evidence-changed="handleEvidenceChanged"
            />
            <ion-button
              expand="block"
              @click="saveSingleEvaluation(student)"
              :disabled="isSaving"
              >Guardar</ion-button
            >
            <criterion-list
              v-if="evaluation[student.id]"
              :criteria="criteria"
              :modelValue="getStudentFlat(student)"
              @update:modelValue="onStudentEvalUpdate($event, student)"
            />
            <ion-button
              expand="block"
              @click="saveSingleEvaluation(student)"
              :disabled="isSaving"
              >Guardar</ion-button
            >
          </div>
        </ion-accordion>
      </ion-accordion-group>

      <!-- ── Import Excel Modal ── -->
      <ion-modal :is-open="showImportModal" @didDismiss="closeImportModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Importar Calificaciones</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeImportModal">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div
            class="upload-area"
            @dragover.prevent="importDragOver = true"
            @dragleave.prevent="importDragOver = false"
            @drop.prevent="handleImportDrop"
            @click="$refs.importFileInput.click()"
            :class="{ 'drag-over': importDragOver }"
          >
            <input
              type="file"
              ref="importFileInput"
              style="display: none"
              accept=".xlsx, .xls"
              @change="handleImportFileSelect"
            />
            <ion-icon :icon="cloudUploadOutline" class="upload-icon"></ion-icon>
            <p>Arrastra tu archivo Excel aquí o haz clic para seleccionarlo</p>
            <p v-if="importFileName">Archivo: {{ importFileName }}</p>
          </div>
          <ion-button
            expand="block"
            :disabled="!importFile"
            @click="processExcelImport"
          >
            Procesar Importación
          </ion-button>
        </ion-content>
      </ion-modal>

      <!-- Toasts -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        message="Evaluación guardada correctamente"
        :duration="3000"
        color="success"
        @didDismiss="setSuccessToastOpen(false)"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        :message="errorMessage"
        :duration="3000"
        color="danger"
        @didDismiss="setErrorToastOpen(false)"
      ></ion-toast>

      <!-- FAB for Bulk Evaluation -->
      <ion-fab
        vertical="bottom"
        horizontal="end"
        slot="fixed"
        v-if="selectedStudents.size > 0"
      >
        <ion-fab-button @click="goToBulkEvaluation">Evaluar</ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { tokenHeader, usuarioGet, basedeURL } from "../globalService";
import JSZip from "jszip";
import {
  useToast,
  calculateFinalGrade,
  saveCriterionScore,
} from "../composables/useEvaluation";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  onIonViewWillEnter,
  IonAccordionGroup,
  IonAccordion,
  alertController,
  actionSheetController,
  loadingController,
  IonIcon,
  IonToast,
  IonNote,
  IonCheckbox,
  IonFab,
  IonFabButton,
  IonModal,
} from "@ionic/vue";
import {
  arrowBackOutline,
  saveOutline,
  checkmarkDoneOutline,
  closeOutline,
  attachOutline,
  documentOutline,
  cloudUploadOutline,
  downloadOutline,
} from "ionicons/icons";
import * as XLSX from "xlsx-js-style";
import CriterionList from "../components/CriterionList.vue";
import SingleCriterionStudentList from "../components/SingleCriterionStudentList.vue";
import EvidenceUploader from "../components/EvidenceUploader.vue";

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonAccordionGroup,
    IonAccordion,
    IonIcon,
    IonToast,
    IonNote,
    IonCheckbox,
    IonFab,
    IonFabButton,
    IonModal,
    CriterionList,
    SingleCriterionStudentList,
    EvidenceUploader,
  },
  setup() {
    const mroute = useRoute();
    const router = useRouter();
    const activityId = mroute.params.id;
    const usuario = ref(null);
    const periodId = ref(null);
    const instituteId = ref(null);

    const students = ref([]);
    const criteria = ref([]);
    const evaluation = ref({}); // { studentId: { criterionId: { value, id } } }
    const studentGrades = ref({});
    const currentlyOpenStudentId = ref(null);
    const isSaving = ref(false);
    const selectedStudents = ref(new Set());
    const evidences = ref({});

    // ─── Activity info for Excel export ─────────────────────────────────────
    const activityInfo = ref({
      area: "",
      grade: "",
      topic: "",
      lessonTopic: "",
    });

    // ─── Excel Import refs ──────────────────────────────────────────────────
    const showImportModal = ref(false);
    const importFile = ref(null);
    const importFileName = ref("");
    const importDragOver = ref(false);
    const importFileInput = ref(null);

    const {
      isSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setSuccessToastOpen,
      setErrorToastOpen,
    } = useToast();

    usuario.value = usuarioGet();

    // ─── Excel Import helpers ───────────────────────────────────────────────

    const closeImportModal = () => {
      showImportModal.value = false;
      importFile.value = null;
      importFileName.value = "";
      importDragOver.value = false;
    };

    const presentImportExportOptions = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Opciones de Excel",
        buttons: [
          {
            text: "Importar calificaciones",
            icon: cloudUploadOutline,
            handler: () => {
              showImportModal.value = true;
            },
          },
          {
            text: "Exportar plantilla base",
            icon: downloadOutline,
            handler: () => {
              presentExportOptions();
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
            icon: closeOutline,
          },
        ],
      });
      await actionSheet.present();
    };

    const presentExportOptions = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Formato de exportación",
        buttons: [
          {
            text: "Solo Excel",
            icon: documentOutline,
            handler: () => {
              exportBaseExcel();
            },
          },
          {
            text: "Zip completo",
            icon: documentOutline,
            handler: () => {
              exportZip();
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
            icon: closeOutline,
          },
        ],
      });
      await actionSheet.present();
    };

    const getExportFileName = () => {
      const a = activityInfo.value;
      return `calificar "${a.topic} - ${a.lessonTopic} - ${a.grade}"`;
    };

    const buildWorkbook = () => {
      const wsData = [];

      // Row 1: Area
      wsData.push(["Area", activityInfo.value.area]);
      // Row 2: Grado
      wsData.push(["Grado", activityInfo.value.grade]);
      // Row 3: Actividad
      wsData.push(["Actividad", activityInfo.value.topic]);
      // Rows 4-6: empty
      wsData.push([]);
      wsData.push([]);
      wsData.push([]);

      // Row 7 (index 6): "Pts: {score}" above each criterion starting at column C
      const ptsRow = new Array(criteria.value.length + 2).fill(null);
      criteria.value.forEach((c, i) => {
        ptsRow[i + 2] = `Pts: ${c.score}`;
      });
      wsData.push(ptsRow);

      // Row 8 (index 7): criterion names starting at column C
      const criteriaRow = new Array(criteria.value.length + 2).fill(null);
      criteria.value.forEach((c, i) => {
        criteriaRow[i + 2] = c.description;
      });
      wsData.push(criteriaRow);

      // Row 9+ (index 8+): student codes in column A, names in column B
      students.value.forEach((student) => {
        wsData.push([student.code, `${student.lastName} ${student.name}`]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws["!cols"] = [
        { wch: 15 }, // A: codes
        { wch: 30 }, // B: names
        ...criteria.value.map(() => ({ wch: 15 })),
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
      return wb;
    };

    const exportBaseExcel = () => {
      const wb = buildWorkbook();
      XLSX.writeFile(wb, `${getExportFileName()}.xlsx`);
    };

    const exportZip = async () => {
      const zip = new JSZip();
      const fileName = getExportFileName();

      // Add Excel to zip
      const wb = buildWorkbook();
      const xlsxData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      zip.file(`${fileName}.xlsx`, xlsxData);

      // Fetch evidence for each student
      const baseUrl = basedeURL();
      const evidenceFolder = zip.folder("evidencias");

      const fetchPromises = students.value.map(async (student) => {
        try {
          const response = await axios.get(
            `/activity-evidences/activity/${activityId}/student/${student.id}`,
            tokenHeader(),
          );
          if (response.data && response.data.pdfUrl) {
            const fileUrl = baseUrl + response.data.pdfUrl;
            const fileResponse = await axios.get(fileUrl, {
              responseType: "arraybuffer",
            });

            // Folder name: code_firstNameWord_lastNameWord
            const firstName = (student.name || "").split(/\s+/)[0];
            const lastName = (student.lastName || "").split(/\s+/)[0];
            const folderName = `${student.code}_${lastName}_${firstName}`;

            const ext = response.data.pdfUrl.split(".").pop() || "pdf";
            evidenceFolder.file(`${folderName}.${ext}`, fileResponse.data);
          }
        } catch (error) {
          console.error(
            `Error descargando evidencia de ${student.name}:`,
            error,
          );
        }
      });

      await Promise.all(fetchPromises);

      // Generate and download zip
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    };

    const handleImportFileSelect = (event) => {
      const selected = event.target.files[0];
      if (selected && /\.(xlsx|xls)$/i.test(selected.name)) {
        importFile.value = selected;
        importFileName.value = selected.name;
      } else {
        alertController
          .create({
            header: "Error",
            message:
              "Por favor, seleccione un archivo Excel válido (.xlsx o .xls).",
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      }
    };

    const handleImportDrop = (event) => {
      importDragOver.value = false;
      const dropped = event.dataTransfer.files[0];
      if (dropped && /\.(xlsx|xls)$/i.test(dropped.name)) {
        importFile.value = dropped;
        importFileName.value = dropped.name;
      } else {
        alertController
          .create({
            header: "Error",
            message:
              "Por favor, arrastre un archivo Excel válido (.xlsx o .xls).",
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      }
    };

    const cleanExcelCode = (raw) => {
      if (raw == null) return "";
      return String(raw).replace(/[.,]/g, "").trim();
    };

    const processExcelImport = async () => {
      if (!importFile.value) return;

      try {
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(importFile.value);
        });

        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range(worksheet["!ref"]);

        // 1) Extract student codes from column A starting at row 9 (index 8)
        const STUDENT_START_ROW = 8; // Row 9 in Excel = index 8
        const CRITERIA_ROW = 7; // Row 8 in Excel = index 7
        const CRITERIA_START_COL = 2; // Column C = index 2

        const studentCodes = [];
        for (let r = STUDENT_START_ROW; r <= range.e.r; r++) {
          const cellAddress = { r, c: 0 };
          const cell = worksheet[XLSX.utils.encode_cell(cellAddress)];
          if (cell && cell.v != null && String(cell.v).trim() !== "") {
            studentCodes.push({
              raw: String(cell.v).trim(),
              clean: cleanExcelCode(cell.v),
              excelRow: r + 1,
            });
          }
        }

        if (studentCodes.length === 0) {
          alertController
            .create({
              header: "Error",
              message:
                "No se encontraron códigos de estudiantes en la columna A (desde la fila 9).",
              buttons: ["OK"],
            })
            .then((alert) => alert.present());
          return;
        }

        // 2) Extract criterion names from row 8 (index 7), columns C onward (index 2+)
        const criterionNames = [];
        for (let c = CRITERIA_START_COL; c <= range.e.c; c++) {
          const cellAddress = { r: CRITERIA_ROW, c };
          const cell = worksheet[XLSX.utils.encode_cell(cellAddress)];
          if (cell && cell.v != null && String(cell.v).trim() !== "") {
            criterionNames.push({
              name: String(cell.v).trim(),
              excelCol: c,
            });
          }
        }

        if (criterionNames.length === 0) {
          alertController
            .create({
              header: "Error",
              message:
                "No se encontraron nombres de criterios en la fila 8 (desde la columna C).",
              buttons: ["OK"],
            })
            .then((alert) => alert.present());
          return;
        }

        // 3) Validate criteria names (exact match)
        const criteriaMismatches = [];
        const matchedCriteria = [];

        for (const excelC of criterionNames) {
          const found = criteria.value.find(
            (c) => c.description === excelC.name,
          );
          if (found) {
            matchedCriteria.push({
              criterion: found,
              excelCol: excelC.excelCol,
            });
          } else {
            criteriaMismatches.push(excelC.name);
          }
        }

        if (criteriaMismatches.length > 0) {
          const message = `
            <p><b>No se puede continuar.</b> Los siguientes nombres de criterios en el Excel no coinciden con los criterios de la actividad:</p>
            <ul>${criteriaMismatches
              .map((n) => `<li>"${n}"</li>`)
              .join("")}</ul>
            <p>Verifique que los nombres en el Excel sean idénticos a los criterios configurados.</p>
          `;
          await alertController
            .create({
              header: "Discordancia de Criterios",
              message,
              buttons: ["OK"],
            })
            .then((alert) => alert.present());
          return;
        }

        // 4) Build a lookup map: cleaned code → Excel row
        const codeToExcelRow = new Map();
        for (const entry of studentCodes) {
          codeToExcelRow.set(entry.clean, entry.excelRow);
        }

        // Search each local student in the Excel
        const notInExcel = [];
        const foundStudents = [];

        for (const student of students.value) {
          const cleanedCode = cleanExcelCode(student.code);
          const excelRow = codeToExcelRow.get(cleanedCode);
          if (excelRow != null) {
            foundStudents.push({ student, excelRow });
          } else {
            notInExcel.push(
              `${student.code} - ${student.lastName} ${student.name}`,
            );
          }
        }

        if (foundStudents.length === 0) {
          alertController
            .create({
              header: "Error",
              message:
                "Ningún estudiante de la lista fue encontrado en el archivo Excel.",
              buttons: ["OK"],
            })
            .then((alert) => alert.present());
          return;
        }

        // Ask about students not in Excel
        if (notInExcel.length > 0) {
          const alert = await alertController.create({
            header: "Estudiantes no encontrados en Excel",
            message: `
              <p>Los siguientes estudiantes de la lista no aparecen en el Excel:</p>
              <ul>${notInExcel.map((s) => `<li>${s}</li>`).join("")}</ul>
              <p>¿Desea continuar solo con los ${
                foundStudents.length
              } estudiantes encontrados en el Excel?</p>
            `,
            buttons: [
              { text: "Cancelar", role: "cancel" },
              { text: "Continuar", role: "confirm" },
            ],
          });
          await alert.present();
          const { role } = await alert.onDidDismiss();
          if (role !== "confirm") return;
        }

        // 5) Check for students with existing values
        const studentsWithExisting = foundStudents.filter(({ student }) => {
          return matchedCriteria.some(({ criterion }) => {
            const entry = evaluation.value[student.id]?.[criterion.id];
            return entry && entry.value !== null;
          });
        });

        let overwriteMode = "skip"; // default: skip existing

        if (studentsWithExisting.length > 0) {
          const namesList = studentsWithExisting
            .map(({ student }) => `${student.lastName} ${student.name}`)
            .join(", ");

          const alert = await alertController.create({
            header: "Valores existentes",
            message: `
              <p>Los siguientes estudiantes ya tienen calificaciones:</p>
              <p><b>${namesList}</b></p>
              <p>¿Qué desea hacer con estos estudiantes?</p>
            `,
            buttons: [
              { text: "Cancelar todo", role: "cancel" },
              {
                text: "Omitir (mantener existentes)",
                handler: () => {
                  overwriteMode = "skip";
                },
              },
              {
                text: "Sobrescribir",
                handler: () => {
                  overwriteMode = "overwrite";
                },
              },
            ],
          });
          await alert.present();
          const { role } = await alert.onDidDismiss();
          if (role === "cancel") return;
        }

        // 6) Validate scores and collect violations
        const violations = [];

        for (const { student, excelRow } of foundStudents) {
          for (const { criterion, excelCol } of matchedCriteria) {
            const cellAddress = { r: excelRow - 1, c: excelCol };
            const cell = worksheet[XLSX.utils.encode_cell(cellAddress)];
            let value = null;

            if (cell && cell.v != null) {
              value = typeof cell.v === "number" ? cell.v : parseFloat(cell.v);
              if (isNaN(value)) value = null;
            }

            if (value !== null && value > criterion.score) {
              violations.push({
                student: `${student.lastName} ${student.name}`,
                criterion: criterion.description,
                value,
                max: criterion.score,
              });
            }
          }
        }

        if (violations.length > 0) {
          const rows = violations
            .map(
              (v) =>
                `<li><b>${v.student}</b> - ${v.criterion}: <b>${v.value}</b> (máx: ${v.max})</li>`,
            )
            .join("");
          const alert = await alertController.create({
            header: "Valores fuera de rango",
            message: `
              <p>Los siguientes valores superan el puntaje máximo del criterio:</p>
              <ul>${rows}</ul>
              <p>Corrija el archivo e intente de nuevo.</p>
            `,
            buttons: ["OK"],
          });
          await alert.present();
          return;
        }

        // 7) Apply values
        let importedCount = 0;

        for (const { student, excelRow } of foundStudents) {
          // Skip students with existing values if mode is skip
          if (overwriteMode === "skip") {
            const hasAnyValue = matchedCriteria.some(({ criterion }) => {
              const entry = evaluation.value[student.id]?.[criterion.id];
              return entry && entry.value !== null;
            });
            if (hasAnyValue) continue;
          }

          for (const { criterion, excelCol } of matchedCriteria) {
            const cellAddress = { r: excelRow - 1, c: excelCol };
            const cell = worksheet[XLSX.utils.encode_cell(cellAddress)];
            let value = null;

            if (cell && cell.v != null) {
              value = typeof cell.v === "number" ? cell.v : parseFloat(cell.v);
              if (isNaN(value)) value = null;
            }

            if (
              evaluation.value[student.id] &&
              evaluation.value[student.id][criterion.id]
            ) {
              evaluation.value[student.id][criterion.id].value = value;
            }
          }

          updateGrade(student);
          importedCount++;
        }

        closeImportModal();

        await alertController
          .create({
            header: "Importación exitosa",
            message: `Se importaron calificaciones para ${importedCount} de ${foundStudents.length} estudiantes encontrados.`,
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      } catch (error) {
        console.error("Error procesando Excel:", error);
        alertController
          .create({
            header: "Error",
            message:
              "Ocurrió un error al procesar el archivo Excel. Verifique que el formato sea correcto.",
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      }
    };

    // ─── Helpers for CriterionList v-model ───────────────────────────────────

    /** Returns a flat { criterionId: value } map for a student. */
    const getStudentFlat = (student) => {
      const flat = {};
      if (!evaluation.value[student.id]) return flat;
      for (const cId in evaluation.value[student.id]) {
        flat[cId] = evaluation.value[student.id][cId]?.value ?? null;
      }
      return flat;
    };

    /** Syncs a flat update back into the nested evaluation object. */
    const onStudentEvalUpdate = (newFlat, student) => {
      if (!evaluation.value[student.id]) return;
      for (const cId in newFlat) {
        if (evaluation.value[student.id][cId] !== undefined) {
          evaluation.value[student.id][cId].value = newFlat[cId];
        }
      }
      updateGrade(student);
    };

    // ─── Single-criterion mode helpers ───────────────────────────────────────

    /** True when the activity has exactly one criterion (enables flat mode). */
    const isSingleCriterion = computed(() => criteria.value.length === 1);

    /**
     * Returns a flat { [studentId]: { [criterionId]: value } } object
     * for all students – used as v-model by SingleCriterionStudentList.
     */
    const getAllFlat = () => {
      const result = {};
      for (const student of students.value) {
        result[student.id] = getStudentFlat(student);
      }
      return result;
    };

    /**
     * Receives the full flat map back from SingleCriterionStudentList and
     * syncs changes into the nested evaluation object.
     */
    const onAllFlatUpdate = (newAllFlat) => {
      for (const studentId in newAllFlat) {
        const student = students.value.find((s) => s.id == studentId);
        if (student) onStudentEvalUpdate(newAllFlat[studentId], student);
      }
    };

    // ─── Data fetching ────────────────────────────────────────────────────────

    const fetchActivityDetails = async () => {
      evaluation.value = {};
      studentGrades.value = {};

      try {
        const response = await axios.get(
          `/activities/${activityId}`,
          tokenHeader(),
        );

        const courseId = response.data.lesson.course.id;
        const year = response.data.lesson.year;
        const lessonType = response.data.lesson.type;
        const lessonId = response.data.lesson.id;

        periodId.value = response.data.lesson.period.id;
        instituteId.value = response.data.institute.id;

        activityInfo.value = {
          area: response.data.lesson.area?.name || "",
          grade: response.data.lesson.course?.name || "",
          topic: response.data.title || "",
          lessonTopic: response.data.lesson.topic || "",
        };

        await fetchCriteria(activityId);

        if (lessonType === "reinforcement") {
          await fetchReinforcementStudents(lessonId);
        } else {
          await fetchStudents(courseId, year);
        }

        await fetchStudentCriterionScores(activityId);
      } catch (error) {
        console.error("Error in fetchActivityDetails:", error.message || error);
      }
    };

    const fetchStudentCriterionScores = async (activityId) => {
      try {
        const response = await axios.get(
          `/student-criterion-scores/getAll?activityId=${activityId}`,
          tokenHeader(),
        );
        response.data.forEach((score) => {
          if (evaluation.value[score.student.id]) {
            evaluation.value[score.student.id][score.criterion.id] = {
              value: score.score,
              id: score.id,
            };
          }
        });
        students.value.forEach((student) => updateGrade(student));
      } catch (error) {
        console.error(
          "Error in fetchStudentCriterionScores:",
          error.message || error,
        );
      }
    };

    const fetchStudents = async (courseId, year) => {
      try {
        const response = await axios.get(
          `/courses/${courseId}/users?active=true&year=${year}`,
          tokenHeader(),
        );
        const allStudents = response.data
          .filter((user) => user.rol === "student")
          .map((user) => user.user);

        students.value = allStudents.sort((a, b) => {
          const lastNameA = a.lastName || "";
          const lastNameB = b.lastName || "";
          if (lastNameA !== lastNameB)
            return lastNameA.localeCompare(lastNameB);
          return (a.name || "").localeCompare(b.name || "");
        });

        students.value.forEach((student) => {
          studentGrades.value[student.id] = null;
          if (!evaluation.value[student.id]) {
            evaluation.value[student.id] = {};
            criteria.value.forEach((criterion) => {
              evaluation.value[student.id][criterion.id] = {
                value: null,
                id: null,
              };
            });
          }
        });
      } catch (error) {
        console.error("Error in fetchStudents:", error.message || error);
      }
    };

    const fetchReinforcementStudents = async (lessonId) => {
      try {
        const response = await axios.get(
          `/reinforcement/lesson/${lessonId}`,
          tokenHeader(),
        );
        const reinforcementStudents = response.data.map((r) => r.student);

        students.value = reinforcementStudents.sort((a, b) => {
          const lastNameA = a.lastName || "";
          const lastNameB = b.lastName || "";
          if (lastNameA !== lastNameB)
            return lastNameA.localeCompare(lastNameB);
          return (a.name || "").localeCompare(b.name || "");
        });

        students.value.forEach((student) => {
          studentGrades.value[student.id] = null;
          if (!evaluation.value[student.id]) {
            evaluation.value[student.id] = {};
            criteria.value.forEach((criterion) => {
              evaluation.value[student.id][criterion.id] = {
                value: null,
                id: null,
              };
            });
          }
        });
      } catch (error) {
        console.error(
          "Error in fetchReinforcementStudents:",
          error.message || error,
        );
      }
    };

    const fetchCriteria = async (activityId) => {
      try {
        const response = await axios.get(
          `/criteria?activityId=${activityId}`,
          tokenHeader(),
        );
        criteria.value = response.data.sort((a, b) => a.id - b.id);
      } catch (error) {
        console.error("Error in fetchCriteria:", error.message || error);
      }
    };

    // ─── Grade helpers ────────────────────────────────────────────────────────

    const updateGrade = (student) => {
      studentGrades.value[student.id] = calculateFinalGrade(
        student.id,
        evaluation.value,
        criteria.value,
      );
    };

    const handleAccordionChange = (event, student) => {
      if (event.detail.checked) {
        currentlyOpenStudentId.value = student.id;
        updateGrade(student);
      } else {
        currentlyOpenStudentId.value = null;
      }
    };

    // ─── Save helpers ─────────────────────────────────────────────────────────

    /** Saves one student's criterion scores (without success toast). */
    const saveEvaluation = async (student) => {
      try {
        for (const criterionId in evaluation.value[student.id]) {
          const entry = evaluation.value[student.id][criterionId];
          if (entry.value !== null) {
            const payload = {
              studentId: student.id,
              criterionId: parseInt(criterionId),
              score: entry.value,
              instituteId: usuario.value.institute.id,
              activityId: parseInt(activityId),
            };
            const savedData = await saveCriterionScore(entry.id, payload);
            if (!entry.id && savedData?.id) {
              evaluation.value[student.id][criterionId].id = savedData.id;
            }
          }
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          `Error guardando evaluación para ${student.name}`;
        setErrorToastOpen(true, message);
        throw new Error(message);
      }
    };

    const saveSingleEvaluation = async (student) => {
      isSaving.value = true;
      try {
        await saveEvaluation(student);
        setSuccessToastOpen(true);
        await fetchStudentCriterionScores(activityId);
      } catch (error) {
        console.error(`Fallo al guardar la evaluacion para ${student.name}`);
      } finally {
        isSaving.value = false;
      }
    };

    const saveAllEvaluations = async () => {
      isSaving.value = true;
      try {
        await Promise.all(
          students.value.map((student) => saveEvaluation(student)),
        );
        setSuccessToastOpen(true);
        await fetchStudentCriterionScores(activityId);
      } catch (error) {
        console.error("Una o más guardados fallaron.", error);
      } finally {
        isSaving.value = false;
      }
    };

    const presentSaveOptions = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Opciones de Guardado",
        buttons: [
          {
            text: "Solo Guardar Evaluaciones",
            icon: saveOutline,
            handler: async () => {
              await saveAllEvaluations();
            },
          },
          {
            text: "Guardar y Registrar Notas",
            icon: checkmarkDoneOutline,
            handler: () => {
              presentConfirmAlert();
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
            icon: closeOutline,
          },
        ],
      });
      await actionSheet.present();
    };

    const registerAllGrades = async () => {
      const allPromises = [];

      for (const student of students.value) {
        const criterionPromises = criteria.value.map(async (criterion) => {
          const entry = evaluation.value[student.id]?.[criterion.id];
          if (!entry) return;
          const score = entry.value === null ? 0 : entry.value;

          const payload = {
            studentId: student.id,
            criterionId: criterion.id,
            score,
            instituteId: usuario.value.institute.id,
            activityId: parseInt(activityId),
          };

          try {
            const savedData = await saveCriterionScore(entry.id, payload);
            entry.value = score;
            if (!entry.id && savedData?.id) {
              entry.id = savedData.id;
            }
          } catch (error) {
            console.error("Error saving criterion score", error);
            entry.value = score;
          }
        });

        const studentGradePromise = Promise.all(criterionPromises).then(
          async () => {
            const finalGrade = calculateFinalGrade(
              student.id,
              evaluation.value,
              criteria.value,
            );
            const validFinalGrade =
              finalGrade != null && !isNaN(finalGrade) ? finalGrade : 0;
            const payloadFinalGrade = {
              userId: student.id,
              gradableId: parseInt(activityId),
              gradableType: "activity",
              periodId: periodId.value,
              gradeType: "regular",
              grade: parseFloat(validFinalGrade.toFixed(2)),
              instituteId: instituteId.value,
            };
            studentGrades.value[student.id] = validFinalGrade;
            try {
              await axios.post("/grades", payloadFinalGrade, tokenHeader());
            } catch (error) {
              console.error(
                `Error registrando nota final para ${student.name}:`,
                error,
              );
            }
          },
        );

        allPromises.push(studentGradePromise);
      }

      await Promise.all(allPromises);
    };

    const presentConfirmAlert = async () => {
      const studentsWithMissing = getStudentsWithMissingCriteria();
      let message =
        "¿Estás seguro de que deseas registrar las notas para todos los estudiantes? Esta acción no se puede deshacer.";

      if (studentsWithMissing.length > 0) {
        message +=
          "<br><br><b>¡Advertencia!</b> Los siguientes estudiantes tienen criterios sin evaluar. Sus notas se registrarán con 0 en esos criterios:<br>";
        message += "<ul>";
        studentsWithMissing.forEach((name) => {
          message += `<li>${name}</li>`;
        });
        message += "</ul>";
      }

      const alert = await alertController.create({
        header: "Confirmar Registro",
        message,
        buttons: [
          { text: "Cancelar", role: "cancel", cssClass: "secondary" },
          {
            text: "Registrar",
            role: "confirm",
          },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();

      if (role === "confirm") {
        const loading = await loadingController.create({
          message: "Registrando notas...",
          spinner: "crescent",
        });
        await loading.present();

        try {
          await registerAllGrades();
          await loading.dismiss();
          presentSuccessAlert();
        } catch (error) {
          await loading.dismiss();
          setErrorToastOpen(true, "Error al registrar las notas: " + error);
        }
      }
    };

    const presentSuccessAlert = async () => {
      const alert = await alertController.create({
        header: "Registro Exitoso",
        message:
          "Las notas se han registrado exitosamente para todos los estudiantes.",
        buttons: ["OK"],
      });
      await alert.present();
    };

    const getStudentsWithMissingCriteria = () => {
      const studentsWithMissing = [];
      students.value.forEach((student) => {
        const hasMissing = criteria.value.some(
          (criterion) =>
            evaluation.value[student.id]?.[criterion.id]?.value === null,
        );
        if (hasMissing) {
          studentsWithMissing.push(student.name + " " + student.lastName);
        }
      });
      return studentsWithMissing;
    };

    onIonViewWillEnter(async () => {
      await fetchActivityDetails();
    });

    // ─── Student selection ────────────────────────────────────────────────────

    const handleStudentSelection = (studentId, isChecked) => {
      if (isChecked) {
        selectedStudents.value.add(studentId);
      } else {
        selectedStudents.value.delete(studentId);
      }
    };

    const areAllSelected = computed(
      () =>
        students.value.length > 0 &&
        selectedStudents.value.size === students.value.length,
    );

    const toggleSelectAll = () => {
      if (areAllSelected.value) {
        selectedStudents.value.clear();
      } else {
        students.value.forEach((student) =>
          selectedStudents.value.add(student.id),
        );
      }
    };

    const goToBulkEvaluation = () => {
      router.push({
        name: "EvaluacionGrupal",
        state: {
          activityId,
          studentIds: Array.from(selectedStudents.value),
        },
      });
    };

    const handleEvidenceChanged = ({ studentId, evidence }) => {
      if (evidence) {
        evidences.value[studentId] = evidence;
      } else {
        delete evidences.value[studentId];
      }
    };

    const hasEvidence = (studentId) => {
      return !!evidences.value[studentId];
    };

    return {
      activityId,
      students,
      criteria,
      evaluation,
      arrowBackOutline,
      saveOutline,
      saveEvaluation,
      saveSingleEvaluation,
      saveAllEvaluations,
      presentSaveOptions,
      handleAccordionChange,
      currentlyOpenStudentId,
      fetchStudentCriterionScores,
      registerAllGrades,
      presentConfirmAlert,
      isSaving,
      isSuccessToastOpen,
      setSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setErrorToastOpen,
      studentGrades,
      updateGrade,
      usuario,
      selectedStudents,
      handleStudentSelection,
      areAllSelected,
      toggleSelectAll,
      goToBulkEvaluation,
      getStudentFlat,
      onStudentEvalUpdate,
      isSingleCriterion,
      getAllFlat,
      onAllFlatUpdate,
      instituteId,
      attachOutline,
      evidences,
      handleEvidenceChanged,
      hasEvidence,
      showImportModal,
      importFile,
      importFileName,
      importDragOver,
      importFileInput,
      closeImportModal,
      handleImportFileSelect,
      handleImportDrop,
      processExcelImport,
      presentImportExportOptions,
      presentExportOptions,
      exportBaseExcel,
      exportZip,
      activityInfo,
      documentOutline,
      cloudUploadOutline,
      downloadOutline,
    };
  },
};
</script>

<style scoped>
.button-row {
  justify-content: space-between;
}
.upload-area {
  border: 2px dashed var(--ion-color-medium);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  background-color: var(--ion-color-light);
}
.upload-area.drag-over {
  border-color: var(--ion-color-primary);
  background-color: var(--ion-color-primary-tint);
}
.upload-icon {
  font-size: 4em;
  color: var(--ion-color-medium);
}
.upload-area.drag-over .upload-icon {
  color: var(--ion-color-primary);
}
.upload-area p {
  color: var(--ion-color-dark);
  margin-top: 10px;
}
</style>
