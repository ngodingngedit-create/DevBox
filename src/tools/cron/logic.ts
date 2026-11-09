import cronstrue from 'cronstrue';

export interface CronParseResult {
  valid: boolean;
  description: string;
  nextDates: string[];
  error?: string;
  assumedTimezone: string;
}

function matchField(val: number, expr: string): boolean {
  if (expr === '*' || expr === '?') return true;
  const parts = expr.split(',');
  for (const part of parts) {
    if (part.includes('/')) {
      const [startStr, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      const start = startStr === '*' ? 0 : parseInt(startStr, 10);
      if ((val - start) % step === 0 && val >= start) return true;
    } else if (part.includes('-')) {
      const [minStr, maxStr] = part.split('-');
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      if (val >= min && val <= max) return true;
    } else {
      if (parseInt(part, 10) === val) return true;
    }
  }
  return false;
}

export function computeNextCronDates(expr: string, count = 5, fromDate = new Date()): string[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return [];

  // Standard 5-field cron: minute, hour, dayOfMonth, month, dayOfWeek
  // If 6-field: second, minute, hour, dayOfMonth, month, dayOfWeek
  const hasSeconds = parts.length === 6;
  const [secExpr, minExpr, hourExpr, domExpr, monthExpr, dowExpr] = hasSeconds
    ? parts
    : ['0', parts[0], parts[1], parts[2], parts[3], parts[4]];

  const results: string[] = [];
  const current = new Date(fromDate.getTime());
  // advance to next minute/second
  if (hasSeconds) {
    current.setSeconds(current.getSeconds() + 1);
  } else {
    current.setMinutes(current.getMinutes() + 1, 0, 0);
  }

  // Iterate forward up to 366 days max
  const maxIterations = hasSeconds ? 86400 * 30 : 60 * 24 * 366;
  let iterations = 0;

  while (results.length < count && iterations < maxIterations) {
    iterations++;
    const s = current.getSeconds();
    const m = current.getMinutes();
    const h = current.getHours();
    const dom = current.getDate();
    const month = current.getMonth() + 1;
    const dow = current.getDay();

    if (
      matchField(s, secExpr) &&
      matchField(m, minExpr) &&
      matchField(h, hourExpr) &&
      matchField(dom, domExpr) &&
      matchField(month, monthExpr) &&
      matchField(dow, dowExpr)
    ) {
      results.push(current.toISOString());
    }

    if (hasSeconds) {
      current.setSeconds(current.getSeconds() + 1);
    } else {
      current.setMinutes(current.getMinutes() + 1);
    }
  }

  return results;
}

export function explainCron(expression: string): CronParseResult {
  const trimmed = expression.trim();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';

  if (!trimmed) {
    return {
      valid: false,
      description: '',
      nextDates: [],
      error: 'Empty cron expression',
      assumedTimezone: timezone,
    };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    return {
      valid: false,
      description: '',
      nextDates: [],
      error: 'Cron expression must have 5 or 6 fields',
      assumedTimezone: timezone,
    };
  }

  try {
    const description = cronstrue.toString(trimmed, { throwExceptionOnParseError: true });
    const nextDates = computeNextCronDates(trimmed, 5);
    return {
      valid: true,
      description,
      nextDates,
      assumedTimezone: timezone,
    };
  } catch (err) {
    return {
      valid: false,
      description: '',
      nextDates: [],
      error: err instanceof Error ? err.message : 'Invalid cron expression',
      assumedTimezone: timezone,
    };
  }
}
