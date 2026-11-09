export interface JsonFormatOptions {
  indent: 2 | 4 | 'minify';
  sortKeys?: boolean;
}

export interface JsonFormatResult {
  success: boolean;
  output: string;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
}

function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((acc: Record<string, unknown>, key: string) => {
        acc[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return obj;
}

function parseJsonError(errMessage: string, input: string): { line?: number; column?: number } {
  // Try matching "at position X"
  const posMatch = errMessage.match(/at position (\d+)/i) || errMessage.match(/column (\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    const lines = input.slice(0, pos).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { line, column };
  }
  // Try matching "line X column Y"
  const lineColMatch = errMessage.match(/line (\d+) column (\d+)/i);
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10),
    };
  }
  return {};
}

export function formatJson(input: string, options: JsonFormatOptions): JsonFormatResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: true, output: '' };
  }

  try {
    let parsed = JSON.parse(trimmed);
    if (options.sortKeys) {
      parsed = sortObjectKeys(parsed);
    }

    const space = options.indent === 'minify' ? undefined : options.indent;
    const output = JSON.stringify(parsed, null, space);
    return { success: true, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const { line, column } = parseJsonError(message, trimmed);
    return {
      success: false,
      output: '',
      error: { message, line, column },
    };
  }
}
