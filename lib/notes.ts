// Mapping of note names (short and full) to semitone values (middle octave: 0-11)
export const NOTE_VALUES: Record<string, number> = {
  // Short form — case-sensitive: lowercase = komal, uppercase = shuddha
  S: 0, r: 1, R: 2, g: 3, G: 4, m: 5, M: 6,
  P: 7, d: 8, D: 9, n: 10, N: 11,
  // Full names — first-letter case distinguishes komal vs shuddha
  Sa: 0, sa: 0,
  re: 1,          // komal Re
  Re: 2,          // shuddha Re
  ga: 3,          // komal Ga
  Ga: 4,          // shuddha Ga
  ma: 5, Ma: 5,   // shuddha Ma (no komal Ma in Indian music)
  Pa: 7, pa: 7,
  dha: 8,         // komal Dha
  Dha: 9,         // shuddha Dha
  ni: 10,         // komal Ni
  Ni: 11,         // shuddha Ni
};

export const VALUE_TO_NOTE: Record<number, string> = {
  0: 'S', 1: 'r', 2: 'R', 3: 'g', 4: 'G', 5: 'm', 6: 'M',
  7: 'P', 8: 'd', 9: 'D', 10: 'n', 11: 'N',
};

export const NOTE_FULL_NAMES: Record<number, string> = {
  0: 'Sa',
  1: 'komal Re',
  2: 'Re',
  3: 'komal Ga',
  4: 'Ga',
  5: 'Ma',
  6: 'tivra Ma',
  7: 'Pa',
  8: 'komal Dha',
  9: 'Dha',
  10: 'komal Ni',
  11: 'Ni',
};

export interface ParsedNote {
  name: string;   // original input token
  value: number;  // semitone value (0 = middle Sa)
}

/**
 * Parse a single note token, e.g. "S", "Sa", "Sa'", "'r", "R''"
 * Leading apostrophes = lower octave (-12 each)
 * Trailing apostrophes = higher octave (+12 each)
 */
export function parseNote(token: string): ParsedNote | null {
  if (!token) return null;
  let noteStr = token;
  let leadingCount = 0;
  let trailingCount = 0;

  while (noteStr.startsWith("'")) {
    leadingCount++;
    noteStr = noteStr.slice(1);
  }
  while (noteStr.endsWith("'")) {
    trailingCount++;
    noteStr = noteStr.slice(0, -1);
  }

  if (!noteStr) return null;

  const baseValue = NOTE_VALUES[noteStr];
  if (baseValue === undefined) return null;

  return {
    name: token,
    value: baseValue + (trailingCount - leadingCount) * 12,
  };
}

/** Parse a space/comma-separated sequence of notes. Silently skips unrecognised tokens. */
export function parseNoteSequence(input: string): ParsedNote[] {
  return input
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .flatMap((t) => {
      const note = parseNote(t);
      return note ? [note] : [];
    });
}

/**
 * Convert a semitone value back to a note name with octave markers.
 * e.g. 0 → "S", 12 → "S'", -1 → "'N", 13 → "r'"
 */
export function valueToNoteName(value: number): string {
  const norm = ((value % 12) + 12) % 12;
  const baseName = VALUE_TO_NOTE[norm] ?? '?';
  const octave = Math.floor(value / 12);
  if (octave > 0) return baseName + "'".repeat(octave);
  if (octave < 0) return "'".repeat(-octave) + baseName;
  return baseName;
}

export interface CalcResult {
  value: number;
  noteName: string;
  fullName?: string;
}

/**
 * Evaluate a simple musical arithmetic expression.
 * Supported forms:
 *   <note>             → value of that note
 *   <note> + <note|n>  → sum
 *   <note> - <note|n>  → difference
 *   <note> * <n>       → scale
 *   <note> / <n>       → divide
 */
export function evaluateExpression(expr: string): CalcResult | null {
  const trimmed = expr.trim();
  if (!trimmed) return null;

  // Single note
  const singleNote = parseNote(trimmed);
  if (singleNote) {
    const norm = ((singleNote.value % 12) + 12) % 12;
    return {
      value: singleNote.value,
      noteName: valueToNoteName(singleNote.value),
      fullName: NOTE_FULL_NAMES[norm],
    };
  }

  // Pure number
  const numOnly = parseFloat(trimmed);
  if (!isNaN(numOnly) && String(numOnly) === trimmed) {
    const norm = ((Math.round(numOnly) % 12) + 12) % 12;
    return {
      value: numOnly,
      noteName: Number.isInteger(numOnly) ? valueToNoteName(numOnly) : String(numOnly),
      fullName: Number.isInteger(numOnly) ? NOTE_FULL_NAMES[norm] : undefined,
    };
  }

  // Binary expression: find first operator that is surrounded by spaces
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 3) {
    const opIdx = parts.findIndex((p, i) => i > 0 && ['+', '-', '*', '/'].includes(p));
    if (opIdx === -1) return null;

    const leftStr = parts.slice(0, opIdx).join(' ');
    const op = parts[opIdx];
    const rightStr = parts.slice(opIdx + 1).join(' ');

    const leftNote = parseNote(leftStr);
    const leftNum = leftNote ? leftNote.value : parseFloat(leftStr);
    if (isNaN(leftNum)) return null;

    const rightNote = parseNote(rightStr);
    const rightNum = rightNote ? rightNote.value : parseFloat(rightStr);
    if (isNaN(rightNum)) return null;

    let result: number;
    switch (op) {
      case '+': result = leftNum + rightNum; break;
      case '-': result = leftNum - rightNum; break;
      case '*': result = leftNum * rightNum; break;
      case '/':
        if (rightNum === 0) return null;
        result = leftNum / rightNum;
        break;
      default: return null;
    }

    const norm = ((Math.round(result) % 12) + 12) % 12;
    return {
      value: result,
      noteName: Number.isInteger(result) ? valueToNoteName(result) : result.toFixed(3),
      fullName: Number.isInteger(result) ? NOTE_FULL_NAMES[norm] : undefined,
    };
  }

  return null;
}
