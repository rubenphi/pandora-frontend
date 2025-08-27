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
            :class="{ 'no-group-student': !estudiante.hasGroup }"
          >
            <ion-item slot="header">
              <ion-label>{{
                estudiante.lastName + " " + estudiante.name
              }}</ion-label>
              <ion-chip
                slot="end"
                :color="estudiante.promedio < 3.5 ? 'danger' : 'primary'"
              >
                {{ estudiante.promedio }}
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
                  v-for="area in estudiante.areasConNotas"
                  :key="area.id"
                >
                  <ion-item-group>
                    <ion-item-divider>
                      <ion-label>{{ area.name }}</ion-label>
                    </ion-item-divider>
                    <ion-item-sliding v-for="nota in area.notas" :key="nota.id">
                      <ion-item>
                        <ion-icon :icon="easelOutline" slot="start"></ion-icon>
                        <ion-label>
                          <h2>{{ nota.gradableItem?.title }}</h2>
                          <p>Lección: {{ nota.gradableItem?.lesson?.topic }}</p>
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
                (gradableTypeSelected === 'activity' && activities.length === 0)
              "
              style="color: gray; font-size: 0.8em; margin-top: 5px"
            >
              No hay
              {{ gradableTypeSelected === "quiz" ? "quizzes" : "actividades" }}
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
        <div class="ion-padding">
          <ion-button expand="block" @click="guardarNota">Guardar</ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
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
      gradableType: null,
      periodId: null,
      grade: null,
      instituteId: null,
      id: null,
      exist: false,
    });

    const calcularPromedio = (liveGradableItems, studentGrades) => {
      if (liveGradableItems.length === 0) return (0).toFixed(2);
      const sumaTotal = studentGrades.reduce(
        (acc, nota) => acc + nota.grade,
        0
      );
      const promedio = sumaTotal / liveGradableItems.length;
      return promedio.toFixed(2);
    };

    const processStudentGrades = (
      allGrades,
      studentList,
      usersWithoutGroupIds
    ) => {
      const liveGradableItemsMap = new Map();
      allGrades.forEach((grade) => {
        liveGradableItemsMap.set(grade.gradableItem.id, grade.gradableItem);
      });
      const liveGradableItems = Array.from(liveGradableItemsMap.values());

      return studentList.map((estudiante) => {
        const studentGrades = allGrades
          .filter((grade) => grade.user.id === estudiante.id)
          .map((n) => ({ ...n, grade: parseFloat(n.grade.toFixed(1)) }));

        const promedio = calcularPromedio(liveGradableItems, studentGrades);

        const areasConNotas = liveGradableItems.reduce((acc, actividad) => {
          const notaExistente = studentGrades.find(
            (n) => n.gradableItem.id === actividad.id
          );

          const itemParaMostrar = {
            id: notaExistente ? notaExistente.id : `pending-${actividad.id}`,
            gradableItem: actividad,
            grade: notaExistente ? notaExistente.grade : null,
            gradableType: actividad.type,
          };

          const area = actividad.lesson.area;
          const areaIndex = acc.findIndex((a) => a.id === area.id);

          if (areaIndex === -1) {
            acc.push({
              name: area.name,
              id: area.id,
              notas: [itemParaMostrar],
            });
          } else {
            acc[areaIndex].notas.push(itemParaMostrar);
          }
          return acc;
        }, []);

        const sortedAreas = areasConNotas.map((area) => ({
          ...area,
          notas: area.notas.sort(
            (a, b) =>
              new Date(a.gradableItem.lesson.date) -
              new Date(b.gradableItem.lesson.date)
          ),
        }));

        return {
          ...estudiante,
          promedio,
          areasConNotas: sortedAreas,
          hasGroup: !usersWithoutGroupIds.has(estudiante.id),
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
            `/courses/${cursoId}/users?year=${year}`,
            tokenHeader()
          )
        ).data
          .filter((estudiante) => estudiante.rol === "student")
          .map((estudiante) => estudiante.user);

        const usersNoGroupResponse = await axios.get(
          `/courses/${cursoId}/usersNoGroup?year=${year}`,
          tokenHeader()
        );
        const usersWithoutGroupIds = new Set(
          usersNoGroupResponse.data.map((u) => u.user.id)
        );

        usuariosEstudiantes.value = processStudentGrades(
          allGrades,
          studentList,
          usersWithoutGroupIds
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
      gradableTypeSelected.value = nota.gradableItem.type;
      notaForm.value = {
        userId: estudianteId,
        lessonId: nota.gradableItem.lesson.id,
        gradableId: nota.gradableItem.id,
        gradableType: nota.gradableItem.type,
        periodId: periodoSelected.value,
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
          periodId: notaForm.value.periodId,
          grade: parseFloat(notaForm.value.grade),
          instituteId: notaForm.value.instituteId,
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
    };
  },
};
</script>
<style scoped>
.no-group-student {
  opacity: 0.6;
  font-style: italic;
}
</style>
