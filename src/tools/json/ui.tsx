import React, { useState } from 'react';
import type { ToolProps } from '../types';
import { formatJson, type JsonFormatOptions } from './logic';
import { CopyButton } from '../../components/CopyButton';

export const JsonTool: React.FC<ToolProps> = ({ initialInput = '' }) => {
  const [input, setInput] = useState(initialInput);
  const [indent, setIndent] = useState<2 | 4 | 'minify'>(2);
  const [sortKeys, setSortKeys] = useState(false);

  const options: JsonFormatOptions = { indent, sortKeys };
  const result = formatJson(input, options);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Format:</span>
          <div className="inline-flex rounded-md bg-neutral-950 p-1 border border-neutral-800 text-xs">
            <button
              onClick={() => setIndent(2)}
              className={`px-3 py-1 rounded ${indent === 2 ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
            >
              2 Spaces
            </button>
            <button
              onClick={() => setIndent(4)}
              className={`px-3 py-1 rounded ${indent === 4 ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
            >
              4 Spaces
            </button>
            <button
              onClick={() => setIndent('minify')}
              className={`px-3 py-1 rounded ${indent === 'minify' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
            >
              Minify
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer ml-3">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
              className="rounded bg-neutral-950 border-neutral-700 text-blue-500 focus:ring-0"
            />
            Sort keys
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInput('')}
            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white transition"
          >
            Clear
          </button>
          <CopyButton text={result.output} label="Copy Output" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
        <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
          <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between">
            <span>INPUT JSON</span>
            <span>{input.length} chars</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON here..."
            className="flex-1 p-3 bg-transparent text-neutral-200 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
          <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between items-center">
            <span>OUTPUT</span>
            {result.error && (
              <span className="text-red-400 font-sans">
                Error{result.error.line ? ` at Line ${result.error.line}` : ''}
              </span>
            )}
          </div>
          {result.error ? (
            <div className="p-4 bg-red-950/20 text-red-400 text-xs font-mono overflow-auto flex-1">
              <p className="font-semibold mb-2">Invalid JSON</p>
              <p>{result.error.message}</p>
            </div>
          ) : (
            <textarea
              readOnly
              value={result.output}
              placeholder="Formatted output will appear here..."
              className="flex-1 p-3 bg-neutral-950/40 text-neutral-200 font-mono text-xs resize-none focus:outline-none"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};
