export type ImageMime =
  | 'image/png'
  | 'image/jpeg'
  | 'image/gif'
  | 'image/webp'
  | 'image/bmp'
  | 'image/svg+xml'
  | 'image/x-icon'
  | 'image/avif';

export interface SniffedMime {
  mime: ImageMime;
  extension: string;
}

export function sniffImageMime(bytes: Uint8Array): SniffedMime | null {
  if (bytes.length < 4) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: 'image/png', extension: 'png' };
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', extension: 'jpg' };
  }

  // GIF: GIF87a or GIF89a (47 49 46 38 37/39 61)
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return { mime: 'image/gif', extension: 'gif' };
  }

  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return { mime: 'image/bmp', extension: 'bmp' };
  }

  // WebP: RIFF .... WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: 'image/webp', extension: 'webp' };
  }

  // ICO: 00 00 01 00
  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
    return { mime: 'image/x-icon', extension: 'ico' };
  }

  // AVIF: ....ftypavif or ftypavis
  if (bytes.length >= 12) {
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (ftyp === 'ftyp' && (brand === 'avif' || brand === 'avis')) {
      return { mime: 'image/avif', extension: 'avif' };
    }
  }

  // SVG: <?xml or <svg in first bytes
  const textSample = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.slice(0, Math.min(bytes.length, 512)))
    .trimStart();
  if (textSample.startsWith('<svg') || (textSample.startsWith('<?xml') && textSample.includes('<svg'))) {
    return { mime: 'image/svg+xml', extension: 'svg' };
  }

  return null;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 0x8000;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.trim().replace(/\s+/g, '');
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface ParsedDataUri {
  mime: string;
  isBase64: boolean;
  data: string;
  rawBytes: Uint8Array;
}

export function parseDataUri(uri: string): ParsedDataUri | null {
  const match = uri.trim().match(/^data:([\w.+-]+\/[\w.+-]+)?(;base64)?,(.*)$/is);
  if (!match) return null;

  const mime = match[1] || 'text/plain;charset=US-ASCII';
  const isBase64 = Boolean(match[2]);
  const data = match[3] || '';

  try {
    const rawBytes = isBase64
      ? base64ToBytes(data)
      : new TextEncoder().encode(decodeURIComponent(data));
    return { mime, isBase64, data, rawBytes };
  } catch {
    return null;
  }
}
