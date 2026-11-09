import { describe, it, expect } from 'vitest';
import { generateUuids, validateUuid } from './logic';

describe('uuid logic', () => {
  it('generates requested count of valid v4 uuids', () => {
    const list = generateUuids(5);
    expect(list.length).toBe(5);
    list.forEach((id) => {
      expect(validateUuid(id)).toBe(true);
      expect(id).toBe(id.toLowerCase());
    });
  });

  it('generates uppercase uuids when requested', () => {
    const list = generateUuids(2, true);
    expect(list.length).toBe(2);
    list.forEach((id) => {
      expect(validateUuid(id)).toBe(true);
      expect(id).toBe(id.toUpperCase());
    });
  });

  it('validates standard uuids and rejects invalid strings', () => {
    expect(validateUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    expect(validateUuid('not-a-valid-uuid')).toBe(false);
  });
});
