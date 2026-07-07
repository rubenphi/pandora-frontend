async function loadJSON() {
  const response = await fetch("omr_templates.json");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function fetchTemplates() {
  try {
    return await loadJSON();
  } catch (e) {
    console.error(
      "No se pudieron cargar las plantillas desde omr_templates.json",
      e
    );
    return { circleTemplate: [] };
  }
}

export async function fetchSurveyTemplate(name) {
  try {
    const templates = await loadJSON();
    const survey = templates.surveys && templates.surveys[name];
    if (!survey) {
      console.warn(`Plantilla de encuesta "${name}" no encontrada`);
      return { circleTemplate: [] };
    }
    return survey;
  } catch (e) {
    console.error(
      `Error cargando plantilla de encuesta "${name}"`,
      e
    );
    return { circleTemplate: [] };
  }
}
