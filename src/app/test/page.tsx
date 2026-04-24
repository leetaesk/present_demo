'use client';

import { useRef, useState } from 'react';
import { startAudioPipeline, type AudioPipeline } from '@/lib/audio/worklet';
import {
  DeepgramClient,
  type DeepgramWord,
} from '@/lib/stt/deepgramClient';

interface FinalEntry {
  text: string;
  words: DeepgramWord[];
}

export default function TestPage() {
  const [running, setRunning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const [interim, setInterim] = useState('');
  const [finals, setFinals] = useState<FinalEntry[]>([]);
  const [vadLog, setVadLog] = useState<string[]>([]);
  const pipelineRef = useRef<AudioPipeline | null>(null);
  const clientRef = useRef<DeepgramClient | null>(null);

  const stamp = () => {
    const d = new Date();
    return `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const start = async () => {
    try {
      const client = new DeepgramClient({
        onOpen: () => {
          setConnected(true);
          console.log('[Deepgram] connected');
        },
        onTranscript: (t) => {
          if (t.is_final) {
            setFinals((arr) => [...arr.slice(-5), { text: t.transcript, words: t.words }]);
            setInterim('');
            console.log(
              `[Deepgram] transcript (final): "${t.transcript}"`,
              t.words,
            );
          } else {
            setInterim(t.transcript);
          }
        },
        onSpeechStart: () => {
          setVadLog((l) => [...l.slice(-5), `${stamp()} SpeechStarted`]);
          console.log('[Deepgram] SpeechStarted');
        },
        onUtteranceEnd: () => {
          setVadLog((l) => [...l.slice(-5), `${stamp()} UtteranceEnd`]);
          console.log('[Deepgram] UtteranceEnd');
        },
        onError: (err) => {
          console.error('[Deepgram] error', err);
        },
        onClose: (ev) => {
          setConnected(false);
          console.log('[Deepgram] closed', ev.code, ev.reason);
        },
      });
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
      alert(`start failed: ${String(err)}`);
      clientRef.current?.close();
      clientRef.current = null;
    }
  };

  const stop = () => {
    pipelineRef.current?.stop();
    pipelineRef.current = null;
    clientRef.current?.close();
    clientRef.current = null;
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <h1 className="text-2xl mb-6">PRESENT:AI-ON — Part B 검증</h1>

      <div className="mb-6">
        {running ? (
          <button onClick={stop} className="px-4 py-2 bg-red-600 rounded hover:bg-red-500">
            ■ 중단
          </button>
        ) : (
          <button onClick={start} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500">
            ▶ 시작 (마이크 + Deepgram)
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm mb-6">
        <div>
          <div className="text-zinc-500 text-xs">마이크</div>
          <div>{running ? '캡처 중' : '정지'}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs">Deepgram</div>
          <div>{connected ? '연결됨' : '끊김'}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs">chunk 수신</div>
          <div>{chunkCount}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-zinc-500 mb-1">interim (중간)</div>
        <div className="min-h-[1.5rem] text-yellow-300">{interim || '—'}</div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-zinc-500 mb-1">final (최근 6)</div>
        <ul className="space-y-1 text-green-300">
          {finals.length === 0 ? (
            <li>—</li>
          ) : (
            finals.map((f, i) => (
              <li key={i}>
                <span>• {f.text}</span>
                <span className="text-zinc-500 text-xs ml-2">
                  [{f.words.map((w) => w.word).join(' / ')}]
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mb-4">
        <div className="text-xs text-zinc-500 mb-1">VAD 이벤트 (최근 6)</div>
        <ul className="space-y-1 text-cyan-300 text-xs">
          {vadLog.length === 0 ? <li>—</li> : vadLog.map((v, i) => <li key={i}>{v}</li>)}
        </ul>
      </div>

      <p className="mt-8 text-xs text-zinc-500">
        콘솔에서 word 배열 내용 확인. 한국어 &quot;어/음&quot; 발화 시 word 객체에
        filler 관련 플래그가 있는지 검사.
      </p>
    </div>
  );
}
