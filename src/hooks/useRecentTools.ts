import { useState, useEffect } from 'react';

const RECENT_KEY = 'devbox_recent_tools';
const MAX_RECENT = 5;

export function useRecentTools() {
  const [recentToolIds, setRecentToolIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const recordToolUsage = (toolId: string) => {
    setRecentToolIds((prev) => {
      const filtered = prev.filter((id) => id !== toolId);
      const updated = [toolId, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) {
        setRecentToolIds(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  return { recentToolIds, recordToolUsage };
}
