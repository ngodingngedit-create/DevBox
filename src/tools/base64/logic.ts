import {
  sniffImageMime,
  bytesToBase64,
  base64ToBytes,
  parseDataUri,
  type ImageMime,
} from '../../lib/bytes';

export function base64EncodeText(input: string): string {
  try {
    const bytes = new TextEncoder().encode(input);
    return bytesToBase64(bytes);
  } catch (err) {
    throw new Error(`Base64 encode failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function base64DecodeText(input: string): string {
  try {
    const bytes = base64ToBytes(input);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (err) {
    throw new Error(`Base64 decode failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export interface ImageMetadata {
  name?: string;
  mime: string;
  extension: string;
  byteSize: number;
  width?: number;
  height?: number;
}

export interface ImageDecodeResult {
  dataUri: string;
  rawBase64: string;
  bytes: Uint8Array;
  metadata: ImageMetadata;
}

export function decodeImageInput(input: string): ImageDecodeResult {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Empty input');
  }

  let bytes: Uint8Array;
  let rawBase64 = '';
  let declaredMime: string | undefined;

  if (trimmed.startsWith('data:')) {
    const parsed = parseDataUri(trimmed);
    if (!parsed) {
      throw new Error('Malformed Data URI');
    }
    bytes = parsed.rawBytes;
    declaredMime = parsed.mime;
    rawBase64 = parsed.isBase64 ? parsed.data : bytesToBase64(bytes);
  } else {
    // Pure base64
    bytes = base64ToBytes(trimmed);
    rawBase64 = trimmed.replace(/\s+/g, '');
  }

  const sniffed = sniffImageMime(bytes);
  const mime = sniffed?.mime || declaredMime || 'application/octet-stream';
  const extension = sniffed?.extension || 'bin';

  const dataUri = trimmed.startsWith('data:')
    ? trimmed
    : `data:${mime};base64,${rawBase64}`;

  return {
    dataUri,
    rawBase64,
    bytes,
    metadata: {
      mime,
      extension,
      byteSize: bytes.byteLength,
    },
  };
}

export function encodeImageFile(file: File, bytes: Uint8Array): ImageDecodeResult {
  const rawBase64 = bytesToBase64(bytes);
  const sniffed = sniffImageMime(bytes);
  const mime = (file.type as ImageMime) || sniffed?.mime || 'image/png';
  const extension = sniffed?.extension || file.name.split('.').pop() || 'png';
  const dataUri = `data:${mime};base64,${rawBase64}`;

  return {
    dataUri,
    rawBase64,
    bytes,
    metadata: {
      name: file.name,
      mime,
      extension,
      byteSize: file.size || bytes.byteLength,
    },
  };
}
