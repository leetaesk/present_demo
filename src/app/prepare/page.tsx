'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSettings, saveSettings, type AppSettings } from '@/lib/storage/settings';

export default function PreparePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [newFiller, setNewFiller] = useState('');
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<AppSettings>) => {
    setSaved(false);
    setSettings((s) => ({ ...s, ...patch }));
  };

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

      {/* 섹션 & 대본 */}
      <section className="mb-8">
        <h2 className="font-semibold mb-3">섹션 & 대본</h2>
        <button
          onClick={() => router.push('/prepare/script')}
          className="w-full flex items-center justify-between px-4 py-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <div className="text-left">
            <div className="font-medium">대본 & 섹션 설정</div>
            <div className="text-sm text-zinc-500 mt-0.5">
              {settings.sections.length > 0
                ? `${settings.sections.length}개 섹션 · 총 ${settings.sections.reduce((a, s) => a + s.duration, 0)}초`
                : '섹션 없음 — 눌러서 설정'}
            </div>
          </div>
          <span className="text-zinc-500 text-lg">→</span>
        </button>
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
        <h2 className="font-semibold mb-3">속도 기준 (음절/분)</h2>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-zinc-500">최소 (느림 경고)</span>
            <input
              type="number"
              className="w-20 bg-zinc-800 rounded px-2 py-2 text-center outline-none"
              value={settings.speed.min}
              min={60} max={400} step={10}
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
              min={60} max={500} step={10}
              onChange={(e) => update({ speed: { ...settings.speed, max: Number(e.target.value) } })}
            />
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          적절한 발표 속도는 <span className="text-zinc-300">230~270 음절/분</span>이에요.
          <span className="text-zinc-600"> (출처: 한국어 명료 발화 연구, PMC 2019)</span>
        </p>
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
