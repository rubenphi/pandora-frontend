<template>
  <div class="evidence-container">
    <!-- File Input for document/file picker -->
    <input
      v-if="!readOnly"
      type="file"
      ref="fileInput"
      multiple
      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
      @change="onFileChange"
      style="display: none"
    />

    <!-- Camera Input for taking photos -->
    <input
      v-if="!readOnly"
      type="file"
      ref="cameraInput"
      accept="image/*"
      capture="environment"
      @change="onCameraPhotoCaptured"
      style="display: none"
    />

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state ion-padding-vertical">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
      <ion-label color="medium" class="loading-label">
        Procesando y convirtiendo archivos a PDF...
      </ion-label>
    </div>

    <!-- Physical delivery state -->
    <div
      v-else-if="evidence && evidence.pdfUrl && evidence.pdfUrl.startsWith('PHYSICAL')"
      class="evidence-actions physical-delivery-actions"
    >
      <span
        v-if="sharedStudentNames && sharedStudentNames.length > 1"
        class="qz-mini-chip qz-mini-chip--shared-physical"
        :title="'Entrega física en equipo con: ' + sharedStudentNames.join(', ')"
      >
        <ion-icon :icon="peopleOutline"></ion-icon>
        <span>Físico en Equipo ({{ sharedStudentNames.length }})</span>
      </span>
      <span v-else class="qz-mini-chip qz-mini-chip--physical">
        <ion-icon :icon="documentAttachOutline"></ion-icon>
        <span>Recibido en papel</span>
      </span>
      <div class="qz-mini-btn-group" v-if="!readOnly">
        <button
          type="button"
          class="qz-mini-btn qz-mini-btn--primary"
          @click="presentUploadOptions"
          title="Digitalizar o adjuntar fotos para esta entrega"
        >
          <ion-icon :icon="cloudUploadOutline"></ion-icon>
          <span>Digitalizar</span>
        </button>
        <button
          type="button"
          class="qz-mini-btn qz-mini-btn--danger"
          @click="confirmDelete"
          title="Retirar entrega física"
        >
          <ion-icon :icon="trashOutline"></ion-icon>
          <span>Quitar</span>
        </button>
      </div>
    </div>

    <!-- Existing digital evidence state -->
    <div v-else-if="evidence && evidence.pdfUrl" class="evidence-actions">
      <!-- Shared team evidence chip -->
      <span
        v-if="sharedStudentNames && sharedStudentNames.length > 1"
        class="qz-mini-chip qz-mini-chip--shared"
        :title="'Compartido con: ' + sharedStudentNames.join(', ')"
      >
        <ion-icon :icon="peopleOutline"></ion-icon>
        <span>Equipo ({{ sharedStudentNames.length }})</span>
      </span>
      <!-- Single digital evidence chip -->
      <span v-else :class="['qz-mini-chip', fileBadgeInfo.class]" :title="evidence.filename || 'Archivo anexo'">
        <ion-icon :icon="fileBadgeInfo.icon"></ion-icon>
        <span>{{ fileBadgeInfo.label }}</span>
      </span>

      <div class="qz-mini-btn-group">
        <button
          type="button"
          class="qz-mini-btn qz-mini-btn--primary"
          @click="viewEvidence"
          :title="isPdf ? 'Ver PDF en nueva pestaña' : 'Descargar o abrir archivo anexo'"
        >
          <ion-icon :icon="isPdf ? eyeOutline : downloadOutline"></ion-icon>
          <span>{{ isPdf ? 'Ver' : 'Abrir' }}</span>
        </button>
        <button
          v-if="!readOnly"
          type="button"
          class="qz-mini-btn qz-mini-btn--warning"
          @click="presentUploadOptions"
          title="Reemplazar archivo"
        >
          <ion-icon :icon="cloudUploadOutline"></ion-icon>
          <span>Cambiar</span>
        </button>
        <button
          v-if="!readOnly"
          type="button"
          class="qz-mini-btn qz-mini-btn--danger"
          @click="confirmDelete"
          title="Eliminar evidencia"
        >
          <ion-icon :icon="trashOutline"></ion-icon>
        </button>
      </div>
    </div>

    <!-- Empty state (No evidence yet) -->
    <div v-else-if="!readOnly" class="upload-state">
      <button
        type="button"
        class="qz-mini-upload-btn"
        @click="presentUploadOptions"
        title="Subir fotos o documentos para este estudiante"
      >
        <ion-icon :icon="cloudUploadOutline"></ion-icon>
        <span>Adjuntar evidencia</span>
      </button>
    </div>
    <div v-else class="empty-readonly-state">
      <ion-note color="medium" class="no-evidence-note">Sin archivo anexo</ion-note>
    </div>

    <!-- ── MODAL DE ENTREGA GRUPAL / INDIVIDUAL (QUEEZY UI) ── -->
    <ion-modal
      :is-open="isTeamModalOpen"
      @didDismiss="cancelTeamModal"
      class="qz-team-modal"
    >
      <div class="qz-team-modal-content">
        <!-- Header -->
        <div class="qz-team-modal-header">
          <div class="qz-team-modal-titles">
            <h3 class="qz-team-modal-title">Subir Evidencia Digital</h3>
            <p class="qz-team-modal-subtitle">
              Entrega para: <strong>{{ studentFullName }}</strong>
            </p>
          </div>
          <button type="button" class="qz-modal-close-btn" @click="cancelTeamModal">
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>

        <!-- Files info pill -->
        <div class="qz-team-files-summary">
          <ion-icon :icon="documentAttachOutline"></ion-icon>
          <span>{{ pendingFiles.length }} archivo(s) listo(s) para convertir a PDF</span>
        </div>

        <!-- Delivery mode selector -->
        <div class="qz-team-delivery-options">
          <span class="qz-team-options-label">¿CÓMO ENTREGARON ESTE TRABAJO?</span>

          <!-- 1. Opción por defecto: Entrega Individual -->
          <div
            class="qz-delivery-card"
            :class="{ 'qz-delivery-card--active': deliveryMode === 'individual' }"
            @click="setDeliveryMode('individual')"
          >
            <div class="qz-delivery-card-radio">
              <span class="qz-radio-dot" v-if="deliveryMode === 'individual'"></span>
            </div>
            <div class="qz-delivery-card-info">
              <div class="qz-delivery-card-title-row">
                <ion-icon :icon="personOutline"></ion-icon>
                <strong>Entrega Individual</strong>
                <span class="qz-badge-suggested">Por defecto</span>
              </div>
              <p class="qz-delivery-card-desc">
                Vincular este archivo únicamente a {{ studentFirstName }}.
              </p>
            </div>
          </div>

          <!-- 2. Segunda opción: Equipo del curso (si existe grupo asignado) -->
          <div
            v-if="defaultGroup"
            class="qz-delivery-card"
            :class="{ 'qz-delivery-card--active': deliveryMode === 'group' }"
            @click="setDeliveryMode('group')"
          >
            <div class="qz-delivery-card-radio">
              <span class="qz-radio-dot" v-if="deliveryMode === 'group'"></span>
            </div>
            <div class="qz-delivery-card-info">
              <div class="qz-delivery-card-title-row">
                <ion-icon :icon="peopleOutline"></ion-icon>
                <strong>Equipo del Curso: {{ defaultGroup.name }}</strong>
              </div>
              <p class="qz-delivery-card-desc">
                Integrantes ({{ defaultGroupMembers.length }}):
                {{ defaultGroupMemberNames.join(', ') }}
              </p>
            </div>
          </div>

          <!-- 3. Tercera opción: En Pareja o Grupo Libre -->
          <div
            class="qz-delivery-card"
            :class="{ 'qz-delivery-card--active': deliveryMode === 'custom' }"
            @click="setDeliveryMode('custom')"
          >
            <div class="qz-delivery-card-radio">
              <span class="qz-radio-dot" v-if="deliveryMode === 'custom'"></span>
            </div>
            <div class="qz-delivery-card-info">
              <div class="qz-delivery-card-title-row">
                <ion-icon :icon="personAddOutline"></ion-icon>
                <strong>En Pareja o Grupo Libre</strong>
              </div>
              <p class="qz-delivery-card-desc">
                Seleccionar compañeros específicos para esta entrega de hoy.
              </p>
            </div>
          </div>
        </div>

        <!-- Custom member picker (shown only in custom mode) -->
        <div v-if="deliveryMode === 'custom'" class="qz-custom-picker-section">
          <div class="qz-custom-search-wrap">
            <ion-icon :icon="searchOutline"></ion-icon>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Buscar compañero de clase..."
              class="qz-custom-search-input"
            />
          </div>

          <div class="qz-custom-members-list">
            <div
              v-for="st in filteredStudents"
              :key="st.id"
              class="qz-custom-member-item"
              :class="{
                'qz-custom-member-item--self': st.id === studentId,
                'qz-custom-member-item--selected': customSelectedIds.has(st.id),
              }"
              @click="toggleCustomStudent(st.id)"
            >
              <input
                type="checkbox"
                :checked="customSelectedIds.has(st.id)"
                :disabled="st.id === studentId"
                class="qz-member-checkbox"
                @click.stop
                @change="toggleCustomStudent(st.id)"
              />
              <span class="qz-member-name">
                {{ st.lastName || '' }} {{ st.name || '' }}
                <small v-if="st.id === studentId" class="qz-self-badge">(Entrega actual)</small>
              </span>
            </div>
          </div>
        </div>

        <!-- Modal footer buttons -->
        <div class="qz-team-modal-footer">
          <button
            type="button"
            class="qz-team-confirm-btn"
            :disabled="targetStudentIds.length === 0 || isLoading"
            @click="confirmAndUploadBatch"
          >
            <ion-icon :icon="cloudUploadOutline"></ion-icon>
            <span>
              {{
                targetStudentIds.length === 1
                  ? 'Subir para 1 estudiante'
                  : `Subir para ${targetStudentIds.length} estudiantes del equipo`
              }}
            </span>
          </button>

          <button
            type="button"
            class="qz-team-cancel-btn"
            @click="cancelTeamModal"
            :disabled="isLoading"
          >
            Cancelar
          </button>
        </div>
      </div>
    </ion-modal>

    <!-- ── MODAL DE REVISIÓN Y ROTACIÓN DE FOTOS (QUEEZY UI) ── -->
    <ion-modal
      :is-open="isPhotoModalOpen"
      @didDismiss="closePhotoModal"
      class="qz-photo-modal"
    >
      <div class="qz-photo-modal-content">
        <!-- Header -->
        <div class="qz-photo-modal-header">
          <div class="qz-photo-header-left">
            <div class="qz-photo-icon-wrap">
              <ion-icon :icon="cameraOutline"></ion-icon>
            </div>
            <div>
              <h3 class="qz-photo-title">Ajustar Fotos de Evidencia</h3>
              <p class="qz-photo-sub">Gira las fotos para que queden derechas antes de crear el PDF</p>
            </div>
          </div>
          <button type="button" class="qz-modal-close-btn" @click="closePhotoModal">
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>

        <!-- Body / Photo Cards List -->
        <div class="qz-photo-modal-body">
          <div
            v-for="(item, idx) in photoReviewItems"
            :key="item.id"
            class="qz-photo-card"
          >
            <div class="qz-photo-card-top">
              <span class="qz-photo-badge">
                <ion-icon :icon="documentTextOutline"></ion-icon>
                Página {{ idx + 1 }} de {{ photoReviewItems.length }}
              </span>
              <button
                type="button"
                class="qz-photo-delete-btn"
                title="Eliminar esta foto"
                @click="removePhotoItem(idx)"
              >
                <ion-icon :icon="trashOutline"></ion-icon>
              </button>
            </div>

            <!-- Viewport with CSS rotation -->
            <div class="qz-photo-preview-viewport">
              <img
                :src="item.previewUrl"
                :style="{
                  transform: `rotate(${item.rotation}deg)`,
                  transition: 'transform 0.22s ease-in-out',
                }"
                class="qz-photo-img"
                alt="Foto"
              />
            </div>

            <!-- Rotate Button -->
            <div class="qz-photo-card-bottom">
              <button
                type="button"
                class="qz-photo-rotate-btn"
                @click="rotateItem(item)"
              >
                <ion-icon :icon="refreshOutline"></ion-icon>
                <span>Rotar 90°</span>
                <span v-if="item.rotation !== 0" class="qz-rotation-val">
                  ({{ item.rotation }}°)
                </span>
              </button>
            </div>
          </div>

          <!-- Add Another Photo Button -->
          <div class="qz-photo-add-wrap">
            <button
              type="button"
              class="qz-photo-add-btn"
              @click="addAnotherPhoto"
            >
              <ion-icon :icon="cameraOutline"></ion-icon>
              <span>+ Tomar otra foto (Página {{ photoReviewItems.length + 1 }})</span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="qz-photo-modal-footer">
          <button
            type="button"
            class="qz-team-cancel-btn"
            @click="closePhotoModal"
            :disabled="isRotatingOrProcessing"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="qz-team-confirm-btn"
            @click="finishAndProcessPhotos"
            :disabled="isRotatingOrProcessing || photoReviewItems.length === 0"
          >
            <ion-spinner v-if="isRotatingOrProcessing" name="crescent" class="qz-btn-spinner"></ion-spinner>
            <template v-else>
              <ion-icon :icon="documentTextOutline"></ion-icon>
              <span>
                {{
                  photoReviewItems.length === 1
                    ? 'Generar PDF (1 página)'
                    : `Generar PDF (${photoReviewItems.length} páginas)`
                }}
              </span>
            </template>
          </button>
        </div>
      </div>
    </ion-modal>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { basedeURL, tokenHeader, usuarioGet } from "../globalService";
import {
  IonSpinner,
  IonLabel,
  IonIcon,
  IonNote,
  IonModal,
  alertController,
  actionSheetController,
} from "@ionic/vue";
import {
  cloudUploadOutline,
  documentTextOutline,
  documentAttachOutline,
  cameraOutline,
  closeOutline,
  eyeOutline,
  trashOutline,
  peopleOutline,
  personOutline,
  personAddOutline,
  searchOutline,
  refreshOutline,
  downloadOutline,
  gridOutline,
  easelOutline,
} from "ionicons/icons";

export default {
  name: "EvidenceUploader",
  components: {
    IonSpinner,
    IonLabel,
    IonIcon,
    IonNote,
    IonModal,
  },
  props: {
    studentId: {
      type: [Number, String],
      required: true,
    },
    student: {
      type: Object,
      default: () => ({}),
    },
    activityId: {
      type: [Number, String],
      required: true,
    },
    instituteId: {
      type: [Number, String],
      default: null,
    },
    allStudents: {
      type: Array,
      default: () => [],
    },
    defaultGroup: {
      type: Object,
      default: null,
    },
    sharedStudentNames: {
      type: Array,
      default: () => [],
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["evidence-changed", "evidence-bulk-changed", "evidence-bulk-delete"],
  setup(props, { emit }) {
    const fileInput = ref(null);
    const cameraInput = ref(null);
    const isLoading = ref(false);
    const evidence = ref(null);
    const capturedPhotos = ref([]);

    // Team delivery modal state
    const isTeamModalOpen = ref(false);
    const pendingFiles = ref([]);
    const deliveryMode = ref("individual"); // 'individual' (default) | 'group' | 'custom'
    const customSelectedIds = ref(new Set());
    const searchQuery = ref("");

    // Photo Review & Rotation modal state
    const photoReviewItems = ref([]);
    const isPhotoModalOpen = ref(false);
    const isRotatingOrProcessing = ref(false);

    const getBaseUrl = () => {
      let url = basedeURL() || "";
      if (url && !url.endsWith("/")) {
        url += "/";
      }
      return url;
    };

    const fileExtension = computed(() => {
      if (!evidence.value || !evidence.value.pdfUrl) return "";
      const url = evidence.value.pdfUrl;
      const clean = url.split("?")[0];
      const dotIdx = clean.lastIndexOf(".");
      return dotIdx !== -1 ? clean.substring(dotIdx).toLowerCase() : "";
    });

    const isPdf = computed(() => {
      return fileExtension.value === ".pdf";
    });

    const fileBadgeInfo = computed(() => {
      const ext = fileExtension.value;
      if (ext === ".pdf") {
        return {
          icon: documentTextOutline,
          label: "PDF",
          class: "qz-mini-chip--digital",
        };
      }
      if (ext === ".xlsx" || ext === ".xls" || ext === ".csv") {
        return {
          icon: gridOutline,
          label: "Excel",
          class: "qz-mini-chip--excel",
        };
      }
      if (ext === ".docx" || ext === ".doc") {
        return {
          icon: documentTextOutline,
          label: "Word",
          class: "qz-mini-chip--word",
        };
      }
      if (ext === ".pptx" || ext === ".ppt") {
        return {
          icon: easelOutline,
          label: "PowerPoint",
          class: "qz-mini-chip--ppt",
        };
      }
      return {
        icon: documentAttachOutline,
        label: ext ? ext.replace(".", "").toUpperCase() : "Anexo",
        class: "qz-mini-chip--generic",
      };
    });

    const studentFullName = computed(() => {
      const s = props.student;
      if (s && (s.name || s.lastName)) {
        return `${s.lastName || ""} ${s.name || ""}`.trim();
      }
      return `Estudiante #${props.studentId}`;
    });

    const studentFirstName = computed(() => {
      const s = props.student;
      if (s && s.name) {
        return s.name.split(/\s+/)[0];
      }
      return "el estudiante";
    });

    const defaultGroupMembers = computed(() => {
      if (!props.defaultGroup || !props.defaultGroup.usersToGroup) return [];
      return props.defaultGroup.usersToGroup
        .filter((utg) => {
          const isActive =
            utg.active === true ||
            utg.active === 1 ||
            utg.active === "true" ||
            utg.active === "1";
          return isActive && utg.user;
        })
        .map((utg) => utg.user)
        .filter(Boolean);
    });

    const defaultGroupMemberNames = computed(() => {
      return defaultGroupMembers.value.map(
        (u) => `${u.name || ""} ${u.lastName || ""}`.trim() || `Usuario #${u.id}`
      );
    });

    const filteredStudents = computed(() => {
      const list = props.allStudents || [];
      const q = (searchQuery.value || "").trim().toLowerCase();
      if (!q) return list;
      return list.filter((st) => {
        const full = `${st.name || ""} ${st.lastName || ""} ${st.code || ""}`.toLowerCase();
        return full.includes(q);
      });
    });

    const targetStudentIds = computed(() => {
      const currentId = Number(props.studentId);
      if (deliveryMode.value === "group" && props.defaultGroup) {
        const ids = defaultGroupMembers.value.map((u) => Number(u.id));
        if (!ids.includes(currentId)) ids.push(currentId);
        return ids;
      }
      if (deliveryMode.value === "custom") {
        const ids = Array.from(customSelectedIds.value).map(Number);
        if (!ids.includes(currentId)) ids.push(currentId);
        return ids;
      }
      // Individual
      return [currentId];
    });

    const fetchEvidence = async () => {
      if (!props.studentId || !props.activityId) return;
      tokenHeader();
      try {
        const response = await axios.get(
          `/activity-evidences/activity/${props.activityId}/student/${props.studentId}`
        );
        if (response.data && response.data.pdfUrl) {
          evidence.value = response.data;
        } else {
          evidence.value = null;
        }
      } catch (error) {
        console.error("Error fetching activity evidence:", error);
        evidence.value = null;
      } finally {
        emit("evidence-changed", {
          studentId: props.studentId,
          evidence: evidence.value,
        });
      }
    };

    onMounted(() => {
      fetchEvidence();
    });

    watch(
      () => [props.studentId, props.activityId],
      () => {
        fetchEvidence();
      }
    );

    const presentUploadOptions = async () => {
      capturedPhotos.value = [];
      const actionSheet = await actionSheetController.create({
        header: "Opción de Evidencia",
        buttons: [
          {
            text: "Seleccionar archivo(s) del dispositivo",
            icon: documentAttachOutline,
            handler: () => {
              triggerFileInput();
            },
          },
          {
            text: "Tomar fotos con la cámara",
            icon: cameraOutline,
            handler: () => {
              triggerCameraInput();
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

    const triggerFileInput = () => {
      if (fileInput.value) {
        fileInput.value.value = null;
        fileInput.value.click();
      }
    };

    const triggerCameraInput = () => {
      if (cameraInput.value) {
        cameraInput.value.value = null;
        cameraInput.value.click();
      }
    };

    const onFileChange = async (event) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;
      const filesArray = Array.from(selectedFiles);

      const areAllImages = filesArray.every((f) => {
        const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
        return [".jpg", ".jpeg", ".png"].includes(ext);
      });

      if (areAllImages) {
        photoReviewItems.value = filesArray.map((f, i) => ({
          id: Date.now() + i + Math.random(),
          file: f,
          previewUrl: URL.createObjectURL(f),
          rotation: 0,
        }));
        isPhotoModalOpen.value = true;
        return;
      }

      handleSelectedFiles(filesArray);
    };

    const onCameraPhotoCaptured = (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const photoFile = files[0];
      photoReviewItems.value.push({
        id: Date.now() + Math.random(),
        file: photoFile,
        previewUrl: URL.createObjectURL(photoFile),
        rotation: 0,
      });
      isPhotoModalOpen.value = true;
    };

    const addAnotherPhoto = () => {
      triggerCameraInput();
    };

    const rotateItem = (item) => {
      item.rotation = (item.rotation + 90) % 360;
    };

    const removePhotoItem = (idx) => {
      const removed = photoReviewItems.value.splice(idx, 1);
      if (removed.length > 0 && removed[0].previewUrl) {
        URL.revokeObjectURL(removed[0].previewUrl);
      }
      if (photoReviewItems.value.length === 0) {
        closePhotoModal();
      }
    };

    const closePhotoModal = () => {
      isPhotoModalOpen.value = false;
      photoReviewItems.value.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      photoReviewItems.value = [];
    };

    const rotateImageFile = async (file, degrees) => {
      const deg = ((degrees % 360) + 360) % 360;
      if (deg === 0) return file;

      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (deg === 90 || deg === 270) {
            canvas.width = img.naturalHeight || img.height;
            canvas.height = img.naturalWidth || img.width;
          } else {
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
          }

          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((deg * Math.PI) / 180);
          ctx.drawImage(
            img,
            -(img.naturalWidth || img.width) / 2,
            -(img.naturalHeight || img.height) / 2
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const rotatedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(rotatedFile);
            },
            "image/jpeg",
            0.92
          );
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(file);
        };
        img.src = url;
      });
    };

    const finishAndProcessPhotos = async () => {
      if (photoReviewItems.value.length === 0) return;
      isRotatingOrProcessing.value = true;
      try {
        const rotatedFiles = await Promise.all(
          photoReviewItems.value.map((item) =>
            rotateImageFile(item.file, item.rotation)
          )
        );
        closePhotoModal();
        handleSelectedFiles(rotatedFiles);
      } catch (err) {
        console.error("Error processing rotated photos:", err);
      } finally {
        isRotatingOrProcessing.value = false;
      }
    };

    const handleSelectedFiles = (filesArray) => {
      if (!filesArray || filesArray.length === 0) return;
      pendingFiles.value = filesArray;

      // If there are multiple students available in the course context, open the delivery modal
      if (props.allStudents && props.allStudents.length > 1) {
        // Individual delivery is the default mode
        deliveryMode.value = "individual";
        customSelectedIds.value = new Set([Number(props.studentId)]);
        searchQuery.value = "";
        isTeamModalOpen.value = true;
      } else {
        // Direct individual upload if no student list available
        uploadFilesDirectly(filesArray, [Number(props.studentId)]);
      }
    };

    const setDeliveryMode = (mode) => {
      deliveryMode.value = mode;
      if (mode === "custom") {
        if (!customSelectedIds.value.has(Number(props.studentId))) {
          customSelectedIds.value.add(Number(props.studentId));
        }
      }
    };

    const toggleCustomStudent = (sId) => {
      const numId = Number(sId);
      if (numId === Number(props.studentId)) return; // Keep current student selected
      const next = new Set(customSelectedIds.value);
      if (next.has(numId)) {
        next.delete(numId);
      } else {
        next.add(numId);
      }
      customSelectedIds.value = next;
    };

    const cancelTeamModal = () => {
      isTeamModalOpen.value = false;
      pendingFiles.value = [];
    };

    const confirmAndUploadBatch = async () => {
      const ids = targetStudentIds.value;
      if (!ids || ids.length === 0 || pendingFiles.value.length === 0) return;
      const filesToUpload = pendingFiles.value;
      isTeamModalOpen.value = false;
      pendingFiles.value = [];
      await uploadFilesDirectly(filesToUpload, ids);
    };

    const uploadFilesDirectly = async (filesArray, studentIds) => {
      if (!filesArray || filesArray.length === 0) return;

      isLoading.value = true;
      tokenHeader();

      const formData = new FormData();
      formData.append("studentIds", JSON.stringify(studentIds));
      formData.append("studentId", props.studentId);
      formData.append("activityId", props.activityId);

      const resolvedInstituteId =
        props.instituteId || usuarioGet()?.institute?.id || 1;
      formData.append("instituteId", resolvedInstituteId);

      for (let i = 0; i < filesArray.length; i++) {
        formData.append("files", filesArray[i]);
      }

      try {
        const response = await axios.post("/activity-evidences/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const savedEvidence = response.data.evidence;
        evidence.value = savedEvidence;

        if (studentIds.length > 1) {
          emit("evidence-bulk-changed", {
            studentIds,
            evidence: savedEvidence,
          });
        } else {
          emit("evidence-changed", {
            studentId: props.studentId,
            evidence: savedEvidence,
          });
        }
      } catch (error) {
        console.error("Error uploading evidence:", error);
        const alert = await alertController.create({
          header: "Error de Subida",
          message:
            error.response?.data?.message ||
            "Ocurrió un error al procesar y convertir la evidencia.",
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        isLoading.value = false;
      }
    };

    const viewEvidence = () => {
      if (
        !evidence.value ||
        !evidence.value.pdfUrl ||
        evidence.value.pdfUrl.startsWith("PHYSICAL")
      ) {
        return;
      }
      const fullUrl = getBaseUrl() + evidence.value.pdfUrl;
      window.open(fullUrl, "_blank");
    };

    const confirmDelete = async () => {
      const isPhysical = !!evidence.value?.pdfUrl?.startsWith("PHYSICAL");
      const itemType = isPhysical
        ? "entrega en físico"
        : isPdf.value
        ? "evidencia en PDF"
        : "archivo anexo";

      // Check if this delivery/evidence is shared with teammates
      if (props.sharedStudentNames && props.sharedStudentNames.length > 1) {
        const alert = await alertController.create({
          header: isPhysical ? "Entrega Física de Equipo" : "Evidencia de Equipo",
          message: `Esta ${itemType} está compartida con ${props.sharedStudentNames.length} estudiantes:\n\n${props.sharedStudentNames.join(", ")}.\n\n¿Deseas retirarla solo para este estudiante o para todo el equipo?`,
          buttons: [
            { text: "Cancelar", role: "cancel" },
            {
              text: `Solo para ${studentFirstName.value}`,
              handler: async () => {
                await deleteEvidence(false);
              },
            },
            {
              text: "Para todo el equipo",
              role: "destructive",
              handler: async () => {
                await deleteEvidence(true);
              },
            },
          ],
        });
        await alert.present();
      } else {
        const alert = await alertController.create({
          header: "Confirmar Retiro",
          message: `¿Estás seguro de que deseas retirar la ${itemType} de este estudiante?`,
          buttons: [
            { text: "Cancelar", role: "cancel" },
            {
              text: "Retirar",
              role: "destructive",
              handler: async () => {
                await deleteEvidence(false);
              },
            },
          ],
        });
        await alert.present();
      }
    };

    const deleteEvidence = async (deleteShared = false) => {
      if (!evidence.value || !evidence.value.id) return;
      isLoading.value = true;
      tokenHeader();
      const targetPdfUrl = evidence.value.pdfUrl;
      try {
        await axios.delete(
          `/activity-evidences/${evidence.value.id}?deleteShared=${deleteShared}`
        );

        if (deleteShared && props.sharedStudentNames && props.sharedStudentNames.length > 1) {
          emit("evidence-bulk-delete", {
            pdfUrl: targetPdfUrl,
            studentId: props.studentId,
          });
        } else {
          evidence.value = null;
          emit("evidence-changed", {
            studentId: props.studentId,
            evidence: null,
          });
        }
      } catch (error) {
        console.error("Error deleting evidence:", error);
      } finally {
        isLoading.value = false;
      }
    };

    return {
      fileInput,
      cameraInput,
      isLoading,
      evidence,
      isPdf,
      fileBadgeInfo,
      isTeamModalOpen,
      pendingFiles,
      deliveryMode,
      customSelectedIds,
      searchQuery,
      studentFullName,
      studentFirstName,
      defaultGroupMembers,
      defaultGroupMemberNames,
      filteredStudents,
      targetStudentIds,
      cloudUploadOutline,
      documentTextOutline,
      documentAttachOutline,
      eyeOutline,
      trashOutline,
      peopleOutline,
      personOutline,
      personAddOutline,
      searchOutline,
      closeOutline,
      cameraOutline,
      downloadOutline,
      refreshOutline,
      photoReviewItems,
      isPhotoModalOpen,
      isRotatingOrProcessing,
      addAnotherPhoto,
      rotateItem,
      removePhotoItem,
      closePhotoModal,
      finishAndProcessPhotos,
      presentUploadOptions,
      onFileChange,
      onCameraPhotoCaptured,
      setDeliveryMode,
      toggleCustomStudent,
      cancelTeamModal,
      confirmAndUploadBatch,
      viewEvidence,
      confirmDelete,
    };
  },
};
</script>

<style scoped>
.evidence-container {
  margin: 2px 0;
}
.loading-state {
  display: flex;
  align-items: center;
  gap: 6px;
}
.loading-label {
  font-size: 0.8rem;
}
.evidence-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.qz-mini-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border-radius: 9999px;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px dashed rgba(106, 90, 224, 0.4);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 10.5px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  line-height: 1;
}

.qz-mini-upload-btn:hover {
  background: #e4e1fa;
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-mini-upload-btn:active {
  transform: scale(0.96);
}

.qz-mini-upload-btn ion-icon {
  font-size: 12px;
}

.qz-mini-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 6px;
  border-radius: 9999px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.qz-mini-chip--physical {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.25);
}

.qz-mini-chip--digital {
  background: #e8f9fe;
  color: #0288d1;
  border: 1px solid rgba(2, 136, 209, 0.25);
}

.qz-mini-chip--excel {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid rgba(46, 125, 50, 0.25);
}

.qz-mini-chip--word {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid rgba(21, 101, 192, 0.25);
}

.qz-mini-chip--ppt {
  background: #fff3e0;
  color: #e65100;
  border: 1px solid rgba(230, 81, 0, 0.25);
}

.qz-mini-chip--generic {
  background: #f5f5f5;
  color: #424242;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.qz-mini-chip--shared {
  background: #ede7f6;
  color: #5e35b1;
  border: 1px solid rgba(94, 53, 177, 0.25);
}

.qz-mini-chip--shared-physical {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.35);
}

.qz-mini-btn-group {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.qz-mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 20px;
  padding: 0 6px;
  border-radius: 4px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  background: transparent;
  line-height: 1;
}

.qz-mini-btn:active {
  transform: scale(0.95);
}

.qz-mini-btn--primary {
  color: var(--ion-color-primary, #6a5ae0);
  background: rgba(106, 90, 224, 0.08);
  border-color: rgba(106, 90, 224, 0.2);
}

.qz-mini-btn--warning {
  color: #f57c00;
  background: #fff8e1;
  border-color: rgba(245, 124, 0, 0.2);
}

.qz-mini-btn--danger {
  color: #d32f2f;
  background: #ffebee;
  border-color: rgba(211, 47, 47, 0.2);
}

.upload-state {
  display: flex;
  align-items: center;
}

.empty-readonly-state {
  display: flex;
  align-items: center;
  padding: 2px 0;
}

.no-evidence-note {
  font-size: 0.78rem;
  font-style: italic;
}

/* ── MODAL QUEEZY STYLES ── */
.qz-team-modal {
  --border-radius: 18px;
  --max-width: 480px;
}

.qz-team-modal-content {
  padding: 20px 18px 24px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  color: var(--qz-color-text-title, #0c092a);
  background: var(--qz-color-card-bg, #ffffff);
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.qz-team-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.qz-team-modal-title {
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--qz-color-text-title, #0c092a);
}

.qz-team-modal-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--qz-color-text-muted, #858494);
}

.qz-modal-close-btn {
  background: transparent;
  border: none;
  font-size: 22px;
  color: var(--qz-color-text-muted, #858494);
  cursor: pointer;
  padding: 2px;
  line-height: 1;
}

.qz-team-files-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f4f3fe;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-team-options-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: var(--qz-color-text-muted, #858494);
  margin-bottom: 8px;
}

.qz-team-delivery-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.qz-delivery-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1.5px solid var(--qz-color-border, #eef0f5);
  background: var(--qz-color-card-bg, #ffffff);
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-delivery-card:hover {
  border-color: #c5bdf7;
}

.qz-delivery-card--active {
  border-color: var(--ion-color-primary, #6a5ae0);
  background: rgba(106, 90, 224, 0.04);
}

.qz-delivery-card-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #bbb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;
}

.qz-delivery-card--active .qz-delivery-card-radio {
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-radio-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--ion-color-primary, #6a5ae0);
}

.qz-delivery-card-info {
  flex: 1;
}

.qz-delivery-card-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  color: var(--qz-color-text-title, #0c092a);
  margin-bottom: 3px;
}

.qz-delivery-card-title-row ion-icon {
  font-size: 16px;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-badge-suggested {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
  background: #ede7f6;
  color: #5e35b1;
  margin-left: auto;
}

.qz-delivery-card-desc {
  margin: 0;
  font-size: 0.78rem;
  color: var(--qz-color-text-muted, #858494);
  line-height: 1.35;
}

/* Custom student picker */
.qz-custom-picker-section {
  border: 1px solid var(--qz-color-border, #eef0f5);
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 16px;
  background: #fbfbfe;
}

.qz-custom-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 6px 10px;
  margin-bottom: 8px;
}

.qz-custom-search-wrap ion-icon {
  font-size: 15px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-custom-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.82rem;
  width: 100%;
  font-family: inherit;
}

.qz-custom-members-list {
  max-height: 150px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qz-custom-member-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s ease;
  font-size: 0.8rem;
}

.qz-custom-member-item:hover {
  background: #eeeefc;
}

.qz-custom-member-item--selected {
  background: #f0edfe;
}

.qz-member-checkbox {
  width: 15px;
  height: 15px;
  accent-color: var(--ion-color-primary, #6a5ae0);
  cursor: pointer;
}

.qz-member-name {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--qz-color-text-title, #0c092a);
}

.qz-self-badge {
  font-size: 10px;
  color: var(--ion-color-primary, #6a5ae0);
  font-weight: 600;
}

/* Footer buttons */
.qz-team-modal-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.qz-team-confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 42px;
  border-radius: 12px;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
}

.qz-team-confirm-btn:hover {
  background: #5b4bd4;
}

.qz-team-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.qz-team-cancel-btn {
  width: 100%;
  height: 34px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--qz-color-text-muted, #858494);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.qz-team-cancel-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

/* ==========================================================================
   MODAL DE REVISIÓN Y ROTACIÓN DE FOTOS (QUEEZY UI)
   ========================================================================== */
.qz-photo-modal {
  --width: 94%;
  --max-width: 480px;
  --height: 85%;
  --max-height: 640px;
  --border-radius: var(--qz-radius-lg, 20px);
}

.qz-photo-modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: var(--qz-radius-lg, 20px);
  overflow: hidden;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-photo-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #faf9fd;
  border-bottom: 1px solid var(--qz-color-border, #eee);
}

.qz-photo-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-photo-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(106, 90, 224, 0.12);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-photo-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-photo-sub {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-photo-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-photo-card {
  background: #fbfaff;
  border: 1px solid rgba(106, 90, 224, 0.16);
  border-radius: 14px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-photo-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-photo-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--ion-color-primary, #6a5ae0);
  background: rgba(106, 90, 224, 0.08);
  padding: 2px 8px;
  border-radius: 6px;
}

.qz-photo-delete-btn {
  background: transparent;
  border: none;
  color: #d32f2f;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.qz-photo-delete-btn:hover {
  background: #ffebee;
}

.qz-photo-preview-viewport {
  width: 100%;
  height: 220px;
  background: #1c1b29;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.qz-photo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.qz-photo-card-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qz-photo-rotate-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1.5px solid var(--ion-color-primary, #6a5ae0);
  color: var(--ion-color-primary, #6a5ae0);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(106, 90, 224, 0.1);
}

.qz-photo-rotate-btn:active {
  transform: scale(0.96);
  background: rgba(106, 90, 224, 0.08);
}

.qz-photo-rotate-btn ion-icon {
  font-size: 16px;
}

.qz-rotation-val {
  font-size: 11px;
  color: #7b1fa2;
}

.qz-photo-add-wrap {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.qz-photo-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1.5px dashed var(--ion-color-primary, #6a5ae0);
  color: var(--ion-color-primary, #6a5ae0);
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: background 0.15s ease;
}

.qz-photo-add-btn:hover {
  background: rgba(106, 90, 224, 0.05);
}

.qz-photo-modal-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--qz-color-border, #eee);
  background: #faf9fd;
}
</style>
