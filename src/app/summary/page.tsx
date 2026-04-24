'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSessions, deleteSession, type SessionRecord } from '@/lib/storage/sessions';
import { BarChart } from '@/components/SummaryChart';

type Grade = 'A' | 'B' | 'C' | 'D';

interface ScoreResult {
  score: number;
  grade: Grade;
  speedScore: number;
  fillerScore: number;
  pauseScore: number;
}

function calcScore(s: SessionRecord): ScoreResult {
  const speedScore = s.speedHistory.length > 0
    ? (s.speedHistory.filter((v) => v >= 200 && v <= 300).length / s.speedHistory.length) * 40
    : 20;

  const totalFillers = Object.values(s.fillerCounts).reduce((a, b) => a + b, 0);
  const durationMin = Math.max(s.duration / 60, 0.1);
  const fillerScore = Math.max(0, 40 - (totalFillers / durationMin) * 10);

  const pauseScore = Math.max(0, 20 - s.pauseCount * 5);

  const score = Math.round(speedScore + fillerScore + pauseScore);
  const grade: Grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';

  return { score, grade, speedScore: Math.round(speedScore), fillerScore: Math.round(fillerScore), pauseScore: Math.round(pauseScore) };
}

const GRADE_STYLE: Record<Grade, { text: string; bg: string; border: string; label: string }> = {
  A: { text: 'text-green-400',  bg: 'bg-green-900/30',  border: 'border-green-800', label: '훌륭해요!' },
  B: { text: 'text-blue-400',   bg: 'bg-blue-900/30',   border: 'border-blue-800',  label: '잘 했어요' },
  C: { text: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-800',label: '조금 더 연습해요' },
  D: { text: 'text-red-400',    bg: 'bg-red-900/30',    border: 'border-red-800',   label: '다시 도전해봐요' },
};

export default function SummaryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selected, setSelected] = useState<SessionRecord | null>(null);

  useEffect(() => {
    loadSessions().then((all) => {
      const sorted = [...all].sort((a, b) => b.timestamp - a.timestamp);
      setSessions(sorted);
      if (sorted.length > 0) setSelected(sorted[0]);
    });
  }, []);

  const handleDelete = async (id: number) => {
    await deleteSession(id);
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (selected?.id === id) setSelected(updated[0] ?? null);
  };

  const selectedScore = selected ? calcScore(selected) : null;
  const gradeStyle = selectedScore ? GRADE_STYLE[selectedScore.grade] : null;

  const avgSpeed = selected && selected.speedHistory.length > 0
    ? selected.speedHistory.reduce((a, b) => a + b, 0) / selected.speedHistory.length
    : null;

  const totalFillers = selected
    ? Object.values(selected.fillerCounts).reduce((a, b) => a + b, 0)
    : 0;

  const fillerBarData = selected
    ? Object.entries(selected.fillerCounts).map(([word, count]) => ({
        label: word,
        value: count,
        max: Math.max(...Object.values(selected.fillerCounts), 1),
        color: 'bg-orange-500',
      }))
    : [];

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">발표 피드백</h1>
        <button onClick={() => router.push('/')} className="text-zinc-500 text-sm">← 홈</button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-zinc-600 text-center mt-20 flex flex-col items-center gap-4">
          <p>저장된 세션이 없습니다.</p>
          <button onClick={() => router.push('/live')} className="px-6 py-3 bg-green-700 rounded-xl hover:bg-green-600 text-white">
            발표 시작하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* 세션 목록 — 카드형 */}
          <section>
            <h2 className="text-xs text-zinc-600 uppercase tracking-widest mb-3">세션 기록</h2>
            <ul className="flex flex-col gap-2">
              {sessions.map((s) => {
                const { score, grade } = calcScore(s);
                const gs = GRADE_STYLE[grade];
                const isSelected = selected?.id === s.id;
                const fillers = Object.values(s.fillerCounts).reduce((a, b) => a + b, 0);
                return (
                  <li
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer border transition-colors ${
                      isSelected ? `${gs.bg} ${gs.border}` : 'bg-zinc-900 border-transparent hover:bg-zinc-800'
                    }`}
                  >
                    {/* 등급 */}
                    <div className={`text-3xl font-black w-10 text-center shrink-0 ${gs.text}`}>{grade}</div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{new Date(s.timestamp).toLocaleString()}</div>
                      <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                        <span>{s.duration}초</span>
                        <span className={fillers > 0 ? 'text-orange-400' : ''}>필러 {fillers}회</span>
                        {s.pauseCount > 0 && <span className="text-yellow-500">침묵 {s.pauseCount}회</span>}
                      </div>
                    </div>

                    {/* 점수 */}
                    <div className="text-right shrink-0">
                      <div className={`text-xl font-bold ${gs.text}`}>{score}</div>
                      <div className="text-xs text-zinc-600">/ 100</div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); s.id != null && handleDelete(s.id); }}
                      className="text-zinc-700 hover:text-red-400 text-xs px-1 shrink-0"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 선택 세션 상세 */}
          {selected && selectedScore && gradeStyle && (
            <>
              {/* 점수 헤더 */}
              <section className={`rounded-2xl border p-5 ${gradeStyle.bg} ${gradeStyle.border}`}>
                <div className="flex items-center gap-5">
                  <div className={`text-7xl font-black ${gradeStyle.text}`}>{selectedScore.grade}</div>
                  <div>
                    <div className={`text-2xl font-bold ${gradeStyle.text}`}>{selectedScore.score}점</div>
                    <div className="text-sm text-zinc-400 mt-0.5">{gradeStyle.label}</div>
                  </div>
                </div>
                {/* 점수 분해 */}
                <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                  <ScorePill label="속도" value={selectedScore.speedScore} max={40} color={gradeStyle.text} />
                  <ScorePill label="필러" value={selectedScore.fillerScore} max={40} color={gradeStyle.text} />
                  <ScorePill label="침묵" value={selectedScore.pauseScore} max={20} color={gradeStyle.text} />
                </div>
              </section>

              {/* 세부 지표 */}
              <section className="grid grid-cols-3 gap-3">
                <StatCard label="발표 시간" value={`${selected.duration}초`} />
                <StatCard
                  label="평균 속도"
                  value={avgSpeed != null ? String(Math.round(avgSpeed)) : '—'}
                  unit="음절/분"
                  color={avgSpeed != null ? (avgSpeed > 300 ? 'text-red-400' : avgSpeed < 200 ? 'text-blue-400' : 'text-green-400') : ''}
                />
                <StatCard label="장침묵" value={`${selected.pauseCount}회`} />
              </section>

              {/* 필러 분포 */}
              <section>
                <h2 className="text-sm text-zinc-500 mb-3">필러 분포 ({totalFillers}회)</h2>
                {fillerBarData.length === 0
                  ? <p className="text-zinc-600 text-sm">필러 없음 👍</p>
                  : <BarChart data={fillerBarData} />
                }
              </section>

              {/* 속도 분포 */}
              {selected.speedHistory.length > 0 && (
                <section>
                  <h2 className="text-sm text-zinc-500 mb-3">속도 분포</h2>
                  <BarChart data={[
                    { label: '느림 (<200)', value: selected.speedHistory.filter((v) => v < 200).length, max: selected.speedHistory.length, color: 'bg-blue-500' },
                    { label: '적정 (200~300)', value: selected.speedHistory.filter((v) => v >= 200 && v <= 300).length, max: selected.speedHistory.length, color: 'bg-green-500' },
                    { label: '빠름 (>300)', value: selected.speedHistory.filter((v) => v > 300).length, max: selected.speedHistory.length, color: 'bg-red-500' },
                  ]} />
                </section>
              )}
            </>
          )}

          <button onClick={() => router.push('/live')} className="py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold">
            새 발표 시작 →
          </button>
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="bg-black/30 rounded-xl p-2">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}<span className="text-xs text-zinc-600 font-normal">/{max}</span></div>
    </div>
  );
}

function StatCard({ label, value, unit, color = 'text-white' }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-3 flex flex-col items-center gap-1">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {unit && <div className="text-xs text-zinc-600">{unit}</div>}
    </div>
  );
}
