/**
 * Adaptador de Modalidad de Respuesta para Cuestionarios
 * Permite que un cuestionario conviva entre:
 * - 'digital': ilimitadas opciones (para dispositivos / tablets)
 * - 'omr': máximo 8 opciones (para hojas de respuesta físicas de burbujas)
 * - 'cards': exactamente 4 opciones (para tarjetas rotativas A, B, C, D frente a cámara)
 *
 * Principio: NO DESTRUCTIVO. Nunca altera ni borra registros en la base de datos.
 */

export const QUIZ_MODES = {
  DIGITAL: "digital",
  OMR: "omr",
  CARDS: "cards",
};

/**
 * Obtiene las opciones adaptadas para la modalidad seleccionada.
 * Garantiza que la opción correcta siempre esté incluida y que las opciones
 * conserven su orden relativo original, re-etiquetadas secuencialmente (A, B, C, D...).
 *
 * @param {Array} options Lista completa original de opciones
 * @param {string} mode 'digital' | 'omr' | 'cards'
 * @returns {Array} Opciones adaptadas con nuevo 'identifier' y metadato 'originalIdentifier'
 */
export function getEffectiveOptions(options = [], mode = QUIZ_MODES.DIGITAL) {
  if (!Array.isArray(options) || options.length === 0) return [];

  let maxOptions = Infinity;
  if (mode === QUIZ_MODES.CARDS) maxOptions = 4;
  else if (mode === QUIZ_MODES.OMR) maxOptions = 8;

  // Si caben todas dentro del límite, asignar identificador estándar secuencial
  if (options.length <= maxOptions) {
    return options.map((opt, idx) => ({
      ...opt,
      identifier: String.fromCharCode(65 + idx),
      originalIndex: idx,
    }));
  }

  // Localizar la opción correcta
  const correctIdx = options.findIndex((opt) => opt.correct);
  const correctOption = correctIdx !== -1 ? options[correctIdx] : options[0];

  // Distractores ordenados por su índice original
  const distractors = options
    .map((opt, idx) => ({ ...opt, originalIndex: idx }))
    .filter((opt) => !opt.correct);

  // Seleccionar los primeros (maxOptions - 1) distractores
  const chosenDistractors = distractors.slice(0, maxOptions - 1);

  // Unir la correcta con los distractores y ordenar por su índice original
  const combined = [
    ...chosenDistractors,
    { ...correctOption, originalIndex: correctIdx !== -1 ? correctIdx : 0 },
  ].sort((a, b) => a.originalIndex - b.originalIndex);

  // Re-etiquetar a letras limpias continuas (A, B, C, D...)
  return combined.map((opt, idx) => ({
    ...opt,
    identifier: String.fromCharCode(65 + idx),
    originalIdentifier: String.fromCharCode(65 + opt.originalIndex),
  }));
}

/**
 * Cantidad de distractores ocultos en la modalidad activa.
 */
export function getHiddenOptionsCount(options = [], mode = QUIZ_MODES.DIGITAL) {
  if (!Array.isArray(options) || options.length === 0) return 0;
  let maxOptions = Infinity;
  if (mode === QUIZ_MODES.CARDS) maxOptions = 4;
  else if (mode === QUIZ_MODES.OMR) maxOptions = 8;
  return Math.max(0, options.length - maxOptions);
}
