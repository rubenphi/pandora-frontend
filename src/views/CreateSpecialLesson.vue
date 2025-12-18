<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button
            :href="`/lecciones/${curso}/${area}/${periodo}/${year}/${lessonType}`"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="crearRefuerzo">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-if="error">
          <ion-label color="danger">{{ error }}</ion-label>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Fecha</ion-label>
          <ion-input v-model="form.date" type="date"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Tema</ion-label>
          <ion-input v-model="form.topic" type="text"></ion-input>
        </ion-item>

        <ion-item-divider>
          <ion-label>Estudiantes (Seleccionar para asignar)</ion-label>
        </ion-item-divider>

        <ion-item v-if="isLoadingStudents">
          <ion-label>Cargando estudiantes...</ion-label>
        </ion-item>

        <ion-item v-for="student in studentList" :key="student.id">
          <ion-checkbox slot="start" v-model="student.selected"></ion-checkbox>
          <ion-label>
            <h2>{{ student.name }}</h2>
            <p :class="getAverageColor(student.average)">
              Promedio:
              {{ student.average ? student.average.toFixed(2) : "N/A" }}
            </p>
          </ion-label>
        </ion-item>

        <ion-item v-if="studentList.length === 0 && !isLoadingStudents">
          <ion-label>No se encontraron estudiantes con notas.</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref, computed } from "vue";
import { LessonType } from "../globalService";
import { useRoute } from "vue-router";
import router from "../router";
import { usuarioGet, tokenHeader } from "../globalService";
import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonIcon,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonItemDivider,
} from "@ionic/vue";
import { arrowBackOutline, checkmarkOutline } from "ionicons/icons";

export default {
  components: {
    IonButton,
    IonButtons,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonCheckbox,
    IonItemDivider,
  },
  setup() {
    const mroute = useRoute();
    const { curso, area, year, periodo, id, lessonType } = mroute.params;
    const usuario = ref();
    const error = ref("");
    const isEditing = ref(false);

    const form = ref({
      date: new Date().toISOString().substring(0, 10),
      topic: "",
    });

    const studentList = ref([]);
    const isLoadingStudents = ref(false);

    const pageTitle = computed(() => {
      const typeText =
        lessonType === LessonType.REMEDIAL ? "Nivelación" : "Refuerzo";
      return isEditing.value ? `Editar ${typeText}` : `Crear ${typeText}`;
    });

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();
      isLoadingStudents.value = true;
      studentList.value = [];
      error.value = "";

      if (id) {
        isEditing.value = true;
      }

      try {
        // Parallel fetch: Grades + Students ( + Lesson Info & Assignments if editing)
        const promises = [
          axios.get(
            `/grades?year=${year}&courseId=${curso}&areaId=${area}&periodId=${periodo}&instituteId=${usuario.value.institute.id}`
          ),
          axios.get(`/courses/${curso}/users?active=true&year=${year}`),
        ];

        if (isEditing.value) {
          promises.push(axios.get(`/lessons/${id}`));
          promises.push(axios.get(`/reinforcement/lesson/${id}`));
        }

        const results = await Promise.all(promises);
        const allGrades = results[0].data;
        const usersData = results[1].data;

        let lessonData = null;
        let assignments = [];

        if (isEditing.value) {
          lessonData = results[2].data;
          assignments = results[3].data; // Reinforcement[]

          form.value.topic = lessonData.topic;
          form.value.date = lessonData.date.substring(0, 10);
        }

        const assignedStudentIds = new Set(
          assignments.map((r) => r.student.id)
        );

        // Extract all students from usersData
        const allStudents = usersData
          .filter((u) => u.rol === "student")
          .map((u) => u.user);

        // Build Master List of Regular Gradable Items (excluding reinforcement)
        const masterItemsMap = new Map();
        allGrades.forEach((grade) => {
          const isReinforcement =
            grade.gradableItem?.lesson?.type === LessonType.REINFORCEMENT;
          const isRemedial =
            grade.gradableItem?.lesson?.type === LessonType.REMEDIAL;

          if (
            !isReinforcement &&
            !isRemedial &&
            grade.gradableItem &&
            grade.gradableItem.id
          ) {
            const uniqueKey = `${grade.gradableType}-${grade.gradableItem.id}`;
            if (!masterItemsMap.has(uniqueKey)) {
              masterItemsMap.set(uniqueKey, {
                id: grade.gradableItem.id,
                type: grade.gradableType,
                classification: grade.classification,
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

        const formatGrade = (grade) => {
          if (!grade && grade !== 0) return 0;
          return Math.floor(grade * 10) / 10;
        };

        const calculateAverageFromMasterList = (studentGrades, masterList) => {
          if (masterList.length === 0) return 0;
          let totalScore = 0;
          masterList.forEach((masterItem) => {
            const foundGrade = studentGrades.find(
              (g) =>
                g.gradableType === masterItem.type &&
                g.gradableItem.id === masterItem.id
            );
            if (foundGrade) {
              totalScore += foundGrade.grade;
            }
            // If not found, adds 0 to score (pending)
          });
          return totalScore / masterList.length;
        };

        studentList.value = allStudents
          .map((student) => {
            const studentGrades = allGrades
              .filter((g) => g.user.id === student.id)
              .map((n) => ({ ...n, grade: formatGrade(n.grade) }));

            // Calculate Averages based on Master Lists (Regular items only)
            const promSaber = calculateAverageFromMasterList(
              studentGrades,
              masterKnowledge
            );
            const promHacer = calculateAverageFromMasterList(
              studentGrades,
              masterExecution
            );
            const promSer = calculateAverageFromMasterList(
              studentGrades,
              masterBehavior
            );

            // Promedio Final: (Saber + Hacer + Ser) / 3
            const promedioFinal = (promSaber + promHacer + promSer) / 3;

            return {
              id: student.id,
              name: student.name + " " + student.lastName,
              average: formatGrade(promedioFinal),
              selected: isEditing.value
                ? assignedStudentIds.has(student.id)
                : false,
            };
          })
          .sort((a, b) => a.average - b.average);
      } catch (e) {
        console.error(e);
        error.value = "Error al cargar datos";
      } finally {
        isLoadingStudents.value = false;
      }
    });

    const crearRefuerzo = async () => {
      if (!form.value.topic || !form.value.date) {
        error.value = "Complete todos los campos";
        return;
      }

      const selectedStudentIds = studentList.value
        .filter((s) => s.selected)
        .map((s) => s.id);

      try {
        if (isEditing.value) {
          await axios.patch(`/reinforcement/lesson/${id}`, {
            topic: form.value.topic,
            date: form.value.date,
            studentIds: selectedStudentIds,
            teacherId: usuario.value.id,
            lessonType: lessonType, // Pass the lessonType
          });
        } else {
          await axios.post("/reinforcement/lesson", {
            topic: form.value.topic,
            date: form.value.date,
            year: parseInt(year),
            courseId: parseInt(curso),
            areaId: parseInt(area),
            periodId: parseInt(periodo),
            instituteId: usuario.value.institute.id,
            teacherId: usuario.value.id,
            studentIds: selectedStudentIds,
            lessonType: lessonType, // Pass the lessonType
            exist: true,
          });
        }

        router.push(
          `/lecciones/${curso}/${area}/${periodo}/${year}/${lessonType}`
        );
      } catch (e) {
        console.error(e);
        error.value = "Error al guardar refuerzo";
      }
    };

    const getAverageColor = (avg) => {
      if (avg < 3.5) return "low-grade";
      if (avg < 4.0) return "mid-grade";
      return "high-grade";
    };

    return {
      form,
      studentList,
      crearRefuerzo,
      curso,
      area,
      year,
      periodo,
      arrowBackOutline,
      checkmarkOutline,
      error,
      isLoadingStudents,
      getAverageColor,
      isEditing,
      pageTitle,
      lessonType,
    };
  },
};
</script>
<style scoped>
.low-grade {
  color: red;
  font-weight: bold;
}
.mid-grade {
  color: #daa520;
  font-weight: bold;
}
.high-grade {
  color: green;
  font-weight: bold;
}
</style>
