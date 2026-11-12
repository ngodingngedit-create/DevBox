import { describe, it, expect } from 'vitest';
import {
  sniffImageMime,
  bytesToBase64,
  base64ToBytes,
  parseDataUri,
} from './bytes';

describe('bytes & MIME sniffing', () => {
  it('sniffs PNG magic bytes', () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const res = sniffImageMime(pngHeader);
    expect(res).toEqual({ mime: 'image/png', extension: 'png' });
  });

  it('sniffs JPEG magic bytes', () => {
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const res = sniffImageMime(jpegHeader);
    expect(res).toEqual({ mime: 'image/jpeg', extension: 'jpg' });
  });

  it('sniffs GIF magic bytes (GIF89a & GIF87a)', () => {
    const gif89 = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00]);
    expect(sniffImageMime(gif89)).toEqual({ mime: 'image/gif', extension: 'gif' });

    const gif87 = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x01, 0x00]);
    expect(sniffImageMime(gif87)).toEqual({ mime: 'image/gif', extension: 'gif' });
  });

  it('sniffs WebP magic bytes', () => {
    const webpHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(sniffImageMime(webpHeader)).toEqual({ mime: 'image/webp', extension: 'webp' });
  });

  it('sniffs BMP magic bytes', () => {
    const bmp = new Uint8Array([0x42, 0x4d, 0x1e, 0x00]);
    expect(sniffImageMime(bmp)).toEqual({ mime: 'image/bmp', extension: 'bmp' });
  });

  it('sniffs SVG xml/svg tags', () => {
    const svgBytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
    expect(sniffImageMime(svgBytes)).toEqual({ mime: 'image/svg+xml', extension: 'svg' });
  });

  it('returns null for arbitrary binary or text', () => {
    const txt = new TextEncoder().encode('Hello world this is not an image');
    expect(sniffImageMime(txt)).toBeNull();
  });

  it('roundtrips bytes -> base64 -> bytes', () => {
    const sample = new Uint8Array([1, 2, 3, 4, 255, 128, 0, 42]);
    const b64 = bytesToBase64(sample);
    const roundtrip = base64ToBytes(b64);
    expect(Array.from(roundtrip)).toEqual(Array.from(sample));
  });

  it('parses valid and invalid Data URIs', () => {
    const valid = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const parsed = parseDataUri(valid);
    expect(parsed).not.toBeNull();
    expect(parsed?.mime).toBe('image/png');
    expect(parsed?.isBase64).toBe(true);

    const invalid = 'not a data uri';
    expect(parseDataUri(invalid)).toBeNull();
  });
});
