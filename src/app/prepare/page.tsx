'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSettings, saveSettings, type AppSettings } from '@/lib/storage/settings';
import type { Section } from '@/lib/timer/sectionTimer';

export default function PreparePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [newFiller, setNewFiller] = useState('');
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<AppSettings>) => {
    setSaved(false);
    setSettings((s) => ({ ...s, ...patch }));
  };

  // 섹션
  const addSection = () =>
    update({ sections: [...settings.sections, { name: '', duration: 60, keyword: '' }] });

  const updateSection = (i: number, patch: Partial<Section>) =>
    update({
      sections: settings.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });

  const removeSection = (i: number) =>
    update({ sections: settings.sections.filter((_, idx) => idx !== i) });

  // 필러
  const addFiller = () => {
    const word = newFiller.trim();
    if (!word || settings.fillerWords.includes(word)) return;
    update({ fillerWords: [...settings.fillerWords, word] });
    setNewFiller('');
  };

  const removeFiller = (word: string) =>
    update({ fillerWords: settings.fillerWords.filter((w) => w !== word) });

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold">발표 준비</h1>
        <button onClick={() => router.push('/')} className="text-zinc-500 text-sm">← 홈</button>
      </div>

      {/* 섹션 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">섹션</h2>
          <button onClick={addSection} className="text-sm px-3 py-1 bg-zinc-800 rounded hover:bg-zinc-700">
            + 추가
          </button>
        </div>
        {settings.sections.length === 0 ? (
          <p className="text-zinc-600 text-sm">섹션 없음 — 섹션 타이머를 사용하지 않습니다.</p>
        ) : (
          <ul className="space-y-3">
            {settings.sections.map((s, i) => (
              <li key={i} className="bg-zinc-900 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-zinc-800 rounded px-2 py-1 text-sm outline-none"
                    placeholder="섹션 이름"
                    value={s.name}
                    onChange={(e) => updateSection(i, { name: e.target.value })}
                  />
                  <input
                    type="number"
                    className="w-20 bg-zinc-800 rounded px-2 py-1 text-sm text-center outline-none"
                    placeholder="초"
                    value={s.duration}
                    min={5}
                    onChange={(e) => updateSection(i, { duration: Number(e.target.value) })}
                  />
                  <button onClick={() => removeSection(i)} className="text-zinc-500 hover:text-red-400 px-1">✕</button>
                </div>
                <input
                  className="bg-zinc-800 rounded px-2 py-1 text-sm outline-none text-zinc-400"
                  placeholder="키워드 (3초 침묵 시 TTS로 읽어줌, 선택)"
                  value={s.keyword ?? ''}
                  onChange={(e) => updateSection(i, { keyword: e.target.value })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 필러 단어 */}
      <section className="mb-8">
        <h2 className="font-semibold mb-3">금지어 (필러)</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {settings.fillerWords.map((w) => (
            <span key={w} className="flex items-center gap-1 px-2 py-1 bg-orange-900/40 text-orange-300 rounded text-sm">
              {w}
              <button onClick={() => removeFiller(w)} className="text-orange-500 hover:text-red-400">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-zinc-800 rounded px-3 py-2 text-sm outline-none"
            placeholder="단어 입력 후 추가"
            value={newFiller}
            onChange={(e) => setNewFiller(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFiller()}
          />
          <button onClick={addFiller} className="px-3 py-2 bg-zinc-700 rounded text-sm hover:bg-zinc-600">추가</button>
        </div>
      </section>

      {/* 속도 */}
      <section className="mb-8">
        <h2 className="font-semibold mb-3">속도 기준 (음절/초)</h2>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-zinc-500">최소 (느림 경고)</span>
            <input
              type="number"
              className="w-20 bg-zinc-800 rounded px-2 py-2 text-center outline-none"
              value={settings.speed.min}
              min={1} max={10} step={0.5}
              onChange={(e) => update({ speed: { ...settings.speed, min: Number(e.target.value) } })}
            />
          </div>
          <span className="text-zinc-600">~</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-zinc-500">최대 (빠름 경고)</span>
            <input
              type="number"
              className="w-20 bg-zinc-800 rounded px-2 py-2 text-center outline-none"
              value={settings.speed.max}
              min={1} max={15} step={0.5}
              onChange={(e) => update({ speed: { ...settings.speed, max: Number(e.target.value) } })}
            />
          </div>
        </div>
      </section>

      {/* 침묵 */}
      <section className="mb-10">
        <h2 className="font-semibold mb-3">침묵 감지 (초)</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            className="w-20 bg-zinc-800 rounded px-2 py-2 text-center outline-none"
            value={settings.pauseDuration}
            min={1} max={10}
            onChange={(e) => update({ pauseDuration: Number(e.target.value) })}
          />
          <span className="text-zinc-500 text-sm">초 이상 침묵 시 키워드 TTS</span>
        </div>
      </section>

      {/* 버튼 */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleSave}
          className="py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-semibold"
        >
          {saved ? '✓ 저장됨' : '저장'}
        </button>
        <button
          onClick={() => { handleSave(); router.push('/live'); }}
          className="py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg"
        >
          발표 시작 →
        </button>
      </div>
    </div>
  );
}
