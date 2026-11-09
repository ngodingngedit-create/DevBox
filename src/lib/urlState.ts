import LZString from 'lz-string';

export function compressToHash(data: string): string {
  return LZString.compressToEncodedURIComponent(data);
}

export function decompressFromHash(compressed: string): string {
  try {
    const result = LZString.decompressFromEncodedURIComponent(compressed);
    return result ?? '';
  } catch {
    return '';
  }
}

export function getShareUrl(toolId: string, state: string): string {
  const compressed = compressToHash(state);
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/t/${toolId}?d=${compressed}`;
}
