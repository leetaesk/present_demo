'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSettings, saveSettings } from '@/lib/storage/settings';
import type { Section } from '@/lib/timer/sectionTimer';

const DEMO_SECTIONS: Section[] = [
  {
    name: '도입',
    duration: 60,
    keyword: '문제 정의',
    script:
      '안녕하세요. 오늘은 AI 기반 발표 피드백 시스템 PRESENT:AI-ON을 소개하겠습니다. 발표를 잘 하고 싶지만 어디서부터 고쳐야 할지 모르는 분들을 위해 만들었습니다.',
  },
  {
    name: '문제 정의',
    duration: 90,
    keyword: '해결책',
    script:
      '많은 발표자들이 "어", "음" 같은 필러어를 자신도 모르게 사용하고, 말 속도가 너무 빠르거나 느립니다. 기존 피드백은 발표가 끝난 후에야 받을 수 있어 실시간 교정이 어렵습니다.',
  },
  {
    name: '해결책',
    duration: 90,
    keyword: '데모',
    script:
      '이어폰에서 나오는 효과음으로 필러어 감지, 속도 이탈, 3초 이상 침묵을 즉시 알려줍니다. 화면을 보지 않아도 소리만으로 자신의 발표 상태를 파악할 수 있습니다.',
  },
  {
    name: '결론',
    duration: 60,
    keyword: '',
    script:
      'PRESENT:AI-ON은 발표 준비부터 실전까지 실시간 피드백을 제공합니다. 지금 바로 체험해 보세요. 감사합니다.',
  },
];

export default function ScriptPage() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(() => loadSettings().sections);

  const addSection = () =>
    setSections((s) => [...s, { name: '', duration: 60, keyword: '', script: '' }]);

  const update = (i: number, patch: Partial<Section>) =>
    setSections((s) => s.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)));

  const remove = (i: number) =>
    setSections((s) => s.filter((_, idx) => idx !== i));

  const loadDemo = () => setSections(DEMO_SECTIONS);

  const handleSave = () => {
    const settings = loadSettings();
    saveSettings({ ...settings, sections });
    router.push('/prepare');
  };

  const totalDuration = sections.reduce((a, s) => a + s.duration, 0);

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-lg mx-auto pb-32">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">대본 & 섹션</h1>
        <button onClick={() => router.push('/prepare')} className="text-zinc-500 text-sm">← 준비</button>
      </div>

      {/* 체험 버튼 */}
      <button
        onClick={loadDemo}
        className="w-full mb-6 py-3 rounded-xl border border-zinc-600 text-zinc-300 hover:bg-zinc-800 text-sm transition-colors"
      >
        🎯 목업 대본 불러오기 (체험)
      </button>

      {/* 요약 */}
      {sections.length > 0 && (
        <div className="mb-4 text-xs text-zinc-500">
          총 {sections.length}개 섹션 · {totalDuration}초 ({Math.floor(totalDuration / 60)}분 {totalDuration % 60}초)
        </div>
      )}

      {/* 섹션 목록 */}
      <div className="flex flex-col gap-4">
        {sections.length === 0 && (
          <p className="text-zinc-600 text-sm text-center py-8">
            섹션이 없습니다. 추가하거나 목업을 불러오세요.
          </p>
        )}

        {sections.map((s, i) => (
          <div key={i} className="bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
            {/* 섹션 번호 + 삭제 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">섹션 {i + 1}</span>
              <button onClick={() => remove(i)} className="text-zinc-600 hover:text-red-400 text-sm">삭제</button>
            </div>

            {/* 이름 + 시간 */}
            <div className="flex gap-2">
              <input
                className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none placeholder:text-zinc-600"
                placeholder="섹션 이름"
                value={s.name}
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <div className="flex items-center gap-1 bg-zinc-800 rounded-lg px-3">
                <input
                  type="number"
                  className="w-14 bg-transparent text-sm text-center outline-none"
                  placeholder="60"
                  value={s.duration}
                  min={5}
                  onChange={(e) => update(i, { duration: Number(e.target.value) })}
                />
                <span className="text-zinc-500 text-xs">초</span>
              </div>
            </div>

            {/* 다음 섹션 키워드 */}
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">
                다음 섹션 키워드 <span className="text-zinc-600">(3초 침묵 시 이어폰으로 읽어줌)</span>
              </label>
              <input
                className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none placeholder:text-zinc-600 text-blue-300"
                placeholder="예: 해결책, 결론 (없으면 비워두세요)"
                value={s.keyword ?? ''}
                onChange={(e) => update(i, { keyword: e.target.value })}
              />
            </div>

            {/* 대본 */}
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">대본</label>
              <textarea
                className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none resize-none placeholder:text-zinc-600 leading-relaxed"
                rows={4}
                placeholder="이 섹션에서 할 말을 입력하세요..."
                value={s.script ?? ''}
                onChange={(e) => update(i, { script: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-zinc-800 flex gap-3 max-w-lg mx-auto">
        <button
          onClick={addSection}
          className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm"
        >
          + 섹션 추가
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 font-semibold"
        >
          저장
        </button>
      </div>
    </div>
  );
}
