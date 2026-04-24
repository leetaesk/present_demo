'use client';

import { useRouter } from 'next/navigation';

const FEATURES = [
  { icon: '🎤', title: '실시간 음성 인식', desc: 'Deepgram이 발표 음성을 실시간으로 분석합니다.' },
  { icon: '🔔', title: '이어폰 효과음 피드백', desc: '필러어·속도·침묵을 소리로 즉시 알려줍니다.' },
  { icon: '⏱', title: '섹션 타이머', desc: '섹션별 제한 시간을 초과하면 경고음이 울립니다.' },
  { icon: '📊', title: '세션 요약', desc: '발표 후 필러·속도·침묵 통계를 확인할 수 있습니다.' },
];

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 gap-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">PRESENT:AI-ON</h1>
        <p className="text-zinc-400">오프라인 발표를 더 잘하게 도와주는 실시간 피드백 앱</p>
      </div>

      <ul className="w-full max-w-sm flex flex-col gap-4">
        {FEATURES.map(({ icon, title, desc }) => (
          <li key={title} className="flex gap-4 items-start bg-zinc-900 rounded-2xl p-4">
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-sm text-zinc-400 mt-0.5">{desc}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => router.push('/prepare')}
          className="py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white text-lg font-bold"
        >
          시작하기 →
        </button>
        <button
          onClick={() => router.push('/live')}
          className="py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
        >
          바로 발표 시작
        </button>
      </div>
    </div>
  );
}
