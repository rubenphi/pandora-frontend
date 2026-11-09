export const SHEET_IMAGE_WIDTH = 3313;
export const SHEET_IMAGE_HEIGHT = 4919;

export const NUMBERS_PER_COLUMN = 10;
export const COLUMN_COUNT = 2;
export const MAX_QUESTIONS_PER_SHEET = NUMBERS_PER_COLUMN * COLUMN_COUNT;

// ------------------------------------------------------------------
// POSICIONAMIENTO MANUAL DE LOS NÚMEROS
// ------------------------------------------------------------------
// Solo tienes que modificar estas dos coordenadas para mover TODA la
// numeración de la hoja. Son el punto central inferior del primer dígito
// de cada columna: X = centro horizontal, Y = base del número.
// Las demás posiciones se calculan con la distancia constante entre
// dígitos (DIGIT_ROW_STEP hacia abajo, y el salto entre columnas).
// ------------------------------------------------------------------

export const FIRST_DIGIT_LEFT = { x: 370, y: 3030 };
export const FIRST_DIGIT_RIGHT = { x: 1710, y: 3030 };

// Distancia vertical entre dígitos dentro de una misma columna.
export const DIGIT_ROW_STEP = 144;

const NUMBER_BOX_WIDTH = 260;
const NUMBER_FONT_SIZE = 100;
const NUMBER_BOX_HEIGHT = NUMBER_FONT_SIZE;

const toPercent = (value) => (value / SHEET_IMAGE_WIDTH) * 100;
const toVerticalPercent = (value) => (value / SHEET_IMAGE_HEIGHT) * 100;

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function normalizeQuestionsPerSheet(value) {
  return clamp(
    parseInt(value, 10) || MAX_QUESTIONS_PER_SHEET,
    1,
    MAX_QUESTIONS_PER_SHEET,
  );
}

export function normalizeTotalQuestions(value) {
  const parsed = parseInt(value, 10);
  return clamp(Number.isNaN(parsed) ? 1 : parsed, 1, 9999);
}

export function buildSheets(totalQuestions, questionsPerSheet) {
  const total = normalizeTotalQuestions(totalQuestions);
  const perSheet = normalizeQuestionsPerSheet(questionsPerSheet);
  const sheetCount = Math.ceil(total / perSheet);

  return Array.from({ length: sheetCount }, (_, i) => {
    const start = i * perSheet + 1;
    const end = Math.min((i + 1) * perSheet, total);
    return { index: i + 1, start, end, count: end - start + 1 };
  });
}

// Ancla del primer dígito de la columna indicada (0 = izquierda, 1 = derecha).
function firstDigitOfColumn(column) {
  return column === 0 ? FIRST_DIGIT_LEFT : FIRST_DIGIT_RIGHT;
}

export function questionNumberLayout(index) {
  const column = Math.floor(index / NUMBERS_PER_COLUMN);
  const row = index % NUMBERS_PER_COLUMN;
  const anchor = firstDigitOfColumn(column);
  const centerX = anchor.x;
  const bottomY = anchor.y + row * DIGIT_ROW_STEP;

  return {
    left: toPercent(centerX - NUMBER_BOX_WIDTH / 2),
    top: toVerticalPercent(bottomY - NUMBER_BOX_HEIGHT),
    width: toPercent(NUMBER_BOX_WIDTH),
    height: toVerticalPercent(NUMBER_BOX_HEIGHT),
    fontSize: NUMBER_FONT_SIZE,
  };
}

export function questionNumbers(startNumber, count) {
  return Array.from({ length: count }, (_, i) => ({
    value: startNumber + i,
    ...questionNumberLayout(i),
  }));
}
