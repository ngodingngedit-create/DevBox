import React, { useState, useEffect } from 'react';
import type { ToolProps } from '../types';
import { computeHashes, type HashOutputs } from './logic';
import { CopyButton } from '../../components/CopyButton';

export const HashTool: React.FC<ToolProps> = ({ initialInput = '' }) => {
  const [input, setInput] = useState(initialInput);
  const [uppercase, setUppercase] = useState(false);
  const [hashes, setHashes] = useState<HashOutputs>({ md5: '', sha1: '', sha256: '' });

  useEffect(() => {
    let active = true;
    computeHashes(input, uppercase).then((res) => {
      if (active) setHashes(res);
    });
    return () => {
      active = false;
    };
  }, [input, uppercase]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
        <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="rounded bg-neutral-950 border-neutral-700 text-blue-500 focus:ring-0"
          />
          Uppercase hash output
        </label>
        <button
          onClick={() => setInput('')}
          className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white transition"
        >
          Clear
        </button>
      </div>

      <div className="border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
        <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400">
          INPUT TEXT
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste text to compute hashes..."
          rows={4}
          className="w-full p-3 bg-transparent text-neutral-200 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono text-neutral-500 block">MD5 (128-bit)</span>
            <span className="text-xs font-mono text-neutral-200 break-all select-all block mt-0.5">
              {hashes.md5 || '—'}
            </span>
          </div>
          <CopyButton text={hashes.md5} />
        </div>

        <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono text-neutral-500 block">SHA-1 (160-bit)</span>
            <span className="text-xs font-mono text-neutral-200 break-all select-all block mt-0.5">
              {hashes.sha1 || '—'}
            </span>
          </div>
          <CopyButton text={hashes.sha1} />
        </div>

        <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono text-neutral-500 block">SHA-256 (256-bit)</span>
            <span className="text-xs font-mono text-neutral-200 break-all select-all block mt-0.5">
              {hashes.sha256 || '—'}
            </span>
          </div>
          <CopyButton text={hashes.sha256} />
        </div>
      </div>
    </div>
  );
};
