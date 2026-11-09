import React, { useState } from 'react';
import type { ToolProps } from '../types';
import { parseTimestampOrDate } from './logic';
import { CopyButton } from '../../components/CopyButton';

export const TimestampTool: React.FC<ToolProps> = ({ initialInput = '' }) => {
  const [input, setInput] = useState(initialInput || Math.floor(Date.now() / 1000).toString());
  const result = parseTimestampOrDate(input);

  const setNow = () => {
    setInput(Math.floor(Date.now() / 1000).toString());
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
        <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
          Epoch & Date Converter (Seconds & Milliseconds)
        </span>
        <button
          onClick={setNow}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-blue-600 text-white hover:bg-blue-500 transition"
        >
          Set to "Now"
        </button>
      </div>

      <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-lg">
        <label className="block text-xs font-mono text-neutral-400 mb-2">
          INPUT (UNIX Timestamp or ISO Date string)
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 1700000000 or 2023-11-14T22:13:20Z"
          className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-md text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {result.valid ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col justify-between gap-3">
            <div>
              <span className="text-xs text-neutral-500 font-mono block">UNIX TIMESTAMP (SECONDS)</span>
              <span className="text-lg font-mono text-white mt-1 block">{result.timestampSec}</span>
            </div>
            <CopyButton text={String(result.timestampSec)} />
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col justify-between gap-3">
            <div>
              <span className="text-xs text-neutral-500 font-mono block">UNIX TIMESTAMP (MILLISECONDS)</span>
              <span className="text-lg font-mono text-white mt-1 block">{result.timestampMs}</span>
            </div>
            <CopyButton text={String(result.timestampMs)} />
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col justify-between gap-3">
            <div>
              <span className="text-xs text-neutral-500 font-mono block">ISO 8601 (UTC)</span>
              <span className="text-sm font-mono text-white mt-1 block">{result.iso}</span>
            </div>
            <CopyButton text={result.iso || ''} />
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col justify-between gap-3">
            <div>
              <span className="text-xs text-neutral-500 font-mono block">UTC STRING</span>
              <span className="text-sm font-mono text-white mt-1 block">{result.utc}</span>
            </div>
            <CopyButton text={result.utc || ''} />
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col justify-between gap-3 md:col-span-2">
            <div>
              <span className="text-xs text-neutral-500 font-mono block">
                LOCAL TIME & RELATIVE ({result.relative})
              </span>
              <span className="text-sm font-mono text-white mt-1 block">{result.local}</span>
            </div>
            <CopyButton text={result.local || ''} />
          </div>
        </div>
      ) : (
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-lg text-xs text-red-400 font-mono">
          {result.error || 'Invalid timestamp or date format'}
        </div>
      )}
    </div>
  );
};
