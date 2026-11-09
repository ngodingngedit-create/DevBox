import { describe, it, expect } from 'vitest';
import { urlEncode, urlDecode } from './logic';

describe('url tool logic', () => {
  it('encodes and decodes component mode', () => {
    const raw = 'https://example.com/search?q=hello world&filter=true';
    const enc = urlEncode(raw, true);
    expect(enc).toBe('https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26filter%3Dtrue');
    expect(urlDecode(enc, true)).toBe(raw);
  });

  it('encodes standard URI mode preserving uri symbols', () => {
    const raw = 'https://example.com/search?q=hello world';
    const enc = urlEncode(raw, false);
    expect(enc).toBe('https://example.com/search?q=hello%20world');
    expect(urlDecode(enc, false)).toBe(raw);
  });
});
