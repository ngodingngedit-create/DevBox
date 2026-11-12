import React, { useState, useEffect } from 'react';
import type { ToolProps } from '../types';
import { computeHashes, computeHashesFromBytes, type HashOutputs } from './logic';
import { CopyButton } from '../../components/CopyButton';
import { Dropzone } from '../../components/Dropzone';
import { FileText, File as FileIcon } from 'lucide-react';

export const HashTool: React.FC<ToolProps> = ({ initialInput = '' }) => {
  const [sourceType, setSourceType] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState(initialInput);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [uppercase, setUppercase] = useState(false);
  const [hashes, setHashes] = useState<HashOutputs>({ md5: '', sha1: '', sha256: '' });

  useEffect(() => {
    let active = true;
    if (sourceType === 'text') {
      computeHashes(textInput, uppercase).then((res) => {
        if (active) setHashes(res);
      });
    } else if (sourceType === 'file' && fileBytes) {
      computeHashesFromBytes(fileBytes, uppercase).then((res) => {
        if (active) setHashes(res);
      });
    } else {
      setHashes({ md5: '', sha1: '', sha256: '' });
    }
    return () => {
      active = false;
    };
  }, [sourceType, textInput, fileBytes, uppercase]);

  const handleFile = async (file: File) => {
    setFileInfo({ name: file.name, size: file.size });
    const buffer = await file.arrayBuffer();
    setFileBytes(new Uint8Array(buffer));
  };

  const copyAllText = `MD5: ${hashes.md5}\nSHA-1: ${hashes.sha1}\nSHA-256: ${hashes.sha256}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-neutral-950 p-1 border border-neutral-800 text-xs">
            <button
              onClick={() => setSourceType('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                sourceType === 'text'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text Input</span>
            </button>
            <button
              onClick={() => setSourceType('file')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                sourceType === 'file'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileIcon className="w-3.5 h-3.5" />
              <span>File Hashing</span>
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded bg-neutral-950 border-neutral-700 text-blue-500 focus:ring-0"
            />
            Uppercase
          </label>
        </div>

        <div className="flex items-center gap-2">
          {sourceType === 'text' ? (
            <button
              onClick={() => setTextInput('')}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white transition"
            >
              Clear
            </button>
          ) : (
            <button
              onClick={() => {
                setFileInfo(null);
                setFileBytes(null);
              }}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white transition"
            >
              Clear File
            </button>
          )}
          <CopyButton text={copyAllText} label="Copy All Hashes" />
        </div>
      </div>

      {sourceType === 'text' ? (
        <div className="border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
          <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400">
            INPUT TEXT ({textInput.length} chars)
          </div>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type or paste text to compute hashes..."
            rows={4}
            className="w-full p-3 bg-transparent text-neutral-200 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Dropzone
            onFileSelected={handleFile}
            accept="*/*"
            title="Drop any file or image to calculate checksums"
            subtitle="Calculated 100% locally in browser memory"
          />
          {fileInfo && (
            <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs font-mono flex items-center justify-between text-neutral-300">
              <span>File: {fileInfo.name}</span>
              <span className="text-neutral-500">{(fileInfo.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono text-neutral-500 block">MD5 (128-bit)</span>
            <span className="text-xs font-mono text-neutral-200 break-all select-all block mt-0.5">
              {hashes.md5 || '—'}
            </span>
          </div>
          <CopyButton text={hashes.md5} label="Copy MD5" />
        </div>

        <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono text-neutral-500 block">SHA-1 (160-bit)</span>
            <span className="text-xs font-mono text-neutral-200 break-all select-all block mt-0.5">
              {hashes.sha1 || '—'}
            </span>
          </div>
          <CopyButton text={hashes.sha1} label="Copy SHA-1" />
        </div>

        <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono text-neutral-500 block">SHA-256 (256-bit)</span>
            <span className="text-xs font-mono text-neutral-200 break-all select-all block mt-0.5">
              {hashes.sha256 || '—'}
            </span>
          </div>
          <CopyButton text={hashes.sha256} label="Copy SHA-256" />
        </div>
      </div>
    </div>
  );
};
