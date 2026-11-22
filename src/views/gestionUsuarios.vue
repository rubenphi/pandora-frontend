<template>
  <ion-page class="qz-users-page">
    <ion-content :fullscreen="true" class="qz-users-content">
      <div class="qz-users-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <div class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top-row">
              <button class="qz-back-btn" @click="router.push('/admin/panel')">
                <ion-icon :icon="arrowBackOutline"></ion-icon>
              </button>
              <span class="qz-hero-tag">ADMINISTRACIÓN ACADÉMICA</span>
            </div>

            <div class="qz-hero-title-row">
              <div>
                <h1 class="qz-hero-title">Gestión de Usuarios</h1>
                <p class="qz-hero-subtitle">
                  Administra matrículas de estudiantes, planta docente y
                  asignaciones por curso
                </p>
              </div>

              <!-- Botón rápido Importar Usuarios (Solo Privilegiados) -->
              <button
                v-if="isPrivilegedUser"
                class="qz-import-btn"
                @click="router.push('/admin/importar-usuarios')"
              >
                <ion-icon :icon="personAddOutline"></ion-icon>
                <span>Importar Usuarios</span>
              </button>
            </div>

            <!-- Selector de Año Lectivo Centralizado -->
            <div class="qz-year-pill-container">
              <span class="qz-year-label">AÑO LECTIVO:</span>
              <div class="qz-year-select-wrap">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <select
                  v-model="selectedYear"
                  class="qz-year-select"
                  @change="onYearChange"
                >
                  <option v-for="year in years" :key="year" :value="year">
                    {{ year }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="qz-users-body">
          <!-- 2. SEGMENT CONTROL QUEEZY (3 PESTAÑAS) -->
          <div class="qz-tabs-container">
            <button
              class="qz-tab-btn"
              :class="{ 'qz-tab-btn--active': activeTab === 'courses' }"
              @click="switchTab('courses')"
            >
              <ion-icon :icon="schoolOutline"></ion-icon>
              <span class="qz-tab-label">
                <span class="qz-tab-label--full">Cursos y Estudiantes</span>
                <span class="qz-tab-label--short">Cursos</span>
              </span>
            </button>

            <button
              v-if="isPrivilegedUser"
              class="qz-tab-btn"
              :class="{ 'qz-tab-btn--active': activeTab === 'teachers' }"
              @click="switchTab('teachers')"
            >
              <ion-icon :icon="peopleOutline"></ion-icon>
              <span class="qz-tab-label">
                <span class="qz-tab-label--full">Planta Docente</span>
                <span class="qz-tab-label--short">Docentes</span>
              </span>
            </button>

            <button
              v-if="isPrivilegedUser"
              class="qz-tab-btn"
              :class="{ 'qz-tab-btn--active': activeTab === 'unassigned' }"
              @click="switchTab('unassigned')"
            >
              <ion-icon :icon="swapHorizontalOutline"></ion-icon>
              <span class="qz-tab-label">
                <span class="qz-tab-label--full">Sin Asignar / En Espera</span>
                <span class="qz-tab-label--short">En Espera</span>
              </span>
              <span class="qz-tab-badge" v-if="unassignedCount > 0">{{
                unassignedCount
              }}</span>
            </button>
          </div>

          <!-- =============================================================== -->
          <!-- PESTAÑA 1: CURSOS Y ESTUDIANTES                                 -->
          <!-- =============================================================== -->
          <div v-if="activeTab === 'courses'" class="qz-tab-content">
            <!-- Barra de Búsqueda de Cursos / Estudiantes -->
            <div class="qz-search-bar-wrap">
              <ion-icon :icon="searchOutline" class="qz-search-icon"></ion-icon>
              <input
                v-model="courseSearchQuery"
                type="text"
                placeholder="Buscar por curso o nombre de estudiante..."
                class="qz-search-input"
              />
            </div>

            <!-- Listado de Cursos Activos -->
            <div class="qz-courses-list">
              <div
                v-for="curso in filteredCursos"
                :key="curso.id"
                class="qz-course-card"
                :class="{
                  'qz-course-card--expanded': expandedCourseId === curso.id,
                }"
              >
                <!-- Encabezado de la Tarjeta del Curso -->
                <div class="qz-course-card-header" @click="toggleCourse(curso)">
                  <div class="qz-course-header-left">
                    <div class="qz-course-icon-squircle">
                      <ion-icon :icon="schoolOutline"></ion-icon>
                    </div>
                    <div>
                      <h3 class="qz-course-name">Curso {{ curso.name }}</h3>
                      <span class="qz-course-sub">
                        <template
                          v-if="
                            loadingCourseUsers && expandedCourseId === curso.id
                          "
                        >
                          Cargando datos...
                        </template>
                        <template v-else-if="expandedCourseId === curso.id">
                          {{ usersCourse.length }} estudiante(s) asignado(s)
                        </template>
                        <template v-else>
                          Toca para gestionar estudiantes y docentes
                        </template>
                      </span>
                    </div>
                  </div>

                  <div class="qz-course-header-actions" @click.stop>
                    <button
                      v-if="isPrivilegedUser && curso.id !== 0"
                      class="qz-course-action-btn"
                      title="Traslado Múltiple de Estudiantes"
                      @click="openBulkAssignModal(curso)"
                    >
                      <ion-icon :icon="swapHorizontalOutline"></ion-icon>
                      <span class="qz-hide-mobile">Traslado Masivo</span>
                    </button>

                    <button
                      class="qz-course-toggle-btn"
                      @click.stop="toggleCourse(curso)"
                    >
                      <ion-icon
                        :icon="
                          expandedCourseId === curso.id
                            ? chevronUpOutline
                            : chevronDownOutline
                        "
                      ></ion-icon>
                    </button>
                  </div>
                </div>

                <!-- Contenido Expandido del Curso: Lista de Estudiantes -->
                <div
                  v-if="expandedCourseId === curso.id"
                  class="qz-course-card-body"
                >
                  <div class="qz-course-students-pane">
                    <div v-if="loadingCourseUsers" class="qz-loading-box">
                      <ion-spinner
                        name="crescent"
                        color="primary"
                      ></ion-spinner>
                      <span>Cargando estudiantes matriculados...</span>
                    </div>

                    <div
                      v-else-if="usersCourse.length === 0"
                      class="qz-empty-box"
                    >
                      <ion-icon :icon="peopleOutline"></ion-icon>
                      <p>
                        Este curso no tiene estudiantes asignados en
                        {{ selectedYear }}.
                      </p>
                    </div>

                    <div v-else class="qz-user-cards-grid">
                      <div
                        v-for="(user, idx) in filteredCourseUsers"
                        :key="user.id"
                        class="qz-user-row-card"
                      >
                        <div class="qz-user-avatar-squircle">
                          {{ getInitials(user) }}
                        </div>

                        <div class="qz-user-info-col">
                          <h4 class="qz-user-fullname">
                            {{ idx + 1 }}. {{ user.lastName }} {{ user.name }}
                          </h4>
                          <div class="qz-user-meta-tags">
                            <span
                              class="qz-user-role-badge"
                              :class="getRoleBadgeClass(user)"
                            >
                              {{ getRoleLabel(user) }}
                            </span>
                            <span class="qz-user-code" v-if="user.code">
                              Cód: {{ user.code }}
                            </span>
                          </div>
                        </div>

                        <!-- Acciones del Usuario -->
                        <div class="qz-user-actions-row">
                          <button
                            v-if="canManage(user)"
                            class="qz-user-icon-btn qz-btn--reassign"
                            title="Cambiar de curso / grupo"
                            @click="openModal(user)"
                          >
                            <ion-icon :icon="swapHorizontalOutline"></ion-icon>
                          </button>

                          <button
                            v-if="canManage(user)"
                            class="qz-user-icon-btn qz-btn--edit"
                            title="Editar datos del usuario"
                            @click="
                              router.push(
                                `/admin/actualizar/usuarios/${user.id}`,
                              )
                            "
                          >
                            <ion-icon :icon="createOutline"></ion-icon>
                          </button>

                          <button
                            v-if="canManage(user)"
                            class="qz-user-icon-btn qz-btn--delete"
                            title="Desvincular de este curso"
                            @click="deactivateUser(user)"
                          >
                            <ion-icon :icon="trashOutline"></ion-icon>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- =============================================================== -->
          <!-- PESTAÑA 2: PLANTA DOCENTE                                       -->
          <!-- =============================================================== -->
          <div v-if="activeTab === 'teachers'" class="qz-tab-content">
            <div class="qz-search-bar-wrap">
              <ion-icon :icon="searchOutline" class="qz-search-icon"></ion-icon>
              <input
                v-model="teacherSearchQuery"
                type="text"
                placeholder="Buscar profesor por nombre, apellido o código..."
                class="qz-search-input"
              />
            </div>

            <div v-if="loadingTeachers" class="qz-loading-box">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <span>Cargando directorio docente...</span>
            </div>

            <div v-else-if="filteredTeachers.length === 0" class="qz-empty-box">
              <ion-icon :icon="peopleOutline"></ion-icon>
              <p>No se encontraron profesores registrados en la búsqueda.</p>
            </div>

            <div v-else class="qz-teachers-grid">
              <div
                v-for="teacher in filteredTeachers"
                :key="teacher.id"
                class="qz-teacher-card"
              >
                <div class="qz-teacher-card-top">
                  <div class="qz-teacher-avatar">
                    {{ getInitials(teacher) }}
                  </div>
                  <div class="qz-teacher-details">
                    <h4 class="qz-teacher-name">
                      {{ teacher.lastName }} {{ teacher.name }}
                    </h4>
                    <span class="qz-teacher-code" v-if="teacher.code"
                      >Cód: {{ teacher.code }}</span
                    >
                    <span class="qz-teacher-role-tag">{{
                      getRoleLabel(teacher)
                    }}</span>
                  </div>
                </div>

                <div class="qz-teacher-actions">
                  <button
                    class="qz-teacher-btn qz-btn--assign-work"
                    @click="openModal(teacher)"
                  >
                    <ion-icon :icon="schoolOutline"></ion-icon>
                    <span>Asignar Carga</span>
                  </button>

                  <button
                    class="qz-teacher-btn qz-btn--edit-profile"
                    @click="
                      router.push(`/admin/actualizar/usuarios/${teacher.id}`)
                    "
                  >
                    <ion-icon :icon="createOutline"></ion-icon>
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- =============================================================== -->
          <!-- PESTAÑA 3: SIN CURSO / EN ESPERA                                -->
          <!-- =============================================================== -->
          <div v-if="activeTab === 'unassigned'" class="qz-tab-content">
            <div class="qz-unassigned-banner">
              <div class="qz-banner-icon">
                <ion-icon :icon="swapHorizontalOutline"></ion-icon>
              </div>
              <div>
                <h4 class="qz-banner-title">Usuarios Sin Curso Asignado</h4>
                <p class="qz-banner-desc">
                  Estudiantes y usuarios registrados en la plataforma que no
                  están matriculados en ningún curso para el año
                  {{ selectedYear }}.
                </p>
              </div>
            </div>

            <div class="qz-search-bar-wrap">
              <ion-icon :icon="searchOutline" class="qz-search-icon"></ion-icon>
              <input
                v-model="unassignedSearchQuery"
                type="text"
                placeholder="Buscar por nombre o documento..."
                class="qz-search-input"
              />
            </div>

            <div v-if="loadingUnassigned" class="qz-loading-box">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <span>Consultando usuarios sin curso...</span>
            </div>

            <div
              v-else-if="filteredUnassignedUsers.length === 0"
              class="qz-empty-box"
            >
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              <p>
                ¡Excelente! No hay usuarios pendientes por asignar en el año
                {{ selectedYear }}.
              </p>
            </div>

            <div v-else class="qz-unassigned-grid">
              <div
                v-for="(user, idx) in filteredUnassignedUsers"
                :key="user.id"
                class="qz-unassigned-card"
              >
                <div class="qz-user-avatar-squircle">
                  {{ getInitials(user) }}
                </div>

                <div class="qz-user-info-col">
                  <h4 class="qz-user-fullname">
                    {{ idx + 1 }}. {{ user.lastName }} {{ user.name }}
                  </h4>
                  <div class="qz-user-meta-tags">
                    <span
                      class="qz-user-role-badge"
                      :class="getRoleBadgeClass(user)"
                    >
                      {{ getRoleLabel(user) }}
                    </span>
                    <span class="qz-user-code" v-if="user.code"
                      >Cód: {{ user.code }}</span
                    >
                  </div>
                </div>

                <button class="qz-assign-course-btn" @click="openModal(user)">
                  <ion-icon :icon="schoolOutline"></ion-icon>
                  <span>Matricular</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- =============================================================== -->
      <!-- MODAL 1: ASIGNAR CURSO Y GRUPO (INDIVIDUAL)                     -->
      <!-- =============================================================== -->
      <ion-modal
        :is-open="isModalOpen"
        @didDismiss="closeModal"
        :breakpoints="[0.4, 0.7, 0.95]"
        :initial-breakpoint="0.7"
        class="qz-modal-modern"
      >
        <div class="qz-modal-container">
          <div class="qz-modal-header">
            <div>
              <span class="qz-modal-tag">MATRÍCULA Y ASIGNACIÓN</span>
              <h3 class="qz-modal-title">Asignar Curso y Grupo</h3>
            </div>
            <button class="qz-modal-close-btn" @click="closeModal">✕</button>
          </div>

          <div class="qz-modal-body" v-if="selectedUser">
            <!-- Tarjeta Resumen del Usuario Seleccionado -->
            <div class="qz-selected-user-card">
              <div class="qz-user-avatar-squircle">
                {{ getInitials(selectedUser) }}
              </div>
              <div>
                <h4 class="qz-user-fullname">
                  {{ selectedUser.lastName }} {{ selectedUser.name }}
                </h4>
                <p class="qz-user-sub">
                  Rol actual:
                  <strong>{{ getRoleLabel(selectedUser) }}</strong> · Código:
                  {{ selectedUser.code || "N/A" }}
                </p>
              </div>
            </div>

            <!-- Campos del Formulario -->
            <div class="qz-modal-form">
              <!-- Año de Asignación -->
              <div class="qz-field-group">
                <label class="qz-field-label">Año Lectivo</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="calendarOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <select
                    v-model="selectedYearForAssignment"
                    class="qz-native-select"
                  >
                    <option v-for="y in years" :key="y" :value="y">
                      {{ y }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Curso Destino -->
              <div class="qz-field-group">
                <label class="qz-field-label">Curso Destino</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="schoolOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <select
                    v-model="selectedCourseId"
                    class="qz-native-select"
                    @change="getGruposCurso"
                  >
                    <option :value="null" disabled>
                      Seleccione un curso...
                    </option>
                    <option
                      v-for="curso in availableCourses"
                      :key="curso.id"
                      :value="curso.id"
                    >
                      {{ curso.name }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Rol en el Curso -->
              <div class="qz-field-group">
                <label class="qz-field-label">Rol Asignado</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="peopleOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <select v-model="rolSelected" class="qz-native-select">
                    <option
                      v-for="rol in availableRoles"
                      :key="rol.rol"
                      :value="rol.rol"
                    >
                      {{ rol.titulo }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Grupo Destino (Si es estudiante) -->
              <div class="qz-field-group" v-if="rolSelected === 'student'">
                <label class="qz-field-label">Grupo (Opcional)</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="layersOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <select
                    v-model="selectedGroupId"
                    class="qz-native-select"
                    :disabled="
                      !selectedCourseId || gruposCursoDestino.length === 0
                    "
                  >
                    <option :value="null">Sin grupo asignado</option>
                    <option
                      v-for="grupo in gruposCursoDestino"
                      :key="grupo.id"
                      :value="grupo.id"
                    >
                      Grupo {{ grupo.name }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Áreas para Docentes/Admins -->
              <div
                v-if="
                  selectedCourseId &&
                  selectedCourseId != 0 &&
                  (rolSelected === 'teacher' || rolSelected === 'admin')
                "
                class="qz-areas-selection-box"
              >
                <h5 class="qz-areas-select-title">
                  Áreas que dictará en este curso:
                </h5>
                <div
                  v-if="currentCourseAreas.length === 0"
                  class="qz-empty-desc"
                >
                  Este curso no tiene áreas asignadas.
                </div>
                <div v-else class="qz-checkboxes-grid">
                  <label
                    v-for="area in currentCourseAreas"
                    :key="area.id"
                    class="qz-checkbox-item"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedAreas[area.id]"
                      @change="selectedAreas[area.id] = $event.target.checked"
                    />
                    <span>{{ area.name }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Botones de Acción del Modal -->
            <div class="qz-modal-footer">
              <button class="qz-modal-btn qz-btn--cancel" @click="closeModal">
                Cancelar
              </button>
              <button
                class="qz-modal-btn qz-btn--confirm"
                :disabled="!selectedCourseId"
                @click="asignarUsuario"
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      </ion-modal>

      <!-- =============================================================== -->
      <!-- MODAL 2: ASIGNACIÓN MÚLTIPLE / TRASLADO MASIVO                  -->
      <!-- =============================================================== -->
      <ion-modal
        :is-open="isBulkAssignModalOpen"
        @didDismiss="closeBulkAssignModal"
        :breakpoints="[0.5, 0.85, 1]"
        :initial-breakpoint="0.85"
        class="qz-modal-modern"
      >
        <div class="qz-modal-container">
          <div class="qz-modal-header">
            <div>
              <span class="qz-modal-tag">TRASLADO MASIVO</span>
              <h3 class="qz-modal-title">
                Mover Estudiantes de {{ sourceCourseForBulk?.name }}
              </h3>
            </div>
            <button class="qz-modal-close-btn" @click="closeBulkAssignModal">
              ✕
            </button>
          </div>

          <div class="qz-modal-body">
            <div class="qz-filters-grid">
              <div class="qz-field-group">
                <label class="qz-field-label">Año Destino</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="calendarOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <select
                    v-model="selectedYearForBulk"
                    class="qz-native-select"
                  >
                    <option v-for="y in years" :key="y" :value="y">
                      {{ y }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="qz-field-group">
                <label class="qz-field-label">Curso Destino</label>
                <div class="qz-select-wrapper">
                  <ion-icon
                    :icon="schoolOutline"
                    class="qz-field-icon"
                  ></ion-icon>
                  <select v-model="selectedCourseId" class="qz-native-select">
                    <option :value="null" disabled>Seleccione curso...</option>
                    <option
                      v-for="curso in cursosInstituto.filter(
                        (c) => c.id !== sourceCourseForBulk?.id && c.id !== 0,
                      )"
                      :key="curso.id"
                      :value="curso.id"
                    >
                      Curso {{ curso.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Cabecera de Selección Múltiple -->
            <div class="qz-bulk-select-header">
              <label class="qz-select-all-label">
                <input
                  type="checkbox"
                  :checked="
                    selectedStudents.length === studentsForBulkAssign.length &&
                    studentsForBulkAssign.length > 0
                  "
                  @change="toggleSelectAllNative($event)"
                />
                <span
                  >Seleccionar Todos ({{
                    studentsForBulkAssign.length
                  }}
                  alumnos)</span
                >
              </label>
              <span class="qz-selected-count-badge">
                {{ selectedStudents.length }} seleccionados
              </span>
            </div>

            <!-- Lista de Estudiantes con Checkbox -->
            <div class="qz-bulk-students-list">
              <div
                v-for="student in studentsForBulkAssign"
                :key="student.id"
                class="qz-bulk-student-row"
                :class="{
                  'qz-bulk-student-row--selected': selectedStudents.includes(
                    student.id,
                  ),
                }"
                @click="toggleStudentSelection(student.id)"
              >
                <input
                  type="checkbox"
                  :checked="selectedStudents.includes(student.id)"
                  @click.stop
                  @change="toggleStudentSelection(student.id)"
                />
                <div class="qz-user-avatar-squircle qz-avatar--sm">
                  {{ getInitials(student) }}
                </div>
                <span class="qz-bulk-student-name">
                  {{ student.lastName }} {{ student.name }}
                </span>
                <span class="qz-user-code" v-if="student.code">
                  Cód: {{ student.code }}
                </span>
              </div>
            </div>

            <!-- Botones Modal Masivo -->
            <div class="qz-modal-footer">
              <button
                class="qz-modal-btn qz-btn--cancel"
                @click="closeBulkAssignModal"
              >
                Cancelar
              </button>
              <button
                class="qz-modal-btn qz-btn--confirm"
                :disabled="!selectedCourseId || selectedStudents.length === 0"
                @click="confirmBulkAssign"
              >
                Trasladar {{ selectedStudents.length }} Estudiante(s)
              </button>
            </div>
          </div>
        </div>
      </ion-modal>

      <!-- MODAL 3: MODAL DE ASIGNACIÓN DOCENTE IMPORTADO -->
      <TeacherAssignmentModal
        :is-open="isTeacherAssignmentModalOpen"
        :selected-user="selectedUser"
        @didDismiss="isTeacherAssignmentModalOpen = false"
        @confirm="
          isTeacherAssignmentModalOpen = false;
          refreshCurrentView();
        "
      ></TeacherAssignmentModal>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { useRouter } from "vue-router";
import { ref, computed } from "vue";
import TeacherAssignmentModal from "../components/TeacherAssignmentModal.vue";
import { tokenHeader, usuarioGet, currentServerYear } from "../globalService";

import {
  IonPage,
  IonContent,
  IonModal,
  IonIcon,
  IonSpinner,
  alertController,
  loadingController,
  onIonViewWillEnter,
} from "@ionic/vue";

import {
  arrowBackOutline,
  calendarOutline,
  schoolOutline,
  peopleOutline,
  personAddOutline,
  swapHorizontalOutline,
  searchOutline,
  createOutline,
  trashOutline,
  layersOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  chevronUpOutline,
} from "ionicons/icons";

const AssignmentType = {
  COURSE: "COURSE",
  GROUP: "GROUP",
};

export default {
  name: "GestionUsuarios",
  components: {
    IonPage,
    IonContent,
    IonModal,
    IonIcon,
    IonSpinner,
    TeacherAssignmentModal,
  },
  setup() {
    const router = useRouter();
    const usuario = ref(usuarioGet() || {});
    const curServerYear = currentServerYear();
    const years = ref(
      Array.from({ length: 8 }, (_, i) => curServerYear - i + 1),
    );
    const selectedYear = ref(curServerYear);
    const selectedYearForBulk = ref(curServerYear);
    const selectedYearForAssignment = ref(curServerYear);

    // Navegación por pestañas
    const activeTab = ref("courses"); // 'courses' | 'teachers' | 'unassigned'

    // Búsquedas
    const courseSearchQuery = ref("");
    const teacherSearchQuery = ref("");
    const unassignedSearchQuery = ref("");

    // Estado de cursos y usuarios
    const cursosInstituto = ref([{ id: 0, name: "Sin Curso" }]);
    const expandedCourseId = ref(null);
    const courseSelected = ref({});
    const usersCourse = ref([]);
    const loadingCourseUsers = ref(false);

    // Planta Docente
    const allTeachers = ref([]);
    const loadingTeachers = ref(false);

    // Sin Asignar
    const unassignedUsers = ref([]);
    const loadingUnassigned = ref(false);

    // Modales
    const isModalOpen = ref(false);
    const isBulkAssignModalOpen = ref(false);
    const isTeacherAssignmentModalOpen = ref(false);

    // Selección de usuario individual
    const selectedUser = ref(null);
    const selectedCourseId = ref(null);
    const selectedGroupId = ref(null);
    const rolSelected = ref(null);
    const gruposCursoDestino = ref([]);
    const currentCourseAreas = ref([]);
    const selectedAreas = ref({});

    // Bulk assign
    const sourceCourseForBulk = ref(null);
    const studentsForBulkAssign = ref([]);
    const selectedStudents = ref([]);

    const roles = ref([
      { titulo: "Estudiante", rol: "student" },
      { titulo: "Profesor", rol: "teacher" },
      { titulo: "Administrador", rol: "admin" },
    ]);

    // Permisos
    const isPrivilegedUser = computed(() => {
      if (!usuario.value) return false;
      const privilegedRoles = ["admin", "director", "coordinator"];
      return privilegedRoles.includes(usuario.value.rol);
    });

    const canManage = (targetUser) => {
      if (!usuario.value) return false;
      if (isPrivilegedUser.value) return true;
      if (usuario.value.id === targetUser.id) return false;

      if (usuario.value.rol === "teacher") {
        const isStudent =
          targetUser.rol === "student" || targetUser.rol === "user";
        const teacherCourses =
          usuario.value.courses?.map((c) => c.course.id) || [];
        const isTeacherInCourse = teacherCourses.includes(
          courseSelected.value?.id,
        );
        return isStudent && isTeacherInCourse;
      }
      return false;
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet() || {};
      tokenHeader();
      await getCurso();
      if (activeTab.value === "teachers") {
        await getTeachers();
      } else if (activeTab.value === "unassigned") {
        await getUsuariosSinCurso();
      }
    });

    const getCurso = async () => {
      try {
        const response = await axios.get(
          `/courses?instituteId=${usuario.value.institute?.id}&exist=true`,
          tokenHeader(),
        );
        cursosInstituto.value = [
          { id: 0, name: "Sin Curso" },
          ...response.data.sort((a, b) => parseInt(a.name) - parseInt(b.name)),
        ];
      } catch (error) {
        console.error("Error al cargar cursos:", error);
      }
    };

    const onYearChange = async () => {
      if (expandedCourseId.value) {
        const currentCourse = cursosInstituto.value.find(
          (c) => c.id === expandedCourseId.value,
        );
        if (currentCourse) {
          await loadCourseData(currentCourse);
        }
      }
      if (activeTab.value === "unassigned") {
        await getUsuariosSinCurso();
      }
    };

    const switchTab = async (tab) => {
      activeTab.value = tab;
      if (tab === "teachers" && allTeachers.value.length === 0) {
        await getTeachers();
      } else if (tab === "unassigned" && unassignedUsers.value.length === 0) {
        await getUsuariosSinCurso();
      }
    };

    // Toggle de Acordeón de Curso
    const toggleCourse = async (curso) => {
      if (expandedCourseId.value === curso.id) {
        expandedCourseId.value = null;
        courseSelected.value = {};
        usersCourse.value = [];
      } else {
        expandedCourseId.value = curso.id;
        courseSelected.value = curso;
        await loadCourseData(curso);
      }
    };

    const loadCourseData = async (curso) => {
      loadingCourseUsers.value = true;
      usersCourse.value = [];

      try {
        await getUsuarios(curso.id, selectedYear.value);
      } catch (e) {
        console.error("Error cargando estudiantes del curso:", e);
      } finally {
        loadingCourseUsers.value = false;
      }
    };

    const getUsuarios = async (cursoId, year) => {
      if (cursoId === 0) {
        await getUsuariosSinCurso();
        return;
      }
      try {
        const response = await axios.get(
          `/courses/${cursoId}/users?year=${year}&active=true`,
          tokenHeader(),
        );
        const users = response.data
          .filter((a) => a.active !== false)
          .map((a) => ({ ...a.user, courseRol: a.rol }));

        // Ordenar: primero docentes/admins, luego estudiantes alfabéticamente
        users.sort((a, b) => {
          const lastA = a.lastName || "";
          const lastB = b.lastName || "";
          if (lastA !== lastB) return lastA.localeCompare(lastB);
          return (a.name || "").localeCompare(b.name || "");
        });

        usersCourse.value = users;
      } catch (error) {
        console.error("Error al obtener usuarios del curso:", error);
      }
    };

    const getTeachers = async () => {
      loadingTeachers.value = true;
      try {
        const response = await axios.get(
          `/users?instituteId=${usuario.value.institute?.id}&rol=teacher,admin`,
          tokenHeader(),
        );
        allTeachers.value = response.data.sort((a, b) =>
          (a.lastName || "").localeCompare(b.lastName || ""),
        );
      } catch (error) {
        console.error("Error al obtener profesores:", error);
      } finally {
        loadingTeachers.value = false;
      }
    };

    const getUsuariosSinCurso = async () => {
      loadingUnassigned.value = true;
      unassignedUsers.value = [];
      try {
        const responseNoCourse = await axios.get(
          `/institutes/${usuario.value.institute?.id}/usersNoCourse?year=0`,
          tokenHeader(),
        );
        const usersWithNoAssignments = responseNoCourse.data;

        const allCourses = cursosInstituto.value.filter((c) => c.id !== 0);
        const assignmentPromises = allCourses.map((c) =>
          axios.get(
            `/courses/${c.id}/users?active=true&year=${selectedYear.value}`,
            tokenHeader(),
          ),
        );

        const assignmentResponses = await Promise.all(assignmentPromises);
        const allAssignments = [];
        assignmentResponses.forEach((r) => allAssignments.push(...r.data));

        const usersData = new Map();
        allAssignments.forEach((assignment) => {
          if (!usersData.has(assignment.user.id)) {
            usersData.set(assignment.user.id, {
              user: assignment.user,
              hasActive: false,
            });
          }
          if (assignment.active !== false) {
            usersData.get(assignment.user.id).hasActive = true;
          }
        });

        const usersWithOnlyInactiveAssignments = [];
        usersData.forEach((data) => {
          if (!data.hasActive) {
            usersWithOnlyInactiveAssignments.push(data.user);
          }
        });

        const combinedUsers = [
          ...usersWithNoAssignments,
          ...usersWithOnlyInactiveAssignments,
        ];
        const uniqueUsers = Array.from(
          new Set(combinedUsers.map((u) => u.id)),
        ).map((id) => combinedUsers.find((u) => u.id === id));

        uniqueUsers.sort((a, b) =>
          (a.lastName || "").localeCompare(b.lastName || ""),
        );
        unassignedUsers.value = uniqueUsers;
      } catch (error) {
        console.error("Error al consultar usuarios sin curso:", error);
      } finally {
        loadingUnassigned.value = false;
      }
    };

    const deactivateUser = async (user) => {
      const alert = await alertController.create({
        header: "Confirmar Desvinculación",
        message: `¿Estás seguro de desvincular a ${user.name} ${user.lastName} de su curso y grupo actual? El usuario no será borrado y quedará en 'Sin Asignar'.`,
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Desvincular",
            role: "destructive",
            handler: async () => {
              try {
                await axios.patch(
                  `/users/${user.id}/deactivate-assignments`,
                  {
                    assignmentTypes: [
                      AssignmentType.COURSE,
                      AssignmentType.GROUP,
                    ],
                  },
                  tokenHeader(),
                );

                if (courseSelected.value?.id) {
                  await getUsuarios(
                    courseSelected.value.id,
                    selectedYear.value,
                  );
                } else {
                  await getUsuariosSinCurso();
                }
              } catch (error) {
                console.error("Error al desvincular asignaciones:", error);
              }
            },
          },
        ],
      });
      await alert.present();
    };

    // Modal individual
    const openModal = async (user) => {
      selectedUser.value = user;
      if (user.rol === "teacher" || user.rol === "admin") {
        isTeacherAssignmentModalOpen.value = true;
      } else {
        selectedCourseId.value = courseSelected.value?.id || null;
        selectedGroupId.value = null;
        selectedAreas.value = {};
        currentCourseAreas.value = [];
        selectedYearForAssignment.value = selectedYear.value;
        rolSelected.value = user.rol || "student";
        isModalOpen.value = true;
        if (selectedCourseId.value) {
          await getGruposCurso();
        }
      }
    };

    const closeModal = () => {
      isModalOpen.value = false;
      selectedAreas.value = {};
    };

    const getGruposCurso = async () => {
      if (!selectedCourseId.value || selectedCourseId.value === 0) {
        gruposCursoDestino.value = [];
        currentCourseAreas.value = [];
        selectedGroupId.value = null;
        return;
      }
      try {
        const [groupsRes, areasRes] = await Promise.all([
          axios.get(
            `/courses/${selectedCourseId.value}/groups?year=${selectedYearForAssignment.value}&active=true`,
            tokenHeader(),
          ),
          axios.get(`/courses/${selectedCourseId.value}/areas`, tokenHeader()),
        ]);
        gruposCursoDestino.value = groupsRes.data || [];
        currentCourseAreas.value = areasRes.data || [];
      } catch (err) {
        console.error("Error cargando grupos o áreas del curso:", err);
      }
    };

    const asignarUsuario = async () => {
      try {
        if (rolSelected.value === "student") {
          try {
            await axios.patch(
              `/users/${selectedUser.value.id}/deactivate-assignments`,
              {
                assignmentTypes: [AssignmentType.COURSE, AssignmentType.GROUP],
              },
              tokenHeader(),
            );
          } catch (e) {
            console.warn("Advertencia al desactivar asignaciones previas:", e);
          }
        }

        if (selectedCourseId.value && selectedCourseId.value !== 0) {
          await axios.post(
            `/courses/${selectedCourseId.value}/users`,
            [
              {
                userId: selectedUser.value.id,
                year: parseInt(selectedYearForAssignment.value, 10),
                rol: rolSelected.value || "student",
                active: true,
              },
            ],
            tokenHeader(),
          );
        }

        if (selectedGroupId.value) {
          await axios.post(
            `/groups/${selectedGroupId.value}/users`,
            [
              {
                userId: selectedUser.value.id,
                periodId: 1,
                year: parseInt(selectedYearForAssignment.value, 10),
                active: true,
              },
            ],
            tokenHeader(),
          );
        }

        closeModal();
        await refreshCurrentView();
      } catch (error) {
        console.error("Error al asignar usuario:", error);
      }
    };

    // Modal de Traslado Masivo
    const openBulkAssignModal = async (curso) => {
      sourceCourseForBulk.value = curso;
      selectedCourseId.value = null;
      selectedStudents.value = [];
      selectedYearForBulk.value = selectedYear.value;

      try {
        const res = await axios.get(
          `/courses/${curso.id}/users?active=true&year=${selectedYear.value}`,
          tokenHeader(),
        );
        const users = res.data
          .filter((a) => a.active !== false)
          .map((a) => a.user);
        studentsForBulkAssign.value = users.filter(
          (u) => u.rol === "student" || u.rol === "user",
        );
        isBulkAssignModalOpen.value = true;
      } catch (err) {
        console.error("Error cargando estudiantes para traslado masivo:", err);
      }
    };

    const closeBulkAssignModal = () => {
      isBulkAssignModalOpen.value = false;
    };

    const toggleSelectAllNative = (event) => {
      if (event.target.checked) {
        selectedStudents.value = studentsForBulkAssign.value.map((s) => s.id);
      } else {
        selectedStudents.value = [];
      }
    };

    const toggleStudentSelection = (studentId) => {
      if (selectedStudents.value.includes(studentId)) {
        selectedStudents.value = selectedStudents.value.filter(
          (id) => id !== studentId,
        );
      } else {
        selectedStudents.value.push(studentId);
      }
    };

    const confirmBulkAssign = async () => {
      if (!selectedCourseId.value || selectedStudents.value.length === 0) {
        const alert = await alertController.create({
          header: "Información incompleta",
          message:
            "Por favor seleccione un curso de destino y al menos un estudiante.",
          buttons: ["Entendido"],
        });
        await alert.present();
        return;
      }

      const loader = await loadingController.create({
        message: "Procesando traslado masivo...",
      });
      await loader.present();

      try {
        const deactivationPromises = selectedStudents.value.map((userId) =>
          axios.patch(
            `/users/${userId}/deactivate-assignments`,
            { assignmentTypes: ["COURSE", "GROUP"] },
            tokenHeader(),
          ),
        );
        await Promise.all(deactivationPromises);

        const assignments = selectedStudents.value.map((userId) => ({
          userId,
          year: parseInt(selectedYearForBulk.value, 10),
          rol: "student",
        }));

        await axios.post(
          `/courses/${selectedCourseId.value}/users`,
          assignments,
          tokenHeader(),
        );

        await loader.dismiss();
        closeBulkAssignModal();

        const successAlert = await alertController.create({
          header: "Traslado Exitoso",
          message: `Se han trasladado ${selectedStudents.value.length} estudiantes correctamente.`,
          buttons: ["OK"],
        });
        await successAlert.present();
        await refreshCurrentView();
      } catch (error) {
        await loader.dismiss();
        console.error("Error en la asignación múltiple:", error);
      }
    };

    const refreshCurrentView = async () => {
      if (expandedCourseId.value) {
        const c = cursosInstituto.value.find(
          (item) => item.id === expandedCourseId.value,
        );
        if (c) await loadCourseData(c);
      }
      if (activeTab.value === "teachers") {
        await getTeachers();
      } else if (activeTab.value === "unassigned") {
        await getUsuariosSinCurso();
      }
    };

    // Filtros computados
    const filteredCursos = computed(() => {
      const q = courseSearchQuery.value.trim().toLowerCase();
      const list = cursosInstituto.value.filter((c) => c.id !== 0);
      if (!q) return list;
      return list.filter((c) => c.name.toLowerCase().includes(q));
    });

    const filteredCourseUsers = computed(() => {
      const q = courseSearchQuery.value.trim().toLowerCase();
      if (!q) return usersCourse.value;
      return usersCourse.value.filter((u) => {
        const full = `${u.name} ${u.lastName} ${u.code || ""}`.toLowerCase();
        return full.includes(q);
      });
    });

    const filteredTeachers = computed(() => {
      const q = teacherSearchQuery.value.trim().toLowerCase();
      if (!q) return allTeachers.value;
      return allTeachers.value.filter((t) => {
        const full = `${t.name} ${t.lastName} ${t.code || ""} ${
          t.email || ""
        }`.toLowerCase();
        return full.includes(q);
      });
    });

    const filteredUnassignedUsers = computed(() => {
      const q = unassignedSearchQuery.value.trim().toLowerCase();
      if (!q) return unassignedUsers.value;
      return unassignedUsers.value.filter((u) => {
        const full = `${u.name} ${u.lastName} ${u.code || ""}`.toLowerCase();
        return full.includes(q);
      });
    });

    const unassignedCount = computed(() => unassignedUsers.value.length);

    const availableCourses = computed(() => {
      if (isPrivilegedUser.value)
        return cursosInstituto.value.filter((c) => c.id !== 0);
      if (usuario.value?.rol === "teacher") {
        const teacherCourseIds =
          usuario.value.courses?.map((c) => c.course.id) || [];
        return cursosInstituto.value.filter((c) =>
          teacherCourseIds.includes(c.id),
        );
      }
      return [];
    });

    const availableRoles = computed(() => {
      if (!selectedUser.value)
        return roles.value.filter(
          (r) => r.rol === "teacher" || r.rol === "admin",
        );
      if (
        selectedUser.value.rol === "teacher" ||
        selectedUser.value.rol === "admin"
      ) {
        return roles.value.filter(
          (r) => r.rol === "teacher" || r.rol === "admin",
        );
      }
      return roles.value.filter((r) => r.rol === "student");
    });

    const getRoleLabel = (item) => {
      const rol = item.courseRol || item.rol;
      switch (rol) {
        case "student":
        case "user":
          return "Estudiante";
        case "teacher":
          return "Docente";
        case "admin":
          return "Administrador";
        case "director":
          return "Director";
        case "coordinator":
          return "Coordinador";
        default:
          return "Usuario";
      }
    };

    const getRoleBadgeClass = (item) => {
      const rol = item.courseRol || item.rol;
      if (rol === "admin" || rol === "director") return "qz-badge--admin";
      if (rol === "teacher" || rol === "coordinator")
        return "qz-badge--teacher";
      return "qz-badge--student";
    };

    const getInitials = (user) => {
      if (!user) return "?";
      const name = user.name || "";
      const last = user.lastName || "";
      const initial1 = name.charAt(0).toUpperCase();
      const initial2 = last.charAt(0).toUpperCase();
      return (initial1 + initial2).trim() || "?";
    };

    return {
      router,
      usuario,
      years,
      selectedYear,
      selectedYearForBulk,
      selectedYearForAssignment,
      activeTab,
      cursosInstituto,
      expandedCourseId,
      usersCourse,
      loadingCourseUsers,
      loadingTeachers,
      loadingUnassigned,
      isPrivilegedUser,
      canManage,
      courseSearchQuery,
      teacherSearchQuery,
      unassignedSearchQuery,
      filteredCursos,
      filteredCourseUsers,
      filteredTeachers,
      filteredUnassignedUsers,
      unassignedCount,
      availableCourses,
      availableRoles,
      onYearChange,
      switchTab,
      toggleCourse,
      deactivateUser,
      // Modales
      isModalOpen,
      openModal,
      closeModal,
      selectedUser,
      selectedCourseId,
      selectedGroupId,
      rolSelected,
      gruposCursoDestino,
      currentCourseAreas,
      selectedAreas,
      getGruposCurso,
      asignarUsuario,
      isBulkAssignModalOpen,
      sourceCourseForBulk,
      studentsForBulkAssign,
      selectedStudents,
      openBulkAssignModal,
      closeBulkAssignModal,
      toggleSelectAllNative,
      toggleStudentSelection,
      confirmBulkAssign,
      isTeacherAssignmentModalOpen,
      refreshCurrentView,
      getRoleLabel,
      getRoleBadgeClass,
      getInitials,
      // Iconos
      arrowBackOutline,
      calendarOutline,
      schoolOutline,
      peopleOutline,
      personAddOutline,
      swapHorizontalOutline,
      searchOutline,
      createOutline,
      trashOutline,
      layersOutline,
      checkmarkCircleOutline,
      chevronDownOutline,
      chevronUpOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: GESTIÓN DE USUARIOS
   ========================================================================== */

.qz-users-page {
  --background: #f9f9ff;
  background-color: #f9f9ff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
}

.qz-users-content {
  --background: transparent;
}

.qz-users-wrapper {
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: 24px;
}

/* 1. HERO HEADER */
.qz-hero-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  padding: 36px 24px 28px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.2);
}

.qz-hero-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.qz-back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.qz-back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 5px 12px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
}

.qz-hero-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.qz-hero-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.qz-hero-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
  max-width: 580px;
}

.qz-import-btn {
  background: #ffffff;
  color: #6a5ae0;
  border: none;
  border-radius: 14px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.qz-import-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

/* Selector de Año Lectivo */
.qz-year-pill-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.18);
  padding: 6px 14px;
  border-radius: 14px;
  width: fit-content;
  backdrop-filter: blur(6px);
}

.qz-year-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.qz-year-select-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-year-select-wrap ion-icon {
  font-size: 15px;
}

.qz-year-select {
  background: transparent;
  border: none;
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  outline: none;
}

.qz-year-select option {
  background: #6a5ae0;
  color: #ffffff;
}

/* 2. BODY Y TABS QUEEZY */
.qz-users-body {
  padding: 20px 18px 0;
}

.qz-tabs-container {
  display: flex;
  gap: 8px;
  background: #ffffff;
  padding: 6px;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(106, 90, 224, 0.06);
  border: 1px solid rgba(106, 90, 224, 0.08);
  margin-bottom: 22px;
}

.qz-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  border: none;
  background: transparent;
  color: #858494;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.qz-tab-btn ion-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.qz-tab-btn--active {
  background: #efeefc;
  color: #6a5ae0;
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.1);
}

.qz-tab-badge {
  background: #ff5757;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
  margin-left: 2px;
}

.qz-tab-label {
  display: inline-flex;
  align-items: center;
}

.qz-tab-label--short {
  display: none;
}

.qz-tab-label--full {
  display: inline;
}

@media (max-width: 640px) {
  .qz-users-body {
    padding: 14px 12px 0;
  }

  .qz-tabs-container {
    gap: 4px;
    padding: 5px;
    border-radius: 16px;
    overflow-x: hidden;
  }

  .qz-tab-btn {
    padding: 10px 4px;
    font-size: 12px;
    gap: 5px;
    border-radius: 12px;
    min-width: 0;
  }

  .qz-tab-btn ion-icon {
    font-size: 17px;
  }

  .qz-tab-label--full {
    display: none;
  }

  .qz-tab-label--short {
    display: inline;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .qz-tab-badge {
    font-size: 9px;
    padding: 1px 5px;
  }
}

/* BUSCADOR */
.qz-search-bar-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.qz-search-icon {
  position: absolute;
  left: 16px;
  font-size: 18px;
  color: #858494;
  pointer-events: none;
}

.qz-search-input {
  width: 100%;
  padding: 13px 18px 13px 44px;
  background: #ffffff;
  border: 1.5px solid rgba(106, 90, 224, 0.12);
  border-radius: 16px;
  font-size: 14px;
  color: #110d26;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.qz-search-input:focus {
  border-color: #6a5ae0;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.15);
}

/* CARDS DE CURSOS */
.qz-courses-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-course-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1.5px solid rgba(106, 90, 224, 0.1);
  box-shadow: 0 3px 12px rgba(106, 90, 224, 0.04);
  transition: all 0.2s ease;
  overflow: hidden;
}

.qz-course-card--expanded {
  border-color: rgba(106, 90, 224, 0.35);
  box-shadow: 0 8px 24px rgba(106, 90, 224, 0.1);
}

.qz-course-card-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.qz-course-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.qz-course-icon-squircle {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.qz-course-name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #110d26;
}

.qz-course-sub {
  font-size: 12px;
  color: #858494;
  margin-top: 2px;
  display: block;
}

.qz-course-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-course-action-btn {
  background: #efeefc;
  color: #6a5ae0;
  border: none;
  border-radius: 12px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.qz-course-action-btn:hover {
  background: #e2dffa;
  transform: translateY(-1px);
}

.qz-course-toggle-btn {
  background: #f4f3fd;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
}

/* CUERPO DEL CURSO EXPANDIDO */
.qz-course-card-body {
  padding: 0 20px 20px;
  border-top: 1px solid rgba(106, 90, 224, 0.08);
  background: #faf9ff;
}

.qz-subtabs-row {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.qz-subtab-pill {
  border: 1px solid rgba(106, 90, 224, 0.15);
  background: #ffffff;
  color: #858494;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.qz-subtab-pill--active {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
}

/* LISTA DE ESTUDIANTES */
.qz-user-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-user-row-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.15s ease;
}

.qz-user-row-card:hover {
  border-color: rgba(106, 90, 224, 0.2);
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.06);
}

.qz-user-avatar-squircle {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #efeefc;
  color: #6a5ae0;
  font-weight: 800;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;
}

.qz-avatar--sm {
  width: 32px;
  height: 32px;
  font-size: 11px;
  margin-right: 10px;
}

.qz-user-info-col {
  flex-grow: 1;
}

.qz-user-fullname {
  margin: 0 0 3px;
  font-size: 14px;
  font-weight: 700;
  color: #110d26;
}

.qz-user-meta-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-user-role-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 8px;
  text-transform: uppercase;
}

.qz-badge--student {
  background: #e0f2fe;
  color: #0369a1;
}

.qz-badge--teacher {
  background: #fef3c7;
  color: #b45309;
}

.qz-badge--admin {
  background: #fce7f3;
  color: #be185d;
}

.qz-user-code {
  font-size: 11px;
  color: #858494;
}

.qz-user-actions-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-user-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-btn--reassign {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-btn--reassign:hover {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-btn--edit {
  background: #f4f3fd;
  color: #858494;
}

.qz-btn--edit:hover {
  background: #00acc1;
  color: #ffffff;
}

.qz-btn--delete {
  background: #fff1f2;
  color: #e11d48;
}

.qz-btn--delete:hover {
  background: #e11d48;
  color: #ffffff;
}

/* ÁREAS Y DOCENTES */
.qz-areas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.qz-area-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(106, 90, 224, 0.1);
}

.qz-area-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-area-icon-squircle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e0f7fa;
  color: #00acc1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.qz-area-name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #110d26;
}

.qz-area-teacher {
  margin: 2px 0 0;
  font-size: 12px;
  color: #858494;
}

.qz-text--teacher-assigned {
  color: #16a34a;
  font-weight: 600;
}

.qz-text--unassigned {
  color: #dc2626;
  font-weight: 600;
}

.qz-assign-teacher-btn {
  background: #efeefc;
  color: #6a5ae0;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

/* PLANTA DOCENTE */
.qz-teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
}

.qz-teacher-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 18px;
  border: 1.5px solid rgba(106, 90, 224, 0.1);
  box-shadow: 0 3px 12px rgba(106, 90, 224, 0.04);
}

.qz-teacher-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.qz-teacher-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #fff8e1;
  color: #d97706;
  font-weight: 800;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qz-teacher-name {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 700;
  color: #110d26;
}

.qz-teacher-code {
  font-size: 11px;
  color: #858494;
  display: block;
}

.qz-teacher-role-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  color: #6a5ae0;
  background: #efeefc;
  padding: 2px 8px;
  border-radius: 8px;
  margin-top: 4px;
}

.qz-teacher-actions {
  display: flex;
  gap: 8px;
}

.qz-teacher-btn {
  flex: 1;
  border: none;
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.qz-btn--assign-work {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-btn--edit-profile {
  background: #efeefc;
  color: #6a5ae0;
}

/* BANNER SIN ASIGNAR */
.qz-unassigned-banner {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.qz-banner-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #dbeafe;
  color: #2563eb;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qz-banner-title {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 700;
  color: #1e40af;
}

.qz-banner-desc {
  margin: 0;
  font-size: 12px;
  color: #3b82f6;
  line-height: 1.4;
}

.qz-unassigned-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-unassigned-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1.5px solid rgba(106, 90, 224, 0.1);
}

.qz-assign-course-btn {
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.qz-assign-course-btn:hover {
  background: #5b4cc9;
  transform: translateY(-1px);
}

/* LOADING Y EMPTY STATES */
.qz-loading-box,
.qz-empty-box {
  padding: 36px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #858494;
  font-size: 14px;
}

.qz-empty-box ion-icon {
  font-size: 40px;
  color: #c4beea;
}

/* MODALES MODERNOS */
.qz-modal-modern {
  --background: #ffffff;
  --border-radius: 28px;
}

.qz-modal-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: #ffffff;
}

.qz-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.qz-modal-tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #6a5ae0;
  background: #efeefc;
  padding: 4px 10px;
  border-radius: 8px;
}

.qz-modal-title {
  margin: 6px 0 0;
  font-size: 18px;
  font-weight: 800;
  color: #110d26;
}

.qz-modal-close-btn {
  background: #f4f3fd;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  color: #858494;
  font-size: 14px;
  cursor: pointer;
}

.qz-selected-user-card {
  background: #faf9ff;
  border: 1px solid rgba(106, 90, 224, 0.15);
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.qz-modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-field-label {
  font-size: 12px;
  font-weight: 700;
  color: #6a5ae0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qz-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.qz-field-icon {
  position: absolute;
  left: 14px;
  font-size: 18px;
  color: #6a5ae0;
  pointer-events: none;
}

.qz-native-select {
  width: 100%;
  padding: 12px 16px 12px 42px;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.15);
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #110d26;
  outline: none;
  cursor: pointer;
  appearance: none;
}

.qz-checkboxes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
}

.qz-checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #110d26;
  cursor: pointer;
}

.qz-modal-footer {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.qz-modal-btn {
  flex: 1;
  padding: 13px 18px;
  border-radius: 14px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.qz-btn--cancel {
  background: #f4f3fd;
  color: #858494;
}

.qz-btn--confirm {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-btn--confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* TRASLADO MASIVO */
.qz-bulk-select-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #efeefc;
  border-radius: 12px;
  margin-bottom: 12px;
}

.qz-select-all-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #6a5ae0;
  cursor: pointer;
}

.qz-selected-count-badge {
  font-size: 11px;
  font-weight: 700;
  color: #6a5ae0;
}

.qz-bulk-students-list {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

.qz-bulk-student-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #faf9ff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-bulk-student-row--selected {
  background: #efeefc;
  border-color: rgba(106, 90, 224, 0.3);
}

.qz-bulk-student-name {
  flex-grow: 1;
  font-size: 13px;
  font-weight: 600;
  color: #110d26;
}

@media (max-width: 600px) {
  .qz-hide-mobile {
    display: none;
  }
}

/* ==========================================================================
   DARK MODE
   ========================================================================== */
body.dark .qz-users-page {
  --background: #110d26;
  background-color: #110d26;
}

body.dark .qz-hero-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
}

body.dark .qz-tabs-container,
body.dark .qz-course-card,
body.dark .qz-teacher-card,
body.dark .qz-unassigned-card,
body.dark .qz-modal-container {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

body.dark .qz-tab-btn {
  color: #a49fc4;
}

body.dark .qz-tab-btn--active {
  background: #2b2254;
  color: #b5a9ff;
}

body.dark .qz-search-input {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

body.dark .qz-course-name,
body.dark .qz-user-fullname,
body.dark .qz-area-name,
body.dark .qz-teacher-name,
body.dark .qz-modal-title,
body.dark .qz-bulk-student-name {
  color: #ffffff;
}

body.dark .qz-course-card-body {
  background: #181430;
  border-top-color: rgba(255, 255, 255, 0.06);
}

body.dark .qz-user-row-card,
body.dark .qz-area-card,
body.dark .qz-selected-user-card {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.06);
}

body.dark .qz-user-avatar-squircle {
  background: #2b2254;
  color: #b5a9ff;
}

body.dark .qz-native-select {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

body.dark .qz-native-select option {
  background: #1d1838;
  color: #ffffff;
}

body.dark .qz-unassigned-banner {
  background: rgba(37, 99, 235, 0.15);
  border-color: rgba(37, 99, 235, 0.3);
}

body.dark .qz-banner-title {
  color: #93c5fd;
}

body.dark .qz-banner-desc {
  color: #bfdbfe;
}

body.dark .qz-bulk-student-row {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.06);
}

body.dark .qz-bulk-student-row--selected {
  background: #2b2254;
  border-color: #6a5ae0;
}
</style>
