import { describe, it, expect } from 'vitest';
import { explainCron, computeNextCronDates } from './logic';

describe('cron logic', () => {
  it('explains standard 5-part cron correctly', () => {
    const res = explainCron('*/5 * * * *');
    expect(res.valid).toBe(true);
    expect(res.description.toLowerCase()).toContain('every 5 minutes');
    expect(res.nextDates.length).toBe(5);
  });

  it('explains daily cron correctly', () => {
    const res = explainCron('0 12 * * *');
    expect(res.valid).toBe(true);
    expect(res.description.toLowerCase()).toContain('12:00 pm');
  });

  it('computes 5 future execution dates sequentially', () => {
    const baseDate = new Date('2025-01-01T00:00:00Z');
    const dates = computeNextCronDates('0 0 * * *', 3, baseDate);
    expect(dates.length).toBe(3);
  });

  it('rejects invalid field counts', () => {
    const res = explainCron('* * *');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Cron expression must have 5 or 6 fields');
  });
});
