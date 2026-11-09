export function base64Encode(input: string): string {
  try {
    const bytes = new TextEncoder().encode(input);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binString);
  } catch (err) {
    throw new Error(`Base64 encode failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function base64Decode(input: string): string {
  try {
    const clean = input.trim().replace(/\s+/g, '');
    const binString = atob(clean);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (err) {
    throw new Error(`Base64 decode failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
