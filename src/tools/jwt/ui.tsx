import React, { useState } from 'react';
import type { ToolProps } from '../types';
import { decodeJwt } from './logic';
import { CopyButton } from '../../components/CopyButton';

export const JwtTool: React.FC<ToolProps> = ({ initialInput = '' }) => {
  const [token, setToken] = useState(initialInput);
  const result = decodeJwt(token);

  const headerStr = result.header ? JSON.stringify(result.header, null, 2) : '';
  const payloadStr = result.payload ? JSON.stringify(result.payload, null, 2) : '';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
        <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
          JWT Token Inspector (Client-Side Only)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setToken('')}
            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white transition"
          >
            Clear
          </button>
          <CopyButton text={payloadStr} label="Copy Payload" />
        </div>
      </div>

      <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
        <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400">
          RAW TOKEN
        </div>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste JWT token (header.payload.signature)..."
          rows={3}
          className="p-3 bg-transparent text-neutral-200 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          spellCheck={false}
        />
      </div>

      {result.valid && result.claimsInfo && (
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <h3 className="text-xs uppercase font-mono tracking-wider text-neutral-400 mb-3">Claims Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {result.claimsInfo.expiresAt && (
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block mb-1">Status (exp)</span>
                <span
                  className={`font-semibold inline-block px-1.5 py-0.5 rounded text-[11px] ${
                    result.claimsInfo.expiresAt.isExpired
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {result.claimsInfo.expiresAt.isExpired ? 'EXPIRED' : 'ACTIVE'}
                </span>
                <div className="mt-1 text-neutral-400 text-[11px] font-mono">
                  {result.claimsInfo.expiresAt.dateStr}
                </div>
              </div>
            )}
            {result.claimsInfo.issuedAt && (
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block mb-1">Issued At (iat)</span>
                <div className="text-neutral-300 font-mono text-[11px]">
                  {result.claimsInfo.issuedAt.dateStr}
                </div>
              </div>
            )}
            {result.claimsInfo.issuer && (
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block mb-1">Issuer (iss)</span>
                <span className="text-neutral-200 font-mono text-[11px]">{result.claimsInfo.issuer}</span>
              </div>
            )}
            {result.claimsInfo.subject && (
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block mb-1">Subject (sub)</span>
                <span className="text-neutral-200 font-mono text-[11px]">{result.claimsInfo.subject}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {token.trim() && !result.valid && (
        <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-lg text-xs text-red-400 font-mono">
          {result.error || 'Invalid JWT structure'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden h-[300px]">
          <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between">
            <span>HEADER</span>
            <CopyButton text={headerStr} label="Copy" />
          </div>
          <pre className="flex-1 p-3 bg-neutral-950/40 text-neutral-200 font-mono text-xs overflow-auto">
            {headerStr || '// Header decoded will appear here'}
          </pre>
        </div>

        <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden h-[300px]">
          <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between">
            <span>PAYLOAD</span>
            <CopyButton text={payloadStr} label="Copy" />
          </div>
          <pre className="flex-1 p-3 bg-neutral-950/40 text-neutral-200 font-mono text-xs overflow-auto">
            {payloadStr || '// Payload decoded will appear here'}
          </pre>
        </div>
      </div>

      {result.signature && (
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
          <span className="text-neutral-400 block mb-1 font-mono">SIGNATURE (Raw unverified):</span>
          <p className="font-mono text-neutral-300 break-all bg-neutral-950 p-2 rounded border border-neutral-800">
            {result.signature}
          </p>
        </div>
      )}
    </div>
  );
};
