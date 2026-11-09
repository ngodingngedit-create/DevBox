import { describe, it, expect } from 'vitest';
import { parseTimestampOrDate } from './logic';

describe('parseTimestampOrDate', () => {
  it('detects 10-digit epoch seconds correctly', () => {
    const res = parseTimestampOrDate('1700000000');
    expect(res.valid).toBe(true);
    expect(res.timestampSec).toBe(1700000000);
    expect(res.timestampMs).toBe(1700000000000);
    expect(res.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('detects 13-digit epoch milliseconds correctly', () => {
    const res = parseTimestampOrDate('1700000000000');
    expect(res.valid).toBe(true);
    expect(res.timestampSec).toBe(1700000000);
    expect(res.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('parses ISO date strings in reverse', () => {
    const res = parseTimestampOrDate('2023-11-14T22:13:20.000Z');
    expect(res.valid).toBe(true);
    expect(res.timestampSec).toBe(1700000000);
  });

  it('returns invalid on nonsense', () => {
    const res = parseTimestampOrDate('not-a-timestamp');
    expect(res.valid).toBe(false);
  });
});
