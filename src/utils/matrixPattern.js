export const GRID_SIZE = 6;

const INNER_SIZE = GRID_SIZE - 2;
const INNER_BITS = INNER_SIZE * INNER_SIZE;
const FULL_MASK = (1 << INNER_BITS) - 1;
const CORNER_OPTIONS = new Map([
  ["0,0", 0],
  [`${GRID_SIZE - 1},0`, 1],
  [`${GRID_SIZE - 1},${GRID_SIZE - 1}`, 2],
  [`0,${GRID_SIZE - 1}`, 3],
]);

function hasRotationalSymmetry(mask) {
  return (
    rotateBits(mask, 1) === mask ||
    rotateBits(mask, 2) === mask ||
    rotateBits(mask, 3) === mask
  );
}

const validMasks = [];
const idByMask = new Int32Array(FULL_MASK + 1);

for (let mask = 0; mask <= FULL_MASK; mask += 1) {
  if (hasRotationalSymmetry(mask)) continue;
  validMasks.push(mask);
  idByMask[mask] = validMasks.length;
}

export const MAX_ID = validMasks.length;

function assertMask(mask) {
  if (!Number.isInteger(mask) || mask < 0 || mask > FULL_MASK) {
    throw new RangeError(`mask must be an integer between 0 and ${FULL_MASK}`);
  }
}

function assertSquareGrid(grid) {
  if (!Array.isArray(grid) || grid.length === 0) {
    throw new TypeError("grid must be a non-empty square matrix");
  }

  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== grid.length) {
      throw new TypeError("grid must be a square matrix");
    }
  }
}

export function rotateBits(mask, turns = 1) {
  assertMask(mask);
  if (!Number.isInteger(turns)) {
    throw new TypeError("turns must be an integer");
  }

  const count = ((turns % 4) + 4) % 4;
  let rotated = 0;

  for (let bit = 0; bit < INNER_BITS; bit += 1) {
    if ((mask & (1 << bit)) === 0) continue;

    let row = Math.floor(bit / INNER_SIZE);
    let col = bit % INNER_SIZE;

    for (let turn = 0; turn < count; turn += 1) {
      const nextRow = col;
      col = INNER_SIZE - 1 - row;
      row = nextRow;
    }

    rotated |= 1 << (row * INNER_SIZE + col);
  }

  return rotated;
}

export function patternForStudent(studentId) {
  if (!Number.isInteger(studentId)) {
    throw new TypeError("studentId must be an integer");
  }
  if (studentId < 1 || studentId > MAX_ID) {
    throw new RangeError(`studentId must be between 1 and ${MAX_ID}`);
  }

  return validMasks[studentId - 1];
}

export function idFromPattern(mask) {
  if (!Number.isInteger(mask) || mask < 0 || mask > FULL_MASK) return null;
  return idByMask[mask] || null;
}

export function rotateGridCw(grid) {
  assertSquareGrid(grid);
  const size = grid.length;

  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => grid[size - 1 - col][row]),
  );
}

export function rotateGridCcw(grid) {
  assertSquareGrid(grid);
  const size = grid.length;

  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => grid[col][size - 1 - row]),
  );
}

function inspectGrid(grid) {
  if (!Array.isArray(grid) || grid.length !== GRID_SIZE) {
    return { ok: false, notch: null, optionIndex: null };
  }

  let notch = null;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    if (!Array.isArray(grid[row]) || grid[row].length !== GRID_SIZE) {
      return { ok: false, notch: null, optionIndex: null };
    }

    for (let col = 0; col < GRID_SIZE; col += 1) {
      const cell = grid[row][col];
      if (cell !== 0 && cell !== 1) {
        return { ok: false, notch: null, optionIndex: null };
      }

      const isFrame =
        row === 0 || row === GRID_SIZE - 1 || col === 0 || col === GRID_SIZE - 1;

      if (isFrame && cell === 0) {
        if (notch !== null) {
          return { ok: false, notch: null, optionIndex: null };
        }
        notch = { row, col };
      }
    }
  }

  if (notch === null) {
    return { ok: false, notch: null, optionIndex: null };
  }

  const optionIndex = CORNER_OPTIONS.get(`${notch.row},${notch.col}`);
  if (optionIndex === undefined) {
    return { ok: false, notch: null, optionIndex: null };
  }

  return { ok: true, notch, optionIndex };
}

export function validateFrame(grid) {
  return inspectGrid(grid);
}

function maskFromCanonicalGrid(grid) {
  let mask = 0;

  for (let row = 0; row < INNER_SIZE; row += 1) {
    for (let col = 0; col < INNER_SIZE; col += 1) {
      const bit = row * INNER_SIZE + col;
      if (grid[row + 1][col + 1] === 1) mask |= 1 << bit;
    }
  }

  return mask;
}

export function markGridForId(studentId) {
  const mask = patternForStudent(studentId);
  const grid = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0),
  );

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const isFrame =
        row === 0 || row === GRID_SIZE - 1 || col === 0 || col === GRID_SIZE - 1;
      grid[row][col] = isFrame ? 1 : 0;
    }
  }

  grid[0][0] = 0;

  for (let bit = 0; bit < INNER_BITS; bit += 1) {
    const row = Math.floor(bit / INNER_SIZE) + 1;
    const col = (bit % INNER_SIZE) + 1;
    grid[row][col] = (mask >>> bit) & 1;
  }

  return grid;
}

export function decodeMarkGrid(grid) {
  const frame = inspectGrid(grid);
  if (!frame.ok) {
    return { valid: false, mask: null, optionIndex: null };
  }

  let canonicalGrid = grid;
  for (let turn = 0; turn < frame.optionIndex; turn += 1) {
    canonicalGrid = rotateGridCw(canonicalGrid);
  }

  const mask = maskFromCanonicalGrid(canonicalGrid);
  if (idFromPattern(mask) === null) {
    return { valid: false, mask: null, optionIndex: null };
  }

  return {
    valid: true,
    mask,
    optionIndex: frame.optionIndex,
  };
}
