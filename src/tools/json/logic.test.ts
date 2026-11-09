import { describe, it, expect } from 'vitest';
import { formatJson } from './logic';

describe('formatJson', () => {
  it('formats valid json with 2 spaces indent', () => {
    const raw = '{"b":2,"a":1}';
    const res = formatJson(raw, { indent: 2 });
    expect(res.success).toBe(true);
    expect(res.output).toBe('{\n  "b": 2,\n  "a": 1\n}');
  });

  it('minifies json', () => {
    const raw = '{\n  "b": 2,\n  "a": 1\n}';
    const res = formatJson(raw, { indent: 'minify' });
    expect(res.success).toBe(true);
    expect(res.output).toBe('{"b":2,"a":1}');
  });

  it('sorts keys when requested', () => {
    const raw = '{"z": 1, "a": 2}';
    const res = formatJson(raw, { indent: 2, sortKeys: true });
    expect(res.success).toBe(true);
    const keys = Object.keys(JSON.parse(res.output));
    expect(keys).toEqual(['a', 'z']);
  });

  it('handles invalid json and extracts error position', () => {
    const raw = '{"a": 1,}';
    const res = formatJson(raw, { indent: 2 });
    expect(res.success).toBe(false);
    expect(res.error?.message).toBeTruthy();
  });

  it('handles empty string cleanly', () => {
    const res = formatJson('', { indent: 2 });
    expect(res.success).toBe(true);
    expect(res.output).toBe('');
  });
});
