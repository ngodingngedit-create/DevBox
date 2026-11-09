import { describe, it, expect } from 'vitest';
import {
  detectJwt,
  detectJson,
  detectUuid,
  detectTimestamp,
  detectHexColor,
  detectHash,
  detectCron,
  detectBase64,
  detectUrlEncoded,
  runDetectionPipeline,
} from './index';

describe('Smart Paste Detectors', () => {
  describe('detectJwt', () => {
    it('detects valid JWT format', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_pGMstwtS_vT';
      expect(detectJwt(jwt)).toBeGreaterThanOrEqual(0.9);
    });

    it('returns 0 for empty, invalid, and huge non-jwt string', () => {
      expect(detectJwt('')).toBe(0);
      expect(detectJwt('hello.world')).toBe(0);
      expect(detectJwt('a'.repeat(50000))).toBe(0);
    });
  });

  describe('detectJson', () => {
    it('detects valid JSON object and array', () => {
      expect(detectJson('{"name": "devbox"}')).toBeGreaterThanOrEqual(0.9);
      expect(detectJson('[1, 2, 3]')).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects invalid JSON or non-object', () => {
      expect(detectJson('')).toBe(0);
      expect(detectJson('{ invalid json: 123 }')).toBe(0);
      expect(detectJson('random text')).toBe(0);
    });
  });

  describe('detectUuid', () => {
    it('detects canonical UUID format', () => {
      expect(detectUuid('123e4567-e89b-12d3-a456-426614174000')).toBeGreaterThanOrEqual(0.9);
      expect(detectUuid('c9bf9e57-1685-4c89-bafb-ff5af830be8a')).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects invalid uuid', () => {
      expect(detectUuid('')).toBe(0);
      expect(detectUuid('123e4567-e89b-12d3-a456')).toBe(0);
    });
  });

  describe('detectTimestamp', () => {
    it('detects valid 10 and 13 digit unix timestamp', () => {
      expect(detectTimestamp('1700000000')).toBeGreaterThanOrEqual(0.9);
      expect(detectTimestamp('1700000000000')).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects out of range numbers and non-digits', () => {
      expect(detectTimestamp('')).toBe(0);
      expect(detectTimestamp('12345')).toBe(0);
      expect(detectTimestamp('99999999999999999')).toBe(0);
      expect(detectTimestamp('abc')).toBe(0);
    });
  });

  describe('detectHexColor', () => {
    it('detects 3 and 6 digit hex colors', () => {
      expect(detectHexColor('#fff')).toBeGreaterThanOrEqual(0.9);
      expect(detectHexColor('#1a2b3c')).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects invalid hex color', () => {
      expect(detectHexColor('')).toBe(0);
      expect(detectHexColor('#12345')).toBe(0);
      expect(detectHexColor('blue')).toBe(0);
    });
  });

  describe('detectHash', () => {
    it('detects 32 (MD5), 40 (SHA1), 64 (SHA256) hex hashes', () => {
      expect(detectHash('5eb63bbbe01eeed093cb22bb8f5acdc3')).toBeGreaterThanOrEqual(0.9); // md5
      expect(detectHash('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed')).toBeGreaterThanOrEqual(0.9); // sha1
      expect(detectHash('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')).toBeGreaterThanOrEqual(0.9); // sha256
    });

    it('rejects empty or random strings', () => {
      expect(detectHash('')).toBe(0);
      expect(detectHash('short-hash')).toBe(0);
    });
  });

  describe('detectCron', () => {
    it('detects standard 5 and 6 field cron', () => {
      expect(detectCron('*/5 * * * *')).toBeGreaterThanOrEqual(0.9);
      expect(detectCron('0 12 * * 1-5')).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects invalid fields', () => {
      expect(detectCron('')).toBe(0);
      expect(detectCron('* * *')).toBe(0);
    });
  });

  describe('detectBase64', () => {
    it('detects printable base64 encoded text', () => {
      // "Hello World! DevBox test string" encoded to Base64
      const b64 = btoa('Hello World! DevBox test string');
      expect(detectBase64(b64)).toBeGreaterThanOrEqual(0.8);
    });

    it('rejects invalid base64 and binary garbage', () => {
      expect(detectBase64('')).toBe(0);
      expect(detectBase64('bad base64!')).toBe(0);
    });
  });

  describe('detectUrlEncoded', () => {
    it('detects url encoded parameters', () => {
      expect(detectUrlEncoded('https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dtest')).toBeGreaterThanOrEqual(0.8);
    });

    it('rejects plain text without percent codes', () => {
      expect(detectUrlEncoded('')).toBe(0);
      expect(detectUrlEncoded('plain text without percent encoding')).toBe(0);
    });
  });

  describe('runDetectionPipeline ordering & priority', () => {
    it('prioritizes JWT first when pasted', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_pGMstwtS_vT';
      const results = runDetectionPipeline(jwt);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].toolId).toBe('jwt');
    });

    it('detects JSON before other generic tools', () => {
      const results = runDetectionPipeline('{"name": "alice", "active": true}');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].toolId).toBe('json');
    });
  });
});
