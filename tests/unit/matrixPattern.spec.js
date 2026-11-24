import {
  MAX_ID,
  patternForStudent,
  idFromPattern,
  markGridForId,
  decodeMarkGrid,
  validateFrame,
  rotateGridCw,
  rotateGridCcw,
  rotateBits,
  GRID_SIZE,
} from "@/utils/matrixPattern";

describe("matrixPattern", () => {
  it("exposes the expected capacity (65280 valid non-symmetric patterns)", () => {
    expect(MAX_ID).toBe(65280);
  });

  it("rejects ids out of range", () => {
    expect(() => patternForStudent(0)).toThrow();
    expect(() => patternForStudent(MAX_ID + 1)).toThrow();
    expect(() => patternForStudent("abc")).toThrow();
    expect(() => patternForStudent(1.5)).toThrow();
  });

  it("produces patterns without rotational symmetry", () => {
    const ids = [1, 2, 17, 42, 100, 999, 5000, MAX_ID];
    for (const id of ids) {
      const mask = patternForStudent(id);
      expect(mask).toBeGreaterThanOrEqual(0);
      expect(mask).toBeLessThan(1 << 16);
      for (let k = 1; k < 4; k++) {
        expect(rotateBits(mask, k)).not.toBe(mask);
      }
    }
  });

  it("is injective for a contiguous range of ids", () => {
    const seen = new Set();
    for (let id = 1; id <= 2000; id++) {
      const mask = patternForStudent(id);
      expect(seen.has(mask)).toBe(false);
      seen.add(mask);
    }
  });

  it("builds the 6x6 marker with one notch and the framed inner pattern", () => {
    const id = 42;
    const grid = markGridForId(id);
    expect(grid).toHaveLength(GRID_SIZE);
    grid.forEach((row) => expect(row).toHaveLength(GRID_SIZE));

    // ring all black except exactly one notch
    let notchCount = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const isRing =
          r === 0 || r === GRID_SIZE - 1 || c === 0 || c === GRID_SIZE - 1;
        if (isRing) {
          if (grid[r][c] === 0) notchCount++;
          else expect(grid[r][c]).toBe(1);
        } else {
          expect(grid[r][c]).toBeGreaterThanOrEqual(0);
          expect(grid[r][c]).toBeLessThanOrEqual(1);
        }
      }
    }
    expect(notchCount).toBe(1);
    expect(validateFrame(grid).ok).toBe(true);
  });

  it("decodes the same student across the 4 orientations with distinct options", () => {
    const id = 42;
    const grid = markGridForId(id);
    // Canonical: muesca en esquina TL (0,0) → opción A
    expect(grid[0][0]).toBe(0); // notch at TL
    const decoded0 = decodeMarkGrid(grid);
    expect(decoded0.valid).toBe(true);
    expect(decoded0.mask).toBe(patternForStudent(id));
    expect(decoded0.optionIndex).toBe(0);

    // B: rotar hoja CCW → muesca pasa a esquina BL (5,0)
    const sheetB = rotateGridCcw(grid);
    expect(sheetB[GRID_SIZE - 1][0]).toBe(0); // notch at BL
    const decodedB = decodeMarkGrid(sheetB);
    expect(decodedB.valid).toBe(true);
    expect(decodedB.mask).toBe(patternForStudent(id));
    expect(decodedB.optionIndex).toBe(1);

    // C: rotar hoja 180° → muesca pasa a esquina BR (5,5)
    const sheetC = rotateGridCw(rotateGridCw(grid));
    expect(sheetC[GRID_SIZE - 1][GRID_SIZE - 1]).toBe(0); // notch at BR
    const decodedC = decodeMarkGrid(sheetC);
    expect(decodedC.valid).toBe(true);
    expect(decodedC.mask).toBe(patternForStudent(id));
    expect(decodedC.optionIndex).toBe(2);

    // D: rotar hoja CW → muesca pasa a esquina TR (0,5)
    const sheetD = rotateGridCw(grid);
    expect(sheetD[0][GRID_SIZE - 1]).toBe(0); // notch at TR
    const decodedD = decodeMarkGrid(sheetD);
    expect(decodedD.valid).toBe(true);
    expect(decodedD.mask).toBe(patternForStudent(id));
    expect(decodedD.optionIndex).toBe(3);
  });

  it("rejects grids without a notch", () => {
    const grid = markGridForId(42).map((row) => {
      return row.map((cell) => (cell === 1 ? 1 : 1));
    });
    expect(decodeMarkGrid(grid).valid).toBe(false);
    expect(validateFrame(grid).ok).toBe(false);
  });

  it("ccw rotation inverts cw rotation", () => {
    const grid = markGridForId(1);
    const restored = rotateGridCcw(rotateGridCw(grid));
    expect(restored).toEqual(grid);
    const restored2 = rotateGridCcw(rotateGridCcw(rotateGridCw(rotateGridCw(grid))));
    expect(restored2).toEqual(grid);
  });

  it("different students produce different markers", () => {
    const a = JSON.stringify(markGridForId(1));
    const b = JSON.stringify(markGridForId(2));
    expect(a).not.toBe(b);
  });

  it("recovers student id from pattern with idFromPattern", () => {
    const testIds = [1, 2, 42, 100, 999, 5000, MAX_ID];
    for (const id of testIds) {
      const mask = patternForStudent(id);
      expect(idFromPattern(mask)).toBe(id);
    }
    expect(idFromPattern(-1)).toBeNull();
  });

  it("decodes the supplied marker as student 157 and option A", () => {
    const grid = [
      [0, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1, 1],
      [1, 1, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1],
    ];
    const decoded = decodeMarkGrid(grid);

    expect(decoded.valid).toBe(true);
    expect(idFromPattern(decoded.mask)).toBe(157);
    expect(decoded.optionIndex).toBe(0);
  });

  it("tolerates at most 1 noisy non-corner frame cell while requiring an unambiguous corner notch", () => {
    const id = 42;
    const grid = markGridForId(id);
    // Noise on non-corner edge cell (row 0, col 3)
    grid[0][3] = 0;
    const decoded1 = decodeMarkGrid(grid);
    expect(decoded1.valid).toBe(true);
    expect(idFromPattern(decoded1.mask)).toBe(id);

    // Two noisy edge cells should be rejected for safety
    grid[0][4] = 0;
    const decoded2 = decodeMarkGrid(grid);
    expect(decoded2.valid).toBe(false);
  });
});
