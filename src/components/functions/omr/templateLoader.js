import templates from "../../../../resources/omr/omr_templates.json";

export async function fetchTemplates() {
  try {
    // The import statement handles the loading of the JSON file.
    // We can return it directly, wrapped in a resolved promise to maintain the async signature.
    return Promise.resolve(templates);
  } catch (e) {
    console.error(
      "No se pudieron cargar las plantillas desde resources/omr/omr_templates.json",
      e
    );
    return { circleTemplate: [] }; // Fallback to empty template
  }
}
