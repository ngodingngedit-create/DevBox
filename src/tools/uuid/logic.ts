export function generateUuids(count: number, uppercase = false): string[] {
  const safeCount = Math.min(Math.max(1, count), 100);
  const result: string[] = [];
  for (let i = 0; i < safeCount; i++) {
    const uuid = crypto.randomUUID();
    result.push(uppercase ? uuid.toUpperCase() : uuid.toLowerCase());
  }
  return result;
}

export function validateUuid(input: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(input.trim());
}
