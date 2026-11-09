export interface DetectionResult {
  toolId: string;
  name: string;
  confidence: number; // 0..1
}

export type DetectorFn = (input: string) => number;

/**
 * Detector 1: JWT
 * Pattern: /^eyJ[\w-]+\.[\w-]+\.[\w-]*$/
 */
export function detectJwt(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]*$/.test(trimmed)) {
    return 0.99;
  }
  return 0;
}

/**
 * Detector 2: JSON
 * Diawali {/[ dan JSON.parse sukses
 */
export function detectJson(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return 0;
  }
  try {
    JSON.parse(trimmed);
    return 0.98;
  } catch {
    return 0;
  }
}

/**
 * Detector 3: UUID
 * Regex kanonik UUID
 */
export function detectUuid(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed) ? 0.98 : 0;
}

/**
 * Detector 4: Timestamp
 * Integer 10 digit (detik) / 13 digit (ms) di rentang wajar (1980 - 2100)
 */
export function detectTimestamp(input: string): number {
  const trimmed = input.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return 0;

  // 10 digits: 315532800 (1980) .. 4102444800 (2100)
  if (trimmed.length === 10) {
    const num = parseInt(trimmed, 10);
    if (num >= 315532800 && num <= 4102444800) {
      return 0.95;
    }
  }

  // 13 digits: 315532800000 .. 4102444800000
  if (trimmed.length === 13) {
    const num = parseInt(trimmed, 10);
    if (num >= 315532800000 && num <= 4102444800000) {
      return 0.95;
    }
  }

  return 0;
}

/**
 * Detector 5: Hex color
 * Pattern: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
 */
export function detectHexColor(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ? 0.95 : 0;
}

/**
 * Detector 6: Hash
 * 32 (MD5) / 40 (SHA-1) / 64 (SHA-256) karakter hex
 */
export function detectHash(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  if (/^[0-9a-f]{32}$/i.test(trimmed)) return 0.92;
  if (/^[0-9a-f]{40}$/i.test(trimmed)) return 0.92;
  if (/^[0-9a-f]{64}$/i.test(trimmed)) return 0.92;
  return 0;
}

/**
 * Detector 7: Cron
 * 5–6 field cron dipisah spasi
 */
export function detectCron(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return 0;

  // field chars commonly found in cron (e.g. *, */5, 1-5, 0, ?, etc.)
  const cronFieldRegex = /^(\*(\/[0-9]+)?|[0-9,\-\/]+|\?|L|W|#[0-9]+)$/i;
  const isAllValid = parts.every((p) => cronFieldRegex.test(p));
  if (!isAllValid) return 0;

  // Must have at least one asterisk or slash or range to look like cron
  const hasCronSpecials = parts.some((p) => p.includes('*') || p.includes('/') || p.includes('-'));
  return hasCronSpecials ? 0.93 : 0.6;
}

/**
 * Detector 8: Base64
 * Charset valid, panjang % 4 == 0, hasil decode printable UTF-8
 */
export function detectBase64(input: string): number {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 4 || trimmed.length % 4 !== 0) return 0;
  // Valid Base64 charset
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) return 0;

  try {
    const bin = atob(trimmed);
    const bytes = Uint8Array.from(bin, (m) => m.charCodeAt(0));
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // must contain printable chars, not binary garbage
    // eslint-disable-next-line no-control-regex
    const printableRatio = (decoded.match(/[\x20-\x7E\t\r\n]/g) || []).length / decoded.length;
    if (printableRatio > 0.85 && decoded.length > 2) {
      return 0.85;
    }
    return 0.4;
  } catch {
    return 0;
  }
}

/**
 * Detector 9: URL-encoded
 * Mengandung beberapa urutan %XX
 */
export function detectUrlEncoded(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;

  const matches = trimmed.match(/%[0-9a-fA-F]{2}/g);
  if (!matches || matches.length === 0) return 0;

  // If there are at least two percent-encoded tokens or starts with http%3A
  if (matches.length >= 2 || trimmed.includes('%3A%2F%2F')) {
    try {
      decodeURIComponent(trimmed);
      return 0.88;
    } catch {
      return 0;
    }
  }

  if (matches.length === 1) {
    return 0.6;
  }

  return 0;
}

export interface DetectorDefinition {
  id: string;
  name: string;
  detect: DetectorFn;
}

// URUTAN EKSEKUSI KETAT SESUAI DOKUMEN AGENTS.MD:
// 1. JWT -> 2. JSON -> 3. UUID -> 4. Timestamp -> 5. Hex color -> 6. Hash -> 7. Cron -> 8. Base64 -> 9. URL-encoded
export const orderedDetectors: DetectorDefinition[] = [
  { id: 'jwt', name: 'JWT Decoder', detect: detectJwt },
  { id: 'json', name: 'JSON Formatter', detect: detectJson },
  { id: 'uuid', name: 'UUID Generator & Validator', detect: detectUuid },
  { id: 'timestamp', name: 'Timestamp Converter', detect: detectTimestamp },
  { id: 'hash', name: 'Hash / Color Checker', detect: detectHexColor },
  { id: 'hash', name: 'Hash Generator', detect: detectHash },
  { id: 'cron', name: 'Cron Explainer', detect: detectCron },
  { id: 'base64', name: 'Base64 Encoder/Decoder', detect: detectBase64 },
  { id: 'url', name: 'URL Encoder/Decoder', detect: detectUrlEncoded },
];

export function runDetectionPipeline(input: string): DetectionResult[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const results: DetectionResult[] = [];

  for (const def of orderedDetectors) {
    const score = def.detect(trimmed);
    if (score > 0) {
      results.push({
        toolId: def.id,
        name: def.name,
        confidence: score,
      });
    }
  }

  return results;
}
