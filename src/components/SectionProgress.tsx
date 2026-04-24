'use client';

import type { Section } from '@/lib/timer/sectionTimer';

interface Props {
  sections: Section[];
  currentIndex: number;
  elapsed: number;
}

export default function SectionProgress({ sections, currentIndex, elapsed }: Props) {
  if (sections.length === 0) return null;

  return (
    <div className="w-full flex gap-1">
      {sections.map((s, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        const fill = isActive ? Math.min(elapsed / s.duration, 1) : isDone ? 1 : 0;
        const over = isActive && elapsed > s.duration;

        return (
          <div key={i} className="flex-1 min-w-0">
            <div className="text-xs text-zinc-500 mb-1 truncate">{s.name}</div>
            <div className="h-2 rounded bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-1000 ${
                  over ? 'bg-red-500' : isDone ? 'bg-zinc-500' : 'bg-blue-500'
                }`}
                style={{ width: `${fill * 100}%` }}
              />
            </div>
            {isActive && (
              <div className={`text-xs mt-1 ${over ? 'text-red-400' : 'text-zinc-400'}`}>
                {elapsed}s / {s.duration}s{over && ' ⚠'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
