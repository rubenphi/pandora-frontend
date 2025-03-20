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
            @ionChange="actualizarNotas()"
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
            <IonItem
              slot="header"
              @click="filtrarNotasEstudiante(estudiante.id)"
            >
              <IonLabel>{{
                estudiante.lastName + " " + estudiante.name
              }}</IonLabel>
            </IonItem>
            <div class="ion-padding" slot="content">
              <ion-button
                @click="mostrarModalNuevaNota(estudiante.id)"
                fill="outline"
                size="small"
              >
                <ion-icon :icon="addOutline" slot="start"></ion-icon>
                Añadir Nota
              </ion-button>
              <IonList>
                <ion-item-sliding
                  v-for="nota in notasEstudiante"
                  :key="nota?.id"
                >
                  <ion-item>
                    <ion-icon :icon="easelOutline" slot="start"></ion-icon>
                    <ion-label>
                      <h2>{{ nota?.lesson?.topic }}</h2>
                      <p v-if="nota?.grade < 3" style="color: #bf9494">
                        {{ nota?.grade }}
                      </p>
                      <p v-else>{{ nota?.grade }}</p>
                    </ion-label>
                  </ion-item>
                  <ion-item-options side="end">
                    <ion-item-option @click="editarNota(nota)" color="primary">
                      <ion-icon
                        :icon="pencilOutline"
                        slot="icon-only"
                      ></ion-icon>
                    </ion-item-option>
                  </ion-item-options>
                </ion-item-sliding>
              </IonList>
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
            >
              <ion-select-option
                v-for="leccion in lecciones"
                :key="leccion.id"
                :value="leccion.id"
              >
                {{ leccion.topic }} ({{
                  new Date(leccion.date).toLocaleDateString()
                }})
              </ion-select-option>
            </ion-select>
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
import router from "../router";

import { ref } from "vue";
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
  },
  setup() {
    const mroute = useRoute();
    const { year } = mroute.params;
    const { cursoId } = mroute.params;
    const { areaId } = mroute.params;
    const usuario = ref();
    const periodos = ref([]);
    const periodoSelected = ref();
    const notasCurso = ref([]);
    const notasEstudiante = ref([]);
    const cursosUsuario = ref([]);
    const usuariosEstudiantes = ref([]);

    // Nuevas variables para la gestión de notas
    const lecciones = ref([]);
    const mostrarModal = ref(false);
    const modoEdicion = ref(false);
    const estudianteActual = ref(null);
    const notaForm = ref({
      userId: null,
      lessonId: null,
      periodId: null,
      grade: null,
      instituteId: null,
      id: null,
      exist: false,
    });

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      periodos.value = periodosGet();
      periodoSelected.value = JSON.parse(
        localStorage.getItem("periodoSelected")
      );

      //rol student
      usuariosEstudiantes.value = (
        await axios.get(`/courses/${cursoId}/users?year=${year}`, tokenHeader())
      ).data
        .filter((estudiante) => estudiante.rol === "student")
        .map((estudiante) => estudiante.user);

      await getNotas(periodoSelected.value);
    });

    const getNotas = async () => {
      localStorage.setItem(
        "periodoSelected",
        JSON.stringify(periodoSelected.value)
      );

      notasCurso.value = (
        await axios.get(
          `/grades?year=${year}&courseId=${cursoId}&areaId=${areaId}&periodId=${periodoSelected.value}&instituteId=${usuario.value.institute.id}`,
          tokenHeader()
        )
      ).data;
    };

    const actualizarNotas = async () => {
      await getNotas();
      location.reload();
    };

    const filtrarNotasEstudiante = (estudianteId) => {
      notasEstudiante.value = notasCurso.value
        .filter((nota) => nota?.user?.id === estudianteId)
        .map((nota) => {
          return {
            ...nota,
            grade: nota.grade.toFixed(1),
          };
        })
        .sort((a, b) => {
          return new Date(a.lesson.date) - new Date(b.lesson.date);
        });
    };

    // Funciones para manejar la creación/edición de notas
    const mostrarModalNuevaNota = async (estudianteId) => {
      estudianteActual.value = estudianteId;
      modoEdicion.value = false;

      // Resetear el formulario
      notaForm.value = {
        userId: estudianteId,
        lessonId: null,
        periodId: periodoSelected.value,
        grade: null,
        instituteId: usuario.value.institute.id,
        exist: false,
      };

      // Cargar las lecciones disponibles
      await cargarLecciones();
      mostrarModal.value = true;
    };

    const editarNota = async (nota) => {
      modoEdicion.value = true;
      estudianteActual.value = nota.user.id;

      // Preparar el formulario con los datos de la nota
      notaForm.value = {
        userId: nota.user.id,
        lessonId: nota.lesson.id,
        periodId: periodoSelected.value,
        grade: parseFloat(nota.grade),
        instituteId: usuario.value.institute.id,
        id: nota.id,
        exist: true,
      };

      // Cargar las lecciones disponibles
      await cargarLecciones();
      mostrarModal.value = true;
    };

    const cargarLecciones = async () => {
      try {
        const response = await axios.get(
          `/lessons?courseId=${cursoId}&periodId=${periodoSelected.value}&year=${year}&areaId=${areaId}&instituteId=${usuario.value.institute.id}`,
          tokenHeader()
        );
        lecciones.value = response.data;
      } catch (error) {
        console.error("Error al cargar las lecciones:", error);
      }
    };

    const guardarNota = async () => {
      try {
        if (modoEdicion.value) {
          // Actualizar nota existente
          await axios.patch(
            `/grades/${notaForm.value.id}`,
            {
              userId: notaForm.value.userId,
              lessonId: notaForm.value.lessonId,
              periodId: notaForm.value.periodId,
              grade: parseFloat(notaForm.value.grade),
              instituteId: notaForm.value.instituteId,
              exist: true,
            },
            tokenHeader()
          );
        } else {
          // Crear nueva nota
          await axios.post(
            "/grades",
            {
              userId: notaForm.value.userId,
              lessonId: notaForm.value.lessonId,
              periodId: notaForm.value.periodId,
              grade: parseFloat(notaForm.value.grade),
              instituteId: notaForm.value.instituteId,
            },
            tokenHeader()
          );
        }

        // Actualizar las notas y cerrar el modal
        await getNotas();
        if (estudianteActual.value) {
          filtrarNotasEstudiante(estudianteActual.value);
        }
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
      router,
      cursosUsuario,
      periodos,
      periodoSelected,
      notasCurso,
      notasEstudiante,
      easelOutline,
      addOutline,
      pencilOutline,
      getNotas,
      actualizarNotas,
      filtrarNotasEstudiante,
      // Nuevas funciones y variables
      mostrarModal,
      modoEdicion,
      lecciones,
      notaForm,
      mostrarModalNuevaNota,
      editarNota,
      guardarNota,
      cerrarModal,
    };
  },
};
</script>
