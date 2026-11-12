import { describe, it, expect } from 'vitest';
import {
  detectJwt,
  detectJson,
  detectUuid,
  detectTimestamp,
  detectHexColor,
  detectHash,
  detectCron,
  detectDataUri,
  detectBase64,
  detectUrlEncoded,
  runDetectionPipeline,
} from './index';

describe('Smart Paste Detectors v1.1', () => {
  describe('detectJwt', () => {
    it('detects valid JWT format', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_pGMstwtS_vT';
      expect(detectJwt(jwt).confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('returns 0 for empty, invalid, and huge non-jwt string', () => {
      expect(detectJwt('').confidence).toBe(0);
      expect(detectJwt('hello.world').confidence).toBe(0);
      expect(detectJwt('a'.repeat(50000)).confidence).toBe(0);
    });
  });

  describe('detectJson', () => {
    it('detects valid JSON object and array', () => {
      expect(detectJson('{"name": "devbox"}').confidence).toBeGreaterThanOrEqual(0.9);
      expect(detectJson('[1, 2, 3]').confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects invalid JSON or non-object', () => {
      expect(detectJson('').confidence).toBe(0);
      expect(detectJson('{ invalid json: 123 }').confidence).toBe(0);
      expect(detectJson('random text').confidence).toBe(0);
    });
  });

  describe('detectUuid', () => {
    it('detects canonical UUID format', () => {
      expect(detectUuid('123e4567-e89b-12d3-a456-426614174000').confidence).toBeGreaterThanOrEqual(0.9);
      expect(detectUuid('c9bf9e57-1685-4c89-bafb-ff5af830be8a').confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects invalid uuid', () => {
      expect(detectUuid('').confidence).toBe(0);
      expect(detectUuid('123e4567-e89b-12d3-a456').confidence).toBe(0);
    });
  });

  describe('detectTimestamp', () => {
    it('detects valid 10 and 13 digit unix timestamp', () => {
      expect(detectTimestamp('1700000000').confidence).toBeGreaterThanOrEqual(0.9);
      expect(detectTimestamp('1700000000000').confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects out of range numbers and non-digits', () => {
      expect(detectTimestamp('').confidence).toBe(0);
      expect(detectTimestamp('12345').confidence).toBe(0);
      expect(detectTimestamp('99999999999999999').confidence).toBe(0);
      expect(detectTimestamp('abc').confidence).toBe(0);
    });
  });

  describe('detectHexColor', () => {
    it('detects 3 and 6 digit hex colors', () => {
      expect(detectHexColor('#fff').confidence).toBeGreaterThanOrEqual(0.9);
      expect(detectHexColor('#1a2b3c').confidence).toBeGreaterThanOrEqual(0.9);
      expect(detectHexColor('#1a2b3c').meta?.colorHex).toBe('#1a2b3c');
    });

    it('rejects invalid hex color', () => {
      expect(detectHexColor('').confidence).toBe(0);
      expect(detectHexColor('#12345').confidence).toBe(0);
      expect(detectHexColor('blue').confidence).toBe(0);
    });
  });

  describe('detectHash', () => {
    it('detects 32 (MD5), 40 (SHA1), 64 (SHA256) hex hashes', () => {
      expect(detectHash('5eb63bbbe01eeed093cb22bb8f5acdc3').confidence).toBeGreaterThanOrEqual(0.9);
      expect(detectHash('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed').confidence).toBeGreaterThanOrEqual(0.9);
      expect(detectHash('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9').confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects empty or random strings', () => {
      expect(detectHash('').confidence).toBe(0);
      expect(detectHash('short-hash').confidence).toBe(0);
    });
  });

  describe('detectCron', () => {
    it('detects standard 5 and 6 field cron', () => {
      expect(detectCron('*/5 * * * *').confidence).toBeGreaterThanOrEqual(0.9);
      expect(detectCron('0 12 * * 1-5').confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects invalid fields', () => {
      expect(detectCron('').confidence).toBe(0);
      expect(detectCron('* * *').confidence).toBe(0);
    });
  });

  describe('detectDataUri (#8)', () => {
    it('detects image Data URIs with high confidence', () => {
      const uri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = detectDataUri(uri);
      expect(res.confidence).toBeGreaterThanOrEqual(0.95);
      expect(res.meta?.isImage).toBe(true);
      expect(res.meta?.mime).toBe('image/png');
    });

    it('detects non-image Data URIs and reports mime', () => {
      const textUri = 'data:text/plain;base64,SGVsbG8=';
      const res = detectDataUri(textUri);
      expect(res.confidence).toBeGreaterThanOrEqual(0.8);
      expect(res.meta?.isImage).toBe(false);
    });
  });

  describe('detectBase64 (#9)', () => {
    it('detects Base64 image with magic bytes (PNG/JPEG) as image mode with high confidence', () => {
      // 1x1 transparent PNG
      const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = detectBase64(pngB64);
      expect(res.confidence).toBeGreaterThanOrEqual(0.95);
      expect(res.meta?.isImage).toBe(true);
      expect(res.meta?.mime).toBe('image/png');
    });

    it('detects printable text Base64 as text mode', () => {
      const txtB64 = btoa('Hello World! Developer toolbox DevBox');
      const res = detectBase64(txtB64);
      expect(res.confidence).toBeGreaterThanOrEqual(0.85);
      expect(res.meta?.isImage).toBe(false);
    });

    it('rejects invalid base64', () => {
      expect(detectBase64('').confidence).toBe(0);
      expect(detectBase64('bad base64!').confidence).toBe(0);
    });
  });

  describe('detectUrlEncoded (#10)', () => {
    it('detects url encoded parameters', () => {
      expect(detectUrlEncoded('https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dtest').confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('rejects plain text without percent codes', () => {
      expect(detectUrlEncoded('').confidence).toBe(0);
      expect(detectUrlEncoded('plain text without percent encoding').confidence).toBe(0);
    });
  });

  describe('runDetectionPipeline ordering & priority', () => {
    it('prioritizes JWT first when pasted', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_pGMstwtS_vT';
      const results = runDetectionPipeline(jwt);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].toolId).toBe('jwt');
    });

    it('routes PNG image base64 directly to base64 image mode with high confidence', () => {
      const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const results = runDetectionPipeline(pngB64);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].toolId).toBe('base64');
      expect(results[0].meta?.isImage).toBe(true);
    });
  });
});
