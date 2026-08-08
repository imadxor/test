import { describe, expect, it } from 'vitest';
import { normalize, validateList } from '../phone';

describe('normalize', () => {
  it('normalizes 10-digit 06 numbers', () => {
    expect(normalize('0612345678')).toBe('+212612345678');
  });

  it('normalizes 10-digit 07 numbers', () => {
    expect(normalize('0712345678')).toBe('+212712345678');
  });

  it('keeps 12-digit 2126 numbers as-is (with + added)', () => {
    expect(normalize('212612345678')).toBe('+212612345678');
  });

  it('keeps 12-digit 2127 numbers as-is (with + added)', () => {
    expect(normalize('212712345678')).toBe('+212712345678');
  });

  it('prefixes 9-digit numbers starting with 6', () => {
    expect(normalize('612345678')).toBe('+212612345678');
  });

  it('prefixes 9-digit numbers starting with 7', () => {
    expect(normalize('712345678')).toBe('+212712345678');
  });

  it('strips spaces, dashes, dots and parentheses', () => {
    expect(normalize('06 12-34.56(78)')).toBe('+212612345678');
    expect(normalize('06-12-34-56-78')).toBe('+212612345678');
    expect(normalize('06.12.34.56.78')).toBe('+212612345678');
  });

  it('strips a leading +', () => {
    expect(normalize('+212612345678')).toBe('+212612345678');
    expect(normalize('+212 612 345 678')).toBe('+212612345678');
  });

  it('rejects numbers with the wrong leading digit for 10-digit form', () => {
    expect(normalize('0812345678')).toBeNull();
    expect(normalize('0512345678')).toBeNull();
  });

  it('rejects 12-digit numbers with the wrong country/leading code', () => {
    expect(normalize('212512345678')).toBeNull();
    expect(normalize('112612345678')).toBeNull();
  });

  it('rejects 9-digit numbers not starting with 6 or 7', () => {
    expect(normalize('512345678')).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(normalize('not-a-phone')).toBeNull();
    expect(normalize('')).toBeNull();
  });

  it('rejects wrong-length input', () => {
    expect(normalize('061234567')).toBeNull(); // 9 digits, starts with 0
    expect(normalize('06123456789')).toBeNull(); // 11 digits
  });

  it('rejects landline-shaped numbers (05)', () => {
    expect(normalize('0522123456')).toBeNull();
  });
});

describe('validateList', () => {
  it('marks well-formed unique numbers as ok', () => {
    const results = validateList(['0612345678', '0712345678']);
    expect(results.map((r) => r.status)).toEqual(['ok', 'ok']);
    expect(results[0]).toEqual({
      raw: '0612345678',
      normalized: '+212612345678',
      status: 'ok',
    });
  });

  it('marks malformed numbers as invalid', () => {
    const results = validateList(['0812345678']);
    expect(results[0]).toEqual({
      raw: '0812345678',
      normalized: null,
      status: 'invalid',
    });
  });

  it('marks a repeat of an already-seen normalized number as duplicate', () => {
    const results = validateList(['0612345678', '612345678', '+212612345678']);
    expect(results.map((r) => r.status)).toEqual(['ok', 'duplicate', 'duplicate']);
  });

  it('keeps both raw and normalized values', () => {
    const results = validateList(['06 12 34 56 78']);
    expect(results[0].raw).toBe('06 12 34 56 78');
    expect(results[0].normalized).toBe('+212612345678');
  });

  it('does not count two different invalid entries as duplicates of each other', () => {
    const results = validateList(['bad1', 'bad2']);
    expect(results.map((r) => r.status)).toEqual(['invalid', 'invalid']);
  });

  it('preserves input order and length', () => {
    const input = ['0612345678', 'garbage', '0612345678', '0712345678'];
    const results = validateList(input);
    expect(results).toHaveLength(4);
    expect(results.map((r) => r.status)).toEqual(['ok', 'invalid', 'duplicate', 'ok']);
  });
});
