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
        <!-- Selectores de Año y Período -->
        <ion-item>
          <ion-label><strong>Año:</strong></ion-label>
          <ion-select
            v-model="selectedYear"
            placeholder="Seleccione el año"
            @ionChange="getCursoUsuario(selectedYear)"
          >
            <ion-select-option v-for="year in years" :key="year" :value="year">
              {{ year }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label><strong>Período:</strong></ion-label>
          <ion-select
            v-model="selectedPeriod"
            placeholder="Seleccione el período"
            @ionChange="onPeriodChange"
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

        <!-- Botón para generar reporte de refuerzos sin presentación o sin entrega -->
        <div class="ion-padding-horizontal ion-margin-top ion-margin-bottom">
          <ion-button
            expand="block"
            color="warning"
            @click="abrirReporteRefuerzo"
          >
            <ion-icon slot="start" :icon="alertCircleOutline"></ion-icon>
            Revisar Refuerzos Sin Presentación o Entrega
          </ion-button>
        </div>

        <!-- Acordeón de Cursos y Áreas -->
        <ion-accordion-group>
          <ion-accordion v-for="curso in cursosUsuario" :key="curso.id">
            <ion-item slot="header">
              <ion-label>{{ curso.name }}</ion-label>
            </ion-item>
            <div class="ion-padding" slot="content">
              <ion-accordion-group>
                <ion-accordion v-for="area in curso.areas" :key="area.id">
                  <ion-item slot="header">
                    <ion-label>{{ area.name }}</ion-label>
                  </ion-item>
                  <div class="ion-padding" slot="content">
                    <ion-list>
                      <ion-item
                        button
                        @click="
                          router.push(
                            `/admin/notas/${curso.id}/${area.id}/${selectedYear}`
                          )
                        "
                      >
                        <ion-label>Notas</ion-label>
                      </ion-item>
                      <ion-item
                        button
                        @click="
                          router.push(
                            `/admin/grupos/${curso.id}/${selectedYear}`
                          )
                        "
                      >
                        <ion-label>Grupos</ion-label>
                      </ion-item>
                    </ion-list>
                  </div>
                </ion-accordion>
              </ion-accordion-group>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </ion-list>

      <!-- Modal de Reporte de Refuerzo: Sin Respuestas en Quiz o Sin Criterios en Actividad -->
      <ion-modal :is-open="mostrarModalReporte" @didDismiss="cerrarModalReporte">
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Refuerzos: Sin Presentación o Entrega</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="cerrarModalReporte">
                <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding report-modal-content">
          <div ref="reporteRefContent">
            <!-- Encabezado del reporte -->
            <div class="report-header-card">
              <div class="report-header-info">
                <h2>Informe de Estudiantes Sin Presentación o Entrega en Refuerzos</h2>
                <p class="report-subtitle">
                  Estudiantes vinculados a clases de refuerzo que <strong>no se presentaron al quiz</strong> (sin respuestas) o <strong>no entregaron la actividad</strong> (sin criterios evaluados).
                </p>
                <div class="chips-row">
                  <ion-chip color="primary">
                    <ion-label>Año: <strong>{{ selectedYear }}</strong></ion-label>
                  </ion-chip>
                  <ion-chip color="secondary">
                    <ion-label>Período: <strong>{{ getPeriodoNombre(selectedPeriod) }}</strong></ion-label>
                  </ion-chip>
                  <ion-chip
                    v-if="!cargandoReporte"
                    :color="totalEstudiantesReporte > 0 ? 'danger' : 'success'"
                  >
                    <ion-label>
                      {{
                        totalEstudiantesReporte > 0
                          ? `${totalEstudiantesReporte} estudiante(s) con pendientes`
                          : '¡Todos al día!'
                      }}
                    </ion-label>
                  </ion-chip>
                </div>

                <!-- Filtro de Segmento -->
                <div v-if="reporteRefuerzo.length > 0" class="filter-segment no-print ion-margin-top">
                  <ion-segment v-model="filtroTipo" size="small">
                    <ion-segment-button value="todos">
                      <ion-label>Todos ({{ contadorTodos }})</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="quiz">
                      <ion-label>Quiz sin presentar ({{ contadorSinQuiz }})</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="actividad">
                      <ion-label>Actividad sin entrega ({{ contadorSinActividad }})</ion-label>
                    </ion-segment-button>
                  </ion-segment>
                </div>
              </div>

              <div class="no-print actions-bar">
                <ion-button
                  fill="outline"
                  size="small"
                  @click="consultarRefuerzos"
                  :disabled="cargandoReporte"
                >
                  <ion-icon slot="start" :icon="refreshOutline"></ion-icon>
                  Actualizar
                </ion-button>
                <ion-button
                  v-if="reporteFiltrado.length > 0"
                  fill="solid"
                  color="dark"
                  size="small"
                  @click="imprimirReporte"
                >
                  <ion-icon slot="start" :icon="printOutline"></ion-icon>
                  Imprimir
                </ion-button>
              </div>
            </div>

            <!-- Indicador de Carga -->
            <div v-if="cargandoReporte" class="loading-container ion-text-center ion-padding">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <p><strong>Verificando presentaciones de quizzes y entregas de actividades...</strong></p>
              <small class="text-muted">Revisando respuestas y criterios evaluados de refuerzo...</small>
            </div>

            <!-- Estado de Error -->
            <div v-else-if="errorReporte" class="error-container ion-padding ion-text-center">
              <ion-icon :icon="alertCircleOutline" color="danger" class="state-icon"></ion-icon>
              <p>{{ errorReporte }}</p>
              <ion-button size="small" color="primary" @click="consultarRefuerzos">Reintentar</ion-button>
            </div>

            <!-- Estado Vacío -->
            <div v-else-if="reporteFiltrado.length === 0" class="empty-state ion-padding ion-text-center">
              <ion-icon :icon="checkmarkCircleOutline" color="success" class="state-icon"></ion-icon>
              <h3>¡Excelente!</h3>
              <p>Todos los estudiantes vinculados a refuerzos se presentaron a sus quizzes y entregaron sus actividades para este período.</p>
            </div>

            <!-- Resultados Jerárquicos: Grado -> Área -> Estudiante -->
            <div v-else class="report-results">
              <div
                v-for="curso in reporteFiltrado"
                :key="curso.cursoId"
                class="course-section"
              >
                <div class="course-header">
                  <h3 class="course-title">Grado: {{ curso.cursoName }}</h3>
                  <ion-badge color="medium">{{ curso.totalEstudiantes }} estudiante(s)</ion-badge>
                </div>

                <div
                  v-for="area in curso.areas"
                  :key="area.areaId"
                  class="area-section"
                >
                  <div class="area-header">
                    <h4 class="area-title">Área: {{ area.areaName }}</h4>
                  </div>

                  <div
                    v-for="est in area.estudiantes"
                    :key="est.id"
                    class="student-card"
                  >
                    <div class="student-header">
                      <span class="student-name">
                        <strong>{{ est.apellido }} {{ est.nombre }}</strong>
                      </span>
                      <ion-badge color="danger">
                        {{ est.pendientes.length }} pendiente(s)
                      </ion-badge>
                    </div>

                    <div class="table-responsive">
                      <table class="report-table">
                        <thead>
                          <tr>
                            <th style="width: 15%;">Tipo</th>
                            <th style="width: 35%;">Elemento</th>
                            <th style="width: 25%;">Clase de Refuerzo</th>
                            <th style="width: 25%; text-align: center;">Estado / Diagnóstico</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(item, idx) in est.pendientes" :key="idx">
                            <td>
                              <span :class="'tag-type tag-' + item.tipo.toLowerCase()">
                                <ion-icon :icon="item.tipoIcon" class="tag-icon"></ion-icon>
                                {{ item.tipo }}
                              </span>
                            </td>
                            <td><strong>{{ item.titulo }}</strong></td>
                            <td>{{ item.leccion }}</td>
                            <td style="text-align: center;">
                              <span :class="'badge-' + item.badgeColor">
                                {{ item.motivo }}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import router from "../router";

import { ref, computed } from "vue";
import {
  tokenHeader,
  usuarioGet,
  selectedYear as selectedYearService,
  currentServerYear,
  periodosGet,
} from "../globalService";
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  closeOutline,
  refreshOutline,
  printOutline,
  helpCircleOutline,
  documentTextOutline,
} from "ionicons/icons";
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
  IonSelect,
  IonSelectOption,
  IonAccordionGroup,
  IonAccordion,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge,
  IonModal,
  IonSpinner,
  IonChip,
  IonSegment,
  IonSegmentButton,
} from "@ionic/vue";

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
    IonSelect,
    IonSelectOption,
    IonAccordionGroup,
    IonAccordion,
    IonButton,
    IonButtons,
    IonIcon,
    IonBadge,
    IonModal,
    IonSpinner,
    IonChip,
    IonSegment,
    IonSegmentButton,
  },
  setup() {
    const usuario = ref();
    const currentYear = selectedYearService();
    const years = ref(
      Array.from({ length: 10 }, (_, i) => currentServerYear() - i)
    );
    const selectedYear = ref(currentYear);
    const periodos = ref([]);
    const selectedPeriod = ref();

    const cursosUsuario = ref([]);

    // Estados del Reporte
    const mostrarModalReporte = ref(false);
    const cargandoReporte = ref(false);
    const errorReporte = ref(null);
    const reporteRefuerzo = ref([]);
    const filtroTipo = ref("todos"); // 'todos', 'quiz', 'actividad'

    const totalEstudiantesReporte = computed(() => {
      const studentIds = new Set();
      reporteRefuerzo.value.forEach((curso) => {
        curso.areas.forEach((area) => {
          area.estudiantes.forEach((est) => studentIds.add(est.id));
        });
      });
      return studentIds.size;
    });

    const contadorTodos = computed(() => totalEstudiantesReporte.value);

    const contadorSinQuiz = computed(() => {
      const ids = new Set();
      reporteRefuerzo.value.forEach((c) =>
        c.areas.forEach((a) =>
          a.estudiantes.forEach((e) => {
            if (e.pendientes.some((p) => p.tipo === "Quiz")) {
              ids.add(e.id);
            }
          })
        )
      );
      return ids.size;
    });

    const contadorSinActividad = computed(() => {
      const ids = new Set();
      reporteRefuerzo.value.forEach((c) =>
        c.areas.forEach((a) =>
          a.estudiantes.forEach((e) => {
            if (e.pendientes.some((p) => p.tipo === "Actividad")) {
              ids.add(e.id);
            }
          })
        )
      );
      return ids.size;
    });

    const reporteFiltrado = computed(() => {
      if (filtroTipo.value === "todos") return reporteRefuerzo.value;

      return reporteRefuerzo.value
        .map((curso) => {
          const areasFiltradas = curso.areas
            .map((area) => {
              const estudiantesFiltrados = area.estudiantes
                .map((est) => {
                  const pendientesFiltrados = est.pendientes.filter((p) => {
                    if (filtroTipo.value === "quiz") {
                      return p.tipo === "Quiz";
                    }
                    if (filtroTipo.value === "actividad") {
                      return p.tipo === "Actividad";
                    }
                    return true;
                  });
                  if (pendientesFiltrados.length > 0) {
                    return { ...est, pendientes: pendientesFiltrados };
                  }
                  return null;
                })
                .filter((e) => e !== null);

              if (estudiantesFiltrados.length > 0) {
                return { ...area, estudiantes: estudiantesFiltrados };
              }
              return null;
            })
            .filter((a) => a !== null);

          if (areasFiltradas.length > 0) {
            const totalEst = new Set();
            areasFiltradas.forEach((a) =>
              a.estudiantes.forEach((e) => totalEst.add(e.id))
            );
            return {
              ...curso,
              totalEstudiantes: totalEst.size,
              areas: areasFiltradas,
            };
          }
          return null;
        })
        .filter((c) => c !== null);
    });

    const getPeriodoNombre = (id) => {
      const p = periodos.value.find((item) => item.id === id);
      return p ? p.name : "N/A";
    };

    const onPeriodChange = () => {
      if (selectedPeriod.value) {
        localStorage.setItem(
          "periodoSelected",
          JSON.stringify(selectedPeriod.value)
        );
      }
    };

    const cargarPeriodos = async () => {
      const stored = periodosGet();
      if (stored && stored.length > 0) {
        periodos.value = stored;
      } else {
        try {
          const instId = usuario.value?.institute?.id;
          const url = instId ? `/periods?instituteId=${instId}` : "/periods";
          const res = await axios.get(url, tokenHeader());
          periodos.value = res.data || [];
        } catch (e) {
          console.error("Error al cargar períodos:", e);
        }
      }

      const storedPeriod = localStorage.getItem("periodoSelected");
      if (storedPeriod) {
        try {
          selectedPeriod.value = JSON.parse(storedPeriod);
        } catch (e) {
          selectedPeriod.value = storedPeriod;
        }
      }
      if (!selectedPeriod.value && periodos.value.length > 0) {
        selectedPeriod.value = periodos.value[0].id;
      }
    };

    onIonViewWillEnter(async () => {
      tokenHeader();
      usuario.value = usuarioGet();

      await cargarPeriodos();
      await getCursoUsuario(selectedYear.value);
    });

    const getCursoUsuario = async (year) => {
      const isAdminView = localStorage.getItem("adminView") === "true";

      if (usuario.value.rol === "admin" && isAdminView) {
        // Mode: Show EVERYTHING
        const response = await axios.get(
          `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
          tokenHeader()
        );

        cursosUsuario.value = response.data.map((curso) => ({
          id: curso.id,
          name: curso.name,
          areas: (curso.courseAreas || [])
            .filter((a) => a.active === true)
            .map((a) => a.area),
        }));
      } else {
        // Mode: Show only assignments
        const response = await axios.get(
          `/users/${usuario.value.id}/courses?year=${year}&active=true`,
          tokenHeader()
        );

        const areAAssignments = await axios
          .get(`/courses/teacher-assignments/${usuario.value.id}`)
          .then((response) => {
            return response.data.filter(
              (assignment) => assignment.active === true
            );
          });

        cursosUsuario.value = response.data.map((curso) => ({
          id: curso.course.id,
          name: curso.course.name,
          areas: isAdminView
            ? (curso.course.courseAreas || [])
                .filter((a) => a.active == true)
                .map((a) => a.area)
            : areAAssignments
                .filter((assignment) => assignment.course.id == curso.course.id)
                .map((assignment) => assignment.area),
        }));
      }

      cursosUsuario.value = cursosUsuario.value.sort(
        (a, b) => parseInt(a.name) - parseInt(b.name)
      );
    };

    const abrirReporteRefuerzo = async () => {
      mostrarModalReporte.value = true;
      await consultarRefuerzos();
    };

    const cerrarModalReporte = () => {
      mostrarModalReporte.value = false;
    };

    const imprimirReporte = () => {
      window.print();
    };

    const consultarRefuerzos = async () => {
      if (!selectedPeriod.value) {
        errorReporte.value = "Por favor seleccione un período.";
        return;
      }
      cargandoReporte.value = true;
      errorReporte.value = null;
      reporteRefuerzo.value = [];

      try {
        const instId = usuario.value?.institute?.id;
        const yearVal = selectedYear.value;
        const periodVal = selectedPeriod.value;

        // Procesar cursos concurrentemente
        const cursosPromises = cursosUsuario.value.map(async (curso) => {
          const areasConPendientes = [];

          for (const area of curso.areas) {
            // 1. Obtener lecciones de refuerzo para este curso, área, período y año
            let lessonsUrl = `/lessons?courseId=${curso.id}&areaId=${area.id}&periodId=${periodVal}&year=${yearVal}&exist=true&type=reinforcement`;
            if (instId) {
              lessonsUrl += `&instituteId=${instId}`;
            }

            const lessonsRes = await axios
              .get(lessonsUrl, tokenHeader())
              .catch(() => ({ data: [] }));
            const reinforcementLessons = lessonsRes.data || [];

            if (reinforcementLessons.length === 0) {
              continue;
            }

            // Mapa para acumular estudiantes con pendientes en esta área
            const studentsMap = new Map();

            // 2. Revisar cada lección de refuerzo
            for (const lesson of reinforcementLessons) {
              const [studentsRes, actRes, quizRes] = await Promise.all([
                axios
                  .get(`/reinforcement/lesson/${lesson.id}`, tokenHeader())
                  .catch(() => ({ data: [] })),
                axios
                  .get(`/activities?lessonId=${lesson.id}`, tokenHeader())
                  .catch(() => ({ data: [] })),
                axios
                  .get(`/quizzes?lessonId=${lesson.id}`, tokenHeader())
                  .catch(() =>
                    axios
                      .get(`/lessons/${lesson.id}/quizzes`, tokenHeader())
                      .catch(() => ({ data: [] }))
                  ),
              ]);

              const assignedStudents = (studentsRes.data || [])
                .map((r) => r.student)
                .filter((s) => !!s);

              if (assignedStudents.length === 0) continue;

              const activities = actRes.data || [];
              const quizzes = quizRes.data || [];

              if (activities.length === 0 && quizzes.length === 0) {
                continue;
              }

              // 3. Consultar en paralelo:
              // - Criterios evaluados de cada actividad (para verificar quiénes entregaron)
              // - Respuestas de cada quiz (para verificar quiénes se presentaron)
              const [activityScoresMap, quizAnswersMap] = await Promise.all([
                (async () => {
                  const map = new Map();
                  await Promise.all(
                    activities.map(async (act) => {
                      try {
                        const sRes = await axios.get(
                          `/student-criterion-scores/getAll?activityId=${act.id}`,
                          tokenHeader()
                        );
                        map.set(act.id, sRes.data || []);
                      } catch (e) {
                        map.set(act.id, []);
                      }
                    })
                  );
                  return map;
                })(),
                (async () => {
                  const map = new Map();
                  await Promise.all(
                    quizzes.map(async (quiz) => {
                      try {
                        const aRes = await axios.get(
                          `/quizzes/${quiz.id}/answers`,
                          tokenHeader()
                        );
                        map.set(quiz.id, aRes.data || []);
                      } catch (e) {
                        map.set(quiz.id, []);
                      }
                    })
                  );
                  return map;
                })(),
              ]);

              // 4. Evaluar cada estudiante asignado al refuerzo
              for (const student of assignedStudents) {
                const pendientes = [];

                // CASO 1: Quiz sin respuestas (El estudiante NO se presentó)
                for (const quiz of quizzes) {
                  const answers = quizAnswersMap.get(quiz.id) || [];
                  const presentoQuiz = answers.some(
                    (ans) => ans.user?.id === student.id
                  );

                  if (!presentoQuiz) {
                    pendientes.push({
                      tipo: "Quiz",
                      tipoIcon: helpCircleOutline,
                      titulo: quiz.title,
                      leccion: lesson.topic,
                      motivo: "No se presentó (Sin respuestas)",
                      badgeColor: "danger",
                    });
                  }
                }

                // CASO 2: Actividad sin criterios evaluados (El estudiante NO entregó)
                for (const act of activities) {
                  const scores = activityScoresMap.get(act.id) || [];
                  const tieneCriterios = scores.some(
                    (score) => score.student?.id === student.id
                  );

                  if (!tieneCriterios) {
                    pendientes.push({
                      tipo: "Actividad",
                      tipoIcon: documentTextOutline,
                      titulo: act.title,
                      leccion: lesson.topic,
                      motivo: "No entregó (Sin criterios evaluados)",
                      badgeColor: "warning",
                    });
                  }
                }

                // Si tiene al menos un quiz sin presentar o una actividad sin entrega
                if (pendientes.length > 0) {
                  if (!studentsMap.has(student.id)) {
                    studentsMap.set(student.id, {
                      id: student.id,
                      nombre: student.name,
                      apellido: student.lastName,
                      pendientes: [...pendientes],
                    });
                  } else {
                    studentsMap
                      .get(student.id)
                      .pendientes.push(...pendientes);
                  }
                }
              }
            }

            if (studentsMap.size > 0) {
              const estudiantesOrdenados = Array.from(
                studentsMap.values()
              ).sort((a, b) => {
                const apeA = (a.apellido || "").toLowerCase();
                const apeB = (b.apellido || "").toLowerCase();
                if (apeA !== apeB) return apeA.localeCompare(apeB);
                return (a.nombre || "").localeCompare(b.nombre || "");
              });

              areasConPendientes.push({
                areaId: area.id,
                areaName: area.name,
                estudiantes: estudiantesOrdenados,
              });
            }
          }

          if (areasConPendientes.length > 0) {
            areasConPendientes.sort((a, b) =>
              a.areaName.localeCompare(b.areaName)
            );
            const totalEstudiantesCurso = new Set();
            areasConPendientes.forEach((a) =>
              a.estudiantes.forEach((s) => totalEstudiantesCurso.add(s.id))
            );

            return {
              cursoId: curso.id,
              cursoName: curso.name,
              totalEstudiantes: totalEstudiantesCurso.size,
              areas: areasConPendientes,
            };
          }
          return null;
        });

        const resultados = await Promise.all(cursosPromises);
        reporteRefuerzo.value = resultados
          .filter((c) => c !== null)
          .sort((a, b) => parseInt(a.cursoName) - parseInt(b.cursoName));
      } catch (error) {
        console.error("Error al generar reporte de refuerzo:", error);
        errorReporte.value =
          "Ocurrió un error al consultar las clases de refuerzo. Intente nuevamente.";
      } finally {
        cargandoReporte.value = false;
      }
    };

    return {
      usuario,
      router,
      cursosUsuario,
      years,
      selectedYear,
      periodos,
      selectedPeriod,
      onPeriodChange,
      getCursoUsuario,
      // Reporte
      mostrarModalReporte,
      cargandoReporte,
      errorReporte,
      reporteRefuerzo,
      reporteFiltrado,
      filtroTipo,
      totalEstudiantesReporte,
      contadorTodos,
      contadorSinQuiz,
      contadorSinActividad,
      abrirReporteRefuerzo,
      cerrarModalReporte,
      consultarRefuerzos,
      imprimirReporte,
      getPeriodoNombre,
      // Icons
      alertCircleOutline,
      checkmarkCircleOutline,
      closeOutline,
      refreshOutline,
      printOutline,
      helpCircleOutline,
      documentTextOutline,
    };
  },
};
</script>

<style scoped>
.report-modal-content {
  --background: #f8f9fa;
}

.report-header-card {
  background: white;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.report-header-info {
  flex: 1;
  min-width: 280px;
}

.report-header-info h2 {
  margin: 0 0 6px 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #1a1a1a;
}

.report-subtitle {
  margin: 0 0 12px 0;
  color: #555;
  font-size: 0.92rem;
  line-height: 1.45;
}

.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-segment {
  max-width: 540px;
  margin-top: 14px;
}

.actions-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.loading-container {
  background: white;
  border-radius: 12px;
  padding: 40px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.loading-container p {
  margin-top: 15px;
  font-size: 1.1rem;
  color: #333;
}

.text-muted {
  color: #888;
}

.state-icon {
  font-size: 3.5rem;
  margin-bottom: 10px;
}

.empty-state,
.error-container {
  background: white;
  border-radius: 12px;
  padding: 40px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.empty-state h3 {
  margin: 10px 0 6px 0;
  font-weight: 700;
  color: #2e7d32;
}

.empty-state p,
.error-container p {
  color: #555;
  max-width: 500px;
  margin: 0 auto 15px auto;
  font-size: 1rem;
}

/* Secciones de Grado */
.course-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.course-header {
  background: #2b3a4a;
  color: white;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

/* Secciones de Área */
.area-section {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.area-section:last-child {
  border-bottom: none;
}

.area-header {
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.area-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c5282;
}

/* Tarjeta de Estudiante */
.student-card {
  background: #fafbfc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 14px;
  overflow: hidden;
}

.student-card:last-child {
  margin-bottom: 0;
}

.student-header {
  padding: 10px 16px;
  background: #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-name {
  font-size: 1rem;
  color: #2d3748;
}

/* Tablas */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.report-table th {
  background: #f7fafc;
  color: #4a5568;
  font-weight: 600;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.report-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #edf2f7;
  color: #2d3748;
  vertical-align: middle;
}

.report-table tr:last-child td {
  border-bottom: none;
}

/* Tags de Tipo (Quiz vs Actividad) */
.tag-type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.82rem;
  font-weight: 600;
}

.tag-icon {
  font-size: 0.95rem;
}

.tag-quiz {
  background: #f3e8ff;
  color: #6b21a8;
  border: 1px solid #e9d5ff;
}

.tag-activity {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

/* Badges de Motivo / Diagnóstico */
.badge-danger {
  display: inline-block;
  padding: 4px 10px;
  background: #fed7d7;
  color: #9b2c2c;
  border: 1px solid #feb2b2;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.8rem;
}

.badge-warning {
  display: inline-block;
  padding: 4px 10px;
  background: #fefcbf;
  color: #975a16;
  border: 1px solid #faf089;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.8rem;
}

/* Estilos de Impresión */
@media print {
  body * {
    visibility: hidden;
  }

  .report-modal-content,
  .report-modal-content * {
    visibility: visible;
  }

  .no-print {
    display: none !important;
  }

  .report-modal-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 10px;
    background: white;
    color: black;
  }

  .course-section {
    page-break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ccc;
    margin-bottom: 20px;
  }

  .student-card {
    page-break-inside: avoid;
    border: 1px solid #ccc;
  }

  .report-table th,
  .report-table td {
    border: 1px solid #ddd;
  }
}
</style>
