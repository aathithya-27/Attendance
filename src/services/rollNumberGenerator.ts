/**
 * Roll Number Generation & Validation Service
 */

export interface ParsedRollNumber {
  raw: string;
  prefix: string;
  numericPartStr: string;
  numericValue: number;
  isPureNumber: boolean;
  digitLength: number;
}

export interface RollGenerationResult {
  success: boolean;
  rollNumbers: string[];
  total: number;
  errorMessage?: string;
  isPureNumericSeries: boolean;
}

/**
 * Checks if a string is composed entirely of numeric digits.
 */
export function isPureNumber(rollNumber: string): boolean {
  return /^\d+$/.test(rollNumber.trim());
}

/**
 * Parses a roll number into prefix and sequential numeric suffix.
 * Examples:
 * - "26MBA061" -> prefix "26MBA", suffix "061" (value 61, width 3)
 * - "MBA001" -> prefix "MBA", suffix "001" (value 1, width 3)
 * - "1" -> prefix "", suffix "1" (value 1, width 1)
 * - "01" -> prefix "", suffix "01" (value 1, width 2)
 */
export function parseRollNumber(input: string): ParsedRollNumber | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Match: optional non-digit or prefix part, followed by digits at the end
  const match = trimmed.match(/^(.*?)(\d+)$/);
  if (!match) {
    return null;
  }

  const prefix = match[1];
  const numericPartStr = match[2];
  const numericValue = parseInt(numericPartStr, 10);

  return {
    raw: trimmed,
    prefix,
    numericPartStr,
    numericValue,
    isPureNumber: prefix === '',
    digitLength: numericPartStr.length,
  };
}

/**
 * Generates sequential roll numbers between start and end.
 * Handles pure numbers, zero padding, and alphanumeric roll numbers with prefix matching.
 */
export function generateRollNumbers(
  fromRoll: string,
  toRoll: string,
  maxLimit = 500
): RollGenerationResult {
  const fromClean = fromRoll?.trim();
  const toClean = toRoll?.trim();

  if (!fromClean) {
    return {
      success: false,
      rollNumbers: [],
      total: 0,
      errorMessage: 'Please enter a starting roll number.',
      isPureNumericSeries: false,
    };
  }

  if (!toClean) {
    return {
      success: false,
      rollNumbers: [],
      total: 0,
      errorMessage: 'Please enter an ending roll number.',
      isPureNumericSeries: false,
    };
  }

  const startParsed = parseRollNumber(fromClean);
  if (!startParsed) {
    return {
      success: false,
      rollNumbers: [],
      total: 0,
      errorMessage: 'Starting roll number must end with a numeric sequence (e.g., 26MBA061 or 1).',
      isPureNumericSeries: false,
    };
  }

  const endParsed = parseRollNumber(toClean);
  if (!endParsed) {
    return {
      success: false,
      rollNumbers: [],
      total: 0,
      errorMessage: 'Ending roll number must end with a numeric sequence (e.g., 26MBA100 or 60).',
      isPureNumericSeries: false,
    };
  }

  // Check prefix compatibility
  if (startParsed.prefix.toUpperCase() !== endParsed.prefix.toUpperCase()) {
    return {
      success: false,
      rollNumbers: [],
      total: 0,
      errorMessage: `Starting and ending roll numbers must have the same prefix ("${startParsed.prefix}" vs "${endParsed.prefix}").`,
      isPureNumericSeries: false,
    };
  }

  if (startParsed.numericValue > endParsed.numericValue) {
    return {
      success: false,
      rollNumbers: [],
      total: 0,
      errorMessage: `Starting roll number (${startParsed.raw}) cannot be greater than ending roll number (${endParsed.raw}).`,
      isPureNumericSeries: false,
    };
  }

  const total = endParsed.numericValue - startParsed.numericValue + 1;
  if (total > maxLimit) {
    return {
      success: false,
      rollNumbers: [],
      total: 0,
      errorMessage: `Generated range contains ${total} students, which exceeds the maximum limit of ${maxLimit}. Please check your roll numbers.`,
      isPureNumericSeries: false,
    };
  }

  const prefix = startParsed.prefix;
  const isPure = prefix === '';
  // Determine minimum width of number for zero-padding
  const padWidth = Math.max(startParsed.digitLength, endParsed.digitLength);

  const rollNumbers: string[] = [];
  for (let val = startParsed.numericValue; val <= endParsed.numericValue; val++) {
    const padded = String(val).padStart(padWidth, '0');
    rollNumbers.push(`${prefix}${padded}`);
  }

  return {
    success: true,
    rollNumbers,
    total,
    isPureNumericSeries: isPure,
  };
}

/**
 * Calculates default grid rows and columns for a given student count.
 */
export function calculateDefaultGrid(studentCount: number): { rows: number; columns: number } {
  if (studentCount <= 0) return { rows: 4, columns: 10 };
  
  // Prefer standard classroom column widths (e.g., 10, 8, 6, 5)
  let cols = 10;
  if (studentCount <= 20) cols = 5;
  else if (studentCount <= 36) cols = 6;
  else if (studentCount <= 48) cols = 8;
  else cols = 10;

  const rows = Math.ceil(studentCount / cols);
  return { rows, columns: cols };
}
