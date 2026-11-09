import { describe, it, expect } from 'vitest';
import { computeHashes } from './logic';

describe('hash logic', () => {
  it('computes correct MD5, SHA-1, SHA-256 hashes for hello world', async () => {
    const res = await computeHashes('hello world');
    expect(res.md5).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');
    expect(res.sha1).toBe('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed');
    expect(res.sha256).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('supports uppercase output format', async () => {
    const res = await computeHashes('hello', true);
    expect(res.md5).toBe('5D41402ABC4B2A76B9719D911017C592');
  });

  it('returns empty hashes for empty input', async () => {
    const res = await computeHashes('');
    expect(res).toEqual({ md5: '', sha1: '', sha256: '' });
  });
});
