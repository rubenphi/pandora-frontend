<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cursos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Cursos</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-list>
        <ion-item>
          <ion-label><strong>Periodo:</strong></ion-label>
          <ion-select
            v-model="periodoSelected"
            placeholder="Seleccione el periodo"
            @ionChange="actualizarNotas"
          >
            <ion-select-option
              v-for="periodo in periodos"
              :key="periodo.id"
              :value="periodo.id"
            >
              {{ periodo.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-accordion-group>
          <ion-accordion
            v-for="estudiante in usuariosEstudiantes"
            :key="estudiante.id"
          >
            <ion-item slot="header">
              <ion-label>{{
                estudiante.lastName + " " + estudiante.name
              }}</ion-label>
              <ion-chip
                slot="end"
                :color="estudiante.promedio < 3.5 ? 'danger' : 'primary'"
              >
                <span
                  :style="{
                    opacity: estudiante.hasReinforcement ? '0.6' : '1',
                  }"
                >
                  {{ estudiante.promedio }}
                </span>
                <span
                  v-if="estudiante.hasReinforcement"
                  style="opacity: 1; font-weight: bold"
                >
                  / {{ estudiante.promedioReinf }}
                </span>
              </ion-chip>
            </ion-item>
            <div class="ion-padding" slot="content">
              <ion-button
                @click="mostrarModalNuevaNota(estudiante.id)"
                fill="outline"
                size="small"
              >
                <ion-icon :icon="addOutline" slot="start"></ion-icon>
                Añadir Nota
              </ion-button>
              <ion-list>
                <ion-item-sliding
                  v-for="dimension in estudiante.dimensiones"
                  :key="dimension.id"
                >
                  <ion-item-group>
                    <ion-item-divider>
                      <ion-label>
                        {{ dimension.name }}
                        <!-- Average Badge: Regular (Opaque if has reinforcement) -->
                        <ion-chip
                          size="small"
                          :color="
                            parseFloat(dimension.promedio) < 3.5
                              ? 'danger'
                              : 'success'
                          "
                          :style="{
                            opacity: estudiante.hasReinforcement ? '0.6' : '1',
                          }"
                        >
                          {{ dimension.promedio }}
                        </ion-chip>
                        <!-- Average Badge: Reinforcement (if exists, normal opacity) -->
                        <span v-if="estudiante.hasReinforcement">
                          /
                          <ion-chip
                            size="small"
                            :color="
                              parseFloat(dimension.promedioReinf) < 3.5
                                ? 'danger'
                                : 'success'
                            "
                            style="opacity: 1; font-weight: bold"
                          >
                            {{ dimension.promedioReinf }}
                          </ion-chip>
                        </span>
                      </ion-label>
                    </ion-item-divider>

                    <!-- Regular Grades (Opaque if hasReinforcement) -->
                    <div
                      :style="{
                        opacity: estudiante.hasReinforcement ? '0.6' : '1',
                      }"
                    >
                      <ion-item-sliding
                        v-for="nota in dimension.notas"
                        :key="nota.id"
                      >
                        <ion-item>
                          <ion-icon
                            :icon="easelOutline"
                            slot="start"
                          ></ion-icon>
                          <ion-label>
                            <h2>
                              {{ nota.gradableItem?.title }}
                            </h2>
                            <p>
                              Lección: {{ nota.gradableItem?.lesson?.topic }}
                            </p>
                            <p
                              v-if="nota.grade && nota.grade < 3.5"
                              style="color: #bf9494"
                            >
                              {{ nota.grade }}
                            </p>
                            <p v-else-if="nota.grade">{{ nota.grade }}</p>
                            <p v-else>Pendiente</p>
                          </ion-label>
                        </ion-item>
                        <ion-item-options side="end">
                          <ion-item-option
                            @click="editarNota(nota, estudiante.id)"
                            color="primary"
                          >
                            <ion-icon
                              :icon="pencilOutline"
                              slot="icon-only"
                            ></ion-icon>
                          </ion-item-option>
                        </ion-item-options>
                      </ion-item-sliding>
                    </div>

                    <!-- Reinforcement Grades (Normal Opacity, only if hasReinforcement) -->
                    <div v-if="estudiante.hasReinforcement">
                      <!-- Optional sub-header or divider for visual separation, but user asked for just list -->
                      <ion-item-sliding
                        v-for="nota in dimension.notasReinf"
                        :key="nota.id"
                      >
                        <ion-item>
                          <!-- Different icon or color to distinguish? User didn't ask, but maybe helpful. -->
                          <ion-icon
                            :icon="easelOutline"
                            slot="start"
                            color="tertiary"
                          ></ion-icon>
                          <ion-label>
                            <h2>{{ nota.gradableItem?.title }} (Refuerzo)</h2>
                            <p>
                              Lección: {{ nota.gradableItem?.lesson?.topic }}
                            </p>
                            <p
                              v-if="nota.grade && nota.grade < 3.5"
                              style="color: #bf9494"
                            >
                              {{ nota.grade }}
                            </p>
                            <p v-else-if="nota.grade">{{ nota.grade }}</p>
                            <p v-else>Pendiente</p>
                          </ion-label>
                        </ion-item>
                        <ion-item-options side="end">
                          <ion-item-option
                            @click="editarNota(nota, estudiante.id)"
                            color="primary"
                          >
                            <ion-icon
                              :icon="pencilOutline"
                              slot="icon-only"
                            ></ion-icon>
                          </ion-item-option>
                        </ion-item-options>
                      </ion-item-sliding>
                    </div>
                  </ion-item-group>
                </ion-item-sliding>
              </ion-list>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </ion-list>
    </ion-content>

    <!-- Modal para añadir/editar nota -->
    <ion-modal :is-open="mostrarModal" @didDismiss="cerrarModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{
            modoEdicion ? "Editar Nota" : "Añadir Nota"
          }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="cerrarModal">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <!-- Edit Mode View -->
        <div v-if="modoEdicion">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Lección</ion-label>
              <ion-input :value="lessonName" readonly></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">
                {{
                  notaForm.gradableType === "quiz"
                    ? "Quiz"
                    : "actvity"
                    ? "Actividad"
                    : ""
                }}</ion-label
              >
              <ion-input :value="notaForm.gradableTitle" readonly></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Calificación</ion-label>
              <ion-input
                v-model="notaForm.grade"
                type="number"
                min="0"
                max="5"
                step="0.1"
              ></ion-input>
            </ion-item>
          </ion-list>
        </div>

        <!-- Add Mode View -->
        <div v-else>
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Lección</ion-label>
              <ion-select
                v-model="notaForm.lessonId"
                placeholder="Seleccione la lección"
                @ionChange="onLessonSelected"
              >
                <ion-select-option
                  v-for="lesson in lessons"
                  :key="lesson.id"
                  :value="lesson.id"
                >
                  {{ lesson.topic }} ({{
                    new Date(lesson.date).toLocaleDateString()
                  }})
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Tipo de Ítem Calificable</ion-label>
              <ion-segment
                v-model="gradableTypeSelected"
                @ionChange="onGradableTypeSelected"
              >
                <ion-segment-button value="quiz">
                  <ion-label>Quiz</ion-label>
                </ion-segment-button>
                <ion-segment-button value="activity">
                  <ion-label>Actividad</ion-label>
                </ion-segment-button>
              </ion-segment>
            </ion-item>

            <ion-item v-if="gradableTypeSelected">
              <ion-label position="stacked">{{
                gradableTypeSelected === "quiz" ? "Quiz" : "Actividad"
              }}</ion-label>
              <ion-select
                v-model="notaForm.gradableId"
                placeholder="Seleccione el ítem calificable"
              >
                <ion-select-option
                  v-for="item in gradableTypeSelected === 'quiz'
                    ? quizzes
                    : activities"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.title }}
                </ion-select-option>
              </ion-select>
              <p
                v-if="
                  (gradableTypeSelected === 'quiz' && quizzes.length === 0) ||
                  (gradableTypeSelected === 'activity' &&
                    activities.length === 0)
                "
                style="color: gray; font-size: 0.8em; margin-top: 5px"
              >
                No hay
                {{
                  gradableTypeSelected === "quiz" ? "quizzes" : "actividades"
                }}
                disponibles para esta lección.
              </p>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Calificación</ion-label>
              <ion-input
                v-model="notaForm.grade"
                type="number"
                min="0"
                max="5"
                step="0.1"
              ></ion-input>
            </ion-item>
          </ion-list>
        </div>

        <!-- Guardar Button (common for both modes) -->
        <div class="ion-padding">
          <ion-button expand="block" @click="guardarNota">Guardar</ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref, computed } from "vue";
import { alertController } from "@ionic/vue";
import { periodosGet, tokenHeader, usuarioGet } from "../globalService";

import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonList,
  IonIcon,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSelect,
  IonSelectOption,
  IonAccordionGroup,
  IonAccordion,
  IonButton,
  IonModal,
  IonInput,
  IonButtons,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSegment,
  IonSegmentButton,
  IonChip,
  IonItemGroup,
  IonItemDivider,
} from "@ionic/vue";
import { useRoute } from "vue-router";
import { easelOutline, addOutline, pencilOutline } from "ionicons/icons";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonAccordionGroup,
    IonAccordion,
    IonButton,
    IonModal,
    IonInput,
    IonButtons,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonSegment,
    IonSegmentButton,
    IonChip,
    IonItemGroup,
    IonItemDivider,
  },
  setup() {
    const mroute = useRoute();
    const { year, cursoId, areaId } = mroute.params;
    const usuario = ref();
    const periodos = ref([]);
    const periodoSelected = ref();
    const usuariosEstudiantes = ref([]);

    const lessons = ref([]);
    const quizzes = ref([]);
    const activities = ref([]);
    const mostrarModal = ref(false);
    const modoEdicion = ref(false);
    const gradableTypeSelected = ref(null);
    const notaForm = ref({
      userId: null,
      lessonId: null,
      gradableId: null,
      gradableTitle: null,
      gradableType: null,
      periodId: null,
      grade: null,
      instituteId: null,
      id: null,
      exist: false,
    });

    const processStudentGrades = (
      allGrades,
      studentList,
      reinforcementStudents
    ) => {
      // 1. Build Master List of Gradable Items (excluding reinforcements)
      const masterItemsMap = new Map();

      allGrades.forEach((grade) => {
        // If lesson type is standard (or undefined, assuming standard if missing)
        // We can check grade.gradableItem.lesson.type if available.
        // Note: Backend might send 'standard' literal.
        // We INCLUDE reinforcement items in the initial master map extraction
        // But we tag them so we can filter later.
        // const isReinforcement = grade.gradableItem?.lesson?.type === 'reinforcement';

        if (grade.gradableItem && grade.gradableItem.id) {
          const uniqueKey = `${grade.gradableType}-${grade.gradableItem.id}`;
          if (!masterItemsMap.has(uniqueKey)) {
            masterItemsMap.set(uniqueKey, {
              id: grade.gradableItem.id,
              type: grade.gradableType,
              item: grade.gradableItem,
              classification: grade.classification, // Infer classification from first occurrence
            });
          }
        }
      });

      // Split Master List by Classification
      const masterKnowledge = Array.from(masterItemsMap.values()).filter(
        (i) => i.classification === "knowledge"
      );
      const masterExecution = Array.from(masterItemsMap.values()).filter(
        (i) => i.classification === "execution"
      );
      const masterBehavior = Array.from(masterItemsMap.values()).filter(
        (i) => i.classification === "behavior"
      );

      const getStudentGradeForItem = (studentGrades, item) => {
        return studentGrades.find(
          (g) => g.gradableType === item.type && g.gradableItem.id === item.id
        );
      };

      const mapToDisplayParamsWithMasterList = (studentGrades, masterList) => {
        return masterList
          .map((masterItem) => {
            const foundGrade = getStudentGradeForItem(
              studentGrades,
              masterItem
            );
            if (foundGrade) {
              return {
                id: foundGrade.id,
                gradableItem: foundGrade.gradableItem,
                gradableType: foundGrade.gradableType,
                classification: foundGrade.classification,
                grade: foundGrade.grade,
                isPending: false,
              };
            } else {
              // Create Pending Entry
              return {
                id: `pending-${masterItem.type}-${masterItem.id}`,
                gradableItem: masterItem.item,
                gradableType: masterItem.type,
                classification: masterItem.classification,
                grade: null, // Visual: Pending
                isPending: true,
              };
            }
          })
          .sort(
            (a, b) =>
              new Date(a.gradableItem.lesson.date) -
              new Date(b.gradableItem.lesson.date)
          );
      };

      const calculateAverageFromMasterList = (studentGrades, masterList) => {
        if (masterList.length === 0) return 0;
        let totalScore = 0;
        masterList.forEach((masterItem) => {
          const foundGrade = getStudentGradeForItem(studentGrades, masterItem);
          if (foundGrade) {
            totalScore += foundGrade.grade;
          }
          // If not found, adds 0 to score
        });
        return totalScore / masterList.length;
      };

      const formatGrade = (grade) => {
        if (!grade && grade !== 0) return 0;
        return Math.floor(grade * 10) / 10;
      };

      return studentList.map((estudiante) => {
        const hasReinforcement = reinforcementStudents.has(estudiante.id);
        const studentGrades = allGrades
          .filter((grade) => grade.user.id === estudiante.id)
          .map((n) => ({ ...n, grade: formatGrade(n.grade) }));

        // --- REGULAR GRADES LOGIC ---
        // Lists excluding reinforcement items
        const masterKnowledgeRegular = masterKnowledge.filter(
          (i) => i.item.lesson?.type !== "reinforcement"
        );
        const masterExecutionRegular = masterExecution.filter(
          (i) => i.item.lesson?.type !== "reinforcement"
        );
        const masterBehaviorRegular = masterBehavior.filter(
          (i) => i.item.lesson?.type !== "reinforcement"
        );

        // Display lists (Regular)
        const saberNotasRegular = mapToDisplayParamsWithMasterList(
          studentGrades,
          masterKnowledgeRegular
        );
        const hacerNotasRegular = mapToDisplayParamsWithMasterList(
          studentGrades,
          masterExecutionRegular
        );
        const serNotasRegular = mapToDisplayParamsWithMasterList(
          studentGrades,
          masterBehaviorRegular
        );

        // Averages (Regular) - Divisor is count of REGULAR items
        const promSaberRegular = calculateAverageFromMasterList(
          studentGrades,
          masterKnowledgeRegular
        );
        const promHacerRegular = calculateAverageFromMasterList(
          studentGrades,
          masterExecutionRegular
        );
        const promSerRegular = calculateAverageFromMasterList(
          studentGrades,
          masterBehaviorRegular
        );

        const promedioFinalRegular =
          (promSaberRegular + promHacerRegular + promSerRegular) / 3;

        // --- REINFORCEMENT GRADES LOGIC (Only if hasReinforcement) ---
        let promSaberReinf = 0,
          promHacerReinf = 0,
          promSerReinf = 0,
          promedioFinalReinf = 0;
        let saberNotasReinf = [],
          hacerNotasReinf = [],
          serNotasReinf = [];

        if (hasReinforcement) {
          const masterKnowledgeReinf = masterKnowledge.filter(
            (i) => i.item.lesson?.type === "reinforcement"
          );
          const masterExecutionReinf = masterExecution.filter(
            (i) => i.item.lesson?.type === "reinforcement"
          );
          const masterBehaviorReinf = masterBehavior.filter(
            (i) => i.item.lesson?.type === "reinforcement"
          );

          saberNotasReinf = mapToDisplayParamsWithMasterList(
            studentGrades,
            masterKnowledgeReinf
          );
          hacerNotasReinf = mapToDisplayParamsWithMasterList(
            studentGrades,
            masterExecutionReinf
          );
          serNotasReinf = mapToDisplayParamsWithMasterList(
            studentGrades,
            masterBehaviorReinf
          );

          promSaberReinf = calculateAverageFromMasterList(
            studentGrades,
            masterKnowledgeReinf
          );
          promHacerReinf = calculateAverageFromMasterList(
            studentGrades,
            masterExecutionReinf
          );
          promSerReinf = calculateAverageFromMasterList(
            studentGrades,
            masterBehaviorReinf
          );

          // If no items in a dimension for reinforcement, average is 0.
          // We assume (Saber + Hacer + Ser)/3 roughly applies, but rarely we have behavior reinforcement?
          // Let's stick to simple average of 3 dimensions for consistency.
          promedioFinalReinf =
            (promSaberReinf + promHacerReinf + promSerReinf) / 3;
        }

        const dimensiones = [
          {
            id: "knowledge",
            name: "Saber",
            promedio: formatGrade(promSaberRegular).toFixed(1),
            notas: saberNotasRegular,
            // Reinforcement data
            promedioReinf: hasReinforcement
              ? formatGrade(promSaberReinf).toFixed(1)
              : null,
            notasReinf: saberNotasReinf,
          },
          {
            id: "execution",
            name: "Hacer",
            promedio: formatGrade(promHacerRegular).toFixed(1),
            notas: hacerNotasRegular,
            promedioReinf: hasReinforcement
              ? formatGrade(promHacerReinf).toFixed(1)
              : null,
            notasReinf: hacerNotasReinf,
          },
          {
            id: "behavior",
            name: "Ser",
            promedio: formatGrade(promSerRegular).toFixed(1),
            notas: serNotasRegular,
            promedioReinf: hasReinforcement
              ? formatGrade(promSerReinf).toFixed(1)
              : null,
            notasReinf: serNotasReinf,
          },
        ];

        return {
          ...estudiante,
          promedio: formatGrade(promedioFinalRegular).toFixed(1),
          promedioReinf: hasReinforcement
            ? formatGrade(promedioFinalReinf).toFixed(1)
            : null,
          hasReinforcement: hasReinforcement,
          dimensiones,
        };
      });
    };

    const getNotas = async () => {
      if (!periodoSelected.value) return;
      localStorage.setItem(
        "periodoSelected",
        JSON.stringify(periodoSelected.value)
      );

      try {
        const allGradesResponse = await axios.get(
          `/grades?year=${year}&courseId=${cursoId}&areaId=${areaId}&periodId=${periodoSelected.value}&instituteId=${usuario.value.institute.id}`,
          tokenHeader()
        );
        const allGrades = allGradesResponse.data;

        const studentList = (
          await axios.get(
            `/courses/${cursoId}/users?active=true&year=${year}`,
            tokenHeader()
          )
        ).data
          .filter((estudiante) => estudiante.rol === "student")
          .map((estudiante) => estudiante.user);

        // Fetch Reinforcements
        const reinforcementsResponse = await axios.get(
          `/reinforcement/by-context?courseId=${cursoId}&areaId=${areaId}&periodId=${periodoSelected.value}&year=${year}`,
          tokenHeader()
        );
        const reinforcementStudents = new Set(
          reinforcementsResponse.data.map((r) => r.student.id)
        );

        usuariosEstudiantes.value = processStudentGrades(
          allGrades,
          studentList,
          reinforcementStudents
        ).sort((a, b) => {
          const lastNameA = a.lastName || "";
          const lastNameB = b.lastName || "";
          return lastNameA.localeCompare(lastNameB);
        });
      } catch (error) {
        console.error("Error fetching grades:", error);
      }
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      periodos.value = periodosGet();
      const storedPeriod = localStorage.getItem("periodoSelected");
      periodoSelected.value = storedPeriod
        ? JSON.parse(storedPeriod)
        : periodos.value[0]?.id || null;
      await getNotas();
    });

    const actualizarNotas = async () => {
      await getNotas();
    };

    const mostrarModalNuevaNota = async (estudianteId) => {
      modoEdicion.value = false;
      gradableTypeSelected.value = null;
      notaForm.value = {
        userId: estudianteId,
        lessonId: null,
        gradableId: null,
        gradableType: null,
        classification: "execution",
        periodId: periodoSelected.value,
        grade: null,
        instituteId: usuario.value.institute.id,
        exist: false,
      };
      await cargarLessons();
      mostrarModal.value = true;
    };

    const editarNota = async (nota, estudianteId) => {
      modoEdicion.value = true;
      notaForm.value = {
        userId: estudianteId,
        lessonId: nota.gradableItem.lesson.id,
        gradableId: nota.gradableItem.id,
        gradableType: nota.gradableType,
        classification: nota.classification || "execution",
        periodId: periodoSelected.value,
        gradableTitle: nota.gradableItem.title,
        grade: parseFloat(nota.grade),
        instituteId: usuario.value.institute.id,

        exist: true,
      };
      if (!nota.id.toString().startsWith("pending-")) {
        notaForm.value.id = nota.id;
      }
      await cargarLessons();
      await cargarGradableItemsForLesson(
        nota.gradableItem.lesson.id,
        nota.gradableItem.type
      );
      mostrarModal.value = true;
    };

    const cargarLessons = async () => {
      try {
        const response = await axios.get(
          `/lessons?courseId=${cursoId}&periodId=${periodoSelected.value}&year=${year}&areaId=${areaId}&instituteId=${usuario.value.institute.id}`,
          tokenHeader()
        );
        lessons.value = response.data;
      } catch (error) {
        console.error("Error al cargar las lecciones:", error);
      }
    };

    const cargarGradableItemsForLesson = async (lessonId, type) => {
      try {
        const endpoint = type === "quiz" ? "quizzes" : "activities";
        const response = await axios.get(
          `/${endpoint}?lessonId=${lessonId}`,
          tokenHeader()
        );
        if (type === "quiz") {
          quizzes.value = response.data;
          activities.value = [];
        } else {
          activities.value = response.data;
          quizzes.value = [];
        }
      } catch (error) {
        console.error(`Error al cargar ${type}s:`, error);
      }
    };

    const onLessonSelected = async () => {
      if (notaForm.value.lessonId && gradableTypeSelected.value) {
        await cargarGradableItemsForLesson(
          notaForm.value.lessonId,
          gradableTypeSelected.value
        );
      }
    };

    const onGradableTypeSelected = async () => {
      notaForm.value.gradableType = gradableTypeSelected.value;
      if (notaForm.value.lessonId) {
        await cargarGradableItemsForLesson(
          notaForm.value.lessonId,
          gradableTypeSelected.value
        );
      }
    };

    const guardarNota = async () => {
      const gradeValue = parseFloat(notaForm.value.grade);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 5) {
        const alert = await alertController.create({
          header: "Error de Validación",
          message: "La calificación debe ser un número entre 0 y 5.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      try {
        const payload = {
          userId: notaForm.value.userId,
          gradableId: notaForm.value.gradableId,
          gradableType: notaForm.value.gradableType,
          classification: notaForm.value.classification,
          periodId: notaForm.value.periodId,
          grade: parseFloat(notaForm.value.grade),
          instituteId: notaForm.value.institute.id,
        };
        if (modoEdicion.value && notaForm.value.id) {
          await axios.patch(
            `/grades/${notaForm.value.id}`,
            { ...payload, exist: true },
            tokenHeader()
          );
        } else if (modoEdicion.value && !notaForm.value.id) {
          await axios.post(
            "/grades",
            { ...payload, exist: true },
            tokenHeader()
          );
        } else {
          await axios.post("/grades", payload, tokenHeader());
        }
        await getNotas();
        cerrarModal();
      } catch (error) {
        console.error("Error al guardar la nota:", error);
      }
    };

    const cerrarModal = () => {
      mostrarModal.value = false;
    };

    const lessonName = computed(() => {
      if (!notaForm.value.lessonId) return "";
      const lesson = lessons.value.find(
        (l) => l.id === notaForm.value.lessonId
      );
      return lesson
        ? `${lesson.topic} (${new Date(lesson.date).toLocaleDateString()})`
        : "";
    });

    const gradableItemName = computed(() => {
      if (!notaForm.value.gradableId || !gradableTypeSelected.value) return "";
      const source =
        gradableTypeSelected.value === "quiz"
          ? quizzes.value
          : activities.value;
      const item = source.find((i) => i.id === notaForm.value.gradableId);
      return item ? item.title : "";
    });

    return {
      usuario,
      usuariosEstudiantes,
      periodos,
      periodoSelected,
      easelOutline,
      addOutline,
      pencilOutline,
      actualizarNotas,
      mostrarModal,
      modoEdicion,
      lessons,
      quizzes,
      activities,
      notaForm,
      gradableTypeSelected,
      mostrarModalNuevaNota,
      editarNota,
      guardarNota,
      cerrarModal,
      onLessonSelected,
      onGradableTypeSelected,
      lessonName,
      gradableItemName,
    };
  },
};
</script>
<style scoped></style>
