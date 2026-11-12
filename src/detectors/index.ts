import { sniffImageMime, base64ToBytes, parseDataUri } from '../lib/bytes';

export interface DetectionResult {
  toolId: string;
  name: string;
  confidence: number; // 0..1
  meta?: {
    isImage?: boolean;
    mime?: string;
    colorHex?: string;
  };
}

export type DetectorFn = (input: string) => { confidence: number; meta?: DetectionResult['meta'] };

/**
 * Detector 1: JWT
 * Pattern: /^eyJ[\w-]+\.[\w-]+\.[\w-]*$/
 */
export function detectJwt(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { confidence: 0 };
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]*$/.test(trimmed)) {
    return { confidence: 0.99 };
  }
  return { confidence: 0 };
}

/**
 * Detector 2: JSON
 * Diawali {/[ dan JSON.parse sukses
 */
export function detectJson(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { confidence: 0 };
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return { confidence: 0 };
  }
  try {
    JSON.parse(trimmed);
    return { confidence: 0.98 };
  } catch {
    return { confidence: 0 };
  }
}

/**
 * Detector 3: UUID
 * Regex kanonik UUID
 */
export function detectUuid(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { confidence: 0 };
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed) ? { confidence: 0.98 } : { confidence: 0 };
}

/**
 * Detector 4: Timestamp
 * Integer 10 digit (detik) / 13 digit (ms) di rentang wajar (1980 - 2100)
 */
export function detectTimestamp(input: string) {
  const trimmed = input.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return { confidence: 0 };

  // 10 digits: 315532800 (1980) .. 4102444800 (2100)
  if (trimmed.length === 10) {
    const num = parseInt(trimmed, 10);
    if (num >= 315532800 && num <= 4102444800) {
      return { confidence: 0.95 };
    }
  }

  // 13 digits: 315532800000 .. 4102444800000
  if (trimmed.length === 13) {
    const num = parseInt(trimmed, 10);
    if (num >= 315532800000 && num <= 4102444800000) {
      return { confidence: 0.95 };
    }
  }

  return { confidence: 0 };
}

/**
 * Detector 5: Hex color
 * Pattern: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
 */
export function detectHexColor(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { confidence: 0 };
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return { confidence: 0.96, meta: { colorHex: trimmed } };
  }
  return { confidence: 0 };
}

/**
 * Detector 6: Hash
 * 32 (MD5) / 40 (SHA-1) / 64 (SHA-256) karakter hex
 */
export function detectHash(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { confidence: 0 };
  if (/^[0-9a-f]{32}$/i.test(trimmed)) return { confidence: 0.92 };
  if (/^[0-9a-f]{40}$/i.test(trimmed)) return { confidence: 0.92 };
  if (/^[0-9a-f]{64}$/i.test(trimmed)) return { confidence: 0.92 };
  return { confidence: 0 };
}

/**
 * Detector 7: Cron
 * 5–6 field cron dipisah spasi
 */
export function detectCron(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { confidence: 0 };
  const parts = trimmed.split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return { confidence: 0 };

  const cronFieldRegex = /^(\*(\/[0-9]+)?|[0-9,\-\/]+|\?|L|W|#[0-9]+)$/i;
  const isAllValid = parts.every((p) => cronFieldRegex.test(p));
  if (!isAllValid) return { confidence: 0 };

  const hasCronSpecials = parts.some((p) => p.includes('*') || p.includes('/') || p.includes('-'));
  return hasCronSpecials ? { confidence: 0.93 } : { confidence: 0.6 };
}

/**
 * Detector 8: Data URI
 * Pattern: /^data:[\w.+-]+\/[\w.+-]+(;base64)?,/
 * image/* -> route ke base64 mode gambar (decode); non-image -> tetap buka base64
 */
export function detectDataUri(input: string) {
  const trimmed = input.trim();
  if (!trimmed || !trimmed.startsWith('data:')) return { confidence: 0 };

  const parsed = parseDataUri(trimmed);
  if (!parsed) return { confidence: 0 };

  const isImage = parsed.mime.startsWith('image/');
  return {
    confidence: isImage ? 0.98 : 0.85,
    meta: {
      isImage,
      mime: parsed.mime,
    },
  };
}

/**
 * Detector 9: Base64
 * Charset valid, panjang % 4 == 0.
 * Magic bytes gambar dikenali -> mode gambar (keyakinan tinggi 0.97, auto-route)
 * Printable UTF-8 -> mode teks (0.85)
 */
export function detectBase64(input: string) {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 4 || trimmed.length % 4 !== 0) return { confidence: 0 };
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) return { confidence: 0 };

  try {
    const bytes = base64ToBytes(trimmed);

    // 1. Check if bytes match known image magic bytes
    const sniffed = sniffImageMime(bytes);
    if (sniffed) {
      return {
        confidence: 0.97,
        meta: {
          isImage: true,
          mime: sniffed.mime,
        },
      };
    }

    // 2. Check if bytes decode to printable UTF-8 text
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // eslint-disable-next-line no-control-regex
    const printableRatio = (decoded.match(/[\x20-\x7E\t\r\n]/g) || []).length / decoded.length;
    if (printableRatio > 0.85 && decoded.length > 2) {
      return { confidence: 0.85, meta: { isImage: false } };
    }

    return { confidence: 0.4 };
  } catch {
    return { confidence: 0 };
  }
}

/**
 * Detector 10: URL-encoded
 * Mengandung beberapa urutan %XX
 */
export function detectUrlEncoded(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { confidence: 0 };

  const matches = trimmed.match(/%[0-9a-fA-F]{2}/g);
  if (!matches || matches.length === 0) return { confidence: 0 };

  if (matches.length >= 2 || trimmed.includes('%3A%2F%2F')) {
    try {
      decodeURIComponent(trimmed);
      return { confidence: 0.88 };
    } catch {
      return { confidence: 0 };
    }
  }

  if (matches.length === 1) {
    return { confidence: 0.6 };
  }

  return { confidence: 0 };
}

export interface DetectorDefinition {
  id: string;
  name: string;
  detect: DetectorFn;
}

// URUTAN EKSEKUSI KETAT SESUAI DOKUMEN AGENTS.MD REVISI v1.1:
// 1. JWT -> 2. JSON -> 3. UUID -> 4. Timestamp -> 5. Hex color -> 6. Hash -> 7. Cron -> 8. Data URI -> 9. Base64 -> 10. URL-encoded
export const orderedDetectors: DetectorDefinition[] = [
  { id: 'jwt', name: 'JWT Decoder', detect: detectJwt },
  { id: 'json', name: 'JSON Formatter', detect: detectJson },
  { id: 'uuid', name: 'UUID Generator & Validator', detect: detectUuid },
  { id: 'timestamp', name: 'Timestamp Converter', detect: detectTimestamp },
  { id: 'hex-color', name: 'Hex Color', detect: detectHexColor },
  { id: 'hash', name: 'Hash Generator', detect: detectHash },
  { id: 'cron', name: 'Cron Explainer', detect: detectCron },
  { id: 'base64', name: 'Base64 (Data URI)', detect: detectDataUri },
  { id: 'base64', name: 'Base64 Encoder/Decoder', detect: detectBase64 },
  { id: 'url', name: 'URL Encoder/Decoder', detect: detectUrlEncoded },
];

export function runDetectionPipeline(input: string): DetectionResult[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const results: DetectionResult[] = [];

  for (const def of orderedDetectors) {
    const { confidence, meta } = def.detect(trimmed);
    if (confidence > 0) {
      results.push({
        toolId: def.id,
        name: def.name,
        confidence,
        meta,
      });
    }
  }

  return results;
}
