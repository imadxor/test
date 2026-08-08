export type PhoneStatus = 'ok' | 'invalid' | 'duplicate';

export interface PhoneValidationResult {
  raw: string;
  normalized: string | null;
  status: PhoneStatus;
}

function strip(raw: string): string {
  let s = raw.replace(/[\s\-.()]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  return s;
}

/**
 * Normalizes a Moroccan mobile number to E.164 (e.g. "+212612345678").
 * Returns null if the value doesn't match any recognized Moroccan mobile pattern.
 */
export function normalize(raw: string): string | null {
  const s = strip(raw);
  if (!/^\d+$/.test(s)) return null;

  if (s.length === 10 && (s.startsWith('06') || s.startsWith('07'))) {
    return '+212' + s.slice(1);
  }
  if (s.length === 12 && (s.startsWith('2126') || s.startsWith('2127'))) {
    return '+' + s;
  }
  if (s.length === 9 && (s.startsWith('6') || s.startsWith('7'))) {
    return '+212' + s;
  }
  return null;
}

/**
 * Validates a list of raw phone values, flagging invalid formats and
 * repeats of an already-seen normalized number (in list order).
 */
export function validateList(rows: string[]): PhoneValidationResult[] {
  const seen = new Set<string>();

  return rows.map((raw) => {
    const normalized = normalize(raw);

    if (normalized === null) {
      return { raw, normalized: null, status: 'invalid' };
    }
    if (seen.has(normalized)) {
      return { raw, normalized, status: 'duplicate' };
    }
    seen.add(normalized);
    return { raw, normalized, status: 'ok' };
  });
}
