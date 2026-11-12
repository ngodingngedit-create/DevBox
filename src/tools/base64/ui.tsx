import React, { useState, useEffect } from 'react';
import type { ToolProps } from '../types';
import {
  base64EncodeText,
  base64DecodeText,
  decodeImageInput,
  encodeImageFile,
  type ImageDecodeResult,
} from './logic';
import { Dropzone } from '../../components/Dropzone';
import { CopyButton } from '../../components/CopyButton';
import { consumeHandoffPayload } from '../../lib/handoff';
import { Download, AlertTriangle, ArrowLeftRight, FileText, Image as ImageIcon } from 'lucide-react';

export const Base64Tool: React.FC<ToolProps> = ({ initialInput = '' }) => {
  // Check if input looks like an image or data uri, or handoff
  const [activeTab, setActiveTab] = useState<'text' | 'image'>(() => {
    if (initialInput.startsWith('data:image/') || initialInput.length > 500) {
      return 'image';
    }
    return 'text';
  });

  // TEXT MODE STATE
  const [textMode, setTextMode] = useState<'encode' | 'decode'>('decode');
  const [textInput, setTextInput] = useState(initialInput);

  // IMAGE MODE STATE
  const [imageDirection, setImageDirection] = useState<'file-to-b64' | 'b64-to-image'>('file-to-b64');
  const [imageResult, setImageResult] = useState<ImageDecodeResult | null>(null);
  const [b64ImageInput, setB64ImageInput] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const [inMemoryInfo, setInMemoryInfo] = useState(false);

  // Check in-memory handoff payload on mount
  useEffect(() => {
    const handoff = consumeHandoffPayload('base64');
    if (handoff) {
      setActiveTab('image');
      setInMemoryInfo(true);
      if (handoff.dataUri && handoff.bytes) {
        try {
          const res = decodeImageInput(handoff.dataUri);
          setImageResult(res);
          setImageDirection('file-to-b64');
        } catch (e) {
          setImageError(e instanceof Error ? e.message : String(e));
        }
      }
    } else if (initialInput) {
      if (initialInput.startsWith('data:image/')) {
        setActiveTab('image');
        setImageDirection('b64-to-image');
        setB64ImageInput(initialInput);
        try {
          const res = decodeImageInput(initialInput);
          setImageResult(res);
        } catch (e) {
          setImageError(e instanceof Error ? e.message : String(e));
        }
      }
    }
  }, [initialInput]);

  // Handle Text Mode Output
  let textOutput = '';
  let textError: string | null = null;
  if (textInput.trim()) {
    try {
      textOutput = textMode === 'encode' ? base64EncodeText(textInput) : base64DecodeText(textInput);
    } catch (err) {
      textError = err instanceof Error ? err.message : String(err);
    }
  }

  // Handle Image File Input
  const handleImageFile = async (file: File) => {
    setImageError(null);
    setSizeWarning(null);
    if (file.size > 5 * 1024 * 1024) {
      setSizeWarning(`File is ${(file.size / (1024 * 1024)).toFixed(1)} MB (large image might slow browser rendering).`);
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const res = encodeImageFile(file, bytes);

      // Measure dimensions
      const img = new Image();
      img.onload = () => {
        setImageResult({
          ...res,
          metadata: {
            ...res.metadata,
            width: img.width,
            height: img.height,
          },
        });
      };
      img.src = res.dataUri;
      setImageResult(res);
      setImageDirection('file-to-b64');
      setInMemoryInfo(true);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : String(err));
    }
  };

  // Handle Base64 Text -> Image Output
  const handleB64ImageInputChange = (val: string) => {
    setB64ImageInput(val);
    setImageError(null);
    if (!val.trim()) {
      setImageResult(null);
      return;
    }
    try {
      const res = decodeImageInput(val);
      const img = new Image();
      img.onload = () => {
        setImageResult({
          ...res,
          metadata: {
            ...res.metadata,
            width: img.width,
            height: img.height,
          },
        });
      };
      img.src = res.dataUri;
      setImageResult(res);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : String(err));
      setImageResult(null);
    }
  };

  const handleDownload = () => {
    if (!imageResult) return;
    const a = document.createElement('a');
    a.href = imageResult.dataUri;
    const filename = imageResult.metadata.name || `devbox-image.${imageResult.metadata.extension}`;
    a.download = filename;
    a.click();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Switcher: Text vs Image */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-neutral-950 p-1 border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeTab === 'image'
                  ? 'bg-neutral-800 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image Mode</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeTab === 'text'
                  ? 'bg-neutral-800 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text Mode</span>
            </button>
          </div>

          {inMemoryInfo && activeTab === 'image' && (
            <span className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800">
              Image loaded in-memory (not in share link)
            </span>
          )}
        </div>

        {activeTab === 'image' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setImageDirection(imageDirection === 'file-to-b64' ? 'b64-to-image' : 'file-to-b64');
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-neutral-400 hover:text-white transition"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Switch Direction</span>
            </button>
            {imageResult && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono rounded transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {imageResult.metadata.extension.toUpperCase()}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (textOutput) {
                  setTextInput(textOutput);
                  setTextMode(textMode === 'encode' ? 'decode' : 'encode');
                }
              }}
              disabled={!textOutput}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white disabled:opacity-40"
            >
              Swap & Invert
            </button>
            <button
              onClick={() => setTextInput('')}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white transition"
            >
              Clear
            </button>
            <CopyButton text={textOutput} label="Copy Output" />
          </div>
        )}
      </div>

      {sizeWarning && (
        <div className="flex items-center gap-2 p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg text-xs text-amber-300 font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{sizeWarning}</span>
        </div>
      )}

      {/* TAB CONTENT: IMAGE MODE */}
      {activeTab === 'image' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LEFT COLUMN: INPUT */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  {imageDirection === 'file-to-b64' ? '1. Upload or Paste Image' : '1. Paste Base64 or Data URI'}
                </span>
              </div>

              {imageDirection === 'file-to-b64' ? (
                <Dropzone onFileSelected={handleImageFile} />
              ) : (
                <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden h-[300px]">
                  <textarea
                    value={b64ImageInput}
                    onChange={(e) => handleB64ImageInputChange(e.target.value)}
                    placeholder="Paste Base64 or data:image/... string here..."
                    className="flex-1 p-3 bg-transparent text-neutral-200 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* RAW BASE64 OUTPUT IF DIRECTION IS FILE -> B64 */}
              {imageDirection === 'file-to-b64' && imageResult && (
                <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden mt-2">
                  <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between items-center">
                    <span>BASE64 STRING</span>
                    <div className="flex gap-2">
                      <CopyButton text={imageResult.dataUri} label="Copy Data URI" />
                      <CopyButton text={imageResult.rawBase64} label="Copy Raw B64" />
                    </div>
                  </div>
                  <textarea
                    readOnly
                    value={imageResult.dataUri}
                    rows={6}
                    className="p-3 bg-neutral-950/40 text-neutral-300 font-mono text-xs resize-none focus:outline-none select-all"
                  />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: PREVIEW & METADATA */}
            <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden min-h-[380px]">
              <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between items-center">
                <span>IMAGE PREVIEW & METADATA</span>
                {imageResult && (
                  <span className="text-[11px] text-emerald-400 font-sans">
                    {imageResult.metadata.mime}
                  </span>
                )}
              </div>

              {imageError ? (
                <div className="p-4 bg-red-950/20 text-red-400 text-xs font-mono flex-1">
                  <p className="font-semibold mb-1">Error Decoding Image</p>
                  <p>{imageError}</p>
                </div>
              ) : imageResult ? (
                <div className="flex-1 flex flex-col justify-between p-4 gap-4">
                  {/* Checkerboard Preview Container */}
                  <div className="flex-1 flex items-center justify-center min-h-[220px] rounded-lg border border-neutral-800 bg-[linear-gradient(45deg,#1f1f1f_25%,transparent_25%),linear-gradient(-45deg,#1f1f1f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f1f1f_75%),linear-gradient(-45deg,transparent_75%,#1f1f1f_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] bg-neutral-950 overflow-hidden p-3">
                    <img
                      src={imageResult.dataUri}
                      alt="Decoded Preview"
                      className="max-h-[280px] max-w-full object-contain rounded shadow-lg"
                    />
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">MIME TYPE</span>
                      <span className="text-neutral-200">{imageResult.metadata.mime}</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">FILE SIZE</span>
                      <span className="text-neutral-200">
                        {(imageResult.metadata.byteSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">DIMENSIONS</span>
                      <span className="text-neutral-200">
                        {imageResult.metadata.width ? `${imageResult.metadata.width} × ${imageResult.metadata.height} px` : '—'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">FORMAT</span>
                      <span className="text-neutral-200 font-bold uppercase">
                        .{imageResult.metadata.extension}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-500 font-mono text-xs text-center">
                  <ImageIcon className="w-8 h-8 opacity-40 mb-2" />
                  <span>No image loaded. Upload a file or paste Base64 to preview.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TEXT MODE */}
      {activeTab === 'text' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Text Mode:</span>
            <div className="inline-flex rounded-md bg-neutral-950 p-1 border border-neutral-800 text-xs">
              <button
                onClick={() => setTextMode('decode')}
                className={`px-3 py-1 rounded ${textMode === 'decode' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
              >
                Decode
              </button>
              <button
                onClick={() => setTextMode('encode')}
                className={`px-3 py-1 rounded ${textMode === 'encode' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
              >
                Encode
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[420px]">
            <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
              <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between">
                <span>INPUT ({textMode === 'encode' ? 'PLAIN TEXT' : 'BASE64'})</span>
                <span>{textInput.length} chars</span>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={textMode === 'encode' ? 'Enter text to encode...' : 'Paste base64 to decode...'}
                className="flex-1 p-3 bg-transparent text-neutral-200 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
              <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400 flex justify-between items-center">
                <span>OUTPUT ({textMode === 'encode' ? 'BASE64' : 'PLAIN TEXT'})</span>
                {textError && <span className="text-red-400 font-sans">Error</span>}
              </div>
              {textError ? (
                <div className="p-4 bg-red-950/20 text-red-400 text-xs font-mono overflow-auto flex-1">
                  <p className="font-semibold mb-2">Conversion Error</p>
                  <p>{textError}</p>
                </div>
              ) : (
                <textarea
                  readOnly
                  value={textOutput}
                  placeholder="Result will appear here..."
                  className="flex-1 p-3 bg-neutral-950/40 text-neutral-200 font-mono text-xs resize-none focus:outline-none"
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
