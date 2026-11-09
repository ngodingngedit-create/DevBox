export function urlEncode(input: string, componentMode = true): string {
  if (!input) return '';
  return componentMode ? encodeURIComponent(input) : encodeURI(input);
}

export function urlDecode(input: string, componentMode = true): string {
  if (!input) return '';
  return componentMode ? decodeURIComponent(input) : decodeURI(input);
}
