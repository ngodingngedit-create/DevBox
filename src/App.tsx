import { useState, useTransition, useEffect } from 'react';
import { useHashRoute } from './hooks/useHashRoute';
import { useTheme } from './hooks/useTheme';
import { useRecentTools } from './hooks/useRecentTools';
import { toolsRegistry, getToolById } from './tools/registry';
import { decompressFromHash, compressToHash, getShareUrl } from './lib/urlState';
import { setHandoffPayload } from './lib/handoff';
import { encodeImageFile } from './tools/base64/logic';
import { runDetectionPipeline, type DetectionResult } from './detectors';
import { CommandPalette } from './components/CommandPalette';
import {
  Shield,
  Sparkles,
  Share2,
  ArrowLeft,
  Undo2,
  ArrowRight,
  Sun,
  Moon,
  Search,
  History,
  Copy,
} from 'lucide-react';

export function App() {
  const { route, navigate } = useHashRoute();
  const { theme, toggleTheme } = useTheme();
  const { recentToolIds, recordToolUsage } = useRecentTools();
  const [, startTransition] = useTransition();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [candidates, setCandidates] = useState<DetectionResult[]>([]);
  const [toastMessage, setToastMessage] = useState<{ message: string; originalInput?: string } | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [dismissSensitiveBanner, setDismissSensitiveBanner] = useState(false);
  const [inlineColor, setInlineColor] = useState<string | null>(null);

  const activeTool = route.toolId ? getToolById(route.toolId) : undefined;
  const initialData = route.data ? decompressFromHash(route.data) : undefined;

  useEffect(() => {
    if (route.toolId) {
      recordToolUsage(route.toolId);
    }
  }, [route.toolId]);

  // Global keybinding for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle routing an image file (from clipboard paste or drop)
  const routeImageFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const encoded = encodeImageFile(file, bytes);

    // Save in-memory handoff so URL does not explode
    setHandoffPayload({
      toolId: 'base64',
      type: 'image',
      name: file.name,
      mime: encoded.metadata.mime,
      dataUri: encoded.dataUri,
      base64: encoded.rawBase64,
      bytes,
    });

    startTransition(() => {
      navigate('/t/base64');
      setToastMessage({
        message: 'Detected image — opened Base64 (Image mode)',
      });
    });
  };

  // Smart Paste Text Handler
  const handlePasteOrInputChange = (text: string) => {
    setPastedText(text);
    setInlineColor(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setCandidates([]);
      return;
    }

    const detections = runDetectionPipeline(trimmed);
    if (detections.length === 0) {
      setCandidates([]);
      return;
    }

    const top = detections[0];
    const second = detections[1];

    // Special case: Hex color (not a tool yet in v1) -> show inline swatch per doc
    if (top.toolId === 'hex-color') {
      setInlineColor(top.meta?.colorHex || trimmed);
      setCandidates([]);
      return;
    }

    // High confidence (>0.9) and unambiguous
    const isUnambiguous = !second || (top.confidence >= 0.9 && top.confidence - second.confidence >= 0.15);

    if (isUnambiguous) {
      // If text <= 50 KB, encode to URL hash, otherwise keep in-memory handoff
      const isUnder50Kb = new TextEncoder().encode(trimmed).byteLength <= 50 * 1024;
      if (isUnder50Kb) {
        const compressed = compressToHash(trimmed);
        startTransition(() => {
          navigate(`/t/${top.toolId}?d=${compressed}`);
          setToastMessage({
            message: `Detected ${top.name} — opened automatically`,
            originalInput: trimmed,
          });
        });
      } else {
        // In-memory handoff for large text payload
        setHandoffPayload({
          toolId: top.toolId,
          type: 'file',
          dataUri: trimmed,
        });
        startTransition(() => {
          navigate(`/t/${top.toolId}`);
          setToastMessage({
            message: `Detected ${top.name} (large payload loaded in-memory)`,
            originalInput: trimmed,
          });
        });
      }
    } else {
      // Ambiguous: show suggestion chips
      setCandidates(detections);
    }
  };

  const handleUndo = () => {
    if (toastMessage?.originalInput) {
      setPastedText(toastMessage.originalInput);
    }
    navigate('/');
    setToastMessage(null);
  };

  const handleShare = () => {
    if (!activeTool) return;
    const url = getShareUrl(activeTool.id, initialData || '');
    navigator.clipboard.writeText(url);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  const recentTools = recentToolIds
    .map((id) => getToolById(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
    }`}>
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={(toolId) => {
          setPaletteOpen(false);
          navigate(`/t/${toolId}`);
        }}
      />

      <header className={`border-b sticky top-0 z-20 backdrop-blur ${
        theme === 'dark' ? 'border-neutral-800 bg-neutral-950/80' : 'border-neutral-200 bg-white/80'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 font-mono font-bold tracking-tight hover:opacity-80 transition"
            >
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs text-white">
                ⚡
              </div>
              <span className={theme === 'dark' ? 'text-white' : 'text-neutral-900'}>DevBox</span>
            </button>
            <span className={theme === 'dark' ? 'text-neutral-600' : 'text-neutral-400'}>/</span>
            <span className={`text-xs font-mono ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {activeTool ? activeTool.title : 'Toolbox'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              theme === 'dark'
                ? 'bg-emerald-950/50 border-emerald-800/40 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <Shield className="w-3 h-3" />
              <span>100% client-side — your data never leaves the browser.</span>
            </div>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className={`flex items-center gap-2 px-2.5 py-1.5 text-xs font-mono rounded border transition ${
                theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
              }`}
              title="Command Palette"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="text-[10px] px-1 bg-black/10 dark:bg-white/10 rounded">⌘K</kbd>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={`p-1.5 rounded border transition ${
                theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
              }`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {activeTool && (
              <button
                type="button"
                onClick={handleShare}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition ${
                  theme === 'dark'
                    ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-200'
                    : 'bg-neutral-100 border-neutral-200 hover:bg-neutral-200 text-neutral-800'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share URL</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {route.data && !dismissSensitiveBanner && (
        <div className={`border-b px-4 py-2 text-xs flex items-center justify-between ${
          theme === 'dark'
            ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>This link contains pasted data — don't share it if it's sensitive.</span>
          </div>
          <button
            onClick={() => setDismissSensitiveBanner(true)}
            className="hover:opacity-75 text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs px-4 py-3 rounded-lg shadow-2xl font-mono flex items-center gap-3">
          <span>⚡ {toastMessage.message}</span>
          <button
            onClick={handleUndo}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] transition"
          >
            <Undo2 className="w-3 h-3" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs px-4 py-2 rounded-lg shadow-xl font-mono flex items-center gap-2">
          <span>✓</span>
          <span>Share link copied to clipboard!</span>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {activeTool ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <button
                  onClick={() => navigate('/')}
                  className={`inline-flex items-center gap-1.5 text-xs mb-2 transition ${
                    theme === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Tools
                </button>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  {activeTool.title}
                </h1>
                <p className={`text-xs md:text-sm mt-1 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {activeTool.description}
                </p>
              </div>
            </div>

            <activeTool.component initialInput={initialData} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 md:py-14 text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4 font-mono border ${
              theme === 'dark'
                ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
                : 'bg-neutral-100 border-neutral-200 text-neutral-600'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>100% Client-Side Developer Toolbox</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl">
              Paste anything, get the right tool instantly.
            </h1>
            <p className={`text-sm md:text-base mt-3 max-w-xl ${
              theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              Auto-detects JSON, JWT, Base64 images/text, Cron, Timestamp, UUID, Hashes, and URLs.
            </p>

            <div className="w-full max-w-2xl mt-8 flex flex-col gap-3">
              <textarea
                rows={4}
                value={pastedText}
                onChange={(e) => handlePasteOrInputChange(e.target.value)}
                onPaste={(e) => {
                  // Check if paste event contains image files
                  if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                    const file = e.clipboardData.files[0];
                    if (file.type.startsWith('image/')) {
                      e.preventDefault();
                      routeImageFile(file);
                      return;
                    }
                  }
                  const pasted = e.clipboardData.getData('text');
                  if (pasted) {
                    handlePasteOrInputChange(pasted);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                      routeImageFile(file);
                    }
                  }
                }}
                placeholder="Paste anything — JSON, JWT, Base64, cron, timestamp, or drop an image..."
                className={`w-full p-4 rounded-xl font-mono text-sm focus:outline-none transition resize-none shadow-xl border ${
                  theme === 'dark'
                    ? 'bg-neutral-900/90 border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:border-neutral-600'
                    : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-blue-400'
                }`}
              />

              {/* Inline Hex Color Swatch */}
              {inlineColor && (
                <div className={`p-3 rounded-lg flex items-center justify-between border ${
                  theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md border border-black/20 shadow-inner"
                      style={{ backgroundColor: inlineColor }}
                    />
                    <div>
                      <span className="text-xs font-mono font-semibold block">{inlineColor}</span>
                      <span className="text-[11px] opacity-60">Detected Hex Color (Color picker coming in v2)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(inlineColor)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 text-neutral-200 text-xs font-mono"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
              )}

              {/* Candidate Chips for Ambiguous Detection */}
              {candidates.length > 0 && (
                <div className={`p-3 rounded-lg text-left flex flex-col gap-2 border ${
                  theme === 'dark' ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
                }`}>
                  <span className="text-[11px] font-mono opacity-60 uppercase tracking-wider">
                    Ambiguous matches detected — Select target tool:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {candidates.map((cand, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const compressed = compressToHash(pastedText.trim());
                          navigate(`/t/${cand.toolId}?d=${compressed}`);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border transition ${
                          theme === 'dark'
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                            : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300'
                        }`}
                      >
                        <span>{cand.name}</span>
                        <span className="opacity-50 text-[10px]">({Math.round(cand.confidence * 100)}%)</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {recentTools.length > 0 && (
              <div className="mt-10 w-full text-left">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider opacity-50 font-mono mb-3">
                  <History className="w-3.5 h-3.5" />
                  <span>Recent Tools</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentTools.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/t/${t.id}`)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition ${
                        theme === 'dark'
                          ? 'bg-neutral-900/70 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                          : 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 w-full text-left">
              <h2 className="text-xs uppercase tracking-wider opacity-50 font-mono mb-4">
                All 8 Developer Tools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {toolsRegistry.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => navigate(`/t/${tool.id}`)}
                    className={`p-4 rounded-xl border text-left transition flex flex-col justify-between group h-full ${
                      theme === 'dark'
                        ? 'border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900 hover:border-neutral-700'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center justify-between text-sm">
                        <span>{tool.title}</span>
                        <span className="opacity-40 group-hover:opacity-100 text-xs font-mono transition">→</span>
                      </div>
                      <p className={`text-xs mt-2 line-clamp-3 leading-relaxed ${
                        theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'
                      }`}>
                        {tool.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={`border-t py-6 text-center text-xs font-mono opacity-60 ${
        theme === 'dark' ? 'border-neutral-900' : 'border-neutral-200'
      }`}>
        DevBox • 100% Client-Side • Zero Network Egress
      </footer>
    </div>
  );
}

export default App;
