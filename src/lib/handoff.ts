export interface InMemHandoffPayload {
  toolId: string;
  type: 'image' | 'file';
  name?: string;
  mime?: string;
  dataUri?: string;
  base64?: string;
  bytes?: Uint8Array;
}

let memoryPayload: InMemHandoffPayload | null = null;

export function setHandoffPayload(payload: InMemHandoffPayload | null): void {
  memoryPayload = payload;
}

export function consumeHandoffPayload(expectedToolId?: string): InMemHandoffPayload | null {
  if (!memoryPayload) return null;
  if (expectedToolId && memoryPayload.toolId !== expectedToolId) {
    return null;
  }
  const payload = memoryPayload;
  memoryPayload = null;
  return payload;
}

export function peekHandoffPayload(): InMemHandoffPayload | null {
  return memoryPayload;
}
