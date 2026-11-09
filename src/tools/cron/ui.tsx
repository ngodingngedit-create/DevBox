import React, { useState } from 'react';
import type { ToolProps } from '../types';
import { explainCron } from './logic';
import { CopyButton } from '../../components/CopyButton';

export const CronTool: React.FC<ToolProps> = ({ initialInput = '' }) => {
  const [expression, setExpression] = useState(initialInput || '*/15 * * * *');
  const result = explainCron(expression);

  const presets = [
    { label: 'Every 5 min', expr: '*/5 * * * *' },
    { label: 'Every hour', expr: '0 * * * *' },
    { label: 'Daily at midnight', expr: '0 0 * * *' },
    { label: 'Every Monday 9 AM', expr: '0 9 * * 1' },
    { label: '1st of every month', expr: '0 0 1 * *' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
          Cron Expression Explainer & Schedule
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-neutral-500 font-mono">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setExpression(p.expr)}
              className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-[11px] font-mono text-neutral-300 rounded transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-neutral-800 rounded-lg bg-neutral-900/60 p-4">
        <label className="block text-xs font-mono text-neutral-400 mb-2">
          CRON EXPRESSION (5 or 6 fields: min, hour, day, month, weekday)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="e.g. */15 * * * *"
            className="flex-1 p-3 bg-neutral-950 border border-neutral-800 rounded-md text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <CopyButton text={expression} label="Copy" />
        </div>
      </div>

      {result.valid ? (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-lg">
            <span className="text-xs font-mono text-blue-400 uppercase tracking-wider block mb-1">
              Human Description
            </span>
            <p className="text-base text-neutral-100 font-medium">“{result.description}”</p>
            <span className="text-[11px] text-neutral-500 font-mono mt-2 block">
              Assumed Timezone: {result.assumedTimezone}
            </span>
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-lg">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider block mb-3">
              Next 5 Execution Schedules (Calculated in-browser)
            </span>
            <div className="flex flex-col gap-2 font-mono text-xs">
              {result.nextDates.map((dateStr, idx) => {
                const dateObj = new Date(dateStr);
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500 w-4">#{idx + 1}</span>
                      <span className="text-neutral-200">{dateObj.toLocaleString()}</span>
                    </div>
                    <span className="text-neutral-500 text-[11px]">{dateStr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-lg text-xs text-red-400 font-mono">
          {result.error || 'Invalid cron expression'}
        </div>
      )}
    </div>
  );
};
