import { describe, it, expect } from 'vitest';
import {
  base64EncodeText,
  base64DecodeText,
  decodeImageInput,
  encodeImageFile,
} from './logic';

describe('base64 logic with image & text support', () => {
  it('encodes and decodes utf8 text', () => {
    const raw = 'Halo DevBox 🌍';
    const enc = base64EncodeText(raw);
    expect(base64DecodeText(enc)).toBe(raw);
  });

  it('decodes 1x1 transparent PNG Base64 and recognizes PNG MIME', () => {
    // 1x1 transparent PNG
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = decodeImageInput(pngBase64);
    expect(res.metadata.mime).toBe('image/png');
    expect(res.metadata.extension).toBe('png');
    expect(res.bytes.byteLength).toBeGreaterThan(10);
    expect(res.dataUri).toContain('data:image/png;base64,');
  });

  it('handles Data URI input with declared image/jpeg MIME', () => {
    // Fake JPEG header in base64: /9j/ = 0xFF 0xD8 0xFF
    const jpegDataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const res = decodeImageInput(jpegDataUri);
    expect(res.metadata.mime).toBe('image/jpeg');
    expect(res.metadata.extension).toBe('jpg');
  });

  it('encodes image file bytes with correct metadata', () => {
    const fakeBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const fakeFile = new File([fakeBytes], 'test-icon.png', { type: 'image/png' });
    const res = encodeImageFile(fakeFile, fakeBytes);
    expect(res.metadata.name).toBe('test-icon.png');
    expect(res.metadata.mime).toBe('image/png');
    expect(res.rawBase64).toBeTruthy();
  });
});
