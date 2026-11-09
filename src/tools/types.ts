import React from 'react';

export interface ToolProps {
  initialInput?: string;
  onShare?: () => void;
}

export interface Tool {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  detect?(input: string): number;
  component: React.FC<ToolProps>;
}
