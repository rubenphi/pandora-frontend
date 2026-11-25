<template>
  <ion-modal
    class="qz-planilla-wizard-modal"
    :is-open="isOpen"
    @didDismiss="handleClose"
  >
    <div class="qz-wizard-container">
      <!-- HEADER -->
      <div class="qz-wizard-header">
        <div class="qz-wizard-header-left">
          <span class="qz-wizard-badge">GENERADOR DE PLANILLAS</span>
          <h2 class="qz-wizard-title">Planilla para Plataforma de Notas</h2>
        </div>
        <button
          type="button"
          class="qz-wizard-close-btn"
          @click="handleClose"
          aria-label="Cerrar"
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
            'qz-step--disabled': !canNavigateToStep(step.number),
          }"
          @click="canNavigateToStep(step.number) && goToStep(step.number)"
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
          <!-- Tarjeta de descarga directa estándar -->
          <div class="qz-quick-download-box">
            <div class="qz-quick-download-info">
              <ion-icon :icon="downloadOutline" class="qz-quick-icon"></ion-icon>
              <div>
                <h4 class="qz-quick-title">Descarga directa en orden alfabético</h4>
                <p class="qz-quick-sub">
                  Genera la planilla alfabética estándar de Pandora inmediatamente sin necesidad de subir un archivo de plataforma.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="qz-btn-quick"
              @click="descargarPlanillaAlfabetico"
            >
              <ion-icon :icon="downloadOutline"></ion-icon>
              <span>Descargar Alfabético</span>
            </button>
          </div>

          <div class="qz-divider-or">
            <span>O sube la planilla de tu plataforma externa</span>
          </div>

          <div class="qz-step-desc-box">
            <h3 class="qz-pane-title">Sube la planilla de notas de tu institución</h3>
            <p class="qz-pane-subtitle">
              Acepta archivos de Excel (.xlsx, .xls) o exportaciones HTML de plataformas escolares (Coasph, Ciudad Educativa, Siga, Pegaso, etc.).
            </p>
          </div>

          <!-- DROP ZONE -->
          <div
            class="qz-drop-zone"
            :class="{ 'qz-drop-zone--dragover': isDragging, 'qz-drop-zone--loaded': selectedFile }"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              type="file"
              ref="fileInputRef"
              style="display: none"
              accept=".xlsx, .xls, .csv, .html, .htm"
              @change="handleFileChange"
            />

            <div v-if="!selectedFile" class="qz-drop-zone-content">
              <div class="qz-drop-zone-icon">
                <ion-icon :icon="cloudUploadOutline"></ion-icon>
              </div>
              <p class="qz-drop-zone-title">Arrastra y suelta tu archivo Excel aquí</p>
              <p class="qz-drop-zone-sub">o haz clic para explorar en tu dispositivo</p>
              <span class="qz-drop-zone-formats">Formatos soportados: .xlsx, .xls</span>
            </div>

            <div v-else class="qz-file-loaded-box">
              <div class="qz-file-icon-wrap">
                <ion-icon :icon="documentTextOutline"></ion-icon>
              </div>
              <div class="qz-file-info-text">
                <span class="qz-file-name">{{ selectedFile.name }}</span>
                <span class="qz-file-size">{{ formatFileSize(selectedFile.size) }} - {{ rawRows.length }} filas cargadas</span>
              </div>
              <button
                type="button"
                class="qz-file-remove-btn"
                @click.stop="clearSelectedFile"
                title="Cambiar archivo"
              >
                <ion-icon :icon="closeOutline"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Selector de Hoja si hay múltiples -->
          <div v-if="sheetNames.length > 1" class="qz-field-box" style="margin-top: 16px;">
            <label class="qz-field-label">Seleccionar hoja de cálculo:</label>
            <select v-model="selectedSheet" @change="onSheetChange" class="qz-select">
              <option v-for="sh in sheetNames" :key="sh" :value="sh">{{ sh }}</option>
            </select>
          </div>

          <div v-if="fileError" class="qz-alert-error">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            <span>{{ fileError }}</span>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- PASO 2: FILA DE ENCABEZADOS                                     -->
        <!-- =============================================================== -->
        <div v-else-if="currentStep === 2" class="qz-step-pane">
          <div class="qz-step-desc-box">
            <h3 class="qz-pane-title">Encabezados y Rango de Estudiantes</h3>
            <p class="qz-pane-subtitle">
              Indica dónde empiezan los títulos de columnas y hasta qué fila llegan los estudiantes. Haz clic en las filas de la tabla o usa los controles para ajustar.
            </p>
          </div>

          <!-- Dos steppers en fila -->
          <div class="qz-row-steppers-dual">
            <!-- INICIO: Fila de encabezado -->
            <div class="qz-row-stepper-block">
              <label class="qz-field-label">
                <span class="qz-stepper-role-pill qz-stepper-role-pill--header">Encabezado</span>
                Primera fila de datos (títulos):
              </label>
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
                  <option
                    v-for="r in rawRows.length"
                    :key="r"
                    :value="r"
                  >
                    Fila {{ r }}
                  </option>
                </select>
                <button
                  type="button"
                  class="qz-stepper-btn"
                  :disabled="headerRowNumber >= lastDataRowNumber - 1"
                  @click="changeHeaderRow(headerRowNumber + 1)"
                >
                  +
                </button>
              </div>
            </div>

            <!-- FIN: Última fila de estudiantes -->
            <div class="qz-row-stepper-block">
              <label class="qz-field-label">
                <span class="qz-stepper-role-pill qz-stepper-role-pill--last">Fin de lista</span>
                Última fila con estudiante:
              </label>
              <div class="qz-row-stepper">
                <button
                  type="button"
                  class="qz-stepper-btn"
                  :disabled="lastDataRowNumber <= headerRowNumber + 1"
                  @click="changeLastDataRow(lastDataRowNumber - 1)"
                >
                  -
                </button>
                <select
                  v-model.number="lastDataRowNumber"
                  @change="onLastDataRowChange"
                  class="qz-row-native-select"
                >
                  <option
                    v-for="r in rawRows.length"
                    :key="r"
                    :value="r"
                    :disabled="r <= headerRowNumber"
                  >
                    Fila {{ r }}
                  </option>
                </select>
                <button
                  type="button"
                  class="qz-stepper-btn"
                  :disabled="lastDataRowNumber >= rawRows.length"
                  @click="changeLastDataRow(lastDataRowNumber + 1)"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <!-- Resumen del rango seleccionado -->
          <div class="qz-range-summary">
            <span class="qz-range-pill qz-range-pill--header">
              Encabezado: Fila {{ headerRowNumber }}
            </span>
            <span class="qz-range-arrow">→</span>
            <span class="qz-range-pill qz-range-pill--data">
              Estudiantes: Filas {{ headerRowNumber + 1 }} al {{ lastDataRowNumber }}
            </span>
            <span class="qz-range-count">({{ Math.max(0, lastDataRowNumber - headerRowNumber) }} filas de alumnos)</span>
          </div>

                    <!-- Barra de modo de clic para la tabla -->
          <div class="qz-click-mode-bar">
            <span class="qz-click-mode-label">Al hacer clic en una fila de la tabla:</span>
            <div class="qz-click-mode-pills">
              <button
                type="button"
                class="qz-mode-pill"
                :class="{ 'qz-mode-pill--active': tableClickMode === 'header' }"
                @click="tableClickMode = 'header'"
              >
                <span class="qz-dot qz-dot--header"></span>
                Fijar Encabezado
              </button>
              <button
                type="button"
                class="qz-mode-pill"
                :class="{ 'qz-mode-pill--active': tableClickMode === 'last' }"
                @click="tableClickMode = 'last'"
              >
                <span class="qz-dot qz-dot--last"></span>
                Fijar Fin de Alumnos
              </button>
            </div>
          </div>

          <!-- Previsualización de TODAS las filas con marcadores de rango -->
          <div class="qz-table-preview-wrap">
            <table class="qz-preview-table">
              <thead>
                <tr>
                  <th class="qz-cell--row-num">Fila</th>
                  <th class="qz-cell--row-state">Estado</th>
                  <th
                    v-for="(col, cIdx) in (rawRows[headerRowNumber - 1] || []).slice(0, 8)"
                    :key="cIdx"
                  >
                    {{ col || ('Col ' + getColumnLetter(cIdx)) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rIndex) in rawRows"
                  :key="rIndex"
                  :class="{
                    'qz-row--header-active': rIndex + 1 === headerRowNumber,
                    'qz-row--in-range': rIndex + 1 > headerRowNumber && rIndex + 1 <= lastDataRowNumber,
                    'qz-row--out-range': rIndex + 1 > lastDataRowNumber,
                  }"
                  @click="onRowClickStep2(rIndex + 1)"
                  style="cursor: pointer;"
                >
                  <td class="qz-cell--row-num">{{ rIndex + 1 }}</td>
                  <td class="qz-cell--row-state">
                    <span v-if="rIndex + 1 === headerRowNumber" class="qz-badge-active-header">Encabezado</span>
                    <span v-else-if="rIndex + 1 > headerRowNumber && rIndex + 1 <= lastDataRowNumber" class="qz-badge-in-range">Alumno</span>
                    <span v-else-if="rIndex + 1 > lastDataRowNumber" class="qz-badge-out-range">Ignorar</span>
                    <span v-else class="qz-badge-pre-header">Pre-encabezado</span>
                  </td>
                  <td
                    v-for="(cell, cIndex) in row.slice(0, 8)"
                    :key="cIndex"
                    class="qz-cell-truncate"
                  >
                    {{ cell !== null && cell !== undefined ? cell : "" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="qz-preview-hint">
            Haz clic en una fila de la tabla: si está antes del encabezado actual, se convierte en el nuevo encabezado. Si está después del encabezado, se mueve el marcador de fin de lista a esa fila.
          </p>

          <!-- Columnas detectadas -->
          <div class="qz-detected-columns-bar">
            <span class="qz-detected-label">Columnas detectadas ({{ detectedColumns.length }}):</span>
            <div class="qz-detected-chips">
              <span
                v-for="col in detectedColumns"
                :key="col.index"
                class="qz-detected-chip"
              >
                <strong>{{ col.letter }}:</strong> {{ col.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- PASO 3: MAPEO DE NOMBRES Y REGLAS DE EMPAREJAMIENTO             -->
        <!-- =============================================================== -->
        <div v-else-if="currentStep === 3" class="qz-step-pane">
          <div class="qz-step-desc-box">
            <h3 class="qz-pane-title">Mapeo de Estudiantes y Columnas</h3>
            <p class="qz-pane-subtitle">
              Configura cómo vienen organizados los nombres y datos en la planilla de tu institución.
            </p>
          </div>

          <!-- 1. Estructura de nombres -->
          <div class="qz-card-section">
            <div class="qz-section-header">
              <ion-icon :icon="peopleOutline"></ion-icon>
              <h4>1. ¿Cómo vienen los nombres en tu archivo?</h4>
            </div>

            <div class="qz-mode-selector-grid">
              <button
                type="button"
                class="qz-mode-card"
                :class="{ 'qz-mode-card--active': nameMode === 'split' }"
                @click="nameMode = 'split'"
              >
                <div class="qz-mode-radio"></div>
                <div>
                  <strong>Dos columnas separadas</strong>
                  <p>Una columna de Apellidos y una columna de Nombres.</p>
                </div>
              </button>

              <button
                type="button"
                class="qz-mode-card"
                :class="{ 'qz-mode-card--active': nameMode === 'combined_last_first' }"
                @click="nameMode = 'combined_last_first'"
              >
                <div class="qz-mode-radio"></div>
                <div>
                  <strong>Columna única (Apellidos primero)</strong>
                  <p>Ejemplo: PEREZ GOMEZ JUAN CARLOS</p>
                </div>
              </button>

              <button
                type="button"
                class="qz-mode-card"
                :class="{ 'qz-mode-card--active': nameMode === 'combined_first_last' }"
                @click="nameMode = 'combined_first_last'"
              >
                <div class="qz-mode-radio"></div>
                <div>
                  <strong>Columna única (Nombres primero)</strong>
                  <p>Ejemplo: JUAN CARLOS PEREZ GOMEZ</p>
                </div>
              </button>
            </div>

            <!-- Selectores según modo de nombres -->
            <div class="qz-grid-fields" style="margin-top: 16px;">
              <!-- Modo Split -->
              <template v-if="nameMode === 'split'">
                <div class="qz-field-box">
                  <label class="qz-field-label">Columna de Apellidos <span class="qz-required">*</span></label>
                  <select v-model="fieldMap.lastNameCol" class="qz-select">
                    <option :value="null" disabled>Seleccionar columna...</option>
                    <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                      {{ col.letter }}: {{ col.label }}
                    </option>
                  </select>
                </div>
                <div class="qz-field-box">
                  <label class="qz-field-label">Columna de Nombres <span class="qz-required">*</span></label>
                  <select v-model="fieldMap.nameCol" class="qz-select">
                    <option :value="null" disabled>Seleccionar columna...</option>
                    <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                      {{ col.letter }}: {{ col.label }}
                    </option>
                  </select>
                </div>
              </template>

              <!-- Modo Combined -->
              <template v-else>
                <div class="qz-field-box" style="grid-column: 1 / -1;">
                  <label class="qz-field-label">Columna con el Nombre Completo <span class="qz-required">*</span></label>
                  <select v-model="fieldMap.fullNameCol" class="qz-select">
                    <option :value="null" disabled>Seleccionar columna...</option>
                    <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                      {{ col.letter }}: {{ col.label }}
                    </option>
                  </select>
                </div>
              </template>
            </div>
          </div>

          <!-- 2. Documento o Identificación (Opcional) -->
          <div class="qz-card-section" style="margin-top: 16px;">
            <div class="qz-section-header">
              <ion-icon :icon="personOutline"></ion-icon>
              <h4>2. Documento de Identidad / Código (Opcional)</h4>
            </div>
            <p class="qz-section-sub">
              Si tu archivo incluye una columna con número de documento o código, selecciónala para una coincidencia 100% exacta. Si no viene, no te preocupes: el sistema utilizará el nombre normalizado.
            </p>

            <div class="qz-grid-fields">
              <div class="qz-field-box">
                <label class="qz-field-label">Columna de Documento / Identificación:</label>
                <select v-model="fieldMap.codeCol" class="qz-select">
                  <option :value="null">-- No está en el archivo / Omitir --</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <div class="qz-field-box">
                <label class="qz-field-label">Columna de Número de Orden (Opcional):</label>
                <select v-model="fieldMap.orderCol" class="qz-select">
                  <option :value="null">-- Usar orden natural de las filas --</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- 3. Columnas de Destino para Notas -->
          <div class="qz-card-section" style="margin-top: 16px;">
            <div class="qz-section-header">
              <ion-icon :icon="ribbonOutline"></ion-icon>
              <h4>3. Columnas de Destino en tu Planilla</h4>
            </div>
            <p class="qz-section-sub">
              Indica en qué columnas de tu archivo original se escribirán las calificaciones calculadas. Si un estudiante no tiene nota o no fue emparejado, su celda original se conservará intacta.
            </p>

            <div class="qz-grid-fields">
              <div class="qz-field-box">
                <label class="qz-field-label">Columna de Nota Final (DEF) <span class="qz-required">*</span></label>
                <select v-model="fieldMap.defCol" class="qz-select">
                  <option :value="null" disabled>Seleccionar columna de nota...</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <div class="qz-field-box">
                <label class="qz-field-label">Columna de Nivelación (NIV) (Opcional):</label>
                <select v-model="fieldMap.nivCol" class="qz-select">
                  <option :value="null">-- No llenar / Omitir --</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>

              <div class="qz-field-box">
                <label class="qz-field-label">Columna de Código / Logro (L1) (Opcional):</label>
                <select v-model="fieldMap.l1Col" class="qz-select">
                  <option :value="null">-- No llenar / Omitir --</option>
                  <option v-for="col in detectedColumns" :key="col.index" :value="col.index">
                    {{ col.letter }}: {{ col.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- 4. Regla de Estudiantes no Encontrados -->
          <div class="qz-card-section" style="margin-top: 16px;">
            <div class="qz-section-header">
              <ion-icon :icon="optionsOutline"></ion-icon>
              <h4>4. Regla de Estudiantes para la Planilla Generada</h4>
            </div>

            <div class="qz-checkbox-card" @click="onlyFileStudents = !onlyFileStudents">
              <div class="qz-checkbox-indicator" :class="{ 'qz-checkbox-indicator--checked': onlyFileStudents }">
                <ion-icon v-if="onlyFileStudents" :icon="checkmarkOutline"></ion-icon>
              </div>
              <div class="qz-checkbox-text">
                <strong>Solo incluir los estudiantes que están en la planilla de la plataforma (Recomendado)</strong>
                <p>
                  No agregará estudiantes adicionales de Pandora que falten en el archivo subido, conservando exactamente la lista y el orden estricto de tu colegio.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- PASO 4: HOMOLOGACIÓN Y EMPAREJAMIENTO DE ESTUDIANTES             -->
        <!-- =============================================================== -->
        <div v-else-if="currentStep === 4" class="qz-step-pane">
          <div class="qz-step-desc-box">
            <h3 class="qz-pane-title">Homologación y Emparejamiento</h3>
            <p class="qz-pane-subtitle">
              Verifica las coincidencias encontradas entre la planilla externa y los estudiantes matriculados en Pandora.
            </p>
          </div>

          <!-- METRICAS DE HOMOLOGACION -->
          <div class="qz-metrics-grid">
            <div class="qz-metric-card">
              <span class="qz-metric-value">{{ matchedRows.length }}</span>
              <span class="qz-metric-label">En Planilla Externa</span>
            </div>
            <div class="qz-metric-card qz-metric-card--success">
              <span class="qz-metric-value">{{ autoMatchedCount }}</span>
              <span class="qz-metric-label">Coincidencias Automáticas</span>
            </div>
            <div class="qz-metric-card qz-metric-card--warning">
              <span class="qz-metric-value">{{ partialMatchedCount }}</span>
              <span class="qz-metric-label">Por Verificar</span>
            </div>
            <div class="qz-metric-card qz-metric-card--muted">
              <span class="qz-metric-value">{{ unmatchedCount }}</span>
              <span class="qz-metric-label">Sin Asignar</span>
            </div>
          </div>

          <!-- FILTROS Y BUSCADOR -->
          <div class="qz-filter-bar">
            <div class="qz-filter-tabs">
              <button
                type="button"
                class="qz-tab-btn"
                :class="{ 'qz-tab-btn--active': matchFilter === 'ALL' }"
                @click="matchFilter = 'ALL'"
              >
                Todos ({{ matchedRows.length }})
              </button>
              <button
                type="button"
                class="qz-tab-btn"
                :class="{ 'qz-tab-btn--active': matchFilter === 'REVIEW' }"
                @click="matchFilter = 'REVIEW'"
              >
                Por revisar ({{ partialMatchedCount }})
              </button>
              <button
                type="button"
                class="qz-tab-btn"
                :class="{ 'qz-tab-btn--active': matchFilter === 'UNMATCHED' }"
                @click="matchFilter = 'UNMATCHED'"
              >
                Sin asignar ({{ unmatchedCount }})
              </button>
            </div>

            <div class="qz-search-box">
              <ion-icon :icon="searchOutline"></ion-icon>
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Buscar por nombre o documento..."
                class="qz-search-input"
              />
            </div>
          </div>

          <!-- LISTA DE HOMOLOGACIÓN -->
          <div class="qz-homologation-table-wrap">
            <table class="qz-homologation-table">
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>Estudiante en Planilla Externa</th>
                  <th style="width: 140px;">Estado</th>
                  <th>Estudiante Asignado en Pandora</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in filteredMatchedRows"
                  :key="idx"
                  :class="{
                    'qz-row-success': row.status === 'matched',
                    'qz-row-warning': row.status === 'partial',
                    'qz-row-unmatched': row.status === 'unmatched',
                  }"
                >
                  <td class="qz-cell--row-num">{{ row.orderNum || idx + 1 }}</td>
                  <td>
                    <div class="qz-excel-student-cell">
                      <strong class="qz-excel-student-name">{{ row.excelName }}</strong>
                      <span v-if="row.excelDoc" class="qz-excel-student-doc">Doc: {{ row.excelDoc }}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      class="qz-match-badge"
                      :class="{
                        'qz-match-badge--matched': row.status === 'matched',
                        'qz-match-badge--partial': row.status === 'partial',
                        'qz-match-badge--unmatched': row.status === 'unmatched',
                      }"
                    >
                      <ion-icon
                        :icon="
                          row.status === 'matched'
                            ? checkmarkCircleOutline
                            : row.status === 'partial'
                            ? helpCircleOutline
                            : alertCircleOutline
                        "
                      ></ion-icon>
                      {{
                        row.status === 'matched'
                          ? 'Coincide'
                          : row.status === 'partial'
                          ? 'Revisar'
                          : 'Sin match'
                      }}
                    </span>
                  </td>
                  <td>
                    <div class="qz-student-assign-wrap">
                      <select
                        v-model="row.assignedStudentId"
                        @change="onManualStudentChange(row)"
                        class="qz-select qz-select--compact"
                      >
                        <option :value="null">-- (Sin asignar / Dejar sin nota) --</option>
                        <option
                          v-for="st in sortedPandoraStudents"
                          :key="st.id"
                          :value="st.id"
                        >
                          {{ st.lastName }} {{ st.name }} ({{ st.code || 'Sin doc' }})
                        </option>
                      </select>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- PASO 5: VISTA PREVIA Y DESCARGA                                 -->
        <!-- =============================================================== -->
        <div v-else-if="currentStep === 5" class="qz-step-pane">
          <div class="qz-step-desc-box">
            <h3 class="qz-pane-title">Confirmación y Vista Previa de la Planilla</h3>
            <p class="qz-pane-subtitle">
              Revisa las calificaciones y logros calculados antes de descargar el archivo Excel definitivo.
            </p>
          </div>

          <!-- RESUMEN DE NOTAS -->
          <div class="qz-metrics-grid">
            <div class="qz-metric-card">
              <span class="qz-metric-value">{{ finalExportList.length }}</span>
              <span class="qz-metric-label">Total en Archivo</span>
            </div>
            <div class="qz-metric-card qz-metric-card--success">
              <span class="qz-metric-value">{{ studentsWithGradeCount }}</span>
              <span class="qz-metric-label">Con Nota Calculada</span>
            </div>
            <div class="qz-metric-card qz-metric-card--muted">
              <span class="qz-metric-value">{{ finalExportList.length - studentsWithGradeCount }}</span>
              <span class="qz-metric-label">Sin Nota</span>
            </div>
          </div>

          <!-- TABLA DE VISTA PREVIA FINAL -->
          <div class="qz-table-preview-wrap" style="max-height: 380px;">
            <table class="qz-preview-table qz-final-preview-table">
              <thead>
                <tr>
                  <th style="width: 50px;">NUM</th>
                  <th>NOMBRE DEL ESTUDIANTE</th>
                  <th style="width: 70px; text-align: center;">DEF</th>
                  <th style="width: 70px; text-align: center;">NIV</th>
                  <th style="width: 90px; text-align: center;">LOGRO (L1)</th>
                  <th style="width: 140px;">DESEMPEÑO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in finalExportList" :key="i">
                  <td class="qz-cell--row-num">{{ item.NUM }}</td>
                  <td>
                    <strong>{{ item.NOMBRE }}</strong>
                  </td>
                  <td style="text-align: center;">
                    <span
                      v-if="item.DEF !== ''"
                      class="qz-grade-badge"
                      :class="getGradeClass(item.DEF)"
                    >
                      {{ item.DEF }}
                    </span>
                    <span v-else class="qz-text-muted">-</span>
                  </td>
                  <td style="text-align: center;">
                    <span
                      v-if="item.NIV !== ''"
                      class="qz-grade-badge qz-grade-badge--niv"
                    >
                      {{ item.NIV }}
                    </span>
                    <span v-else class="qz-text-muted">-</span>
                  </td>
                  <td style="text-align: center;">
                    <span v-if="item.L1 !== ''" class="qz-badge-l1">
                      {{ item.L1 }}
                    </span>
                    <span v-else class="qz-text-muted">-</span>
                  </td>
                  <td>
                    <span class="qz-desempeno-text">{{ getL1Meaning(item.L1) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="qz-conventions-note">
            <ion-icon :icon="ribbonOutline"></ion-icon>
            <span>
              Se descargará <strong>tu mismo archivo original</strong> rellenando únicamente las columnas mapeadas para los estudiantes con nota calculada. Las celdas sin nota o sin emparejar permanecerán intactas.
            </span>
          </div>
        </div>
      </div>

      <!-- FOOTER: BOTONES DE NAVEGACIÓN -->
      <div class="qz-wizard-footer">
        <button
          v-if="currentStep > 1"
          type="button"
          class="qz-btn-secondary"
          @click="goToStep(currentStep - 1)"
        >
          <ion-icon :icon="arrowBackOutline"></ion-icon>
          <span>Atrás</span>
        </button>
        <div v-else></div>

        <div class="qz-footer-right">
          <button
            type="button"
            class="qz-btn-ghost"
            @click="handleClose"
          >
            Cancelar
          </button>

          <!-- Botón Paso 1 -> 2 -->
          <button
            v-if="currentStep === 1"
            type="button"
            class="qz-btn-primary"
            :disabled="!selectedFile || rawRows.length === 0"
            @click="goToStep(2)"
          >
            <span>Continuar a Encabezados</span>
            <ion-icon :icon="arrowForwardOutline"></ion-icon>
          </button>

          <!-- Botón Paso 2 -> 3 -->
          <button
            v-else-if="currentStep === 2"
            type="button"
            class="qz-btn-primary"
            :disabled="detectedColumns.length === 0"
            @click="goToStep(3)"
          >
            <span>Continuar a Mapeo</span>
            <ion-icon :icon="arrowForwardOutline"></ion-icon>
          </button>

          <!-- Botón Paso 3 -> 4 (Ejecuta Homologación) -->
          <button
            v-else-if="currentStep === 3"
            type="button"
            class="qz-btn-primary"
            :disabled="!canProceedFromStep3"
            @click="runMatchingAndProceed"
          >
            <span>Homologar Estudiantes</span>
            <ion-icon :icon="arrowForwardOutline"></ion-icon>
          </button>

          <!-- Botón Paso 4 -> 5 -->
          <button
            v-else-if="currentStep === 4"
            type="button"
            class="qz-btn-primary"
            @click="goToStep(5)"
          >
            <span>Ver Vista Previa</span>
            <ion-icon :icon="arrowForwardOutline"></ion-icon>
          </button>

          <!-- Botón Paso 5 -> Descarga -->
          <button
            v-else-if="currentStep === 5"
            type="button"
            class="qz-btn-primary qz-btn-download-final"
            @click="descargarPlanillaRellenada"
          >
            <ion-icon :icon="downloadOutline"></ion-icon>
            <span>Descargar Planilla Rellenada</span>
          </button>
        </div>
      </div>
    </div>
  </ion-modal>
</template>

<script>
/* eslint-disable no-unused-vars */
import {
  IonModal,
  IonIcon,
  alertController,
} from "@ionic/vue";
import { ref, computed } from "vue";
import * as XLSX from "xlsx-js-style";
import {
  cloudUploadOutline,
  documentTextOutline,
  closeOutline,
  checkmarkOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  helpCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  downloadOutline,
  peopleOutline,
  personOutline,
  optionsOutline,
  searchOutline,
  ribbonOutline,
} from "ionicons/icons";

export default {
  name: "GeneradorPlanilla",
  emits: ["close"],
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    cursoId: String,
    areaId: String,
    periodoSelected: Number,
    year: String,
    usuario: Object,
    usuariosEstudiantes: {
      type: Array,
      default: () => [],
    },
  },
  components: {
    IonModal,
    IonIcon,
  },
  setup(props, { emit }) {
    // Stepper
    const currentStep = ref(1);
    const steps = [
      { number: 1, title: "Archivo" },
      { number: 2, title: "Encabezados" },
      { number: 3, title: "Mapeo" },
      { number: 4, title: "Homologación" },
      { number: 5, title: "Descarga" },
    ];

    // File State
    const selectedFile = ref(null);
    const isDragging = ref(false);
    const fileError = ref("");
    const fileInputRef = ref(null);
    const rawRows = ref([]);
    const sheetNames = ref([]);
    const selectedSheet = ref("");
    let parsedWorkbook = null;
    let isHtmlFile = false;
    let parsedHtmlText = "";
    let htmlRowTargets = [];

    // Header Row State
    const headerRowNumber = ref(1);
    const lastDataRowNumber = ref(1);
    const tableClickMode = ref("last"); // Última fila que contiene un estudiante
    const detectedColumns = ref([]);

    // Step 3 Mapping State
    const nameMode = ref("split"); // 'split' | 'combined_last_first' | 'combined_first_last'
    const fieldMap = ref({
      lastNameCol: null,
      nameCol: null,
      fullNameCol: null,
      codeCol: null,
      orderCol: null,
      defCol: null,
      nivCol: null,
      l1Col: null,
    });
    const onlyFileStudents = ref(true);

    // Step 4 Matching State
    const matchedRows = ref([]);
    const matchFilter = ref("ALL"); // 'ALL' | 'REVIEW' | 'UNMATCHED'
    const searchTerm = ref("");

    // Normalization utilities
    const cleanString = (str) => {
      if (str === null || str === undefined) return "";
      return String(str)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Sin tildes
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    const normalizeDoc = (doc) => {
      if (doc === null || doc === undefined) return "";
      return String(doc).replace(/[^a-zA-Z0-9]/g, "").trim();
    };

    const formatFileSize = (bytes) => {
      if (!bytes) return "0 KB";
      const kb = bytes / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      return `${(kb / 1024).toFixed(1)} MB`;
    };

    const getColumnLetter = (colIdx) => {
      let temp = colIdx + 1;
      let letter = "";
      while (temp > 0) {
        let mod = (temp - 1) % 26;
        letter = String.fromCharCode(65 + mod) + letter;
        temp = Math.floor((temp - mod) / 26);
      }
      return letter;
    };

    // Close and reset
    const handleClose = () => {
      emit("close");
    };

    const canNavigateToStep = (stepNum) => {
      if (stepNum === 1) return true;
      if (stepNum === 2) return rawRows.value.length > 0;
      if (stepNum === 3) return detectedColumns.value.length > 0;
      if (stepNum === 4) return matchedRows.value.length > 0;
      if (stepNum === 5) return matchedRows.value.length > 0;
      return false;
    };

    const goToStep = (stepNum) => {
      currentStep.value = stepNum;
    };

    // STEP 1: File handling
    const triggerFileInput = () => {
      if (fileInputRef.value) {
        fileInputRef.value.click();
      }
    };

    const clearSelectedFile = () => {
      selectedFile.value = null;
      rawRows.value = [];
      sheetNames.value = [];
      selectedSheet.value = "";
      headerRowNumber.value = 1;
      detectedColumns.value = [];
      matchedRows.value = [];
      parsedWorkbook = null;
      isHtmlFile = false;
      parsedHtmlText = "";
      htmlRowTargets = [];
      fieldMap.value.defCol = null;
      fieldMap.value.nivCol = null;
      fieldMap.value.l1Col = null;
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
          // ignore fallback error
        }
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const tables = Array.from(doc.querySelectorAll("table"));
      if (tables.length === 0) {
        isHtmlFile = false;
        const wb = XLSX.read(text, { type: "string" });
        parsedWorkbook = wb;
        const sheet = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: true });
      }

      parsedHtmlText = text;
      htmlRowTargets = [];
      const allRows = [];
      const visitedTr = new Set();
      tables.forEach((table, tableIdx) => {
        const directRows = Array.from(table.rows || table.querySelectorAll("tr"));
        directRows.forEach((tr, trIdx) => {
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
            htmlRowTargets.push({ tableIdx, trIdx });
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

          let headerText = "";
          for (let i = 0; i < Math.min(data.length, 1000); i++) {
            headerText += String.fromCharCode(data[i]);
          }
          const lowerHead = headerText.toLowerCase().trim();
          const isHtml =
            lowerHead.includes("<html") ||
            lowerHead.includes("<!doctype") ||
            lowerHead.includes("<table") ||
            lowerHead.includes("xmlns:x=");

          if (isHtml) {
            isHtmlFile = true;
            parsedWorkbook = null;
            jsonData = parseHtmlSpreadsheet(data);
            sheetNames.value = ["Hoja 1"];
            selectedSheet.value = "Hoja 1";
          } else {
            isHtmlFile = false;
            parsedHtmlText = "";
            htmlRowTargets = [];
            parsedWorkbook = XLSX.read(data, {
              type: "array",
              cellDates: true,
              cellStyles: true,
              raw: false,
            });
            sheetNames.value = parsedWorkbook.SheetNames;
            selectedSheet.value = parsedWorkbook.SheetNames[0] || "Sheet1";
            const firstSheet = parsedWorkbook.Sheets[selectedSheet.value];
            jsonData = XLSX.utils.sheet_to_json(firstSheet, {
              header: 1,
              defval: "",
              blankrows: true,
            });
          }

          if (!jsonData || jsonData.length === 0) {
            fileError.value = "El archivo seleccionado no contiene filas legibles.";
            return;
          }

          rawRows.value = jsonData;
          // Auto detect best header row (look for row with text keywords)
          autoDetectHeaderRow(jsonData);
        } catch (err) {
          console.error("Error al procesar archivo:", err);
          fileError.value = "Error al leer el archivo. Asegúrate de que no esté protegido o dañado.";
        }
      };
      reader.readAsArrayBuffer(file);
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

    const onSheetChange = () => {
      if (!parsedWorkbook || !selectedSheet.value) return;
      const sh = parsedWorkbook.Sheets[selectedSheet.value];
      const jsonData = XLSX.utils.sheet_to_json(sh, {
        header: 1,
        defval: "",
        blankrows: true,
      });
      rawRows.value = jsonData;
      autoDetectHeaderRow(jsonData);
    };

    // STEP 2: Header detection
    const autoDetectHeaderRow = (rows) => {
      let bestRow = 1;
      let maxScore = -1;
      const keywords = [
        "APELLIDO", "APELLIDOS", "NOMBRE", "NOMBRES", "ESTUDIANTE", "ESTUDIANTES",
        "ALUMNO", "ALUMNOS", "DOCUMENTO", "DOC", "IDENTIFICACION", "TI", "CC",
        "NUM", "NRO", "CODIGO", "ORDEN", "DEF", "DEFINITIVA", "NOTA", "VALORACION",
        "FALLAS", "DESEMPENO", "CALIFICACION", "L1", "L2", "NIV"
      ];

      for (let r = 0; r < Math.min(20, rows.length); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        let score = 0;
        row.forEach((cell) => {
          const str = cleanString(cell);
          keywords.forEach((kw) => {
            if (str === kw) score += 3;
            else if (str.includes(kw)) score += 2;
          });
          if (str.length > 0) score += 0.5;
        });

        if (score > maxScore) {
          maxScore = score;
          bestRow = r + 1;
        }
      }

      headerRowNumber.value = bestRow;
      autoDetectLastDataRow(rows, bestRow);
      extractColumns();
    };

    // Auto-detectar la última fila de estudiantes:
    // Funciona con o sin columna NUM, detectando el final de la lista por palabras clave de footer,
    // bloques de convenciones/juicios, párrafos largos explicativos o filas vacías separadoras.
    const autoDetectLastDataRow = (rows, headerRow) => {
      let lastStudentRow = headerRow;
      const footerKeywords = [
        "CODIGO", "JUICIO", "JUICIOS", "CONVENCION", "CONVENCIONES",
        "PROMEDIO", "TOTAL", "RESUMEN", "DOCENTE", "PROFESOR",
        "RECTOR", "DIRECTOR", "COORDINADOR", "FIRMA", "OBSERVACION",
        "OBSERVACIONES", "ESCALA", "DESEMPENO", "ESTADISTICA",
        "GENERADO", "FECHA:", "PAGINA", "SISTEMA", "CONVENCIONES DE"
      ];

      for (let r = headerRow; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row)) break;

        const nonEmptyCells = row
          .map((c, idx) => ({ val: String(c || "").trim(), idx }))
          .filter((item) => item.val.length > 0);

        // Fila completamente vacía
        if (nonEmptyCells.length === 0) {
          if (lastStudentRow > headerRow) {
            // Ya se habían detectado estudiantes y hay una fila en blanco: marca el fin
            break;
          }
          continue;
        }

        // Si contiene palabras clave de footer o convenciones
        const isFooterKeyword = nonEmptyCells.some((item) => {
          const clean = cleanString(item.val);
          return footerKeywords.some(
            (kw) =>
              clean === kw ||
              clean.startsWith(kw + " ") ||
              clean.startsWith(kw + ":") ||
              clean.includes(" " + kw)
          );
        });

        if (isFooterKeyword) {
          break;
        }

        // Si tiene párrafos explicativos largos (> 55 caracteres con espacios)
        const hasLongParagraph = nonEmptyCells.some((item) => {
          const v = item.val;
          return v.length > 55 && v.includes(" ") && v.split(" ").length > 7;
        });

        if (hasLongParagraph) {
          break;
        }

        // Si tiene etiqueta descriptiva como "Docente:" o "Firma:"
        const hasColonLabel =
          nonEmptyCells.length <= 2 &&
          nonEmptyCells.some((item) => item.val.endsWith(":"));
        if (hasColonLabel) {
          break;
        }

        // Es una fila de estudiante válida (con o sin número)
        lastStudentRow = r + 1;
      }

      // Fallback seguro: si por estructura atípica no se detectó nada, usar todas las filas
      if (lastStudentRow <= headerRow) {
        lastStudentRow = rows.length;
      }

      lastDataRowNumber.value = lastStudentRow;
    };

    const extractColumns = () => {
      const rowIndex = headerRowNumber.value - 1;
      const headerRow = rawRows.value[rowIndex] || [];
      const cols = [];

      headerRow.forEach((cell, idx) => {
        let label = String(cell || "").trim();
        if (!label) {
          label = `Columna ${getColumnLetter(idx)}`;
        }
        cols.push({
          index: idx,
          letter: getColumnLetter(idx),
          label: label,
        });
      });

      detectedColumns.value = cols;
      autoGuessFieldMappings(cols);
    };

    const changeHeaderRow = (num) => {
      if (num < 1 || num > rawRows.value.length) return;
      headerRowNumber.value = num;
      // Ajustar lastDataRowNumber si el nuevo header se adelantó
      if (lastDataRowNumber.value <= num) {
        lastDataRowNumber.value = num + 1;
      }
      extractColumns();
    };

    const onHeaderRowChange = () => {
      if (lastDataRowNumber.value <= headerRowNumber.value) {
        lastDataRowNumber.value = headerRowNumber.value + 1;
      }
      extractColumns();
    };

    const changeLastDataRow = (num) => {
      if (num <= headerRowNumber.value || num > rawRows.value.length) return;
      lastDataRowNumber.value = num;
    };

    const onLastDataRowChange = () => {
      if (lastDataRowNumber.value <= headerRowNumber.value) {
        lastDataRowNumber.value = headerRowNumber.value + 1;
      }
    };

    // Clic en la tabla del Paso 2: si la fila está antes o igual al encabezado actual,
    // se mueve el encabezado; si está después, se mueve el marcador de fin de lista.
    const onRowClickStep2 = (rowNum) => {
      if (tableClickMode.value === "header") {
        changeHeaderRow(rowNum);
      } else {
        if (rowNum <= headerRowNumber.value) {
          changeHeaderRow(rowNum);
        } else {
          changeLastDataRow(rowNum);
        }
      }
    };

    // Auto guess mappings based on column names
    const autoGuessFieldMappings = (cols) => {
      let foundLastName = null;
      let foundName = null;
      let foundFullName = null;
      let foundCode = null;
      let foundOrder = null;
      let foundDef = null;
      let foundNiv = null;
      let foundL1 = null;

      cols.forEach((col) => {
        const lbl = cleanString(col.label);
        if (lbl.includes("APELLIDO") && !lbl.includes("NOMBRE")) {
          foundLastName = col.index;
        } else if (lbl.includes("NOMBRE") && !lbl.includes("APELLIDO")) {
          foundName = col.index;
        } else if (
          (lbl.includes("APELLIDO") && lbl.includes("NOMBRE")) ||
          lbl.includes("ESTUDIANTE") ||
          lbl.includes("ALUMNO")
        ) {
          foundFullName = col.index;
        }

        if (
          lbl.includes("DOC") ||
          lbl.includes("IDENTIFICACION") ||
          lbl.includes("TI") ||
          lbl.includes("CC") ||
          lbl.includes("CEDULA") ||
          lbl.includes("TARJETA") ||
          lbl.includes("CODIGO")
        ) {
          foundCode = col.index;
        }

        if (
          lbl === "NO" ||
          lbl === "NUM" ||
          lbl === "N" ||
          lbl.includes("ORDEN") ||
          lbl.includes("NUMERO")
        ) {
          foundOrder = col.index;
        }

        if (
          foundDef === null &&
          (lbl === "DEF" ||
            lbl === "DEFINITIVA" ||
            lbl === "NOTA" ||
            lbl === "NOTA FINAL" ||
            lbl.includes("DEFINITIVA") ||
            lbl.includes("NOTA FINAL") ||
            lbl === "CALIFICACION" ||
            lbl === "PROMEDIO")
        ) {
          foundDef = col.index;
        }

        if (
          foundNiv === null &&
          (lbl === "NIV" ||
            lbl === "NIVELACION" ||
            lbl.includes("NIVELAC") ||
            lbl.includes("RECUPERAC"))
        ) {
          foundNiv = col.index;
        }

        if (
          foundL1 === null &&
          (lbl === "L1" || lbl === "LOGRO" || lbl === "LOGRO 1" || lbl.includes("LOGRO"))
        ) {
          foundL1 = col.index;
        }
      });

      if (foundLastName !== null && foundName !== null) {
        nameMode.value = "split";
        fieldMap.value.lastNameCol = foundLastName;
        fieldMap.value.nameCol = foundName;
      } else if (foundFullName !== null) {
        nameMode.value = "combined_last_first";
        fieldMap.value.fullNameCol = foundFullName;
      } else {
        nameMode.value = "split";
      }

      fieldMap.value.codeCol = foundCode;
      fieldMap.value.orderCol = foundOrder;
      fieldMap.value.defCol = foundDef;
      fieldMap.value.nivCol = foundNiv;
      fieldMap.value.l1Col = foundL1;
    };

    const canProceedFromStep3 = computed(() => {
      const hasName =
        nameMode.value === "split"
          ? fieldMap.value.lastNameCol !== null && fieldMap.value.nameCol !== null
          : fieldMap.value.fullNameCol !== null;
      return hasName && fieldMap.value.defCol !== null;
    });

    // STEP 4: Matching Engine
    const sortedPandoraStudents = computed(() => {
      return [...props.usuariosEstudiantes].sort((a, b) => {
        const lnA = a.lastName || "";
        const lnB = b.lastName || "";
        return lnA.localeCompare(lnB);
      });
    });

    const runMatchingAndProceed = () => {
      executeMatching();
      goToStep(4);
    };

    const executeMatching = () => {
      // Usar solo las filas del rango [headerRowNumber .. lastDataRowNumber] (ambos 1-based)
      const dataRows = rawRows.value.slice(headerRowNumber.value, lastDataRowNumber.value);
      const results = [];

      // Pre-process Pandora students with normalized tokens
      const pandoraProcessed = props.usuariosEstudiantes.map((s) => {
        const cleanLast = cleanString(s.lastName);
        const cleanFirst = cleanString(s.name);
        const fullClean = `${cleanLast} ${cleanFirst}`.trim();
        const fullCleanInverted = `${cleanFirst} ${cleanLast}`.trim();
        const tokens = fullClean.split(" ").filter((w) => w.length > 1);
        const normDoc = normalizeDoc(s.code);
        return {
          original: s,
          id: s.id,
          cleanLast,
          cleanFirst,
          fullClean,
          fullCleanInverted,
          tokens,
          normDoc,
        };
      });

      dataRows.forEach((row, rIdx) => {
        if (!Array.isArray(row)) return;

        // Extract student name from excel
        let rawExcelName = "";
        if (nameMode.value === "split") {
          const lName = row[fieldMap.value.lastNameCol];
          const fName = row[fieldMap.value.nameCol];
          rawExcelName = `${lName || ""} ${fName || ""}`.trim();
        } else {
          rawExcelName = String(row[fieldMap.value.fullNameCol] || "").trim();
        }

        // If completely empty row, skip
        if (!rawExcelName && (!fieldMap.value.codeCol || !row[fieldMap.value.codeCol])) {
          return;
        }

        // Extract excel document if mapped
        let excelDoc = "";
        let normExcelDoc = "";
        if (fieldMap.value.codeCol !== null && row[fieldMap.value.codeCol]) {
          excelDoc = String(row[fieldMap.value.codeCol]).trim();
          normExcelDoc = normalizeDoc(excelDoc);
        }

        // Extract order number if mapped
        let orderNum = rIdx + 1;
        if (fieldMap.value.orderCol !== null && row[fieldMap.value.orderCol]) {
          const parsed = parseInt(row[fieldMap.value.orderCol], 10);
          if (!isNaN(parsed)) orderNum = parsed;
        }

        const cleanExcel = cleanString(rawExcelName);
        const excelTokens = cleanExcel.split(" ").filter((w) => w.length > 1);

        // Matching algorithm
        let bestStudent = null;
        let bestScore = 0;

        pandoraProcessed.forEach((pst) => {
          let score = 0;

          // 1. Exact document match = 100%
          if (normExcelDoc && pst.normDoc && normExcelDoc === pst.normDoc) {
            score = 100;
          } else {
            // 2. Exact string match
            if (cleanExcel === pst.fullClean || cleanExcel === pst.fullCleanInverted) {
              score = 98;
            } else if (excelTokens.length > 0 && pst.tokens.length > 0) {
              // 3. Token overlap match
              let matchCount = 0;
              excelTokens.forEach((tk) => {
                if (pst.tokens.includes(tk)) {
                  matchCount++;
                }
              });

              const maxTokens = Math.max(excelTokens.length, pst.tokens.length);
              const overlapRatio = matchCount / maxTokens;
              score = Math.round(overlapRatio * 90);
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestStudent = pst.original;
          }
        });

        let status = "unmatched";
        let assignedId = null;

        if (bestScore >= 70 && bestStudent) {
          status = "matched";
          assignedId = bestStudent.id;
        } else if (bestScore >= 40 && bestStudent) {
          status = "partial";
          assignedId = bestStudent.id;
        }

        results.push({
          rowIdx: rIdx,
          rawRowIndex: headerRowNumber.value + rIdx,
          orderNum: orderNum,
          excelName: rawExcelName || `Fila ${rIdx + 1}`,
          excelDoc: excelDoc,
          cleanExcelName: cleanExcel,
          status: status,
          matchScore: bestScore,
          assignedStudentId: assignedId,
          originalExcelRow: row,
        });
      });

      matchedRows.value = results;
    };

    const autoMatchedCount = computed(() => {
      return matchedRows.value.filter((r) => r.status === "matched").length;
    });

    const partialMatchedCount = computed(() => {
      return matchedRows.value.filter((r) => r.status === "partial").length;
    });

    const unmatchedCount = computed(() => {
      return matchedRows.value.filter((r) => r.status === "unmatched" || !r.assignedStudentId).length;
    });

    const filteredMatchedRows = computed(() => {
      let list = matchedRows.value;
      if (matchFilter.value === "REVIEW") {
        list = list.filter((r) => r.status === "partial");
      } else if (matchFilter.value === "UNMATCHED") {
        list = list.filter((r) => r.status === "unmatched" || !r.assignedStudentId);
      }

      if (searchTerm.value.trim()) {
        const q = cleanString(searchTerm.value);
        list = list.filter((r) => {
          return (
            cleanString(r.excelName).includes(q) ||
            cleanString(r.excelDoc).includes(q)
          );
        });
      }
      return list;
    });

    const onManualStudentChange = (row) => {
      if (row.assignedStudentId) {
        row.status = "matched";
      } else {
        row.status = "unmatched";
      }
    };

    // STEP 5: Calculate Grades & Export Data
    const calculateL1Value = (estudiante) => {
      if (!estudiante) return "";
      const promReg = parseFloat(estudiante.promedioRegular);
      const promReinf = parseFloat(estudiante.promedioRefuerzo);
      const promNiv = parseFloat(estudiante.promedioNivelacion);

      // 1. Refuerzo >= 3 y superó regular
      if (estudiante.hasReinforcement && promReinf > promReg && promReinf >= 3) {
        return 98;
      }
      // 2. Nivelación >= 3
      if (estudiante.hasRemedial && promNiv >= 3) {
        return 97;
      }
      // 3. Regular >= 3 pero refuerzo reprobado
      if (estudiante.hasReinforcement && promReg > promReinf && promReg >= 3) {
        return 96;
      }
      // 4. Refuerzo < 3 y regular < 3
      if (estudiante.hasReinforcement && promReinf < 3 && promReg < 3) {
        return 95;
      }
      // 5. Nivelación < 3
      if (estudiante.hasRemedial && promNiv < 3) {
        return 94;
      }
      // 6. Básico
      if (promReg >= 3 && promReg < 4) {
        return 93;
      }
      // 7. Alto
      if (promReg >= 4 && promReg < 4.5) {
        return 92;
      }
      // 8. Superior
      if (promReg >= 4.5) {
        return 91;
      }
      return "";
    };

    const getL1Meaning = (code) => {
      const meanings = {
        91: "Desempeño Superior",
        92: "Desempeño Alto",
        93: "Desempeño Básico",
        94: "No superó nivelación",
        95: "No superó refuerzo",
        96: "Aprobó por notas regulares",
        97: "Superó por nivelación",
        98: "Superó por refuerzo",
      };
      return meanings[code] || "-";
    };

    const getGradeClass = (grade) => {
      const num = parseFloat(grade);
      if (isNaN(num)) return "";
      if (num < 3.0) return "qz-grade-badge--bajo";
      if (num < 4.0) return "qz-grade-badge--basico";
      if (num < 4.5) return "qz-grade-badge--alto";
      return "qz-grade-badge--superior";
    };

    const finalExportList = computed(() => {
      const studentMap = new Map(
        props.usuariosEstudiantes.map((s) => [s.id, s])
      );
      const usedStudentIds = new Set();
      const list = [];

      matchedRows.value.forEach((mRow, idx) => {
        let def = "";
        let niv = "";
        let l1 = "";
        let estudiante = null;

        if (mRow.assignedStudentId && studentMap.has(mRow.assignedStudentId)) {
          estudiante = studentMap.get(mRow.assignedStudentId);
          usedStudentIds.add(estudiante.id);

          const promReg = parseFloat(estudiante.promedioRegular);
          const promReinf = parseFloat(estudiante.promedioRefuerzo);

          def =
            promReinf > promReg && estudiante.hasReinforcement
              ? estudiante.promedioRefuerzo
              : estudiante.promedioRegular;

          niv = estudiante.hasRemedial ? estudiante.promedioNivelacion : "";
          l1 = calculateL1Value(estudiante);
        }

        list.push({
          rawRowIndex: mRow.rawRowIndex,
          NUM: mRow.orderNum || idx + 1,
          NOMBRE: mRow.excelName,
          FALLAS: "",
          DEF: def !== undefined && def !== null ? def : "",
          NIV: niv !== undefined && niv !== null ? niv : "",
          L1: l1 !== undefined && l1 !== null ? l1 : "",
          L2: "",
        });
      });

      // Si el usuario configuró agregar estudiantes de Pandora no encontrados
      if (!onlyFileStudents.value) {
        props.usuariosEstudiantes.forEach((st) => {
          if (!usedStudentIds.has(st.id)) {
            const promReg = parseFloat(st.promedioRegular);
            const promReinf = parseFloat(st.promedioRefuerzo);
            const def =
              promReinf > promReg && st.hasReinforcement
                ? st.promedioRefuerzo
                : st.promedioRegular;
            const niv = st.hasRemedial ? st.promedioNivelacion : "";
            const l1 = calculateL1Value(st);

            list.push({
              NUM: list.length + 1,
              NOMBRE: `${st.lastName} ${st.name}`,
              FALLAS: "",
              DEF: def !== undefined && def !== null ? def : "",
              NIV: niv !== undefined && niv !== null ? niv : "",
              L1: l1 !== undefined && l1 !== null ? l1 : "",
              L2: "",
            });
          }
        });
      }

      return list;
    });

    const studentsWithGradeCount = computed(() => {
      return finalExportList.value.filter((i) => i.DEF !== "").length;
    });

    // Excel Exporters
    const descargarPlanillaAlfabetico = async () => {
      if (!props.usuariosEstudiantes || props.usuariosEstudiantes.length === 0) {
        const alert = await alertController.create({
          header: "Sin Estudiantes",
          message: "No hay estudiantes en el curso para generar la planilla.",
          buttons: ["Entendido"],
        });
        await alert.present();
        return;
      }

      const sortedStudents = [...props.usuariosEstudiantes].sort((a, b) => {
        const lA = a.lastName || "";
        const lB = b.lastName || "";
        return lA.localeCompare(lB);
      });

      const data = sortedStudents.map((estudiante, index) => {
        const def =
          parseFloat(estudiante.promedioRefuerzo) >
            parseFloat(estudiante.promedioRegular) &&
          estudiante.hasReinforcement
            ? estudiante.promedioRefuerzo
            : estudiante.promedioRegular;

        const niv = estudiante.hasRemedial ? estudiante.promedioNivelacion : "";
        const l1 = calculateL1Value(estudiante);

        return {
          NUM: index + 1,
          NOMBRE: `${estudiante.lastName} ${estudiante.name}`,
          FALLAS: "",
          DEF: def,
          NIV: niv,
          L1: l1,
          L2: "",
        };
      });

      buildAndDownloadWorkbook(data, `Planilla_Notas_Alfabetico_${props.year || ""}.xlsx`);
      handleClose();
    };

    const writeCellToSheet = (ws, rowIdx, colIdx, value) => {
      if (colIdx === null || colIdx === undefined) return;
      if (value === "" || value === null || value === undefined) return;

      const addr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      const existingCell = ws[addr] ? { ...ws[addr] } : {};
      const numVal = Number(value);
      const isNumeric =
        typeof value === "number" ||
        (String(value).trim() !== "" && !isNaN(numVal) && isFinite(numVal));

      ws[addr] = {
        ...existingCell,
        v: isNumeric ? numVal : String(value),
        t: isNumeric ? "n" : "s",
      };
      delete ws[addr].w;

      if (ws["!ref"]) {
        const range = XLSX.utils.decode_range(ws["!ref"]);
        if (rowIdx < range.s.r) range.s.r = rowIdx;
        if (rowIdx > range.e.r) range.e.r = rowIdx;
        if (colIdx < range.s.c) range.s.c = colIdx;
        if (colIdx > range.e.c) range.e.c = colIdx;
        ws["!ref"] = XLSX.utils.encode_range(range);
      }
    };

    const writeValuesToHtmlDoc = (exportRows) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(parsedHtmlText, "text/html");
      const tables = Array.from(doc.querySelectorAll("table"));

      exportRows.forEach((item) => {
        if (item.rawRowIndex === undefined || item.rawRowIndex === null) return;
        const target = htmlRowTargets[item.rawRowIndex];
        if (!target) return;
        const table = tables[target.tableIdx];
        if (!table) return;
        const rows = Array.from(table.rows || table.querySelectorAll("tr"));
        const tr = rows[target.trIdx];
        if (!tr) return;

        const cells = Array.from(tr.children).filter(
          (child) => child.tagName === "TD" || child.tagName === "TH"
        );

        const colToCell = [];
        cells.forEach((cell) => {
          const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);
          colToCell.push(cell);
          for (let i = 1; i < colspan; i++) {
            colToCell.push(null);
          }
        });

        const setCell = (colIdx, val) => {
          if (colIdx === null || colIdx === undefined) return;
          if (val === "" || val === null || val === undefined) return;
          const cell = colToCell[colIdx];
          if (cell) {
            cell.textContent = String(val);
          }
        };

        setCell(fieldMap.value.defCol, item.DEF);
        setCell(fieldMap.value.nivCol, item.NIV);
        setCell(fieldMap.value.l1Col, item.L1);
      });

      const metaCharset = doc.querySelector("meta[charset]");
      if (metaCharset) {
        metaCharset.setAttribute("charset", "utf-8");
      }
      const metaHttpEquiv = doc.querySelector('meta[http-equiv="Content-Type" i]');
      if (metaHttpEquiv) {
        metaHttpEquiv.setAttribute("content", "text/html; charset=utf-8");
      }

      return "\uFEFF<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    };

    const descargarPlanillaRellenada = () => {
      const data = finalExportList.value;
      const origName = selectedFile.value ? selectedFile.value.name : "Planilla.xlsx";
      const baseName = origName.replace(/\.(xlsx|xls|html|htm|csv)$/i, "");

      if (isHtmlFile && parsedHtmlText) {
        const updatedHtml = writeValuesToHtmlDoc(data);
        const blob = new Blob([updatedHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${baseName}_con_notas.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        handleClose();
        return;
      }

      if (parsedWorkbook && selectedSheet.value && parsedWorkbook.Sheets[selectedSheet.value]) {
        const ws = parsedWorkbook.Sheets[selectedSheet.value];
        data.forEach((item) => {
          if (item.rawRowIndex === undefined || item.rawRowIndex === null) return;
          writeCellToSheet(ws, item.rawRowIndex, fieldMap.value.defCol, item.DEF);
          writeCellToSheet(ws, item.rawRowIndex, fieldMap.value.nivCol, item.NIV);
          writeCellToSheet(ws, item.rawRowIndex, fieldMap.value.l1Col, item.L1);
        });

        // Normalizar estilos leídos por SheetJS (patternType/fgColor planos -> s.fill para xlsx-js-style)
        // y convertir celdas vacías con estilo (t === 'z') a texto vacío (t === 's', v === '') para que no se pierdan
        parsedWorkbook.SheetNames.forEach((shName) => {
          const sheet = parsedWorkbook.Sheets[shName];
          if (!sheet) return;
          Object.keys(sheet).forEach((key) => {
            if (key.startsWith("!")) return;
            const cell = sheet[key];
            if (!cell) return;
            if (cell.s && cell.s.patternType && cell.s.patternType !== "none" && !cell.s.fill) {
              cell.s.fill = {
                patternType: cell.s.patternType,
                fgColor: cell.s.fgColor,
                ...(cell.s.patternType !== "solid" && cell.s.bgColor ? { bgColor: cell.s.bgColor } : {}),
              };
            }
            if (cell.t === "z" && cell.s) {
              cell.t = "s";
              cell.v = "";
            }
          });
        });

        XLSX.writeFile(parsedWorkbook, `${baseName}_con_notas.xlsx`, { cellStyles: true });
        handleClose();
        return;
      }

      // Fallback si por alguna razón no hay libro original
      descargarPlanillaOrdenada();
    };

    const descargarPlanillaOrdenada = () => {
      const data = finalExportList.value;
      const fileName = `Planilla_Plataforma_Periodo_${props.periodoSelected || 1}_${props.year || ""}.xlsx`;
      buildAndDownloadWorkbook(data, fileName);
      handleClose();
    };

    const buildAndDownloadWorkbook = (data, fileName) => {
      const ws = XLSX.utils.json_to_sheet(data);

      // Estilos de encabezado
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "6A5AE0" } }, // Púrpura Queezy
        alignment: { horizontal: "center", vertical: "center" },
      };

      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[cellAddress]) {
          ws[cellAddress].s = headerStyle;
        }
      }

      // Ancho automático de columnas
      ws["!cols"] = [
        { wch: 6 },  // NUM
        { wch: 38 }, // NOMBRE
        { wch: 8 },  // FALLAS
        { wch: 8 },  // DEF
        { wch: 8 },  // NIV
        { wch: 8 },  // L1
        { wch: 8 },  // L2
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Planilla de Notas");

      // Hoja de Convenciones
      const conventions = [
        { "Código L1": 91, Significado: "El estudiante aprobó con un desempeño superior." },
        { "Código L1": 92, Significado: "El estudiante aprobó con un desempeño alto." },
        { "Código L1": 93, Significado: "El estudiante aprobó con un desempeño básico." },
        { "Código L1": 94, Significado: "A pesar de las actividades de nivelación, el estudiante no superó los desempeños esperados." },
        { "Código L1": 95, Significado: "A pesar de las actividades de refuerzo, el estudiante no superó los desempeños esperados." },
        { "Código L1": 96, Significado: "El estudiante logró los desempeños básicos con sus notas de clase, aunque no superó el refuerzo." },
        { "Código L1": 97, Significado: "El estudiante logró cumplir con los desempeños esperados gracias a actividades de nivelación." },
        { "Código L1": 98, Significado: "El estudiante logró cumplir con los desempeños esperados gracias a actividades de refuerzo." },
      ];

      const wsConv = XLSX.utils.json_to_sheet(conventions);
      for (let C = 0; C <= 1; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (wsConv[cellAddress]) {
          wsConv[cellAddress].s = headerStyle;
        }
      }
      wsConv["!cols"] = [{ wch: 12 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsConv, "Convenciones");

      XLSX.writeFile(wb, fileName);
    };

    return {
      tableClickMode,
      currentStep,
      steps,
      selectedFile,
      isDragging,
      fileError,
      fileInputRef,
      rawRows,
      sheetNames,
      selectedSheet,
      headerRowNumber,
      lastDataRowNumber,
      detectedColumns,
      nameMode,
      fieldMap,
      onlyFileStudents,
      matchedRows,
      matchFilter,
      searchTerm,
      sortedPandoraStudents,
      autoMatchedCount,
      partialMatchedCount,
      unmatchedCount,
      filteredMatchedRows,
      finalExportList,
      studentsWithGradeCount,
      canNavigateToStep,
      goToStep,
      handleClose,
      triggerFileInput,
      clearSelectedFile,
      handleFileChange,
      handleDrop,
      onSheetChange,
      changeHeaderRow,
      onHeaderRowChange,
      changeLastDataRow,
      onLastDataRowChange,
      onRowClickStep2,
      canProceedFromStep3,
      runMatchingAndProceed,
      onManualStudentChange,
      getGradeClass,
      getL1Meaning,
      formatFileSize,
      getColumnLetter,
      descargarPlanillaAlfabetico,
      descargarPlanillaOrdenada,
      descargarPlanillaRellenada,
      // Icons
      cloudUploadOutline,
      documentTextOutline,
      closeOutline,
      checkmarkOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      helpCircleOutline,
      arrowBackOutline,
      arrowForwardOutline,
      downloadOutline,
      peopleOutline,
      personOutline,
      optionsOutline,
      searchOutline,
      ribbonOutline,
    };
  },
};
</script>

<style>
/* ==========================================================================
   QUEEZY PLANILLA WIZARD MODAL (ESTILOS GLOBALES / SHADOW ROOT)
========================================================================== */
.qz-planilla-wizard-modal {
  --width: 94%;
  --max-width: 960px;
  --height: 90vh;
  --border-radius: 24px;
  --background: #ffffff;
}

.qz-planilla-wizard-modal::part(content) {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 48px -8px rgba(106, 90, 224, 0.25);
}

.qz-wizard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  color: #1e1b4b;
  overflow: hidden;
  font-family: inherit;
}

/* HEADER */
.qz-wizard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 26px 14px 26px;
  border-bottom: 1px solid #eef0f6;
  background: #ffffff;
}

.qz-wizard-header-left {
  display: flex;
  flex-direction: column;
}

.qz-wizard-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: #6a5ae0;
  background: rgba(106, 90, 224, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
  margin-bottom: 4px;
  width: fit-content;
}

.qz-wizard-title {
  margin: 0;
  font-size: 19px;
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
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.qz-wizard-close-btn:hover {
  background: #e2e8f0;
  color: #1e1b4b;
}

/* STEPPER */
.qz-stepper-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 26px;
  background: #f8fafc;
  border-bottom: 1px solid #eef0f6;
  overflow-x: auto;
}

.qz-step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  opacity: 0.55;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.qz-step-item.qz-step--active {
  opacity: 1;
}

.qz-step-item.qz-step--completed {
  opacity: 0.9;
}

.qz-step-item.qz-step--disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.qz-step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.qz-step-item.qz-step--active .qz-step-circle {
  background: #6a5ae0;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.4);
}

.qz-step-item.qz-step--completed .qz-step-circle {
  background: #10b981;
  color: #ffffff;
}

.qz-step-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.qz-step-item.qz-step--active .qz-step-label {
  color: #6a5ae0;
}

/* BODY */
.qz-wizard-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 26px;
}

.qz-step-pane {
  display: flex;
  flex-direction: column;
}

.qz-step-desc-box {
  margin-bottom: 18px;
}

.qz-pane-title {
  margin: 0 0 6px 0;
  font-size: 17px;
  font-weight: 800;
  color: #1e1b4b;
}

.qz-pane-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.45;
}

/* QUICK DOWNLOAD BOX (PASO 1) */
.qz-quick-download-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(106, 90, 224, 0.06);
  border: 1px dashed rgba(106, 90, 224, 0.3);
  padding: 14px 18px;
  border-radius: 14px;
  margin-bottom: 16px;
}

.qz-quick-download-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.qz-quick-icon {
  font-size: 26px;
  color: #6a5ae0;
}

.qz-quick-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 800;
  color: #1e1b4b;
}

.qz-quick-sub {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.qz-btn-quick {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.qz-btn-quick:hover {
  background: #5949d6;
  transform: translateY(-1px);
}

.qz-divider-or {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 10px 0 16px 0;
}

.qz-divider-or::before,
.qz-divider-or::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}

.qz-divider-or span {
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* DROP ZONE */
.qz-drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 34px 20px;
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.qz-drop-zone:hover,
.qz-drop-zone--dragover {
  border-color: #6a5ae0;
  background: rgba(106, 90, 224, 0.04);
}

.qz-drop-zone--loaded {
  border: 1.5px solid #10b981;
  background: rgba(16, 185, 129, 0.04);
  padding: 18px;
}

.qz-drop-zone-icon {
  font-size: 40px;
  color: #6a5ae0;
  margin-bottom: 8px;
}

.qz-drop-zone-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 700;
  color: #1e1b4b;
}

.qz-drop-zone-sub {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #64748b;
}

.qz-drop-zone-formats {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.qz-file-loaded-box {
  display: flex;
  align-items: center;
  gap: 14px;
}

.qz-file-icon-wrap {
  font-size: 32px;
  color: #10b981;
}

.qz-file-info-text {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
}

.qz-file-name {
  font-size: 14px;
  font-weight: 800;
  color: #1e1b4b;
}

.qz-file-size {
  font-size: 12px;
  color: #64748b;
}

.qz-file-remove-btn {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.qz-alert-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 14px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

/* STEP 2: ROW STEPPER & TABLE */
.qz-row-steppers-dual {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.qz-row-stepper-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.qz-stepper-role-pill {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 2px 7px;
  border-radius: 5px;
  margin-right: 5px;
  vertical-align: middle;
}

.qz-stepper-role-pill--header {
  background: rgba(106, 90, 224, 0.12);
  color: #6a5ae0;
}

.qz-stepper-role-pill--last {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

/* Resumen de rango */
.qz-range-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  font-size: 12px;
}

.qz-range-pill {
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 700;
}

.qz-range-pill--header {
  background: rgba(106, 90, 224, 0.1);
  color: #6a5ae0;
}

.qz-range-pill--data {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.qz-range-arrow {
  color: #94a3b8;
  font-size: 14px;
}

.qz-range-count {
  color: #94a3b8;
  font-size: 11px;
}

/* Estado de filas en tabla de previsualización */
.qz-cell--row-state {
  min-width: 90px;
  text-align: center;
  padding: 6px 8px;
}

.qz-row--in-range {
  background: rgba(16, 185, 129, 0.05) !important;
}

.qz-row--out-range {
  background: rgba(100, 116, 139, 0.04) !important;
  opacity: 0.6;
}

.qz-badge-in-range {
  background: #dcfce7;
  color: #15803d;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.qz-badge-out-range {
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.qz-badge-pre-header {
  background: #fef3c7;
  color: #b45309;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.qz-preview-hint {
  margin: 8px 0 0 0;
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
}

.qz-row-stepper-box {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.qz-row-stepper {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 3px;
}

.qz-stepper-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  color: #1e1b4b;
}

.qz-stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qz-row-native-select {
  border: none;
  background: transparent;
  padding: 4px 10px;
  font-weight: 800;
  font-size: 13px;
  color: #6a5ae0;
  cursor: pointer;
}

.qz-table-preview-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: auto;
  max-height: 280px;
  background: #ffffff;
}

.qz-preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.qz-preview-table th,
.qz-preview-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #eef2f6;
  text-align: left;
  white-space: nowrap;
}

.qz-preview-table th {
  background: #f8fafc;
  font-weight: 800;
  color: #475569;
  position: sticky;
  top: 0;
  z-index: 2;
}

.qz-cell--row-num {
  font-weight: 800;
  color: #64748b;
  background: #f8fafc;
  width: 60px;
  text-align: center;
}

.qz-row--header-active {
  background: rgba(106, 90, 224, 0.12) !important;
}

.qz-row--header-active td {
  font-weight: 800;
  color: #6a5ae0;
}

.qz-badge-active-header {
  background: #6a5ae0;
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
}

.qz-detected-columns-bar {
  margin-top: 14px;
}

.qz-detected-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  display: block;
  margin-bottom: 6px;
}

.qz-detected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.qz-detected-chip {
  background: #f1f5f9;
  color: #334155;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
}

/* STEP 3: MAPPINGS */
.qz-card-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}

.qz-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.qz-section-header ion-icon {
  font-size: 18px;
  color: #6a5ae0;
}

.qz-section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #1e1b4b;
}

.qz-section-sub {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #64748b;
}

.qz-mode-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.qz-mode-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-mode-card:hover {
  border-color: #a39bf0;
}

.qz-mode-card--active {
  border-color: #6a5ae0;
  background: rgba(106, 90, 224, 0.05);
}

.qz-mode-radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  margin-top: 2px;
  flex-shrink: 0;
  position: relative;
}

.qz-mode-card--active .qz-mode-radio {
  border-color: #6a5ae0;
}

.qz-mode-card--active .qz-mode-radio::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 6px;
  height: 6px;
  background: #6a5ae0;
  border-radius: 50%;
}

.qz-mode-card strong {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: #1e1b4b;
  margin-bottom: 2px;
}

.qz-mode-card p {
  margin: 0;
  font-size: 11px;
  color: #64748b;
}

.qz-grid-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.qz-field-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-field-label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.qz-required {
  color: #ef4444;
}

.qz-select {
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #1e1b4b;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.qz-select:focus {
  border-color: #6a5ae0;
}

.qz-select--compact {
  padding: 6px 10px;
  font-size: 12px;
}

.qz-checkbox-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-checkbox-card:hover {
  border-color: #a39bf0;
}

.qz-checkbox-indicator {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
  font-size: 14px;
}

.qz-checkbox-indicator--checked {
  background: #6a5ae0;
  border-color: #6a5ae0;
}

.qz-checkbox-text strong {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: #1e1b4b;
}

.qz-checkbox-text p {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #64748b;
}

/* STEP 4: HOMOLOGATION */
.qz-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.qz-metric-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.qz-metric-card--success {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.06);
}

.qz-metric-card--warning {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.06);
}

.qz-metric-card--muted {
  border-color: rgba(100, 116, 139, 0.2);
  background: rgba(100, 116, 139, 0.05);
}

.qz-metric-value {
  font-size: 22px;
  font-weight: 800;
  color: #1e1b4b;
}

.qz-metric-card--success .qz-metric-value {
  color: #059669;
}

.qz-metric-card--warning .qz-metric-value {
  color: #d97706;
}

.qz-metric-card--muted .qz-metric-value {
  color: #64748b;
}

.qz-metric-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-top: 2px;
}

.qz-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.qz-filter-tabs {
  display: flex;
  gap: 6px;
}

.qz-tab-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.qz-tab-btn--active {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
}

.qz-search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 4px 10px;
  color: #64748b;
}

.qz-search-input {
  border: none;
  outline: none;
  font-size: 12px;
  color: #1e1b4b;
  background: transparent;
  width: 180px;
}

.qz-homologation-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: auto;
  max-height: 340px;
}

.qz-homologation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.qz-homologation-table th,
.qz-homologation-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f6;
  text-align: left;
}

.qz-homologation-table th {
  background: #f8fafc;
  font-weight: 800;
  color: #475569;
  position: sticky;
  top: 0;
  z-index: 2;
}

.qz-excel-student-cell {
  display: flex;
  flex-direction: column;
}

.qz-excel-student-name {
  font-size: 13px;
  color: #1e1b4b;
}

.qz-excel-student-doc {
  font-size: 11px;
  color: #64748b;
}

.qz-match-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
}

.qz-match-badge--matched {
  background: #dcfce7;
  color: #15803d;
}

.qz-match-badge--partial {
  background: #fef3c7;
  color: #b45309;
}

.qz-match-badge--unmatched {
  background: #f1f5f9;
  color: #64748b;
}

/* STEP 5: PREVIEW & GRADES */
.qz-final-preview-table {
  font-size: 13px;
}

.qz-grade-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 12px;
}

.qz-grade-badge--bajo {
  background: #fee2e2;
  color: #b91c1c;
}

.qz-grade-badge--basico {
  background: #fef3c7;
  color: #b45309;
}

.qz-grade-badge--alto {
  background: #dcfce7;
  color: #15803d;
}

.qz-grade-badge--superior {
  background: #dbeafe;
  color: #1d4ed8;
}

.qz-grade-badge--niv {
  background: #f3e8ff;
  color: #7e22ce;
}

.qz-badge-l1 {
  background: rgba(106, 90, 224, 0.1);
  color: #6a5ae0;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.qz-desempeno-text {
  font-size: 12px;
  color: #475569;
}

.qz-conventions-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 14px;
  background: rgba(106, 90, 224, 0.08);
  border-radius: 10px;
  color: #6a5ae0;
  font-size: 12px;
}

/* FOOTER */
.qz-wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 26px;
  border-top: 1px solid #eef0f6;
  background: #ffffff;
}

.qz-footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn-secondary:hover {
  background: #e2e8f0;
}

.qz-btn-ghost {
  padding: 9px 14px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.qz-btn-ghost:hover {
  color: #1e1b4b;
}

.qz-btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #6a5ae0;
  border: none;
  color: #ffffff;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.35);
  transition: all 0.2s ease;
}

.qz-btn-primary:hover:not(:disabled) {
  background: #5949d6;
  transform: translateY(-1px);
}

.qz-btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.qz-btn-download-final {
  background: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

.qz-btn-download-final:hover {
  background: #059669;
}


/* Click mode selector bar */
.qz-click-mode-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(106, 90, 224, 0.05);
  border: 1px dashed rgba(106, 90, 224, 0.25);
  border-radius: 12px;
  padding: 8px 14px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.qz-click-mode-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b448a;
}

.qz-click-mode-pills {
  display: flex;
  gap: 8px;
}

.qz-mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid #dcd8fc;
  background: #ffffff;
  color: #555566;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-mode-pill:hover {
  background: #f4f3ff;
  border-color: #a39bf0;
  color: #6a5ae0;
}

.qz-mode-pill--active {
  background: #6a5ae0 !important;
  color: #ffffff !important;
  border-color: #6a5ae0 !important;
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.3);
}

.qz-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.qz-dot--header {
  background: #8b5cf6;
}

.qz-dot--last {
  background: #10b981;
}

.qz-mode-pill--active .qz-dot {
  background: #ffffff;
}

/* ==========================================================================
   DARK MODE - NUEVOS ELEMENTOS PASO 2
========================================================================== */
body.dark .qz-row-stepper-block,
html.dark .qz-row-stepper-block,
.dark .qz-row-stepper-block,
:root[data-theme="dark"] .qz-row-stepper-block {
  background: #16122d !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-row--in-range,
html.dark .qz-row--in-range,
.dark .qz-row--in-range,
:root[data-theme="dark"] .qz-row--in-range {
  background: rgba(16, 185, 129, 0.08) !important;
}

body.dark .qz-row--out-range,
html.dark .qz-row--out-range,
.dark .qz-row--out-range,
:root[data-theme="dark"] .qz-row--out-range {
  background: rgba(100, 116, 139, 0.06) !important;
}

body.dark .qz-range-pill--header,
html.dark .qz-range-pill--header,
.dark .qz-range-pill--header,
:root[data-theme="dark"] .qz-range-pill--header {
  background: rgba(106, 90, 224, 0.2) !important;
  color: #a39bf0 !important;
}

body.dark .qz-range-pill--data,
html.dark .qz-range-pill--data,
.dark .qz-range-pill--data,
:root[data-theme="dark"] .qz-range-pill--data {
  background: rgba(16, 185, 129, 0.15) !important;
  color: #34d399 !important;
}

body.dark .qz-preview-hint,
html.dark .qz-preview-hint,
.dark .qz-preview-hint,
:root[data-theme="dark"] .qz-preview-hint {
  color: #64748b !important;
}

@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-row-stepper-block {
    background: #16122d !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-row--in-range {
    background: rgba(16, 185, 129, 0.08) !important;
  }
  body:not(.light) .qz-row--out-range {
    background: rgba(100, 116, 139, 0.06) !important;
  }
}


body.dark .qz-click-mode-bar,
html.dark .qz-click-mode-bar,
.dark .qz-click-mode-bar,
:root[data-theme="dark"] .qz-click-mode-bar {
  background: rgba(163, 155, 240, 0.08);
  border-color: rgba(163, 155, 240, 0.2);
}

body.dark .qz-click-mode-label,
html.dark .qz-click-mode-label,
.dark .qz-click-mode-label,
:root[data-theme="dark"] .qz-click-mode-label {
  color: #dcd8fc;
}

body.dark .qz-mode-pill,
html.dark .qz-mode-pill,
.dark .qz-mode-pill,
:root[data-theme="dark"] .qz-mode-pill {
  background: #1d1838;
  border-color: #2e265c;
  color: #c4b5fd;
}

body.dark .qz-mode-pill:hover,
html.dark .qz-mode-pill:hover,
.dark .qz-mode-pill:hover,
:root[data-theme="dark"] .qz-mode-pill:hover {
  background: #27204e;
  border-color: #8b5cf6;
  color: #ffffff;
}

body.dark .qz-mode-pill--active,
html.dark .qz-mode-pill--active,
.dark .qz-mode-pill--active,
:root[data-theme="dark"] .qz-mode-pill--active {
  background: #6a5ae0 !important;
  border-color: #6a5ae0 !important;
  color: #ffffff !important;
}


@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-click-mode-bar {
    background: rgba(163, 155, 240, 0.08);
    border-color: rgba(163, 155, 240, 0.2);
  }
  body:not(.light) .qz-click-mode-label {
    color: #dcd8fc;
  }
  body:not(.light) .qz-mode-pill {
    background: #1d1838;
    border-color: #2e265c;
    color: #c4b5fd;
  }
  body:not(.light) .qz-mode-pill:hover {
    background: #27204e;
    border-color: #8b5cf6;
    color: #ffffff;
  }
  body:not(.light) .qz-mode-pill--active {
    background: #6a5ae0 !important;
    border-color: #6a5ae0 !important;
    color: #ffffff !important;
  }
}

/* ==========================================================================
   DARK MODE - ESTILOS ORIGINALES
========================================================================== */
body.dark .qz-planilla-wizard-modal,
html.dark .qz-planilla-wizard-modal,
.dark .qz-planilla-wizard-modal,
:root[data-theme="dark"] .qz-planilla-wizard-modal {
  --background: #1d1838 !important;
}

body.dark .qz-planilla-wizard-modal::part(content),
html.dark .qz-planilla-wizard-modal::part(content),
.dark .qz-planilla-wizard-modal::part(content),
:root[data-theme="dark"] .qz-planilla-wizard-modal::part(content) {
  background: #1d1838 !important;
  box-shadow: 0 20px 48px -8px rgba(0, 0, 0, 0.6) !important;
}

body.dark .qz-wizard-container,
html.dark .qz-wizard-container,
.dark .qz-wizard-container,
:root[data-theme="dark"] .qz-wizard-container {
  background: #1d1838 !important;
  color: #f4f3ff !important;
}

body.dark .qz-wizard-header,
html.dark .qz-wizard-header,
.dark .qz-wizard-header,
:root[data-theme="dark"] .qz-wizard-header,
body.dark .qz-wizard-footer,
html.dark .qz-wizard-footer,
.dark .qz-wizard-footer,
:root[data-theme="dark"] .qz-wizard-footer {
  background: #1d1838 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-stepper-bar,
html.dark .qz-stepper-bar,
.dark .qz-stepper-bar,
:root[data-theme="dark"] .qz-stepper-bar {
  background: #16122d !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-step-circle,
html.dark .qz-step-circle,
.dark .qz-step-circle,
:root[data-theme="dark"] .qz-step-circle {
  background: #28214d !important;
  color: #a39bf0 !important;
}

body.dark .qz-step-label,
html.dark .qz-step-label,
.dark .qz-step-label,
:root[data-theme="dark"] .qz-step-label {
  color: #a39bf0 !important;
}

body.dark .qz-step-item.qz-step--active .qz-step-label,
html.dark .qz-step-item.qz-step--active .qz-step-label,
.dark .qz-step-item.qz-step--active .qz-step-label,
:root[data-theme="dark"] .qz-step-item.qz-step--active .qz-step-label {
  color: #ffffff !important;
}

body.dark .qz-wizard-title,
html.dark .qz-wizard-title,
.dark .qz-wizard-title,
:root[data-theme="dark"] .qz-wizard-title,
body.dark .qz-pane-title,
html.dark .qz-pane-title,
.dark .qz-pane-title,
:root[data-theme="dark"] .qz-pane-title,
body.dark .qz-quick-title,
html.dark .qz-quick-title,
.dark .qz-quick-title,
:root[data-theme="dark"] .qz-quick-title,
body.dark .qz-drop-zone-title,
html.dark .qz-drop-zone-title,
.dark .qz-drop-zone-title,
:root[data-theme="dark"] .qz-drop-zone-title,
body.dark .qz-section-header h4,
html.dark .qz-section-header h4,
.dark .qz-section-header h4,
:root[data-theme="dark"] .qz-section-header h4,
body.dark .qz-mode-card strong,
html.dark .qz-mode-card strong,
.dark .qz-mode-card strong,
:root[data-theme="dark"] .qz-mode-card strong,
body.dark .qz-checkbox-text strong,
html.dark .qz-checkbox-text strong,
.dark .qz-checkbox-text strong,
:root[data-theme="dark"] .qz-checkbox-text strong,
body.dark .qz-excel-student-name,
html.dark .qz-excel-student-name,
.dark .qz-excel-student-name,
:root[data-theme="dark"] .qz-excel-student-name,
body.dark .qz-metric-value,
html.dark .qz-metric-value,
.dark .qz-metric-value,
:root[data-theme="dark"] .qz-metric-value,
body.dark .qz-file-name,
html.dark .qz-file-name,
.dark .qz-file-name,
:root[data-theme="dark"] .qz-file-name {
  color: #f4f3ff !important;
}

body.dark .qz-pane-subtitle,
html.dark .qz-pane-subtitle,
.dark .qz-pane-subtitle,
:root[data-theme="dark"] .qz-pane-subtitle,
body.dark .qz-quick-sub,
html.dark .qz-quick-sub,
.dark .qz-quick-sub,
:root[data-theme="dark"] .qz-quick-sub,
body.dark .qz-drop-zone-sub,
html.dark .qz-drop-zone-sub,
.dark .qz-drop-zone-sub,
:root[data-theme="dark"] .qz-drop-zone-sub,
body.dark .qz-section-sub,
html.dark .qz-section-sub,
.dark .qz-section-sub,
:root[data-theme="dark"] .qz-section-sub,
body.dark .qz-field-label,
html.dark .qz-field-label,
.dark .qz-field-label,
:root[data-theme="dark"] .qz-field-label,
body.dark .qz-mode-card p,
html.dark .qz-mode-card p,
.dark .qz-mode-card p,
:root[data-theme="dark"] .qz-mode-card p,
body.dark .qz-checkbox-text p,
html.dark .qz-checkbox-text p,
.dark .qz-checkbox-text p,
:root[data-theme="dark"] .qz-checkbox-text p,
body.dark .qz-excel-student-doc,
html.dark .qz-excel-student-doc,
.dark .qz-excel-student-doc,
:root[data-theme="dark"] .qz-excel-student-doc,
body.dark .qz-metric-label,
html.dark .qz-metric-label,
.dark .qz-metric-label,
:root[data-theme="dark"] .qz-metric-label,
body.dark .qz-desempeno-text,
html.dark .qz-desempeno-text,
.dark .qz-desempeno-text,
:root[data-theme="dark"] .qz-desempeno-text {
  color: #a39bf0 !important;
}

body.dark .qz-drop-zone,
html.dark .qz-drop-zone,
.dark .qz-drop-zone,
:root[data-theme="dark"] .qz-drop-zone {
  background: #16122d !important;
  border-color: #3b326b !important;
}

body.dark .qz-quick-download-box,
html.dark .qz-quick-download-box,
.dark .qz-quick-download-box,
:root[data-theme="dark"] .qz-quick-download-box {
  background: rgba(106, 90, 224, 0.15) !important;
  border-color: rgba(106, 90, 224, 0.35) !important;
}

body.dark .qz-card-section,
html.dark .qz-card-section,
.dark .qz-card-section,
:root[data-theme="dark"] .qz-card-section,
body.dark .qz-metric-card,
html.dark .qz-metric-card,
.dark .qz-metric-card,
:root[data-theme="dark"] .qz-metric-card {
  background: #16122d !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-mode-card,
html.dark .qz-mode-card,
.dark .qz-mode-card,
:root[data-theme="dark"] .qz-mode-card,
body.dark .qz-checkbox-card,
html.dark .qz-checkbox-card,
.dark .qz-checkbox-card,
:root[data-theme="dark"] .qz-checkbox-card {
  background: #231d42 !important;
  border-color: #3b326b !important;
}

body.dark .qz-mode-card--active,
html.dark .qz-mode-card--active,
.dark .qz-mode-card--active,
:root[data-theme="dark"] .qz-mode-card--active {
  border-color: #8b7df8 !important;
  background: rgba(139, 125, 248, 0.12) !important;
}

body.dark .qz-select,
html.dark .qz-select,
.dark .qz-select,
:root[data-theme="dark"] .qz-select {
  background: #16122d !important;
  color: #f4f3ff !important;
  border-color: #3b326b !important;
}

body.dark .qz-table-preview-wrap,
html.dark .qz-table-preview-wrap,
.dark .qz-table-preview-wrap,
:root[data-theme="dark"] .qz-table-preview-wrap,
body.dark .qz-homologation-table-wrap,
html.dark .qz-homologation-table-wrap,
.dark .qz-homologation-table-wrap,
:root[data-theme="dark"] .qz-homologation-table-wrap {
  background: #16122d !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-preview-table th,
html.dark .qz-preview-table th,
.dark .qz-preview-table th,
:root[data-theme="dark"] .qz-preview-table th,
body.dark .qz-homologation-table th,
html.dark .qz-homologation-table th,
.dark .qz-homologation-table th,
:root[data-theme="dark"] .qz-homologation-table th {
  background: #231d42 !important;
  color: #f4f3ff !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark .qz-preview-table td,
html.dark .qz-preview-table td,
.dark .qz-preview-table td,
:root[data-theme="dark"] .qz-preview-table td,
body.dark .qz-homologation-table td,
html.dark .qz-homologation-table td,
.dark .qz-homologation-table td,
:root[data-theme="dark"] .qz-homologation-table td {
  border-color: rgba(255, 255, 255, 0.06) !important;
  color: #f4f3ff !important;
}

body.dark .qz-cell--row-num,
html.dark .qz-cell--row-num,
.dark .qz-cell--row-num,
:root[data-theme="dark"] .qz-cell--row-num {
  background: #16122d !important;
  color: #a39bf0 !important;
}

body.dark .qz-tab-btn,
html.dark .qz-tab-btn,
.dark .qz-tab-btn,
:root[data-theme="dark"] .qz-tab-btn,
body.dark .qz-search-box,
html.dark .qz-search-box,
.dark .qz-search-box,
:root[data-theme="dark"] .qz-search-box {
  background: #16122d !important;
  border-color: #3b326b !important;
  color: #f4f3ff !important;
}

body.dark .qz-search-input,
html.dark .qz-search-input,
.dark .qz-search-input,
:root[data-theme="dark"] .qz-search-input {
  color: #f4f3ff !important;
}

body.dark .qz-btn-secondary,
html.dark .qz-btn-secondary,
.dark .qz-btn-secondary,
:root[data-theme="dark"] .qz-btn-secondary {
  background: #28214d !important;
  color: #f4f3ff !important;
  border-color: #3b326b !important;
}

body.dark .qz-wizard-close-btn,
html.dark .qz-wizard-close-btn,
.dark .qz-wizard-close-btn,
:root[data-theme="dark"] .qz-wizard-close-btn {
  background: #28214d !important;
  color: #f4f3ff !important;
}

/* MEDIA QUERY DARK MODE FALLBACK */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-planilla-wizard-modal {
    --background: #1d1838 !important;
  }
  body:not(.light) .qz-planilla-wizard-modal::part(content) {
    background: #1d1838 !important;
  }
  body:not(.light) .qz-wizard-container {
    background: #1d1838 !important;
    color: #f4f3ff !important;
  }
  body:not(.light) .qz-wizard-header,
  body:not(.light) .qz-wizard-footer {
    background: #1d1838 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  body:not(.light) .qz-stepper-bar {
    background: #16122d !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
}
</style>
