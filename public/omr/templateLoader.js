export async function fetchTemplates() {
  try {
    const response = await fetch("omr_templates.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (e) {
    console.error(
      "No se pudieron cargar las plantillas desde omr_templates.json",
      e
    );
    return { circleTemplate: [] }; // Fallback to empty template
  }
}
