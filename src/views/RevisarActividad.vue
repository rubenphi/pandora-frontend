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
        @update:modelValue="onAllFlatUpdate"
        @save="saveSingleEvaluation"
      >
        <template #row-prefix="{ student }">
          <ion-checkbox
            :checked="selectedStudents.has(student.id)"
            @ionChange="handleStudentSelection(student.id, $event.detail.checked)"
            @click.stop
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
              @ionChange="handleStudentSelection(student.id, $event.detail.checked)"
              @click.stop
            ></ion-checkbox>
            <IonLabel>{{ student.lastName + " " + student.name }}</IonLabel>
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
            <ion-button expand="block" @click="saveSingleEvaluation(student)" :disabled="isSaving"
              >Guardar</ion-button
            >
            <criterion-list
              v-if="evaluation[student.id]"
              :criteria="criteria"
              :modelValue="getStudentFlat(student)"
              @update:modelValue="onStudentEvalUpdate($event, student)"
            />
            <ion-button expand="block" @click="saveSingleEvaluation(student)" :disabled="isSaving"
              >Guardar</ion-button
            >
          </div>
        </ion-accordion>
      </ion-accordion-group>

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
import { tokenHeader, usuarioGet } from "../globalService";
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
  IonIcon,
  IonToast,
  IonNote,
  IonCheckbox,
  IonFab,
  IonFabButton,
} from "@ionic/vue";
import { arrowBackOutline, saveOutline, checkmarkDoneOutline, closeOutline } from "ionicons/icons";
import CriterionList from "../components/CriterionList.vue";
import SingleCriterionStudentList from "../components/SingleCriterionStudentList.vue";

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
    CriterionList,
    SingleCriterionStudentList,
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

    const {
      isSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setSuccessToastOpen,
      setErrorToastOpen,
    } = useToast();

    usuario.value = usuarioGet();

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
          tokenHeader()
        );

        const courseId = response.data.lesson.course.id;
        const year = response.data.lesson.year;
        const lessonType = response.data.lesson.type;
        const lessonId = response.data.lesson.id;

        periodId.value = response.data.lesson.period.id;
        instituteId.value = response.data.institute.id;

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
          tokenHeader()
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
          error.message || error
        );
      }
    };

    const fetchStudents = async (courseId, year) => {
      try {
        const response = await axios.get(
          `/courses/${courseId}/users?active=true&year=${year}`,
          tokenHeader()
        );
        const allStudents = response.data
          .filter((user) => user.rol === "student")
          .map((user) => user.user);

        students.value = allStudents.sort((a, b) => {
          const lastNameA = a.lastName || "";
          const lastNameB = b.lastName || "";
          if (lastNameA !== lastNameB) return lastNameA.localeCompare(lastNameB);
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
          tokenHeader()
        );
        const reinforcementStudents = response.data.map((r) => r.student);

        students.value = reinforcementStudents.sort((a, b) => {
          const lastNameA = a.lastName || "";
          const lastNameB = b.lastName || "";
          if (lastNameA !== lastNameB) return lastNameA.localeCompare(lastNameB);
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
          error.message || error
        );
      }
    };

    const fetchCriteria = async (activityId) => {
      try {
        const response = await axios.get(
          `/criteria?activityId=${activityId}`,
          tokenHeader()
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
        criteria.value
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
          students.value.map((student) => saveEvaluation(student))
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
        header: 'Opciones de Guardado',
        buttons: [
          {
            text: 'Solo Guardar Evaluaciones',
            icon: saveOutline,
            handler: async () => {
              await saveAllEvaluations();
            }
          },
          {
            text: 'Guardar y Registrar Notas',
            icon: checkmarkDoneOutline,
            handler: () => {
              presentConfirmAlert();
            }
          },
          {
            text: 'Cancelar',
            role: 'cancel',
            icon: closeOutline
          }
        ]
      });
      await actionSheet.present();
    };

    const registerAllGrades = async () => {
      const allPromises = [];

      for (const student of students.value) {
        const criterionPromises = criteria.value.map(async (criterion) => {
          const entry = evaluation.value[student.id][criterion.id];
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
            if (!entry.id && savedData?.id) {
              evaluation.value[student.id][criterion.id].id = savedData.id;
            }
          } catch (error) {
            console.error("Error saving criterion score", error);
          }
        });

        const studentGradePromise = Promise.all(criterionPromises).then(
          async () => {
            const finalGrade = calculateFinalGrade(
              student.id,
              evaluation.value,
              criteria.value
            );
            const payloadFinalGrade = {
              userId: student.id,
              gradableId: parseInt(activityId),
              gradableType: "activity",
              periodId: periodId.value,
              gradeType: "regular",
              grade: parseFloat(finalGrade.toFixed(2)),
              instituteId: instituteId.value,
            };
            try {
              await axios.post("/grades", payloadFinalGrade, tokenHeader());
            } catch (error) {
              console.error(
                `Error registrando nota final para ${student.name}:`,
                error
              );
            }
          }
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
            handler: async () => {
              await registerAllGrades();
              presentSuccessAlert();
            },
          },
        ],
      });
      await alert.present();
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
            evaluation.value[student.id]?.[criterion.id]?.value === null
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
  // Evitar que el checkbox "Seleccionar Todos" dispare cambios individuales
  if (!isChecked && areAllSelected.value) return;

  if (isChecked) {
    selectedStudents.value.add(studentId);
  } else {
    selectedStudents.value.delete(studentId);
  }
};


    const areAllSelected = computed(
      () =>
        students.value.length > 0 &&
        selectedStudents.value.size === students.value.length
    );

    const toggleSelectAll = () => {
      if (areAllSelected.value) {
        selectedStudents.value.clear();
      } else {
        students.value.forEach((student) =>
          selectedStudents.value.add(student.id)
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
    };
  },
};
</script>

<style scoped>
.button-row {
  justify-content: space-between;
}
</style>
