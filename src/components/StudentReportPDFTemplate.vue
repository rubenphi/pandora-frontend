<template>
  <div class="pdf-report-container">
    <div class="report-header">
      <h2>Reporte de Notas del Estudiante</h2>
      <div class="info-grid">
        <p><strong>Estudiante:</strong> {{ estudiante.lastName }} {{ estudiante.name }}</p>
        <p><strong>Curso:</strong> {{ cursoSelected?.name || 'N/A' }}</p>
        <p><strong>Área:</strong> {{ areaSelected?.name || 'N/A' }}</p>
        <p v-if="estudiante.document"><strong>Código:</strong> {{ estudiante.document }}</p>
      </div>
      
      <div class="grades-summary">
        <span class="grade-badge" v-if="estudiante.promedioRegular !== null">
          Promedio Regular: <strong :class="getGradeColorClass(estudiante.promedioRegular)">{{ estudiante.promedioRegular }}</strong>
        </span>
        <span class="grade-badge" v-if="estudiante.hasReinforcement">
          Promedio Refuerzo: <strong :class="getGradeColorClass(estudiante.promedioRefuerzo)">{{ estudiante.promedioRefuerzo }}</strong>
        </span>
        <span class="grade-badge" v-if="estudiante.hasRemedial">
          Promedio Nivelación: <strong :class="getGradeColorClass(estudiante.promedioNivelacion)">{{ estudiante.promedioNivelacion }}</strong>
        </span>
      </div>
    </div>

    <!-- Notas De Clase -->
    <div v-if="estudiante.dimensionesRegular?.length > 0" class="section">
      <h3>Notas De Clase</h3>
      <table class="report-table detailed">
        <thead>
          <tr>
            <th>Dimensión / Item</th>
            <th class="grade-col">Nota</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="dim in estudiante.dimensionesRegular" :key="'reg-'+dim.id">
            <tr class="dimension-row" v-if="dim.notas?.length > 0">
              <td><strong>{{ dim.name }}</strong></td>
              <td class="grade-col"><strong :class="getGradeColorClass(dim.promedio)">{{ dim.promedio }}</strong></td>
            </tr>
            <tr v-for="nota in dim.notas" :key="'reg-nota-'+nota.id" class="item-row">
              <td class="item-name">{{ nota.gradableItem?.title }}</td>
              <td class="grade-col" :class="getGradeColorClass(nota.grade)">
                {{ nota.grade !== null ? nota.grade : "Pendiente" }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Notas de Refuerzo -->
    <div v-if="estudiante.dimensionesReinforcement?.some(d => d.notas?.length > 0)" class="section">
      <h3>Notas de Refuerzo</h3>
      <table class="report-table detailed">
        <thead>
          <tr>
            <th>Dimensión / Item</th>
            <th class="grade-col">Nota</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="dim in estudiante.dimensionesReinforcement" :key="'reinf-'+dim.id">
            <tr class="dimension-row" v-if="dim.notas?.length > 0">
              <td><strong>{{ dim.name }}</strong></td>
              <td class="grade-col"><strong :class="getGradeColorClass(dim.promedio)">{{ dim.promedio }}</strong></td>
            </tr>
            <tr v-for="nota in dim.notas" :key="'reinf-nota-'+nota.id" class="item-row">
              <td class="item-name">{{ nota.gradableItem?.title }}</td>
              <td class="grade-col" :class="getGradeColorClass(nota.grade)">
                {{ nota.grade !== null ? nota.grade : "Pendiente" }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Notas de Nivelación -->
    <div v-if="estudiante.dimensionesRemedial?.some(d => d.notas?.length > 0)" class="section">
      <h3>Notas de Nivelación</h3>
      <table class="report-table detailed">
        <thead>
          <tr>
            <th>Dimensión / Item</th>
            <th class="grade-col">Nota</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="dim in estudiante.dimensionesRemedial" :key="'rem-'+dim.id">
            <tr class="dimension-row" v-if="dim.notas?.length > 0">
              <td><strong>{{ dim.name }}</strong></td>
              <td class="grade-col"><strong :class="getGradeColorClass(dim.promedio)">{{ dim.promedio }}</strong></td>
            </tr>
            <tr v-for="nota in dim.notas" :key="'rem-nota-'+nota.id" class="item-row">
              <td class="item-name">{{ nota.gradableItem?.title }}</td>
              <td class="grade-col" :class="getGradeColorClass(nota.grade)">
                {{ nota.grade !== null ? nota.grade : "Pendiente" }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "StudentReportPDFTemplate",
  props: {
    estudiante: {
      type: Object,
      required: true,
    },
    cursoSelected: {
      type: Object,
      default: () => ({}),
    },
    areaSelected: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
    getGradeColorClass(grade) {
      if (grade === null || grade === undefined || isNaN(grade)) return "";
      const val = parseFloat(grade);
      if (val < 3.0) return "red-grade";
      if (val < 4.0) return "orange-grade";
      if (val < 4.5) return "light-green-grade";
      return "dark-green-grade";
    },
  },
};
</script>

<style scoped>
.pdf-report-container {
  padding: 40px;
  background: white;
  color: black;
  font-family: Arial, sans-serif;
  width: 800px; /* Fixed width for consistent PDF rendering */
  min-height: 1000px;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #333;
  padding-bottom: 20px;
}

.report-header h2 {
  margin: 0 0 20px 0;
  color: #222;
}

.info-grid {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  text-align: left;
  margin-bottom: 15px;
}

.info-grid p {
  margin: 5px 15px;
  font-size: 1.1em;
}

.grades-summary {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
}

.grade-badge {
  background: #f0f0f0;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1.1em;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  background: #f8f9fa;
  padding: 10px;
  border-left: 4px solid #3880ff;
  margin: 0 0 15px 0;
}

.report-table {
  width: 80%;
  border-collapse: collapse;
  font-size: 1em;
}

.report-table th,
.report-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

.report-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.grade-col {
  text-align: center !important;
  width: 100px;
}

.dimension-row td {
  background-color: #fafafa;
}

.item-row td {
  font-size: 0.95em;
}

.item-name {
  padding-left: 30px !important;
  color: #444;
}

/* Colors matching global theme but printer friendly */
.red-grade { color: #d32f2f; font-weight: bold; }
.orange-grade { color: #f57c00; font-weight: bold; }
.light-green-grade { color: #388e3c; font-weight: bold; }
.dark-green-grade { color: #1b5e20; font-weight: bold; }
</style>
