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
