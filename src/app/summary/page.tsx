'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSessions, deleteSession, type SessionRecord } from '@/lib/storage/sessions';
import { BarChart } from '@/components/SummaryChart';

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

  const fillerBarData = selected
    ? Object.entries(selected.fillerCounts).map(([word, count]) => ({
        label: word,
        value: count,
        max: Math.max(...Object.values(selected.fillerCounts), 1),
        color: 'bg-orange-500',
      }))
    : [];

  const avgSpeed =
    selected && selected.speedHistory.length > 0
      ? selected.speedHistory.reduce((a, b) => a + b, 0) / selected.speedHistory.length
      : null;

  const totalFillers = selected
    ? Object.values(selected.fillerCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold">세션 요약</h1>
        <button onClick={() => router.push('/')} className="text-zinc-500 text-sm">← 홈</button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-zinc-600 text-center mt-20">
          <p>저장된 세션이 없습니다.</p>
          <button
            onClick={() => router.push('/live')}
            className="mt-6 px-6 py-3 bg-green-700 rounded-xl hover:bg-green-600"
          >
            발표 시작하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 세션 목록 */}
          <section>
            <h2 className="text-sm text-zinc-500 mb-2">세션 선택</h2>
            <ul className="flex flex-col gap-2">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                    selected?.id === s.id ? 'bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'
                  }`}
                >
                  <div>
                    <div className="text-sm">{new Date(s.timestamp).toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">{s.duration}초 · 필러 {Object.values(s.fillerCounts).reduce((a, b) => a + b, 0)}회</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); s.id != null && handleDelete(s.id); }}
                    className="text-zinc-600 hover:text-red-400 text-sm px-2"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* 선택된 세션 상세 */}
          {selected && (
            <>
              <section className="grid grid-cols-3 gap-3">
                <StatCard label="발표 시간" value={`${selected.duration}s`} />
                <StatCard
                  label="평균 속도"
                  value={avgSpeed != null ? `${avgSpeed.toFixed(1)}` : '—'}
                  unit="음절/초"
                  color={avgSpeed != null ? (avgSpeed > 6 ? 'text-red-400' : avgSpeed < 4 ? 'text-blue-400' : 'text-green-400') : ''}
                />
                <StatCard label="침묵" value={`${selected.pauseCount}회`} />
              </section>

              <section>
                <h2 className="text-sm text-zinc-500 mb-3">필러 분포 ({totalFillers}회)</h2>
                {fillerBarData.length === 0 ? (
                  <p className="text-zinc-600 text-sm">필러 없음 👍</p>
                ) : (
                  <BarChart data={fillerBarData} />
                )}
              </section>

              {selected.speedHistory.length > 0 && (
                <section>
                  <h2 className="text-sm text-zinc-500 mb-3">속도 분포</h2>
                  <BarChart
                    data={[
                      { label: '느림 (<4)', value: selected.speedHistory.filter((s) => s < 4).length, max: selected.speedHistory.length, color: 'bg-blue-500' },
                      { label: '적정 (4~6)', value: selected.speedHistory.filter((s) => s >= 4 && s <= 6).length, max: selected.speedHistory.length, color: 'bg-green-500' },
                      { label: '빠름 (>6)', value: selected.speedHistory.filter((s) => s > 6).length, max: selected.speedHistory.length, color: 'bg-red-500' },
                    ]}
                  />
                </section>
              )}

              {selected.sections.length > 0 && (
                <section>
                  <h2 className="text-sm text-zinc-500 mb-2">섹션</h2>
                  <ul className="flex flex-col gap-1">
                    {selected.sections.map((s, i) => (
                      <li key={i} className="flex justify-between text-sm px-3 py-2 bg-zinc-900 rounded-lg">
                        <span>{s.name || `섹션 ${i + 1}`}</span>
                        <span className="text-zinc-500">{s.duration}초</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          <button
            onClick={() => router.push('/live')}
            className="py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold"
          >
            새 발표 시작 →
          </button>
        </div>
      )}
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
