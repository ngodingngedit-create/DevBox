import React, { useState } from 'react';
import type { ToolProps } from '../types';
import { base64Encode, base64Decode } from './logic';
import { CopyButton } from '../../components/CopyButton';

export const Base64Tool: React.FC<ToolProps> = ({ initialInput = '' }) => {
  const [mode, setMode] = useState<'encode' | 'decode'>('decode');
  const [input, setInput] = useState(initialInput);

  let output = '';
  let error: string | null = null;

  if (input.trim()) {
    try {
      output = mode === 'encode' ? base64Encode(input) : base64Decode(input);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Mode:</span>
          <div className="inline-flex rounded-md bg-neutral-950 p-1 border border-neutral-800 text-xs">
            <button
              onClick={() => setMode('decode')}
              className={`px-3 py-1 rounded ${mode === 'decode' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
            >
              Decode
            </button>
            <button
              onClick={() => setMode('encode')}
              className={`px-3 py-1 rounded ${mode === 'encode' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
            >
              Encode
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (output) {
                setInput(output);
                setMode(mode === 'encode' ? 'decode' : 'encode');
              }
            }}
            disabled={!output}
            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white disabled:opacity-40"
          >
            Swap & Invert
          </button>
          <button
            onClick={() => setInput('')}
            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white transition"
          >
            Clear
          </button>
          <CopyButton text={output} label="Copy Output" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[450px]">
        <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
          <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between">
            <span>INPUT ({mode === 'encode' ? 'PLAIN TEXT' : 'BASE64'})</span>
            <span>{input.length} chars</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Paste base64 to decode...'}
            className="flex-1 p-3 bg-transparent text-neutral-200 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
          <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between items-center">
            <span>OUTPUT ({mode === 'encode' ? 'BASE64' : 'PLAIN TEXT'})</span>
            {error && <span className="text-red-400 font-sans">Error</span>}
          </div>
          {error ? (
            <div className="p-4 bg-red-950/20 text-red-400 text-xs font-mono overflow-auto flex-1">
              <p className="font-semibold mb-2">Conversion Error</p>
              <p>{error}</p>
            </div>
          ) : (
            <textarea
              readOnly
              value={output}
              placeholder="Result will appear here..."
              className="flex-1 p-3 bg-neutral-950/40 text-neutral-200 font-mono text-xs resize-none focus:outline-none"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};
