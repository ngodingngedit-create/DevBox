import { describe, it, expect } from 'vitest';
import { base64Encode, base64Decode } from './logic';

describe('base64 logic', () => {
  it('encodes and decodes ascii strings', () => {
    const raw = 'Hello DevBox!';
    const encoded = base64Encode(raw);
    expect(encoded).toBe('SGVsbG8gRGV2Qm94IQ==');
    expect(base64Decode(encoded)).toBe(raw);
  });

  it('supports full UTF-8 emojis and special characters', () => {
    const utf8Text = 'Halo dunia 🌍 — äöü! 🚀';
    const enc = base64Encode(utf8Text);
    expect(base64Decode(enc)).toBe(utf8Text);
  });

  it('throws on invalid base64 input', () => {
    expect(() => base64Decode('***NotValidBase64***')).toThrow();
  });
});
