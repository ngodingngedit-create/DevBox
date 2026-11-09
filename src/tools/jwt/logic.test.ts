import { describe, it, expect } from 'vitest';
import { decodeJwt } from './logic';

describe('decodeJwt', () => {
  it('decodes a valid jwt without signature verification', () => {
    // header: {"alg":"HS256","typ":"JWT"} -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    // payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":1516240000} -> eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDAwMDB9
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDAwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    const result = decodeJwt(token);
    expect(result.valid).toBe(true);
    expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(result.payload?.sub).toBe('1234567890');
    expect(result.payload?.name).toBe('John Doe');
    expect(result.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    expect(result.claimsInfo?.expiresAt?.isExpired).toBe(true);
    expect(result.claimsInfo?.subject).toBe('1234567890');
  });

  it('handles invalid token structure', () => {
    const res = decodeJwt('single-token-segment');
    expect(res.valid).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it('handles empty token', () => {
    const res = decodeJwt('');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Empty token');
  });
});
