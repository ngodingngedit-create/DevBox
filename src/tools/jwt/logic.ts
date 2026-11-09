export interface JwtDecoded {
  valid: boolean;
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  error?: string;
  claimsInfo?: {
    issuer?: string;
    subject?: string;
    audience?: string;
    expiresAt?: { timestamp: number; dateStr: string; isExpired: boolean };
    issuedAt?: { timestamp: number; dateStr: string };
    notBefore?: { timestamp: number; dateStr: string };
  };
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const bin = atob(base64);
  const bytes = Uint8Array.from(bin, (m) => m.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwt(token: string): JwtDecoded {
  const trimmed = token.trim();
  if (!trimmed) {
    return {
      valid: false,
      header: null,
      payload: null,
      signature: '',
      error: 'Empty token',
    };
  }

  const parts = trimmed.split('.');
  if (parts.length < 2 || parts.length > 3) {
    return {
      valid: false,
      header: null,
      payload: null,
      signature: '',
      error: 'JWT must have 2 or 3 dot-separated parts',
    };
  }

  let header: Record<string, unknown> | null = null;
  let payload: Record<string, unknown> | null = null;
  const signature = parts[2] || '';

  try {
    const headerStr = base64UrlDecode(parts[0]);
    header = JSON.parse(headerStr);
  } catch {
    return {
      valid: false,
      header: null,
      payload: null,
      signature,
      error: 'Invalid header segment',
    };
  }

  try {
    const payloadStr = base64UrlDecode(parts[1]);
    payload = JSON.parse(payloadStr);
  } catch {
    return {
      valid: false,
      header,
      payload: null,
      signature,
      error: 'Invalid payload segment',
    };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const claimsInfo: JwtDecoded['claimsInfo'] = {};

  if (payload && typeof payload === 'object') {
    if (typeof payload.iss === 'string') claimsInfo.issuer = payload.iss;
    if (typeof payload.sub === 'string') claimsInfo.subject = payload.sub;
    if (typeof payload.aud === 'string') claimsInfo.audience = payload.aud;

    if (typeof payload.exp === 'number') {
      claimsInfo.expiresAt = {
        timestamp: payload.exp,
        dateStr: new Date(payload.exp * 1000).toISOString(),
        isExpired: payload.exp < nowSec,
      };
    }
    if (typeof payload.iat === 'number') {
      claimsInfo.issuedAt = {
        timestamp: payload.iat,
        dateStr: new Date(payload.iat * 1000).toISOString(),
      };
    }
    if (typeof payload.nbf === 'number') {
      claimsInfo.notBefore = {
        timestamp: payload.nbf,
        dateStr: new Date(payload.nbf * 1000).toISOString(),
      };
    }
  }

  return {
    valid: true,
    header,
    payload,
    signature,
    claimsInfo,
  };
}
