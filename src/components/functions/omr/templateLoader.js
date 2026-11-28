import templates from "../../../../resources/omr/omr_templates.json";

export async function fetchTemplates() {
  try {
    return Promise.resolve(templates);
  } catch (e) {
    console.error(
      "No se pudieron cargar las plantillas desde resources/omr/omr_templates.json",
      e
    );
    return { circleTemplate: [] };
  }
}

export async function fetchSurveyTemplate(name) {
  try {
    const survey = templates.surveys && templates.surveys[name];
    if (!survey) {
      console.warn(`Plantilla de encuesta "${name}" no encontrada`);
      return { circleTemplate: [] };
    }
    return Promise.resolve(survey);
  } catch (e) {
    console.error(
      `Error cargando plantilla de encuesta "${name}"`,
      e
    );
    return { circleTemplate: [] };
  }
}

/**
 * Normaliza cualquier plantilla de encuesta (personalizada, legada o del sistema)
 * asegurando una estructura uniforme con secciones, opciones, preguntas y coordenadas OMR (circles).
 */
export function normalizeSurveyTemplate(rawTemplate) {
  if (!rawTemplate) return null;

  const tpl = JSON.parse(JSON.stringify(rawTemplate));
  const slug = tpl.slug || "";
  const name = tpl.name || "";

  // 1. Extraer secciones independientemente de si están anidadas o directas
  let rawSections = null;
  if (Array.isArray(tpl.questionsConfig?.sections)) {
    rawSections = tpl.questionsConfig.sections;
  } else if (Array.isArray(tpl.questionsConfig?.questionsConfig?.sections)) {
    rawSections = tpl.questionsConfig.questionsConfig.sections;
  } else if (Array.isArray(tpl.questionsConfig?.circleTemplate)) {
    rawSections = tpl.questionsConfig.circleTemplate;
  }

  // 2. Identificar si corresponde a una encuesta conocida del sistema para respaldo de coordenadas OMR
  const isParent =
    slug === "parent-survey" ||
    slug === "parentSurvey" ||
    name.toLowerCase().includes("padre");
  const isStudent =
    slug === "student-survey" ||
    slug === "studentSurvey" ||
    name.toLowerCase().includes("estudiante");

  let fallbackCircleTemplate = null;
  if (isParent && templates.surveys?.parentSurvey?.circleTemplate) {
    fallbackCircleTemplate = templates.surveys.parentSurvey.circleTemplate;
  } else if (isStudent && templates.surveys?.studentSurvey?.circleTemplate) {
    fallbackCircleTemplate = templates.surveys.studentSurvey.circleTemplate;
  }

  // 3. Normalizar cada sección a la estructura estándar esperada por el lector y visor de resultados
  let normalizedSections = [];
  if (Array.isArray(rawSections) && rawSections.length > 0) {
    normalizedSections = rawSections.map((s, idx) => {
      const secName = s.name || s.id || `seccion${idx + 1}`;
      const secTitle = s.title || s.name || `Sección ${idx + 1}`;
      let secType =
        s.type === "likert" || s.type === "single_choice"
          ? "question"
          : s.type || "question";
      let secRows = Number(s.rows || s.count || 1);
      let secCols = Number(
        s.cols || (s.options ? s.options.length : s.labels ? s.labels.length : 4)
      );
      let secLabels = s.labels || s.options || [];

      // Si la sección no tiene coordenadas 'circles', buscar en la plantilla base del sistema
      let circles = s.circles;
      let radius = s.radius || 7;
      let fbSec = null;
      if (fallbackCircleTemplate) {
        fbSec =
          fallbackCircleTemplate.find((fb) => fb.name === secName) ||
          fallbackCircleTemplate[idx];
        if (fbSec) {
          if (!circles) circles = fbSec.circles;
          if (fbSec.radius) radius = fbSec.radius;
          // Si es multiselección, forzar la geometría de la cuadrícula física OMR
          if (secType === "multiselect" || fbSec.type === "multiselect") {
            secType = "multiselect";
            secRows = Number(fbSec.rows || 4);
            secCols = Number(fbSec.cols || 3);
            if (Array.isArray(fbSec.labels)) {
              secLabels = fbSec.labels;
            }
          }
        }
      }

      // Enriquecer enunciados oficiales si no estaban provistos
      let questionPrompts = s.questionPrompts || [];
      if ((!questionPrompts || questionPrompts.length === 0) && isStudent) {
        if (secName === "seccion1") {
          questionPrompts = [
            "El profesor entregó el programa de la asignatura al inicio del curso",
          ];
        } else if (secName === "seccion2") {
          questionPrompts = [
            "Presenta los temas con mucha claridad",
            "Comunica claramente los objetivos de cada clase",
            "Responde las dudas de los estudiantes en clase",
            "Expresa expectativas positivas de los estudiantes",
            "Explica los criterios de evaluación de la materia",
            "Evalúa adecuadamente la materia",
            "Programa y coordina salidas pedagógicas como complemento a la materia",
            "Atiende dudas académicas de los estudiantes fuera de clase",
            "Realiza actividades de recuperación y refuerzo con estudiantes que lo necesitan",
            "Indica normas de comportamiento en clase claras para todos",
            "Es respetado por todos los estudiantes del curso",
            "Realiza clases activas y dinámicas",
            "Informa a padres de familia y acudientes sobre el desempeño de los estudiantes",
            "Llega a clase y sus orientaciones son seguidas por todos los estudiantes",
          ];
        } else if (secName === "seccion3") {
          questionPrompts = [
            "Son interesantes porque tratan temas llamativos",
            "Empiezan y terminan a la hora indicada",
            "Desarrollan los temas propuestos en el tiempo indicado",
            "Tratan temas importantes para el barrio, la zona o la comunidad",
          ];
        }
      } else if ((!questionPrompts || questionPrompts.length === 0) && isParent) {
        if (secName === "seccion1") {
          questionPrompts = [
            "Trata con respeto a su hijo y le expresa reglas claras de comportamiento",
            "Comunica claramente los objetivos de cada clase",
            "Responde las dudas que usted le ha planteado cuando lo ha requerido.",
            "Expresa expectativas positivas de los estudiantes",
            "Explica los criterios de evaluación de la materia a través del acuerdo pedagógico",
            "Evalúa la asignatura empleando estrategias innovadoras y dinámicas.",
            "Programa y coordina salidas pedagógicas como complemento a la materia",
            "Atiende dudas académicas de los estudiantes fuera de clase",
            "Realiza plan de mejoramiento para los estudiantes y lo informa a Ud. de ellas.",
            "Indica normas de comportamiento en clase claras para todos los estudiantes.",
            "Es respetado por todos los estudiantes y padres de familia del curso",
            "Realiza clases activas y dinámicas",
            "Informa a padres de familia y acudientes sobre el desempeño de los estudiantes",
            "Ud. lo cataloga como puntual, organizado y comprometido con la comunidad.",
          ];
        } else if (secName === "seccion2") {
          questionPrompts = [
            "Su hijo dice que sus clases son interesantes y le dejan enseñanzas en valores",
            "Empiezan y terminan a la hora indicada",
            "Desarrollan los temas propuestos en el tiempo indicado",
            "Tratan temas importantes para el barrio, la zona o la comunidad",
          ];
        }
      }

      return {
        ...s,
        name: secName,
        title: secTitle,
        type: secType,
        rows: secRows,
        cols: secCols,
        labels: secLabels,
        options: s.options || (Array.isArray(secLabels) ? secLabels.flat().map((l) => String(l).trim()).filter(Boolean) : []),
        circles: circles || null,
        radius: radius,
        chartType: s.chartType || (secType === "multiselect" ? "radar" : secRows === 1 ? "pie" : "stacked_bar"),
        rowPrefix: s.rowPrefix || (secName === "seccion2" && isStudent ? "P" : s.rowPrefix || ""),
        questionPrompts: questionPrompts,
      };
    });
  } else if (fallbackCircleTemplate) {
    normalizedSections = fallbackCircleTemplate.map((fb, idx) => ({
      name: fb.name || `seccion${idx + 1}`,
      title:
        fb.name === "seccion1"
          ? (isStudent ? "1. El profesor entregó el programa de la asignatura al inicio del curso" : "Preguntas 1 a 14")
          : fb.name === "seccion2"
          ? (isStudent ? "EL PROFESOR" : "Preguntas 15 a 18")
          : fb.name === "seccion3"
          ? (isStudent ? "LAS CLASES" : `Sección ${idx + 1}`)
          : fb.name === "seccion4"
          ? (isStudent ? "20. Recursos de clase" : `Sección ${idx + 1}`)
          : `Sección ${idx + 1}`,
      type: fb.type || "question",
      rows: fb.rows || 1,
      cols: fb.cols || (fb.labels ? fb.labels.length : 4),
      labels: fb.labels || (isStudent && fb.name === "seccion1" ? ["Sí", "No"] : ["Nunca", "Algunas veces", "Casi siempre", "Siempre"]),
      circles: fb.circles,
      radius: fb.radius || 7,
      rowPrefix: isStudent ? (fb.name === "seccion1" ? "" : fb.name === "seccion4" ? "" : "P") : "P",
      rowStart: isStudent ? (fb.name === "seccion2" ? 2 : fb.name === "seccion3" ? 16 : 1) : (fb.name === "seccion2" ? 15 : 1),
      chartType: fb.chartType || (fb.type === "multiselect" ? "radar" : (fb.rows === 1 || fb.name === "seccion1") ? "pie" : "stacked_bar"),
      questionPrompts: [],
    }));
  }

  // 4. Asegurar que questionsConfig contenga las secciones limpias y listas para OMR
  tpl.questionsConfig = {
    ...(tpl.questionsConfig || {}),
    template_name: tpl.name || "Plantilla OMR",
    sections: normalizedSections,
  };

  return tpl;
}

