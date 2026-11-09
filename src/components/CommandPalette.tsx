import { useState, useEffect, useRef } from 'react';
import { toolsRegistry } from '../tools/registry';
import type { Tool } from '../tools/types';
import { Search, X, ArrowRight } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (toolId: string) => void;
}

export function CommandPalette({ isOpen, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTools: Tool[] = toolsRegistry.filter((tool) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const matchesTitle = tool.title.toLowerCase().includes(q);
    const matchesDesc = tool.description.toLowerCase().includes(q);
    const matchesKeywords = tool.keywords.some((k) => k.toLowerCase().includes(q));
    return matchesTitle || matchesDesc || matchesKeywords;
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          onClose(); // toggle logic from parent
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredTools.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredTools[selectedIndex]) {
          onSelect(filteredTools[selectedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredTools, onClose, onSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-neutral-800">
          <Search className="w-4 h-4 text-neutral-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools by title, keyword, or function..."
            className="w-full py-3.5 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none font-sans"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-neutral-500 hover:text-neutral-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 bg-neutral-950 border border-neutral-800 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-neutral-500">
              No matching tools found.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredTools.map((tool, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onSelect(tool.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-neutral-800/80 text-white'
                        : 'text-neutral-300 hover:bg-neutral-800/40'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-2">
                        <span>{tool.title}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                        {tool.description}
                      </div>
                    </div>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-neutral-950/60 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-500 flex items-center justify-between">
          <span>Use ↑ ↓ to navigate</span>
          <span>↵ to select</span>
        </div>
      </div>
    </div>
  );
}
