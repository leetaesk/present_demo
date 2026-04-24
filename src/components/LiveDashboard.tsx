'use client';

import { useLiveStore } from '@/store/liveStore';
import SectionProgress from './SectionProgress';
import type { Section } from '@/lib/timer/sectionTimer';

interface Props {
  sections: Section[];
  onStop: () => void;
  onNextSection: () => void;
}

export default function LiveDashboard({ sections, onStop, onNextSection }: Props) {
  const fillerCounts = useLiveStore((s) => s.fillerCounts);
  const speedHistory = useLiveStore((s) => s.speedHistory);
  const pauseCount = useLiveStore((s) => s.pauseCount);
  const sectionIndex = useLiveStore((s) => s.sectionIndex);
  const sectionElapsed = useLiveStore((s) => s.sectionElapsed);

  const totalFillers = Object.values(fillerCounts).reduce((a, b) => a + b, 0);
  const lastSpeed = speedHistory.at(-1) ?? null;
  const speedColor =
    lastSpeed == null
      ? 'text-zinc-500'
      : lastSpeed > 6
      ? 'text-red-400'
      : lastSpeed < 4
      ? 'text-blue-400'
      : 'text-green-400';

  const currentSection = sections[sectionIndex];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 gap-6">

      {/* 섹션 진행 */}
      {sections.length > 0 && (
        <SectionProgress
          sections={sections}
          currentIndex={sectionIndex}
          elapsed={sectionElapsed}
        />
      )}

      {/* 현재 섹션 이름 */}
      <div className="text-center">
        <div className="text-zinc-500 text-sm">현재 섹션</div>
        <div className="text-4xl font-bold mt-1">
          {currentSection?.name ?? '—'}
        </div>
      </div>

      {/* 핵심 지표 3종 */}
      <div className="grid grid-cols-3 gap-4 flex-1">
        <Metric
          label="속도"
          value={lastSpeed != null ? `${lastSpeed.toFixed(1)}` : '—'}
          unit="음절/초"
          valueClass={speedColor}
          sub={lastSpeed != null ? (lastSpeed > 6 ? '빠름' : lastSpeed < 4 ? '느림' : '적정') : ''}
        />
        <Metric
          label="필러"
          value={String(totalFillers)}
          unit="회"
          valueClass={totalFillers > 0 ? 'text-orange-400' : 'text-zinc-400'}
        />
        <Metric
          label="침묵"
          value={String(pauseCount)}
          unit="회"
          valueClass={pauseCount > 0 ? 'text-yellow-400' : 'text-zinc-400'}
        />
      </div>

      {/* 필러 상세 */}
      {Object.keys(fillerCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(fillerCounts).map(([word, count]) => (
            <span
              key={word}
              className="px-2 py-1 rounded bg-orange-900/40 text-orange-300 text-sm"
            >
              &ldquo;{word}&rdquo; {count}
            </span>
          ))}
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-4 justify-center pb-4">
        {sections.length > 1 && sectionIndex < sections.length - 1 && (
          <button
            onClick={onNextSection}
            className="flex-1 max-w-xs py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-lg"
          >
            다음 섹션 →
          </button>
        )}
        <button
          onClick={onStop}
          className="flex-1 max-w-xs py-4 rounded-2xl bg-red-700 hover:bg-red-600 text-white text-lg"
        >
          ■ 종료
        </button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  valueClass,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  valueClass: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-zinc-900 rounded-2xl p-4 gap-1">
      <div className="text-zinc-500 text-xs">{label}</div>
      <div className={`text-4xl font-bold ${valueClass}`}>{value}</div>
      <div className="text-zinc-500 text-xs">{unit}</div>
      {sub && <div className={`text-xs ${valueClass}`}>{sub}</div>}
    </div>
  );
}
