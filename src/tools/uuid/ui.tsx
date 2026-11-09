import React, { useState } from 'react';
import type { ToolProps } from '../types';
import { generateUuids, validateUuid } from './logic';
import { CopyButton } from '../../components/CopyButton';

export const UuidTool: React.FC<ToolProps> = ({ initialInput = '' }) => {
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [uuids, setUuids] = useState<string[]>(() => generateUuids(1));
  const [testInput, setTestInput] = useState(initialInput);

  const handleGenerate = () => {
    setUuids(generateUuids(count, uppercase));
  };

  const allUuidsText = uuids.join('\n');
  const isValidTest = testInput.trim() ? validateUuid(testInput) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-mono">Count:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
              className="w-16 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-mono"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded bg-neutral-950 border-neutral-700 text-blue-500 focus:ring-0"
            />
            Uppercase
          </label>

          <button
            onClick={handleGenerate}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono font-medium transition"
          >
            Generate
          </button>
        </div>

        <CopyButton text={allUuidsText} label="Copy All UUIDs" />
      </div>

      <div className="border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
        <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between">
          <span>GENERATED UUIDs (v4)</span>
          <span>{uuids.length} item(s)</span>
        </div>
        <div className="p-4 flex flex-col gap-2 font-mono text-xs max-h-[350px] overflow-auto">
          {uuids.map((id, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded bg-neutral-950/60 border border-neutral-900 hover:border-neutral-800 transition"
            >
              <span className="text-neutral-200 select-all">{id}</span>
              <CopyButton text={id} label="Copy" className="text-[10px] px-2 py-1" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-neutral-900/40 border border-neutral-800 rounded-lg">
        <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2">
          UUID Validator
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Paste a UUID to validate..."
            className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {isValidTest !== null && (
          <div className="mt-2 text-xs font-mono">
            {isValidTest ? (
              <span className="text-emerald-400">✓ Valid UUID format</span>
            ) : (
              <span className="text-red-400">✕ Invalid UUID format</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
