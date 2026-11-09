export interface AssistantResult {
  message: string;
}

/**
 * Placeholder hook for future AI assistant integration.
 * No AI implementation in v1.
 */
export function useAssistant() {
  return {
    isAvailable: false,
    query: async (_prompt: string): Promise<AssistantResult> => {
      return { message: '' };
    },
  };
}
