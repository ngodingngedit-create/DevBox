import { useState, useEffect } from 'react';

export interface RouteState {
  path: string;
  toolId?: string;
  data?: string;
}

export function parseHash(hash: string): RouteState {
  const clean = hash.replace(/^#/, '');
  if (!clean || clean === '/') {
    return { path: '/' };
  }

  // format: /t/:toolId?d=:data
  const toolMatch = clean.match(/^\/t\/([^?]+)(?:\?d=(.*))?$/);
  if (toolMatch) {
    return {
      path: `/t/${toolMatch[1]}`,
      toolId: toolMatch[1],
      data: toolMatch[2] ? decodeURIComponent(toolMatch[2]) : undefined,
    };
  }

  return { path: clean };
}

export function useHashRoute() {
  const [route, setRoute] = useState<RouteState>(() => parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to.startsWith('#') ? to : `#${to}`;
  };

  return { route, navigate };
}
