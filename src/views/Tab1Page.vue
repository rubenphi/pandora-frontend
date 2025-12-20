<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Grupo</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-card>
        <ion-card-header>
          <ion-card-title>Datos generales</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <strong>Usuario:</strong>
          {{ usuario?.code }} <br />
          <strong>Email:</strong>
          {{ usuario?.email }} <br />
          <strong>Nombres:</strong>
          {{ usuario?.name }} <br />
          <strong>Apellidos:</strong>
          {{ usuario?.lastName }} <br />
          <strong>institución:</strong>: {{ usuario?.institute?.name }} <br />
          <strong> Curso:</strong> {{ actualCurso?.course?.name }} <br />
        </ion-card-content>
        <ion-card>
          <ion-card-header>
            <ion-card-title>Grupo actual </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <strong>Nombre del Grupo:</strong> {{ grupoUsuario?.name }} <br />
            <strong>Integrantes:</strong>
            <ul>
              <li v-for="miembro in miembros" :key="miembro?.id">
                {{ miembro?.user?.name + " " + miembro?.user?.lastName }}
              </li>
            </ul>
          </ion-card-content>
          <ion-button fill="clear" @click="presentModal" id="open-modal">
            Cambiar de grupo&nbsp;
            <ion-icon :icon="swapHorizontalOutline"></ion-icon>
          </ion-button>
        </ion-card>
      </ion-card>
      <ion-list v-if="!finalPeriodo && !adminOProfesor">
        <ion-item>
          <ion-label>
            <h2>Notas del Grupo</h2>
          </ion-label>

          <ion-select
            v-model="periodoSelected"
            placeholder="Seleccione el periodo"
          >
            <ion-select-option
              v-for="periodo in periodos"
              :key="periodo?.id"
              :value="periodo?.id"
            >
              {{ periodo?.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Accordion for each group member -->
        <ion-accordion-group>
          <ion-accordion
            v-for="member in groupMembersWithGrades"
            :key="member.userId"
            :value="member.userId"
          >
            <ion-item slot="header">
              <ion-label>{{ member.userName }}</ion-label>
            </ion-item>
            <div slot="content">
              <ion-accordion-group
                @ionChange="handleAreaExpand($event, member)"
              >
                <ion-accordion
                  v-for="area in member.areas"
                  :key="area.id"
                  :value="area.id"
                >
                  <ion-item slot="header">
                    <ion-label>
                      <h3>{{ area?.name }}</h3>
                    </ion-label>
                    <div
                      v-if="area.loaded"
                      slot="end"
                      style="display: flex; align-items: center"
                    >
                      <ion-chip
                        :class="getGradeColorClass(area.promedio)"
                        :style="{
                          opacity: area.hasReinforcement ? '0.6' : '1',
                        }"
                      >
                        RG: {{ area.promedio }}
                      </ion-chip>
                      <span v-if="area.hasReinforcement">
                        /
                        <ion-chip
                          :class="
                            getGradeColorClass(area.promedioReinf || '1.0')
                          "
                          style="opacity: 1; font-weight: bold"
                        >
                          RF: {{ area.promedioReinf || "1.0" }}
                        </ion-chip>
                      </span>
                      <span v-if="area.hasRemedial">
                        /
                        <ion-chip
                          :class="
                            getGradeColorClass(area.promedioRemedial || '1.0')
                          "
                          style="opacity: 1; font-weight: bold"
                        >
                          NV: {{ area.promedioRemedial || "1.0" }}
                        </ion-chip>
                      </span>
                    </div>
                    <ion-spinner
                      v-else-if="area.loading"
                      name="dots"
                      slot="end"
                    ></ion-spinner>
                  </ion-item>

                  <div class="ion-padding" slot="content">
                    <div v-if="area.loading" style="text-align: center">
                      <ion-spinner name="crescent"></ion-spinner>
                      <p>Cargando notas...</p>
                    </div>
                    <div v-else-if="area.loaded">
                      <!-- Main Details Accordion Group -->
                      <ion-accordion-group>
                        <!-- 1. Notas Regulares -->
                        <ion-accordion value="regulares">
                          <ion-item slot="header">
                            <ion-label color="primary">
                              <strong>Notas Regulares</strong>
                              <ion-chip
                                :class="getGradeColorClass(area.promedio)"
                              >
                                {{ area.promedio }}
                              </ion-chip>
                            </ion-label>
                          </ion-item>
                          <div slot="content" class="ion-padding-start">
                            <div
                              v-for="dimension in area.dimensiones"
                              :key="dimension.id"
                            >
                              <ion-item lines="none" class="dimension-header">
                                <ion-label>
                                  <small>{{ dimension.name }}</small>
                                  <ion-chip
                                    size="small"
                                    :class="
                                      getGradeColorClass(dimension.promedio)
                                    "
                                  >
                                    {{ dimension.promedio }}
                                  </ion-chip>
                                </ion-label>
                              </ion-item>
                              <ion-list lines="none" style="margin-top: -10px">
                                <ion-item
                                  v-for="nota in dimension.notas"
                                  :key="nota?.id"
                                >
                                  <ion-icon
                                    :icon="easelOutline"
                                    slot="start"
                                    size="small"
                                  ></ion-icon>
                                  <ion-label>
                                    <h3>
                                      {{
                                        nota?.gradableItem?.title || nota.title
                                      }}
                                    </h3>
                                    <p :class="getGradeColorClass(nota.grade)">
                                      {{ nota.grade || "Pendiente" }}
                                    </p>
                                  </ion-label>
                                </ion-item>
                              </ion-list>
                            </div>
                          </div>
                        </ion-accordion>

                        <!-- 2. Notas de Refuerzo -->
                        <ion-accordion
                          v-if="area.hasReinforcement"
                          value="refuerzo"
                        >
                          <ion-item slot="header">
                            <ion-label color="tertiary">
                              <strong>Notas de Refuerzo</strong>
                              <ion-chip
                                size="small"
                                :class="
                                  getGradeColorClass(
                                    area.promedioReinf || '1.0'
                                  )
                                "
                              >
                                RF: {{ area.promedioReinf || "1.0" }}
                              </ion-chip>
                            </ion-label>
                          </ion-item>
                          <div slot="content" class="ion-padding-start">
                            <div
                              v-for="dimension in area.dimensiones"
                              :key="'reinf-' + dimension.id"
                            >
                              <div
                                v-if="
                                  dimension.notasReinf &&
                                  dimension.notasReinf.length > 0
                                "
                              >
                                <ion-item lines="none" class="dimension-header">
                                  <ion-label color="tertiary">
                                    <small
                                      >{{ dimension.name }} (RF:
                                      {{ dimension.promedioReinf }})</small
                                    >
                                  </ion-label>
                                </ion-item>
                                <ion-list
                                  lines="none"
                                  style="margin-top: -10px"
                                >
                                  <ion-item
                                    v-for="nota in dimension.notasReinf"
                                    :key="nota?.id"
                                  >
                                    <ion-icon
                                      :icon="easelOutline"
                                      slot="start"
                                      color="tertiary"
                                      size="small"
                                    ></ion-icon>
                                    <ion-label>
                                      <h3>{{ nota?.gradableItem?.title }}</h3>
                                      <p
                                        :class="getGradeColorClass(nota.grade)"
                                      >
                                        {{ nota.grade || "Pendiente" }}
                                      </p>
                                    </ion-label>
                                  </ion-item>
                                </ion-list>
                              </div>
                            </div>
                          </div>
                        </ion-accordion>

                        <!-- 3. Notas de Nivelación -->
                        <ion-accordion
                          v-if="area.hasRemedial"
                          value="nivelacion"
                        >
                          <ion-item slot="header">
                            <ion-label color="warning">
                              <strong>Notas de Nivelación</strong>
                              <ion-chip
                                size="small"
                                :class="
                                  getGradeColorClass(
                                    area.promedioRemedial || '1.0'
                                  )
                                "
                              >
                                NV: {{ area.promedioRemedial || "1.0" }}
                              </ion-chip>
                            </ion-label>
                          </ion-item>
                          <div slot="content" class="ion-padding-start">
                            <div
                              v-for="dimension in area.dimensiones"
                              :key="'rem-' + dimension.id"
                            >
                              <div
                                v-if="
                                  dimension.notasRemedial &&
                                  dimension.notasRemedial.length > 0
                                "
                              >
                                <ion-item lines="none" class="dimension-header">
                                  <ion-label color="warning">
                                    <small
                                      >{{ dimension.name }} (NV:
                                      {{ dimension.promedioRemedial }})</small
                                    >
                                  </ion-label>
                                </ion-item>
                                <ion-list
                                  lines="none"
                                  style="margin-top: -10px"
                                >
                                  <ion-item
                                    v-for="nota in dimension.notasRemedial"
                                    :key="nota?.id"
                                  >
                                    <ion-icon
                                      :icon="easelOutline"
                                      slot="start"
                                      color="warning"
                                      size="small"
                                    ></ion-icon>
                                    <ion-label>
                                      <h3>{{ nota?.gradableItem?.title }}</h3>
                                      <p
                                        :class="getGradeColorClass(nota.grade)"
                                      >
                                        {{ nota.grade || "Pendiente" }}
                                      </p>
                                    </ion-label>
                                  </ion-item>
                                </ion-list>
                              </div>
                            </div>
                          </div>
                        </ion-accordion>
                      </ion-accordion-group>
                    </div>
                    <div v-else style="text-align: center; color: gray">
                      <p>Seleccione este área para cargar sus notas.</p>
                    </div>
                  </div>
                </ion-accordion>
              </ion-accordion-group>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </ion-list>
      <ion-card v-else>
        <ion-card-header>
          <ion-card-title>Acceso Restringido</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          En épocas finales del curso, el acceso al perfil de estudiante está
          restringido.
        </ion-card-content>
      </ion-card>

      <ion-modal
        ref="modal"
        trigger="open-modal"
        :breakpoints="[0.3, 0.5, 1]"
        :initial-breakpoint="0.5"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="cancel()">Cancelar</ion-button>
            </ion-buttons>
            <ion-title style="text-align: center">Cambio De Grupo</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="confirm()"
                >Confirmar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-select
              label="Seleccione el nuevo grupo"
              v-model="grupo"
              placeholder="Seleccion el nuevo grupo"
            >
              <ion-select-option
                v-for="grupo in grupos"
                :key="grupo.id"
                :value="grupo.id"
              >
                {{ grupo.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label color="medium" position="floating"
              >Código de autorización</ion-label
            >
            <ion-input
              placeholder="Código de autorización"
              v-model="code"
            ></ion-input>
          </ion-item>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>
<script>
import { easelOutline, swapHorizontalOutline } from "ionicons/icons";
import axios from "axios";
import { ref, watch } from "vue";
import {
  adminOprofesor,
  periodosGet,
  selectedYear,
  tokenHeader,
  usuarioGet,
} from "../globalService";
import {
  onIonViewWillEnter,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonModal,
  IonItem,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonInput,
  IonLabel,
  IonList,
  IonAccordion,
  IonAccordionGroup,
  IonChip,
  IonSpinner,
} from "@ionic/vue";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonModal,
    IonItem,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonInput,
    IonLabel,
    IonList,
    IonAccordion,
    IonAccordionGroup,
    IonChip,
    IonSpinner,
  },

  setup() {
    const usuario = ref();
    const adminOProfesor = ref();
    const finalPeriodo = ref(false);

    const cursosUsuario = ref([]);
    const periodos = ref();
    const periodoSelected = ref(
      localStorage.getItem("periodoSelected")
        ? parseInt(localStorage.getItem("periodoSelected"), 10)
        : null
    );
    const actualCurso = ref({});
    const year = ref();
    const grupo = ref();
    const modal = ref();
    const code = ref();

    const grupoUsuario = ref();
    const groupMembersWithGrades = ref([]);

    const grupos = ref([]);
    const miembros = ref([]);

    const cancel = () => modal.value.$el.dismiss(null, "cancel");
    const presentModal = () => {};

    const confirm = () => {
      let data = {
        groupId: grupo.value,
        userId: usuario.value.id,
        code: code.value,
        year: parseInt(year.value, 10),
        active: true,
      };

      axios.post(`/users/${usuario.value.id}/groups`, data).then(() => {
        modal.value.$el.dismiss(data, "confirm");
        location.reload();
      });
    };

    const initializeGroupData = async () => {
      try {
        if (
          !actualCurso.value?.course?.id ||
          !periodoSelected.value ||
          miembros.value.length === 0
        ) {
          groupMembersWithGrades.value = [];
          return;
        }

        const areasResponse = await axios.get(
          `/courses/${actualCurso.value.course.id}/areas`,
          tokenHeader()
        );
        const areas = areasResponse.data;

        groupMembersWithGrades.value = miembros.value.map((miembro) => ({
          userId: miembro.user.id,
          userName: `${miembro.user.name} ${miembro.user.lastName}`,
          areas: areas.map((area) => ({
            id: area.id,
            name: area.name,
            loading: false,
            loaded: false,
            promedio: "-",
            promedioReinf: null,
            promedioRemedial: null,
            hasReinforcement: false,
            hasRemedial: false,
            dimensiones: [],
          })),
        }));
      } catch (err) {
        console.error("Error initializing group data:", err);
      }
    };

    const handleAreaExpand = async (ev, member) => {
      let areaId = ev.detail.value;
      if (Array.isArray(areaId)) {
        areaId = areaId.length > 0 ? areaId[areaId.length - 1] : null;
      }

      if (areaId === undefined || areaId === null || areaId === "") return;

      const area = member.areas.find((a) => String(a.id) === String(areaId));

      if (!area || area.loaded || area.loading) {
        return;
      }

      area.loading = true;

      try {
        const courseId = actualCurso.value?.course?.id;
        if (!courseId) throw new Error("Course ID not found");

        // 1. Fetch Master List
        const masterGradesUrl = `/grades?courseId=${courseId}&areaId=${area.id}&periodId=${periodoSelected.value}&year=${year.value}`;
        const masterGradesResponse = await axios.get(masterGradesUrl);
        const masterAllGrades = masterGradesResponse.data;

        const masterItemsMap = new Map();
        masterAllGrades.forEach((grade) => {
          if (grade.gradableItem && grade.gradableItem.id) {
            const uniqueKey = `${grade.gradableType}-${grade.gradableItem.id}`;
            if (!masterItemsMap.has(uniqueKey)) {
              masterItemsMap.set(uniqueKey, {
                id: grade.gradableItem.id,
                type: grade.gradableType,
                item: grade.gradableItem,
                classification: grade.classification,
              });
            }
          }
        });

        // 2. Fetch specific student grades
        const studentGradesUrl = `/grades?userId=${member.userId}&areaId=${area.id}&periodId=${periodoSelected.value}&year=${year.value}`;
        const studentGradesResponse = await axios.get(studentGradesUrl);
        const formatGradeValue = (grade) => {
          if (!grade && grade !== 0) return 0;
          return Math.floor(grade * 10) / 10;
        };
        const studentGrades = studentGradesResponse.data.map((n) => ({
          ...n,
          grade: formatGradeValue(n.grade),
        }));

        // 3. Fetch records
        const reinfUrl = `/reinforcement/by-context?courseId=${courseId}&areaId=${area.id}&periodId=${periodoSelected.value}&year=${year.value}&studentId=${member.userId}&lessonType=reinforcement`;
        const reinfResponse = await axios.get(reinfUrl, tokenHeader());
        const assignedReinfLessonIds = new Set(
          reinfResponse.data.map((r) => r.lesson?.id).filter((id) => !!id)
        );

        const remedialUrl = `/reinforcement/by-context?courseId=${courseId}&areaId=${area.id}&periodId=${periodoSelected.value}&year=${year.value}&studentId=${member.userId}&lessonType=remedial`;
        const remedialResponse = await axios.get(remedialUrl, tokenHeader());
        const assignedRemedialLessonIds = new Set(
          remedialResponse.data.map((r) => r.lesson?.id).filter((id) => !!id)
        );

        // Processing helpers
        const getStudentGradeForItem = (grades, item) => {
          return grades.find(
            (g) =>
              g.gradableType === item.type &&
              String(g.gradableItem?.id) === String(item.id)
          );
        };

        const mapToDisplayParamsWithMasterList = (grades, masterList) => {
          return masterList
            .map((masterItem) => {
              const foundGrade = getStudentGradeForItem(grades, masterItem);
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
                return {
                  id: `pending-${masterItem.type}-${masterItem.id}`,
                  gradableItem: masterItem.item,
                  gradableType: masterItem.type,
                  classification: masterItem.classification,
                  grade: null,
                  isPending: true,
                };
              }
            })
            .sort(
              (a, b) =>
                new Date(a.gradableItem.lesson?.date) -
                new Date(b.gradableItem.lesson?.date)
            );
        };

        const calculateAverageFromMasterList = (grades, masterList) => {
          if (masterList.length === 0) return 0;
          let totalScore = 0;
          masterList.forEach((masterItem) => {
            const foundGrade = getStudentGradeForItem(grades, masterItem);
            if (foundGrade) totalScore += foundGrade.grade;
          });
          const avg = totalScore / masterList.length;
          return Math.max(avg, 1.0);
        };

        const areaMasterItems = Array.from(masterItemsMap.values());
        const masterKnowledge = areaMasterItems.filter(
          (i) => i.classification === "knowledge"
        );
        const masterExecution = areaMasterItems.filter(
          (i) => i.classification === "execution"
        );
        const masterBehavior = areaMasterItems.filter(
          (i) => i.classification === "behavior"
        );

        // Reg
        const mKReg = masterKnowledge.filter(
          (i) =>
            i.item.lesson?.type !== "reinforcement" &&
            i.item.lesson?.type !== "remedial"
        );
        const mEReg = masterExecution.filter(
          (i) =>
            i.item.lesson?.type !== "reinforcement" &&
            i.item.lesson?.type !== "remedial"
        );
        const mBReg = masterBehavior.filter(
          (i) =>
            i.item.lesson?.type !== "reinforcement" &&
            i.item.lesson?.type !== "remedial"
        );

        const pKReg = calculateAverageFromMasterList(studentGrades, mKReg);
        const pEReg = calculateAverageFromMasterList(studentGrades, mEReg);
        const pBReg = calculateAverageFromMasterList(studentGrades, mBReg);

        const dimsReg = [
          mKReg.length > 0 ? pKReg : 0,
          mEReg.length > 0 ? pEReg : 0,
          mBReg.length > 0 ? pBReg : 0,
        ].filter((v) => v > 0);
        const avgReg =
          dimsReg.length > 0
            ? dimsReg.reduce((a, b) => a + b, 0) / dimsReg.length
            : 0;
        area.promedio = formatGradeValue(
          Math.max(avgReg, avgReg > 0 ? 1.0 : 0)
        ).toFixed(1);

        // Reinf
        const mKReinf = masterKnowledge.filter(
          (i) =>
            i.item.lesson?.type === "reinforcement" &&
            assignedReinfLessonIds.has(i.item.lesson?.id)
        );
        const mEReinf = masterExecution.filter(
          (i) =>
            i.item.lesson?.type === "reinforcement" &&
            assignedReinfLessonIds.has(i.item.lesson?.id)
        );
        const mBReinf = masterBehavior.filter(
          (i) =>
            i.item.lesson?.type === "reinforcement" &&
            assignedReinfLessonIds.has(i.item.lesson?.id)
        );

        area.hasReinforcement =
          mKReinf.length + mEReinf.length + mBReinf.length > 0;
        if (area.hasReinforcement) {
          const pKReinf = calculateAverageFromMasterList(
            studentGrades,
            mKReinf
          );
          const pEReinf = calculateAverageFromMasterList(
            studentGrades,
            mEReinf
          );
          const pBReinf = calculateAverageFromMasterList(
            studentGrades,
            mBReinf
          );
          const dimsReinf = [
            mKReinf.length > 0 ? pKReinf : 0,
            mEReinf.length > 0 ? pEReinf : 0,
            mBReinf.length > 0 ? pBReinf : 0,
          ].filter((v) => v > 0);
          const avgReinf =
            dimsReinf.length > 0
              ? dimsReinf.reduce((a, b) => a + b, 0) / dimsReinf.length
              : 0;
          area.promedioReinf = formatGradeValue(
            Math.max(avgReinf, avgReinf > 0 ? 1.0 : 0)
          ).toFixed(1);
        }

        // Rem
        const mKRem = masterKnowledge.filter(
          (i) =>
            i.item.lesson?.type === "remedial" &&
            assignedRemedialLessonIds.has(i.item.lesson?.id)
        );
        const mERem = masterExecution.filter(
          (i) =>
            i.item.lesson?.type === "remedial" &&
            assignedRemedialLessonIds.has(i.item.lesson?.id)
        );
        const mBRem = masterBehavior.filter(
          (i) =>
            i.item.lesson?.type === "remedial" &&
            assignedRemedialLessonIds.has(i.item.lesson?.id)
        );

        area.hasRemedial = mKRem.length + mERem.length + mBRem.length > 0;
        if (area.hasRemedial) {
          const pKRem = calculateAverageFromMasterList(studentGrades, mKRem);
          const pERem = calculateAverageFromMasterList(studentGrades, mERem);
          const pBRem = calculateAverageFromMasterList(studentGrades, mBRem);
          const dimsRem = [
            mKRem.length > 0 ? pKRem : 0,
            mERem.length > 0 ? pERem : 0,
            mBRem.length > 0 ? pBRem : 0,
          ].filter((v) => v > 0);
          const avgRem =
            dimsRem.length > 0
              ? dimsRem.reduce((a, b) => a + b, 0) / dimsRem.length
              : 0;
          area.promedioRemedial = formatGradeValue(
            Math.max(avgRem, avgRem > 0 ? 1.0 : 0)
          ).toFixed(1);
        }

        area.dimensiones = [
          {
            id: "knowledge",
            name: "Saber",
            promedio: formatGradeValue(mKReg.length > 0 ? pKReg : 0).toFixed(1),
            notas: mapToDisplayParamsWithMasterList(studentGrades, mKReg),
            promedioReinf:
              mKReinf.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mKReinf)
                  ).toFixed(1)
                : null,
            notasReinf: mapToDisplayParamsWithMasterList(
              studentGrades,
              mKReinf
            ),
            promedioRemedial:
              mKRem.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mKRem)
                  ).toFixed(1)
                : null,
            notasRemedial: mapToDisplayParamsWithMasterList(
              studentGrades,
              mKRem
            ),
          },
          {
            id: "execution",
            name: "Hacer",
            promedio: formatGradeValue(mEReg.length > 0 ? pEReg : 0).toFixed(1),
            notas: mapToDisplayParamsWithMasterList(studentGrades, mEReg),
            promedioReinf:
              mEReinf.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mEReinf)
                  ).toFixed(1)
                : null,
            notasReinf: mapToDisplayParamsWithMasterList(
              studentGrades,
              mEReinf
            ),
            promedioRemedial:
              mERem.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mERem)
                  ).toFixed(1)
                : null,
            notasRemedial: mapToDisplayParamsWithMasterList(
              studentGrades,
              mERem
            ),
          },
          {
            id: "behavior",
            name: "Ser",
            promedio: formatGradeValue(mBReg.length > 0 ? pBReg : 0).toFixed(1),
            notas: mapToDisplayParamsWithMasterList(studentGrades, mBReg),
            promedioReinf:
              mBReinf.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mBReinf)
                  ).toFixed(1)
                : null,
            notasReinf: mapToDisplayParamsWithMasterList(
              studentGrades,
              mBReinf
            ),
            promedioRemedial:
              mBRem.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mBRem)
                  ).toFixed(1)
                : null,
            notasRemedial: mapToDisplayParamsWithMasterList(
              studentGrades,
              mBRem
            ),
          },
        ];

        area.loaded = true;
      } catch (error) {
        console.error("Error loading area details:", error);
      } finally {
        area.loading = false;
      }
    };

    onIonViewWillEnter(async () => {
      adminOProfesor.value = adminOprofesor();
      year.value = Number.isNaN(parseInt(localStorage.getItem("year"), 10))
        ? selectedYear()
        : parseInt(localStorage.getItem("year"), 10);

      usuario.value = usuarioGet();
      periodos.value = periodosGet();
      if (Array.isArray(periodos.value)) {
        periodos.value.sort((a, b) => a.name.localeCompare(b.name));
      }

      cursosUsuario.value = (
        await axios.get(`/users/${usuario.value.id}/courses`)
      ).data;
      actualCurso.value = cursosUsuario.value.find((curso) => curso.active);

      tokenHeader();

      await axios.get(`/users/${usuario.value.id}/groups`).then((response) => {
        grupoUsuario.value =
          response.data.filter((g) => g.active)[0]?.group ?? null;
      });

      if (grupoUsuario.value?.id) {
        await axios
          .get(`/groups/${grupoUsuario.value.id}/${year.value}/users`)
          .then((response) => {
            miembros.value = response.data;
          });
      }

      if (!periodoSelected.value && periodos.value?.length > 0) {
        periodoSelected.value = periodos.value[0].id;
      } else {
        await initializeGroupData();
      }

      await axios
        .get(`/groups?courseId=${actualCurso.value.course.id}`)
        .then((response) => {
          grupos.value = response.data;
          if (grupoUsuario.value) {
            grupos.value = grupos.value.filter(
              (grupo) => grupo.id != grupoUsuario.value.id
            );
          }
        });
    });

    watch([periodoSelected, miembros], initializeGroupData);
    watch(periodoSelected, (newVal) => {
      const stored = localStorage.getItem("periodoSelected");
      if (newVal && String(newVal) !== String(stored)) {
        localStorage.setItem("periodoSelected", newVal);
        location.reload();
      }
    });

    const getGradeColorClass = (grade) => {
      if (grade === null || isNaN(grade) || grade === 0) return "";
      const numericGrade = parseFloat(grade);
      if (numericGrade < 3.0) return "red-grade";
      if (numericGrade >= 3.0 && numericGrade < 4.0) return "orange-grade";
      if (numericGrade >= 4.0 && numericGrade < 4.5) return "light-green-grade";
      if (numericGrade >= 4.5) return "dark-green-grade";
      return "";
    };

    return {
      usuario,
      adminOProfesor,
      finalPeriodo,
      cursosUsuario,
      periodos,
      periodoSelected,
      actualCurso,
      year,
      grupo,
      modal,
      code,
      miembros,
      groupMembersWithGrades,
      grupos,
      grupoUsuario,
      cancel,
      confirm,
      presentModal,
      easelOutline,
      swapHorizontalOutline,
      getGradeColorClass,
      handleAreaExpand,
    };
  },
};
</script>
<style scoped>
.red-grade {
  color: red !important;
  font-weight: bold;
}
.orange-grade {
  color: orange !important;
  font-weight: bold;
}
.light-green-grade {
  color: lightgreen !important;
  font-weight: bold;
}
.dark-green-grade {
  color: darkgreen !important;
  font-weight: bold;
}
</style>
