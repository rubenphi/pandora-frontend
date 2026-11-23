<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="handleClose"
    class="qz-modal-modern qz-import-wizard-modal"
  >
    <div class="qz-wizard-container">
      <!-- HEADER -->
      <div class="qz-wizard-header">
        <div class="qz-wizard-title-group">
          <span class="qz-wizard-badge">IMPORTACIÓN INTELIGENTE</span>
          <h2 class="qz-wizard-title">Importar Usuarios desde Excel</h2>
        </div>
        <button
          type="button"
          class="qz-wizard-close-btn"
          @click="handleClose"
          :disabled="isProcessing"
        >
          <ion-icon :icon="closeOutline"></ion-icon>
        </button>
      </div>

      <!-- STEPPER BREADCRUMBS -->
      <div class="qz-stepper-bar">
        <div
          v-for="step in steps"
          :key="step.number"
          class="qz-step-item"
          :class="{
            'qz-step--active': currentStep === step.number,
            'qz-step--completed': currentStep > step.number,
          }"
          @click="goToStep(step.number)"
        >
          <div class="qz-step-circle">
            <ion-icon
              v-if="currentStep > step.number"
              :icon="checkmarkOutline"
            ></ion-icon>
            <span v-else>{{ step.number }}</span>
          </div>
          <span class="qz-step-label">{{ step.title }}</span>
        </div>
      </div>

      <!-- BODY: PASOS -->
      <div class="qz-wizard-body">
        <!-- =============================================================== -->
        <!-- PASO 1: SELECCIONAR O ARRASTRAR ARCHIVO EXCEL                   -->
        <!-- =============================================================== -->
        <div v-if="currentStep === 1" class="qz-step-pane">
          <div class="qz-step-desc-box">
            <h3 class="qz-pane-title">Selecciona tu archivo de datos</h3>
            <p class="qz-pane-subtitle">
              Sube un archivo de Excel (.xlsx, .xls) con el listado de personas a importar.
            </p>
          </div>

          <div
            class="qz-dropzone"
            :class="{ 'qz-dropzone--dragover': isDragging, 'qz-dropzone--has-file': !!selectedFile }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input
              type="file"
              ref="fileInputRef"
              accept=".xlsx, .xls, .csv, .html, .htm"
              style="display: none"
              @change="handleFileChange"
            />
            <div class="qz-dropzone-icon">
              <ion-icon :icon="selectedFile ? documentTextOutline : cloudUploadOutline"></ion-icon>
            </div>
            <div class="qz-dropzone-info">
              <h4 v-if="selectedFile" class="qz-file-name">{{ selectedFile.name }}</h4>
              <h4 v-else class="qz-drop-prompt">Arrastra tu archivo aquí o haz clic para examinar</h4>
              <p class="qz-drop-hint">
                {{ selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB · Clic para cambiar` : 'Formatos soportados: Microsoft Excel (.xlsx, .xls)' }}
              </p>
            </div>
          </div>

          <div v-if="fileError" class="qz-alert-error">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            <span>{{ fileError }}</span>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- PASO 2: FILA DE ENCABEZADOS                                    -->
        <!-- =============================================================== -->
        <div v-else-if="currentStep === 2" class="qz-step-pane">
          <div class="qz-step-desc-box">
            <h3 class="qz-pane-title">Fila de Encabezados / Nombres de Columnas</h3>
            <p class="qz-pane-subtitle">
              Indica en qué fila de tu Excel se encuentran los títulos de cada columna (generalmente la fila 1).
            </p>
          </div>

          <div class="qz-header-selector-card">
            <label class="qz-field-label">Número de fila de encabezados (1 a 20):</label>
            <div class="qz-row-stepper">
              <button
                type="button"
                class="qz-stepper-btn"
                :disabled="headerRowNumber <= 1"
                @click="changeHeaderRow(headerRowNumber - 1)"
              >
                -
              </button>
              <select
                v-model.number="headerRowNumber"
                @change="onHeaderRowChange"
                class="qz-row-native-select"
              >
                <option v-for="r in 20" :key="r" :value="r">
                  Fila {{ r }}
                </option>
              </select>
              <button
                type="button"
                class="qz-stepper-btn"
                :disabled="headerRowNumber >= 20 || headerRowNumber >= rawRows.length"
                @click="changeHeaderRow(headerRowNumber + 1)"
              >
                +
              </button>
            </div>
          </div>

          <!-- Vista Previa de Filas para Identificar la Cabecera -->
          <div class="qz-preview-table-wrap">
            <h4 class="qz-table-preview-title">
              Vista previa del archivo (la fila resaltada se usará como encabezado):
            </h4>
            <div class="qz-table-scroll">
              <table class="qz-sheet-preview-table">
                <tbody>
                  <tr
                    v-for="(row, rIndex) in rawRowsPreview"
                    :key="rIndex"
                    :class="{ 'qz-row--header-active': rIndex + 1 === headerRowNumber }"
                    @click="changeHeaderRow(rIndex + 1)"
                  >
                    <td class="qz-cell--row-num">
                      <span class="qz-row-num-tag">{{ rIndex + 1 }}</span>
                    </td>
                    <td
                      v-for="(cell, cIndex) in row"
                      :key="cIndex"
                      class="qz-cell--data"
                    >
                      {{ cell !== null && cell !== undefined && cell !== '' ? cell : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- PASO 3: MAPEO DE ENTIDAD, TIPOS, CONTRASEÑA Y CORREO          -->
        <!-- =============================================================== -->
        <div v-else-if="currentStep === 3" class="qz-step-pane">
          <div class="qz-step-desc-box">
            <h3 class="qz-pane-title">Mapeo de Campos y Reglas de Datos</h3>
            <p class="qz-pane-subtitle">
              Asocia las columnas de tu Excel a los atributos de cada usuario y configura cómo se generarán contraseñas y correos.
            </p>
          </div>

          <!-- SECCIÓN A: CAMPOS PRINCIPALES DE USUARIO -->
          <div class="qz-card-section">
            <div class="qz-section-header">
              <ion-icon :icon="personOutline"></ion-icon>
              <h4>1. Columnas de la Entidad Usuario</h4>
            </div>

            <div class="qz-grid-fields">
              <!-- Nombres -->
              <div class="qz-field-box">
                <label class="qz-field-label">Nombre(s) <span class="qz-required">*</span></label>
                <select v-model="fieldMap.nameCol" class="qz-select">
                  <option :value="null" disabled>Seleccionar columna...</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <!-- Apellidos -->
              <div class="qz-field-box">
                <label class="qz-field-label">Apellido(s) <span class="qz-required">*</span></label>
                <select v-model="fieldMap.lastNameCol" class="qz-select">
                  <option :value="null" disabled>Seleccionar columna...</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <!-- Documento / Código -->
              <div class="qz-field-box">
                <label class="qz-field-label">Documento / Código <span class="qz-required">*</span></label>
                <select v-model="fieldMap.codeCol" class="qz-select">
                  <option :value="null" disabled>Seleccionar columna...</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <!-- Correo original (si existe) -->
              <div class="qz-field-box">
                <label class="qz-field-label">Columna de Correo (Opcional)</label>
                <select v-model="fieldMap.emailCol" class="qz-select">
                  <option :value="null">-- No está en el Excel / Generar automático --</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <!-- Teléfono -->
              <div class="qz-field-box">
                <label class="qz-field-label">Teléfono (Opcional)</label>
                <select v-model="fieldMap.telephoneCol" class="qz-select">
                  <option :value="null">-- Ninguna / Sin teléfono --</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <!-- Sede (Opcional) -->
              <div class="qz-field-box">
                <label class="qz-field-label">Columna de Sede (Opcional)</label>
                <select v-model="fieldMap.headquartersCol" @change="onHeadquartersColChange" class="qz-select">
                  <option :value="null">-- Sin distinción de sedes (Importar todas) --</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <!-- Selector de Sede a importar (si seleccionó columna) -->
              <div class="qz-field-box" v-if="fieldMap.headquartersCol !== null">
                <label class="qz-field-label">Sede a importar</label>
                <select v-model="selectedHeadquarters" @change="onHeadquartersChange" class="qz-select">
                  <option value="ALL">⭐ Todas las sedes (Importar todos)</option>
                  <option v-for="s in uniqueHeadquartersList" :key="s.name" :value="s.name">
                    Sede: {{ s.name }} ({{ s.count }} estudiantes)
                  </option>
                </select>
              </div>

              <!-- Rol general -->
              <div class="qz-field-box">
                <label class="qz-field-label">Rol en la plataforma</label>
                <select v-model="fieldMap.defaultRole" class="qz-select">
                  <option value="student">Estudiante</option>
                  <option value="teacher">Profesor</option>
                </select>
              </div>
            </div>

            <div
              v-if="fieldMap.headquartersCol !== null && selectedHeadquarters !== 'ALL'"
              class="qz-live-email-preview"
              style="margin-top: 14px; background: rgba(106, 90, 224, 0.08); border-color: rgba(106, 90, 224, 0.25); color: #6a5ae0;"
            >
              <ion-icon :icon="businessOutline"></ion-icon>
              <span>Filtro activo: Se importarán únicamente los <strong>{{ filteredRows.length }}</strong> estudiantes de la sede <strong>"{{ selectedHeadquarters }}"</strong>.</span>
            </div>
          </div>

          <!-- SECCIÓN B: FORMATEO Y LIMPIEZA DE COLUMNAS -->
          <div class="qz-card-section">
            <div class="qz-section-header">
              <ion-icon :icon="layersOutline"></ion-icon>
              <h4>2. Formato de Columnas (Limpieza de separadores de miles)</h4>
            </div>
            <p class="qz-section-desc">
              Si una columna se marca como <strong>Número</strong>, se limpiarán puntos, comas y espacios para dejar sólo el entero limpio.
            </p>

            <div class="qz-types-list">
              <div
                v-for="col in mappedColumnsForTyping"
                :key="col.index"
                class="qz-type-row"
              >
                <span class="qz-type-col-name">{{ col.letter }}: {{ col.label }}</span>
                <div class="qz-type-pill-group">
                  <button
                    type="button"
                    class="qz-type-pill"
                    :class="{ 'qz-type-pill--active': columnTypes[col.index] === 'text' }"
                    @click="columnTypes[col.index] = 'text'"
                  >
                    Texto
                  </button>
                  <button
                    type="button"
                    class="qz-type-pill"
                    :class="{ 'qz-type-pill--active': columnTypes[col.index] === 'number' }"
                    @click="columnTypes[col.index] = 'number'"
                  >
                    Número (Limpio)
                  </button>
                  <button
                    type="button"
                    class="qz-type-pill"
                    :class="{ 'qz-type-pill--active': columnTypes[col.index] === 'date' }"
                    @click="columnTypes[col.index] = 'date'"
                  >
                    Fecha
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN C: CONFIGURACIÓN DE CONTRASEÑA -->
          <div class="qz-card-section">
            <div class="qz-section-header">
              <ion-icon :icon="keyOutline"></ion-icon>
              <h4>3. Generación de Contraseñas</h4>
            </div>
            <p class="qz-section-desc">
              La contraseña es obligatoria. Elige cómo asignarla para todos los usuarios del archivo:
            </p>

            <div class="qz-radio-group">
              <label class="qz-radio-option">
                <input
                  type="radio"
                  value="column"
                  v-model="passwordConfig.mode"
                />
                <div class="qz-radio-content">
                  <strong>Usar una columna existente</strong>
                  <span>(Por ejemplo, su número de documento o código)</span>
                </div>
              </label>

              <label class="qz-radio-option">
                <input
                  type="radio"
                  value="concat"
                  v-model="passwordConfig.mode"
                />
                <div class="qz-radio-content">
                  <strong>Combinar 2 columnas</strong>
                  <span>(Por ejemplo: Inicial del nombre + Documento)</span>
                </div>
              </label>

              <label class="qz-radio-option">
                <input
                  type="radio"
                  value="fixed"
                  v-model="passwordConfig.mode"
                />
                <div class="qz-radio-content">
                  <strong>Contraseña fija genérica para todos</strong>
                  <span>(Se asignará la misma clave inicial a todos)</span>
                </div>
              </label>
            </div>

            <!-- Parámetros según modo -->
            <div class="qz-sub-options-box" v-if="passwordConfig.mode === 'column'">
              <label class="qz-field-label">Columna para la contraseña:</label>
              <select v-model="passwordConfig.col1" class="qz-select">
                <option :value="null" disabled>Seleccionar columna...</option>
                <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                  {{ col.letter }}: {{ col.label }}
                </option>
              </select>
            </div>

            <div class="qz-sub-options-box qz-two-cols" v-else-if="passwordConfig.mode === 'concat'">
              <div>
                <label class="qz-field-label">Primera Columna:</label>
                <select v-model="passwordConfig.col1" class="qz-select">
                  <option :value="null" disabled>Seleccionar primera...</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="qz-field-label">Segunda Columna:</label>
                <select v-model="passwordConfig.col2" class="qz-select">
                  <option :value="null" disabled>Seleccionar segunda...</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="qz-sub-options-box" v-else-if="passwordConfig.mode === 'fixed'">
              <label class="qz-field-label">Contraseña fija:</label>
              <input
                type="text"
                v-model="passwordConfig.fixedValue"
                placeholder="Ej: Colegio2026*"
                class="qz-input"
              />
            </div>
          </div>

          <!-- SECCIÓN D: GENERACIÓN DE CORREOS PARA USUARIOS SIN CORREO -->
          <div class="qz-card-section">
            <div class="qz-section-header">
              <ion-icon :icon="mailOutline"></ion-icon>
              <h4>4. Correo Alternativo / Temporal (Sin correo en Excel)</h4>
            </div>
            <p class="qz-section-desc">
              Si un estudiante no tiene correo en el archivo, se generará uno automáticamente con formato válido.
            </p>

            <div class="qz-grid-fields">
              <div class="qz-field-box">
                <label class="qz-field-label">Columna base (Ej: Documento):</label>
                <select v-model="emailConfig.col1" class="qz-select">
                  <option :value="null" disabled>Seleccionar columna...</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <div class="qz-field-box">
                <label class="qz-field-label">Segunda columna (Opcional, ej: Nombre):</label>
                <select v-model="emailConfig.col2" class="qz-select">
                  <option :value="null">-- Ninguna (solo usar la primera) --</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <div class="qz-field-box">
                <label class="qz-field-label">Dominio del correo:</label>
                <select v-model="emailConfig.domainType" class="qz-select">
                  <option value="@yopmail.com">@yopmail.com (Temporal recomendado)</option>
                  <option value="@mailinator.com">@mailinator.com</option>
                  <option value="@gmail.com">@gmail.com</option>
                  <option value="custom">Otro dominio personalizado</option>
                </select>
              </div>

              <div class="qz-field-box" v-if="emailConfig.domainType === 'custom'">
                <label class="qz-field-label">Escribe el dominio (con @):</label>
                <input
                  type="text"
                  v-model="emailConfig.customDomain"
                  placeholder="@colegio.edu.co"
                  class="qz-input"
                />
              </div>
            </div>

            <!-- Ejemplo en vivo -->
            <div class="qz-live-email-preview">
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              <span>Ejemplo de correo generado: <strong>{{ sampleGeneratedEmail }}</strong></span>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- PASO 4: ASIGNACIÓN Y HOMOLOGACIÓN DE CURSOS                     -->
        <!-- =============================================================== -->
        <div v-else-if="currentStep === 4" class="qz-step-pane">
          <div class="qz-step-desc-box">
            <h3 class="qz-pane-title">Asignación y Homologación de Cursos</h3>
            <p class="qz-pane-subtitle">
              Indica si los usuarios pertenecen a un solo curso o si el archivo incluye una columna con los cursos.
            </p>
          </div>

          <div class="qz-course-mode-toggle">
            <button
              type="button"
              class="qz-mode-btn"
              :class="{ 'qz-mode-btn--active': hasCourseColumn }"
              @click="setHasCourseColumn(true)"
            >
              <ion-icon :icon="layersOutline"></ion-icon>
              <span>El Excel tiene una columna para los Cursos</span>
            </button>
            <button
              type="button"
              class="qz-mode-btn"
              :class="{ 'qz-mode-btn--active': !hasCourseColumn }"
              @click="setHasCourseColumn(false)"
            >
              <ion-icon :icon="schoolOutline"></ion-icon>
              <span>Asignar un solo curso a todos</span>
            </button>
          </div>

          <!-- CASO A: ASIGNAR UN SOLO CURSO A TODOS -->
          <div v-if="!hasCourseColumn" class="qz-card-section">
            <div class="qz-section-header">
              <ion-icon :icon="schoolOutline"></ion-icon>
              <h4>Curso único para todos los usuarios importados</h4>
            </div>

            <div class="qz-field-box" style="margin-top: 14px;">
              <label class="qz-field-label">Seleccionar curso de destino:</label>
              <select v-model="singleCourseConfig.targetCourseId" class="qz-select">
                <option :value="null" disabled>Selecciona un curso...</option>
                <option v-for="c in availableCoursesList" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
                <option value="NEW">➕ Nuevo Curso (Crear curso ahora)</option>
              </select>
            </div>

            <div v-if="singleCourseConfig.targetCourseId === 'NEW'" class="qz-field-box" style="margin-top: 14px;">
              <label class="qz-field-label">Nombre del nuevo curso:</label>
              <input
                type="text"
                v-model="singleCourseConfig.newCourseName"
                placeholder="Ej: 6° A"
                class="qz-input"
              />
            </div>
          </div>

          <!-- CASO B: HOMOLOGACIÓN DE VALORES ÚNICOS DE LA COLUMNA DE CURSO -->
          <div v-else class="qz-card-section">
            <div class="qz-field-box" style="margin-bottom: 20px;">
              <label class="qz-field-label">¿Cuál columna del Excel contiene el Curso?</label>
              <select v-model="courseColumnIndex" @change="extractUniqueCourses" class="qz-select">
                <option :value="null" disabled>Seleccionar columna del curso...</option>
                <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                  {{ col.letter }}: {{ col.label }}
                </option>
              </select>
            </div>

            <div v-if="courseColumnIndex !== null">
              <div class="qz-section-header">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <h4>Homologación de Cursos Encontrados ({{ uniqueCoursesList.length }} valores únicos)</h4>
              </div>
              <p class="qz-section-desc">
                Para cada valor detectado en el archivo, selecciona a qué curso de la institución corresponde o elige "Nuevo" para crearlo automáticamente:
              </p>

              <div class="qz-homologation-list">
                <div
                  v-for="uniqueVal in uniqueCoursesList"
                  :key="uniqueVal"
                  class="qz-homologation-card"
                >
                  <div class="qz-homo-source">
                    <span class="qz-homo-tag">VALOR EN EXCEL:</span>
                    <strong class="qz-homo-source-text">"{{ uniqueVal }}"</strong>
                  </div>

                  <div class="qz-homo-target">
                    <label class="qz-field-label">Mapear con el curso:</label>
                    <select
                      v-model="courseMappings[uniqueVal].targetCourseId"
                      class="qz-select"
                    >
                      <option :value="null" disabled>Seleccionar curso...</option>
                      <option v-for="c in availableCoursesList" :key="c.id" :value="c.id">
                        {{ c.name }}
                      </option>
                      <option value="NEW">➕ Nuevo Curso (Crear nuevo)</option>
                    </select>

                    <div
                      v-if="courseMappings[uniqueVal].targetCourseId === 'NEW'"
                      class="qz-new-course-input-wrap"
                    >
                      <input
                        type="text"
                        v-model="courseMappings[uniqueVal].newCourseName"
                        placeholder="Nombre del nuevo curso"
                        class="qz-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- PASO 5: VISTA PREVIA Y CONFIRMACIÓN                            -->
        <!-- =============================================================== -->
        <div v-else-if="currentStep === 5" class="qz-step-pane">
          <div class="qz-step-desc-box">
            <h3 class="qz-pane-title">Confirmación y Vista Previa</h3>
            <p class="qz-pane-subtitle">
              Revisa el resumen antes de proceder a la creación masiva de los registros.
            </p>
          </div>

          <!-- TARJETAS DE RESUMEN METRICAS -->
          <div class="qz-metrics-grid">
            <div class="qz-metric-card">
              <span class="qz-metric-value">{{ parsedUsers.length }}</span>
              <span class="qz-metric-label">
                {{ selectedHeadquarters !== 'ALL' ? `Estudiantes (${selectedHeadquarters})` : 'Usuarios a Importar' }}
              </span>
            </div>
            <div class="qz-metric-card">
              <span class="qz-metric-value">{{ newCoursesToCreateCount }}</span>
              <span class="qz-metric-label">Cursos Nuevos a Crear</span>
            </div>
            <div class="qz-metric-card">
              <span class="qz-metric-value">{{ generatedEmailsCount }}</span>
              <span class="qz-metric-label">Correos Autogenerados</span>
            </div>
          </div>

          <!-- Banner si hay filtro de sede activo -->
          <div
            v-if="fieldMap.headquartersCol !== null && selectedHeadquarters !== 'ALL'"
            class="qz-live-email-preview"
            style="margin-top: 14px; background: rgba(106, 90, 224, 0.08); border-color: rgba(106, 90, 224, 0.25); color: #6a5ae0;"
          >
            <ion-icon :icon="businessOutline"></ion-icon>
            <span>Filtro de Sede Aplicado: Se importarán <strong>{{ parsedUsers.length }}</strong> estudiantes de la sede <strong>"{{ selectedHeadquarters }}"</strong> (de {{ rawRows.length - headerRowNumber }} totales en el archivo).</span>
          </div>

          <!-- Banner si hay correos comodín / duplicados reemplazados -->
          <div
            v-if="duplicateEmailsFallbackCount > 0"
            class="qz-live-email-preview"
            style="margin-top: 14px; background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.25); color: #b45309;"
          >
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            <span>Filtro de Correos Comodín: Se detectaron <strong>{{ duplicateEmailsFallbackCount }}</strong> estudiantes con correos repetidos en el Excel. Se les asignó automáticamente un correo único individual.</span>
          </div>

          <!-- TABLA PREVIA DE LOS PRIMEROS REGISTROS -->
          <div class="qz-preview-table-wrap" style="margin-top: 20px;">
            <h4 class="qz-table-preview-title">
              Muestra de los primeros registros procesados:
            </h4>
            <div class="qz-table-scroll">
              <table class="qz-final-preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombres</th>
                    <th>Apellidos</th>
                    <th>Documento</th>
                    <th>Correo</th>
                    <th>Contraseña</th>
                    <th>Curso Asignado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(user, idx) in parsedUsersPreview" :key="idx">
                    <td>{{ idx + 1 }}</td>
                    <td><strong>{{ user.name }}</strong></td>
                    <td>{{ user.lastName }}</td>
                    <td><code>{{ user.code }}</code></td>
                    <td>
                      {{ user.email }}
                      <span v-if="user.isDuplicateEmail" class="qz-badge-duplicate" title="Compartía correo en el Excel (comodín). Se reemplazó por correo único.">Comodín</span>
                      <span v-else-if="user.isAutoEmail" class="qz-badge-auto">Auto</span>
                    </td>
                    <td><code>{{ user.password }}</code></td>
                    <td>
                      <span class="qz-badge-course">{{ user.courseDisplayName }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- MENSAJE DE PROGRESO DE IMPORTACIÓN -->
          <div v-if="isProcessing" class="qz-processing-box">
            <ion-spinner name="crescent"></ion-spinner>
            <p>{{ processingStatusText }}</p>
          </div>
        </div>
      </div>

      <!-- FOOTER ACCIONES -->
      <div class="qz-wizard-footer">
        <button
          type="button"
          class="qz-btn qz-btn--secondary"
          @click="prevStep"
          v-if="currentStep > 1"
          :disabled="isProcessing"
        >
          <ion-icon :icon="arrowBackOutline"></ion-icon>
          <span>Atrás</span>
        </button>

        <button
          type="button"
          class="qz-btn qz-btn--cancel"
          @click="handleClose"
          v-else
          :disabled="isProcessing"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="qz-btn qz-btn--primary"
          @click="nextStep"
          v-if="currentStep < 5"
          :disabled="!canProceedStep"
        >
          <span>Continuar</span>
          <ion-icon :icon="arrowForwardOutline"></ion-icon>
        </button>

        <button
          type="button"
          class="qz-btn qz-btn--confirm-import"
          @click="executeImport"
          v-else-if="currentStep === 5"
          :disabled="isProcessing || parsedUsers.length === 0"
        >
          <ion-spinner v-if="isProcessing" name="dots"></ion-spinner>
          <span v-else>Importar {{ parsedUsers.length }} Usuarios</span>
        </button>
      </div>
    </div>
  </ion-modal>
</template>

<script>
import { defineComponent, ref, computed, watch } from "vue";
import { IonModal, IonIcon, IonSpinner, alertController } from "@ionic/vue";
import {
  closeOutline,
  checkmarkOutline,
  cloudUploadOutline,
  documentTextOutline,
  alertCircleOutline,
  personOutline,
  layersOutline,
  keyOutline,
  mailOutline,
  schoolOutline,
  businessOutline,
  checkmarkCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
} from "ionicons/icons";
import * as XLSX from "xlsx";
import axios from "axios";
import { tokenHeader, usuarioGet } from "../globalService";

export default defineComponent({
  name: "UserImportWizardModal",
  components: {
    IonModal,
    IonIcon,
    IonSpinner,
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    courses: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["didDismiss", "success"],
  setup(props, { emit }) {
    const currentStep = ref(1);
    const steps = [
      { number: 1, title: "Archivo" },
      { number: 2, title: "Encabezados" },
      { number: 3, title: "Campos & Tipos" },
      { number: 4, title: "Cursos" },
      { number: 5, title: "Confirmar" },
    ];

    // File
    const fileInputRef = ref(null);
    const selectedFile = ref(null);
    const isDragging = ref(false);
    const fileError = ref("");
    const rawRows = ref([]);

    // Header Row
    const headerRowNumber = ref(1);
    const detectedColumns = ref([]);

    // Mappings & Types
    const fieldMap = ref({
      nameCol: null,
      lastNameCol: null,
      codeCol: null,
      emailCol: null,
      telephoneCol: null,
      headquartersCol: null,
      defaultRole: "student",
    });

    const selectedHeadquarters = ref("ALL"); // 'ALL' o nombre de la sede específica

    const columnTypes = ref({}); // { [colIndex]: 'text' | 'number' | 'date' }

    // Password Configuration
    const passwordConfig = ref({
      mode: "column", // 'column' | 'concat' | 'fixed'
      col1: null,
      col2: null,
      fixedValue: "Colegio2026*",
    });

    // Email Configuration for missing emails
    const emailConfig = ref({
      col1: null,
      col2: null,
      domainType: "@yopmail.com",
      customDomain: "@colegio.edu.co",
    });

    // Course Configuration
    const hasCourseColumn = ref(true);
    const courseColumnIndex = ref(null);
    const uniqueCoursesList = ref([]);
    const courseMappings = ref({}); // { [uniqueVal]: { targetCourseId: null, newCourseName: '' } }
    const singleCourseConfig = ref({
      targetCourseId: null,
      newCourseName: "",
    });

    // Available courses list
    const internalCourses = ref([]);

    // Processing & Execution
    const isProcessing = ref(false);
    const processingStatusText = ref("");

    // Watch props.courses
    watch(
      () => props.courses,
      (newVal) => {
        if (newVal && newVal.length > 0) {
          internalCourses.value = [...newVal];
        }
      },
      { immediate: true }
    );

    // Watch isOpen to reset state or load fresh courses
    watch(
      () => props.isOpen,
      async (open) => {
        if (open) {
          resetWizard();
          await fetchFreshCourses();
        }
      }
    );

    const availableCoursesList = computed(() => {
      return internalCourses.value.filter((c) => c.id !== 0);
    });

    // Sincronizar homologaciones si se cargan cursos después
    watch(
      () => availableCoursesList.value,
      (newCourses) => {
        if (!newCourses || newCourses.length === 0) return;
        if (uniqueCoursesList.value.length > 0) {
          uniqueCoursesList.value.forEach((val) => {
            const cleanVal = String(val).trim();
            const matched = newCourses.find(
              (c) => c.name && c.name.trim().toLowerCase() === cleanVal.toLowerCase()
            );
            const current = courseMappings.value[val];
            if (matched && (!current || current.targetCourseId === "NEW")) {
              courseMappings.value[val] = {
                targetCourseId: matched.id,
                newCourseName: "",
              };
            }
          });
        }
      },
      { deep: true }
    );

    const fetchFreshCourses = async () => {
      try {
        const u = usuarioGet();
        if (u?.institute?.id) {
          const res = await axios.get(
            `/courses?instituteId=${u.institute.id}&exist=true`,
            tokenHeader()
          );
          if (Array.isArray(res.data)) {
            internalCourses.value = res.data.sort((a, b) =>
              a.name.localeCompare(b.name)
            );
          }
        }
      } catch (e) {
        console.warn("No se pudieron recargar los cursos:", e);
      }
    };

    const resetWizard = () => {
      currentStep.value = 1;
      selectedFile.value = null;
      isDragging.value = false;
      fileError.value = "";
      rawRows.value = [];
      headerRowNumber.value = 1;
      detectedColumns.value = [];
      fieldMap.value = {
        nameCol: null,
        lastNameCol: null,
        codeCol: null,
        emailCol: null,
        telephoneCol: null,
        headquartersCol: null,
        defaultRole: "student",
      };
      selectedHeadquarters.value = "ALL";
      columnTypes.value = {};
      passwordConfig.value = {
        mode: "column",
        col1: null,
        col2: null,
        fixedValue: "Colegio2026*",
      };
      emailConfig.value = {
        col1: null,
        col2: null,
        domainType: "@yopmail.com",
        customDomain: "@colegio.edu.co",
      };
      hasCourseColumn.value = true;
      courseColumnIndex.value = null;
      uniqueCoursesList.value = [];
      courseMappings.value = {};
      singleCourseConfig.value = {
        targetCourseId: null,
        newCourseName: "",
      };
      isProcessing.value = false;
      processingStatusText.value = "";
    };

    const handleClose = () => {
      if (isProcessing.value) return;
      emit("didDismiss");
    };

    // STEP 1: File handling
    const triggerFileInput = () => {
      if (fileInputRef.value) {
        fileInputRef.value.click();
      }
    };

    const handleFileChange = (e) => {
      const files = e.target.files;
      if (files && files[0]) {
        processUploadedFile(files[0]);
      }
    };

    const handleDrop = (e) => {
      isDragging.value = false;
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        processUploadedFile(files[0]);
      }
    };

    const isHtmlOrXmlBuffer = (uint8Array) => {
      if (uint8Array.length >= 4) {
        if (uint8Array[0] === 0x50 && uint8Array[1] === 0x4b) return false; // zip / xlsx
        if (uint8Array[0] === 0xd0 && uint8Array[1] === 0xcf) return false; // compound binary xls
      }
      let headerText = "";
      for (let i = 0; i < Math.min(uint8Array.length, 1200); i++) {
        headerText += String.fromCharCode(uint8Array[i]);
      }
      const lower = headerText.toLowerCase().trim();
      return (
        lower.includes("<html") ||
        lower.includes("<!doctype") ||
        lower.includes("<table") ||
        lower.includes("xmlns:x=") ||
        lower.includes("<xml") ||
        lower.startsWith("<")
      );
    };

    const parseHtmlSpreadsheet = (uint8Array) => {
      let text = "";
      try {
        const utf8Decoder = new TextDecoder("utf-8", { fatal: false });
        text = utf8Decoder.decode(uint8Array);
      } catch (e) {
        text = "";
      }

      const charsetMatch = text.match(/charset=["']?([\w-]+)/i);
      const detectedCharset = charsetMatch ? charsetMatch[1].toLowerCase() : "";

      if (
        detectedCharset.includes("1252") ||
        detectedCharset.includes("8859") ||
        detectedCharset.includes("latin") ||
        text.includes("\uFFFD") ||
        text.includes("Ã")
      ) {
        try {
          const latinDecoder = new TextDecoder("windows-1252");
          const altText = latinDecoder.decode(uint8Array);
          if (!altText.includes("\uFFFD")) {
            text = altText;
          }
        } catch (e) {
          console.warn("Fallo decodificación windows-1252:", e);
        }
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");

      const tables = Array.from(doc.querySelectorAll("table"));
      if (tables.length === 0) {
        const wb = XLSX.read(text, { type: "string" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      }

      const allRows = [];
      const visitedTr = new Set();

      tables.forEach((table) => {
        const directRows = Array.from(table.rows || table.querySelectorAll("tr"));
        directRows.forEach((tr) => {
          if (visitedTr.has(tr)) return;
          visitedTr.add(tr);

          const rowData = [];
          const cells = Array.from(tr.children).filter(
            (child) => child.tagName === "TD" || child.tagName === "TH"
          );

          if (cells.length === 0) return;

          cells.forEach((cell) => {
            let val = cell.innerText || cell.textContent || "";
            val = val.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
            const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);
            rowData.push(val);
            for (let i = 1; i < colspan; i++) {
              rowData.push("");
            }
          });

          if (rowData.some((c) => c !== "")) {
            allRows.push(rowData);
          }
        });
      });

      const maxCols = allRows.reduce((max, r) => Math.max(max, r.length), 0);
      allRows.forEach((r) => {
        while (r.length < maxCols) {
          r.push("");
        }
      });

      return allRows;
    };

    const processUploadedFile = (file) => {
      fileError.value = "";
      const lowerName = file.name.toLowerCase();
      if (
        !lowerName.endsWith(".xlsx") &&
        !lowerName.endsWith(".xls") &&
        !lowerName.endsWith(".csv") &&
        !lowerName.endsWith(".html") &&
        !lowerName.endsWith(".htm")
      ) {
        fileError.value = "Por favor selecciona un archivo Excel (.xlsx o .xls)";
        return;
      }
      selectedFile.value = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          let jsonData = [];

          if (isHtmlOrXmlBuffer(data)) {
            jsonData = parseHtmlSpreadsheet(data);
          } else {
            try {
              const workbook = XLSX.read(data, { type: "array" });
              const firstSheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[firstSheetName];
              jsonData = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: "",
              });
            } catch (readErr) {
              jsonData = parseHtmlSpreadsheet(data);
            }
          }

          if (!jsonData || jsonData.length === 0) {
            fileError.value = "El archivo no contiene datos legibles.";
            selectedFile.value = null;
            return;
          }

          rawRows.value = jsonData;
          // Auto detect initial header row (first non empty row)
          let autoHeader = 1;
          for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
            if (jsonData[i] && jsonData[i].some((cell) => String(cell).trim() !== "")) {
              autoHeader = i + 1;
              break;
            }
          }
          headerRowNumber.value = autoHeader;
          parseDetectedColumns();
        } catch (err) {
          console.error("Error al leer el archivo Excel/HTML:", err);
          fileError.value = "Hubo un error al leer el archivo. Verifica el formato.";
          selectedFile.value = null;
        }
      };
      reader.readAsArrayBuffer(file);
    };

    // STEP 2: Header row detection
    const rawRowsPreview = computed(() => {
      return rawRows.value.slice(0, Math.min(rawRows.value.length, 12));
    });

    const changeHeaderRow = (num) => {
      if (num < 1 || num > 20 || num > rawRows.value.length) return;
      headerRowNumber.value = num;
      parseDetectedColumns();
    };

    const onHeaderRowChange = () => {
      parseDetectedColumns();
    };

    const parseDetectedColumns = () => {
      const rowIndex = headerRowNumber.value - 1;
      const row = rawRows.value[rowIndex] || [];
      const cols = [];

      row.forEach((cell, idx) => {
        const letter = XLSX.utils.encode_col(idx);
        const label = String(cell).trim() || `Columna ${letter}`;
        cols.push({
          index: idx,
          letter,
          label,
        });
      });

      detectedColumns.value = cols;

      // Initialize default column types
      cols.forEach((c) => {
        if (!columnTypes.value[c.index]) {
          columnTypes.value[c.index] = "text";
        }
      });

      // Auto-suggest fields based on label names
      autoSuggestFieldMappings(cols);
    };

    const autoSuggestFieldMappings = (cols) => {
      cols.forEach((col) => {
        const l = col.label.toLowerCase();
        if (
          !fieldMap.value.nameCol &&
          (l.includes("nombre") || l.includes("primer nombre") || l.includes("nombres")) &&
          !l.includes("apellido")
        ) {
          fieldMap.value.nameCol = col.index;
        } else if (
          !fieldMap.value.lastNameCol &&
          (l.includes("apellido") || l.includes("primer apellido") || l.includes("apellidos"))
        ) {
          fieldMap.value.lastNameCol = col.index;
        } else if (
          !fieldMap.value.codeCol &&
          (l.includes("documento") ||
            l.includes("cédula") ||
            l.includes("cedula") ||
            l.includes("t.i") ||
            l.includes("identific") ||
            l.includes("código") ||
            l.includes("codigo") ||
            l.includes("id"))
        ) {
          fieldMap.value.codeCol = col.index;
          columnTypes.value[col.index] = "number"; // Limpieza de miles por defecto para documento
        } else if (
          !fieldMap.value.emailCol &&
          (l.includes("correo") || l.includes("email") || l.includes("mail"))
        ) {
          fieldMap.value.emailCol = col.index;
        } else if (
          !fieldMap.value.telephoneCol &&
          (l.includes("tel") || l.includes("cel") || l.includes("móvil") || l.includes("movil"))
        ) {
          fieldMap.value.telephoneCol = col.index;
        } else if (
          fieldMap.value.headquartersCol === null &&
          (l.includes("sede") || l.includes("campus") || l.includes("sección") || l.includes("seccion") || l.includes("plantel"))
        ) {
          fieldMap.value.headquartersCol = col.index;
        } else if (
          courseColumnIndex.value === null &&
          (l.includes("curso") || l.includes("grado") || l.includes("grupo"))
        ) {
          courseColumnIndex.value = col.index;
        }
      });

      // Default password to code column if empty
      if (passwordConfig.value.col1 === null && fieldMap.value.codeCol !== null) {
        passwordConfig.value.col1 = fieldMap.value.codeCol;
      }
      // Default email fallback to code column
      if (emailConfig.value.col1 === null && fieldMap.value.codeCol !== null) {
        emailConfig.value.col1 = fieldMap.value.codeCol;
      }
      if (emailConfig.value.col2 === null && fieldMap.value.nameCol !== null) {
        emailConfig.value.col2 = fieldMap.value.nameCol;
      }
    };

    // STEP 3: Mappings & Types
    const uniqueHeadquartersList = computed(() => {
      if (fieldMap.value.headquartersCol === null) return [];
      const rows = rawRows.value.slice(headerRowNumber.value);
      const counts = {};
      rows.forEach((r) => {
        const val = String(r[fieldMap.value.headquartersCol] || "").trim();
        if (val) {
          counts[val] = (counts[val] || 0) + 1;
        }
      });
      return Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });

    const onHeadquartersColChange = () => {
      selectedHeadquarters.value = "ALL";
      extractUniqueCourses();
    };

    const onHeadquartersChange = () => {
      extractUniqueCourses();
    };

    const filteredRows = computed(() => {
      const rows = rawRows.value.slice(headerRowNumber.value);
      if (
        fieldMap.value.headquartersCol === null ||
        selectedHeadquarters.value === "ALL"
      ) {
        return rows;
      }
      return rows.filter((r) => {
        const val = String(r[fieldMap.value.headquartersCol] || "").trim();
        return val === selectedHeadquarters.value;
      });
    });

    const mappedColumnsForTyping = computed(() => {
      const indices = new Set();
      if (fieldMap.value.nameCol !== null) indices.add(fieldMap.value.nameCol);
      if (fieldMap.value.lastNameCol !== null) indices.add(fieldMap.value.lastNameCol);
      if (fieldMap.value.codeCol !== null) indices.add(fieldMap.value.codeCol);
      if (fieldMap.value.emailCol !== null) indices.add(fieldMap.value.emailCol);
      if (fieldMap.value.telephoneCol !== null) indices.add(fieldMap.value.telephoneCol);
      if (fieldMap.value.headquartersCol !== null) indices.add(fieldMap.value.headquartersCol);
      if (courseColumnIndex.value !== null) indices.add(courseColumnIndex.value);

      return detectedColumns.value.filter((c) => indices.has(c.index));
    });

    const sampleGeneratedEmail = computed(() => {
      const row = filteredRows.value[0] || rawRows.value[headerRowNumber.value] || [];
      let val1 = emailConfig.value.col1 !== null ? String(row[emailConfig.value.col1] || "10203040") : "10203040";
      let val2 = emailConfig.value.col2 !== null ? String(row[emailConfig.value.col2] || "") : "";

      const clean1 = sanitizeForEmail(val1);
      const clean2 = sanitizeForEmail(val2);
      const domain =
        emailConfig.value.domainType === "custom"
          ? emailConfig.value.customDomain || "@colegio.edu.co"
          : emailConfig.value.domainType;

      const base = clean2 ? `${clean2}${clean1}` : clean1;
      return `${base || "estudiante"}${domain.startsWith("@") ? domain : "@" + domain}`;
    });

    const sanitizeForEmail = (str) => {
      if (!str) return "";
      return String(str)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remueve tildes
        .replace(/[^\w\d]/g, "") // Remueve espacios y caracteres no alfanuméricos
        .toLowerCase()
        .trim();
    };

    const formatValueByType = (val, type) => {
      if (val === null || val === undefined) return "";
      const s = String(val).trim();
      if (type === "number") {
        // Quitar puntos, comas, espacios, etc. Dejar solo números enteros
        return s.replace(/[^\d]/g, "");
      }
      return s;
    };

    // STEP 4: Courses
    const setHasCourseColumn = (val) => {
      hasCourseColumn.value = val;
      if (val && courseColumnIndex.value !== null) {
        extractUniqueCourses();
      }
    };

    const extractUniqueCourses = () => {
      if (courseColumnIndex.value === null) {
        uniqueCoursesList.value = [];
        return;
      }

      const rows = filteredRows.value;
      const uniqueSet = new Set();

      rows.forEach((r) => {
        const val = r[courseColumnIndex.value];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          uniqueSet.add(String(val).trim());
        }
      });

      const list = Array.from(uniqueSet).sort();
      uniqueCoursesList.value = list;

      // Initialize mappings for each unique course
      list.forEach((val) => {
        const cleanVal = String(val).trim();
        // Check if an existing course has an exact or trimmed case-insensitive match
        const matched = availableCoursesList.value.find(
          (c) => c.name && c.name.trim().toLowerCase() === cleanVal.toLowerCase()
        );

        if (!courseMappings.value[val] || (courseMappings.value[val].targetCourseId === "NEW" && matched)) {
          courseMappings.value[val] = {
            targetCourseId: matched ? matched.id : "NEW",
            newCourseName: matched ? "" : cleanVal,
          };
        }
      });
    };

    // STEP 5: Prepared parsed users
    const parsedUsers = computed(() => {
      if (currentStep.value < 4) return [];
      const rows = filteredRows.value;
      const list = [];

      // 1. Contar frecuencias de los emails del archivo para detectar duplicados / comodines
      const rawEmailFrequency = new Map();
      if (fieldMap.value.emailCol !== null) {
        rows.forEach((r) => {
          const em = String(r[fieldMap.value.emailCol] || "").trim().toLowerCase();
          if (em && em.includes("@")) {
            rawEmailFrequency.set(em, (rawEmailFrequency.get(em) || 0) + 1);
          }
        });
      }

      const assignedEmailsInBatch = new Map();

      rows.forEach((row) => {
        // Check if row is not completely empty
        const hasContent = row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== "");
        if (!hasContent) return;

        // Raw values
        const rawName = fieldMap.value.nameCol !== null ? row[fieldMap.value.nameCol] : "";
        const rawLastName = fieldMap.value.lastNameCol !== null ? row[fieldMap.value.lastNameCol] : "";
        const rawCode = fieldMap.value.codeCol !== null ? row[fieldMap.value.codeCol] : "";
        const rawEmail = fieldMap.value.emailCol !== null ? row[fieldMap.value.emailCol] : "";
        const rawTelephone = fieldMap.value.telephoneCol !== null ? row[fieldMap.value.telephoneCol] : "";

        // Formatted values
        let name = formatValueByType(rawName, columnTypes.value[fieldMap.value.nameCol]);
        let lastName = formatValueByType(rawLastName, columnTypes.value[fieldMap.value.lastNameCol]);

        // Si se seleccionó la misma columna para Nombres y Apellidos
        if (fieldMap.value.nameCol !== null && fieldMap.value.nameCol === fieldMap.value.lastNameCol) {
          const full = (name || lastName || "").trim();
          if (full.includes(",")) {
            const parts = full.split(",");
            lastName = parts[0].trim();
            name = parts.slice(1).join(" ").trim();
          } else {
            const parts = full.split(/\s+/);
            if (parts.length >= 3) {
              lastName = parts.slice(0, 2).join(" ");
              name = parts.slice(2).join(" ");
            } else if (parts.length === 2) {
              lastName = parts[0];
              name = parts[1];
            } else {
              lastName = full;
              name = full;
            }
          }
        }
        const code = formatValueByType(rawCode, columnTypes.value[fieldMap.value.codeCol]);
        const telephone = formatValueByType(rawTelephone, columnTypes.value[fieldMap.value.telephoneCol]);

        // Generate password
        let password = "";
        if (passwordConfig.value.mode === "column") {
          const colVal = passwordConfig.value.col1 !== null ? row[passwordConfig.value.col1] : "";
          password = formatValueByType(colVal, columnTypes.value[passwordConfig.value.col1]) || "123456";
        } else if (passwordConfig.value.mode === "concat") {
          const v1 = passwordConfig.value.col1 !== null ? formatValueByType(row[passwordConfig.value.col1], columnTypes.value[passwordConfig.value.col1]) : "";
          const v2 = passwordConfig.value.col2 !== null ? formatValueByType(row[passwordConfig.value.col2], columnTypes.value[passwordConfig.value.col2]) : "";
          password = `${v1}${v2}` || "123456";
        } else {
          password = passwordConfig.value.fixedValue || "Colegio2026*";
        }

        // Generate email if missing or if duplicate in Excel (wildcard/comodín)
        let email = "";
        let isAutoEmail = false;
        let isDuplicateEmail = false;

        const cleanRawEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : "";
        const isRepeatedInExcel = cleanRawEmail && ((rawEmailFrequency.get(cleanRawEmail) || 0) > 1);

        if (cleanRawEmail && cleanRawEmail.includes("@") && !isRepeatedInExcel) {
          email = String(rawEmail).trim();
        } else {
          isAutoEmail = true;
          if (isRepeatedInExcel) {
            isDuplicateEmail = true;
          }
          let e1 = emailConfig.value.col1 !== null ? String(row[emailConfig.value.col1] || code) : code;
          let e2 = emailConfig.value.col2 !== null ? String(row[emailConfig.value.col2] || name) : "";
          const clean1 = sanitizeForEmail(e1);
          const clean2 = sanitizeForEmail(e2);
          const domain =
            emailConfig.value.domainType === "custom"
              ? emailConfig.value.customDomain || "@colegio.edu.co"
              : emailConfig.value.domainType;

          const base = clean2 ? `${clean2}${clean1}` : clean1;
          email = `${base || "estudiante"}${domain.startsWith("@") ? domain : "@" + domain}`;
        }

        // Deduplicación estricta de correos dentro del lote para evitar colisiones
        let candidateEmail = email.toLowerCase();
        if (assignedEmailsInBatch.has(candidateEmail)) {
          const count = assignedEmailsInBatch.get(candidateEmail) + 1;
          assignedEmailsInBatch.set(candidateEmail, count);
          const atIdx = candidateEmail.lastIndexOf("@");
          if (atIdx > 0) {
            const localPart = candidateEmail.substring(0, atIdx);
            const domPart = candidateEmail.substring(atIdx);
            email = `${localPart}${count}${domPart}`;
          } else {
            email = `${candidateEmail}${count}`;
          }
          assignedEmailsInBatch.set(email.toLowerCase(), 1);
        } else {
          assignedEmailsInBatch.set(candidateEmail, 1);
        }

        // Course assignment resolution
        let courseKey = null;
        let courseDisplayName = "Sin Curso";
        let targetCourseId = null;
        let newCourseName = "";

        if (hasCourseColumn.value && courseColumnIndex.value !== null) {
          const rawCourseVal = String(row[courseColumnIndex.value] || "").trim();
          courseKey = rawCourseVal;
          const mapping = courseMappings.value[rawCourseVal];
          if (mapping) {
            targetCourseId = mapping.targetCourseId;
            newCourseName = mapping.newCourseName;
            if (targetCourseId === "NEW") {
              courseDisplayName = `[Nuevo] ${newCourseName || rawCourseVal}`;
            } else {
              const found = availableCoursesList.value.find((c) => c.id === targetCourseId);
              courseDisplayName = found ? found.name : "Curso Seleccionado";
            }
          }
        } else {
          targetCourseId = singleCourseConfig.value.targetCourseId;
          newCourseName = singleCourseConfig.value.newCourseName;
          if (targetCourseId === "NEW") {
            courseDisplayName = `[Nuevo] ${newCourseName || "Nuevo Curso"}`;
          } else if (targetCourseId) {
            const found = availableCoursesList.value.find((c) => c.id === targetCourseId);
            courseDisplayName = found ? found.name : "Curso Seleccionado";
          }
        }

        list.push({
          name: name || "Sin Nombre",
          lastName: lastName || "Sin Apellido",
          code: code || String(Date.now()),
          email,
          password: password || "123456",
          telephone: telephone || "",
          systemRol: fieldMap.value.defaultRole || "student",
          exist: true,
          isAutoEmail,
          isDuplicateEmail,
          courseDisplayName,
          targetCourseId,
          newCourseName,
          courseKey,
        });
      });

      return list;
    });

    const parsedUsersPreview = computed(() => {
      return parsedUsers.value.slice(0, 5);
    });

    const newCoursesToCreateCount = computed(() => {
      const existingNames = new Set(
        availableCoursesList.value.map((c) => (c.name || "").trim().toLowerCase())
      );
      if (!hasCourseColumn.value) {
        if (singleCourseConfig.value.targetCourseId !== "NEW") return 0;
        const name = (singleCourseConfig.value.newCourseName || "").trim().toLowerCase();
        return name && !existingNames.has(name) ? 1 : 0;
      }
      const set = new Set();
      Object.values(courseMappings.value).forEach((m) => {
        if (m.targetCourseId === "NEW" && m.newCourseName.trim()) {
          const name = m.newCourseName.trim().toLowerCase();
          if (!existingNames.has(name)) {
            set.add(name);
          }
        }
      });
      return set.size;
    });

    const generatedEmailsCount = computed(() => {
      return parsedUsers.value.filter((u) => u.isAutoEmail).length;
    });

    const duplicateEmailsFallbackCount = computed(() => {
      return parsedUsers.value.filter((u) => u.isDuplicateEmail).length;
    });

    // NAVIGATION
    const canProceedStep = computed(() => {
      if (currentStep.value === 1) {
        return !!selectedFile.value && rawRows.value.length > 0;
      }
      if (currentStep.value === 2) {
        return headerRowNumber.value >= 1 && detectedColumns.value.length > 0;
      }
      if (currentStep.value === 3) {
        return (
          fieldMap.value.nameCol !== null &&
          fieldMap.value.lastNameCol !== null &&
          fieldMap.value.codeCol !== null
        );
      }
      if (currentStep.value === 4) {
        if (!hasCourseColumn.value) {
          if (!singleCourseConfig.value.targetCourseId) return false;
          if (
            singleCourseConfig.value.targetCourseId === "NEW" &&
            !singleCourseConfig.value.newCourseName.trim()
          ) {
            return false;
          }
          return true;
        } else {
          if (courseColumnIndex.value === null) return false;
          // Verify all unique courses are mapped
          for (const val of uniqueCoursesList.value) {
            const m = courseMappings.value[val];
            if (!m || !m.targetCourseId) return false;
            if (m.targetCourseId === "NEW" && !m.newCourseName.trim()) return false;
          }
          return true;
        }
      }
      return true;
    });

    const nextStep = () => {
      if (!canProceedStep.value) return;
      if (currentStep.value === 3 && hasCourseColumn.value && courseColumnIndex.value !== null) {
        extractUniqueCourses();
      }
      currentStep.value++;
    };

    const prevStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--;
      }
    };

    const goToStep = (stepNum) => {
      if (isProcessing.value) return;
      if (stepNum < currentStep.value) {
        currentStep.value = stepNum;
      } else if (stepNum === currentStep.value + 1 && canProceedStep.value) {
        nextStep();
      }
    };

    // STEP 5: EXECUTION
    const executeImport = async () => {
      if (isProcessing.value || parsedUsers.value.length === 0) return;

      isProcessing.value = true;
      processingStatusText.value = "Iniciando proceso de importación...";

      try {
        const currentUser = usuarioGet();
        const instituteId = currentUser?.institute?.id;

        if (!instituteId) {
          throw new Error("No se detectó el identificador del instituto del usuario.");
        }

        // 1. Consultar cursos actuales del instituto para prevenir duplicados
        processingStatusText.value = "Consultando cursos existentes en el sistema...";
        let currentCourses = [];
        try {
          const freshCoursesRes = await axios.get(
            `/courses?instituteId=${instituteId}&exist=true`,
            tokenHeader()
          );
          if (Array.isArray(freshCoursesRes.data)) {
            currentCourses = freshCoursesRes.data;
            internalCourses.value = freshCoursesRes.data.sort((a, b) =>
              a.name.localeCompare(b.name)
            );
          }
        } catch (fetchErr) {
          console.warn("No se pudo refrescar cursos antes de importar, usando lista en memoria:", fetchErr);
          currentCourses = [...availableCoursesList.value];
        }

        const findExistingCourseByName = (nameToFind) => {
          if (!nameToFind) return null;
          const target = nameToFind.trim().toLowerCase();
          return currentCourses.find(
            (c) => c.name && c.name.trim().toLowerCase() === target
          );
        };

        const resolvedCoursesCache = new Map(); // key -> id
        let newlyCreatedCoursesCount = 0;

        if (!hasCourseColumn.value) {
          if (
            singleCourseConfig.value.targetCourseId === "NEW" &&
            singleCourseConfig.value.newCourseName.trim()
          ) {
            const rawName = singleCourseConfig.value.newCourseName.trim();
            const existing = findExistingCourseByName(rawName);
            if (existing) {
              resolvedCoursesCache.set("SINGLE_COURSE", existing.id);
            } else {
              processingStatusText.value = `Creando curso "${rawName}"...`;
              const res = await axios.post(
                "/courses",
                { name: rawName, instituteId, exist: true },
                tokenHeader()
              );
              resolvedCoursesCache.set("SINGLE_COURSE", res.data.id);
              currentCourses.push(res.data);
              internalCourses.value.push(res.data);
              newlyCreatedCoursesCount++;
            }
          }
        } else {
          for (const val of uniqueCoursesList.value) {
            const m = courseMappings.value[val];
            if (m && m.targetCourseId === "NEW" && m.newCourseName.trim()) {
              const rawName = m.newCourseName.trim();
              const key = rawName.toLowerCase();
              if (!resolvedCoursesCache.has(key)) {
                const existing = findExistingCourseByName(rawName);
                if (existing) {
                  // Ya existía en la institución: reutilizar id y NO volver a crearlo
                  resolvedCoursesCache.set(key, existing.id);
                } else {
                  processingStatusText.value = `Creando curso "${rawName}"...`;
                  const res = await axios.post(
                    "/courses",
                    { name: rawName, instituteId, exist: true },
                    tokenHeader()
                  );
                  resolvedCoursesCache.set(key, res.data.id);
                  currentCourses.push(res.data);
                  internalCourses.value.push(res.data);
                  newlyCreatedCoursesCount++;
                }
              }
            }
          }
        }

        // 2. Resolver el courseId final de cada usuario
        processingStatusText.value = "Asignando cursos y formateando usuarios...";
        const usersToSend = parsedUsers.value.map((u) => {
          let resolvedCourseId = null;

          if (!hasCourseColumn.value) {
            if (singleCourseConfig.value.targetCourseId === "NEW") {
              resolvedCourseId = resolvedCoursesCache.get("SINGLE_COURSE");
            } else {
              resolvedCourseId = singleCourseConfig.value.targetCourseId;
            }
          } else {
            if (u.targetCourseId === "NEW") {
              const key = u.newCourseName.trim().toLowerCase();
              resolvedCourseId = resolvedCoursesCache.get(key);
            } else {
              resolvedCourseId = u.targetCourseId;
            }
          }

          return {
            name: u.name,
            lastName: u.lastName,
            email: u.email,
            code: String(u.code),
            password: String(u.password),
            telephone: String(u.telephone || ""),
            systemRol: u.systemRol,
            courseId: resolvedCourseId ? Number(resolvedCourseId) : undefined,
            exist: true,
          };
        });

        // 3. Enviar lote masivo
        processingStatusText.value = `Guardando ${usersToSend.length} usuarios en la base de datos...`;
        await axios.post(
          "/users/bulk",
          { users: usersToSend },
          tokenHeader()
        );

        // 4. Éxito
        const alert = await alertController.create({
          header: "¡Importación Exitosa!",
          message: `Se importaron correctamente ${usersToSend.length} usuarios${
            newlyCreatedCoursesCount > 0
              ? ` y se crearon ${newlyCreatedCoursesCount} nuevo(s) curso(s)`
              : ""
          }.`,
          buttons: ["Continuar"],
        });
        await alert.present();

        emit("success");
        emit("didDismiss");
      } catch (err) {
        console.error("Error al importar usuarios masivamente:", err);
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Ocurrió un error inesperado al procesar la importación.";

        const alert = await alertController.create({
          header: "Error en la Importación",
          message: `No se pudo completar la importación: ${
            Array.isArray(errMsg) ? errMsg.join("<br>") : errMsg
          }`,
          buttons: ["Entendido"],
        });
        await alert.present();
      } finally {
        isProcessing.value = false;
        processingStatusText.value = "";
      }
    };

    return {
      currentStep,
      steps,
      fileInputRef,
      selectedFile,
      isDragging,
      fileError,
      rawRows,
      headerRowNumber,
      detectedColumns,
      rawRowsPreview,
      fieldMap,
      columnTypes,
      passwordConfig,
      emailConfig,
      hasCourseColumn,
      courseColumnIndex,
      uniqueCoursesList,
      courseMappings,
      singleCourseConfig,
      internalCourses,
      availableCoursesList,
      isProcessing,
      processingStatusText,
      mappedColumnsForTyping,
      sampleGeneratedEmail,
      parsedUsers,
      parsedUsersPreview,
      newCoursesToCreateCount,
      generatedEmailsCount,
      duplicateEmailsFallbackCount,
      canProceedStep,
      handleClose,
      triggerFileInput,
      handleFileChange,
      handleDrop,
      changeHeaderRow,
      onHeaderRowChange,
      setHasCourseColumn,
      extractUniqueCourses,
      nextStep,
      prevStep,
      goToStep,
      executeImport,
      selectedHeadquarters,
      uniqueHeadquartersList,
      onHeadquartersColChange,
      onHeadquartersChange,
      filteredRows,
      // Icons
      closeOutline,
      checkmarkOutline,
      cloudUploadOutline,
      documentTextOutline,
      alertCircleOutline,
      personOutline,
      layersOutline,
      keyOutline,
      mailOutline,
      schoolOutline,
      businessOutline,
      checkmarkCircleOutline,
      arrowBackOutline,
      arrowForwardOutline,
    };
  },
});
</script>

<style>
.qz-import-wizard-modal {
  --width: 92%;
  --max-width: 900px;
  --height: 90vh;
  --border-radius: 24px;
  --background: #ffffff;
}

.qz-wizard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  color: #1e1b4b;
  overflow: hidden;
}

/* HEADER */
.qz-wizard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px 16px 28px;
  border-bottom: 1px solid #eef0f6;
}

.qz-wizard-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: #6a5ae0;
  background: rgba(106, 90, 224, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
  margin-bottom: 4px;
}

.qz-wizard-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #1e1b4b;
}

.qz-wizard-close-btn {
  background: #f1f3f9;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-wizard-close-btn:hover {
  background: #e2e5f0;
  color: #111;
}

/* STEPPER */
.qz-stepper-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 28px;
  background: #f8fafc;
  border-bottom: 1px solid #eef0f6;
  overflow-x: auto;
  gap: 12px;
}

.qz-step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.2s ease;
  white-space: nowrap;
}

.qz-step-item:hover {
  opacity: 0.85;
}

.qz-step--active {
  opacity: 1 !important;
}

.qz-step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.qz-step--active .qz-step-circle {
  background: #6a5ae0;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(106, 90, 224, 0.35);
}

.qz-step--completed .qz-step-circle {
  background: #10b981;
  color: #ffffff;
}

.qz-step-label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.qz-step--active .qz-step-label {
  color: #6a5ae0;
}

/* BODY */
.qz-wizard-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.qz-step-pane {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.qz-step-desc-box {
  margin-bottom: 4px;
}

.qz-pane-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 800;
  color: #1e1b4b;
}

.qz-pane-subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.4;
}

/* DROPZONE */
.qz-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 20px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.qz-dropzone:hover,
.qz-dropzone--dragover {
  border-color: #6a5ae0;
  background: rgba(106, 90, 224, 0.04);
}

.qz-dropzone--has-file {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.04);
}

.qz-dropzone-icon {
  font-size: 48px;
  color: #6a5ae0;
}

.qz-dropzone--has-file .qz-dropzone-icon {
  color: #10b981;
}

.qz-file-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e1b4b;
}

.qz-drop-prompt {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #334155;
}

.qz-drop-hint {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.qz-alert-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

/* PASO 2: HEADER ROW */
.qz-header-selector-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #f8fafc;
  padding: 16px 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.qz-row-stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-stepper-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}

.qz-stepper-btn:hover:not(:disabled) {
  border-color: #6a5ae0;
  color: #6a5ae0;
}

.qz-row-native-select {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  font-size: 14px;
  font-weight: 700;
  color: #1e1b4b;
}

.qz-preview-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
}

.qz-table-preview-title {
  margin: 0;
  padding: 12px 16px;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.qz-table-scroll {
  max-height: 240px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.qz-sheet-preview-table,
.qz-final-preview-table {
  width: 100%;
  min-width: 480px;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.qz-sheet-preview-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  white-space: nowrap;
}

.qz-cell--row-num {
  width: 40px;
  background: #f8fafc;
  text-align: center;
  border-right: 1px solid #e2e8f0;
}

.qz-row-num-tag {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}

.qz-row--header-active {
  background: rgba(106, 90, 224, 0.08) !important;
}

.qz-row--header-active .qz-cell--row-num {
  background: #6a5ae0;
}

.qz-row--header-active .qz-row-num-tag {
  color: #ffffff;
}

.qz-row--header-active td {
  font-weight: 700;
  color: #6a5ae0;
}

/* PASO 3: SECTIONS & CARDS */
.qz-card-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 20px;
}

.qz-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6a5ae0;
  font-size: 18px;
  margin-bottom: 4px;
}

.qz-section-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #1e1b4b;
}

.qz-section-desc {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: #64748b;
}

.qz-grid-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.qz-field-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-field-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.qz-required {
  color: #ef4444;
}

.qz-select,
.qz-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1e1b4b;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.2s ease;
}

.qz-select:focus,
.qz-input:focus {
  border-color: #6a5ae0;
}

/* TYPES PILLS */
.qz-types-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.qz-type-col-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e1b4b;
}

.qz-type-pill-group {
  display: flex;
  gap: 6px;
}

.qz-type-pill {
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-type-pill--active {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
}

/* RADIOS */
.qz-radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.qz-radio-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.qz-radio-option:hover {
  border-color: #6a5ae0;
}

.qz-radio-content strong {
  display: block;
  font-size: 14px;
  color: #1e1b4b;
}

.qz-radio-content span {
  font-size: 12px;
  color: #64748b;
}

.qz-sub-options-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}

.qz-two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.qz-live-email-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 14px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  font-size: 13px;
  color: #065f46;
}

/* PASO 4: CURSOS */
.qz-course-mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.qz-mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-mode-btn ion-icon {
  font-size: 20px;
}

.qz-mode-btn--active {
  border-color: #6a5ae0;
  background: rgba(106, 90, 224, 0.06);
  color: #6a5ae0;
}

.qz-homologation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 280px;
  overflow-y: auto;
}

.qz-homologation-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.qz-homo-source {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

.qz-homo-tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #6a5ae0;
}

.qz-homo-source-text {
  font-size: 15px;
  color: #1e1b4b;
}

.qz-homo-target {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-new-course-input-wrap {
  margin-top: 4px;
}

/* PASO 5: RESUMEN */
.qz-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.qz-metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 18px;
  text-align: center;
}

.qz-metric-value {
  font-size: 32px;
  font-weight: 800;
  color: #6a5ae0;
}

.qz-metric-label {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  margin-top: 4px;
}

.qz-final-preview-table th {
  padding: 10px 14px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  border-bottom: 2px solid #e2e8f0;
}

.qz-final-preview-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  white-space: nowrap;
}

.qz-badge-auto {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  background: #e0f2fe;
  color: #0284c7;
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 6px;
}

.qz-badge-duplicate {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  background: #fef3c7;
  color: #b45309;
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 6px;
}

:global(body.dark) .qz-badge-duplicate,
:global(html.dark) .qz-badge-duplicate,
:global(.dark) .qz-badge-duplicate {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.qz-badge-course {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  background: rgba(106, 90, 224, 0.1);
  color: #6a5ae0;
  padding: 3px 8px;
  border-radius: 8px;
}

.qz-processing-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding: 24px;
  background: rgba(106, 90, 224, 0.05);
  border: 1px solid rgba(106, 90, 224, 0.2);
  border-radius: 16px;
  color: #6a5ae0;
  font-size: 15px;
  font-weight: 700;
}

/* FOOTER */
.qz-wizard-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 28px;
  border-top: 1px solid #eef0f6;
  background: #ffffff;
}

.qz-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qz-btn--secondary {
  background: #f1f5f9;
  color: #475569;
}

.qz-btn--secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.qz-btn--cancel {
  background: transparent;
  color: #64748b;
}

.qz-btn--cancel:hover:not(:disabled) {
  color: #1e1b4b;
}

.qz-btn--primary {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-btn--primary:hover:not(:disabled) {
  background: #5b4bd4;
}

.qz-btn--confirm-import {
  background: #10b981;
  color: #ffffff;
  padding: 12px 24px;
  font-size: 15px;
}

.qz-btn--confirm-import:hover:not(:disabled) {
  background: #059669;
}

/* ========================================================================== */
/* RESPONSIVE DESIGN - PANTALLAS PEQUEÑAS (TABLETS & SMARTPHONES)             */
/* ========================================================================== */
@media (max-width: 768px) {
  .qz-import-wizard-modal {
    --width: 96%;
    --height: 94vh;
    --border-radius: 20px;
  }
}

@media (max-width: 640px) {
  .qz-import-wizard-modal {
    --width: 100%;
    --height: 100%;
    --max-width: 100%;
    --border-radius: 0px;
  }

  .qz-wizard-header {
    padding: 12px 16px;
  }

  .qz-wizard-title {
    font-size: 16px;
  }

  .qz-wizard-badge {
    font-size: 10px;
    padding: 2px 8px;
  }

  .qz-wizard-close-btn {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .qz-stepper-bar {
    padding: 10px 14px;
    gap: 8px;
    justify-content: flex-start;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .qz-stepper-bar::-webkit-scrollbar {
    display: none;
  }

  .qz-step-circle {
    width: 26px;
    height: 26px;
    font-size: 12px;
  }

  .qz-step-label {
    font-size: 12px;
  }

  .qz-wizard-body {
    padding: 16px 14px;
  }

  .qz-pane-title {
    font-size: 16px;
  }

  .qz-pane-subtitle {
    font-size: 13px;
  }

  .qz-dropzone {
    padding: 24px 14px;
    gap: 8px;
    border-radius: 16px;
  }

  .qz-dropzone-icon {
    font-size: 38px;
  }

  .qz-drop-prompt {
    font-size: 14px;
  }

  .qz-drop-hint {
    font-size: 12px;
  }

  .qz-header-selector-card {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 14px;
  }

  .qz-row-stepper {
    width: 100%;
    justify-content: space-between;
  }

  .qz-row-native-select {
    flex: 1;
  }

  .qz-grid-fields {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .qz-two-cols {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .qz-card-section {
    padding: 14px;
    border-radius: 14px;
  }

  .qz-course-mode-toggle {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .qz-mode-btn {
    padding: 12px 14px;
    font-size: 13.5px;
  }

  .qz-homologation-card {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 14px;
  }

  .qz-homo-source {
    min-width: 100%;
  }

  .qz-metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;
  }

  .qz-metric-card {
    padding: 12px 8px;
    border-radius: 14px;
  }

  .qz-metric-value {
    font-size: 24px;
  }

  .qz-metric-label {
    font-size: 11.5px;
  }

  .qz-wizard-footer {
    padding: 12px 14px;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .qz-btn {
    padding: 9px 14px;
    font-size: 13px;
  }

  .qz-btn--confirm-import {
    width: 100%;
    order: -1;
    justify-content: center;
    padding: 12px 16px;
    font-size: 14.5px;
  }
}

@media (max-width: 480px) {
  /* En smartphones pequeños, mostrar solo el texto del paso activo para un stepper limpio */
  .qz-step-item:not(.qz-step--active) .qz-step-label {
    display: none;
  }

  .qz-type-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px 12px;
  }

  .qz-type-pill-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    width: 100%;
    gap: 6px;
  }

  .qz-type-pill {
    text-align: center;
    padding: 6px 4px;
  }

  .qz-wizard-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .qz-wizard-footer .qz-btn {
    width: 100%;
    justify-content: center;
  }
}

/* ========================================================================== */
/* DARK THEME - Soporte por clase (.dark, body.dark, html.dark, :root)       */
/* ========================================================================== */
body.dark .qz-import-wizard-modal,
html.dark .qz-import-wizard-modal,
.dark .qz-import-wizard-modal,
:root[data-theme="dark"] .qz-import-wizard-modal {
  --background: #1d1838 !important;
}

body.dark .qz-wizard-container,
html.dark .qz-wizard-container,
.dark .qz-wizard-container,
:root[data-theme="dark"] .qz-wizard-container {
  background: #1d1838 !important;
  color: #f8fafc !important;
}

body.dark .qz-wizard-header,
html.dark .qz-wizard-header,
.dark .qz-wizard-header,
:root[data-theme="dark"] .qz-wizard-header,
body.dark .qz-wizard-footer,
html.dark .qz-wizard-footer,
.dark .qz-wizard-footer,
:root[data-theme="dark"] .qz-wizard-footer,
body.dark .qz-stepper-bar,
html.dark .qz-stepper-bar,
.dark .qz-stepper-bar,
:root[data-theme="dark"] .qz-stepper-bar {
  background: #231d42 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-wizard-badge,
html.dark .qz-wizard-badge,
.dark .qz-wizard-badge,
:root[data-theme="dark"] .qz-wizard-badge {
  background: rgba(124, 110, 242, 0.2) !important;
  color: #a39bf0 !important;
}

body.dark .qz-wizard-title,
html.dark .qz-wizard-title,
.dark .qz-wizard-title,
:root[data-theme="dark"] .qz-wizard-title,
body.dark .qz-pane-title,
html.dark .qz-pane-title,
.dark .qz-pane-title,
:root[data-theme="dark"] .qz-pane-title {
  color: #ffffff !important;
}

body.dark .qz-wizard-close-btn,
html.dark .qz-wizard-close-btn,
.dark .qz-wizard-close-btn,
:root[data-theme="dark"] .qz-wizard-close-btn {
  background: #28214b !important;
  color: #f7f7fd !important;
}

body.dark .qz-wizard-close-btn:hover,
html.dark .qz-wizard-close-btn:hover,
.dark .qz-wizard-close-btn:hover,
:root[data-theme="dark"] .qz-wizard-close-btn:hover {
  background: #352c63 !important;
  color: #ffffff !important;
}

body.dark .qz-card-section,
html.dark .qz-card-section,
.dark .qz-card-section,
:root[data-theme="dark"] .qz-card-section,
body.dark .qz-header-selector-card,
html.dark .qz-header-selector-card,
.dark .qz-header-selector-card,
:root[data-theme="dark"] .qz-header-selector-card,
body.dark .qz-metric-card,
html.dark .qz-metric-card,
.dark .qz-metric-card,
:root[data-theme="dark"] .qz-metric-card {
  background: #231d42 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-select,
html.dark .qz-select,
.dark .qz-select,
:root[data-theme="dark"] .qz-select,
body.dark .qz-input,
html.dark .qz-input,
.dark .qz-input,
:root[data-theme="dark"] .qz-input,
body.dark .qz-row-native-select,
html.dark .qz-row-native-select,
.dark .qz-row-native-select,
:root[data-theme="dark"] .qz-row-native-select {
  background: #17132e !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}

body.dark .qz-select option,
html.dark .qz-select option,
.dark .qz-select option,
:root[data-theme="dark"] .qz-select option,
body.dark .qz-row-native-select option,
html.dark .qz-row-native-select option,
.dark .qz-row-native-select option,
:root[data-theme="dark"] .qz-row-native-select option {
  background: #17132e !important;
  color: #ffffff !important;
}

body.dark .qz-select:focus,
html.dark .qz-select:focus,
.dark .qz-select:focus,
:root[data-theme="dark"] .qz-select:focus,
body.dark .qz-input:focus,
html.dark .qz-input:focus,
.dark .qz-input:focus,
:root[data-theme="dark"] .qz-input:focus {
  border-color: #7c6ef2 !important;
}

body.dark .qz-stepper-btn,
html.dark .qz-stepper-btn,
.dark .qz-stepper-btn,
:root[data-theme="dark"] .qz-stepper-btn {
  background: #17132e !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #e2e8f0 !important;
}

body.dark .qz-dropzone,
html.dark .qz-dropzone,
.dark .qz-dropzone,
:root[data-theme="dark"] .qz-dropzone {
  background: #231d42 !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
}

body.dark .qz-dropzone:hover,
html.dark .qz-dropzone:hover,
.dark .qz-dropzone:hover,
:root[data-theme="dark"] .qz-dropzone:hover,
body.dark .qz-dropzone--dragover,
html.dark .qz-dropzone--dragover,
.dark .qz-dropzone--dragover,
:root[data-theme="dark"] .qz-dropzone--dragover {
  background: rgba(124, 110, 242, 0.12) !important;
  border-color: #7c6ef2 !important;
}

body.dark .qz-dropzone--has-file,
html.dark .qz-dropzone--has-file,
.dark .qz-dropzone--has-file,
:root[data-theme="dark"] .qz-dropzone--has-file {
  background: rgba(16, 185, 129, 0.12) !important;
  border-color: #10b981 !important;
}

body.dark .qz-type-row,
html.dark .qz-type-row,
.dark .qz-type-row,
:root[data-theme="dark"] .qz-type-row,
body.dark .qz-radio-option,
html.dark .qz-radio-option,
.dark .qz-radio-option,
:root[data-theme="dark"] .qz-radio-option,
body.dark .qz-sub-options-box,
html.dark .qz-sub-options-box,
.dark .qz-sub-options-box,
:root[data-theme="dark"] .qz-sub-options-box,
body.dark .qz-homologation-card,
html.dark .qz-homologation-card,
.dark .qz-homologation-card,
:root[data-theme="dark"] .qz-homologation-card {
  background: #17132e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-radio-option:hover,
html.dark .qz-radio-option:hover,
.dark .qz-radio-option:hover,
:root[data-theme="dark"] .qz-radio-option:hover {
  border-color: #7c6ef2 !important;
}

body.dark .qz-field-label,
html.dark .qz-field-label,
.dark .qz-field-label,
:root[data-theme="dark"] .qz-field-label {
  color: #cbd5e1 !important;
}

body.dark .qz-section-header,
html.dark .qz-section-header,
.dark .qz-section-header,
:root[data-theme="dark"] .qz-section-header {
  color: #a39bf0 !important;
}

body.dark .qz-section-header h4,
html.dark .qz-section-header h4,
.dark .qz-section-header h4,
:root[data-theme="dark"] .qz-section-header h4,
body.dark .qz-radio-content strong,
html.dark .qz-radio-content strong,
.dark .qz-radio-content strong,
:root[data-theme="dark"] .qz-radio-content strong,
body.dark .qz-homo-source-text,
html.dark .qz-homo-source-text,
.dark .qz-homo-source-text,
:root[data-theme="dark"] .qz-homo-source-text,
body.dark .qz-file-name,
html.dark .qz-file-name,
.dark .qz-file-name,
:root[data-theme="dark"] .qz-file-name,
body.dark .qz-type-col-name,
html.dark .qz-type-col-name,
.dark .qz-type-col-name,
:root[data-theme="dark"] .qz-type-col-name {
  color: #ffffff !important;
}

body.dark .qz-drop-prompt,
html.dark .qz-drop-prompt,
.dark .qz-drop-prompt,
:root[data-theme="dark"] .qz-drop-prompt {
  color: #f1f5f9 !important;
}

body.dark .qz-pane-subtitle,
html.dark .qz-pane-subtitle,
.dark .qz-pane-subtitle,
:root[data-theme="dark"] .qz-pane-subtitle,
body.dark .qz-section-desc,
html.dark .qz-section-desc,
.dark .qz-section-desc,
:root[data-theme="dark"] .qz-section-desc,
body.dark .qz-drop-hint,
html.dark .qz-drop-hint,
.dark .qz-drop-hint,
:root[data-theme="dark"] .qz-drop-hint,
body.dark .qz-radio-content span,
html.dark .qz-radio-content span,
.dark .qz-radio-content span,
:root[data-theme="dark"] .qz-radio-content span {
  color: #94a3b8 !important;
}

body.dark .qz-step-circle,
html.dark .qz-step-circle,
.dark .qz-step-circle,
:root[data-theme="dark"] .qz-step-circle {
  background: #28214b !important;
  color: #94a3b8 !important;
}

body.dark .qz-step--active .qz-step-circle,
html.dark .qz-step--active .qz-step-circle,
.dark .qz-step--active .qz-step-circle,
:root[data-theme="dark"] .qz-step--active .qz-step-circle {
  background: #7c6ef2 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 10px rgba(124, 110, 242, 0.4) !important;
}

body.dark .qz-step--completed .qz-step-circle,
html.dark .qz-step--completed .qz-step-circle,
.dark .qz-step--completed .qz-step-circle,
:root[data-theme="dark"] .qz-step--completed .qz-step-circle {
  background: #10b981 !important;
  color: #ffffff !important;
}

body.dark .qz-step-label,
html.dark .qz-step-label,
.dark .qz-step-label,
:root[data-theme="dark"] .qz-step-label {
  color: #94a3b8 !important;
}

body.dark .qz-step--active .qz-step-label,
html.dark .qz-step--active .qz-step-label,
.dark .qz-step--active .qz-step-label,
:root[data-theme="dark"] .qz-step--active .qz-step-label {
  color: #a39bf0 !important;
}

body.dark .qz-mode-btn,
html.dark .qz-mode-btn,
.dark .qz-mode-btn,
:root[data-theme="dark"] .qz-mode-btn {
  background: #231d42 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #cbd5e1 !important;
}

body.dark .qz-mode-btn:hover,
html.dark .qz-mode-btn:hover,
.dark .qz-mode-btn:hover,
:root[data-theme="dark"] .qz-mode-btn:hover {
  border-color: #7c6ef2 !important;
  color: #ffffff !important;
}

body.dark .qz-mode-btn--active,
html.dark .qz-mode-btn--active,
.dark .qz-mode-btn--active,
:root[data-theme="dark"] .qz-mode-btn--active {
  background: rgba(124, 110, 242, 0.18) !important;
  border-color: #7c6ef2 !important;
  color: #a39bf0 !important;
}

body.dark .qz-type-pill,
html.dark .qz-type-pill,
.dark .qz-type-pill,
:root[data-theme="dark"] .qz-type-pill {
  background: #231d42 !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #94a3b8 !important;
}

body.dark .qz-type-pill:hover,
html.dark .qz-type-pill:hover,
.dark .qz-type-pill:hover,
:root[data-theme="dark"] .qz-type-pill:hover {
  border-color: #7c6ef2 !important;
  color: #cbd5e1 !important;
}

body.dark .qz-type-pill--active,
html.dark .qz-type-pill--active,
.dark .qz-type-pill--active,
:root[data-theme="dark"] .qz-type-pill--active {
  background: #6a5ae0 !important;
  color: #ffffff !important;
  border-color: #6a5ae0 !important;
}

body.dark .qz-live-email-preview,
html.dark .qz-live-email-preview,
.dark .qz-live-email-preview,
:root[data-theme="dark"] .qz-live-email-preview {
  background: rgba(16, 185, 129, 0.12) !important;
  border-color: rgba(16, 185, 129, 0.25) !important;
  color: #34d399 !important;
}

body.dark .qz-preview-table-wrap,
html.dark .qz-preview-table-wrap,
.dark .qz-preview-table-wrap,
:root[data-theme="dark"] .qz-preview-table-wrap {
  background: #17132e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-table-preview-title,
html.dark .qz-table-preview-title,
.dark .qz-table-preview-title,
:root[data-theme="dark"] .qz-table-preview-title,
body.dark .qz-final-preview-table th,
html.dark .qz-final-preview-table th,
.dark .qz-final-preview-table th,
:root[data-theme="dark"] .qz-final-preview-table th {
  background: #231d42 !important;
  color: #cbd5e1 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-cell--row-num,
html.dark .qz-cell--row-num,
.dark .qz-cell--row-num,
:root[data-theme="dark"] .qz-cell--row-num {
  background: #231d42 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-sheet-preview-table td,
html.dark .qz-sheet-preview-table td,
.dark .qz-sheet-preview-table td,
:root[data-theme="dark"] .qz-sheet-preview-table td,
body.dark .qz-final-preview-table td,
html.dark .qz-final-preview-table td,
.dark .qz-final-preview-table td,
:root[data-theme="dark"] .qz-final-preview-table td {
  border-color: rgba(255, 255, 255, 0.05) !important;
  color: #e2e8f0 !important;
}

body.dark .qz-homo-tag,
html.dark .qz-homo-tag,
.dark .qz-homo-tag,
:root[data-theme="dark"] .qz-homo-tag {
  color: #a39bf0 !important;
}

body.dark .qz-metric-value,
html.dark .qz-metric-value,
.dark .qz-metric-value,
:root[data-theme="dark"] .qz-metric-value {
  color: #a39bf0 !important;
}

body.dark .qz-metric-label,
html.dark .qz-metric-label,
.dark .qz-metric-label,
:root[data-theme="dark"] .qz-metric-label {
  color: #94a3b8 !important;
}

body.dark .qz-badge-auto,
html.dark .qz-badge-auto,
.dark .qz-badge-auto,
:root[data-theme="dark"] .qz-badge-auto {
  background: rgba(2, 132, 199, 0.25) !important;
  color: #38bdf8 !important;
}

body.dark .qz-badge-duplicate,
html.dark .qz-badge-duplicate,
.dark .qz-badge-duplicate,
:root[data-theme="dark"] .qz-badge-duplicate {
  background: rgba(245, 158, 11, 0.25) !important;
  color: #fbbf24 !important;
}

body.dark .qz-badge-course,
html.dark .qz-badge-course,
.dark .qz-badge-course,
:root[data-theme="dark"] .qz-badge-course {
  background: rgba(124, 110, 242, 0.25) !important;
  color: #a39bf0 !important;
}

body.dark .qz-processing-box,
html.dark .qz-processing-box,
.dark .qz-processing-box,
:root[data-theme="dark"] .qz-processing-box {
  background: rgba(124, 110, 242, 0.12) !important;
  border-color: rgba(124, 110, 242, 0.3) !important;
  color: #a39bf0 !important;
}

body.dark .qz-btn--secondary,
html.dark .qz-btn--secondary,
.dark .qz-btn--secondary,
:root[data-theme="dark"] .qz-btn--secondary {
  background: #28214b !important;
  color: #cbd5e1 !important;
}

body.dark .qz-btn--secondary:hover:not(:disabled),
html.dark .qz-btn--secondary:hover:not(:disabled),
.dark .qz-btn--secondary:hover:not(:disabled),
:root[data-theme="dark"] .qz-btn--secondary:hover:not(:disabled) {
  background: #352c63 !important;
  color: #ffffff !important;
}

body.dark .qz-btn--cancel,
html.dark .qz-btn--cancel,
.dark .qz-btn--cancel,
:root[data-theme="dark"] .qz-btn--cancel {
  color: #94a3b8 !important;
}

body.dark .qz-btn--cancel:hover:not(:disabled),
html.dark .qz-btn--cancel:hover:not(:disabled),
.dark .qz-btn--cancel:hover:not(:disabled),
:root[data-theme="dark"] .qz-btn--cancel:hover:not(:disabled) {
  color: #ffffff !important;
}

/* ========================================================================== */
/* DARK THEME - Soporte por media query (prefers-color-scheme: dark)         */
/* ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-import-wizard-modal {
    --background: #1d1838 !important;
  }
  body:not(.light) .qz-wizard-container {
    background: #1d1838 !important;
    color: #f8fafc !important;
  }
  body:not(.light) .qz-wizard-header,
  body:not(.light) .qz-wizard-footer,
  body:not(.light) .qz-stepper-bar {
    background: #231d42 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-wizard-badge {
    background: rgba(124, 110, 242, 0.2) !important;
    color: #a39bf0 !important;
  }
  body:not(.light) .qz-wizard-title,
  body:not(.light) .qz-pane-title {
    color: #ffffff !important;
  }
  body:not(.light) .qz-wizard-close-btn {
    background: #28214b !important;
    color: #f7f7fd !important;
  }
  body:not(.light) .qz-wizard-close-btn:hover {
    background: #352c63 !important;
    color: #ffffff !important;
  }
  body:not(.light) .qz-card-section,
  body:not(.light) .qz-header-selector-card,
  body:not(.light) .qz-metric-card {
    background: #231d42 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-select,
  body:not(.light) .qz-input,
  body:not(.light) .qz-row-native-select {
    background: #17132e !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    color: #ffffff !important;
  }
  body:not(.light) .qz-select option,
  body:not(.light) .qz-row-native-select option {
    background: #17132e !important;
    color: #ffffff !important;
  }
  body:not(.light) .qz-select:focus,
  body:not(.light) .qz-input:focus {
    border-color: #7c6ef2 !important;
  }
  body:not(.light) .qz-stepper-btn {
    background: #17132e !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    color: #e2e8f0 !important;
  }
  body:not(.light) .qz-dropzone {
    background: #231d42 !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
  }
  body:not(.light) .qz-dropzone:hover,
  body:not(.light) .qz-dropzone--dragover {
    background: rgba(124, 110, 242, 0.12) !important;
    border-color: #7c6ef2 !important;
  }
  body:not(.light) .qz-dropzone--has-file {
    background: rgba(16, 185, 129, 0.12) !important;
    border-color: #10b981 !important;
  }
  body:not(.light) .qz-type-row,
  body:not(.light) .qz-radio-option,
  body:not(.light) .qz-sub-options-box,
  body:not(.light) .qz-homologation-card {
    background: #17132e !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-radio-option:hover {
    border-color: #7c6ef2 !important;
  }
  body:not(.light) .qz-field-label {
    color: #cbd5e1 !important;
  }
  body:not(.light) .qz-section-header {
    color: #a39bf0 !important;
  }
  body:not(.light) .qz-section-header h4,
  body:not(.light) .qz-radio-content strong,
  body:not(.light) .qz-homo-source-text,
  body:not(.light) .qz-file-name,
  body:not(.light) .qz-type-col-name {
    color: #ffffff !important;
  }
  body:not(.light) .qz-drop-prompt {
    color: #f1f5f9 !important;
  }
  body:not(.light) .qz-pane-subtitle,
  body:not(.light) .qz-section-desc,
  body:not(.light) .qz-drop-hint,
  body:not(.light) .qz-radio-content span {
    color: #94a3b8 !important;
  }
  body:not(.light) .qz-step-circle {
    background: #28214b !important;
    color: #94a3b8 !important;
  }
  body:not(.light) .qz-step--active .qz-step-circle {
    background: #7c6ef2 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 10px rgba(124, 110, 242, 0.4) !important;
  }
  body:not(.light) .qz-step--completed .qz-step-circle {
    background: #10b981 !important;
    color: #ffffff !important;
  }
  body:not(.light) .qz-step-label {
    color: #94a3b8 !important;
  }
  body:not(.light) .qz-step--active .qz-step-label {
    color: #a39bf0 !important;
  }
  body:not(.light) .qz-mode-btn {
    background: #231d42 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    color: #cbd5e1 !important;
  }
  body:not(.light) .qz-mode-btn:hover {
    border-color: #7c6ef2 !important;
    color: #ffffff !important;
  }
  body:not(.light) .qz-mode-btn--active {
    background: rgba(124, 110, 242, 0.18) !important;
    border-color: #7c6ef2 !important;
    color: #a39bf0 !important;
  }
  body:not(.light) .qz-type-pill {
    background: #231d42 !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    color: #94a3b8 !important;
  }
  body:not(.light) .qz-type-pill:hover {
    border-color: #7c6ef2 !important;
    color: #cbd5e1 !important;
  }
  body:not(.light) .qz-type-pill--active {
    background: #6a5ae0 !important;
    color: #ffffff !important;
    border-color: #6a5ae0 !important;
  }
  body:not(.light) .qz-live-email-preview {
    background: rgba(16, 185, 129, 0.12) !important;
    border-color: rgba(16, 185, 129, 0.25) !important;
    color: #34d399 !important;
  }
  body:not(.light) .qz-preview-table-wrap {
    background: #17132e !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-table-preview-title,
  body:not(.light) .qz-final-preview-table th {
    background: #231d42 !important;
    color: #cbd5e1 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-cell--row-num {
    background: #231d42 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-sheet-preview-table td,
  body:not(.light) .qz-final-preview-table td {
    border-color: rgba(255, 255, 255, 0.05) !important;
    color: #e2e8f0 !important;
  }
  body:not(.light) .qz-homo-tag {
    color: #a39bf0 !important;
  }
  body:not(.light) .qz-metric-value {
    color: #a39bf0 !important;
  }
  body:not(.light) .qz-metric-label {
    color: #94a3b8 !important;
  }
  body:not(.light) .qz-badge-auto {
    background: rgba(2, 132, 199, 0.25) !important;
    color: #38bdf8 !important;
  }
  body:not(.light) .qz-badge-duplicate {
    background: rgba(245, 158, 11, 0.25) !important;
    color: #fbbf24 !important;
  }
  body:not(.light) .qz-badge-course {
    background: rgba(124, 110, 242, 0.25) !important;
    color: #a39bf0 !important;
  }
  body:not(.light) .qz-processing-box {
    background: rgba(124, 110, 242, 0.12) !important;
    border-color: rgba(124, 110, 242, 0.3) !important;
    color: #a39bf0 !important;
  }
  body:not(.light) .qz-btn--secondary {
    background: #28214b !important;
    color: #cbd5e1 !important;
  }
  body:not(.light) .qz-btn--secondary:hover:not(:disabled) {
    background: #352c63 !important;
    color: #ffffff !important;
  }
  body:not(.light) .qz-btn--cancel {
    color: #94a3b8 !important;
  }
  body:not(.light) .qz-btn--cancel:hover:not(:disabled) {
    color: #ffffff !important;
  }
}
</style>
