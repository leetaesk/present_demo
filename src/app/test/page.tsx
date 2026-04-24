'use client';

import { useRef, useState } from 'react';
import { startAudioPipeline, type AudioPipeline } from '@/lib/audio/worklet';
import { resumeAudioContext } from '@/lib/audio/context';
import { soundCue, type CueType } from '@/lib/audio/soundCue';
import { DeepgramClient, type DeepgramWord } from '@/lib/stt/deepgramClient';
import { FillerDetector } from '@/lib/analyzer/fillerDetector';
import { SpeedCalculator } from '@/lib/analyzer/speedCalculator';
import { PauseDetector } from '@/lib/analyzer/pauseDetector';
import { useLiveStore } from '@/store/liveStore';

interface FinalEntry {
  text: string;
  words: DeepgramWord[];
  speed: number | null;
}

const CUE_BUTTONS: { label: string; type: CueType; desc: string }[] = [
  { label: 'Filler', type: 'filler', desc: '880Hz 80ms' },
  { label: '빠름', type: 'fast', desc: '440→880Hz 150ms' },
  { label: '느림', type: 'slow', desc: '880→440Hz 150ms' },
  { label: '섹션초과', type: 'section', desc: '220Hz 500ms' },
  { label: '3초공백', type: 'pause', desc: '220Hz×2' },
];

export default function TestPage() {
  const [running, setRunning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const [interim, setInterim] = useState('');
  const [finals, setFinals] = useState<FinalEntry[]>([]);
  const [vadLog, setVadLog] = useState<string[]>([]);

  const fillerCounts = useLiveStore((s) => s.fillerCounts);
  const speedHistory = useLiveStore((s) => s.speedHistory);
  const pauseCount = useLiveStore((s) => s.pauseCount);
  const reset = useLiveStore((s) => s.reset);

  const pipelineRef = useRef<AudioPipeline | null>(null);
  const clientRef = useRef<DeepgramClient | null>(null);
  const fillerRef = useRef(new FillerDetector());
  const speedRef = useRef(new SpeedCalculator());
  const pauseRef = useRef(new PauseDetector());

  const stamp = () => {
    const d = new Date();
    return `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const lastSpeed = speedHistory.at(-1);
  const avgSpeed =
    speedHistory.length > 0
      ? speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length
      : null;

  const start = async () => {
    await resumeAudioContext();
    reset();

    const client = new DeepgramClient({
      onOpen: () => setConnected(true),
      onTranscript: (t) => {
        if (t.is_final) {
          fillerRef.current.check(t.words);
          speedRef.current.update(t.words);

          const dur =
            t.words.length >= 2
              ? t.words.at(-1)!.end - t.words[0].start
              : null;
          const syl =
            t.words.length >= 2
              ? t.words.reduce(
                  (acc, w) =>
                    acc + [...w.word].filter((c) => /[가-힣]/.test(c)).length,
                  0,
                )
              : null;
          const speed = dur && syl && dur > 0 ? syl / dur : null;

          setFinals((arr) => [
            ...arr.slice(-5),
            { text: t.transcript, words: t.words, speed },
          ]);
          setInterim('');
        } else {
          setInterim(t.transcript);
        }
      },
      onSpeechStart: () => {
        pauseRef.current.onStart();
        setVadLog((l) => [...l.slice(-5), `${stamp()} SpeechStarted`]);
      },
      onUtteranceEnd: () => {
        pauseRef.current.onEnd();
        setVadLog((l) => [...l.slice(-5), `${stamp()} UtteranceEnd`]);
      },
      onError: (err) => console.error('[Deepgram] error', err),
      onClose: (ev) => {
        setConnected(false);
        console.log('[Deepgram] closed', ev.code, ev.reason);
      },
    });

    try {
      await client.connect();
      clientRef.current = client;

      const pipeline = await startAudioPipeline((buffer) => {
        setChunkCount((n) => n + 1);
        client.send(buffer);
      });
      pipelineRef.current = pipeline;
      setRunning(true);
    } catch (err) {
      console.error('[test] start failed', err);
      client.close();
    }
  };

  const stop = () => {
    pipelineRef.current?.stop();
    pipelineRef.current = null;
    clientRef.current?.close();
    clientRef.current = null;
    pauseRef.current.destroy();
    setRunning(false);
    setConnected(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono text-sm">
      <h1 className="text-xl mb-6">PRESENT:AI-ON — TASK 03~06 검증</h1>

      {/* 컨트롤 */}
      <div className="flex gap-3 mb-6">
        {running ? (
          <button onClick={stop} className="px-4 py-2 bg-red-600 rounded hover:bg-red-500">
            ■ 중단
          </button>
        ) : (
          <button onClick={start} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500">
            ▶ 시작
          </button>
        )}
        <button onClick={reset} className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600">
          초기화
        </button>
      </div>

      {/* 상태 */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-xs">
        <Stat label="마이크" value={running ? '캡처 중' : '정지'} />
        <Stat label="Deepgram" value={connected ? '연결됨' : '끊김'} />
        <Stat label="chunk" value={String(chunkCount)} />
        <Stat label="일시정지" value={`${pauseCount}회`} />
      </div>

      {/* 효과음 수동 테스트 */}
      <section className="mb-6">
        <div className="text-xs text-zinc-400 mb-2">효과음 수동 테스트 (AudioContext 활성화 필요)</div>
        <div className="flex flex-wrap gap-2">
          {CUE_BUTTONS.map(({ label, type, desc }) => (
            <button
              key={type}
              onClick={() => soundCue.play(type)}
              className="px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded hover:bg-zinc-700"
            >
              {label}
              <span className="ml-1 text-zinc-500 text-xs">{desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filler 카운트 */}
      <section className="mb-6">
        <div className="text-xs text-zinc-400 mb-2">Filler 탐지</div>
        {Object.keys(fillerCounts).length === 0 ? (
          <div className="text-zinc-600">없음</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {Object.entries(fillerCounts).map(([word, count]) => (
              <span key={word} className="px-2 py-1 bg-orange-900/50 rounded text-orange-300">
                &ldquo;{word}&rdquo; × {count}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 속도 */}
      <section className="mb-6">
        <div className="text-xs text-zinc-400 mb-2">속도 (음절/초, 기준 4~6)</div>
        <div className="flex gap-6">
          <Stat label="최근" value={lastSpeed != null ? lastSpeed.toFixed(1) : '—'} />
          <Stat label="평균" value={avgSpeed != null ? avgSpeed.toFixed(1) : '—'} />
          <Stat label="샘플" value={String(speedHistory.length)} />
        </div>
      </section>

      {/* transcript */}
      <section className="mb-4">
        <div className="text-xs text-zinc-400 mb-1">interim</div>
        <div className="min-h-[1.5rem] text-yellow-300">{interim || '—'}</div>
      </section>

      <section className="mb-4">
        <div className="text-xs text-zinc-400 mb-1">final (최근 6)</div>
        <ul className="space-y-1 text-green-300">
          {finals.length === 0 ? (
            <li>—</li>
          ) : (
            finals.map((f, i) => (
              <li key={i}>
                <span>{f.text}</span>
                <span className="text-zinc-500 ml-2">
                  [{f.words.map((w) => w.word).join(' / ')}]
                </span>
                {f.speed != null && (
                  <span className={`ml-2 ${f.speed > 6 ? 'text-red-400' : f.speed < 4 ? 'text-blue-400' : 'text-zinc-400'}`}>
                    {f.speed.toFixed(1)} 음절/초
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      {/* VAD */}
      <section>
        <div className="text-xs text-zinc-400 mb-1">VAD 이벤트 (최근 6)</div>
        <ul className="space-y-1 text-cyan-300 text-xs">
          {vadLog.length === 0 ? <li>—</li> : vadLog.map((v, i) => <li key={i}>{v}</li>)}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-zinc-500 text-xs">{label}</div>
      <div>{value}</div>
    </div>
  );
}
