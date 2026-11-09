export interface TimestampParseResult {
  valid: boolean;
  timestampSec?: number;
  timestampMs?: number;
  iso?: string;
  utc?: string;
  local?: string;
  relative?: string;
  error?: string;
}

export function parseTimestampOrDate(input: string): TimestampParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: 'Empty input' };
  }

  let ms: number | null = null;

  // Case 1: pure integer digits (seconds or milliseconds)
  if (/^-?\d+$/.test(trimmed)) {
    const val = parseInt(trimmed, 10);
    // 10 digits -> seconds, 13 digits -> milliseconds
    if (trimmed.length <= 11) {
      ms = val * 1000;
    } else {
      ms = val;
    }
  } else {
    // Case 2: ISO or standard date string
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) {
      ms = parsed;
    }
  }

  if (ms === null || isNaN(ms)) {
    return { valid: false, error: 'Cannot parse as valid date or timestamp' };
  }

  const d = new Date(ms);
  const now = Date.now();
  const diffSec = Math.round((d.getTime() - now) / 1000);

  let relative = '';
  if (Math.abs(diffSec) < 60) {
    relative = diffSec >= 0 ? `in ${diffSec}s` : `${Math.abs(diffSec)}s ago`;
  } else if (Math.abs(diffSec) < 3600) {
    const min = Math.round(diffSec / 60);
    relative = min >= 0 ? `in ${min}m` : `${Math.abs(min)}m ago`;
  } else if (Math.abs(diffSec) < 86400) {
    const hr = Math.round(diffSec / 3600);
    relative = hr >= 0 ? `in ${hr}h` : `${Math.abs(hr)}h ago`;
  } else {
    const days = Math.round(diffSec / 86400);
    relative = days >= 0 ? `in ${days}d` : `${Math.abs(days)}d ago`;
  }

  return {
    valid: true,
    timestampSec: Math.floor(ms / 1000),
    timestampMs: ms,
    iso: d.toISOString(),
    utc: d.toUTCString(),
    local: d.toString(),
    relative,
  };
}
