<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :router-link="backUrl">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Escáner de respuestas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div class="content-wrapper ion-padding">
        <div class="info-section">
          <h2>Respuestas escaneadas: {{ scannedCodes.length }}</h2>
          <p v-if="scannedCodes.length === 0" class="empty-message">
            No hay respuestas escaneadas aún. Presione "Escanear Marcador" para
            comenzar.
          </p>
          <p v-if="isScanning" class="processing-message">
            <ion-spinner name="dots"></ion-spinner> Procesando códigos...
          </p>
        </div>

        <ion-list>
          <ion-item v-for="(code, index) in scannedCodes" :key="index">
            <ion-label class="ion-text-wrap">
              <p class="code-number">Respuesta #{{ index + 1 }}</p>
              <h3 v-if="code.lessonQuizType === 'individual'">
                {{ code.user.name }} {{ code.user.lastName }}:
                {{ code.optionSelected.identifier }}
              </h3>
              <h3 v-else-if="code.lessonQuizType === 'group'">
                {{ code.group.name }}: {{ code.optionSelected.identifier }}
              </h3>
              <h3 v-else>
                {{ code.user.name }} {{ code.user.lastName }} (Individual):
                {{ code.optionSelected.identifier }}
              </h3>
            </ion-label>
            <ion-button
              slot="end"
              fill="clear"
              color="danger"
              @click="removeCode(index)"
            >
              <ion-icon :icon="trashOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <div class="ion-padding">
          <ion-button
            expand="block"
            @click="openScanner"
            :disabled="isScanning"
          >
            {{ isScanning ? "Procesando..." : "Escanear Marcador" }}
          </ion-button>
          <ion-button
            v-if="scannedCodes.length > 0"
            expand="block"
            fill="outline"
            color="danger"
            @click="clearCodes"
          >
            Limpiar Todo ({{ scannedCodes.length }})
          </ion-button>
          <ion-button
            expand="block"
            fill="outline"
            color="success"
            @click="submitAnswersBulk"
            :disabled="scannedCodes.length === 0 || isSubmitting"
          >
            {{ isSubmitting ? "Enviando..." : "Enviar respuestas escaneadas" }}
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>

    <!-- Toast para mostrar errores o notificaciones de batch -->
    <ion-toast
      :is-open="showToast"
      :message="toastMessage"
      :duration="3000"
      position="top"
      :color="toastColor"
      @didDismiss="showToast = false"
    ></ion-toast>

    <!-- Full-screen matrix scanner overlay -->
    <div v-if="isShowingScanner" class="scanner-overlay-container">
      <matrix-scanner
        :students="students"
        :options="scannerOptions"
        @scan-complete="onMultiScanComplete"
        @scan-submit="onMultiScanSubmit"
        @scan-cancelled="isShowingScanner = false"
      ></matrix-scanner>
    </div>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  alertController,
  IonFooter,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonToast,
  IonButtons,
  IonSpinner,
} from "@ionic/vue";

import { trashOutline, arrowBackOutline } from "ionicons/icons";
import MatrixScanner from "@/components/MatrixScanner.vue";
import axios from "axios";
import { tokenHeader, selectedYear } from "../globalService";
import { getEffectiveOptions, QUIZ_MODES } from "../utils/quizModeAdapter";

export default {
  name: "QrScannerMultiple",
  components: {
    IonPage,
    IonContent,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonFooter,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonToast,
    IonButtons,
    IonSpinner,
    MatrixScanner,
  },
  data() {
    return {
      scannedCodes: [],
      isScanning: false,
      isShowingScanner: false,
      showToast: false,
      toastMessage: "",
      toastColor: "success",
      trashOutline,
      arrowBackOutline,
      qrCount: 0,
      isSubmitting: false,
      questionId: null,
      question: null,
      lessonQuizType: "individual",
      questionCourseId: null,
      students: [],
    };
  },
  computed: {
    backUrl() {
      return `/resultado/${this.questionId}`;
    },
    scannerOptions() {
      const options = (this.question?.options || [])
        .map((option) => String(option.identifier || ""))
        .filter((option) => option.length > 0)
        .sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
        )
        .slice(0, 4);
      return options.length > 0 ? options : ["A", "B", "C", "D"];
    },
  },
  mounted() {
    this.questionId = this.$route.params.d;

    this.fetchQuestionDetails();
  },
  methods: {
    // ─── Data fetching ─────────────────────────────────────────────
    async fetchQuestionDetails() {
      try {
        tokenHeader();
        const response = await axios.get(`/questions/${this.questionId}`);
        const rawQuestion = response.data;
        const quizId =
          rawQuestion.quiz?.id || rawQuestion.lesson?.quiz?.id || null;
        const activeQuizMode = quizId
          ? sessionStorage.getItem("pandora_quiz_mode_" + quizId) ||
            QUIZ_MODES.CARDS
          : QUIZ_MODES.CARDS;

        // Adapt options so the 4 canonical options (A, B, C, D) exactly match what was projected
        const adaptedOptions = getEffectiveOptions(
          rawQuestion.options || [],
          activeQuizMode
        );

        this.question = {
          ...rawQuestion,
          options: adaptedOptions,
        };
        this.lessonQuizType =
          this.question.lesson?.quizType ||
          this.question.quiz?.quizType ||
          "individual";

        await this.fetchAndCacheQuestionCourseId();
      } catch (error) {
        console.error("Error fetching question details:", error);
        const alert = await alertController.create({
          header: "Error",
          message: "No se pudo cargar los detalles de la pregunta.",
          buttons: ["OK"],
        });
        await alert.present();
      }
    },

    async fetchAndCacheQuestionCourseId() {
      if (this.questionCourseId) return;
      try {
        const lessonId =
          this.question?.quiz?.lesson?.id ||
          this.question?.lesson?.id ||
          this.question?.quiz?.lessonId;
        if (!lessonId) return;
        const res = await axios.get(`/lessons/${lessonId}`);
        this.questionCourseId = res.data.course?.id ?? null;

        // Load the grade roster so the scanner can highlight students not yet scanned
        if (this.questionCourseId) {
          await this.fetchRoster(this.questionCourseId);
        }
      } catch (e) {
        console.error("Could not cache questionCourseId:", e);
      }
    },

    async fetchRoster(courseId) {
      if (!courseId) return;
      try {
        tokenHeader();
        const year = selectedYear();
        const res = await axios.get(
          `/courses/${courseId}/users?active=true&year=${year}`
        );
        const users = res.data || [];
        // The API returns enrollment objects { user, rol, ... }; keep the student users
        this.students = users
          .filter(
            (u) =>
              u.rol === "student" ||
              u.user?.rol === "student" ||
              u.rol === "user" ||
              u.user?.rol === "user"
          )
          .map((u) => u.user || u);
      } catch (e) {
        console.error("Error fetching grade roster:", e);
      }
    },

    // ─── Scanner lifecycle ─────────────────────────────────────────
    openScanner() {
      this.isShowingScanner = true;
    },

    async processScanCodes(rawCodes) {
      const errors = [];
      let processed = 0;
      const uniqueCodes = [];
      const seenStudents = new Set();

      for (const raw of rawCodes || []) {
        const studentKey = String(raw).split(":")[0]?.trim();
        if (!studentKey || seenStudents.has(studentKey)) continue;
        seenStudents.add(studentKey);
        uniqueCodes.push(raw);
      }

      if (uniqueCodes.length === 0) return { errors, processed };

      if (!this.questionCourseId) {
        await this.fetchAndCacheQuestionCourseId();
      }

      for (const raw of uniqueCodes) {
        const parts = raw.split(":");
        if (parts.length < 2) {
          errors.push(`Formato inválido: "${raw}"`);
          continue;
        }

        const studentCodeOrId = parts[0]?.trim();
        const opcion          = parts[1]?.trim();

        if (!studentCodeOrId || !opcion) {
          errors.push(`Datos no válidos en: "${raw}"`);
          continue;
        }

        const validOptions = this.scannerOptions;
        if (!validOptions.includes(opcion)) {
          errors.push(`Opción "${opcion}" no existe para el estudiante (${studentCodeOrId})`);
          continue;
        }

        const result = await this.processStudentCode(studentCodeOrId, opcion);
        if (result.ignored) {
          // Silently omit codes not registered in this course (false positives, etc.)
          continue;
        }
        if (result.error) {
          errors.push(result.error);
        } else if (!result.duplicate) {
          processed += 1;
        }
      }

      return { errors, processed };
    },

    // Called by MatrixScanner when the user presses "Capturar"
    // rawCodes: string[] — each entry is "{studentId}:{opcion}" e.g. "42:A"
    async onMultiScanComplete(rawCodes) {
      this.isShowingScanner = false;
      if (!rawCodes || rawCodes.length === 0) return;

      this.isScanning = true;
      let result = { errors: [], processed: 0 };
      try {
        result = await this.processScanCodes(rawCodes);
      } catch (error) {
        result.errors.push(error?.message || "No se pudieron procesar los códigos escaneados.");
      } finally {
        this.isScanning = false;
      }

      if (result.errors.length > 0) {
        const alert = await alertController.create({
          header:  `${result.errors.length} código(s) no procesado(s)`,
          message: result.errors.join("\n"),
          buttons: ["OK"],
        });
        await alert.present();
      } else if (result.processed > 0) {
        this.toastMessage = `✓ ${result.processed} código(s) procesado(s)`;
        this.toastColor   = "success";
        this.showToast    = true;
      }
    },

    async onMultiScanSubmit(rawCodes) {
      if (this.isScanning || this.isSubmitting) return;
      if (!rawCodes || rawCodes.length === 0) return;

      this.isScanning = true;
      try {
        const result = await this.processScanCodes(rawCodes);
        if (result.errors.length > 0) {
          const alert = await alertController.create({
            header:  `${result.errors.length} código(s) no procesado(s)`,
            message: result.errors.join("\n"),
            buttons: ["OK"],
          });
          await alert.present();
          return;
        }

        if (this.scannedCodes.length === 0) return;
        const submitted = await this.submitAnswersBulk();
        if (submitted) this.isShowingScanner = false;
      } catch (error) {
        const alert = await alertController.create({
          header: "Error al procesar",
          message: error?.message || "No se pudieron procesar los códigos escaneados.",
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        this.isScanning = false;
      }
    },

    // Fetches student by numeric ID OR string code, validates course enrollment and group.
    async processStudentCode(studentCodeOrId, opcion) {
      try {
        tokenHeader();
        let student = null;

        // Fast-path: check against preloaded course roster if available
        if (this.students && this.students.length > 0) {
          student = this.students.find(
            (s) =>
              String(s.id) === String(studentCodeOrId) ||
              (s.code !== null && s.code !== undefined && String(s.code) === String(studentCodeOrId))
          );
          if (!student) {
            // Silently omit false positives or codes not in this course
            return { ignored: true };
          }
        }

        // 1. Try numeric ID first if digits only
        if (!student && /^\d+$/.test(String(studentCodeOrId))) {
          try {
            const studentRes = await axios.get(`/users/${studentCodeOrId}`);
            student = studentRes.data;
          } catch (_) { /* fallback to search by code */ }
        }

        // 2. Fallback search by code property
        if (!student || !student.id) {
          const searchRes = await axios.get(`/users?code=${encodeURIComponent(studentCodeOrId)}`);
          if (searchRes.data && searchRes.data.length > 0) {
            student = searchRes.data[0];
          }
        }

        if (!student || !student.id) {
          // Code does not exist on the platform: silently omit without annoying errors
          return { ignored: true };
        }

        // Validate course enrollment
        if (this.questionCourseId) {
          const coursesRes = await axios.get(`/users/${student.id}/courses`);
          const enrollments = Array.isArray(coursesRes.data) ? coursesRes.data : [];
          const isEnrolled = enrollments.some(
            (uc) =>
              uc.active &&
              (uc.course?.id === this.questionCourseId ||
                uc.courseId === this.questionCourseId)
          );
          if (!isEnrolled) {
            // Student is registered on the platform but does not belong to this course: silently omit
            return { ignored: true };
          }
        }

        // Resolve active group (if group quiz)
        let activeGroup = { id: null, name: "" };
        if (this.lessonQuizType === "group") {
          const groupsRes = await axios.get(
            `/users/${student.id}/groups?active=true`
          );
          const activeUserToGroup = groupsRes.data.find((g) => g.active);
          if (activeUserToGroup) {
            activeGroup = activeUserToGroup.group;
          }
        }

        const isDuplicate =
          this.lessonQuizType === "individual"
            ? this.scannedCodes.some(
                (item) => String(item.user?.id) === String(student.id)
              )
            : activeGroup.id !== null &&
              activeGroup.id !== undefined &&
              this.scannedCodes.some(
                (item) => String(item.group?.id) === String(activeGroup.id)
              );

        if (isDuplicate) {
          return { success: true, duplicate: true };
        }

        // Add to scanned codes
        this.scannedCodes.unshift({
          user: {
            id:       student.id,
            name:     student.name,
            lastName: student.lastName,
          },
          group: { ...activeGroup },
          optionSelected: { identifier: opcion },
          lessonQuizType: this.lessonQuizType,
        });
        this.qrCount++;

        return { success: true };
      } catch (error) {
        console.error(`Error processing student "${studentCodeOrId}":`, error);
        return { error: `Error al procesar estudiante "${studentCodeOrId}"` };
      }
    },

    // ─── List management ───────────────────────────────────────────
    removeCode(index) {
      this.scannedCodes.splice(index, 1);
      this.qrCount--;
    },

    async clearCodes() {
      const alert = await alertController.create({
        header: "Confirmar",
        message: `¿Desea eliminar todos los ${this.scannedCodes.length} códigos escaneados?`,
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Eliminar Todo",
            role: "destructive",
            handler: () => {
              this.scannedCodes = [];
              this.qrCount      = 0;
            },
          },
        ],
      });
      await alert.present();
    },

    // ─── Submit ────────────────────────────────────────────────────
    async submitAnswersBulk() {
      if (this.isSubmitting) return false;
      if (this.scannedCodes.length === 0) {
        const alert = await alertController.create({
          header:  "Sin respuestas",
          message: "No hay ninguna respuesta escaneada para enviar.",
          buttons: ["OK"],
        });
        await alert.present();
        return false;
      }

      this.isSubmitting = true;
      try {
        const answersPayload = await Promise.all(
          this.scannedCodes.map(async (scannedCode) => {
            const option = this.question.options.find(
              (opt) => opt.identifier === scannedCode.optionSelected.identifier
            );
            if (!option) {
              throw new Error(
                `Opción "${scannedCode.optionSelected.identifier}" no encontrada en la pregunta.`
              );
            }
            return {
              optionId:    option.id,
              questionId:  this.question.id,
              quizId:
                this.question.quiz?.id || this.question.lesson?.quiz?.id,
              instituteId:
                this.question.institute?.id ||
                this.question.lesson?.institute?.id,
              userId:  scannedCode.user.id,
              groupId: scannedCode.group?.id || null,
              exist:   true,
            };
          })
        );

        await axios.post("/answers/bulk", answersPayload);

        const alert = await alertController.create({
          header:  "Éxito",
          message: "Las respuestas se han guardado correctamente.",
          buttons: [
            {
              text: "OK",
              handler: () => {
                this.scannedCodes = [];
                this.qrCount      = 0;
                this.$router.push(this.backUrl);
              },
            },
          ],
        });
        await alert.present();
        return true;
      } catch (error) {
        console.error("Error al guardar respuestas en bulk:", error);
        const message =
          error.response?.data?.message ||
          "Ocurrió un error al guardar las respuestas: " +
            JSON.stringify(error);
        const alert = await alertController.create({
          header:  "Error al Guardar",
          message: message,
          buttons: ["OK"],
        });
        await alert.present();
        return false;
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
.content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.info-section {
  padding: 20px 0;
  text-align: center;
}

.info-section h2 {
  font-size: 1.5em;
  margin-bottom: 10px;
  color: var(--ion-color-primary);
}

.empty-message {
  color: var(--ion-color-medium);
  font-size: 0.95em;
  padding: 0 20px;
}

.processing-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ion-color-primary);
  font-size: 0.95em;
}

.code-number {
  font-size: 0.85em;
  color: var(--ion-color-medium);
  margin-bottom: 5px;
}

ion-list {
  flex: 1;
  overflow-y: auto;
}

ion-item h3 {
  font-family: monospace;
  font-size: 0.9em;
  word-break: break-all;
}

ion-footer ion-button {
  margin-top: 5px;
  margin-bottom: 5px;
}

.scanner-overlay-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #000;
}
</style>
