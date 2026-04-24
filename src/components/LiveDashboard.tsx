'use client';

import { useEffect, useRef } from 'react';
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
  const transcriptLines = useLiveStore((s) => s.transcriptLines);

  const totalFillers = Object.values(fillerCounts).reduce((a, b) => a + b, 0);
  const lastSpeed = speedHistory.at(-1) ?? null;
  const speedColor =
    lastSpeed == null ? 'text-zinc-500'
    : lastSpeed > 300 ? 'text-red-400'
    : lastSpeed < 200 ? 'text-blue-400'
    : 'text-green-400';

  const currentSection = sections[sectionIndex];

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptLines]);

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">

      {/* 왼쪽: 지표 패널 */}
      <div className="w-72 shrink-0 flex flex-col border-r border-zinc-800 p-6 gap-5">

        {/* 섹션 진행 */}
        {sections.length > 0 && (
          <SectionProgress sections={sections} currentIndex={sectionIndex} elapsed={sectionElapsed} />
        )}

        {/* 현재 섹션 */}
        <div>
          <div className="text-zinc-600 text-xs mb-1">현재 섹션</div>
          <div className="text-2xl font-bold">{currentSection?.name ?? '—'}</div>
        </div>

        {/* 지표 3종 */}
        <div className="flex flex-col gap-3">
          <Metric label="속도" value={lastSpeed != null ? String(Math.round(lastSpeed)) : '—'} unit="음절/분" valueClass={speedColor} sub={lastSpeed != null ? (lastSpeed > 300 ? '빠름' : lastSpeed < 200 ? '느림' : '적정') : ''} />
          <Metric label="필러" value={String(totalFillers)} unit="회" valueClass={totalFillers > 0 ? 'text-orange-400' : 'text-zinc-500'} />
          <Metric label="침묵" value={String(pauseCount)} unit="회" valueClass={pauseCount > 0 ? 'text-yellow-400' : 'text-zinc-500'} />
        </div>

        {/* 필러 상세 */}
        {Object.keys(fillerCounts).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(fillerCounts).map(([word, count]) => (
              <span key={word} className="px-2 py-0.5 rounded bg-orange-900/40 text-orange-300 text-xs">
                &ldquo;{word}&rdquo; {count}
              </span>
            ))}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex flex-col gap-2 mt-auto">
          {sections.length > 1 && sectionIndex < sections.length - 1 && (
            <button onClick={onNextSection} className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm">
              다음 섹션 →
            </button>
          )}
          <button onClick={onStop} className="py-3 rounded-xl bg-red-800 hover:bg-red-700 text-sm">
            ■ 종료
          </button>
        </div>
      </div>

      {/* 오른쪽: 실시간 transcript */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="text-xs text-zinc-600 mb-4 uppercase tracking-widest">실시간 대화</div>

        {transcriptLines.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-700 text-sm">
            말을 시작하면 여기에 표시됩니다
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transcriptLines.map((line) => (
              <p key={line.id} className="text-base leading-relaxed">
                {line.words.map((w, i) => (
                  <span
                    key={i}
                    className={w.isFiller ? 'text-orange-400 font-semibold bg-orange-900/30 rounded px-0.5' : 'text-zinc-200'}
                  >
                    {w.text}{' '}
                  </span>
                ))}
              </p>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, unit, valueClass, sub }: {
  label: string; value: string; unit: string; valueClass: string; sub?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500 text-sm">{label}</span>
      <div className="text-right">
        <span className={`text-xl font-bold ${valueClass}`}>{value}</span>
        <span className="text-zinc-600 text-xs ml-1">{unit}</span>
        {sub && <div className={`text-xs ${valueClass}`}>{sub}</div>}
      </div>
    </div>
  );
}
